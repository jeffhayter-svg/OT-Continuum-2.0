# ⚠️ CRITICAL: Database Permissions Setup

## YOU MUST RUN THIS AFTER APPLYING MIGRATIONS

After running your database migrations, you **MUST** apply GRANT permissions for RPC functions. Without this step, users will get "permission denied" errors during signup and login.

## Quick Instructions

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. **IMPORTANT:** Set **Role** dropdown to `postgres` (NOT `authenticated`)
4. Copy and paste the script below
5. Click **"Run"**

```sql
-- Grant schema usage to authenticated users
grant usage on schema public to authenticated;

-- Grant execute permissions on RPC functions
grant execute on function public.rpc_bootstrap_tenant_and_user(text, text) to authenticated;
grant execute on function public.rpc_get_my_tenant_context() to authenticated;

-- Verify grants were applied
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name LIKE 'rpc_%'
ORDER BY routine_name, grantee;
```

## Expected Output

You should see:
```
routine_name                        | grantee       | privilege_type
------------------------------------|---------------|---------------
rpc_bootstrap_tenant_and_user       | authenticated | EXECUTE
rpc_get_my_tenant_context           | authenticated | EXECUTE
```

✅ If you see these two rows, you're good to go!

❌ If you see no results or get errors:
- Verify the **Role** dropdown is set to `postgres`
- Verify the migrations were applied successfully
- Run the verification query from QUICK_START.md Step 2

## Why This Is Required

- **PostgreSQL security:** Functions don't automatically grant execute permissions to non-superuser roles
- **Supabase limitations:** GRANT statements require admin privileges (postgres role)
- **Cannot be automated:** PowerShell, terminal, and command-line tools cannot execute GRANT statements
- **Must be manual:** This MUST be done through the Supabase Dashboard with the `postgres` role

## If You Skip This Step

Users will encounter this error during signup/login:
```
Database permissions not applied.

Please run the GRANT script in Supabase Dashboard → SQL Editor (Role: postgres)
```

The app will display this message and provide a link to the setup instructions.

## Related Documentation

- Full setup guide: [QUICK_START.md](./QUICK_START.md) → Step 2.1
- Detailed instructions: [docs/SUPABASE_CONSOLE_SETUP.md](./docs/SUPABASE_CONSOLE_SETUP.md) → Step 19
- SQL file: [supabase/migrations/APPLY_GRANTS.sql](./supabase/migrations/APPLY_GRANTS.sql)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → "permission denied" section

## Verification

After running the GRANT script, test the setup:

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:5173`
3. Click "Create Account"
4. Sign up with a test email
5. You should see the tenant resolver progress through all steps without errors
6. You should land on the dashboard with your organization created

If you see "Database permissions not applied" error, the GRANT script wasn't run correctly.

---

**Remember:** This is a ONE-TIME setup step per Supabase project, but it's critical for the app to function.
