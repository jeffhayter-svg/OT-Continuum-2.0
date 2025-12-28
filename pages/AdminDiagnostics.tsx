import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { Loader2, Users, Building2, RefreshCw, AlertCircle, GitBranch } from 'lucide-react';
import { OnboardingFlowDiagram } from '../components/OnboardingFlowDiagram';

interface UserTenantInfo {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_plan: string;
  tenant_status: string;
  created_at: string;
}

export function AdminDiagnostics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserTenantInfo[]>([]);
  const [tenantGroups, setTenantGroups] = useState<Map<string, UserTenantInfo[]>>(new Map());

  useEffect(() => {
    fetchUserTenantData();
  }, []);

  async function fetchUserTenantData() {
    setLoading(true);
    setError(null);

    try {
      console.log('[AdminDiagnostics] Fetching user-tenant relationships...');

      // Query users table with tenant information
      const { data, error: queryError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          tenant_id,
          created_at,
          tenants!inner (
            id,
            name
          )
        `)
        .order('created_at', { ascending: true });

      if (queryError) {
        console.error('[AdminDiagnostics] Query error:', queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }

      console.log('[AdminDiagnostics] Raw data:', data);

      // Transform the data
      const userTenantData: UserTenantInfo[] = (data || []).map((row: any) => ({
        user_id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        tenant_id: row.tenant_id,
        tenant_name: row.tenants?.name || 'Unknown',
        tenant_plan: 'free', // Default plan since column doesn't exist
        tenant_status: 'active', // Default status since column doesn't exist
        created_at: row.created_at,
      }));

      console.log('[AdminDiagnostics] Transformed data:', userTenantData);

      setUsers(userTenantData);

      // Group by tenant
      const grouped = new Map<string, UserTenantInfo[]>();
      userTenantData.forEach(user => {
        const tenantId = user.tenant_id;
        if (!grouped.has(tenantId)) {
          grouped.set(tenantId, []);
        }
        grouped.get(tenantId)!.push(user);
      });

      setTenantGroups(grouped);

      console.log('[AdminDiagnostics] ✅ Found', userTenantData.length, 'users across', grouped.size, 'tenants');
    } catch (err) {
      console.error('[AdminDiagnostics] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    fetchUserTenantData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user-tenant data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-red-600 mb-2">Error Loading Data</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl mb-2">Admin Diagnostics</h1>
              <p className="text-gray-600 text-sm">
                User-Tenant Relationships Overview
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl">{users.length}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl">{tenantGroups.size}</div>
                  <div className="text-sm text-gray-600">Total Tenants</div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl">
                    {tenantGroups.size > 0 ? (users.length / tenantGroups.size).toFixed(1) : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Avg Users/Tenant</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Flow Diagram */}
        <div className="mb-6">
          <OnboardingFlowDiagram />
        </div>

        {/* Grouped by Tenant */}
        <div className="space-y-6">
          <h2 className="text-xl">Users Grouped by Tenant</h2>

          {Array.from(tenantGroups.entries()).map(([tenantId, tenantUsers]) => {
            const tenant = tenantUsers[0]; // Get tenant info from first user
            return (
              <div key={tenantId} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Tenant Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6" />
                      <div>
                        <h3 className="text-lg">{tenant.tenant_name}</h3>
                        <p className="text-sm text-blue-100">
                          ID: {tenantId.substring(0, 8)}... • Plan: {tenant.tenant_plan} • Status: {tenant.tenant_status}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {tenantUsers.length} {tenantUsers.length === 1 ? 'user' : 'users'}
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm text-gray-600">User ID</th>
                        <th className="text-left px-4 py-3 text-sm text-gray-600">Email</th>
                        <th className="text-left px-4 py-3 text-sm text-gray-600">Full Name</th>
                        <th className="text-left px-4 py-3 text-sm text-gray-600">Role</th>
                        <th className="text-left px-4 py-3 text-sm text-gray-600">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantUsers.map((user, index) => (
                        <tr 
                          key={user.user_id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {user.user_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {user.full_name || <span className="text-gray-400 italic">Not set</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                              user.role === 'manager' ? 'bg-green-100 text-green-700' :
                              user.role === 'engineer' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {tenantGroups.size === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No user-tenant data found</p>
            </div>
          )}
        </div>

        {/* All Users Table */}
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <h2 className="text-lg">All Users (Flat View)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">User ID</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Full Name</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Tenant Name</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Tenant ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr 
                    key={user.user_id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {user.user_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.full_name || <span className="text-gray-400 italic">Not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'manager' ? 'bg-green-100 text-green-700' :
                        user.role === 'engineer' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.tenant_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {user.tenant_id.substring(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}