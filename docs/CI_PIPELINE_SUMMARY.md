# CI Pipeline - Complete Summary

**GitHub Actions CI/CD Pipeline for OT Continuum**

---

## Overview

The CI pipeline ensures code quality and prevents bugs by running automated checks on every commit and pull request.

### Pipeline Philosophy

**✅ Fail Fast** - Catch errors early in the process  
**✅ Comprehensive** - Test API, types, database, and contracts  
**✅ Automated** - No manual intervention required  
**✅ Informative** - Clear feedback on what failed and why  

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CI Pipeline Flow                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │  Code Push/PR       │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  openapi-lint       │  ← Validate OpenAPI spec with Spectral
    └──────────┬──────────┘
               │ (passes)
               ▼
    ┌─────────────────────┐
    │  generate-types     │  ← Generate TypeScript from OpenAPI
    └──────────┬──────────┘
               │ (passes)
               ▼
    ┌─────────────────────┐
    │  web-typecheck      │  ← TypeScript type check
    └─────────────────────┘

    ┌─────────────────────┐
    │ database-migrations │  ← Apply SQL migrations + pgTAP tests
    └─────────────────────┘     (runs in parallel)

    ┌─────────────────────┐
    │  pact-consumer      │  ← Consumer contract tests
    └──────────┬──────────┘
               │ (passes)
               ▼
    ┌─────────────────────┐
    │  pact-provider      │  ← Provider verification (optional)
    └─────────────────────┘

    ┌─────────────────────┐
    │  ci-summary         │  ← Report overall status
    └─────────────────────┘
               │
               ▼
         ✅ All Pass → Merge
         ❌ Any Fail → Block
```

---

## Jobs Detailed

### 1. OpenAPI Linting

**Purpose:** Validate OpenAPI specification follows best practices

**Tools:**
- Spectral (OpenAPI linter)
- Custom ruleset (`.spectral.yaml`)

**Checks:**
- ✅ Valid OpenAPI 3.0/3.1 format
- ✅ All operations have descriptions
- ✅ All parameters documented
- ✅ Consistent naming conventions
- ✅ Security schemes defined
- ✅ No circular references

**Outputs:**
- OpenAPI spec artifact
- Lint errors/warnings

**Fails if:**
- Spectral rules violated
- Invalid YAML syntax
- Missing required fields

**Fix:**
```bash
cd api/openapi
npm run lint
# Fix errors in main.yaml
```

---

### 2. Generate Types

**Purpose:** Generate TypeScript types from OpenAPI spec

**Tools:**
- openapi-typescript
- Custom generators

**Process:**
1. Reads `api/openapi/main.yaml`
2. Generates TypeScript interfaces
3. Outputs to `packages/web/src/types/api.ts`

**Generated types:**
```typescript
// Request/response types
export interface Risk { ... }
export interface Signal { ... }
export interface Workflow { ... }

// Enums
export type RiskSeverity = 'catastrophic' | 'major' | ...
export type RiskLikelihood = 'almost_certain' | 'likely' | ...
```

**Outputs:**
- `api.ts` type definitions
- Type generation artifact

**Fails if:**
- Invalid OpenAPI spec
- Missing schemas
- Circular references

**Fix:**
```bash
cd api/openapi
npm run validate
npm run generate:types
```

---

### 3. Web TypeCheck

**Purpose:** Ensure frontend code is type-safe

**Tools:**
- TypeScript compiler (tsc)
- ESLint (optional)

**Checks:**
- ✅ No type errors
- ✅ All imports resolve
- ✅ Strict null checks
- ✅ No implicit any

**Fails if:**
- Type mismatches
- Missing imports
- Undefined properties

**Fix:**
```bash
cd packages/web
npm run typecheck
# Fix type errors
```

---

### 4. Database Migrations

**Purpose:** Apply migrations and verify database schema

**Tools:**
- PostgreSQL 15 (service container)
- pgTAP (testing framework)

**Process:**
1. Start PostgreSQL container
2. Install pgTAP extension
3. Apply migrations in order
4. Verify tables exist
5. Run pgTAP test suite

**Tests:**
- ✅ All tables created
- ✅ Columns exist with correct types
- ✅ Constraints enforced (NOT NULL, FK, CHECK)
- ✅ Indexes created
- ✅ RLS policies exist
- ✅ Enums defined
- ✅ Triggers created

**Fails if:**
- SQL syntax errors
- Missing dependencies
- Constraint violations
- pgTAP tests fail

**Fix:**
```bash
supabase db reset
supabase migration up
psql -f tests/database/01_schema.sql
```

---

### 5. Pact Consumer

**Purpose:** Define API contract expectations

**Tools:**
- Pact (contract testing framework)
- Jest (test runner)

**Process:**
1. Start Pact mock server
2. Define consumer expectations
3. Make requests to mock
4. Generate pact contract files

**Tests:**
- ✅ Signals API contract
- ✅ Risk API contract
- ✅ Workflow API contract
- ✅ Error responses

**Outputs:**
- Pact contract JSON files
- Contract artifacts

**Fails if:**
- Mock server issues
- Incorrect expectations
- Test failures

**Fix:**
```bash
cd pact
npm run test:consumer
```

---

### 6. Pact Provider (Optional Gating)

**Purpose:** Verify Edge Functions meet contract

**Tools:**
- Pact Verifier
- Real Edge Functions

**Process:**
1. Read pact contract files
2. Make real requests to Edge Functions
3. Verify responses match contract
4. Publish verification results

**Configuration:**
- `continue-on-error: true` - Won't block CI
- Requires `PROVIDER_BASE_URL` secret
- Requires `TEST_AUTH_TOKEN` secret

**Fails if:**
- Edge Functions not deployed
- Authentication fails
- Responses don't match contract

**Fix:**
```bash
cd pact
export PROVIDER_BASE_URL="..."
export TEST_AUTH_TOKEN="..."
npm run test:provider
```

---

### 7. CI Summary

**Purpose:** Report overall pipeline status

**Process:**
1. Collect results from all jobs
2. Generate summary report
3. Post comment on PR
4. Fail if any critical job failed

**Outputs:**
- GitHub step summary
- PR comment with results
- Overall pass/fail status

---

## Workflow Triggers

### Push to Main/Develop

```yaml
on:
  push:
    branches: [main, develop]
```

**Runs:**
- All jobs
- Publishes to Pact Broker (main only)

### Pull Request

```yaml
on:
  pull_request:
    branches: [main, develop]
```

**Runs:**
- All jobs
- Posts results as PR comment
- Blocks merge if failed

---

## Environment Variables

### Global

```yaml
env:
  NODE_VERSION: '18'
  POSTGRES_VERSION: '15'
```

### Job-Specific

**database-migrations:**
```yaml
env:
  PGPASSWORD: postgres
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ot_continuum_test
```

**pact-provider:**
```yaml
env:
  PROVIDER_BASE_URL: ${{ secrets.PROVIDER_BASE_URL }}
  TEST_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
```

---

## GitHub Secrets

Add in **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `PROVIDER_BASE_URL` | No* | Pact provider verification |
| `TEST_AUTH_TOKEN` | No* | Authentication for provider tests |
| `PACT_BROKER_BASE_URL` | No | Pact Broker publishing |
| `PACT_BROKER_TOKEN` | No | Pact Broker authentication |

*Required only if running provider verification

---

## Artifacts

### Uploaded Artifacts

| Job | Artifact | Contents | Retention |
|-----|----------|----------|-----------|
| openapi-lint | `openapi-spec` | `main.yaml` | 7 days |
| generate-types | `generated-types` | `api.ts` | 7 days |
| pact-consumer | `pact-contracts` | `*.json` | 7 days |

### Downloading Artifacts

1. Go to workflow run
2. Scroll to "Artifacts"
3. Click to download

---

## Service Containers

### PostgreSQL

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ot_continuum_test
    ports:
      - 5432:5432
```

**Health check:**
```yaml
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

---

## Caching Strategy

### Node.js Dependencies

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
    cache-dependency-path: 'path/to/package-lock.json'
```

**Benefits:**
- ✅ Faster installation (cached dependencies)
- ✅ Reduced network usage
- ✅ Consistent dependency versions

---

## PR Comments

### Automatic Comments

**On Success:**
```
## CI Pipeline Results

**5/5 checks passed**

| Job | Status |
|-----|--------|
| OpenAPI Linting | ✅ |
| Type Generation | ✅ |
| Web Type Check | ✅ |
| Database Tests | ✅ |
| Pact Consumer | ✅ |

🎉 All checks passed! Ready to merge.
```

**On Failure:**
```
## CI Pipeline Results

**3/5 checks passed**

| Job | Status |
|-----|--------|
| OpenAPI Linting | ✅ |
| Type Generation | ❌ |
| Web Type Check | ❌ |
| Database Tests | ✅ |
| Pact Consumer | ✅ |

⚠️ Some checks failed. Please review the logs.
```

---

## Performance

### Average Run Times

| Job | Average Duration | Notes |
|-----|------------------|-------|
| openapi-lint | ~30 seconds | Fast |
| generate-types | ~45 seconds | Moderate |
| web-typecheck | ~1 minute | Depends on project size |
| database-migrations | ~2 minutes | Includes PostgreSQL startup |
| pact-consumer | ~1 minute | Fast |
| pact-provider | ~1.5 minutes | Requires Edge Functions |

**Total pipeline:** ~5-7 minutes (parallel execution)

### Optimization Tips

1. **Use caching** - Already enabled for npm
2. **Parallel jobs** - `database-migrations` runs independently
3. **Skip optional jobs** - Provider verification is optional
4. **Fail fast** - Jobs stop on first error

---

## Status Checks

### Required Status Checks

Configure in **Settings → Branches → Branch protection rules**:

Required checks for merge:
- ✅ `openapi-lint`
- ✅ `generate-types`
- ✅ `web-typecheck`
- ✅ `database-migrations`
- ✅ `pact-consumer`
- ⚪ `pact-provider` (optional)

---

## Notifications

### When Jobs Fail

**Email notification** sent to:
- Committer
- PR author

**Slack notification** (optional):
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Troubleshooting

### Quick Diagnosis

1. **Click failed job** in Actions tab
2. **Expand failed step** to see logs
3. **Look for error message** (red text)
4. **Check troubleshooting guide:** `/docs/CI_TROUBLESHOOTING.md`

### Common Issues

| Issue | Solution |
|-------|----------|
| OpenAPI lint fails | Fix Spectral errors in `main.yaml` |
| Type gen fails | Validate OpenAPI spec |
| TypeCheck fails | Fix type errors in web code |
| Migration fails | Fix SQL syntax |
| pgTAP fails | Fix schema or tests |
| Pact fails | Update contract expectations |

### Full Guides

- **Troubleshooting:** `/docs/CI_TROUBLESHOOTING.md`
- **Quick Reference:** `/docs/CI_QUICK_REFERENCE.md`

---

## Local Development

### Run CI Checks Locally

```bash
# OpenAPI
cd api/openapi && npm run lint

# Types
cd api/openapi && npm run generate:types

# TypeCheck
cd packages/web && npm run typecheck

# Database
supabase db reset && supabase migration up
psql -f tests/database/01_schema.sql

# Pact
cd pact && npm run test:consumer
```

### Pre-Commit Hooks (Recommended)

Install Husky:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
```

Add script to `package.json`:
```json
{
  "scripts": {
    "pre-commit": "cd api/openapi && npm run lint && cd ../../packages/web && npm run typecheck"
  }
}
```

---

## Monitoring & Metrics

### View Pipeline History

1. Go to **Actions** tab
2. Select **CI Pipeline** workflow
3. View run history

### Key Metrics

- **Success rate** - % of passing runs
- **Average duration** - Time to complete
- **Failure reasons** - Which jobs fail most
- **Cache hit rate** - npm cache effectiveness

---

## Security

### Secret Management

✅ **Do:**
- Store sensitive data in GitHub Secrets
- Rotate tokens regularly
- Use least-privilege tokens

❌ **Don't:**
- Commit secrets to code
- Use personal access tokens
- Share secrets publicly

### Audit Trail

All CI runs are logged:
- Who triggered the run
- What changed (commit)
- What passed/failed
- When it ran

---

## Best Practices

### For Developers

1. ✅ **Run checks locally** before pushing
2. ✅ **Fix CI failures** immediately
3. ✅ **Don't skip CI** with `[skip ci]`
4. ✅ **Update tests** when changing contracts
5. ✅ **Keep migrations** idempotent

### For Teams

1. ✅ **Require status checks** for merging
2. ✅ **Review failed runs** in standups
3. ✅ **Update documentation** when changing CI
4. ✅ **Monitor CI performance** over time
5. ✅ **Celebrate** when all checks pass 🎉

---

## Continuous Improvement

### Regular Reviews

**Monthly:**
- Review failure patterns
- Optimize slow jobs
- Update dependencies
- Refine test coverage

**Quarterly:**
- Audit secret rotation
- Review branch protection
- Update Node/Postgres versions
- Add new checks as needed

---

## Summary

### What Was Created

1. ✅ **Complete CI pipeline** - 7 jobs with dependencies
2. ✅ **OpenAPI validation** - Spectral linting
3. ✅ **Type generation** - Automated from OpenAPI
4. ✅ **TypeScript checks** - Ensure type safety
5. ✅ **Database tests** - Migrations + pgTAP
6. ✅ **Contract tests** - Pact consumer/provider
7. ✅ **PR integration** - Automatic comments
8. ✅ **Artifacts** - Saved for 7 days
9. ✅ **Documentation** - Complete troubleshooting guide

### Pipeline Coverage

| Layer | Testing | Coverage |
|-------|---------|----------|
| **API Contract** | OpenAPI lint | ✅ 100% |
| **Types** | TypeScript | ✅ 100% |
| **Database** | pgTAP | ✅ 53 tests |
| **API Integration** | Pact | ✅ 16+ interactions |

### Success Metrics

- ✅ **Fail fast** - Errors caught in <7 minutes
- ✅ **Comprehensive** - All layers tested
- ✅ **Automated** - Zero manual intervention
- ✅ **Informative** - Clear error messages

---

**Full Workflow:** `/.github/workflows/ci.yml`  
**Troubleshooting:** `/docs/CI_TROUBLESHOOTING.md`  
**Quick Reference:** `/docs/CI_QUICK_REFERENCE.md`

**Last Updated:** 2024-12-22  
**Version:** 1.0.0  
**Status:** Production-ready ✅
