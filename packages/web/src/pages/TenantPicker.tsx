// ============================================================================
// Tenant Picker - Choose Organization (for users with multiple tenants)
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserTenant } from '../lib/api-client';

export default function TenantPicker() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<UserTenant[]>([]);

  useEffect(() => {
    // Load tenants from localStorage (set by TenantResolver)
    const storedTenants = localStorage.getItem('userTenants');
    if (storedTenants) {
      try {
        const parsed = JSON.parse(storedTenants);
        setTenants(parsed);
      } catch (err) {
        console.error('Failed to parse stored tenants:', err);
        // Fallback: redirect back to resolver
        navigate('/tenant-resolver');
      }
    } else {
      // No tenants in storage - redirect back to resolver
      navigate('/tenant-resolver');
    }
  }, [navigate]);

  function selectTenant(tenant: UserTenant) {
    console.log('[TenantPicker] Selected tenant:', tenant);
    
    // Save selected tenant to localStorage
    localStorage.setItem('activeTenantId', tenant.id);
    localStorage.setItem('activeTenantName', tenant.name);
    localStorage.setItem('activeRole', tenant.role);
    
    // Navigate to app home
    navigate('/');
  }

  function createNewOrganization() {
    navigate('/onboarding');
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operator':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12"
      data-testid="tenant-picker-page"
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-slate-900 mb-2">Choose an organization</h1>
          <p className="text-slate-600">
            Select which organization you'd like to work with
          </p>
        </div>

        {/* Tenant Cards */}
        <div className="space-y-4 mb-6">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => selectTenant(tenant)}
              disabled={tenant.status !== 'active'}
              className={`w-full bg-white border-2 rounded-lg p-6 text-left transition-all ${
                tenant.status === 'active'
                  ? 'border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                  : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
              }`}
              data-testid={`tenant-card-${tenant.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-slate-900 mb-2">{tenant.name}</h3>
                  
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded-md border ${getRoleBadgeColor(tenant.role)}`}
                      data-testid={`role-badge-${tenant.id}`}
                    >
                      {tenant.role.charAt(0).toUpperCase() + tenant.role.slice(1)}
                    </span>
                    
                    <span 
                      className={`text-xs px-2 py-1 rounded-md ${getStatusBadgeColor(tenant.status)}`}
                      data-testid={`status-badge-${tenant.id}`}
                    >
                      {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                    </span>
                  </div>
                </div>

                {tenant.status === 'active' && (
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Create New Organization */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-slate-900 mb-1">Create a new organization</h3>
              <p className="text-sm text-slate-600 mb-4">
                Set up a new organization and invite your team
              </p>
              
              <button
                onClick={createNewOrganization}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                data-testid="create-org-button"
              >
                Get Started â†’
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Can't find your organization? Contact your administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
}

