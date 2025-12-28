# 🔧 OT Continuum Auth Troubleshooting - Quick Reference

## 🚨 Common Issues & Instant Fixes

---

### **Issue: "Invalid login credentials" error**

**Symptom:** User enters correct email/password but gets error

**Possible Causes:**
1. Email not verified (most common)
2. Wrong password
3. Email doesn't exist
4. Case mismatch (User@Example.com vs user@example.com)

**Solutions:**

✅ **If email not verified:**
- App should auto-route to `/verify-email`
- Check console for: `[Login] Email not verified - routing to verify email screen`
- If not routing, manually go to `/verify-email?email=user@example.com`

✅ **If wrong password:**
- Error message: "Incorrect email or password"
- Try password reset: `/password-reset`

✅ **If email doesn't exist:**
- Go to `/signup` to create account

✅ **Manual fix (admin):**
```
1. Supabase Dashboard → Authentication → Users
2. Find user with "Waiting for verification"
3. Click "..." → "Confirm email"
4. User can now login
```

---

### **Issue: POST /auth/v1/token returns 400**

**Symptom:** Network tab shows 400 error on login attempt

**Cause:** Email not verified (Supabase rejects unverified logins)

**Expected Behavior:**
- App detects 400 status
- Auto-routes to `/verify-email`
- User sees verification instructions

**Verify Fix:**
```javascript
// Check browser console for:
[Login] Sign-in error: { message: "Email not confirmed", status: 400 }
[Login] Email not verified - routing to verify email screen
```

**If not auto-routing:**
- Check `Login.tsx` has updated error handling
- Verify this code exists:
```typescript
const isUnverifiedEmail = 
  signInError.message.includes('Email not confirmed') ||
  signInError.status === 400;

if (isUnverifiedEmail) {
  navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
}
```

---

### **Issue: User can't receive verification email**

**Symptom:** No email arrives after signup

**Checklist:**

- [ ] **Wait 1-5 minutes** (delivery delay is normal)
- [ ] **Check spam/junk folder**
- [ ] **Search for "noreply@supabase.io"** in email
- [ ] **Click "Resend Verification Email"** button
- [ ] **Verify email address is correct**
- [ ] **Add to safe senders:** noreply@supabase.io

**Admin Override:**
```
Supabase Dashboard → Authentication → Users
→ Find user → "..." → "Confirm email"
```

**Check Supabase Email Settings:**
```
Settings → Auth → Email
✅ Enable email confirmations: ON
✅ Confirm email: Required
```

---

### **Issue: Verification link doesn't work**

**Symptom:** Click email link, nothing happens or error shown

**Causes:**
1. Link expired (>24 hours old)
2. Link already used
3. Browser blocking redirect
4. Wrong Supabase project

**Solutions:**

✅ **Request fresh link:**
- Go to `/verify-email?email=user@example.com`
- Click "Resend Verification Email"
- Check inbox for NEW email
- Click NEW link

✅ **Check browser console** for errors

✅ **Try different browser** (incognito mode)

✅ **Manually confirm** (admin):
```
Supabase Dashboard → Confirm email
```

---

### **Issue: User stuck in verification loop**

**Symptom:** User verifies email but still can't login

**Debug Steps:**

1. **Check Supabase user status:**
```
Dashboard → Authentication → Users
Status should be: "Confirmed ✓"
If still "Waiting for verification ⚠️" → Problem!
```

2. **Check email confirmation timestamp:**
```
User details → confirmed_at field
Should have a timestamp, not null
```

3. **Try fresh signup:**
```
Delete user from Supabase
Sign up again with same email
```

4. **Clear browser cache:**
```
Chrome: Settings → Privacy → Clear browsing data
Firefox: Settings → Privacy → Clear Data
```

---

### **Issue: Multiple Supabase projects**

**Symptom:** Login works in one environment but not another

**Check Project URLs:**

Login screen (dev mode) shows:
```
Supabase Project: mnkwpcexwhkhyxfgirhx.supabase.co
```

Signup screen should show SAME project.

**Verify:**
```javascript
// All auth screens should import from same file
import { projectId } from '../../../utils/supabase/info';

// Check value
console.log('Project ID:', projectId);
// Expected: "mnkwpcexwhkhyxfgirhx"
```

**Fix:**
- Ensure all components import from `/utils/supabase/info.tsx`
- Don't hardcode project URLs

---

### **Issue: Signup creates user but no session**

**Symptom:** User created in Supabase but can't login immediately

**Expected Behavior:**
This is CORRECT! When email verification is enabled:
1. Signup creates user (status: "waiting for verification")
2. NO session is created
3. User must verify email first
4. Then login to get session

**Flow:**
```
Signup → User Created (no session)
      → Verify Email
      → Login → Session Created ✓
```

**DO NOT** try to auto-login after signup if verification is enabled!

---

## 🔍 Debug Commands

### **Check Current Session**
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
// null = not logged in
// object = logged in
```

### **Check User Status**
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
console.log('Confirmed at:', user?.confirmed_at);
console.log('Identities:', user?.identities);
```

### **Test Signup**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpass123'
});
console.log('Signup result:', { data, error });
```

### **Test Login**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpass123'
});
console.log('Login result:', { data, error });
```

### **Test Resend**
```javascript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'test@example.com'
});
console.log('Resend result:', error ? error.message : 'Success!');
```

---

## 📊 Expected Console Logs

### **Successful Signup Flow:**
```
[Signup] User created: {
  id: "abc123...",
  email: "user@example.com",
  confirmed_at: null,
  identities: [],
  needsEmailConfirmation: true
}
```

### **Login with Unverified Email:**
```
[Login] Attempting sign in with normalized email: user@example.com
[Login] Sign-in error: {
  message: "Email not confirmed",
  status: 400,
  name: "AuthApiError"
}
[Login] Email not verified - routing to verify email screen
```

### **Successful Login:**
```
[Login] Attempting sign in with normalized email: user@example.com
[Login] Login successful, navigating to tenant resolver
```

### **Resend Verification:**
```
[VerifyEmail] Verification email resent to: user@example.com
```

---

## ✅ Health Check Checklist

**Run this checklist to verify auth is working:**

- [ ] **Supabase Client Configured:**
  ```javascript
  import { supabase } from './lib/api-client';
  console.log(supabase.supabaseUrl);
  // Should show: https://mnkwpcexwhkhyxfgirhx.supabase.co
  ```

- [ ] **Email Verification Enabled:**
  ```
  Supabase Dashboard → Settings → Auth → Email
  ✅ Enable email confirmations: ON
  ```

- [ ] **Signup Route Works:**
  - Visit `/signup`
  - Fill form
  - Submit
  - Should route to `/verify-email`

- [ ] **Verify Email Screen Works:**
  - Visit `/verify-email?email=test@example.com`
  - Should show email address
  - Resend button should be visible

- [ ] **Login Route Works:**
  - Visit `/login`
  - Debug info shows correct Supabase project
  - Form submits without errors

- [ ] **Input Normalization:**
  ```javascript
  // Login and Signup should normalize:
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  ```

- [ ] **Error Handling:**
  - Try login with wrong password
  - Should show: "Incorrect email or password"
  - Should NOT show raw API errors

---

## 🆘 Emergency Fixes

### **Nuclear Option 1: Disable Email Verification**
```
Supabase Dashboard → Settings → Auth → Email
❌ Disable "Confirm email" requirement
```
⚠️ **Warning:** Only for development/testing. Not recommended for production.

### **Nuclear Option 2: Manually Confirm All Users**
```javascript
// Run in Supabase SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```
⚠️ **Warning:** Security risk. Only use for testing.

### **Nuclear Option 3: Reset User**
```
1. Supabase Dashboard → Authentication → Users
2. Find user → Delete
3. User signs up again
```

---

## 📞 Support Checklist

**Before asking for help, provide:**

1. **Supabase Project ID:**
   - Login screen shows: "Supabase Project: ________"

2. **Browser Console Logs:**
   - Copy all logs starting with `[Login]`, `[Signup]`, `[VerifyEmail]`

3. **Network Tab:**
   - Copy request/response for failed login
   - Look for: `POST /auth/v1/token`

4. **Supabase User Status:**
   - Dashboard → Users → User status (confirmed/waiting)

5. **Steps to Reproduce:**
   - Exact clicks/actions that cause the issue

6. **Expected vs Actual:**
   - What should happen
   - What actually happens

---

## ✅ Verification Checklist

**Before deploying, verify:**

- [ ] New user can sign up
- [ ] Signup routes to `/verify-email`
- [ ] Verification email arrives (<5 min)
- [ ] Verification link works
- [ ] User can login after verification
- [ ] Login routes to `/tenant-resolver`
- [ ] Unverified login auto-routes to `/verify-email`
- [ ] Resend button works
- [ ] Wrong password shows user-friendly error
- [ ] Debug info shows in dev mode
- [ ] No raw API errors shown to users

---

**Last Updated:** December 25, 2024  
**Quick Reference for:** Login, Signup, Email Verification Issues
