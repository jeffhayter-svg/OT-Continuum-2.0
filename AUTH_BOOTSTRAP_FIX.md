# Auth Bootstrap Fix - Session-First Initialization

## Summary

Updated the application bootstrap logic to ensure that the shared AppContext is not initialized until the Supabase Auth session is fully resolved. This prevents race conditions and ensures that `user_id` is always available when initializing tenant context.

## Changes Made

### 1. TenantContext.tsx - Enhanced Auth Resolution

**Key Improvements:**
- ✅ Explicit session validation with detailed error logging
- ✅ `loading` state properly managed until auth session is resolved
- ✅ `user_id` is explicitly written into context at initialization
- ✅ Waits for auth resolution before loading tenant context from localStorage
- ✅ Validates that `userId` exists before initializing `dbClient`

**Code Changes:**
```typescript
// Before: Simple session check
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null);
  setLoading(false);
});

// After: Comprehensive validation with user ID check
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('[TenantContext] Session error:', error);
    setUser(null);
    setLoading(false);
    return;
  }

  if (session?.user) {
    console.log('[TenantContext] ✓ Session found - User ID:', session.user.id);
    setUser(session.user);
  } else {
    console.log('[TenantContext] ✗ No session found');
    setUser(null);
  }
  
  setLoading(false);
});
```

**Explicit user_id in Context:**
```typescript
function setTenantContext(context: TenantContextType | null) {
  if (context) {
    // Ensure userId is present
    if (!context.userId && user?.id) {
      console.log('[TenantContext] Adding user_id to context before saving');
      context.userId = user.id;
    }
    
    const userId = context.userId || user?.id;
    if (!userId) {
      console.error('[TenantContext] ERROR: Cannot initialize dbClient - userId is missing!');
      return;
    }
    
    dbClient.setTenantContext(context.tenantId, userId);
  }
}
```

### 2. App.tsx - Loading Guard State

**Key Improvements:**
- ✅ Shows loading indicator while auth is resolving
- ✅ Prevents TenantResolver from running during auth loading
- ✅ Uses `authLoading` from TenantContext instead of local state
- ✅ Gracefully handles null session (shows login, not error)

**Loading Guard:**
```typescript
// GUARD: Show loading state while auth is resolving
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
```

**Session Restoration Logic:**
```typescript
useEffect(() => {
  // Only run after auth has finished loading
  if (authLoading) {
    console.log('[App] Waiting for auth to resolve...');
    return;
  }

  console.log('[App] Auth resolved - user:', user ? user.id : 'none');
  
  if (user) {
    const storedContext = localStorage.getItem('ot_tenant_context');
    if (!storedContext) {
      console.log('[App] → No tenant context found, triggering resolver');
      setShowResolver(true);
    }
  } else {
    console.log('[App] ✗ No user - showing login');
  }
}, [user, authLoading]);
```

### 3. TenantResolver.tsx - Strict Session Validation

**Key Improvements:**
- ✅ Validates that `session.user.id` exists before proceeding
- ✅ Provides detailed debug info for session validation failures
- ✅ Clear error messages when session is invalid

**Session Validation:**
```typescript
if (!session || !session.user || !session.user.id) {
  console.error('[TenantResolver] No valid session found - missing user ID');
  setDebugInfo({ 
    step: 'checking', 
    error: 'No session or missing user ID',
    hasSession: !!session,
    hasUser: !!session?.user,
    hasUserId: !!session?.user?.id
  });
  console.groupEnd();
  handleError('session-expired', 'Your session has expired or is invalid. Please log in again.');
  return;
}

const userId = session.user.id;
console.log('[TenantResolver] ✓ Session valid - User ID:', userId);
```

## Bootstrap Flow (Now)

```
1. App Loads
   ↓
2. TenantProvider initializes
   ↓
3. Check Supabase Auth session
   ↓
   ├─ Session exists? → Set user with user.id
   │                    Set loading = false
   │
   └─ No session?    → Set user = null
                       Set loading = false
   ↓
4. AppContent renders
   ↓
   ├─ authLoading = true?  → Show loading spinner
   │                         (GUARD STATE)
   │
   ├─ authLoading = false AND user exists?
   │  ↓
   │  Check for tenant context in localStorage
   │  ↓
   │  ├─ Has context? → Initialize dbClient with userId
   │  │                 Show dashboard
   │  │
   │  └─ No context?  → Trigger TenantResolver
   │                    (Only runs after auth is resolved)
   │
   └─ authLoading = false AND no user?
      → Show login screen
```

## Error Prevention

### Before Fix:
- ❌ TenantResolver could run before session was resolved
- ❌ `dbClient.setTenantContext()` could be called without `userId`
- ❌ Race conditions between auth state and app initialization
- ❌ TypeError when accessing `user.id` on undefined user

### After Fix:
- ✅ TenantResolver only runs after session is confirmed
- ✅ `dbClient.setTenantContext()` always has `userId`
- ✅ Auth state fully resolved before any app logic runs
- ✅ Loading guard prevents premature access to user data

## Testing Checklist

- [ ] Fresh load: Shows loading spinner → login screen
- [ ] Login: Shows loading spinner → tenant resolver → dashboard
- [ ] Signup: Shows loading spinner → tenant resolver → dashboard
- [ ] Page refresh (logged in): Shows loading spinner → dashboard (context restored)
- [ ] Page refresh (not logged in): Shows loading spinner → login screen
- [ ] Token refresh: User stays logged in, no disruption
- [ ] Logout: Clears context, returns to login
- [ ] Session expired: Shows error, redirects to login

## Debug Logging

Enhanced logging at every step:

```
[TenantContext] Initializing - checking for existing session
[TenantContext] ✓ Session found - User ID: abc123...
[App] Waiting for auth to resolve...
[App] Auth resolved - user: abc123...
[TenantResolver] ✓ Session valid - User ID: abc123...
[TenantContext] Initializing dbClient with tenantId: xyz789... userId: abc123...
[DbClient] Setting tenant context: { tenantId: 'xyz789...', userId: 'abc123...' }
```

## Files Modified

1. `/contexts/TenantContext.tsx` - Session validation and user_id tracking
2. `/App.tsx` - Loading guard and auth-first initialization
3. `/pages/TenantResolver.tsx` - Strict session validation

## Related Issues

- Fixes: TypeError crashes when user object is undefined
- Fixes: Race conditions in auth initialization
- Fixes: dbClient initialized without userId
- Fixes: TenantResolver running before session is ready

## Next Steps

- Monitor console logs during development
- Test all authentication flows
- Verify dbClient always has userId before making calls
- Confirm no TypeErrors in production
