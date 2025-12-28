/**
 * Figma Preview Mode Detection
 * 
 * Detects when the app is running inside a Figma iframe preview.
 * When in preview mode:
 * - Authentication is bypassed
 * - Backend calls are skipped
 * - Mock tenant context is used
 * - UI flows work for design validation
 */

/**
 * Check if app is running in Figma Preview Mode
 */
export function isFigmaPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isFigmaSite = window.location.hostname.includes('figma.site');
  
  if (isFigmaSite) {
    console.log('[Preview Mode] 🎨 Detected Figma Preview Mode');
    console.log('[Preview Mode] Authentication and backend calls will be bypassed');
  }
  
  return isFigmaSite;
}

/**
 * Get mock tenant context for preview mode
 */
export function getPreviewTenantContext() {
  return {
    userId: 'preview-user-id',
    email: 'preview@example.com',
    fullName: 'Preview User',
    role: 'admin' as const,
    tenantId: 'preview-tenant-id',
    tenantName: 'Preview Organization',
    tenantPlan: 'free',
    tenantStatus: 'active',
  };
}

/**
 * Get mock user session for preview mode
 */
export function getPreviewSession() {
  return {
    user: {
      id: 'preview-user-id',
      email: 'preview@example.com',
      user_metadata: {
        full_name: 'Preview User',
      },
    },
    access_token: 'preview-token',
  };
}
