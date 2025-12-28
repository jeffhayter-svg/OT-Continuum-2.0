# OT Continuum Onboarding v1.0.0 — Visual Reference Guide

**Design System Application Examples**  
**Status:** Design Frozen ❄️

---

## Consistent Layout Pattern

### Standard Step Layout

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER                                                         │
│ [Site Name]                                Progress: 3 / 7     │
│ Complete these steps to configure...                          │
│ [████████░░░░░░░░░░░░░] 42%                                  │
└────────────────────────────────────────────────────────────────┘

┌─────────────┬──────────────────────────────────────────────────┐
│ SIDEBAR     │ MAIN CONTENT                                     │
│             │                                                  │
│ Setup Steps │ ┌──────────────────────────────────────────────┐ │
│             │ │ Step Title                     Step 3 of 7   │ │
│ ┌─────────┐ │ │ Description of this step                    │ │
│ │ ✓ Step 1│ │ │                                              │ │
│ └─────────┘ │ │ ⚠️ Required Step: ...                       │ │
│             │ └──────────────────────────────────────────────┘ │
│ ┌─────────┐ │                                                  │
│ │ ✓ Step 2│ │ SECTION 1 (space-y-6)                           │
│ └─────────┘ │ ┌──────────────────────────────────────────────┐ │
│             │ │ Content...                                   │ │
│ ┏━━━━━━━━━┓ │ └──────────────────────────────────────────────┘ │
│ ┃●Step 3  ┃ │                                                  │
│ ┗━━━━━━━━━┛ │ SECTION 2 (space-y-6)                           │
│             │ ┌──────────────────────────────────────────────┐ │
│ ┌─────────┐ │ │ Content...                                   │ │
│ │ ○ Step 4│ │ └──────────────────────────────────────────────┘ │
│ └─────────┘ │                                                  │
│             │ ┌──────────────────────────────────────────────┐ │
│ [Complete   │ │ ❌ Error: Please fix...                     │ │
│  Setup]     │ └──────────────────────────────────────────────┘ │
│             │                                                  │
│             │ ┌──────────────────────────────────────────────┐ │
│             │ │ 5 items added    [Skip][Save & Continue] │ │
│             │ └──────────────────────────────────────────────┘ │
└─────────────┴──────────────────────────────────────────────────┘

Measurements:
- Grid: 12 columns (3 sidebar + 9 content)
- Sidebar padding: 24px (.card-ot)
- Content padding: 32px (.card-ot-lg)
- Section spacing: 24px (space-y-6)
- Footer border: 1px top + 24px padding
```

---

## Button Standards

### Primary Button (Yellow)

```
┏━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💾 Save & Continue   ┃  Background: #FFCC00
┗━━━━━━━━━━━━━━━━━━━━━━┛  Color: #000000
                          Height: 44px
States:                    Padding: 12px 24px
Default:  #FFCC00         Icon: w-5 h-5 (20px)
Hover:    #FFD633 + glow
Active:   #FFCC00 + 1px down
Disabled: 50% opacity
```

### Secondary Button (Outline)

```
┌────────────────────┐
│ ⏩ Skip This Step │    Background: transparent
└────────────────────┘    Border: 1px #333333
                          Color: #FFFFFF
States:                   Height: 44px
Default:  border #333    Padding: 12px 24px
Hover:    bg rgba(255,255,255,0.05)
Active:   bg rgba(255,255,255,0.1) + 1px down
Disabled: 50% opacity
```

### AI Assist Button (Info Blue)

```
┌────────────────────┐
│ ✨ AI Suggest     │    Background: rgba(68,204,255,0.1)
└────────────────────┘    Border: 1px #44CCFF
                          Color: #44CCFF
States:                   Height: 44px
Default:  bg 10%         Padding: 12px 24px
Hover:    bg 15%         Icon: w-4 h-4 (16px)
Active:   bg 20%
```

**Visual Weight Scale:**
```
Primary:    ████████████  100% (solid yellow fill)
Secondary:  ░░░░░░░░░░░░   60% (outline only)
AI Assist:  ▒▒▒▒▒▒▒▒▒▒▒▒   40% (light blue tint)
Ghost:      ············   20% (text only)
```

---

## Typography Examples

### Heading Hierarchy

```
h1 — Site Configuration Complete
     Size: 24px (text-2xl)
     Weight: 600 (semibold)
     Color: #FFFFFF
     Line-height: 1.25 (tight)
     Usage: Page titles only

h2 — Create Process Units
     Size: 20px (text-xl)
     Weight: 600 (semibold)
     Color: #FFFFFF
     Line-height: 1.25 (tight)
     Usage: Step titles

h3 — What are Process Units?
     Size: 18px (text-lg)
     Weight: 600 (semibold)
     Color: #FFFFFF
     Line-height: 1.25 (tight)
     Usage: Section headings

p — Process Units represent functional production...
    Size: 14px (text-sm)
    Weight: 400 (regular)
    Color: #CCCCCC (text-secondary)
    Line-height: 1.5 (normal)
    Usage: Body text
```

### Text Color Usage

```
Primary (#FFFFFF):     Step titles, headings, input values
Secondary (#CCCCCC):   Descriptions, helper text, labels
Tertiary (#999999):    Meta info, timestamps, step counters
Muted (#666666):       Placeholders, disabled text
```

---

## Alert Patterns

### Error Alert

```
╔═══════════════════════════════════════════════════════════╗
║ ⚠️  Error: Please add at least one process unit to       ║
║     continue.                                             ║
╚═══════════════════════════════════════════════════════════╝

Background: rgba(255, 68, 68, 0.1)
Border: 2px solid #FF4444
Color: #FF4444
Icon: AlertCircle w-5 h-5
Padding: 12px 16px
```

### Success Alert

```
╔═══════════════════════════════════════════════════════════╗
║ ✓  Success: All assets mapped successfully.              ║
╚═══════════════════════════════════════════════════════════╝

Background: rgba(68, 255, 68, 0.1)
Border: 2px solid #44FF44
Color: #44FF44
Icon: CheckCircle w-5 h-5
Padding: 12px 16px
```

### Warning Alert (Required Step)

```
╔═══════════════════════════════════════════════════════════╗
║ ⚠️  Required Step: This step must be completed before    ║
║     your site can be used for operational monitoring.     ║
╚═══════════════════════════════════════════════════════════╝

Background: rgba(255, 204, 0, 0.1)
Border: 2px solid #FFCC00
Color: #FFCC00
Icon: AlertTriangle w-5 h-5
Padding: 12px 16px
```

### Info Alert (AI / Informational)

```
╔═══════════════════════════════════════════════════════════╗
║ ℹ️  What's Next?                                          ║
║ • Signal Ingestion: Start monitoring incoming signals    ║
║ • Risk Register: View and manage operational risks       ║
╚═══════════════════════════════════════════════════════════╝

Background: rgba(68, 204, 255, 0.1)
Border: 2px solid #44CCFF
Color: #44CCFF
Icon: Info w-5 h-5
Padding: 12px 16px
```

---

## Card Variants

### Standard Card (.card-ot)

```
┌────────────────────────────────┐
│ Sidebar Step                   │  Background: #1A1A1A
│                                │  Border: 1px #333333
│ Content with 24px padding      │  Radius: 12px
│                                │  Padding: 24px
└────────────────────────────────┘
```

### Large Card (.card-ot-lg)

```
┌──────────────────────────────────────┐
│ Main Step Content                    │  Background: #1A1A1A
│                                      │  Border: 1px #333333
│ Content with 32px padding            │  Radius: 12px
│                                      │  Padding: 32px
│                                      │
└──────────────────────────────────────┘
```

### Hover Card (.card-ot-hover)

```
┌────────────────────────────────┐
│ Dashboard Card                 │  Default: border #333333
│                                │  Hover: border #FFCC00 + glow
│ Clickable with hover state     │  Cursor: pointer
└────────────────────────────────┘
```

---

## Footer Layout Variations

### Standard (Save & Continue)

```
┌─────────────────────────────────────────────────────────┐
│ 5 process units added        [Skip] [Save & Continue] │
└─────────────────────────────────────────────────────────┘
   ↑                              ↑       ↑
   Status message                 Sec     Primary
   (text-sm text-secondary)       (optional)
```

### Upload Step

```
┌─────────────────────────────────────────────────────────┐
│ Ready to upload               [Back] [Upload & Continue]│
└─────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────┐
│ Saving process units...                    [⟳ Saving...]│
└─────────────────────────────────────────────────────────┘
```

### Foundation Mode (Disabled)

```
┌─────────────────────────────────────────────────────────┐
│ Foundation Mode active        ┌─────────────────────┐  │
│                               │[Save & Continue]    │  │
│                               │  (with tooltip)     │  │
│                               └─────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Tooltip: "This action is disabled in Foundation Mode while
          backend services activate."
```

---

## Color Usage Examples

### ✓ CORRECT Yellow Usage

**1. Primary CTA:**
```tsx
<button className="btn-primary">
  Save & Continue  // Yellow background #FFCC00
</button>
```

**2. Progress Bar:**
```tsx
<div style={{ backgroundColor: '#FFCC00', width: '42%' }} />
```

**3. Current Step Indicator:**
```tsx
<Circle style={{ color: '#FFCC00', fill: '#FFCC00' }} />
```

**4. Input Focus:**
```tsx
.input-ot:focus {
  border-color: #FFCC00;
  box-shadow: 0 0 0 3px rgba(255, 204, 0, 0.2);
}
```

### ✗ INCORRECT Yellow Usage

**1. Don't use for all text:**
```tsx
❌ <h2 style={{ color: '#FFCC00' }}>Step Title</h2>
✓  <h2>Step Title</h2>  // White #FFFFFF
```

**2. Don't use for backgrounds:**
```tsx
❌ <div style={{ backgroundColor: '#FFCC00' }}>Content</div>
✓  <div className="card-ot">Content</div>  // Dark #1A1A1A
```

**3. Don't use for borders:**
```tsx
❌ <div style={{ border: '1px solid #FFCC00' }}>
✓  <div className="card-ot">  // Border #333333
```

**4. Don't use for decorative icons:**
```tsx
❌ <Icon style={{ color: '#FFCC00' }} />
✓  <Icon className="text-secondary" />  // Gray #CCCCCC
```

---

## Spacing Measurements

### Vertical Rhythm

```
Hero Section
   32px gap (space-y-8)
━━━━━━━━━━━━━━━━━━━━━━━━━━

Section 1
   24px gap (space-y-6) ← STANDARD
━━━━━━━━━━━━━━━━━━━━━━━━━━

Section 2
   24px gap (space-y-6) ← STANDARD
━━━━━━━━━━━━━━━━━━━━━━━━━━

Footer
   Border + 24px padding-top
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Form Field Spacing

```
Field Label
   8px gap (space-y-2)
━━━━━━━━━━━━━━━━━━━━━━

Input Field

   16px gap (space-y-4)
━━━━━━━━━━━━━━━━━━━━━━

Field Label
   8px gap (space-y-2)
━━━━━━━━━━━━━━━━━━━━━━

Input Field
```

### Button Spacing

```
[Primary Button]  12px gap  [Secondary Button]
                  (gap-3)
```

---

## Completion Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ┏━━━━━━━━━━┓                        │
│                    ┃    ✓     ┃  96x96 success circle  │
│                    ┗━━━━━━━━━━┛                        │
│                                                         │
│          Site Configuration Complete                    │
│          (h1, text-2xl, mb-3)                          │
│                                                         │
│     [Site Name] is ready for operational monitoring    │
│     (text-xl, text-secondary)                          │
│                                                         │
│   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│   ┃ Setup Summary                                  ┃   │
│   ┃                                                ┃   │
│   ┃ ✓ Process Units created            3          ┃   │
│   ┃   Functional production units defined         ┃   │
│   ┃                                                ┃   │
│   ┃ ✓ Plant Tags defined               15         ┃   │
│   ┃   Measurement points configured                ┃   │
│   ┃                                                ┃   │
│   ┃ ✓ OT Assets uploaded               8          ┃   │
│   ┃   Asset inventory imported                     ┃   │
│   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                         │
│   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│   ┃ ℹ️  What's Next?                               ┃   │
│   ┃ • Signal Ingestion: Start monitoring...       ┃   │
│   ┃ • Risk Register: View and manage risks...     ┃   │
│   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                         │
│   ┏━━━━━━━━━━━━━━━━━━━┓  ┌───────────────────┐        │
│   ┃ Go to Dashboard → ┃  │ Review Setup ⚙️   │        │
│   ┗━━━━━━━━━━━━━━━━━━━┛  └───────────────────┘        │
│                                                         │
│   You can modify your configuration later from         │
│   the Site Management page.                            │
│                                                         │
└─────────────────────────────────────────────────────────┘

Measurements:
- Success icon: 96x96px circle
- Card spacing: 32px (mb-8)
- Stat numbers: text-2xl (#44FF44)
- Button size: btn-lg (56px height)
```

---

## Icon Sizing Reference

```
Primary Buttons:     w-5 h-5   (20x20px)  💾 Save
Secondary Buttons:   w-4 h-4   (16x16px)  ⏩ Skip
Alerts:              w-5 h-5   (20x20px)  ⚠️  Error
Success Icons:       w-5 h-5   (20x20px)  ✓ Complete
Large Icons (hero):  w-16 h-16 (64x64px)  ✓ Success Circle
```

---

## Test ID Patterns

```tsx
// Step container
data-testid="process-units-step"

// Actions
data-testid="save-and-continue"
data-testid="skip-this-step"
data-testid="onboarding-finish"

// Step navigation
data-testid="onboarding-step-{step-id}"

// Completion
data-testid="completion-step"
data-testid="go-to-dashboard"
data-testid="review-setup"

// AI features
data-testid="ai-assist-button"
data-testid="apply-ai-suggestions"
```

---

**END OF VISUAL REFERENCE GUIDE**

**OT CONTINUUM ONBOARDING v1.0.0**  
**Design System Compliance: 100% ✓**

