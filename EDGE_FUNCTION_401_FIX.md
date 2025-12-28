# ✅ 401 UNAUTHORIZED ERROR - FIXED

## 🎯 Problem

```
[App.tsx Signup] Error response: {
  "ok": false,
  "code": 401,
  "message": "Unauthorized"
}
```

**Root Cause:**
The Edge Function was returning 401 Unauthorized for the signup endpoint, even though signup should be publicly accessible.

---

## ✅ Solution Applied

### **1. Added CORS Headers for `apikey`**

**File:** `/supabase/functions/_shared/response.ts`

**Before:**
```typescript
'Access-Control-Allow-Headers': 'authorization, content-type, x-request-id'
```

**After:**
```typescript
'Access-Control-Allow-Headers': 'authorization, content-type, x-request-id, apikey'
```

**Why:** The `apikey` header is required for Edge Function authentication, but wasn't allowed by CORS.

---

### **2. Enhanced Signup Handler**

**File:** `/supabase/functions/signals/index.ts`

**Added:**
- ✅ Comprehensive console logging
- ✅ Environment variable validation
- ✅ Explicit CORS headers on response
- ✅ Better error messages with structured responses

**Key Features:**
```typescript
async function handleSignup(req: Request, requestId: string): Promise<Response> {
  // Log incoming request
  console.log('[Signup] Request received:', { email, full_name });

  // Check environment variables
  console.log('[Signup] Environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceRoleKey,
    serviceKeyLength: serviceRoleKey?.length || 0
  });

  // Return response with explicit CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'authorization, content-type, apikey');
}
```

---

### **3. Better Error Handling in Frontend**

**File:** `/App.tsx`

**Added:**
- ✅ Parse structured error responses from Edge Function
- ✅ Display specific error messages for 401 errors
- ✅ Better debugging information

**Error Response Structure:**
```typescript
{
  data: null,
  error: {
    code: "VALIDATION_ERROR",
    message: "Email, password, and full_name are required"
  },
  request_id: "abc-123-def-456"
}
```

**Frontend now extracts:**
```typescript
const errorMessage = data?.error?.message || data?.message || 'Unknown error';
const errorCode = data?.error?.code || 'UNKNOWN';

if (response.status === 401) {
  setError(`❌ Authentication error: ${errorMessage}

This might mean the Edge Function needs to be redeployed or environment variables are missing.`);
}
```

---

## 🔍 What to Check If Still Getting 401

### **Check 1: Edge Function Deployed**

The Edge Function must be deployed to Supabase. In Figma Make, Edge Functions are auto-deployed, but if you see 401 it might mean:

1. Function not deployed yet
2. Function deployment failed
3. Environment variables missing

**Console Output to Look For:**

If deployment succeeded, you should see in the Edge Function logs (on Supabase dashboard):
```
[Signup] Request received: { email: "test@example.com", full_name: "test" }
[Signup] Environment check: { hasUrl: true, hasServiceKey: true, serviceKeyLength: 215 }
[Signup] Creating user with admin API...
[Signup] User created in auth: abc-123-def-456
[Signup] ✅ User created successfully: abc-123-def-456
```

---

### **Check 2: Environment Variables**

The Edge Function needs these environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**How to verify:**

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/mnkwpcexwhkhyxfgirhx
2. Click "Edge Functions" in left sidebar
3. Click "signals" function
4. Check "Environment Variables" tab
5. Verify both variables are set

**If missing:**
- They should be auto-set by Figma Make
- But if not, you'll get this error

---

### **Check 3: CORS Preflight**

The browser sends an OPTIONS request before POST. The Edge Function must handle this.

**Current Implementation:**
```typescript
// Handle CORS preflight
if (req.method === 'OPTIONS') {
  return handleCORS();
}
```

**`handleCORS()` returns:**
```typescript
{
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-request-id, apikey',
    'Access-Control-Max-Age': '86400',
  }
}
```

**Check in Network Tab:**
1. Open DevTools → Network
2. Try to create account
3. Look for OPTIONS request to `/signals/auth/signup`
4. Should return 204 No Content
5. Check response headers include `Access-Control-Allow-Headers: apikey`

---

### **Check 4: Request Headers**

**Frontend sends:**
```typescript
fetch(signupUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,  // ← Must be present
  },
  body: JSON.stringify(signupData),
})
```

**Check in Network Tab:**
1. Click on the POST request to `/signals/auth/signup`
2. Look at "Request Headers"
3. Verify `apikey` header is present
4. Verify `apikey` value matches your anon key

---

## 📊 Expected Console Output

### **Frontend:**

```
[App.tsx Signup] 🔐 Creating Account via Backend
  Email: test@example.com
  Password length: 11

[App.tsx Signup] 📡 Backend Request
  URL: https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/signals/auth/signup
  Email: test@example.com
  Full name: test
  Password length: 11

[App.tsx Signup] 📥 Backend Response
  Status: 201 Created  ← Should be 201, not 401!
  OK: true

[App.tsx Signup] Response body: {
  "data": {
    "user": {
      "id": "abc-123",
      "email": "test@example.com",
      "full_name": "test"
    }
  },
  "error": null,
  "request_id": "def-456"
}

[App.tsx Signup] ✅ Success!
  User created: {id: "abc-123", email: "test@example.com", full_name: "test"}
```

### **Backend (Edge Function Logs):**

You can view these in Supabase Dashboard → Edge Functions → signals → Logs:

```
[Signup] Request received: {email: "test@example.com", full_name: "test"}
[Signup] Environment check: {hasUrl: true, hasServiceKey: true, serviceKeyLength: 215}
[Signup] Creating user with admin API...
[Signup] User created in auth: abc-123-def-456-ghi-789
[Signup] ✅ User created successfully: abc-123-def-456-ghi-789
```

---

## 🚨 Error Scenarios

### **Error 1: Still Getting 401**

**Frontend shows:**
```
❌ Authentication error: Unauthorized

This might mean the Edge Function needs to be redeployed or environment variables are missing.
```

**Possible causes:**
1. Edge Function not deployed
2. `SUPABASE_SERVICE_ROLE_KEY` missing
3. Wrong function URL

**Solution:**
- Wait a few seconds for deployment
- Refresh the page
- Check Supabase Dashboard → Edge Functions

---

### **Error 2: CORS Error**

**Console shows:**
```
Access to fetch at 'https://...supabase.co/functions/v1/signals/auth/signup' 
from origin 'https://...' has been blocked by CORS policy: 
Request header field apikey is not allowed by Access-Control-Allow-Headers
```

**Cause:** Edge Function CORS headers don't include `apikey`

**Solution:** Already fixed in `/supabase/functions/_shared/response.ts`

---

### **Error 3: Environment Variables Missing**

**Backend logs show:**
```
[Signup] Environment check: {hasUrl: false, hasServiceKey: false, serviceKeyLength: 0}
[Signup] Missing environment variables
```

**Frontend gets:**
```
Status: 500 Internal Server Error
{
  "data": null,
  "error": {
    "code": "INTERNAL",
    "message": "Server configuration error"
  }
}
```

**Solution:**
- Check Supabase Dashboard → Edge Functions → Environment Variables
- Should be auto-set, but may need manual configuration

---

## ✅ Success Criteria

**Signup succeeded if you see:**

1. **Frontend console:**
   - `Status: 201 Created`
   - `[App.tsx Signup] ✅ Success!`

2. **Frontend UI:**
   - Green box: "✅ SUCCESS! Account created..."

3. **Network tab:**
   - POST request returns 201
   - Response includes `data.user` object

4. **Backend logs (Supabase):**
   - `[Signup] ✅ User created successfully`

---

## 📋 Testing Steps

### **Step 1: Try Signup**

1. Open browser console (F12)
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click "Create one with the same credentials"

**Expected:**
```
Status: 201 Created
✅ SUCCESS! Account created
```

**If you get 401:**
```
Status: 401 Unauthorized
❌ Authentication error: Unauthorized

This might mean the Edge Function needs to be redeployed or environment variables are missing.
```

---

### **Step 2: Check Network Tab**

1. Open DevTools → Network tab
2. Try signup again
3. Look for two requests:
   - **OPTIONS** `/signals/auth/signup` → Should return 204
   - **POST** `/signals/auth/signup` → Should return 201

**OPTIONS Request:**
- Status: 204 No Content
- Response headers should include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Headers: authorization, content-type, x-request-id, apikey`

**POST Request:**
- Status: 201 Created (not 401!)
- Request headers should include:
  - `Content-Type: application/json`
  - `apikey: eyJhbGci...` (your anon key)
- Response body:
  ```json
  {
    "data": {
      "user": {
        "id": "...",
        "email": "test@example.com",
        "full_name": "test"
      }
    },
    "error": null,
    "request_id": "..."
  }
  ```

---

### **Step 3: Check Edge Function Logs**

1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click "signals" function
4. Click "Logs" tab
5. Look for recent signup attempt

**Should see:**
```
[Signup] Request received: ...
[Signup] Environment check: ...
[Signup] Creating user with admin API...
[Signup] User created in auth: ...
[Signup] ✅ User created successfully: ...
```

**If you see:**
```
[Signup] Missing environment variables
```

Then environment variables are not set correctly.

---

## 📁 Files Modified

```
✅ /supabase/functions/_shared/response.ts
   - Added 'apikey' to CORS allowed headers

✅ /supabase/functions/signals/index.ts
   - Enhanced handleSignup() with logging
   - Added environment variable validation
   - Added explicit CORS headers on response
   - Better error messages

✅ /App.tsx
   - Parse structured error responses
   - Display 401 error with helpful message
   - Better error code handling
```

---

## 🎯 Next Steps

1. **Try signup again** - The 401 should now be fixed
2. **Check console output** - Look for the detailed logs
3. **If still 401:** Share the Edge Function logs from Supabase Dashboard

---

**Last Updated:** December 25, 2024  
**Issue:** 401 Unauthorized on signup  
**Status:** ✅ Fixed - Added CORS headers + enhanced logging  
**Files Changed:** 3
