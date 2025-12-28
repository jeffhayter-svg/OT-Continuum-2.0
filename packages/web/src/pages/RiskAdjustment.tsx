// ============================================================================
// MS2 Screen 7: Risk Adjustment
// Adjust risk severity/likelihood and track history
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Risk, RiskEvent } from '../lib/api-client';

interface RiskAdjustmentProps {
  onNavigate?: (page: string, params?: any) => void;
  riskId?: string;
}

export function RiskAdjustment({ onNavigate, riskId }: RiskAdjustmentProps = {}) {
  const [risk, setRisk] = useState<Risk | null>(null);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSeverity, setNewSeverity] = useState('');
  const [newLikelihood, setNewLikelihood] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  useEffect(() => {
    if (riskId) {
      loadRiskAndEvents(riskId);
    }
  }, [riskId]);

  async function loadRiskAndEvents(riskId: string) {
    try {
      setLoading(true);
      setError(null);
      const [riskResponse, eventsResponse] = await Promise.all([
        apiClient.getRisk(riskId),
        apiClient.getRiskEvents(riskId),
      ]);
      setRisk(riskResponse.data);
      setEvents(eventsResponse.data);
      setNewSeverity(riskResponse.data.severity);
      setNewLikelihood(riskResponse.data.likelihood);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  }

  async function saveAdjustment() {
    if (!riskId || !risk) return;

    try {
      setSaving(true);
      setError(null);
      await apiClient.updateRisk(riskId, {
        severity: newSeverity as Risk['severity'],
        likelihood: newLikelihood as Risk['likelihood'],
      });
      if (onNavigate) {
        onNavigate('/risks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save adjustment');
    } finally {
      setSaving(false);
    }
  }

  const severityOptions = [
    { value: 'catastrophic', label: 'Catastrophic', score: 5 },
    { value: 'major', label: 'Major', score: 4 },
    { value: 'moderate', label: 'Moderate', score: 3 },
    { value: 'minor', label: 'Minor', score: 2 },
    { value: 'negligible', label: 'Negligible', score: 1 },
  ];

  const likelihoodOptions = [
    { value: 'almost_certain', label: 'Almost Certain', score: 5 },
    { value: 'likely', label: 'Likely', score: 4 },
    { value: 'possible', label: 'Possible', score: 3 },
    { value: 'unlikely', label: 'Unlikely', score: 2 },
    { value: 'rare', label: 'Rare', score: 1 },
  ];

  const currentScore = risk
    ? (severityOptions.find((s) => s.value === risk.severity)?.score || 0) *
      (likelihoodOptions.find((l) => l.value === risk.likelihood)?.score || 0)
    : 0;

  const newScore =
    (severityOptions.find((s) => s.value === newSeverity)?.score || 0) *
    (likelihoodOptions.find((l) => l.value === newLikelihood)?.score || 0);

  const scoreChange = newScore - currentScore;

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="risk-adjustment-page">
      <div className="mb-6">
        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('/risks');
            }
          }}
          className="text-blue-600 hover:text-blue-800 mb-2"
          data-testid="back-button"
        >
          ← Back to Risk Register
        </button>
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Risk Adjustment
        </h1>
        <p className="text-gray-600">
          Adjust risk severity/likelihood and track history
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

      {!loading && risk && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Current Risk & Adjustment */}
          <div className="space-y-6">
            {/* Current Risk */}
            <div className="border rounded-lg p-6 bg-white" data-testid="current-risk">
              <h2 className="text-lg mb-4">Current Risk</h2>
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1" data-testid="risk-id">
                  {risk.risk_id}
                </div>
                <h3 className="text-xl mb-2" data-testid="risk-title">
                  {risk.title}
                </h3>
                <p className="text-sm text-gray-600" data-testid="risk-description">
                  {risk.description}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="text-center mb-3">
                  <div className="text-4xl mb-1" data-testid="current-risk-score">
                    {currentScore}
                  </div>
                  <div className="text-xs text-gray-600">Current Risk Score</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm" data-testid="current-severity">
                      {risk.severity}
                    </div>
                    <div className="text-xs text-gray-600">Severity</div>
                  </div>
                  <div>
                    <div className="text-sm" data-testid="current-likelihood">
                      {risk.likelihood.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-600">Likelihood</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjustment Form */}
            <div className="border rounded-lg p-6 bg-white" data-testid="adjustment-form">
              <h2 className="text-lg mb-4">Adjust Risk Score</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="severity" className="block text-sm mb-2">
                    New Severity
                  </label>
                  <select
                    id="severity"
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    data-testid="severity-select"
                  >
                    {severityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.score})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="likelihood" className="block text-sm mb-2">
                    New Likelihood
                  </label>
                  <select
                    id="likelihood"
                    value={newLikelihood}
                    onChange={(e) => setNewLikelihood(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    data-testid="likelihood-select"
                  >
                    {likelihoodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.score})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm mb-2">
                    Adjustment Notes
                  </label>
                  <textarea
                    id="notes"
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    placeholder="Explain why the risk score is being adjusted..."
                    rows={3}
                    className="w-full border rounded px-3 py-2"
                    data-testid="notes-input"
                  />
                </div>

                {/* New Score Preview */}
                <div
                  className={`p-4 rounded ${
                    scoreChange > 0
                      ? 'bg-red-50 border border-red-200'
                      : scoreChange < 0
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                  data-testid="score-preview"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-1" data-testid="new-risk-score">
                      {newScore}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">New Risk Score</div>
                    {scoreChange !== 0 && (
                      <div
                        className={`text-sm ${scoreChange > 0 ? 'text-red-600' : 'text-green-600'}`}
                        data-testid="score-change"
                      >
                        {scoreChange > 0 ? '↑' : '↓'} {Math.abs(scoreChange)} points
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('/risks');
                    }
                  }}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAdjustment}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  data-testid="save-button"
                >
                  {saving ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Risk Event History */}
          <div className="border rounded-lg p-6 bg-white" data-testid="event-history">
            <h2 className="text-lg mb-4">Risk Event History</h2>

            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="no-events">
                No events recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                    data-testid="event-item"
                    data-event-id={event.id}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" data-testid="event-type">
                        {event.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500" data-testid="event-date">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {event.risk_score !== undefined && (
                      <div className="text-sm mb-1">
                        <span className="text-gray-600">Score: </span>
                        <span data-testid="event-score">{event.risk_score}</span>
                        {event.previous_risk_score !== undefined && (
                          <span className="text-xs text-gray-500 ml-2">
                            (was {event.previous_risk_score})
                          </span>
                        )}
                      </div>
                    )}

                    {event.severity && (
                      <div className="text-sm mb-1">
                        <span className="text-gray-600">Severity: </span>
                        <span data-testid="event-severity">{event.severity}</span>
                        {event.previous_severity && (
                          <span className="text-xs text-gray-500 ml-2">
                            (was {event.previous_severity})
                          </span>
                        )}
                      </div>
                    )}

                    {event.likelihood && (
                      <div className="text-sm mb-1">
                        <span className="text-gray-600">Likelihood: </span>
                        <span data-testid="event-likelihood">
                          {event.likelihood.replace('_', ' ')}
                        </span>
                        {event.previous_likelihood && (
                          <span className="text-xs text-gray-500 ml-2">
                            (was {event.previous_likelihood.replace('_', ' ')})
                          </span>
                        )}
                      </div>
                    )}

                    {event.notes && (
                      <div className="text-xs text-gray-600 mt-2" data-testid="event-notes">
                        {event.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}