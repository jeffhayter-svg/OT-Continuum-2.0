# CI Pipeline Troubleshooting Guide

**Complete guide for debugging GitHub Actions CI failures**

---

## Overview

This guide helps you diagnose and fix common CI pipeline failures in the OT Continuum project.

### CI Pipeline Jobs

| Job | Purpose | Dependencies | Common Issues |
|-----|---------|--------------|---------------|
| **openapi-lint** | Lint OpenAPI spec | None | Spectral rule violations |
| **generate-types** | Generate TS types | openapi-lint | Invalid spec, codegen errors |
| **web-typecheck** | TypeScript check | generate-types | Type errors, missing imports |
| **database-migrations** | Apply migrations & test | None | SQL syntax, pgTAP failures |
| **pact-consumer** | Contract tests | None | Test failures, mock errors |
| **pact-provider** | Verify provider | pact-consumer | Edge Function issues |

---

## Quick Diagnosis

### Step 1: Find the Failed Job

1. Go to **GitHub** → **Actions** tab
2. Click on the failed workflow run
3. Identify which job failed (red ❌)
4. Click on the failed job to see logs

### Step 2: Identify Error Type

Look for these patterns in logs:

```bash
# OpenAPI Linting
❌ api/openapi/main.yaml has Spectral errors

# Type Generation
❌ Type generation failed - api.ts not created

# Web Typecheck
❌ error TS2322: Type 'string' is not assignable to type 'number'

# Database Migrations
❌ Migration failed: 001_initial_schema.sql

# pgTAP Tests
not ok 1 - tenants table should exist

# Pact Tests
❌ FAIL consumer/signals.consumer.pact.test.ts
```

### Step 3: Jump to Relevant Section

- [OpenAPI Lint Failures](#openapi-lint-failures)
- [Type Generation Failures](#type-generation-failures)
- [Web TypeCheck Failures](#web-typecheck-failures)
- [Migration Failures](#migration-failures)
- [pgTAP Test Failures](#pgtap-test-failures)
- [Pact Test Failures](#pact-test-failures)
- [Missing Environment Variables](#missing-environment-variables)

---

## OpenAPI Lint Failures

### Symptom

```bash
❌ OpenAPI Linting: FAILED
Error: api/openapi/main.yaml
  1:1  error  openapi-tags  OpenAPI object must have non-empty "tags" array
```

### Common Causes

1. **Spectral rule violation**
2. **Invalid YAML syntax**
3. **Missing required fields**
4. **Incorrect OpenAPI version**

### How to Fix

#### 1. Check Spectral Rules

```bash
# Run locally to see all errors
cd api/openapi
npm run lint
```

**Output:**
```
api/openapi/main.yaml
  10:5   error  operation-description  Operation must have "description"
  25:7   error  path-params            Path parameter "id" must be defined
```

**Fix:** Add missing descriptions and parameters

```yaml
# Before
/risks/{id}:
  get:
    summary: Get risk

# After
/risks/{id}:
  get:
    summary: Get risk
    description: Retrieve a single risk by ID
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
```

#### 2. Fix YAML Syntax Errors

```bash
# Common issues
- Inconsistent indentation (use 2 spaces)
- Missing colons
- Incorrect list formatting
```

**Example:**
```yaml
# ❌ Wrong - 4 space indent
paths:
    /risks:
        get:
            summary: List risks

# ✅ Correct - 2 space indent
paths:
  /risks:
    get:
      summary: List risks
```

#### 3. Disable Specific Rules (Last Resort)

Edit `.spectral.yaml`:

```yaml
rules:
  # Disable a specific rule if needed
  operation-tag-defined: off
```

**⚠️ Warning:** Only disable rules if absolutely necessary. They exist for good reasons.

#### 4. Validate OpenAPI Spec

```bash
cd api/openapi
npm run validate
```

This checks for:
- Valid OpenAPI 3.0/3.1 format
- Schema correctness
- Reference resolution

### Prevention

✅ **Run linter before committing:**
```bash
cd api/openapi
npm run lint
```

✅ **Use OpenAPI editor** with live validation  
✅ **Follow Spectral ruleset** in `/api/openapi/.spectral.yaml`

---

## Type Generation Failures

### Symptom

```bash
❌ Type generation failed - api.ts not created
Error: Cannot read properties of undefined (reading 'components')
```

### Common Causes

1. **Invalid OpenAPI spec** (doesn't pass validation)
2. **Missing components/schemas**
3. **Circular references**
4. **openapi-typescript version mismatch**

### How to Fix

#### 1. Verify OpenAPI Spec is Valid

```bash
cd api/openapi
npm run validate
```

**If validation fails:**
- Fix OpenAPI spec first
- Then retry type generation

#### 2. Check for Missing Schemas

```bash
# Look for $ref that don't resolve
cd api/openapi
npm run generate:types 2>&1 | grep "Cannot resolve"
```

**Example error:**
```
Cannot resolve $ref: #/components/schemas/RiskResponse
```

**Fix:** Add missing schema to `main.yaml`:

```yaml
components:
  schemas:
    RiskResponse:
      type: object
      required:
        - data
        - error
        - request_id
      properties:
        data:
          $ref: '#/components/schemas/Risk'
        error:
          type: object
          nullable: true
        request_id:
          type: string
          format: uuid
```

#### 3. Fix Circular References

**Error:**
```
Maximum call stack size exceeded (circular reference)
```

**Cause:** Schema references itself directly

```yaml
# ❌ Circular reference
Risk:
  type: object
  properties:
    parent:
      $ref: '#/components/schemas/Risk'  # ← Self-reference
```

**Fix:** Use `nullable` or restructure

```yaml
# ✅ Fixed
Risk:
  type: object
  properties:
    parent_id:
      type: string
      format: uuid
      nullable: true
```

#### 4. Manually Run Type Generation

```bash
cd api/openapi
npm run generate:types

# Check if file was created
ls -la ../../packages/web/src/types/api.ts
```

**Expected output:**
```bash
-rw-r--r-- 1 user staff 45678 Dec 22 10:00 api.ts
```

### Prevention

✅ **Validate before generating:**
```bash
npm run validate && npm run generate:types
```

✅ **Use npm script** (includes validation):
```bash
npm run generate
```

---

## Web TypeCheck Failures

### Symptom

```bash
❌ Web Type Check: FAILED
error TS2322: Type 'string' is not assignable to type 'RiskSeverity'
```

### Common Causes

1. **Type mismatch** between code and generated types
2. **Missing imports**
3. **Outdated generated types**
4. **Incorrect type usage**

### How to Fix

#### 1. Update Generated Types

```bash
# Regenerate types from latest OpenAPI spec
cd api/openapi
npm run generate:types

# Then run typecheck
cd ../../packages/web
npm run typecheck
```

#### 2. Fix Type Mismatches

**Error:**
```typescript
error TS2322: Type 'string' is not assignable to type 'RiskSeverity'

src/components/RiskForm.tsx(45,7): 
  severity: formData.severity
```

**Fix:** Use correct enum type

```typescript
// ❌ Wrong
const severity: string = 'major';

// ✅ Correct
import { RiskSeverity } from '../types/api';
const severity: RiskSeverity = 'major';
```

#### 3. Fix Missing Imports

**Error:**
```typescript
error TS2304: Cannot find name 'Risk'
```

**Fix:**
```typescript
import { Risk, RiskSeverity, RiskLikelihood } from '../types/api';
```

#### 4. Fix Nullable Types

**Error:**
```typescript
error TS2532: Object is possibly 'undefined'
```

**Fix with optional chaining:**
```typescript
// ❌ Wrong
const title = risk.title;

// ✅ Correct
const title = risk?.title ?? 'Untitled';
```

#### 5. Run TypeCheck Locally

```bash
cd packages/web
npm run typecheck

# Or use tsc directly
npx tsc --noEmit
```

### Prevention

✅ **Run typecheck before commit:**
```bash
cd packages/web && npm run typecheck
```

✅ **Use IDE** with TypeScript support (VSCode)  
✅ **Enable strict mode** in `tsconfig.json`

---

## Migration Failures

### Symptom

```bash
❌ Migration failed: 001_initial_schema.sql
ERROR:  syntax error at or near "CONSTRAINT"
```

### Common Causes

1. **SQL syntax errors**
2. **Missing dependencies** (tables, extensions)
3. **Constraint violations**
4. **Migration order issues**

### How to Fix

#### 1. Identify Failed Migration

Look for this in logs:
```bash
Applying migration: supabase/migrations/001_initial_schema.sql
ERROR:  relation "tenants" already exists
```

**Failed migration:** `001_initial_schema.sql`

#### 2. Fix SQL Syntax Errors

**Common syntax errors:**

```sql
-- ❌ Missing comma
CREATE TABLE risks (
  id UUID PRIMARY KEY
  tenant_id UUID NOT NULL
);

-- ✅ Fixed
CREATE TABLE risks (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL
);
```

```sql
-- ❌ Wrong constraint syntax
CONSTRAINT fk_tenant FOREIGN KEY tenant_id REFERENCES tenants(id)

-- ✅ Fixed
CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
```

#### 3. Fix Missing Dependencies

**Error:**
```sql
ERROR:  extension "uuid-ossp" does not exist
```

**Fix:** Create extension first

```sql
-- Add to beginning of migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**Error:**
```sql
ERROR:  relation "tenants" does not exist
```

**Fix:** Ensure migrations run in order

```bash
# Check migration filenames
ls -la supabase/migrations/

# Should be numbered:
001_initial_schema.sql
002_add_rls_policies.sql
003_add_audit_tables.sql
```

#### 4. Test Migration Locally

```bash
# Start local Supabase
supabase start

# Apply migration
supabase migration up

# If error, fix and reset
supabase db reset
supabase migration up
```

#### 5. Check for Duplicate Objects

**Error:**
```sql
ERROR:  relation "tenants" already exists
```

**Fix:** Use `IF NOT EXISTS`

```sql
-- ❌ Will fail if exists
CREATE TABLE tenants (...);

-- ✅ Safe
CREATE TABLE IF NOT EXISTS tenants (...);
```

#### 6. Validate Migration File

```bash
# Check syntax with PostgreSQL
psql -U postgres -f supabase/migrations/001_initial_schema.sql --dry-run
```

### Prevention

✅ **Test migrations locally** before committing  
✅ **Use `IF NOT EXISTS`** for idempotency  
✅ **Number migrations** sequentially (001, 002, 003)  
✅ **Include rollback migrations** for complex changes

---

## pgTAP Test Failures

### Symptom

```bash
not ok 1 - tenants table should exist
not ok 5 - RLS policy tenant_isolation should exist on risks
```

### Common Causes

1. **Missing tables/columns**
2. **Missing RLS policies**
3. **Incorrect test expectations**
4. **Migration not applied**

### How to Fix

#### 1. Identify Failed Test

Look for `not ok` lines:

```bash
ok 1 - tenants table exists
not ok 2 - sites table exists
ok 3 - users table exists
```

**Failed test:** Line 2 (sites table)

#### 2. Check Table Exists

```bash
# In CI logs, look for schema verification
✅ Table exists: tenants
❌ Table missing: sites
```

**Fix:** Ensure migration creates the table

```sql
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Check RLS Policies

**Failed test:**
```bash
not ok 5 - RLS policy tenant_isolation should exist on risks
```

**Fix:** Add missing RLS policy

```sql
-- Enable RLS
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation ON risks
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

#### 4. Verify Test Expectations

**Check test file:** `tests/database/01_schema.sql`

```sql
-- Test expects column
SELECT has_column('risks', 'owner_id', 'risks should have owner_id column');

-- Verify column exists in migration
CREATE TABLE risks (
  ...
  owner_id UUID NOT NULL,  -- ← Must exist
  ...
);
```

#### 5. Run pgTAP Tests Locally

```bash
# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# Install pgTAP
git clone https://github.com/theory/pgtap.git
cd pgtap && make && make install

# Run tests
psql -U postgres -d your_db -f tests/database/01_schema.sql
```

#### 6. Debug Specific Test

**Add debug output to test:**

```sql
-- Before test
SELECT * FROM pg_tables WHERE tablename = 'risks';

-- Run test
SELECT has_table('risks', 'risks table should exist');
```

### Prevention

✅ **Write tests first** (TDD approach)  
✅ **Run tests locally** before pushing  
✅ **Keep tests in sync** with migrations  
✅ **Test both schema and RLS** policies

---

## Pact Test Failures

### Symptom

```bash
❌ FAIL consumer/signals.consumer.pact.test.ts
Expected status 200, got 500
```

### Common Causes

1. **Mock server not started**
2. **Incorrect expectations**
3. **Matchers not used correctly**
4. **Provider not meeting contract**

### How to Fix

#### 1. Consumer Test Failures

**Error:**
```bash
Error: Cannot start mock server on port 9876
```

**Fix:** Kill existing process

```bash
# Local fix
lsof -ti:9876 | xargs kill -9

# CI fix (usually auto-handled)
# If persists, change port in config.ts
```

**Error:**
```bash
Expected field "owner_id" but not found
```

**Fix:** Update expectation to match API

```typescript
// ❌ Wrong expectation
willRespondWith: {
  body: {
    data: {
      id: uuid(),
      title: like('Risk')
      // Missing owner_id
    }
  }
}

// ✅ Correct expectation
willRespondWith: {
  body: {
    data: {
      id: uuid(),
      title: like('Risk'),
      owner_id: uuid()  // ← Added
    }
  }
}
```

#### 2. Provider Verification Failures

**Error:**
```bash
Expected status 200, got 401
```

**Fix:** Check authentication token

```bash
# Verify token is set
echo $TEST_AUTH_TOKEN

# Generate new token from Supabase
supabase auth login
```

**Error:**
```bash
State handler not found: workflows exist for tenant
```

**Fix:** Add state handler

```typescript
stateHandlers: {
  'workflows exist for tenant': async () => {
    // Seed test data
    await seedWorkflows();
    return 'State setup complete';
  }
}
```

#### 3. Run Pact Tests Locally

```bash
cd pact

# Consumer tests
npm run test:consumer

# Provider tests (needs Edge Functions)
export PROVIDER_BASE_URL="http://localhost:54321/functions/v1/make-server-fb677d93"
export TEST_AUTH_TOKEN="your-token"
npm run test:provider
```

### Prevention

✅ **Use Pact matchers** (like, eachLike, uuid)  
✅ **Test locally** before pushing  
✅ **Keep contracts minimal** - test contract, not business logic  
✅ **Update provider** when contracts change

---

## Missing Environment Variables

### Symptom

```bash
Warning: PROVIDER_BASE_URL not set - skipping verification
Error: Cannot connect to database - DATABASE_URL undefined
```

### Required GitHub Secrets

| Secret | Required For | Example Value |
|--------|--------------|---------------|
| `PROVIDER_BASE_URL` | Pact provider tests | `https://project.supabase.co/functions/v1/...` |
| `TEST_AUTH_TOKEN` | Pact provider tests | JWT token from Supabase |
| `PACT_BROKER_BASE_URL` | Pact broker (optional) | `https://pact-broker.com` |
| `PACT_BROKER_TOKEN` | Pact broker (optional) | Broker API token |

### How to Add Secrets

1. Go to **GitHub** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secret name and value
4. Click **Add secret**

### Verify Secrets

**Check in workflow logs:**

```bash
# Secret is set (value hidden)
PROVIDER_BASE_URL: ***

# Secret is NOT set
PROVIDER_BASE_URL: 
```

### Common Missing Variables

#### 1. PROVIDER_BASE_URL

**Symptom:**
```bash
⚠️  Provider URL not configured - skipping verification
```

**Fix:**
```bash
# Get Supabase project URL
supabase projects list

# Set secret in GitHub
PROVIDER_BASE_URL=https://your-project.supabase.co/functions/v1/make-server-fb677d93
```

#### 2. TEST_AUTH_TOKEN

**Symptom:**
```bash
Error: 401 Unauthorized
```

**Fix:**
```bash
# Generate test JWT from Supabase
# Add as GitHub secret
TEST_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Database Connection (Local Dev)

**Symptom:**
```bash
Error: Connection refused - localhost:5432
```

**Fix:**
```bash
# Start Supabase locally
supabase start

# Or use Docker
docker run -d -p 5432:5432 postgres:15
```

---

## General Troubleshooting

### CI Job Stuck/Hanging

**Symptom:**
```bash
Job has been running for 45 minutes...
```

**Common causes:**
1. Waiting for PostgreSQL to start
2. Infinite loop in test
3. Network timeout

**Fix:**
```bash
# Check for timeout in workflow
timeout-minutes: 10

# Cancel and retry
# In GitHub Actions, click "Cancel workflow"
```

### Intermittent Failures

**Symptom:**
```bash
Sometimes passes, sometimes fails
```

**Common causes:**
1. Race conditions
2. Network flakiness
3. Async timing issues

**Fix:**
```bash
# Add retries to flaky steps
- name: Run tests
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm run test
```

### Out of Disk Space

**Symptom:**
```bash
Error: No space left on device
```

**Fix:**
```bash
# Clean up in workflow
- name: Free disk space
  run: |
    docker system prune -af
    sudo rm -rf /usr/share/dotnet
```

---

## Getting Help

### 1. Check Logs

**Detailed logs:**
1. Click failed job
2. Expand failed step
3. Look for error messages (red text)

### 2. Search Issues

**GitHub Issues:**
- Search for similar error messages
- Check closed issues for solutions

### 3. Ask for Help

**Include this information:**
- Link to failed workflow run
- Error message
- What you've tried
- Local test results

### 4. Useful Commands

```bash
# Run all CI checks locally
cd api/openapi && npm run lint && npm run generate:types
cd ../../packages/web && npm run typecheck
cd ../../pact && npm run test:consumer

# Check PostgreSQL
docker ps | grep postgres
psql -U postgres -l

# Check Supabase
supabase status
```

---

## Quick Reference

### Job Failed → Action

| Failed Job | First Thing to Check | Quick Fix |
|------------|---------------------|-----------|
| **openapi-lint** | Run `npm run lint` locally | Fix Spectral errors |
| **generate-types** | Run `npm run validate` | Fix OpenAPI spec |
| **web-typecheck** | Run `npm run typecheck` | Fix type errors |
| **database-migrations** | Check migration syntax | Fix SQL errors |
| **pgTAP tests** | Run tests locally | Fix test/schema |
| **pact-consumer** | Run `npm run test:consumer` | Fix test expectations |
| **pact-provider** | Check `PROVIDER_BASE_URL` | Set GitHub secret |

### Common Commands

```bash
# Lint OpenAPI
cd api/openapi && npm run lint

# Generate types
cd api/openapi && npm run generate:types

# TypeCheck web
cd packages/web && npm run typecheck

# Test migrations
supabase db reset && supabase migration up

# Run pgTAP
psql -f tests/database/01_schema.sql

# Pact consumer
cd pact && npm run test:consumer

# Pact provider
cd pact && TEST_AUTH_TOKEN=xxx npm run test:provider
```

---

## Summary

### Prevention Checklist

Before pushing to CI:

- [ ] Run OpenAPI lint locally
- [ ] Generate and check types
- [ ] Run web typecheck
- [ ] Test migrations locally
- [ ] Run pgTAP tests
- [ ] Run Pact consumer tests
- [ ] Verify all secrets are set in GitHub

### When CI Fails

1. ✅ **Find failed job** in GitHub Actions
2. ✅ **Read error message** carefully
3. ✅ **Reproduce locally** if possible
4. ✅ **Fix and test** locally
5. ✅ **Push fix** and verify CI passes

### Need More Help?

- 📖 **CI Workflow:** `/.github/workflows/ci.yml`
- 📖 **OpenAPI Docs:** `/api/openapi/README.md`
- 📖 **Database Docs:** `/tests/database/README.md`
- 📖 **Pact Docs:** `/pact/README.md`

---

**Last Updated:** 2024-12-22  
**Version:** 1.0.0
