# Backend-Aware UX Implementation Guide

## Overview

This document describes the updated OT Continuum UX that aligns with the confirmed backend data model and enforced relationships. The system is multi-tenant with strict server-side tenant enforcement.

---

## ✅ Completed Components

### 1. Site Onboarding Flow

**Location:** `/pages/SiteOnboarding.tsx`

**Features:**
- ✅ Progressive wizard with 6 steps
- ✅ Visual progress tracking (sidebar + progress bar)
- ✅ Step completion status indicators
- ✅ Required vs. optional step differentiation
- ✅ Navigation between steps
- ✅ "Complete Setup" action when all required steps done

**Steps:**
1. Create Process Units (required)
2. Add Plant Tags (required)
3. Upload OT Asset Ledger (required) - *pending implementation*
4. Map Assets to Plant Systems (required) - *pending implementation*
5. Map Assets to Process Units (required) - ✅ implemented
6. Map Assets to Plant Tags (optional) - *pending implementation*

---

### 2. Process Units Step

**Location:** `/components/onboarding/ProcessUnitsStep.tsx`

**Features:**
- ✅ Educational header explaining what process units are
- ✅ Empty state with call-to-action
- ✅ Add/remove process units
- ✅ Validation (code + name required)
- ✅ Table view of added units
- ✅ Save & Continue with backend integration stub

**Data Model:**
```typescript
interface ProcessUnit {
  id?: string;
  name: string;        // e.g., "Crude Distillation Unit"
  code: string;        // e.g., "CDU-1"
  description: string;
}
```

**Key Decisions:**
- Process Units belong to exactly one Site (enforced in backend)
- UI never asks for Site ID - context is automatic
- Codes are auto-uppercased for consistency

---

### 3. Plant Tags Step

**Location:** `/components/onboarding/PlantTagsStep.tsx`

**Features:**
- ✅ Educational header explaining what plant tags are
- ✅ CSV upload option
- ✅ Manual entry option
- ✅ Grouped display by process unit
- ✅ **AI-Assist:** Clean & Label Tags
- ✅ AI suggestions review panel with apply/cancel

**Data Model:**
```typescript
interface PlantTag {
  id?: string;
  tag_name: string;           // e.g., "PI-101"
  description: string;        // e.g., "Pressure Indicator"
  unit_of_measure?: string;   // e.g., "PSI"
  tag_type?: string;          // e.g., "Indicator"
  process_unit_id: string;    // Belongs to exactly ONE process unit
}
```

**Key Decisions:**
- Tags belong to exactly ONE process unit (enforced in backend)
- AI can suggest descriptions and types based on tag names
- All AI suggestions require user confirmation before applying

---

### 4. Bulk Mapping Table Component

**Location:** `/components/onboarding/BulkMappingTable.tsx`

**Features:**
- ✅ Checkbox matrix for many-to-many relationships
- ✅ Search/filter items
- ✅ Type-based filtering
- ✅ "Select All" per column (target)
- ✅ Visual mapping summary
- ✅ Progress tracking (X of Y items mapped)
- ✅ AI Suggest integration hook

**Usage:**
```tsx
<BulkMappingTable
  title="Asset ↔ Process Unit Mappings"
  items={assets}
  targets={processUnits}
  itemLabel="Asset"
  targetLabel="Process Unit"
  onMappingsChange={handleMappingsChange}
  aiSuggestEnabled={true}
  onAiSuggest={handleAiSuggest}
/>
```

**Key Decisions:**
- Designed for many-to-many relationships
- NOT single-select dropdowns (follows requirement)
- Supports bulk operations (select all, filter, search)
- Visual feedback for mapped vs. unmapped items

---

### 5. Map Assets to Process Units Step

**Location:** `/components/onboarding/MapProcessUnitsStep.tsx`

**Features:**
- ✅ Uses BulkMappingTable component
- ✅ Educational header explaining many-to-many relationship
- ✅ **AI-Assist:** Suggest asset-to-process-unit mappings
- ✅ Validation (all assets must be mapped)
- ✅ Save & Continue with backend integration stub

**Data Model:**
```typescript
// Many-to-many relationship
interface AssetProcessUnitMapping {
  asset_id: string;
  process_unit_id: string;
}
```

**Example Mappings:**
- PLC → [CDU-1, FCC-1] (one asset, multiple units)
- TT-101 → [CDU-1] (one asset, one unit)
- HMI-001 → [CDU-1, FCC-1, HTU-1, CWS-1] (one asset, all units)

**Key Decisions:**
- Assets can belong to multiple process units
- AI suggests based on asset types and naming conventions
- Checkbox matrix allows multi-select per asset

---

### 6. Empty State Education Screens

**Location:** `/components/EmptyStateScreens.tsx`

**Components:**
- ✅ `NoProcessUnitsState` - Explains why process units are needed
- ✅ `NoPlantTagsState` - Explains why plant tags are needed
- ✅ `UnmappedAssetsState` - Shows count of unmapped assets
- ✅ `NoAssetsState` - Explains OT asset ledger
- ✅ `UnclassifiedSystemsState` - Shows unclassified plant systems
- ✅ `GenericEmptyState` - Reusable component

**Features:**
- Clear explanations of WHY the data is needed
- What functionality is blocked without the data
- Call-to-action buttons to fix the issue
- Color-coded by severity (blue=info, yellow=warning, orange/red=critical)

**Key Decisions:**
- Treat empty states as **expected states**, not errors
- Educational, not punitive
- Guide users to the next action

---

### 7. Site Management Page

**Location:** `/pages/SiteManagement.tsx`

**Features:**
- ✅ List all sites for the organization
- ✅ Visual onboarding progress per site
- ✅ Site stats (process units, tags, assets, mappings)
- ✅ "Active" vs. "Setup Required" status badges
- ✅ Create new site form
- ✅ Navigate to onboarding flow

**Key Decisions:**
- Sites are scoped to tenant (automatic from context)
- Shows onboarding completion status
- One-click to continue setup for incomplete sites

---

## 📋 Data Model Summary

### Hierarchical Relationships

```
Tenant (automatic from context)
  └── Site (Plant)
      ├── Process Units (many)
      │   └── Plant Tags (many, each tag → exactly one unit)
      │
      ├── Plant Systems (many, e.g., DCS, SCADA)
      │
      └── OT Assets (many)
```

### Many-to-Many Relationships

```
OT Assets ↔ Process Units  (many-to-many)
OT Assets ↔ Plant Systems  (many-to-many)
OT Assets ↔ Plant Tags     (many-to-many, optional)
```

---

## 🎨 Design Principles

### 1. Never Ask for Tenant/Site Context

**❌ Wrong:**
```tsx
<select name="tenant_id">
  <option>Select Tenant...</option>
</select>
```

**✅ Right:**
```tsx
// Tenant context is automatic from TenantProvider
const { tenantId, siteId } = useTenantContext();
```

### 2. Bulk Operations for Many-to-Many

**❌ Wrong:**
```tsx
// Single-select dropdown for many-to-many relationship
<select>
  <option>Select Process Unit...</option>
</select>
```

**✅ Right:**
```tsx
// Checkbox matrix for many-to-many relationship
<BulkMappingTable
  items={assets}
  targets={processUnits}
  // ... multi-select enabled
/>
```

### 3. AI Suggestions Always Require Confirmation

**❌ Wrong:**
```tsx
// Auto-apply AI suggestions
const suggestions = await getAiSuggestions();
saveMappings(suggestions); // NO!
```

**✅ Right:**
```tsx
// Show AI suggestions, user must confirm
const suggestions = await getAiSuggestions();
setAiSuggestions(suggestions); // Show in UI
// User clicks "Apply Suggestions" button
```

### 4. Empty States Are Educational

**❌ Wrong:**
```tsx
<div className="error">
  ❌ Error: No process units found
</div>
```

**✅ Right:**
```tsx
<NoProcessUnitsState
  onAction={() => navigate('/onboarding')}
  actionLabel="Create Process Units"
/>
```

---

## 🔌 Backend Integration Points

### Process Units

```typescript
// POST /api/sites/{site_id}/process-units
{
  units: [
    { name: "Crude Distillation Unit", code: "CDU-1", description: "..." }
  ]
}
```

### Plant Tags

```typescript
// POST /api/sites/{site_id}/plant-tags
{
  tags: [
    { 
      tag_name: "PI-101", 
      description: "Pressure Indicator",
      process_unit_id: "pu-1",
      unit_of_measure: "PSI",
      tag_type: "Indicator"
    }
  ]
}
```

### Asset Mappings

```typescript
// POST /api/sites/{site_id}/asset-mappings
{
  asset_process_unit_mappings: [
    { asset_id: "a1", process_unit_id: "pu-1" },
    { asset_id: "a1", process_unit_id: "pu-2" } // Same asset, different unit
  ],
  asset_plant_system_mappings: [
    { asset_id: "a1", plant_system_id: "ps-1" }
  ],
  asset_plant_tag_mappings: [ // Optional
    { asset_id: "a1", plant_tag_id: "pt-1" }
  ]
}
```

### AI Gateway Calls

```typescript
// Clean and label plant tags
await callAIGateway({
  tenant_id: tenantId, // From context
  mode: 'chat',
  use_case: 'signal_assistant',
  input: {
    task: 'clean_and_label_tags',
    tags: [
      { tag_name: "PI101", description: "" },
      { tag_name: "TI205", description: "" }
    ]
  }
});

// Suggest asset-to-process-unit mappings
await callAIGateway({
  tenant_id: tenantId,
  mode: 'chat',
  use_case: 'signal_assistant',
  input: {
    task: 'suggest_asset_process_unit_mappings',
    assets: [...],
    process_units: [...]
  }
});
```

---

## 🚀 Integration with Existing App

### Update App.tsx Navigation

Add site management to navigation:

```tsx
// In App.tsx
import { SiteManagement } from './pages/SiteManagement';
import { SiteOnboarding } from './pages/SiteOnboarding';

// Add to navigation
const [currentPage, setCurrentPage] = useState('dashboard');
const [onboardingSite, setOnboardingSite] = useState<{ id: string; name: string } | null>(null);

// Render logic
if (onboardingSite) {
  return (
    <SiteOnboarding
      siteId={onboardingSite.id}
      siteName={onboardingSite.name}
      onComplete={() => {
        setOnboardingSite(null);
        setCurrentPage('dashboard');
      }}
    />
  );
}

// Add to renderPage()
case 'site-management':
  return (
    <SiteManagement
      onNavigateToOnboarding={(siteId, siteName) => {
        setOnboardingSite({ id: siteId, name: siteName });
      }}
    />
  );
```

### Update Dashboard

Show onboarding status:

```tsx
// In dashboard
{!siteOnboardingComplete && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
    <h3 className="text-lg mb-2">⚠️ Site Setup Required</h3>
    <p className="text-sm text-gray-700 mb-4">
      Complete site setup to enable operational monitoring.
    </p>
    <button
      onClick={() => navigate('/site-management')}
      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
    >
      Continue Setup
    </button>
  </div>
)}
```

### Guard Workflow Pages

Prevent access to workflow pages if onboarding incomplete:

```tsx
// In SignalIngestion, RiskRegister, etc.
const { siteOnboardingComplete } = useTenantContext();

if (!siteOnboardingComplete) {
  return <NoProcessUnitsState onAction={() => navigate('/site-management')} />;
}
```

---

## 📝 Remaining Work

### High Priority

1. **Asset Ledger Upload Step**
   - CSV upload component
   - Validation (asset_id, name, type, manufacturer, model)
   - Preview table
   - Backend integration

2. **Map Assets to Plant Systems Step**
   - Use BulkMappingTable
   - AI suggest for system mappings
   - Educational header

3. **Map Assets to Plant Tags Step (Optional)**
   - Use BulkMappingTable
   - Filter tags by process unit
   - Show existing mappings

4. **Backend API Integration**
   - Connect all "TODO" stubs to real API endpoints
   - Error handling
   - Loading states
   - Retry logic

5. **TenantContext Updates**
   - Add `siteOnboardingComplete` flag
   - Add `currentSiteId` to context
   - Fetch site onboarding status on load

### Medium Priority

6. **Site Selection**
   - If user has multiple sites, show site selector
   - Store selected site in context
   - Switch between sites

7. **Onboarding Progress Persistence**
   - Save step completion to backend
   - Resume from last incomplete step
   - Show progress in Site Management

8. **AI Gateway Prompt Templates**
   - Refine prompts for tag cleaning
   - Refine prompts for asset mapping suggestions
   - Add structured output schemas

9. **Validation & Error Handling**
   - Duplicate process unit codes
   - Duplicate tag names within unit
   - Asset mapping conflicts
   - CSV format validation

### Low Priority

10. **Onboarding Analytics**
    - Track time to complete each step
    - Identify drop-off points
    - Usage of AI-assist features

11. **Bulk Edit/Delete**
    - Edit multiple process units at once
    - Delete with cascade warnings
    - Undo/redo

12. **Export/Import**
    - Export site configuration as JSON
    - Import from another site (templates)

---

## 🧪 Testing

### Playwright Test IDs

All components include `data-testid` attributes:

```typescript
// Onboarding flow
'onboarding-step-{step-id}'
'onboarding-finish'
'save-and-continue'

// Process Units
'step-process-units'
'add-first-process-unit'
'input-unit-code'
'input-unit-name'
'save-unit'

// Plant Tags
'step-plant-tags'
'upload-csv-option'
'manual-entry-option'
'ai-cleanup-tags'
'apply-ai-suggestions'

// Bulk Mapping
'bulk-mapping-table'
'mapping-search'
'mapping-type-filter'
'ai-suggest-mappings'
'mapping-row-{item-id}'
'mapping-{item-id}-{target-id}'

// Empty States
'empty-state-process-units'
'empty-state-plant-tags'
'empty-state-unmapped-assets'
'action-create-process-units'
```

### Test Scenarios

1. **Complete Onboarding Flow**
   - Create process units
   - Add plant tags via CSV
   - Use AI to clean tags
   - Map assets to process units with AI suggestions
   - Verify all steps marked complete
   - Click "Complete Setup"

2. **Partial Onboarding**
   - Complete only required steps
   - Skip optional steps
   - Verify can finish early

3. **Navigation Between Steps**
   - Complete step 1
   - Navigate to step 3
   - Navigate back to step 1
   - Verify state is preserved

4. **AI Suggestions**
   - Add malformed tags
   - Click "AI: Clean & Label Tags"
   - Review suggestions
   - Apply all suggestions
   - Verify tags updated

5. **Bulk Mapping**
   - Select multiple process units for one asset
   - Use "Select All" for a column
   - Search and filter assets
   - Verify mappings saved correctly

---

## 📚 References

- [Backend Data Model](/docs/backend-data-model.md)
- [AI Gateway Documentation](/supabase/functions/ai_gateway/README.md)
- [Tenant Context Guide](/docs/tenant-context.md)
- [RLS Policies](/docs/rls-policies.md)

---

**Status:** Core components implemented, backend integration pending  
**Last Updated:** December 26, 2024
