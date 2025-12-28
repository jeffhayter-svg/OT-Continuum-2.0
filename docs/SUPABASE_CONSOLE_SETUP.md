# Supabase Console Setup Checklist
**For OT Continuum Platform - Non-Technical Founder Guide**

---

## Overview
This guide will walk you through setting up your Supabase project for the OT Continuum platform. Follow each step in order and check them off as you complete them.

**Estimated time:** 15-20 minutes

---

## Part 1: Create Supabase Project

### ☐ Step 1: Create Your Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"** (if you already have an account)
3. Sign in with GitHub, Google, or email
4. Click **"New project"** (green button, top right)
5. Fill in the project details:
   - **Name:** `ot-continuum-production` (or your preferred name)
   - **Database Password:** Generate a strong password (click the generate button) and **SAVE THIS PASSWORD** securely
   - **Region:** Choose the region closest to your users
   - **Pricing Plan:** Select your preferred plan (Free tier works for development)
6. Click **"Create new project"**
7. Wait 2-3 minutes for your project to be provisioned

---

## Part 2: Capture Essential Credentials

### ☐ Step 2: Find and Save Your Project URL

1. Once your project is ready, you'll be on the **Home** dashboard
2. Click **"Project Settings"** (gear icon in the left sidebar, at the bottom)
3. Click **"API"** in the Settings submenu
4. Under **"Project URL"** section, you'll see:
   ```
   URL: https://xxxxxxxxxxxxx.supabase.co
   ```
5. **Copy this URL** and save it as:
   ```
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   ```

### ☐ Step 3: Find and Save Your Anon (Public) Key

1. Still on the **Settings → API** page
2. Scroll to **"Project API keys"** section
3. Find the key labeled **"anon public"**
4. Click the **copy icon** next to it
5. **Copy this key** and save it as:
   ```
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### ☐ Step 4: Find and Save Your Service Role Key

1. Still on the **Settings → API** page
2. In the **"Project API keys"** section
3. Find the key labeled **"service_role secret"**
4. ⚠️ **IMPORTANT:** This is a sensitive key - never expose it in frontend code or commit it to public repos
5. Click the **copy icon** next to it
6. **Copy this key** and save it as:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Part 3: Enable Authentication

### ☐ Step 5: Enable Email/Password Authentication

1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"** tab
3. Find **"Email"** in the list of providers
4. Click the toggle or "Edit" button next to Email
5. Ensure these settings:
   - ✅ **"Enable Email provider"** is ON
   - ✅ **"Confirm email"** can be OFF for development (turn ON for production)
   - ✅ **"Secure email change"** can be OFF for development
6. Click **"Save"**

### ☐ Step 6: Create Initial Admin User

1. Still in **Authentication** section
2. Click **"Users"** tab
3. Click **"Add user"** button (top right, dropdown may say "Invite user")
4. Select **"Create new user"**
5. Fill in:
   - **Email:** your admin email (e.g., `admin@yourcompany.com`)
   - **Password:** create a strong password and save it securely
   - **Auto Confirm User:** ✅ Check this box (so you don't need to confirm email)
6. Click **"Create user"**
7. **Save these credentials:**
   ```
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=your-secure-password
   ```

---

## Part 4: Configure JWT Custom Claims (Advanced)

### ☐ Step 7: Understand JWT Custom Claims Strategy

**Note:** Custom JWT claims for `tenant_id`, `role`, and `site_ids` are typically handled through:
- Database triggers that run when users are created/updated
- Custom claims stored in `auth.users.raw_user_meta_data` or `auth.users.raw_app_meta_data`
- Edge Functions that enrich the JWT on sign-in

**For OT Continuum**, this will be handled by:
1. The database migrations (which include triggers)
2. The Edge Functions (which manage tenant assignment)
3. Your application code (which stores user metadata)

**Action Required:**
- ✅ No manual UI configuration needed in Supabase Console for this step
- ✅ This will be configured automatically when you run your database migrations
- ✅ Verify this is working in **Step 13** below

---

## Part 5: Configure Edge Function Secrets

### ☐ Step 8: Navigate to Edge Functions Secrets

1. Click **"Edge Functions"** in the left sidebar
2. Click **"Manage secrets"** or the **gear icon** (depending on UI version)
3. You should see a page titled **"Edge Functions Secrets"** or **"Environment Variables"**

### ☐ Step 9: Add SUPABASE_URL Secret

1. Click **"Add new secret"** button
2. Enter:
   - **Name:** `SUPABASE_URL`
   - **Value:** Paste your Project URL from Step 2
3. Click **"Save"** or **"Create secret"**

### ☐ Step 10: Add SUPABASE_ANON_KEY Secret

1. Click **"Add new secret"** button
2. Enter:
   - **Name:** `SUPABASE_ANON_KEY`
   - **Value:** Paste your anon key from Step 3
3. Click **"Save"** or **"Create secret"**

### ☐ Step 11: Add SUPABASE_SERVICE_ROLE_KEY Secret

1. Click **"Add new secret"** button
2. Enter:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Paste your service_role key from Step 4
3. Click **"Save"** or **"Create secret"**

### ☐ Step 12: Add OPENAI_API_KEY Secret (if using AI features)

1. Click **"Add new secret"** button
2. Enter:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** 
     - If you have an OpenAI API key, paste it here
     - If not needed yet, use placeholder: `sk-placeholder-key-not-configured`
3. Click **"Save"** or **"Create secret"**

**Note:** You can update this later when you have a real OpenAI API key.

---

## Part 6: Verification Checklist

### ☐ Step 13: Verify Authentication Setup

1. Go to **Authentication → Users**
2. You should see your admin user listed
3. Note the **UUID** of this user - you'll need it for tenant assignment

**Copy this:**
```
ADMIN_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### ☐ Step 14: Verify API Keys Work

1. Go to **Project Settings → API**
2. Click **"API Docs"** (or try the built-in API explorer)
3. You should see auto-generated API documentation
4. This confirms your project is properly configured

### ☐ Step 15: Verify Edge Function Secrets

1. Go to **Edge Functions**
2. Click **"Manage secrets"**
3. Verify you see these 4 secrets listed:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `OPENAI_API_KEY`

### ☐ Step 16: Test Database Connection (Simple Query)

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Paste this simple test query:
   ```sql
   SELECT current_database(), current_user, version();
   ```
4. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
5. You should see a result showing your database name, user, and PostgreSQL version
6. ✅ If you see results, your database is working!

### ☐ Step 17: Check Database Extensions

1. Still in **SQL Editor**
2. Create a **New query**
3. Paste this query:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgtap');
   ```
4. Click **"Run"**
5. You should see at least `uuid-ossp` and `pgcrypto` installed
6. If `pgtap` is missing, that's OK - it will be installed when you run migrations

---

## Part 7: Save Your Configuration

### ☐ Step 18: Create Your Local .env File

1. In your project folder, create a file called `.env` (copy from `.env.example`)
2. Fill in all the values you collected:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin User (for testing)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your-secure-password
ADMIN_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional
OPENAI_API_KEY=sk-placeholder-key-not-configured
```

3. **Save this file**
4. ⚠️ **NEVER commit this file to Git** (it should be in `.gitignore`)

---

## Part 8: Next Steps

### ☐ Step 19: Apply Database Permissions (CRITICAL)

**⚠️ REQUIRED BEFORE RUNNING THE APP**

After running migrations, you MUST apply GRANT permissions for RPC functions:

1. Open Supabase Studio → **SQL Editor**
2. Click **"New Query"**
3. **IMPORTANT:** Set the **Role** dropdown to `postgres` (NOT `authenticated`)
4. Copy and paste this script:

```sql
-- Grant schema usage to authenticated users
grant usage on schema public to authenticated;

-- Grant execute permissions on RPC functions
grant execute on function public.rpc_bootstrap_tenant_and_user(text, text) to authenticated;
grant execute on function public.rpc_get_my_tenant_context() to authenticated;

-- Verify grants were applied
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name LIKE 'rpc_%'
ORDER BY routine_name, grantee;
```

5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
6. Verify output shows:
   - `rpc_bootstrap_tenant_and_user | authenticated | EXECUTE`
   - `rpc_get_my_tenant_context | authenticated | EXECUTE`

**Why is this critical?**
- SQL functions don't automatically grant execute permissions to authenticated users
- Without these grants, users will get "permission denied" errors when signing up or logging in
- This MUST be done in Supabase Dashboard with postgres role - PowerShell/terminal cannot execute GRANT statements
- This is a PostgreSQL security feature that requires explicit configuration

**Troubleshooting:**
- If you see "permission denied" errors in your app, this step was likely skipped
- If the Role dropdown doesn't show `postgres`, you may need to use the service_role key
- See Step 2.1 in QUICK_START.md for more details

---

### ☐ Step 20: Ready for Database Migration

You're now ready to run your database migrations! The next steps are:

1. **Run migrations:**
   ```bash
   make db-migrate
   ```

2. **Run tests:**
   ```bash
   make test-db
   ```

3. **Deploy Edge Functions:**
   ```bash
   make deploy-functions
   ```

4. **Start the web app:**
   ```bash
   make dev-web
   ```

---

## Quick Reference Card

**Copy this section and keep it handy:**

```
PROJECT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project Name:    ot-continuum-production
Project URL:     https://xxxxxxxxxxxxx.supabase.co
Database Password: [saved in password manager]

CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin Email:     admin@yourcompany.com
Admin Password:  [saved in password manager]
Admin User ID:   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

API KEYS (in .env and Edge Function Secrets)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

---

## Troubleshooting

### Issue: "Can't find Project Settings"
**Solution:** Click the **gear icon** at the bottom of the left sidebar.

### Issue: "Edge Functions tab is missing"
**Solution:** Edge Functions might not be visible on Free tier in some regions. Upgrade to Pro tier or contact Supabase support.

### Issue: "Can't create user - Email not confirmed"
**Solution:** When creating a user manually, make sure to check **"Auto Confirm User"** checkbox.

### Issue: "Secrets page says 'No secrets yet'"
**Solution:** That's normal for a new project. Just start adding secrets with the "Add new secret" button.

### Issue: "Database password forgotten"
**Solution:** You can reset it in **Project Settings → Database → Database Password → Reset**.

---

## Security Reminders

1. ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code**
2. ⚠️ **Keep your `.env` file in `.gitignore`**
3. ⚠️ **Use different projects for development and production**
4. ✅ **Regularly rotate your service_role key** (every 90 days recommended)
5. ✅ **Enable MFA on your Supabase account** (Settings → Account)

---

## Success Criteria

You've completed this setup when:
- ✅ You have all 4 secrets configured in Edge Functions
- ✅ You can see your admin user in Authentication → Users
- ✅ You can run a simple SQL query successfully
- ✅ Your `.env` file is populated with all credentials
- ✅ You're ready to run `make db-migrate`

---

**🎉 Congratulations! Your Supabase project is configured and ready for deployment.**

Next step: Run the database migrations to create your multi-tenant schema with RLS policies.