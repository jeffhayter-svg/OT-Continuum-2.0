# Authentication Layer Implementation

## Overview

Complete authentication system for OT Continuum multi-tenant SaaS application using Supabase Auth.

## Architecture

### Authentication Flow

```
┌─────────────────┐
│  Unauthenticated│
│      User       │
└────────┬────────┘
         │
         ├──────► Login Screen ──────► Supabase Auth ──────┐
         │                                                  │
         └──────► Signup Screen ──────► Supabase Auth ─────┤
                                                            │
                  ┌─────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Session Token │
         │     (JWT)      │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │  AuthContext   │ ◄──── All components access auth state
         │   (Provider)   │       via useAuth() hook
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ ProtectedRoute │ ◄──── Guards app routes
         │   Component    │       Redirects if not authenticated
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │  Authenticated │
         │   App Shell    │
         └────────────────┘
```

## Components

### 1. **AuthContext** (`/packages/web/src/contexts/AuthContext.tsx`)

**Purpose:** Centralized authentication state management

**Features:**
- Single source of truth for user session
- Automatic session checking on mount
- Real-time auth state changes via Supabase listener
- Exposes `user`, `session`, `loading`, and `signOut()` to all components

**Usage:**
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, session, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Hello {user.email}</div>;
}
```

### 2. **ProtectedRoute** (`/packages/web/src/components/ProtectedRoute.tsx`)

**Purpose:** Route-level authentication guard

**Features:**
- Shows loading spinner while checking auth state
- Redirects to `/login` if user not authenticated
- Renders children if authenticated

**Usage:**
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Screens

### 1. **Login Screen** (`/packages/web/src/pages/Login.tsx`)

**Route:** `/login`

**Features:**
- Email + password authentication
- User-friendly error messages
- Loading state with spinner
- Link to signup page
- Link to password reset
- Professional industrial SaaS styling

**Test IDs:**
- `login-page` - Page wrapper
- `email-input` - Email field
- `password-input` - Password field
- `login-button` - Submit button
- `signup-link` - Link to signup
- `forgot-password-link` - Link to password reset
- `error-message` - Error display

### 2. **Signup Screen** (`/packages/web/src/pages/Signup.tsx`)

**Route:** `/signup`

**Features:**
- Full name, email, password, confirm password fields
- Password strength validation (min 8 chars)
- Password match validation
- User-friendly error messages
- Loading state with spinner
- Helper text about tenant assignment
- Link back to login

**Test IDs:**
- `signup-page` - Page wrapper
- `name-input` - Full name field
- `email-input` - Email field
- `password-input` - Password field
- `confirm-password-input` - Confirm password field
- `signup-button` - Submit button
- `login-link` - Link to login
- `error-message` - Error display

### 3. **Password Reset Screen** (`/packages/web/src/pages/PasswordReset.tsx`)

**Route:** `/password-reset`

**Features:**
- Email-based password reset
- Success confirmation message
- Link back to login
- Professional styling
- Reset link validity information

**Test IDs:**
- `password-reset-page` - Page wrapper
- `email-input` - Email field
- `reset-button` - Submit button
- `back-to-login-link` - Link to login
- `success-message` - Success display
- `error-message` - Error display

### 4. **Auth Loading State** (Built into ProtectedRoute)

**Purpose:** Displayed while checking Supabase session

**Features:**
- Centered spinner animation
- Professional loading message
- Prevents flash of wrong content

**Test ID:**
- `auth-loading` - Loading wrapper

## Routing Rules

### Public Routes (No Authentication Required)
- `/login` - Login page
- `/signup` - Signup page
- `/password-reset` - Password reset page

### Protected Routes (Authentication Required)
- `/` - Home dashboard
- `/sites` - Sites management
- `/assets` - Assets management
- `/signals/*` - Signal workflow screens
- `/risks` - Risk register
- `/work-items` - Execution tracking
- All other application routes

**Behavior:**
- Unauthenticated users accessing protected routes → Redirect to `/login`
- Authenticated users accessing public routes → Can view (no redirect)

## API Integration

### Headers Automatically Included

All API calls via `apiClient` automatically include:

```typescript
{
  'apikey': '<supabase_public_anon_key>',
  'Authorization': 'Bearer <user_jwt_from_session>',
  'Content-Type': 'application/json'
}
```

### Authentication Flow in API Client

1. User logs in → Supabase creates session with JWT
2. Session stored in browser (localStorage)
3. API client fetches session via `supabase.auth.getSession()`
4. JWT extracted from session and sent in Authorization header
5. Edge Functions validate JWT server-side
6. Tenant context inferred from JWT claims

### Error Handling

**401 Unauthorized:**
- API client detects 401 response
- Automatically signs out user
- Redirects to `/login`

**Session Expiration:**
- Supabase auto-refreshes tokens
- If refresh fails, user redirected to login

## Security Principles

### ✅ DO

- Store session in Supabase Auth (handles secure storage automatically)
- Send JWT in Authorization header
- Validate JWT server-side in Edge Functions
- Redirect to login on 401 errors
- Use HTTPS in production
- Enforce RLS policies in database

### ❌ DO NOT

- Store Supabase service role key in frontend
- Manually parse or validate JWTs in frontend
- Store passwords in any form
- Expose API keys in client code
- Make authorization decisions in frontend

## Styling Guidelines

### Design System

**Color Palette:**
- Primary: Blue (#2563eb)
- Background: Slate-50 (#f8fafc)
- Text: Slate-900 (#0f172a)
- Borders: Slate-200/300
- Success: Emerald
- Error: Red-50/800
- Warning: Yellow

**Typography:**
- Font: System default
- Headings: Default sizes from globals.css
- Body: Default (avoid font-size classes)

**Layout:**
- Max width: 28rem (max-w-md)
- Spacing: 2rem (space-y-8)
- Form spacing: 1.25rem (space-y-5)
- Padding: 2rem (p-8)

**Components:**
- Inputs: `border-slate-300 rounded-md px-4 py-2.5`
- Buttons: `bg-blue-600 text-white rounded-md py-2.5`
- Cards: `bg-white rounded-lg shadow-sm border-slate-200`

## Testing

### Playwright Test IDs

All interactive elements have `data-testid` attributes:

**Login:**
- `login-page`, `email-input`, `password-input`, `login-button`, `signup-link`, `forgot-password-link`

**Signup:**
- `signup-page`, `name-input`, `email-input`, `password-input`, `confirm-password-input`, `signup-button`, `login-link`

**Password Reset:**
- `password-reset-page`, `email-input`, `reset-button`, `back-to-login-link`, `success-message`

**Protected Routes:**
- `auth-loading` - Loading state

### Example Playwright Test

```typescript
test('login flow', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByTestId('email-input').fill('user@example.com');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-button').click();
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/');
});
```

## Environment Variables

**Frontend (Implicit - from `/utils/supabase/info.tsx`):**
- `projectId` - Supabase project ID
- `publicAnonKey` - Supabase public anon key

**Backend (Edge Functions - from Deno.env):**
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (NEVER expose to frontend)
- `JWT_SECRET` - JWT signing secret

## Common Patterns

### Check if User is Authenticated

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Checking auth...</div>;
  
  return user ? <div>Logged in</div> : <div>Not logged in</div>;
}
```

### Sign Out

```tsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  async function handleLogout() {
    await signOut();
    navigate('/login');
  }
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

### Get Current User Info

```tsx
import { useAuth } from '../contexts/AuthContext';

function UserProfile() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div>
      <p>Email: {user.email}</p>
      <p>User ID: {user.id}</p>
      <p>Name: {user.user_metadata?.name}</p>
    </div>
  );
}
```

## Troubleshooting

### User stuck at login after successful signup

**Cause:** Email confirmation may be required

**Solution:** 
1. Check Supabase dashboard → Authentication → Email Templates
2. Ensure "Confirm signup" is disabled for development
3. Or configure SMTP for email sending

### 401 errors on all API calls

**Cause:** JWT not being sent or invalid

**Solution:**
1. Check browser localStorage for `supabase.auth.token`
2. Enable debug mode: `localStorage.setItem('DEBUG_API', 'true')`
3. Check console for JWT details
4. Verify Edge Function has JWT verification enabled

### Infinite redirect loop

**Cause:** ProtectedRoute and auth state out of sync

**Solution:**
1. Clear localStorage
2. Sign out completely
3. Check AuthContext is wrapping entire app
4. Ensure only one Supabase client instance exists

### Session not persisting across page refreshes

**Cause:** Supabase session storage issue

**Solution:**
1. Check browser allows localStorage
2. Verify no error in console
3. Ensure AuthContext is at top level of component tree
4. Check Supabase client is singleton (one instance only)

## Future Enhancements

- [ ] Social auth (Google, GitHub, etc.)
- [ ] Magic link login (passwordless)
- [ ] Multi-factor authentication (MFA)
- [ ] Session timeout warnings
- [ ] Remember me functionality
- [ ] Account email change flow
- [ ] Account deletion flow
- [ ] Admin user management UI

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
