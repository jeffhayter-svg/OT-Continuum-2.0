-- ============================================================================
-- MANUAL MIGRATION APPLICATION
-- ============================================================================
-- If you're getting "function not found" errors, run this directly in
-- Supabase Studio → SQL Editor
--
-- This is the same as 20231226000000_tenant_rbac_system.sql but
-- can be copy-pasted directly into the SQL editor
-- ============================================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'engineer', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_invites_token ON public.tenant_invites(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invites_email ON public.tenant_invites(email);

-- 2. Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row (limited)" ON public.users;
DROP POLICY IF EXISTS "Admins can read users in same tenant" ON public.users;
DROP POLICY IF EXISTS "Admins can update users in same tenant" ON public.users;
DROP POLICY IF EXISTS "Users can read own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert tenant when they have none" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can read invites for their email" ON public.tenant_invites;
DROP POLICY IF EXISTS "Admins can manage invites for their tenant" ON public.tenant_invites;

-- 4. Create RLS policies
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read users in same tenant" ON public.users
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own row" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own row (limited)" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update users in same tenant" ON public.users
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert tenant when they have none" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND tenant_id IS NOT NULL));

CREATE POLICY "Admins can update own tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can read invites for their email" ON public.tenant_invites
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can manage invites for their tenant" ON public.tenant_invites
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- 5. Create RPC functions
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  SELECT tenant_id INTO v_existing_tenant_id FROM public.users WHERE id = v_user_id;

  IF v_existing_tenant_id IS NOT NULL THEN
    RAISE NOTICE 'User already has tenant: %', v_existing_tenant_id;
    RETURN v_existing_tenant_id;
  END IF;

  INSERT INTO public.tenants (name, slug, status)
  VALUES (
    p_tenant_name,
    lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')),
    'active'
  )
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Created tenant: % (ID: %)', p_tenant_name, v_tenant_id;

  INSERT INTO public.users (id, tenant_id, email, full_name, role, status)
  VALUES (v_user_id, v_tenant_id, v_email, p_full_name, 'admin', 'active');

  RAISE NOTICE 'Created user: % with admin role in tenant %', v_email, v_tenant_id;

  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_bootstrap_tenant_and_user(TEXT, TEXT) TO authenticated;

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

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_my_tenant_context() TO authenticated;

-- 6. Create triggers
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

-- 7. Verify installation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE 'Tables created: tenants, users, tenant_invites';
  RAISE NOTICE 'RLS enabled on all tables';
  RAISE NOTICE 'Functions created: rpc_bootstrap_tenant_and_user, rpc_get_my_tenant_context';
END $$;
