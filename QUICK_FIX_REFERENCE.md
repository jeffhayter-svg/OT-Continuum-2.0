# Quick Fix Reference: Signup 401 → 201

## What Was Fixed
**Problem:** `/functions/v1/signals/auth/signup` was returning `401 Unauthorized`

**Root Causes:** 
1. Response helpers weren't including CORS headers
2. Supabase's automatic JWT verification was blocking requests

**Solution:** 
1. Added `...corsHeaders` to all response helper functions
2. Disabled JWT verification for signals function in config.toml

## Three Files Changed

### 1. `/supabase/config.toml`
```toml
# Added Edge Function configuration:

[functions.signals]
verify_jwt = false  # Allows public /auth/signup without JWT
```

### 2. `/supabase/functions/_shared/response.ts`
```typescript
// Added ...corsHeaders to 3 functions:

export function successResponse<T>(...) {
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.request_id,
      ...corsHeaders  // ✅ ADDED
    }
  });
}

export function paginatedResponse<T>(...) {
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.request_id,
      ...corsHeaders  // ✅ ADDED
    }
  });
}

export function errorResponse(...) {
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.request_id,
      ...corsHeaders  // ✅ ADDED
    }
  });
}
```

### 3. `/supabase/functions/signals/index.ts`
```typescript
// Reorganized routing - moved signup to top:

try {
  const url = new URL(req.url);
  const path = url.pathname;

  // =========================================================================
  // PUBLIC ROUTES (no authentication required)
  // =========================================================================
  
  // POST /auth/signup - Create new user account
  if (path.endsWith('/auth/signup') && req.method === 'POST') {
    return await handleSignup(req, requestId);  // ✅ CHECKED FIRST
  }
  
  // =========================================================================
  // AUTHENTICATED ROUTES (requireAuth called in handlers)
  // =========================================================================

  // Other routes...
}

// In handleSignup(), removed duplicate CORS code:
return successResponse(data, requestId, 201);  // ✅ Auto-includes CORS
```

## How to Test

### Browser Test (5 seconds)
1. Open OT Continuum login page
2. Enter any email + password (8+ chars)
3. Click "Create account"
4. Should see: "✅ SUCCESS! Account created..."

### cURL Test (10 seconds)
```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/signals/auth/signup \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR-ANON-KEY" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Should return: 201 with user object
```

## Success Indicators
✅ Response status: `201 Created` (not 401)
✅ Response headers include: `Access-Control-Allow-*`
✅ No CORS errors in browser console
✅ No "Unauthorized" errors
✅ User can login immediately after signup

## Impact
- ✅ Signup endpoint now works without Authorization header
- ✅ All Edge Functions now include CORS headers automatically
- ✅ No breaking changes to existing functionality
- ✅ Affects: signals, risk, workflow, billing, notify Edge Functions

## Deploy
```bash
supabase functions deploy signals
```

## Rollback (if needed)
```bash
git revert HEAD
supabase functions deploy signals
```

## Documentation
- Full details: `/SIGNUP_FIX_SUMMARY.md`
- Test procedures: `/SIGNUP_ACCEPTANCE_TEST.md`
- Complete changelog: `/CHANGELOG_SIGNUP_FIX.md`