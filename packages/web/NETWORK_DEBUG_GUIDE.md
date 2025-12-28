# 🔍 Network Debug Guide - Supabase Auth

## ✅ What You Should See in Network Tab

When you click "Sign In" on the login page, this is what should appear in Chrome DevTools Network tab:

---

## 📡 Expected Request

### **Request URL:**
```
POST https://mnkwpcexwhkhyxfgirhx.supabase.co/auth/v1/token?grant_type=password
```

### **Request Headers (MUST HAVE):**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua3dwY2V4d2hraHl4Zmdpcmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NTU5NjksImV4cCI6MjA4MjAzMTk2OX0.CPRwlfCXWgwYqdYpsksoE6U9SiQyNMVvN7fWzGVCwoM
Content-Type: application/json
```

**⚠️ CRITICAL:** The `apikey` header MUST be present!

### **Request Payload (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Rules:**
- ✅ MUST be JSON (not form-encoded)
- ✅ ONLY these 2 fields
- ❌ NO `gotrue_meta_security`
- ❌ NO extra fields
- ✅ Email should be lowercase and trimmed
- ✅ Password should be trimmed

---

## ✅ Expected Response (Success)

### **Status:** `200 OK`

### **Response Body:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1735225200,
  "refresh_token": "v1.MRjclaG4xdXlOHO...",
  "user": {
    "id": "abc123-def456-...",
    "email": "user@example.com",
    "email_confirmed_at": "2024-12-25T12:00:00Z",
    ...
  }
}
```

---

## ❌ Common Error Responses

### **Error 1: 400 Bad Request - Email Not Confirmed**

**Response Body:**
```json
{
  "error": "Email not confirmed",
  "error_description": "Email not confirmed"
}
```

**What This Means:**
- User exists but hasn't verified their email
- App should auto-route to `/verify-email`

**Expected Behavior:**
- ONE request with 400
- Console: "[Login] Email not verified - routing to verify email screen"
- Navigate to verify screen
- NO repeated requests

---

### **Error 2: 400 Bad Request - Invalid Credentials**

**Response Body:**
```json
{
  "error": "invalid_grant",
  "error_description": "Invalid login credentials"
}
```

**What This Means:**
- Wrong email or password
- Email doesn't exist in system

**Expected Behavior:**
- Show error: "Incorrect email or password. Please try again."

---

### **Error 3: 400 Bad Request - Missing apikey Header**

**Response Body:**
```json
{
  "code": "PGRST301",
  "details": null,
  "hint": null,
  "message": "JWT secret is missing"
}
```

**What This Means:**
- `apikey` header is NOT being sent
- This is the issue you're experiencing!

**How to Fix:**
✅ The official Supabase client SHOULD automatically add this header  
✅ Check `/lib/supabase-client.ts` is using `createClient(url, anonKey)`  
✅ Verify `publicAnonKey` in `/utils/supabase/info.tsx` is not empty

---

### **Error 4: 422 Unprocessable Entity**

**Response Body:**
```json
{
  "error": "invalid_request",
  "error_description": "email or password is required"
}
```

**What This Means:**
- Email or password is empty/missing
- Request body is malformed

---

## 🔍 How to Debug in Chrome DevTools

### **Step 1: Open DevTools**
1. Press `F12` or `Ctrl+Shift+I`
2. Go to **Network** tab
3. Ensure "Preserve log" is checked

### **Step 2: Filter for Auth Requests**
1. In the filter box, type: `token`
2. Or filter by: `XHR` or `Fetch`

### **Step 3: Attempt Login**
1. Enter email/password
2. Click "Sign In"
3. Look for request: `token?grant_type=password`

### **Step 4: Inspect Request**
Click on the request → Check these tabs:

#### **Headers Tab:**
```
Request URL: https://mnkwpcexwhkhyxfgirhx.supabase.co/auth/v1/token?grant_type=password
Request Method: POST
Status Code: 200 (or 400)

Request Headers:
  apikey: eyJhbGci... ← MUST BE PRESENT
  Content-Type: application/json
```

#### **Payload Tab:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Check:**
- [ ] Only 2 fields
- [ ] No `gotrue_meta_security`
- [ ] Email is lowercase
- [ ] Password is trimmed

#### **Response Tab:**
```json
{
  "access_token": "...",
  "user": {...}
}
```

---

## 🐛 Common Issues & Fixes

### **Issue: apikey header is missing**

**Symptoms:**
- Network tab shows NO `apikey` header
- Response: "JWT secret is missing"

**Diagnosis:**
```javascript
// Check in browser console:
import { supabase } from './lib/api-client';
console.log('Supabase Key:', supabase.supabaseKey);
```

**Fix:**
1. Verify `/lib/supabase-client.ts` uses:
   ```typescript
   createClient(supabaseUrl, publicAnonKey)
   ```
2. Verify `/utils/supabase/info.tsx` has `publicAnonKey` value
3. Check it's not empty or undefined

---

### **Issue: Request body is form-encoded**

**Symptoms:**
- Headers show: `Content-Type: application/x-www-form-urlencoded`
- Payload looks like: `email=user%40example.com&password=...`

**Fix:**
✅ We're using official Supabase client - this should NEVER happen  
❌ If you see this, there's a custom fetch call somewhere

---

### **Issue: Extra fields in request body**

**Symptoms:**
- Payload has `gotrue_meta_security`
- Payload has other fields

**Fix:**
✅ Official Supabase client only sends email + password  
❌ If you see extra fields, check for middleware or custom fetch

---

### **Issue: Different Supabase URL**

**Symptoms:**
- Request goes to different project
- URL shows: `https://DIFFERENT_PROJECT.supabase.co`

**Fix:**
1. Check debug info at bottom of login screen
2. Should show: `mnkwpcexwhkhyxfgirhx.supabase.co`
3. Verify `/utils/supabase/info.tsx` has correct `projectId`

---

## ✅ Acceptance Test Checklist

Run through this checklist to verify login is working:

- [ ] **Network Tab shows request to:**
  ```
  POST https://mnkwpcexwhkhyxfgirhx.supabase.co/auth/v1/token?grant_type=password
  ```

- [ ] **Request Headers include:**
  - `apikey: eyJhbGci...` (long JWT string)
  - `Content-Type: application/json`

- [ ] **Request Payload is JSON:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- [ ] **NO extra fields in payload:**
  - NO `gotrue_meta_security`
  - NO other fields

- [ ] **For verified user:**
  - Response Status: `200 OK`
  - Response includes: `access_token`, `user`
  - Console: "[Login] ✅ Login Successful"
  - Navigates to: `/tenant-resolver`

- [ ] **For unverified user:**
  - Response Status: `400 Bad Request`
  - Response: `"Email not confirmed"`
  - Console: "[Login] ⚠️ Email not verified"
  - Navigates to: `/verify-email`
  - NO repeated requests

- [ ] **For wrong password:**
  - Response Status: `400 Bad Request`
  - Response: `"Invalid login credentials"`
  - Error shown: "Incorrect email or password"
  - Stays on `/login`

---

## 📊 Console Logs to Check

### **Successful Login:**
```
[Login] 🔐 Sign In Attempt
  Email (normalized): user@example.com
  Password length: 12
  Supabase URL: https://mnkwpcexwhkhyxfgirhx.supabase.co
  Anon Key (preview): eyJhbGciOiJIUzI1NiIsInR5cCI6...
  Using method: supabase.auth.signInWithPassword()

[Login] ✅ Login Successful
  Session: {...}
  User ID: abc123...
  User Email: user@example.com
  Access Token (preview): eyJhbGci...
  Navigating to: /tenant-resolver
```

### **Unverified Email:**
```
[Login] 🔐 Sign In Attempt
  ...

[Login] ❌ Sign-in Error
  Error Message: Email not confirmed
  Error Status: 400
  Error Name: AuthApiError
  Full Error: {...}

[Login] ⚠️ Email not verified - routing to verify email screen
```

### **Wrong Password:**
```
[Login] 🔐 Sign In Attempt
  ...

[Login] ❌ Sign-in Error
  Error Message: Invalid login credentials
  Error Status: 400
  Error Name: AuthApiError
  Full Error: {...}
```

---

## 🆘 If apikey Header Is Still Missing

### **Nuclear Option: Verify Supabase Client**

Open browser console and run:
```javascript
// Import the client
import { supabase } from './packages/web/src/lib/api-client';

// Check configuration
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key:', supabase.supabaseKey);

// Manually test login
const result = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpass123'
});
console.log('Result:', result);
```

**Expected Output:**
```
Supabase URL: https://mnkwpcexwhkhyxfgirhx.supabase.co
Supabase Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Result: { data: {...}, error: null } or { data: null, error: {...} }
```

**Check Network Tab:**
- Should show request with `apikey` header
- If NOT, there's an issue with the Supabase client setup

---

## 🎯 Expected vs Actual Comparison

### **✅ CORRECT Request:**
```
POST https://mnkwpcexwhkhyxfgirhx.supabase.co/auth/v1/token?grant_type=password

Headers:
  apikey: eyJhbGci... ✓
  Content-Type: application/json ✓

Payload:
  {
    "email": "user@example.com",
    "password": "password123"
  } ✓
```

### **❌ INCORRECT Request (Missing apikey):**
```
POST https://mnkwpcexwhkhyxfgirhx.supabase.co/auth/v1/token?grant_type=password

Headers:
  Content-Type: application/json ✓
  (apikey header missing!) ✗

Response: 400 "JWT secret is missing"
```

### **❌ INCORRECT Request (Form-encoded):**
```
POST https://mnkwpcexwhkhyxfgirhx.supabase.co/auth/v1/token?grant_type=password

Headers:
  Content-Type: application/x-www-form-urlencoded ✗

Payload:
  email=user%40example.com&password=... ✗
```

### **❌ INCORRECT Request (Extra fields):**
```
Payload:
  {
    "email": "user@example.com",
    "password": "password123",
    "gotrue_meta_security": {...} ✗
  }
```

---

## 📝 Summary

**The official Supabase client (`@supabase/supabase-js`) automatically:**
- ✅ Adds `apikey` header
- ✅ Sets `Content-Type: application/json`
- ✅ Sends only email and password in JSON body
- ✅ Handles all authentication requests correctly

**If you see issues:**
1. Check Network tab for `apikey` header
2. Verify Supabase client is initialized with correct URL and key
3. Check console logs for detailed error information
4. Ensure no custom fetch calls are being made

**The fix is already in place:**
- We're using `supabase.auth.signInWithPassword()` (Option A - PREFERRED)
- No custom fetch calls
- Proper input normalization
- Comprehensive error handling

**If login is still failing:**
- Check the console logs
- Check the Network tab for the exact request/response
- Verify the user's email is confirmed in Supabase Dashboard
- Ensure the credentials are correct

---

**Last Updated:** December 25, 2024  
**Purpose:** Network debugging guide for Supabase authentication issues
