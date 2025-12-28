# Prompt 4 Complete — Foundation Mode UI Design

**Date:** 2025-12-26  
**Status:** ✅ COMPLETE  
**Scope:** Foundation Mode visual states using OT Continuum design system

---

## What Was Done

Designed comprehensive Foundation Mode UI states that clearly communicate "intentionally disabled, not broken" using OT Continuum industrial styling.

### Components Created

#### 1. **FoundationModeBanner** (`/components/onboarding/FoundationModeBanner.tsx`)
Global system-level banner displayed at top of onboarding:
- **Dark surface background** with yellow left border (4px)
- **HardDrive icon** in yellow (#FFCC00)
- **Clear messaging:** "Foundation Mode — saving is temporarily disabled while backend activation completes."
- **Status badge:** "System Initializing" (processing state)
- **Optional details section** explaining what users can/cannot do
- **Accessible:** `role="alert"`, `aria-live="polite"`

#### 2. **DisabledTooltip** (`/components/onboarding/shared/DisabledTooltip.tsx`)
Contextual tooltip for disabled actions:
- **Appears on hover** over disabled buttons
- **Yellow border** with elevated surface background
- **Info icon** (#FFCC00) with explanation text
- **Positioning:** Bottom-full, centered, with arrow pointer
- **Clear messaging:** "Action Unavailable" + reason
- **Auto-hide on mouse leave** (unless `alwaysVisible` prop)

#### 3. **FoundationModeButton** (`/components/onboarding/shared/FoundationModeButton.tsx`)
Smart button wrapper that handles Foundation Mode:
- **Automatic disabled state** when `foundationMode={true}`
- **Tooltip integration** (wraps button with DisabledTooltip)
- **Supports all variants:** primary, secondary, success, danger
- **Visual state:** Reduced opacity (50%) when disabled
- **Clear affordance:** Tooltip explains why action unavailable
- **Data attribute:** `data-foundation-mode="true"` for testing

#### 4. **StepIndicator** (`/components/onboarding/shared/StepIndicator.tsx`)
Step navigation with Foundation Mode support:
- **Lock icon overlay** when in Foundation Mode (small, top-right of step icon)
- **"Read-only" badge** displayed next to step title
- **Reduced opacity** (70%) to indicate non-interactive state
- **Cursor changes:** `cursor-default` when disabled
- **Aria attributes:** `aria-disabled="true"` for accessibility
- **Three states:**
  - Completed: Green checkmark
  - Current: Yellow filled circle
  - Future: Gray outline circle

#### 5. **StepFooter (Enhanced)** (`/components/onboarding/shared/StepFooter.tsx`)
Updated with Foundation Mode support:
- **New props:** `foundationMode`, `foundationModeMessage`
- **Automatic tooltip wrapping** for primary action when Foundation Mode active
- **Data attribute:** `data-foundation-mode` on buttons
- **Backward compatible:** Works without Foundation Mode props

---

## Visual Design Specifications

### Foundation Mode Banner
```css
Background: rgba(255, 204, 0, 0.05)  /* Primary muted */
Border-Left: 4px solid #FFCC00       /* Primary yellow */
Icon Color: #FFCC00                  /* Primary yellow */
Text Color: #FFFFFF (primary), #CCCCCC (secondary), #999999 (tertiary)
Padding: 24px horizontal, 16px vertical
```

### Disabled Button State
```css
Opacity: 0.5                         /* Clearly disabled */
Cursor: not-allowed                  /* System cursor feedback */
Background: #FFCC00 (primary button) /* Retains color */
Border: Same as enabled state        /* Maintains structure */
Pointer Events: none (when disabled) /* No click feedback */
```

### Tooltip
```css
Background: var(--color-bg-elevated-2)  /* #2A2A2A */
Border: 1px solid #FFCC00               /* Yellow accent */
Shadow: var(--shadow-primary-strong)    /* Yellow glow */
Text: #FFFFFF (title), #CCCCCC (body)
Min-Width: 280px
Max-Width: 320px
Padding: 12px 16px
```

### Step Indicator (Read-Only)
```css
Opacity: 0.7                         /* Dimmed */
Lock Icon: 12px × 12px               /* Small overlay */
Lock Background: var(--color-bg-elevated-2)
Lock Border: 1px solid var(--color-border-default)
Badge: "Read-only" (neutral badge)
```

---

## User Experience Flow

### 1. User Enters Onboarding (Foundation Mode Active)
```
┌─────────────────────────────────────────────────────────────┐
│ 🖥️ Foundation Mode — saving is temporarily disabled        │
│    while backend activation completes.                      │
│                                    [System Initializing]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌───────────────────────────────────────────┐
│ 🔒 Steps    │  │ Step Content                              │
│             │  │                                           │
│ ① Setup  🔓 │  │ [Form fields are read-only]               │
│ ② Upload 🔓 │  │                                           │
│ ③ Review 🔓 │  │ [Save & Continue] ← Hover shows tooltip   │
└─────────────┘  └───────────────────────────────────────────┘
```

### 2. User Hovers Over Disabled Action
```
                    ┌─────────────────────────────┐
                    │ ℹ️ Action Unavailable       │
                    │                             │
                    │ This action is disabled in  │
                    │ Foundation Mode while       │
                    │ backend services activate.  │
                    └──────────────▼──────────────┘
                    
                    [ Save & Continue ] ← Disabled
                      (Yellow, 50% opacity)
```

### 3. Backend Activates → Foundation Mode Disabled
```
Banner disappears automatically
Buttons become fully enabled (100% opacity)
Step indicators become interactive
Lock icons removed
Tooltips no longer appear
```

---

## Component Usage Examples

### Example 1: Adding Foundation Mode Banner
```tsx
import { FoundationModeBanner } from '../components/onboarding/FoundationModeBanner';

function OnboardingPage({ foundationMode }) {
  return (
    <div>
      {foundationMode && (
        <FoundationModeBanner showDetails={true} />
      )}
      {/* Rest of page */}
    </div>
  );
}
```

### Example 2: Foundation Mode Button
```tsx
import { FoundationModeButton } from '../components/onboarding/shared';

<FoundationModeButton
  label="Save & Continue"
  onClick={handleSave}
  foundationMode={isFoundationMode}
  variant="primary"
  icon={<Save className="w-5 h-5" />}
  testId="save-button"
/>
```

### Example 3: Step Indicator with Foundation Mode
```tsx
import { StepIndicator } from '../components/onboarding/shared';

<StepIndicator
  title="Configure Settings"
  stepNumber={1}
  totalSteps={3}
  isCurrent={true}
  isCompleted={false}
  isRequired={true}
  foundationMode={isFoundationMode}
  onClick={() => setCurrentStep(0)}
  testId="step-1"
/>
```

### Example 4: StepFooter with Foundation Mode
```tsx
import { StepFooter } from '../components/onboarding/shared';

<StepFooter
  statusMessage="3 items configured"
  foundationMode={isFoundationMode}
  primaryAction={{
    label: 'Save & Continue',
    onClick: handleSave,
    disabled: false,
    loading: isSaving,
    testId: 'save-button'
  }}
/>
```

---

## Design Philosophy

### "Intentionally Disabled" Not "Broken"

#### ❌ Bad UX (Appears Broken)
- Gray buttons with no explanation
- Silent failures on click
- Missing visual feedback
- User thinks: "Is this a bug?"

#### ✅ Good UX (Intentionally Disabled)
- Yellow buttons with reduced opacity (maintains brand identity)
- Tooltips on hover explaining why action unavailable
- Clear banner explaining system state
- User thinks: "I understand, I'll wait for activation"

---

## Accessibility

### Keyboard Navigation
- Disabled buttons still focusable (for screen readers)
- `aria-disabled="true"` on disabled elements
- Tooltips visible on focus (not just hover)
- Tab order preserved

### Screen Readers
- Banner has `role="alert"` and `aria-live="polite"`
- Tooltips have `role="tooltip"`
- Disabled actions announced as "disabled" with reason
- Step indicators announce read-only state

### Color Contrast
- Yellow (#FFCC00) on black (#000000): 14.1:1 (WCAG AAA)
- White text (#FFFFFF) on elevated surface (#2A2A2A): 12.6:1 (WCAG AAA)
- All text meets WCAG AA standards

---

## Testing Checklist

### Visual States
- [ ] Foundation Mode banner displays at top
- [ ] Yellow left border (4px) visible
- [ ] HardDrive icon displays in yellow
- [ ] "System Initializing" badge shows processing state
- [ ] Buttons show 50% opacity when disabled
- [ ] Lock icons appear on step indicators
- [ ] "Read-only" badges visible on steps

### Interaction
- [ ] Hovering disabled button shows tooltip
- [ ] Tooltip disappears on mouse leave
- [ ] Tooltip arrow points to button
- [ ] Clicking disabled button does nothing
- [ ] Cursor changes to `not-allowed`
- [ ] Step indicators not clickable when Foundation Mode active

### Accessibility
- [ ] Screen reader announces banner message
- [ ] Disabled actions announced with reason
- [ ] Keyboard navigation works (tab through disabled elements)
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG AA

### State Transitions
- [ ] Banner appears when Foundation Mode activates
- [ ] Banner disappears when Foundation Mode deactivates
- [ ] Buttons enable/disable smoothly (opacity transition)
- [ ] Lock icons appear/disappear on step indicators
- [ ] No layout shift when toggling modes

---

## Demo Page

**File:** `/pages/FoundationModeDemo.tsx`

Interactive demonstration showing:
1. Toggle switch to enable/disable Foundation Mode
2. All component states (buttons, inputs, tables, steps)
3. Tooltip interactions
4. Banner with full details
5. Read-only form fields

**How to view:**
```tsx
// Add route in App.tsx or navigate to:
import FoundationModeDemo from './pages/FoundationModeDemo';
```

---

## Integration Guide

### Step 1: Add Foundation Mode State
```tsx
const [foundationMode, setFoundationMode] = useState(true);

// Listen for backend activation event
useEffect(() => {
  const checkBackendStatus = async () => {
    const isActive = await checkIfBackendActive();
    setFoundationMode(!isActive);
  };
  
  const interval = setInterval(checkBackendStatus, 5000);
  return () => clearInterval(interval);
}, []);
```

### Step 2: Add Banner to Layout
```tsx
{foundationMode && <FoundationModeBanner showDetails={true} />}
```

### Step 3: Update All Primary Actions
```tsx
// Before:
<button onClick={handleSave} className="btn-primary">
  Save & Continue
</button>

// After:
<FoundationModeButton
  label="Save & Continue"
  onClick={handleSave}
  foundationMode={foundationMode}
  variant="primary"
/>
```

### Step 4: Update Step Indicators
```tsx
<StepIndicator
  {...stepProps}
  foundationMode={foundationMode}
/>
```

### Step 5: Update StepFooter
```tsx
<StepFooter
  {...footerProps}
  foundationMode={foundationMode}
/>
```

---

## Next Steps

### Recommended Actions:
1. **Backend Integration:** Connect `foundationMode` state to actual backend status
2. **E2E Testing:** Test full user flow with Foundation Mode toggle
3. **Documentation:** Update user docs explaining Foundation Mode
4. **Analytics:** Track how often users encounter Foundation Mode
5. **Performance:** Ensure tooltip rendering doesn't cause jank

### Future Enhancements:
- **Progress indicator** showing backend activation progress (0-100%)
- **Estimated time remaining** until activation complete
- **Auto-refresh** when backend becomes available
- **Toast notification** when Foundation Mode exits

---

## Files Created/Modified

```
/components/onboarding/FoundationModeBanner.tsx         (CREATED)
/components/onboarding/shared/DisabledTooltip.tsx       (CREATED)
/components/onboarding/shared/FoundationModeButton.tsx  (CREATED)
/components/onboarding/shared/StepIndicator.tsx         (CREATED)
/components/onboarding/shared/StepFooter.tsx            (UPDATED)
/components/onboarding/shared/index.ts                  (UPDATED)
/pages/FoundationModeDemo.tsx                           (CREATED)
```

---

## Summary

Foundation Mode UI successfully designed with:

✅ **Clear Communication:** Banner explains system state  
✅ **Contextual Help:** Tooltips explain why actions disabled  
✅ **Industrial Aesthetic:** Yellow accent, black background, precise spacing  
✅ **Accessibility:** ARIA attributes, keyboard navigation, high contrast  
✅ **User Trust:** "Intentionally disabled" not "broken"  
✅ **Reusability:** Components work across all onboarding steps  

**Status:** DESIGN COMPLETE ✓  
**Ready for:** Backend integration and E2E testing

