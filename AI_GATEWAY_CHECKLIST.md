# ✅ AI Gateway Activity Checklist

## Why You're Not Seeing Activity

The AI Gateway Edge Function exists in your code, but it may not be **deployed** or **configured** yet.

---

## 🚀 Quick Fix (Most Likely Issues)

### Issue 1: Edge Function Not Deployed ⭐ MOST COMMON

**Check:**
```bash
npx supabase functions list
```

**If `ai_gateway` is NOT in the list**, deploy it:

```bash
cd supabase/functions/ai_gateway
./deploy.sh
```

Or manually:

```bash
npx supabase functions deploy ai_gateway
```

**After deploying, try calling it again!**

---

### Issue 2: Environment Variables Not Set

**Check:**
```bash
npx supabase secrets list
```

**If `GEMINI_API_KEY` is missing**, set it:

```bash
npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
npx supabase secrets set AI_PROVIDER=gemini
npx supabase secrets set AI_MODEL_CHAT=gemini-2.0-flash-exp
npx supabase secrets set AI_MODEL_REPORT=gemini-2.0-flash-exp
```

**Get a Gemini API key:**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Run the command above

---

### Issue 3: User Not Logged In

**Check in browser console:**
```javascript
const { data } = await supabase.auth.getSession();
console.log('Logged in:', !!data.session);
console.log('User:', data.session?.user?.email);
```

**If `false`, sign in first:**
```javascript
await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
});
```

---

### Issue 4: Wrong Tenant ID

Your `callAIGateway` call uses `tenant_id`. Make sure this is a valid UUID from your database:

```javascript
// Get your actual tenant_id from the database
const { data: tenants } = await supabase
  .from('tenants')
  .select('tenant_id')
  .limit(1);

const tenantId = tenants[0].tenant_id;

// Now use this in your call
await callAIGateway({
  tenant_id: tenantId,  // Use REAL tenant ID
  mode: "chat",
  use_case: "signal_assistant",
  input: { question: "Test" }
});
```

---

## 🔍 Diagnostic Steps

### Step 1: Run Diagnostic Script

Open browser DevTools console and paste:

```javascript
// Copy the entire content of /scripts/diagnose-ai-gateway.js
// Then run:
diagnoseAIGateway()
```

This will test:
- ✅ Supabase client
- ✅ Environment variables
- ✅ Authentication
- ✅ CORS
- ✅ Edge Function

---

### Step 2: Test Edge Function Directly

In browser console:

```javascript
// 1. Get session
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

// 2. Test Edge Function
const res = await fetch(
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/ai_gateway',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': 'YOUR-ANON-KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: 'YOUR-TENANT-UUID',
      mode: 'chat',
      use_case: 'signal_assistant',
      input: { question: 'Test' }
    })
  }
);

console.log('Status:', res.status);
console.log('Response:', await res.text());
```

**Expected:** Status 200, with AI response  
**If 404:** Function not deployed  
**If 401:** Not logged in or JWT invalid  
**If 500:** Check logs (see Step 3)

---

### Step 3: Check Logs

```bash
# Watch logs in real-time
npx supabase functions logs ai_gateway --follow

# Then call the function from browser
# You should see activity in the logs
```

**If you see logs:** ✅ Function is being called! Check for errors in output.  
**If you see nothing:** ❌ Request not reaching function.

---

### Step 4: Verify Project Configuration

Check `.env.local` (or `.env`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Make sure these match your Supabase project.

---

## 📋 Complete Checklist

Work through this list:

### Deployment

- [ ] Edge Function exists: `ls supabase/functions/ai_gateway/index.ts`
- [ ] Edge Function deployed: `npx supabase functions list` (should show `ai_gateway`)
- [ ] Secrets configured: `npx supabase secrets list` (should show `GEMINI_API_KEY`)

### Configuration

- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Environment variables accessible: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`

### Authentication

- [ ] User is signed in: `await supabase.auth.getSession()` returns session
- [ ] JWT token exists: Session has `access_token`
- [ ] User has tenant: Check `tenants` table for user's tenant

### API Call

- [ ] `callAIGateway` function exists: Check `/lib/callAIGateway.ts`
- [ ] URL is correct: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`
- [ ] Headers are set: Authorization, apikey, Content-Type
- [ ] Payload is valid: Has tenant_id, mode, use_case, input

### Testing

- [ ] Diagnostic script passes all tests
- [ ] Direct fetch test returns 200
- [ ] Logs show activity: `npx supabase functions logs ai_gateway`
- [ ] Network tab shows request/response

---

## 🎯 Most Likely Solution

**90% of the time, it's one of these:**

### 1. Function Not Deployed (70%)

```bash
npx supabase functions deploy ai_gateway
```

### 2. User Not Logged In (15%)

```javascript
// Check in console
const { data } = await supabase.auth.getSession();
console.log(data.session); // Should not be null
```

### 3. Environment Variables Wrong (10%)

```javascript
// Check in console
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### 4. Tenant ID Invalid (5%)

```javascript
// Get valid tenant from database
const { data } = await supabase.from('tenants').select('tenant_id').limit(1);
console.log('Use this tenant_id:', data[0].tenant_id);
```

---

## 🆘 Still Not Working?

Run these commands and share the output:

```bash
# 1. Check function exists
ls -la supabase/functions/ai_gateway/

# 2. Check deployments
npx supabase functions list

# 3. Check secrets
npx supabase secrets list

# 4. Check logs (keep this running, then try calling the function)
npx supabase functions logs ai_gateway --follow
```

Then in browser console:

```javascript
// 5. Check auth
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);

// 6. Check env vars
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20));

// 7. Try calling
await callAIGateway({
  tenant_id: 'YOUR-TENANT-ID',
  mode: 'chat',
  use_case: 'signal_assistant',
  input: { question: 'Test' }
});
```

Share:
1. Terminal output from commands above
2. Browser console output
3. Network tab screenshot (DevTools → Network → filter "ai_gateway")

I'll help you debug further!

---

## ✅ Success Indicators

You'll know it's working when:

1. **Supabase Dashboard** → Functions → ai_gateway shows recent invocations
2. **Logs** show requests: `npx supabase functions logs ai_gateway`
3. **Network tab** shows 200 response from `ai_gateway`
4. **Console** shows AI response with `output` field
5. **No errors** in browser console

---

**Next:** Run the diagnostic script and let me know what fails!
