# Authentication Quick Reference Guide

## 🚀 Quick Start

### Check if user is logged in

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Hello {user.email}!</div>;
}
```

### Protect a route

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Sign out a user

```tsx
import { useAuth } from './contexts/AuthContext';

function LogoutButton() {
  const { signOut } = useAuth();
  
  return (
    <button onClick={signOut}>
      Sign Out
    </button>
  );
}
```

## 📋 Common Tasks

### Get user email

```tsx
const { user } = useAuth();
const email = user?.email; // "user@example.com"
```

### Get user ID

```tsx
const { user } = useAuth();
const userId = user?.id; // "uuid-here"
```

### Get user metadata

```tsx
const { user } = useAuth();
const name = user?.user_metadata?.name; // "John Doe"
```

### Check loading state

```tsx
const { loading } = useAuth();

if (loading) {
  return <Spinner />;
}
```

### Make authenticated API call

```tsx
import { apiClient } from './lib/api-client';

// JWT is automatically included in headers
const response = await apiClient.getSites(tenantId);
```

## 🎨 UI Components

### Login Form Example

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/api-client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate('/');
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Signup Form Example

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/api-client';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    navigate('/login?signup=success');
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        minLength={8}
      />
      
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        required
        minLength={8}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### Loading Spinner Component

```tsx
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
```

## 🔧 Configuration

### Wrap app with providers

```tsx
// App.tsx
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Your routes here */}
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Set up routes

```tsx
import { Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { PasswordReset } from './pages/PasswordReset';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

<Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/password-reset" element={<PasswordReset />} />
  
  {/* Protected routes */}
  <Route path="/" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

## 🛠 Troubleshooting

### User not redirected after login

**Problem:** User stays on login page after successful login

**Solution:** Make sure you're using `useNavigate()` and calling `navigate('/')` after login

```tsx
const navigate = useNavigate();

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (data.session) {
  navigate('/'); // ← Add this
}
```

### "User not found" error

**Problem:** useAuth() throws error

**Solution:** Make sure AuthProvider wraps your component

```tsx
// ✅ Correct
<AuthProvider>
  <MyComponent />
</AuthProvider>

// ❌ Wrong
<MyComponent /> // No AuthProvider wrapper
```

### Session not persisting

**Problem:** User logged out on page refresh

**Solution:** 
1. Check localStorage is enabled in browser
2. Verify AuthProvider is at top level
3. Make sure only one Supabase client instance exists

### 401 errors on API calls

**Problem:** All API calls return 401 Unauthorized

**Solution:**
1. Check user is logged in: `const { user } = useAuth()`
2. Enable debug mode: `localStorage.setItem('DEBUG_API', 'true')`
3. Check console for JWT details
4. Verify Edge Function has JWT verification enabled

## 📚 API Reference

### AuthContext

```tsx
interface AuthContextType {
  user: User | null;          // Current user object or null
  session: Session | null;    // Current session object or null
  loading: boolean;           // True while checking auth state
  signOut: () => Promise<void>; // Sign out function
}
```

### User Object

```tsx
interface User {
  id: string;                 // User UUID
  email: string;              // User email
  user_metadata: {            // Custom metadata
    name?: string;
    [key: string]: any;
  };
  created_at: string;         // ISO timestamp
  // ... other fields
}
```

### Session Object

```tsx
interface Session {
  access_token: string;       // JWT token
  refresh_token: string;      // Refresh token
  expires_at: number;         // Unix timestamp
  user: User;                 // User object
}
```

## 🎯 Best Practices

### ✅ DO

- Use `useAuth()` hook to access auth state
- Wrap protected routes with `<ProtectedRoute>`
- Handle loading states properly
- Show user-friendly error messages
- Use `signOut()` from context, not directly from supabase
- Let API client handle JWT headers automatically

### ❌ DON'T

- Don't parse JWT tokens in frontend
- Don't store passwords anywhere
- Don't expose service role key in frontend
- Don't make auth decisions based on frontend state alone
- Don't create multiple Supabase client instances
- Don't manually add Authorization headers (API client does this)

## 🔍 Testing

### Test user is authenticated

```tsx
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';

test('shows user email when authenticated', async () => {
  render(
    <AuthProvider>
      <MyComponent />
    </AuthProvider>
  );
  
  await screen.findByText(/user@example.com/i);
});
```

### Test protected route redirects

```tsx
test('redirects to login when not authenticated', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
  
  expect(screen.getByTestId('login-page')).toBeInTheDocument();
});
```

## 📞 Support

### Debug Mode

Enable detailed logging:

```javascript
// In browser console
localStorage.setItem('DEBUG_API', 'true');
localStorage.setItem('DEBUG_JWT', 'true');
```

### Check Auth State

```javascript
// In browser console
const { data } = await window.supabase.auth.getSession();
console.log('Current user:', data.session?.user);
console.log('JWT token:', data.session?.access_token);
```

### Clear Session

```javascript
// In browser console
await window.supabase.auth.signOut();
localStorage.clear();
location.reload();
```

## 🔗 Related Files

- `/packages/web/src/contexts/AuthContext.tsx` - Auth state management
- `/packages/web/src/components/ProtectedRoute.tsx` - Route protection
- `/packages/web/src/pages/Login.tsx` - Login screen
- `/packages/web/src/pages/Signup.tsx` - Signup screen
- `/packages/web/src/pages/PasswordReset.tsx` - Password reset
- `/packages/web/src/lib/api-client.ts` - API client with JWT
- `/lib/supabase-client.ts` - Supabase singleton

## 📖 Documentation

- [Full Implementation Guide](./AUTH_IMPLEMENTATION.md)
- [Architecture Diagram](./AUTH_ARCHITECTURE_DIAGRAM.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
