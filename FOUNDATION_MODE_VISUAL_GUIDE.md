# Foundation Mode Visual Reference Guide

**OT Continuum Design System**  
**Version:** 1.0.0  
**Status:** Design Frozen ❄️

---

## Component Visual States

### 1. Foundation Mode Banner

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🖥️  Foundation Mode                          [System Initializing] ┃
┃     Saving is temporarily disabled while backend activation       ┃
┃     completes.                                                     ┃
┃                                                                    ┃
┃     What you can do:                                              ┃
┃     • Review the onboarding workflow                              ┃
┃     • Fill out forms and test the interface                       ┃
┃     • Understand data requirements                                ┃
┃                                                                    ┃
┃     What happens next:                                            ┃
┃     Once backend services are activated, all actions will be      ┃
┃     enabled automatically. No data loss will occur.               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   ▲
   └── 4px yellow (#FFCC00) left border
```

**CSS:**
```css
background: rgba(255, 204, 0, 0.05);
border-left: 4px solid #FFCC00;
padding: 24px;
```

---

### 2. Disabled Button with Tooltip

**Enabled State:**
```
┌──────────────────────┐
│ 💾 Save & Continue   │  ← Yellow (#FFCC00), 100% opacity
└──────────────────────┘
```

**Foundation Mode (Disabled):**
```
            ┌─────────────────────────────┐
            │ ℹ️ Action Unavailable       │
            │                             │
            │ This action is disabled in  │
            │ Foundation Mode while       │
            │ backend services activate.  │
            └──────────────▼──────────────┘
                           │
            ┌──────────────────────┐
            │ 💾 Save & Continue   │  ← Yellow (#FFCC00), 50% opacity
            └──────────────────────┘
                    ▲
                    └── Tooltip appears on hover
```

**CSS:**
```css
/* Disabled button */
opacity: 0.5;
cursor: not-allowed;
background: #FFCC00;  /* Maintains color */

/* Tooltip */
background: #2A2A2A;
border: 1px solid #FFCC00;
box-shadow: 0 8px 24px rgba(255, 204, 0, 0.3);
```

---

### 3. Step Indicators

**Normal Mode:**
```
┌──────────────────────────┐
│ ✓ Setup Configuration    │  ← Completed (green)
└──────────────────────────┘

┌──────────────────────────┐
│ ● Upload Data            │  ← Current (yellow filled)
└──────────────────────────┘

┌──────────────────────────┐
│ ○ Review & Confirm       │  ← Future (gray outline)
└──────────────────────────┘
```

**Foundation Mode (Read-Only):**
```
┌──────────────────────────┐
│ ✓🔒 Setup Configuration  │  ← Lock overlay, dimmed
│    [Read-only]           │
└──────────────────────────┘
     ▲
     └── Small lock icon (12×12px) top-right of checkmark
         Opacity: 70%
```

**CSS:**
```css
/* Read-only step */
opacity: 0.7;
cursor: default;

/* Lock icon */
position: absolute;
top: -4px;
right: -4px;
width: 12px;
height: 12px;
background: #2A2A2A;
border: 1px solid #333333;
border-radius: 50%;
```

---

### 4. Form Fields (Read-Only)

**Normal Mode:**
```
Site Name *
┌──────────────────────────────┐
│ Refinery Alpha               │  ← Editable, yellow focus ring
└──────────────────────────────┘
```

**Foundation Mode:**
```
Site Name *
┌──────────────────────────────┐
│ Refinery Alpha               │  ← Disabled, gray border
└──────────────────────────────┘
Read-only in Foundation Mode
```

**CSS:**
```css
/* Disabled input */
background: #1A1A1A;
border: 1px solid #333333;
color: #999999;
cursor: not-allowed;
opacity: 0.6;
```

---

### 5. Data Tables (Read-Only)

**Normal Mode:**
```
┌─────────┬──────────────┬────────┐
│ Code    │ Name         │ Status │
├─────────┼──────────────┼────────┤
│ PU-001  │ Unit Alpha   │ Active │  ← Hover shows highlight
│ PU-002  │ Unit Beta    │ Active │
└─────────┴──────────────┴────────┘
```

**Foundation Mode:**
```
┌─────────┬──────────────┬────────┐
│ Code    │ Name         │ Status │
├─────────┼──────────────┼────────┤
│ PU-001  │ Unit Alpha   │ Active │  ← No hover, no selection
│ PU-002  │ Unit Beta    │ Active │
└─────────┴──────────────┴────────┘
ℹ️ Table interactions disabled in Foundation Mode
```

---

## Color Palette Reference

### Primary Colors
```
Yellow (Primary):     #FFCC00  ██████
Black (Background):   #000000  ██████
Near-Black (Surface): #1A1A1A  ██████
Elevated Surface:     #2A2A2A  ██████
```

### Text Colors
```
Primary Text:    #FFFFFF  ██████
Secondary Text:  #CCCCCC  ██████
Tertiary Text:   #999999  ██████
Disabled Text:   #666666  ██████
```

### Semantic Colors
```
Success:  #44FF44  ██████
Warning:  #FFCC00  ██████  (same as primary)
Error:    #FF4444  ██████
Info:     #44CCFF  ██████
```

### Muted Backgrounds
```
Primary Muted:  rgba(255, 204, 0, 0.05)   ░░░░░░
Success Muted:  rgba(68, 255, 68, 0.05)   ░░░░░░
Danger Muted:   rgba(255, 68, 68, 0.05)   ░░░░░░
Info Muted:     rgba(68, 204, 255, 0.05)  ░░░░░░
```

---

## Spacing System

```
--spacing-1:  4px   ▪
--spacing-2:  8px   ▪▪
--spacing-3:  12px  ▪▪▪
--spacing-4:  16px  ▪▪▪▪
--spacing-6:  24px  ▪▪▪▪▪▪
--spacing-8:  32px  ▪▪▪▪▪▪▪▪
--spacing-12: 48px  ▪▪▪▪▪▪▪▪▪▪▪▪
```

---

## Opacity Levels

```
Fully Visible:   1.0   ████████████
Read-Only:       0.7   ████████▓▓▓▓
Disabled:        0.5   ██████▓▓▓▓▓▓
Muted:           0.3   ████▓▓▓▓▓▓▓▓
```

---

## Shadow System

### Primary Shadow (Yellow Glow)
```css
--shadow-primary: 0 0 0 3px rgba(255, 204, 0, 0.2);
--shadow-primary-strong: 0 4px 16px rgba(255, 204, 0, 0.3);
```

**Visual:**
```
        ╔═══════════╗
        ║  Button   ║
        ╚═══════════╝
    ░░░░░░░░░░░░░░░░░░░  ← Yellow glow (3px radius)
```

### Elevation Shadows
```css
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md:  0 4px 8px rgba(0, 0, 0, 0.5);
--shadow-lg:  0 8px 16px rgba(0, 0, 0, 0.5);
--shadow-xl:  0 12px 24px rgba(0, 0, 0, 0.5);
```

---

## Typography Scale

```
H1 (32px):  ██████████████████ Heading 1
H2 (24px):  ████████████ Heading 2
H3 (20px):  ██████████ Heading 3
Body (14px): ████████ Regular text
Small (12px): ██████ Helper text
```

**Font Weights:**
- Regular: 400
- Semibold: 600
- Bold: 700

---

## Border Radii

```
--radius-sm:   4px   ╭─╮
--radius-md:   8px   ╭──╮
--radius-lg:   12px  ╭───╮
--radius-full: 999px ╭────╮  (pill shape)
```

---

## Component Dimensions

### Buttons
```
Small:   height: 36px  padding: 8px 16px
Medium:  height: 44px  padding: 12px 24px  ← Default
Large:   height: 52px  padding: 16px 32px
```

### Inputs
```
Small:   height: 36px  padding: 8px 12px
Medium:  height: 44px  padding: 12px 16px  ← Default
Large:   height: 52px  padding: 16px 20px
```

### Cards
```
Small:   padding: 16px
Medium:  padding: 24px  ← Default
Large:   padding: 32px  ← Comfortable
```

---

## State Transitions

```css
Fast:   150ms cubic-bezier(0.4, 0, 0.2, 1)  /* Snappy */
Normal: 250ms cubic-bezier(0.4, 0, 0.2, 1)  /* Default */
Slow:   350ms cubic-bezier(0.4, 0, 0.2, 1)  /* Smooth */
```

**Properties to Transition:**
- `opacity` — Fast (150ms)
- `background-color` — Normal (250ms)
- `border-color` — Normal (250ms)
- `transform` — Fast (150ms)
- `box-shadow` — Normal (250ms)

---

## Accessibility Guidelines

### Contrast Ratios (WCAG)
```
AAA Level (7:1):   Yellow (#FFCC00) on Black (#000000) = 14.1:1 ✓
AA Level (4.5:1):  White (#FFFFFF) on Surface (#1A1A1A) = 12.6:1 ✓
AA Level (3:1):    Borders visible = 4.2:1 ✓
```

### Focus Indicators
- Always visible (never `outline: none`)
- Yellow ring (3px) for all interactive elements
- High contrast against all backgrounds

### Disabled States
- Reduced opacity but still readable
- `aria-disabled="true"` for screen readers
- Tooltip explains why disabled
- Still keyboard focusable (for context)

---

## Layout Grid

```
Container Max-Width: 1440px
Columns: 12
Gutter: 32px (--spacing-8)
Margin: 24px (--spacing-6)

┌──────────────────────────────────────┐
│ Margin (24px)                        │
│  ┌────┬────┬────┬────┬────┬────┐    │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │    │
│  └────┴────┴────┴────┴────┴────┘    │
│  ↑ 32px gutter                       │
│ Margin (24px)                        │
└──────────────────────────────────────┘
```

**Common Layouts:**
- Sidebar: 3 columns (25%)
- Content: 9 columns (75%)
- Two-column form: 6 + 6 columns

---

## Icon System

**Size Scale:**
```
XS:  12px  🔒  (Lock overlay)
SM:  16px  ⚙️   (Inline icons)
MD:  20px  💾  (Button icons)
LG:  24px  🖥️  (Section headers)
XL:  48px  ✓   (Empty states)
```

**Icon Library:** Lucide React  
**Style:** Outline (2px stroke)  
**Color:** Matches text color context

---

## Animation Principles

1. **Purposeful:** Animations indicate state change or draw attention
2. **Fast:** 150-350ms maximum
3. **Subtle:** Ease-out for natural deceleration
4. **Respectful:** Honor `prefers-reduced-motion`

**Examples:**
- Tooltip fade-in: 150ms opacity
- Button hover: 250ms background-color
- Modal enter: 350ms transform + opacity

---

## Responsive Breakpoints

```
Mobile:   < 768px   (stack vertically)
Tablet:   768-1024px (2-column layout)
Desktop:  > 1024px   (3-column layout)
```

**Foundation Mode Responsive:**
- Banner: Full-width on mobile, centered on desktop
- Tooltip: Position adjusts based on screen width
- Step indicators: Collapse to accordion on mobile

---

## Print Styles

Foundation Mode banner should **not** print:
```css
@media print {
  [data-testid="foundation-mode-banner"] {
    display: none;
  }
}
```

Disabled states should print as normal (no opacity reduction).

---

## Browser Support

- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

**CSS Features Used:**
- CSS Custom Properties (variables)
- Flexbox
- Grid
- `opacity` transitions
- `::after` pseudo-elements

---

## Quick Reference Checklist

When implementing Foundation Mode:

- [ ] Add `<FoundationModeBanner />` at top of page
- [ ] Replace `<button>` with `<FoundationModeButton />`
- [ ] Add `foundationMode` prop to `<StepFooter />`
- [ ] Use `<StepIndicator />` with lock icons
- [ ] Disable form inputs with clear helper text
- [ ] Add tooltips explaining disabled state
- [ ] Test keyboard navigation
- [ ] Verify screen reader announcements
- [ ] Check color contrast
- [ ] Test state transitions (enable/disable)

---

**END OF VISUAL REFERENCE GUIDE**

