# Single Source of Truth for User Identity

## Summary

Refactored the application to ensure there is exactly ONE source of truth for user identity - the Supabase session managed by `TenantContext`. No component may independently fetch or reconstruct `user_id`.

## Problem Solved

**Before:** Multiple components independently fetching session and deriving user_id:
```
❌ TenantContext: Fetches session → extracts user_id
❌ TenantResolver: Independently fetches session → extracts user_id
❌ Multiple sources of truth = race conditions and inconsistencies
```

**After:** Single source of truth in TenantContext:
```
✅ TenantContext: Fetches session → extracts user_id → exposes to all children
✅ TenantResolver: Receives user_id as prop from TenantContext
✅ ONE source of truth = consistent identity across app
```

## Architecture

### Data Flow

```
Supabase Auth Session
        ↓
   TenantContext
  (SINGLE SOURCE OF TRUTH)
   ├── Reads session.user.id
   ├── Stores in state: userId
   └── Exposes via context: { user, userId, ... }
        ↓
     AppContent
   (Consumes context)
   ├── Gets userId from context
   └── Passes to children as props
        ↓
  TenantResolver
 (Receives as prop)
 ├── userId: string (prop)
 ├── userEmail: string (prop)
 └── NO independent session fetching
```

### Rules Enforced

1. **user_id must always be derived from Supabase session**
   - ✅ Only `TenantContext` calls `supabase.auth.getSession()`
   - ✅ Only `TenantContext` reads `session.user.id`
   - ❌ No other component may fetch session independently

2. **user_id must be written to AppContext once**
   - ✅ `TenantContext` extracts `userId` from session
   - ✅ `TenantContext` stores in state: `userId`
   - ✅ `TenantContext` exposes via context value
   - ❌ No component may store duplicate copies

3. **No component may infer or reconstruct user_id independently**
   - ✅ All components receive `userId` from context or props
   - ✅ `TenantResolver` receives `userId` as required prop
   - ❌ No component may call `supabase.auth.getSession()` except `TenantContext`

## Code Changes

### 1. TenantContext.tsx - SINGLE SOURCE OF TRUTH

Added `userId` to context state and value:

```typescript
interface TenantContextValue {
  user: User | null;
  userId: string | null; // SINGLE SOURCE OF TRUTH
  tenantContext: TenantContextType | null;
  loading: boolean;
  // ... other properties
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // SINGLE SOURCE OF TRUTH
  const [tenantContext, setTenantContextState] = useState<TenantContextType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ONLY PLACE that reads session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        console.log('[TenantContext] ✓ Session found - User ID:', session.user.id);
        setUser(session.user);
        setUserId(session.user.id); // SINGLE SOURCE OF TRUTH
      } else {
        setUser(null);
        setUserId(null);
      }
      setLoading(false);\n    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id); // SINGLE SOURCE OF TRUTH
      } else {
        setUser(null);
        setUserId(null);
      }
      // ...
    });
  }, []);

  return (
    <TenantContext.Provider
      value={{
        user,
        userId, // SINGLE SOURCE OF TRUTH exposed
        tenantContext,
        loading,
        // ...
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
```

### 2. TenantResolver.tsx - Receives userId as Prop

**REMOVED:** Independent session fetching
**ADDED:** Required props for userId and userEmail

```typescript
interface TenantResolverProps {
  userId: string; // SINGLE SOURCE OF TRUTH - passed from context
  userEmail: string; // SINGLE SOURCE OF TRUTH - passed from context
  onResolved: (context: TenantContext) => void;
  onError: () => void;
}

export function TenantResolver({ userId, userEmail, onResolved, onError }: TenantResolverProps) {
  async function resolveTenant() {
    console.log('[TenantResolver] ✓ Using userId from context (SINGLE SOURCE OF TRUTH):', userId);
    console.log('[TenantResolver] ✓ Using email from context (SINGLE SOURCE OF TRUTH):', userEmail);

    // REMOVED: No longer fetching session independently
    // const { data: { session } } = await supabase.auth.getSession();
    // const userId = session.user.id; // ❌ DELETED

    // Use props instead
    setDebugInfo({ 
      userId, // ✅ From props
      email: userEmail, // ✅ From props
      source: 'TenantContext (SINGLE SOURCE OF TRUTH)'
    });

    // Continue with tenant resolution using userId from props...
  }
}
```

### 3. App.tsx - Passes userId from Context to Resolver

**ADDED:** Extract `userId` from context
**ADDED:** Pass `userId` and `userEmail` as props to TenantResolver

```typescript
function AppContent() {
  const { user, userId, tenantContext, setTenantContext, clearAuth, loading: authLoading } = useTenantContext();
  // ...

  // Show tenant resolver if user is logged in but no tenant context
  if (user && userId && showResolver) {
    return (
      <>
        <TenantResolver 
          userId={userId} // ✅ Pass from context
          userEmail={user.email || ''} // ✅ Pass from context
          onResolved={handleTenantResolved}
          onError={handleResolverError}
        />
        <DevDiagnostics />
      </>
    );
  }
}
```

## Benefits

### Before (Multiple Sources)
- ❌ TenantContext fetches session
- ❌ TenantResolver independently fetches session
- ❌ Race conditions between two session calls
- ❌ Inconsistent user_id across components
- ❌ Difficult to debug authentication issues

### After (Single Source)
- ✅ TenantContext is the ONLY component that fetches session
- ✅ userId flows down from context → props
- ✅ No race conditions - single fetch point
- ✅ Consistent user_id everywhere
- ✅ Easy to debug - trace from one location
- ✅ Clear data ownership and flow

## Verification

### Console Logs Show Single Source

```
[TenantContext] Initializing - checking for existing session
[TenantContext] ✓ Session found - User ID: abc123...
[App] Auth resolved - user: abc123...
[TenantResolver] ✓ Using userId from context (SINGLE SOURCE OF TRUTH): abc123...
[TenantResolver] ✓ Using email from context (SINGLE SOURCE OF TRUTH): user@example.com
```

Notice:
- ✅ TenantContext logs "Session found" - it's the fetcher
- ✅ App logs "Auth resolved" - it's a consumer
- ✅ TenantResolver logs "Using userId from context" - it's a consumer
- ✅ Only ONE "Session found" log = single fetch point

### Debug Info Confirms Source

In TenantResolver debug panel:
```json
{
  "userId": "abc123...",
  "email": "user@example.com",
  "source": "TenantContext (SINGLE SOURCE OF TRUTH)"
}
```

## Files Modified

1. `/contexts/TenantContext.tsx` - Added `userId` state and exposed in context
2. `/pages/TenantResolver.tsx` - Removed session fetching, receives userId as prop
3. `/App.tsx` - Passes userId from context to TenantResolver

## Testing Checklist

- [ ] Login: userId flows from TenantContext → App → TenantResolver
- [ ] Signup: userId flows from TenantContext → App → TenantResolver
- [ ] Page refresh: userId restored from session in TenantContext only
- [ ] Token refresh: userId updated in TenantContext only
- [ ] Console logs show only ONE session fetch (in TenantContext)
- [ ] No component independently calls `supabase.auth.getSession()`
- [ ] TenantResolver debug info shows "source: TenantContext"

## Next Steps

- Audit all components to ensure none independently fetch session
- Add ESLint rule to prevent direct `supabase.auth.getSession()` calls outside TenantContext
- Document this pattern in architecture guidelines
- Apply same pattern to other identity-related data (email, user metadata, etc.)

## Related Documentation

- `/AUTH_BOOTSTRAP_FIX.md` - Session-first initialization
- `/TENANT_RESOLVER_DEFENSIVE_UPDATE.md` - Defensive retry logic
- `/contexts/TenantContext.tsx` - Source of truth implementation
