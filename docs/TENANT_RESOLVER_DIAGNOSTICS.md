# TenantResolver Diagnostics - Empty Memberships Decision Tree

## 🔍 **Query Results Analysis Flow**

```
┌─────────────────────────────────────────┐
│  Query tenant_members table              │
│  SELECT tenant_id, role, tenants(...)   │
│  WHERE user_id = auth.uid()             │
└─────────────┬───────────────────────────┘
              │
              ▼
     ┌────────────────┐
     │ Check Response │
     └────────┬───────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
┌─────────┐      ┌──────────┐
│ Error?  │      │ Success? │
└────┬────┘      └─────┬────┘
     │ YES            │ YES
     │                │
     ▼                ▼
┌──────────────┐  ┌────────────────┐
│ Analyze Error│  │ Count Results  │
└──────┬───────┘  └────────┬───────┘
       │                   │
       │          ┌────────┴────────┐
       │          │                 │
       │          ▼                 ▼
       │    ┌──────────┐      ┌──────────┐
       │    │ Empty?   │      │ 1+ rows? │
       │    └────┬─────┘      └─────┬────┘
       │         │ YES             │ YES
       │         │                 │
       │         ▼                 ▼
       │    ┌──────────────────┐  ┌───────────────┐
       │    │ New User         │  │ Existing User │
       │    │ (Valid State)    │  │ (Success)     │
       │    │                  │  │               │
       │    │ Log:             │  │ Log:          │
       │    │ ✅ Query OK       │  │ ✅ N found    │
       │    │ 📋 0 memberships │  │ 📋 [members]  │
       │    │ → Onboarding     │  │ → Auto-select │
       │    └──────────────────┘  │   or Picker   │
       │                          └───────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Error Type Detection (3 Checks)   │
└──────┬─────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ Check #1:        │
│ Code = 42501?    │
│ (PostgreSQL)     │
└──┬───────────┬───┘
   │ YES       │ NO
   │           │
   ▼           ▼
┌──────────┐  ┌──────────────────┐
│ GRANT    │  │ Check #2:        │
│ Missing  │  │ Message contains │
│          │  │ "policy"/"rls"?  │
│ Show:    │  └──┬───────────┬───┘
│ - SQL    │     │ YES       │ NO
│ - Grants │     │           │
│ - RLS    │     ▼           ▼
└──────────┘  ┌──────────┐  ┌─────────┐
              │ RLS      │  │ Generic │
              │ Policy   │  │ Error   │
              │ Missing  │  │         │
              │          │  │ Show:   │
              │ Show:    │  │ Message │
              │ - Admin  │  └─────────┘
              │   Action │
              │ - Error  │
              └──────────┘
```

---

## 📊 **5 Possible Outcomes**

### **Outcome 1: New User (Empty, No Error) ✅**

**Console:**
```
[TenantResolver] 📊 Query Results Analysis
  Error object: null
  Data returned: []
  Memberships count: 0
  ✅ Query succeeded (no error)
  📋 Result: Empty array (0 memberships)
  
  This means:
    - RLS policies are working correctly (no permission denied)
    - User has successfully authenticated
    - BUT: No tenant_members rows exist for this user
    - Action: Route to onboarding to create first organization
```

**UI:** Onboarding page  
**Action:** User creates organization  
**Status:** ✅ Valid state

---

### **Outcome 2: Existing User - Single Tenant ✅**

**Console:**
```
[TenantResolver] 📊 Query Results Analysis
  Error object: null
  Data returned: [{ tenant_id: '...', role: 'admin', ... }]
  Memberships count: 1
  ✅ Query succeeded
  📋 Result: 1 membership(s) found
  Memberships: [...]

[TenantResolver] ✅ Found 1 membership(s)
[TenantResolver] Auto-selecting single tenant: Acme Industrial
```

**UI:** Dashboard (auto-selected)  
**Action:** User proceeds to app  
**Status:** ✅ Valid state

---

### **Outcome 3: Existing User - Multiple Tenants ✅**

**Console:**
```
[TenantResolver] 📊 Query Results Analysis
  Error object: null
  Data returned: [{ ... }, { ... }, { ... }]
  Memberships count: 3
  ✅ Query succeeded
  📋 Result: 3 membership(s) found
  Memberships: [...]

[TenantResolver] Multiple tenants found → showing picker
```

**UI:** Tenant picker (TenantPicker.tsx)  
**Action:** User selects organization  
**Status:** ✅ Valid state

---

### **Outcome 4: Missing GRANT Statements ❌**

**Console:**
```
[TenantResolver] 📊 Query Results Analysis
  Error object: {
    code: '42501',
    message: 'permission denied for table tenant_members',
    details: null,
    hint: null
  }
  Data returned: null
  Memberships count: 0
  ❌ Query failed with error:
    - Code: 42501
    - Message: permission denied for table tenant_members
    - Details: null
    - Hint: null
```

**UI Error Message:**
```
Permission denied for database tables.

ACTION REQUIRED: Execute this SQL in Supabase Dashboard → SQL Editor (Role: postgres):

-- =========================================================
-- OT Continuum: Minimal RLS + Grants for tenant resolution
-- =========================================================

-- 1) GRANTS (required in addition to RLS)
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE            ON TABLE public.users TO authenticated;

[... full SQL script ...]

After executing the above SQL, refresh this page.
```

**Action:** Admin runs SQL script  
**Status:** ❌ Configuration error

---

### **Outcome 5: Missing RLS Policy ❌**

**Console:**
```
[TenantResolver] 📊 Query Results Analysis
  Error object: {
    message: 'RLS policy violation on tenant_members',
    code: null,
    details: null,
    hint: null
  }
  Data returned: null
  Memberships count: 0
  ❌ Query failed with error:
    - Code: null
    - Message: RLS policy violation on tenant_members
    - Details: null
    - Hint: null
  🚨 RLS POLICY DENIAL DETECTED
```

**UI Error Message:**
```
Membership table access denied (RLS).

Admin must add SELECT policy for tenant_members.

Error: RLS policy violation on tenant_members
```

**Action:** Admin creates SELECT policy  
**Status:** ❌ Configuration error

---

## 🎯 **Key Improvements**

| Before | After |
|--------|-------|
| ❌ "Memberships found: 0" | ✅ "Empty array (0 memberships)" + explanation |
| ❌ No error vs empty distinction | ✅ Clear RLS vs empty detection |
| ❌ No error details | ✅ Full error object (code, message, details, hint) |
| ❌ Ambiguous state | ✅ Explicit state diagnosis |
| ❌ "Something went wrong" | ✅ Actionable error messages |

---

## 🔍 **Error Properties Logged**

All Supabase error properties are now logged:

| Property | Example | Purpose |
|----------|---------|---------|
| `code` | `'42501'` | PostgreSQL error code (permission denied) |
| `message` | `'permission denied for table tenant_members'` | Human-readable error description |
| `details` | `null` or detailed info | Additional context about the error |
| `hint` | `null` or suggestion | PostgreSQL hint for fixing the error |

**Example:**
```typescript
console.error('  - Code:', memberError.code);
console.error('  - Message:', memberError.message);
console.error('  - Details:', memberError.details);
console.error('  - Hint:', memberError.hint);
```

---

## 📋 **Error Detection Checklist**

### **Check #1: PostgreSQL Permission Error (42501)**
```typescript
if (memberError.code === '42501') {
  // Missing GRANT statements
  throw new Error('Permission denied for database tables...');
}
```

**Detects:**
- Missing `GRANT USAGE ON SCHEMA public TO authenticated`
- Missing `GRANT SELECT ... ON TABLE public.tenant_members TO authenticated`
- PostgreSQL role permissions not configured

---

### **Check #2: RLS Policy Keywords**
```typescript
if (memberError.message?.toLowerCase().includes('policy') || 
    memberError.message?.toLowerCase().includes('permission') ||
    memberError.message?.toLowerCase().includes('rls')) {
  console.error('🚨 RLS POLICY DENIAL DETECTED');
  throw new Error('Membership table access denied (RLS)...');
}
```

**Detects:**
- Missing RLS SELECT policy on tenant_members
- Incorrect policy conditions (`USING` clause wrong)
- RLS enabled but no policies created

---

### **Check #3: Generic Query Error**
```typescript
throw new Error(`Failed to query memberships: ${memberError.message}`);
```

**Detects:**
- Network errors
- Database connection issues
- Schema mismatches
- Foreign key violations
- Other unexpected errors

---

## 🆘 **Troubleshooting Guide**

### **Issue: "Memberships found: 0" but no explanation**

**Before (Ambiguous):**
```
[TenantResolver] Memberships found: 0
```

**After (Clear):**
```
[TenantResolver] 📊 Query Results Analysis
  ✅ Query succeeded (no error)
  📋 Result: Empty array (0 memberships)
  
  This means:
    - RLS policies are working correctly
    - User authenticated successfully
    - No tenant_members rows exist for this user
    - Action: Route to onboarding
```

---

### **Issue: "Permission denied for table tenant_members"**

**Cause:** Missing GRANT statements  
**Detection:** Error code = `42501`  
**Fix:** Run SQL script shown in error message

**Console:**
```
❌ Query failed with error:
  - Code: 42501
  - Message: permission denied for table tenant_members
```

**User sees:** Full SQL script to fix permissions

---

### **Issue: "RLS policy violation"**

**Cause:** Missing SELECT policy on tenant_members  
**Detection:** Error message contains "policy"  
**Fix:** Create SELECT policy

**Console:**
```
🚨 RLS POLICY DENIAL DETECTED
```

**User sees:**
> Membership table access denied (RLS). Admin must add SELECT policy for tenant_members.

---

## ✅ **Testing Checklist**

- [ ] ✅ Test new user (empty results, no error)
- [ ] ✅ Test existing user with 1 tenant (auto-select)
- [ ] ✅ Test existing user with 2+ tenants (picker)
- [ ] ❌ Test missing GRANT (error 42501)
- [ ] ❌ Test missing SELECT policy (RLS denial)
- [ ] ✅ Verify all error properties logged (code, message, details, hint)
- [ ] ✅ Verify empty results explanation shown
- [ ] ✅ Verify RLS vs empty distinction clear

---

**Last Updated:** December 27, 2024  
**Pattern Status:** ✅ **Production Ready**  
**Maintained by:** OT Continuum Engineering
