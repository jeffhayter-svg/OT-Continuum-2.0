// ============================================================================
// MS2 Screen 3: Signal Correlation
// Group related signals together
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Signal } from '../lib/api-client';

export function SignalCorrelation() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [correlationGroup, setCorrelationGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlating, setCorrelating] = useState(false);

  useEffect(() => {
    loadSignals();
  }, []);

  async function loadSignals() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSignals({
        status: 'classified',
        limit: 50,
      });
      setSignals(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  }

  function toggleSignalSelection(signalId: string) {
    const newSelection = new Set(selectedSignals);
    if (newSelection.has(signalId)) {
      newSelection.delete(signalId);
    } else {
      newSelection.add(signalId);
    }
    setSelectedSignals(newSelection);
  }

  async function correlateSelectedSignals() {
    if (selectedSignals.size === 0 || !correlationGroup) {
      setError('Please select signals and enter a correlation group name');
      return;
    }

    try {
      setCorrelating(true);
      setError(null);
      await apiClient.correlateSignals(
        Array.from(selectedSignals),
        correlationGroup
      );
      setSelectedSignals(new Set());
      setCorrelationGroup('');
      await loadSignals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to correlate signals');
    } finally {
      setCorrelating(false);
    }
  }

  // Group signals by correlation_group
  const groupedSignals = signals.reduce((acc, signal) => {
    const group = signal.correlation_group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(signal);
    return acc;
  }, {} as Record<string, Signal[]>);

  return (
    <div className="p-6" data-testid="signal-correlation-page">
      <div className="mb-6">
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Signal Correlation
        </h1>
        <p className="text-gray-600">
          Group related signals to identify patterns and systemic issues
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

      {/* Correlation Controls */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <div className="mb-3">
          <span className="text-sm" data-testid="selection-count">
            {selectedSignals.size} signal{selectedSignals.size !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={correlationGroup}
            onChange={(e) => setCorrelationGroup(e.target.value)}
            placeholder="Correlation group name (e.g., TEMP-SPIKE-001)"
            className="flex-1 border rounded px-3 py-2"
            data-testid="correlation-group-input"
          />
          <button
            onClick={correlateSelectedSignals}
            disabled={correlating || selectedSignals.size === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            data-testid="correlate-button"
          >
            {correlating ? 'Correlating...' : 'Correlate Selected'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8" data-testid="loading-indicator">
          Loading signals...
        </div>
      )}

      {/* Empty State */}
      {!loading && signals.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="empty-state">
          No signals available for correlation
        </div>
      )}

      {/* Grouped Signals */}
      {!loading && signals.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedSignals).map(([group, groupSignals]) => (
            <div
              key={group}
              className="border rounded-lg p-4 bg-white"
              data-testid="correlation-group"
              data-group-name={group}
            >
              <h3 className="text-lg mb-3" data-testid="group-name">
                {group}
                <span className="ml-2 text-sm text-gray-500">
                  ({groupSignals.length} signal{groupSignals.length !== 1 ? 's' : ''})
                </span>
              </h3>

              <div className="space-y-2">
                {groupSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className={`flex items-center gap-3 p-3 rounded border ${
                      selectedSignals.has(signal.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    data-testid="signal-item"
                    data-signal-id={signal.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSignals.has(signal.id)}
                      onChange={() => toggleSignalSelection(signal.id)}
                      className="w-4 h-4"
                      data-testid="signal-checkbox"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm" data-testid="signal-source">
                          {signal.source}
                        </span>
                        <span className="text-sm text-gray-500" data-testid="signal-tag">
                          {signal.tag}
                        </span>
                        {signal.classification && (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              signal.classification === 'critical'
                                ? 'bg-red-600 text-white'
                                : signal.classification === 'alarm'
                                ? 'bg-red-100 text-red-800'
                                : signal.classification === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                            data-testid="signal-classification"
                          >
                            {signal.classification}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <span data-testid="signal-value">
                          {signal.value.toFixed(2)} {signal.unit}
                        </span>
                        {' • '}
                        <span data-testid="signal-timestamp">
                          {new Date(signal.measured_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
