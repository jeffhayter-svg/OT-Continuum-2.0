# Error Fix: RPC Response Format Mismatch

## Issue
```
TypeError: Cannot read properties of undefined (reading 'slice')
    at DbClient.setTenantContext (lib/db-client.ts:40:64)

Error: Invalid context data: missing user_id
```

## Root Cause

The `rpc_get_my_tenant_context()` function was returning a **nested structure** instead of the expected **flat structure**.

### Expected (Flat) Structure:
```json
{
  "user_id": "b7512526-...",
  "email": "jeff.hayter@outlook.com",
  "full_name": "jeff.hayter",
  "role": "admin",
  "status": "active",
  "tenant_id": "c61650fc-...",
  "tenant_name": "jeff.hayter",
  "tenant_plan": "free",
  "tenant_status": "active"
}
```

### Actual (Nested) Structure Returned:
```json
{
  "ok": true,
  "user": {
    "id": "b7512526-d5cb-47ff-9a9d-dff86384ac49",
    "role": "admin",
    "email": "jeff.hayter@outlook.com",
    "status": "active",
    "full_name": "jeff.hayter",
    "tenant_id": "c61650fc-1dc7-409c-b066-420d06c823de"
  },
  "tenant": {
    "id": "c61650fc-1dc7-409c-b066-420d06c823de",
    "name": "jeff.hayter",
    "slug": "jeffhayter"
  }
}
```

## Why This Happened

The actual database function in production may have been modified or a different version was deployed than what's in the migration files. The SQL migration shows it should return a flat structure, but the actual deployment has a nested structure.

## Fix Applied

### Updated TenantResolver to Handle BOTH Formats

**File**: `/pages/TenantResolver.tsx`

Added format detection logic that handles both nested and flat structures:

```typescript
// Handle both flat and nested response structures
let userId: string;
let email: string;
let fullName: string | null;
let role: 'admin' | 'owner' | 'manager' | 'engineer' | 'viewer';
let tenantId: string;
let tenantName: string;
let tenantPlan: string;
let tenantStatus: string;

// Check if response has nested structure (actual format from database)
if (contextData.user && contextData.tenant) {
  console.log('[TenantResolver] Detected nested response structure');
  userId = contextData.user.id;
  email = contextData.user.email;
  fullName = contextData.user.full_name;
  role = contextData.user.role;
  tenantId = contextData.user.tenant_id || contextData.tenant.id;
  tenantName = contextData.tenant.name;
  tenantPlan = contextData.tenant.plan || 'free';
  tenantStatus = contextData.tenant.status || 'active';
} 
// Check if response has flat structure (expected format)
else if (contextData.user_id) {
  console.log('[TenantResolver] Detected flat response structure');
  userId = contextData.user_id;
  email = contextData.email;
  fullName = contextData.full_name;
  role = contextData.role;
  tenantId = contextData.tenant_id;
  tenantName = contextData.tenant_name;
  tenantPlan = contextData.tenant_plan || 'free';
  tenantStatus = contextData.tenant_status || 'active';
} 
// Invalid structure
else {
  console.error('[TenantResolver] ❌ Invalid context data structure:', contextData);
  throw new Error('Invalid context data: missing user_id or user object');
}

const context: TenantContext = {
  userId,
  email,
  fullName,
  role,
  tenantId,
  tenantName,
  tenantPlan,
  tenantStatus,
};
```

### Applied to Both Code Paths

1. **Existing user lookup path** (~line 117): When user already exists
2. **Bootstrap path** (~line 270): After creating new tenant and user

## Benefits

1. **Backward Compatible**: Works with both old (flat) and new (nested) response formats
2. **Future Proof**: Won't break if database function is updated
3. **Clear Logging**: Console shows which format was detected
4. **Better Error Messages**: Shows full context data if neither format matches
5. **Defensive Programming**: Handles edge cases gracefully

## Verification

After the fix, the console should show:
```
[TenantResolver] Detected nested response structure
[TenantResolver] 🎉 Resolved! Redirecting to app...
```

And the app should load successfully with proper tenant context.

## Next Steps (Optional)

If you want to standardize on one format:

### Option 1: Keep Nested Format (Current)
Update SQL migration to match actual deployment:
```sql
CREATE OR REPLACE FUNCTION public.rpc_get_my_tenant_context()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT json_build_object(
    'ok', true,
    'user', json_build_object(
      'id', u.id,
      'email', u.email,
      'full_name', u.full_name,
      'role', u.role,
      'status', u.status,
      'tenant_id', u.tenant_id
    ),
    'tenant', json_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'plan', t.plan,
      'status', t.status
    )
  )
  INTO v_result
  FROM public.users u
  LEFT JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.id = v_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Option 2: Switch to Flat Format (Expected)
Re-run the migration from `/supabase/migrations/20231226000000_tenant_rbac_system.sql` to restore flat format.

## Status

✅ **FIXED** - TenantResolver now handles both nested and flat RPC response formats

## Files Modified

1. `/pages/TenantResolver.tsx` - Added dual-format support for both lookup paths
2. `/ERROR_FIX_RPC_RESPONSE_FORMAT.md` - This documentation
