# OT Continuum Authentication Flow

## 📊 Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
│   (User)     │
└──────┬───────┘
       │
       │ 1. Navigate to /
       ├────────────────────────────────────┐
       │                                    │
       ▼                                    │
┌─────────────────┐                        │
│ ProtectedRoute  │                        │
│   Component     │                        │
└────────┬────────┘                        │
         │                                  │
         │ 2. Check session                │
         │    supabase.auth.getSession()   │
         │                                  │
         ├─── No Session? ─────────────────┤
         │                                  │
         │                                  ▼
         │                          ┌─────────────┐
         │                          │ /login Page │
         │                          └──────┬──────┘
         │                                 │
         │                                 │ 3. User enters credentials
         │                                 │    email + password
         │                                 │
         │                                 ▼
         │                          ┌─────────────────────┐
         │                          │ supabase.auth       │
         │                          │ .signInWithPassword │
         │                          └──────┬──────────────┘
         │                                 │
         │                                 │ 4. Supabase Auth validates
         │                                 │    credentials
         │                                 │
         │                                 ▼
         │                          ┌─────────────────────┐
         │                          │  Session Created    │
         │                          │  - user object      │
         │                          │  - access_token     │
         │                          │  - refresh_token    │
         │                          └──────┬──────────────┘
         │                                 │
         │◄────────────────────────────────┘
         │
         │ Session exists! ✓
         │
         ▼
┌─────────────────┐
│   Application   │
│   Dashboard     │
└────────┬────────┘
         │
         │ 5. User interacts with app
         │    (e.g., click "Risk Register")
         │
         ▼
┌─────────────────────────────┐
│   API Client Request        │
│   (apiClient.getRisks())    │
└──────────┬──────────────────┘
           │
           │ 6. Get JWT from session
           │    getAuthToken()
           │
           ├─── Session null? ─────────┐
           │                           │
           │                           ▼
           │                    ┌────────────────┐
           │                    │ Redirect to    │
           │                    │ /login         │
           │                    └────────────────┘
           │
           │ Session exists ✓
           │
           ▼
    ┌──────────────────────────────────┐
    │  Fetch Request to Edge Function  │
    │                                  │
    │  URL: /functions/v1/make-server  │
    │       -fb677d93/risks            │
    │                                  │
    │  Headers:                        │
    │  ✓ apikey: <anon_key>           │
    │  ✓ Authorization: Bearer <JWT>  │
    │  ✓ Content-Type: application/json│
    └──────────────┬───────────────────┘
                   │
                   │ 7. Edge Function receives request
                   │
                   ▼
         ┌──────────────────────┐
         │  Supabase Verify JWT │
         │  (Automatic)         │
         └──────────┬───────────┘
                    │
                    ├─── JWT Invalid? ────────┐
                    │                         │
                    │                         ▼
                    │                  ┌─────────────┐
                    │                  │ Return 401  │
                    │                  │ Unauthorized│
                    │                  └──────┬──────┘
                    │                         │
                    │                         │ 8. Frontend catches 401
                    │                         │
                    │                         ▼
                    │                  ┌────────────────┐
                    │                  │ Sign out user  │
                    │                  │ Redirect /login│
                    │                  └────────────────┘
                    │
                    │ JWT Valid ✓
                    │
                    ▼
         ┌──────────────────────┐
         │  Edge Function       │
         │  Executes Query      │
         │  with RLS Context    │
         │  (user.id from JWT)  │
         └──────────┬───────────┘
                    │
                    │ 9. RLS policies enforce
                    │    tenant/site scoping
                    │
                    ▼
         ┌──────────────────────┐
         │  PostgreSQL Database │
         │  Returns Data        │
         └──────────┬───────────┘
                    │
                    │ 10. Edge Function returns
                    │     JSON response
                    │
                    ▼
         ┌──────────────────────┐
         │  API Client receives │
         │  data and updates UI │
         └──────────────────────┘
```

---

## 🔐 JWT Token Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                     JWT TOKEN LIFECYCLE                       │
└──────────────────────────────────────────────────────────────┘

1. LOGIN
   ┌─────────────────┐
   │ User logs in    │
   │ credentials     │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │ Supabase Auth creates JWT   │
   │ - Expires in 1 hour         │
   │ - Contains user.id          │
   │ - Signed with secret key    │
   └────────┬────────────────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │ Session stored in browser   │
   │ localStorage                │
   └────────┬────────────────────┘
            │
            ▼

2. ACTIVE USE
   ┌─────────────────────────────┐
   │ Every API request:          │
   │ - Reads JWT from session    │
   │ - Attaches to Authorization │
   │ - Backend verifies          │
   └────────┬────────────────────┘
            │
            ▼

3. TOKEN REFRESH (Automatic)
   ┌─────────────────────────────┐
   │ Before expiry (< 60s left)  │
   │ Supabase client auto-       │
   │ refreshes with refresh_token│
   └────────┬────────────────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │ New JWT issued              │
   │ Session updated             │
   └────────┬────────────────────┘
            │
            ▼

4. EXPIRY / LOGOUT
   ┌─────────────────────────────┐
   │ Token expires OR            │
   │ User clicks logout          │
   └────────┬────────────────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │ Session cleared             │
   │ Redirect to /login          │
   └─────────────────────────────┘
```

---

## 🛡️ Security Layers

```
┌────────────────────────────────────────────────────────────┐
│              MULTI-LAYER SECURITY ARCHITECTURE              │
└────────────────────────────────────────────────────────────┘

Layer 1: Frontend Route Protection
┌─────────────────────────────────────────┐
│ ProtectedRoute Component               │
│ - Checks for active session             │
│ - Redirects unauthenticated users       │
│ - Prevents unauthorized page access     │
└─────────────────────────────────────────┘
                    ↓
Layer 2: API Client Authentication
┌─────────────────────────────────────────┐
│ API Client (api-client.ts)             │
│ - Validates session before requests     │
│ - Attaches JWT automatically            │
│ - Handles 401 errors gracefully         │
└─────────────────────────────────────────┘
                    ↓
Layer 3: Edge Function JWT Verification
┌─────────────────────────────────────────┐
│ Supabase Edge Functions                │
│ - Verify JWT = ON                       │
│ - Rejects invalid/expired tokens        │
│ - Returns 401 if verification fails     │
└─────────────────────────────────────────┘
                    ↓
Layer 4: Row Level Security (RLS)
┌─────────────────────────────────────────┐
│ PostgreSQL Database                     │
│ - RLS policies enforce tenant scoping   │
│ - Uses auth.uid() from JWT              │
│ - Prevents cross-tenant data access     │
└─────────────────────────────────────────┘
```

---

## 📡 Request/Response Flow Detail

### Successful Request

```
Frontend                  Edge Function               Database
   │                           │                          │
   │  GET /risks              │                          │
   │  apikey: xxx             │                          │
   │  Authorization: Bearer   │                          │
   ├─────────────────────────►│                          │
   │                          │                          │
   │                          │ Verify JWT               │
   │                          │ Extract user.id          │
   │                          │                          │
   │                          │  SELECT * FROM risks     │
   │                          │  WHERE tenant_id IN      │
   │                          │  (user's tenants)        │
   │                          ├─────────────────────────►│
   │                          │                          │
   │                          │                          │ RLS Check
   │                          │                          │ Filter by
   │                          │                          │ tenant_id
   │                          │                          │
   │                          │      { data: [...] }     │
   │                          │◄─────────────────────────┤
   │                          │                          │
   │  { data: [...],         │                          │
   │    error: null }        │                          │
   │◄─────────────────────────┤                          │
   │                          │                          │
```

### Failed Request (Invalid JWT)

```
Frontend                  Edge Function               Database
   │                           │                          │
   │  GET /risks              │                          │
   │  apikey: xxx             │                          │
   │  Authorization: Bearer   │                          │
   │  <expired_token>         │                          │
   ├─────────────────────────►│                          │
   │                          │                          │
   │                          │ Verify JWT               │
   │                          │ ❌ INVALID/EXPIRED       │
   │                          │                          │
   │  401 Unauthorized        │                          │
   │◄─────────────────────────┤                          │
   │                          │                          │
   │  Clear session           │                          │
   │  Redirect to /login      │                          │
   │                          │                          │
```

---

## 🔍 Header Inspection Guide

### How to Verify JWT Attachment

1. **Open Browser DevTools** (F12)
2. **Go to Network Tab**
3. **Clear existing requests**
4. **Navigate to Risk Register** (or any workflow page)
5. **Click on XHR request** to Edge Function
6. **Inspect Request Headers**

Expected headers:
```http
GET /functions/v1/make-server-fb677d93/risks HTTP/1.1
Host: mnkwpcexwhkhyxfgirhx.supabase.co
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua3dwY2V4d2hraHl4Zmdpcmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NTU5NjksImV4cCI6MjA4MjAzMTk2OX0.CPRwlfCXWgwYqdYpsksoE6U9SiQyNMVvN7fWzGVCwoM
authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM1MDY4MzI5LCJpYXQiOjE3MzUwNjQ3MjksImlzcyI6Imh0dHBzOi8vbW5rd3BjZXh3aGtoeXhmZ2lyaHguc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzM1MDY0NzI5fV0sInNlc3Npb25faWQiOiJhYmMxMjMtZGVmNDU2LWdoaTc4OS1qa2wxMjMifQ.signature_here
content-type: application/json
```

✅ **Both headers present** = Correctly configured  
❌ **Missing authorization** = Authentication broken  
❌ **401 response** = JWT verification failed

---

## 🧪 Manual Testing Checklist

- [ ] **Login Flow**
  - [ ] Navigate to `/login`
  - [ ] Enter valid credentials
  - [ ] Click "Sign In"
  - [ ] Verify redirect to dashboard
  - [ ] Check no console errors

- [ ] **JWT Attachment**
  - [ ] Open DevTools Network tab
  - [ ] Navigate to Risk Register
  - [ ] Click first XHR request
  - [ ] Verify `authorization` header present
  - [ ] Verify `apikey` header present
  - [ ] Verify response status `200 OK`

- [ ] **Session Persistence**
  - [ ] Login
  - [ ] Refresh page (F5)
  - [ ] Verify still logged in
  - [ ] Verify no redirect to login

- [ ] **Logout Flow**
  - [ ] Click "Logout" button
  - [ ] Verify redirect to `/login`
  - [ ] Verify session cleared
  - [ ] Attempt to navigate to `/risks`
  - [ ] Verify redirect to `/login`

- [ ] **Expired Session**
  - [ ] Login
  - [ ] Wait for token expiry (~1 hour)
  - [ ] Make API request
  - [ ] Verify 401 response
  - [ ] Verify automatic logout
  - [ ] Verify redirect to `/login`

- [ ] **Protected Routes**
  - [ ] Logout
  - [ ] Directly navigate to `/risks`
  - [ ] Verify immediate redirect to `/login`
  - [ ] Login
  - [ ] Verify redirect back to dashboard

---

## 📚 Related Documentation

- **Implementation Guide:** `/docs/AUTH_JWT_IMPLEMENTATION.md`
- **Audit Summary:** `/docs/AUTH_AUDIT_SUMMARY.md`
- **API Client:** `/packages/web/src/lib/api-client.ts`
- **Debug Utilities:** `/packages/web/src/lib/auth-debug.ts`

---

**Last Updated:** 2024-12-23  
**Version:** 1.0  
**Status:** Production Ready ✅
