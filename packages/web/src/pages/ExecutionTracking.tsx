// ============================================================================
// MS2 Screen 7: Execution Tracking
// Track work items and mitigation actions
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, WorkItem } from '../lib/api-client';

export function ExecutionTracking() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadWorkItems();
  }, [statusFilter]);

  async function loadWorkItems() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWorkItems({
        status: statusFilter || undefined,
        limit: 50,
      });
      setWorkItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work items');
    } finally {
      setLoading(false);
    }
  }

  async function updateWorkItemStatus(
    workItemId: string,
    newStatus: WorkItem['status']
  ) {
    try {
      setUpdatingStatus(workItemId);
      setError(null);
      await apiClient.updateWorkItem(workItemId, { status: newStatus });
      await loadWorkItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update work item');
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      draft: 'bg-gray-200 text-gray-800',
      ready: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  function getPriorityColor(priority: string) {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-400 text-white';
  }

  const statusOptions: WorkItem['status'][] = [
    'draft',
    'ready',
    'in_progress',
    'completed',
    'cancelled',
  ];

  return (
    <div className="p-6" data-testid="execution-tracking-page">
      <div className="mb-6">
        <h1 className="text-2xl mb-2" data-testid="page-title">
          Execution Tracking
        </h1>
        <p className="text-gray-600">
          Monitor and update status of mitigation actions and work items
        </p>
      </div>

      {/* Filters */}
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
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={loadWorkItems}
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
          Loading work items...
        </div>
      )}

      {/* Empty State */}
      {!loading && workItems.length === 0 && (
        <div className="text-center py-8 text-gray-500" data-testid="empty-state">
          No work items found
        </div>
      )}

      {/* Work Items List */}
      {!loading && workItems.length > 0 && (
        <div className="space-y-4">
          {workItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-white"
              data-testid="work-item-card"
              data-work-item-id={item.id}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg" data-testid="work-item-title">
                      {item.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getPriorityColor(item.priority)}`}
                      data-testid="work-item-priority"
                    >
                      {item.priority}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2" data-testid="work-item-description">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span data-testid="work-item-type">Type: {item.work_item_type}</span>
                    {item.due_at && (
                      <span data-testid="work-item-due">
                        Due: {new Date(item.due_at).toLocaleDateString()}
                      </span>
                    )}
                    {item.started_at && (
                      <span data-testid="work-item-started">
                        Started: {new Date(item.started_at).toLocaleDateString()}
                      </span>
                    )}
                    {item.completed_at && (
                      <span data-testid="work-item-completed">
                        Completed: {new Date(item.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateWorkItemStatus(item.id, e.target.value as WorkItem['status'])
                    }
                    disabled={updatingStatus === item.id}
                    className={`border rounded px-3 py-1 text-sm ${getStatusColor(item.status)}`}
                    data-testid="status-select"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  {updatingStatus === item.id && (
                    <div className="text-xs text-gray-500 mt-1">Updating...</div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span data-testid="progress-percentage">
                    {item.status === 'completed'
                      ? '100%'
                      : item.status === 'in_progress'
                      ? '50%'
                      : item.status === 'ready'
                      ? '25%'
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2" data-testid="progress-bar">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.status === 'completed'
                        ? 'bg-green-500 w-full'
                        : item.status === 'in_progress'
                        ? 'bg-yellow-500 w-1/2'
                        : item.status === 'ready'
                        ? 'bg-blue-500 w-1/4'
                        : 'bg-gray-400 w-0'
                    }`}
                  />
                </div>
              </div>

              {/* Metadata */}
              {item.data && Object.keys(item.data).length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Additional Details
                  </summary>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && workItems.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded" data-testid="summary">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {statusOptions.map((status) => {
              const count = workItems.filter((item) => item.status === status).length;
              return (
                <div key={status} data-testid={`summary-${status}`}>
                  <div className="text-2xl">{count}</div>
                  <div className="text-xs text-gray-600">{status.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
