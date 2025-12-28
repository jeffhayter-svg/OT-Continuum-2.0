import React, { useState } from 'react';
import { Building2, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase-client';

interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_plan: string;
  tenant_status: string;
  role: string;
}

interface TenantPickerProps {
  userId: string;
  userEmail: string;
  tenants: Tenant[];
  onSelect: (tenantContext: {
    tenantId: string;
    tenantName: string;
    tenantPlan: string;
    role: string;
  }) => void;
  onError: (error: string) => void;
}

export function TenantPicker({ userId, userEmail, tenants, onSelect, onError }: TenantPickerProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelectTenant() {
    if (!selectedTenantId) {
      onError('Please select an organization');
      return;
    }

    try {
      setLoading(true);
      
      const selectedTenant = tenants.find(t => t.tenant_id === selectedTenantId);
      if (!selectedTenant) {
        throw new Error('Selected tenant not found');
      }

      console.group('[TenantPicker] 🔄 Switching to tenant');
      console.log('User ID:', userId);
      console.log('Selected Tenant:', selectedTenant.tenant_name);
      console.log('Tenant ID:', selectedTenantId);
      console.groupEnd();

      // Update public.users.tenant_id to selected tenant
      console.log('[TenantPicker] Updating users.tenant_id...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tenant_id: selectedTenantId,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[TenantPicker] ❌ Failed to update tenant_id:', updateError);
        throw new Error(`Failed to switch tenant: ${updateError.message}`);
      }

      console.log('[TenantPicker] ✅ Tenant switched successfully');

      // Return tenant context
      onSelect({
        tenantId: selectedTenant.tenant_id,
        tenantName: selectedTenant.tenant_name,
        tenantPlan: selectedTenant.tenant_plan,
        role: selectedTenant.role,
      });

    } catch (err) {
      console.error('[TenantPicker] ❌ Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Select Organization</h1>
          <p className="text-gray-600">
            You belong to {tenants.length} organization{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tenant List */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="space-y-3 mb-6">
            {tenants.map((tenant) => (
              <button
                key={tenant.tenant_id}
                onClick={() => setSelectedTenantId(tenant.tenant_id)}
                disabled={loading}
                data-testid={`tenant-picker-option-${tenant.tenant_id}`}
                className={`w-full text-left border-2 rounded-lg p-4 transition-all hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedTenantId === tenant.tenant_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Building2 className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                      selectedTenantId === tenant.tenant_id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg">{tenant.tenant_name}</h3>
                        {tenant.tenant_status === 'active' && (
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>Plan: {tenant.tenant_plan}</span>
                        <span>•</span>
                        <span>Role: {tenant.role}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        ID: {tenant.tenant_id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  
                  {selectedTenantId === tenant.tenant_id ? (
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleSelectTenant}
            disabled={loading || !selectedTenantId}
            data-testid="tenant-picker-continue-button"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Logged in as: <strong>{userEmail}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
