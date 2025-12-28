# 🔍 Why You're Not Seeing Activity in Supabase

## TL;DR - Quick Answer

**90% chance it's one of these 3 things:**

1. **Edge Function not deployed** ← Most common!
2. **User not logged in** ← No JWT token
3. **Wrong environment variables** ← URL or key mismatch

---

## 🚀 3-Minute Fix

### Step 1: Deploy the Edge Function

```bash
# Check if deployed
npx supabase functions list

# If ai_gateway is NOT in the list, deploy it:
npx supabase functions deploy ai_gateway

# Set required secrets (if not set already)
npx supabase secrets set GEMINI_API_KEY=your-key-here
npx supabase secrets set AI_PROVIDER=gemini
npx supabase secrets set AI_MODEL_CHAT=gemini-2.0-flash-exp
```

### Step 2: Verify User is Logged In

Open browser console (F12) and run:

```javascript
const { data } = await supabase.auth.getSession();
console.log('Logged in:', !!data.session);
console.log('User:', data.session?.user?.email);
```

If `false`, sign in first!

### Step 3: Test the Function

```javascript
// Get a valid tenant ID
const { data: tenants } = await supabase
  .from('tenants')
  .select('tenant_id')
  .limit(1);

const tenantId = tenants[0].tenant_id;

// Call AI Gateway
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "signal_assistant",
  input: {
    question: "What does a spike in failed PLC heartbeats indicate?"
  }
});

console.log('✅ Success!', result);
```

### Step 4: Watch Logs

In terminal:

```bash
npx supabase functions logs ai_gateway --follow
```

Then call the function again. You should see activity!

---

## 🔍 Detailed Diagnostics

### Option 1: Use the Test HTML File

1. Open `/test-ai-gateway.html` in your browser
2. Fill in Supabase URL and Anon Key
3. Sign in with your credentials
4. Click "Run Full Diagnostics"

This will test everything and show you exactly what's wrong.

### Option 2: Use the Diagnostic Script

1. Open browser DevTools (F12)
2. Copy the entire content of `/scripts/diagnose-ai-gateway.js`
3. Paste into console and press Enter
4. Run: `diagnoseAIGateway()`

This will run 6 tests and tell you exactly what's failing.

### Option 3: Manual Testing

Follow the checklist in `/AI_GATEWAY_CHECKLIST.md`

---

## 📊 What "Activity" Looks Like

### In Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions** → **ai_gateway**
2. You should see:
   - **Invocations graph** going up
   - **Recent requests** showing timestamps
   - **Success rate** (should be high)

### In Terminal Logs

```bash
npx supabase functions logs ai_gateway --follow
```

You should see:

```
[timestamp] INFO  Request received
[timestamp] INFO  Tenant: abc-123
[timestamp] INFO  Use case: signal_assistant
[timestamp] INFO  Calling Gemini API...
[timestamp] INFO  Success! Response length: 425 chars
```

### In Browser Network Tab

1. Open DevTools (F12) → Network tab
2. Filter by "ai_gateway"
3. You should see:
   - **OPTIONS** request (status 204) - CORS preflight
   - **POST** request (status 200) - Actual call
   - Response with `{ ok: true, output: "..." }`

### In Browser Console

```javascript
console.log(result);
// {
//   ok: true,
//   provider: "gemini",
//   model: "gemini-2.0-flash-exp",
//   mode: "chat",
//   use_case: "signal_assistant",
//   output: "• **Changed**: Failed PLC heartbeat count increased..."
// }
```

---

## ❌ Common Errors & Fixes

### Error: "Failed to fetch" or "Network error"

**Cause:** Wrong URL or CORS issue

**Check:**
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Should be: https://your-project-ref.supabase.co
```

**Fix:**
- Verify URL in `.env.local`
- Make sure Edge Function returns CORS headers

---

### Error: "Function not found" (404)

**Cause:** Edge Function not deployed

**Fix:**
```bash
npx supabase functions deploy ai_gateway
```

---

### Error: "Unauthorized" (401)

**Cause:** No JWT token or expired session

**Fix:**
```javascript
// Check session
const { data } = await supabase.auth.getSession();
if (!data.session) {
  // Sign in
  await supabase.auth.signInWithPassword({
    email: 'your-email',
    password: 'your-password'
  });
}
```

---

### Error: "Missing GEMINI_API_KEY" (500)

**Cause:** Environment variable not set

**Fix:**
```bash
npx supabase secrets set GEMINI_API_KEY=your-key-here
npx supabase functions deploy ai_gateway  # Redeploy after setting secrets
```

---

### Error: "Tenant not found" (403 or 500)

**Cause:** Invalid tenant_id or RLS policy blocking

**Fix:**
```javascript
// Get a valid tenant from database
const { data } = await supabase
  .from('tenants')
  .select('tenant_id')
  .limit(1);

// Use this tenant_id
const tenantId = data[0].tenant_id;
```

---

### Silent Failure (No errors, no activity)

**Cause:** Request not being sent at all

**Check:**
1. Open Network tab (F12)
2. Try calling `callAIGateway()`
3. Look for `ai_gateway` request

**If you don't see ANY request:**
- `callAIGateway` function might not be imported
- Function might be throwing error before fetch
- Check browser console for errors

**If request is blocked:**
- CORS error → Check Edge Function CORS headers
- CSP error → Check Content Security Policy

---

## 🎯 Success Checklist

Work through this list:

### Deployment ✅
- [ ] Edge Function file exists: `ls supabase/functions/ai_gateway/index.ts`
- [ ] Edge Function deployed: `npx supabase functions list` shows `ai_gateway`
- [ ] Secrets configured: `npx supabase secrets list` shows `GEMINI_API_KEY`
- [ ] Recent deployment: Check timestamp in `npx supabase functions list`

### Configuration ✅
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Environment variables accessible in browser console
- [ ] URL and key match Supabase dashboard (Project Settings → API)

### Authentication ✅
- [ ] User is signed in: `await supabase.auth.getSession()` returns session
- [ ] JWT token exists: Session has `access_token`
- [ ] Token not expired: Check `expires_at` timestamp
- [ ] User has tenant: Check `tenants` table

### API Call ✅
- [ ] `callAIGateway` imported correctly
- [ ] URL is correct: Check Network tab
- [ ] Headers set: Authorization, apikey, Content-Type
- [ ] Payload valid: Has tenant_id, mode, use_case, input
- [ ] Tenant ID is valid UUID from database

### Testing ✅
- [ ] Diagnostic script passes all tests
- [ ] Test HTML page shows "Success"
- [ ] Network tab shows 200 response
- [ ] Logs show activity: `npx supabase functions logs ai_gateway`
- [ ] Dashboard shows invocations graph going up

---

## 📞 Still Not Working?

### Share This Information:

Run these and share output:

```bash
# 1. List functions
npx supabase functions list

# 2. List secrets
npx supabase secrets list

# 3. Check function file
ls -la supabase/functions/ai_gateway/

# 4. View recent logs
npx supabase functions logs ai_gateway
```

And in browser console:

```javascript
// 5. Check session
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);

// 6. Check env
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20));

// 7. Get tenant
const { data: t } = await supabase.from('tenants').select('tenant_id').limit(1);
console.log('Tenant:', t[0]?.tenant_id);

// 8. Try calling
try {
  const result = await callAIGateway({
    tenant_id: t[0].tenant_id,
    mode: 'chat',
    use_case: 'signal_assistant',
    input: { question: 'Test' }
  });
  console.log('✅ Success:', result);
} catch (err) {
  console.error('❌ Error:', err);
}
```

Also share:
- Screenshot of Network tab (filter: "ai_gateway")
- Screenshot of browser console errors
- Your Supabase project ref (from URL)

---

## 💡 Pro Tips

### Tip 1: Watch Logs While Testing

In one terminal:
```bash
npx supabase functions logs ai_gateway --follow
```

In another terminal/browser, call the function. You'll see activity immediately!

### Tip 2: Use Test Mode

Create a test tenant for diagnostics:

```sql
INSERT INTO tenants (tenant_id, org_name, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test Tenant', 'active');
```

Then use this known tenant ID for testing.

### Tip 3: Add Debug Logging

Temporarily add to `callAIGateway`:

```typescript
console.log('🔍 [callAIGateway] Calling...');
console.log('URL:', url);
console.log('JWT:', accessToken.slice(0, 20));
console.log('Payload:', payload);

const res = await fetch(url, ...);

console.log('Response:', res.status, res.statusText);
```

This will show exactly what's happening.

---

## ✅ Expected Behavior

When everything works:

1. **Call function** in browser
2. **See request** in Network tab (status 200)
3. **See logs** in terminal (`npx supabase functions logs ai_gateway`)
4. **See activity** in Supabase Dashboard → Functions
5. **Get response** with `{ ok: true, output: "..." }`

**All 5 should happen within 2-5 seconds!**

---

## 🎉 Next Steps After It Works

Once you see activity:

1. **Remove debug logging** from `callAIGateway`
2. **Integrate** into your Signal Classification page
3. **Add loading states** and error handling
4. **Test all 4 use cases** (signal_assistant, risk_assistant, exec_summary, mitigation_plan)
5. **Monitor logs** for errors or performance issues

---

**Most likely fix:** `npx supabase functions deploy ai_gateway` 🚀

Try that first!
