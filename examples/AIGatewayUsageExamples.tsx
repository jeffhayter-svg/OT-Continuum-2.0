// ============================================================================
// AI Gateway Usage Examples - Production-Ready React Components
// ============================================================================

import { useState } from 'react';
import { callAIGateway } from '../lib/callAIGateway';

// ============================================================================
// Example 1: Signal Assistant (Chat Mode)
// ============================================================================

export function SignalAssistant({ tenantId, signalData }: {
  tenantId: string;
  signalData: {
    signal_type: string;
    severity?: string;
    source?: string;
    value?: number;
    threshold?: number;
  };
}) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzeSignal() {
    try {
      setLoading(true);
      setError(null);

      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: "chat",
        use_case: "signal_assistant",
        input: {
          question: `Analyze this signal event: ${signalData.signal_type}`,
          signal_type: signalData.signal_type,
          severity: signalData.severity,
          source: signalData.source,
          value: signalData.value,
          threshold: signalData.threshold,
        },
        context: {
          signal: signalData.signal_type,
        }
      });

      // result.output contains 4-8 bullets (Changed, Cause, Check, Escalate if)
      setAnalysis(result.output);

    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ACTIVE_SESSION') {
        setError('Please log in to use AI assistant');
        // Redirect to login
        window.location.href = '/login';
      } else {
        setError('Failed to analyze signal: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="signal-assistant">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Signal Analysis</h3>
        <button
          onClick={analyzeSignal}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          data-testid="analyze-signal-button"
        >
          {loading ? 'Analyzing...' : 'Analyze Signal'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800" data-testid="error-message">
          {error}
        </div>
      )}

      {analysis && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded" data-testid="analysis-result">
          <div className="whitespace-pre-wrap">{analysis}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Risk Assistant (Chat Mode)
// ============================================================================

export function RiskAssistant({ tenantId, riskData }: {
  tenantId: string;
  riskData: {
    risk_title: string;
    current_severity: string;
    current_likelihood: string;
    description?: string;
  };
}) {
  const [assessment, setAssessment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assessRisk() {
    try {
      setLoading(true);
      setError(null);

      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: "chat",
        use_case: "risk_assistant",
        input: {
          risk_title: riskData.risk_title,
          current_severity: riskData.current_severity,
          current_likelihood: riskData.current_likelihood,
          description: riskData.description,
        },
        context: {
          risk_title: riskData.risk_title,
        }
      });

      // result.output contains severity/likelihood rationale + 3 actions + evidence needed
      setAssessment(result.output);

    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ACTIVE_SESSION') {
        setError('Please log in to use AI assistant');
        window.location.href = '/login';
      } else {
        setError('Failed to assess risk: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="risk-assistant">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Risk Assessment</h3>
        <button
          onClick={assessRisk}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
          data-testid="assess-risk-button"
        >
          {loading ? 'Assessing...' : 'Assess Risk'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800" data-testid="error-message">
          {error}
        </div>
      )}

      {assessment && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded" data-testid="assessment-result">
          <div className="whitespace-pre-wrap">{assessment}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Executive Summary (Report Mode)
// ============================================================================

export function ExecutiveSummary({ tenantId, summaryData }: {
  tenantId: string;
  summaryData: {
    period: string;
    total_risks: number;
    critical_risks: number;
    high_risks: number;
    patching_coverage?: number;
  };
}) {
  const [summary, setSummary] = useState<{
    text: string;
    structured?: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateSummary() {
    try {
      setLoading(true);
      setError(null);

      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: "report",
        use_case: "exec_summary",
        input: {
          period: summaryData.period,
          total_risks: summaryData.total_risks,
          critical_risks: summaryData.critical_risks,
          high_risks: summaryData.high_risks,
          patching_coverage: summaryData.patching_coverage,
        },
        context: {
          report_type: "executive_summary",
        }
      });

      // result.output contains markdown text
      // result.structured contains JSON with headline, findings, risks, actions
      setSummary({
        text: result.output,
        structured: result.structured,
      });

    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ACTIVE_SESSION') {
        setError('Please log in to use AI assistant');
        window.location.href = '/login';
      } else {
        setError('Failed to generate summary: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="exec-summary">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Executive Summary Generator</h3>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          data-testid="generate-summary-button"
        >
          {loading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800" data-testid="error-message">
          {error}
        </div>
      )}

      {summary && (
        <div className="space-y-4">
          {/* Structured Data View */}
          {summary.structured && (
            <div className="p-4 bg-green-50 border border-green-200 rounded" data-testid="structured-data">
              <h4 className="font-semibold mb-2">Key Findings</h4>
              <div className="space-y-2">
                {summary.structured.headline && (
                  <div className="text-lg font-medium">{summary.structured.headline}</div>
                )}
                {summary.structured.top_findings && (
                  <ul className="list-disc list-inside space-y-1">
                    {summary.structured.top_findings.map((finding: string, i: number) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Full Text View */}
          <div className="p-4 bg-white border border-gray-200 rounded" data-testid="summary-text">
            <div className="prose max-w-none whitespace-pre-wrap">{summary.text}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Mitigation Plan (Report Mode)
// ============================================================================

export function MitigationPlan({ tenantId, riskData }: {
  tenantId: string;
  riskData: {
    risk_title: string;
    severity: string;
    likelihood: string;
    budget?: number;
    timeline?: string;
    assets_affected?: number;
  };
}) {
  const [plan, setPlan] = useState<{
    text: string;
    structured?: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePlan() {
    try {
      setLoading(true);
      setError(null);

      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: "report",
        use_case: "mitigation_plan",
        input: {
          risk_title: riskData.risk_title,
          severity: riskData.severity,
          likelihood: riskData.likelihood,
          budget: riskData.budget,
          timeline: riskData.timeline,
          assets_affected: riskData.assets_affected,
        },
        context: {
          risk_title: riskData.risk_title,
        }
      });

      // result.output contains markdown text
      // result.structured contains JSON with goal, mitigations, quick_wins, dependencies
      setPlan({
        text: result.output,
        structured: result.structured,
      });

    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ACTIVE_SESSION') {
        setError('Please log in to use AI assistant');
        window.location.href = '/login';
      } else {
        setError('Failed to generate plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="mitigation-plan">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mitigation Plan Generator</h3>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
          data-testid="generate-plan-button"
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800" data-testid="error-message">
          {error}
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          {/* Structured Data View */}
          {plan.structured && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Goal */}
              {plan.structured.goal && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                  <h4 className="font-semibold mb-2">Goal</h4>
                  <p>{plan.structured.goal}</p>
                </div>
              )}

              {/* Quick Wins */}
              {plan.structured.quick_wins && plan.structured.quick_wins.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-semibold mb-2">Quick Wins</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {plan.structured.quick_wins.map((win: string, i: number) => (
                      <li key={i}>{win}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mitigations */}
              {plan.structured.mitigations && plan.structured.mitigations.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded md:col-span-2">
                  <h4 className="font-semibold mb-2">Mitigation Steps</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {plan.structured.mitigations.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Full Text View */}
          <div className="p-4 bg-white border border-gray-200 rounded" data-testid="plan-text">
            <div className="prose max-w-none whitespace-pre-wrap">{plan.text}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Your Exact Use Case (PLC Heartbeat Analysis)
// ============================================================================

export function PLCHeartbeatAnalyzer({ tenantId, assetId }: {
  tenantId: string;
  assetId?: string;
}) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzePLCHeartbeat() {
    try {
      setLoading(true);
      setError(null);

      // Your exact call
      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: "chat",
        use_case: "signal_assistant",
        input: {
          question: "What does a spike in failed PLC heartbeats usually indicate?"
        },
        context: {
          asset_type: "PLC",
          asset_id: assetId,
          signal: "heartbeat_failures"
        }
      });

      setAnalysis(result.output);

      // Example output:
      // • **Changed**: Failed PLC heartbeat count increased from 2% to 15% over last hour
      // • **Cause**: Network congestion, cable damage, PLC power issues, or network switch failure
      // • **Check**: 1) Verify Ethernet cable integrity, 2) Check network switch port status, 3) Review PLC power supply logs
      // • **Escalate if**: Failures exceed 10% over 15 minutes, or if critical production PLCs affected

    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ACTIVE_SESSION') {
        setError('Please log in to use AI assistant');
        window.location.href = '/login';
      } else {
        setError('Failed to analyze: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="plc-heartbeat-analyzer">
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">PLC Heartbeat Failure Analysis</h3>
        <p className="text-sm text-gray-600 mb-4">
          Get AI-powered insights about PLC heartbeat failures
        </p>
        
        <button
          onClick={analyzePLCHeartbeat}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          data-testid="analyze-button"
        >
          {loading ? 'Analyzing...' : 'Analyze Heartbeat Failures'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {analysis && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold mb-2">AI Analysis:</h4>
          <div className="whitespace-pre-wrap text-sm">{analysis}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Inline AI Assistant (Auto-trigger)
// ============================================================================

export function InlineAIAssistant({ 
  tenantId, 
  signal 
}: {
  tenantId: string;
  signal: {
    id: string;
    signal_type: string;
    severity: string;
    value: number;
    threshold: number;
  };
}) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Auto-trigger on mount
  async function analyze() {
    try {
      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: "chat",
        use_case: "signal_assistant",
        input: {
          signal_type: signal.signal_type,
          severity: signal.severity,
          value: signal.value,
          threshold: signal.threshold,
        },
        context: {
          signal_id: signal.id,
          signal: signal.signal_type,
        }
      });

      setAnalysis(result.output);
    } catch (err) {
      console.error('AI analysis failed:', err);
      // Don't show error to user - this is optional enhancement
    } finally {
      setLoading(false);
    }
  }

  // Trigger on mount
  useState(() => {
    analyze();
  });

  if (!analysis) return null;

  return (
    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
      <div className="flex items-start space-x-2">
        <div className="text-blue-600 mt-0.5">💡</div>
        <div className="flex-1">
          <div className="font-semibold text-blue-900 mb-1">AI Insight</div>
          <div className="text-sm text-blue-800 whitespace-pre-wrap">{analysis}</div>
        </div>
      </div>
    </div>
  );
}
