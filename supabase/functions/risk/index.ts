// ============================================================================
// Risk Edge Function
// Endpoints: GET /risks, POST /risks, GET /risks/:id, PATCH /risks/:id
//            GET /risks/:id/events
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { requireAuth, requireRole, requireSiteAccess, AuthContext } from '../_shared/auth.ts';
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
  parseIntParam,
  ValidationError
} from '../_shared/validation.ts';
import {
  applyTenantFilter,
  applySiteFilter,
  getTotalCount,
  resourceExists,
  calculateRiskScore,
  isRiskOwner,
  createRiskEvent
} from '../_shared/database.ts';

serve(async (req) => {
  const requestId = generateRequestId();

  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route based on path and method
    if (pathParts.length === 1 && pathParts[0] === 'risks') {
      if (req.method === 'GET') {
        return await handleList(req, requestId);
      } else if (req.method === 'POST') {
        return await handleCreate(req, requestId);
      }
    } else if (pathParts.length === 2 && pathParts[0] === 'risks') {
      const riskId = pathParts[1];
      if (req.method === 'GET') {
        return await handleGet(req, riskId, requestId);
      } else if (req.method === 'PATCH') {
        return await handleUpdate(req, riskId, requestId);
      }
    } else if (
      pathParts.length === 3 &&
      pathParts[0] === 'risks' &&
      pathParts[2] === 'events'
    ) {
      const riskId = pathParts[1];
      if (req.method === 'GET') {
        return await handleGetEvents(req, riskId, requestId);
      }
    }

    return errorResponse('NOT_FOUND', 'Endpoint not found', undefined, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
});

// ============================================================================
// Handler: List Risks (GET /risks)
// ============================================================================

async function handleList(req: Request, requestId: string): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  // Parse pagination
  const { limit, offset } = validatePagination(searchParams);

  // Parse filters
  const siteId = searchParams.get('site_id');
  const status = searchParams.get('status');
  const decision = searchParams.get('decision');
  const ownerId = searchParams.get('owner_id');
  const minRiskScore = searchParams.get('min_risk_score');

  // Build query with ownership bypass (MS2 requirement)
  // Users can always see risks they own, even if site access is restricted
  let query = supabase
    .from('risk_register')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('risk_score', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply complex RLS logic: site access OR ownership
  // For non-admin/auditor users, filter by (site_ids OR owner_id)
  if (auth.role !== 'admin' && auth.role !== 'auditor') {
    if (auth.siteIds === null) {
      // User has access to all sites
      // No additional filter needed
    } else if (auth.siteIds && auth.siteIds.length > 0) {
      // User can see risks at their sites OR risks they own
      query = query.or(
        `site_id.in.(${auth.siteIds.join(',')}),owner_id.eq.${auth.userId}`
      );
    } else {
      // User has no site access, can only see risks they own
      query = query.eq('owner_id', auth.userId);
    }
  }

  // Apply additional filters
  if (siteId) {
    query = query.eq('site_id', siteId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (decision) {
    query = query.eq('decision', decision);
  }
  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  }
  if (minRiskScore) {
    query = query.gte('risk_score', parseInt(minRiskScore, 10));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching risks:', error);
    throw error;
  }

  // Get total count (simplified for now)
  const total = data?.length || 0;

  return paginatedResponse(data || [], { limit, offset, total }, requestId);
}

// ============================================================================
// Handler: Create Risk (POST /risks)
// ============================================================================

async function handleCreate(req: Request, requestId: string): Promise<Response> {
  const auth = requireAuth(req);
  requireRole(auth, ['admin', 'manager', 'operator', 'contributor']);

  const body = await req.json();

  // Validate input (MS2: owner_id is required)
  const risk = validateInput(body, {
    required: [
      'site_id',
      'risk_id',
      'title',
      'description',
      'severity',
      'likelihood',
      'owner_id'
    ],
    optional: [
      'category',
      'decision',
      'decision_rationale',
      'existing_controls',
      'mitigation_plan',
      'target_completion_date',
      'status'
    ],
    rules: {
      site_id: validationRules.uuid,
      risk_id: validationRules.minLength(1),
      title: validationRules.minLength(1),
      description: validationRules.minLength(1),
      severity: validationRules.enum([
        'catastrophic',
        'major',
        'moderate',
        'minor',
        'negligible'
      ]),
      likelihood: validationRules.enum([
        'almost_certain',
        'likely',
        'possible',
        'unlikely',
        'rare'
      ]),
      owner_id: validationRules.uuid,
      decision: validationRules.enum([
        'accept',
        'mitigate',
        'transfer',
        'avoid',
        'under_review'
      ]),
      status: validationRules.enum(['open', 'monitoring', 'closed', 'escalated'])
    }
  });

  // MS2: Validate decision rationale (required for non-under_review decisions)
  if (
    risk.decision &&
    risk.decision !== 'under_review' &&
    !risk.decision_rationale
  ) {
    throw new ValidationError('decision_rationale is required for this decision', [
      {
        field: 'decision_rationale',
        message: 'Required when decision is accept, mitigate, transfer, or avoid'
      }
    ]);
  }

  // Check site access
  requireSiteAccess(auth, risk.site_id);

  const supabase = createServiceClient();

  // Calculate risk score
  const riskScore = calculateRiskScore(risk.severity, risk.likelihood);

  // Insert risk
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('risk_register')
    .insert({
      tenant_id: auth.tenantId,
      site_id: risk.site_id,
      risk_id: risk.risk_id,
      title: risk.title,
      description: risk.description,
      category: risk.category || null,
      severity: risk.severity,
      likelihood: risk.likelihood,
      risk_score: riskScore,
      owner_id: risk.owner_id,
      decision: risk.decision || 'under_review',
      decision_rationale: risk.decision_rationale || null,
      decision_date: risk.decision && risk.decision !== 'under_review' ? now : null,
      decision_by:
        risk.decision && risk.decision !== 'under_review' ? auth.userId : null,
      status: risk.status || 'open',
      existing_controls: risk.existing_controls || null,
      mitigation_plan: risk.mitigation_plan || null,
      target_completion_date: risk.target_completion_date || null,
      related_work_item_id: null,
      audit_trail: [],
      last_reviewed_at: now,
      next_review_due: null,
      closed_at: null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating risk:', error);
    throw error;
  }

  // Create initial risk event (audit trail)
  await createRiskEvent(supabase, {
    tenant_id: auth.tenantId,
    risk_id: data.id,
    event_type: 'created',
    severity: risk.severity,
    likelihood: risk.likelihood,
    risk_score: riskScore,
    notes: 'Risk created',
    triggered_by: auth.userId
  });

  console.log(`[${requestId}] Risk created: ${data.id} with score ${riskScore}`);

  return successResponse(data, requestId, 201);
}

// ============================================================================
// Handler: Get Risk (GET /risks/:id)
// ============================================================================

async function handleGet(
  req: Request,
  riskId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  // Validate UUID
  if (!validationRules.uuid(riskId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid risk ID', undefined, requestId);
  }

  // Query with ownership bypass
  let query = supabase
    .from('risk_register')
    .select('*')
    .eq('id', riskId)
    .eq('tenant_id', auth.tenantId)
    .single();

  const { data, error } = await query;

  if (error || !data) {
    return errorResponse('NOT_FOUND', 'Risk not found', undefined, requestId);
  }

  // Check access: admin/auditor OR site access OR ownership
  const hasAccess =
    auth.role === 'admin' ||
    auth.role === 'auditor' ||
    auth.siteIds === null ||
    (auth.siteIds && auth.siteIds.includes(data.site_id)) ||
    data.owner_id === auth.userId;

  if (!hasAccess) {
    return errorResponse(
      'NOT_AUTHORIZED',
      'Access to this risk is not allowed',
      undefined,
      requestId
    );
  }

  return successResponse(data, requestId);
}

// ============================================================================
// Handler: Update Risk (PATCH /risks/:id)
// ============================================================================

async function handleUpdate(
  req: Request,
  riskId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  // Validate UUID
  if (!validationRules.uuid(riskId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid risk ID', undefined, requestId);
  }

  // Check if risk exists and get current data
  const { data: existingRisk, error: fetchError } = await supabase
    .from('risk_register')
    .select('*')
    .eq('id', riskId)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (fetchError || !existingRisk) {
    return errorResponse('NOT_FOUND', 'Risk not found', undefined, requestId);
  }

  // MS2: Risk owner can ALWAYS update their risk (ownership bypass)
  const isOwner = existingRisk.owner_id === auth.userId;
  const isAdmin = auth.role === 'admin' || auth.role === 'manager';

  if (!isOwner && !isAdmin) {
    return errorResponse(
      'NOT_AUTHORIZED',
      'Only the risk owner or admin can update this risk',
      undefined,
      requestId
    );
  }

  const body = await req.json();

  // Validate input
  const updates = validateInput(body, {
    optional: [
      'title',
      'description',
      'category',
      'severity',
      'likelihood',
      'owner_id',
      'decision',
      'decision_rationale',
      'status',
      'existing_controls',
      'mitigation_plan',
      'target_completion_date',
      'next_review_due'
    ],
    rules: {
      severity: validationRules.enum([
        'catastrophic',
        'major',
        'moderate',
        'minor',
        'negligible'
      ]),
      likelihood: validationRules.enum([
        'almost_certain',
        'likely',
        'possible',
        'unlikely',
        'rare'
      ]),
      owner_id: validationRules.uuid,
      decision: validationRules.enum([
        'accept',
        'mitigate',
        'transfer',
        'avoid',
        'under_review'
      ]),
      status: validationRules.enum(['open', 'monitoring', 'closed', 'escalated'])
    }
  });

  // MS2: Validate decision rationale
  if (
    updates.decision &&
    updates.decision !== 'under_review' &&
    !updates.decision_rationale
  ) {
    throw new ValidationError('decision_rationale is required for this decision');
  }

  // Calculate new risk score if severity or likelihood changed
  const newSeverity = updates.severity || existingRisk.severity;
  const newLikelihood = updates.likelihood || existingRisk.likelihood;
  const newRiskScore = calculateRiskScore(newSeverity, newLikelihood);
  const riskScoreChanged = newRiskScore !== existingRisk.risk_score;

  // Update risk
  const now = new Date().toISOString();
  const updateData: any = {
    ...updates,
    risk_score: newRiskScore,
    updated_at: now
  };

  // Update decision metadata if decision changed
  if (updates.decision && updates.decision !== existingRisk.decision) {
    updateData.decision_date = now;
    updateData.decision_by = auth.userId;
  }

  const { data, error } = await supabase
    .from('risk_register')
    .update(updateData)
    .eq('id', riskId)
    .eq('tenant_id', auth.tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating risk:', error);
    throw error;
  }

  // Create risk event if risk score changed (audit trail)
  if (riskScoreChanged) {
    await createRiskEvent(supabase, {
      tenant_id: auth.tenantId,
      risk_id: riskId,
      event_type: 'score_changed',
      severity: newSeverity,
      likelihood: newLikelihood,
      risk_score: newRiskScore,
      previous_severity: existingRisk.severity,
      previous_likelihood: existingRisk.likelihood,
      previous_risk_score: existingRisk.risk_score,
      notes: `Risk score changed from ${existingRisk.risk_score} to ${newRiskScore}`,
      triggered_by: auth.userId
    });
  }

  // Create event for decision changes
  if (updates.decision && updates.decision !== existingRisk.decision) {
    await createRiskEvent(supabase, {
      tenant_id: auth.tenantId,
      risk_id: riskId,
      event_type: 'decision_changed',
      severity: newSeverity,
      likelihood: newLikelihood,
      risk_score: newRiskScore,
      notes: `Decision changed from ${existingRisk.decision} to ${updates.decision}`,
      triggered_by: auth.userId
    });
  }

  console.log(`[${requestId}] Risk updated: ${riskId} by ${auth.userId}`);

  return successResponse(data, requestId);
}

// ============================================================================
// Handler: Get Risk Events (GET /risks/:id/events)
// ============================================================================

async function handleGetEvents(
  req: Request,
  riskId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  // Validate UUID
  if (!validationRules.uuid(riskId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid risk ID', undefined, requestId);
  }

  // Check if risk exists and user has access
  const hasAccess = await isRiskOwner(supabase, riskId, auth.userId, auth.tenantId);
  
  if (!hasAccess && auth.role !== 'admin' && auth.role !== 'auditor') {
    return errorResponse(
      'NOT_AUTHORIZED',
      'Access to this risk is not allowed',
      undefined,
      requestId
    );
  }

  // Get risk events
  const url = new URL(req.url);
  const { limit, offset } = validatePagination(url.searchParams);

  const { data, error } = await supabase
    .from('risk_events')
    .select('*')
    .eq('risk_id', riskId)
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching risk events:', error);
    throw error;
  }

  const total = data?.length || 0;

  return paginatedResponse(data || [], { limit, offset, total }, requestId);
}
