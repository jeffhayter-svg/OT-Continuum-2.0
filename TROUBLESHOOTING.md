# Troubleshooting: Tenant Resolver & RBAC

## Error: "permission denied for function rpc_bootstrap_tenant_and_user"

### This is the most common error - it means GRANT permissions haven't been applied.

**⚠️ CRITICAL FIX REQUIRED:**

1. Open **Supabase Studio** in your browser
2. Go to **SQL Editor**
3. Click **New Query**
4. **IMPORTANT:** Change the **Role** dropdown from `authenticated` to `postgres`
5. Copy the contents of `/supabase/migrations/APPLY_GRANTS.sql`
6. Paste into SQL Editor
7. Click **Run**

**Or run this directly:**

```sql
-- Grant permissions
grant usage on schema public to authenticated;
grant execute on function public.rpc_bootstrap_tenant_and_user(text, text) to authenticated;
grant execute on function public.rpc_get_my_tenant_context() to authenticated;

-- Verify
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' AND routine_name LIKE 'rpc_%';
```

**Expected output:**
- `rpc_bootstrap_tenant_and_user | authenticated | EXECUTE`
- `rpc_get_my_tenant_context | authenticated | EXECUTE`

**Why does this happen?**
- SQL functions created by migrations don't automatically grant execute permissions
- This MUST be done in Supabase Dashboard with `postgres` role
- PowerShell/terminal cannot execute GRANT statements (requires admin privileges)

**See also:** Step 2.1 in QUICK_START.md

---

## Error: "Could not find the function public.rpc_bootstrap_tenant_and_user"

### This means the migration hasn't been applied to your database.

### Fix Option 1: Using Supabase CLI (Recommended)

```bash
# Reset database and apply all migrations
supabase db reset
```

If that doesn't work, try:

```bash
# Apply migrations without reset
supabase migration up
```

### Fix Option 2: Manual SQL (If CLI doesn't work)

1. Open **Supabase Studio** in your browser
2. Go to **SQL Editor**
3. Copy the entire contents of `/supabase/migrations/MANUAL_RUN.sql`
4. Paste into the SQL Editor
5. Click **Run**

You should see:
```
✅ Migration complete!
Tables created: tenants, users, tenant_invites
RLS enabled on all tables
Functions created: rpc_bootstrap_tenant_and_user, rpc_get_my_tenant_context
```

### Verify Migration Succeeded

Run this in SQL Editor:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'users', 'tenant_invites');

-- Should return 3 rows
```

```sql
-- Check RPC functions exist
SELECT proname FROM pg_proc 
WHERE proname LIKE 'rpc_%';

-- Should return:
-- rpc_bootstrap_tenant_and_user
-- rpc_get_my_tenant_context
```

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'users');

-- rowsecurity should be 't' (true)
```

---

## Error: "permission denied for table users"

### This error should NOT happen anymore, but if it does:

**Cause:** The TenantResolver is trying to query the `users` table directly, but RLS blocks it.

**Fix:** Make sure you're using the latest version of `TenantResolver.tsx` that uses `rpc_get_my_tenant_context()` instead of direct table queries.

**Verify:** Check that TenantResolver.tsx has this code:
```typescript
const { data: contextData, error: contextError } = await supabase
  .rpc('rpc_get_my_tenant_context');
```

NOT this:
```typescript
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

---

## Error: "Not authenticated"

**Cause:** The user's session has expired or they're not logged in.

**Fix:**
1. Logout
2. Login again
3. The session should be fresh

**Debug:**
1. Open browser DevTools → Console
2. Check for auth state logs
3. Verify session exists:
   ```javascript
   await supabase.auth.getSession()
   ```

---

## Tenant Resolver Stuck on "Looking up your organization…"

**Possible Causes:**

1. **RPC function doesn't exist**
   - Run migration (see above)
   
2. **Network error**
   - Check browser console for errors
   - Check Supabase Studio → Logs
   
3. **Function failing silently**
   - Check Supabase Studio → Logs → Functions
   - Look for errors in `rpc_get_my_tenant_context`

**Debug:**
1. Open browser DevTools → Console
2. Look for `[TenantResolver]` logs
3. Check the debug panel (purple bug icon)
4. See what step it's stuck on

---

## Tenant Created But User Lands on Login Page

**Cause:** Tenant context not being stored properly.

**Fix:**
1. Check browser console for errors
2. Open DevTools → Application → Local Storage
3. Look for `ot_tenant_context` key
4. If missing, check `onResolved` callback in App.tsx

**Debug:**
```javascript
// In browser console
localStorage.getItem('ot_tenant_context')
```

Should return JSON with tenant info.

---

## Multiple Tenants Created for Same User

**Cause:** The bootstrap function's idempotency check isn't working.

**Fix:**
1. Check if user already exists in `public.users`:
   ```sql
   SELECT * FROM users WHERE id = '<your-auth-uid>';
   ```

2. If multiple tenants exist, manually clean up:
   ```sql
   -- Keep only the first tenant
   DELETE FROM tenants 
   WHERE id NOT IN (
     SELECT tenant_id FROM users WHERE email = 'your@email.com' LIMIT 1
   );
   ```

---

## RLS Not Blocking Cross-Tenant Access

**Cause:** RLS policies not applied or incorrectly configured.

**Test:**
1. Create two users with different emails
2. Login as user 1
3. In SQL Editor, run:
   ```sql
   SELECT * FROM users;
   ```
4. Should only see your own user row

**Fix:**
1. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'users';
   ```
2. Re-apply policies (run MANUAL_RUN.sql again)

---

## Development Mode Indicator Not Showing

**Expected:** Blue bar at top showing "Dev Mode | Tenant: ... | Role: ..."

**Cause:** You're not on localhost.

**Check:**
```javascript
window.location.hostname === 'localhost'
```

If running on a different domain (like Gitpod, Codespaces, etc.), update the check in App.tsx:

```typescript
{typeof window !== 'undefined' && 
 (window.location.hostname === 'localhost' || 
  window.location.hostname.includes('your-domain')) && (
  // dev indicator
)}
```

---

## Dev Diagnostics Panel Not Appearing

**Cause:** Same as above - hostname check.

**Fix:** Update the check in `DevDiagnostics.tsx`:

```typescript
if (typeof window === 'undefined' || 
    !(window.location.hostname === 'localhost' || 
      window.location.hostname.includes('your-domain'))) {
  return null;
}
```

---

## Complete Reset (Nuclear Option)

If nothing else works:

```bash
# 1. Reset Supabase database
supabase db reset

# 2. Clear browser storage
# In DevTools → Application → Storage → Clear site data

# 3. Restart dev server
npm run dev

# 4. Create new account with fresh email
```

---

## Still Having Issues?

### Collect Debug Info:

1. **Browser Console Logs**
   - Copy all `[TenantResolver]` logs
   
2. **Supabase Function Logs**
   - Supabase Studio → Logs → Functions
   - Look for `rpc_bootstrap_tenant_and_user` calls
   
3. **Database State**
   ```sql
   SELECT * FROM tenants;
   SELECT * FROM users;
   SELECT proname FROM pg_proc WHERE proname LIKE 'rpc_%';
   ```

4. **Local Storage**
   ```javascript
   localStorage.getItem('ot_tenant_context')
   ```

5. **Network Tab**
   - Check for failed requests to `/rpc/rpc_bootstrap_tenant_and_user`

### Common Patterns:

- **"Function not found"** → Migration not applied
- **"Permission denied"** → Using direct table query instead of RPC
- **"Not authenticated"** → Session expired, re-login
- **Stuck on loading** → Network error or function timeout
- **Redirects to login after successful signup** → Context not being stored

---

## Verification Checklist

After migration, verify:

- [ ] Tables exist: `tenants`, `users`, `tenant_invites`
- [ ] RLS enabled on all tables
- [ ] Functions exist: `rpc_bootstrap_tenant_and_user`, `rpc_get_my_tenant_context`
- [ ] Policies exist (12 total across 3 tables)
- [ ] Can create new user account
- [ ] Tenant resolver runs without errors
- [ ] User lands on dashboard with tenant context
- [ ] Dev diagnostics panel shows tenant info
- [ ] Logout and login works
- [ ] LocalStorage persists tenant context