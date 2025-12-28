# ⚠️ IMPORTANT: Apply Migration First!

## The error you're seeing means the database migration hasn't been applied yet.

## Run this command NOW:

```bash
# Stop the app if running
# Then run:
supabase db reset
```

This will:
1. Reset your local database
2. Apply all migrations including the tenant RBAC system
3. Create the required tables and functions

## After running the migration:

1. Restart your dev server
2. Try signing up again
3. The tenant resolver should now work

## Verify migration succeeded:

```bash
# Check if tables exist
supabase db exec "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('tenants', 'users', 'tenant_invites');"

# Check if RPC functions exist
supabase db exec "SELECT proname FROM pg_proc WHERE proname LIKE 'rpc_%';"
```

You should see:
- Tables: `tenants`, `users`, `tenant_invites`
- Functions: `rpc_bootstrap_tenant_and_user`, `rpc_get_my_tenant_context`

## Then test the app again!
