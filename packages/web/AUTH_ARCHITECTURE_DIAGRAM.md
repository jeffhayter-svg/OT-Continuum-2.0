# OT Continuum Authentication Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER / FRONTEND                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        React Application                             │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  AuthProvider (Context)                                       │  │   │
│  │  │  - user: User | null                                          │  │   │
│  │  │  - session: Session | null                                    │  │   │
│  │  │  - loading: boolean                                           │  │   │
│  │  │  - signOut(): Promise<void>                                   │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                               │                                      │   │
│  │                               ▼                                      │   │
│  │  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │  Public Routes   │  │ Protected Routes│  │  Supabase       │   │   │
│  │  │  - /login        │  │ - /            │  │  Client         │   │   │
│  │  │  - /signup       │  │ - /sites       │  │  (Singleton)    │   │   │
│  │  │  - /password-    │  │ - /assets      │  │                 │   │   │
│  │  │    reset         │  │ - /signals/*   │  │  - auth         │   │   │
│  │  └──────────────────┘  │ - /risks       │  │  - getSession() │   │   │
│  │                         │ - /work-items  │  │  - signIn()     │   │   │
│  │                         └─────────────────┘  │  - signUp()     │   │   │
│  │                                 │             │  - signOut()    │   │   │
│  │                                 ▼             └─────────────────┘   │   │
│  │                    ┌──────────────────────┐                         │   │
│  │                    │  ProtectedRoute      │                         │   │
│  │                    │  - Check auth state  │                         │   │
│  │                    │  - Redirect if not   │                         │   │
│  │                    │    authenticated     │                         │   │
│  │                    └──────────────────────┘                         │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │  API Client                                                         │    │
│  │  - Adds Authorization: Bearer <JWT> to all requests                │    │
│  │  - Adds apikey: <anon_key> to all requests                         │    │
│  │  - Auto-redirects on 401 errors                                    │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
                    ┌────────────▼─────────────┐
                    │                          │
                    │   SUPABASE PLATFORM      │
                    │                          │
                    └──────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │              │ │              │ │              │
        │  Auth        │ │  Edge        │ │  PostgreSQL  │
        │  Service     │ │  Functions   │ │  Database    │
        │              │ │              │ │              │
        │  - signUp    │ │  - Signals   │ │  - tenants   │
        │  - signIn    │ │  - Sites     │ │  - sites     │
        │  - getUser   │ │  - Assets    │ │  - assets    │
        │  - refresh   │ │  - Risks     │ │  - risks     │
        │  JWT tokens  │ │  - Work      │ │  + RLS       │
        │              │ │    Items     │ │    policies  │
        │              │ │              │ │              │
        └──────────────┘ └──────────────┘ └──────────────┘
                │                │
                │                ├─── JWT Validation
                │                │    (server-side)
                │                │
                └────────────────┴─── Tenant context from
                                      JWT claims
```

## Authentication Flow Detail

### 1. Login Flow

```
User                Browser              Supabase Auth        Edge Function
 │                     │                      │                     │
 │  Enter email/pwd    │                      │                     │
 ├────────────────────►│                      │                     │
 │                     │                      │                     │
 │                     │  signInWithPassword  │                     │
 │                     ├─────────────────────►│                     │
 │                     │                      │                     │
 │                     │  ◄── JWT + Session ──┤                     │
 │                     │                      │                     │
 │                     │  Store in localStorage                     │
 │                     │                      │                     │
 │                     │  Update AuthContext  │                     │
 │                     │  (user, session)     │                     │
 │                     │                      │                     │
 │  ◄── Redirect to /  ┤                      │                     │
 │                     │                      │                     │
 │                     │  Fetch data with JWT │                     │
 │                     ├──────────────────────┼────────────────────►│
 │                     │                      │   Verify JWT        │
 │                     │                      │◄────────────────────┤
 │                     │                      │                     │
 │                     │  ◄────────────────── Data ─────────────────┤
 │  ◄── Show data ─────┤                      │                     │
 │                     │                      │                     │
```

### 2. Signup Flow

```
User                Browser              Supabase Auth        Database
 │                     │                      │                  │
 │  Enter details      │                      │                  │
 ├────────────────────►│                      │                  │
 │                     │                      │                  │
 │                     │  signUp()            │                  │
 │                     ├─────────────────────►│                  │
 │                     │                      │                  │
 │                     │                      │  Create user     │
 │                     │                      ├─────────────────►│
 │                     │                      │                  │
 │                     │  ◄── User created ───┤                  │
 │                     │                      │                  │
 │  ◄── Redirect login ┤                      │                  │
 │                     │                      │                  │
```

### 3. Protected Route Access Flow

```
User              Browser            AuthContext         ProtectedRoute
 │                   │                    │                    │
 │  Navigate to /    │                    │                    │
 ├──────────────────►│                    │                    │
 │                   │                    │                    │
 │                   │  Check auth state  │                    │
 │                   ├───────────────────►│                    │
 │                   │                    │                    │
 │                   │  loading = true    │                    │
 │                   ├────────────────────┼───────────────────►│
 │                   │                    │   Show spinner     │
 │                   │                    │                    │
 │                   │  ◄── user exists ──┤                    │
 │                   ├────────────────────┼───────────────────►│
 │                   │                    │   Render children  │
 │  ◄── Show page ───┤                    │                    │
 │                   │                    │                    │
```

### 4. Unauthenticated Access Flow

```
User              Browser            AuthContext         ProtectedRoute
 │                   │                    │                    │
 │  Navigate to /    │                    │                    │
 ├──────────────────►│                    │                    │
 │                   │                    │                    │
 │                   │  Check auth state  │                    │
 │                   ├───────────────────►│                    │
 │                   │                    │                    │
 │                   │  user = null       │                    │
 │                   ├────────────────────┼───────────────────►│
 │                   │                    │  <Navigate to      │
 │                   │                    │   "/login" />      │
 │                   │                    │                    │
 │  ◄── Redirect ────┤                    │                    │
 │     to /login     │                    │                    │
 │                   │                    │                    │
```

## Component Hierarchy

```
App.tsx
│
├─── BrowserRouter
     │
     ├─── TenantProvider
     │    │
     │    └─── AuthProvider ◄── Manages auth state for entire app
     │         │
     │         └─── Routes
     │              │
     │              ├─── Public Routes
     │              │    ├─── /login → <Login />
     │              │    ├─── /signup → <Signup />
     │              │    └─── /password-reset → <PasswordReset />
     │              │
     │              └─── Protected Routes
     │                   ├─── / → <ProtectedRoute><Home /></ProtectedRoute>
     │                   ├─── /sites → <ProtectedRoute><Sites /></ProtectedRoute>
     │                   ├─── /assets → <ProtectedRoute><Assets /></ProtectedRoute>
     │                   ├─── /signals/* → <ProtectedRoute>...</ProtectedRoute>
     │                   ├─── /risks → <ProtectedRoute>...</ProtectedRoute>
     │                   └─── /work-items → <ProtectedRoute>...</ProtectedRoute>
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Auth State                           │
│  (localStorage: supabase.auth.token)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ onAuthStateChange listener
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AuthContext State                           │
│  - user: User | null                                             │
│  - session: Session | null                                       │
│  - loading: boolean                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ useAuth() hook
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Navigation  │ │ Protected   │ │   Pages     │
    │ Component   │ │   Route     │ │             │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## JWT Token Structure

```
Header
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload
{
  "sub": "user-uuid-here",           // User ID
  "email": "user@example.com",        // User email
  "role": "authenticated",            // Auth role
  "aud": "authenticated",             // Audience
  "iss": "https://<project>.supabase.co/auth/v1", // Issuer
  "iat": 1234567890,                  // Issued at
  "exp": 1234571490,                  // Expires at (1 hour)
  "user_metadata": {
    "name": "John Doe"                // Custom metadata
  }
}

Signature
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│  Layer 1: Frontend Route Protection                            │
│  - ProtectedRoute component checks auth state                  │
│  - Redirects unauthenticated users to login                    │
│  - Prevents rendering of protected content                     │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│  Layer 2: API Client Authentication                            │
│  - Automatically includes JWT in Authorization header          │
│  - Automatically includes anon key in apikey header            │
│  - Auto-redirects on 401 Unauthorized responses                │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│  Layer 3: Edge Function JWT Validation                         │
│  - Validates JWT signature using JWT_SECRET                    │
│  - Checks token expiration                                     │
│  - Extracts user ID from JWT claims                            │
│  - Returns 401 if validation fails                             │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│  Layer 4: Tenant Membership Validation                         │
│  - Queries tenant_members table                                │
│  - Verifies user belongs to requested tenant                   │
│  - Returns 403 Forbidden if not a member                       │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│  Layer 5: Row-Level Security (RLS) Policies                    │
│  - PostgreSQL enforces tenant scoping                          │
│  - Users can only access data for their tenant(s)             │
│  - Applied automatically to all queries                        │
└────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
API Request Error
       │
       ├─── 401 Unauthorized
       │    └─── JWT invalid/expired
       │         ├─── Clear session
       │         ├─── signOut()
       │         └─── Redirect to /login
       │
       ├─── 403 Forbidden
       │    └─── Not tenant member
       │         └─── Show error message
       │
       ├─── 500 Server Error
       │    └─── Show error message
       │         └─── Log to console
       │
       └─── Network Error
            └─── Show offline message
                 └─── Retry logic
```

## Session Lifecycle

```
┌─────────────────┐
│   User visits   │
│   application   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No      ┌─────────────────┐
│ Check existing  ├────────────►│  Show Login     │
│    session      │             │     Screen      │
└────────┬────────┘             └────────┬────────┘
         │ Yes                           │
         │                               │ Sign In
         │                               │
         │                               ▼
         │                    ┌─────────────────┐
         │                    │  Create Session │
         │                    │   Store JWT     │
         │                    └────────┬────────┘
         │                             │
         │◄────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Access protected│
│     routes      │
└────────┬────────┘
         │
         │ Each API call
         │
         ▼
┌─────────────────┐     Expired  ┌─────────────────┐
│   Verify JWT    ├─────────────►│  Auto-refresh   │
│   expiration    │              │      JWT        │
└────────┬────────┘              └────────┬────────┘
         │ Valid                          │
         │◄───────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Make API call  │
│  with fresh JWT │
└────────┬────────┘
         │
         │ User logs out
         │
         ▼
┌─────────────────┐
│  Clear session  │
│  Redirect login │
└─────────────────┘
```
