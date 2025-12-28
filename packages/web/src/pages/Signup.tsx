import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * Signup page (self-contained inside packages/web).
 * - No imports from repo-root /utils
 * - Uses Supabase email/password signup
 * - Sends users to /verify-email (or /login) depending on flow
 */
export default function Signup() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 5 && password.length >= 8 && !busy;
  }, [email, password, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      const redirectTo = `${window.location.origin}/verify-email`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      // If email confirmations are enabled, user may be null until verified.
      // Show a clear message + route to verify page.
      const userId = data.user?.id ?? "";
      setMsg(
        userId
          ? "Signup successful. Please check your email to verify your account."
          : "Signup created. Please check your email to verify your account before logging in."
      );

      // Send them to a verify info page (or stay here with message).
      // We'll navigate after a short delay so the message is visible.
      setTimeout(() => nav("/verify-email"), 500);
    } catch (err: any) {
      setMsg(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "Inter, system-ui, Arial", maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Create account</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Use your email + a password (8+ characters).
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
            placeholder="Minimum 8 characters"
            type="password"
            autoComplete="new-password"
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
          {busy ? "Creating…" : "Create account"}
        </button>

        {msg ? (
          <div style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", background: "#f7fafc", fontSize: 13 }}>
            {msg}
          </div>
        ) : null}
      </form>

      <div style={{ marginTop: 14, fontSize: 13 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
