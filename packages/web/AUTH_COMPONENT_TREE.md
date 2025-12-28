# Authentication Component Tree

## Complete Component Hierarchy

```
/packages/web/src/App.tsx
│
└─── <BrowserRouter>
     │
     └─── <TenantProvider>
          │
          └─── <AuthProvider>  ◄─── Authentication Context (user, session, loading, signOut)
               │
               └─── <div className="app-container">
                    │
                    └─── <Routes>
                         │
                         ├─── PUBLIC ROUTES (No Auth Required)
                         │    │
                         │    ├─── <Route path="/login">
                         │    │    └─── <Login />
                         │    │         ├─── Email input
                         │    │         ├─── Password input
                         │    │         ├─── "Forgot password?" link → /password-reset
                         │    │         ├─── "Sign In" button → supabase.auth.signInWithPassword()
                         │    │         └─── "Create Account" link → /signup
                         │    │
                         │    ├─── <Route path="/signup">
                         │    │    └─── <Signup />
                         │    │         ├─── Full name input
                         │    │         ├─── Email input
                         │    │         ├─── Password input
                         │    │         ├─── Confirm password input
                         │    │         ├─── "Create Account" button → supabase.auth.signUp()
                         │    │         └─── "Sign in" link → /login
                         │    │
                         │    └─── <Route path="/password-reset">
                         │         └─── <PasswordReset />
                         │              ├─── Email input
                         │              ├─── "Send Reset Link" button → supabase.auth.resetPasswordForEmail()
                         │              ├─── Success message
                         │              └─── "Back to Login" link → /login
                         │
                         └─── PROTECTED ROUTES (Auth Required)
                              │
                              │   All wrapped with <ProtectedRoute>
                              │   ├─── Check useAuth().loading
                              │   │    └─── if loading → Show spinner
                              │   │
                              │   └─── Check useAuth().user
                              │        ├─── if no user → <Navigate to="/login" />
                              │        └─── if user exists → Render children
                              │
                              ├─── <Route path="/">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         │    ├─── Logo → "OT Continuum"
                              │         │    ├─── Nav links (Sites, Assets, Signals, etc.)
                              │         │    ├─── Tenant selector (if multiple tenants)
                              │         │    ├─── User email display
                              │         │    └─── Logout button → signOut()
                              │         │
                              │         └─── <Home />
                              │              └─── Dashboard with workflow cards
                              │
                              ├─── <Route path="/sites">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <Sites />
                              │              ├─── Site list (tenant-scoped)
                              │              └─── Create site form
                              │
                              ├─── <Route path="/assets">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <Assets />
                              │              ├─── Asset list (tenant + site scoped)
                              │              └─── Create asset form
                              │
                              ├─── <Route path="/signals/ingestion">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <SignalIngestion />
                              │
                              ├─── <Route path="/signals/classification">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <SignalClassification />
                              │
                              ├─── <Route path="/signals/correlation">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <SignalCorrelation />
                              │
                              ├─── <Route path="/risks">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <RiskRegister />
                              │
                              ├─── <Route path="/risks/:id">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <RiskDecision />
                              │
                              ├─── <Route path="/risks/:id/adjust">
                              │    └─── <ProtectedRoute>
                              │         ├─── <Navigation />
                              │         └─── <RiskAdjustment />
                              │
                              └─── <Route path="/work-items">
                                   └─── <ProtectedRoute>
                                        ├─── <Navigation />
                                        └─── <ExecutionTracking />
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase Auth Service                                               │
│  (Session stored in localStorage)                                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ onAuthStateChange listener
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AuthContext                                                         │
│  /packages/web/src/contexts/AuthContext.tsx                         │
│                                                                      │
│  State:                                                              │
│  - user: User | null                                                 │
│  - session: Session | null                                           │
│  - loading: boolean                                                  │
│                                                                      │
│  Methods:                                                            │
│  - signOut(): Promise<void>                                          │
│                                                                      │
│  Lifecycle:                                                          │
│  1. useEffect on mount → getSession()                               │
│  2. Subscribe to auth changes → onAuthStateChange()                 │
│  3. Update state when session changes                               │
│  4. Cleanup subscription on unmount                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ useAuth() hook
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌───────────────┐   ┌──────────────┐
│  Login.tsx   │   │ ProtectedRoute│   │ Navigation   │
│              │   │               │   │              │
│  - Check if  │   │ 1. Get auth   │   │ - Display    │
│    already   │   │    state      │   │   user email │
│    logged in │   │ 2. If loading │   │ - Tenant     │
│  - If yes,   │   │    → spinner  │   │   selector   │
│    redirect  │   │ 3. If no user │   │ - Logout btn │
│              │   │    → redirect │   │              │
│              │   │ 4. If user    │   │              │
│              │   │    → render   │   │              │
└──────────────┘   └───────────────┘   └──────────────┘
```

## Authentication State Flow

```
┌──────────────┐
│ Page Loads   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ AuthProvider mounts     │
│ - loading = true        │
│ - user = null           │
│ - session = null        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐      ┌──────────────────────┐
│ supabase.auth          │      │  ProtectedRoute      │
│  .getSession()          │◄─────┤   sees loading=true  │
└──────┬──────────────────┘      │   → Shows spinner    │
       │                         └──────────────────────┘
       │
       ├─── No session found
       │    │
       │    ▼
       │    ┌─────────────────────────┐
       │    │ - loading = false       │
       │    │ - user = null           │
       │    │ - session = null        │
       │    └──────┬──────────────────┘
       │           │
       │           ▼
       │    ┌─────────────────────────┐
       │    │ ProtectedRoute          │
       │    │  sees user=null         │
       │    │  → <Navigate to="/login"│
       │    └─────────────────────────┘
       │
       └─── Session exists
            │
            ▼
            ┌─────────────────────────┐
            │ - loading = false       │
            │ - user = {...}          │
            │ - session = {...}       │
            └──────┬──────────────────┘
                   │
                   ▼
            ┌─────────────────────────┐
            │ ProtectedRoute          │
            │  sees user exists       │
            │  → Render children      │
            └─────────────────────────┘
```

## User Action Flows

### Login Flow

```
User clicks "Sign In" button
         │
         ▼
Login.tsx: handleLogin()
         │
         ├─── setLoading(true)
         │
         ├─── supabase.auth.signInWithPassword({ email, password })
         │
         ├─── Error?
         │    ├─── Yes → setError(message) → Show error banner
         │    └─── No → Continue
         │
         ├─── Success → data.session exists
         │
         ├─── navigate('/')
         │
         ▼
AuthContext receives auth change event
         │
         ├─── onAuthStateChange fires
         │
         ├─── setUser(session.user)
         │
         ├─── setSession(session)
         │
         ▼
All components using useAuth() get updated user
         │
         ├─── Navigation shows user email
         ├─── ProtectedRoute allows access
         └─── API calls include JWT
```

### Logout Flow

```
User clicks "Logout" button
         │
         ▼
Navigation: handleLogout()
         │
         ├─── supabase.auth.signOut()
         │
         ├─── navigate('/login')
         │
         ▼
AuthContext receives auth change event
         │
         ├─── onAuthStateChange fires
         │
         ├─── setUser(null)
         │
         ├─── setSession(null)
         │
         ▼
All components using useAuth() get updated
         │
         ├─── Navigation hides user info
         ├─── ProtectedRoute redirects to login
         └─── API calls fail (no JWT)
```

### Protected Route Access

```
User navigates to /sites
         │
         ▼
Router matches route
         │
         ▼
<ProtectedRoute> component renders
         │
         ├─── const { user, loading } = useAuth()
         │
         ├─── if (loading)
         │    └─── return <LoadingSpinner />
         │
         ├─── if (!user)
         │    └─── return <Navigate to="/login" replace />
         │
         └─── return <>{children}</>
              │
              ▼
         <Navigation /> renders
         <Sites /> renders
```

## File Dependencies

```
/packages/web/src/App.tsx
  │
  ├─── imports AuthProvider from './contexts/AuthContext'
  ├─── imports ProtectedRoute from './components/ProtectedRoute'
  ├─── imports TenantProvider from './contexts/TenantContext'
  │
  └─── wraps app:
       <BrowserRouter>
         <TenantProvider>
           <AuthProvider>
             <Routes>...</Routes>
           </AuthProvider>
         </TenantProvider>
       </BrowserRouter>

/packages/web/src/contexts/AuthContext.tsx
  │
  ├─── imports { supabase } from '../../../../lib/supabase-client'
  ├─── imports { User, Session } from '@supabase/supabase-js'
  │
  └─── exports:
       - AuthProvider component
       - useAuth hook
       - AuthContextType interface

/packages/web/src/components/ProtectedRoute.tsx
  │
  ├─── imports { useAuth } from '../contexts/AuthContext'
  ├─── imports { Navigate } from 'react-router-dom'
  │
  └─── exports:
       - ProtectedRoute component

/packages/web/src/pages/Login.tsx
  │
  ├─── imports { supabase } from '../lib/api-client'
  ├─── imports { useNavigate } from 'react-router-dom'
  │
  └─── exports:
       - Login component

/packages/web/src/pages/Signup.tsx
  │
  ├─── imports { supabase } from '../lib/api-client'
  ├─── imports { useNavigate } from 'react-router-dom'
  │
  └─── exports:
       - Signup component

/packages/web/src/pages/PasswordReset.tsx
  │
  ├─── imports { supabase } from '../lib/api-client'
  │
  └─── exports:
       - PasswordReset component

/packages/web/src/lib/api-client.ts
  │
  ├─── imports { supabase } from '../../../../lib/supabase-client'
  ├─── imports { projectId, publicAnonKey } from '../../../../utils/supabase/info'
  │
  └─── exports:
       - supabase (re-export)
       - apiClient
       - Types (Tenant, Site, Asset, etc.)

/lib/supabase-client.ts
  │
  ├─── imports { createClient } from '@supabase/supabase-js'
  ├─── imports { projectId, publicAnonKey } from '../utils/supabase/info'
  │
  └─── exports:
       - supabase (singleton instance)
       - getSupabaseClient()

/utils/supabase/info.tsx
  │
  └─── exports:
       - projectId: string
       - publicAnonKey: string
```

## Component Responsibilities

| Component | Responsibility | Depends On |
|-----------|----------------|------------|
| **AuthProvider** | Manage global auth state | Supabase client |
| **ProtectedRoute** | Guard routes requiring auth | AuthContext (useAuth) |
| **Login** | Email/password login UI | Supabase client, Router |
| **Signup** | User registration UI | Supabase client, Router |
| **PasswordReset** | Password reset UI | Supabase client |
| **Navigation** | App nav bar with logout | AuthContext, TenantContext |
| **Supabase Client** | Single Supabase instance | Supabase info (project ID, key) |
| **API Client** | Make authenticated API calls | Supabase client (for JWT) |

## Props & Context Types

### AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

### ProtectedRoute Props

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

### User Type (from Supabase)

```typescript
interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    [key: string]: any;
  };
  created_at: string;
}
```

### Session Type (from Supabase)

```typescript
interface Session {
  access_token: string;  // JWT
  refresh_token: string;
  expires_at: number;
  user: User;
}
```

---

This component tree provides a complete visual reference for understanding how all authentication pieces fit together in the OT Continuum application.
