# RLS Setup Guide

## Quick Setup: Apply RLS Policies to Your Supabase Project

Follow these steps to enable multi-tenant Row Level Security on your Supabase database.

---

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Database tables created (`assets`, `risk_register`, `risk_events`)
- ✅ `public.users` table exists with columns: `id`, `tenant_id`, `role`
- ✅ Access to Supabase Dashboard

---

## 🚀 Step-by-Step Setup

### Step 1: Apply RLS Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New query**
3. **Set Role to `postgres`** (important!)
4. Copy and paste the contents of:
   ```
   /supabase/migrations/20240101000005_rls_multi_tenant_isolation.sql
   ```
5. Click **Run**
6. Wait for "Success. No rows returned" message

**What this does**:
- Creates `current_tenant_id()` and `current_role()` helper functions
- Enables RLS on `assets`, `risk_register`, `risk_events` tables
- Drops any existing policies
- Creates comprehensive SELECT, INSERT, UPDATE, DELETE policies

---

### Step 2: Apply Grants

1. Still in **SQL Editor**
2. Create **New query**
3. **Set Role to `postgres`**
4. Copy and paste the contents of:
   ```
   /APPLY_RLS_GRANTS.sql
   ```
5. Click **Run**
6. Wait for success message with grant summary

**What this does**:
- Grants EXECUTE on helper functions to `authenticated` role
- Grants SELECT, INSERT, UPDATE, DELETE on tables to `authenticated` role
- RLS policies will enforce actual permissions

---

### Step 3: Verify RLS is Active

Run this query in SQL Editor:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('assets', 'risk_register', 'risk_events');
```

**Expected output**:
```
tablename       | rowsecurity
----------------|------------
assets          | t
risk_register   | t
risk_events     | t
```

All should show `t` (true) for `rowsecurity`.

---

### Step 4: Test RLS Policies

Run this query to check your RLS context:

```sql
-- Check current RLS context
SELECT 
  auth.uid() as current_user_id,
  current_tenant_id() as current_tenant_id,
  current_role() as current_role;
```

**Expected output**:
```
current_user_id              | current_tenant_id            | current_role
-----------------------------|------------------------------|-------------
f7e3a8d2-1234-5678-9abc-... | 9d2b1c4e-5678-9abc-def0-... | admin
```

If you get `NULL` values, it means:
- No user is logged in (auth.uid() is NULL)
- User doesn't exist in `public.users` table
- User's tenant_id or role is NULL in `public.users`

---

### Step 5: Test Tenant Isolation

Create test data and verify isolation:

```sql
-- Insert an asset (should auto-scope to your tenant)
INSERT INTO assets (site_id, name, asset_type, status, tenant_id, created_by)
VALUES (
  'some-site-id',
  'Test Sensor',
  'sensor',
  'operational',
  current_tenant_id(),  -- Your tenant
  auth.uid()            -- Your user ID
);

-- Select assets (should only see your tenant's data)
SELECT id, tenant_id, name FROM assets;

-- Try to see another tenant's data (should return 0 rows)
SELECT id, tenant_id, name FROM assets 
WHERE tenant_id != current_tenant_id();
```

**Expected**:
- INSERT succeeds with your tenant_id
- First SELECT shows your assets
- Second SELECT returns 0 rows (cross-tenant data hidden)

---

## 🐛 Troubleshooting

### Issue: "function current_tenant_id() does not exist"

**Cause**: Migration didn't run or ran with wrong role

**Fix**:
1. Verify you ran migration with Role: `postgres`
2. Re-run Step 1 migration
3. Check Supabase logs for errors

---

### Issue: "permission denied for table assets"

**Cause**: Grants not applied

**Fix**:
1. Run Step 2 grants script with Role: `postgres`
2. Verify grants with:
   ```sql
   SELECT grantee, privilege_type, table_name
   FROM information_schema.table_privileges
   WHERE table_name IN ('assets', 'risk_register', 'risk_events')
     AND grantee = 'authenticated';
   ```

---

### Issue: "new row violates row-level security policy"

**Cause**: Trying to insert with wrong tenant_id or created_by

**Fix**:
1. Use `current_tenant_id()` for tenant_id:
   ```sql
   INSERT INTO assets (..., tenant_id, created_by)
   VALUES (..., current_tenant_id(), auth.uid());
   ```
2. Or let frontend dbClient handle it automatically

---

### Issue: "current_tenant_id() returns NULL"

**Cause**: User not found in `public.users` table

**Fix**:
1. Check if user exists:
   ```sql
   SELECT id, tenant_id, role FROM users WHERE id = auth.uid();
   ```
2. If missing, create user via RPC:
   ```sql
   SELECT rpc_bootstrap_tenant_and_user('My Org', 'My Name');
   ```

---

## 📊 Verification Checklist

After setup, verify these work:

- [ ] RLS enabled on all three tables
- [ ] `current_tenant_id()` returns your tenant ID
- [ ] `current_role()` returns your role
- [ ] SELECT only shows your tenant's data
- [ ] INSERT adds tenant_id and created_by automatically
- [ ] UPDATE works for your own records
- [ ] UPDATE works for admin/owner on any record
- [ ] DELETE only works for admin/owner
- [ ] Cross-tenant data completely hidden

---

## 🎯 Next Steps

After RLS is set up:

1. **Test in Frontend**:
   - Log in to the app
   - Open RLS Debug Panel (green shield icon)
   - Verify context matches database
   - Create assets/risks and verify permissions

2. **Multi-Tenant Testing**:
   - Create second tenant
   - Create second user in different tenant
   - Log in as second user
   - Verify cannot see first tenant's data

3. **Permission Testing**:
   - Create user with 'viewer' role
   - Verify cannot delete records
   - Create user with 'admin' role
   - Verify can delete any record

---

## 📚 Reference

- **RLS Migration**: `/supabase/migrations/20240101000005_rls_multi_tenant_isolation.sql`
- **Grants Script**: `/APPLY_RLS_GRANTS.sql`
- **Complete Documentation**: `/RLS_IMPLEMENTATION_COMPLETE.md`
- **Database Operations Guide**: `/DATABASE_OPERATIONS_GUIDE.md`

---

## ⚠️ Important Notes

1. **Always use Role: postgres** when running migrations and grants
2. **Never run DROP POLICY in production** without backup
3. **Test with multiple tenants** before production deployment
4. **RLS cannot be bypassed** - even by service role (good for security!)
5. **Helper functions are cached** (`STABLE`) for performance

---

## ✅ You're Done!

Your database now has production-grade multi-tenant isolation with:
- ✅ Tenant-scoped data access
- ✅ Per-user permissions
- ✅ Automatic field injection
- ✅ Cross-tenant protection

**Status**: Ready for multi-tenant production deployment! 🚀
