// ============================================================================
// MS2 Screen 4: Risk Register Update
// View and update risk register with risk cards
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Risk } from '../lib/api-client';

interface RiskRegisterProps {
  onNavigate?: (page: string, params?: any) => void;
}

export default function RiskRegister({ onNavigate }: RiskRegisterProps = {}) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadRisks();
  }, [statusFilter]);

  async function loadRisks() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getRisks({
        status: statusFilter || undefined,
        limit: 50,
      });
      setRisks(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risks');
    } finally {
      setLoading(false);
    }
  }

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

  function getStatusColor(status: string) {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  function getDecisionColor(decision: string) {
    const colors = {
      under_review: 'bg-blue-100 text-blue-800',
      accept: 'bg-green-100 text-green-800',
      mitigate: 'bg-yellow-100 text-yellow-800',
      transfer: 'bg-purple-100 text-purple-800',
      avoid: 'bg-red-100 text-red-800',
    };
    return colors[decision as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="p-6" data-testid="risk-register-page">
      <div className="mb-6">
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Risk Register
        </h1>
        <p className="text-gray-600">
          Manage identified risks and track mitigation actions
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm mb-1">
            Status Filter
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
            data-testid="status-filter"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => onNavigate?.('/risks/new')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            data-testid="create-risk-button"
          >
            + Create Risk
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
          Loading risks...
        </div>
      )}

      {/* Empty State */}
      {!loading && risks.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="empty-state">
          No risks found
        </div>
      )}

      {/* Risk Cards Grid */}
      {!loading && risks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {risks.map((risk) => (
            <div
              key={risk.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onNavigate?.(`/risks/${risk.id}`)}
              data-testid="risk-card"
              data-risk-id={risk.id}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-gray-500" data-testid="risk-id">
                    {risk.risk_id}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusColor(risk.status)}`}
                    data-testid="risk-status"
                  >
                    {risk.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg" data-testid="risk-title">
                  {risk.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2" data-testid="risk-description">
                {risk.description}
              </p>

              {/* Risk Score */}
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Risk Score</span>
                  <span className="text-2xl" data-testid="risk-score">
                    {risk.risk_score}
                  </span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded ${getSeverityColor(risk.severity)}`}
                    data-testid="risk-severity"
                  >
                    {risk.severity}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-200" data-testid="risk-likelihood">
                    {risk.likelihood.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Decision */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Decision</div>
                <span
                  className={`px-2 py-1 rounded text-xs ${getDecisionColor(risk.decision)}`}
                  data-testid="risk-decision"
                >
                  {risk.decision.replace('_', ' ')}
                </span>
              </div>

              {/* Category */}
              <div className="text-xs text-gray-500" data-testid="risk-category">
                Category: {risk.category}
              </div>

              {/* Related Work Item */}
              {risk.related_work_item_id && (
                <div className="mt-2 text-xs text-blue-600" data-testid="related-work-item">
                  ðŸ”— Linked to work item
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && risks.length > 0 && (
        <div className="mt-6 text-sm text-gray-600" data-testid="risks-count">
          Showing {risks.length} risk{risks.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export { RiskRegister };
