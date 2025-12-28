# Supabase Edge Functions - OT Continuum

**Production-Ready Edge Functions matching OpenAPI Contract**

---

## Overview

This directory contains Supabase Edge Functions that implement the OT Continuum API, matching the OpenAPI specification in `/api/openapi/main.yaml`.

### Edge Functions

| Function | Endpoints | Description |
|----------|-----------|-------------|
| **signals** | `/signals`, `/signals/batch` | Signal ingestion and retrieval |
| **risk** | `/risks`, `/risks/:id`, `/risks/:id/events` | Risk register management |
| **workflow** | `/workflows`, `/work-items` | Workflow definitions and work items |
| **billing** | `/billing/account`, `/billing/invoices` | Billing and invoicing (admin only) |
| **notify** | `/notifications` | User notifications |
| **ai_gateway** | `/ai_gateway` | AI-powered chat and reports (Gemini) |

### Shared Library

| Module | Purpose |
|--------|---------|
| `_shared/auth.ts` | JWT claims parsing, authentication, authorization |
| `_shared/response.ts` | Standardized response envelopes, error handling |
| `_shared/validation.ts` | Input validation helpers |
| `_shared/database.ts` | Database helpers, audit trails |

---

## Architecture

### Request Flow

```
Client Request
    ↓
Edge Function (Deno)
    ↓
1. Parse JWT claims from Authorization header
2. Validate tenant_id and role
3. Validate input (zod-style validation)
4. Apply multi-tenant filters
5. Execute database query (Supabase client)
6. Add audit trail (for risk/workflow changes)
7. Return standardized response envelope
```

### Response Envelope

All responses follow a consistent format:

```typescript
// Success Response
{
  "data": <resource or array>,
  "error": null,
  "request_id": "uuid"
}

// Error Response
{
  "data": null,
  "error": {
    "code": "NOT_AUTHENTICATED | NOT_AUTHORIZED | NOT_FOUND | VALIDATION_ERROR | CONFLICT | INTERNAL",
    "message": "Human-readable error message",
    "details": <optional additional info>
  },
  "request_id": "uuid"
}

// Paginated Response
{
  "data": [<resources>],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  },
  "error": null,
  "request_id": "uuid"
}
```

---

## Multi-Tenant Enforcement

### JWT Claims

Every request requires a Bearer token with these claims:

```typescript
{
  "sub": "user-uuid",           // User ID
  "tenant_id": "tenant-uuid",   // Tenant ID (NEVER trust from client)
  "role": "admin | manager | operator | viewer | auditor | contributor | billing_admin",
  "site_ids": ["site-uuid", ...] | null  // Accessible sites (null = all sites)
}
```

### Tenant Isolation

✅ **CRITICAL**: Tenant ID is ALWAYS extracted from JWT claims, NEVER from request body

```typescript
// ❌ WRONG - Never trust client input
const tenantId = req.body.tenant_id;

// ✅ CORRECT - Always from JWT
const auth = requireAuth(req);
const tenantId = auth.tenantId;
```

All database queries are filtered by `tenant_id`:

```typescript
const { data } = await supabase
  .from('risks')
  .select('*')
  .eq('tenant_id', auth.tenantId)  // Always filter by JWT tenant
  .eq('site_id', siteId);
```

---

## Authentication & Authorization

### Role-Based Access Control (RBAC)

| Role | Access Level | Use Cases |
|------|--------------|-----------|
| `admin` | Full tenant access, bypass site restrictions | System administration |
| `billing_admin` | Billing data read-only | Finance team |
| `manager` | Multi-site access, create workflows | Operations management |
| `operator` | Site-scoped access, manage risks | Site operators |
| `contributor` | Site-scoped access, create signals | Field technicians |
| `viewer` | Site-scoped read-only | Read-only stakeholders |
| `auditor` | Full tenant read-only (compliance) | Audit/compliance team |

### Site Scoping

Users are restricted to specific sites via `site_ids` claim:

```typescript
// Admin/Auditor: null site_ids = access to all sites
if (auth.role === 'admin' || auth.role === 'auditor') {
  // No site filter
}

// User with specific site access
if (auth.siteIds && auth.siteIds.length > 0) {
  query = query.in('site_id', auth.siteIds);
}

// User with no site access
if (auth.siteIds && auth.siteIds.length === 0) {
  // Return empty results
}
```

### MS2 Requirement: Ownership Bypass

**Critical for risks and work items**: Owners can ALWAYS see/update their resources, even if they don't have site access.

```typescript
// Example: Risk ownership bypass
if (auth.role !== 'admin' && auth.role !== 'auditor') {
  if (auth.siteIds && auth.siteIds.length > 0) {
    // Can see risks at their sites OR risks they own
    query = query.or(
      `site_id.in.(${auth.siteIds.join(',')}),owner_id.eq.${auth.userId}`
    );
  } else {
    // No site access, only see risks they own
    query = query.eq('owner_id', auth.userId);
  }
}
```

---

## Validation

### Input Validation Pattern

```typescript
import { validateInput, validationRules } from '../_shared/validation.ts';

const risk = validateInput(body, {
  required: ['site_id', 'risk_id', 'title', 'severity', 'likelihood', 'owner_id'],
  optional: ['description', 'decision', 'decision_rationale'],
  rules: {
    site_id: validationRules.uuid,
    risk_id: validationRules.minLength(1),
    severity: validationRules.enum(['catastrophic', 'major', 'moderate', 'minor', 'negligible']),
    likelihood: validationRules.enum(['almost_certain', 'likely', 'possible', 'unlikely', 'rare']),
    owner_id: validationRules.uuid,
    decision: validationRules.enum(['accept', 'mitigate', 'transfer', 'avoid', 'under_review'])
  }
});
```

### Built-in Validation Rules

```typescript
validationRules.uuid(value)                    // Valid UUID format
validationRules.email(value)                   // Valid email format
validationRules.minLength(min)(value)          // Minimum string length
validationRules.maxLength(max)(value)          // Maximum string length
validationRules.enum(allowed)(value)           // Value in enum
validationRules.range(min, max)(value)         // Number in range
validationRules.positive(value)                // Positive number
validationRules.url(value)                     // Valid URL
```

---

## Audit Trails

### Risk Events (Audit Trail)

Every risk score change or decision change creates a `risk_event` record:

```typescript
await createRiskEvent(supabase, {
  tenant_id: auth.tenantId,
  risk_id: riskId,
  event_type: 'score_changed',
  severity: newSeverity,
  likelihood: newLikelihood,
  risk_score: newRiskScore,
  previous_severity: existingRisk.severity,
  previous_likelihood: existingRisk.likelihood,
  previous_risk_score: existingRisk.risk_score,
  notes: `Risk score changed from ${existingRisk.risk_score} to ${newRiskScore}`,
  triggered_by: auth.userId
});
```

### Work Item Audit Trail

Work items store audit trail in JSONB `audit_trail` column:

```typescript
const auditTrail = existingItem.audit_trail || [];
auditTrail.push({
  timestamp: new Date().toISOString(),
  user_id: auth.userId,
  action: 'updated',
  changes: updates
});
```

---

## Error Codes

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_AUTHENTICATED` | 401 | Missing or invalid Bearer token |
| `NOT_AUTHORIZED` | 403 | Insufficient permissions for operation |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists (duplicate) |
| `BAD_REQUEST` | 400 | Malformed request |
| `INTERNAL` | 500 | Server error |

### Error Response Example

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "severity",
          "message": "Must be one of: catastrophic, major, moderate, minor, negligible"
        },
        {
          "field": "owner_id",
          "message": "Must be a valid UUID"
        }
      ]
    }
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Edge Function Details

### 1. Signals (`/supabase/functions/signals/index.ts`)

**Endpoints:**
- `GET /signals` - List signals (site-scoped)
- `POST /signals` - Create single signal (contributor+)
- `POST /signals/batch` - Batch create signals (up to 1000)

**Key Features:**
- Site scoping enforced
- Batch processing with error handling
- Contributor role can ingest signals
- Automatic timestamps (measured_at, received_at)

**Example:**
```bash
# Create signal
curl -X POST https://project.supabase.co/functions/v1/make-server-fb677d93/signals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "uuid",
    "signal_type": "sensor",
    "source": "temperature_sensor_01",
    "value": 85.5,
    "unit": "celsius",
    "measured_at": "2024-12-22T10:00:00Z"
  }'
```

---

### 2. Risk (`/supabase/functions/risk/index.ts`)

**Endpoints:**
- `GET /risks` - List risks (ownership bypass)
- `POST /risks` - Create risk (contributor+)
- `GET /risks/:id` - Get risk details
- `PATCH /risks/:id` - Update risk (owner or admin)
- `GET /risks/:id/events` - Get risk event history

**Key Features:**
- **MS2**: Owner can ALWAYS see/update their risks
- **MS2**: `owner_id` is required (NOT NULL)
- **MS2**: Decision requires rationale (except under_review)
- Auto-calculated risk score (severity × likelihood)
- Audit trail via risk_events table
- Decision tracking (date, user, rationale)

**Example:**
```bash
# Create risk
curl -X POST https://project.supabase.co/functions/v1/make-server-fb677d93/risks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "uuid",
    "risk_id": "RISK-001",
    "title": "High temperature alarm",
    "description": "Temperature exceeding safe limits",
    "severity": "major",
    "likelihood": "likely",
    "owner_id": "uuid",
    "decision": "mitigate",
    "decision_rationale": "Install cooling system"
  }'
```

---

### 3. Workflow (`/supabase/functions/workflow/index.ts`)

**Endpoints:**

**Workflows:**
- `GET /workflows` - List workflows
- `POST /workflows` - Create workflow (manager+)
- `GET /workflows/:id` - Get workflow
- `PATCH /workflows/:id` - Update workflow (manager+)

**Work Items:**
- `GET /work-items` - List work items (assignee bypass)
- `POST /work-items` - Create work item (contributor+)
- `GET /work-items/:id` - Get work item
- `PATCH /work-items/:id` - Update work item (assignee or admin)

**Key Features:**
- Workflow templates with versioning
- Work item assignment tracking
- Assignee can ALWAYS see/update their work items
- Audit trail in JSONB column
- Status tracking (draft → in_progress → completed)

**Example:**
```bash
# Create work item
curl -X POST https://project.supabase.co/functions/v1/make-server-fb677d93/work-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inspect cooling system",
    "description": "Quarterly inspection",
    "site_id": "uuid",
    "priority": "high",
    "assigned_to": "uuid",
    "due_at": "2024-12-31T23:59:59Z"
  }'
```

---

### 4. Billing (`/supabase/functions/billing/index.ts`)

**Endpoints:**
- `GET /billing/account` - Get billing account (admin/billing_admin)
- `GET /billing/invoices` - List invoices (admin/billing_admin)
- `GET /billing/invoices/:id` - Get invoice with line items (admin/billing_admin)

**Key Features:**
- Admin and billing_admin only
- Payment method masked for billing_admin
- Invoice includes line items
- Billing invariants enforced at DB level

**Example:**
```bash
# Get billing account
curl https://project.supabase.co/functions/v1/make-server-fb677d93/billing/account \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Notify (`/supabase/functions/notify/index.ts`)

**Endpoints:**
- `GET /notifications` - List user notifications
- `POST /notifications/:id/read` - Mark notification as read
- `POST /notifications/read-all` - Mark all as read

**Key Features:**
- Users only see their own notifications
- Filterable by read status and type
- Bulk mark as read
- Notifications scoped to tenant and user

**Example:**
```bash
# Mark notification as read
curl -X POST https://project.supabase.co/functions/v1/make-server-fb677d93/notifications/uuid/read \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. AI Gateway (`/supabase/functions/ai_gateway/index.ts`)

**Endpoints:**
- `POST /ai_gateway` - Send request to AI model (Gemini)

**Key Features:**
- AI-powered chat and reports
- Secure communication with AI model
- Tenant-specific data handling

**Example:**
```bash
# Send request to AI model
curl -X POST https://project.supabase.co/functions/v1/make-server-fb677d93/ai_gateway \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate a report on risk management strategies",
    "tenant_id": "uuid"
  }'
```

---

## Development

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve Edge Function
supabase functions serve signals --env-file .env.local

# Test endpoint
curl http://localhost:54321/functions/v1/signals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Deploy Edge Function

```bash
# Deploy single function
supabase functions deploy signals

# Deploy all functions
supabase functions deploy signals risk workflow billing notify ai_gateway

# Note: JWT verification is disabled at the function level (see config.toml)
# Authentication is handled manually via requireAuth() middleware for protected routes
# This allows public routes like /auth/signup to work without JWT
```

### Environment Variables

Required in `.env.local`:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Testing

### Manual Testing with curl

```bash
# Get JWT token from Supabase Auth
TOKEN="your-jwt-token"

# Test list endpoint
curl "http://localhost:54321/functions/v1/signals?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Test create endpoint
curl -X POST "http://localhost:54321/functions/v1/signals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"site_id":"uuid","signal_type":"sensor","source":"test"}'
```

### Integration Testing

See `/tests/integration/edge-functions.test.ts` for comprehensive test suite.

---

## Best Practices

### ✅ DO:

1. **Always extract tenant_id from JWT claims**
2. **Validate all input with validateInput()**
3. **Check site access with requireSiteAccess()**
4. **Add audit trails for risk/workflow changes**
5. **Use standardized response envelopes**
6. **Log errors with request_id**
7. **Handle CORS preflight (OPTIONS)**

### ❌ DON'T:

1. **Never trust client-provided tenant_id**
2. **Don't skip input validation**
3. **Don't expose service role key to client**
4. **Don't skip audit trails for compliance**
5. **Don't return raw database errors**
6. **Don't forget to filter by tenant_id**

---

## Troubleshooting

### Issue: "NOT_AUTHENTICATED" error

**Cause:** Missing or invalid Bearer token

**Solution:**
```bash
# Ensure Authorization header is present
curl -H "Authorization: Bearer $TOKEN" ...
```

---

### Issue: "NOT_AUTHORIZED" error

**Cause:** Insufficient permissions or site access

**Solution:**
- Check user's role in JWT claims
- Verify user has access to the site
- For risks: check if user is the owner

---

### Issue: "VALIDATION_ERROR" for UUID

**Cause:** Invalid UUID format

**Solution:**
```typescript
// Ensure UUIDs are properly formatted
const uuid = crypto.randomUUID();
```

---

### Issue: Cross-tenant data leakage

**Cause:** Missing tenant filter

**Solution:**
```typescript
// Always filter by tenant_id from JWT
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('tenant_id', auth.tenantId);  // ← Critical
```

---

## Summary

**Status:** ✅ Complete and production-ready

### What Was Created

1. ✅ **5 Edge Functions** - signals, risk, workflow, billing, notify
2. ✅ **4 Shared Libraries** - auth, response, validation, database
3. ✅ **Multi-tenant enforcement** - Always from JWT, never from client
4. ✅ **MS2 requirements** - Ownership bypass, mandatory owner, decision rationale
5. ✅ **Audit trails** - Risk events, work item changes
6. ✅ **Standardized responses** - Consistent envelope format
7. ✅ **Comprehensive validation** - Input validation with helpful errors

### Next Steps

1. **Deploy functions:** `supabase functions deploy`
2. **Test endpoints:** Use curl or Postman
3. **Monitor logs:** `supabase functions logs`
4. **Add integration tests**
5. **Set up CI/CD** for auto-deployment

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-22  
**Status:** Production-ready