# Edge Function Validation Checklist

**Purpose:** Verify Supabase Edge Function calls from Vite frontend  
**Last Updated:** 2025-12-27

---

## ✅ Pre-Flight Checks

- [ ] User is signed in (Supabase auth session exists)
- [ ] Access token is present in `useAuth()` hook
- [ ] `apiFetch()` is used (not raw `fetch`)
- [ ] Edge function route matches server definition

---

## 🔍 DevTools Network Inspection

### Request Headers (Required)
```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### How to Check
1. Open DevTools → **Network** tab
2. Click on the Edge Function request
3. Navigate to **Headers** section
4. Verify **Request Headers** contains all three above

**Common Issue:** Missing `Authorization` header = 401 Unauthorized

---

## 🔐 JWT Payload Expectations

### Decode the Access Token
Use [jwt.io](https://jwt.io) to decode the token from `Authorization: Bearer <token>`

### Expected Claims
```json
{
  "sub": "<user_id>",           // UUID format
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "iss": "https://<project>.supabase.co/auth/v1"
}
```

**Common Issue:** Expired token (`exp` claim in the past) = 401 Invalid JWT

---

## ❌ Common Failure Causes

### 401 Unauthorized
**Cause:** Missing or invalid authentication  
**Check:**
- [ ] Is user signed in?
- [ ] Is `Authorization` header present?
- [ ] Decode JWT - is it expired?
- [ ] Is the JWT signature valid?

**Fix:**
- Ensure `apiFetch()` is used
- Call `supabase.auth.getSession()` to refresh token
- Sign in again if session expired

---

### 422 Unprocessable Entity
**Cause:** Request body validation failed  
**Check:**
- [ ] Is request body valid JSON?
- [ ] Do required fields match API contract?
- [ ] Are field types correct (string vs number)?

**Fix:**
- Check server logs for specific validation error
- Compare request body against API endpoint schema

---

### 500 Internal Server Error
**Cause:** Server-side error  
**Check:**
- [ ] Check Supabase Edge Function logs
- [ ] Look for unhandled exceptions
- [ ] Verify database connection (if applicable)

**Fix:**
- Review server code for bugs
- Add error logging to narrow down issue

---

### Invalid JWT Error
**Cause:** JWT verification failed on server  
**Check:**
- [ ] Is `supabase.auth.getUser(accessToken)` being called on server?
- [ ] Is the correct environment variable used? (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- [ ] Was JWT decoded successfully?

**Fix:**
- Verify server uses correct Supabase client initialization
- Ensure JWT is extracted correctly from `Authorization` header
- Check JWT secret matches project

---

## 🎯 Distinguishing Auth Failure vs API Failure

### Authentication Failure (401)
**Symptoms:**
- Error occurs **before** business logic runs
- Response body: `"Unauthorized"` or `"Invalid JWT"`
- Server logs show JWT verification error

**Location:** `supabase.auth.getUser()` call fails

---

### API Failure (4xx/5xx after auth)
**Symptoms:**
- Error occurs **after** auth succeeds
- Response body: Detailed error message (e.g., "Tenant not found")
- Server logs show business logic error

**Location:** Route handler logic fails

---

## 🧪 Quick Debug Flow

1. **Check Network Tab**  
   → Headers present? ✅ / ❌

2. **Decode JWT**  
   → Valid + not expired? ✅ / ❌

3. **Check Response Status**  
   - 401 → Auth failure (go to step 4)
   - 422 → Validation error (check request body)
   - 500 → Server error (check logs)

4. **If 401, check server logs**  
   → JWT verification error? → Fix auth  
   → No user found? → User needs to sign in

5. **If API failure, check server logs**  
   → Read error message → Fix business logic

---

## 📋 Success Criteria

- [ ] Network request shows 200 OK
- [ ] Response body contains expected data
- [ ] No errors in browser console
- [ ] No errors in Edge Function logs

---

## 🔄 Reproducibility

This checklist is **deterministic**. Following it in order will:
- Identify auth vs API failures
- Pinpoint missing headers
- Expose expired tokens
- Surface validation errors

**No guesswork required.**

---

## 🛠️ Related Files

- Frontend auth: `/hooks/useAuth.tsx`
- API helper: `/lib/apiFetch.ts`
- Server entry: `/supabase/functions/server/index.tsx`
- Debug screen: `/components/DebugTenantContext.tsx`
