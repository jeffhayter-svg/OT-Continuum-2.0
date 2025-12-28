# How to Run Pact Tests - Simple Guide

**For Non-Technical Founders**

---

## What Are These Tests?

These tests make sure your **website** (frontend) and **server** (backend) understand each other correctly. Think of it like making sure two people speak the same language before they have a conversation.

**Why it matters:** If they don't match, your app breaks. These tests catch problems **before** users see them.

---

## Quick Start (5 Minutes)

### Step 1: Open Terminal

On **Mac:** Press `Cmd + Space`, type "Terminal", press Enter  
On **Windows:** Press `Win + R`, type "cmd", press Enter

### Step 2: Go to Pact Folder

```bash
cd /path/to/your/project/pact
```

*(Replace `/path/to/your/project` with your actual project location)*

### Step 3: Install Dependencies (First Time Only)

```bash
npm install
```

**What this does:** Downloads the testing tools. Takes 1-2 minutes.

**Expected output:** Lots of text scrolling. Wait for "added X packages"

### Step 4: Run Consumer Tests

```bash
npm run test:consumer
```

**What this does:** Tests what your **website** expects from the server

**Expected output:**
```
PASS  consumer/signals.consumer.pact.test.ts
PASS  consumer/risk.consumer.pact.test.ts
PASS  consumer/workflow.consumer.pact.test.ts

Tests: 15 passed, 15 total
Time: 5.2s
```

✅ **Green "PASS"** = Good  
❌ **Red "FAIL"** = Something needs fixing

### Step 5: Run Provider Tests

First, tell it where your server is:

```bash
export PROVIDER_BASE_URL="https://your-project.supabase.co/functions/v1/make-server-fb677d93"
```

*(Replace `your-project` with your actual Supabase project ID)*

Then run the tests:

```bash
npm run test:provider
```

**What this does:** Tests if your **server** meets the website's expectations

**Expected output:**
```
PASS  provider/workflow.provider.pact.test.ts

Pact Verification Complete!
✅ All interactions verified
```

---

## What Do I Do If Tests Fail?

### Consumer Test Fails

**What it means:** The website's expectations are wrong or the test is broken

**Who fixes it:** Frontend developer

**Example:**
```
FAIL  consumer/signals.consumer.pact.test.ts
Expected status 200, got 500
```

### Provider Test Fails

**What it means:** The server doesn't do what the website expects

**Who fixes it:** Backend developer

**Example:**
```
FAIL  provider/workflow.provider.pact.test.ts
Expected field "owner_id" but not found
```

### Common Issues

#### Error: "Port 9876 already in use"

**Fix:**
```bash
# Mac/Linux
lsof -ti:9876 | xargs kill -9

# Windows
netstat -ano | findstr :9876
taskkill /PID <number> /F
```

#### Error: "Cannot connect to server"

**Fix:** Make sure your Edge Functions are deployed and the URL is correct

---

## Running in CI/CD (GitHub Actions)

### Already Set Up? ✅

If you have `.github/workflows/pact.yml`, tests run automatically:

- ✅ **On every commit** - Consumer tests run
- ✅ **On every pull request** - Provider tests run
- ✅ **Before merging** - All tests must pass

### View Results

1. Go to your GitHub repo
2. Click "Actions" tab
3. See test results for each commit

**Green checkmark** = Tests passed  
**Red X** = Tests failed (check logs)

---

## Publishing Contracts (Optional)

### What is This?

Saves your contracts to a central place so teams can see them. **Not required** unless you have multiple teams.

### How to Publish

1. **Get a Pact Broker URL** (ask your DevOps team or use https://pactflow.io)

2. **Set environment variables:**
   ```bash
   export PACT_BROKER_BASE_URL="https://your-broker.com"
   export PACT_BROKER_TOKEN="your-secret-token"
   ```

3. **Publish:**
   ```bash
   npm run pact:publish
   ```

**Expected output:**
```
📤 Publishing Pact contracts to broker...
✅ Pact contracts published successfully
```

---

## Checking If It's Safe to Deploy

### What is This?

Before deploying to production, check if your frontend and backend versions are compatible.

### How to Check

```bash
npm run pact:can-deploy
```

**Expected output:**
```
🔍 Checking if deployment is safe...
✅ Safe to deploy!

Computer says yes \o/
```

❌ **If not safe:** Don't deploy. Fix the issues first.

---

## When to Run These Tests

### During Development

**Consumer tests:**
- Run **before committing code**
- Takes ~5 seconds
- No server needed

```bash
npm run test:consumer
```

### Before Deployment

**Provider tests:**
- Run **before deploying**
- Takes ~30 seconds
- Needs server running

```bash
npm run test:provider
```

### Automated (CI/CD)

Tests run automatically on:
- Every commit
- Every pull request
- Before merging

**No manual action needed** once set up.

---

## Quick Reference

### All Commands

```bash
# Install (first time only)
npm install

# Run consumer tests (fast, no server needed)
npm run test:consumer

# Run provider tests (needs server)
npm run test:provider

# Run everything
npm run test:all

# Publish to broker (optional)
npm run pact:publish

# Check if safe to deploy (optional)
npm run pact:can-deploy

# Clean up generated files
npm run clean
```

### Environment Variables

```bash
# Required for provider tests
export PROVIDER_BASE_URL="https://project.supabase.co/functions/v1/..."
export TEST_AUTH_TOKEN="your-jwt-token"

# Optional for broker
export PACT_BROKER_BASE_URL="https://your-broker.com"
export PACT_BROKER_TOKEN="your-token"
```

---

## Getting Help

### Test Output is Confusing

**Look for:**
- **PASS** = Good (green)
- **FAIL** = Problem (red)
- **Error message** = Tells you what's wrong

**Example:**
```
❌ FAIL  consumer/signals.consumer.pact.test.ts
  ● Signals API › GET /signals › returns a list of signals

    Expected status 200, got 401

      at Object.<anonymous> (consumer/signals.consumer.pact.test.ts:45:30)
```

**Translation:** The GET /signals test failed. Expected 200 (success) but got 401 (not authenticated).

### Who to Ask

- **Consumer test fails:** Frontend developer
- **Provider test fails:** Backend developer
- **CI/CD issues:** DevOps engineer
- **Pact Broker issues:** DevOps engineer

### Useful Resources

- **Pact Documentation:** https://docs.pact.io/
- **PactFlow (Hosted Broker):** https://pactflow.io/
- **GitHub Issues:** Report bugs in your repo

---

## Success Checklist

✅ Installed dependencies (`npm install`)  
✅ Consumer tests pass (`npm run test:consumer`)  
✅ Provider tests pass (`npm run test:provider`)  
✅ Tests run in CI/CD (GitHub Actions)  
✅ (Optional) Contracts published to broker  

**You're all set!** 🎉

---

## Summary

**What you learned:**

1. ✅ How to install Pact dependencies
2. ✅ How to run consumer tests (frontend expectations)
3. ✅ How to run provider tests (backend verification)
4. ✅ What to do if tests fail
5. ✅ (Optional) How to publish contracts

**Time to run tests:** ~1 minute  
**Frequency:** Before every commit/deployment  
**Benefit:** Catch integration bugs early  

**Remember:** Green = Good, Red = Fix before deploying!

---

**Questions?** Ask your development team or check the full README.md for technical details.
