# Authentication Quick Reference Card

## 🚀 Quick Start

### Making Authenticated API Calls

```typescript
import { apiClient } from './lib/api-client';

// ✅ Correct - JWT automatically attached
const risks = await apiClient.getRisks();

// ✅ Correct - JWT automatically attached
await apiClient.updateRisk(riskId, { status: 'closed' });

// ❌ Wrong - Don't use fetch directly
// fetch('/functions/v1/make-server-fb677d93/risks')  
```

### Checking Auth Status

```typescript
import { supabase } from './lib/api-client';

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log('User:', session.user.email);
  console.log('Token expires:', new Date(session.expires_at * 1000));
}
```

---

## 🔐 Key Functions

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log(user.email, user.id);
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out

```typescript
await supabase.auth.signOut();
navigate('/login');
```

### Listen to Auth Changes

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') console.log('User signed in');
  if (event === 'SIGNED_OUT') console.log('User signed out');
});

// Later: cleanup
subscription.unsubscribe();
```

---

## 🐛 Debug Commands

### Check Auth Status (Browser Console)

```javascript
// Check current session
await window.debugAuth()

// Test Edge Function call
await window.testEdgeAuth()

// Get session manually
const { data } = await supabase.auth.getSession()
console.log(data.session)
```

---

## 📡 Required Headers for Edge Functions

```javascript
{
  'apikey': '<SUPABASE_ANON_KEY>',           // Always required
  'Authorization': 'Bearer <access_token>',   // User JWT (auto-attached)
  'Content-Type': 'application/json'
}
```

**Note:** The `apiClient` handles this automatically. Never construct these headers manually.

---

## 🛡️ Protected Routes Pattern

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

// Wrap authenticated pages
<Route path="/risks" element={
  <ProtectedRoute>
    <RiskRegister />
  </ProtectedRoute>
} />
```

---

## ⚠️ Common Errors

### 401 Unauthorized

**Cause:** Invalid or expired JWT

**Solution:**
```javascript
// 1. Check session
await window.debugAuth()

// 2. If expired, logout and login
await supabase.auth.signOut()
// Navigate to /login
```

### "No authenticated session - redirecting to login"

**Cause:** User not logged in

**Solution:** This is expected behavior. User will be redirected to `/login`.

### "Session expired - please log in again"

**Cause:** JWT expired during request

**Solution:** User is automatically logged out and redirected. This is correct behavior.

---

## 📊 Network Tab Inspection

### What to Look For

1. **Open DevTools** → Network tab
2. **Filter:** XHR
3. **Look for:** Requests to `https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/`
4. **Click request** → Headers tab
5. **Verify:**
   - `apikey` header present ✅
   - `authorization` header present ✅
   - Response status `200` (not `401`) ✅

### Example Good Request

```http
GET /functions/v1/make-server-fb677d93/risks HTTP/1.1
Host: mnkwpcexwhkhyxfgirhx.supabase.co
apikey: eyJhbGci...
authorization: Bearer eyJhbGci...
```

**Response:** `200 OK`

### Example Bad Request

```http
GET /functions/v1/make-server-fb677d93/risks HTTP/1.1
Host: mnkwpcexwhkhyxfgirhx.supabase.co
apikey: eyJhbGci...
# ❌ Missing authorization header
```

**Response:** `401 Unauthorized`

---

## 🔧 Environment Variables

### Required Config

**File:** `/utils/supabase/info.tsx`

```typescript
export const projectId = "mnkwpcexwhkhyxfgirhx"
export const publicAnonKey = "eyJhbGci..."
```

**Used in:**
- Supabase client initialization
- Edge Function URL construction
- Header generation

---

## 📝 Code Snippets

### Create a New API Endpoint

```typescript
// In api-client.ts

async getMyData(param: string): Promise<ApiResponse<MyData>> {
  // JWT automatically attached ✅
  return this.request(`/my-endpoint?param=${param}`);
}

async createMyData(data: MyData): Promise<ApiResponse<MyData>> {
  // JWT automatically attached ✅
  return this.request('/my-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### Use in Component

```typescript
import { apiClient } from '../lib/api-client';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await apiClient.getMyData('param-value');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load:', error);
      // User automatically redirected to login if unauthenticated
    } finally {
      setLoading(false);
    }
  }

  return <div>{/* render data */}</div>;
}
```

---

## ✅ Production Checklist

- [ ] All API calls use `apiClient` (not raw `fetch`)
- [ ] Protected routes wrapped in `<ProtectedRoute>`
- [ ] Login/Logout flows tested
- [ ] DevTools shows JWT in all requests
- [ ] No 401 errors in production
- [ ] Session persistence works after refresh
- [ ] Debug logging disabled in production build

---

## 🆘 Getting Help

### Debug in Console

```javascript
// 1. Check auth
await window.debugAuth()

// 2. Test Edge Function
await window.testEdgeAuth()

// 3. Inspect session
const { data } = await supabase.auth.getSession()
console.table({
  user: data.session?.user.email,
  expires: new Date(data.session?.expires_at * 1000).toLocaleString(),
  tokenLength: data.session?.access_token.length
})
```

### Check Logs

**Browser Console:**
- Auth errors
- API request logs (dev mode only)
- Automatic redirect messages

**Supabase Dashboard:**
- Edge Function logs
- Auth logs
- Database query logs

---

## 📚 Documentation

- **Full Implementation:** `/docs/AUTH_JWT_IMPLEMENTATION.md`
- **Audit Summary:** `/docs/AUTH_AUDIT_SUMMARY.md`
- **Flow Diagram:** `/docs/AUTH_FLOW_DIAGRAM.md`
- **This Quick Reference:** `/docs/AUTH_QUICK_REFERENCE.md`

---

**Last Updated:** 2024-12-23  
**Keep this handy for quick reference!** 📌
