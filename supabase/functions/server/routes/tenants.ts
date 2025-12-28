import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getAuthenticatedUser } from '../utils/auth.ts';

const tenants = new Hono();

// Get user's tenants
tenants.get('/', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const { data, error: dbError } = await supabase
      .from('tenants')
      .select('*')
      .in('id', supabase.rpc('get_user_tenants', { user_uuid: user.id }));

    if (dbError) {
      console.error('Failed to fetch tenants:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch tenants',
      }, 500);
    }

    return c.json({ data: data || [] });
  } catch (error) {
    console.error('List tenants exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Create tenant
tenants.post('/', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const { name, slug } = await c.req.json();

    if (!name || !slug) {
      return c.json({
        error: 'Bad Request',
        message: 'Name and slug are required',
      }, 400);
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return c.json({
        error: 'Bad Request',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      }, 400);
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name, slug })
      .select()
      .single();

    if (tenantError) {
      console.error('Failed to create tenant:', tenantError);
      if (tenantError.code === '23505') {
        return c.json({
          error: 'Conflict',
          message: 'Tenant with this slug already exists',
        }, 409);
      }
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to create tenant',
      }, 500);
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Failed to add tenant member:', memberError);
      // Rollback tenant creation
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to create tenant membership',
      }, 500);
    }

    return c.json(tenant, 201);
  } catch (error) {
    console.error('Create tenant exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get tenant by ID
tenants.get('/:tenantId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');

    const { data, error: dbError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (dbError || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Tenant not found',
      }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Get tenant exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Update tenant
tenants.patch('/:tenantId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const updates = await c.req.json();

    // Only allow specific fields to be updated
    const allowedFields = ['name', 'status', 'metadata'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: Record<string, unknown>, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return c.json({
        error: 'Bad Request',
        message: 'No valid fields to update',
      }, 400);
    }

    const { data, error: dbError } = await supabase
      .from('tenants')
      .update(filteredUpdates)
      .eq('id', tenantId)
      .select()
      .single();

    if (dbError || !data) {
      console.error('Failed to update tenant:', dbError);
      return c.json({
        error: 'Not Found',
        message: 'Tenant not found or access denied',
      }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Update tenant exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default tenants;
