// ============================================================================
// Types
// ============================================================================

import { supabase, supabaseConfigValid, supabaseUrl } from '../../../../lib/supabase-client';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { decodeJWT, validateJWT, logJWT } from './jwt-debug-utils';
import { edgeFetchJson, isNoSessionError } from '../../../../lib/edgeFetch';

// ============================================================================
// Configuration
// ============================================================================

const supabaseAnonKey = publicAnonKey;
const API_BASE_URL = `${supabaseUrl}/functions/v1/signals`;

// Debug flags (can be set via localStorage)
const DEBUG_MODE = typeof window !== 'undefined' && localStorage.getItem('DEBUG_API') === 'true';
const FULL_JWT_DEBUG = typeof window !== 'undefined' && localStorage.getItem('DEBUG_JWT') === 'true';

// ============================================================================
// Export Supabase Client (from singleton) and Config
// ============================================================================

export { supabase, supabaseConfigValid, supabaseUrl };

// ============================================================================
// Types
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface Site {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  location?: string;
  site_type?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  site_id: string;
  name: string;
  description?: string;
  asset_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: 'operational' | 'maintenance' | 'offline' | 'decommissioned';
  installed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  tenant_id: string;
  site_id: string;
  signal_type: string;
  source: string;
  tag?: string;
  value: number;
  unit: string;
  status: 'raw' | 'validated' | 'classified' | 'correlated';
  quality_score?: number;
  classification?: string;
  correlation_group?: string;
  measured_at: string;
  received_at: string;
  created_at: string;
}

export interface Risk {
  id: string;
  tenant_id: string;
  site_id: string;
  risk_id: string;
  title: string;
  description: string;
  category: string;
  severity: 'catastrophic' | 'major' | 'moderate' | 'minor' | 'negligible';
  likelihood: 'almost_certain' | 'likely' | 'possible' | 'unlikely' | 'rare';
  risk_score: number;
  owner_id: string;
  decision: 'under_review' | 'accept' | 'mitigate' | 'transfer' | 'avoid';
  decision_rationale?: string;
  decision_date?: string;
  decision_by?: string;
  status: 'open' | 'in_progress' | 'closed';
  existing_controls?: string;
  mitigation_plan?: string;
  target_completion_date?: string;
  related_work_item_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  tenant_id: string;
  site_id: string;
  workflow_id?: string;
  title: string;
  description?: string;
  work_item_type: string;
  status: 'draft' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  created_by: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RiskEvent {
  id: string;
  tenant_id: string;
  risk_id: string;
  event_type: string;
  severity?: string;
  likelihood?: string;
  risk_score?: number;
  previous_severity?: string;
  previous_likelihood?: string;
  previous_risk_score?: number;
  notes?: string;
  triggered_by: string;
  created_at: string;
}

export interface UserTenant {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  tenants: UserTenant[];
  default_tenant_id?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  industry?: string;
  region?: string;
}

export interface CreateOrganizationResponse {
  tenant: {
    id: string;
    name: string;
  };
  membership: {
    role: string;
  };
}

export interface CreateSiteRequest {
  name: string;
  type: string;
  country?: string;
  region?: string;
  description?: string;
}

export interface ApiResponse<T> {
  data: T;
  error: null | { code: string; message: string; details?: any };
  request_id: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  error: null | { code: string; message: string; details?: any };
  request_id: string;
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  /**
   * Get the authenticated user's JWT access token
   * @throws Error if no session exists (unauthenticated)
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (DEBUG_MODE) {
      console.group('[API Client] 🔐 Session Token Check');
      console.log('Has Session:', !!session);
      console.log('Has Access Token:', !!session?.access_token);
      console.log('Session Error:', error?.message || 'None');
      
      if (session?.access_token) {
        if (FULL_JWT_DEBUG) {
          console.log('\n📍 FULL USER JWT TOKEN:');
          console.log(session.access_token);
          logJWT(session.access_token, 'User Access Token');
          
          const validation = validateJWT(session.access_token);
          console.log('\n✅ Validation:', validation);
        } else {
          console.log('Token Preview:', session.access_token.substring(0, 30) + '...');
          console.log('Token Length:', session.access_token.length, 'chars');
          
          const decoded = decodeJWT(session.access_token);
          if (decoded) {
            console.log('User ID:', decoded.payload.sub);
            console.log('Email:', decoded.payload.email);
            console.log('Role:', decoded.payload.role);
            console.log('Expires:', decoded.expiresAt?.toLocaleString());
            console.log('Is Expired:', decoded.isExpired ? '❌ YES' : '✅ NO');
          }
          console.log('\n💡 Tip: Set localStorage.DEBUG_JWT = "true" to see full JWT');
        }
      } else {
        console.warn('⚠️  NO ACCESS TOKEN FOUND IN SESSION');
      }
      
      console.groupEnd();
    }
    
    return session?.access_token || null;
  }

  /**
   * Make an authenticated request to the Edge Function
   * Automatically attaches both apikey and Authorization headers
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get user JWT
    const userToken = await this.getAuthToken();
    
    // DEFENSIVE: Redirect to login if no session
    if (!userToken) {
      console.error('[API Client] No authenticated session - redirecting to login');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required - redirecting to login');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      // REQUIRED: Supabase public anon key (always present)
      'apikey': supabaseAnonKey,
      // REQUIRED: User JWT for authentication
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (DEBUG_MODE) {
      console.group(`[API Client] 🌐 ${options.method || 'GET'} Request`);
      console.log('URL:', url);
      
      if (FULL_JWT_DEBUG) {
        console.log('\n📍 FULL REQUEST HEADERS:');
        console.log('apikey:', supabaseAnonKey);
        logJWT(supabaseAnonKey, 'Anon Key (apikey header)');
        console.log('\nAuthorization:', headers.Authorization);
        logJWT(userToken, 'User JWT (Authorization header)');
      } else {
        console.log('Headers:', {
          apikey: supabaseAnonKey.substring(0, 30) + '...',
          authorization: headers.Authorization.substring(0, 40) + '...',
          'content-type': headers['Content-Type'],
        });
      }
      
      if (options.body) {
        console.log('Body:', JSON.parse(options.body as string));
      }
      
      console.groupEnd();
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (DEBUG_MODE) {
      console.group(`[API Client] 📥 ${options.method || 'GET'} Response`);
      console.log('Status:', response.status, response.statusText);
      console.log('OK:', response.ok);
      
      // Try to get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('Response Headers:', responseHeaders);
      
      console.groupEnd();
    }

    // Handle 401 Unauthorized - JWT verification failed
    if (response.status === 401) {
      console.group('🚨 [API Client] 401 UNAUTHORIZED ERROR');
      console.error('JWT Verification Failed!');
      console.log('This means the Edge Function rejected the JWT token.');
      
      if (userToken) {
        console.log('\n🔍 Debugging the rejected token:');
        logJWT(userToken, 'Rejected User JWT');
        const validation = validateJWT(userToken);
        console.log('Validation Results:', validation);
      }
      
      console.log('\n📋 Troubleshooting steps:');
      console.log('1. Check if token is expired (see above)');
      console.log('2. Verify Edge Function has JWT verification enabled');
      console.log('3. Check if JWT_SECRET matches between auth and edge function');
      console.log('4. Verify user exists in auth.users table');
      
      console.groupEnd();
      
      if (typeof window !== 'undefined') {
        // Clear session and redirect
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
      throw new Error('Session expired - please log in again');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { code: 'UNKNOWN_ERROR', message: errorText || 'An error occurred' } };
      }
      
      console.error('[API Client] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url,
        method: options.method || 'GET',
      });
      
      throw new Error(errorData.error?.message || 'Request failed');
    }

    return response.json();
  }

  // ========================================================================
  // Tenants
  // ========================================================================

  async getTenants(): Promise<PaginatedResponse<Tenant>> {
    return this.request('/tenants');
  }

  /**
   * Get current user info and their tenant memberships
   * POST-LOGIN GATE: Use this to determine if user needs onboarding
   */
  async getMe(): Promise<MeResponse> {
    return this.request('/me');
  }

  /**
   * Create a new organization (tenant) and assign current user as admin
   * ONBOARDING STEP 1
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a new site within the active tenant
   * ONBOARDING STEP 2 (optional)
   * Note: tenant_id is inferred server-side from x-tenant-id header
   */
  async createSiteOnboarding(data: CreateSiteRequest): Promise<ApiResponse<Site>> {
    return this.request('/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // Sites
  // ========================================================================

  async getSites(tenantId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Site>> {
    const queryParams = new URLSearchParams();
    queryParams.append('tenant_id', tenantId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/sites${query ? `?${query}` : ''}`);
  }

  async createSite(tenantId: string, site: Omit<Site, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Site>> {
    return this.request('/sites', {
      method: 'POST',
      body: JSON.stringify({ ...site, tenant_id: tenantId }),
    });
  }

  // ========================================================================
  // Assets
  // ========================================================================

  async getAssets(tenantId: string, params?: {
    site_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Asset>> {
    const queryParams = new URLSearchParams();
    queryParams.append('tenant_id', tenantId);
    if (params?.site_id) queryParams.append('site_id', params.site_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/assets${query ? `?${query}` : ''}`);
  }

  async createAsset(tenantId: string, asset: Omit<Asset, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Asset>> {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify({ ...asset, tenant_id: tenantId }),
    });
  }

  // ========================================================================
  // Signals
  // ========================================================================

  async getSignals(params?: {
    site_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Signal>> {
    const queryParams = new URLSearchParams();
    if (params?.site_id) queryParams.append('site_id', params.site_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/signals${query ? `?${query}` : ''}`);
  }

  async classifySignal(id: string, classification: string): Promise<ApiResponse<Signal>> {
    return this.request(`/signals/${id}/classify`, {
      method: 'POST',
      body: JSON.stringify({ classification }),
    });
  }

  async correlateSignals(signal_ids: string[], correlation_group: string): Promise<ApiResponse<{ updated: number }>> {
    return this.request('/signals/correlate', {
      method: 'POST',
      body: JSON.stringify({ signal_ids, correlation_group }),
    });
  }

  // ========================================================================
  // Risks
  // ========================================================================

  async getRisks(params?: {
    site_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Risk>> {
    const queryParams = new URLSearchParams();
    if (params?.site_id) queryParams.append('site_id', params.site_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/risks${query ? `?${query}` : ''}`);
  }

  async getRisk(id: string): Promise<ApiResponse<Risk>> {
    return this.request(`/risks/${id}`);
  }

  async createRisk(risk: Partial<Risk>): Promise<ApiResponse<Risk>> {
    return this.request('/risks', {
      method: 'POST',
      body: JSON.stringify(risk),
    });
  }

  async updateRisk(id: string, updates: Partial<Risk>): Promise<ApiResponse<Risk>> {
    return this.request(`/risks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getRiskEvents(risk_id: string): Promise<PaginatedResponse<RiskEvent>> {
    return this.request(`/risks/${risk_id}/events`);
  }

  // ========================================================================
  // Work Items
  // ========================================================================

  async getWorkItems(params?: {
    site_id?: string;
    status?: string;
    assigned_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<WorkItem>> {
    const queryParams = new URLSearchParams();
    if (params?.site_id) queryParams.append('site_id', params.site_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/work-items${query ? `?${query}` : ''}`);
  }

  async getWorkItem(id: string): Promise<ApiResponse<WorkItem>> {
    return this.request(`/work-items/${id}`);
  }

  async createWorkItem(workItem: Partial<WorkItem>): Promise<ApiResponse<WorkItem>> {
    return this.request('/work-items', {
      method: 'POST',
      body: JSON.stringify(workItem),
    });
  }

  async updateWorkItem(id: string, updates: Partial<WorkItem>): Promise<ApiResponse<WorkItem>> {
    return this.request(`/work-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ========================================================================
  // Connection Test
  // ========================================================================

  /**
   * Test connection to the backend Edge Function
   * Validates that the endpoint is reachable and returns { ok: true }
   */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const userToken = await this.getAuthToken();
      
      if (!userToken) {
        return {
          ok: false,
          message: 'No authenticated session - please log in first',
        };
      }

      const url = API_BASE_URL;
      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      };

      console.group('🔌 [API Client] Connection Test');
      console.log('Testing endpoint:', url);
      console.log('With authentication headers');
      
      const response = await fetch(url, { headers });
      
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response Data:', data);
        console.groupEnd();
        
        if (data.ok === true) {
          return {
            ok: true,
            message: 'Connection successful - backend is reachable',
          };
        } else {
          return {
            ok: false,
            message: 'Backend responded but did not return { ok: true }',
          };
        }
      } else {
        const errorText = await response.text();
        console.error('Error Response:', errorText);
        console.groupEnd();
        
        return {
          ok: false,
          message: `Connection failed with status ${response.status}: ${errorText}`,
        };
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        ok: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const apiClient = new ApiClient();