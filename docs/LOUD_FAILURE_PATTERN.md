# Loud Failure Pattern - Session Validation

## 🎯 **Purpose**

Prevent silent failures like `Bearer undefined` from happening by validating session and tokens **explicitly** before making Edge Function calls.

---

## ✅ **Implementation: TenantSetup.tsx**

### **Validation Checklist (3 Critical Checks)**

```typescript
// 1. Get session
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

// 2. LOUD FAILURE #1: No session at all
if (!session) {
  console.error('❌ VALIDATION FAILED: No session object returned');
  throw new Error('No active session found. Please sign in again.');
}

// 3. LOUD FAILURE #2: Missing access token
const accessToken = session.access_token;
if (!accessToken) {
  console.error('❌ VALIDATION FAILED: access_token is null/undefined');
  throw new Error('Missing access token in session. Please sign out and sign in again.');
}

// 4. LOUD FAILURE #3: Token too short (invalid)
if (accessToken.length < 100) {
  console.error('❌ VALIDATION FAILED: access_token is suspiciously short');
  throw new Error(`Invalid access token (length: ${accessToken.length}). Please sign out and sign in again.`);
}
```

---

## 🔒 **Safe Logging (Never Log Full Tokens)**

### **✅ Safe: Log First 20 Characters**
```typescript
console.log('Token preview (first 20 chars):', accessToken.substring(0, 20) + '...');
console.log('Authorization preview:', `Bearer ${accessToken.substring(0, 20)}...`);
```

### **✅ Safe: Log Token Length**
```typescript
console.log('Token length:', accessToken.length); // OK - just a number
console.log('apikey length:', publicAnonKey.length); // OK - just a number
```

### **✅ Safe: Log Header Presence**
```typescript
console.log('📋 Headers to be sent:');
console.log('  - Content-Type: application/json');
console.log('  - apikey: present =', !!publicAnonKey, ', length =', publicAnonKey.length);
console.log('  - Authorization: present =', true, ', length =', `Bearer ${accessToken}`.length);
```

### **❌ NEVER: Log Full Tokens**
```typescript
// ❌ NEVER DO THIS
console.log('Access token:', accessToken); // EXPOSES USER JWT!
console.log('Headers:', headers); // EXPOSES BOTH KEYS!
console.log('Authorization:', `Bearer ${accessToken}`); // EXPOSES JWT!
```

---

## 🚨 **Loud Failure Examples**

### **Error #1: No Session**
```
❌ VALIDATION FAILED: No session object returned
Error: No active session found. Please sign in again.
```

**User sees:**
> ⚠️ No active session found. Please sign in again.

**Action:** Redirect to login page

---

### **Error #2: Missing Token**
```
❌ VALIDATION FAILED: access_token is null/undefined
Session object: { user: {...}, expires_at: 1234567890 }
Error: Missing access token in session. Please sign out and sign in again.
```

**User sees:**
> ⚠️ Missing access token in session. Please sign out and sign in again.

**Action:** User signs out → signs back in

---

### **Error #3: Invalid Token (Too Short)**
```
❌ VALIDATION FAILED: access_token is suspiciously short
Token length: 45 (expected >100)
Token preview: eyJhbGciOiJIUzI1NiI...
Error: Invalid access token (length: 45). Please sign out and sign in again.
```

**User sees:**
> ⚠️ Invalid access token (length: 45). Please sign out and sign in again.

**Action:** User signs out → signs back in

---

## 🔍 **Complete Console Output Example**

### **✅ Success Case:**
```
[TenantSetup] 🚀 Starting onboarding flow
  User ID: 550e8400-e29b-41d4-a716-446655440000
  Email: user@example.com
  Organization: Acme Industrial

  [TenantSetup] 🔐 Session Validation (STRICT)
    Session exists: true
    Session error: None
    ✅ Session object exists
    User ID from session: 550e8400-e29b-41d4-a716-446655440000
    User email from session: user@example.com
    ✅ Access token exists
    Token length: 243
    Token preview (first 20 chars): eyJhbGciOiJIUzI1NiIs...
    ✅ Access token length valid (>100 chars)
    
    📋 Headers to be sent:
      - Content-Type: application/json
      - apikey: present = true , length = 356
      - Authorization: present = true , length = 250
      - Authorization preview: Bearer eyJhbGciOiJIUzI1NiIs...
    
    ✅ apikey and access_token are different (correct)
```

### **❌ Failure Case (No Session):**
```
[TenantSetup] 🚀 Starting onboarding flow
  User ID: 550e8400-e29b-41d4-a716-446655440000
  Email: user@example.com
  Organization: Acme Industrial

  [TenantSetup] 🔐 Session Validation (STRICT)
    Session exists: false
    Session error: None
    ❌ VALIDATION FAILED: No session object returned

[TenantSetup] ❌ Setup failed: Error: No active session found. Please sign in again.
```

---

## 📋 **Additional Validation Checks**

### **Check #4: Verify Keys are Different**
```typescript
if (publicAnonKey === accessToken) {
  console.error('❌ CRITICAL: apikey and access_token are IDENTICAL!');
  throw new Error('Configuration error: API key and access token are identical.');
}
```

**Why:** Prevents accidentally using anon key as Authorization header

---

### **Check #5: Verify User ID Matches**
```typescript
if (session.user?.id !== userId) {
  console.error('❌ User ID mismatch:', {
    expected: userId,
    actual: session.user?.id
  });
  throw new Error('User ID mismatch. Please sign in again.');
}
```

**Why:** Ensures session belongs to the correct user

---

## 🎯 **Benefits of Loud Failures**

| Benefit | Description |
|---------|-------------|
| **No Silent Failures** | `Bearer undefined` is immediately caught and reported |
| **Clear Error Messages** | Users know exactly what's wrong and what to do |
| **Debugging Friendly** | Console logs show exactly which validation failed |
| **Security Safe** | Only first 20 chars logged, never full tokens |
| **Early Detection** | Catches issues before making API calls |

---

## 🔧 **How to Apply to Other Components**

### **Template: Validate Before Edge Function Call**
```typescript
async function callEdgeFunction() {
  // 1. Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // 2. Check #1: Session exists
  if (!session) {
    console.error('❌ No session');
    throw new Error('No active session. Please sign in again.');
  }
  
  // 3. Check #2: Token exists
  const token = session.access_token;
  if (!token) {
    console.error('❌ No access token');
    throw new Error('Missing access token. Please sign out and sign in again.');
  }
  
  // 4. Check #3: Token valid length
  if (token.length < 100) {
    console.error('❌ Token too short:', token.length);
    throw new Error(`Invalid token (length: ${token.length}). Please sign out and sign in again.`);
  }
  
  // 5. Safe logging
  console.log('✅ Session valid');
  console.log('Token preview:', token.substring(0, 20) + '...');
  console.log('Token length:', token.length);
  
  // 6. Make request
  const response = await fetch(url, {
    headers: {
      'apikey': publicAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response;
}
```

---

## 🆘 **Troubleshooting**

### **Issue: "No active session" error**
**Cause:** User's session expired or was cleared  
**Fix:** Sign out → sign back in

---

### **Issue: "Missing access token" error**
**Cause:** Session exists but access_token is null  
**Fix:** Clear localStorage → sign in again

---

### **Issue: "Invalid access token (length: X)" error**
**Cause:** Token is corrupted or truncated  
**Fix:** Sign out → sign back in

---

### **Issue: "API key and access token are identical" error**
**Cause:** Configuration bug - using anon key as JWT  
**Fix:** Check code - verify using `session.access_token`, not `publicAnonKey`

---

## 📚 **Files Using This Pattern**

- ✅ `/pages/onboarding/TenantSetup.tsx` - **Implemented**
- ⏳ `/lib/apiFetch.ts` - **Should add similar validation**
- ⏳ Other Edge Function calls - **Apply as needed**

---

## 🔐 **Security Notes**

1. **Never log full tokens** - Use `.substring(0, 20)` only
2. **Never send tokens to external services** - Only to Supabase Edge Functions
3. **Never store tokens in localStorage manually** - Let Supabase handle it
4. **Always validate before use** - Don't assume session exists
5. **Log validation failures loudly** - Use `console.error` with clear messages

---

## ✅ **Checklist: Before Making Edge Function Call**

- [ ] ✅ Get session with `supabase.auth.getSession()`
- [ ] ✅ Check session is not null
- [ ] ✅ Check `session.access_token` exists
- [ ] ✅ Check token length > 100 chars
- [ ] ✅ Log first 20 chars only (safe logging)
- [ ] ✅ Verify apikey ≠ access_token
- [ ] ✅ Use `Bearer ${token}` in Authorization header
- [ ] ✅ Throw clear error if validation fails
- [ ] ✅ Update UI to show error to user

---

**Last Updated:** December 27, 2024  
**Pattern Status:** ✅ **Production Ready**  
**Maintained by:** OT Continuum Engineering
