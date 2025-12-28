-- =====================================================================
-- GRANT PERMISSIONS FOR RPC FUNCTIONS
-- =====================================================================
-- 
-- ⚠️ CRITICAL: This script MUST be run in Supabase Dashboard → SQL Editor
-- ⚠️ IMPORTANT: Set Role dropdown to "postgres" (NOT "authenticated")
-- ⚠️ DO NOT run this in PowerShell, terminal, or command line
--
-- Purpose: Grant execute permissions on RPC functions to authenticated users
-- 
-- Without these grants, users will get "permission denied" errors when:
-- - Signing up for the first time (bootstrap function)
-- - Logging in (tenant context function)
--
-- This is required because PostgreSQL functions don't automatically
-- grant execute permissions to non-superuser roles (security feature).
--
-- =====================================================================

-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permissions on tenant bootstrap function
-- Used during first-time user signup to create tenant and user records
GRANT EXECUTE ON FUNCTION public.rpc_bootstrap_tenant_and_user(text, text) TO authenticated;

-- Grant execute permissions on tenant context function
-- Used during login to fetch user's tenant and role information
GRANT EXECUTE ON FUNCTION public.rpc_get_my_tenant_context() TO authenticated;

-- =====================================================================
-- VERIFICATION QUERY
-- =====================================================================
-- Run this to verify the grants were successfully applied:

SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name LIKE 'rpc_%'
ORDER BY routine_name, grantee;

-- Expected output:
-- | routine_name                        | grantee        | privilege_type |
-- |-------------------------------------|----------------|----------------|
-- | rpc_bootstrap_tenant_and_user       | authenticated  | EXECUTE        |
-- | rpc_get_my_tenant_context           | authenticated  | EXECUTE        |

-- =====================================================================
-- TROUBLESHOOTING
-- =====================================================================
--
-- Issue: "permission denied for function rpc_bootstrap_tenant_and_user"
-- Solution: Run this script with Role set to "postgres"
--
-- Issue: "function does not exist"
-- Solution: Run the main migration first (20231226000000_tenant_rbac_system.sql)
--
-- Issue: "must be owner of function"
-- Solution: Ensure you're logged in as project owner in Supabase Dashboard
--
-- Issue: Verification query shows no results
-- Solution: The functions may not exist yet - apply migrations first
--
-- =====================================================================
