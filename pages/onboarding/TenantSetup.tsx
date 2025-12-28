import React, { useState } from 'react';
import { Building2, CheckCircle, Loader2, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase-client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import otContinuumLogo from 'figma:asset/298496903f3211cc578283efa0c2ca69fb76038f.png';

interface TenantSetupProps {
  userId: string;
  userEmail: string;
  onComplete: (tenantContext: {
    tenantId: string;
    tenantName: string;
    tenantPlan: string;
    role: string;
  }) => void;
  onError: (error: string) => void;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export function TenantSetup({ userId, userEmail, onComplete, onError }: TenantSetupProps) {
  const [organizationName, setOrganizationName] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [steps, setSteps] = useState<SetupStep[]>([
    { id: 1, title: 'Create Organization', description: 'Setting up your tenant', status: 'pending' },
    { id: 2, title: 'Create User Profile', description: 'Setting up your user account', status: 'pending' },
    { id: 3, title: 'Assign Admin Role', description: 'Granting admin permissions', status: 'pending' },
  ]);

  const updateStepStatus = (stepId: number, status: SetupStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    
    if (!organizationName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.group('[TenantSetup] 🚀 Starting onboarding flow');
      console.log('User ID:', userId);
      console.log('Email:', userEmail);
      console.log('Organization:', organizationName);
      
      // CRITICAL: Verify session exists before making queries
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.group('[TenantSetup] 🔐 Session Validation (STRICT)');
      console.log('Session exists:', !!session);
      console.log('Session error:', sessionError?.message || 'None');
      
      // LOUD FAILURE #1: No session at all
      if (!session) {
        console.error('❌ VALIDATION FAILED: No session object returned');
        console.groupEnd();
        console.groupEnd();
        
        const errorMsg = sessionError 
          ? `No session found: ${sessionError.message}. Please sign in again.`
          : 'No active session found. Please sign in again.';
        
        updateStepStatus(1, 'error');
        updateStepStatus(2, 'error');
        updateStepStatus(3, 'error');
        throw new Error(errorMsg);
      }
      
      console.log('✅ Session object exists');
      console.log('User ID from session:', session.user?.id);
      console.log('User email from session:', session.user?.email);
      
      // LOUD FAILURE #2: Missing or invalid access token
      const accessToken = session.access_token;
      
      if (!accessToken) {
        console.error('❌ VALIDATION FAILED: access_token is null/undefined');
        console.log('Session object:', JSON.stringify(session, null, 2));
        console.groupEnd();
        console.groupEnd();
        
        updateStepStatus(1, 'error');
        updateStepStatus(2, 'error');
        updateStepStatus(3, 'error');
        throw new Error('Missing access token in session. Please sign out and sign in again.');
      }
      
      console.log('✅ Access token exists');
      console.log('Token length:', accessToken.length);
      console.log('Token preview (first 20 chars):', accessToken.substring(0, 20) + '...');
      
      // LOUD FAILURE #3: Token too short (likely invalid)
      if (accessToken.length < 100) {
        console.error('❌ VALIDATION FAILED: access_token is suspiciously short');
        console.error('Token length:', accessToken.length, '(expected >100)');
        console.error('Token preview:', accessToken.substring(0, 20) + '...');
        console.groupEnd();
        console.groupEnd();
        
        updateStepStatus(1, 'error');
        updateStepStatus(2, 'error');
        updateStepStatus(3, 'error');
        throw new Error(`Invalid access token (length: ${accessToken.length}). Please sign out and sign in again.`);
      }
      
      console.log('✅ Access token length valid (>100 chars)');
      
      // Log header preparation (safe - no full values)
      console.log('');
      console.log('📋 Headers to be sent:');
      console.log('  - Content-Type: application/json');
      console.log('  - apikey: present =', !!publicAnonKey, ', length =', publicAnonKey?.length || 0);
      console.log('  - Authorization: present =', true, ', length =', `Bearer ${accessToken}`.length);
      console.log('  - Authorization preview:', `Bearer ${accessToken.substring(0, 20)}...`);
      console.log('');
      
      // Verify headers are different (anon key ≠ user JWT)
      if (publicAnonKey === accessToken) {
        console.error('❌ CRITICAL: apikey and access_token are IDENTICAL! This should never happen!');
        console.groupEnd();
        console.groupEnd();
        throw new Error('Configuration error: API key and access token are identical. Please contact support.');
      }
      
      console.log('✅ apikey and access_token are different (correct)');
      console.groupEnd();
      
      console.groupEnd();

      // Call server endpoint to create tenant (bypasses RLS with service role)
      updateStepStatus(1, 'active');
      updateStepStatus(2, 'active');
      updateStepStatus(3, 'active');
      
      console.log('[TenantSetup] Calling server to create tenant...');
      
      // Ensure fullName has a value (use email prefix if empty)
      const finalFullName = fullName.trim() || userEmail.split('@')[0] || 'User';
      
      console.log('[TenantSetup] 📋 Request body:');
      console.log('  - organizationName:', organizationName.trim());
      console.log('  - fullName:', finalFullName);
      console.log('  - fullName source:', fullName.trim() ? 'user input' : 'email prefix');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-fb677d93/onboarding/create-tenant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey, // REQUIRED: Supabase public anon key
            'Authorization': `Bearer ${accessToken}`, // REQUIRED: User JWT
          },
          body: JSON.stringify({
            organizationName: organizationName.trim(),
            fullName: finalFullName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[TenantSetup] Server error:', errorData);
        updateStepStatus(1, 'error');
        updateStepStatus(2, 'error');
        updateStepStatus(3, 'error');
        throw new Error(errorData.message || 'Failed to create organization');
      }

      const responseData = await response.json();
      
      if (!responseData.success || !responseData.tenant || !responseData.membership) {
        console.error('[TenantSetup] Invalid response:', responseData);
        throw new Error(responseData.message || 'Server returned invalid response');
      }
      
      console.log('[TenantSetup] ✅ Tenant created successfully:', responseData.tenant);
      console.log('[TenantSetup] ✅ Membership:', responseData.membership);
      updateStepStatus(1, 'complete');
      updateStepStatus(2, 'complete');
      updateStepStatus(3, 'complete');

      console.group('[TenantSetup] 🎉 Onboarding complete!');
      console.log('Tenant ID:', responseData.tenant.id);
      console.log('Tenant Name:', responseData.tenant.name);
      console.log('User Role:', responseData.membership.role);
      console.groupEnd();

      // Complete onboarding - pass returned membership directly (no re-query needed)
      setTimeout(() => {
        onComplete({
          tenantId: responseData.tenant.id,
          tenantName: responseData.tenant.name,
          tenantPlan: 'free', // Default plan
          role: responseData.membership.role,
        });
      }, 1000);

    } catch (err) {
      console.error('[TenantSetup] ❌ Setup failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--color-bg-app)' }}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={otContinuumLogo} 
              alt="OT Continuum" 
              className="h-[110px]"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2">
            Set up your organization to begin managing operational technology risks
          </p>
        </div>

        {/* Setup Form */}
        <div 
          className="rounded-lg p-8"
          style={{ 
            backgroundColor: 'var(--color-bg-elevated-1)',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center`}
                    style={{
                      backgroundColor: 
                        step.status === 'complete' ? 'var(--color-status-success)' :
                        step.status === 'active' ? 'var(--color-accent-primary)' :
                        step.status === 'error' ? 'var(--color-status-critical)' :
                        'var(--color-bg-elevated-2)',
                      color: 
                        step.status === 'pending' ? 'var(--color-text-tertiary)' : 
                        step.status === 'active' ? 'var(--color-text-on-accent)' :
                        'var(--color-text-primary)'
                    }}
                  >
                    {step.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1">
                    <h3 
                      className="text-sm"
                      style={{
                        color: 
                          step.status === 'active' ? 'var(--color-accent-primary)' :
                          step.status === 'complete' ? 'var(--color-status-success)' :
                          step.status === 'error' ? 'var(--color-status-critical)' :
                          'var(--color-text-secondary)'
                      }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div 
              className="px-4 py-3 rounded mb-6 text-sm"
              style={{
                backgroundColor: 'var(--color-bg-error)',
                border: '1px solid var(--color-status-critical)',
                color: 'var(--color-text-error)'
              }}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="whitespace-pre-wrap">{error}</div>
              </div>
            </div>
          )}

          {!loading ? (
            <form onSubmit={handleSetup} className="space-y-6">
              <div>
                <label 
                  htmlFor="organizationName" 
                  className="block text-sm mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Organization Name <span style={{ color: 'var(--color-status-critical)' }}>*</span>
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Industrial Controls"
                  required
                  disabled={loading}
                  data-testid="onboarding-org-name-input"
                  className="w-full rounded-lg px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent-primary)';
                    e.target.style.backgroundColor = 'var(--color-bg-input-focus)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border-default)';
                    e.target.style.backgroundColor = 'var(--color-bg-input)';
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  This will be your main organization workspace
                </p>
              </div>

              <div>
                <label 
                  htmlFor="fullName" 
                  className="block text-sm mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Your Full Name <span style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  data-testid="onboarding-full-name-input"
                  className="w-full rounded-lg px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent-primary)';
                    e.target.style.backgroundColor = 'var(--color-bg-input-focus)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border-default)';
                    e.target.style.backgroundColor = 'var(--color-bg-input)';
                  }}
                />
              </div>

              <div 
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'rgba(255, 204, 0, 0.05)',
                  border: '1px solid var(--color-border-accent)'
                }}
              >
                <div className="flex items-start gap-3">
                  <Shield 
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: 'var(--color-accent-primary)' }}
                  />
                  <div className="text-sm">
                    <p className="mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      You'll be assigned <strong>Admin</strong> role with full access to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <li>Manage organization settings</li>
                      <li>Create and configure sites</li>
                      <li>Invite team members</li>
                      <li>Access all risk management features</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !organizationName.trim()}
                data-testid="onboarding-create-org-button"
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    Create Organization
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <Loader2 
                className="w-8 h-8 animate-spin mx-auto mb-4"
                style={{ color: 'var(--color-accent-primary)' }}
              />
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Setting up your organization...
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                This will only take a moment
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Logged in as: <span style={{ color: 'var(--color-text-secondary)' }}>{userEmail}</span>
          </p>
        </div>
      </div>
    </div>
  );
}