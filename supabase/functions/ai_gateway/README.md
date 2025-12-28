# AI Gateway Edge Function

## Overview

The AI Gateway is a Supabase Edge Function that provides secure, multi-tenant access to AI capabilities powered by Google Gemini.

## Features

- ✅ **Multi-tenant authorization** - Verifies user belongs to requested tenant
- ✅ **Chat mode** - Conversational AI for assistants
- ✅ **Report mode** - Structured document generation
- ✅ **Context-aware** - Supports site, asset, and risk scoping
- ✅ **Multiple use cases** - Signal assistant, risk assistant, exec summaries, mitigation plans

## Endpoint

```
POST /functions/v1/ai_gateway
```

## Authentication

Requires JWT Bearer token from Supabase Auth:

```http
Authorization: Bearer <user-access-token>
```

## Request Format

```typescript
{
  "tenant_id": "uuid",                // Required: Tenant ID to scope request
  "mode": "chat" | "report",          // Required: Chat or report generation
  "use_case": "signal_assistant"      // Required: Use case (see below)
            | "risk_assistant"
            | "exec_summary"
            | "mitigation_plan",
  "input": {                          // Required: Use case-specific input
    // Any JSON object
  },
  "context": {                        // Optional: Additional scoping
    "site_id": "uuid",
    "asset_id": "uuid",
    "risk_id": "uuid"
  }
}
```

## Response Format

### Success Response (200 OK)

```typescript
{
  "ok": true,
  "provider": "gemini",
  "model": "gemini-1.5-flash",       // or gemini-1.5-pro
  "mode": "chat",                     // or "report"
  "use_case": "signal_assistant",
  "output": "AI-generated text...",
  "structured": {                     // Only for report mode
    // Extracted JSON if available
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "details": "Missing or invalid Authorization header"
}
```

#### 403 Forbidden
```json
{
  "ok": false,
  "error": "Access denied to this tenant",
  "code": "FORBIDDEN",
  "details": "User abc123 does not have access to tenant xyz789"
}
```

#### 400 Bad Request
```json
{
  "ok": false,
  "error": "Invalid request body",
  "code": "INVALID_REQUEST",
  "details": "tenant_id is required and must be a string"
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Failed to generate AI response",
  "code": "AI_ERROR",
  "details": "Gemini API error: 429 Rate limit exceeded"
}
```

## Use Cases

### 1. Signal Assistant
Analyzes security signals and provides insights.

**Example Request:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "chat",
  "use_case": "signal_assistant",
  "input": {
    "signal_type": "unauthorized_access",
    "severity": "high",
    "source": "firewall_logs",
    "description": "Multiple failed login attempts from 192.168.1.100"
  }
}
```

### 2. Risk Assistant
Analyzes risks and provides recommendations.

**Example Request:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "chat",
  "use_case": "risk_assistant",
  "input": {
    "risk_title": "Unpatched SCADA system",
    "likelihood": 4,
    "impact": 5,
    "current_controls": ["Network segmentation", "IDS monitoring"]
  },
  "context": {
    "site_id": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

### 3. Executive Summary
Generates executive-level summaries.

**Example Request:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "report",
  "use_case": "exec_summary",
  "input": {
    "period": "Q1 2024",
    "total_risks": 42,
    "critical_risks": 8,
    "mitigated_risks": 15,
    "top_threats": ["Ransomware", "Insider threat", "Supply chain"]
  }
}
```

### 4. Mitigation Plan
Generates detailed mitigation plans.

**Example Request:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "report",
  "use_case": "mitigation_plan",
  "input": {
    "risk_id": "770e8400-e29b-41d4-a716-446655440002",
    "risk_title": "Legacy PLC vulnerabilities",
    "likelihood": 4,
    "impact": 5,
    "budget": 50000,
    "timeline": "6 months"
  },
  "context": {
    "risk_id": "770e8400-e29b-41d4-a716-446655440002"
  }
}
```

## Configuration

### Environment Variables

Set these in your Supabase project:

```bash
# Required
GEMINI_API_KEY=<your-gemini-api-key>

# Optional (defaults shown)
AI_MODEL_CHAT=gemini-1.5-flash      # Fast, conversational model
AI_MODEL_REPORT=gemini-1.5-pro      # Powerful model for reports
```

### Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Create or select a project
4. Copy the API key
5. Add to Supabase:
   ```bash
   supabase secrets set GEMINI_API_KEY=<your-key>
   ```

## Security

### Authorization Flow

```
1. Client sends request with JWT Bearer token
   ↓
2. Edge function extracts token from Authorization header
   ↓
3. Verifies token with Supabase Auth
   ↓
4. Extracts user ID from verified token
   ↓
5. Queries tenant_members table:
   SELECT 1 FROM tenant_members 
   WHERE tenant_id = $tenant_id 
   AND user_id = $user_id
   ↓
6. If found → Allow request
   If not found → 403 Forbidden
```

### Multi-Tenant Isolation

- Every request must specify `tenant_id`
- User's membership is verified via `tenant_members` table
- RLS policies enforce data isolation
- User cannot access AI for tenants they don't belong to

### Secrets Management

- `GEMINI_API_KEY` stored in Supabase secrets (not in code)
- Never exposed to frontend
- Only accessible by Edge Function
- Rotatable via `supabase secrets set`

## Deployment

### Deploy Function

```bash
# Deploy to Supabase
supabase functions deploy ai_gateway

# Set secrets
supabase secrets set GEMINI_API_KEY=<your-key>
supabase secrets set AI_MODEL_CHAT=gemini-1.5-flash
supabase secrets set AI_MODEL_REPORT=gemini-1.5-pro
```

### Verify Deployment

```bash
# Test endpoint
curl -X POST https://<project-id>.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {"test": "data"}
  }'
```

### Local Testing

```bash
# Start Supabase locally
supabase start

# Set local secrets
echo "GEMINI_API_KEY=<your-key>" > .env.local

# Run function locally
supabase functions serve ai_gateway --env-file .env.local

# Test locally
curl -X POST http://localhost:54321/functions/v1/ai_gateway \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {"test": "data"}
  }'
```

## Frontend Integration

### TypeScript Example

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function callAIGateway(
  tenantId: string,
  mode: 'chat' | 'report',
  useCase: string,
  input: Record<string, unknown>
) {
  // Get user's access token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Call AI Gateway
  const response = await fetch(
    `${process.env.SUPABASE_URL}/functions/v1/ai_gateway`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        mode,
        use_case: useCase,
        input,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }

  return await response.json();
}

// Usage
const result = await callAIGateway(
  'my-tenant-id',
  'chat',
  'signal_assistant',
  { signal_type: 'unauthorized_access' }
);

console.log('AI Response:', result.output);
```

### React Hook Example

```typescript
import { useState } from 'react';
import { useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';

export function useAIGateway() {
  const supabase = useSupabaseClient();
  const { session } = useSessionContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAI = async (
    tenantId: string,
    mode: 'chat' | 'report',
    useCase: string,
    input: Record<string, unknown>
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            mode,
            use_case: useCase,
            input,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI request failed');
      }

      return await response.json();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { callAI, loading, error };
}
```

## Troubleshooting

### Error: "GEMINI_API_KEY not configured"

**Solution:**
```bash
supabase secrets set GEMINI_API_KEY=<your-key>
```

### Error: "Access denied to this tenant"

**Cause:** User is not a member of the requested tenant.

**Solution:** Verify the user has a record in `tenant_members` table:
```sql
SELECT * FROM tenant_members 
WHERE tenant_id = '<tenant-id>' 
AND user_id = '<user-id>';
```

### Error: "Invalid or expired token"

**Cause:** JWT token is expired or invalid.

**Solution:** Refresh the user's session:
```typescript
const { data: { session } } = await supabase.auth.refreshSession();
```

### Error: "Gemini API error: 429"

**Cause:** Rate limit exceeded.

**Solution:** Implement request queuing or use exponential backoff retry logic.

### High Latency

**Cause:** Large prompts or complex requests.

**Solutions:**
- Use `gemini-1.5-flash` for faster responses
- Reduce input size
- Cache frequently requested content
- Consider streaming responses (future enhancement)

## Monitoring

### Logs

View function logs in Supabase Dashboard:
```bash
# Or via CLI
supabase functions logs ai_gateway
```

### Key Metrics

- Request volume by use_case
- Average response time by mode
- Error rate by error code
- Token usage (if tracking enabled)

### Example Log Queries

```
# Find failed requests
error.code:AI_ERROR

# Find unauthorized attempts
error.code:FORBIDDEN

# Find slow requests
duration:>5000
```

## Roadmap

- [ ] Streaming responses for chat mode
- [ ] Token usage tracking and quotas
- [ ] Caching layer for common queries
- [ ] Support for additional AI providers (OpenAI, Claude)
- [ ] Custom system prompts per tenant
- [ ] Fine-tuned models per use case
- [ ] Rate limiting per tenant
- [ ] Request/response logging to database

## Support

- GitHub Issues: [Report a bug](https://github.com/your-org/ot-continuum/issues)
- Documentation: `/docs/AI_GATEWAY.md`
- Email: support@otcontinuum.com
