# JWT Debugging Guide for OT Continuum

This guide explains how to debug JWT authentication issues in the OT Continuum application.

## Overview

The OT Continuum application uses two JWT tokens for authentication:

1. **Supabase Anon Key** (`apikey` header) - Public API key for Supabase
2. **User Access Token** (`Authorization: Bearer` header) - User-specific JWT from login

Both tokens are required for all Edge Function API calls.

---

## Quick Start Debugging

### 1. Visual Debug Panel (Recommended)

A floating debug panel is available in **development mode only** (localhost).

**How to use:**
1. Look for the green/red `🔐 JWT Debug` button in the bottom-right corner
2. Click it to open the debug panel
3. View real-time token information:
   - User JWT status (valid/expired)
   - User ID, email, role
   - Token expiration times
   - Validation errors/warnings

**Panel features:**
- ✅ **Copy tokens** to clipboard for testing in Postman/curl
- 📋 **Log to Console** - outputs detailed JWT information
- 🔬 **Enable Full Debug** - shows complete tokens in API requests
- Real-time updates when session changes

---

### 2. Browser Console Logging

Enhanced console logging is automatically enabled in development (localhost).

**What you'll see:**

#### Session Token Check
```
[API Client] 🔐 Session Token Check
  Has Session: true
  Has Access Token: true
  Token Preview: eyJhbGciOiJIUzI1NiIsInR5cC...
  Token Length: 523 chars
  User ID: 12345-abcde-67890
  Email: user@example.com
  Role: authenticated
  Expires: 12/24/2025, 3:45:00 PM
  Is Expired: ✅ NO
  
  💡 Tip: Set localStorage.DEBUG_JWT = "true" to see full JWT
```

#### API Request
```
[API Client] 🌐 GET Request
  URL: https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/make-server-fb677d93/risks
  Headers:
    apikey: eyJhbGciOiJIUzI1NiIsInR5cC...
    authorization: Bearer eyJhbGciOiJIUzI1N...
    content-type: application/json
```

#### API Response
```
[API Client] 📥 GET Response
  Status: 200 OK
  OK: true
  Response Headers: {...}
```

#### 401 Unauthorized Error
```
🚨 [API Client] 401 UNAUTHORIZED ERROR
  JWT Verification Failed!
  This means the Edge Function rejected the JWT token.
  
  🔍 Debugging the rejected token:
    🔐 Rejected User JWT
    📋 Header: { alg: "HS256", typ: "JWT" }
    📦 Payload: { sub: "...", email: "...", role: "authenticated", ... }
    ⏰ Issued At: ...
    ⏱️ Expires At: ...
    ⚠️ Is Expired: ❌ YES
  
  Validation Results:
    errors: ["Token expired at 12/24/2025, 2:00:00 PM"]
    warnings: []
  
  📋 Troubleshooting steps:
  1. Check if token is expired (see above)
  2. Verify Edge Function has JWT verification enabled
  3. Check if JWT_SECRET matches between auth and edge function
  4. Verify user exists in auth.users table
```

---

### 3. Full JWT Debug Mode

To see **complete JWT tokens** in all console logs:

```javascript
// In browser console or run once in app:
localStorage.setItem('DEBUG_JWT', 'true')

// Then refresh the page
```

**When enabled, you'll see:**
- Full JWT tokens (not just previews)
- Decoded header and payload for each token
- Complete validation results
- Both anon key and user token analysis

**To disable:**
```javascript
localStorage.removeItem('DEBUG_JWT')
```

⚠️ **Warning:** This will log sensitive tokens to the console. Use only in local development.

---

## Common Issues & Solutions

### Issue 1: "No authenticated session - redirecting to login"

**Cause:** User JWT is null or missing

**Debug:**
```javascript
// In browser console:
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Access Token:', session?.access_token)
```

**Solutions:**
- User needs to log in
- Session may have expired
- Check if `supabase.auth.signInWithPassword()` succeeded

---

### Issue 2: 401 Unauthorized from Edge Function

**Cause:** JWT verification failed on the backend

**Debug Steps:**
1. Open JWT Debug Panel
2. Check if token is expired (look for "Is Expired" status)
3. Click "Log to Console" to see detailed token info
4. Copy the User JWT and decode it at https://jwt.io

**Common causes:**
- ❌ Token expired (check expiration time)
- ❌ JWT_SECRET mismatch between auth and Edge Function
- ❌ User doesn't exist in `auth.users` table
- ❌ Edge Function JWT verification misconfigured

**Backend verification:**
```typescript
// Edge Function should verify with:
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY'),
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization') }
    }
  }
)

const { data: { user }, error } = await supabase.auth.getUser()
```

---

### Issue 3: Token Format Issues

**Symptoms:**
- "Invalid JWT format" errors
- Missing parts in token

**Debug:**
```javascript
import { decodeJWT, validateJWT } from './lib/jwt-debug-utils'

const token = "your-token-here"
const decoded = decodeJWT(token)
const validation = validateJWT(token)

console.log('Decoded:', decoded)
console.log('Validation:', validation)
```

**Valid JWT structure:**
- 3 parts separated by `.`
- Format: `header.payload.signature`
- Base64url encoded

---

### Issue 4: Role Mismatch

**Symptoms:**
- Using anon key instead of user JWT
- "anon" role when expecting "authenticated"

**Debug:**
```javascript
import { getRoleFromJWT } from './lib/jwt-debug-utils'

const anonKey = publicAnonKey
const userToken = session?.access_token

console.log('Anon Key Role:', getRoleFromJWT(anonKey))     // Should be "anon"
console.log('User Token Role:', getRoleFromJWT(userToken)) // Should be "authenticated"
```

**Solution:**
- Ensure `Authorization: Bearer` header uses **user token**, not anon key
- Anon key should only be in `apikey` header

---

## API Client Configuration

### Current Setup

**Edge Function URL:**
```
https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/make-server-fb677d93
```

**Headers sent on every request:**
```javascript
{
  'apikey': '<supabase-anon-key>',           // Public key
  'Authorization': 'Bearer <user-jwt>',       // User token
  'Content-Type': 'application/json'
}
```

**Anon Key (decoded):**
```json
{
  "iss": "supabase",
  "ref": "mnkwpcexwhkhyxfgirhx",
  "role": "anon",
  "iat": 1766455969,
  "exp": 2082031969
}
```

---

## Manual Testing with cURL

Copy tokens from the debug panel and test Edge Functions manually:

```bash
# Get your tokens from the JWT Debug Panel

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
USER_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test API call
curl -X GET \
  "https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/make-server-fb677d93/risks" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json"
```

---

## JWT Utility Functions

The following utilities are available in `/packages/web/src/lib/jwt-debug-utils.ts`:

### `decodeJWT(token: string)`
Decodes a JWT and returns header, payload, signature, and expiration info.

### `logJWT(token: string, label?: string)`
Pretty-prints JWT information to console.

### `validateJWT(token: string)`
Validates JWT structure and checks for common issues.

### `getUserIdFromJWT(token: string)`
Extracts user ID from JWT payload.

### `getRoleFromJWT(token: string)`
Extracts role from JWT payload.

### `compareJWTs(token1, token2, label1?, label2?)`
Compares two JWTs and shows differences.

---

## Best Practices

### ✅ DO:
- Use debug panel for quick visual checks
- Enable full debug mode when troubleshooting 401 errors
- Log tokens to console in development
- Copy tokens to test in API clients
- Check expiration times before debugging other issues

### ❌ DON'T:
- Leave `DEBUG_JWT=true` enabled in production
- Share JWT tokens (they contain sensitive session data)
- Use expired tokens
- Mix up anon key and user JWT
- Commit tokens to git

---

## Production Monitoring

In production, JWT errors are automatically handled:

1. **Expired tokens**: Automatic sign out + redirect to login
2. **401 errors**: Session cleared + redirect to login  
3. **No session**: Immediate redirect to login

**Error handling code:**
```typescript
// From api-client.ts
if (response.status === 401) {
  console.error('[API Client] 401 Unauthorized - Invalid JWT');
  await supabase.auth.signOut()
  window.location.href = '/login'
}
```

---

## Need Help?

If you're still experiencing JWT issues:

1. ✅ Check the JWT Debug Panel first
2. ✅ Enable full debug mode and capture console logs
3. ✅ Decode both tokens at https://jwt.io
4. ✅ Verify Edge Function JWT verification settings
5. ✅ Check Supabase Auth logs in dashboard
6. ✅ Ensure user exists in `auth.users` table

---

## Technical Reference

### Token Locations

| Token Type | Storage | Header | Purpose |
|------------|---------|--------|---------|
| Anon Key | `/utils/supabase/info.tsx` | `apikey` | Public API access |
| User JWT | Supabase session | `Authorization: Bearer` | User authentication |

### Token Lifecycle

```
1. User logs in → supabase.auth.signInWithPassword()
2. Receives session with access_token (User JWT)
3. Session stored in browser by Supabase SDK
4. API client fetches token → session.access_token
5. Token sent in Authorization header
6. Edge Function verifies token
7. If valid: request proceeds
8. If invalid/expired: 401 error → logout → redirect
```

### Session Management

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Listen for changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})

// Sign out (clears session)
await supabase.auth.signOut()
```

---

**Last Updated:** December 2024  
**App Version:** OT Continuum MS2 Production-Ready Prototype
