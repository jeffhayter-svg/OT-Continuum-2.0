import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase-client';
import { JWTDebugPanel } from './packages/web/src/components/JWTDebugPanel';
import otContinuumLogo from 'figma:asset/298496903f3211cc578283efa0c2ca69fb76038f.png';

// Import debug utilities (dev-only)
import './lib/auth-debug-root';

// Import preview mode utilities
import { isFigmaPreviewMode, getPreviewTenantContext } from './lib/preview-mode';
import { PreviewModeBanner } from './components/PreviewModeBanner';

// Import tenant context and components
import { TenantProvider, useTenantContext } from './contexts/TenantContext';
import { TenantResolver, type TenantContext } from './pages/TenantResolver';
import { AuthGate } from './components/AuthGate';
import { DevDiagnostics } from './components/DevDiagnostics';
import { AdminDiagnostics } from './pages/AdminDiagnostics';
import { AuthDebugPanel } from './components/AuthDebugPanel';
import { RlsDebugPanel } from './components/RlsDebugPanel';
import { RequireRole, RoleGuard } from './components/RequireRole';

// Import workflow pages
import { SignalIngestion } from './packages/web/src/pages/SignalIngestion';
import { SignalClassification } from './packages/web/src/pages/SignalClassification';
import { SignalCorrelation } from './packages/web/src/pages/SignalCorrelation';
import { RiskRegister } from './packages/web/src/pages/RiskRegister';
import { RiskDecision } from './packages/web/src/pages/RiskDecision';
import { ExecutionTracking } from './packages/web/src/pages/ExecutionTracking';
import { RiskAdjustment } from './packages/web/src/pages/RiskAdjustment';
import { WorkOrdersPage } from './pages/WorkOrdersPage';

// Import onboarding pages
import { SiteManagement } from './pages/SiteManagement';
import { SiteOnboarding } from './pages/SiteOnboarding';

// Import empty state screens
import { NoProcessUnitsState } from './components/EmptyStateScreens';

function AppContent() {
  const { user, userId, tenantContext, setTenantContext, clearAuth, loading: authLoading } = useTenantContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showResolver, setShowResolver] = useState(false);
  
  // Onboarding state
  const [onboardingSite, setOnboardingSite] = useState<{ id: string; name: string } | null>(null);
  const [siteOnboardingComplete, setSiteOnboardingComplete] = useState(true);

  // Check if running in Figma Preview Mode
  const isPreviewMode = isFigmaPreviewMode();

  // Auto-login in preview mode
  useEffect(() => {
    if (isPreviewMode && !tenantContext) {
      console.log('[App] Preview Mode: Setting mock tenant context');
      const previewContext = getPreviewTenantContext();
      setTenantContext(previewContext);
    }
  }, [isPreviewMode, tenantContext, setTenantContext]);

  // Session restore on app load
  useEffect(() => {
    if (authLoading) {
      console.log('[App] Waiting for auth to resolve...');
      return;
    }

    console.log('[App] Auth resolved - user:', user ? user.id : 'none');
    
    if (user) {
      const storedContext = localStorage.getItem('ot_tenant_context');
      if (!storedContext) {
        console.log('[App] → No tenant context found, triggering resolver');
        setShowResolver(true);
      } else {
        console.log('[App] ✓ Tenant context found in localStorage');
      }
    } else {
      console.log('[App] ✗ No user - showing login');
    }
  }, [user, authLoading]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[App] User signed in - User ID:', session.user.id, '- triggering resolver');
        setShowResolver(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('[App] User signed out - clearing state');
        clearAuth();
        setShowResolver(false);
        setCurrentPage('dashboard');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[App] Token refreshed - session still valid');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearAuth]);

  // Listen for custom navigation events
  useEffect(() => {
    const handleNavigateToAdmin = () => {
      setCurrentPage('admin-diagnostics');
    };

    window.addEventListener('navigate-to-admin-diagnostics', handleNavigateToAdmin);

    return () => {
      window.removeEventListener('navigate-to-admin-diagnostics', handleNavigateToAdmin);
    };
  }, []);

  // Check URL for resolver flag or auto-show resolver if logged in but no tenant
  useEffect(() => {
    if (authLoading) return;
    
    const params = new URLSearchParams(window.location.search);
    if (user && !tenantContext) {
      if (params.get('resolver') === 'true' || !showResolver) {
        setShowResolver(true);
      }
    } else if (user && tenantContext) {
      setShowResolver(false);
      
      if (params.get('resolver') === 'true') {
        const isAdmin = tenantContext.role === 'admin' || tenantContext.role === 'owner';
        console.log('[App] Tenant resolved - routing user (role:', tenantContext.role, ')');
        setCurrentPage('dashboard');
        window.history.replaceState({}, '', '/');
      }
    }
  }, [user, tenantContext, authLoading]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.session) {
        setError('Login successful!');
        setShowResolver(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const full_name = email.split('@')[0];

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            full_name: full_name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        setError('Account created!');
        setTimeout(() => {
          setShowResolver(true);
        }, 1000);
      } else {
        setError('Account created! Please check your email to confirm.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    clearAuth();
    setCurrentPage('dashboard');
    setShowResolver(false);
  }

  function handleTenantResolved(context: TenantContext) {
    setTenantContext(context);
    setShowResolver(false);
    window.history.replaceState({}, '', '/');
  }

  function handleResolverError() {
    setShowResolver(false);
    handleLogout();
  }

  // Render workflow page based on currentPage state
  function renderPage() {
    const handleNavigate = (page: string, params?: any) => {
      setCurrentPage(page.replace(/^\//, ''));
    };

    switch (currentPage) {
      case 'site-management':
        return (
          <SiteManagement
            onNavigateToOnboarding={(siteId, siteName) => {
              setOnboardingSite({ id: siteId, name: siteName });
            }}
          />
        );
      case 'signal-ingestion':
        return <SignalIngestion />;
      case 'classification':
        return <SignalClassification />;
      case 'correlation':
        return <SignalCorrelation />;
      case 'risk-register':
      case 'risks':
        return <RiskRegister onNavigate={handleNavigate} />;
      case 'risk-decision':
        return <RiskDecision onNavigate={handleNavigate} />;
      case 'execution-tracking':
        return <ExecutionTracking />;
      case 'risk-adjustment':
        return <RiskAdjustment onNavigate={handleNavigate} />;
      case 'work-orders':
        return <WorkOrdersPage />;
      case 'admin-diagnostics':
        return <AdminDiagnostics />;
      default:
        return null;
    }
  }

  // GUARD: Show loading state while auth is resolving
  if (authLoading && !isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ot-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ot-yellow mb-4"></div>
          <p className="text-ot-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show tenant resolver if user is logged in but no tenant context (skip in preview mode)
  if (user && userId && showResolver && !isPreviewMode) {
    return (
      <>
        <TenantResolver 
          userId={userId}
          userEmail={user.email || ''}
          onResolved={handleTenantResolved}
          onError={handleResolverError}
        />
        <DevDiagnostics />
      </>
    );
  }

  // If user is logged in and has tenant context, show app (or preview mode is active)
  if ((user && tenantContext) || (isPreviewMode && tenantContext)) {
    // Show onboarding flow if site is selected for onboarding
    if (onboardingSite) {
      return (
        <SiteOnboarding
          siteId={onboardingSite.id}
          siteName={onboardingSite.name}
          onComplete={() => {
            setOnboardingSite(null);
            setCurrentPage('dashboard');
            setSiteOnboardingComplete(true);
          }}
        />
      );
    }
    
    return (
      <AuthGate requireAuth requireTenant>
        {/* Preview Mode Banner */}
        {isPreviewMode && <PreviewModeBanner />}
        
        {/* Development Mode Indicator */}
        {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
          <div className="bg-ot-yellow text-ot-black px-4 py-2 text-center text-xs font-semibold">
            🔐 Dev Mode | Tenant: {tenantContext.tenantName} | Role: {tenantContext.role}
          </div>
        )}
        
        <div className="min-h-screen bg-ot-black">
          {/* Navigation */}
          <nav className="card-ot" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button onClick={() => setCurrentPage('dashboard')} className="hover:opacity-80 transition-opacity">
                <img 
                  src={otContinuumLogo} 
                  alt="OT Continuum" 
                  className="h-[70px]"
                  style={{ objectFit: 'contain' }}
                />
              </button>
              <div className="flex items-center gap-4">
                <div className="text-sm text-ot-white">
                  <div>{isPreviewMode ? 'preview@example.com' : user.email}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {tenantContext.tenantName} • {tenantContext.role}
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-secondary">
                  Logout
                </button>
              </div>
            </div>
          </nav>

          {/* Show workflow page or dashboard */}
          {currentPage !== 'dashboard' ? (
            <div className="max-w-7xl mx-auto">
              <div className="p-4">
                <button onClick={() => setCurrentPage('dashboard')} className="text-accent hover:text-ot-yellow">
                  ← Back to Dashboard
                </button>
              </div>
              {renderPage()}
            </div>
          ) : (
            <div className="max-w-7xl mx-auto p-8">
              <div className="card-ot">
                <h2 className="text-2xl font-semibold mb-4">WELCOME TO OT CONTINUUM</h2>
                <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                  Multi-tenant SaaS for Operational Technology Risk Management
                </p>

                <div className="space-y-6">
                  {/* Site Management Section */}
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Site Configuration</h3>
                    <div 
                      onClick={() => setCurrentPage('site-management')}
                      className="card-ot card-ot-hover"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-ot-yellow text-ot-black flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-semibold mb-1">Manage Sites</h4>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Configure production sites, process units, plant tags, and OT assets
                          </p>
                        </div>
                        <span className="text-accent text-xl">→</span>
                      </div>
                    </div>
                  </section>

                  {/* MS2 Workflow Screens */}
                  <section>
                    <h3 className="text-lg font-semibold mb-3">MS2 Workflow Screens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { num: '1', title: 'Signal Ingestion', desc: 'Monitor incoming signals' },
                        { num: '2', title: 'Classification', desc: 'Classify by severity' },
                        { num: '3', title: 'Correlation', desc: 'Group related signals' },
                        { num: '4', title: 'Risk Register', desc: 'View identified risks' },
                        { num: '5', title: 'Risk Decision', desc: 'Make risk decisions' },
                        { num: '6', title: 'Execution Tracking', desc: 'Track mitigations' },
                        { num: '7', title: 'Risk Adjustment', desc: 'Adjust risk scores' },
                        { num: '8', title: 'Work Orders', desc: 'Manage work orders' },
                      ].map((screen) => (
                        <div 
                          key={screen.num}
                          onClick={() => setCurrentPage(screen.title.toLowerCase().replace(/\s+/g, '-'))}
                          className="card-ot card-ot-hover"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ot-yellow text-ot-black flex items-center justify-center text-sm font-semibold">
                              {screen.num}
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">{screen.title}</h4>
                              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {screen.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tenant Info */}
                  <section className="card-ot">
                    <h3 className="font-semibold mb-2">Tenant Information</h3>
                    <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <div><strong className="text-ot-white">Organization:</strong> {tenantContext.tenantName}</div>
                      <div><strong className="text-ot-white">Plan:</strong> {tenantContext.tenantPlan}</div>
                      <div><strong className="text-ot-white">Your Role:</strong> {tenantContext.role}</div>
                      <div className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                        Tenant ID: {tenantContext.tenantId}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>

        <JWTDebugPanel />
        <DevDiagnostics />
        <AuthDebugPanel />
        <RlsDebugPanel />
      </AuthGate>
    );
  }

  // Show login page
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-ot-black px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={otContinuumLogo} 
                alt="OT Continuum" 
                className="h-[110px]"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Operational Technology Risk Management Platform
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              MS2 Compliant
            </p>
          </div>

          {/* Login Form */}
          <div className="card-ot">
            <h2 className="text-xl font-semibold mb-6">Sign In</h2>

            {error && (
              <div className={error.includes('successful') || error.includes('created') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-ot w-full"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-ot w-full"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-hero w-full mt-6">
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Don't have an account?
              </p>
              <button 
                onClick={handleSignup}
                disabled={loading}
                className="btn-success w-full"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Your current email and password will be used
              </p>
            </div>
          </div>

          {/* Getting Started */}
          <div className="card-ot">
            <h3 className="text-sm font-semibold mb-2">Getting Started</h3>
            <div className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              <div>1. Enter your email and password</div>
              <div>2. Click "Create Account" to sign up</div>
              <div>3. Your organization will be created automatically</div>
              <div>4. You'll be logged in as an admin</div>
            </div>
          </div>
        </div>
      </div>

      <JWTDebugPanel />
      <DevDiagnostics />
      <AuthDebugPanel />
      <RlsDebugPanel />
    </>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}