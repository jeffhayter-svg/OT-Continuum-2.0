// ============================================================================
// Workflow Edge Function
// Endpoints: GET /workflows, POST /workflows, GET /workflows/:id, PATCH /workflows/:id
//            GET /work-items, POST /work-items, GET /work-items/:id, PATCH /work-items/:id
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { requireAuth, requireRole, requireSiteAccess } from '../_shared/auth.ts';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  handleError,
  handleCORS,
  generateRequestId
} from '../_shared/response.ts';
import {
  validateInput,
  validatePagination,
  validationRules,
  ValidationError
} from '../_shared/validation.ts';
import {
  applyTenantFilter,
  applySiteFilter,
  getTotalCount,
  resourceExists,
  isWorkItemAssignee
} from '../_shared/database.ts';

serve(async (req) => {
  const requestId = generateRequestId();

  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: /workflows
    if (pathParts[0] === 'workflows') {
      if (pathParts.length === 1) {
        if (req.method === 'GET') {
          return await handleListWorkflows(req, requestId);
        } else if (req.method === 'POST') {
          return await handleCreateWorkflow(req, requestId);
        }
      } else if (pathParts.length === 2) {
        const workflowId = pathParts[1];
        if (req.method === 'GET') {
          return await handleGetWorkflow(req, workflowId, requestId);
        } else if (req.method === 'PATCH') {
          return await handleUpdateWorkflow(req, workflowId, requestId);
        }
      }
    }

    // Route: /work-items
    if (pathParts[0] === 'work-items') {
      if (pathParts.length === 1) {
        if (req.method === 'GET') {
          return await handleListWorkItems(req, requestId);
        } else if (req.method === 'POST') {
          return await handleCreateWorkItem(req, requestId);
        }
      } else if (pathParts.length === 2) {
        const workItemId = pathParts[1];
        if (req.method === 'GET') {
          return await handleGetWorkItem(req, workItemId, requestId);
        } else if (req.method === 'PATCH') {
          return await handleUpdateWorkItem(req, workItemId, requestId);
        }
      }
    }

    return errorResponse('NOT_FOUND', 'Endpoint not found', undefined, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
});

// ============================================================================
// WORKFLOWS
// ============================================================================

async function handleListWorkflows(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const { limit, offset } = validatePagination(searchParams);

  const workflowType = searchParams.get('workflow_type');
  const isActive = searchParams.get('is_active');

  let query = supabase
    .from('workflows')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (workflowType) {
    query = query.eq('workflow_type', workflowType);
  }
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }

  const total = await getTotalCount(
    supabase,
    'workflows',
    auth.tenantId,
    (q) => {
      if (workflowType) q = q.eq('workflow_type', workflowType);
      if (isActive !== null) q = q.eq('is_active', isActive === 'true');
      return q;
    }
  );

  return paginatedResponse(data || [], { limit, offset, total }, requestId);
}

async function handleCreateWorkflow(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  requireRole(auth, ['admin', 'manager']);

  const body = await req.json();

  const workflow = validateInput(body, {
    required: ['name', 'workflow_type', 'definition'],
    optional: ['description', 'is_template', 'parent_workflow_id'],
    rules: {
      name: validationRules.minLength(1),
      workflow_type: validationRules.enum([
        'moc',
        'approval',
        'inspection',
        'incident',
        'audit',
        'custom'
      ]),
      definition: (v: any) => 
        typeof v === 'object' ? null : 'Must be a valid JSON object'
    }
  });

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      tenant_id: auth.tenantId,
      name: workflow.name,
      description: workflow.description || null,
      workflow_type: workflow.workflow_type,
      definition: workflow.definition,
      is_template: workflow.is_template || false,
      is_active: true,
      version: 1,
      parent_workflow_id: workflow.parent_workflow_id || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }

  console.log(`[${requestId}] Workflow created: ${data.id}`);

  return successResponse(data, requestId, 201);
}

async function handleGetWorkflow(
  req: Request,
  workflowId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  if (!validationRules.uuid(workflowId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid workflow ID', undefined, requestId);
  }

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (error || !data) {
    return errorResponse('NOT_FOUND', 'Workflow not found', undefined, requestId);
  }

  return successResponse(data, requestId);
}

async function handleUpdateWorkflow(
  req: Request,
  workflowId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  requireRole(auth, ['admin', 'manager']);

  const supabase = createServiceClient();

  if (!validationRules.uuid(workflowId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid workflow ID', undefined, requestId);
  }

  const exists = await resourceExists(
    supabase,
    'workflows',
    workflowId,
    auth.tenantId
  );
  if (!exists) {
    return errorResponse('NOT_FOUND', 'Workflow not found', undefined, requestId);
  }

  const body = await req.json();

  const updates = validateInput(body, {
    optional: ['name', 'description', 'definition', 'is_active'],
    rules: {
      definition: (v: any) => 
        typeof v === 'object' ? null : 'Must be a valid JSON object'
    }
  });

  const { data, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', workflowId)
    .eq('tenant_id', auth.tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workflow:', error);
    throw error;
  }

  console.log(`[${requestId}] Workflow updated: ${workflowId}`);

  return successResponse(data, requestId);
}

// ============================================================================
// WORK ITEMS
// ============================================================================

async function handleListWorkItems(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const { limit, offset } = validatePagination(searchParams);

  const siteId = searchParams.get('site_id');
  const status = searchParams.get('status');
  const assignedTo = searchParams.get('assigned_to');
  const priority = searchParams.get('priority');

  let query = supabase
    .from('work_items')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply site filter with assignment bypass:
  // Users can see work items at their sites OR work items assigned to them
  if (auth.role !== 'admin' && auth.role !== 'auditor') {
    if (auth.siteIds === null) {
      // Access to all sites
    } else if (auth.siteIds && auth.siteIds.length > 0) {
      // Can see work items at their sites OR assigned to them
      query = query.or(
        `site_id.in.(${auth.siteIds.join(',')}),assigned_to.eq.${auth.userId}`
      );
    } else {
      // No site access, only see work items assigned to them
      query = query.eq('assigned_to', auth.userId);
    }
  }

  if (siteId) {
    query = query.eq('site_id', siteId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching work items:', error);
    throw error;
  }

  const total = data?.length || 0;

  return paginatedResponse(data || [], { limit, offset, total }, requestId);
}

async function handleCreateWorkItem(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  requireRole(auth, ['admin', 'manager', 'operator', 'contributor']);

  const body = await req.json();

  const workItem = validateInput(body, {
    required: ['title', 'priority'],
    optional: [
      'site_id',
      'workflow_id',
      'description',
      'work_item_type',
      'assigned_to',
      'due_at',
      'data'
    ],
    rules: {
      site_id: validationRules.uuid,
      workflow_id: validationRules.uuid,
      title: validationRules.minLength(1),
      work_item_type: validationRules.enum([
        'moc',
        'approval',
        'inspection',
        'incident',
        'audit',
        'custom'
      ]),
      priority: validationRules.enum(['urgent', 'high', 'medium', 'low']),
      assigned_to: validationRules.uuid,
      data: (v: any) => 
        typeof v === 'object' ? null : 'Must be a valid JSON object'
    }
  });

  // Check site access if site_id provided
  if (workItem.site_id) {
    requireSiteAccess(auth, workItem.site_id);
  }

  const supabase = createServiceClient();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('work_items')
    .insert({
      tenant_id: auth.tenantId,
      site_id: workItem.site_id || null,
      workflow_id: workItem.workflow_id || null,
      title: workItem.title,
      description: workItem.description || null,
      work_item_type: workItem.work_item_type || 'custom',
      status: 'draft',
      priority: workItem.priority,
      assigned_to: workItem.assigned_to || null,
      created_by: auth.userId,
      due_at: workItem.due_at || null,
      started_at: null,
      completed_at: null,
      data: workItem.data || {},
      audit_trail: [
        {
          timestamp: now,
          user_id: auth.userId,
          action: 'created',
          changes: {}
        }
      ]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating work item:', error);
    throw error;
  }

  console.log(`[${requestId}] Work item created: ${data.id}`);

  return successResponse(data, requestId, 201);
}

async function handleGetWorkItem(
  req: Request,
  workItemId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  if (!validationRules.uuid(workItemId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid work item ID', undefined, requestId);
  }

  const { data, error } = await supabase
    .from('work_items')
    .select('*')
    .eq('id', workItemId)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (error || !data) {
    return errorResponse('NOT_FOUND', 'Work item not found', undefined, requestId);
  }

  // Check access: admin OR site access OR assignee
  const hasAccess =
    auth.role === 'admin' ||
    auth.role === 'auditor' ||
    auth.siteIds === null ||
    (data.site_id && auth.siteIds && auth.siteIds.includes(data.site_id)) ||
    data.assigned_to === auth.userId;

  if (!hasAccess) {
    return errorResponse(
      'NOT_AUTHORIZED',
      'Access to this work item is not allowed',
      undefined,
      requestId
    );
  }

  return successResponse(data, requestId);
}

async function handleUpdateWorkItem(
  req: Request,
  workItemId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  if (!validationRules.uuid(workItemId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid work item ID', undefined, requestId);
  }

  // Get existing work item
  const { data: existingItem, error: fetchError } = await supabase
    .from('work_items')
    .select('*')
    .eq('id', workItemId)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (fetchError || !existingItem) {
    return errorResponse('NOT_FOUND', 'Work item not found', undefined, requestId);
  }

  // Check access: admin OR assignee
  const isAssignee = existingItem.assigned_to === auth.userId;
  const isAdmin = auth.role === 'admin' || auth.role === 'manager';

  if (!isAssignee && !isAdmin) {
    return errorResponse(
      'NOT_AUTHORIZED',
      'Only the assignee or admin can update this work item',
      undefined,
      requestId
    );
  }

  const body = await req.json();

  const updates = validateInput(body, {
    optional: [
      'title',
      'description',
      'status',
      'priority',
      'assigned_to',
      'due_at',
      'data'
    ],
    rules: {
      status: validationRules.enum([
        'draft',
        'pending',
        'in_progress',
        'blocked',
        'completed',
        'cancelled',
        'failed'
      ]),
      priority: validationRules.enum(['urgent', 'high', 'medium', 'low']),
      assigned_to: validationRules.uuid
    }
  });

  // Add audit trail entry
  const now = new Date().toISOString();
  const auditTrail = existingItem.audit_trail || [];
  auditTrail.push({
    timestamp: now,
    user_id: auth.userId,
    action: 'updated',
    changes: updates
  });

  // Set timestamps based on status changes
  const updateData: any = {
    ...updates,
    audit_trail: auditTrail,
    updated_at: now
  };

  if (updates.status === 'in_progress' && !existingItem.started_at) {
    updateData.started_at = now;
  }
  if (
    updates.status === 'completed' ||
    updates.status === 'cancelled' ||
    updates.status === 'failed'
  ) {
    updateData.completed_at = now;
  }

  const { data, error } = await supabase
    .from('work_items')
    .update(updateData)
    .eq('id', workItemId)
    .eq('tenant_id', auth.tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating work item:', error);
    throw error;
  }

  console.log(`[${requestId}] Work item updated: ${workItemId} by ${auth.userId}`);

  return successResponse(data, requestId);
}
