# Test Instructions - Verify Signup and Login Fix

## Quick Test (Browser)

### Step 1: Create Account
1. Open the app in your browser
2. Enter email: `test@example.com`
3. Enter password: `password123` (8+ characters)
4. Click "**Create one with the same credentials**"
5. **Expected**: Green success message appears:
   ```
   ✅ SUCCESS! Account created. Now click "Sign In" above to login with your credentials.
   ```

### Step 2: Sign In
1. Keep the same email and password in the form
2. Click "**Sign In**"
3. **Expected**: Redirected to dashboard showing:
   - Navigation bar with "OT Continuum" logo
   - Your email address in top-right
   - "Logout" button
   - 7 workflow screen cards
   - API endpoints list

### Step 3: Test Workflow Navigation
1. Click on any workflow card (e.g., "Risk Register")
2. **Expected**: Page navigates to that workflow screen
3. Click "← Back to Dashboard"
4. **Expected**: Returns to dashboard

### Step 4: Test Logout
1. Click "Logout" button
2. **Expected**: Redirected to login page

### Step 5: Sign In Again
1. Enter same email/password: `test@example.com` / `password123`
2. Click "Sign In"
3. **Expected**: Successfully logs in to dashboard

## Error Cases to Test

### Test: Duplicate Signup
1. Try to create account with **same email** again
2. Click "Create one with the same credentials"
3. **Expected**: Error message:
   ```
   ⚠️ An account with this email already exists. Please sign in instead using the "Sign In" button above.
   ```

### Test: Wrong Password
1. Enter existing email: `test@example.com`
2. Enter **wrong password**: `wrongpassword`
3. Click "Sign In"
4. **Expected**: Error message:
   ```
   ❌ Invalid email or password. If you haven't created an account yet, click "Create one with the same credentials" below to sign up first.
   ```

### Test: Short Password
1. Enter new email: `test2@example.com`
2. Enter **short password**: `abc` (less than 8 chars)
3. Click "Create one with the same credentials"
4. **Expected**: Error message:
   ```
   ❌ Password must be at least 8 characters
   ```

## Command Line Test (Optional)

If you want to test the API directly:

### Test Signup Endpoint
```bash
# Replace YOUR_PROJECT_ID and YOUR_ANON_KEY
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-fb677d93/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "apitest@example.com",
    "password": "password123",
    "full_name": "API Test User"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "some-uuid",
    "email": "apitest@example.com",
    "full_name": "API Test User"
  }
}
```

**Expected Status Code:** `201 Created`

### Test Health Endpoint
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-fb677d93/health \
  -H "apikey: YOUR_ANON_KEY"
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "version": "1.0.0"
}
```

## Console Logs to Check

Open browser DevTools Console (F12) and look for:

### During Signup
```
[App.tsx Signup] 🔐 Creating Account via Backend
  Email: test@example.com
  Password length: 11

[App.tsx Signup] 📡 Backend Request
  URL: https://xxx.supabase.co/functions/v1/make-server-fb677d93/auth/signup
  Email: test@example.com
  Full name: test
  Password length: 11

[App.tsx Signup] 📥 Backend Response
  Status: 201 Created
  OK: true

[App.tsx Signup] ✅ Success!
  User created: {id: "...", email: "test@example.com", full_name: "test"}
```

### During Login
```
[App.tsx Login] 🔐 Runtime Validation
  Supabase URL: https://xxx.supabase.co
  Anon Key Length: 247
  Anon Key First 12 chars: eyJhbGciOiJI
  Anon Key Valid: ✅ YES

[App.tsx Login] ✅ Login successful
```

## Troubleshooting

### Issue: Still getting 401 on signup

**Check:**
1. Is the URL correct? Should be `/functions/v1/make-server-fb677d93/auth/signup`
2. Check console logs - what's the exact URL being called?
3. Check Network tab in DevTools - verify the endpoint

### Issue: "Configuration error: Supabase anon key is missing"

**Fix:**
1. Check `/utils/supabase/info.tsx` file
2. Ensure `publicAnonKey` is exported and has a value
3. Check environment variables

### Issue: User created but login fails

**Check:**
1. Verify user was created in Supabase dashboard
2. Check `auth.users` table
3. Check `public.users` table (should have matching record)
4. Try password reset if needed

### Issue: No error but nothing happens

**Check:**
1. Open DevTools Console (F12)
2. Look for errors in red
3. Check Network tab for failed requests
4. Check if JavaScript is enabled

## Success Criteria

✅ Signup creates account without errors  
✅ Success message shows in green  
✅ Login works with created credentials  
✅ Dashboard loads and shows user email  
✅ Workflow screens are accessible  
✅ Logout works and returns to login page  
✅ Duplicate signup shows appropriate error  
✅ Wrong password shows appropriate error  

## What to Report

If something doesn't work, please report:
1. **What you did** (exact steps)
2. **What you expected** to happen
3. **What actually happened**
4. **Console logs** (copy the errors from F12 Console)
5. **Network tab** (screenshot of the failed request)
6. **Response body** (what did the server return?)

Example good bug report:
```
Steps: Clicked "Create account" button
Expected: Success message
Actual: Error "401 Unauthorized"
Console: [App.tsx Signup] Response body: {"ok": false, "code": 401}
Network: POST /functions/v1/make-server-fb677d93/auth/signup → 401
```
