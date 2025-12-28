import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * Login page (self-contained inside packages/web).
 * - No imports from repo-root /utils
 * - Uses Supabase email/password sign-in
 */
export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 5 && password.length > 0 && !busy;
  }, [email, password, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // If login succeeded, go to dashboard
      if (data.session?.access_token) {
        nav("/", { replace: true });
      } else {
        setMsg("Logged in, but no session token was returned.");
      }
    } catch (err: any) {
      setMsg(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "Inter, system-ui, Arial", maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Log in</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Use the same email + password you signed up with.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jeff.hayter@outlook.com"
            autoComplete="email"
            inputMode="email"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            type="password"
            autoComplete="current-password"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <button
          disabled={!canSubmit}
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "none",
            fontWeight: 800,
            cursor: canSubmit ? "pointer" : "not-allowed",
            background: canSubmit ? "#FFCC00" : "#eee",
            color: "#000",
          }}
        >
          {busy ? "Signing in…" : "Log in"}
        </button>

        {msg ? (
          <div style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", background: "#fff5f5", fontSize: 13 }}>
            {msg}
          </div>
        ) : null}
      </form>

      <div style={{ marginTop: 14, fontSize: 13 }}>
        Need an account? <Link to="/signup">Create one</Link>
      </div>

      <div style={{ marginTop: 8, fontSize: 13 }}>
        Forgot your password? <Link to="/reset-password">Reset it</Link>
      </div>
    </div>
  );
}
