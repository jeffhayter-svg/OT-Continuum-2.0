import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, type Tenant } from "../lib/apiClient";

type TenantContextValue = {
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  refreshTenants: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiClient.getTenants();
      setTenants(list);
    } catch (e: any) {
      console.error("Failed to load tenants:", e);
      setTenants([]);
      setError(e?.message ?? "Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  const value = useMemo(
    () => ({
      tenants,
      isLoading,
      error,
      refreshTenants: loadTenants,
    }),
    [tenants, isLoading, error]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantContext must be used within <TenantProvider>.");
  }
  return ctx;
}
