-- ============================================================================
-- RLS Grants for Multi-Tenant Isolation
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor (Role: postgres)
-- IMPORTANT: Execute this AFTER running the RLS migration
-- ============================================================================

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;

-- Grant table permissions (RLS policies will enforce constraints)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_register TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_events TO authenticated;

-- Verify grants were applied
DO $$
BEGIN
  RAISE NOTICE '✅ Grants applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Granted to authenticated role:';
  RAISE NOTICE '  - EXECUTE on current_tenant_id()';
  RAISE NOTICE '  - EXECUTE on current_role()';
  RAISE NOTICE '  - SELECT, INSERT, UPDATE, DELETE on assets';
  RAISE NOTICE '  - SELECT, INSERT, UPDATE, DELETE on risk_register';
  RAISE NOTICE '  - SELECT, INSERT, UPDATE, DELETE on risk_events';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies will enforce tenant isolation and permissions.';
END $$;
