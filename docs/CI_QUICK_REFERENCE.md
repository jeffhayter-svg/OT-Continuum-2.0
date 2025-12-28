# CI Pipeline - Quick Reference Card

**Fast lookup for common CI operations**

---

## CI Jobs Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CI Pipeline Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. openapi-lint          → Lint OpenAPI spec              │
│       ↓                                                     │
│  2. generate-types        → Generate TS types              │
│       ↓                                                     │
│  3. web-typecheck         → TypeScript check               │
│                                                             │
│  4. database-migrations   → Apply migrations + pgTAP       │
│                                                             │
│  5. pact-consumer         → Consumer contract tests        │
│       ↓                                                     │
│  6. pact-provider         → Provider verification          │
│       ↓                                                     │
│  7. ci-summary            → Report results                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Run All Checks Locally (Before Push)

```bash
# 1. OpenAPI Lint
cd api/openapi && npm run lint

# 2. Generate Types
cd api/openapi && npm run generate:types

# 3. Web TypeCheck
cd packages/web && npm run typecheck

# 4. Database Tests (if Supabase running)
supabase db reset && supabase migration up
psql -U postgres -d ot_continuum_test -f tests/database/01_schema.sql

# 5. Pact Consumer
cd pact && npm run test:consumer

# 6. Pact Provider (if Edge Functions deployed)
cd pact && PROVIDER_BASE_URL=xxx TEST_AUTH_TOKEN=xxx npm run test:provider
```

---

## Quick Fixes

### OpenAPI Lint Failed

```bash
# See errors
cd api/openapi && npm run lint

# Auto-fix (if available)
npm run lint:fix

# Validate spec
npm run validate
```

### Type Generation Failed

```bash
# Check spec is valid
cd api/openapi && npm run validate

# Regenerate
npm run generate:types

# Check output
ls -la ../../packages/web/src/types/api.ts
```

### TypeCheck Failed

```bash
# See errors
cd packages/web && npm run typecheck

# Or use tsc
npx tsc --noEmit

# Fix and rerun
npm run typecheck
```

### Migration Failed

```bash
# Reset and retry
supabase db reset
supabase migration up

# Check specific migration
psql -U postgres -f supabase/migrations/001_initial_schema.sql
```

### pgTAP Failed

```bash
# Run specific test
psql -U postgres -d ot_continuum_test -f tests/database/01_schema.sql

# Check what tables exist
psql -U postgres -d ot_continuum_test -c "\dt"

# Check RLS policies
psql -U postgres -d ot_continuum_test -c "SELECT * FROM pg_policies;"
```

### Pact Consumer Failed

```bash
# Run tests
cd pact && npm run test:consumer

# Run specific test
npm run test:consumer:signals

# Clean and retry
npm run clean && npm run test:consumer
```

### Pact Provider Failed

```bash
# Check environment
echo $PROVIDER_BASE_URL
echo $TEST_AUTH_TOKEN

# Set and run
export PROVIDER_BASE_URL="https://project.supabase.co/functions/v1/..."
export TEST_AUTH_TOKEN="your-jwt-token"
npm run test:provider
```

---

## Common Error Patterns

### OpenAPI

```bash
# Error pattern
❌ operation-description  Operation must have "description"

# Quick fix
Add description: field to operation in main.yaml
```

### Type Generation

```bash
# Error pattern
❌ Cannot resolve $ref: #/components/schemas/Risk

# Quick fix
Add missing schema to components/schemas in main.yaml
```

### TypeScript

```bash
# Error pattern
❌ error TS2322: Type 'string' is not assignable to type 'RiskSeverity'

# Quick fix
Use enum: const severity: RiskSeverity = 'major';
```

### SQL Migration

```bash
# Error pattern
❌ ERROR: syntax error at or near "CONSTRAINT"

# Quick fix
Check SQL syntax, missing commas, parentheses
```

### pgTAP

```bash
# Error pattern
not ok 5 - RLS policy tenant_isolation should exist

# Quick fix
Add missing RLS policy in migration
```

### Pact

```bash
# Error pattern
❌ Expected status 200, got 401

# Quick fix
Check TEST_AUTH_TOKEN is set correctly
```

---

## GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Used For | How to Get |
|--------|----------|------------|
| `PROVIDER_BASE_URL` | Pact provider tests | Supabase Edge Functions URL |
| `TEST_AUTH_TOKEN` | Pact provider tests | Supabase Auth JWT |
| `PACT_BROKER_BASE_URL` | Pact broker (optional) | Your Pact Broker URL |
| `PACT_BROKER_TOKEN` | Pact broker (optional) | Broker API token |

---

## CI Job Status Check

### View in GitHub

1. Go to **Actions** tab
2. Click workflow run
3. See job status:
   - ✅ Green = Passed
   - ❌ Red = Failed
   - 🟡 Yellow = In progress
   - ⚪ Gray = Skipped

### Job Dependencies

```
openapi-lint
    ↓
generate-types
    ↓
web-typecheck

database-migrations (independent)

pact-consumer
    ↓
pact-provider
```

If a job fails, dependent jobs are skipped.

---

## Retry Failed Jobs

### Option 1: Re-run in GitHub

1. Click **Re-run jobs** button
2. Select **Re-run failed jobs**

### Option 2: Push Empty Commit

```bash
git commit --allow-empty -m "Retry CI"
git push
```

---

## Debug Mode

### Enable Verbose Logging

Edit `.github/workflows/ci.yml`:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

Push and CI will show detailed logs.

---

## Local CI Simulation

### Using Act (GitHub Actions locally)

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI locally
act -j openapi-lint
act -j database-migrations
act -j pact-consumer
```

**Note:** Some jobs require secrets/services.

---

## Performance Tips

### Speed Up CI

1. **Use caching:**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Run jobs in parallel:**
   - `database-migrations` runs independently
   - No `needs:` dependency = parallel

3. **Skip unnecessary jobs:**
   ```yaml
   if: github.event_name == 'push' && github.ref == 'refs/heads/main'
   ```

---

## Troubleshooting Commands

### Check PostgreSQL in CI

```bash
# In workflow step
- name: Debug PostgreSQL
  run: |
    pg_isready -h localhost -p 5432 -U postgres
    psql -h localhost -U postgres -l
```

### Check Node/npm

```bash
- name: Debug Node
  run: |
    node --version
    npm --version
    which node
```

### Check Files

```bash
- name: Debug Files
  run: |
    ls -la api/openapi/
    cat packages/web/src/types/api.ts | head -20
```

---

## Status Badges

Add to README.md:

```markdown
![CI Pipeline](https://github.com/your-org/ot-continuum/workflows/CI%20Pipeline/badge.svg)
```

Shows:
- ✅ Passing
- ❌ Failing
- 🟡 In progress

---

## Pre-Commit Hooks (Recommended)

### Install Husky

```bash
npm install --save-dev husky
npx husky install
```

### Add Pre-Commit Hook

```bash
npx husky add .husky/pre-commit "npm run pre-commit"
```

### Create Script

In `package.json`:

```json
{
  "scripts": {
    "pre-commit": "cd api/openapi && npm run lint && cd ../../packages/web && npm run typecheck"
  }
}
```

Now checks run automatically before every commit!

---

## Emergency: Bypass CI

**⚠️ Use only in emergencies**

### Skip CI for a Commit

```bash
git commit -m "hotfix [skip ci]"
git push
```

**Warning:** Use sparingly. CI exists to prevent bugs.

---

## Summary

### Before Every Commit

```bash
# Quick check
cd api/openapi && npm run lint
cd ../../packages/web && npm run typecheck
cd ../../pact && npm run test:consumer
```

### When CI Fails

1. ✅ Check job logs in GitHub Actions
2. ✅ Reproduce locally
3. ✅ Fix and test locally
4. ✅ Push fix

### Common Issues → Solutions

| Issue | Command |
|-------|---------|
| OpenAPI lint | `cd api/openapi && npm run lint` |
| Type gen | `cd api/openapi && npm run generate:types` |
| TypeCheck | `cd packages/web && npm run typecheck` |
| Migration | `supabase db reset && supabase migration up` |
| pgTAP | `psql -f tests/database/01_schema.sql` |
| Pact | `cd pact && npm run test:consumer` |

---

**Full Troubleshooting Guide:** `/docs/CI_TROUBLESHOOTING.md`

**Last Updated:** 2024-12-22
