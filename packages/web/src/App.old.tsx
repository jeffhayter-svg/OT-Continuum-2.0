import React from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

type SessionInfo = {
  email?: string;
  userId?: string;
  accessToken?: string;
};

export default function AppOld() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({});

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.trim().length >= 8 && !busy;
  }, [email, password, busy]);

  async function refreshSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setSessionInfo({});
      return;
    }

    const s = data.session;
    if (!s) {
      setSessionInfo({});
      return;
    }

    setSessionInfo({
      email: s.user?.email ?? undefined,
      userId: s.user?.id ?? undefined,
      accessToken: s.access_token ?? undefined,
    });
  }

  useEffect(() => {
    refreshSession();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshSession();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setMsg("Logged in successfully.");
      setPassword("");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // No email confirmation required for local testing if you disable it in Supabase.
          // If confirmation IS required, you may remain pending until email is fixed.
        },
      });
      if (error) throw error;
      setMsg("Signup successful. If confirmation is enabled, your user may need email confirmation.");
      setPassword("");
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMsg("Signed out.");
    } catch (e: any) {
      setErr(e?.message ?? "Sign out failed.");
    } finally {
      setBusy(false);
    }
  }

  const loggedIn = !!sessionInfo.accessToken;

  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 36 }}>
      <h1 style={{ margin: 0 }}>OT Continuum</h1>

      <div style={{ marginTop: 18, maxWidth: 760 }}>
        <div style={{ padding: 18, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>{loggedIn ? "Session" : "Sign in (Local Dev)"}</h2>

          {!loggedIn ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => setMode("login")}
                  disabled={busy}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: mode === "login" ? "#111" : "#fff",
                    color: mode === "login" ? "#fff" : "#111",
                    cursor: "pointer",
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("signup")}
                  disabled={busy}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: mode === "signup" ? "#111" : "#fff",
                    color: mode === "signup" ? "#fff" : "#111",
                    cursor: "pointer",
                  }}
                >
                  Signup
                </button>
              </div>

              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  marginBottom: 12,
                }}
              />

              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  marginBottom: 12,
                }}
              />

              <button
                disabled={!canSubmit}
                onClick={mode === "login" ? handleLogin : handleSignup}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: canSubmit ? "#111" : "#9ca3af",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
              >
                {busy ? "Working..." : mode === "login" ? "Login" : "Create account"}
              </button>

              <div style={{ marginTop: 14, color: "#6b7280" }}>
                Email sending is currently failing in Supabase, so magic links/invites are disabled for now.
                This email/password flow lets you keep building locally.
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div><strong>Email:</strong> {sessionInfo.email}</div>
                <div><strong>User ID:</strong> {sessionInfo.userId}</div>
                <div style={{ marginTop: 10 }}>
                  <strong>Access token:</strong>
                  <div
                    style={{
                      marginTop: 6,
                      padding: 12,
                      borderRadius: 10,
                      background: "#f3f4f6",
                      wordBreak: "break-all",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    }}
                  >
                    {sessionInfo.accessToken}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={busy}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#111",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {busy ? "Working..." : "Sign out"}
              </button>
            </>
          )}

          {msg && (
            <div style={{ marginTop: 12, padding: 10, background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 10 }}>
              {msg}
            </div>
          )}
          {err && (
            <div style={{ marginTop: 12, padding: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
