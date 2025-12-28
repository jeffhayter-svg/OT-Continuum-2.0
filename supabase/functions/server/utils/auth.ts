import { Context } from 'npm:hono@4';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

interface AuthResult {
  user: { id: string; email: string } | null;
  supabase: SupabaseClient;
  error: Response | null;
}

export async function getAuthenticatedUser(c: Context): Promise<AuthResult> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      supabase: createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      ),
      error: c.json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      }, 401),
    };
  }

  const token = authHeader.substring(7);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Authentication error:', error);
    return {
      user: null,
      supabase,
      error: c.json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      }, 401),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
    },
    supabase,
    error: null,
  };
}
