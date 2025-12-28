// ============================================================================
// Shared Library: Authentication & JWT Claims
// ============================================================================

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface JWTClaims {
  sub: string;              // User ID
  tenant_id: string;        // Tenant ID
  role: UserRole;           // User role
  site_ids: string[] | null; // Accessible site IDs (null = all sites)
  email?: string;
}

export type UserRole = 
  | 'admin' 
  | 'billing_admin' 
  | 'manager' 
  | 'operator' 
  | 'contributor' 
  | 'viewer' 
  | 'auditor';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  siteIds: string[] | null;
  email?: string;
}

/**
 * Parse and validate JWT claims from Authorization header
 */
export function parseJWTClaims(request: Request): JWTClaims | null {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Decode JWT (base64 decode the payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Validate required claims
    if (!payload.sub || !payload.tenant_id || !payload.role) {
      return null;
    }

    return {
      sub: payload.sub,
      tenant_id: payload.tenant_id,
      role: payload.role,
      site_ids: payload.site_ids || null,
      email: payload.email
    };
  } catch (error) {
    console.error('Error parsing JWT claims:', error);
    return null;
  }
}

/**
 * Extract auth context from request
 * Throws error if not authenticated
 */
export function requireAuth(request: Request): AuthContext {
  const claims = parseJWTClaims(request);
  
  if (!claims) {
    throw new AuthError('NOT_AUTHENTICATED', 'Authentication required');
  }

  return {
    userId: claims.sub,
    tenantId: claims.tenant_id,
    role: claims.role,
    siteIds: claims.site_ids,
    email: claims.email
  };
}

/**
 * Check if user has required role
 */
export function requireRole(
  auth: AuthContext, 
  allowedRoles: UserRole[]
): void {
  if (!allowedRoles.includes(auth.role)) {
    throw new AuthError(
      'NOT_AUTHORIZED',
      `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
    );
  }
}

/**
 * Check if user has admin or billing_admin role
 */
export function requireAdminOrBilling(auth: AuthContext): void {
  if (auth.role !== 'admin' && auth.role !== 'billing_admin') {
    throw new AuthError(
      'NOT_AUTHORIZED',
      'Admin or billing admin role required'
    );
  }
}

/**
 * Check if user has access to specific site
 */
export function requireSiteAccess(
  auth: AuthContext, 
  siteId: string
): void {
  // Admin, auditor, and users with null site_ids have access to all sites
  if (
    auth.role === 'admin' || 
    auth.role === 'auditor' || 
    auth.siteIds === null
  ) {
    return;
  }

  // Check if site is in user's accessible sites
  if (!auth.siteIds || !auth.siteIds.includes(siteId)) {
    throw new AuthError(
      'NOT_AUTHORIZED',
      'Access to this site is not allowed'
    );
  }
}

/**
 * Create Supabase client with service role key
 * Use this for server-side operations that need to bypass RLS
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Create Supabase client with anon key (for RLS-enforced queries)
 */
export function createAnonClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, anonKey);
}

/**
 * Custom error for authentication/authorization failures
 */
export class AuthError extends Error {
  constructor(
    public code: 'NOT_AUTHENTICATED' | 'NOT_AUTHORIZED',
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
