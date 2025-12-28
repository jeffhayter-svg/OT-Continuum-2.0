# Supabase Authentication Verification

## Overview
All Supabase REST API calls in this application use the authenticated Supabase client, which automatically includes the Authorization header with the user's access token.

## Implementation Details

### 1. Supabase Client Configuration
**Location:** `/lib/supabase-client.ts`

The Supabase client is configured as a singleton with proper authentication settings:

```typescript
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    autoRefreshToken: true,    // Automatically refresh expired tokens
    persistSession: true,       // Store session in localStorage
    detectSessionInUrl: true,   // Detect OAuth redirects
  },
});
```

### 2. Session Management
**Location:** `/contexts/TenantContext.tsx`

The TenantContext manages authentication state and ensures sessions are properly maintained:

- Checks for existing sessions on app load via `supabase.auth.getSession()`
- Listens for auth state changes via `supabase.auth.onAuthStateChange()`
- Automatically updates user state when sessions change

### 3. Session Verification Before Queries
**Locations:**
- `/pages/TenantResolver.tsx` (line ~45-70)
- `/pages/onboarding/TenantSetup.tsx` (line ~55-70)

Both components verify the session exists before making database queries:

```typescript
// CRITICAL: Get session FIRST - do not query until session exists
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

console.log('[Component] Session check:');
console.log('  - Session exists:', !!session);
console.log('  - Access token:', session?.access_token ? '✅ Present' : '❌ Missing');
console.log('  - User ID from session:', session?.user?.id);

// If no session, do not proceed with queries
if (!session || !session.access_token) {
  console.error('[Component] ❌ No valid session - cannot query database');
  throw new Error('No active session found. Please sign in again.');
}

// Now query using session.user.id to ensure authenticated request
const { data, error } = await supabase
  .from('tenant_members')
  .select('tenant_id, role')
  .eq('user_id', session.user.id);
```

### 4. Using the Authenticated Client

All database queries use the authenticated Supabase client:

```typescript
// ✅ CORRECT - Uses authenticated client
const { data, error } = await supabase
  .from('tenant_members')
  .select('*')
  .eq('user_id', userId);

// ❌ WRONG - Direct fetch without auth headers
const response = await fetch('https://project.supabase.co/rest/v1/tenant_members');
```

## Verifying Authentication in Network Tab

### Step 1: Open Developer Tools
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Navigate to the **Network** tab
3. Check "Preserve log" if you want to see requests across navigation

### Step 2: Filter for Supabase Requests
1. In the filter box, type: `rest/v1`
2. This will show only Supabase REST API requests

### Step 3: Verify Authorization Header
1. Click on any request to `/rest/v1/tenant_members` or other table
2. Go to the **Headers** tab
3. Scroll to **Request Headers**
4. Look for these headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Verify Token Contents
The `Authorization: Bearer <token>` header should contain:
- A valid JWT token
- Token length should be ~800-1200 characters
- Token should start with `eyJ` (base64 encoded JWT)

You can decode the JWT token at https://jwt.io to verify it contains:
- `sub`: User ID
- `email`: User email
- `exp`: Expiration timestamp
- Other Supabase auth claims

## Common Issues and Solutions

### Issue 1: Authorization Header Missing
**Symptom:** Network tab shows no `Authorization` header on requests

**Solution:**
1. Check if user is properly logged in: `supabase.auth.getSession()`
2. Verify session exists in localStorage: Look for `supabase.auth.token`
3. Check console for session verification logs

### Issue 2: Token Expired
**Symptom:** 401 Unauthorized errors, "JWT expired" message

**Solution:**
1. The client should auto-refresh tokens (autoRefreshToken: true)
2. Check console for "TOKEN_REFRESHED" auth state change events
3. If auto-refresh fails, user needs to sign in again

### Issue 3: Using Anon Key Instead of User Token
**Symptom:** RLS policies block queries, "permission denied" errors

**Solution:**
1. Verify the `Authorization` header contains a user token, not the anon key
2. User token should contain user-specific claims (sub, email)
3. Anon key is much shorter and doesn't have user claims

### Issue 4: Session Lost After Page Reload
**Symptom:** User appears logged out after refreshing

**Solution:**
1. Check if `persistSession: true` in Supabase client config
2. Verify localStorage contains `supabase.auth.token`
3. Check browser console for session restore logs

## Testing Checklist

- [ ] Login and verify session is created
- [ ] Check Network tab for Authorization header on REST calls
- [ ] Verify token in Authorization header is different from apikey
- [ ] Decode JWT token and confirm it contains user ID and email
- [ ] Refresh page and verify session persists
- [ ] Check console logs show session verification before queries
- [ ] Verify auto-refresh works (wait for token expiration)
- [ ] Logout and verify Authorization header is removed

## Logging and Debugging

All components log authentication state:

```
[TenantResolver] Session check:
  - Session exists: true
  - Access token: ✅ Present (length: 1034)
  - User ID from session: abc123-def456-...
  - Session error: null
```

If you see `❌ Missing` for access token, the session is not properly established.

## Architecture Flow

```
1. User logs in via supabase.auth.signInWithPassword()
2. Supabase stores session in localStorage
3. TenantContext detects session via onAuthStateChange
4. All supabase.from() queries automatically include Authorization header
5. Token auto-refreshes before expiration
6. User logs out via supabase.auth.signOut()
7. Session cleared from localStorage
```

## Security Notes

1. **Never expose Service Role Key to frontend** - Only use ANON_KEY
2. **RLS policies enforce security** - Even with valid token, users can only access their data
3. **Token in Authorization header** - Contains user-specific claims for RLS
4. **Anon key in apikey header** - Identifies the project, not the user
5. **HTTPS required** - Tokens should never be sent over unencrypted connections