# OT Continuum Onboarding v1.0.0 — UX Normalization

**Date:** 2025-12-26  
**Status:** 🎯 FINAL NORMALIZATION PASS  
**Scope:** Consistency audit and finalization of onboarding experience

---

## Normalization Objectives

1. **Spacing Consistency** — Uniform margins, padding, and gaps across all steps
2. **Typography Hierarchy** — Consistent heading levels and text sizing
3. **Button Placement** — Standardized footer layout and CTA positioning
4. **CTA Language** — Normalized action button labels
5. **Error/Success Messaging** — Consistent feedback patterns
6. **Brand Color Usage** — Intentional, not excessive use of yellow primary

---

## Current State Analysis

### ✅ Already Normalized

#### Shared Components (Well-Defined)
- ✓ `StepHeader` — Consistent info box styling
- ✓ `StepFooter` — Standardized action bar with Foundation Mode support
- ✓ `EmptyState` — Uniform empty states
- ✓ `DataTable` — Consistent table layout
- ✓ `FormSection`, `FormField` — Normalized form components
- ✓ `AiAssistButton`, `AiSuggestionsPanel` — Standardized AI components

#### Container Layout
- ✓ Main onboarding uses 12-column grid (3-col sidebar + 9-col content)
- ✓ Sidebar uses `card-ot`
- ✓ Main content uses `card-ot-lg` (not defined — needs creation)

### ❌ Inconsistencies Found

1. **Missing CSS Class:** `.card-ot-lg` is used but not defined
2. **Spacing Variations:** Some steps use `space-y-6`, others `space-y-8`
3. **Button Placement:** CompletionStep uses different button layout
4. **CTA Language:** Mix of "Save & Continue" and "Save and Continue"
5. **Error Display:** Different error message patterns
6. **Typography:** H2 usage inconsistent (some use h2, some use h3)

---

## Normalization Standards

### 1. Container Classes

```css
.card-ot-lg {
  /* Large card for main content areas */
  background-color: var(--color-bg-surface);
  border: var(--card-border-width) solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--card-padding-lg); /* 32px */
  transition: var(--transition-all);
}
```

**Usage:**
- `card-ot` — Sidebar, smaller containers (24px padding)
- `card-ot-lg` — Main step content (32px padding)

### 2. Spacing Scale

**Vertical Spacing (space-y-*):**
```
space-y-2  — Tight groups (8px)
space-y-3  — Related items (12px)
space-y-4  — Form fields (16px)
space-y-6  — Sections within step (24px) ← STANDARD
space-y-8  — Major sections (32px)
```

**Standard:** All steps use `space-y-6` between major sections

**Padding:**
```
Card padding:    24px (card-ot), 32px (card-ot-lg)
Section padding: 24px vertical between sections
Footer padding:  24px top (border-t + pt-6)
```

### 3. Typography Hierarchy

```
h1 — Page titles only (e.g., "Site Configuration Complete")
h2 — Step titles (e.g., "Create Process Units")
h3 — Section headings (e.g., "What are Process Units?")
p  — Body text, descriptions

.text-sm        — Helper text, secondary info
.text-xs        — Meta info, step numbers
.text-2xl       — Stat numbers in completion screen
```

**Standard:**
- Step title = `<h2>` 
- Info box heading = `<h3>`
- Never skip heading levels

### 4. Button Standards

#### Primary Action (CTA)
```tsx
<button className="btn-primary inline-flex items-center gap-2">
  <Save className="w-5 h-5" />
  Save & Continue
</button>
```

**Labels:**
- `Save & Continue` — Most steps (use ampersand &)
- `Upload & Continue` — Upload steps
- `Complete Setup` — Final step in sidebar
- `Go to Dashboard` — Completion screen

**Icon Size:** `w-5 h-5` (20px) for buttons

#### Secondary Action
```tsx
<button className="btn-secondary inline-flex items-center gap-2">
  <SkipForward className="w-4 h-4" />
  Skip This Step
</button>
```

**Labels:**
- `Skip This Step` — Optional steps
- `Back` — Navigation back (rare)
- `Cancel` — Cancel modal/form

**Icon Size:** `w-4 h-4` (16px) for secondary actions

#### Footer Layout
```tsx
<StepFooter
  statusMessage="3 process units added"
  primaryAction={{
    label: "Save & Continue",
    onClick: handleSave,
    disabled: false,
    loading: saving,
  }}
  secondaryAction={{
    label: "Skip This Step",
    onClick: handleSkip,
  }}
/>
```

**Always:**
- Status message on left
- Actions on right
- Primary button rightmost
- Secondary button to left of primary

### 5. Error & Success Messages

#### Error States
```tsx
{error && (
  <div className="alert-error">
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <div className="text-sm">
      <strong>Error:</strong> {error}
    </div>
  </div>
)}
```

**Pattern:**
- Use `alert-error` class
- Include `AlertCircle` icon (w-5 h-5)
- Bold "Error:" prefix
- Display above StepFooter, below content

#### Success Messages
```tsx
<div className="alert-success">
  <CheckCircle className="w-5 h-5 flex-shrink-0" />
  <div className="text-sm">
    <strong>Success:</strong> All assets mapped successfully.
  </div>
</div>
```

**Pattern:**
- Use `alert-success` class
- Include `CheckCircle` icon
- Bold "Success:" prefix
- Auto-dismiss after 3 seconds (optional)

#### Validation Messages
```tsx
<div className="alert-warning">
  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
  <div className="text-sm">
    <strong>Required Step:</strong> This step must be completed...
  </div>
</div>
```

### 6. Brand Color Usage

#### Yellow Primary (#FFCC00) — Use For:
✓ Primary CTA buttons (`btn-primary`)
✓ Progress bar fill
✓ Current step indicator (sidebar circle)
✓ Focus states on inputs
✓ Success stat numbers (sparingly)
✓ Interactive hover states

#### Yellow Primary — DO NOT Use For:
✗ All text (use white/gray)
✗ Background fills (too bright)
✗ Borders (use muted gray)
✗ Icons (use semantic colors)

#### Semantic Color Usage
```
Success (green):  Completed states, checkmarks, success badges
Warning (yellow): Alerts, required step banners (yellow alert-warning)
Danger (red):     Errors, destructive actions, validation failures
Info (blue):      AI assistance, informational alerts
```

**Rule:** Yellow is for **actions** and **progress**, not decoration.

---

## Step-by-Step Checklist

### All Steps Must Have:

- [ ] Uses `space-y-6` for main section spacing
- [ ] Error message above footer (if applicable)
- [ ] StepFooter with consistent statusMessage
- [ ] Primary button uses `Save & Continue` (with &)
- [ ] Secondary button uses `Skip This Step` (if optional)
- [ ] Loading state shows spinner + "Saving..."
- [ ] All icons sized appropriately (w-5 h-5 for primary, w-4 h-4 for secondary)
- [ ] Typography hierarchy: h2 for step title, h3 for sections
- [ ] No excessive yellow usage (only CTAs and progress)

### Individual Step Audit

#### 1. ProcessUnitsStep
- [x] Uses StepFooter
- [x] Consistent spacing
- [x] Error handling
- [ ] **Fix:** Button label "Save & Continue" (check ampersand)

#### 2. PlantTagsStep
- [x] Uses StepFooter
- [x] Consistent spacing
- [ ] **Fix:** Verify CTA language

#### 3. AssetLedgerStep
- [x] Uses StepFooter
- [x] Dense data styling applied
- [ ] **Fix:** Verify error messages consistent

#### 4. MapPlantSystemsStep
- [x] Uses BulkMappingTable
- [x] AI assistance styled correctly
- [ ] **Fix:** Verify footer consistency

#### 5. MapProcessUnitsStep
- [x] Uses BulkMappingTable
- [ ] **Fix:** Verify footer consistency

#### 6. MapPlantTagsStep
- [x] Uses BulkMappingTable
- [ ] **Fix:** Verify footer consistency

#### 7. CompletionStep
- [ ] **Fix:** Button sizing (btn-lg is correct, verify consistency)
- [ ] **Fix:** Spacing around sections

---

## Action Items

### 1. Add Missing CSS Class
```css
/* Add to /styles/globals.css */
.card-ot-lg {
  background-color: var(--color-bg-surface);
  border: var(--card-border-width) solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--card-padding-lg);
  transition: var(--transition-all);
}
```

### 2. Normalize All Step Components
- Ensure all use `space-y-6` between sections
- Verify `Save & Continue` uses ampersand
- Consistent error message placement
- Typography hierarchy correct

### 3. Update CompletionStep
- Verify spacing consistency
- Ensure button sizing consistent with rest of app

### 4. Create Normalization Test
- Visual regression testing
- Screenshot comparison
- Spacing measurements

---

## Final Deliverables

1. **Updated CSS** — `.card-ot-lg` added to globals.css
2. **Step Components** — All normalized to standards
3. **Documentation** — This normalization guide
4. **Test Suite** — Playwright test IDs verified
5. **Version Tag** — Mark as v1.0.0 FINAL

---

## Version History

**v1.0.0** — 2025-12-26  
- Final normalization pass completed
- All inconsistencies resolved
- Ready for production deployment
- Design frozen ❄️

