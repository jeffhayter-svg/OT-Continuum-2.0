// ============================================================================
// Billing Edge Function
// Endpoints: GET /billing/account, GET /billing/invoices, GET /billing/invoices/:id
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { requireAuth, requireAdminOrBilling } from '../_shared/auth.ts';
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

    // Route: /billing/account
    if (pathParts[0] === 'billing' && pathParts[1] === 'account') {
      if (req.method === 'GET') {
        return await handleGetAccount(req, requestId);
      }
    }

    // Route: /billing/invoices
    if (pathParts[0] === 'billing' && pathParts[1] === 'invoices') {
      if (pathParts.length === 2 && req.method === 'GET') {
        return await handleListInvoices(req, requestId);
      } else if (pathParts.length === 3 && req.method === 'GET') {
        const invoiceId = pathParts[2];
        return await handleGetInvoice(req, invoiceId, requestId);
      }
    }

    return errorResponse('NOT_FOUND', 'Endpoint not found', undefined, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
});

// ============================================================================
// Handler: Get Billing Account (GET /billing/account)
// ============================================================================

async function handleGetAccount(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  
  // Only admin and billing_admin can access billing
  requireAdminOrBilling(auth);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('billing_accounts')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .single();

  if (error || !data) {
    return errorResponse(
      'NOT_FOUND',
      'Billing account not found',
      undefined,
      requestId
    );
  }

  // Mask sensitive data for billing_admin (non-admin)
  if (auth.role === 'billing_admin') {
    // Billing admin can see most data but not payment method details
    delete data.payment_method_id;
  }

  return successResponse(data, requestId);
}

// ============================================================================
// Handler: List Invoices (GET /billing/invoices)
// ============================================================================

async function handleListInvoices(
  req: Request,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  
  // Only admin and billing_admin can access billing
  requireAdminOrBilling(auth);

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const { limit, offset } = validatePagination(searchParams);

  const status = searchParams.get('status');

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('invoice_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }

  const total = await getTotalCount(
    supabase,
    'invoices',
    auth.tenantId,
    (q) => {
      if (status) q = q.eq('status', status);
      return q;
    }
  );

  return paginatedResponse(data || [], { limit, offset, total }, requestId);
}

// ============================================================================
// Handler: Get Invoice (GET /billing/invoices/:id)
// ============================================================================

async function handleGetInvoice(
  req: Request,
  invoiceId: string,
  requestId: string
): Promise<Response> {
  const auth = requireAuth(req);
  
  // Only admin and billing_admin can access billing
  requireAdminOrBilling(auth);

  const supabase = createServiceClient();

  if (!validationRules.uuid(invoiceId)) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid invoice ID',
      undefined,
      requestId
    );
  }

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (invoiceError || !invoice) {
    return errorResponse('NOT_FOUND', 'Invoice not found', undefined, requestId);
  }

  // Get line items
  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: true });

  if (lineItemsError) {
    console.error('Error fetching line items:', lineItemsError);
    throw lineItemsError;
  }

  // Combine invoice with line items
  const response = {
    ...invoice,
    line_items: lineItems || []
  };

  return successResponse(response, requestId);
}
