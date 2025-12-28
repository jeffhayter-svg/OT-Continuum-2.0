# Developer Handoff Quick Start

**Version:** 1.0.0  
**Status:** 🔒 Design Frozen  
**Target:** Engineering Team  
**Last Updated:** December 26, 2024

---

## 🚀 GET STARTED IN 5 MINUTES

### Step 1: Read the Design Freeze Document (10 min)

**Start here:** [`/ONBOARDING_V1_DESIGN_FREEZE.md`](/ONBOARDING_V1_DESIGN_FREEZE.md)

This is the **authoritative reference** for Onboarding v1.0.0. It contains:
- Complete component inventory
- API contracts
- Test ID catalog
- Accessibility requirements
- Backend integration points

---

### Step 2: Understand the Flow (5 min)

**7-Step Onboarding Sequence:**

```
1. Create Site
   ↓
2. Process Units (functional production areas)
   ↓
3. Plant Tags (instrumentation identifiers)
   ↓
4. OT Asset Ledger (inventory import)
   ↓
5. Map to Plant Systems (DCS, PLC, SCADA)
   ↓
6. Map to Process Units (asset assignments)
   ↓
7. Completion (summary + next steps)
```

**Data Relationships:**
```
Tenant (1) → Sites (many)
  └─ Site (1) → Process Units (many)
       └─ Process Unit (1) → Plant Tags (many)
  
  └─ Site (1) → OT Assets (many)
       └─ Asset (many) ↔ Plant Systems (many)
       └─ Asset (many) ↔ Process Units (many)
       └─ Asset (many) ↔ Plant Tags (many)
```

---

### Step 3: Review Component Library (15 min)

**8 Shared Reusable Components:**

| Component | File | Use Cases |
|-----------|------|-----------|
| StepHeader | `shared/StepHeader.tsx` | Info panels, educational headers |
| EmptyState | `shared/EmptyState.tsx` | No-data states, empty tables |
| DataTable | `shared/DataTable.tsx` | Tabular data, risk register, asset lists |
| AiAssistButton | `shared/AiAssistButton.tsx` | AI feature triggers |
| AiSuggestionsPanel | `shared/AiSuggestionsPanel.tsx` | AI results display |
| FormSection | `shared/FormSection.tsx` | Form grouping |
| StepFooter | `shared/StepFooter.tsx` | Wizard navigation |
| BulkMappingTable | `shared/BulkMappingTable.tsx` | Many-to-many mappings |

**Full API contracts:** See `/ONBOARDING_V1_DESIGN_FREEZE.md` § Component API Contracts

---

### Step 4: Set Up Backend (30 min)

**Required API Endpoints:**

#### 1. Create Site
```
POST /api/sites
Body: { tenant_id, name, description }
Returns: { site_id, name, created_at }
```

#### 2. Create Process Units
```
POST /api/sites/{site_id}/process-units
Body: { units: [{ code, name, description }] }
Returns: { created: number, process_units: [...] }
```

#### 3. Create Plant Tags
```
POST /api/sites/{site_id}/plant-tags
Body: { tags: [{ tag_name, description, process_unit_id, ... }] }
Returns: { created: number, plant_tags: [...] }
```

#### 4. Create OT Assets
```
POST /api/sites/{site_id}/ot-assets
Body: { assets: [{ asset_name, asset_type, vendor, model, ... }] }
Returns: { created: number, ot_assets: [...] }
```

#### 5. Create Mappings (Plant Systems)
```
POST /api/sites/{site_id}/mappings/plant-systems
Body: { mappings: [{ ot_asset_id, plant_system_id }] }
Returns: { created: number }
```

#### 6. Create Mappings (Process Units)
```
POST /api/sites/{site_id}/mappings/process-units
Body: { mappings: [{ ot_asset_id, process_unit_id }] }
Returns: { created: number }
```

#### 7. Create Mappings (Plant Tags)
```
POST /api/sites/{site_id}/mappings/plant-tags
Body: { mappings: [{ ot_asset_id, plant_tag_id }] }
Returns: { created: number }
```

**Full API specs:** See `/ONBOARDING_V1_DESIGN_FREEZE.md` § Backend Integration Points

---

### Step 5: Run the Tests (5 min)

**Playwright Tests:**

```bash
# Run smoke tests
npm run test:e2e

# Run onboarding-specific tests
npx playwright test playwright/onboarding.spec.ts

# Debug mode
npx playwright test --debug
```

**Test IDs to verify:**
- `create-site-step`
- `process-units-step`
- `plant-tags-step`
- `asset-ledger-step`
- `completion-step`

**Full test ID catalog:** See `/ONBOARDING_V1_DESIGN_FREEZE.md` § Test ID Catalog

---

## 🎨 DESIGN SYSTEM QUICK REFERENCE

### Color Palette

```css
--ot-black: #000000   /* Background */
--ot-white: #FFFFFF   /* Primary text */
--ot-gray: #CCCCCC    /* Secondary text */
--ot-yellow: #FFCC00  /* Accent */
--ot-green: #44FF44   /* Success */
--ot-red: #FF4444     /* Error */
```

**DO:**
- Use design tokens: `var(--ot-yellow)`
- Use utility classes: `.text-accent`, `.bg-success`
- Use component classes: `.btn-primary`, `.alert-error`

**DON'T:**
- Hardcode colors: `color: #FFCC00` ❌
- Use blue (not in palette): `bg-blue-500` ❌
- Use uppercase buttons: `text-transform: uppercase` ❌

---

### Typography

```css
H1: 24px, bold, uppercase
H2: 18px, semibold, sentence case
H3: 16px, semibold, sentence case
Body: 14px, regular
Small: 12px, regular

Buttons: 14px, bold, sentence case
Table headers: 12px, bold, sentence case
```

**DO:**
- Use semantic HTML: `<h1>`, `<h2>`, `<p>`
- Rely on global typography styles
- Use sentence case for buttons/tables

**DON'T:**
- Override font sizes unnecessarily
- Use uppercase for workflow buttons
- Use uppercase for table headers

---

### Spacing

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
```

**Use Tailwind utilities:**
- `gap-3` = 12px
- `p-4` = 16px
- `mt-6` = 24px

---

## 🧩 COMPONENT USAGE EXAMPLES

### Example 1: Display Empty State

```tsx
import { EmptyState } from './components/onboarding/shared';
import { AlertTriangle } from 'lucide-react';

<EmptyState
  icon={AlertTriangle}
  title="No risks detected"
  description="Your systems are operating within normal parameters."
  primaryAction={{
    label: "View Historical Risks",
    onClick: () => navigate('/risks/history'),
    testId: "view-historical"
  }}
/>
```

---

### Example 2: Display Data Table

```tsx
import { DataTable } from './components/onboarding/shared';

<DataTable
  columns={[
    { key: 'asset_name', label: 'Asset Name', width: '30%' },
    { key: 'vendor', label: 'Vendor', width: '20%' },
    { key: 'model', label: 'Model', width: '20%' },
    { 
      key: 'status', 
      label: 'Status', 
      width: '15%',
      render: (value) => (
        <span className={`badge-${value === 'Online' ? 'success' : 'error'}`}>
          {value}
        </span>
      )
    }
  ]}
  data={assets}
  onRowClick={(asset) => navigate(`/assets/${asset.id}`)}
  testIdPrefix="asset-table"
/>
```

---

### Example 3: AI Feature with Suggestions

```tsx
import { AiAssistButton, AiSuggestionsPanel } from './components/onboarding/shared';

// Button
<AiAssistButton
  label="Analyze Risks"
  onClick={handleAnalyze}
  analysisType="Risk Correlation Analysis"
  scope={[
    'Analyzes 47 active risks',
    'Identifies common root causes',
    'Suggests preventive actions'
  ]}
  testId="analyze-risks"
/>

// Results Panel
{showResults && (
  <AiSuggestionsPanel
    title="Risk Correlation Findings (Pattern-Based)"
    description="Analysis identified 3 correlation clusters..."
    suggestions={suggestions}
    onApply={handleApply}
    onCancel={() => setShowResults(false)}
  />
)}
```

---

### Example 4: Form with Sections

```tsx
import { FormSection, FormField, FormInput } from './components/onboarding/shared';

<FormSection title="Asset Details">
  <FormField label="Asset Name" required>
    <FormInput 
      value={name} 
      onChange={(e) => setName(e.target.value)}
      testId="input-asset-name"
    />
  </FormField>
  
  <FormField label="IP Address" hint="IPv4 format">
    <FormInput 
      value={ip} 
      onChange={(e) => setIp(e.target.value)}
      error={!isValidIp(ip)}
    />
  </FormField>
</FormSection>
```

---

## 🧪 TESTING GUIDELINES

### Test ID Naming Convention

```
{component}-{element}-{identifier}

Examples:
- process-units-step
- input-site-name
- save-and-continue
- asset-table-row-0
- mapping-checkbox-asset1-unit2
```

### Playwright Test Structure

```typescript
test('should complete onboarding flow', async ({ page }) => {
  // Step 1: Create Site
  await page.goto('/onboarding');
  await page.getByTestId('create-first-plant').click();
  await page.getByTestId('input-site-name').fill('Test Refinery');
  await page.getByTestId('continue-button').click();
  
  // Step 2: Process Units
  await page.getByTestId('add-process-unit').click();
  await page.getByTestId('input-unit-code').fill('CDU-1');
  await page.getByTestId('input-unit-name').fill('Crude Distillation');
  await page.getByTestId('save-process-unit').click();
  await page.getByTestId('save-and-continue').click();
  
  // ... continue through flow
  
  // Step 7: Completion
  await expect(page.getByTestId('completion-step')).toBeVisible();
  await expect(page.getByText('Site Configuration Complete')).toBeVisible();
});
```

---

## ♿ ACCESSIBILITY REQUIREMENTS

### Minimum Requirements (WCAG AA)

**Color Contrast:**
- ✅ Text: 4.5:1 minimum
- ✅ Large text: 3:1 minimum
- ✅ UI components: 3:1 minimum

**Keyboard Navigation:**
- ✅ All interactive elements tabbable
- ✅ Visual focus indicators (yellow ring)
- ✅ Logical tab order
- ✅ Enter/Space activate buttons

**Screen Readers:**
- ✅ Semantic HTML elements
- ✅ Form labels associated
- ✅ Error messages linked
- ⚠️ ARIA labels (add where needed)

**Touch Targets:**
- ✅ Minimum 44x44px
- ✅ Adequate spacing between targets

### Testing Checklist

```bash
# Test keyboard navigation
- Tab through all interactive elements
- Verify focus indicators visible
- Verify logical tab order

# Test screen reader
- Run with NVDA/JAWS/VoiceOver
- Verify landmarks announced
- Verify form labels read
- Verify button purposes clear

# Test contrast
- Run axe DevTools
- Verify all text meets 4.5:1
- Verify all UI components meet 3:1
```

---

## 🔌 BACKEND INTEGRATION CHECKLIST

### Pre-Implementation

- [ ] Review API contracts in Design Freeze doc
- [ ] Confirm RLS policies enforce tenant isolation
- [ ] Verify foreign key constraints in database
- [ ] Test error response formats match spec

### During Implementation

- [ ] Implement all 7 required endpoints
- [ ] Add input validation (missing fields, duplicates)
- [ ] Enforce business rules (tag belongs to one process unit)
- [ ] Return consistent error responses
- [ ] Add request logging
- [ ] Write integration tests

### Testing

- [ ] Test happy path (all steps complete)
- [ ] Test validation errors (missing fields)
- [ ] Test constraint violations (duplicate names)
- [ ] Test unauthorized access (wrong tenant)
- [ ] Test CSV import with 100+ rows
- [ ] Test bulk mappings with 50x50 matrix

---

## 🐛 KNOWN ISSUES

### Must Fix Before Release

1. **PlantTagsStep - Blue Theme Remnants**
   - Status: Partially normalized
   - Fix: Convert to shared components
   - Priority: HIGH
   - ETA: Pre-release

2. **AI Gateway - Mock Implementation**
   - Status: Frontend uses setTimeout
   - Fix: Connect to deployed AI Gateway
   - Priority: HIGH
   - ETA: Pre-release

3. **CSV Parser - Basic**
   - Status: Simple string.split(',')
   - Fix: Use proper CSV parser (handles quotes)
   - Priority: MEDIUM
   - ETA: Pre-release

### Defer to v1.1

4. **Error Handling - Generic Alerts**
   - Status: Uses alert() dialogs
   - Fix: Toast notifications
   - Priority: MEDIUM
   - ETA: v1.1

5. **Mobile Responsiveness**
   - Status: Desktop/tablet optimized only
   - Fix: Mobile layouts for tables
   - Priority: LOW
   - ETA: v1.1

---

## 📚 ESSENTIAL READING

**Must Read (1 hour):**
1. [Onboarding v1 Design Freeze](/ONBOARDING_V1_DESIGN_FREEZE.md) - 30 min
2. [Component Reusability Guide](/COMPONENT_REUSABILITY_GUIDE.md) - 20 min
3. [AI Brand Voice Guidelines](/AI_BRAND_VOICE_GUIDELINES.md) - 10 min

**Reference (as needed):**
- [Design Token System](/DESIGN_TOKEN_SYSTEM.md)
- [Brand vs Usability Resolutions](/BRAND_VS_USABILITY_RESOLUTIONS.md)
- [Normalized Components Catalog](/NORMALIZED_COMPONENTS_CATALOG.md)

---

## 🚦 IMPLEMENTATION PHASES

### Phase 1: Core Flow (Week 1-2)
- [ ] Implement backend API endpoints
- [ ] Implement CreateSiteStep
- [ ] Implement ProcessUnitsStep
- [ ] Implement PlantTagsStep
- [ ] Implement AssetLedgerStep
- [ ] Basic validation and error handling

### Phase 2: Mappings (Week 3)
- [ ] Implement MapPlantSystemsStep
- [ ] Implement MapProcessUnitsStep
- [ ] Implement MapPlantTagsStep
- [ ] Bulk mapping validation
- [ ] CompletionStep

### Phase 3: Polish (Week 4)
- [ ] Connect AI Gateway
- [ ] Improve CSV parsing
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Accessibility audit
- [ ] Cross-browser testing

### Phase 4: Testing (Week 5)
- [ ] Write Playwright E2E tests
- [ ] Write unit tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit

---

## ✅ DEFINITION OF DONE

**A step is complete when:**

- [ ] Component matches design freeze spec
- [ ] Backend endpoint implemented and tested
- [ ] Frontend connected to real API (not mock)
- [ ] All test IDs present
- [ ] Playwright tests passing
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Code reviewed and approved
- [ ] Design review passed

---

## 🆘 GET HELP

**Questions about:**

- **Design decisions:** Review `/ONBOARDING_V1_DESIGN_FREEZE.md`
- **Component usage:** Review `/COMPONENT_REUSABILITY_GUIDE.md`
- **AI features:** Review `/AI_BRAND_VOICE_GUIDELINES.md`
- **Design tokens:** Review `/DESIGN_TOKEN_SYSTEM.md`
- **Backend:** Review `/BACKEND_AWARE_UX_IMPLEMENTATION.md`

**Still stuck?**
- Check `/TROUBLESHOOTING.md`
- File a GitHub issue with `[Onboarding]` tag
- Tag @design-lead for design questions
- Tag @backend-lead for API questions

---

## 🎯 SUCCESS METRICS

**We'll know we're successful when:**

1. ✅ Users can complete onboarding in <15 minutes
2. ✅ 90%+ onboarding completion rate
3. ✅ <5% error rate during onboarding
4. ✅ All Playwright tests passing
5. ✅ WCAG AA compliance verified
6. ✅ Zero production bugs in first 30 days

---

**Ready to build? Start with Phase 1: Core Flow. Good luck! 🚀**

**Status:** 🔒 Design Frozen v1.0.0  
**Last Updated:** December 26, 2024
