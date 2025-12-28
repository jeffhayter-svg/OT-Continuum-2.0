# OT Continuum Design System Migration Status

**Date:** December 26, 2024  
**Goal:** Apply black/yellow OT Continuum branding to all pages

---

## ✅ COMPLETED

### Main Application
- [x] **App.tsx** - Fully updated with OT Continuum design system
  - Black background (`bg-ot-black`)
  - Yellow accents (`btn-hero`, yellow focus rings)
  - White text on dark cards
  - Design token usage throughout
  - Login page with `.btn-hero` (uppercase yellow button)
  - Dashboard with dark theme cards

### Site Management
- [x] **pages/SiteManagement.tsx** - Fully updated
  - Dark theme cards (`.card-ot`)
  - Yellow progress bars
  - Green/yellow status badges
  - Design tokens for all colors and spacing
  - Consistent button styles

### Onboarding Components (Already Complete - Previous Prompts)
- [x] **CreateSiteStep.tsx** - Uses design tokens
- [x] **ProcessUnitsStep.tsx** - Gold standard implementation
- [x] **CompletionStep.tsx** - Uses design tokens
- [x] **Shared components** - All use design tokens
  - StepHeader
  - EmptyState
  - DataTable
  - AiAssistButton
  - AiSuggestionsPanel
  - FormSection
  - StepFooter
  - BulkMappingTable

---

## ⚠️ PARTIALLY UPDATED (Needs Work)

### Onboarding Steps
- [ ] **PlantTagsStep.tsx** - Still has blue theme remnants (identified in Prompt 7)
- [ ] **AssetLedgerStep.tsx** - Needs normalization to shared components
- [ ] **MapPlantSystemsStep.tsx** - Verify design token usage
- [ ] **MapProcessUnitsStep.tsx** - Verify design token usage
- [ ] **MapPlantTagsStep.tsx** - Verify design token usage

---

## ❌ NOT YET UPDATED (Debug/Support Components)

### Debug Panels (Low Priority - Dev Only)
- [ ] **components/AuthGate.tsx**
  - Line 31: `bg-gray-50` → `bg-ot-black`
  - Line 33: `text-blue-600` → `border-ot-yellow`
  - Line 58: `bg-gray-50` → `bg-ot-black`

- [ ] **components/DevDiagnostics.tsx**
  - Line 78: `bg-gray-50` → `bg-elevated-1`
  - Line 109: `bg-blue-50` → `bg-elevated-1`
  - Line 112: `text-blue-600` → `text-accent`
  - Line 213: `bg-gray-50` → `bg-elevated-1`

- [ ] **components/RequireRole.tsx**
  - Line 49: `bg-gray-50` → `bg-ot-black`
  - Line 64: `bg-blue-600` → `btn-primary`

- [ ] **components/AuthDebugPanel.tsx**
  - Multiple `bg-gray-50`, `bg-blue-100` references
  - Low priority (debug only)

- [ ] **components/RlsDebugPanel.tsx**
  - Multiple `bg-gray-50`, `bg-blue-100` references
  - Low priority (debug only)

- [ ] **components/ExampleDbOperations.tsx**
  - Line 209: `bg-blue-600` → `btn-primary`
  - Line 265: `bg-gray-50` → `bg-elevated-1`

- [ ] **components/OnboardingFlowDiagram.tsx**
  - Multiple blue references
  - Documentation component only

### Pages (Keep Current or Skip)
- [ ] **pages/TenantResolver.tsx** - Complex, critical flow - keep current
- [ ] **pages/AdminDiagnostics.tsx** - Admin only - low priority

### Workflow Pages (Legacy MS2 - Lower Priority)
- [ ] **packages/web/src/pages/SignalIngestion.tsx**
- [ ] **packages/web/src/pages/SignalClassification.tsx**
- [ ] **packages/web/src/pages/SignalCorrelation.tsx**
- [ ] **packages/web/src/pages/RiskRegister.tsx**
- [ ] **packages/web/src/pages/RiskDecision.tsx**
- [ ] **packages/web/src/pages/ExecutionTracking.tsx**
- [ ] **packages/web/src/pages/RiskAdjustment.tsx**
- [ ] **pages/WorkOrdersPage.tsx**

---

## 📊 MIGRATION SUMMARY

### By Priority

**HIGH PRIORITY (User-Facing):**
- ✅ App.tsx (login + dashboard)
- ✅ SiteManagement.tsx
- ✅ Onboarding shared components
- ⚠️ PlantTagsStep.tsx
- ⚠️ AssetLedgerStep.tsx

**MEDIUM PRIORITY (Onboarding Flow):**
- ⚠️ MapPlantSystemsStep.tsx
- ⚠️ MapProcessUnitsStep.tsx
- ⚠️ MapPlantTagsStep.tsx

**LOW PRIORITY (Debug/Dev Only):**
- ❌ All debug panels
- ❌ Example components
- ❌ Diagram components

**DEFERRED (Legacy MS2 Workflows):**
- ❌ All MS2 workflow pages (will update in future sprint)

---

## 🎯 NEXT STEPS

### Immediate (Complete Onboarding v1.0.0)

1. **PlantTagsStep.tsx** - Remove blue theme, use shared components
2. **AssetLedgerStep.tsx** - Normalize to design tokens
3. **Mapping Steps** - Verify all use design tokens

### Short-term (Nice to Have)

4. Update debug panels (AuthGate, DevDiagnostics, RequireRole)
5. Visual smoke test of entire onboarding flow

### Long-term (Future Sprint)

6. Update all MS2 workflow pages (Signal Ingestion through Work Orders)
7. Create dark theme variants for all legacy components

---

## 🧪 TESTING CHECKLIST

**After migration, verify:**

- [ ] Login page shows yellow `SIGN IN` button (uppercase)
- [ ] Dashboard shows black background with yellow accents
- [ ] Site Management cards are dark with yellow highlights
- [ ] Onboarding flow uses consistent dark theme
- [ ] All buttons use `.btn-primary`, `.btn-secondary`, `.btn-hero`
- [ ] All inputs use `.input-ot` class
- [ ] All cards use `.card-ot` class
- [ ] Focus rings are yellow (`--ot-yellow`)
- [ ] No blue theme remnants (`bg-blue-`, `text-blue-`, `border-blue-`)
- [ ] No gray backgrounds (`bg-gray-50` → `bg-ot-black`)

---

## 💡 QUICK REFERENCE

### Common Replacements

```tsx
// OLD (Blue Theme)
className="bg-gray-50"           → className="bg-ot-black"
className="bg-blue-600"          → className="btn-primary"
className="bg-white"             → className="card-ot"
className="text-gray-600"        → style={{ color: 'var(--color-text-secondary)' }}
className="border-blue-500"      → style={{ border: '1px solid var(--ot-yellow)' }}
className="focus:ring-blue-500"  → className="input-ot" (has yellow focus)

// NEW (OT Continuum)
<div className="bg-ot-black">              // Black background
<div className="card-ot">                  // Dark card (#1A1A1A)
<button className="btn-primary">           // Yellow button
<button className="btn-hero">              // Uppercase yellow button
<input className="input-ot">               // Input with yellow focus
<div className="badge-success">            // Green badge
<div className="badge-warning">            // Yellow badge
<div className="badge-error">              // Red badge
```

### Design Tokens

```css
/* Colors */
--ot-black: #000000
--ot-white: #FFFFFF
--ot-yellow: #FFCC00
--ot-green: #44FF44
--ot-red: #FF4444

/* Backgrounds */
--color-bg-primary: #000000
--color-bg-elevated-1: #1A1A1A

/* Text */
--color-text-primary: #FFFFFF
--color-text-secondary: #CCCCCC
--color-text-tertiary: rgba(204, 204, 204, 0.6)

/* Borders */
--color-border-default: rgba(255, 255, 255, 0.2)

/* Spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
```

---

## 🔗 REFERENCES

- [Design Token System](/DESIGN_TOKEN_SYSTEM.md)
- [Onboarding v1 Design Freeze](/ONBOARDING_V1_DESIGN_FREEZE.md)
- [Brand vs Usability Resolutions](/BRAND_VS_USABILITY_RESOLUTIONS.md)

---

**Current Status:** Main app and site management fully migrated ✅  
**Next:** Complete onboarding step normalization  
**Target:** All high-priority pages using OT Continuum design system by v1.0.0 release
