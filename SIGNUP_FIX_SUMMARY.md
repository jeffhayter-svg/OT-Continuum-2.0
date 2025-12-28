# Signup Fix Summary

## Problem
- POST `/functions/v1/signals/auth/signup` was returning **401 Unauthorized**
- Users couldn't sign up because the endpoint required JWT authentication
- But signup MUST be public because users don't have a JWT token yet (they haven't logged in)

## Root Cause
The Edge Function needed to clearly separate PUBLIC routes from AUTHENTICATED routes.

## Solution

### 1. **Reorganized Router** (`/supabase/functions/signals/index.ts`)
```typescript
// PUBLIC ROUTES are checked FIRST (no JWT required)
if (req.method === 'POST' && path.endsWith('/auth/signup')) {
  return await handleSignup(req, requestId);  // NO requireAuth() call
}

// AUTHENTICATED ROUTES come after (JWT required)
if (path.endsWith('/signals') && req.method === 'POST') {
  return await handleCreate(req, requestId);  // DOES call requireAuth()
}
```

**Key Changes:**
- ✅ Public auth routes (`/auth/signup`, `/auth/recover`, `/auth/resend`) are checked FIRST
- ✅ `requireAuth()` is NOT called for public routes
- ✅ Added logging to show which handler is being routed to
- ✅ More explicit path matching with both `endsWith()` and exact match

### 2. **Configured JWT Verification** (`/supabase/config.toml`)
```toml
[functions.signals]
verify_jwt = false  # Disable JWT verification to allow public endpoints
```

**Why this matters:**
- Supabase normally verifies JWT tokens at the infrastructure level BEFORE your code runs
- Setting `verify_jwt = false` allows requests without JWT to reach your function
- Your function code then manually checks auth for protected routes using `requireAuth()`

### 3. **Secure Signup Implementation**
The signup handler uses Supabase Auth Admin API with the service role key (server-side only):

```typescript
// Create user with admin privileges (server-side only)
const supabase = createClient(supabaseUrl, serviceRoleKey);
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,  // Auto-confirm (no email server configured)
  user_metadata: { name: full_name },
});
```

**Security notes:**
- ⚠️ Service role key is NEVER exposed to frontend
- ⚠️ Service role key is used ONLY in Edge Functions (server-side)
- ✅ Frontend only knows the anon key
- ✅ Auto-confirms email (since email server is not configured in prototype)

## Request Flow

### Signup (PUBLIC)
```
Browser → POST /functions/v1/signals/auth/signup
         Headers: Content-Type, apikey (NO Authorization)
         
Edge Function → Supabase config: verify_jwt = false ✓
              → Router: Check public routes FIRST ✓
              → handleSignup(): NO requireAuth() call ✓
              → Auth Admin API: Create user ✓
              
Response ← 201 Created with user data
```

### Create Signal (AUTHENTICATED)
```
Browser → POST /functions/v1/signals
         Headers: Content-Type, apikey, Authorization: Bearer <JWT>
         
Edge Function → Supabase config: verify_jwt = false (manual check in code)
              → Router: Check authenticated routes
              → handleCreate(): DOES call requireAuth() ✓
              → requireAuth(): Extract userId, tenantId from JWT ✓
              → Database: Insert with proper tenant_id ✓
              
Response ← 201 Created with signal data
```

## Testing

### Local Test
```bash
# Make the test script executable
chmod +x test-signup.sh

# Run against local Supabase
./test-signup.sh
```

### Production Test
```bash
# Run against production
./test-signup.sh <project-id> <anon-key>
```

### Manual Test
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/signals/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

**Expected Response (201 Created):**
```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "full_name": "Test User"
    }
  },
  "error": null,
  "request_id": "uuid-here"
}
```

## Deployment Checklist

- [ ] **Code is updated** in `/supabase/functions/signals/index.ts`
- [ ] **Config is updated** in `/supabase/config.toml` with `verify_jwt = false`
- [ ] **Local test passes**: `./test-signup.sh`
- [ ] **Deploy function**: `supabase functions deploy signals`
- [ ] **Production test passes**: `./test-signup.sh <project-id> <anon-key>`
- [ ] **Check logs**: `supabase functions logs signals`
- [ ] **Frontend test**: Try signing up from the UI

## Files Changed

| File | Change |
|------|--------|
| `/supabase/functions/signals/index.ts` | Reorganized routing, added public routes FIRST |
| `/supabase/config.toml` | Added `[functions.signals]` with `verify_jwt = false` |
| `/supabase/functions/_shared/response.ts` | Already had CORS headers (no change needed) |
| `/DEPLOYMENT_GUIDE.md` | Created deployment documentation |
| `/test-signup.sh` | Created test script |

## What's Next

After deployment and testing:
1. ✅ Users can sign up without errors
2. ✅ Users receive 201 Created response
3. ✅ User record created in `auth.users`
4. ✅ Profile record created in `public.users`
5. ✅ User can then sign in with the frontend login form
6. ✅ JWT token is issued on signin
7. ✅ Protected routes work with the JWT token

## Common Issues

### Still getting 401?
1. Check that `verify_jwt = false` is in config.toml
2. Restart local Supabase: `supabase stop && supabase start`
3. Redeploy production: `supabase functions deploy signals`
4. Check logs: `supabase functions logs signals`

### Missing environment variables?
The Edge Function needs these (auto-set by Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### User created but profile fails?
Check that the `users` table exists with columns:
- `id` (uuid, primary key)
- `email` (text)
- `full_name` (text)
