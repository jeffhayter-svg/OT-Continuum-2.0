// ============================================================================
// Auth Session Utility - Single Source of Truth
// Handles JWT access token retrieval from Supabase session
// Works in both normal browser and Figma iframe contexts
// ============================================================================

import { supabase } from './supabase-client';

/**
 * Get the current user's JWT access token
 * 
 * This is the ONLY function that should retrieve access tokens.
 * It calls supabase.auth.getSession() which works even when localStorage
 * is empty (Figma iframe) because Supabase stores session in memory.
 * 
 * @returns Access token string or null if no active session
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[authSession] Error getting session:', error);
      return null;
    }
    
    if (!session?.access_token) {
      console.warn('[authSession] No active session or access token');
      return null;
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[authSession] ✅ Access token retrieved:', {
        tokenPrefix: session.access_token.slice(0, 12) + '...',
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'unknown'
      });
    }
    
    return session.access_token;
  } catch (err) {
    console.error('[authSession] Unexpected error getting access token:', err);
    return null;
  }
}

/**
 * Get the current session (includes user and access token)
 * 
 * @returns Session object or null if no active session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[authSession] Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (err) {
    console.error('[authSession] Unexpected error getting session:', err);
    return null;
  }
}

/**
 * Wait for auth to be ready and call callback when session exists
 * 
 * This is useful for components that need to wait for authentication
 * before making API calls. Works in Figma iframe where localStorage
 * may be empty initially.
 * 
 * @param callback Function to call when session is ready
 * @returns Cleanup function to remove listener
 */
export function onAuthReady(callback: (session: any) => void): () => void {
  // First, check if session already exists
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      callback(session);
    }
  });
  
  // Then listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session && event === 'SIGNED_IN') {
        console.log('[authSession] Auth ready - session available');
        callback(session);
      }
    }
  );
  
  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Check if user is authenticated
 * 
 * @returns True if user has active session, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Get current user ID from session
 * 
 * @returns User ID or null if no session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Get current user email from session
 * 
 * @returns User email or null if no session
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.email || null;
}
