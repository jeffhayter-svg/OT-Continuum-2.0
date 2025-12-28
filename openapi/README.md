# OpenAPI Specification - OT Continuum API

**Source of Truth for API Contract**

This directory contains the OpenAPI 3.0 specification for the OT Continuum API. The specification serves as the **single source of truth** for the API contract between frontend and backend.

---

## Files

| File | Description |
|------|-------------|
| `main.yaml` | Complete OpenAPI 3.0 specification |
| `.spectral.yaml` | Linting rules and API design standards |
| `README.md` | This documentation |

---

## Quick Start

### Install Dependencies

```bash
cd api
npm install
```

### Validate Specification

```bash
# Lint with Spectral
npm run lint:openapi

# Validate with OpenAPI CLI
npm run validate:openapi

# Run both (CI pipeline)
npm test
```

### Preview Documentation

```bash
# Interactive preview
npm run preview:openapi

# Build static docs
npm run build:docs
```

### Generate TypeScript Types

```bash
# From web directory
cd ../web
npm run generate:types

# Or with watch mode (auto-regenerate on changes)
npm run generate:types:watch
```

---

## API Overview

### Base URL

**Production:**
```
https://{project_id}.supabase.co/functions/v1/make-server-fb677d93
```

**Local Development:**
```
http://localhost:54321/functions/v1/make-server-fb677d93
```

### Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

JWT tokens are obtained from Supabase Auth and include:
- `tenant_id` - User's tenant (for RLS)
- `role` - User's role (admin, manager, operator, etc.)
- `site_ids` - Accessible site IDs (for site scoping)

### Multi-Tenancy

All requests are automatically scoped to the authenticated user's tenant via JWT claims. Cross-tenant data access is not possible through the API.

---

## API Resources

### Core Resources

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Tenants** | `/tenants/*` | Tenant management and settings |
| **Users** | `/users/*` | User profiles and RBAC |
| **Sites** | `/sites/*` | Operational facilities and locations |
| **Signals** | `/signals/*` | Raw and validated operational data |

### Workflow Resources

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Workflows** | `/workflows/*` | Workflow definitions (MoC, approvals) |
| **Work Items** | `/work-items/*` | Workflow instances and tasks |

### Risk Management

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Risks** | `/risks/*` | Risk register with MS2 requirements |
| **Risk Events** | `/risks/{id}/events` | Historical risk score changes |

### Billing

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Billing Account** | `/billing/account` | Tenant billing information |
| **Invoices** | `/billing/invoices/*` | Invoices and line items |

### Support

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Notifications** | `/notifications/*` | User notifications and alerts |
| **Integrations** | `/integrations/*` | External system integrations |

---

## OpenAPI Structure

### Information Block

```yaml
info:
  title: OT Continuum API
  version: 1.0.0
  description: Multi-tenant operational technology risk management platform
```

### Servers

```yaml
servers:
  - url: https://{project_id}.supabase.co/functions/v1/make-server-fb677d93
    description: Production server
```

### Security

```yaml
security:
  - BearerAuth: []

securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

### Tags

Operations are grouped by resource type:
- `tenants`, `users`, `sites`
- `signals`, `workflows`, `work_items`
- `risks`, `risk_events`
- `billing`, `notifications`, `integrations`

### Schemas

All schemas are defined in `components/schemas` and include:
- **Enums** - Type-safe status values
- **Resources** - Full resource representations
- **Create/Update** - Request payloads
- **Error responses** - Standardized error format

---

## Schema Conventions

### Naming Conventions

**Resources:**
- PascalCase for schema names: `User`, `Site`, `Risk`
- Include `Create` and `Update` variants: `UserCreate`, `UserUpdate`

**Properties:**
- snake_case for property names: `tenant_id`, `created_at`, `site_ids`
- Consistent naming across resources

**Enums:**
- PascalCase for enum names: `UserRole`, `WorkflowStatus`
- snake_case for enum values: `almost_certain`, `in_progress`

### Required Fields

All resource schemas include:
- `id` (UUID)
- `tenant_id` (UUID) - For multi-tenancy
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Timestamps

All timestamp fields use `format: date-time`:
- `created_at`, `updated_at`
- Domain-specific: `measured_at`, `due_at`, `completed_at`

### UUIDs

All ID fields use `format: uuid`:
- Primary keys: `id`
- Foreign keys: `tenant_id`, `site_id`, `owner_id`

### Nullable Fields

Optional fields marked as `nullable: true`:
```yaml
avatar_url:
  type: string
  nullable: true
```

### Read-Only Fields

Computed or system-managed fields marked as `readOnly: true`:
```yaml
risk_score:
  type: integer
  readOnly: true
```

---

## Pagination

List endpoints support pagination with standard parameters:

```yaml
parameters:
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
  - name: offset
    in: query
    schema:
      type: integer
      minimum: 0
      default: 0
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET/PATCH |
| `201` | Created | Successful POST |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Invalid request format |
| `401` | Unauthorized | Missing/invalid auth token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `422` | Validation Error | Invalid request data |
| `500` | Internal Error | Server error |

### Validation Errors

```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "site_id",
      "message": "Site ID is required"
    }
  ]
}
```

---

## Linting with Spectral

### Run Linter

```bash
npm run lint:openapi
```

### Linting Rules

The `.spectral.yaml` configuration includes:

**Built-in Rules:**
- ✅ All operations have operationId
- ✅ All operations have tags
- ✅ All operations have descriptions
- ✅ All parameters have descriptions
- ✅ Success responses required

**Custom Rules:**
- ✅ UUIDs use `format: uuid`
- ✅ Timestamps use `format: date-time`
- ✅ Pagination has min/max constraints
- ✅ POST returns 201, DELETE returns 204
- ✅ Path params use camelCase
- ✅ Query params use snake_case
- ✅ Status fields use enums
- ✅ Multi-tenancy: tenant_id present

### Severity Levels

| Level | Description |
|-------|-------------|
| `error` | Must fix (blocks CI) |
| `warn` | Should fix (doesn't block) |
| `hint` | Nice to have |
| `off` | Disabled |

---

## Type Generation

### Generate TypeScript Types

```bash
cd web
npm run generate:types
```

This generates `/web/src/types/openapi.d.ts` with:
- Type-safe schemas for all resources
- Request/response types
- Path parameters
- Query parameters
- Enum types

### Usage in Frontend

```typescript
import { components, paths } from './types/openapi';

// Resource types
type User = components['schemas']['User'];
type Risk = components['schemas']['Risk'];
type Site = components['schemas']['Site'];

// Request/response types
type CreateUserRequest = components['schemas']['UserCreate'];
type ListUsersResponse = paths['/users']['get']['responses']['200']['content']['application/json'];

// Enum types
type UserRole = components['schemas']['UserRole'];
type RiskDecision = components['schemas']['RiskDecision'];
```

### Type-Safe API Client

```typescript
import { components } from './types/openapi';

type User = components['schemas']['User'];

async function getUser(userId: string): Promise<User> {
  const response = await fetch(`/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

---

## Validation

### Validate Specification

```bash
npm run validate:openapi
```

Checks for:
- ✅ Valid OpenAPI 3.0 syntax
- ✅ Schema references resolve
- ✅ No duplicate operationIds
- ✅ Response schemas match
- ✅ Security schemes defined

### Statistics

```bash
npm run validate:openapi:stats
```

Outputs:
- Total paths: 40+
- Total operations: 60+
- Total schemas: 50+
- Total enums: 15+

---

## Documentation

### Preview Docs

```bash
npm run preview:openapi
```

Opens interactive documentation at `http://localhost:8080` with:
- API explorer
- Try-it-out functionality
- Schema browser
- Example requests/responses

### Build Static Docs

```bash
npm run build:docs
```

Generates static HTML documentation in `/dist/docs/index.html`:
- Can be deployed to static hosting
- No server required
- Includes search functionality

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate OpenAPI
  run: |
    cd api
    npm install
    npm test

- name: Generate TypeScript Types
  run: |
    cd web
    npm run generate:types
```

### Pre-commit Hook

```bash
#!/bin/bash
cd api
npm run lint:openapi
if [ $? -ne 0 ]; then
  echo "OpenAPI linting failed"
  exit 1
fi
```

---

## Versioning

### API Versioning Strategy

**Current approach:** Single version (1.0.0)

**Future considerations:**
- URL versioning: `/v2/users`
- Header versioning: `API-Version: 2.0`
- Separate spec files: `main-v2.yaml`

### Breaking Changes

**Breaking changes require major version bump:**
- Removing endpoints
- Removing required fields
- Changing response structure
- Changing authentication

**Non-breaking changes:**
- Adding endpoints
- Adding optional fields
- Adding enum values (append only)

---

## Best Practices

### Schema Design

✅ **DO:**
- Use consistent naming conventions
- Include descriptions for all fields
- Use enums for known values
- Mark computed fields as readOnly
- Include examples in schemas

❌ **DON'T:**
- Use generic names (e.g., `data`, `item`)
- Omit required fields
- Use strings for dates/UUIDs
- Create overly nested structures

### Endpoint Design

✅ **DO:**
- Use RESTful conventions
- Group related operations with tags
- Return 201 for POST, 204 for DELETE
- Include pagination for list endpoints
- Use path params for resource IDs

❌ **DON'T:**
- Use verbs in URLs (e.g., `/getUser`)
- Return 200 for POST operations
- Omit error responses
- Create deeply nested paths

### Documentation

✅ **DO:**
- Write clear operation descriptions
- Include examples for complex schemas
- Document authentication requirements
- Explain multi-tenancy implications

❌ **DON'T:**
- Leave descriptions empty
- Assume readers know the domain
- Omit error scenarios

---

## Troubleshooting

### Linting Errors

**Issue:** `operation-operationId` error

**Solution:** Add operationId to operation:
```yaml
get:
  operationId: getUser
```

---

**Issue:** `uuid-format` error

**Solution:** Use `format: uuid` for UUID fields:
```yaml
user_id:
  type: string
  format: uuid
```

---

**Issue:** `post-201-response` warning

**Solution:** Add 201 response to POST:
```yaml
post:
  responses:
    '201':
      description: Created
```

---

### Type Generation Issues

**Issue:** Types not updating

**Solution:** 
```bash
rm web/src/types/openapi.d.ts
npm run generate:types
```

---

**Issue:** Import errors in TypeScript

**Solution:** Ensure `openapi.d.ts` is in `tsconfig.json` include:
```json
{
  "include": ["src/**/*", "src/types/openapi.d.ts"]
}
```

---

## Resources

- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.0.3
- **Spectral Docs**: https://docs.stoplight.io/docs/spectral
- **Redocly CLI**: https://redocly.com/docs/cli
- **openapi-typescript**: https://github.com/drwpow/openapi-typescript

---

## Maintenance

### Adding New Endpoint

1. **Define path and operation:**
   ```yaml
   /new-resource:
     get:
       tags: [new_resource]
       summary: Get new resource
       operationId: getNewResource
   ```

2. **Add schemas:**
   ```yaml
   components:
     schemas:
       NewResource:
         type: object
         properties: ...
   ```

3. **Validate:**
   ```bash
   npm run lint:openapi
   npm run validate:openapi
   ```

4. **Regenerate types:**
   ```bash
   cd ../web
   npm run generate:types
   ```

### Updating Schema

1. **Modify schema in `main.yaml`**
2. **Run validation:** `npm test`
3. **Update tests** if breaking change
4. **Regenerate types**
5. **Update API implementation**

---

**Status:** ✅ OpenAPI spec complete and validated  
**Version:** 1.0.0  
**Last Updated:** 2024-12-22
