# AI Gateway - Quick Start

## 🚀 5-Minute Setup

### 1. Get Gemini API Key (2 min)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"**
3. Create or select a project
4. Copy the API key

### 2. Deploy to Supabase (2 min)

```bash
# Set the API key
supabase secrets set GEMINI_API_KEY=<your-api-key>

# Deploy the function
supabase functions deploy ai_gateway
```

### 3. Test It (1 min)

```bash
# Get your user token
export TOKEN=<your-user-jwt-token>

# Call the AI
curl -X POST https://<project-id>.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "<your-tenant-uuid>",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {
      "signal_type": "test",
      "description": "Hello AI!"
    }
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "mode": "chat",
  "use_case": "signal_assistant",
  "output": "AI-generated response..."
}
```

## ✅ That's It!

Your AI Gateway is now live and ready to use.

## 📚 Next Steps

- Read full docs: `/docs/AI_GATEWAY.md`
- See use cases: `/supabase/functions/ai_gateway/README.md`
- Frontend integration: `/docs/AI_GATEWAY_SUMMARY.md`

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY not configured"
```bash
# Set the secret
supabase secrets set GEMINI_API_KEY=<your-key>

# Redeploy
supabase functions deploy ai_gateway
```

### Error: "Access denied to this tenant"
Check that your user is a member of the tenant:
```sql
SELECT * FROM tenant_members 
WHERE tenant_id = '<tenant-uuid>' 
AND user_id = '<user-uuid>';
```

### Error: "Invalid or expired token"
Refresh your session:
```typescript
const { data: { session } } = await supabase.auth.refreshSession();
```

## 📞 Need Help?

- Full documentation: `/docs/AI_GATEWAY.md`
- Function README: `/supabase/functions/ai_gateway/README.md`
- Summary: `/docs/AI_GATEWAY_SUMMARY.md`
