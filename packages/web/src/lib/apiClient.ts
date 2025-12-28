import { supabase } from "./supabaseClient";

export type Tenant = {
  id: string;
  name: string;
  created_at?: string;
};

async function requireAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("No active session (access_token is null). Are you logged in?");
  return token;
}

async function callEdgeJson<T>(path: string, init?: RequestInit): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const accessToken = await requireAccessToken();

  const url = `${supabaseUrl}/functions/v1/${path.replace(/^\//, "")}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const json = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const detail = (json as any)?.error ?? json ?? text ?? `HTTP ${res.status}`;
    throw new Error(`EdgeFunction ${path} failed: ${detail}`);
  }

  return json as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  // Used by tenant resolution flows
  async getMe() {
    return callEdgeJson<{
      user: { id: string; email: string };
      memberships: Array<{ tenant_id: string; role: string }>;
      defaultTenantId: string | null;
    }>("me", { method: "GET" });
  },

  // ✅ This eliminates your runtime error.
  // For MVP we query the table directly (RLS will apply).
  async getTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from("tenants")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Tenant[];
  },
};
