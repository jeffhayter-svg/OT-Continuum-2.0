// ============================================================================
// Auth Debug Utilities (Root App Version)
// Development-only utilities for debugging authentication
// ============================================================================

import { supabase } from './supabase-client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { logJWT, validateJWT, decodeJWT } from '../packages/web/src/lib/jwt-debug-utils';

// Only run in development
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

if (isDevelopment) {
  // Add global debug helpers
  (window as any).authDebug = {
    /**
     * Get current session and log JWT info
     */
    async session() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.group('🔐 Current Auth Session');
      console.log('Session:', session);
      console.log('Error:', error);
      
      if (session?.access_token) {
        console.log('\n📍 User Access Token:');
        logJWT(session.access_token, 'User JWT');
        
        const validation = validateJWT(session.access_token);
        console.log('\nValidation:', validation);
      } else {
        console.warn('⚠️  No active session');
      }
      
      console.groupEnd();
      
      return session;
    },

    /**
     * Log both anon key and user token
     */
    async tokens() {
      console.group('🔑 All JWT Tokens');
      
      // Anon key
      console.log('📍 Supabase Anon Key:');
      logJWT(publicAnonKey, 'Anon Key');
      
      // User token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('\n📍 User Access Token:');
        logJWT(session.access_token, 'User JWT');
      } else {
        console.warn('\n⚠️  No user token (not logged in)');
      }
      
      console.groupEnd();
    },

    /**
     * Decode and validate a specific token
     */
    decode(token: string) {
      console.group('🔍 JWT Decoder');
      logJWT(token, 'Provided Token');
      const validation = validateJWT(token);
      console.log('\nValidation:', validation);
      console.groupEnd();
      
      return decodeJWT(token);
    },

    /**
     * Copy current user token to clipboard
     */
    async copyUserToken() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await navigator.clipboard.writeText(session.access_token);
        console.log('✅ User JWT copied to clipboard!');
        console.log('Token length:', session.access_token.length, 'characters');
        return session.access_token;
      } else {
        console.error('❌ No user session found');
        return null;
      }
    },

    /**
     * Copy anon key to clipboard
     */
    async copyAnonKey() {
      await navigator.clipboard.writeText(publicAnonKey);
      console.log('✅ Anon key copied to clipboard!');
      return publicAnonKey;
    },

    /**
     * Enable/disable full JWT debug mode
     */
    enableFullDebug(enabled: boolean = true) {
      if (enabled) {
        localStorage.setItem('DEBUG_JWT', 'true');
        console.log('🔬 Full JWT debug mode ENABLED');
        console.log('Refresh the page to see full tokens in API requests');
      } else {
        localStorage.removeItem('DEBUG_JWT');
        console.log('🔬 Full JWT debug mode DISABLED');
      }
    },

    /**
     * Test API authentication
     */
    async testAuth() {
      console.group('🧪 Auth Test');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No session - user must log in first');
        console.groupEnd();
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-fb677d93/health`;
      
      console.log('Testing Edge Function call...');
      console.log('URL:', url);
      console.log('Headers:', {
        apikey: publicAnonKey.substring(0, 30) + '...',
        authorization: `Bearer ${session.access_token.substring(0, 30)}...`,
      });

      try {
        const response = await fetch(url, {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('\n📥 Response:');
        console.log('Status:', response.status, response.statusText);
        console.log('OK:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('Data:', data);
          console.log('\n✅ Auth test PASSED - JWT is valid!');
        } else {
          const error = await response.text();
          console.error('❌ Auth test FAILED');
          console.error('Error:', error);
          
          if (response.status === 401) {
            console.log('\n🔍 JWT was rejected by Edge Function');
            logJWT(session.access_token, 'Rejected Token');
          }
        }
      } catch (error) {
        console.error('❌ Request failed:', error);
      }

      console.groupEnd();
    },

    /**
     * Show help
     */
    help() {
      console.log(`
🔐 Auth Debug Utilities - Available Commands

authDebug.session()           - View current session and JWT
authDebug.tokens()            - View both anon key and user token
authDebug.decode(token)       - Decode and validate a JWT token
authDebug.copyUserToken()     - Copy user JWT to clipboard
authDebug.copyAnonKey()       - Copy anon key to clipboard
authDebug.enableFullDebug()   - Enable full JWT logging
authDebug.testAuth()          - Test API authentication
authDebug.help()              - Show this help message

Examples:
  await authDebug.session()
  await authDebug.tokens()
  await authDebug.copyUserToken()
  await authDebug.testAuth()
  authDebug.decode('eyJhbGci...')
  authDebug.enableFullDebug(true)

For more details, see /packages/web/JWT_DEBUGGING_GUIDE.md
      `);
    },
  };

  // Log availability
  console.log(
    '%c🔐 Auth Debug Utilities Available',
    'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log('Type "authDebug.help()" in console for available commands');
  console.log('Or use the JWT Debug Panel (look for 🔐 button in bottom-right corner)');
}