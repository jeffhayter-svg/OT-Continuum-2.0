# Troubleshooting Flowchart

**Visual guide for debugging common issues**

---

## When Something Breaks - Decision Tree

```
┌─────────────────────────────────────┐
│   Something is broken! 😱           │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Can you access      │
    │  http://localhost:   │ 
    │  5173 ?              │
    └─────┬────────┬───────┘
          │        │
         Yes      No
          │        │
          │        ▼
          │   ┌─────────────────────┐
          │   │ Is web app running? │
          │   │ Check terminal      │
          │   └─────┬───────┬───────┘
          │         │       │
          │        Yes     No
          │         │       │
          │         │       ▼
          │         │   ┌──────────────┐
          │         │   │ Start it:    │
          │         │   │ npm run dev  │
          │         │   └──────────────┘
          │         │
          │         ▼
          │   ┌─────────────────────┐
          │   │ Check browser F12   │
          │   │ console for errors  │
          │   └─────────────────────┘
          │
          ▼
    ┌──────────────────────┐
    │  Getting 401 error?  │
    └─────┬────────┬───────┘
          │        │
         Yes      No
          │        │
          │        ▼
          │   ┌──────────────────────┐
          │   │  Getting 403 error?  │
          │   └─────┬────────┬───────┘
          │         │        │
          │        Yes      No
          │         │        │
          │         │        ▼
          │         │   ┌──────────────────┐
          │         │   │ Getting 404 err? │
          │         │   └─────┬──────┬─────┘
          │         │         │      │
          │         │        Yes    No
          │         │         │      │
          │         │         │      ▼
          │         │         │  ┌────────────┐
          │         │         │  │ Check logs │
          │         │         │  └────────────┘
          │         │         │
          ▼         ▼         ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │  AUTH   │ │   RLS   │ │ MISSING │
    │ ISSUE   │ │  ISSUE  │ │   ROW   │
    └────┬────┘ └────┬────┘ └────┬────┘
         │           │           │
         ▼           ▼           ▼
```

---

## Auth Issue (401) - Fix Steps

```
┌──────────────────────────────────────┐
│         401 UNAUTHORIZED             │
│    "Not authenticated" error         │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Step 1: Get anon key │
    │ $ supabase status    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Step 2: Test API     │
    │ $ curl -H "Auth..."  │
    └──────────┬───────────┘
               │
         ┌─────┴─────┐
         │           │
      Works      Still 401
         │           │
         ▼           ▼
    ┌────────┐  ┌──────────────┐
    │ Fix    │  │ Check JWT    │
    │ token  │  │ is not       │
    │ in web │  │ expired      │
    └────────┘  └──────────────┘
```

---

## RLS Issue (403) - Diagnosis

```
┌──────────────────────────────────────┐
│           403 FORBIDDEN              │
│    "Not authorized" error            │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ This is RLS blocking you!        │
    │ Row exists but policy denies it  │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 1: Connect to database      │
    │ $ psql postgresql://...          │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 2: Disable RLS (temp)       │
    │ ALTER TABLE risks DISABLE        │
    │ ROW LEVEL SECURITY;              │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 3: Try query again          │
    │ SELECT * FROM risks WHERE id=... │
    └──────────────┬───────────────────┘
                   │
            ┌──────┴──────┐
            │             │
         Works          Still
         now!          fails
            │             │
            ▼             ▼
    ┌───────────┐   ┌──────────┐
    │ RLS was   │   │ Not RLS  │
    │ blocking  │   │ issue!   │
    └─────┬─────┘   └──────────┘
          │
          ▼
    ┌──────────────────────────────────┐
    │ Step 4: Check JWT claims         │
    │ - tenant_id correct?             │
    │ - site_ids correct?              │
    │ - role correct?                  │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Step 5: Re-enable RLS            │
    │ ALTER TABLE risks ENABLE         │
    │ ROW LEVEL SECURITY;              │
    └──────────────────────────────────┘
```

---

## Missing Row (404) - Fix Steps

```
┌──────────────────────────────────────┐
│           404 NOT FOUND              │
│      Resource doesn't exist          │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Step 1: Verify row exists        │
    │ $ psql postgresql://...          │
    │ SELECT * FROM risks WHERE id=... │
    └──────────────┬───────────────────┘
                   │
            ┌──────┴──────┐
            │             │
         Found          Not
         it!          found
            │             │
            ▼             ▼
    ┌───────────┐   ┌──────────────┐
    │ Not a 404 │   │ Row really   │
    │ Check RLS │   │ doesn't exist│
    └───────────┘   └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Create it or │
                    │ check your   │
                    │ ID is right  │
                    └──────────────┘
```

---

## Database Migration Failed - Fix

```
┌──────────────────────────────────────┐
│    Migration failed!                 │
│    ERROR: syntax error...            │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Check error type                 │
    └──────────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    "already            "syntax
    exists"             error"
         │                   │
         ▼                   ▼
    ┌─────────┐      ┌──────────────┐
    │ Reset   │      │ Fix SQL:     │
    │ $ supa  │      │ - Check ,    │
    │   base  │      │ - Check ()   │
    │   db    │      │ - Check FK   │
    │   reset │      └──────┬───────┘
    └─────────┘             │
                            ▼
                    ┌──────────────┐
                    │ $ supabase   │
                    │   db reset   │
                    └──────────────┘
```

---

## Edge Function 500 Error - Debug

```
┌──────────────────────────────────────┐
│    500 INTERNAL SERVER ERROR         │
│    Edge Function crashed!            │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Step 1: Check function logs      │
    │ $ supabase functions logs        │
    │   make-server-fb677d93 --follow  │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Look for error in logs:          │
    │ - Database connection?           │
    │ - SQL syntax?                    │
    │ - Missing env var?               │
    │ - Unhandled exception?           │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ Test health endpoint             │
    │ $ curl localhost:54321/          │
    │   functions/v1/.../health        │
    └──────────────────────────────────┘
```

---

## Quick Diagnosis Table

| Symptom | Status | Meaning | First Action |
|---------|--------|---------|--------------|
| 🔴 **401 Unauthorized** | NOT_AUTHENTICATED | No/invalid token | Check anon key |
| 🟠 **403 Forbidden** | NOT_AUTHORIZED | Token valid, RLS blocks | Check RLS policies |
| 🔵 **404 Not Found** | NOT_FOUND | Resource missing | Check row exists |
| 🟣 **422 Validation** | VALIDATION_ERROR | Bad request data | Check request body |
| ⚫ **500 Server Error** | INTERNAL_ERROR | Function crashed | Check function logs |

---

## Authentication vs Authorization vs Not Found

### Quick Test

```sql
-- Connect to database
psql postgresql://postgres:postgres@localhost:54432/postgres

-- TEST 1: Disable RLS
ALTER TABLE risks DISABLE ROW LEVEL SECURITY;

-- TEST 2: Query the resource
SELECT * FROM risks WHERE id = 'your-risk-id';

-- RESULTS:
-- ✅ Row found → RLS was blocking (403)
-- ❌ No rows → Resource missing (404)
-- 💥 Error → SQL issue (500)

-- TEST 3: Re-enable RLS
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
```

### Decision Logic

```
Is token provided?
├── NO  → 401 Unauthorized
└── YES → Is token valid?
          ├── NO  → 401 Unauthorized
          └── YES → Does row exist? (RLS disabled)
                    ├── NO  → 404 Not Found
                    └── YES → Does RLS allow access?
                              ├── NO  → 403 Forbidden
                              └── YES → 200 OK ✅
```

---

## Common Error Messages Decoded

### Database Errors

| Error Message | Meaning | Fix |
|--------------|---------|-----|
| `relation "risks" does not exist` | Table missing | Run migrations |
| `column "owner_id" does not exist` | Column missing | Check migration |
| `violates foreign key constraint` | Referenced row missing | Create parent first |
| `violates not-null constraint` | Required field empty | Provide value |
| `violates row-level security` | RLS blocking | Check policies |

### Function Errors

| Error Message | Meaning | Fix |
|--------------|---------|-----|
| `JWT expired` | Token too old | Get new token |
| `Invalid JWT` | Malformed token | Check token format |
| `Module not found` | Missing dependency | `npm install` |
| `Connection refused` | DB not running | `supabase start` |

### Web App Errors

| Error Message | Meaning | Fix |
|--------------|---------|-----|
| `Cannot find module` | Missing package | `npm install` |
| `ECONNREFUSED` | API not running | Start Supabase |
| `CORS error` | Wrong origin | Check CORS config |
| `Type error` | TypeScript mismatch | Regenerate types |

---

## Emergency Commands

### When Everything Fails

```bash
# 1. Nuclear reset (deletes all local data!)
supabase stop
docker system prune -af
supabase start
supabase db reset

# 2. Reinstall dependencies
rm -rf node_modules
npm install

# 3. Regenerate types
cd api/openapi
npm run generate:types

# 4. Restart web app
cd packages/web
npm run dev
```

### Quick Health Check

```bash
# Is Docker running?
docker ps

# Is Supabase running?
supabase status

# Is database accessible?
psql postgresql://postgres:postgres@localhost:54432/postgres -c "SELECT 1"

# Are Edge Functions running?
curl http://localhost:54321/functions/v1/make-server-fb677d93/health

# Is web app running?
curl http://localhost:5173
```

---

## Log Locations

| Component | Command | What to Look For |
|-----------|---------|------------------|
| **Supabase** | `supabase logs` | DB errors, connection issues |
| **Edge Functions** | `supabase functions logs make-server-fb677d93` | 500 errors, exceptions |
| **PostgreSQL** | `supabase logs --service postgres` | SQL errors, RLS denials |
| **Web App** | Browser F12 → Console | API errors, JS errors |
| **CI/CD** | GitHub Actions logs | Build/test failures |

---

## Status Indicators

### Healthy System ✅

```
✅ Docker Desktop: Running
✅ Supabase status: All services running
✅ Database: Accessible
✅ Edge Functions: Responding
✅ Web App: http://localhost:5173 loads
✅ Smoke tests: All pass
```

### Unhealthy System ❌

```
❌ Docker Desktop: Not running
❌ Supabase status: Error
❌ Database: Connection refused
❌ Edge Functions: 500 errors
❌ Web App: Cannot connect
❌ Smoke tests: Failures
```

---

**Remember:** When in doubt, check the logs! 📝

**Full Runbook:** `/RUNBOOK.md`  
**CI Troubleshooting:** `/docs/CI_TROUBLESHOOTING.md`

**Last Updated:** 2024-12-22
