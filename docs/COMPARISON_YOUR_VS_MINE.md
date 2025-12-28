# Comparison: Your callAIGateway vs My edgeFetch

## ✅ Your Implementation (Excellent!)

```typescript
import { supabase } from "@/lib/supabaseClient";

export async function callAIGateway(payload: {
  tenant_id: string;
  mode: "chat" | "report";
  use_case: string;
  input: Record<string, any>;
  context?: Record<string, any>;
}) {
  // 1) Get session from Supabase (NOT localStorage) ✅
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const session = data.session;
  if (!session?.access_token) {
    throw new Error("NO_ACTIVE_SESSION");
  }

  // 2) Call Edge Function with proper headers ✅
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  // 3) Handle errors clearly ✅
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI_GATEWAY_ERROR ${res.status}: ${text}`);
  }

  return await res.json();
}
```

**Strengths:**
- ✅ Uses `supabase.auth.getSession()` (works in iframe!)
- ✅ Throws clear error if no session
- ✅ Sets all required headers
- ✅ Specific to AI Gateway (type-safe payload)
- ✅ Proper error handling with status codes
- ✅ Next.js environment variables

**Will work in Figma iframe:** ✅ YES

---

## 🔄 My Implementation (Generic)

```typescript
import { getAccessToken } from './authSession';

export async function edgeFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  // 1) Get access token from session
  const accessToken = await getAccessToken();
  
  // 2) Throw clear error if no session
  if (!accessToken) {
    throw new NoSessionError();
  }
  
  // 3) Build URL and headers
  const url = `${supabaseUrl}/functions/v1/${path}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'apikey': publicAnonKey,
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  // 4) Make request
  return fetch(url, { ...options, headers });
}
```

**Strengths:**
- ✅ Generic (works for any Edge Function)
- ✅ Reusable `getAccessToken()` utility
- ✅ Custom error type (`NoSessionError`)
- ✅ Debug logging in development
- ✅ Convenience wrapper (`edgeFetchJson`)

**Will work in Figma iframe:** ✅ YES (same pattern as yours)

---

## 🎯 Recommendation: Use Both!

### Your `callAIGateway` - For AI Gateway Calls

**Keep it!** It's specific, type-safe, and perfect for AI Gateway.

```typescript
// ai-gateway.ts
import { callAIGateway } from './callAIGateway';

const result = await callAIGateway({
  tenant_id: tenantId,
  mode: 'chat',
  use_case: 'signal_assistant',
  input: { signal_type: 'unauthorized_access', severity: 'high' }
});
```

**Pros:**
- Type-safe payload
- Specific error messages
- Clear intent (this is for AI Gateway)
- Already tested and working

---

### My `edgeFetch` - For Other Edge Functions

**Use for generic Edge Function calls:**

```typescript
// signals.ts
import { edgeFetchJson } from './edgeFetch';

const signals = await edgeFetchJson('signals', {
  method: 'GET'
});

// risks.ts
const risk = await edgeFetchJson('risk/123', {
  method: 'PATCH',
  body: JSON.stringify({ status: 'closed' })
});

// workflow.ts
const workflow = await edgeFetchJson('workflow/execute', {
  method: 'POST',
  body: JSON.stringify({ workflowId: '...' })
});
```

**Pros:**
- Works for any Edge Function
- Shared error handling (`isNoSessionError`)
- Shared debug logging
- Less code duplication

---

## 🔧 Optional: Refactor to Share Code

If you want to consolidate, you could refactor your `callAIGateway` to use my utilities:

### Step 1: Extract getAccessToken

```typescript
// authSession.ts (already created)
import { supabase } from "@/lib/supabaseClient";

export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token || null;
}
```

### Step 2: Update callAIGateway

```typescript
// callAIGateway.ts (refactored)
import { getAccessToken } from './authSession';

export async function callAIGateway(payload: {
  tenant_id: string;
  mode: "chat" | "report";
  use_case: string;
  input: Record<string, any>;
  context?: Record<string, any>;
}) {
  // Reuse getAccessToken
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("NO_ACTIVE_SESSION");
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI_GATEWAY_ERROR ${res.status}: ${text}`);
  }

  return await res.json();
}
```

**Benefits:**
- Single source of truth for JWT (`getAccessToken`)
- Can reuse `getAccessToken` in other places
- Easier to add debug logging to `getAccessToken`
- Easier to test

---

## 📊 Side-by-Side Feature Comparison

| Feature | Your callAIGateway | My edgeFetch |
|---------|-------------------|--------------|
| Works in iframe | ✅ Yes | ✅ Yes |
| Gets JWT from session | ✅ Yes | ✅ Yes |
| Throws if no session | ✅ Yes | ✅ Yes |
| Sets proper headers | ✅ Yes | ✅ Yes |
| Type-safe payload | ✅ Yes (AI Gateway) | ⚠️ Generic |
| Works for all Edge Functions | ⚠️ AI Gateway only | ✅ Yes |
| Custom error type | ⚠️ String | ✅ NoSessionError class |
| Debug logging | ❌ No | ✅ Yes (dev mode) |
| Environment support | ✅ Next.js | ✅ Next.js + Vite |
| Error type checking | ❌ No helper | ✅ isNoSessionError() |
| JSON convenience wrapper | ❌ No | ✅ edgeFetchJson() |

---

## 🎯 Final Recommendation

### ✅ Keep Your Implementation

Your `callAIGateway` is **excellent** and production-ready. It already solves the Figma iframe problem!

### ✅ Optional Enhancements

If you want to add the benefits of my implementation:

1. **Extract `getAccessToken()`** - Single source of truth
   ```typescript
   // authSession.ts
   export async function getAccessToken(): Promise<string | null> {
     const { data, error } = await supabase.auth.getSession();
     if (error) throw error;
     return data.session?.access_token || null;
   }
   ```

2. **Add custom error type** - Better error handling
   ```typescript
   // errors.ts
   export class NoSessionError extends Error {
     constructor() {
       super('NO_ACTIVE_SESSION');
       this.name = 'NoSessionError';
     }
   }
   
   // Usage
   if (!accessToken) throw new NoSessionError();
   ```

3. **Add error type checker** - Clean error handling
   ```typescript
   // errors.ts
   export function isNoSessionError(err: any): err is NoSessionError {
     return err instanceof NoSessionError || 
            err?.message === 'NO_ACTIVE_SESSION';
   }
   
   // Usage
   try {
     await callAIGateway({ ... });
   } catch (err) {
     if (isNoSessionError(err)) {
       router.push('/login');
     }
   }
   ```

4. **Add debug logging** - Easier debugging
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     console.log('[callAIGateway] JWT prefix:', accessToken.slice(0, 12));
   }
   ```

---

## 🚀 Next Steps

### Option A: Keep As-Is (Recommended)

Your code works perfectly! Ship it and move on. ✅

### Option B: Add Small Enhancements

Extract `getAccessToken()` and add error type checker for cleaner code.

### Option C: Full Integration

Use my utilities for all Edge Functions, keep your `callAIGateway` for AI Gateway specifically.

---

## ✅ Summary

**Your implementation is excellent!** ✅

It already:
- ✅ Works in Figma iframe
- ✅ Gets JWT from session (not localStorage)
- ✅ Sets proper headers
- ✅ Handles errors clearly

My implementation provides:
- ✅ Generic reusable wrapper
- ✅ Custom error types
- ✅ Debug logging
- ✅ Convenience helpers

**Best approach:** Keep both! Use yours for AI Gateway, mine for other Edge Functions.

---

**Status:** Your code is production-ready! 🎉  
**Action needed:** None (unless you want optional enhancements)
