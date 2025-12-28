# Network Tab Verification Guide

## Quick Verification Steps

### 1. Open Browser DevTools
- Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
- Go to **Network** tab
- Check "Preserve log" to keep requests across page navigations

### 2. Filter for Supabase REST API Calls
- In the filter box at the top, type: `tenant_members`
- This will show only requests to the tenant_members table

### 3. Inspect Request Headers

Click on any `/rest/v1/tenant_members` request and look for these headers:

#### ✅ CORRECT - Request includes both headers:
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM1MjU4MjQwLCJpYXQiOjE3MzUyNTQ2NDAsImlzcyI6Imh0dHBzOi8vamNhbmNmYnN6emZ1eXh3bnZ4aGYuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6ImFiYzEyMy1kZWY0NTYiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6e30sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.signature
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYW5jZmJzenpm...
  Content-Type: application/json
  Prefer: return=representation
```

#### ❌ WRONG - Missing Authorization header:
```
Request Headers:
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

### 4. Verify Token Differences

The `Authorization` and `apikey` headers should be **different**:

- **apikey**: Public anon key (same for all users)
  - Shorter JWT (~200-300 chars)
  - Contains only project metadata
  - Role: `anon`

- **Authorization Bearer token**: User-specific access token
  - Longer JWT (~800-1200 chars)
  - Contains user ID (`sub`), email, and other claims
  - Role: `authenticated`

### 5. Decode the JWT Token

Copy the token from the `Authorization: Bearer` header (without the "Bearer " prefix) and paste it into https://jwt.io

You should see:
```json
{
  "aud": "authenticated",
  "exp": 1735258240,
  "iat": 1735254640,
  "iss": "https://jcancfbszzfuyxwnvxhf.supabase.co/auth/v1",
  "sub": "abc123-def456-...",
  "email": "user@example.com",
  "role": "authenticated"
}
```

Key fields to verify:
- `sub`: Should match the logged-in user's ID
- `email`: Should match the logged-in user's email
- `role`: Should be `"authenticated"` (NOT `"anon"`)
- `exp`: Expiration timestamp (should be in the future)

## Console Logs to Check

When TenantResolver runs, you should see these logs:

```
[TenantResolver] 🔍 Checking tenant memberships
  User ID (prop): abc123-def456-...
  Email: user@example.com
  
[TenantResolver] Session check:
  - Session exists: true
  - Access token: ✅ Present (length: 1034)
  - User ID from session: abc123-def456-...
  - Session error: null
  
[TenantResolver] Step 1: Querying tenant_members as authenticated user: abc123-def456-...
```

## Troubleshooting

### No Authorization Header in Network Tab

**Possible causes:**
1. User is not logged in
2. Session expired
3. Session not properly stored in localStorage

**Solution:**
```javascript
// Check session in browser console:
await supabase.auth.getSession()
// Should return: { data: { session: {...} }, error: null }

// Check localStorage:
localStorage.getItem('supabase.auth.token')
// Should contain a JSON object with access_token
```

### Authorization Header Present but RLS Fails

**Possible causes:**
1. RLS policies not created
2. RLS policies using wrong condition
3. Token expired

**Solution:**
1. Decode JWT token at jwt.io and verify `exp` is in future
2. Check RLS policies use `auth.uid()` correctly
3. Verify GRANT statements were executed

### Different User ID in Token vs Query

**Possible causes:**
1. Using stale userId prop instead of session.user.id
2. Multiple browser tabs with different sessions

**Solution:**
Always use `session.user.id` from the session check, not the userId prop:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data } = await supabase
  .from('tenant_members')
  .select('*')
  .eq('user_id', session.user.id); // ✅ Use session.user.id
```

## Expected Request/Response Flow

### Successful Request:
```
Request URL: https://jcancfbszzfuyxwnvxhf.supabase.co/rest/v1/tenant_members?user_id=eq.abc123&select=tenant_id,role,tenants!inner(id,name)
Request Method: GET
Status Code: 200 OK

Request Headers:
  Authorization: Bearer eyJ... (user token)
  apikey: eyJ... (anon key)

Response:
[
  {
    "tenant_id": "tenant-123",
    "role": "admin",
    "tenants": {
      "id": "tenant-123",
      "name": "My Organization"
    }
  }
]
```

### Failed Request (No Auth):
```
Request URL: https://jcancfbszzfuyxwnvxhf.supabase.co/rest/v1/tenant_members?user_id=eq.abc123
Request Method: GET
Status Code: 401 Unauthorized

Request Headers:
  apikey: eyJ... (anon key only, no Authorization)

Response:
{
  "code": "PGRST301",
  "details": null,
  "hint": null,
  "message": "JWT expired"
}
```

## Summary Checklist

Before considering the implementation complete, verify:

- [x] No direct `fetch()` calls to `/rest/v1/tenant_members`
- [x] All queries use `supabase.from('tenant_members').select()`
- [x] Session check runs before queries (`await supabase.auth.getSession()`)
- [x] Early return if session is null or missing access_token
- [x] Queries use `session.user.id` not userId prop
- [x] Network tab shows `Authorization: Bearer` header
- [x] Network tab shows `apikey` header
- [x] Authorization token is different from apikey
- [x] JWT decode shows `role: "authenticated"`
- [x] Console logs show session verification
- [x] Requests return 200 OK (or appropriate error if RLS not set up)
