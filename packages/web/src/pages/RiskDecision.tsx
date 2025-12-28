// ============================================================================
// MS2 Screen 5: Risk Decision
// Make risk decisions (Accept, Mitigate, Transfer, Avoid)
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Risk } from '../lib/api-client';

interface RiskDecisionProps {
  onNavigate?: (page: string, params?: any) => void;
  riskId?: string;
}

export default function RiskDecision({ onNavigate, riskId }: RiskDecisionProps = {}) {
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState('under_review');
  const [rationale, setRationale] = useState('');

  useEffect(() => {
    if (riskId) loadRisk(riskId);
  }, [riskId]);

  async function loadRisk(riskId: string) {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getRisk(riskId);
      setRisk(response.data);
      setDecision(response.data.decision);
      setRationale(response.data.decision_rationale || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk');
    } finally {
      setLoading(false);
    }
  }

  async function saveDecision() {
    if (!riskId || !risk) return;

    // Validate MS2 requirement: rationale required for non-under_review decisions
    if (decision !== 'under_review' && !rationale.trim()) {
      setError('Decision rationale is required for this decision type');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await apiClient.updateRisk(riskId, {
        decision: decision as Risk['decision'],
        decision_rationale: rationale,
      });
      if (onNavigate) onNavigate('/risks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save decision');
    } finally {
      setSaving(false);
    }
  }

  const decisionOptions = [
    {
      value: 'under_review',
      label: 'Under Review',
      description: 'Risk is being assessed',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      value: 'accept',
      label: 'Accept',
      description: 'Accept the risk with monitoring',
      color: 'bg-green-100 text-green-800 border-green-300',
    },
    {
      value: 'mitigate',
      label: 'Mitigate',
      description: 'Reduce risk through controls',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    {
      value: 'transfer',
      label: 'Transfer',
      description: 'Transfer risk to third party',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      value: 'avoid',
      label: 'Avoid',
      description: 'Eliminate the risk entirely',
      color: 'bg-red-100 text-red-800 border-red-300',
    },
  ];

  function getSeverityColor(severity: string) {
    const colors = {
      catastrophic: 'bg-red-600 text-white',
      major: 'bg-orange-500 text-white',
      moderate: 'bg-yellow-500 text-white',
      minor: 'bg-blue-500 text-white',
      negligible: 'bg-gray-400 text-white',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-400 text-white';
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="risk-decision-page">
      <div className="mb-6">
        <button
          onClick={() => (onNavigate ? onNavigate('/risks') : null)}
          className="text-blue-600 hover:text-blue-800 mb-2"
          data-testid="back-button"
        >
          â† Back to Risk Register
        </button>
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Risk Decision
        </h1>
        <p className="text-gray-600">
          Make a decision on how to handle this risk (MS2 compliant)
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8" data-testid="loading-indicator">
          Loading risk details...
        </div>
      )}

      {/* Risk Details */}
      {!loading && risk && (
        <div className="space-y-6">
          {/* Risk Summary */}
          <div className="border rounded-lg p-6 bg-white" data-testid="risk-summary">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1" data-testid="risk-id">
                  {risk.risk_id}
                </div>
                <h2 className="text-xl" data-testid="risk-title">
                  {risk.title}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-3xl mb-1" data-testid="risk-score">
                  {risk.risk_score}
                </div>
                <div className="text-xs text-gray-500">Risk Score</div>
              </div>
            </div>

            <p className="text-gray-700 mb-4" data-testid="risk-description">
              {risk.description}
            </p>

            <div className="flex gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded ${getSeverityColor(risk.severity)}`}
                data-testid="risk-severity"
              >
                {risk.severity}
              </span>
              <span className="px-3 py-1 rounded bg-gray-200" data-testid="risk-likelihood">
                {risk.likelihood.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded bg-blue-100 text-blue-800" data-testid="risk-category">
                {risk.category}
              </span>
            </div>

            {risk.existing_controls && (
              <div className="bg-gray-50 p-3 rounded mb-3">
                <div className="text-xs text-gray-600 mb-1">Existing Controls</div>
                <div className="text-sm" data-testid="existing-controls">
                  {risk.existing_controls}
                </div>
              </div>
            )}

            {risk.mitigation_plan && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-xs text-gray-600 mb-1">Mitigation Plan</div>
                <div className="text-sm" data-testid="mitigation-plan">
                  {risk.mitigation_plan}
                </div>
              </div>
            )}
          </div>

          {/* Decision Selection */}
          <div className="border rounded-lg p-6 bg-white" data-testid="decision-section">
            <h3 className="text-lg mb-4">Select Decision</h3>

            <div className="space-y-3 mb-6">
              {decisionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    decision === option.value
                      ? option.color
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`decision-option-${option.value}`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={decision === option.value}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mt-1"
                    data-testid={`decision-radio-${option.value}`}
                  />
                  <div className="flex-1">
                    <div className="text-sm">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Rationale (Required for MS2) */}
            <div>
              <label htmlFor="rationale" className="block text-sm mb-2">
                Decision Rationale
                {decision !== 'under_review' && (
                  <span className="text-red-600 ml-1" data-testid="required-indicator">
                    * Required
                  </span>
                )}
              </label>
              <textarea
                id="rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Explain the reasoning behind this decision..."
                rows={4}
                className="w-full border rounded px-3 py-2"
                data-testid="rationale-input"
                required={decision !== 'under_review'}
              />
              <div className="text-xs text-gray-500 mt-1">
                MS2 Requirement: Rationale is mandatory for accept, mitigate, transfer, and avoid decisions
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => (onNavigate ? onNavigate('/risks') : null)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={saveDecision}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              data-testid="save-decision-button"
            >
              {saving ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { RiskDecision };
