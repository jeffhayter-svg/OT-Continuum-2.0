// ============================================================================
// Assets Management Page
// View and create assets for the active tenant
// ============================================================================

import { useEffect, useState } from 'react';
import { apiClient, Asset, Site } from '../lib/api-client';
import { useTenant } from '../contexts/TenantContext';

export function Assets() {
  const { activeTenantId } = useTenant();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [siteFilter, setSiteFilter] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    site_id: '',
    name: '',
    description: '',
    asset_type: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    status: 'operational' as const,
  });

  useEffect(() => {
    if (activeTenantId) {
      loadSites();
      loadAssets();
    }
  }, [activeTenantId, siteFilter]);

  async function loadSites() {
    if (!activeTenantId) return;
    
    try {
      const response = await apiClient.getSites(activeTenantId);
      setSites(response.data);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  }

  async function loadAssets() {
    if (!activeTenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAssets(activeTenantId, {
        site_id: siteFilter || undefined,
      });
      setAssets(response.data);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenantId) return;

    try {
      setError(null);
      await apiClient.createAsset(activeTenantId, formData);
      
      // Reset form and reload assets
      setFormData({
        site_id: '',
        name: '',
        description: '',
        asset_type: '',
        manufacturer: '',
        model: '',
        serial_number: '',
        status: 'operational',
      });
      setShowCreateForm(false);
      loadAssets();
    } catch (err) {
      console.error('Failed to create asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  }

  function getSiteName(siteId: string): string {
    return sites.find(s => s.id === siteId)?.name || siteId;
  }

  if (!activeTenantId) {
    return (
      <div className="p-6 max-w-7xl mx-auto" data-testid="assets-page">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please select a tenant to view assets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="assets-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-2">Assets</h1>
          <p className="text-gray-600">Manage operational assets across your sites</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          data-testid="create-asset-button"
        >
          {showCreateForm ? 'Cancel' : '+ Create Asset'}
        </button>
      </div>

      <div className="mb-6">
        <label htmlFor="site-filter" className="block text-sm mb-1">
          Filter by Site
        </label>
        <select
          id="site-filter"
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="border rounded px-3 py-2"
          data-testid="site-filter-select"
        >
          <option value="">All Sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800" data-testid="error-message">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-6 bg-white border rounded-lg" data-testid="create-asset-form">
          <h2 className="text-xl mb-4">Create New Asset</h2>
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div>
              <label htmlFor="asset-site" className="block text-sm mb-1">
                Site *
              </label>
              <select
                id="asset-site"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
                data-testid="asset-site-select"
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="asset-name" className="block text-sm mb-1">
                Asset Name *
              </label>
              <input
                id="asset-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Turbine Generator 01"
                data-testid="asset-name-input"
              />
            </div>

            <div>
              <label htmlFor="asset-description" className="block text-sm mb-1">
                Description
              </label>
              <textarea
                id="asset-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="Brief description of the asset"
                data-testid="asset-description-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="asset-type" className="block text-sm mb-1">
                  Asset Type *
                </label>
                <input
                  id="asset-type"
                  type="text"
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Turbine, Pump, Sensor"
                  data-testid="asset-type-input"
                />
              </div>

              <div>
                <label htmlFor="asset-manufacturer" className="block text-sm mb-1">
                  Manufacturer
                </label>
                <input
                  id="asset-manufacturer"
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Siemens"
                  data-testid="asset-manufacturer-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="asset-model" className="block text-sm mb-1">
                  Model
                </label>
                <input
                  id="asset-model"
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Model number"
                  data-testid="asset-model-input"
                />
              </div>

              <div>
                <label htmlFor="asset-serial" className="block text-sm mb-1">
                  Serial Number
                </label>
                <input
                  id="asset-serial"
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Serial number"
                  data-testid="asset-serial-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="asset-status" className="block text-sm mb-1">
                Status
              </label>
              <select
                id="asset-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
                data-testid="asset-status-select"
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                data-testid="submit-asset-button"
              >
                Create Asset
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
                data-testid="cancel-asset-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500" data-testid="loading-indicator">
          Loading assets...
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500 mb-4">No assets found</p>
          {sites.length === 0 ? (
            <p className="text-sm text-gray-400">Create a site first to add assets</p>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-blue-600 hover:text-blue-700"
              data-testid="create-first-asset-button"
            >
              Create your first asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="assets-grid">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              data-testid={`asset-card-${asset.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg">{asset.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    asset.status === 'operational'
                      ? 'bg-green-100 text-green-800'
                      : asset.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : asset.status === 'offline'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">
                📍 {getSiteName(asset.site_id)}
              </p>
              
              {asset.description && (
                <p className="text-sm text-gray-600 mb-2">{asset.description}</p>
              )}
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>Type: {asset.asset_type}</p>
                {asset.manufacturer && <p>Mfr: {asset.manufacturer}</p>}
                {asset.model && <p>Model: {asset.model}</p>}
                {asset.serial_number && <p>S/N: {asset.serial_number}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
