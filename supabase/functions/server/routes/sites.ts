import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getAuthenticatedUser } from '../utils/auth.ts';

const sites = new Hono();

// List sites for tenant
sites.get('/', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.query('tenant_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const query = supabase
      .from('sites')
      .select('*', { count: 'exact' });

    if (tenantId) {
      query.eq('tenant_id', tenantId);
    }

    const { data, error: dbError, count } = await query
      .range(offset, offset + limit - 1);

    if (dbError) {
      console.error('Failed to fetch sites:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch sites',
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('List sites exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Create site
sites.post('/', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const body = await c.req.json();

    const { name, location, site_code, status, metadata } = body;

    if (!name) {
      return c.json({
        error: 'Bad Request',
        message: 'Name is required',
      }, 400);
    }

    const siteData: Record<string, unknown> = {
      tenant_id: tenantId,
      name,
      created_by: user.id,
    };

    if (location) siteData.location = location;
    if (site_code) siteData.site_code = site_code;
    if (status) siteData.status = status;
    if (metadata) siteData.metadata = metadata;

    const { data, error: dbError } = await supabase
      .from('sites')
      .insert(siteData)
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create site:', dbError);
      if (dbError.code === '23505') {
        return c.json({
          error: 'Conflict',
          message: 'Site code already exists in this tenant',
        }, 409);
      }
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to create site',
      }, 500);
    }

    return c.json(data, 201);
  } catch (error) {
    console.error('Create site exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get site by ID
sites.get('/:siteId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const siteId = c.req.param('siteId');

    const { data, error: dbError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('tenant_id', tenantId)
      .single();

    if (dbError || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Site not found',
      }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Get site exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Update site
sites.patch('/:siteId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const siteId = c.req.param('siteId');
    const updates = await c.req.json();

    const allowedFields = ['name', 'location', 'status', 'metadata'];
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
      .from('sites')
      .update(filteredUpdates)
      .eq('id', siteId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (dbError || !data) {
      console.error('Failed to update site:', dbError);
      return c.json({
        error: 'Not Found',
        message: 'Site not found or access denied',
      }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Update site exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Delete site
sites.delete('/:siteId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const siteId = c.req.param('siteId');

    const { error: dbError } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId)
      .eq('tenant_id', tenantId);

    if (dbError) {
      console.error('Failed to delete site:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to delete site',
      }, 500);
    }

    return c.body(null, 204);
  } catch (error) {
    console.error('Delete site exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default sites;