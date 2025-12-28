# Authentication Quick Reference Card

## ⚡ Quick Start

### 1. Setup RLS (One-Time)
```bash
# Copy /sql/minimal-rls-setup.sql
# Paste in Supabase Dashboard → SQL Editor (Role: postgres)
# Click Run
```

### 2. Verify Setup
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenant_members', 'tenants', 'users');
```

### 3. Test Login
```javascript
// Console should show:
[TenantResolver] Session check:
  - Session exists: true
  - Access token: ✅ Present
```

## 🔍 Debugging Checklist

### No Data Returned?
1. Check console for session logs
2. Open DevTools → Network → Filter "tenant_members"
3. Verify Authorization header exists
4. Decode JWT at https://jwt.io

### Permission Denied Error?
1. Check if RLS setup SQL was executed
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'tenant_members'`
3. Check grants: See `/sql/minimal-rls-setup.sql`

### Session Lost?
1. Check localStorage: `localStorage.getItem('supabase.auth.token')`
2. Verify auto-refresh is enabled in supabase client
3. Check token expiration in JWT payload

## 📋 Network Tab Verification

### What to Check
```
Request URL: /rest/v1/tenant_members
Request Headers:
  ✅ Authorization: Bearer eyJ... (~1000 chars)
  ✅ apikey: eyJ... (~300 chars)
  ✅ Both headers present
  ✅ Tokens are different
Status: 200 OK
```

### Red Flags
```
❌ No Authorization header → User not logged in
❌ 401 Unauthorized → Token expired or invalid
❌ 403 Forbidden → RLS policy blocked query
❌ 42501 error code → Missing GRANT permissions
```

## 💻 Code Patterns

### ✅ CORRECT: Session-First Pattern
```typescript
// 1. Get session FIRST
const { data: { session } } = await supabase.auth.getSession();

// 2. Verify session exists
if (!session || !session.access_token) {
  throw new Error('No active session');
}

// 3. Query using session.user.id
const { data, error } = await supabase
  .from('tenant_members')
  .select('*')
  .eq('user_id', session.user.id);
```

### ❌ WRONG: No Session Check
```typescript
// Missing session verification
const { data } = await supabase
  .from('tenant_members')
  .select('*')
  .eq('user_id', userId); // ❌ Using prop instead of session
```

### ❌ WRONG: Direct Fetch
```typescript
// Bypasses authentication
const response = await fetch('/rest/v1/tenant_members');
```

## 📚 Documentation Map

| Task | Document |
|------|----------|
| **Setup RLS** | `/docs/RLS_SETUP_GUIDE.md` |
| **Debug auth issues** | `/docs/NETWORK_TAB_VERIFICATION.md` |
| **Verify deployment** | `/docs/DEPLOYMENT_CHECKLIST.md` |
| **Understand changes** | `/docs/AUTH_FIXES_SUMMARY.md` |
| **Get SQL script** | `/sql/minimal-rls-setup.sql` |

## 🚨 Common Errors

### Error: "Permission denied for table tenant_members"
```bash
# Solution: Execute RLS setup SQL
# File: /sql/minimal-rls-setup.sql
# Location: Supabase Dashboard → SQL Editor (Role: postgres)
```

### Error: "No active session found"
```bash
# Solution: Check if user is logged in
await supabase.auth.getSession()
# Should return: { data: { session: {...} } }
```

### Error: "JWT expired"
```bash
# Solution: Auto-refresh should handle this
# Check if autoRefreshToken: true in supabase client
# If not, user needs to log in again
```

### Error: Users see wrong tenant data
```bash
# Solution: Check RLS policies use auth.uid()
SELECT policyname, using_expression 
FROM pg_policies 
WHERE tablename = 'tenant_members';
# Expected: user_id = auth.uid()
```

## 🔐 Security Checklist

- [x] RLS enabled on all tables
- [x] All queries use authenticated client
- [x] Session verified before queries
- [x] Service role key never in frontend
- [x] JWT tokens contain user claims
- [x] Policies enforce tenant isolation

## 📊 Monitoring

### Key Metrics
- Login success rate: > 95%
- Token refresh success: > 99%
- Session persistence: > 90%
- RLS permission errors: Near 0

### Where to Check
- Supabase Dashboard → Logs → Database
- Supabase Dashboard → Logs → Auth
- Browser Console → Session logs
- Network Tab → Authorization headers

## 🎯 Quick Tests

### Test 1: Login and Session
```javascript
// 1. Login
await supabase.auth.signInWithPassword({ email, password })

// 2. Check session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', !!session)

// 3. Check localStorage
console.log(localStorage.getItem('supabase.auth.token'))
```

### Test 2: Network Headers
```bash
# 1. Open DevTools → Network
# 2. Filter: tenant_members
# 3. Click request
# 4. Check headers:
#    - Authorization: Bearer eyJ...
#    - apikey: eyJ...
```

### Test 3: JWT Token
```bash
# 1. Copy Authorization token from Network tab
# 2. Go to https://jwt.io
# 3. Paste token
# 4. Verify payload:
#    - sub: user-id
#    - email: user@example.com
#    - role: authenticated (NOT anon)
```

### Test 4: RLS Isolation
```sql
-- Run as authenticated user in SQL Editor
SELECT * FROM tenant_members WHERE user_id = auth.uid();
-- Should return only current user's memberships

-- Try to access other user's data
SELECT * FROM tenant_members WHERE user_id = 'some-other-user-id';
-- Should return empty (RLS blocks it)
```

## 🚀 Production Deployment

### Before Deploy
1. Execute `/sql/minimal-rls-setup.sql`
2. Verify RLS policies exist
3. Test login flow in staging
4. Check Network tab for auth headers

### After Deploy
1. Test new user signup
2. Test existing user login
3. Verify onboarding flow
4. Monitor error rates

### Rollback Plan
1. Check Supabase logs for errors
2. Verify RLS policies are active
3. Check session creation in auth logs
4. If needed, disable RLS temporarily:
   ```sql
   ALTER TABLE tenant_members DISABLE ROW LEVEL SECURITY;
   ```

## 📞 Support

### When Stuck
1. Check console logs first
2. Check Network tab for auth headers
3. Review `/docs/NETWORK_TAB_VERIFICATION.md`
4. Verify RLS setup in `/docs/RLS_SETUP_GUIDE.md`
5. Check deployment checklist

### Still Stuck?
1. Check Supabase logs in dashboard
2. Test with service role key (bypasses RLS)
3. Verify JWT token at jwt.io
4. Review `/docs/AUTHENTICATION_COMPLETE.md`

---

**Status:** ✅ Production Ready  
**Last Updated:** December 26, 2024  
**Quick Links:**
- [RLS Setup](/docs/RLS_SETUP_GUIDE.md)
- [Network Debugging](/docs/NETWORK_TAB_VERIFICATION.md)
- [SQL Script](/sql/minimal-rls-setup.sql)
