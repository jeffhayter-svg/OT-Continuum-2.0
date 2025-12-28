# 🔥 RUN THIS NOW TO FIX THE ERRORS

## The Problem

You have an existing `tenants` table with different columns than expected, and the slug generation is failing.

## The Fix

Run this command in your terminal:

```bash
supabase db reset
```

This will:
1. ✅ Drop all existing tables cleanly
2. ✅ Apply BOTH migrations in order
3. ✅ Create fresh tables with correct schema
4. ✅ Fix the slug generation to never be NULL

## Alternative: Manual Application

If the CLI doesn't work, go to **Supabase Studio → SQL Editor** and run:

```sql
-- 1. Clean up existing objects
DROP TABLE IF EXISTS public.tenant_invites CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP FUNCTION IF EXISTS public.rpc_bootstrap_tenant_and_user(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_my_tenant_context() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- 2. Then copy and paste the ENTIRE contents of:
-- /supabase/migrations/20231226000001_fix_tenant_rbac.sql
```

## After Running

1. Refresh your app
2. Try creating an account again
3. Should work without errors!

## What Changed

### Before:
- `slug` could be NULL → caused error ❌
- `rpc_get_my_tenant_context` not found → caused error ❌
- Old tenants table had conflicting columns ❌

### After:
- `slug` generation with fallback → always has value ✅
- All functions created properly ✅
- Fresh tables with correct schema ✅
- Slug uniqueness enforced ✅

## Verify It Worked

Run in SQL Editor:

```sql
-- Should show both functions
SELECT proname FROM pg_proc WHERE proname LIKE 'rpc_%';

-- Should show 3 tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'users', 'tenant_invites');
```

Expected output:
- Functions: `rpc_bootstrap_tenant_and_user`, `rpc_get_my_tenant_context`
- Tables: `tenants`, `users`, `tenant_invites`

## Now Test!

1. Go to app: `http://localhost:5173`
2. Email: `test@example.com`
3. Password: `password123`
4. Click **"Create Account"**
5. Should create tenant successfully! 🎉
