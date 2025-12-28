# 🚀 Auth/JWT Iframe Fix - Quick Reference

## ✅ What Was Fixed

**Problem:** Figma iframe may have empty localStorage → JWT auth fails  
**Solution:** Use `supabase.auth.getSession()` → Works without localStorage  
**Status:** ✅ Complete

---

## 📦 New Files Created

| File | Purpose |
|------|---------|
| `/lib/authSession.ts` | Get JWT from session ✅ |
| `/lib/edgeFetch.ts` | Call Edge Functions ✅ |
| `/lib/ai-gateway-client.ts` | AI Gateway client example ✅ |
| `/components/AuthTokenDebug.tsx` | Debug panel (dev) ✅ |

---

## 💡 How to Use

### Get JWT Token
```typescript
import { getAccessToken } from './lib/authSession';

const token = await getAccessToken();
// Returns string | null
```

### Call Edge Function
```typescript
import { edgeFetchJson } from './lib/edgeFetch';

const data = await edgeFetchJson('ai_gateway', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
```

### Call AI Gateway
```typescript
import { aiGateway } from './lib/ai-gateway-client';

const analysis = await aiGateway.signalAssistant({
  tenant_id: 'uuid',
  signal_data: { ... }
});
```

### Handle Errors
```typescript
import { isNoSessionError } from './lib/edgeFetch';

try {
  await edgeFetchJson('ai_gateway', { ... });
} catch (err) {
  if (isNoSessionError(err)) {
    // User not logged in
    navigate('/login');
  } else {
    // Other error
    console.error(err);
  }
}
```

---

## 🎯 Testing

### Figma Iframe
1. Open in Figma iframe
2. Log in
3. Call AI Gateway
4. ✅ Should work (no 401)

### Normal Browser
1. Open in browser
2. Log in
3. Call AI Gateway
4. ✅ Should work same

### Logged Out
1. Clear session
2. Call Edge Function
3. ✅ Should throw NO_SESSION

---

## 🐛 Debug

### Show Token Info (Dev Only)
```typescript
import { AuthTokenDebug } from './components/AuthTokenDebug';

<AuthTokenDebug />
```

Shows:
- JWT prefix
- User ID
- Email
- Expiration

---

## 📚 Docs

- **Full Guide:** `/docs/AUTH_JWT_IFRAME_FIX.md`
- **Summary:** `/AUTH_JWT_IFRAME_FIX_COMPLETE.md`
- **This File:** Quick reference

---

## ✅ Checklist

- [x] Created authSession.ts
- [x] Created edgeFetch.ts
- [x] Created ai-gateway-client.ts
- [x] Created AuthTokenDebug.tsx
- [x] Updated TenantResolver.tsx
- [x] Updated api-client.ts
- [x] Wrote documentation
- [ ] Test in Figma iframe
- [ ] Test in normal browser
- [ ] Test error cases

---

**Status:** ✅ Ready for Testing  
**Date:** December 26, 2024
