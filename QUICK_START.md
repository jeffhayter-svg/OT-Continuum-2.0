# Quick Start: Apply Migration & Test Tenant Resolver

## 🚀 Step-by-Step Guide

### Step 1: Apply the Migration

**⚠️ IMPORTANT: All SQL statements MUST be executed in Supabase Dashboard → SQL Editor.**
**Never run SQL migrations in PowerShell, terminal, or command line tools.**

Choose ONE of these methods:

#### Method A: Using Supabase CLI (Recommended)

```bash
# In your terminal, run:
supabase db reset
```

Wait for it to complete. You should see output like:
```
Applying migration 20231226000000_tenant_rbac_system.sql...
Seeding data...
Finished supabase db reset
```

#### Method B: Using Supabase Studio (If CLI doesn't work)

1. Open your browser and go to Supabase Studio
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `/supabase/migrations/MANUAL_RUN.sql` in your code editor
5. Copy ALL the contents
6. Paste into Supabase Studio SQL Editor
7. **IMPORTANT:** At the top of the SQL Editor, change the **Role** dropdown from `authenticated` to `postgres`
8. Click **Run** (or press Ctrl+Enter)
9. You should see: `✅ Migration complete!`

---

### Step 2: Verify Migration Succeeded

In Supabase Studio → SQL Editor, create a new query and paste:

```sql
-- Quick verification
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'users', 'tenant_invites');
```

Click **Run**. You should see 3 rows:
- `tenants`
- `users`  
- `tenant_invites`

✅ If you see all 3, the migration succeeded!

❌ If you see 0 rows, the migration didn't apply. Try Method B above.

---

### Step 2.1: Apply GRANTs for RPCs

**🔐 CRITICAL STEP: Grant Execute Permissions for RPC Functions**

**⚠️ This MUST be done in Supabase Dashboard → SQL Editor with Role: `postgres`**

1. Open Supabase Studio in your browser
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. **IMPORTANT:** At the top of the SQL Editor, verify the **Role** dropdown is set to `postgres` (NOT `authenticated`)
5. Copy and paste this script:

```sql
-- Grant schema usage to authenticated users
grant usage on schema public to authenticated;

-- Grant execute permissions on RPC functions
grant execute on function public.rpc_bootstrap_tenant_and_user(text, text) to authenticated;
grant execute on function public.rpc_get_my_tenant_context() to authenticated;

-- Verify grants were applied
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name LIKE 'rpc_%'
ORDER BY routine_name, grantee;
```

6. Click **Run** (or press Ctrl+Enter)
7. You should see output showing the grants were applied:
   - `rpc_bootstrap_tenant_and_user | authenticated | EXECUTE`
   - `rpc_get_my_tenant_context | authenticated | EXECUTE`

✅ If you see these results, permissions are configured correctly!

❌ If you see "permission denied" or no results, verify:
   - The Role dropdown is set to `postgres` (not `authenticated`)
   - The migration from Step 1 was successfully applied
   - The functions exist (check Step 2 verification)

**Why is this step required?**
- SQL functions created by migrations don't automatically grant execute permissions to `authenticated` role
- Without these grants, users will get "permission denied" errors when calling the RPC functions
- This is a PostgreSQL security feature that must be configured explicitly
- **PowerShell and terminal cannot execute GRANT statements** - they must run in Supabase Dashboard with admin privileges

---

### Step 3: Test the App

#### A) Start the dev server (if not already running)

```bash
npm run dev
```

#### B) Open the app

Go to `http://localhost:5173`

#### C) Create a test account

1. Email: `test@example.com`
2. Password: `password123`
3. Click **"✨ Create Account (Same Credentials)"**

#### D) Watch the tenant resolver

You should see:
1. ✅ "Account created! Setting up your organization..."
2. Progress screen:
   - ✓ "Checking your account…"
   - ✓ "Looking up your organization…"  
   - ⏳ "Creating your organization…"
   - ✓ "Done. Redirecting…"
3. Dashboard loads with your tenant info

#### E) Verify in the UI

Top navigation should show:
- Email: `test@example.com`
- Organization: `test's Organization`
- Role: `admin`

#### F) Check the debug panel (dev only)

1. Look for purple bug icon 🐛 in bottom-right corner
2. Click to open
3. You should see:
   - User ID (UUID)
   - Tenant ID (UUID)
   - Role badge (colored by role)

---

### Step 4: Verify in Database

Back in Supabase Studio → SQL Editor:

```sql
-- Check tenant was created
SELECT id, name, plan, status FROM tenants;
```

You should see 1 row with your organization.

```sql
-- Check user was created
SELECT id, email, full_name, role, tenant_id FROM users;
```

You should see 1 row with your user as `admin`.

```sql
-- Check they're linked
SELECT 
  u.email,
  u.role,
  t.name as tenant_name,
  t.plan
FROM users u
JOIN tenants t ON t.id = u.tenant_id;
```

You should see your user linked to their tenant.

---

### Step 5: Test Existing User Login

1. Logout from the app
2. Login again with same credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click **"Sign In"**

**Expected:**
- Tenant resolver shows briefly
- Skips the "Creating your organization" step
- Goes straight to "Done. Redirecting…"
- Lands on dashboard with same tenant context

---

## 🎉 Success Criteria

✅ Migration applied (tables + functions exist)  
✅ New user signup works  
✅ Tenant created automatically  
✅ User assigned as admin  
✅ Dashboard shows tenant info  
✅ Dev diagnostics panel shows auth data  
✅ Existing user login works  
✅ Tenant context persists  

---

## ❌ If Something Goes Wrong

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed debugging steps.

### Quick Checks:

**Error: "function not found"**
→ Migration not applied. Run Step 1 again.

**Error: "permission denied"**
→ Using old code. Make sure TenantResolver.tsx uses `rpc_get_my_tenant_context()`.

**Stuck on "Looking up..."**
→ Check browser console for errors. Open dev diagnostics panel.

**Lands on login after signup**
→ Check browser console. Verify tenant context in localStorage.

---

## 🔍 Advanced Verification

Run the full verification script in Supabase Studio:

1. Open `/supabase/migrations/verify_migration.sql`
2. Copy contents
3. Paste in SQL Editor
4. Run

This will show a detailed report of:
- Tables created ✓
- RLS enabled ✓
- Functions created ✓
- Policies created ✓

---

## 📝 Next Steps After Success

Once the tenant resolver works:

1. ✅ Test with multiple users (different emails)
2. ✅ Verify RLS blocks cross-tenant access
3. ✅ Test logout/login persistence
4. ✅ Explore the 7 workflow pages
5. 🔜 Add team invite functionality
6. 🔜 Add role management UI
7. 🔜 Add tenant settings page

---

## 🆘 Need Help?

1. Check console logs (look for `[TenantResolver]` prefix)
2. Open dev diagnostics panel (purple bug icon)
3. Run verification SQL script
4. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
5. Review Supabase logs in Studio

---

## 🎯 You're Ready!

If all steps passed, you now have:
- ✅ Multi-tenant database structure
- ✅ Row-level security enforced
- ✅ Automatic tenant provisioning
- ✅ Role-based access control
- ✅ Production-ready auth flow

Congratulations! 🎊