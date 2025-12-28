# OT Continuum Functional Truth Audit

**Date:** December 26, 2024  
**Purpose:** Identify conflicts between current UX implementation and authoritative backend data model

---

## 🔒 Non-Negotiable Constraints (Authoritative Truth)

1. **Multi-tenant enforcement** - All data scoped to tenant_id
2. **Required onboarding sequence:** Site → Process Units → Plant Tags → Asset Upload → Asset Mapping
3. **Many-to-many relationships:**
   - Assets ↔ Process Units
   - Assets ↔ Plant Tags  
   - Assets ↔ Plant Systems
4. **Server-side tenant resolution** - Client never selects tenant

---

## ❌ CRITICAL CONFLICTS FOUND

### 1. **MISSING DATABASE TABLES** (Critical Blocker)

**Issue:** The onboarding flow references tables that DO NOT EXIST in the database schema.

**UX References (from `/pages/SiteOnboarding.tsx` and components):**
- Process Units
- Plant Tags
- OT Assets
- Plant Systems
- Asset mappings (many-to-many junction tables)

**Database Reality (from `/supabase/migrations/sql/003_core_schema.sql`):**
- ✅ `tenants` - EXISTS
- ✅ `users` - EXISTS  
- ✅ `sites` - EXISTS
- ✅ `signals` - EXISTS
- ✅ `workflows` - EXISTS
- ✅ `work_items` - EXISTS
- ✅ `risk_register` - EXISTS
- ❌ `process_units` - DOES NOT EXIST
- ❌ `plant_tags` - DOES NOT EXIST
- ❌ `ot_assets` - DOES NOT EXIST
- ❌ `plant_systems` - DOES NOT EXIST
- ❌ `asset_process_unit_mappings` - DOES NOT EXIST
- ❌ `asset_plant_system_mappings` - DOES NOT EXIST
- ❌ `asset_plant_tag_mappings` - DOES NOT EXIST

**Impact:** 🔴 **BLOCKER** - Entire onboarding flow cannot function. No API endpoints can be implemented.

**Evidence:**
- Searched all migration files: No CREATE TABLE statements found
- `/supabase/functions/server/routes/sites.ts` only implements basic CRUD for sites table
- No routes exist for process units, plant tags, or assets

**Required Action:**
1. Create database migration with missing tables
2. Define proper foreign keys and constraints
3. Create RLS policies for tenant isolation
4. Implement API routes for CRUD operations

---

### 2. **ORPHANED ONBOARDING COMPONENTS** (High Severity)

**Issue:** 8 onboarding components exist but have no backend support.

**Files without backend:**
- `/components/onboarding/ProcessUnitsStep.tsx` - Creates process units (table doesn't exist)
- `/components/onboarding/PlantTagsStep.tsx` - Creates plant tags (table doesn't exist)
- `/components/onboarding/AssetLedgerStep.tsx` - Uploads OT assets (table doesn't exist)
- `/components/onboarding/MapPlantSystemsStep.tsx` - Maps assets to systems (tables don't exist)
- `/components/onboarding/MapProcessUnitsStep.tsx` - Maps assets to units (tables don't exist)
- `/components/onboarding/MapPlantTagsStep.tsx` - Maps assets to tags (tables don't exist)
- `/components/onboarding/BulkMappingTable.tsx` - Generic mapping UI (no data to map)
- `/pages/SiteOnboarding.tsx` - Orchestrates flow (calls non-existent APIs)

**Current State:** All components contain `TODO: Replace with actual API call` stubs

**Impact:** 🟠 **HIGH** - Users can click through UI but no data is saved. Creates false impression of working system.

**Required Action:**
1. Either implement backend tables + APIs
2. Or remove components until backend exists

---

### 3. **INCONSISTENT DATA MODEL DOCUMENTATION** (Medium Severity)

**Issue:** Documentation describes data model that doesn't match implemented schema.

**Documented Model (from `/BACKEND_AWARE_UX_IMPLEMENTATION.md`):**
```typescript
interface ProcessUnit {
  id: string;
  name: string;
  code: string;
  description: string;
  site_id: string; // Implied from context
}

interface PlantTag {
  id: string;
  tag_name: string;
  description: string;
  unit_of_measure: string;
  tag_type: string;
  process_unit_id: string; // One-to-one relationship
}

interface OTAsset {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_type: string;
  manufacturer: string;
  model: string;
  ip_address: string;
}
```

**Actual Schema (from `/supabase/migrations/sql/003_core_schema.sql`):**
- ❌ None of these tables exist

**Impact:** 🟡 **MEDIUM** - Developers following documentation will write code against non-existent schema.

**Required Action:**
1. Update documentation to reflect actual schema
2. Or implement schema to match documentation
3. Mark unimplemented features clearly

---

### 4. **MISSING BACKEND API ROUTES** (High Severity)

**Issue:** Frontend expects API endpoints that don't exist.

**Expected API Routes (from UX components):**
```
POST   /api/sites/{site_id}/process-units
GET    /api/sites/{site_id}/process-units
POST   /api/sites/{site_id}/plant-tags
GET    /api/sites/{site_id}/plant-tags
POST   /api/sites/{site_id}/ot-assets/upload
GET    /api/sites/{site_id}/ot-assets
POST   /api/sites/{site_id}/asset-mappings
GET    /api/sites/{site_id}/asset-mappings
POST   /api/ai-gateway (for AI suggestions)
```

**Actual API Routes (from `/supabase/functions/server/index.tsx` and routes/):**
```
✅ /make-server-fb677d93/tenants/*
✅ /make-server-fb677d93/auth/*
✅ /make-server-fb677d93/sites/* (basic CRUD only)
✅ /make-server-fb677d93/risks/*
✅ /make-server-fb677d93/billing/*
❌ No process unit routes
❌ No plant tag routes
❌ No asset routes
❌ No mapping routes
```

**Impact:** 🟠 **HIGH** - All onboarding API calls will fail with 404.

**Required Action:**
1. Implement missing route handlers
2. Or disable onboarding UI until routes exist

---

### 5. **TENANT CONTEXT MISMATCH** (Low Severity)

**Issue:** Components correctly use tenant context, but context doesn't track site onboarding status.

**Context Implementation (from `/contexts/TenantContext.tsx`):**
```typescript
interface TenantContextType {
  tenantId: string;
  tenantName: string;
  tenantPlan: string;
  role: string;
  // ❌ Missing: siteOnboardingComplete
  // ❌ Missing: currentSiteId
}
```

**UX Expectation (from `/pages/SiteOnboarding.tsx` and `/App.tsx`):**
```typescript
// App.tsx uses local state instead of context
const [siteOnboardingComplete, setSiteOnboardingComplete] = useState(true);
```

**Impact:** 🟢 **LOW** - Functionality works via local state, but not persistent across page reloads.

**Required Action:**
1. Add site onboarding status to TenantContext
2. Fetch from backend on login
3. Update after completing onboarding

---

### 6. **ONBOARDING STEP ORDER VIOLATION** (Critical - Constraint Violation)

**Issue:** Current step order doesn't match authoritative sequence.

**Authoritative Sequence:**
```
1. Site (already exists)
2. Process Units (required)
3. Plant Tags (required)
4. Asset Upload (required)
5. Asset Mapping (required)
```

**Implemented Sequence (from `/pages/SiteOnboarding.tsx`):**
```
1. Process Units (required) ✅
2. Plant Tags (required) ✅
3. Asset Ledger Upload (required) ✅
4. Map Assets to Plant Systems (optional) ❌ Should be required
5. Map Assets to Process Units (required) ✅
6. Map Assets to Plant Tags (optional) ✅
```

**Conflicts:**
- Step 4 "Map Assets to Plant Systems" marked as **optional** but should be **required** per constraint
- Site creation step is missing (assumes site already created)

**Impact:** 🟠 **MEDIUM** - Users can skip required mapping step, creating incomplete data.

**Required Action:**
1. Change "Map Assets to Plant Systems" from `required: false` to `required: true`
2. Add explicit site creation step OR document that sites are created before onboarding

---

### 7. **MANY-TO-MANY RELATIONSHIP ENFORCEMENT** (Low Severity - Design Compliant)

**Issue:** ✅ **NO CONFLICT** - Components correctly implement many-to-many via checkbox matrices.

**Implementation Review:**
- `/components/onboarding/BulkMappingTable.tsx` - Uses checkbox matrix ✅
- `/components/onboarding/MapProcessUnitsStep.tsx` - Allows multiple units per asset ✅
- No single-select dropdowns for many-to-many relationships ✅

**Status:** 🟢 **COMPLIANT** - No action needed.

---

### 8. **AI-ASSIST CONFIRMATION FLOW** (Low Severity - Design Compliant)

**Issue:** ✅ **NO CONFLICT** - AI suggestions require user confirmation.

**Implementation Review:**
- `/components/onboarding/PlantTagsStep.tsx` - Shows AI suggestions panel, user must click "Apply" ✅
- `/components/onboarding/MapProcessUnitsStep.tsx` - AI suggestions reviewed before applying ✅
- No auto-apply of AI suggestions ✅

**Status:** 🟢 **COMPLIANT** - No action needed.

---

## 📊 Conflict Summary

| Conflict | Severity | Status | Blocker? |
|----------|----------|--------|----------|
| Missing database tables | 🔴 Critical | Open | ✅ YES |
| Orphaned onboarding components | 🟠 High | Open | ✅ YES |
| Inconsistent documentation | 🟡 Medium | Open | ❌ No |
| Missing API routes | 🟠 High | Open | ✅ YES |
| Tenant context mismatch | 🟢 Low | Open | ❌ No |
| Onboarding step order violation | 🟠 Medium | Open | ❌ No |
| Many-to-many implementation | 🟢 Low | ✅ Compliant | ❌ No |
| AI-assist confirmation | 🟢 Low | ✅ Compliant | ❌ No |

---

## 🚨 BLOCKERS PREVENTING PRODUCTION DEPLOYMENT

### Blocker #1: Missing Database Schema
**Why blocking:** Cannot save any onboarding data without tables  
**Affected features:** Entire onboarding flow (Steps 2-6)  
**Resolution path:** Create migration file with all missing tables

### Blocker #2: Missing API Endpoints  
**Why blocking:** Frontend will get 404 errors on all save operations  
**Affected features:** All POST/GET calls in onboarding components  
**Resolution path:** Implement route handlers in `/supabase/functions/server/routes/`

### Blocker #3: Orphaned UI Components
**Why blocking:** Users can interact with UI that doesn't save data  
**Affected features:** All 8 onboarding steps  
**Resolution path:** Either implement backend OR disable components

---

## ✅ COMPLIANT IMPLEMENTATIONS

### Multi-Tenant Enforcement ✅
- TenantContext properly scopes all operations to tenant
- Components never ask user to select tenant
- UI uses `tenantId` from context automatically

### Server-Side Tenant Resolution ✅
- TenantResolver component handles org resolution
- User sees org picker only when ambiguous (multiple orgs)
- Tenant context persisted in localStorage after resolution

### Bulk Operations for Many-to-Many ✅
- BulkMappingTable uses checkbox matrices
- No single-select dropdowns for M:M relationships
- Search, filter, and "select all" features present

### AI Suggestions with Confirmation ✅
- AI suggestions shown in review panel
- User must explicitly click "Apply" button
- No auto-application of AI outputs

---

## 🎯 RECOMMENDED RESOLUTION SEQUENCE

### Phase 1: Database Foundation (Week 1)
1. Create database migration with all missing tables
2. Define foreign key constraints (site_id, process_unit_id, etc.)
3. Implement RLS policies for tenant isolation
4. Add indexes for performance
5. Test constraints with sample data

### Phase 2: API Implementation (Week 2)
1. Implement `/process-units` routes (CRUD)
2. Implement `/plant-tags` routes (CRUD + CSV upload)
3. Implement `/ot-assets` routes (CRUD + CSV upload)
4. Implement `/asset-mappings` routes (bulk create/read)
5. Add error handling and validation

### Phase 3: Frontend Integration (Week 3)
1. Replace all TODO stubs with real API calls
2. Add loading states during API calls
3. Add error handling with user-friendly messages
4. Test complete onboarding flow end-to-end
5. Update TenantContext with onboarding status

### Phase 4: Validation (Week 4)
1. Update documentation to match implementation
2. Write Playwright tests for onboarding flow
3. Add pgTAP tests for database constraints
4. Performance test with realistic data volumes
5. Security audit of RLS policies

---

## 🔍 VERIFICATION CHECKLIST

Before proceeding with any visual/styling changes, verify:

- [ ] All database tables exist and match UX requirements
- [ ] All API routes return expected data structures
- [ ] RLS policies enforce tenant isolation correctly
- [ ] Foreign key constraints prevent orphaned records
- [ ] Onboarding step sequence matches authoritative order
- [ ] Many-to-many relationships enforced via junction tables
- [ ] AI suggestions require user confirmation
- [ ] No tenant/site selection dropdowns in UI
- [ ] TenantContext tracks onboarding completion status
- [ ] Documentation matches implemented schema

---

## 📝 NOTES

**Why this audit matters:**
Adding dark theme styling or visual polish to components that don't have functional backends is technical debt. Users will experience a polished UI that doesn't save data, creating worse UX than a simple message stating "Coming Soon."

**Recommendation:**
Do NOT proceed with visual/styling changes until Blockers #1-3 are resolved. The functional foundation must exist before cosmetic improvements.

**Alternative Approach:**
If backend implementation is delayed, disable onboarding flow and show a clear "Setup Coming Soon" message on the dashboard. This is more honest than a non-functional wizard.

---

**End of Audit**
