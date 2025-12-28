# Documentation Updates: GRANT Permissions Setup

## Summary of Changes

Updated project setup checklist and onboarding documentation to clarify that **ALL SQL statements (RLS, functions, grants) MUST be executed in Supabase Dashboard → SQL Editor**, never in PowerShell or terminal.

## New "Step 2.1: Apply GRANTs for RPCs" Section

Added a critical new setup step with the following GRANT script:

```sql
grant usage on schema public to authenticated;
grant execute on function public.rpc_bootstrap_tenant_and_user(text, text) to authenticated;
grant execute on function public.rpc_get_my_tenant_context() to authenticated;
```

## Error Handling Enhancement

The TenantResolver component now detects permission errors and displays a helpful message:

```
Database permissions not applied.

Please run the GRANT script in Supabase Dashboard → SQL Editor (Role: postgres):

grant usage on schema public to authenticated;
grant execute on function public.rpc_bootstrap_tenant_and_user(text, text) to authenticated;
grant execute on function public.rpc_get_my_tenant_context() to authenticated;

See Step 2.1 in QUICK_START.md for detailed instructions.
```

## Files Updated

### New Files Created:
1. **`/APPLY_GRANTS_FIRST.md`** - Quick reference for critical GRANT permissions setup
2. **`/supabase/migrations/APPLY_GRANTS.sql`** - Standalone SQL script with detailed documentation

### Updated Files:
1. **`/QUICK_START.md`** - Added Step 2.1 with detailed GRANT instructions
2. **`/pages/TenantResolver.tsx`** - Enhanced error handling for permission issues
3. **`/docs/SUPABASE_CONSOLE_SETUP.md`** - Added Step 19 for database permissions
4. **`/TROUBLESHOOTING.md`** - Added "permission denied" as first troubleshooting item
5. **`/README.md`** - Added prominent warning after migration step

## Key Messages Reinforced

### Why This Step Is Required:
- SQL functions don't automatically grant execute permissions to `authenticated` role
- Without these grants, users get "permission denied" errors when calling RPC functions
- This is a PostgreSQL security feature that must be configured explicitly
- **PowerShell and terminal CANNOT execute GRANT statements** - they must run in Supabase Dashboard with admin privileges

### When to Apply:
- **After running migrations** but **before testing the app**
- This is a ONE-TIME setup per Supabase project
- Must be done with Role: `postgres` (NOT `authenticated`)

### How to Verify:
Run this query in SQL Editor:
```sql
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' AND routine_name LIKE 'rpc_%';
```

Expected output:
- `rpc_bootstrap_tenant_and_user | authenticated | EXECUTE`
- `rpc_get_my_tenant_context | authenticated | EXECUTE`

## User Experience Improvements

1. **Proactive Error Messages**: Users now see helpful instructions when permission errors occur
2. **Clear Setup Path**: Step-by-step instructions prevent common setup mistakes
3. **Multiple Entry Points**: Documentation updated in README, QUICK_START, TROUBLESHOOTING, and Setup Guide
4. **Standalone SQL File**: Easy copy-paste from `/supabase/migrations/APPLY_GRANTS.sql`
5. **Visual Warnings**: ⚠️ symbols and **bold text** highlight critical steps

## Next Steps for Users

If users encounter "permission denied" errors after signup/login:

1. Go to **APPLY_GRANTS_FIRST.md** for quick instructions
2. Or follow **Step 2.1** in QUICK_START.md
3. Or check **TROUBLESHOOTING.md** → first section
4. Or read the error message in the app (now includes instructions)

## Technical Details

### Error Detection Logic

The TenantResolver now detects these permission error patterns:
- `bootstrapError.message?.includes('permission denied')`
- `bootstrapError.message?.includes('could not find')`
- `bootstrapError.code === '42501'` (PostgreSQL permission denied code)

### Security Context

These grants are safe because:
- They only allow authenticated users to call specific RPC functions
- The functions themselves enforce security via auth.uid()
- RLS policies still protect underlying tables
- No direct table access is granted

---

**Documentation Status: ✅ Complete**

All setup documentation now clearly explains:
1. SQL must run in Supabase Dashboard
2. GRANT permissions are required after migrations
3. How to verify permissions were applied correctly
4. What to do if permission errors occur
