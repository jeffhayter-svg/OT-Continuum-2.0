import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getAuthenticatedUser } from '../utils/auth.ts';

const risks = new Hono();

// List risks for tenant
risks.get('/', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.query('tenant_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const query = supabase
      .from('risk_register')
      .select('*', { count: 'exact' });

    if (tenantId) {
      query.eq('tenant_id', tenantId);
    }

    const { data, error: dbError, count } = await query
      .order('risk_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) {
      console.error('Failed to fetch risks:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch risks',
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
    console.error('List risks exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Create risk
risks.post('/', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const body = await c.req.json();

    const {
      title,
      description,
      likelihood,
      impact,
      status,
      site_id,
      category_id,
      mitigation_plan,
      owner_id,
      identified_date,
      review_date,
      metadata,
    } = body;

    if (!title || !likelihood || !impact) {
      return c.json({
        error: 'Bad Request',
        message: 'Title, likelihood, and impact are required',
      }, 400);
    }

    if (likelihood < 1 || likelihood > 5) {
      return c.json({
        error: 'Bad Request',
        message: 'Likelihood must be between 1 and 5',
      }, 400);
    }

    if (impact < 1 || impact > 5) {
      return c.json({
        error: 'Bad Request',
        message: 'Impact must be between 1 and 5',
      }, 400);
    }

    const riskData: Record<string, unknown> = {
      tenant_id: tenantId,
      title,
      likelihood,
      impact,
      created_by: user.id,
    };

    if (description) riskData.description = description;
    if (status) riskData.status = status;
    if (site_id) riskData.site_id = site_id;
    if (category_id) riskData.category_id = category_id;
    if (mitigation_plan) riskData.mitigation_plan = mitigation_plan;
    if (owner_id) riskData.owner_id = owner_id;
    if (identified_date) riskData.identified_date = identified_date;
    if (review_date) riskData.review_date = review_date;
    if (metadata) riskData.metadata = metadata;

    const { data, error: dbError } = await supabase
      .from('risk_register')
      .insert(riskData)
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create risk:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to create risk',
      }, 500);
    }

    return c.json(data, 201);
  } catch (error) {
    console.error('Create risk exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get risk by ID
risks.get('/:riskId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const riskId = c.req.param('riskId');

    const { data, error: dbError } = await supabase
      .from('risk_register')
      .select('*')
      .eq('id', riskId)
      .eq('tenant_id', tenantId)
      .single();

    if (dbError || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Risk not found',
      }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Get risk exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Update risk
risks.patch('/:riskId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const riskId = c.req.param('riskId');
    const updates = await c.req.json();

    const allowedFields = [
      'title',
      'description',
      'likelihood',
      'impact',
      'status',
      'mitigation_plan',
      'owner_id',
      'review_date',
      'metadata',
    ];

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

    // Validate likelihood and impact if provided
    if (filteredUpdates.likelihood !== undefined) {
      const likelihood = filteredUpdates.likelihood as number;
      if (likelihood < 1 || likelihood > 5) {
        return c.json({
          error: 'Bad Request',
          message: 'Likelihood must be between 1 and 5',
        }, 400);
      }
    }

    if (filteredUpdates.impact !== undefined) {
      const impact = filteredUpdates.impact as number;
      if (impact < 1 || impact > 5) {
        return c.json({
          error: 'Bad Request',
          message: 'Impact must be between 1 and 5',
        }, 400);
      }
    }

    const { data, error: dbError } = await supabase
      .from('risk_register')
      .update(filteredUpdates)
      .eq('id', riskId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (dbError || !data) {
      console.error('Failed to update risk:', dbError);
      return c.json({
        error: 'Not Found',
        message: 'Risk not found or access denied',
      }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Update risk exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Delete risk
risks.delete('/:riskId', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const tenantId = c.req.param('tenantId');
    const riskId = c.req.param('riskId');

    const { error: dbError } = await supabase
      .from('risk_register')
      .delete()
      .eq('id', riskId)
      .eq('tenant_id', tenantId);

    if (dbError) {
      console.error('Failed to delete risk:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to delete risk',
      }, 500);
    }

    return c.body(null, 204);
  } catch (error) {
    console.error('Delete risk exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default risks;