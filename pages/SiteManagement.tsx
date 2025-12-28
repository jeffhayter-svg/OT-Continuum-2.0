import React, { useState } from 'react';
import { Plus, Settings, CheckCircle, AlertCircle, MapPin } from 'lucide-react';

interface Site {
  site_id: string;
  site_name: string;
  location: string;
  onboarding_complete: boolean;
  process_units_count: number;
  plant_tags_count: number;
  assets_count: number;
  mapped_assets_count: number;
}

interface SiteManagementProps {
  onNavigateToOnboarding: (siteId: string, siteName: string) => void;
}

export function SiteManagement({ onNavigateToOnboarding }: SiteManagementProps) {
  const [sites] = useState<Site[]>([
    {
      site_id: 'site-1',
      site_name: 'Baytown Refinery',
      location: 'Baytown, TX',
      onboarding_complete: true,
      process_units_count: 12,
      plant_tags_count: 450,
      assets_count: 120,
      mapped_assets_count: 120,
    },
    {
      site_id: 'site-2',
      site_name: 'Port Arthur Chemical Plant',
      location: 'Port Arthur, TX',
      onboarding_complete: false,
      process_units_count: 3,
      plant_tags_count: 0,
      assets_count: 0,
      mapped_assets_count: 0,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');

  const handleCreateSite = () => {
    console.log('[SiteManagement] Creating site:', newSiteName, newSiteLocation);
    const newSiteId = `site-${Date.now()}`;
    onNavigateToOnboarding(newSiteId, newSiteName);
  };

  const getOnboardingProgress = (site: Site) => {
    const steps = [
      site.process_units_count > 0,
      site.plant_tags_count > 0,
      site.assets_count > 0,
      site.mapped_assets_count === site.assets_count && site.assets_count > 0,
    ];
    const completed = steps.filter(Boolean).length;
    return { completed, total: steps.length, percentage: (completed / steps.length) * 100 };
  };

  return (
    <div className="max-w-7xl mx-auto p-8" data-testid="site-management">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">SITE MANAGEMENT</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Manage your organization's production sites and configure operational monitoring
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center gap-2"
            data-testid="create-site-button"
          >
            <Plus className="w-5 h-5" />
            Add New Site
          </button>
        </div>
      </div>

      {/* Create Site Form */}
      {showCreateForm && (
        <div className="card-ot mb-6" style={{ border: '2px solid var(--ot-yellow)' }}>
          <h3 className="text-lg font-semibold mb-4">Create New Site</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Site Name</label>
              <input
                type="text"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="e.g., Baytown Refinery"
                className="input-ot w-full"
                data-testid="input-site-name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location</label>
              <input
                type="text"
                value={newSiteLocation}
                onChange={(e) => setNewSiteLocation(e.target.value)}
                placeholder="e.g., Baytown, TX"
                className="input-ot w-full"
                data-testid="input-site-location"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateSite}
              disabled={!newSiteName}
              className="btn-primary"
              data-testid="submit-create-site"
            >
              Create & Begin Setup
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewSiteName('');
                setNewSiteLocation('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map((site) => {
          const progress = getOnboardingProgress(site);
          
          return (
            <div
              key={site.site_id}
              className="card-ot"
              data-testid={`site-card-${site.site_id}`}
            >
              {/* Site Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{site.site_name}</h3>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <MapPin className="w-4 h-4" />
                    {site.location}
                  </div>
                </div>
                {site.onboarding_complete ? (
                  <div className="badge-success flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </div>
                ) : (
                  <div className="badge-warning flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Setup Required
                  </div>
                )}
              </div>

              {/* Onboarding Progress */}
              {!site.onboarding_complete && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Setup Progress</span>
                    <span className="text-ot-white">{progress.completed} / {progress.total} steps</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-elevated-1)', border: '1px solid var(--color-border-default)' }}>
                    <div
                      className="h-full bg-ot-yellow transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Site Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="card-ot">
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Process Units</div>
                  <div className="text-2xl font-bold">{site.process_units_count}</div>
                </div>
                <div className="card-ot">
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Plant Tags</div>
                  <div className="text-2xl font-bold">{site.plant_tags_count}</div>
                </div>
                <div className="card-ot">
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>OT Assets</div>
                  <div className="text-2xl font-bold">{site.assets_count}</div>
                </div>
                <div className="card-ot">
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Mapped Assets</div>
                  <div className="text-2xl font-bold" style={{ 
                    color: site.mapped_assets_count === site.assets_count ? 'var(--ot-green)' : 'var(--ot-yellow)' 
                  }}>
                    {site.mapped_assets_count}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {!site.onboarding_complete ? (
                  <button
                    onClick={() => onNavigateToOnboarding(site.site_id, site.site_name)}
                    className="btn-primary flex-1"
                    data-testid={`continue-setup-${site.site_id}`}
                  >
                    Continue Setup
                  </button>
                ) : (
                  <button
                    className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                    data-testid={`manage-site-${site.site_id}`}
                  >
                    <Settings className="w-4 h-4" />
                    Manage Site
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sites.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-xl font-semibold mb-2">No Sites Configured</h3>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Create your first site to begin operational monitoring
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Site
          </button>
        </div>
      )}
    </div>
  );
}
