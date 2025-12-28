import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { TenantSetup } from './onboarding/TenantSetup';
import { TenantPicker } from './onboarding/TenantPicker';

interface TenantResolverProps {
  userId: string; // SINGLE SOURCE OF TRUTH - passed from context
  userEmail: string; // SINGLE SOURCE OF TRUTH - passed from context
  onResolved: (context: TenantContext) => void;
  onError: () => void;
}

export interface TenantContext {
  userId: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'owner' | 'manager' | 'engineer' | 'viewer';
  tenantId: string;
  tenantName: string;
  tenantPlan: string;
  tenantStatus: string;
}

interface TenantMembership {
  tenant_id: string;
  tenant_name: string;
  tenant_plan: string;
  tenant_status: string;
  role: string;
}

type Step = 'checking' | 'onboarding' | 'selecting' | 'auto-selecting' | 'done' | 'error';

export function TenantResolver({ userId, userEmail, onResolved, onError }: TenantResolverProps) {
  const [step, setStep] = useState<Step>('checking');
  const [error, setError] = useState<string | null>(null);
  const [tenantMemberships, setTenantMemberships] = useState<TenantMembership[]>([]);

  useEffect(() => {
    checkTenantMemberships();
  }, []);

  async function checkTenantMemberships() {
    try {
      console.group('[TenantResolver] 🔍 Checking tenant memberships');
      console.log('User ID (prop):', userId);
      console.log('Email:', userEmail);
      
      // CRITICAL: Get session FIRST - do not query until session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[TenantResolver] Session check:');
      console.log('  - Session exists:', !!session);
      console.log('  - Access token:', session?.access_token ? '✅ Present (length: ' + session.access_token.length + ')' : '❌ Missing');
      console.log('  - User ID from session:', session?.user?.id);
      console.log('  - Session error:', sessionError);
      console.groupEnd();
      
      // If no session, do not proceed with queries
      if (!session || !session.access_token) {
        console.error('[TenantResolver] ❌ No valid session - cannot query tenant_members');
        throw new Error('No active session found. Please sign in again.');
      }

      setStep('checking');

      // Step 1: Query tenant_members using session.user.id
      // This ensures the query is authenticated with the user's JWT token
      console.log('[TenantResolver] Step 1: Querying tenant_members as authenticated user:', session.user.id);
      
      const { data: memberships, error: memberError } = await supabase
        .from('tenant_members')
        .select('tenant_id, role, tenants!inner(id, name)')
        .eq('user_id', session.user.id);

      // DETAILED ERROR LOGGING: Distinguish between RLS denial vs empty results
      console.group('[TenantResolver] 📊 Query Results Analysis');
      console.log('Error object:', memberError);
      console.log('Data returned:', memberships);
      console.log('Memberships count:', memberships?.length || 0);
      
      if (memberError) {
        console.error('❌ Query failed with error:');
        console.error('  - Code:', memberError.code);
        console.error('  - Message:', memberError.message);
        console.error('  - Details:', memberError.details);
        console.error('  - Hint:', memberError.hint);
        console.groupEnd();
        
        // RLS DENIAL: Check for permission errors
        if (memberError.code === '42501') {
          throw new Error(
            `Permission denied for database tables.\n\n` +
            `ACTION REQUIRED: Execute this SQL in Supabase Dashboard → SQL Editor (Role: postgres):\n\n` +
            `-- =========================================================\n` +
            `-- OT Continuum: Minimal RLS + Grants for tenant resolution\n` +
            `-- Tables: tenants, tenant_members, users\n` +
            `-- Safe for UUID PKs (no sequence grants)\n` +
            `-- =========================================================\n\n` +
            `-- 1) GRANTS (required in addition to RLS)\n` +
            `GRANT USAGE ON SCHEMA public TO authenticated;\n\n` +
            `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_members TO authenticated;\n` +
            `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenants TO authenticated;\n` +
            `GRANT SELECT, INSERT, UPDATE            ON TABLE public.users TO authenticated;\n\n` +
            `-- 2) ENABLE RLS\n` +
            `ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;\n` +
            `ALTER TABLE public.tenants        ENABLE ROW LEVEL SECURITY;\n` +
            `ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;\n\n` +
            `-- 3) DROP policies (idempotent cleanup)\n` +
            `DROP POLICY IF EXISTS "Users can view their own memberships"         ON public.tenant_members;\n` +
            `DROP POLICY IF EXISTS "Users can insert their own memberships"       ON public.tenant_members;\n\n` +
            `DROP POLICY IF EXISTS "Users can view their tenants"                 ON public.tenants;\n` +
            `DROP POLICY IF EXISTS "Users can insert tenants"                     ON public.tenants;\n\n` +
            `DROP POLICY IF EXISTS "Users can view their own user record"         ON public.users;\n` +
            `DROP POLICY IF EXISTS "Users can update their own user record"       ON public.users;\n` +
            `DROP POLICY IF EXISTS "Users can insert their own user record"       ON public.users;\n\n` +
            `-- 4) tenant_members policies\n` +
            `CREATE POLICY "Users can view their own memberships"\n` +
            `ON public.tenant_members\n` +
            `FOR SELECT\n` +
            `TO authenticated\n` +
            `USING (user_id = auth.uid());\n\n` +
            `CREATE POLICY "Users can insert their own memberships"\n` +
            `ON public.tenant_members\n` +
            `FOR INSERT\n` +
            `TO authenticated\n` +
            `WITH CHECK (user_id = auth.uid());\n\n` +
            `-- 5) tenants policies\n` +
            `CREATE POLICY "Users can view their tenants"\n` +
            `ON public.tenants\n` +
            `FOR SELECT\n` +
            `TO authenticated\n` +
            `USING (\n` +
            `  id IN (\n` +
            `    SELECT tenant_id\n` +
            `    FROM public.tenant_members\n` +
            `    WHERE user_id = auth.uid()\n` +
            `  )\n` +
            `);\n\n` +
            `CREATE POLICY "Users can insert tenants"\n` +
            `ON public.tenants\n` +
            `FOR INSERT\n` +
            `TO authenticated\n` +
            `WITH CHECK (true);\n\n` +
            `-- 6) users policies\n` +
            `CREATE POLICY "Users can view their own user record"\n` +
            `ON public.users\n` +
            `FOR SELECT\n` +
            `TO authenticated\n` +
            `USING (id = auth.uid());\n\n` +
            `CREATE POLICY "Users can update their own user record"\n` +
            `ON public.users\n` +
            `FOR UPDATE\n` +
            `TO authenticated\n` +
            `USING (id = auth.uid())\n` +
            `WITH CHECK (id = auth.uid());\n\n` +
            `CREATE POLICY "Users can insert their own user record"\n` +
            `ON public.users\n` +
            `FOR INSERT\n` +
            `TO authenticated\n` +
            `WITH CHECK (id = auth.uid());\n\n` +
            `After executing the above SQL, refresh this page.`
          );
        }
        
        // Check if it's an RLS policy denial (no explicit error code)
        if (memberError.message?.toLowerCase().includes('policy') || 
            memberError.message?.toLowerCase().includes('permission') ||
            memberError.message?.toLowerCase().includes('rls')) {
          console.error('🚨 RLS POLICY DENIAL DETECTED');
          throw new Error(
            `Membership table access denied (RLS).\n\n` +
            `Admin must add SELECT policy for tenant_members.\n\n` +
            `Error: ${memberError.message}`
          );
        }
        
        // Generic query error
        throw new Error(`Failed to query memberships: ${memberError.message}`);
      }
      
      // NO ERROR: Check if results are truly empty vs RLS filtering
      if (!memberships || memberships.length === 0) {
        console.log('✅ Query succeeded (no error)');
        console.log('📋 Result: Empty array (0 memberships)');
        console.log('');
        console.log('This means:');
        console.log('  - RLS policies are working correctly (no permission denied)');
        console.log('  - User has successfully authenticated');
        console.log('  - BUT: No tenant_members rows exist for this user');
        console.log('  - Action: Route to onboarding to create first organization');
        console.groupEnd();
      } else {
        console.log('✅ Query succeeded');
        console.log(`📋 Result: ${memberships.length} membership(s) found`);
        console.log('Memberships:', memberships);
        console.groupEnd();
      }

      console.log('[TenantResolver] Query result:', memberships);
      console.log('[TenantResolver] Memberships found:', memberships?.length || 0);

      // Transform data
      const tenantList: TenantMembership[] = (memberships || []).map((m: any) => ({
        tenant_id: m.tenant_id,
        tenant_name: m.tenants.name,
        tenant_plan: 'free', // Default plan since column doesn't exist
        tenant_status: 'active', // Default status since column doesn't exist
        role: m.role,
      }));

      setTenantMemberships(tenantList);

      // Step 2: Check if 0 rows - route to onboarding
      if (tenantList.length === 0) {
        console.log('[TenantResolver] ℹ️ No memberships found → routing to onboarding');
        setStep('onboarding');
        return;
      }

      // Step 3: If >=1 rows
      console.log('[TenantResolver] ✅ Found', tenantList.length, 'membership(s)');

      // If exactly 1 tenant, auto-select it
      if (tenantList.length === 1) {
        console.log('[TenantResolver] Auto-selecting single tenant:', tenantList[0].tenant_name);
        setStep('auto-selecting');
        await handleTenantSelected({
          tenantId: tenantList[0].tenant_id,
          tenantName: tenantList[0].tenant_name,
          tenantPlan: tenantList[0].tenant_plan,
          role: tenantList[0].role,
        });
        return;
      }

      // If multiple tenants, show picker
      console.log('[TenantResolver] Multiple tenants found → showing picker');
      setStep('selecting');

    } catch (err) {
      console.error('[TenantResolver] ❌ Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStep('error');
    }
  }

  async function handleTenantSelected(context: {
    tenantId: string;
    tenantName: string;
    tenantPlan: string;
    role: string;
  }) {
    try {
      console.group('[TenantResolver] 🔄 Tenant selected');
      console.log('Tenant:', context.tenantName);
      console.log('Role:', context.role);
      console.groupEnd();

      // Update public.users.tenant_id to selected tenant
      console.log('[TenantResolver] Updating users.tenant_id...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tenant_id: context.tenantId,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[TenantResolver] ❌ Update error:', updateError);
        throw new Error(`Failed to update tenant: ${updateError.message}`);
      }

      console.log('[TenantResolver] ✅ users.tenant_id updated');

      // Get user full_name from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (userError) {
        console.warn('[TenantResolver] ⚠️ Could not fetch full_name:', userError);
      }

      // Set tenant_context and route /app
      const fullContext: TenantContext = {
        userId,
        email: userEmail,
        fullName: userData?.full_name || null,
        role: context.role as any,
        tenantId: context.tenantId,
        tenantName: context.tenantName,
        tenantPlan: context.tenantPlan,
        tenantStatus: 'active', // Assume active
      };

      console.log('[TenantResolver] ✅ Tenant context set:', fullContext);
      setStep('done');
      
      onResolved(fullContext);

    } catch (err) {
      console.error('[TenantResolver] ❌ Error selecting tenant:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStep('error');
    }
  }

  function handleSetupError(errorMessage: string) {
    console.error('[TenantResolver] Setup error:', errorMessage);
    setError(errorMessage);
    setStep('error');
  }

  // Render based on step
  if (step === 'checking') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-app)' }}
      >
        <div className="text-center">
          <Loader2 
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: 'var(--color-accent-primary)' }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Checking your organizations...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'auto-selecting') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-app)' }}
      >
        <div className="text-center">
          <Loader2 
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: 'var(--color-accent-primary)' }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Loading {tenantMemberships[0]?.tenant_name}...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'onboarding') {
    return (
      <TenantSetup
        userId={userId}
        userEmail={userEmail}
        onComplete={handleTenantSelected}
        onError={handleSetupError}
      />
    );
  }

  if (step === 'selecting') {
    return (
      <TenantPicker
        userId={userId}
        userEmail={userEmail}
        tenants={tenantMemberships}
        onSelect={handleTenantSelected}
        onError={handleSetupError}
      />
    );
  }

  if (step === 'error') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg-app)' }}
      >
        <div 
          className="max-w-md w-full rounded-lg p-6"
          style={{
            backgroundColor: 'var(--color-bg-elevated-1)',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle 
              className="w-6 h-6 flex-shrink-0 mt-0.5"
              style={{ color: 'var(--color-status-critical)' }}
            />
            <div>
              <h2 style={{ color: 'var(--color-status-critical)' }} className="mb-2">
                Error
              </h2>
              <p 
                className="text-sm whitespace-pre-wrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              setStep('checking');
              checkTenantMemberships();
            }}
            className="btn-primary w-full"
          >
            Retry
          </button>
          <button
            onClick={onError}
            className="btn-secondary w-full mt-2"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-app)' }}
      >
        <div className="text-center">
          <Loader2 
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: 'var(--color-accent-primary)' }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return null;
}