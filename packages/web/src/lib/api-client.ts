import { supabase } from "./supabase";

/**
 * Minimal API client for the web app.
 * - Keeps all imports inside packages/web/src
 * - Provides a safe way to call Supabase Edge Functions with proper headers
 * - Exposes apiClient.getMe() to match existing TenantResolver usage
 */

export const supabaseConfigValid = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
  return Boolean(url && key && url.includes(".supabase.co"));
};

export class NoSessionError extends Error {
  constructor(message = "No active session") {
    super(message);
    this.name = "NoSessionError";
  }
}

export const isNoSessionError = (e: any) =>
  e?.name === "NoSessionError" ||
  e?.message?.toLowerCase?.().includes("no active session") ||
  e?.message?.toLowerCase?.().includes("no session");

export type MeResponse = {
  user_id: string;
  email?: string;
  tenants?: Array<{
    tenant_id: string;
    tenant_name?: string;
    role?: string;
  }>;
  default_tenant_id?: string | null;
};

/**
 * Call an Edge Function (Supabase Functions).
 * Always sends:
 * - Authorization: Bearer <jwt>
 * - apikey: <anon key>
 */
export async function callEdgeJson<T>(
  functionName: string,
  init?: { method?: string; body?: any; headers?: Record<string, string> }
): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new NoSessionError();
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  const method = init?.method ?? "POST";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    ...(init?.headers ?? {}),
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Edge ${functionName} failed (${resp.status}): ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

/**
 * Convenience: fetch the authenticated user (forces a real request)
 */
export async function getAuthedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Compatibility wrapper: existing code expects apiClient.getMe().
 * This calls an Edge Function named "me" by default.
 *
 * If your function is named differently, change "me" here to your real function name.
 */
export const apiClient = {
  async getMe(): Promise<MeResponse> {
    return await callEdgeJson<MeResponse>("me", { method: "GET" });
  },
};
