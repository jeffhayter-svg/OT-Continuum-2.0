// ============================================================================
// Tenant Context - Multi-tenant state management
// Provides active tenant selection and persistence
// ============================================================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, Tenant } from '../lib/api-client';

interface TenantContextType {
  tenants: Tenant[];
  activeTenantId: string | null;
  activeTenant: Tenant | null;
  setActiveTenantId: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getTenants();
      const tenantList = response.data;
      
      setTenants(tenantList);

      // Auto-select if only one tenant exists
      if (tenantList.length === 1) {
        const tenantId = tenantList[0].id;
        setActiveTenantIdState(tenantId);
        localStorage.setItem('activeTenantId', tenantId);
      } else if (tenantList.length > 1) {
        // Try to restore previously selected tenant
        const savedTenantId = localStorage.getItem('activeTenantId');
        if (savedTenantId && tenantList.some(t => t.id === savedTenantId)) {
          setActiveTenantIdState(savedTenantId);
        }
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }

  function setActiveTenantId(id: string) {
    setActiveTenantIdState(id);
    localStorage.setItem('activeTenantId', id);
  }

  const activeTenant = activeTenantId 
    ? tenants.find(t => t.id === activeTenantId) || null
    : null;

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenantId,
        activeTenant,
        setActiveTenantId,
        loading,
        error,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
