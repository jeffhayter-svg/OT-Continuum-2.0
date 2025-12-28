// ============================================================================
// MS2 Screen 1: Signal Ingestion
// Read-only list of incoming signals
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Signal } from '../lib/api-client';

export default function SignalIngestion() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteFilter, setSiteFilter] = useState<string>('');

  useEffect(() => {
    loadSignals();
  }, [siteFilter]);

  async function loadSignals() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSignals({
        site_id: siteFilter || undefined,
        status: 'raw',
        limit: 50,
        offset: 0,
      });
      setSignals(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6" data-testid="signal-ingestion-page">
      <div className="mb-6">
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Signal Ingestion
        </h1>
        <p className="text-gray-600">
          Real-time monitoring of incoming signals from sensors and systems
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label htmlFor="site-filter" className="block text-sm mb-1">
            Filter by Site
          </label>
          <input
            id="site-filter"
            type="text"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            placeholder="Site ID"
            className="border rounded px-3 py-2"
            data-testid="site-filter"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={loadSignals}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            data-testid="refresh-button"
          >
            Refresh
          </button>
        </div>
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

      {/* Signals List */}
      {!loading && signals.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="empty-state">
          No signals found
        </div>
      )}

      {!loading && signals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-testid="signals-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Timestamp</th>
                <th className="border px-4 py-2 text-left">Source</th>
                <th className="border px-4 py-2 text-left">Tag</th>
                <th className="border px-4 py-2 text-left">Type</th>
                <th className="border px-4 py-2 text-right">Value</th>
                <th className="border px-4 py-2 text-left">Unit</th>
                <th className="border px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr
                  key={signal.id}
                  className="hover:bg-gray-50"
                  data-testid="signal-row"
                  data-signal-id={signal.id}
                >
                  <td className="border px-4 py-2" data-testid="signal-timestamp">
                    {new Date(signal.measured_at).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2" data-testid="signal-source">
                    {signal.source}
                  </td>
                  <td className="border px-4 py-2" data-testid="signal-tag">
                    {signal.tag || '-'}
                  </td>
                  <td className="border px-4 py-2" data-testid="signal-type">
                    {signal.signal_type}
                  </td>
                  <td className="border px-4 py-2 text-right" data-testid="signal-value">
                    {signal.value.toFixed(2)}
                  </td>
                  <td className="border px-4 py-2" data-testid="signal-unit">
                    {signal.unit}
                  </td>
                  <td className="border px-4 py-2 text-center" data-testid="signal-status">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        signal.status === 'raw'
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {signal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && signals.length > 0 && (
        <div className="mt-4 text-sm text-gray-600" data-testid="signals-count">
          Showing {signals.length} signal{signals.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}


export { SignalIngestion };
