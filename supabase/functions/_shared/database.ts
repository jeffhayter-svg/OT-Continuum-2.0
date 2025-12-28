// ============================================================================
// Shared Library: Database Helpers
// ============================================================================

import { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { AuthContext } from './auth.ts';

/**
 * Apply tenant filter to query
 */
export function applyTenantFilter(
  query: any,
  tenantId: string
) {
  return query.eq('tenant_id', tenantId);
}

/**
 * Apply site filter to query based on user's access
 */
export function applySiteFilter(
  query: any,
  auth: AuthContext,
  siteIdField = 'site_id'
) {
  // Admin and auditor have access to all sites
  if (auth.role === 'admin' || auth.role === 'auditor') {
    return query;
  }

  // Users with null site_ids have access to all sites
  if (auth.siteIds === null) {
    return query;
  }

  // Filter by user's accessible sites
  if (auth.siteIds && auth.siteIds.length > 0) {
    return query.in(siteIdField, auth.siteIds);
  }

  // No site access - return empty result
  return query.eq(siteIdField, '00000000-0000-0000-0000-000000000000');
}

/**
 * Get total count for pagination
 */
export async function getTotalCount(
  supabase: SupabaseClient,
  table: string,
  tenantId: string,
  additionalFilters?: (query: any) => any
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (additionalFilters) {
    query = additionalFilters(query);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error getting count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Check if resource exists
 */
export async function resourceExists(
  supabase: SupabaseClient,
  table: string,
  id: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  return !error && data !== null;
}

/**
 * Insert audit trail record
 */
export async function insertAuditTrail(
  supabase: SupabaseClient,
  data: {
    tenant_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    user_id: string;
    changes?: any;
    metadata?: any;
  }
): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      ...data,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to insert audit trail:', error);
    // Don't throw - audit trail failure shouldn't break the operation
  }
}

/**
 * Create risk event for audit trail
 */
export async function createRiskEvent(
  supabase: SupabaseClient,
  data: {
    tenant_id: string;
    risk_id: string;
    event_type: string;
    severity: string;
    likelihood: string;
    risk_score: number;
    previous_severity?: string;
    previous_likelihood?: string;
    previous_risk_score?: number;
    notes?: string;
    triggered_by: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('risk_events')
    .insert(data);

  if (error) {
    console.error('Failed to create risk event:', error);
    throw error;
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse(value: string | null, fallback: any = null): any {
  if (!value) return fallback;
  
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Build WHERE clause for filters
 */
export function applyFilters(
  query: any,
  filters: Record<string, any>
): any {
  let result = query;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        result = result.in(key, value);
      } else {
        result = result.eq(key, value);
      }
    }
  }

  return result;
}

/**
 * Calculate risk score from severity and likelihood
 */
export function calculateRiskScore(
  severity: string,
  likelihood: string
): number {
  const severityScores: Record<string, number> = {
    catastrophic: 5,
    major: 4,
    moderate: 3,
    minor: 2,
    negligible: 1
  };

  const likelihoodScores: Record<string, number> = {
    almost_certain: 5,
    likely: 4,
    possible: 3,
    unlikely: 2,
    rare: 1
  };

  return (severityScores[severity] || 1) * (likelihoodScores[likelihood] || 1);
}

/**
 * Check if user is risk owner
 */
export async function isRiskOwner(
  supabase: SupabaseClient,
  riskId: string,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('risk_register')
    .select('owner_id')
    .eq('id', riskId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) return false;
  
  return data.owner_id === userId;
}

/**
 * Check if user is work item assignee
 */
export async function isWorkItemAssignee(
  supabase: SupabaseClient,
  workItemId: string,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('work_items')
    .select('assigned_to')
    .eq('id', workItemId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) return false;
  
  return data.assigned_to === userId;
}
