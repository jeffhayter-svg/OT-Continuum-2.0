# 🔍 DEBUG LOGIN - Step by Step Instructions

## ❌ Current Error

```
[App.tsx Login] Error: AuthApiError: Invalid login credentials
```

This means you're trying to login with an account that doesn't exist yet.

---

## ✅ SOLUTION: Follow These Exact Steps

### **Step 1: Open Browser Console**

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Clear console (click 🚫 icon)

---

### **Step 2: Create Account First**

**DO NOT click "Sign In" yet!**

1. Enter email: `test@example.com`
2. Enter password: `password123` (must be 8+ characters)
3. Click **"Create one with the same credentials"**

**Expected Console Output:**

```
[App.tsx Signup] 🔐 Creating Account via Backend
  Email: test@example.com
  Password length: 11

[App.tsx Signup] 📡 Backend Request
  URL: https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/signals/auth/signup
  Email: test@example.com
  Full name: test
  Password length: 11

[App.tsx Signup] 📥 Backend Response
  Status: 201 Created
  OK: true

[App.tsx Signup] Response body: {"user":{"id":"...","email":"test@example.com","full_name":"test"}}

[App.tsx Signup] ✅ Success!
  User created: {id: "...", email: "test@example.com", full_name: "test"}
```

**Expected UI:**

Green box with:
```
✅ SUCCESS! Account created. Now click "Sign In" above to login with your credentials.
```

---

### **Step 3: Now Sign In**

1. **Keep the same email and password in the form**
2. Click **"Sign In"** button (the blue one at the top)

**Expected Console Output:**

```
[App.tsx Login] 🔐 Runtime Validation
  Supabase URL: https://mnkwpcexwhkhyxfgirhx.supabase.co
  Anon Key Length: 215
  Anon Key First 12 chars: eyJhbGciOiJI
  Anon Key Valid: ✅ YES

[App.tsx Login] ✅ Login successful
```

**Expected Result:**

- Redirect to dashboard
- See "Welcome to OT Continuum" page
- Email shown in top right corner

---

## 🚨 Troubleshooting

### **Issue 1: Signup Returns 404**

**Console shows:**
```
[App.tsx Signup] 📥 Backend Response
  Status: 404 Not Found
```

**Cause:** Edge Function not deployed or URL wrong

**Check:**
1. Verify URL in console matches: `https://mnkwpcexwhkhyxfgirhx.supabase.co/functions/v1/signals/auth/signup`
2. Edge function must be deployed

---

### **Issue 2: Signup Returns 500**

**Console shows:**
```
[App.tsx Signup] Response body: {"error":"DATABASE_ERROR","message":"..."}
```

**Possible Causes:**
1. `users` table doesn't exist
2. Service role key not set
3. Database connection issue

**Solution:**
- Check Supabase Dashboard → Table Editor
- Verify `users` table exists with columns: `id`, `email`, `full_name`

---

### **Issue 3: Signup Returns "User already exists"**

**Console shows:**
```
[App.tsx Signup] Error response: {error: "CONFLICT", message: "User with this email already exists"}
```

**UI shows:**
```
⚠️ An account with this email already exists. Please sign in instead using the "Sign In" button above.
```

**Solution:**
- The account already exists!
- Just click "Sign In" (don't create again)
- OR use a different email

---

### **Issue 4: Network Error**

**Console shows:**
```
[App.tsx Signup] ❌ Unexpected Error
  Error: TypeError: Failed to fetch
  Error type: TypeError
  Error message: Failed to fetch
```

**Possible Causes:**
1. CORS issue
2. Edge Function not deployed
3. Internet connection issue

**Solution:**
- Check Network tab for actual error
- Verify Edge Function is deployed

---

### **Issue 5: Login Still Fails After Signup**

**Console shows:**
```
[App.tsx Signup] ✅ Success!
(then...)
[App.tsx Login] Error: AuthApiError: Invalid login credentials
```

**Possible Causes:**
1. Used different email/password for login vs signup
2. User was created but something went wrong
3. Email not actually confirmed

**Debug Steps:**

1. **Check what email was used:**
   ```
   Look in console for:
   [App.tsx Signup] Email: <what email?>
   ```

2. **Make sure you're using EXACT same credentials for login**
   - Email is lowercased and trimmed
   - Password is trimmed
   - Make sure no extra spaces

3. **Verify user in Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/mnkwpcexwhkhyxfgirhx/auth/users
   - Look for the email address
   - Check if "Confirmed" column shows ✓

4. **If user NOT in dashboard:**
   - Signup failed silently
   - Check console for actual error
   - Look for response body

5. **If user IS in dashboard but NOT confirmed:**
   - Edge function didn't set `email_confirm: true`
   - Manually confirm in dashboard (click ... → Confirm email)
   - Try login again

---

## 📋 Complete Flow Checklist

### **Signup Phase:**

- [ ] Open Console (F12)
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `password123`
- [ ] Click "Create one with the same credentials"
- [ ] See `[App.tsx Signup] 🔐 Creating Account via Backend`
- [ ] See `Status: 201 Created`
- [ ] See `[App.tsx Signup] ✅ Success!`
- [ ] See green box: "✅ SUCCESS! Account created"

### **Login Phase:**

- [ ] Same email still in form: `test@example.com`
- [ ] Same password still in form: `password123`
- [ ] Click "Sign In" (blue button)
- [ ] See `[App.tsx Login] 🔐 Runtime Validation`
- [ ] See `Anon Key Valid: ✅ YES`
- [ ] See `[App.tsx Login] ✅ Login successful`
- [ ] Redirect to dashboard
- [ ] See email in top right

---

## 🔬 Advanced Debugging

### **Check Network Tab:**

1. Open DevTools → Network tab
2. Click "Create one with the same credentials"
3. Look for request to: `/signals/auth/signup`

**Check:**
- Request Method: POST
- Status: 201 (success) or error code
- Request Headers: Should include `apikey`
- Request Body: `{"email":"...","password":"...","full_name":"..."}`
- Response Body: `{"user":{...}}` or error

### **Check if User Exists:**

**Method 1: Supabase Dashboard**
```
1. Go to https://supabase.com/dashboard/project/mnkwpcexwhkhyxfgirhx
2. Click "Authentication" in left sidebar
3. Click "Users" tab
4. Look for test@example.com
```

**Method 2: SQL Editor**
```sql
SELECT * FROM auth.users WHERE email = 'test@example.com';
```

**Method 3: Console**
```javascript
// After signup, check in browser console:
const { data, error } = await supabase.auth.admin.listUsers();
console.log(data.users);
```

---

## 📊 What Each Log Means

### **Signup Logs:**

| Log | Meaning |
|-----|---------|
| `🔐 Creating Account via Backend` | Starting signup process |
| `📡 Backend Request` | About to call Edge Function |
| `Status: 201 Created` | ✅ User created successfully |
| `Status: 409 Conflict` | ⚠️ User already exists |
| `Status: 400 Bad Request` | ❌ Validation error (check message) |
| `Status: 500 Internal Server Error` | ❌ Server error (check backend logs) |
| `✅ Success!` | User created and ready to login |

### **Login Logs:**

| Log | Meaning |
|-----|---------|
| `🔐 Runtime Validation` | Checking Supabase config |
| `Anon Key Valid: ✅ YES` | Config is correct |
| `Anon Key Valid: ❌ NO` | Config is broken (won't work) |
| `✅ Login successful` | Login worked, redirecting |
| `Error: Invalid login credentials` | Account doesn't exist or wrong password |

---

## ✅ Success Criteria

**Signup succeeded if you see:**
1. Console: `Status: 201 Created`
2. Console: `✅ Success!`
3. UI: Green box with "✅ SUCCESS! Account created"

**Login succeeded if you see:**
1. Console: `✅ Login successful`
2. UI: Redirect to dashboard
3. UI: Email in top right corner

---

## 🆘 Still Not Working?

### **Share These Details:**

1. **Signup console output:**
   - Copy entire `[App.tsx Signup]` section
   - Include status code and response body

2. **Login console output:**
   - Copy entire `[App.tsx Login]` section
   - Include error message

3. **Network tab screenshot:**
   - Show the `/auth/signup` request
   - Show status code and response

4. **What you see in UI:**
   - Red error box? What does it say?
   - Green success box? Then login fails?

---

**Last Updated:** December 25, 2024  
**Purpose:** Debug "Invalid login credentials" error  
**Next Step:** Follow Step 1-3 above and share console output
