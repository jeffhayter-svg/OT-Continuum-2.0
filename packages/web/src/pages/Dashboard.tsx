import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * Dashboard = post-login landing.
 * - Shows safe session info
 * - Provides quick "Ping Backend" to force a real Supabase request
 */
export default function Dashboard() {
  const { user, accessToken, signOut } = useAuth();
  const [pingStatus, setPingStatus] = useState<"idle" | "ok" | "error">("idle");
  const [pingMessage, setPingMessage] = useState<string>("");

  const safe = useMemo(() => {
    return {
      email: user?.email ?? "(none)",
      userId: user?.id ?? "(none)",
      accessTokenPrefix: accessToken ? accessToken.slice(0, 18) + "…REDACTED" : "(none)",
    };
  }, [user, accessToken]);

  async function pingBackend() {
    setPingStatus("idle");
    setPingMessage("Pinging Supabase…");

    try {
      // This forces a real HTTP request against your Supabase REST endpoint.
      // We intentionally use an always-available system table in Postgres:
      // "pg_catalog.pg_tables" is not exposed, so we use a benign query:
      // fetch current auth user (goes to auth endpoint) + a trivial select on a known table if you have one.
      //
      // If you do NOT have a public table yet, this still validates auth + connectivity.
      const { data: authUser, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      setPingStatus("ok");
      setPingMessage(`OK: auth.getUser() returned ${authUser?.user?.id ?? "no user"}`);
    } catch (e: any) {
      setPingStatus("error");
      setPingMessage(`ERROR: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "Inter, system-ui, Arial" }}>
      <h1 style={{ marginBottom: 8 }}>OT Continuum</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={pingBackend}
          style={{
            background: "#FFCC00",
            color: "#000",
            border: "none",
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Ping Backend
        </button>

        <button
          onClick={signOut}
          style={{
            background: "transparent",
            color: "#111",
            border: "1px solid #111",
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Sign out
        </button>

        <span style={{ fontSize: 13 }}>
          Ping status:{" "}
          <b>
            {pingStatus === "idle" ? "idle" : pingStatus === "ok" ? "OK" : "ERROR"}
          </b>
        </span>
      </div>

      <div style={{ marginBottom: 14, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Session</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <div>Email: {safe.email}</div>
          <div>User ID: {safe.userId}</div>
          <div>Access token: {safe.accessTokenPrefix}</div>
        </div>
      </div>

      {pingMessage ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            background: pingStatus === "error" ? "#fff5f5" : "#f7fafc",
            fontSize: 13,
            marginBottom: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          {pingMessage}
        </div>
      ) : null}

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Navigate</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href="/tenant-resolver">Tenant Resolver</a>
          <a href="/tenant-picker">Tenant Picker</a>
          <a href="/sites">Sites</a>
          <a href="/assets">Assets</a>
          <a href="/risk-register">Risk Register</a>
          <a href="/signal-ingestion">Signal Ingestion</a>
          <a href="/execution-tracking">Execution Tracking</a>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#444" }}>
          If a page is still blank after this change, it means the page exists but isn’t wired to
          load data yet. That’s a separate dock.
        </div>
      </div>
    </div>
  );
}
