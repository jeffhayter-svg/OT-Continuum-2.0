# Edge Function Quick Reference

## 🚀 **Quick Start: How to Call Edge Functions**

### ✅ **Recommended: Use the Helper**

```typescript
import { apiFetch } from './lib/apiFetch';

// GET request
const data = await apiFetch('/tenant-context');

// POST request
const result = await apiFetch('/onboarding/create-tenant', {
  method: 'POST',
  body: {
    organizationName: 'My Org',
    fullName: 'John Doe'
  }
});
```

**Benefits:**
- ✅ Automatic header management
- ✅ Automatic session validation
- ✅ Error handling built-in
- ✅ Debug logging included

---

## 🔧 **Manual fetch() (Only if Necessary)**

If you **must** use direct `fetch()`:

```typescript
import { supabase } from './lib/supabase-client';
import { projectId, publicAnonKey } from './utils/supabase/info';

// 1. Get session
const { data: { session } } = await supabase.auth.getSession();

if (!session?.access_token) {
  throw new Error('Not authenticated');
}

// 2. Make request with BOTH headers
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-fb677d93/ENDPOINT`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': publicAnonKey,                            // ✅ REQUIRED
      'Authorization': `Bearer ${session.access_token}`,  // ✅ REQUIRED
    },
    body: JSON.stringify({ data: 'value' })
  }
);

const data = await response.json();
```

---

## ❌ **Common Mistakes**

### **1. Missing `apikey` header**
```typescript
// ❌ WRONG
headers: {
  'Authorization': `Bearer ${session.access_token}`
  // Missing apikey!
}

// ✅ CORRECT
headers: {
  'apikey': publicAnonKey,
  'Authorization': `Bearer ${session.access_token}`
}
```

---

### **2. Using anon key as Authorization**
```typescript
// ❌ WRONG
headers: {
  'Authorization': `Bearer ${publicAnonKey}`  // This is NOT a JWT!
}

// ✅ CORRECT
headers: {
  'apikey': publicAnonKey,                    // Public key here
  'Authorization': `Bearer ${session.access_token}`  // User JWT here
}
```

---

### **3. Not validating session**
```typescript
// ❌ WRONG (race condition)
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${supabase.auth.session?.access_token}` // Might be null!
  }
});

// ✅ CORRECT
const { data: { session } } = await supabase.auth.getSession();

if (!session?.access_token) {
  throw new Error('Not authenticated');
}

const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

---

## 📋 **Header Checklist**

Before every Edge Function call, verify:

- [ ] ✅ `apikey` header present (anon key)
- [ ] ✅ `Authorization` header present (user JWT)
- [ ] ✅ `Content-Type: application/json` (if sending JSON)
- [ ] ✅ Session validated before request
- [ ] ✅ Keys are different (anon key ≠ user JWT)

---

## 🔍 **Debug: Verify Headers**

```typescript
// Log headers before sending
console.group('🌐 Edge Function Request');
console.log('URL:', url);
console.log('Apikey present:', !!publicAnonKey);
console.log('Apikey length:', publicAnonKey.length); // Should be ~300-400
console.log('JWT present:', !!session.access_token);
console.log('JWT length:', session.access_token.length); // Should be ~200-300
console.log('Keys different:', publicAnonKey !== session.access_token); // Should be true
console.groupEnd();
```

---

## 🎯 **Complete Examples**

### **Example 1: Create Tenant**
```typescript
import { apiFetch } from './lib/apiFetch';

async function createTenant(orgName: string, fullName: string) {
  try {
    const result = await apiFetch('/onboarding/create-tenant', {
      method: 'POST',
      body: {
        organizationName: orgName,
        fullName: fullName
      }
    });
    
    console.log('Tenant created:', result.tenant);
    return result;
  } catch (error) {
    console.error('Failed to create tenant:', error);
    throw error;
  }
}
```

---

### **Example 2: Get Tenant Context**
```typescript
import { apiFetch } from './lib/apiFetch';

async function getTenantContext() {
  try {
    const context = await apiFetch('/tenant-context');
    
    console.log('User ID:', context.user_id);
    console.log('Tenant ID:', context.tenant_id);
    console.log('Role:', context.role);
    
    return context;
  } catch (error) {
    console.error('Failed to get context:', error);
    throw error;
  }
}
```

---

### **Example 3: Manual fetch() with Full Error Handling**
```typescript
import { supabase } from './lib/supabase-client';
import { projectId, publicAnonKey } from './utils/supabase/info';

async function createSiteManual(siteName: string) {
  // 1. Validate session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated - please log in');
  }

  // 2. Build URL
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-fb677d93/sites`;

  // 3. Make request with both headers
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': publicAnonKey,
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      name: siteName
    })
  });

  // 4. Handle errors
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  // 5. Parse success response
  const data = await response.json();
  return data;
}
```

---

## 🆘 **Troubleshooting**

### **Error: "Invalid JWT"**
- ✅ Check: Are you using `session.access_token` (not `publicAnonKey`) in Authorization?
- ✅ Check: Is the session still valid? Try re-logging in
- ✅ Check: Are you calling `supabase.auth.getSession()` first?

### **Error: "Missing apikey header"**
- ✅ Check: Did you include `'apikey': publicAnonKey` in headers?
- ✅ Check: Is `publicAnonKey` defined and not undefined?

### **Error: "No active session"**
- ✅ Check: Is the user logged in?
- ✅ Check: Did the session expire?
- ✅ Check: Are you calling `getSession()` before making the request?

### **Error: "CORS error"**
- ✅ Check: Is the Edge Function deployed?
- ✅ Check: Is CORS configured in the Edge Function?
- ✅ Check: Are you using the correct project ID?

---

## 📚 **Related Files**

- `/lib/apiFetch.ts` - Main helper function
- `/packages/web/src/lib/api-client.ts` - Advanced API client with debugging
- `/supabase/functions/server/index.tsx` - Edge Function server
- `/pages/onboarding/TenantSetup.tsx` - Example manual fetch implementation

---

**Last Updated:** December 27, 2024  
**Maintained by:** OT Continuum Engineering
