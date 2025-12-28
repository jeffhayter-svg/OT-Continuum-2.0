// ============================================================================
// Onboarding Wizard - Create Organization + First Site
// 3-step wizard for new users without a tenant
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, CreateOrganizationRequest, CreateSiteRequest } from '../lib/api-client';

type WizardStep = 1 | 2 | 3;

interface OrganizationData {
  name: string;
  industry: string;
  region: string;
}

interface SiteData {
  name: string;
  type: string;
  country: string;
  region: string;
}

interface CreatedOrganization {
  id: string;
  name: string;
  role: string;
}

interface CreatedSite {
  id: string;
  name: string;
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Organization data
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    industry: '',
    region: '',
  });
  const [createdOrg, setCreatedOrg] = useState<CreatedOrganization | null>(null);

  // Step 2: Site data
  const [siteData, setSiteData] = useState<SiteData>({
    name: '',
    type: 'Plant',
    country: '',
    region: '',
  });
  const [createdSite, setCreatedSite] = useState<CreatedSite | null>(null);

  // ========================================================================
  // Step 1: Create Organization
  // ========================================================================

  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      console.log('[Onboarding] Creating organization:', orgData);

      const request: CreateOrganizationRequest = {
        name: orgData.name,
        industry: orgData.industry || undefined,
        region: orgData.region || undefined,
      };

      const response = await apiClient.createOrganization(request);

      console.log('[Onboarding] Organization created:', response);

      // Save created org
      setCreatedOrg({
        id: response.tenant.id,
        name: response.tenant.name,
        role: response.membership.role,
      });

      // Save to localStorage for immediate use
      localStorage.setItem('activeTenantId', response.tenant.id);
      localStorage.setItem('activeTenantName', response.tenant.name);
      localStorage.setItem('activeRole', response.membership.role);

      // Move to step 2
      setCurrentStep(2);
    } catch (err) {
      console.error('[Onboarding] Failed to create organization:', err);
      
      if (err instanceof Error) {
        setError(err.message || 'Failed to create organization');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  // ========================================================================
  // Step 2: Create Site (Optional)
  // ========================================================================

  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      console.log('[Onboarding] Creating site:', siteData);

      const request: CreateSiteRequest = {
        name: siteData.name,
        type: siteData.type,
        country: siteData.country || undefined,
        region: siteData.region || undefined,
      };

      const response = await apiClient.createSiteOnboarding(request);

      console.log('[Onboarding] Site created:', response);

      // Save created site
      setCreatedSite({
        id: response.data.id,
        name: response.data.name,
      });

      // Move to step 3 (confirmation)
      setCurrentStep(3);
    } catch (err) {
      console.error('[Onboarding] Failed to create site:', err);
      
      if (err instanceof Error) {
        setError(err.message || 'Failed to create site');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  function skipSiteCreation() {
    console.log('[Onboarding] Skipping site creation');
    setCurrentStep(3);
  }

  // ========================================================================
  // Step 3: Confirmation and Enter App
  // ========================================================================

  function enterApp() {
    console.log('[Onboarding] Entering app');
    navigate('/');
  }

  // ========================================================================
  // Render Steps
  // ========================================================================

  return (
    <div 
      className="min-h-screen bg-slate-50 py-12 px-4"
      data-testid="onboarding-wizard"
    >
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep
                      ? 'bg-blue-600 text-white'
                      : step === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                  data-testid={`step-indicator-${step}`}
                >
                  {step < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm text-slate-600" data-testid="step-label">
            Step {currentStep} of 3:{' '}
            {currentStep === 1 && 'Create Organization'}
            {currentStep === 2 && 'Create First Site'}
            {currentStep === 3 && 'Get Started'}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          {/* STEP 1: Create Organization */}
          {currentStep === 1 && (
            <div data-testid="step-1-content">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-slate-900 mb-2">Create your organization</h2>
                <p className="text-slate-600">
                  Set up your organization to start managing operational technology risks
                </p>
              </div>

              {error && (
                <div 
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6"
                  data-testid="error-message"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateOrganization} className="space-y-5">
                <div>
                  <label htmlFor="orgName" className="block text-sm text-slate-700 mb-2">
                    Organization Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    placeholder="e.g., ACME Manufacturing"
                    required
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="org-name-input"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm text-slate-700 mb-2">
                    Industry <span className="text-slate-500">(optional)</span>
                  </label>
                  <select
                    id="industry"
                    value={orgData.industry}
                    onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="industry-select"
                  >
                    <option value="">Select an industry</option>
                    <option value="Oil & Gas">Oil & Gas</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Mining">Mining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm text-slate-700 mb-2">
                    Primary Region <span className="text-slate-500">(optional)</span>
                  </label>
                  <select
                    id="region"
                    value={orgData.region}
                    onChange={(e) => setOrgData({ ...orgData, region: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="region-select"
                  >
                    <option value="">Select a region</option>
                    <option value="North America">North America</option>
                    <option value="South America">South America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                    <option value="Middle East">Middle East</option>
                    <option value="Africa">Africa</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !orgData.name.trim()}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  data-testid="create-org-button"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating organization...
                    </span>
                  ) : (
                    'Create Organization'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Create Site */}
          {currentStep === 2 && (
            <div data-testid="step-2-content">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-slate-900 mb-2">Create your first site</h2>
                <p className="text-slate-600">
                  Add a facility, plant, or terminal to start tracking assets and risks
                </p>
              </div>

              {error && (
                <div 
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6"
                  data-testid="error-message"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateSite} className="space-y-5">
                <div>
                  <label htmlFor="siteName" className="block text-sm text-slate-700 mb-2">
                    Site Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="siteName"
                    type="text"
                    value={siteData.name}
                    onChange={(e) => setSiteData({ ...siteData, name: e.target.value })}
                    placeholder="e.g., Houston Refinery"
                    required
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="site-name-input"
                  />
                </div>

                <div>
                  <label htmlFor="siteType" className="block text-sm text-slate-700 mb-2">
                    Site Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="siteType"
                    value={siteData.type}
                    onChange={(e) => setSiteData({ ...siteData, type: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="site-type-select"
                  >
                    <option value="Plant">Plant</option>
                    <option value="Terminal">Terminal</option>
                    <option value="Platform">Platform</option>
                    <option value="Facility">Facility</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-sm text-slate-700 mb-2">
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={siteData.country}
                      onChange={(e) => setSiteData({ ...siteData, country: e.target.value })}
                      placeholder="e.g., USA"
                      className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="country-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="siteRegion" className="block text-sm text-slate-700 mb-2">
                      State / Province
                    </label>
                    <input
                      id="siteRegion"
                      type="text"
                      value={siteData.region}
                      onChange={(e) => setSiteData({ ...siteData, region: e.target.value })}
                      placeholder="e.g., Texas"
                      className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="site-region-input"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={skipSiteCreation}
                    disabled={loading}
                    className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="skip-site-button"
                  >
                    Skip for Now
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !siteData.name.trim()}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    data-testid="create-site-button"
                  >
                    {loading ? 'Creating...' : 'Create Site'}
                  </button>
                </div>
              </form>

              <p className="text-xs text-slate-500 mt-4 text-center">
                You can add more sites later from the Sites page
              </p>
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {currentStep === 3 && (
            <div data-testid="step-3-content">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-slate-900 mb-2">You're all set!</h2>
                <p className="text-slate-600">
                  Your organization is ready. Let's start managing your OT risks.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-6 mb-6">
                <h3 className="text-sm text-slate-700 mb-4">Summary</h3>
                
                <div className="space-y-3">
                  {createdOrg && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-900">{createdOrg.name}</p>
                        <p className="text-xs text-slate-600">
                          Organization • Role: {createdOrg.role}
                        </p>
                      </div>
                    </div>
                  )}

                  {createdSite && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-900">{createdSite.name}</p>
                        <p className="text-xs text-slate-600">First Site Created</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={enterApp}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                data-testid="enter-app-button"
              >
                Enter OT Continuum →
              </button>

              <p className="text-xs text-slate-500 mt-4 text-center">
                You can invite team members and configure settings from the dashboard
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
