-- =========================================================
-- OT Continuum: Minimal RLS + Grants for tenant resolution
-- Tables: tenants, tenant_members, users
-- Safe for UUID PKs (no sequence grants)
-- =========================================================

-- 1) GRANTS (required in addition to RLS)
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE            ON TABLE public.users TO authenticated;

-- 2) ENABLE RLS
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;

-- 3) DROP policies (idempotent cleanup)
DROP POLICY IF EXISTS "Users can view their own memberships"         ON public.tenant_members;
DROP POLICY IF EXISTS "Users can insert their own memberships"       ON public.tenant_members;

DROP POLICY IF EXISTS "Users can view their tenants"                 ON public.tenants;
DROP POLICY IF EXISTS "Users can insert tenants"                     ON public.tenants;

DROP POLICY IF EXISTS "Users can view their own user record"         ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record"       ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user record"       ON public.users;

-- 4) tenant_members policies
CREATE POLICY "Users can view their own memberships"
ON public.tenant_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships"
ON public.tenant_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 5) tenants policies
CREATE POLICY "Users can view their tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id
    FROM public.tenant_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6) users policies
CREATE POLICY "Users can view their own user record"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own user record"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own user record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());
