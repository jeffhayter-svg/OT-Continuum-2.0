# Tenant Resolution & Onboarding Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION LAYER                             │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │
                    ┌───────────▼──────────┐
                    │   User visits app    │
                    └───────────┬──────────┘
                                │
                   ┌────────────┴────────────┐
                   │  Has session?           │
                   └────────────┬────────────┘
                           NO   │   YES
                  ┌─────────────┴─────────────┐
                  │                           │
                  ▼                           ▼
         ┌────────────────┐         ┌────────────────┐
         │  /login        │         │  Check route   │
         │  Show login    │         └────────┬───────┘
         │  screen        │                  │
         └────────┬───────┘         ┌────────┴────────┐
                  │                 │ Protected?      │
                  │                 └────────┬────────┘
         Enter credentials            NO │    │ YES
                  │                       │    │
                  ▼                       │    ▼
         ┌────────────────┐              │  ┌────────────────┐
         │ Submit form    │              │  │ Allow access   │
         │ supabase.auth  │              │  └────────────────┘
         │ .signIn()      │              │
         └────────┬───────┘              │
                  │                      │
       ┌──────────┴──────────┐          │
       │  Success?            │          │
       └──────────┬───────────┘          │
             YES  │   NO                 │
         ┌────────┴─────────┐            │
         │                  │            │
         ▼                  ▼            ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│ Session Created│  │ Show error   │  │ Allow access │
│ JWT stored     │  │ Stay on login│  │ to route     │
└────────┬───────┘  └──────────────┘  └──────────────┘
         │
         │
┌────────▼─────────────────────────────────────────────────────────────────┐
│                    TENANT RESOLUTION LAYER                                │
└───────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  /tenant-resolver       │
│  POST-LOGIN GATE        │
└──────────┬──────────────┘
           │
           │ GET /functions/v1/signals/me
           │ Authorization: Bearer <jwt>
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│  Response:                                                    │
│  {                                                            │
│    user: { id, email, full_name },                          │
│    tenants: [                                               │
│      { id, name, role, status },                           │
│      ...                                                    │
│    ],                                                        │
│    default_tenant_id?: "..."                               │
│  }                                                           │
└──────────┬───────────────────────────────────────────────────┘
           │
           │
    ┌──────┴──────────────────────────────┐
    │  How many tenants?                   │
    └──────┬──────────────────────────────┘
           │
    ┌──────┴──────┬──────────────┬──────────────┐
    │             │              │              │
    │ ZERO        │ ONE          │ MULTIPLE     │
    │             │              │              │
    ▼             ▼              ▼              │
┌───────┐   ┌─────────┐   ┌──────────┐         │
│ None  │   │ Single  │   │ Multiple │         │
└───┬───┘   └────┬────┘   └─────┬────┘         │
    │            │              │              │
    │            │              │              │
    ▼            ▼              ▼              │
```

## Flow A: No Tenants (Onboarding)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FLOW A: NEW USER - NO TENANTS                                          │
└─────────────────────────────────────────────────────────────────────────┘

GET /me returns: { tenants: [] }
         │
         ▼
┌─────────────────────────┐
│  Navigate to:           │
│  /onboarding            │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  ONBOARDING WIZARD                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Step 1 of 3: Create Organization                │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  • Organization Name (required)                  │   │
│  │  • Industry (optional dropdown)                  │   │
│  │  • Region (optional dropdown)                    │   │
│  │                                                   │   │
│  │  [Create Organization]                           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────────────────┘
           │
           │ User fills form and clicks "Create Organization"
           │
           ▼
    POST /functions/v1/signals/organizations
    Authorization: Bearer <jwt>
    Body: { name, industry?, region? }
           │
           ▼
    ┌──────────────────────────┐
    │  Backend creates:         │
    │  1. Tenant record         │
    │  2. TenantMember record   │
    │     (user as admin)       │
    └──────────┬─────────────────┘
               │
               ▼
    Response: {
      tenant: { id: "...", name: "..." },
      membership: { role: "admin" }
    }
               │
               ▼
    ┌──────────────────────────┐
    │  Save to localStorage:    │
    │  • activeTenantId         │
    │  • activeTenantName       │
    │  • activeRole = "admin"   │
    └──────────┬─────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  ONBOARDING WIZARD                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Step 2 of 3: Create First Site (Optional)      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  • Site Name (required)                          │   │
│  │  • Site Type (required dropdown)                 │   │
│  │  • Country (optional)                            │   │
│  │  • State/Province (optional)                     │   │
│  │                                                   │   │
│  │  [Skip for Now]  [Create Site]                   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │  User picks? │
    └──────┬───────┘
           │
    ┌──────┴────────────┬──────────────────┐
    │ Skip              │ Create Site      │
    │                   │                  │
    ▼                   ▼                  │
Skip to Step 3   POST /sites              │
                 (tenant_id inferred)      │
                 Body: { name, type, ... } │
                        │                  │
                        ▼                  │
                 Response: { site: {...} } │
                        │                  │
                        ▼                  │
                 Save site info            │
                        │                  │
                        └──────┬───────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│  ONBOARDING WIZARD                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Step 3 of 3: You're All Set!                   │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  Summary:                                         │   │
│  │  ✅ Organization: "ACME Manufacturing"          │   │
│  │  ✅ Site: "Houston Refinery" (if created)       │   │
│  │                                                   │   │
│  │  [Enter OT Continuum →]                          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────────────────┘
           │
           │ User clicks "Enter OT Continuum"
           │
           ▼
    Navigate to: /
           │
           ▼
┌──────────────────────────┐
│  App Home (Dashboard)    │
│  • Active tenant set     │
│  • Ready to use          │
└──────────────────────────┘
```

## Flow B: Single Tenant (Auto-Select)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FLOW B: EXISTING USER - SINGLE TENANT                                  │
└─────────────────────────────────────────────────────────────────────────┘

GET /me returns: {
  tenants: [
    { id: "tenant-123", name: "ACME Mfg", role: "admin", status: "active" }
  ]
}
         │
         ▼
┌─────────────────────────┐
│  TenantResolver Logic:  │
│  tenants.length === 1   │
└──────────┬──────────────┘
           │
           │ AUTO-SELECT (no user interaction)
           │
           ▼
    ┌──────────────────────────┐
    │  Save to localStorage:    │
    │  • activeTenantId         │
    │    = "tenant-123"         │
    │  • activeTenantName       │
    │    = "ACME Mfg"           │
    │  • activeRole = "admin"   │
    └──────────┬─────────────────┘
               │
               │ Immediate redirect
               │
               ▼
         Navigate to: /
               │
               ▼
    ┌──────────────────────────┐
    │  App Home (Dashboard)    │
    │  • Tenant pre-selected   │
    │  • No picker needed      │
    └──────────────────────────┘
```

## Flow C: Multiple Tenants (Picker)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FLOW C: EXISTING USER - MULTIPLE TENANTS                               │
└─────────────────────────────────────────────────────────────────────────┘

GET /me returns: {
  tenants: [
    { id: "t1", name: "ACME Mfg", role: "admin", status: "active" },
    { id: "t2", name: "Beta Corp", role: "manager", status: "active" },
    { id: "t3", name: "Gamma Inc", role: "viewer", status: "inactive" }
  ]
}
         │
         ▼
┌─────────────────────────┐
│  TenantResolver Logic:  │
│  tenants.length > 1     │
└──────────┬──────────────┘
           │
           │ Save tenants to localStorage.userTenants
           │
           ▼
    Navigate to: /tenant-picker
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  TENANT PICKER                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Choose an organization                          │   │
│  ├──────────────────────────────────────────────────┤   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ ACME Manufacturing          [Admin]     │    │   │
│  │  │                             [Active]    │ →  │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ Beta Corporation          [Manager]     │    │   │
│  │  │                           [Active]      │ →  │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ Gamma Inc                  [Viewer]     │    │   │
│  │  │                            [Inactive] ⚠️│    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                   │   │
│  │  ─────────────────────────────────────────      │   │
│  │                                                   │   │
│  │  [+] Create a new organization                   │   │
│  │                                                   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │  User picks? │
    └──────┬───────┘
           │
    ┌──────┴───────────────┬───────────────┐
    │ Select Tenant        │ Create New    │
    │                      │               │
    ▼                      ▼               │
Click "ACME Mfg"    Navigate to           │
    │               /onboarding            │
    │                     │                │
    ▼                     └────────────────┘
┌──────────────────────────┐
│  Save to localStorage:    │
│  • activeTenantId = "t1" │
│  • activeTenantName       │
│    = "ACME Mfg"          │
│  • activeRole = "admin"   │
└──────────┬─────────────────┘
           │
           ▼
    Navigate to: /
           │
           ▼
┌──────────────────────────┐
│  App Home (Dashboard)    │
│  • Selected tenant       │
│  • Can switch later      │
└──────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ERROR HANDLING                                                          │
└─────────────────────────────────────────────────────────────────────────┘

GET /me API Call
     │
     ▼
┌────────────────┐
│  Response Code │
└────────┬───────┘
         │
    ┌────┴──────────────────┬──────────────┬──────────────┐
    │                       │              │              │
    ▼                       ▼              ▼              ▼
┌─────────┐          ┌─────────┐    ┌─────────┐    ┌─────────┐
│  200 OK │          │  401    │    │  403    │    │  500    │
└────┬────┘          └────┬────┘    └────┬────┘    └────┬────┘
     │                    │              │              │
     ▼                    │              │              │
Process                   │              │              │
tenants                   │              │              │
     │                    ▼              ▼              ▼
     │            ┌────────────┐  ┌──────────┐  ┌──────────┐
     │            │ Auto       │  │ Show     │  │ Show     │
     │            │ signOut()  │  │ "Access  │  │ "Server  │
     │            │            │  │  Denied" │  │  Error"  │
     │            └─────┬──────┘  └────┬─────┘  └────┬─────┘
     │                  │              │              │
     │                  ▼              │              │
     │          Navigate to            │              │
     │          /login                 │              │
     │                                 │              │
     └─────────────────────────────────┴──────────────┘
                       │
                       ▼
              Continue flow or
              show error with
              [Retry] button
```

## State Persistence

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LOCALSTORAGE STATE MANAGEMENT                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  localStorage Keys    │
├──────────────────────┤
│                      │
│  activeTenantId      │ ◄─── Set by: TenantResolver,
│  "tenant-123"        │      TenantPicker, OnboardingWizard
│                      │
│  activeTenantName    │ ◄─── Used by: Navigation header,
│  "ACME Mfg"          │      All app pages
│                      │
│  activeRole          │ ◄─── Used by: Permission checks,
│  "admin"             │      Feature gating
│                      │
│  userTenants         │ ◄─── Set by: TenantResolver
│  "[{...}, {...}]"    │      Used by: TenantPicker
│                      │
└──────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  State Flow:                                                  │
│                                                               │
│  1. Login → Session created (in Supabase)                    │
│  2. TenantResolver → Fetch tenants from API                  │
│  3. Save to localStorage → activeTenantId, etc.              │
│  4. App reads from localStorage → Uses for API calls         │
│  5. Switch tenant → Update localStorage → Reload data        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Navigation Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMPLETE NAVIGATION MAP                                                 │
└─────────────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES (No Auth Required):
  /login ──────────► Login screen
  /signup ─────────► Signup screen
  /password-reset ─► Password reset

TENANT RESOLUTION ROUTES (Auth Required, No Navigation Bar):
  /tenant-resolver ► Post-login gate (automatic)
  /tenant-picker ──► Choose organization (multi-tenant users)
  /onboarding ─────► Create organization wizard

PROTECTED ROUTES (Auth + Tenant Required, With Navigation Bar):
  / ───────────────► App home (dashboard)
  /sites ──────────► Sites management
  /assets ─────────► Assets management
  /signals/* ──────► Signal workflow screens
  /risks ──────────► Risk register
  /work-items ─────► Execution tracking

ROUTING RULES:
  • No session? → Redirect to /login
  • Has session, no tenant? → /tenant-resolver → /onboarding
  • Has session + tenant? → Allow access to app
```

---

This complete flow diagram shows all possible paths a user can take through the tenant resolution and onboarding process.
