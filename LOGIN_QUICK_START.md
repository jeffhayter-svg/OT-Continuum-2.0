# 🚀 OT Continuum - Login Quick Start

## 🎯 First Time? Create an Account

### Step 1: Enter Your Email & Password
```
Email: admin@example.com
Password: password1234
```

### Step 2: Click "✨ Create Account (Same Credentials)"

**NOT** "Sign In" ❌

### Step 3: Wait for Success
```
✅ Account created! Setting up your organization...
```

### Step 4: Automatic Login
- Organization created automatically
- You'll be logged in as owner/admin
- Dashboard will load

---

## 🔄 Returning User? Sign In

### Step 1: Enter Your Email & Password
Same credentials you used to create account

### Step 2: Click "Sign In"

### Step 3: Success!
Dashboard loads with your organization

---

## ❌ Common Errors

### Error: "Invalid login credentials"

**Meaning:** Account doesn't exist yet

**Fix:** Click "Create Account" instead of "Sign In"

### Error: "Email not confirmed"

**Meaning:** Email confirmations are enabled

**Fix Option 1:** Check your email for confirmation link

**Fix Option 2:** Disable in Supabase:
1. Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. Try creating account again

### Error: "Password must be at least 8 characters"

**Fix:** Use a longer password (8+ characters)

---

## 💡 Tips

### For Development
Use these test credentials:
- Email: `test@example.com`
- Password: `test1234`

### First Time Setup
1. Create account (not sign in!)
2. Wait for "Setting up your organization..."
3. You'll auto-login and see dashboard
4. Your organization is ready!

### Password Requirements
- Minimum 8 characters
- Can contain letters, numbers, special characters
- No maximum length

---

## 🔍 How to Check If You Have an Account

### Method 1: Try Creating Account
If you see "User already exists", you have an account - use "Sign In" instead

### Method 2: Check Supabase Dashboard
1. Go to Supabase Dashboard
2. Authentication → Users
3. Search for your email
4. If found, you have an account

### Method 3: Browser Console
```javascript
// Open DevTools (F12), paste this:
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
});

if (error) {
  console.log('❌', error.message);
  // "Invalid login credentials" = no account
} else {
  console.log('✅ Account exists!');
}
```

---

## ✅ What Happens After Creating Account

1. ✅ User account created in Supabase Auth
2. ✅ Auto-login (session created)
3. ✅ Tenant Resolver runs
4. ✅ Organization created automatically
5. ✅ You're added as owner/admin
6. ✅ Dashboard loads
7. ✅ You can access all workflow pages

---

## 🆘 Need Help?

### Still can't log in?

1. **Clear browser cache/cookies**
2. **Try incognito/private mode**
3. **Check browser console (F12) for errors**
4. **Verify Supabase URL/keys are correct** (see `.env.local`)

### Account locked out?

1. Go to Supabase Dashboard
2. Authentication → Users
3. Find your user
4. Delete and recreate account

---

## 📞 Support Checklist

If reporting an issue, provide:

- [ ] Email you're using
- [ ] Error message (exact text)
- [ ] Browser console output (F12 → Console)
- [ ] Which button you clicked (Sign In vs Create Account)
- [ ] Whether account was created before
- [ ] Screenshot of error (if visual)

---

**Remember:** First time = Create Account, not Sign In! 🎯
