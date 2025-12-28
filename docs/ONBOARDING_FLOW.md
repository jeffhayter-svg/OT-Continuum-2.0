# OT Continuum - Onboarding Flow

## Overview

The onboarding flow ensures every user has proper tenant membership and follows strict database constraints.

## Database Constraints

1. **`public.users.tenant_id` is NOT NULL**
   - Every user MUST belong to a tenant
   
2. **`public.users.id` FK → `auth.users.id`**
   - Every user record must correspond to an auth user

## Flow Diagram

```
┌─────────────┐
│ User Logs In │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ TenantResolver               │
│ Query: tenant_members        │
│ WHERE user_id = auth.user.id │
└──────┬───────────────────────┘
       │
       ├─── 0 rows ────────────────────────────────────┐
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Route to             │
       │                                    │ /onboarding/         │
       │                                    │ tenant-setup         │
       │                                    └──────────┬───────────┘
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Step 1:              │
       │                                    │ Create tenant in     │
       │                                    │ public.tenants       │
       │                                    └──────────┬───────────┘
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Step 2:              │
       │                                    │ Upsert public.users  │
       │                                    │ id = auth.user.id    │
       │                                    │ tenant_id = new      │
       │                                    │ email/full_name      │
       │                                    └──────────┬───────────┘
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Step 3:              │
       │                                    │ Insert tenant_members│
       │                                    │ tenant_id = new      │
       │                                    │ user_id = auth.user  │
       │                                    │ role = 'admin'       │
       │                                    └──────────┬───────────┘
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Set tenant_context   │
       │                                    │ Route to /app        │
       │                                    └──────────────────────┘
       │
       │
       ├─── 1 row ─────────────────────────────────────┐
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Auto-select tenant   │
       │                                    └──────────┬───────────┘
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Update public.users  │
       │                                    │ tenant_id = selected │
       │                                    └──────────┬───────────┘
       │                                               │
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Set tenant_context   │
       │                                    │ Route to /app        │
       │                                    └──────────────────────┘
       │
       │
       └─── >=2 rows ──────────────────────────────────┐
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Show tenant picker   │
                                            │ User selects org     │
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Update public.users  │
                                            │ tenant_id = selected │
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ Set tenant_context   │
                                            │ Route to /app        │
                                            └──────────────────────┘
```

## Components

### 1. TenantResolver (`/pages/TenantResolver.tsx`)

**Responsibility:** Orchestrates the onboarding flow

**Logic:**
1. Queries `tenant_members` for user's memberships
2. Routes to appropriate screen based on membership count
3. Handles tenant selection and context setting

**Props:**
- `userId` - From TenantContext (single source of truth)
- `userEmail` - From TenantContext (single source of truth)
- `onResolved` - Callback when tenant is selected
- `onError` - Callback on error

### 2. TenantSetup (`/pages/onboarding/TenantSetup.tsx`)

**Responsibility:** First-time user onboarding

**UI:**
- Organization name input (required)
- Full name input (optional)
- Progress steps indicator
- Admin role badge

**Flow:**
1. User enters organization name
2. Click "Create Organization"
3. Shows progress: Create tenant → Create user → Assign role
4. Auto-redirects to app on success

**Database Operations:**
```sql
-- Step 1: Create tenant
INSERT INTO public.tenants (name, plan, status)
VALUES ('Acme Corp', 'free', 'active')
RETURNING id;

-- Step 2: Upsert user
INSERT INTO public.users (id, tenant_id, email, full_name, role)
VALUES (auth.uid(), tenant_id, 'user@example.com', 'John Doe', 'admin')
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Step 3: Insert membership
INSERT INTO public.tenant_members (tenant_id, user_id, role)
VALUES (tenant_id, auth.uid(), 'admin');
```

### 3. TenantPicker (`/pages/onboarding/TenantPicker.tsx`)

**Responsibility:** Multi-tenant user organization selection

**UI:**
- List of organizations user belongs to
- Shows role, plan, status for each
- Radio-style selection
- Continue button

**Flow:**
1. User selects organization
2. Click "Continue"
3. Updates `public.users.tenant_id`
4. Redirects to app

**Database Operations:**
```sql
-- Update user's active tenant
UPDATE public.users
SET tenant_id = selected_tenant_id
WHERE id = auth.uid();
```

## Testing with Playwright

### Test IDs

**TenantSetup:**
- `onboarding-org-name-input` - Organization name field
- `onboarding-full-name-input` - Full name field
- `onboarding-create-org-button` - Submit button

**TenantPicker:**
- `tenant-picker-option-{tenant_id}` - Tenant selection button
- `tenant-picker-continue-button` - Continue button

### Example Test

```typescript
// First-time user onboarding
test('new user onboarding flow', async ({ page }) => {
  // Login as new user
  await page.fill('#email', 'newuser@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  // Should see onboarding
  await expect(page.getByTestId('onboarding-org-name-input')).toBeVisible();
  
  // Fill in organization
  await page.fill('[data-testid="onboarding-org-name-input"]', 'My Company');
  await page.fill('[data-testid="onboarding-full-name-input"]', 'John Doe');
  
  // Submit
  await page.click('[data-testid="onboarding-create-org-button"]');
  
  // Should redirect to app
  await expect(page.locator('text=Welcome to OT Continuum')).toBeVisible();
});

// Multi-tenant user selection
test('multi-tenant user picks organization', async ({ page }) => {
  // Login as user with multiple orgs
  await page.fill('#email', 'multiuser@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  // Should see tenant picker
  await expect(page.locator('text=Select Organization')).toBeVisible();
  
  // Select first tenant
  await page.click('[data-testid^="tenant-picker-option-"]');
  
  // Continue
  await page.click('[data-testid="tenant-picker-continue-button"]');
  
  // Should redirect to app
  await expect(page.locator('text=Welcome to OT Continuum')).toBeVisible();
});
```

## Database Setup

### Required Migrations

Apply in Supabase Dashboard → SQL Editor (Role: postgres):

```sql
-- See /supabase/migrations/ONBOARDING_CONSTRAINTS.sql
```

### Verification

```sql
-- 1. Verify tenant_id is NOT NULL
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'tenant_id';
-- Expected: is_nullable = 'NO'

-- 2. Verify FK constraint exists
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint AS c
WHERE conrelid = 'public.users'::regclass
  AND contype = 'f';
-- Expected: constraint referencing auth.users(id)
```

## Error Handling

### Constraint Violation Errors

**Scenario:** User record already exists without tenant_id

```
Error: null value in column "tenant_id" violates not-null constraint
```

**Solution:** The upsert in Step 2 handles this by setting tenant_id

**Scenario:** Auth user doesn't exist

```
Error: insert or update on table "users" violates foreign key constraint "users_id_fkey"
```

**Solution:** Ensure auth.users record exists before creating public.users

### RLS Permission Errors

**Scenario:** User can't query tenant_members

```
Error: permission denied for table tenant_members
```

**Solution:** Apply RLS policies from `APPLY_GRANTS.sql`

## Session Management

The onboarding flow uses the **single source of truth** pattern for user identity:

1. **TenantContext** reads `session.user.id` ONCE
2. **TenantResolver** receives `userId` as a prop
3. No component fetches session independently

This eliminates race conditions and duplicate session calls.

## Future Enhancements

1. **Email Invitations**
   - Admin invites user to existing tenant
   - User signs up with invitation code
   - Auto-joins tenant without onboarding

2. **Social Login**
   - Google, GitHub, etc.
   - Same onboarding flow after auth

3. **Multi-tenant Switching**
   - Add tenant switcher in UI
   - Quick switch between orgs without re-login

4. **Tenant Creation Limits**
   - Free plan: 1 tenant per user
   - Paid plan: unlimited tenants

## References

- Database schema: `/supabase/migrations/`
- RLS policies: `/supabase/APPLY_GRANTS.sql`
- Auth flow: `/docs/AUTH_FLOW.md`
