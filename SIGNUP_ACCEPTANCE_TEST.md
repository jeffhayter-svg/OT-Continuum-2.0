# Signup Acceptance Test

## Objective
Verify that calling `/functions/v1/signals/auth/signup` from the login screen succeeds (200/201) without an Authorization header.

## Prerequisites
1. OT Continuum app is deployed
2. Edge Functions are deployed to Supabase
3. You have access to the browser console
4. You know your Supabase project ID and anon key

## Test Steps

### Test 1: Successful Signup (Expected: 201 Created)

1. **Open the OT Continuum login page** in your browser
2. **Open browser DevTools** (F12 or Cmd+Option+I)
3. **Go to the Console tab**
4. **Enter credentials**:
   - Email: `newuser@example.com`
   - Password: `password123`
5. **Click "Create account"** (or the signup button)

**Expected Console Output:**
```
[App.tsx Signup] 📡 Backend Request
  URL: https://[project-id].supabase.co/functions/v1/signals/auth/signup
  Email: newuser@example.com
  Full name: newuser
  Password length: 11

[App.tsx Signup] 📥 Backend Response
  Status: 201 Created
  OK: true

[App.tsx Signup] Response body: {"data":{"user":{...}},"error":null,"request_id":"..."}

[App.tsx Signup] ✅ Success!
  User created: {...}
```

**Expected UI Behavior:**
- Success message appears: "✅ SUCCESS! Account created. Now click 'Sign In' above to login with your credentials."
- No error messages

### Test 2: Duplicate Signup (Expected: 409 Conflict)

1. **Enter the SAME credentials** from Test 1:
   - Email: `newuser@example.com`
   - Password: `password123`
2. **Click "Create account"** again

**Expected Console Output:**
```
[App.tsx Signup] 📡 Backend Request
  URL: https://[project-id].supabase.co/functions/v1/signals/auth/signup
  Email: newuser@example.com
  Full name: newuser
  Password length: 11

[App.tsx Signup] 📥 Backend Response
  Status: 409 Conflict
  OK: false

[App.tsx Signup] Response body: {"data":null,"error":{"code":"CONFLICT","message":"User with this email already exists"},"request_id":"..."}
```

**Expected UI Behavior:**
- Error message appears: "User with this email already exists" (or similar)

### Test 3: Validation Error - Short Password (Expected: 400 Bad Request)

1. **Enter credentials with short password**:
   - Email: `shortpw@example.com`
   - Password: `short`
2. **Click "Create account"**

**Expected Console Output:**
```
[App.tsx Signup] 📡 Backend Request
  URL: https://[project-id].supabase.co/functions/v1/signals/auth/signup
  Email: shortpw@example.com
  Full name: shortpw
  Password length: 5

[App.tsx Signup] 📥 Backend Response
  Status: 400 Bad Request
  OK: false

[App.tsx Signup] Response body: {"data":null,"error":{"code":"VALIDATION_ERROR","message":"Password must be at least 8 characters"},"request_id":"..."}
```

**Expected UI Behavior:**
- Error message appears: "Password must be at least 8 characters"

### Test 4: CORS Headers Present

1. **Open browser DevTools Network tab**
2. **Enter valid credentials** and click "Create account"
3. **Find the signup request** in the Network tab
4. **Click on the request** to view details
5. **Go to the Headers tab**

**Expected Request Headers:**
```
Content-Type: application/json
apikey: [anon-key]
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: authorization, content-type, x-request-id, apikey
Access-Control-Max-Age: 86400
Content-Type: application/json
```

**Important:** No Authorization header should be present in the request!

### Test 5: Login After Signup

1. **After successful signup from Test 1**
2. **Click "Sign In"** (or refresh the page)
3. **Enter the same credentials**:
   - Email: `newuser@example.com`
   - Password: `password123`
4. **Click "Sign In"**

**Expected Console Output:**
```
[App.tsx Login] 🔐 Runtime Validation
  Supabase URL: https://[project-id].supabase.co
  Anon Key Length: [number]
  Anon Key Valid: ✅ YES

[App.tsx Login] ✅ Login successful
```

**Expected UI Behavior:**
- User is logged in
- Main application dashboard appears
- User info is displayed

## Manual cURL Tests (Optional)

If you want to test the endpoint directly:

```bash
# Replace with your actual project ID and anon key
PROJECT_ID="your-project-id"
ANON_KEY="your-anon-key"

# Test 1: Successful signup
curl -v -X POST "https://${PROJECT_ID}.supabase.co/functions/v1/signals/auth/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d '{
    "email": "curltest@example.com",
    "password": "password123",
    "full_name": "Curl Test User"
  }'

# Expected: 201 Created with user object

# Test 2: Duplicate signup
curl -v -X POST "https://${PROJECT_ID}.supabase.co/functions/v1/signals/auth/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d '{
    "email": "curltest@example.com",
    "password": "password123",
    "full_name": "Curl Test User"
  }'

# Expected: 409 Conflict

# Test 3: Short password
curl -v -X POST "https://${PROJECT_ID}.supabase.co/functions/v1/signals/auth/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d '{
    "email": "shortpw@example.com",
    "password": "short",
    "full_name": "Short Password"
  }'

# Expected: 400 Bad Request

# Test 4: Missing fields
curl -v -X POST "https://${PROJECT_ID}.supabase.co/functions/v1/signals/auth/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d '{
    "email": "missing@example.com"
  }'

# Expected: 400 Bad Request - "Email, password, and full_name are required"
```

## Success Criteria

✅ All tests pass with expected status codes and messages
✅ No CORS errors appear in browser console
✅ No 401 Unauthorized errors for signup endpoint
✅ CORS headers are present in all responses
✅ No Authorization header is required for signup
✅ Users can login after successful signup

## Troubleshooting

### Issue: Still getting 401 Unauthorized
**Cause:** Edge Functions not deployed or old version cached, or JWT verification is enabled
**Solution:** 
1. Verify JWT verification is disabled in `/supabase/config.toml`:
   ```toml
   [functions.signals]
   verify_jwt = false
   ```
2. Redeploy Edge Functions: `supabase functions deploy signals`
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Clear browser cache

### Issue: CORS errors still appearing
**Cause:** Response helpers not updated or old cached response
**Solution:**
1. Verify `/supabase/functions/_shared/response.ts` has `...corsHeaders` in all response functions
2. Redeploy all Edge Functions
3. Hard refresh browser

### Issue: "Invalid login credentials" when signing in
**Cause:** Signup succeeded but password was not saved correctly
**Solution:**
1. Check Supabase Auth dashboard to verify user exists
2. Try resetting password via Supabase dashboard
3. Create a new user with different email

### Issue: Database error when creating profile
**Cause:** `users` table doesn't exist or RLS is blocking insert
**Solution:**
1. Verify `users` table exists in Supabase
2. Check RLS policies allow service role inserts
3. Review Edge Function logs in Supabase dashboard

## Edge Function Logs

To view Edge Function logs in Supabase:
1. Go to Supabase Dashboard
2. Click "Edge Functions" in left sidebar
3. Click on "signals" function
4. Click "Logs" tab
5. Look for `[Signup]` prefixed messages

**Successful signup logs:**
```
[Signup] Request received: { email: '...', full_name: '...' }
[Signup] Environment check: { hasUrl: true, hasServiceKey: true, ... }
[Signup] Creating user with admin API...
[Signup] User created in auth: [user-id]
[Signup] ✅ User created successfully: [user-id]
```

**Error logs will show:**
```
[Signup] Auth error: [error details]
[Signup] Profile creation error: [error details]
[Signup] Unexpected error: [error details]
```