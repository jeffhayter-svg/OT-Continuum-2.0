// ============================================================================
// MS2 Screen 2: Signal Classification
// Classify signals as normal, warning, alarm, etc.
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Signal } from '../lib/api-client';

export function SignalClassification() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classifying, setClassifying] = useState<string | null>(null);

  useEffect(() => {
    loadSignals();
  }, []);

  async function loadSignals() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSignals({
        status: 'validated',
        limit: 50,
      });
      setSignals(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  }

  async function classifySignal(signalId: string, classification: string) {
    try {
      setClassifying(signalId);
      setError(null);
      await apiClient.classifySignal(signalId, classification);
      await loadSignals(); // Reload list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to classify signal');
    } finally {
      setClassifying(null);
    }
  }

  const classificationOptions = [
    { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-800' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'alarm', label: 'Alarm', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-600 text-white' },
  ];

  return (
    <div className="p-6" data-testid="signal-classification-page">
      <div className="mb-6">
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Signal Classification
        </h1>
        <p className="text-gray-600">
          Classify validated signals based on severity and impact
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
          Loading signals...
        </div>
      )}

      {/* Empty State */}
      {!loading && signals.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="empty-state">
          No signals available for classification
        </div>
      )}

      {/* Signals Grid */}
      {!loading && signals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
              data-testid="signal-card"
              data-signal-id={signal.id}
            >
              <div className="mb-3">
                <div className="text-sm text-gray-500" data-testid="signal-source">
                  {signal.source}
                </div>
                <div className="text-lg" data-testid="signal-tag">
                  {signal.tag || 'No tag'}
                </div>
                <div className="text-sm text-gray-500" data-testid="signal-timestamp">
                  {new Date(signal.measured_at).toLocaleString()}
                </div>
              </div>

              <div className="mb-3 p-3 bg-gray-50 rounded">
                <div className="text-2xl" data-testid="signal-value">
                  {signal.value.toFixed(2)} <span className="text-lg text-gray-600">{signal.unit}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {signal.signal_type}
                </div>
              </div>

              {/* Current Classification */}
              {signal.classification && (
                <div className="mb-3" data-testid="current-classification">
                  <span className="text-xs text-gray-600">Current: </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {signal.classification}
                  </span>
                </div>
              )}

              {/* Classification Buttons */}
              <div className="space-y-2">
                <div className="text-xs text-gray-600 mb-1">Classify as:</div>
                {classificationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => classifySignal(signal.id, option.value)}
                    disabled={classifying === signal.id}
                    className={`w-full px-3 py-2 rounded text-sm disabled:opacity-50 ${option.color}`}
                    data-testid={`classify-${option.value}`}
                  >
                    {classifying === signal.id ? 'Classifying...' : option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && signals.length > 0 && (
        <div className="mt-6 text-sm text-gray-600" data-testid="signals-count">
          {signals.length} signal{signals.length !== 1 ? 's' : ''} pending classification
        </div>
      )}
    </div>
  );
}
