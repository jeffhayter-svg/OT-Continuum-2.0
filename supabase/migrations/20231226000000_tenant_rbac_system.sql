-- ============================================================================
-- OT Continuum: Tenant RBAC System
-- ============================================================================
-- Creates multi-tenant structure with role-based access control
-- Includes RLS policies and bootstrap function for post-login tenant resolver

-- ============================================================================
-- 1. Create tenants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. Create/Update users table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- matches auth.users.id
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'engineer', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster tenant lookups
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================================
-- 3. Create tenant_invites table (for future use)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'engineer', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_token ON public.tenant_invites(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invites_email ON public.tenant_invites(email);

-- ============================================================================
-- 4. Enable RLS
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies for public.users
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row (limited)" ON public.users;
DROP POLICY IF EXISTS "Admins can read users in same tenant" ON public.users;
DROP POLICY IF EXISTS "Admins can update users in same tenant" ON public.users;

-- SELECT: allow authenticated user to read only their row
CREATE POLICY "Users can read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- SELECT: allow admins to read users in same tenant
CREATE POLICY "Admins can read users in same tenant"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: allow authenticated user to insert ONLY their own row
CREATE POLICY "Users can insert own row"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: allow authenticated user to update ONLY their own row (cannot change role or tenant_id)
CREATE POLICY "Users can update own row (limited)"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- UPDATE: allow admins to update users in same tenant
CREATE POLICY "Admins can update users in same tenant"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. RLS Policies for public.tenants
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert tenant when they have none" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update own tenant" ON public.tenants;

-- SELECT: allow user to read ONLY their tenant
CREATE POLICY "Users can read own tenant"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- INSERT: allow authenticated user to create a tenant ONLY when they don't have one
CREATE POLICY "Users can insert tenant when they have none"
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND tenant_id IS NOT NULL
    )
  );

-- UPDATE: allow admins to update their own tenant
CREATE POLICY "Admins can update own tenant"
  ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 7. RLS Policies for public.tenant_invites
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read invites for their email" ON public.tenant_invites;
DROP POLICY IF EXISTS "Admins can manage invites for their tenant" ON public.tenant_invites;

-- SELECT: users can read invites for their email
CREATE POLICY "Users can read invites for their email"
  ON public.tenant_invites
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ALL: admins can manage invites for their tenant
CREATE POLICY "Admins can manage invites for their tenant"
  ON public.tenant_invites
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- 8. Bootstrap Function (SECURITY DEFINER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_bootstrap_tenant_and_user(
  p_tenant_name TEXT,
  p_full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_email TEXT;
  v_existing_tenant_id UUID;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  -- Check if user already exists in public.users
  SELECT tenant_id INTO v_existing_tenant_id
  FROM public.users
  WHERE id = v_user_id;

  -- If user already has a tenant, return it
  IF v_existing_tenant_id IS NOT NULL THEN
    RAISE NOTICE 'User already has tenant: %', v_existing_tenant_id;
    RETURN v_existing_tenant_id;
  END IF;

  -- Create new tenant
  INSERT INTO public.tenants (name, slug, status)
  VALUES (
    p_tenant_name,
    lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')),
    'active'
  )
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Created tenant: % (ID: %)', p_tenant_name, v_tenant_id;

  -- Create user record with admin role
  INSERT INTO public.users (id, tenant_id, email, full_name, role, status)
  VALUES (
    v_user_id,
    v_tenant_id,
    v_email,
    p_full_name,
    'admin',
    'active'
  );

  RAISE NOTICE 'Created user: % with admin role in tenant %', v_email, v_tenant_id;

  RETURN v_tenant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_bootstrap_tenant_and_user(TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 9. Helper function to get current user's tenant context
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_get_my_tenant_context()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT json_build_object(
    'user_id', u.id,
    'email', u.email,
    'full_name', u.full_name,
    'role', u.role,
    'status', u.status,
    'tenant_id', u.tenant_id,
    'tenant_name', t.name,
    'tenant_plan', t.plan,
    'tenant_status', t.status
  )
  INTO v_result
  FROM public.users u
  LEFT JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.id = v_user_id;

  -- Return NULL if user not found (instead of erroring)
  -- This allows the tenant resolver to detect new users
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_my_tenant_context() TO authenticated;

-- ============================================================================
-- 10. Trigger to update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Complete
-- ============================================================================