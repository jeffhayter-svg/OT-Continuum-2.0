// ============================================================================
// OT Continuum - Main Server Edge Function
// ============================================================================

import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Request-ID', 'x-client-info'],
  maxAge: 86400,
}));

// Handle OPTIONS preflight requests explicitly
app.options('*', (c) => {
  return new Response('ok', { 
    status: 200, 
    headers: corsHeaders 
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthToken(c: any): string {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  return authHeader.substring(7);
}

function getSupabaseClient(token: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// ============================================================================
// Health Endpoint
// ============================================================================

app.get('/make-server-fb677d93/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// Auth Endpoints (PUBLIC - no authentication required)
// ============================================================================

// Admin endpoint to create confirmed test users
// This endpoint bypasses email verification for development/testing
app.post('/make-server-fb677d93/auth/admin-create-user', async (c) => {
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

// Regular signup endpoint
app.post('/make-server-fb677d93/auth/signup', async (c) => {
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

// ============================================================================
// Onboarding Endpoint (Creates tenant + assigns admin role)
// ============================================================================

app.post('/make-server-fb677d93/onboarding/create-tenant', async (c) => {
  try {
    const token = getAuthToken(c);
    const { organizationName, fullName } = await c.req.json();

    console.log('[Onboarding] Starting tenant creation');
    console.log('[Onboarding] Received values:');
    console.log('  - organizationName:', organizationName, '(type:', typeof organizationName, ')');
    console.log('  - fullName:', fullName, '(type:', typeof fullName, ')');

    // Validate inputs
    if (!organizationName || !fullName) {
      console.error('[Onboarding] Validation error: Missing required fields');
      console.error('  - organizationName present:', !!organizationName);
      console.error('  - fullName present:', !!fullName);
      return c.json({
        success: false,
        error: 'Bad Request',
        message: 'organizationName and fullName are required',
      }, 400);
    }

    if (organizationName.trim().length === 0) {
      console.error('[Onboarding] Validation error: Empty organization name');
      return c.json({
        success: false,
        error: 'Bad Request',
        message: 'Organization name cannot be empty',
      }, 400);
    }

    if (fullName.trim().length === 0) {
      console.error('[Onboarding] Validation error: Empty full name');
      return c.json({
        success: false,
        error: 'Bad Request',
        message: 'Full name cannot be empty',
      }, 400);
    }

    // STEP 1: Verify user authentication using ANON_KEY (validates user JWT)
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[Onboarding] Auth error:', userError?.message || 'No user returned');
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired JWT token',
        code: 401,
      }, 401);
    }

    console.log('[Onboarding] ✅ User authenticated:', user.id, user.email);

    // STEP 2: Use service role for atomic tenant creation via RPC
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Onboarding] Calling atomic tenant creation function...');
    console.log('[Onboarding] Parameters:', {
      user_id: user.id,
      email: user.email,
      organization: organizationName.trim(),
      full_name: fullName.trim(),
    });

    // Call atomic Postgres function (all-or-nothing transaction)
    const { data: result, error: rpcError } = await serviceClient.rpc(
      'create_tenant_atomic',
      {
        p_user_id: user.id,
        p_user_email: user.email,
        p_organization_name: organizationName.trim(),
        p_full_name: fullName.trim(),
      }
    );

    if (rpcError) {
      console.error('[Onboarding] ❌ RPC Error:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
      });
      
      // Check for specific error types
      if (rpcError.message.includes('already exists') || rpcError.code === '23505') {
        return c.json({
          success: false,
          error: 'Conflict',
          message: 'A tenant with this name already exists for this user',
        }, 409);
      }
      
      return c.json({
        success: false,
        error: 'Database Error',
        message: `Failed to create tenant: ${rpcError.message}`,
        details: rpcError.details || null,
      }, 500);
    }

    if (!result || !result.success) {
      console.error('[Onboarding] ❌ Function returned failure:', result);
      return c.json({
        success: false,
        error: 'Internal Error',
        message: result?.message || 'Tenant creation failed',
      }, 500);
    }

    console.log('[Onboarding] ✅ Tenant created successfully:', {
      tenant_id: result.tenant_id,
      tenant_name: result.tenant_name,
      user_id: result.user_id,
      role: result.role,
    });

    // STEP 3: Return complete tenant context (no need for client to re-query)
    return c.json({
      success: true,
      tenant: {
        id: result.tenant_id,
        name: result.tenant_name,
      },
      membership: {
        tenant_id: result.tenant_id,
        tenant_name: result.tenant_name,
        role: result.role,
      },
      message: 'Organization created successfully',
    }, 201);

  } catch (error) {
    console.error('[Onboarding] ❌ Exception:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, 500);
  }
});

// ============================================================================
// Tenants Endpoints
// ============================================================================

// Debug endpoint to verify tenant context (user_id, tenant_id, role)
app.get('/make-server-fb677d93/tenant-context', async (c) => {
  try {
    const token = getAuthToken(c);
    
    // STEP 1: Verify user authentication using ANON_KEY
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[Tenant Context] Auth error:', userError);
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
      }, 401);
    }

    console.log('[Tenant Context] User verified:', user.id);

    // STEP 2: Use service role for database queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user's profile with tenant info
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, default_tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Tenant Context] Profile fetch error:', profileError);
      return c.json({
        success: false,
        error: 'Database Error',
        message: 'Failed to fetch user profile',
      }, 500);
    }

    // Fetch user's role in their default tenant
    let role = null;
    if (userProfile?.default_tenant_id) {
      const { data: membership, error: memberError } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', userProfile.default_tenant_id)
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        console.error('[Tenant Context] Member role fetch error:', memberError);
      } else {
        role = membership?.role;
      }
    }

    console.log('[Tenant Context] ✅ Context retrieved successfully');

    return c.json({
      success: true,
      user_id: user.id,
      email: user.email,
      tenant_id: userProfile?.tenant_id || null,
      default_tenant_id: userProfile?.default_tenant_id || null,
      role: role,
    }, 200);
  } catch (error) {
    console.error('[Tenant Context] Exception:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.get('/make-server-fb677d93/tenants', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);

    // Get user's tenant memberships
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return c.json({
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 401);
    }

    // Get tenants the user has access to via tenant_members table
    const { data: memberships, error: memberError } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Tenant memberships query error:', memberError);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: memberError.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    const tenantIds = memberships?.map(m => m.tenant_id) || [];

    // Fetch tenant details
    const { data, error, count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact' })
      .in('id', tenantIds)
      .order('name', { ascending: true });

    if (error) {
      console.error('Tenants query error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: { limit: 100, offset: 0, total: count || 0 },
      error: null,
      request_id: crypto.randomUUID(),
    });
  } catch (err) {
    console.error('Tenants endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

// ============================================================================
// Sites Endpoints
// ============================================================================

app.get('/make-server-fb677d93/sites', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);

    const tenantId = c.req.query('tenant_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!tenantId) {
      return c.json({
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 422);
    }

    // Verify user has access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 403);
    }

    const { data, error, count } = await supabase
      .from('sites')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Sites query error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: { limit, offset, total: count || 0 },
      error: null,
      request_id: crypto.randomUUID(),
    });
  } catch (err) {
    console.error('Sites endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

app.post('/make-server-fb677d93/sites', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);
    const siteData = await c.req.json();

    // Extract and validate tenant_id from request
    const tenantId = siteData.tenant_id;
    if (!tenantId) {
      return c.json({
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 422);
    }

    // Verify user has access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 403);
    }

    // Force tenant_id to match verified tenant (security)
    const { data, error } = await supabase
      .from('sites')
      .insert({ ...siteData, tenant_id: tenantId })
      .select()
      .single();

    if (error) {
      console.error('Site creation error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data,
      error: null,
      request_id: crypto.randomUUID(),
    }, 201);
  } catch (err) {
    console.error('Site creation endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

// ============================================================================
// Assets Endpoints
// ============================================================================

app.get('/make-server-fb677d93/assets', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);

    const tenantId = c.req.query('tenant_id');
    const siteId = c.req.query('site_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!tenantId) {
      return c.json({
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 422);
    }

    // Verify user has access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 403);
    }

    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error, count } = await query;

    if (error) {
      console.error('Assets query error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: { limit, offset, total: count || 0 },
      error: null,
      request_id: crypto.randomUUID(),
    });
  } catch (err) {
    console.error('Assets endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

app.post('/make-server-fb677d93/assets', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);
    const assetData = await c.req.json();

    // Extract and validate tenant_id from request
    const tenantId = assetData.tenant_id;
    if (!tenantId) {
      return c.json({
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 422);
    }

    // Verify user has access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 403);
    }

    // Force tenant_id to match verified tenant (security)
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...assetData, tenant_id: tenantId })
      .select()
      .single();

    if (error) {
      console.error('Asset creation error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data,
      error: null,
      request_id: crypto.randomUUID(),
    }, 201);
  } catch (err) {
    console.error('Asset creation endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

// ============================================================================
// Signals Endpoints
// ============================================================================

app.get('/make-server-fb677d93/signals', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);

    const tenantId = c.req.query('tenant_id');
    const siteId = c.req.query('site_id');
    const assetId = c.req.query('asset_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!tenantId) {
      return c.json({
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 422);
    }

    // Verify user has access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 403);
    }

    let query = supabase
      .from('signals')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (siteId) query = query.eq('site_id', siteId);
    if (assetId) query = query.eq('asset_id', assetId);

    const { data, error, count } = await query;

    if (error) {
      console.error('Signals query error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: { limit, offset, total: count || 0 },
      error: null,
      request_id: crypto.randomUUID(),
    });
  } catch (err) {
    console.error('Signals endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

app.post('/make-server-fb677d93/signals', async (c) => {
  try {
    const token = getAuthToken(c);
    const supabase = getSupabaseClient(token);
    const signalData = await c.req.json();

    // Extract and validate tenant_id from request
    const tenantId = signalData.tenant_id;
    if (!tenantId) {
      return c.json({
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 422);
    }

    // Verify user has access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
        data: null,
        request_id: crypto.randomUUID(),
      }, 403);
    }

    // Force tenant_id to match verified tenant (security)
    const { data, error } = await supabase
      .from('signals')
      .insert({ ...signalData, tenant_id: tenantId })
      .select()
      .single();

    if (error) {
      console.error('Signal creation error:', error);
      return c.json({
        error: { code: 'DATABASE_ERROR', message: error.message },
        data: null,
        request_id: crypto.randomUUID(),
      }, 500);
    }

    return c.json({
      data,
      error: null,
      request_id: crypto.randomUUID(),
    }, 201);
  } catch (err) {
    console.error('Signal creation endpoint error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
      data: null,
      request_id: crypto.randomUUID(),
    }, 500);
  }
});

// ============================================================================
// Start Server
// ============================================================================

Deno.serve(app.fetch);