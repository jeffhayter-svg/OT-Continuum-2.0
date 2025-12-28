# 🔧 Quick Debug Guide - Login Issues

## 🚨 Problem: Login returning 400 errors

### **Quick Checks (2 minutes)**

#### 1️⃣ **Open Login Page in Dev Mode**

Look at bottom of screen. Should show:
```
Supabase URL: https://mnkwpcexwhkhyxfgirhx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiI...
ℹ️ Using official @supabase/supabase-js client
```

✅ **If you see this:** Configuration is correct  
❌ **If NOT showing:** Check `process.env.NODE_ENV` is 'development'

---

#### 2️⃣ **Open Browser Console**

Try to login. Should see:
```
[Login] Attempting sign in with normalized email: user@example.com
```

✅ **If you see this:** Login function running correctly  
❌ **If NOT showing:** Check Login.tsx has console.log statements

---

#### 3️⃣ **Check Network Tab**

Look for:
```
POST /auth/v1/token?grant_type=password
```

**Unverified User:**
```
Status: 400 Bad Request
Response: { "error": "Email not confirmed" }
```
✅ **Expected:** ONE request, then auto-route to /verify-email  
❌ **Problem:** Multiple repeated requests

**Verified User:**
```
Status: 200 OK
Response: { "access_token": "...", "refresh_token": "..." }
```
✅ **Expected:** Login succeeds, navigate to /tenant-resolver

---

## 🔍 Common Issues & Instant Fixes

### **Issue: Repeated 400 errors (infinite loop)**

**Quick Fix:**
Check Login.tsx has this code:
```typescript
if (isUnverifiedEmail) {
  navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
  return; // ← MUST HAVE THIS
}
```

The `return;` prevents further execution and stops the loop.

---

### **Issue: Not routing to verify screen**

**Quick Fix:**
Check browser console for:
```
[Login] Email not verified - routing to verify email screen
```

If you see this but NOT navigating:
1. Check React Router has `/verify-email` route
2. Try hard refresh (Ctrl+Shift+R)
3. Check for React Router errors in console

---

### **Issue: Different projects on login vs signup**

**Quick Fix:**
Check debug info:
- Login shows: `https://PROJECT_A.supabase.co`
- Signup shows: `https://PROJECT_B.supabase.co`

**Both must be the same!**

Fix: Both should import from `/utils/supabase/info.tsx`

---

### **Issue: Blank anon key**

**Quick Fix:**
Check debug shows:
```
Anon Key: eyJhbGciOiJIUzI1NiI...
```

If shows only `Anon Key: ...`:
1. Open `/utils/supabase/info.tsx`
2. Verify `publicAnonKey` has a value
3. Should start with "eyJ" and be ~100+ chars

---

## ✅ Success Checklist

Run through this quickly:

- [ ] **Debug info shows on login screen** (dev mode)
- [ ] **Supabase URL is correct**
- [ ] **Anon key is not blank** (shows first 20 chars)
- [ ] **Console log shows "[Login] Attempting sign in"**
- [ ] **Network shows ONE request to /auth/v1/token**
- [ ] **Unverified users route to /verify-email** (automatic)
- [ ] **Verified users login successfully**
- [ ] **Wrong password shows friendly error** ("Incorrect email or password")

If all ✅ → Login is working correctly!

---

## 🆘 Emergency Checks

### **Check 1: Verify Supabase Client**
```javascript
// In browser console
import { supabase } from './lib/api-client';
console.log(supabase.supabaseUrl);
console.log(supabase.supabaseKey);
```

### **Check 2: Test Auth Directly**
```javascript
// Sign in test
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log({ data, error });
```

### **Check 3: Manually Confirm Email**
```
Supabase Dashboard → Authentication → Users
→ Find user → "..." → "Confirm email"
```

---

## 📊 Expected Console Output

### **Successful Login:**
```
[Login] Attempting sign in with normalized email: user@example.com
[Login] Login successful, navigating to tenant resolver
```

### **Unverified Email:**
```
[Login] Attempting sign in with normalized email: user@example.com
[Login] Sign-in error: { message: "Email not confirmed", status: 400 }
[Login] Email not verified - routing to verify email screen
```

### **Wrong Password:**
```
[Login] Attempting sign in with normalized email: user@example.com
[Login] Sign-in error: { message: "Invalid login credentials", status: 400 }
```
→ Shows error: "Incorrect email or password"

---

## 🎯 Quick Test Plan

### **Test 1: Unverified User (2 min)**
1. Sign up new user (don't verify)
2. Go to /login
3. Enter credentials
4. Click "Sign In"
5. **Expected:** Auto-route to /verify-email (seamless)
6. **Check console:** "[Login] Email not verified"
7. **Check network:** ONE 400 request (not repeated)

### **Test 2: Verified User (1 min)**
1. Verify email (or admin confirm in Supabase)
2. Go to /login
3. Enter credentials
4. Click "Sign In"
5. **Expected:** Navigate to /tenant-resolver
6. **Check console:** "[Login] Login successful"
7. **Check network:** 200 OK response

### **Test 3: Wrong Password (30 sec)**
1. Go to /login
2. Enter wrong password
3. **Expected:** Error shows "Incorrect email or password"
4. **Check:** NO raw API error visible

---

## 📞 If Nothing Works

**Last Resort Checklist:**

1. **Hard refresh:** Ctrl+Shift+R
2. **Clear cache:** Browser settings → Clear cache
3. **Check Supabase status:** status.supabase.com
4. **Manually confirm email in Supabase Dashboard**
5. **Try different browser** (incognito mode)
6. **Check `/utils/supabase/info.tsx` has correct values**

**Nuclear Option:**
Disable email verification in Supabase (dev only):
```
Settings → Auth → Email
❌ Disable "Confirm email"
```

---

**Last Updated:** December 25, 2024  
**Quick Reference:** 2-minute debug guide for login issues
