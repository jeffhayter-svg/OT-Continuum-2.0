# OT Continuum Architecture

## System Overview

OT Continuum is a multi-tenant SaaS platform for operational technology risk management built on Supabase.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            OT Continuum SaaS                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐                                                     │
│  │   Web Client    │                                                     │
│  │   (React/Next)  │                                                     │
│  └────────┬────────┘                                                     │
│           │ HTTPS + JWT                                                  │
│           ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │              Supabase Edge Functions                        │        │
│  │              (Hono Web Server)                              │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │        │
│  │  │   Auth   │  │   Orgs   │  │  Sites   │  │  Risks   │  │        │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │        │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │        │
│  │                                                             │        │
│  │  Authentication & Authorization Middleware                 │        │
│  └────────────────────────┬────────────────────────────────────┘        │
│                           │ Authenticated Queries                       │
│                           ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │              PostgreSQL Database (Supabase)                 │        │
│  │                                                             │        │
│  │  Row-Level Security (RLS) Enabled                          │        │
│  │                                                             │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │        │
│  │  │Organizations│  │    Sites    │  │    Risks    │        │        │
│  │  │  (Tenants)  │  │             │  │  Register   │        │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │        │
│  │         │                 │                 │              │        │
│  │         └─────────────────┴─────────────────┘              │        │
│  │                    Multi-Tenant Scoping                    │        │
│  │          (RLS policies enforce isolation)                  │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Database**: PostgreSQL 15 with Row-Level Security (RLS)
- **Edge Functions**: Deno runtime with Hono web framework
- **Authentication**: Supabase Auth (JWT-based)
- **API Protocol**: REST (OpenAPI 3.1 specification)

### Frontend (Placeholder)
- **Framework**: React/Next.js (to be implemented)
- **State Management**: React Query + Zustand
- **UI Components**: Tailwind CSS + shadcn/ui
- **Type Safety**: TypeScript with generated API types

### Testing
- **Database Tests**: pgTAP (PostgreSQL native testing)
- **Contract Tests**: Pact (consumer-driven contracts)
- **E2E Tests**: Playwright (API smoke tests)
- **Load Tests**: k6 (planned)

### CI/CD
- **Pipeline**: GitHub Actions
- **Deployment**: Supabase CLI
- **Environments**: Local → Preview → Production

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐
│  organizations  │
│  (tenants)      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐         ┌──────────────┐
│ organization_members│◀───────▶│    users     │
│   (junction)        │   N:N   │              │
└─────────────────────┘         └──────────────┘
         │
         │ N:1
         ▼
┌─────────────────┐
│     sites       │
│ (locations)     │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌──────────────────┐
│ risk_register   │────────▶│ risk_categories  │
│                 │   N:1   │                  │
└─────────────────┘         └──────────────────┘

┌─────────────────┐         ┌──────────────────┐
│ billing_plans   │◀────────│ billing_subscr.  │
│                 │   1:N   │                  │
└─────────────────┘         └──────────┬───────┘
                                       │
                                       │ 1:N
                                       ▼
                            ┌──────────────────┐
                            │ billing_invoices │
                            │                  │
                            └──────────────────┘
```

### Key Tables

#### organizations
The tenant root. Each organization is isolated via RLS.

```sql
- id: UUID (PK)
- name: TEXT
- slug: TEXT UNIQUE
- is_active: BOOLEAN
- settings: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

#### users
Extended user profiles linked to Supabase auth.

```sql
- id: UUID (PK, FK to auth.users)
- email: TEXT UNIQUE
- full_name: TEXT
- metadata: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

#### organization_members
Junction table for user ↔ organization relationship.

```sql
- id: UUID (PK)
- organization_id: UUID (FK)
- user_id: UUID (FK)
- role: ENUM (owner, admin, member, viewer)
- created_at, updated_at: TIMESTAMPTZ
UNIQUE(organization_id, user_id)
```

#### sites
Physical locations/facilities managed by organization.

```sql
- id: UUID (PK)
- organization_id: UUID (FK)
- name: TEXT
- location: TEXT
- site_code: TEXT
- status: ENUM (active, inactive, archived)
- metadata: JSONB
- created_at, updated_at: TIMESTAMPTZ
UNIQUE(organization_id, site_code)
```

#### risk_register
Risk management entries with calculated scores.

```sql
- id: UUID (PK)
- organization_id: UUID (FK)
- site_id: UUID (FK, nullable)
- category_id: UUID (FK, nullable)
- title: TEXT
- description: TEXT
- likelihood: INTEGER (1-5)
- impact: INTEGER (1-5)
- risk_score: INTEGER GENERATED (likelihood * impact)
- status: ENUM (open, mitigating, closed, accepted)
- mitigation_plan: TEXT
- owner_id: UUID (FK to users)
- identified_date, review_date: DATE
- metadata: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

## Security Architecture

### Multi-Tenant Isolation

Row-Level Security (RLS) enforces data isolation at the database level:

```sql
-- Example RLS policy for sites
CREATE POLICY "Members can view organization sites"
ON sites FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

**Key principles:**
1. All tables have RLS enabled
2. Policies check organization membership
3. Service role can bypass RLS (used in edge functions for system operations)
4. Users can only see/modify data from their organizations

### Authentication Flow

```
1. User signs in
   ↓
2. Supabase Auth issues JWT
   ↓
3. Client stores JWT
   ↓
4. Client sends JWT in Authorization header
   ↓
5. Edge function validates JWT
   ↓
6. Edge function uses JWT to query database
   ↓
7. Database RLS policies enforce access control
```

### Authorization Roles

- **owner**: Full control, can delete organization
- **admin**: Can manage members, sites, risks
- **member**: Can create/edit sites and risks
- **viewer**: Read-only access

## API Architecture

### REST API Design

All endpoints follow REST conventions:

```
GET    /organizations                    # List
POST   /organizations                    # Create
GET    /organizations/:id                # Read
PATCH  /organizations/:id                # Update
DELETE /organizations/:id                # Delete (not implemented)

GET    /organizations/:id/sites          # List (nested)
POST   /organizations/:id/sites          # Create (nested)
GET    /organizations/:id/sites/:siteId  # Read
PATCH  /organizations/:id/sites/:siteId  # Update
DELETE /organizations/:id/sites/:siteId  # Delete
```

### API Versioning

Currently: v1 (no versioning in URL)
Future: `/v2/organizations` when breaking changes needed

### Response Format

**Success:**
```json
{
  "data": { ... }  // or [ ... ] for lists
}
```

**List with pagination:**
```json
{
  "data": [ ... ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150
  }
}
```

**Error:**
```json
{
  "error": "Not Found",
  "message": "Site not found"
}
```

## Edge Functions Architecture

### Structure

```
supabase/functions/server/
├── index.tsx              # Main entry point
├── routes/                # Route handlers
│   ├── auth.ts
│   ├── organizations.ts
│   ├── sites.ts
│   ├── risks.ts
│   └── billing.ts
└── utils/                 # Shared utilities
    └── auth.ts            # Auth helper functions
```

### Request Flow

```
HTTP Request
  ↓
CORS Middleware
  ↓
Logging Middleware
  ↓
Route Handler
  ↓
Auth Validation (if protected)
  ↓
Business Logic
  ↓
Database Query (with RLS)
  ↓
Response Serialization
  ↓
HTTP Response
```

### Error Handling

All routes use consistent error handling:

```typescript
try {
  // Business logic
} catch (error) {
  console.error('Context:', error);
  return c.json({
    error: 'Internal Server Error',
    message: error.message
  }, 500);
}
```

## Database Architecture

### Indexes

Strategic indexes for performance:

```sql
-- Organization membership lookups
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);

-- Site queries
CREATE INDEX idx_sites_org_id ON sites(organization_id);
CREATE INDEX idx_sites_status ON sites(status);

-- Risk register queries
CREATE INDEX idx_risk_register_org_id ON risk_register(organization_id);
CREATE INDEX idx_risk_register_risk_score ON risk_register(risk_score DESC);
```

### Triggers

Automatic timestamp updates:

```sql
CREATE TRIGGER update_sites_updated_at
BEFORE UPDATE ON sites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Constraints

Data integrity enforced at DB level:

```sql
-- Likelihood/impact validation
CHECK (likelihood BETWEEN 1 AND 5)
CHECK (impact BETWEEN 1 AND 5)

-- Status enums
CHECK (status IN ('active', 'inactive', 'archived'))

-- Unique constraints
UNIQUE(organization_id, site_code)
```

## Testing Architecture

### Test Pyramid

```
       ┌─────────┐
       │   E2E   │  ← Playwright (API smoke tests)
       └─────────┘
      ┌───────────┐
      │  Contract │  ← Pact (consumer/provider)
      └───────────┘
    ┌─────────────┐
    │ Integration │  ← pgTAP (database tests)
    └─────────────┘
  ┌─────────────────┐
  │      Unit       │  ← (To be added)
  └─────────────────┘
```

### pgTAP Tests

Located in `supabase/tests/sql/`:
- Schema validation
- RLS policy verification
- Business rule testing
- Data integrity checks

Run with: `supabase test db`

### Pact Tests

Consumer tests (`pact/consumer/`):
- Define API expectations
- Generate pact files
- Run against mock server

Provider tests (`pact/provider/`):
- Verify API implements contracts
- Run against actual server
- Publish verification results

### Playwright Tests

Located in `playwright/`:
- Smoke tests for deployed environments
- API endpoint validation
- Authentication flow testing
- Error handling verification

## Deployment Architecture

### Environments

1. **Local Development**
   - Supabase running in Docker
   - Database: localhost:54322
   - Functions: localhost:54321
   - No external dependencies

2. **Preview (PR Environments)**
   - Deployed on PR creation
   - Isolated Supabase project
   - Full test suite runs
   - Automatic teardown

3. **Production**
   - Deployed on merge to main
   - Zero-downtime migrations
   - Blue-green function deployments
   - Monitoring and alerting

### CI/CD Pipeline

```
Git Push → Lint → Tests → Build → Deploy → Verify
```

**Stages:**
1. Lint & Type Check
2. Database Tests (pgTAP)
3. Contract Tests (Pact)
4. Deploy Preview (PR only)
5. E2E Tests (Playwright)
6. Deploy Production (main only)

### Rollback Strategy

**Database:**
- Create compensating migration
- No automatic rollbacks (data safety)
- Test migrations in preview first

**Edge Functions:**
- Redeploy previous version
- Fast rollback (< 1 minute)
- Keep 10 previous versions

## Performance Considerations

### Database

- **Connection pooling**: Managed by Supabase
- **Query optimization**: Indexes on foreign keys
- **RLS performance**: Helper functions cached
- **Pagination**: Limit/offset on all list queries

### Edge Functions

- **Cold starts**: ~100-300ms (Deno runtime)
- **Warm performance**: ~10-50ms per request
- **Concurrency**: Auto-scaling based on load
- **Regional deployment**: US East by default

### Caching Strategy

Currently: No caching layer
Future: Redis for session data, query results

## Monitoring & Observability

### Logging

- **Edge Functions**: `console.log()` → Supabase logs
- **Database**: pgAudit for query logging
- **Audit Table**: Application-level audit log

### Metrics

Available via Supabase Dashboard:
- API request rate
- Database connections
- Function execution time
- Error rates

### Alerting

To be configured:
- High error rate (> 5%)
- Slow queries (> 1s)
- Failed migrations
- Billing thresholds

## Scalability

### Current Limits

- Database: 500 GB storage
- Functions: 500 req/s per function
- Connections: 500 concurrent

### Scaling Strategy

**Vertical:**
- Upgrade Supabase plan
- Increase connection pool
- Add read replicas

**Horizontal:**
- Edge function auto-scaling (built-in)
- Database read replicas (future)
- CDN for static assets (future)

## Future Enhancements

1. **GraphQL API**: Alternative to REST
2. **Real-time subscriptions**: WebSocket for live updates
3. **File uploads**: Risk attachments, site photos
4. **Analytics dashboard**: Risk trends, heat maps
5. **Export/import**: CSV, Excel, PDF reports
6. **Webhooks**: Event notifications
7. **SSO**: SAML, OAuth providers
8. **Audit trail UI**: View all changes

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Hono Documentation](https://hono.dev)
- [pgTAP Documentation](https://pgtap.org)
- [Pact Documentation](https://docs.pact.io)
- [Playwright Documentation](https://playwright.dev)
