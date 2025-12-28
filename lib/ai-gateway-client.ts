// ============================================================================
// Example: Using edgeFetch with AI Gateway
// This demonstrates how to call the ai_gateway Edge Function
// ============================================================================

import { edgeFetchJson, isNoSessionError } from '../lib/edgeFetch';

// ============================================================================
// Types for AI Gateway
// ============================================================================

export interface AIGatewayRequest {
  tenant_id: string;
  mode: 'chat' | 'report';
  use_case: 'signal_assistant' | 'risk_assistant' | 'exec_summary' | 'mitigation_plan';
  input: Record<string, unknown>;
  context?: {
    site_id?: string;
    asset_id?: string;
    risk_id?: string;
  };
}

export interface AIGatewayResponse {
  ok: boolean;
  provider: string;
  model: string;
  mode: 'chat' | 'report';
  use_case: string;
  output: string;
  structured?: Record<string, unknown>;
}

export interface AIGatewayError {
  ok: false;
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// AI Gateway Client
// ============================================================================

export class AIGatewayClient {
  /**
   * Call the AI Gateway Edge Function
   * 
   * @param request - AI Gateway request payload
   * @returns AI Gateway response
   * @throws NoSessionError if user is not authenticated
   * @throws Error if request fails
   */
  async call(request: AIGatewayRequest): Promise<AIGatewayResponse> {
    try {
      console.log('[AIGateway] Calling AI Gateway:', {
        mode: request.mode,
        use_case: request.use_case,
        tenant_id: request.tenant_id,
      });

      const response = await edgeFetchJson<AIGatewayResponse>('ai_gateway', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      console.log('[AIGateway] Success:', {
        provider: response.provider,
        model: response.model,
        outputLength: response.output.length,
        hasStructured: !!response.structured,
      });

      return response;
    } catch (err) {
      // Handle NO_SESSION error
      if (isNoSessionError(err)) {
        console.error('[AIGateway] User not authenticated');
        throw new Error('Please log in to use AI assistant');
      }

      // Handle other errors
      console.error('[AIGateway] Call failed:', err);
      throw err;
    }
  }

  /**
   * Call Signal Assistant (chat mode)
   * Provides 4-8 bullets about signal events
   */
  async signalAssistant(params: {
    tenant_id: string;
    signal_data: Record<string, unknown>;
    site_id?: string;
    asset_id?: string;
  }): Promise<string> {
    const response = await this.call({
      tenant_id: params.tenant_id,
      mode: 'chat',
      use_case: 'signal_assistant',
      input: params.signal_data,
      context: {
        site_id: params.site_id,
        asset_id: params.asset_id,
      },
    });

    return response.output;
  }

  /**
   * Call Risk Assistant (chat mode)
   * Provides severity/likelihood rationale + actions + evidence
   */
  async riskAssistant(params: {
    tenant_id: string;
    risk_data: Record<string, unknown>;
    site_id?: string;
    risk_id?: string;
  }): Promise<string> {
    const response = await this.call({
      tenant_id: params.tenant_id,
      mode: 'chat',
      use_case: 'risk_assistant',
      input: params.risk_data,
      context: {
        site_id: params.site_id,
        risk_id: params.risk_id,
      },
    });

    return response.output;
  }

  /**
   * Generate Executive Summary (report mode)
   * Returns structured JSON with findings, risks, actions
   */
  async execSummary(params: {
    tenant_id: string;
    summary_data: Record<string, unknown>;
    site_id?: string;
  }): Promise<{
    output: string;
    structured: Record<string, unknown> | undefined;
  }> {
    const response = await this.call({
      tenant_id: params.tenant_id,
      mode: 'report',
      use_case: 'exec_summary',
      input: params.summary_data,
      context: {
        site_id: params.site_id,
      },
    });

    return {
      output: response.output,
      structured: response.structured,
    };
  }

  /**
   * Generate Mitigation Plan (report mode)
   * Returns structured JSON with mitigations, quick wins, dependencies
   */
  async mitigationPlan(params: {
    tenant_id: string;
    risk_data: Record<string, unknown>;
    site_id?: string;
    risk_id?: string;
  }): Promise<{
    output: string;
    structured: Record<string, unknown> | undefined;
  }> {
    const response = await this.call({
      tenant_id: params.tenant_id,
      mode: 'report',
      use_case: 'mitigation_plan',
      input: params.risk_data,
      context: {
        site_id: params.site_id,
        risk_id: params.risk_id,
      },
    });

    return {
      output: response.output,
      structured: response.structured,
    };
  }
}

// Export singleton instance
export const aiGateway = new AIGatewayClient();

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Signal Assistant
 * 
 * @example
 * ```typescript
 * import { aiGateway } from './lib/ai-gateway-client';
 * 
 * async function analyzeSignal() {
 *   try {
 *     const analysis = await aiGateway.signalAssistant({
 *       tenant_id: 'your-tenant-uuid',
 *       signal_data: {
 *         signal_type: 'unauthorized_access',
 *         severity: 'high',
 *         source: 'firewall_logs',
 *         attempts: 15,
 *         ip_address: '192.168.1.100'
 *       },
 *       site_id: 'your-site-uuid'
 *     });
 *     
 *     console.log('Signal Analysis:', analysis);
 *     // Output: 4-8 bullets (Changed/Cause/Check/Escalate if)
 *   } catch (err) {
 *     console.error('Failed to analyze signal:', err);
 *   }
 * }
 * ```
 */

/**
 * Example 2: Risk Assistant
 * 
 * @example
 * ```typescript
 * async function assessRisk() {
 *   try {
 *     const assessment = await aiGateway.riskAssistant({
 *       tenant_id: 'your-tenant-uuid',
 *       risk_data: {
 *         risk_title: 'Unpatched SCADA system',
 *         current_severity: 'major',
 *         current_likelihood: 'likely',
 *         description: 'Windows 7 HMI with no patches since 2022',
 *         last_patch_date: '2022-03-15'
 *       },
 *       site_id: 'your-site-uuid'
 *     });
 *     
 *     console.log('Risk Assessment:', assessment);
 *     // Output: Severity rationale + 3 actions + evidence needed
 *   } catch (err) {
 *     console.error('Failed to assess risk:', err);
 *   }
 * }
 * ```
 */

/**
 * Example 3: Executive Summary
 * 
 * @example
 * ```typescript
 * async function generateExecSummary() {
 *   try {
 *     const { output, structured } = await aiGateway.execSummary({
 *       tenant_id: 'your-tenant-uuid',
 *       summary_data: {
 *         period: 'Q1 2024',
 *         total_risks: 42,
 *         critical_risks: 8,
 *         high_risks: 15,
 *         patching_coverage: 45
 *       },
 *       site_id: 'your-site-uuid'
 *     });
 *     
 *     console.log('Executive Summary:', output);
 *     
 *     if (structured) {
 *       console.log('Structured Data:', {
 *         headline: structured.headline,
 *         findings: structured.top_findings,
 *         risks: structured.risks,
 *         actions: structured.recommended_actions
 *       });
 *     }
 *   } catch (err) {
 *     console.error('Failed to generate summary:', err);
 *   }
 * }
 * ```
 */

/**
 * Example 4: Mitigation Plan
 * 
 * @example
 * ```typescript
 * async function createMitigationPlan() {
 *   try {
 *     const { output, structured } = await aiGateway.mitigationPlan({
 *       tenant_id: 'your-tenant-uuid',
 *       risk_data: {
 *         risk_title: 'Legacy PLC vulnerabilities',
 *         severity: 'major',
 *         likelihood: 'likely',
 *         budget: 50000,
 *         timeline: '6 months',
 *         assets_affected: 5
 *       },
 *       site_id: 'your-site-uuid'
 *     });
 *     
 *     console.log('Mitigation Plan:', output);
 *     
 *     if (structured) {
 *       console.log('Plan Details:', {
 *         goal: structured.goal,
 *         mitigations: structured.mitigations,
 *         quickWins: structured.quick_wins,
 *         dependencies: structured.dependencies
 *       });
 *     }
 *   } catch (err) {
 *     console.error('Failed to create mitigation plan:', err);
 *   }
 * }
 * ```
 */

/**
 * Example 5: React Component
 * 
 * @example
 * ```typescript
 * import { useState } from 'react';
 * import { aiGateway } from './lib/ai-gateway-client';
 * import { isNoSessionError } from './lib/edgeFetch';
 * 
 * function SignalAnalyzer() {
 *   const [analysis, setAnalysis] = useState<string>('');
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 *   
 *   async function analyze() {
 *     try {
 *       setLoading(true);
 *       setError(null);
 *       
 *       const result = await aiGateway.signalAssistant({
 *         tenant_id: 'your-tenant-uuid',
 *         signal_data: {
 *           signal_type: 'unauthorized_access',
 *           severity: 'high',
 *           attempts: 15
 *         }
 *       });
 *       
 *       setAnalysis(result);
 *     } catch (err) {
 *       if (isNoSessionError(err)) {
 *         setError('Please log in to use AI assistant');
 *         // Redirect to login
 *         window.location.href = '/login';
 *       } else {
 *         setError('Failed to analyze signal');
 *         console.error(err);
 *       }
 *     } finally {
 *       setLoading(false);
 *     }
 *   }
 *   
 *   return (
 *     <div>
 *       <button onClick={analyze} disabled={loading}>
 *         {loading ? 'Analyzing...' : 'Analyze Signal'}
 *       </button>
 *       
 *       {error && <div className="error">{error}</div>}
 *       {analysis && <div className="result">{analysis}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
