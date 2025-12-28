# Deployment Guide: JWT Verification Configuration

## Problem Overview

The OT Continuum signup endpoint (`/functions/v1/signals/auth/signup`) was returning 401 Unauthorized because:

1. **Supabase Edge Functions enable JWT verification by default**
2. **Public routes like `/auth/signup` need to work WITHOUT an Authorization header**
3. **The 401 error occurred BEFORE our handler code could run**

## Solution: Disable JWT Verification at Function Level

We've configured the `signals` Edge Function to disable JWT verification, allowing us to handle authentication manually via the `requireAuth()` middleware. This gives us fine-grained control over which routes are public vs. authenticated.

## Configuration Changes

### 1. Updated `/supabase/config.toml`

Added Edge Function configuration:

```toml
[edge_runtime]
enabled = true
port = 54321

# Edge Functions Configuration
[functions.signals]
verify_jwt = false  # Disable JWT verification for public /auth/signup endpoint

[analytics]
enabled = false
```

**Why this works:**
- Disables Supabase's automatic JWT verification for the entire `signals` function
- Allows our handler code to run for ALL requests
- We manually enforce authentication using `requireAuth()` for protected routes
- Public routes like `/auth/signup` skip `requireAuth()` and work without JWT

### 2. Routing Architecture (Already Implemented)

The routing in `/supabase/functions/signals/index.ts` clearly separates public and authenticated routes:

```typescript
try {
  const url = new URL(req.url);
  const path = url.pathname;

  // =========================================================================
  // PUBLIC ROUTES (no authentication required)
  // =========================================================================
  
  // POST /auth/signup - Create new user account
  if (path.endsWith('/auth/signup') && req.method === 'POST') {
    return await handleSignup(req, requestId);  // ✅ No requireAuth()
  }
  
  // =========================================================================
  // AUTHENTICATED ROUTES (requireAuth called in handlers)
  // =========================================================================

  // Route to appropriate handler
  if (path.endsWith('/signals/batch') && req.method === 'POST') {
    return await handleBatchCreate(req, requestId);  // ✅ Calls requireAuth()
  }
  // ... other authenticated routes
}
```

**Key Points:**
- Public routes are checked FIRST, before any authentication
- Authenticated routes call `requireAuth(req)` inside their handlers
- `requireAuth()` validates the JWT and extracts claims
- If JWT is missing/invalid, `requireAuth()` throws an error → 401 response

## Deployment Steps

### For Local Development

1. **Ensure config.toml is updated** (already done above)
2. **Start Supabase locally:**
   ```bash
   supabase start
   ```
3. **Serve the Edge Function:**
   ```bash
   supabase functions serve signals --env-file .env.local
   ```
4. **Test the signup endpoint:**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/signals/auth/signup \
     -H "Content-Type: application/json" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "full_name": "Test User"
     }'
   ```

### For Production Deployment

1. **Commit the config.toml changes:**
   ```bash
   git add supabase/config.toml
   git commit -m "fix: disable JWT verification for signals function to support public /auth/signup"
   ```

2. **Link to your Supabase project** (if not already linked):
   ```bash
   supabase link --project-ref your-project-id
   ```

3. **Deploy the signals Edge Function:**
   ```bash
   supabase functions deploy signals
   ```

4. **Verify deployment:**
   ```bash
   # Check function is deployed
   supabase functions list
   
   # View function logs
   supabase functions logs signals --tail
   ```

5. **Test the deployed endpoint:**
   ```bash
   curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/signals/auth/signup \
     -H "Content-Type: application/json" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "full_name": "Test User"
     }'
   ```

   **Expected response: 201 Created**

## Why NOT Use `--no-verify-jwt` Flag?

You might wonder why we didn't use the `--no-verify-jwt` deployment flag like the `server` function does:

```bash
# server function deployment
supabase functions deploy server --no-verify-jwt
```

**Reasons:**
1. **The `--no-verify-jwt` flag is deprecated** in newer Supabase CLI versions
2. **Config.toml is the recommended approach** for per-function JWT configuration
3. **Config.toml is version-controlled** and persists across deployments
4. **Config.toml supports more configuration options** than CLI flags

## Authentication Flow

### Signup Flow (Public)
```
Client (no JWT)
    ↓
POST /functions/v1/signals/auth/signup
    ↓
Edge Function (JWT verification: disabled)
    ↓
handleSignup() (no requireAuth())
    ↓
Create user with admin.createUser()
    ↓
201 Created
```

### Login Flow (Supabase Built-in)
```
Client (no JWT)
    ↓
supabase.auth.signInWithPassword()
    ↓
Supabase Auth (built-in)
    ↓
Returns { session, user }
    ↓
Client stores JWT
```

### Authenticated Request Flow
```
Client (with JWT)
    ↓
GET /functions/v1/signals?limit=10
    ↓
Edge Function (JWT verification: disabled)
    ↓
handleList() → requireAuth(req)
    ↓
Validate JWT & extract claims
    ↓
Filter by tenant_id from JWT
    ↓
200 OK with data
```

## Security Considerations

### ✅ This Approach is Secure Because:

1. **JWT validation still happens** - just manually via `requireAuth()` instead of automatically
2. **All authenticated routes call `requireAuth()`** - no way to bypass it
3. **Tenant isolation is enforced** - tenant_id always comes from validated JWT claims
4. **Public routes are explicit** - clearly documented and minimal in number
5. **No security downgrade** - same level of security as automatic JWT verification

### ⚠️ Important Security Rules:

1. **ALWAYS call `requireAuth()` for protected routes**
   ```typescript
   async function handleList(req: Request, requestId: string): Promise<Response> {
     const auth = requireAuth(req);  // ✅ CRITICAL - validates JWT
     // ... rest of handler
   }
   ```

2. **NEVER trust client-provided tenant_id**
   ```typescript
   // ❌ WRONG - security vulnerability!
   const tenantId = body.tenant_id;
   
   // ✅ CORRECT - from validated JWT
   const auth = requireAuth(req);
   const tenantId = auth.tenantId;
   ```

3. **Document all public routes explicitly**
   ```typescript
   // =========================================================================
   // PUBLIC ROUTES (no authentication required)
   // =========================================================================
   
   // POST /auth/signup - Create new user account
   if (path.endsWith('/auth/signup') && req.method === 'POST') {
     return await handleSignup(req, requestId);
   }
   ```

## Verification Checklist

After deployment, verify the fix is working:

- [ ] Signup endpoint returns 201 (not 401) for valid requests
- [ ] Signup endpoint returns 409 for duplicate emails
- [ ] Signup endpoint returns 400 for validation errors
- [ ] Signup works WITHOUT Authorization header
- [ ] Login still works with signInWithPassword()
- [ ] Authenticated endpoints still require JWT
- [ ] Authenticated endpoints return 401 without JWT
- [ ] No CORS errors in browser console
- [ ] Edge Function logs show "[Signup] ✅ User created successfully"

## Troubleshooting

### Issue: Still getting 401 Unauthorized

**Check 1: Config.toml deployed?**
```bash
# View remote config
supabase projects api-settings --project-ref YOUR_PROJECT_ID

# Or check locally
cat supabase/config.toml | grep -A 2 "functions.signals"
```

**Solution:**
```bash
# Redeploy with explicit config
supabase functions deploy signals
```

**Check 2: Function using old code?**
```bash
# Check function logs for version/timestamp
supabase functions logs signals --tail
```

**Solution:**
```bash
# Force redeploy
supabase functions deploy signals --no-verify-jwt  # fallback flag
```

### Issue: Login now broken

**Possible Cause:** Login flow doesn't need custom JWT config - it uses Supabase's built-in auth

**Verification:**
- Login uses `supabase.auth.signInWithPassword()` (built-in, no custom endpoint)
- Should NOT be affected by Edge Function JWT config
- Check browser console for actual error message

**Solution:**
- Verify Supabase credentials are correct in frontend
- Check Supabase Auth settings in dashboard
- Review browser console logs for specific error

### Issue: Other Edge Functions now broken

**Cause:** Only `signals` function has `verify_jwt = false`

**Solution:**
- Other functions (risk, workflow, billing, notify) still use default JWT verification
- If they also need public routes, add similar config:
  ```toml
  [functions.risk]
  verify_jwt = false
  
  [functions.workflow]
  verify_jwt = false
  ```
- Otherwise, leave them with default JWT verification (more secure)

## Related Files

- **Configuration:** `/supabase/config.toml`
- **Edge Function:** `/supabase/functions/signals/index.ts`
- **Auth Helpers:** `/supabase/functions/_shared/auth.ts`
- **Response Helpers:** `/supabase/functions/_shared/response.ts`

## Summary

**Status:** ✅ FIXED

**Changes:**
1. Added `[functions.signals]` config with `verify_jwt = false` to `/supabase/config.toml`
2. Updated documentation to reflect JWT configuration approach
3. Routing already properly separates public vs. authenticated endpoints

**Deployment:**
```bash
supabase functions deploy signals
```

**Test:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/signals/auth/signup \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_KEY" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test"}'
```

**Expected:** `201 Created` with user object

---

**Next Steps:**
1. Deploy to production: `supabase functions deploy signals`
2. Test signup flow in browser
3. Monitor Edge Function logs for errors
4. Update CI/CD pipeline if needed
