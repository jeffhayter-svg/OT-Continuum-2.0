// ============================================================================
// Sites Management Page
// View and create sites for the active tenant
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Site } from '../lib/api-client';
import { useTenant } from '../contexts/TenantContext';

export default function Sites() {
  const { activeTenantId } = useTenant();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    site_type: '',
    status: 'active' as const,
  });

  useEffect(() => {
    if (activeTenantId) {
      loadSites();
    }
  }, [activeTenantId]);

  async function loadSites() {
    if (!activeTenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSites(activeTenantId);
      setSites(response.data);
    } catch (err) {
      console.error('Failed to load sites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenantId) return;

    try {
      setError(null);
      await apiClient.createSite(activeTenantId, formData);
      
      // Reset form and reload sites
      setFormData({
        name: '',
        description: '',
        location: '',
        site_type: '',
        status: 'active',
      });
      setShowCreateForm(false);
      loadSites();
    } catch (err) {
      console.error('Failed to create site:', err);
      setError(err instanceof Error ? err.message : 'Failed to create site');
    }
  }

  if (!activeTenantId) {
    return (
      <div className="p-6 max-w-7xl mx-auto" data-testid="sites-page">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please select a tenant to view sites.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="sites-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-2">Sites</h1>
          <p className="text-gray-600">Manage operational sites for your organization</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          data-testid="create-site-button"
        >
          {showCreateForm ? 'Cancel' : '+ Create Site'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800" data-testid="error-message">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-6 bg-white border rounded-lg" data-testid="create-site-form">
          <h2 className="text-xl mb-4">Create New Site</h2>
          <form onSubmit={handleCreateSite} className="space-y-4">
            <div>
              <label htmlFor="site-name" className="block text-sm mb-1">
                Site Name *
              </label>
              <input
                id="site-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Manufacturing Plant A"
                data-testid="site-name-input"
              />
            </div>

            <div>
              <label htmlFor="site-description" className="block text-sm mb-1">
                Description
              </label>
              <textarea
                id="site-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Brief description of the site"
                data-testid="site-description-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="site-location" className="block text-sm mb-1">
                  Location
                </label>
                <input
                  id="site-location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="City, State"
                  data-testid="site-location-input"
                />
              </div>

              <div>
                <label htmlFor="site-type" className="block text-sm mb-1">
                  Site Type
                </label>
                <input
                  id="site-type"
                  type="text"
                  value={formData.site_type}
                  onChange={(e) => setFormData({ ...formData, site_type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Manufacturing, Warehouse"
                  data-testid="site-type-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="site-status" className="block text-sm mb-1">
                Status
              </label>
              <select
                id="site-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
                data-testid="site-status-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                data-testid="submit-site-button"
              >
                Create Site
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
                data-testid="cancel-site-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500" data-testid="loading-indicator">
          Loading sites...
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500 mb-4">No sites found</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-blue-600 hover:text-blue-700"
            data-testid="create-first-site-button"
          >
            Create your first site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="sites-grid">
          {sites.map((site) => (
            <div
              key={site.id}
              className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              data-testid={`site-card-${site.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg">{site.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    site.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : site.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {site.status}
                </span>
              </div>
              
              {site.description && (
                <p className="text-sm text-gray-600 mb-2">{site.description}</p>
              )}
              
              {site.location && (
                <p className="text-sm text-gray-500">ðŸ“ {site.location}</p>
              )}
              
              {site.site_type && (
                <p className="text-sm text-gray-500 mt-1">Type: {site.site_type}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export { Sites };
