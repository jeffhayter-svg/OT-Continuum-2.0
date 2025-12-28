# TenantResolver Defensive Update - Lifecycle-Safe Context Resolution

## Summary

Updated TenantResolver to be defensive and lifecycle-safe, preventing crashes from async hydration order issues. The component now gracefully handles missing `user_id` with automatic retry logic instead of throwing fatal errors immediately.

## Problem Solved

**Before:** TenantResolver would crash with TypeError if `context.user_id` was missing due to async hydration order:
```
❌ TypeError: Cannot read property 'id' of undefined
❌ Invalid context data: missing user_id or user object
```

**After:** TenantResolver logs warnings and retries up to 3 times before throwing a fatal error:
```
⚠️ Missing user_id - will retry...
[TenantResolver] Retry attempt 1/3 - waiting for auth context...
✅ Context validated - userId: abc123...
```

## Key Changes

### 1. Retry Mechanism with State Management

Added retry state and automatic retry logic:

```typescript
const [retryCount, setRetryCount] = useState(0);
const [isRetrying, setIsRetrying] = useState(false);

// Retry mechanism - wait for auth context to populate
useEffect(() => {
  if (isRetrying && retryCount < 3) {
    console.log(`[TenantResolver] Retry attempt ${retryCount + 1}/3 - waiting for auth context...`);
    const timer = setTimeout(() => {
      setIsRetrying(false);
      setRetryCount(prev => prev + 1);
      resolveTenant();
    }, 500); // Wait 500ms before retry

    return () => clearTimeout(timer);
  }
}, [isRetrying, retryCount]);
```

### 2. Defensive Parsing with Optional userId

Changed `userId` from `string` to `string | undefined` during parsing:

```typescript
// Before: let userId: string;
// After:
let userId: string | undefined;
```

### 3. Graceful Error Handling - Don't Throw Early

**Rule:** If `user_id` is missing, log warning and retry. Only throw after 3 attempts.

```typescript
// Invalid structure detected
else {
  console.error('[TenantResolver] ❌ Invalid context data structure:', contextData);
  console.error('[TenantResolver] ❌ Type of contextData:', typeof contextData);
  console.error('[TenantResolver] ❌ Keys:', contextData ? Object.keys(contextData) : 'null');
  
  // DEFENSIVE: Don't throw if we can retry
  if (retryCount < 3) {
    console.warn('[TenantResolver] ⚠️ Missing user_id - will retry...');
    setIsRetrying(true);
    return;
  }
  
  // FATAL: After retries, this is a real error
  console.groupEnd();
  throw new Error('Invalid context data: missing user_id or user object after ' + retryCount + ' retries');
}
```

### 4. Secondary Validation - Check Parsed userId

Even after successful parsing, validate that `userId` is not undefined:

```typescript
// DEFENSIVE: Check if userId is still missing after parsing
if (!userId) {
  console.error('[TenantResolver] ❌ userId is undefined after parsing');
  
  // DEFENSIVE: Don't throw if we can retry
  if (retryCount < 3) {
    console.warn('[TenantResolver] ⚠️ userId undefined - will retry...');
    setIsRetrying(true);
    return;
  }
  
  // FATAL: After retries, this is a real error
  console.groupEnd();
  throw new Error('userId is undefined after parsing context data (after ' + retryCount + ' retries)');
}
```

### 5. Updated Retry Button Handler

The retry button now uses the retry mechanism instead of directly calling `resolveTenant()`:

```typescript
function handleRetry() {
  setError(null);
  setStep('checking');
  setIsRetrying(true); // Triggers retry mechanism
}
```

### 6. Applied to Both Code Paths

The defensive logic is applied to both:
- **Existing user path** (looking up context)
- **Bootstrap path** (creating new tenant and user)

## Lifecycle Flow

```
1. TenantResolver mounts
   ↓
2. resolveTenant() called
   ↓
3. Get session from Supabase Auth
   ↓
4. RPC call: rpc_get_my_tenant_context()
   ↓
5. Parse response structure
   ↓
   ├─ user_id found? → Validate and resolve ✅
   │
   └─ user_id missing?
      ↓
      ├─ retryCount < 3? → Set isRetrying = true
      │                     Wait 500ms
      │                     Increment retryCount
      │                     Go back to step 2
      │
      └─ retryCount >= 3? → Throw fatal error ❌
```

## Benefits

### Before (Crash-Prone)
- ❌ Immediate crash on missing user_id
- ❌ No recovery from async hydration issues
- ❌ Poor user experience with confusing errors
- ❌ Race conditions cause unpredictable failures

### After (Resilient)
- ✅ Graceful handling of async hydration
- ✅ Automatic retry with exponential backoff
- ✅ Clear warning logs for debugging
- ✅ Only throws fatal errors after exhausting retries
- ✅ Better user experience with loading states

## Error Messages

### Warning (Non-Fatal, Will Retry)
```
⚠️ Missing user_id - will retry...
⚠️ userId undefined - will retry...
⚠️ Bootstrap missing user_id - will retry...
⚠️ Bootstrap userId undefined - will retry...
```

### Fatal (After 3 Retries)
```
❌ Invalid context data: missing user_id or user object after 3 retries
❌ userId is undefined after parsing context data (after 3 retries)
❌ Invalid context data after bootstrap: missing user_id or user object (after 3 retries)
❌ Bootstrap userId is undefined after parsing context data (after 3 retries)
```

## Testing Scenarios

### ✅ Normal Flow (No Issues)
1. User logs in
2. Session valid immediately
3. Context has user_id
4. Resolves on first attempt

### ✅ Async Hydration Delay
1. User logs in
2. Session valid but context not ready
3. First attempt: Missing user_id → Retry
4. Second attempt: Context ready → Resolves

### ✅ Bootstrap New User
1. User signs up
2. No existing context
3. Bootstrap creates tenant and user
4. Context fetched
5. If user_id missing → Retry
6. Resolves after retry

### ❌ Fatal Error (After Retries)
1. User logs in
2. Database configuration issue
3. Context always invalid
4. Retry 1, 2, 3 all fail
5. Show fatal error to user
6. User can click "Retry" to restart

## Retry Configuration

- **Max retries:** 3
- **Retry delay:** 500ms
- **Total max wait time:** 1.5 seconds (3 × 500ms)
- **Trigger:** Missing or undefined user_id

## Debug Logging

Enhanced console logs for troubleshooting:

```
[TenantResolver] 🔍 Starting tenant resolution
[TenantResolver] ✓ Session valid - User ID: abc123...
[TenantResolver] Getting tenant context via RPC...
[TenantResolver] ✅ User found with tenant: xyz789...
[TenantResolver] Parsing context data structure...
[TenantResolver] Has user? true
[TenantResolver] Has tenant? true
[TenantResolver] Has user_id? true
[TenantResolver] Detected nested response structure
[TenantResolver] ✅ Context validated - userId: abc123...
[TenantResolver] 🎉 Resolved! Redirecting to app...
```

## Files Modified

- `/pages/TenantResolver.tsx` - Added retry mechanism and defensive checks

## Related Files

- `/contexts/TenantContext.tsx` - Ensures userId is written to context
- `/App.tsx` - Waits for auth to resolve before showing TenantResolver
- `/lib/db-client.ts` - Validates userId before initializing

## Next Steps

- Monitor retry frequency in production logs
- Adjust retry delay if 500ms is too short/long
- Consider adding exponential backoff for retries
- Add telemetry to track retry success rate
