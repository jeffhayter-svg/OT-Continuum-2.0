// ============================================================================
// Supabase Client Singleton
// Single source of truth for the Supabase client instance
// Prevents multiple GoTrueClient instances warning
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// ============================================================================
// RUNTIME VALIDATION - Critical for auth to work
// ============================================================================

console.group('🔧 [Supabase Client] Initialization Validation');
console.log('Project ID:', projectId);
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key Length:', publicAnonKey?.length || 0);
console.log('Anon Key First 12 chars:', publicAnonKey?.substring(0, 12) || 'MISSING');
console.log('Anon Key Valid:', publicAnonKey && publicAnonKey.length > 50 ? '✅ YES' : '❌ NO');

if (!publicAnonKey || publicAnonKey.length < 50) {
  console.error('❌ [CRITICAL] Supabase anon key is missing or invalid!');
  console.error('❌ Authentication will FAIL without valid anon key');
  console.error('❌ Check /utils/supabase/info.tsx');
} else {
  console.log('✅ Anon key appears valid');
}
console.groupEnd();

// Export validation status
export const supabaseConfigValid = !!(publicAnonKey && publicAnonKey.length > 50);

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get the singleton Supabase client instance
 * This prevents multiple GoTrueClient instances from being created
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('🔧 [Supabase Client] Creating client instance...');
    supabaseInstance = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log('✅ [Supabase Client] Client created successfully');
  }
  return supabaseInstance;
}

// Export the singleton instance
export const supabase = getSupabaseClient();

// Export config for runtime checks
export { supabaseUrl, projectId, publicAnonKey };