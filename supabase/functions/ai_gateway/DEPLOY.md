# AI Gateway - Deployment Instructions

## ✅ Confirmed Structure

```
supabase/functions/ai_gateway/
├── index.ts          ✅ Main Edge Function (Deno-compatible)
├── test.ts           ✅ Test suite
├── README.md         ✅ Documentation
├── QUICK_START.md    ✅ Quick start guide
└── .env.example      ✅ Environment template
```

**Function Name:** `ai_gateway` ✅

## 📋 Pre-Deployment Checklist

### 1. Get Gemini API Key

```bash
# Get your API key from:
# https://makersuite.google.com/app/apikey
```

### 2. Set Secrets in Supabase

```bash
# Set required secret
supabase secrets set GEMINI_API_KEY=your-api-key-here

# Optional: Configure AI models (defaults shown)
supabase secrets set AI_MODEL_CHAT=gemini-1.5-flash
supabase secrets set AI_MODEL_REPORT=gemini-1.5-pro
```

### 3. Verify Supabase Project Link

```bash
# Check if linked
supabase status

# If not linked, link to your project
supabase link --project-ref your-project-id
```

## 🚀 Exact Deploy Command

```bash
supabase functions deploy ai_gateway
```

That's it! The function name is **exactly** `ai_gateway`.

## ✅ Post-Deployment Verification

### 1. Check Function is Deployed

```bash
supabase functions list
```

**Expected output:**
```
  ai_gateway
  ├─ Version: 1
  └─ Status: ACTIVE
```

### 2. View Function Logs

```bash
supabase functions logs ai_gateway --follow
```

### 3. Test the Endpoint

```bash
# Get your project URL and user token first
export PROJECT_ID=your-project-id
export USER_TOKEN=your-jwt-token
export TENANT_ID=your-tenant-uuid

# Test the function
curl -X POST https://${PROJECT_ID}.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "'${TENANT_ID}'",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {
      "signal_type": "test",
      "severity": "low",
      "description": "Testing AI Gateway"
    }
  }'
```

**Expected Response (200 OK):**
```json
{
  "ok": true,
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "mode": "chat",
  "use_case": "signal_assistant",
  "output": "AI-generated analysis..."
}
```

## 🐛 Troubleshooting Deploy Issues

### Issue: "Function not found"

**Solution:** Make sure you're in the project root directory:
```bash
cd /path/to/your/project
supabase functions deploy ai_gateway
```

### Issue: "GEMINI_API_KEY not configured" (after deploy)

**Solution:** Set the secret and redeploy:
```bash
supabase secrets set GEMINI_API_KEY=your-key
supabase functions deploy ai_gateway
```

### Issue: "Project not linked"

**Solution:**
```bash
supabase link --project-ref your-project-id
```

### Issue: "Unauthorized" when testing

**Solution:** Make sure you're using a valid user JWT token:
```bash
# Get token from your app or use Supabase Auth
# Token should be from: supabase.auth.getSession()
```

### Issue: "Access denied to this tenant" (403)

**Solution:** Verify user is a member of the tenant:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM tenant_members 
WHERE tenant_id = 'your-tenant-uuid' 
AND user_id = 'your-user-uuid';

-- If not found, add the user:
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('your-tenant-uuid', 'your-user-uuid', 'admin');
```

## 📊 Monitoring

### View Real-time Logs

```bash
supabase functions logs ai_gateway --follow
```

### View Recent Errors

```bash
supabase functions logs ai_gateway --level error
```

### View Last Hour

```bash
supabase functions logs ai_gateway --since 1h
```

## 🔄 Redeployment

If you make changes to the function:

```bash
# Edit the file
nano supabase/functions/ai_gateway/index.ts

# Redeploy
supabase functions deploy ai_gateway
```

## 📚 Additional Resources

- Full documentation: `/docs/AI_GATEWAY.md`
- Quick start: `./QUICK_START.md`
- Function README: `./README.md`
- Test suite: `./test.ts`

## ✅ Summary

**Exact Command:**
```bash
supabase functions deploy ai_gateway
```

**Function Name:** `ai_gateway` (confirmed ✅)

**Location:** `/supabase/functions/ai_gateway/index.ts` (confirmed ✅)

**Deno-compatible:** Yes (using `jsr:@supabase/supabase-js@2`) ✅

**Import-safe:** Yes (native Deno imports only) ✅
