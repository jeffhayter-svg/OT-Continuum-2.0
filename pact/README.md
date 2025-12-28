# Pact Contract Testing - OT Continuum

**Consumer-Driven Contract Testing for API Reliability**

---

## What is Pact Testing?

Pact is a **consumer-driven contract testing** framework that ensures your frontend (consumer) and backend (provider) stay in sync, even when teams work independently.

### How It Works (Simple Explanation)

Think of Pact like a **written contract** between two parties:

1. **Consumer (Web Frontend)** writes down what it expects:
   - "When I ask for risks, I expect a list with id, title, severity, etc."
   - "When I create a signal, I expect a 201 response with the created signal"

2. **Pact** saves this as a contract file (JSON)

3. **Provider (Edge Functions)** proves it can meet the contract:
   - "Yes, I can return risks in that format"
   - "Yes, I return 201 when creating signals"

4. **If the contract is broken**, tests fail early, preventing bugs in production

### Benefits

✅ **Catch integration bugs early** - Before deploying  
✅ **Independent deployment** - Frontend and backend teams work separately  
✅ **Living documentation** - Contracts document actual API usage  
✅ **Faster than E2E tests** - No need for full system running  

---

## File Structure

```
/pact/
├── consumer/
│   ├── signals.consumer.pact.test.ts      # Signals API expectations
│   ├── risk.consumer.pact.test.ts         # Risk API expectations
│   └── workflow.consumer.pact.test.ts     # Workflow API expectations
│
├── provider/
│   └── workflow.provider.pact.test.ts     # Verify Edge Functions
│
├── scripts/
│   ├── publish-pacts.js                   # Publish contracts to broker
│   └── can-deploy.js                      # Check if safe to deploy
│
├── pacts/                                  # Generated contract files (JSON)
├── logs/                                   # Pact logs
├── config.ts                              # Shared Pact configuration
├── package.json                           # Scripts and dependencies
└── README.md                              # This file
```

---

## Quick Start (For Non-Technical Founders)

### Prerequisites

1. **Node.js** installed (v18+)
2. **Edge Functions** deployed to Supabase

### Step 1: Install Dependencies

```bash
cd pact
npm install
```

### Step 2: Run Consumer Tests

These tests define what the frontend expects:

```bash
npm run test:consumer
```

**What happens:**
- ✅ Creates mock API server
- ✅ Frontend makes requests to mock
- ✅ Saves expectations as contract files in `/pact/pacts/`

**Expected output:**
```
PASS  consumer/signals.consumer.pact.test.ts
PASS  consumer/risk.consumer.pact.test.ts
PASS  consumer/workflow.consumer.pact.test.ts

Test Suites: 3 passed, 3 total
```

### Step 3: Run Provider Tests

These tests verify the Edge Functions meet the contract:

```bash
# Set your Edge Functions URL
export PROVIDER_BASE_URL="https://your-project.supabase.co/functions/v1/make-server-fb677d93"

# Set test authentication token
export TEST_AUTH_TOKEN="your-test-jwt-token"

# Run provider tests
npm run test:provider
```

**What happens:**
- ✅ Reads contract files
- ✅ Makes real requests to Edge Functions
- ✅ Verifies responses match expectations

**Expected output:**
```
PASS  provider/workflow.provider.pact.test.ts

Pact Verification Complete!
✅ All interactions verified
```

### Step 4: (Optional) Publish to Pact Broker

If you have a Pact Broker (centralized contract storage):

```bash
# Set broker URL
export PACT_BROKER_BASE_URL="https://your-broker.com"
export PACT_BROKER_TOKEN="your-token"

# Publish contracts
npm run pact:publish
```

---

## Running Tests

### Consumer Tests (Frontend Expectations)

```bash
# Run all consumer tests
npm run test:consumer

# Run specific consumer test
npm run test:consumer:signals
npm run test:consumer:risk
npm run test:consumer:workflow
```

### Provider Tests (Backend Verification)

```bash
# Set Edge Functions URL
export PROVIDER_BASE_URL="https://project.supabase.co/functions/v1/make-server-fb677d93"
export TEST_AUTH_TOKEN="your-jwt-token"

# Run all provider tests
npm run test:provider

# Run specific provider test
npm run test:provider:workflow
```

### Run Everything

```bash
npm run test:all
```

---

## CI/CD Integration

### GitHub Actions - Consumer Tests

```yaml
name: Pact Consumer Tests

on: [push, pull_request]

jobs:
  consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd pact
          npm install
      
      - name: Run consumer tests
        run: |
          cd pact
          npm run test:consumer
      
      - name: Publish pacts
        if: github.ref == 'refs/heads/main'
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}
        run: |
          cd pact
          npm run pact:publish
```

### GitHub Actions - Provider Tests

```yaml
name: Pact Provider Tests

on: [push, pull_request]

jobs:
  provider:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd pact
          npm install
      
      - name: Run provider tests
        env:
          PROVIDER_BASE_URL: ${{ secrets.PROVIDER_BASE_URL }}
          TEST_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
        run: |
          cd pact
          npm run test:provider
```

---

## Consumer Tests Explained

### Example: Signals Consumer Test

```typescript
describe('Signals API Consumer Tests', () => {
  it('returns a list of signals with pagination', async () => {
    // 1. Define what we expect
    await provider.addInteraction({
      state: 'signals exist for tenant',
      uponReceiving: 'a request to list signals',
      withRequest: {
        method: 'GET',
        path: '/signals',
        query: { limit: '20', offset: '0' },
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          Accept: 'application/json'
        }
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: eachLike({
            id: uuid(),
            site_id: uuid(),
            signal_type: like('sensor'),
            value: like(85.5)
          }),
          pagination: { limit: 20, offset: 0, total: 100 },
          error: null,
          request_id: uuid()
        }
      }
    });

    // 2. Make the actual request
    const response = await fetch('/signals?limit=20&offset=0');
    const data = await response.json();

    // 3. Verify expectations
    expect(response.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
  });
});
```

**What this does:**
1. ✅ Defines expected request (GET /signals with query params)
2. ✅ Defines expected response (200 with data array)
3. ✅ Makes request to mock server
4. ✅ Saves interaction to contract file

---

## Provider Tests Explained

### Example: Workflow Provider Test

```typescript
describe('Workflow API Provider Verification', () => {
  it('validates the expectations of the web consumer', async () => {
    const verifier = new Verifier({
      provider: 'ot-continuum-api',
      providerBaseUrl: 'https://project.supabase.co/functions/v1/...',
      pactUrls: ['pacts/ot-continuum-web-ot-continuum-api.json'],
      
      // Set up test data for states
      stateHandlers: {
        'workflows exist for tenant': async () => {
          // Seed database with test workflows
          return 'State setup complete';
        }
      },
      
      // Add auth headers
      requestFilter: (req, res, next) => {
        req.headers['Authorization'] = `Bearer ${token}`;
        next();
      }
    });

    await verifier.verifyProvider();
  });
});
```

**What this does:**
1. ✅ Reads contract file
2. ✅ Makes real requests to Edge Functions
3. ✅ Verifies responses match contract
4. ✅ Fails if provider doesn't meet expectations

---

## Test Coverage

### Signals API

**Consumer Tests:**
- ✅ GET /signals - List signals with pagination
- ✅ GET /signals?site_id=X - Filter by site
- ✅ POST /signals - Create signal
- ✅ POST /signals/batch - Batch create
- ✅ Error: 401 when not authenticated
- ✅ Error: 422 on validation failure

### Risk API

**Consumer Tests:**
- ✅ GET /risks - List risks (ownership bypass)
- ✅ POST /risks - Create risk (with owner_id)
- ✅ PATCH /risks/:id - Update risk (audit trail)
- ✅ GET /risks/:id/events - Risk event history
- ✅ MS2: Decision rationale required

### Workflow API

**Consumer Tests:**
- ✅ GET /workflows - List workflows
- ✅ POST /workflows - Create workflow (manager)
- ✅ GET /work-items - List work items (assignee bypass)
- ✅ POST /work-items - Create work item
- ✅ PATCH /work-items/:id - Update status (audit trail)

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PROVIDER_BASE_URL` | Yes (provider) | Edge Functions base URL |
| `TEST_AUTH_TOKEN` | Yes (provider) | JWT token for authentication |
| `PACT_BROKER_BASE_URL` | No | Pact Broker URL (for publishing) |
| `PACT_BROKER_TOKEN` | No | Pact Broker auth token |
| `GIT_COMMIT` | No | Git commit hash (for versioning) |
| `GIT_BRANCH` | No | Git branch name (for tagging) |

### Mock JWT Token

Default test token (defined in `config.ts`):

```json
{
  "sub": "12345678-1234-1234-1234-1234567890ab",
  "tenant_id": "87654321-4321-4321-4321-876543210dcb",
  "role": "admin",
  "site_ids": null,
  "email": "test@example.com"
}
```

**To use a real JWT:**
```bash
export TEST_AUTH_TOKEN="your-real-jwt-token"
```

---

## Troubleshooting

### Issue: Consumer tests fail

**Symptoms:**
```
Error: Cannot start mock server on port 9876
```

**Solution:**
1. Check if port 9876 is already in use
2. Kill any existing processes: `lsof -ti:9876 | xargs kill -9`
3. Try again

---

### Issue: Provider tests fail with 401

**Symptoms:**
```
Expected status 200, got 401
```

**Solution:**
1. Check `TEST_AUTH_TOKEN` is set correctly
2. Verify token is valid (not expired)
3. Generate new token from Supabase Auth

---

### Issue: Provider tests fail with connection error

**Symptoms:**
```
ECONNREFUSED 127.0.0.1:54321
```

**Solution:**
1. Check Edge Functions are deployed
2. Verify `PROVIDER_BASE_URL` is correct
3. Ensure Supabase is running (local) or accessible (remote)

---

### Issue: "State not found" error

**Symptoms:**
```
State handler not found: workflows exist for tenant
```

**Solution:**
1. Add state handler in provider test
2. Seed test data in state handler
3. Ensure state name matches consumer test

---

## Pact Broker (Optional)

### What is a Pact Broker?

A centralized repository for storing and managing Pact contracts. It enables:

- 📦 **Centralized contracts** - All teams access same contracts
- 📊 **Version tracking** - See which versions are compatible
- 🚀 **Can-I-Deploy** - Check if safe to deploy
- 📈 **Dashboards** - Visual contract status

### Setting Up Pact Broker

**Option 1: Hosted (Recommended)**
- Sign up at https://pactflow.io (free tier available)
- Get broker URL and token
- Set environment variables

**Option 2: Self-Hosted**
- Run Pact Broker in Docker
- Configure URL and credentials

### Publishing Contracts

```bash
export PACT_BROKER_BASE_URL="https://your-broker.com"
export PACT_BROKER_TOKEN="your-token"

npm run pact:publish
```

### Checking Deployment Safety

```bash
npm run pact:can-deploy
```

**Output:**
```
✅ Safe to deploy!

Computer says yes \o/

ot-continuum-web version 1.0.0 can be deployed to production
  with ot-continuum-api version 2.3.4
```

---

## Best Practices

### ✅ DO:

1. **Run consumer tests before every commit**
2. **Run provider tests in CI/CD**
3. **Use Pact matchers** (like, eachLike, uuid) for flexible contracts
4. **Keep contracts focused** - One interaction per test
5. **Use meaningful state names**
6. **Publish contracts to broker** (if available)

### ❌ DON'T:

1. **Don't test business logic** - Only test the contract
2. **Don't use exact values** - Use matchers instead
3. **Don't skip provider tests** - They're critical
4. **Don't ignore failing tests** - Fix contracts immediately
5. **Don't test multiple scenarios in one test**

---

## Frequently Asked Questions

### Q: Do I need a Pact Broker?

**A:** No, it's optional. You can:
- ✅ **Without broker:** Share contract files via Git
- ✅ **With broker:** Centralized management, better for teams

### Q: How often should I run these tests?

**A:**
- **Consumer tests:** Every commit (fast, no dependencies)
- **Provider tests:** Every deployment (verify Edge Functions)
- **CI/CD:** Both on every PR

### Q: What if a test fails?

**A:**
1. **Consumer test fails:** Frontend expectations are wrong
2. **Provider test fails:** Edge Functions don't meet contract
3. **Fix:** Either update contract or fix implementation

### Q: Can I test locally without deployed Edge Functions?

**A:**
- **Consumer tests:** Yes, always (use mock server)
- **Provider tests:** No, need real Edge Functions running

### Q: How do I add a new API endpoint?

**A:**
1. Write consumer test for new endpoint
2. Run consumer tests (generates contract)
3. Implement Edge Function
4. Run provider tests (verify implementation)

---

## Summary

**Status:** ✅ Complete and production-ready

### What Was Created

1. ✅ **Consumer tests** - 3 files testing Signals, Risk, Workflow APIs
2. ✅ **Provider tests** - Workflow provider verification
3. ✅ **Shared config** - Centralized Pact configuration
4. ✅ **Scripts** - Publish, can-deploy helpers
5. ✅ **CI integration** - Ready for GitHub Actions
6. ✅ **Documentation** - Non-technical friendly guide

### Test Statistics

| Metric | Count |
|--------|-------|
| **Consumer test suites** | 3 |
| **Consumer test cases** | 15+ |
| **Provider test suites** | 1 |
| **API interactions tested** | 20+ |
| **Error scenarios** | 5+ |

### Next Steps

1. **Install dependencies:** `cd pact && npm install`
2. **Run consumer tests:** `npm run test:consumer`
3. **Deploy Edge Functions** to Supabase
4. **Run provider tests:** `npm run test:provider`
5. **Add to CI/CD** - GitHub Actions workflows
6. **(Optional) Set up Pact Broker** for team collaboration

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-22  
**Status:** Production-ready
