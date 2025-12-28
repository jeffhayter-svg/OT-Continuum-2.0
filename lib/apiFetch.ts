import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

interface ApiFetchOptions extends RequestInit {
  body?: any;
}

/**
 * Centralized API helper for calling Supabase Edge Functions
 * 
 * Requirements:
 * - Always attaches apikey header (anon public key)
 * - Always attaches Authorization header with user access_token
 * - Throws error if no user session exists
 * - Logs debug info before sending
 * 
 * @param endpoint - The endpoint path (e.g., '/tenant/create')
 * @param options - Fetch options (method, body, etc.)
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No active user session. Please sign in.');
  }

  const accessToken = session.access_token;
  
  if (!accessToken) {
    throw new Error('No access token found in session.');
  }

  // Construct full URL
  const baseUrl = `${SUPABASE_URL}/functions/v1/server`;
  const url = `${baseUrl}${endpoint}`;

  // Prepare headers
  const headers = new Headers(options.headers);
  headers.set('apikey', SUPABASE_ANON_KEY);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  // Debug logging
  console.log('[apiFetch] Request:', {
    url,
    method: options.method || 'GET',
    apikey_present: !!SUPABASE_ANON_KEY,
    access_token_present: !!accessToken,
    access_token_length: accessToken.length,
  });

  // Prepare body
  const body = options.body ? JSON.stringify(options.body) : undefined;

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  // Handle non-OK responses
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorText;
    } catch {
      errorMessage = errorText;
    }
    
    console.error('[apiFetch] Error response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
    });
    
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  // Parse and return response
  const data = await response.json();
  
  console.log('[apiFetch] Success:', {
    url,
    status: response.status,
  });
  
  return data as T;
}