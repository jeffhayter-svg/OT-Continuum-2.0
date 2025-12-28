# OT Continuum Onboarding — Quick Reference Card

**v1.0.0 FINAL** | Design Frozen ❄️

---

## Standard Patterns

### Container
```tsx
<div className="space-y-6" data-testid="step-name">
  {/* sections */}
</div>
```

### Footer
```tsx
<StepFooter
  statusMessage="X items added"
  primaryAction={{
    label: "Save & Continue",
    onClick: handleSave,
    disabled: false,
    loading: saving,
  }}
  secondaryAction={{
    label: "Skip This Step",
    onClick: onSkip,
  }}
/>
```

### Error
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

---

## CSS Classes

### Containers
```css
.card-ot      /* 24px padding — sidebar */
.card-ot-lg   /* 32px padding — main content */
```

### Buttons
```css
.btn-primary    /* Yellow #FFCC00 — CTAs */
.btn-secondary  /* Outline — alternate actions */
.btn-success    /* Green #44FF44 — completion */
.btn-ai         /* Blue #44CCFF — AI suggestions */
```

### Alerts
```css
.alert-error    /* Red border, icon, bold prefix */
.alert-success  /* Green border, icon, bold prefix */
.alert-warning  /* Yellow border, icon, bold prefix */
.alert-info     /* Blue border, icon, bold prefix */
```

### Spacing
```css
space-y-6   /* 24px — STANDARD for sections */
space-y-4   /* 16px — form fields */
space-y-3   /* 12px — related items */
gap-3       /* 12px — button gaps */
```

---

## Typography

```
h1  — Page titles (text-2xl, 24px)
h2  — Step titles (text-xl, 20px)
h3  — Sections (text-lg, 18px)
p   — Body (text-sm, 14px)
```

---

## Colors

### Use Yellow (#FFCC00) For:
```
✓ Primary buttons (btn-primary)
✓ Progress bar
✓ Current step indicator
✓ Input focus
```

### Don't Use Yellow For:
```
✗ Text
✗ Backgrounds
✗ Borders
✗ Decorations
```

### Semantic
```
Green #44FF44 — Success
Red #FF4444   — Errors
Blue #44CCFF  — AI/Info
Gray #CCCCCC  — Text
```

---

## Button Labels

```
Primary:
• Save & Continue (standard)
• Upload & Continue (upload steps)
• Complete Setup (final step)
• Go to Dashboard (completion)

Secondary:
• Skip This Step (optional)
• Cancel (dialogs)
• Review Setup (alternate)
```

---

## Icon Sizing

```
Primary buttons:  w-5 h-5  (20px)
Secondary:        w-4 h-4  (16px)
Alerts:           w-5 h-5  (20px)
```

---

## Test IDs

```tsx
data-testid="step-name"           // container
data-testid="save-and-continue"   // primary
data-testid="skip-this-step"      // secondary
data-testid="onboarding-step-{id}" // nav
```

---

**OT Continuum Onboarding v1.0.0**  
**Status: PRODUCTION READY ✓**

