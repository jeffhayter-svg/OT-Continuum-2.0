-- ============================================================================
-- COMPLETE TENANT RBAC MIGRATION (FIXED VERSION)
-- ============================================================================
-- Copy and paste this ENTIRE file into Supabase Studio → SQL Editor → Run
-- This includes the fix for slug generation and schema conflicts
-- ============================================================================

-- Step 1: Clean up existing objects
DROP TABLE IF EXISTS public.tenant_invites CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP FUNCTION IF EXISTS public.rpc_bootstrap_tenant_and_user(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_my_tenant_context() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_slug(TEXT) CASCADE;

-- Step 2: Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'engineer', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Step 4: Create tenant_invites table
CREATE TABLE public.tenant_invites (
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

CREATE INDEX idx_tenant_invites_token ON public.tenant_invites(token);
CREATE INDEX idx_tenant_invites_email ON public.tenant_invites(email);

-- Step 5: Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for users
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can read users in same tenant" ON public.users
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own row" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

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

-- Step 7: Create RLS policies for tenants
CREATE POLICY "Users can read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert tenant when they have none" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND tenant_id IS NOT NULL));

CREATE POLICY "Admins can update own tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Step 8: Create RLS policies for tenant_invites
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

-- Step 9: Slug generation helper
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'org';
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Step 10: Bootstrap function
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
  v_slug TEXT;
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

  v_slug := public.generate_slug(p_tenant_name);

  INSERT INTO public.tenants (name, slug, status)
  VALUES (p_tenant_name, v_slug, 'active')
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Created tenant: % (ID: %, slug: %)', p_tenant_name, v_tenant_id, v_slug;

  INSERT INTO public.users (id, tenant_id, email, full_name, role, status)
  VALUES (v_user_id, v_tenant_id, v_email, p_full_name, 'admin', 'active');

  RAISE NOTICE 'Created user: % with admin role in tenant %', v_email, v_tenant_id;

  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_bootstrap_tenant_and_user(TEXT, TEXT) TO authenticated;

-- Step 11: Get tenant context function
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

-- Step 12: Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 13: Verify
DO $$
DECLARE
  table_count INT;
  function_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('tenants', 'users', 'tenant_invites');
  
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname IN ('rpc_bootstrap_tenant_and_user', 'rpc_get_my_tenant_context');
  
  IF table_count = 3 AND function_count = 2 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
    RAISE NOTICE 'Tables created: 3';
    RAISE NOTICE 'Functions created: 2';
    RAISE NOTICE 'RLS enabled on all tables';
    RAISE NOTICE 'Slug generation: fixed with fallback';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '❌ Migration incomplete: tables=%, functions=%', table_count, function_count;
  END IF;
END $$;
