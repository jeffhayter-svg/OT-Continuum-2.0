-- ============================================================================
-- Multi-Tenant Isolation with Row Level Security (RLS)
-- ============================================================================
-- This migration implements comprehensive RLS policies for tenant isolation
-- on assets, risk_register, and risk_events tables.
--
-- IMPORTANT: Run this in Supabase Dashboard → SQL Editor with Role: postgres
-- ============================================================================

-- ============================================================================
-- STEP 1: Helper Functions for RLS Policies
-- ============================================================================

-- Function: Get current user's tenant_id
-- Returns the tenant_id from public.users for the authenticated user
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get tenant_id from users table for current auth user
  SELECT tenant_id INTO v_tenant_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.current_tenant_id() IS 
  'Returns the tenant_id for the current authenticated user from public.users table';


-- Function: Get current user's role
-- Returns the role from public.users for the authenticated user
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from users table for current auth user
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$;

COMMENT ON FUNCTION public.current_role() IS 
  'Returns the role for the current authenticated user from public.users table';


-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;

-- ============================================================================
-- STEP 2: Enable RLS on Tables
-- ============================================================================

-- Enable RLS on assets table
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on risk_register table
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;

-- Enable RLS on risk_events table
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Drop Existing Policies (if any)
-- ============================================================================

-- Drop all existing policies on assets
DROP POLICY IF EXISTS "assets_select_policy" ON public.assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON public.assets;
DROP POLICY IF EXISTS "assets_update_policy" ON public.assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON public.assets;

-- Drop all existing policies on risk_register
DROP POLICY IF EXISTS "risk_register_select_policy" ON public.risk_register;
DROP POLICY IF EXISTS "risk_register_insert_policy" ON public.risk_register;
DROP POLICY IF EXISTS "risk_register_update_policy" ON public.risk_register;
DROP POLICY IF EXISTS "risk_register_delete_policy" ON public.risk_register;

-- Drop all existing policies on risk_events
DROP POLICY IF EXISTS "risk_events_select_policy" ON public.risk_events;
DROP POLICY IF EXISTS "risk_events_insert_policy" ON public.risk_events;
DROP POLICY IF EXISTS "risk_events_update_policy" ON public.risk_events;
DROP POLICY IF EXISTS "risk_events_delete_policy" ON public.risk_events;

-- ============================================================================
-- STEP 4: Create RLS Policies for ASSETS Table
-- ============================================================================

-- SELECT: Users can only see assets from their tenant
CREATE POLICY "assets_select_policy"
  ON public.assets
  FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id());

COMMENT ON POLICY "assets_select_policy" ON public.assets IS
  'Users can only view assets from their own tenant';


-- INSERT: Users can only insert assets for their tenant with their user ID
CREATE POLICY "assets_insert_policy"
  ON public.assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND created_by = auth.uid()
  );

COMMENT ON POLICY "assets_insert_policy" ON public.assets IS
  'Users can only create assets for their own tenant with their user ID as creator';


-- UPDATE: Users can update if they created it OR they are admin/owner
CREATE POLICY "assets_update_policy"
  ON public.assets
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (
      created_by = auth.uid()
      OR current_role() IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      created_by = auth.uid()
      OR current_role() IN ('admin', 'owner')
    )
  );

COMMENT ON POLICY "assets_update_policy" ON public.assets IS
  'Users can update assets they created or if they are admin/owner in their tenant';


-- DELETE: Only admin/owner can delete
CREATE POLICY "assets_delete_policy"
  ON public.assets
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND current_role() IN ('admin', 'owner')
  );

COMMENT ON POLICY "assets_delete_policy" ON public.assets IS
  'Only admin/owner users can delete assets from their tenant';

-- ============================================================================
-- STEP 5: Create RLS Policies for RISK_REGISTER Table
-- ============================================================================

-- SELECT: Users can only see risks from their tenant
CREATE POLICY "risk_register_select_policy"
  ON public.risk_register
  FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id());

COMMENT ON POLICY "risk_register_select_policy" ON public.risk_register IS
  'Users can only view risks from their own tenant';


-- INSERT: Users can only insert risks for their tenant with their user ID
CREATE POLICY "risk_register_insert_policy"
  ON public.risk_register
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND created_by = auth.uid()
  );

COMMENT ON POLICY "risk_register_insert_policy" ON public.risk_register IS
  'Users can only create risks for their own tenant with their user ID as creator';


-- UPDATE: Users can update if they created it, they own it, OR they are admin/owner
CREATE POLICY "risk_register_update_policy"
  ON public.risk_register
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (
      created_by = auth.uid()
      OR owner_id = auth.uid()
      OR current_role() IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      created_by = auth.uid()
      OR owner_id = auth.uid()
      OR current_role() IN ('admin', 'owner')
    )
  );

COMMENT ON POLICY "risk_register_update_policy" ON public.risk_register IS
  'Users can update risks they created, own, or if they are admin/owner in their tenant';


-- DELETE: Only admin/owner can delete
CREATE POLICY "risk_register_delete_policy"
  ON public.risk_register
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND current_role() IN ('admin', 'owner')
  );

COMMENT ON POLICY "risk_register_delete_policy" ON public.risk_register IS
  'Only admin/owner users can delete risks from their tenant';

-- ============================================================================
-- STEP 6: Create RLS Policies for RISK_EVENTS Table
-- ============================================================================

-- SELECT: Users can only see risk events from their tenant
CREATE POLICY "risk_events_select_policy"
  ON public.risk_events
  FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id());

COMMENT ON POLICY "risk_events_select_policy" ON public.risk_events IS
  'Users can only view risk events from their own tenant';


-- INSERT: Users can only insert risk events for their tenant
CREATE POLICY "risk_events_insert_policy"
  ON public.risk_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND triggered_by = auth.uid()
  );

COMMENT ON POLICY "risk_events_insert_policy" ON public.risk_events IS
  'Users can only create risk events for their own tenant with their user ID as trigger';


-- UPDATE: Users can update if they triggered it OR they are admin/owner
CREATE POLICY "risk_events_update_policy"
  ON public.risk_events
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (
      triggered_by = auth.uid()
      OR current_role() IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      triggered_by = auth.uid()
      OR current_role() IN ('admin', 'owner')
    )
  );

COMMENT ON POLICY "risk_events_update_policy" ON public.risk_events IS
  'Users can update risk events they triggered or if they are admin/owner in their tenant';


-- DELETE: Only admin/owner can delete
CREATE POLICY "risk_events_delete_policy"
  ON public.risk_events
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND current_role() IN ('admin', 'owner')
  );

COMMENT ON POLICY "risk_events_delete_policy" ON public.risk_events IS
  'Only admin/owner users can delete risk events from their tenant';

-- ============================================================================
-- STEP 7: Grant Table Permissions
-- ============================================================================

-- Grant SELECT permissions to authenticated users (RLS will filter)
GRANT SELECT ON public.assets TO authenticated;
GRANT SELECT ON public.risk_register TO authenticated;
GRANT SELECT ON public.risk_events TO authenticated;

-- Grant INSERT permissions to authenticated users (RLS will enforce constraints)
GRANT INSERT ON public.assets TO authenticated;
GRANT INSERT ON public.risk_register TO authenticated;
GRANT INSERT ON public.risk_events TO authenticated;

-- Grant UPDATE permissions to authenticated users (RLS will enforce constraints)
GRANT UPDATE ON public.assets TO authenticated;
GRANT UPDATE ON public.risk_register TO authenticated;
GRANT UPDATE ON public.risk_events TO authenticated;

-- Grant DELETE permissions to authenticated users (RLS will enforce constraints)
GRANT DELETE ON public.assets TO authenticated;
GRANT DELETE ON public.risk_register TO authenticated;
GRANT DELETE ON public.risk_events TO authenticated;

-- ============================================================================
-- STEP 8: Verification Queries (for testing)
-- ============================================================================

-- To verify RLS is working, run these queries as different users:
-- 
-- -- Check current tenant and role
-- SELECT 
--   auth.uid() as current_user_id,
--   current_tenant_id() as current_tenant_id,
--   current_role() as current_role;
-- 
-- -- Try to select assets (should only see your tenant's data)
-- SELECT * FROM assets;
-- 
-- -- Try to insert an asset (should succeed with correct tenant_id)
-- INSERT INTO assets (tenant_id, site_id, name, asset_type, status, created_by)
-- VALUES (current_tenant_id(), 'some-site-id', 'Test Asset', 'sensor', 'operational', auth.uid());
-- 
-- -- Try to select from another tenant (should return 0 rows)
-- SELECT * FROM assets WHERE tenant_id != current_tenant_id();

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary of RLS policies created:
-- 
-- ASSETS:
--   - SELECT: tenant_id = current_tenant_id()
--   - INSERT: tenant_id = current_tenant_id() AND created_by = auth.uid()
--   - UPDATE: creator OR admin/owner
--   - DELETE: admin/owner only
-- 
-- RISK_REGISTER:
--   - SELECT: tenant_id = current_tenant_id()
--   - INSERT: tenant_id = current_tenant_id() AND created_by = auth.uid()
--   - UPDATE: creator OR owner_id OR admin/owner
--   - DELETE: admin/owner only
-- 
-- RISK_EVENTS:
--   - SELECT: tenant_id = current_tenant_id()
--   - INSERT: tenant_id = current_tenant_id() AND triggered_by = auth.uid()
--   - UPDATE: triggered_by OR admin/owner
--   - DELETE: admin/owner only
