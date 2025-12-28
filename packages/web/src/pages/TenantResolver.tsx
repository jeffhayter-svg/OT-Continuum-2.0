// ============================================================================
// Tenant Resolver - Post-Login Gate
// Determines if user needs onboarding or can proceed to app
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, MeResponse } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { isNoSessionError } from '../../../../lib/edgeFetch';

export function TenantResolver() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      resolveUserTenants();
    }
  }, [user]);

  async function resolveUserTenants() {
    try {
      setLoading(true);
      setError(null);

      // Call GET /me to get user's tenant memberships
      const response: MeResponse = await apiClient.getMe();

      console.log('[TenantResolver] User tenant data:', response);

      const { tenants, default_tenant_id } = response;

      // CASE 1: No tenants - route to onboarding (TenantSetup)
      // This is a normal case for new users who just signed up
      if (!tenants || tenants.length === 0) {
        console.log('[TenantResolver] No tenants found - routing to tenant setup');
        navigate('/onboarding/tenant-setup');
        return;
      }

      // CASE 2: One tenant - auto-select and route to app
      if (tenants.length === 1) {
        const tenant = tenants[0];
        console.log('[TenantResolver] Single tenant found - auto-selecting:', tenant);
        
        // Save to localStorage
        localStorage.setItem('activeTenantId', tenant.id);
        localStorage.setItem('activeTenantName', tenant.name);
        localStorage.setItem('activeRole', tenant.role);
        
        // Route to app home
        navigate('/');
        return;
      }

      // CASE 3: Multiple tenants - route to picker
      console.log('[TenantResolver] Multiple tenants found - routing to picker');
      
      // Save all tenants to localStorage for picker
      localStorage.setItem('userTenants', JSON.stringify(tenants));
      
      navigate('/tenant-picker');
    } catch (err) {
      console.error('[TenantResolver] Error resolving tenants:', err);
      
      // Handle NO_SESSION error - redirect to login
      if (isNoSessionError(err)) {
        console.log('[TenantResolver] No session - redirecting to login');
        navigate('/login');
        return;
      }
      
      // Handle specific error codes
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Session expired')) {
          // Session expired - redirect to login
          navigate('/login');
          return;
        }
        
        if (err.message.includes('403')) {
          setError('You do not have access to any organizations. Please contact an administrator.');
          return;
        }
        
        setError(err.message || 'Failed to load your organizations');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50"
        data-testid="tenant-resolver-loading"
      >
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-slate-900 mb-2">Setting up your workspace</h2>
          <p className="text-slate-600">
            Loading your organizations...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
        data-testid="tenant-resolver-error"
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-slate-900 mb-2">Access Error</h2>
              <p className="text-slate-600" data-testid="error-message">
                {error}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => resolveUserTenants()}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 transition-colors"
                data-testid="retry-button"
              >
                Try Again
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
                data-testid="back-to-login-button"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached as navigation happens in the effect
  return null;
}