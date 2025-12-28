// ============================================================================
// JWT Debug Utilities
// Helper functions to decode and inspect JWT tokens for debugging
// ============================================================================

export interface DecodedJWT {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  raw: string;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
}

/**
 * Decode a JWT token (client-side only, does NOT verify signature)
 * For debugging purposes only
 */
export function decodeJWT(token: string): DecodedJWT | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[JWT Debug] Invalid JWT format - expected 3 parts, got', parts.length);
      return null;
    }

    const [headerB64, payloadB64, signature] = parts;

    // Decode header
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? payload.exp < now : false;

    return {
      header,
      payload,
      signature,
      raw: token,
      isExpired,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
    };
  } catch (error) {
    console.error('[JWT Debug] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Pretty print a JWT token to console
 */
export function logJWT(token: string, label: string = 'JWT Token') {
  console.group(`🔐 ${label}`);
  
  const decoded = decodeJWT(token);
  if (!decoded) {
    console.error('Failed to decode token');
    console.log('Raw token:', token);
    console.groupEnd();
    return;
  }

  console.log('📋 Header:', decoded.header);
  console.log('📦 Payload:', decoded.payload);
  console.log('✍️  Signature:', decoded.signature.substring(0, 20) + '...');
  console.log('⏰ Issued At:', decoded.issuedAt?.toLocaleString() || 'N/A');
  console.log('⏱️  Expires At:', decoded.expiresAt?.toLocaleString() || 'N/A');
  console.log('⚠️  Is Expired:', decoded.isExpired ? '❌ YES' : '✅ NO');
  
  if (decoded.isExpired) {
    console.error('🚨 TOKEN IS EXPIRED! This will cause 401 errors.');
  }

  console.log('📝 Full Token (first 50 chars):', token.substring(0, 50) + '...');
  console.log('📏 Token Length:', token.length, 'characters');
  
  console.groupEnd();
}

/**
 * Compare two JWT tokens and show differences
 */
export function compareJWTs(token1: string, token2: string, label1: string = 'Token 1', label2: string = 'Token 2') {
  console.group('🔍 JWT Comparison');
  
  const decoded1 = decodeJWT(token1);
  const decoded2 = decodeJWT(token2);

  if (!decoded1 || !decoded2) {
    console.error('Failed to decode one or both tokens');
    console.groupEnd();
    return;
  }

  console.log(`${label1}:`, decoded1.payload);
  console.log(`${label2}:`, decoded2.payload);
  
  console.log('\n🔄 Differences:');
  const allKeys = new Set([
    ...Object.keys(decoded1.payload),
    ...Object.keys(decoded2.payload),
  ]);

  allKeys.forEach(key => {
    const val1 = decoded1.payload[key];
    const val2 = decoded2.payload[key];
    
    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      console.log(`  ${key}:`);
      console.log(`    ${label1}:`, val1);
      console.log(`    ${label2}:`, val2);
    }
  });

  console.groupEnd();
}

/**
 * Validate JWT token structure and content
 */
export function validateJWT(token: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token) {
    errors.push('Token is empty or null');
    return { valid: false, errors, warnings };
  }

  const decoded = decodeJWT(token);
  if (!decoded) {
    errors.push('Failed to decode JWT');
    return { valid: false, errors, warnings };
  }

  // Check expiration
  if (decoded.isExpired) {
    errors.push(`Token expired at ${decoded.expiresAt?.toLocaleString()}`);
  }

  // Check required fields for Supabase
  if (!decoded.payload.sub) {
    errors.push('Missing "sub" (subject/user ID) in payload');
  }

  if (!decoded.payload.role) {
    errors.push('Missing "role" in payload');
  }

  if (!decoded.payload.iss) {
    errors.push('Missing "iss" (issuer) in payload');
  }

  // Warnings
  if (decoded.payload.role === 'anon') {
    warnings.push('Token has "anon" role - this is the public key, not a user JWT');
  }

  if (!decoded.payload.email && decoded.payload.role !== 'anon') {
    warnings.push('No email in payload (might be expected for some token types)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract user ID from JWT
 */
export function getUserIdFromJWT(token: string): string | null {
  const decoded = decodeJWT(token);
  return decoded?.payload?.sub || null;
}

/**
 * Extract role from JWT
 */
export function getRoleFromJWT(token: string): string | null {
  const decoded = decodeJWT(token);
  return decoded?.payload?.role || null;
}
