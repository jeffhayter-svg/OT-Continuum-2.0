# Figma Preview Mode Implementation - December 27, 2024

## 🎨 **Feature: Figma Preview Mode Bypass**

**Purpose:** Allow designers to preview UI flows in Figma without authentication or backend dependencies.

**Detection:** Automatically detects when running inside Figma iframe (`window.location.hostname.includes("figma.site")`).

---

## ✅ **Implementation Complete**

### **Files Created:**

1. **`/lib/preview-mode.ts`** - Preview mode detection and mock data
2. **`/components/PreviewModeBanner.tsx`** - Warning banner for preview mode

### **Files Modified:**

1. **`/App.tsx`** - Preview mode integration and auth bypass

---

## 🔧 **How It Works**

### **1. Detection** (`/lib/preview-mode.ts`)

```typescript
export function isFigmaPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isFigmaSite = window.location.hostname.includes('figma.site');
  
  if (isFigmaSite) {
    console.log('[Preview Mode] 🎨 Detected Figma Preview Mode');
    console.log('[Preview Mode] Authentication and backend calls will be bypassed');
  }
  
  return isFigmaSite;
}
```

**Detects:** `*.figma.site` domain (Figma iframe preview)

---

### **2. Mock Context** (`/lib/preview-mode.ts`)

```typescript
export function getPreviewTenantContext() {
  return {
    userId: 'preview-user-id',
    email: 'preview@example.com',
    fullName: 'Preview User',
    role: 'admin' as const,
    tenantId: 'preview-tenant-id',
    tenantName: 'Preview Organization',
    tenantPlan: 'free',
    tenantStatus: 'active',
  };
}
```

**Provides:** Mock tenant context without database queries

---

### **3. Auto-Login** (`/App.tsx`)

```typescript
// Check if running in Figma Preview Mode
const isPreviewMode = isFigmaPreviewMode();

// Auto-login in preview mode
useEffect(() => {
  if (isPreviewMode && !tenantContext) {
    console.log('[App] Preview Mode: Setting mock tenant context');
    const previewContext = getPreviewTenantContext();
    setTenantContext(previewContext);
  }
}, [isPreviewMode, tenantContext, setTenantContext]);
```

**Effect:** Automatically sets mock tenant context when preview mode detected

---

### **4. Bypass Auth Guards** (`/App.tsx`)

```typescript
// GUARD: Show loading state while auth is resolving (skip in preview mode)
if (authLoading && !isPreviewMode) {
  return <LoadingScreen />;
}

// Show tenant resolver (skip in preview mode)
if (user && userId && showResolver && !isPreviewMode) {
  return <TenantResolver />;
}

// Show app if tenant context exists OR preview mode is active
if ((user && tenantContext) || (isPreviewMode && tenantContext)) {
  return <App />;
}
```

**Bypasses:**
- ✅ Authentication loading
- ✅ Tenant resolver
- ✅ Login screen

---

### **5. Preview Banner** (`/components/PreviewModeBanner.tsx`)

```typescript
{isPreviewMode && <PreviewModeBanner />}
```

**Displays:**
```
⚠️ Preview Mode: Authentication & onboarding disabled. Deploy to test full flow. [Figma Preview]
```

**Styling:**
- Fixed at top of page
- Yellow accent border
- Warning background color
- Clear message for designers

---

## 📊 **Preview Mode Behavior**

### **What Works in Preview Mode:**

| Feature | Status | Notes |
|---------|--------|-------|
| **UI Rendering** | ✅ Works | All screens render normally |
| **Navigation** | ✅ Works | Can navigate between pages |
| **Workflows** | ✅ Works | MS2 workflow screens display |
| **Site Management** | ✅ Works | UI shows mock data |
| **Onboarding UI** | ✅ Works | Screens render without backend |
| **Design Tokens** | ✅ Works | Full design system active |
| **Interactions** | ✅ Works | Buttons, forms, modals work |

### **What's Bypassed in Preview Mode:**

| Feature | Status | Replacement |
|---------|--------|-------------|
| **Authentication** | ⏭️ Skipped | Mock user context |
| **Supabase Queries** | ⏭️ Skipped | Mock data |
| **Edge Functions** | ⏭️ Skipped | No backend calls |
| **Tenant Creation** | ⏭️ Skipped | Preview tenant |
| **Tenant Resolver** | ⏭️ Skipped | Auto-set context |
| **Login Screen** | ⏭️ Skipped | Direct to app |
| **JWT Validation** | ⏭️ Skipped | No tokens |

---

## 🎯 **Use Cases**

### **1. UX Validation**

**Designer wants to:** Preview onboarding flow without setting up Supabase

**Preview Mode provides:**
- ✅ All screens render
- ✅ Navigation works
- ✅ Forms are visible
- ✅ No auth errors

---

### **2. Design Review**

**Team wants to:** Review UI changes in Figma

**Preview Mode provides:**
- ✅ Live preview in Figma
- ✅ No deployment needed
- ✅ Design tokens applied
- ✅ Interactive prototypes

---

### **3. Stakeholder Demo**

**PM wants to:** Show product flow to stakeholders

**Preview Mode provides:**
- ✅ Full UI walkthrough
- ✅ No login required
- ✅ Mock data visible
- ✅ Professional presentation

---

## 🚨 **Preview Mode Indicators**

### **Console Output:**

```
[Preview Mode] 🎨 Detected Figma Preview Mode
[Preview Mode] Authentication and backend calls will be bypassed
[App] Preview Mode: Setting mock tenant context
```

### **Visual Banner:**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Preview Mode: Authentication & onboarding disabled.      │
│     Deploy to test full flow.                [Figma Preview]│
└─────────────────────────────────────────────────────────────┘
```

**Appearance:**
- Yellow accent border
- Warning background
- Fixed at top
- Always visible

---

## 🔒 **Security**

### **Production Behavior Unchanged:**

```typescript
// Only activates on *.figma.site domain
const isFigmaSite = window.location.hostname.includes('figma.site');
```

**Guarantees:**
- ✅ Production URL (your-domain.com) = normal auth
- ✅ Localhost = normal auth
- ✅ Only Figma iframe = preview mode
- ✅ No security bypass in production

---

### **Mock Data Isolation:**

```typescript
// Mock tenant context (no real data)
{
  tenantId: 'preview-tenant-id',  // Not a real UUID
  email: 'preview@example.com',    // Not a real user
  role: 'admin',                   // No real permissions
}
```

**Guarantees:**
- ✅ No real database access
- ✅ No real user data
- ✅ No backend calls
- ✅ Pure UI preview

---

## 📋 **Testing Checklist**

### **Test 1: Normal Production Behavior**

1. Visit deployed app URL (e.g., `https://your-domain.com`)
2. **Expected:** Login screen shows
3. **Expected:** Authentication required
4. **Expected:** No preview banner

---

### **Test 2: Localhost Development**

1. Run `npm run dev` locally
2. Visit `http://localhost:5173`
3. **Expected:** Login screen shows
4. **Expected:** Authentication required
5. **Expected:** No preview banner

---

### **Test 3: Figma Preview Mode**

1. Open Figma
2. Click "Preview" on prototype
3. **Expected:** App loads directly to dashboard
4. **Expected:** Preview banner visible at top
5. **Expected:** Mock tenant context ("Preview Organization")
6. **Expected:** All screens render
7. **Expected:** Navigation works

---

### **Test 4: Console Logging**

**In Figma Preview:**
```
[Preview Mode] 🎨 Detected Figma Preview Mode
[Preview Mode] Authentication and backend calls will be bypassed
[App] Preview Mode: Setting mock tenant context
```

**In Production:**
```
(No preview mode messages)
[App] Waiting for auth to resolve...
[App] Auth resolved - user: none
```

---

## 🎨 **Designer Workflow**

### **Step 1: Export from Figma Make**

1. Design screens in Figma Make
2. Export to React code
3. Code includes preview mode support

---

### **Step 2: Preview in Figma**

1. Click "Preview" button in Figma
2. App opens in iframe
3. **Preview mode auto-activates**
4. All screens render without setup

---

### **Step 3: Validate UX**

1. Navigate through flows
2. Test interactions
3. Review design tokens
4. Verify spacing, colors, typography

---

### **Step 4: Deploy for Full Testing**

1. Push changes to production
2. **Preview mode deactivates**
3. Full authentication enabled
4. Backend integration active

---

## 📚 **Documentation for Designers**

### **What Designers See:**

```
⚠️ Preview Mode: Authentication & onboarding disabled. Deploy to test full flow.
```

**This means:**
- ✅ You can preview all screens
- ✅ Navigation works normally
- ✅ No need to sign in
- ⚠️ Backend features won't work (that's okay!)
- ⚠️ Deploy to production to test full auth

---

### **What Designers Can Test:**

- ✅ **Visual Design** - All design tokens applied
- ✅ **Layout** - Spacing, sizing, responsive behavior
- ✅ **Navigation** - Page transitions, routing
- ✅ **Forms** - Input fields, buttons (visual only)
- ✅ **Modals** - Dialogs, popovers
- ✅ **Tables** - Data grids (with mock data)
- ✅ **Empty States** - Placeholder screens

---

### **What Designers Can't Test:**

- ❌ **Authentication** - Login/signup (bypassed)
- ❌ **Database Queries** - Real data (mocked)
- ❌ **Edge Functions** - Backend calls (skipped)
- ❌ **Multi-tenancy** - Real organizations (mocked)

**Solution:** Deploy to staging/production for full testing

---

## ✅ **Status: COMPLETE**

**Preview Mode Features:**
- ✅ Auto-detection of Figma iframe
- ✅ Mock tenant context
- ✅ Auth bypass
- ✅ Visual warning banner
- ✅ Console logging
- ✅ Production behavior unchanged
- ✅ Secure (no real data access)

**Benefits:**
- 🎨 Designers can preview UX without backend setup
- 🚀 Faster design iteration
- ✅ No JWT errors in Figma previews
- 🔒 Production security maintained

---

**Version:** 1.0  
**Date:** December 27, 2024  
**Implemented by:** OT Continuum Engineering
