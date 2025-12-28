# Deployment Checklist - Authentication Verification

## Pre-Deployment Verification

### ✅ Code Review
- [x] No direct `fetch()` calls to `/rest/v1/*` endpoints in frontend
- [x] All frontend queries use `supabase.from().select()` pattern
- [x] Session verification runs before queries in TenantResolver
- [x] Session verification runs before queries in TenantSetup
- [x] Queries use `session.user.id` instead of prop userId
- [x] Early return if session is null or missing access_token

### ✅ Supabase Client Configuration
- [x] Client initialized with `autoRefreshToken: true`
- [x] Client initialized with `persistSession: true`
- [x] Client initialized with `detectSessionInUrl: true`
- [x] Client exported as singleton to prevent multiple instances

### ✅ Console Logging
- [x] Session check logs before queries
- [x] Session status logged (exists/missing)
- [x] Access token presence logged
- [x] User ID from session logged
- [x] Query results logged for debugging

## Runtime Verification (After Deployment)

### 1. Login Flow Test
**Steps:**
1. Navigate to login page
2. Enter valid credentials
3. Click login

**Expected Console Logs:**
```
[Login] 📡 Making request to: https://...
[Login] ✅ Login successful
[TenantResolver] 🔍 Checking tenant memberships
[TenantResolver] Session check:
  - Session exists: true
  - Access token: ✅ Present (length: 1034)
  - User ID from session: abc123-def456-...
```

**Expected Network Tab:**
```
POST /auth/v1/token?grant_type=password
  Status: 200 OK
  
GET /rest/v1/tenant_members?user_id=eq.abc123...
  Status: 200 OK
  Request Headers:
    Authorization: Bearer eyJ... (long token)
    apikey: eyJ... (short token)
```

### 2. Session Persistence Test
**Steps:**
1. Login successfully
2. Refresh the page (F5)
3. Verify user remains logged in

**Expected Behavior:**
- User should not see login page
- Session should be restored from localStorage
- TenantResolver should run automatically
- No new login request should be made

**Expected Console Logs:**
```
[TenantContext] Initializing - checking for existing session
[TenantContext] ✓ Session found - User ID: abc123...
[App] Tenant context found in localStorage
```

### 3. Token Auto-Refresh Test
**Steps:**
1. Login successfully
2. Wait for 50-55 minutes (token expires at 60 minutes)
3. Trigger a query (navigate between pages)

**Expected Console Logs:**
```
[App] Auth state changed: TOKEN_REFRESHED
[App] Token refreshed - session still valid
```

**Expected Network Tab:**
```
POST /auth/v1/token?grant_type=refresh_token
  Status: 200 OK
```

### 4. Logout Test
**Steps:**
1. Login successfully
2. Click logout button
3. Verify session is cleared

**Expected Behavior:**
- User redirected to login page
- localStorage should be cleared
- No Authorization header on subsequent requests

**Expected Console Logs:**
```
[App] Auth state changed: SIGNED_OUT
[App] User signed out - clearing state
[TenantContext] User logged out
```

### 5. Expired Token Test
**Steps:**
1. Login successfully
2. Manually edit token expiration in localStorage
3. Trigger a query

**Expected Behavior:**
- Should auto-refresh token OR redirect to login
- User should not see "permission denied" errors

### 6. Onboarding Flow Test
**Steps:**
1. Create a new account (signup)
2. Verify onboarding screen appears
3. Fill in organization name
4. Submit

**Expected Console Logs:**
```
[TenantSetup] 🚀 Starting onboarding flow
[TenantSetup] Session check:
  - Session exists: true
  - Access token: ✅ Present (length: 1034)
[TenantSetup] Step 1: Creating tenant...
[TenantSetup] ✅ Step 1 complete
[TenantSetup] Step 2: Creating user profile...
[TenantSetup] ✅ Step 2 complete
[TenantSetup] Step 3: Assigning admin role...
[TenantSetup] ✅ Step 3 complete
```

**Expected Network Tab:**
```
POST /rest/v1/tenants
  Status: 201 Created
  Request Headers:
    Authorization: Bearer eyJ...
    
POST /rest/v1/users
  Status: 201 Created
  Request Headers:
    Authorization: Bearer eyJ...
    
POST /rest/v1/tenant_members
  Status: 201 Created
  Request Headers:
    Authorization: Bearer eyJ...
```

## Network Tab Verification Checklist

### For EVERY request to `/rest/v1/*`:

- [ ] Request includes `Authorization: Bearer <token>` header
- [ ] Request includes `apikey: <anon_key>` header
- [ ] Authorization token is ~800-1200 characters
- [ ] apikey is ~200-300 characters
- [ ] Authorization token is DIFFERENT from apikey
- [ ] Status code is 200 OK or 201 Created (not 401 Unauthorized)

### JWT Token Verification (at https://jwt.io):

- [ ] Token decodes successfully
- [ ] Payload contains `"aud": "authenticated"`
- [ ] Payload contains `"role": "authenticated"`
- [ ] Payload contains `"sub": "<user-id>"`
- [ ] Payload contains `"email": "<user-email>"`
- [ ] Expiration (`exp`) is in the future
- [ ] Issued at (`iat`) is in the past

## Database RLS Verification

### Required Policies

Execute these checks in Supabase Dashboard → SQL Editor:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenant_members', 'tenants', 'users');

-- Expected: All should have rowsecurity = true
```

```sql
-- Check policies exist
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tenant_members', 'tenants', 'users')
ORDER BY tablename, policyname;

-- Expected: At least one SELECT policy per table for 'authenticated' role
```

```sql
-- Test query as authenticated user (should return rows)
-- Run this in Supabase SQL Editor with "Run as: authenticated"
SELECT * FROM tenant_members WHERE user_id = auth.uid();
```

### RLS Policy Checklist

- [ ] RLS enabled on `tenant_members` table
- [ ] RLS enabled on `tenants` table
- [ ] RLS enabled on `users` table
- [ ] SELECT policy exists for `tenant_members` using `auth.uid()`
- [ ] INSERT policy exists for `tenant_members` using `auth.uid()`
- [ ] SELECT policy exists for `tenants` checking membership
- [ ] INSERT policy exists for `tenants` for authenticated users
- [ ] Policies grant access to `authenticated` role (not `anon`)

## Error Scenarios to Test

### 1. No Session Error
**Trigger:** Clear localStorage and refresh
**Expected:** Redirect to login with message

### 2. Expired Token Error
**Trigger:** Wait for token expiration
**Expected:** Auto-refresh or redirect to login

### 3. Permission Denied Error
**Trigger:** Query without proper RLS policies
**Expected:** Clear error message with SQL to execute

### 4. Invalid Credentials Error
**Trigger:** Login with wrong password
**Expected:** "Invalid credentials" error message

## Performance Checks

- [ ] Session check adds < 50ms to query time
- [ ] Token auto-refresh happens transparently
- [ ] No duplicate session checks per query
- [ ] localStorage reads/writes are minimal

## Security Checks

- [ ] Service role key NEVER appears in frontend code
- [ ] Service role key NEVER appears in Network tab
- [ ] User can only see their own tenant_members records
- [ ] User can only see tenants they belong to
- [ ] User can only modify their own user record

## Documentation Review

- [ ] README includes login instructions
- [ ] README includes troubleshooting section
- [ ] Error messages guide users to solutions
- [ ] SQL statements provided for RLS setup

## Final Sign-Off

Once all items are checked:

- [ ] All frontend queries use authenticated Supabase client ✅
- [ ] Session verification runs before queries ✅
- [ ] Network tab shows Authorization headers ✅
- [ ] JWT tokens contain correct user claims ✅
- [ ] RLS policies are properly configured ✅
- [ ] Error handling provides clear guidance ✅
- [ ] Documentation is complete ✅

## Rollback Plan

If authentication issues occur in production:

1. Check browser console for session errors
2. Check Network tab for missing Authorization headers
3. Verify RLS policies are active in Supabase Dashboard
4. Check Supabase logs for authentication errors
5. If needed, temporarily disable RLS and re-enable after fixing policies

## Monitoring Recommendations

Track these metrics in production:

1. **Login success rate** - Should be > 95%
2. **Token refresh success rate** - Should be > 99%
3. **Session persistence rate** - Should be > 90%
4. **RLS permission errors** - Should be near 0
5. **Average session duration** - Should match user activity patterns

---

**Last Updated:** December 26, 2024
**Review Status:** ✅ Ready for Production
