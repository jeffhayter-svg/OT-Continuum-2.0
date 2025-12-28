# OT Continuum Onboarding - Quick Start

## For Users

### First-Time Setup
1. Click "Create Account" on login page
2. Enter email and password
3. You'll be redirected to onboarding
4. Enter your organization name
5. (Optional) Enter your full name
6. Click "Create Organization"
7. Wait for setup to complete (~2 seconds)
8. You'll be redirected to the dashboard as an admin

### Returning User (Single Org)
1. Login with email/password
2. Auto-redirects to your organization's dashboard

### Returning User (Multiple Orgs)
1. Login with email/password
2. Select which organization to access
3. Click "Continue"
4. Redirected to that organization's dashboard

## For Developers

### Database Constraints Required

Apply in **Supabase Dashboard → SQL Editor (Role: postgres)**:

```sql
-- 1. Make tenant_id NOT NULL
ALTER TABLE public.users
  ALTER COLUMN tenant_id SET NOT NULL;

-- 2. Add FK constraint to auth.users
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
```

### Flow Summary

```
Login → Query tenant_members
  │
  ├─ 0 rows → TenantSetup (create org)
  ├─ 1 row  → Auto-select → Dashboard
  └─ 2+ rows → TenantPicker → Dashboard
```

### Key Files

- `/pages/TenantResolver.tsx` - Main orchestration
- `/pages/onboarding/TenantSetup.tsx` - First-time user
- `/pages/onboarding/TenantPicker.tsx` - Multi-tenant picker
- `/supabase/migrations/ONBOARDING_CONSTRAINTS.sql` - DB constraints
- `/docs/ONBOARDING_FLOW.md` - Full documentation

### Testing

```bash
# Test new user onboarding
1. Create account with new email
2. Should see "Welcome to OT Continuum" onboarding
3. Enter org name and submit
4. Should see dashboard

# Test multi-tenant user
1. Manually insert second tenant_member row
2. Login again
3. Should see tenant picker
4. Select org and continue
5. Should see dashboard
```

### Console Logging

All onboarding steps log to console with prefixes:
- `[TenantResolver]` - Main flow decisions
- `[TenantSetup]` - Onboarding steps 1-3
- `[TenantPicker]` - Tenant selection

### Playwright Test IDs

**TenantSetup:**
- `onboarding-org-name-input`
- `onboarding-full-name-input`
- `onboarding-create-org-button`

**TenantPicker:**
- `tenant-picker-option-{tenant_id}`
- `tenant-picker-continue-button`

## Common Issues

### Issue: "null value in column tenant_id violates not-null constraint"

**Cause:** Constraint applied but old data has NULL tenant_id

**Fix:** Update existing users before applying constraint:
```sql
UPDATE public.users
SET tenant_id = (
  SELECT tenant_id 
  FROM tenant_members 
  WHERE user_id = users.id 
  LIMIT 1
)
WHERE tenant_id IS NULL;
```

### Issue: "permission denied for table tenant_members"

**Cause:** RLS policies not applied

**Fix:** Run grants from `APPLY_GRANTS.sql`

### Issue: User stuck on resolver screen

**Cause:** Missing tenant_members row

**Fix:** Check console logs, ensure Step 3 completed:
```sql
SELECT * FROM tenant_members WHERE user_id = 'xxx';
```

## Architecture Notes

### Single Source of Truth
- **TenantContext** reads `session.user.id` ONCE
- **TenantResolver** receives `userId` as prop
- No duplicate session fetches
- Eliminates race conditions

### Database Operations Order
1. Create tenant (public.tenants)
2. Upsert user (public.users) ← FK to auth.users
3. Insert membership (tenant_members)
4. Update tenant_id (public.users) ← NOT NULL constraint

### RLS Implications
- Users can read their own tenant_members rows
- Users can update their own users.tenant_id
- Admin can manage tenant members
- See `APPLY_GRANTS.sql` for full policies

## Support

For detailed documentation, see `/docs/ONBOARDING_FLOW.md`
