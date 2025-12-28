# Testing the Tenant Resolver & RBAC System

## Prerequisites

1. **Run the migration:**
   ```bash
   supabase db reset
   ```

2. **Verify migration succeeded:**
   - Check Supabase Studio → SQL Editor
   - Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('tenants', 'users', 'tenant_invites');`
   - Should return 3 rows

## Test Case 1: New User Signup → Tenant Bootstrap

### Steps:
1. Open the app at `http://localhost:5173`
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click **"✨ Create Account (Same Credentials)"**

### Expected Behavior:
- ✅ Success message: "Account created! Setting up your organization..."
- ✅ Tenant resolver page appears with progress:
  - "Checking your account…" ✓
  - "Looking up your organization…" ✓
  - "Creating your organization…" ⏳
  - "Done. Redirecting…" ✓
- ✅ Redirects to dashboard
- ✅ Top nav shows: `test@example.com` and `test's Organization • admin`

### Verify in Supabase Studio:
1. **Auth → Users**
   - User exists with email `test@example.com`
   - Email confirmed: ✓

2. **Table Editor → `tenants`**
   ```sql
   SELECT * FROM tenants;
   ```
   - One tenant created
   - Name: "test's Organization" (or similar)
   - Status: "active"
   - Plan: "free"

3. **Table Editor → `users`**
   ```sql
   SELECT * FROM users;
   ```
   - One user record
   - Email: test@example.com
   - Role: admin
   - tenant_id: matches tenant from step 2

### Debug Console Output:
```
[App.tsx Signup] ✅ Account Created
[TenantResolver] 🔍 Starting tenant resolution
[TenantResolver] Session user ID: <uuid>
[TenantResolver] Getting tenant context via RPC...
[TenantResolver] User not found. Bootstrapping new tenant...
[TenantResolver] Calling rpc_bootstrap_tenant_and_user...
[TenantResolver] ✅ Tenant created: <uuid>
[TenantResolver] ✅ New tenant context: {...}
[TenantResolver] 🎉 Bootstrap complete! Redirecting to app...
```

---

## Test Case 2: Existing User Login → Context Load

### Steps:
1. Logout from the app
2. Login with same credentials: `test@example.com` / `password123`
3. Click **"Sign In"**

### Expected Behavior:
- ✅ Tenant resolver page appears briefly
- ✅ Shows "Looking up your organization…" ✓
- ✅ Skips "Creating your organization" step
- ✅ Shows "Done. Redirecting…" ✓
- ✅ Redirects to dashboard
- ✅ Same tenant context loaded

### Debug Console Output:
```
[App.tsx Login] ✅ Login successful - redirecting to tenant resolver
[TenantResolver] 🔍 Starting tenant resolution
[TenantResolver] Getting tenant context via RPC...
[TenantResolver] ✅ User found with tenant: <uuid>
[TenantResolver] ✅ Tenant context: {...}
[TenantResolver] 🎉 Resolved! Redirecting to app...
```

---

## Test Case 3: RLS Cross-Tenant Isolation

### Steps:
1. Create a second user with different email:
   - Email: `user2@example.com`
   - Password: `password123`
   
2. Login as second user

### Expected Behavior:
- ✅ New tenant is created for user2
- ✅ user2 has their own organization
- ✅ user2 is admin of their own tenant

### Verify RLS is working:
In Supabase Studio → SQL Editor, run:

```sql
-- Login as user 1 (test@example.com) via the app
-- Then run this query:

-- This should only return YOUR tenant (RLS enforced)
SELECT * FROM tenants;

-- This should only return YOUR user record (RLS enforced)
SELECT * FROM users;

-- Try to query another tenant (should return 0 rows)
SELECT * FROM users WHERE email = 'user2@example.com';
```

**Expected:** You can only see your own tenant and user data. Cross-tenant queries return nothing.

---

## Test Case 4: Dev Diagnostics Panel

### Steps:
1. Login to the app
2. Look for purple bug icon in bottom-right corner
3. Click to open dev diagnostics

### Expected:
- ✅ Shows auth.uid
- ✅ Shows tenant_id
- ✅ Shows role badge (colored by role)
- ✅ Expandable sections for User, Tenant, Metadata
- ✅ "Log to Console" button works
- ✅ "Clear & Reload" button clears localStorage and reloads

---

## Test Case 5: Role-Based Authorization (Future)

### Using AuthGate:
```tsx
import { AuthGate, AdminOnly } from './components/AuthGate';

// Protect a route - only admins can access
<AdminOnly>
  <AdminPanel />
</AdminOnly>

// Custom role check
<AuthGate allowedRoles={['admin', 'manager']}>
  <ManagementDashboard />
</AuthGate>
```

---

## Common Issues & Fixes

### Issue: "permission denied for table users"
**Cause:** RLS policies blocking direct table access  
**Fix:** Already fixed! TenantResolver now uses `rpc_get_my_tenant_context()` with SECURITY DEFINER

### Issue: Tenant resolver stuck on "Looking up your organization"
**Cause:** RPC function not found or migration not applied  
**Fix:** Run `supabase db reset` to apply migrations

### Issue: User created but no tenant
**Cause:** Bootstrap function failed  
**Fix:** Check console for error messages. Verify RPC function exists:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'rpc_%';
```

### Issue: "Not authenticated" error
**Cause:** Session expired or not logged in  
**Fix:** Re-login to get fresh session

---

## Success Criteria

- ✅ New users can sign up and get auto-assigned to a new tenant
- ✅ New users get `admin` role by default
- ✅ Existing users can login and load their tenant context
- ✅ Tenant context persists in localStorage
- ✅ RLS prevents cross-tenant data access
- ✅ Dev diagnostics panel shows all auth/tenant info
- ✅ AuthGate protects routes properly
- ✅ No "permission denied" errors

---

## Next Steps

After testing succeeds:

1. **Add team invite functionality** using `tenant_invites` table
2. **Add role management UI** for admins to assign roles
3. **Add tenant settings page** for admins to update org info
4. **Implement proper site/asset scoping** within tenants
5. **Add billing integration** tied to tenant plans
