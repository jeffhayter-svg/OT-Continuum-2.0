import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const auth = new Hono();

// Admin endpoint to create confirmed test users (PUBLIC - no auth required)
// This endpoint bypasses email verification for development/testing
auth.post('/admin-create-user', async (c) => {
  try {
    const { email, password, full_name } = await c.req.json();

    console.log('[Admin Create User] Creating confirmed user:', { email, full_name });

    if (!email || !password || !full_name) {
      return c.json({
        ok: false,
        error: 'Bad Request',
        message: 'Email, password, and full_name are required',
      }, 400);
    }

    if (password.length < 8) {
      return c.json({
        ok: false,
        error: 'Bad Request',
        message: 'Password must be at least 8 characters',
      }, 400);
    }

    // Use SERVICE_ROLE_KEY for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create user with admin API - email_confirm: true means no verification needed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm the user's email since SMTP isn't configured
      user_metadata: { full_name },
    });

    if (authError) {
      console.error('[Admin Create User] Auth error:', authError);
      if (authError.message.includes('already registered')) {
        return c.json({
          ok: false,
          error: 'Conflict',
          message: 'User with this email already exists',
        }, 409);
      }
      return c.json({
        ok: false,
        error: 'Internal Server Error',
        message: authError.message,
      }, 500);
    }

    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
      });

    if (profileError) {
      console.error('[Admin Create User] Profile creation error:', profileError);
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({
        ok: false,
        error: 'Internal Server Error',
        message: 'Failed to create user profile',
      }, 500);
    }

    console.log('[Admin Create User] ✅ User created and confirmed:', authData.user.id);

    return c.json({
      ok: true,
      user_id: authData.user.id,
      email: authData.user.email,
    }, 201);
  } catch (error) {
    console.error('[Admin Create User] Exception:', error);
    return c.json({
      ok: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Signup endpoint
auth.post('/signup', async (c) => {
  try {
    const { email, password, full_name } = await c.req.json();

    if (!email || !password || !full_name) {
      return c.json({
        error: 'Bad Request',
        message: 'Email, password, and full_name are required',
      }, 400);
    }

    if (password.length < 8) {
      return c.json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters',
      }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create user with admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name: full_name },
    });

    if (authError) {
      console.error('Signup error:', authError);
      if (authError.message.includes('already registered')) {
        return c.json({
          error: 'Conflict',
          message: 'User with this email already exists',
        }, 409);
      }
      return c.json({
        error: 'Internal Server Error',
        message: authError.message,
      }, 500);
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to create user profile',
      }, 500);
    }

    return c.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
      },
    }, 201);
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default auth;