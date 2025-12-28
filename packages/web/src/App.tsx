import React from "react";
import { useAuth } from "./context/AuthContext";
import { useTenantContext } from "./context/TenantContext";
import Login from "./pages/Login";

export default function App() {
  const { user, isLoading, signOut } = useAuth();
  const { tenants, isLoading: tenantsLoading, error: tenantsError } = useTenantContext();

  if (isLoading) {
    return (
      <div style={{ padding: 24, fontFamily: "Inter, system-ui, Arial" }}>
        Loading session...
      </div>
    );
  }

  // ✅ Show login page
  if (!user) {
    return <Login />;
  }

  // ✅ Logged in shell
  return (
    <div style={{ padding: 24, fontFamily: "Inter, system-ui, Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>OT Continuum</h2>
        <button
          onClick={() => signOut()}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          Sign out
        </button>
      </div>

      <p>
        <b>Signed in as:</b> {user.email}
      </p>

      <h3>Tenants</h3>

      {tenantsLoading ? (
        <p>Loading tenants...</p>
      ) : tenantsError ? (
        <div style={{ color: "red" }}>
          <p>
            <b>Failed to load tenants:</b> {tenantsError}
          </p>
          <p>
            This usually means the <code>tenants</code> table doesn’t exist or RLS is blocking reads.
          </p>
        </div>
      ) : tenants.length === 0 ? (
        <p>No tenants found yet. Next step is to create one (onboarding flow).</p>
      ) : (
        <ul>
          {tenants.map((t) => (
            <li key={t.id}>
              {t.name} <span style={{ opacity: 0.7 }}>({t.id})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
