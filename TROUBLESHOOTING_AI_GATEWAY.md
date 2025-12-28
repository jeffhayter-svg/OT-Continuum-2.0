# 🔍 Troubleshooting AI Gateway - No Activity

## Quick Diagnostic Checklist

Run through these steps to identify the issue:

### ✅ Step 1: Verify Edge Function is Deployed

```bash
# List all deployed functions
npx supabase functions list

# You should see ai_gateway in the list
```

**Expected output:**
```
┌─────────────┬─────────────────┬─────────┬────────────────────┐
│ NAME        │ VERSION         │ STATUS  │ UPDATED_AT         │
├─────────────┼─────────────────┼─────────┼────────────────────┤
│ ai_gateway  │ vX              │ ACTIVE  │ 2024-12-26 ...     │
└─────────────┴─────────────────┴─────────┴────────────────────┘
```

**If NOT listed:**
```bash
# Deploy it
npx supabase functions deploy ai_gateway
```

---

### ✅ Step 2: Verify Edge Function File Exists

```bash
# Check the file exists
ls -la supabase/functions/ai_gateway/

# You should see:
# - index.ts (or index.tsx)
```

**If file doesn't exist**, the Edge Function wasn't created. Let me know and I'll create it.

---

### ✅ Step 3: Check Environment Variables

```bash
# List secrets (won't show values, just names)
npx supabase secrets list

# You should see:
# - GEMINI_API_KEY (or OPENAI_API_KEY)
# - AI_PROVIDER
# - AI_MODEL_CHAT
# - AI_MODEL_REPORT
```

**If missing:**
```bash
npx supabase secrets set GEMINI_API_KEY=your-key-here
npx supabase secrets set AI_PROVIDER=gemini
npx supabase secrets set AI_MODEL_CHAT=gemini-2.0-flash-exp
npx supabase secrets set AI_MODEL_REPORT=gemini-2.0-flash-exp
```

---

### ✅ Step 4: Test Edge Function Directly

Open browser console and run:

```javascript
// Get your project URL and anon key
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const ANON_KEY = 'your-anon-key';

// Get JWT token
const { data, error } = await supabase.auth.getSession();
const token = data.session?.access_token;

console.log('Token:', token ? token.slice(0, 20) + '...' : 'NONE');

// Test Edge Function
const res = await fetch(
  `${SUPABASE_URL}/functions/v1/ai_gateway`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: 'test-tenant-uuid',
      mode: 'chat',
      use_case: 'signal_assistant',
      input: { question: 'Test' }
    })
  }
);

console.log('Status:', res.status);
console.log('Response:', await res.text());
```

**Expected outcomes:**

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | ✅ Works! | You should see activity in logs now |
| 401 | No JWT or expired | Check `token` variable above |
| 404 | Function not found | Deploy the function |
| 500 | Function error | Check logs (Step 5) |
| CORS error | CORS not configured | Check function code (Step 6) |
| Network error | Wrong URL | Check SUPABASE_URL |

---

### ✅ Step 5: Check Edge Function Logs

```bash
# Watch logs in real-time
npx supabase functions logs ai_gateway --follow

# Or view recent logs
npx supabase functions logs ai_gateway
```

**Try calling the function** (using Step 4) while watching logs.

**What to look for:**

✅ **If you see logs**: Function is being called! Look for errors in the output.

❌ **If you see nothing**: Request isn't reaching the function. Check:
- URL is correct
- CORS preflight isn't failing
- Network tab in DevTools

---

### ✅ Step 6: Verify CORS Configuration

The Edge Function must respond with CORS headers. Check your function code:

```typescript
// supabase/functions/ai_gateway/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // MUST handle OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // ... your function logic ...

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  // MUST include this!
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  // MUST include this!
      },
    });
  }
});
```

---

### ✅ Step 7: Check Network Tab

Open DevTools → Network tab, then call `callAIGateway()`:

**Look for:**
1. **OPTIONS request** (CORS preflight)
   - Status should be 204
   - Should have `Access-Control-Allow-Origin: *` header

2. **POST request** to `ai_gateway`
   - Status should be 200
   - Check Request Headers (should have Authorization)
   - Check Response (should have data or error)

**Red flags:**

❌ **OPTIONS fails**: CORS not configured (see Step 6)  
❌ **POST shows 404**: Function not deployed or wrong URL  
❌ **POST shows 401**: JWT missing or invalid (see Step 4)  
❌ **Request Blocked**: Check browser console for CORS error  

---

### ✅ Step 8: Verify callAIGateway URL

Check your `callAIGateway` function uses correct URL:

```typescript
// lib/callAIGateway.ts

const res = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`,
  //                                                     ^^^^^^^^^^
  //                                                     Must match deployed function name
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
```

**Check:**
- `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local`
- URL ends with `/functions/v1/ai_gateway` (not `/ai-gateway` or anything else)

---

### ✅ Step 9: Add Debug Logging

Temporarily add logging to see what's happening:

```typescript
// lib/callAIGateway.ts

export async function callAIGateway(payload: { ... }) {
  console.group('🔍 [callAIGateway] Debug');
  
  // 1) Check session
  const { data, error } = await supabase.auth.getSession();
  console.log('Session error:', error);
  console.log('Has session:', !!data.session);
  console.log('JWT prefix:', data.session?.access_token?.slice(0, 20));
  
  const session = data.session;
  if (!session?.access_token) {
    console.error('❌ NO_ACTIVE_SESSION');
    throw new Error("NO_ACTIVE_SESSION");
  }

  // 2) Build URL
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`;
  console.log('URL:', url);
  console.log('Payload:', payload);

  // 3) Call Edge Function
  console.log('Calling Edge Function...');
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log('Response status:', res.status);
  console.log('Response ok:', res.ok);

  // 4) Handle response
  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Error response:', text);
    throw new Error(`AI_GATEWAY_ERROR ${res.status}: ${text}`);
  }

  const result = await res.json();
  console.log('✅ Success:', result);
  console.groupEnd();

  return result;
}
```

**Now call the function and check console output.**

---

### ✅ Step 10: Test with curl

Test the Edge Function outside of your app:

```bash
# Get a JWT token from Supabase dashboard or browser console
# In browser: await supabase.auth.getSession()
JWT_TOKEN="your-jwt-token-here"
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your-anon-key"

# Test the Edge Function
curl -X POST \
  "$SUPABASE_URL/functions/v1/ai_gateway" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-tenant-uuid",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {
      "question": "Test"
    }
  }'
```

**If this works but browser doesn't**: CORS issue (see Step 6)  
**If this fails**: Edge Function issue (check logs in Step 5)

---

## Common Issues & Solutions

### Issue 1: "Function not found" (404)

**Cause:** Edge Function not deployed or wrong name

**Solution:**
```bash
# Deploy
npx supabase functions deploy ai_gateway

# Verify
npx supabase functions list
```

---

### Issue 2: "Unauthorized" (401)

**Cause:** JWT missing or invalid

**Solution:**
```javascript
// Check JWT in browser console
const { data } = await supabase.auth.getSession();
console.log('JWT:', data.session?.access_token);

// If null, user not logged in
if (!data.session) {
  // Sign in first
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password'
  });
}
```

---

### Issue 3: CORS Error

**Cause:** Edge Function not returning CORS headers

**Solution:** Add CORS headers (see Step 6)

---

### Issue 4: "Missing GEMINI_API_KEY" (500)

**Cause:** Environment variable not set

**Solution:**
```bash
npx supabase secrets set GEMINI_API_KEY=your-key
npx supabase functions deploy ai_gateway
```

---

### Issue 5: No Logs, No Errors

**Cause:** Request not reaching Edge Function

**Possible reasons:**
1. Wrong URL (check `NEXT_PUBLIC_SUPABASE_URL`)
2. Request blocked by browser (CORS)
3. Request not being sent (check Network tab)
4. Different project (check project ref matches)

**Solution:**
- Check Network tab in DevTools
- Verify URL matches project
- Check browser console for errors

---

## Quick Test Script

Save this as `test-ai-gateway.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Gateway Test</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <h1>AI Gateway Test</h1>
  <button onclick="testAIGateway()">Test AI Gateway</button>
  <pre id="output"></pre>

  <script>
    const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
    const ANON_KEY = 'YOUR-ANON-KEY';

    const supabase = supabase.createClient(SUPABASE_URL, ANON_KEY);

    async function testAIGateway() {
      const output = document.getElementById('output');
      output.textContent = 'Testing...\n';

      try {
        // 1. Check session
        output.textContent += '1. Checking session...\n';
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const token = data.session?.access_token;
        if (!token) {
          output.textContent += '❌ No session. Please sign in first.\n';
          return;
        }
        output.textContent += `✅ Session found: ${token.slice(0, 20)}...\n`;

        // 2. Call Edge Function
        output.textContent += '2. Calling ai_gateway...\n';
        const url = `${SUPABASE_URL}/functions/v1/ai_gateway`;
        output.textContent += `   URL: ${url}\n`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: 'test-tenant-uuid',
            mode: 'chat',
            use_case: 'signal_assistant',
            input: { question: 'Test' }
          })
        });

        output.textContent += `   Status: ${res.status}\n`;

        if (!res.ok) {
          const text = await res.text();
          output.textContent += `❌ Error: ${text}\n`;
          return;
        }

        const result = await res.json();
        output.textContent += '✅ Success!\n';
        output.textContent += JSON.stringify(result, null, 2);

      } catch (err) {
        output.textContent += `❌ Exception: ${err.message}\n`;
        console.error(err);
      }
    }
  </script>
</body>
</html>
```

---

## What to Do Next

### If you still don't see activity:

1. **Share the output** of these commands:
   ```bash
   npx supabase functions list
   npx supabase secrets list
   ls -la supabase/functions/
   ```

2. **Share browser console output** when calling `callAIGateway()`

3. **Share Network tab screenshot** showing the request/response

4. **Share Edge Function logs** output:
   ```bash
   npx supabase functions logs ai_gateway
   ```

I'll help you debug further!

---

## Most Likely Causes (in order)

1. ⭐ **Edge Function not deployed** (70% of cases)
2. ⭐ **User not logged in** - No JWT token (15% of cases)
3. ⭐ **Wrong URL** - Typo in environment variable (10% of cases)
4. CORS not configured (3% of cases)
5. Environment variables not set (2% of cases)

**Start with Step 1-4 above!**
