# RBAC Quick Reference Guide

## Using Role-Based Access Control in OT Continuum

This guide shows you how to implement role-based access control (RBAC) in your React components using the OT Continuum auth system.

---

## 📚 Available Roles

```typescript
type Role = 'admin' | 'owner' | 'manager' | 'engineer' | 'viewer';
```

**Role Hierarchy** (typical permissions):
- `admin` / `owner` - Full access (tenant settings, user management, billing)
- `manager` - Can manage workflows, assign tasks, approve decisions
- `engineer` - Can create/edit risks, mitigations, execute workflows
- `viewer` - Read-only access

---

## 🎯 Getting Tenant Context

### In React Components:
```typescript
import { useTenantContext } from './contexts/TenantContext';

function MyComponent() {
  const { user, tenantContext } = useTenantContext();
  
  if (!tenantContext) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <p>Organization: {tenantContext.tenantName}</p>
      <p>Your role: {tenantContext.role}</p>
    </div>
  );
}
```

### Available Properties:
```typescript
tenantContext = {
  userId: string;           // Supabase auth.users.id
  email: string;            // User's email
  fullName: string | null;  // Display name
  role: Role;               // User's role
  tenantId: string;         // Organization UUID
  tenantName: string;       // Organization name
  tenantPlan: string;       // Subscription plan (starter, pro, enterprise)
  tenantStatus: string;     // active, inactive, suspended
}
```

---

## 🔒 Protecting Entire Pages

Use `RequireRole` to wrap entire page components:

```typescript
import { RequireRole } from './components/RequireRole';

function AdminPanel() {
  return (
    <RequireRole allowedRoles={['admin', 'owner']}>
      <div>
        <h1>Admin Panel</h1>
        <p>Only admins and owners can see this.</p>
      </div>
    </RequireRole>
  );
}
```

### With Redirect:
```typescript
<RequireRole 
  allowedRoles={['admin']} 
  redirectToDashboard={true}
>
  <AdminSettings />
</RequireRole>
```
If user doesn't have permission, they're redirected to `/`.

### With Custom Fallback:
```typescript
<RequireRole 
  allowedRoles={['admin', 'manager']}
  fallback={<div>You need manager or admin access</div>}
>
  <TeamManagement />
</RequireRole>
```

---

## 👁️ Conditional Rendering (UI Elements)

Use `RoleGuard` to show/hide UI elements:

```typescript
import { RoleGuard } from './components/RequireRole';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show button only to admins */}
      <RoleGuard allowedRoles={['admin', 'owner']}>
        <button>Invite Team Members</button>
      </RoleGuard>
      
      {/* Show section only to managers and above */}
      <RoleGuard allowedRoles={['admin', 'owner', 'manager']}>
        <section>
          <h2>Approval Queue</h2>
          <ApprovalList />
        </section>
      </RoleGuard>
      
      {/* Everyone can see this */}
      <section>
        <h2>Recent Risks</h2>
        <RiskList />
      </section>
    </div>
  );
}
```

---

## 🪝 Programmatic Role Checks

Use `useHasRole` hook for conditional logic:

```typescript
import { useHasRole } from './components/RequireRole';

function RiskRegister() {
  const canEdit = useHasRole(['admin', 'manager', 'engineer']);
  const canDelete = useHasRole(['admin', 'owner']);
  
  return (
    <div>
      <h1>Risk Register</h1>
      <RiskList 
        readOnly={!canEdit}
        showDeleteButton={canDelete}
      />
      {canEdit && <button>Add New Risk</button>}
    </div>
  );
}
```

---

## 🎨 Role-Based Styling

### Dynamic Classes:
```typescript
import { useTenantContext } from './contexts/TenantContext';

function UserBadge() {
  const { tenantContext } = useTenantContext();
  
  const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-300',
    owner: 'bg-red-100 text-red-800 border-red-300',
    manager: 'bg-orange-100 text-orange-800 border-orange-300',
    engineer: 'bg-blue-100 text-blue-800 border-blue-300',
    viewer: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  
  return (
    <span className={`px-2 py-1 rounded border ${roleColors[tenantContext.role]}`}>
      {tenantContext.role.toUpperCase()}
    </span>
  );
}
```

---

## 🚫 Handling Unauthorized Access

### Default Behavior:
If a user without permission tries to access a `RequireRole` protected component, they see:

```
┌─────────────────────────────────────┐
│  ❌ Access Denied                   │
│                                      │
│  You don't have permission to       │
│  access this page.                  │
│                                      │
│  Required role: admin or owner      │
│  Your role: engineer                │
│                                      │
│  [Go to Dashboard]                  │
└─────────────────────────────────────┘
```

### Custom Unauthorized Screen:
```typescript
<RequireRole 
  allowedRoles={['admin']}
  fallback={
    <div className="p-8 text-center">
      <h2>Premium Feature</h2>
      <p>This feature is available for admin users only.</p>
      <p>Contact your organization admin to request access.</p>
    </div>
  }
>
  <PremiumFeature />
</RequireRole>
```

---

## 🛣️ Role-Based Navigation

### Example: Hiding Menu Items:
```typescript
import { RoleGuard } from './components/RequireRole';

function Navigation() {
  return (
    <nav>
      <a href="/">Dashboard</a>
      <a href="/risks">Risk Register</a>
      
      <RoleGuard allowedRoles={['admin', 'manager']}>
        <a href="/approvals">Approvals</a>
      </RoleGuard>
      
      <RoleGuard allowedRoles={['admin', 'owner']}>
        <a href="/settings">Settings</a>
        <a href="/billing">Billing</a>
      </RoleGuard>
    </nav>
  );
}
```

---

## 🔐 Backend Integration

### RPC Calls Already Respect Roles:
The backend RPC functions automatically enforce tenant scoping and RLS policies:

```typescript
// This is secure - RLS ensures user only sees their tenant's data
const { data: risks } = await supabase
  .from('risk_register')
  .select('*');
  
// The RPC functions validate auth.uid() and tenant_id server-side
const { data: context } = await supabase
  .rpc('rpc_get_my_tenant_context');
```

You don't need to pass `tenant_id` - it's automatically scoped by the user's session.

---

## 📋 Common Patterns

### Pattern 1: Admin Settings Page
```typescript
function SettingsPage() {
  return (
    <RequireRole allowedRoles={['admin', 'owner']} redirectToDashboard>
      <div>
        <h1>Organization Settings</h1>
        <OrgNameForm />
        <TeamMembersTable />
        <BillingInfo />
      </div>
    </RequireRole>
  );
}
```

### Pattern 2: Conditional Form Fields
```typescript
function RiskForm() {
  const isAdmin = useHasRole(['admin', 'owner']);
  
  return (
    <form>
      <input name="title" required />
      <textarea name="description" required />
      <select name="severity" required>...</select>
      
      {isAdmin && (
        <select name="assigned_to">
          <option>Assign to team member...</option>
        </select>
      )}
      
      <button type="submit">
        {isAdmin ? 'Create & Assign Risk' : 'Create Risk'}
      </button>
    </form>
  );
}
```

### Pattern 3: Read-Only Mode for Viewers
```typescript
function DataTable({ data }) {
  const canEdit = useHasRole(['admin', 'manager', 'engineer']);
  
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          {canEdit && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.status}</td>
            {canEdit && (
              <td>
                <button>Edit</button>
                <RoleGuard allowedRoles={['admin']}>
                  <button>Delete</button>
                </RoleGuard>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 🐛 Debugging Role Issues

### Check Current Role:
Open the **Auth Debug Panel** (purple bug icon in bottom-right on localhost):
- Shows current role with color-coded badge
- Shows full tenant context
- Copy tenant ID and user ID for database queries

### Verify in Database:
```sql
-- Check user's role in database
SELECT 
  id,
  email,
  full_name,
  role,
  tenant_id
FROM users
WHERE id = '<user-id-from-debug-panel>';

-- Check tenant info
SELECT 
  id,
  name,
  plan,
  status
FROM tenants
WHERE id = '<tenant-id-from-debug-panel>';
```

### Console Logging:
```typescript
import { useTenantContext } from './contexts/TenantContext';

function MyComponent() {
  const { tenantContext } = useTenantContext();
  
  console.log('[MyComponent] Role check:', tenantContext?.role);
  console.log('[MyComponent] Full context:', tenantContext);
  
  // ... rest of component
}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Trust client-side role checks for security
```typescript
// This only hides UI - users can still bypass with dev tools
const isAdmin = tenantContext.role === 'admin';
if (isAdmin) {
  // Show admin panel
}
```

### ✅ DO: Use RLS policies on backend
```sql
-- Backend RLS policy ensures security
CREATE POLICY "admins_can_delete_risks"
ON risk_register FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.tenant_id = risk_register.tenant_id
    AND users.role IN ('admin', 'owner')
  )
);
```

### ❌ DON'T: Hard-code tenant IDs
```typescript
// Don't do this
const { data } = await supabase
  .from('risks')
  .eq('tenant_id', 'abc-123-xyz');
```

### ✅ DO: Let RLS handle tenant scoping
```typescript
// RLS automatically filters by current user's tenant
const { data } = await supabase
  .from('risks')
  .select('*');
```

---

## 📖 Reference Links

- **Full Implementation**: [/STEP4_COMPLETE_SUMMARY.md](/STEP4_COMPLETE_SUMMARY.md)
- **Tenant Context**: [/contexts/TenantContext.tsx](/contexts/TenantContext.tsx)
- **RBAC Components**: [/components/RequireRole.tsx](/components/RequireRole.tsx)
- **Setup Guide**: [/QUICK_START.md](/QUICK_START.md)
- **Troubleshooting**: [/TROUBLESHOOTING.md](/TROUBLESHOOTING.md)

---

## 💡 Pro Tips

1. **Always check for null context**: Components may render before tenant context is loaded
2. **Use RoleGuard for UI, RequireRole for pages**: Better UX and clearer intent
3. **Test with multiple roles**: Create test accounts with different roles
4. **Backend is source of truth**: Client-side RBAC is UX, not security
5. **Use AuthDebugPanel**: Saves time debugging auth/tenant issues

---

**Last Updated**: Step 4 Complete
**Status**: ✅ Production-Ready
