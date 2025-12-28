// ============================================================================
// Edge Function Fetch Wrapper
// Single function for all Edge Function calls with proper JWT handling
// Works in both normal browser and Figma iframe contexts
// ============================================================================

import { getAccessToken } from './authSession';

// Support both Vite and Next.js environment variables
const SUPABASE_URL = 
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : import.meta.env?.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY = 
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Fallback to supabase-client if env vars not available
let supabaseUrl = SUPABASE_URL;
let publicAnonKey = SUPABASE_ANON_KEY;

// If env vars not available, try importing from supabase-client
if (!supabaseUrl || !publicAnonKey) {
  try {
    const { supabaseUrl: url, publicAnonKey: key } = require('./supabase-client');
    supabaseUrl = supabaseUrl || url;
    publicAnonKey = publicAnonKey || key;
  } catch {
    // Will be caught below
  }
}

if (!supabaseUrl || !publicAnonKey) {
  console.error('[edgeFetch] Missing Supabase configuration!');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Custom error for missing session
 */
export class NoSessionError extends Error {
  constructor() {
    super('NO_SESSION: User is not authenticated');
    this.name = 'NoSessionError';
  }
}

/**
 * Fetch wrapper for Supabase Edge Functions
 * 
 * This is the ONLY function that should be used to call Edge Functions.
 * It automatically handles:
 * - JWT access token retrieval from session (not localStorage)
 * - Required headers (Authorization, apikey, Content-Type)
 * - Error handling for missing session
 * - Works in Figma iframe where localStorage may be empty
 * 
 * @param path - Edge Function path (e.g., "ai_gateway", "signals", etc.)
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Response from Edge Function
 * @throws NoSessionError if user is not authenticated
 * @throws Error for other fetch errors
 * 
 * @example
 * // Call ai_gateway
 * const response = await edgeFetch('ai_gateway', {
 *   method: 'POST',
 *   body: JSON.stringify({ tenant_id: '...', mode: 'chat', ... })
 * });
 * const data = await response.json();
 * 
 * @example
 * // Call signals endpoint
 * const response = await edgeFetch('signals/123');
 * const data = await response.json();
 */
export async function edgeFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  // 1. Get access token from session
  const accessToken = await getAccessToken();
  
  // 2. Throw clear error if no session
  if (!accessToken) {
    console.error('[edgeFetch] NO_SESSION - User is not authenticated');
    throw new NoSessionError();
  }
  
  // 3. Build URL
  const url = `${supabaseUrl}/functions/v1/${path}`;
  
  // 4. Build headers
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'apikey': publicAnonKey,
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`[edgeFetch] ${options?.method || 'GET'} ${path}`);
    console.log('URL:', url);
    console.log('JWT prefix:', accessToken.slice(0, 12) + '...');
    console.log('Headers:', {
      Authorization: `Bearer ${accessToken.slice(0, 12)}...`,
      apikey: publicAnonKey.slice(0, 12) + '...',
      'Content-Type': headers['Content-Type'],
    });
    if (options?.body) {
      try {
        console.log('Body:', JSON.parse(options.body as string));
      } catch {
        console.log('Body:', options.body);
      }
    }
    console.groupEnd();
  }
  
  // 5. Make request
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[edgeFetch] Response ${response.status}`);
      console.log('Status:', response.status, response.statusText);
      console.log('OK:', response.ok);
      console.groupEnd();
    }
    
    return response;
  } catch (err) {
    console.error('[edgeFetch] Fetch error:', err);
    throw err;
  }
}

/**
 * Convenience wrapper for JSON responses
 * 
 * @param path - Edge Function path
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws NoSessionError if user is not authenticated
 * @throws Error if response is not ok or JSON parsing fails
 */
export async function edgeFetchJson<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await edgeFetch(path, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    
    console.error('[edgeFetchJson] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      path,
    });
    
    throw new Error(errorData.error?.message || errorData.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

/**
 * Check if error is a NoSessionError
 * 
 * @param error - Error to check
 * @returns True if error is NoSessionError
 */
export function isNoSessionError(error: any): error is NoSessionError {
  return error instanceof NoSessionError || error?.name === 'NoSessionError';
}