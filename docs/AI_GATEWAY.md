# AI Gateway Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [API Reference](#api-reference)
5. [Use Cases](#use-cases)
6. [Security](#security)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## Overview

The AI Gateway is a secure Edge Function that provides multi-tenant AI capabilities powered by Google Gemini. It supports both conversational chat and structured report generation.

### Key Features

- ✅ **Multi-tenant isolation** - User must belong to tenant to access AI
- ✅ **Dual modes** - Chat for conversations, Report for documents
- ✅ **Multiple use cases** - Signal analysis, risk assessment, summaries, mitigation plans
- ✅ **Context-aware** - Supports site, asset, and risk scoping
- ✅ **Secure** - JWT authentication + tenant authorization
- ✅ **Production-ready** - Error handling, logging, CORS support

## Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ POST /functions/v1/ai_gateway
       │ Authorization: Bearer <jwt>
       ▼
┌─────────────────────────────────────┐
│    AI Gateway Edge Function         │
│  ┌───────────────────────────────┐  │
│  │ 1. Extract JWT from header    │  │
│  │ 2. Verify with Supabase Auth  │  │
│  │ 3. Get user ID from token     │  │
│  │ 4. Check tenant_members table │  │
│  │ 5. Build prompt for use case  │  │
│  │ 6. Call Gemini API            │  │
│  │ 7. Return structured response │  │
│  └───────────────────────────────┘  │
└─────────────┬───────────────────────┘
              │
              ├──▶ Supabase Auth (verify JWT)
              │
              ├──▶ PostgreSQL (check tenant_members)
              │
              └──▶ Gemini API (generate content)
```

## Setup

### Prerequisites

1. **Supabase Project** - With auth and database configured
2. **Gemini API Key** - From [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Supabase CLI** - For deployment

### Step 1: Get Gemini API Key

```bash
# 1. Go to https://makersuite.google.com/app/apikey
# 2. Create or select a project
# 3. Click "Get API Key"
# 4. Copy the key
```

### Step 2: Set Environment Variables

```bash
# Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets
supabase secrets set GEMINI_API_KEY=<your-api-key>

# Optional: Customize models
supabase secrets set AI_MODEL_CHAT=gemini-1.5-flash
supabase secrets set AI_MODEL_REPORT=gemini-1.5-pro
```

### Step 3: Deploy Edge Function

```bash
# Deploy to Supabase
supabase functions deploy ai_gateway
```

### Step 4: Verify Deployment

```bash
# Test endpoint (replace with your values)
curl -X POST https://<project-id>.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer <user-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "<tenant-uuid>",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {"test": "Hello AI"}
  }'
```

## API Reference

### Endpoint

```
POST /functions/v1/ai_gateway
```

### Headers

```http
Authorization: Bearer <user-jwt-token>    # Required
Content-Type: application/json            # Required
```

### Request Body

```typescript
{
  tenant_id: string;           // Required: UUID of tenant
  mode: 'chat' | 'report';     // Required: Chat or report mode
  use_case: string;            // Required: See use cases below
  input: Record<string, any>;  // Required: Use case-specific data
  context?: {                  // Optional: Additional scoping
    site_id?: string;
    asset_id?: string;
    risk_id?: string;
  }
}
```

### Response (Success)

```typescript
{
  ok: true;
  provider: 'gemini';
  model: string;               // e.g., "gemini-1.5-flash"
  mode: 'chat' | 'report';
  use_case: string;
  output: string;              // AI-generated text
  structured?: object;         // Only for report mode
}
```

### Response (Error)

```typescript
{
  ok: false;
  error: string;               // Human-readable error
  code: string;                // Error code
  details?: string;            // Additional details
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User not member of tenant |
| `INVALID_REQUEST` | 400 | Invalid request body |
| `METHOD_NOT_ALLOWED` | 405 | Non-POST request |
| `AI_ERROR` | 500 | Gemini API failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Use Cases

### 1. Signal Assistant

Analyzes security signals and provides insights.

**When to use:** Real-time signal analysis, threat detection

**Input schema:**
```typescript
{
  signal_type: string;         // e.g., "unauthorized_access"
  severity: string;            // e.g., "high", "medium", "low"
  source: string;              // e.g., "firewall_logs"
  description: string;         // Human-readable description
  // Additional signal-specific fields
}
```

**Example:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "chat",
  "use_case": "signal_assistant",
  "input": {
    "signal_type": "unauthorized_access",
    "severity": "high",
    "source": "firewall_logs",
    "ip_address": "192.168.1.100",
    "attempts": 15,
    "timestamp": "2024-12-26T10:30:00Z"
  },
  "context": {
    "site_id": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

### 2. Risk Assistant

Analyzes risks and provides recommendations.

**When to use:** Risk assessment, control evaluation, remediation guidance

**Input schema:**
```typescript
{
  risk_title: string;
  likelihood: number;          // 1-5
  impact: number;              // 1-5
  current_controls: string[];
  // Additional risk-specific fields
}
```

**Example:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "chat",
  "use_case": "risk_assistant",
  "input": {
    "risk_title": "Unpatched SCADA system",
    "likelihood": 4,
    "impact": 5,
    "current_controls": [
      "Network segmentation",
      "IDS monitoring",
      "Access logging"
    ],
    "assets_affected": 12,
    "last_patch_date": "2023-01-15"
  },
  "context": {
    "site_id": "660e8400-e29b-41d4-a716-446655440001",
    "risk_id": "770e8400-e29b-41d4-a716-446655440002"
  }
}
```

### 3. Executive Summary

Generates executive-level summaries.

**When to use:** Board reports, quarterly reviews, management briefings

**Input schema:**
```typescript
{
  period: string;              // e.g., "Q1 2024"
  total_risks: number;
  critical_risks: number;
  mitigated_risks: number;
  top_threats: string[];
  // Additional metrics
}
```

**Example:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "report",
  "use_case": "exec_summary",
  "input": {
    "period": "Q1 2024",
    "total_risks": 42,
    "critical_risks": 8,
    "high_risks": 15,
    "medium_risks": 12,
    "low_risks": 7,
    "mitigated_risks": 15,
    "new_risks": 6,
    "top_threats": [
      "Ransomware",
      "Insider threat",
      "Supply chain attacks"
    ],
    "budget_spent": 125000,
    "incidents": 3
  }
}
```

### 4. Mitigation Plan

Generates detailed mitigation plans.

**When to use:** Risk treatment, action planning, resource allocation

**Input schema:**
```typescript
{
  risk_title: string;
  likelihood: number;
  impact: number;
  budget?: number;
  timeline?: string;
  // Additional planning fields
}
```

**Example:**
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
    "current_score": 20,
    "target_score": 8,
    "budget": 50000,
    "timeline": "6 months",
    "constraints": [
      "Cannot replace PLCs during production",
      "Must maintain OT-IT segmentation"
    ]
  },
  "context": {
    "risk_id": "770e8400-e29b-41d4-a716-446655440002",
    "site_id": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

## Security

### Authentication Flow

```
1. User logs in → Supabase Auth creates JWT
2. Frontend includes JWT in Authorization header
3. Edge Function extracts Bearer token
4. Edge Function calls supabase.auth.getUser(token)
5. Supabase validates JWT signature and expiration
6. Edge Function receives user.id from validated token
```

### Authorization Flow

```
7. Edge Function queries database:
   SELECT 1 FROM tenant_members 
   WHERE tenant_id = $1 AND user_id = $2
8. If row found → User is member → Allow request
9. If no row → User not member → 403 Forbidden
```

### Multi-Tenant Isolation

- ✅ Every request must specify `tenant_id`
- ✅ User's membership verified via database query
- ✅ RLS policies on `tenant_members` table
- ✅ User cannot access AI for other tenants
- ✅ Context (site_id, risk_id) must belong to tenant

### Secrets Management

- ✅ `GEMINI_API_KEY` stored in Supabase secrets
- ✅ Never exposed to frontend
- ✅ Only accessible by Edge Function
- ✅ Rotatable without code changes

### Best Practices

1. **Always use user's JWT** - Never use service role key from frontend
2. **Validate context IDs** - Ensure site_id/risk_id belong to tenant
3. **Rate limiting** - Implement per-tenant quotas if needed
4. **Audit logging** - Log AI requests for compliance
5. **Content filtering** - Sanitize user input before sending to AI

## Frontend Integration

### TypeScript Client

```typescript
// /lib/ai-gateway.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AIRequest {
  tenant_id: string;
  mode: 'chat' | 'report';
  use_case: 'signal_assistant' | 'risk_assistant' | 'exec_summary' | 'mitigation_plan';
  input: Record<string, unknown>;
  context?: {
    site_id?: string;
    asset_id?: string;
    risk_id?: string;
  };
}

export interface AIResponse {
  ok: true;
  provider: string;
  model: string;
  mode: string;
  use_case: string;
  output: string;
  structured?: Record<string, unknown>;
}

export interface AIError {
  ok: false;
  error: string;
  code: string;
  details?: string;
}

export async function callAIGateway(
  request: AIRequest
): Promise<AIResponse> {
  // Get user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Call AI Gateway
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_gateway`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as AIError;
    throw new Error(error.error || 'AI request failed');
  }

  return data as AIResponse;
}
```

### React Hook

```typescript
// /hooks/useAIGateway.ts

import { useState } from 'react';
import { callAIGateway, AIRequest, AIResponse } from '@/lib/ai-gateway';

export function useAIGateway() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const execute = async (request: AIRequest) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await callAIGateway(request);
      setResponse(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, response };
}
```

### Component Example

```typescript
// /components/SignalAssistant.tsx

import { useState } from 'react';
import { useAIGateway } from '@/hooks/useAIGateway';
import { useTenant } from '@/hooks/useTenant';

export function SignalAssistant({ signal }: { signal: Signal }) {
  const { tenant } = useTenant();
  const { execute, loading, error, response } = useAIGateway();
  const [analysis, setAnalysis] = useState('');

  const analyzeSignal = async () => {
    if (!tenant) return;

    const result = await execute({
      tenant_id: tenant.id,
      mode: 'chat',
      use_case: 'signal_assistant',
      input: {
        signal_type: signal.type,
        severity: signal.severity,
        source: signal.source,
        description: signal.description,
      },
      context: {
        site_id: signal.site_id,
      },
    });

    setAnalysis(result.output);
  };

  return (
    <div>
      <button 
        onClick={analyzeSignal} 
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Signal'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {analysis && (
        <div className="analysis">
          <h3>AI Analysis</h3>
          <p>{analysis}</p>
          <small>Powered by {response?.model}</small>
        </div>
      )}
    </div>
  );
}
```

## Testing

### Local Testing

```bash
# 1. Start Supabase locally
supabase start

# 2. Create .env.local file
cat > .env.local << EOF
GEMINI_API_KEY=your-api-key
AI_MODEL_CHAT=gemini-1.5-flash
AI_MODEL_REPORT=gemini-1.5-pro
EOF

# 3. Run function locally
supabase functions serve ai_gateway --env-file .env.local

# 4. Test with curl
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

### Automated Tests

```bash
# Run test suite
export TEST_AUTH_TOKEN=<user-jwt-token>
export TEST_TENANT_ID=<tenant-uuid>
deno test --allow-net --allow-env supabase/functions/ai_gateway/test.ts
```

### Manual Testing Checklist

- [ ] CORS preflight works (OPTIONS request)
- [ ] Missing auth returns 401
- [ ] Invalid tenant returns 403
- [ ] Invalid request body returns 400
- [ ] Chat mode returns response
- [ ] Report mode returns response with structured data
- [ ] All use cases work
- [ ] Error messages are clear
- [ ] Response time < 10s for chat
- [ ] Response time < 30s for report

## Deployment

### Production Deployment

```bash
# 1. Link to your Supabase project
supabase link --project-ref <project-id>

# 2. Set secrets
supabase secrets set GEMINI_API_KEY=<your-key>
supabase secrets set AI_MODEL_CHAT=gemini-1.5-flash
supabase secrets set AI_MODEL_REPORT=gemini-1.5-pro

# 3. Deploy function
supabase functions deploy ai_gateway

# 4. Verify deployment
supabase functions list
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy AI Gateway

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/ai_gateway/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy to Supabase
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase functions deploy ai_gateway
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Monitoring

```bash
# View real-time logs
supabase functions logs ai_gateway --follow

# View recent errors
supabase functions logs ai_gateway --level error

# View specific time range
supabase functions logs ai_gateway --since 1h
```

## Troubleshooting

### Issue: "GEMINI_API_KEY not configured"

**Cause:** Secret not set or function not redeployed after setting

**Solution:**
```bash
supabase secrets set GEMINI_API_KEY=<your-key>
supabase functions deploy ai_gateway
```

### Issue: "Access denied to this tenant"

**Cause:** User not member of tenant

**Solution:** Verify membership in database:
```sql
SELECT * FROM tenant_members 
WHERE tenant_id = '<tenant-id>' 
AND user_id = '<user-id>';
```

Add membership if needed:
```sql
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('<tenant-id>', '<user-id>', 'member');
```

### Issue: "Invalid or expired token"

**Cause:** JWT expired or malformed

**Solution:** Refresh session in frontend:
```typescript
const { data: { session } } = await supabase.auth.refreshSession();
```

### Issue: "Gemini API error: 429"

**Cause:** Rate limit exceeded

**Solution:**
1. Implement exponential backoff
2. Add request queuing
3. Consider upgrading Gemini API quota

### Issue: Slow responses

**Possible causes:**
- Large input size
- Complex use case
- Using gemini-1.5-pro for chat

**Solutions:**
- Use gemini-1.5-flash for faster responses
- Reduce input size
- Implement response caching
- Consider streaming (future feature)

### Issue: Empty or truncated output

**Cause:** Token limit exceeded

**Solution:**
- Reduce input size
- Split into multiple requests
- Use gemini-1.5-pro (higher token limit)

## Performance Optimization

### Caching Strategy

```typescript
// Example: Cache common requests
const cache = new Map<string, { data: AIResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function callAIGatewayCached(request: AIRequest): Promise<AIResponse> {
  const cacheKey = JSON.stringify(request);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await callAIGateway(request);
  cache.set(cacheKey, { data: response, timestamp: Date.now() });
  
  return response;
}
```

### Request Queuing

```typescript
// Example: Queue to prevent overwhelming API
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 3 });

async function callAIGatewayQueued(request: AIRequest): Promise<AIResponse> {
  return queue.add(() => callAIGateway(request));
}
```

## Roadmap

### Near-term (Q1 2025)
- [ ] Streaming responses for chat mode
- [ ] Token usage tracking
- [ ] Per-tenant rate limiting
- [ ] Request/response logging to database

### Medium-term (Q2 2025)
- [ ] OpenAI provider support
- [ ] Claude provider support
- [ ] Custom system prompts per tenant
- [ ] Fine-tuned models per use case

### Long-term (Q3+ 2025)
- [ ] Multi-modal support (images, PDFs)
- [ ] Vector embeddings for context
- [ ] Conversational memory
- [ ] Auto-suggest use cases

## Support

- **Documentation:** This file
- **Function README:** `/supabase/functions/ai_gateway/README.md`
- **Test Suite:** `/supabase/functions/ai_gateway/test.ts`
- **GitHub Issues:** Report bugs and feature requests
- **Email:** support@otcontinuum.com

---

**Last Updated:** December 26, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
