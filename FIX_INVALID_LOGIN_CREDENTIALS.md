# 🔧 Fix: Invalid Login Credentials Error

## The Issue

You're seeing this error:
```
[App.tsx Login] Error: AuthApiError: Invalid login credentials
```

## ✅ Quick Fix

**The account doesn't exist yet!** You need to **create an account first**.

### Steps:

1. **Enter your email and password** in the form
2. **Click "✨ Create Account (Same Credentials)"** button
3. Wait for the success message: "✅ Account created! Setting up your organization..."
4. You'll be automatically logged in!

---

## 🎯 Why This Happens

The error "Invalid login credentials" means:
- ❌ The email/password combination doesn't exist in the database
- ❌ You haven't created an account yet
- ❌ Or the password is wrong

**Most common reason:** You're trying to log in before creating an account! 🙂

---

## 📋 Complete Walkthrough

### First Time User - Create Account

1. **Open the app** - You'll see the login screen
2. **Enter your email** (e.g., `admin@example.com`)
3. **Enter a password** (minimum 8 characters)
4. **Click "✨ Create Account (Same Credentials)"**
5. **Wait** - You'll see:
   - ✅ Account created! Setting up your organization...
6. **Automatic login** - You'll be redirected to the Tenant Resolver
7. **Organization created** - Your organization will be created automatically
8. **Dashboard** - You'll land on the dashboard as an admin!

### Returning User - Sign In

1. **Open the app**
2. **Enter your email**
3. **Enter your password** (same one you used to create account)
4. **Click "Sign In"**
5. **Success!** - You'll be logged in

---

## 🐛 Troubleshooting

### Issue 1: "Invalid login credentials" even after creating account

**Check:**
- Are you using the **same email** you created the account with?
- Are you using the **same password**?
- Did the account creation succeed? (Check browser console for success message)

**Fix:**
```javascript
// Check in browser console (F12)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'your-password-here'
});

console.log('Data:', data);
console.log('Error:', error);
```

---

### Issue 2: "Email not confirmed"

**Cause:** Email confirmations are enabled in Supabase

**Fix:**
1. Go to **Supabase Dashboard**
2. **Authentication** → **Settings**
3. Find **"Enable email confirmations"**
4. **Toggle OFF** ✅
5. **Save**
6. Try creating account again

Or check your email for the confirmation link!

---

### Issue 3: Account creation fails

**Check browser console** for errors:

```javascript
// Common errors:
// 1. Password too short (< 8 characters)
// 2. Invalid email format
// 3. Email already exists
// 4. Supabase connection error
```

**Fix:**
- Password must be **at least 8 characters**
- Email must be valid format (e.g., `user@example.com`)
- If "User already exists", use "Sign In" instead

---

### Issue 4: Can't remember password

**Currently:** Password reset not implemented in the UI

**Workaround 1 - Create new account:**
1. Use a different email address
2. Create new account
3. You'll get a new organization

**Workaround 2 - Reset in Supabase Dashboard:**
1. Go to **Supabase Dashboard**
2. **Authentication** → **Users**
3. Find your user
4. Click **"..."** → **"Reset password"**
5. Use the reset link sent to your email

**Workaround 3 - Delete and recreate:**
1. Go to **Supabase Dashboard**
2. **Authentication** → **Users**
3. Find your user and **delete** it
4. Go back to app
5. Create account again with same email

---

## 🔍 Check If Account Exists

Run this in browser console (F12):

```javascript
// Method 1: Try to sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
});

if (error) {
  console.error('Error:', error.message);
  // "Invalid login credentials" = account doesn't exist
  // "Email not confirmed" = account exists but not confirmed
} else {
  console.log('✅ Account exists! Signed in:', data.user.email);
}
```

Or check in Supabase Dashboard:
1. **Authentication** → **Users**
2. Search for your email
3. If found, account exists
4. If not found, need to create account

---

## 💡 Pro Tips

### Tip 1: Use a Test Account

For development, create a test account:
- Email: `test@example.com`
- Password: `test1234`

Then share these credentials with your team!

### Tip 2: Enable Email Confirmations for Production

For production, you SHOULD enable email confirmations:
1. **Supabase Dashboard** → **Authentication** → **Settings**
2. **Enable email confirmations** ✅
3. Configure SMTP settings
4. Users will get confirmation emails

### Tip 3: Check Supabase Logs

If issues persist:
1. **Supabase Dashboard** → **Logs**
2. Filter by **Auth**
3. Look for sign-up/sign-in events
4. Check for errors

---

## ✅ Success Checklist

After creating account, verify:

- [ ] No errors in browser console
- [ ] Success message shows: "✅ Account created! Setting up your organization..."
- [ ] Tenant Resolver shows up
- [ ] Organization is created
- [ ] You land on dashboard
- [ ] Top bar shows your email and organization name
- [ ] You can navigate to workflow pages

---

## 📊 What Happens Behind the Scenes

When you click "Create Account":

```
1. Frontend calls supabase.auth.signUp()
   ├─ Email: admin@example.com
   ├─ Password: your-password
   └─ Metadata: { full_name: "admin" }

2. Supabase creates user in auth.users table
   ├─ Assigns UUID (user_id)
   └─ Stores email & hashed password

3. If email confirmations OFF:
   ├─ Auto-login (session created)
   └─ Trigger TenantResolver

4. TenantResolver checks for tenant
   ├─ Query: SELECT * FROM tenant_members WHERE user_id = ?
   └─ If not found, create organization

5. Create organization (automatic)
   ├─ Insert into tenants table
   ├─ Insert into tenant_members table
   └─ Set role = 'owner'

6. Store tenant context in localStorage

7. Redirect to dashboard ✅
```

---

## 🆘 Still Having Issues?

### Share This Info:

1. **Browser console output** (F12 → Console)
2. **Error message** (full text)
3. **Steps you took** (e.g., "Clicked Create Account, entered email/password...")
4. **Supabase logs** (Dashboard → Logs → Auth)

### Quick Debug:

```javascript
// Run in browser console (F12)
console.log('=== DEBUG INFO ===');

// 1. Check session
const { data: session } = await supabase.auth.getSession();
console.log('Has session:', !!session.session);
console.log('User:', session.session?.user?.email);

// 2. Check Supabase connection
console.log('Supabase URL:', supabase.supabaseUrl);

// 3. Try creating account
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'test1234test'
});

console.log('Signup data:', data);
console.log('Signup error:', error);
```

Share the console output!

---

## ✅ Summary

**The fix is simple:**

1. 👉 **Don't click "Sign In"** if you haven't created an account
2. 👉 **Click "✨ Create Account"** first
3. 👉 **Use the same credentials** (email + password)
4. 👉 **Wait for success message**
5. 👉 **You'll be auto-logged in!**

That's it! 🎉

---

**Last Updated:** December 26, 2024  
**Status:** Error message improved with clearer guidance
