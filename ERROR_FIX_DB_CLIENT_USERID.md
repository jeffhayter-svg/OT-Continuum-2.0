# Error Fix: DbClient setTenantContext TypeError

## Issue
```
TypeError: Cannot read properties of undefined (reading 'slice')
    at DbClient.setTenantContext (lib/db-client.ts:40:81)
```

## Root Cause
The `userId` parameter passed to `dbClient.setTenantContext()` was `undefined`, causing `.slice()` to fail.

The issue occurred when:
1. `TenantResolver` fetched tenant context via `rpc_get_my_tenant_context()`
2. The RPC returned data without `user_id` field (or with null value)
3. `TenantResolver` created `TenantContext` with `userId: contextData.user_id` (undefined)
4. `TenantContext.setTenantContext()` called `dbClient.setTenantContext(tenantId, userId)`
5. `dbClient.setTenantContext()` tried to call `userId.slice(0, 8)` on undefined value

## Fix Applied

### 1. Added Null Check in DbClient.setTenantContext()
**File**: `/lib/db-client.ts`

**Before**:
```typescript
setTenantContext(tenantId: string, userId: string) {
  console.log('[DbClient] Setting tenant context:', { 
    tenantId, 
    userId: userId.slice(0, 8) + '...'  // ❌ Crashes if userId is undefined
  });
  this.tenantId = tenantId;
  this.userId = userId;
}
```

**After**:
```typescript
setTenantContext(tenantId: string, userId: string) {
  const userIdPreview = userId ? userId.slice(0, 8) + '...' : 'undefined';  // ✅ Safe
  console.log('[DbClient] Setting tenant context:', { tenantId, userId: userIdPreview });
  this.tenantId = tenantId;
  this.userId = userId;
}
```

### 2. Added Validation in TenantResolver
**File**: `/pages/TenantResolver.tsx`

Added validation before creating `TenantContext`:

**Existing User Path** (line ~117):
```typescript
setTimeout(() => {
  // ✅ Validate context data before creating context
  if (!contextData.user_id) {
    console.error('[TenantResolver] ❌ Missing user_id in context data:', contextData);
    throw new Error('Invalid context data: missing user_id');
  }

  const context: TenantContext = {
    userId: contextData.user_id,
    // ... rest of fields
  };
  onResolved(context);
}, 800);
```

**Bootstrap Path** (line ~230):
```typescript
setTimeout(() => {
  // ✅ Validate context data before creating context
  if (!newContextData.user_id) {
    console.error('[TenantResolver] ❌ Missing user_id in bootstrap context data:', newContextData);
    throw new Error('Invalid context data after bootstrap: missing user_id');
  }

  const context: TenantContext = {
    userId: newContextData.user_id,
    // ... rest of fields
  };
  onResolved(context);
}, 800);
```

## Prevention
These changes ensure:
1. **Defensive Programming**: `dbClient.setTenantContext()` won't crash even if passed undefined
2. **Early Detection**: `TenantResolver` validates data before passing it along
3. **Clear Error Messages**: Console shows exactly what's missing and where
4. **Graceful Degradation**: Shows "undefined" in logs instead of crashing

## Root Cause Analysis (Why was user_id undefined?)

Possible causes:
1. **Database Issue**: `rpc_get_my_tenant_context()` function not returning `user_id` field
2. **User Not Found**: User doesn't exist in `public.users` table yet
3. **RLS Issue**: Row Level Security blocking read access to user record
4. **Permission Issue**: Function doesn't have permission to read from `public.users`

## Verification Steps

To verify the fix works:

1. **Check RPC Function** in Supabase SQL Editor:
```sql
SELECT rpc_get_my_tenant_context();
```
Expected output should include `user_id` field:
```json
{
  "user_id": "f7e3a8d2-...",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "admin",
  "tenant_id": "9d2b1c4e-...",
  "tenant_name": "My Company",
  "tenant_plan": "free",
  "tenant_status": "active"
}
```

2. **Check User Exists** in database:
```sql
SELECT id, email, tenant_id, role FROM public.users WHERE id = auth.uid();
```

3. **Check Debug Logs** in browser console:
```
[TenantResolver] ✅ Tenant context: {user_id: "f7e3a8d2-...", ...}
[DbClient] Setting tenant context: {tenantId: "9d2b1c4e-...", userId: "f7e3a8d2..."}
```

## Status
✅ **FIXED** - Added null checks and validation to prevent undefined userId errors

## Files Modified
1. `/lib/db-client.ts` - Added null check in setTenantContext()
2. `/pages/TenantResolver.tsx` - Added user_id validation before context creation
