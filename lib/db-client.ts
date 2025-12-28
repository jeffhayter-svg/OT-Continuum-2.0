import { supabase } from './supabase-client';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Database Client with automatic tenant scoping and RLS error handling
 * 
 * Features:
 * - Automatically includes tenant_id and created_by on inserts
 * - Handles RLS errors gracefully (401/403)
 * - Logs errors to AuthDebugPanel in development
 * - Never queries cross-tenant data (relies on RLS)
 */

export interface TenantScopedInsert {
  tenant_id?: string; // Will be set if not provided
  created_by?: string; // Will be set if not provided
  [key: string]: any;
}

export interface DbError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
  table?: string;
  action?: string;
  isRlsError: boolean;
}

export class DbClient {
  private tenantId: string | null = null;
  private userId: string | null = null;
  private errorListeners: Array<(error: DbError) => void> = [];

  /**
   * Set the tenant context for all subsequent operations
   * Should be called after tenant resolution
   */
  setTenantContext(tenantId: string, userId: string) {
    const userIdPreview = userId ? userId.slice(0, 8) + '...' : 'undefined';
    console.log('[DbClient] Setting tenant context:', { tenantId, userId: userIdPreview });
    this.tenantId = tenantId;
    this.userId = userId;
  }

  /**
   * Clear tenant context (on logout)
   */
  clearTenantContext() {
    console.log('[DbClient] Clearing tenant context');
    this.tenantId = null;
    this.userId = null;
  }

  /**
   * Register an error listener (for debug panel)
   */
  onError(listener: (error: DbError) => void) {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify error listeners
   */
  private notifyError(error: DbError) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('[DbClient] Error in error listener:', err);
      }
    });
  }

  /**
   * Check if error is an RLS permission error
   */
  private isRlsError(error: PostgrestError): boolean {
    // Check for common RLS error codes and messages
    if (error.code === '42501') return true; // insufficient_privilege
    if (error.code === 'PGRST301') return true; // JWT expired
    if (error.code === '42P01') return true; // undefined_table (might be RLS hiding table)
    
    const message = error.message?.toLowerCase() || '';
    if (message.includes('permission denied')) return true;
    if (message.includes('policy')) return true;
    if (message.includes('row level security')) return true;
    if (message.includes('rls')) return true;
    if (message.includes('not authorized')) return true;
    if (message.includes('forbidden')) return true;
    
    return false;
  }

  /**
   * Handle Postgres error and convert to user-friendly format
   */
  private handleError(error: PostgrestError, table: string, action: string): DbError {
    const isRls = this.isRlsError(error);
    
    const dbError: DbError = {
      code: error.code || 'UNKNOWN',
      message: error.message || 'An error occurred',
      details: error.details || undefined,
      hint: error.hint || undefined,
      table,
      action,
      isRlsError: isRls,
    };

    // Log to console
    if (isRls) {
      console.group('🚫 [DbClient] RLS ERROR');
      console.error('Permission denied:', error.message);
      console.log('Table:', table);
      console.log('Action:', action);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      console.log('Hint:', error.hint);
      console.groupEnd();
    } else {
      console.error(`[DbClient] Error in ${action} on ${table}:`, error);
    }

    // Notify listeners (e.g., debug panel)
    this.notifyError(dbError);

    return dbError;
  }

  /**
   * Ensure tenant context is set
   */
  private ensureTenantContext(): { tenantId: string; userId: string } {
    if (!this.tenantId || !this.userId) {
      throw new Error('Tenant context not set. Call setTenantContext() first.');
    }
    return { tenantId: this.tenantId, userId: this.userId };
  }

  /**
   * Insert with automatic tenant_id and created_by
   */
  async insert<T>(
    table: string,
    data: TenantScopedInsert | TenantScopedInsert[]
  ): Promise<{ data: T | null; error: DbError | null }> {
    try {
      const { tenantId, userId } = this.ensureTenantContext();

      // Ensure data is array for consistent processing
      const records = Array.isArray(data) ? data : [data];
      
      // Add tenant_id and created_by to each record
      const recordsWithContext = records.map(record => ({
        ...record,
        tenant_id: record.tenant_id || tenantId,
        created_by: record.created_by || userId,
      }));

      console.log(`[DbClient] Insert into ${table}:`, {
        count: recordsWithContext.length,
        tenant_id: tenantId.slice(0, 8) + '...',
        created_by: userId.slice(0, 8) + '...',
      });

      // For single insert, use .single() to get back one record
      const isArray = Array.isArray(data);
      
      if (isArray) {
        const { data: result, error } = await supabase
          .from(table)
          .insert(recordsWithContext)
          .select();

        if (error) {
          return { data: null, error: this.handleError(error, table, 'insert') };
        }

        return { data: result as T, error: null };
      } else {
        const { data: result, error } = await supabase
          .from(table)
          .insert(recordsWithContext)
          .select()
          .single();

        if (error) {
          return { data: null, error: this.handleError(error, table, 'insert') };
        }

        return { data: result as T, error: null };
      }
    } catch (err) {
      console.error('[DbClient] Insert exception:', err);
      return {
        data: null,
        error: {
          code: 'EXCEPTION',
          message: err instanceof Error ? err.message : 'Unknown error',
          isRlsError: false,
          table,
          action: 'insert',
        },
      };
    }
  }

  /**
   * Insert multiple records with automatic tenant_id and created_by
   */
  async insertMany<T>(
    table: string,
    data: TenantScopedInsert[]
  ): Promise<{ data: T[] | null; error: DbError | null }> {
    try {
      const { tenantId, userId } = this.ensureTenantContext();

      // Add tenant_id and created_by to each record
      const recordsWithContext = data.map(record => ({
        ...record,
        tenant_id: record.tenant_id || tenantId,
        created_by: record.created_by || userId,
      }));

      console.log(`[DbClient] Insert many into ${table}:`, {
        count: recordsWithContext.length,
        tenant_id: tenantId.slice(0, 8) + '...',
        created_by: userId.slice(0, 8) + '...',
      });

      const { data: result, error } = await supabase
        .from(table)
        .insert(recordsWithContext)
        .select();

      if (error) {
        return { data: null, error: this.handleError(error, table, 'insertMany') };
      }

      return { data: result as T[], error: null };
    } catch (err) {
      console.error('[DbClient] InsertMany exception:', err);
      return {
        data: null,
        error: {
          code: 'EXCEPTION',
          message: err instanceof Error ? err.message : 'Unknown error',
          isRlsError: false,
          table,
          action: 'insertMany',
        },
      };
    }
  }

  /**
   * Select with automatic RLS error handling
   * NOTE: Never filter by tenant_id - let RLS handle it!
   */
  async select<T>(
    table: string,
    columns = '*'
  ): Promise<{ data: T[] | null; error: DbError | null }> {
    try {
      console.log(`[DbClient] Select from ${table}`);

      const { data, error } = await supabase
        .from(table)
        .select(columns);

      if (error) {
        return { data: null, error: this.handleError(error, table, 'select') };
      }

      return { data: data as T[], error: null };
    } catch (err) {
      console.error('[DbClient] Select exception:', err);
      return {
        data: null,
        error: {
          code: 'EXCEPTION',
          message: err instanceof Error ? err.message : 'Unknown error',
          isRlsError: false,
          table,
          action: 'select',
        },
      };
    }
  }

  /**
   * Update with automatic RLS error handling
   */
  async update<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<{ data: T | null; error: DbError | null }> {
    try {
      console.log(`[DbClient] Update ${table} record ${id.slice(0, 8)}...`);

      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error, table, 'update') };
      }

      return { data: data as T, error: null };
    } catch (err) {
      console.error('[DbClient] Update exception:', err);
      return {
        data: null,
        error: {
          code: 'EXCEPTION',
          message: err instanceof Error ? err.message : 'Unknown error',
          isRlsError: false,
          table,
          action: 'update',
        },
      };
    }
  }

  /**
   * Delete with automatic RLS error handling
   */
  async delete(
    table: string,
    id: string
  ): Promise<{ error: DbError | null }> {
    try {
      console.log(`[DbClient] Delete from ${table} record ${id.slice(0, 8)}...`);

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return { error: this.handleError(error, table, 'delete') };
      }

      return { error: null };
    } catch (err) {
      console.error('[DbClient] Delete exception:', err);
      return {
        error: {
          code: 'EXCEPTION',
          message: err instanceof Error ? err.message : 'Unknown error',
          isRlsError: false,
          table,
          action: 'delete',
        },
      };
    }
  }

  /**
   * Query builder for complex queries
   * Returns Supabase query builder with automatic error handling
   */
  query<T>(table: string) {
    return {
      select: async (columns = '*') => {
        return this.select<T>(table, columns);
      },
      insert: async (data: TenantScopedInsert | TenantScopedInsert[]) => {
        return this.insert<T>(table, data);
      },
      update: async (id: string, updates: Partial<T>) => {
        return this.update<T>(table, id, updates);
      },
      delete: async (id: string) => {
        return this.delete(table, id);
      },
    };
  }

  /**
   * Execute RPC with error handling
   */
  async rpc<T>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<{ data: T | null; error: DbError | null }> {
    try {
      console.log(`[DbClient] RPC call: ${functionName}`, params || {});

      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        return { data: null, error: this.handleError(error, 'rpc', functionName) };
      }

      return { data: data as T, error: null };
    } catch (err) {
      console.error('[DbClient] RPC exception:', err);
      return {
        data: null,
        error: {
          code: 'EXCEPTION',
          message: err instanceof Error ? err.message : 'Unknown error',
          isRlsError: false,
          table: 'rpc',
          action: functionName,
        },
      };
    }
  }
}

// Export singleton instance
export const dbClient = new DbClient();

/**
 * Hook to use db client in React components
 */
export function useDbClient() {
  return dbClient;
}