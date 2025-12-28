# Edge Function Deployment Guide

## Issue Fixed
The signup endpoint was returning 401 Unauthorized because JWT verification was blocking public routes.

## Solution Implemented

### 1. Router Configuration (`/supabase/functions/signals/index.ts`)
- ✅ **PUBLIC routes** are checked FIRST before any authentication middleware
- ✅ Routes explicitly marked as public:
  - `POST /auth/signup` - User registration (NO JWT required)
  - `POST /auth/recover` - Password recovery (NO JWT required)
  - `POST /auth/resend` - Resend confirmation (NO JWT required)
- ✅ `requireAuth()` is NOT called for public routes
- ✅ Added detailed logging for debugging

### 2. Supabase Configuration (`/supabase/config.toml`)
```toml
[functions.signals]
verify_jwt = false  # Disable JWT verification for public endpoints
```

### 3. Signup Implementation
- ✅ Uses Supabase Auth Admin API with service role key (server-side only)
- ✅ Auto-confirms email (since email server is not configured)
- ✅ Creates user profile in `users` table
- ✅ Returns structured response with user data

## Deployment Steps

### For Local Development (Supabase CLI)

1. **Stop the local Supabase instance** (if running):
   ```bash
   supabase stop
   ```

2. **Start Supabase with the updated configuration**:
   ```bash
   supabase start
   ```

3. **Verify the signals function is running**:
   ```bash
   curl http://localhost:54321/functions/v1/signals/auth/signup \
     -X POST \
     -H "Content-Type: application/json" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
   ```

### For Production (Supabase Cloud)

1. **Deploy the signals Edge Function**:
   ```bash
   supabase functions deploy signals
   ```

2. **Verify deployment**:
   ```bash
   supabase functions list
   ```

3. **Test the endpoint**:
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/signals/auth/signup \
     -X POST \
     -H "Content-Type: application/json" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
   ```

## Acceptance Test

✅ **Test Case**: Signup without Authorization header
- **Method**: POST
- **URL**: `https://<project>.supabase.co/functions/v1/signals/auth/signup`
- **Headers**:
  - `Content-Type: application/json`
  - `apikey: <your-anon-key>` (NO Authorization header)
- **Body**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "securepass123",
    "full_name": "New User"
  }
  ```
- **Expected Response**: `201 Created`
  ```json
  {
    "data": {
      "user": {
        "id": "uuid-here",
        "email": "newuser@example.com",
        "full_name": "New User"
      }
    },
    "error": null,
    "request_id": "uuid-here"
  }
  ```

## Troubleshooting

### Still getting 401 Unauthorized?

1. **Check Supabase logs**:
   ```bash
   # Local
   docker logs supabase_edge_runtime_signals
   
   # Production
   supabase functions logs signals
   ```

2. **Verify environment variables**:
   ```bash
   # These should be set automatically by Supabase
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   SUPABASE_ANON_KEY
   ```

3. **Confirm JWT verification is disabled**:
   - Check `/supabase/config.toml` for `[functions.signals]` section
   - Ensure `verify_jwt = false` is set
   - Restart/redeploy after any config changes

4. **Check request path**:
   - The Edge Function logs show: `[request_id] POST /signals/auth/signup`
   - Confirm your frontend is calling the correct URL

5. **Verify CORS headers**:
   - All responses include CORS headers from `/supabase/functions/_shared/response.ts`
   - OPTIONS preflight requests are handled

## Route Structure

### PUBLIC Routes (No Auth)
```
POST /signals/auth/signup   → handleSignup()
POST /signals/auth/recover  → (not implemented)
POST /signals/auth/resend   → (not implemented)
```

### AUTHENTICATED Routes (Requires JWT)
```
GET  /signals              → handleList()      (requires JWT)
POST /signals              → handleCreate()    (requires JWT)
POST /signals/batch        → handleBatchCreate() (requires JWT)
```

## Security Notes

- ⚠️ The service role key is used ONLY server-side in Edge Functions
- ⚠️ The service role key is NEVER exposed to the frontend
- ✅ Public routes use the Admin API to create users securely
- ✅ Authenticated routes still use `requireAuth()` middleware
- ✅ All database operations respect RLS policies when using appropriate clients

## Next Steps

After successful signup:
1. User can sign in using the frontend login form
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase returns a JWT token
4. Frontend includes JWT in subsequent API calls: `Authorization: Bearer <token>`
5. Protected routes verify the JWT and extract user context
