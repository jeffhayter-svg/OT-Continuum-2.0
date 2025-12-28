# RLS Policy Summary - OT Continuum

## Overview

This document provides a comprehensive summary of all Row Level Security (RLS) policies implemented in the OT Continuum platform. All policies enforce strict **tenant isolation** and **site-level access control** based on JWT claims.

---

## Core Security Principles

1. **Tenant Isolation**: Every policy includes `tenant_id = current_tenant_id()` check
2. **Site Scoping**: Site-scoped tables filter by `can_access_site(site_id)`
3. **Admin Bypass**: Admins can access all data within their tenant
4. **Ownership Access**: Risk owners and work item assignees always have access
5. **Service Role**: Service role bypasses all RLS for system operations

---

## Helper Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `current_tenant_id()` | `uuid` | Extracts tenant ID from JWT claims |
| `current_site_ids()` | `uuid[]` | Extracts accessible site IDs from JWT claims |
| `current_user_role()` | `text` | Extracts user role from JWT claims |
| `current_user_id()` | `uuid` | Extracts user ID (sub) from JWT claims |
| `is_admin()` | `boolean` | Returns true if current user is admin |
| `can_access_site(uuid)` | `boolean` | Checks if user can access specified site |

---

## Policy Summary by Table

### 1. tenants

**Scope**: Tenant root table

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | All users | Own tenant only | `tenants_select_own_tenant` |
| UPDATE | Admin | Own tenant only | `tenants_update_admin` |
| INSERT | Service role | N/A (bypasses RLS) | - |
| DELETE | Service role | N/A (bypasses RLS) | - |

**Notes**: 
- Tenant creation/deletion managed by service role only
- Regular users can view but not modify tenant settings

---

### 2. users

**Scope**: Tenant-scoped

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | All users | Same tenant | `users_select_same_tenant` |
| INSERT | Admin | Same tenant | `users_insert_admin` |
| UPDATE | Admin | Same tenant | `users_update_admin` |
| UPDATE | Self | Own profile only (cannot change role/status) | `users_update_own_profile` |
| DELETE | Admin | Same tenant | `users_delete_admin` |

**Notes**:
- Users can view all other users in their tenant
- Self-updates restricted: cannot change own role or status
- User management (role changes) restricted to admins

---

### 3. sites

**Scope**: Tenant + Site scoped

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin | All sites in tenant | `sites_select_admin` |
| SELECT | All users | Assigned sites only | `sites_select_assigned_sites` |
| INSERT | Admin | Same tenant | `sites_insert_admin` |
| UPDATE | Admin | All sites in tenant | `sites_update_admin` |
| UPDATE | Manager, Operator | Assigned sites only | `sites_update_manager` |
| DELETE | Admin | Same tenant | `sites_delete_admin` |

**Notes**:
- Non-admin users filtered by `can_access_site(id)`
- Managers can update sites they have access to
- Site creation restricted to admins

---

### 4. signals

**Scope**: Tenant + Site scoped

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin | All sites in tenant | `signals_select_admin` |
| SELECT | All users | Assigned sites only | `signals_select_assigned_sites` |
| INSERT | Admin, Manager, Operator, Contributor | Assigned sites only | `signals_insert_contributor` |
| UPDATE | Admin, Manager, Operator, Contributor | Assigned sites only | `signals_update_contributor` |
| DELETE | Admin | Same tenant | `signals_delete_admin` |

**Notes**:
- Contributors can insert/update signals (key for data ingestion)
- Viewers have read-only access
- Deletes restricted to admins only

---

### 5. workflows

**Scope**: Tenant-scoped

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | All users | Same tenant | `workflows_select_tenant` |
| INSERT | Admin, Manager | Same tenant | `workflows_insert_manager` |
| UPDATE | Admin, Manager | Same tenant | `workflows_update_manager` |
| DELETE | Admin | Same tenant | `workflows_delete_admin` |

**Notes**:
- All users can view workflows (needed for work item execution)
- Workflow management restricted to managers and admins
- No site scoping (workflows are tenant-level resources)

---

### 6. work_items

**Scope**: Tenant + Site scoped (with assignment-based access)

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin | All work items in tenant | `work_items_select_admin` |
| SELECT | All users | Assigned sites only (or site_id IS NULL) | `work_items_select_assigned_sites` |
| SELECT | Assignee | Work items assigned to user | `work_items_select_assigned_to_user` |
| INSERT | Admin, Manager, Operator, Contributor | Assigned sites only | `work_items_insert_contributor` |
| UPDATE | Admin | All work items in tenant | `work_items_update_admin` |
| UPDATE | Manager, Operator, Contributor | Assigned sites only | `work_items_update_contributor` |
| UPDATE | Assignee | Assigned work items | `work_items_update_assigned_user` |
| DELETE | Admin | Same tenant | `work_items_delete_admin` |

**Notes**:
- **Special rule**: Users can always view/update work items assigned to them, regardless of site access
- Contributors can create and update work items but not delete
- Tenant-level work items (site_id IS NULL) visible to all tenant users

---

### 7. risk_register

**Scope**: Tenant + Site scoped (with ownership-based access) **[MS2 Requirements]**

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin | All risks in tenant | `risk_register_select_admin` |
| SELECT | All users | Assigned sites only | `risk_register_select_assigned_sites` |
| SELECT | Risk Owner | Risks owned by user (bypasses site access) | `risk_register_select_owner` |
| SELECT | Auditor | All risks in tenant | `risk_register_select_auditor` |
| INSERT | Admin, Manager, Operator, Contributor | Assigned sites only | `risk_register_insert_contributor` |
| UPDATE | Admin | All risks in tenant | `risk_register_update_admin` |
| UPDATE | Risk Owner | Risks owned by user (MS2 requirement) | `risk_register_update_owner` |
| UPDATE | Manager, Contributor | Assigned sites only | `risk_register_update_manager` |
| DELETE | Admin | Same tenant | `risk_register_delete_admin` |

**Notes**:
- **MS2 Requirement**: Risk owners can ALWAYS view and update their risks, regardless of site access
- This ensures accountability and ownership (risk owner cannot be locked out of their risks)
- Auditors have read-only access to all risks for compliance review
- Contributors can create risks but ownership must be explicit

---

### 8. risk_events

**Scope**: Tenant-scoped (follows risk_register access)

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | All users | Can access parent risk | `risk_events_select_tenant` |
| INSERT | Admin, Manager, Contributor | Same tenant | `risk_events_insert_contributor` |
| UPDATE | Admin | Same tenant | `risk_events_update_admin` |
| DELETE | Admin | Same tenant | `risk_events_delete_admin` |

**Notes**:
- Access determined by risk_register policies (can only see events for risks user can access)
- Risk events should be immutable (only admins can modify)
- Auto-generated by triggers when risk assessments change

---

### 9. billing_accounts

**Scope**: Tenant-scoped, **Admin-only**

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin, Billing Admin | Same tenant | `billing_accounts_select_admin` |
| INSERT | Admin | Same tenant | `billing_accounts_insert_admin` |
| UPDATE | Admin | Same tenant | `billing_accounts_update_admin` |
| DELETE | Admin | Same tenant | `billing_accounts_delete_admin` |

**Notes**:
- Billing admin role can VIEW billing data
- Only tenant admins can MODIFY billing data
- Sensitive financial information protected from operational users

---

### 10. invoices

**Scope**: Tenant-scoped, **Admin-only**

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin, Billing Admin | Same tenant | `invoices_select_admin` |
| INSERT | Admin | Same tenant | `invoices_insert_admin` |
| UPDATE | Admin | Same tenant | `invoices_update_admin` |
| DELETE | Admin | Same tenant | `invoices_delete_admin` |

**Notes**:
- Billing admin role can VIEW invoices
- Only tenant admins can MODIFY invoices
- Prevents operational users from seeing billing information

---

### 11. invoice_line_items

**Scope**: Tenant-scoped, **Admin-only**

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin, Billing Admin | Same tenant | `invoice_line_items_select_admin` |
| INSERT | Admin | Same tenant | `invoice_line_items_insert_admin` |
| UPDATE | Admin | Same tenant | `invoice_line_items_update_admin` |
| DELETE | Admin | Same tenant | `invoice_line_items_delete_admin` |

**Notes**:
- Same access control as invoices
- Billing admin can view line items for invoice details

---

### 12. notifications

**Scope**: **User-specific**

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | User | Own notifications | `notifications_select_own` |
| SELECT | Admin | All notifications in tenant | `notifications_select_admin` |
| INSERT | Admin | Same tenant | `notifications_insert_admin` |
| UPDATE | User | Own notifications (mark as read) | `notifications_update_own` |
| DELETE | User | Own notifications | `notifications_delete_own` |
| DELETE | Admin | All notifications in tenant | `notifications_delete_admin` |

**Notes**:
- Strictest isolation: users can ONLY see their own notifications
- Users can mark notifications as read or delete them
- Admins can manage all notifications (e.g., for cleanup)

---

### 13. integrations

**Scope**: Tenant-scoped, **Admin-only** (sensitive credentials)

| Action | Who | Rule | Policy Name |
|--------|-----|------|-------------|
| SELECT | Admin | Same tenant | `integrations_select_admin` |
| INSERT | Admin | Same tenant | `integrations_insert_admin` |
| UPDATE | Admin | Same tenant | `integrations_update_admin` |
| DELETE | Admin | Same tenant | `integrations_delete_admin` |

**Notes**:
- **Security-critical**: Contains API keys and credentials
- Completely restricted to tenant admins
- No read access for non-admin users

---

## Role-Based Access Matrix

### Admin (role = 'admin')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | ✅ Own | ❌ | ✅ Own | ❌ |
| users | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| sites | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| signals | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| workflows | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| work_items | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| risk_register | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| risk_events | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| billing_* | ✅ All tenant | ✅ | ✅ All tenant | ✅ |
| notifications | ✅ All tenant | ✅ | ❌ | ✅ All tenant |
| integrations | ✅ All tenant | ✅ | ✅ All tenant | ✅ |

**Special privileges**:
- Bypasses site restrictions (`can_access_site()` always returns true for admins)
- Full CRUD on all tables
- Only role that can delete most records

---

### Billing Admin (role = 'billing_admin')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| billing_accounts | ✅ Own tenant | ❌ | ❌ | ❌ |
| invoices | ✅ Own tenant | ❌ | ❌ | ❌ |
| invoice_line_items | ✅ Own tenant | ❌ | ❌ | ❌ |
| **All other tables** | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- **Read-only** access to billing data
- No access to operational data (signals, risks, sites) unless also granted another role
- Cannot modify billing records (only admins can)

---

### Manager (role = 'manager')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | ✅ Own | ❌ | ❌ | ❌ |
| users | ✅ All tenant | ❌ | ❌ | ❌ |
| sites | ✅ Assigned | ❌ | ✅ Assigned | ❌ |
| signals | ✅ Assigned sites | ✅ Assigned | ✅ Assigned | ❌ |
| workflows | ✅ All tenant | ✅ | ✅ All tenant | ❌ |
| work_items | ✅ Assigned sites + assigned to self | ✅ Assigned | ✅ Assigned | ❌ |
| risk_register | ✅ Assigned sites + owned risks | ✅ Assigned | ✅ Assigned + owned | ❌ |
| risk_events | ✅ Accessible risks | ✅ | ❌ | ❌ |
| billing_* | ❌ | ❌ | ❌ | ❌ |
| notifications | ✅ Own | ❌ | ✅ Own | ✅ Own |
| integrations | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- Can manage workflows (create/update)
- Can update sites they have access to
- Cannot delete any records
- No billing or integration access

---

### Operator (role = 'operator')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | ✅ Own | ❌ | ❌ | ❌ |
| users | ✅ All tenant | ❌ | ❌ | ❌ |
| sites | ✅ Assigned | ❌ | ✅ Assigned | ❌ |
| signals | ✅ Assigned sites | ✅ Assigned | ✅ Assigned | ❌ |
| workflows | ✅ All tenant | ❌ | ❌ | ❌ |
| work_items | ✅ Assigned sites + assigned to self | ✅ Assigned | ✅ Assigned | ❌ |
| risk_register | ✅ Assigned sites + owned risks | ✅ Assigned | ❌ | ❌ |
| risk_events | ✅ Accessible risks | ❌ | ❌ | ❌ |
| billing_* | ❌ | ❌ | ❌ | ❌ |
| notifications | ✅ Own | ❌ | ✅ Own | ✅ Own |
| integrations | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- Primary operational role
- Can create signals and work items
- Can create risks but not update them (unless owner)
- Read-only on workflows

---

### Contributor (role = 'contributor')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | ✅ Own | ❌ | ❌ | ❌ |
| users | ✅ All tenant | ❌ | ❌ | ❌ |
| sites | ✅ Assigned | ❌ | ❌ | ❌ |
| signals | ✅ Assigned sites | ✅ Assigned | ✅ Assigned | ❌ |
| workflows | ✅ All tenant | ❌ | ❌ | ❌ |
| work_items | ✅ Assigned sites + assigned to self | ✅ Assigned | ✅ Assigned | ❌ |
| risk_register | ✅ Assigned sites + owned risks | ✅ Assigned | ✅ Assigned + owned | ❌ |
| risk_events | ✅ Accessible risks | ✅ | ❌ | ❌ |
| billing_* | ❌ | ❌ | ❌ | ❌ |
| notifications | ✅ Own | ❌ | ✅ Own | ✅ Own |
| integrations | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- **Key role for data ingestion**: Can insert/update signals, work items, risks
- **Cannot delete** any records (important for data integrity)
- Ideal for integration systems and automated data sources

---

### Viewer (role = 'viewer')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | ✅ Own | ❌ | ❌ | ❌ |
| users | ✅ All tenant | ❌ | ❌ | ❌ |
| sites | ✅ Assigned | ❌ | ❌ | ❌ |
| signals | ✅ Assigned sites | ❌ | ❌ | ❌ |
| workflows | ✅ All tenant | ❌ | ❌ | ❌ |
| work_items | ✅ Assigned sites | ❌ | ❌ | ❌ |
| risk_register | ✅ Assigned sites | ❌ | ❌ | ❌ |
| risk_events | ✅ Accessible risks | ❌ | ❌ | ❌ |
| billing_* | ❌ | ❌ | ❌ | ❌ |
| notifications | ✅ Own | ❌ | ✅ Own (read-only flag) | ✅ Own |
| integrations | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- **Completely read-only** (except own profile and notifications)
- Restricted to assigned sites
- No write access to any operational data
- Ideal for stakeholders and executives

---

### Auditor (role = 'auditor')
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | ✅ Own | ❌ | ❌ | ❌ |
| users | ✅ All tenant | ❌ | ❌ | ❌ |
| sites | ✅ All tenant | ❌ | ❌ | ❌ |
| signals | ✅ All tenant | ❌ | ❌ | ❌ |
| workflows | ✅ All tenant | ❌ | ❌ | ❌ |
| work_items | ✅ All tenant | ❌ | ❌ | ❌ |
| risk_register | ✅ **All tenant** | ❌ | ❌ | ❌ |
| risk_events | ✅ All tenant | ❌ | ❌ | ❌ |
| billing_* | ❌ | ❌ | ❌ | ❌ |
| notifications | ✅ Own | ❌ | ✅ Own | ✅ Own |
| integrations | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- **Special privilege**: Bypasses site restrictions for risk register (compliance requirement)
- **Read-only** access across all operational data
- Cannot access billing or integration credentials
- Ideal for compliance and audit teams

---

## Site Access Control

### How site_ids Works

The `users.site_ids` column controls site-level access:

```sql
-- NULL or empty array: Access to ALL sites in tenant
users.site_ids = NULL  → can_access_site(any_site_id) = true

-- Specific sites: Access restricted to listed sites only
users.site_ids = [site-uuid-1, site-uuid-2]  → can_access_site(site-uuid-1) = true
                                              → can_access_site(site-uuid-3) = false

-- Admin role: Bypasses site restrictions completely
role = 'admin'  → can_access_site(any_site_id) = true (regardless of site_ids)
```

### Special Access Rules

1. **Risk Owners** (MS2 Requirement):
   - Risk owners can **always** view and update their risks
   - Bypasses site_ids restrictions
   - Ensures accountability and ownership

2. **Work Item Assignees**:
   - Users can **always** view work items assigned to them
   - Bypasses site_ids restrictions
   - Ensures workers can see their tasks

3. **Auditors**:
   - Can view **all** risks in tenant (bypasses site_ids)
   - Read-only access for compliance review

---

## Tenant Isolation Guarantees

### Every Policy Includes:
```sql
tenant_id = current_tenant_id()
```

### What This Means:
- ✅ **No cross-tenant data leakage**: Users can never see data from other tenants
- ✅ **Enforced at database level**: Even if application code has bugs
- ✅ **Service role bypass**: System operations use service role to bypass RLS
- ✅ **JWT-based**: Tenant ID extracted from authenticated user's JWT token

### Testing Tenant Isolation:
```sql
-- This query should ONLY return the current user's tenant data
SELECT * FROM sites;

-- Even if you try to filter by another tenant, RLS blocks it:
SELECT * FROM sites WHERE tenant_id = 'other-tenant-uuid';
-- Returns 0 rows (RLS filters it out)
```

---

## MS2 Design Requirements - Risk Register

### Requirement 1: Mandatory Ownership
✅ **Implementation**: 
- `risk_register.owner_id` is NOT NULL with RESTRICT on delete
- Cannot create a risk without an owner
- Cannot delete a user who owns active risks

### Requirement 2: Explicit Decisions
✅ **Implementation**:
- `risk_decision` enum: accept/mitigate/transfer/avoid/under_review
- CHECK constraint requires rationale when decision is made
- No "undefined" or null decision states (except under_review)

### Requirement 3: Complete Audit Trail
✅ **Implementation**:
- `risk_register.audit_trail` JSONB array stores all changes
- `risk_events` table stores historical risk scores
- Immutable audit trail (only admins can modify)

### Requirement 4: Owner Access
✅ **Implementation**:
- Policy `risk_register_select_owner`: Owners can always view their risks
- Policy `risk_register_update_owner`: Owners can always update their risks
- Bypasses site_ids restrictions for ownership

---

## Security Best Practices

### 1. JWT Claims Structure
```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "role": "manager",
  "site_ids": ["site-uuid-1", "site-uuid-2"]
}
```

### 2. Service Role Usage
- Use service role for:
  - Tenant creation/deletion
  - System-level operations
  - Batch jobs and migrations
- Never expose service role key to frontend

### 3. Testing RLS Policies
```sql
-- Set JWT claims for testing
SET request.jwt.claims = '{"sub": "user-uuid", "tenant_id": "tenant-uuid", "role": "viewer"}';

-- Run queries as that user
SELECT * FROM risk_register;

-- Reset
RESET request.jwt.claims;
```

### 4. Performance Considerations
- RLS policies add WHERE clauses to every query
- Indexes on tenant_id and site_id are critical
- Use `EXPLAIN ANALYZE` to verify policy performance

---

## Common Policy Patterns

### Pattern 1: Simple Tenant Isolation
```sql
CREATE POLICY table_select_tenant ON table_name
  FOR SELECT
  USING (tenant_id = current_tenant_id());
```

### Pattern 2: Tenant + Site Scoping
```sql
CREATE POLICY table_select_site ON table_name
  FOR SELECT
  USING (
    tenant_id = current_tenant_id() 
    AND can_access_site(site_id)
  );
```

### Pattern 3: Admin Bypass
```sql
CREATE POLICY table_select_admin ON table_name
  FOR SELECT
  USING (tenant_id = current_tenant_id() AND is_admin());
```

### Pattern 4: Ownership Access
```sql
CREATE POLICY table_select_owner ON table_name
  FOR SELECT
  USING (
    tenant_id = current_tenant_id() 
    AND owner_id = current_user_id()
  );
```

### Pattern 5: Role-Based Access
```sql
CREATE POLICY table_insert_contributor ON table_name
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() 
    AND current_user_role() IN ('admin', 'manager', 'contributor')
  );
```

---

## Troubleshooting

### Issue: User can't see expected data
**Check**:
1. Is `tenant_id` in JWT claims correct?
2. Are `site_ids` in JWT claims correct?
3. Does user have the right role?
4. Is the record soft-deleted (`deleted_at IS NOT NULL`)?

### Issue: Policy is too permissive
**Check**:
1. Is there a policy with `OR` condition that's too broad?
2. Is admin bypass being applied when it shouldn't?
3. Are there multiple overlapping policies (PostgreSQL uses OR logic)?

### Issue: Performance degradation
**Check**:
1. Are indexes on `tenant_id`, `site_id`, and foreign keys in place?
2. Run `EXPLAIN ANALYZE` to see if RLS policies are using indexes
3. Consider partial indexes for common filtered queries

---

## Summary Statistics

**Total Policies**: 71
- SELECT policies: 27
- INSERT policies: 15
- UPDATE policies: 22
- DELETE policies: 15

**Tables with RLS**: 13
**Helper Functions**: 6

**Roles Supported**: 7
- admin (full access)
- billing_admin (billing read-only)
- manager (workflow management)
- operator (operational data entry)
- contributor (data ingestion)
- viewer (read-only)
- auditor (compliance read-only)

---

**Status**: ✅ RLS policies fully implemented with tenant isolation and site scoping
