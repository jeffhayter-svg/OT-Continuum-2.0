# RLS Setup Guide

## Overview

This guide explains how to set up Row Level Security (RLS) policies and grants for the OT Continuum multi-tenant application.

## Prerequisites

- Supabase project with tables: `tenants`, `tenant_members`, `users`
- All tables use UUID primary keys (no auto-incrementing sequences)
- Access to Supabase Dashboard SQL Editor

## Quick Setup

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Set **Role** to **postgres** (critical for grants and RLS)

### Step 2: Execute the Setup SQL

Copy and paste the contents of `/sql/minimal-rls-setup.sql` or use the SQL below:

```sql
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
```

### Step 3: Verify Setup

After executing the SQL, verify the setup:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenant_members', 'tenants', 'users');
-- Expected: All should have rowsecurity = true

-- Check policies exist
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tenant_members', 'tenants', 'users')
ORDER BY tablename, policyname;
-- Expected: 7 total policies

-- Check grants
SELECT table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
AND table_schema = 'public'
AND table_name IN ('tenant_members', 'tenants', 'users')
ORDER BY table_name, privilege_type;
-- Expected: SELECT, INSERT, UPDATE, DELETE for each table
```

## What Each Section Does

### 1. GRANTS
Grants allow the `authenticated` role to perform operations on tables:
- **tenant_members**: Full CRUD (SELECT, INSERT, UPDATE, DELETE)
- **tenants**: Full CRUD (SELECT, INSERT, UPDATE, DELETE)
- **users**: Read and write own record (SELECT, INSERT, UPDATE - no DELETE)

**Important:** Grants are required even with RLS policies. Without grants, queries will fail with permission errors.

### 2. ENABLE RLS
Enables Row Level Security on all three tables. Once enabled, all queries must pass through RLS policies.

### 3. DROP policies
Drops existing policies to ensure a clean slate. This makes the script idempotent (safe to run multiple times).

### 4. tenant_members policies
- **View own memberships**: Users can see rows where `user_id = auth.uid()`
- **Insert own memberships**: Users can create rows where `user_id = auth.uid()`

### 5. tenants policies
- **View tenants**: Users can see tenants they belong to (via tenant_members join)
- **Insert tenants**: Any authenticated user can create a new tenant (for onboarding)

### 6. users policies
- **View own record**: Users can read their own user record
- **Update own record**: Users can update their own user record
- **Insert own record**: Users can create their own user record (for onboarding)

## Security Model

### Multi-Tenant Isolation
- Users can only see their own memberships (`tenant_members.user_id = auth.uid()`)
- Users can only see tenants they belong to (subquery check)
- Users can only modify their own user record (`users.id = auth.uid()`)

### Onboarding Flow
1. New user signs up (creates auth.users entry)
2. User creates a tenant (INSERT policy allows this)
3. User creates their user record (INSERT policy allows this)
4. User adds themselves to tenant_members (INSERT policy allows this)
5. All subsequent queries are scoped by RLS

### What auth.uid() Does
`auth.uid()` is a Supabase function that returns the authenticated user's ID from their JWT token. RLS policies use this to ensure users only access their own data.

## Common Errors

### Error: "permission denied for table tenant_members"
**Cause:** GRANT statements not executed
**Solution:** Execute section 1 (GRANTS) as postgres role

### Error: "new row violates row-level security policy"
**Cause:** INSERT policy WITH CHECK condition fails
**Solution:** Ensure `user_id = auth.uid()` in INSERT data

### Error: "no rows returned" (when rows should exist)
**Cause:** RLS policy USING condition excludes rows
**Solution:** Check that `user_id` matches `auth.uid()` for the logged-in user

### Error: "JWT expired"
**Cause:** Access token expired (default: 1 hour)
**Solution:** Client should auto-refresh or user should log in again

## Testing RLS Policies

### Test 1: Query as Authenticated User
```sql
-- Set the JWT token to test as authenticated user
-- In Supabase SQL Editor, this is done automatically when using "Run as: authenticated"
SELECT * FROM tenant_members WHERE user_id = auth.uid();
-- Should return only the current user's memberships
```

### Test 2: Try to Access Another User's Data
```sql
-- This should return no rows due to RLS
SELECT * FROM tenant_members WHERE user_id = 'some-other-user-id';
```

### Test 3: Verify Tenant Isolation
```sql
-- Should only return tenants the user belongs to
SELECT * FROM tenants;
```

## Maintenance

### Adding New Policies
When adding new policies, follow this pattern:

```sql
-- 1. Drop old policy
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- 2. Create new policy
CREATE POLICY "policy_name"
ON public.table_name
FOR operation
TO authenticated
USING (your_condition)
WITH CHECK (your_condition);
```

### Modifying Existing Policies
Policies cannot be modified. You must drop and recreate:

```sql
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;

CREATE POLICY "Users can view their tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  -- Updated condition here
  id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  )
);
```

### Debugging Policy Issues
Enable verbose logging in the app to see RLS failures:

1. Check browser console for error codes (42501 = permission denied)
2. Check Supabase logs in Dashboard → Database → Logs
3. Test policies directly in SQL Editor with different roles

## Production Checklist

Before deploying to production:

- [ ] All GRANT statements executed successfully
- [ ] RLS enabled on all tables (verified with pg_tables query)
- [ ] All policies created (verified with pg_policies query)
- [ ] Tested login flow with new user
- [ ] Tested onboarding flow (create tenant, user, membership)
- [ ] Tested tenant switching (if multiple memberships)
- [ ] Verified users cannot see other users' data
- [ ] Tested token refresh/expiration handling
- [ ] Documented RLS policies in code comments

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- `/docs/SUPABASE_AUTH_VERIFICATION.md` - Authentication implementation
- `/docs/NETWORK_TAB_VERIFICATION.md` - Debugging guide
- `/sql/minimal-rls-setup.sql` - SQL script file

## Support

If you encounter issues:

1. Check the error message in browser console
2. Look for error code (42501, PGRST301, etc.)
3. Verify session exists: `await supabase.auth.getSession()`
4. Check Network tab for Authorization header
5. Verify policies exist in Supabase Dashboard
6. Review `/docs/DEPLOYMENT_CHECKLIST.md` for full verification steps
