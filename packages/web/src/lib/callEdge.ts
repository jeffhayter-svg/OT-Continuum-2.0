import { supabase } from "./supabase";

const FUNCTIONS_BASE =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_BASE ||
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type CallEdgeOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function callEdge<T = unknown>(
  functionName: string,
  path: string = "",
  options: CallEdgeOptions = {}
): Promise<T> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("User is not authenticated");
  }

  const res = await fetch(`${FUNCTIONS_BASE}/${functionName}${path}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Edge function failed (${res.status}): ${text || res.statusText}`
    );
  }

  return (await res.json()) as T;
}
