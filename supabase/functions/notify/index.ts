// ============================================================================
// Notify Edge Function
// Endpoints: GET /notifications, POST /notifications/:id/read, POST /notifications/read-all
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { requireAuth } from '../_shared/auth.ts';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  handleError,
  handleCORS,
  generateRequestId
} from '../_shared/response.ts';
import {
  validatePagination,
  parseBoolParam,
  validationRules
} from '../_shared/validation.ts';
import { getTotalCount } from '../_shared/database.ts';

serve(async (req) => {
  const requestId = generateRequestId();

  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: /notifications
    if (pathParts[0] === 'notifications') {
      if (pathParts.length === 1 && req.method === 'GET') {
        return await handleList(req, requestId);
      } else if (
        pathParts.length === 2 &&
        pathParts[1] === 'read-all' &&
        req.method === 'POST'
      ) {
        return await handleMarkAllRead(req, requestId);
      } else if (
        pathParts.length === 3 &&
        pathParts[2] === 'read' &&
        req.method === 'POST'
      ) {
        const notificationId = pathParts[1];
        return await handleMarkRead(req, notificationId, requestId);
      }
    }

    return errorResponse('NOT_FOUND', 'Endpoint not found', undefined, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
});

// ============================================================================
// Handler: List Notifications (GET /notifications)
// ============================================================================

async function handleList(req: Request, requestId: string): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const { limit, offset } = validatePagination(searchParams);

  const isRead = parseBoolParam(searchParams.get('is_read'), null as any);
  const type = searchParams.get('type');

  // Users can only see their own notifications
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (isRead !== null) {
    query = query.eq('is_read', isRead);
  }
  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  const total = await getTotalCount(
    supabase,
    'notifications',
    auth.tenantId,
    (q) => {
      q = q.eq('user_id', auth.userId);
      if (isRead !== null) q = q.eq('is_read', isRead);
      if (type) q = q.eq('type', type);
      return q;
    }
  );

  return paginatedResponse(data || [], { limit, offset, total }, requestId);
}

// ============================================================================
// Handler: Mark Notification as Read (POST /notifications/:id/read)
// ============================================================================

async function handleMarkRead(
  req: Request,
  notificationId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  if (!validationRules.uuid(notificationId)) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid notification ID',
      undefined,
      requestId
    );
  }

  // Check if notification exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('tenant_id', auth.tenantId)
    .eq('user_id', auth.userId)
    .single();

  if (fetchError || !existing) {
    return errorResponse(
      'NOT_FOUND',
      'Notification not found',
      undefined,
      requestId
    );
  }

  // Mark as read
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: now
    })
    .eq('id', notificationId)
    .eq('tenant_id', auth.tenantId)
    .eq('user_id', auth.userId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }

  console.log(`[${requestId}] Notification marked as read: ${notificationId}`);

  return successResponse(data, requestId);
}

// ============================================================================
// Handler: Mark All Notifications as Read (POST /notifications/read-all)
// ============================================================================

async function handleMarkAllRead(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  const supabase = createServiceClient();

  const now = new Date().toISOString();

  // Mark all unread notifications as read
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: now
    })
    .eq('tenant_id', auth.tenantId)
    .eq('user_id', auth.userId)
    .eq('is_read', false)
    .select();

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }

  const updated = data?.length || 0;

  console.log(`[${requestId}] Marked ${updated} notifications as read for user ${auth.userId}`);

  return successResponse(
    {
      updated
    },
    requestId
  );
}
