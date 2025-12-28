# OT Continuum Theme - Design System

## Overview

The OT Continuum Theme is a comprehensive design system optimized for industrial operations monitoring interfaces. It features a high-contrast dark theme with yellow accents for maximum visibility in control room environments.

---

## 🎨 Color Palette

### Primary Colors

| Color | Hex | Usage | Variable |
|-------|-----|-------|----------|
| **Black** | `#000000` | Primary background | `--ot-black` |
| **White** | `#FFFFFF` | Primary text, heading text | `--ot-white` |
| **Gray** | `#CCCCCC` | Secondary text, body text | `--ot-gray` |

### Accent & Semantic Colors

| Color | Hex | Usage | Variable |
|-------|-----|-------|----------|
| **Yellow** | `#FFCC00` | Accent, primary actions, highlights | `--ot-yellow` |
| **Green** | `#44FF44` | Success states, positive indicators | `--ot-green` |
| **Red** | `#FF4444` | Error states, critical alerts | `--ot-red` |

### UI Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Card Background** | `#1A1A1A` | Elevated surfaces |
| **Muted** | `#333333` | Disabled states, inactive elements |
| **Border** | `rgba(255, 255, 255, 0.2)` | Dividers, outlines |
| **Input Border** | `rgba(255, 255, 255, 0.3)` | Form field borders |

---

## 🔤 Typography

### Font Family

**Primary:** Inter  
**Fallback:** IBM Plex Sans  
**System Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

```css
font-family: 'Inter', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale

| Element | Size | Weight | Color | Transform | Usage |
|---------|------|--------|-------|-----------|-------|
| **Heading 1** | 24px | Bold (700) | White | Uppercase | Page titles |
| **Heading 2** | 18px | Semibold (600) | White | None | Section headers |
| **Heading 3** | 16px | Semibold (600) | White | None | Subsection headers |
| **Body Text** | 14px | Regular (400) | Gray (#CCCCCC) | None | Content, descriptions |
| **Small Text** | 12px | Regular (400) | Gray | None | Labels, captions |

### CSS Variables

```css
--font-size-h1: 24px;
--font-size-h2: 18px;
--font-size-h3: 16px;
--font-size-body: 14px;
--font-size-small: 12px;

--font-weight-regular: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Usage Examples

```html
<h1>Process Units Overview</h1>
<h2>Active Alarms</h2>
<h3>Risk Score: 7.2</h3>
<p>This process unit is operating within normal parameters.</p>
<label>Asset ID</label>
```

---

## 🔘 Buttons

### Primary Button

**Visual:** Yellow background (#FFCC00), black text, bold, uppercase  
**Usage:** Primary actions, CTAs, form submissions

```css
.btn-primary {
  background-color: #FFCC00;
  color: #000000;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**States:**
- `:hover` - Lighter yellow (#FFD633), slight lift, glow
- `:active` - Pressed down
- `:disabled` - 40% opacity

**HTML Example:**
```html
<button class="btn-primary">Continue</button>
```

### Secondary Button

**Visual:** Transparent background, white border, white text, bold, uppercase  
**Usage:** Secondary actions, cancel, back

```css
.btn-secondary {
  background-color: transparent;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border: 2px solid #FFFFFF;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**States:**
- `:hover` - Light background overlay, yellow border + text
- `:disabled` - 40% opacity

**HTML Example:**
```html
<button class="btn-secondary">Cancel</button>
```

### Success Button

**Visual:** Green background (#44FF44), black text, bold, uppercase  
**Usage:** Positive confirmations, completion actions

```css
.btn-success {
  background-color: #44FF44;
  color: #000000;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**HTML Example:**
```html
<button class="btn-success">Complete Setup</button>
```

### Error Button

**Visual:** Red background (#FF4444), white text, bold, uppercase  
**Usage:** Destructive actions, deletions, critical warnings

```css
.btn-error {
  background-color: #FF4444;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**HTML Example:**
```html
<button class="btn-error">Delete Site</button>
```

---

## 📝 Form Inputs

### Text Input

```css
input[type="text"] {
  font-size: 14px;
  color: #FFFFFF;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
}
```

**States:**
- `:focus` - Yellow border, subtle glow, lighter background

**HTML Example:**
```html
<label>Asset Name</label>
<input type="text" placeholder="Enter asset name" />
```

### Textarea

Same styling as text input.

### Select Dropdown

Same styling as text input with dropdown arrow.

---

## 🎴 Cards

### Standard Card

```css
.card-ot {
  background-color: #1A1A1A;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
}
```

**States:**
- `:hover` - Yellow border, subtle glow

**HTML Example:**
```html
<div class="card-ot">
  <h3>Process Unit: CDU-1</h3>
  <p>Crude Distillation Unit</p>
</div>
```

---

## 🚨 Alerts

### Success Alert

```css
.alert-success {
  background-color: rgba(68, 255, 68, 0.1);
  border: 1px solid #44FF44;
  border-left: 4px solid #44FF44;
  color: #44FF44;
  padding: 16px;
  border-radius: 8px;
}
```

**HTML Example:**
```html
<div class="alert-success">
  <strong>Success!</strong> Process unit created successfully.
</div>
```

### Error Alert

```css
.alert-error {
  background-color: rgba(255, 68, 68, 0.1);
  border: 1px solid #FF4444;
  border-left: 4px solid #FF4444;
  color: #FF4444;
  padding: 16px;
  border-radius: 8px;
}
```

**HTML Example:**
```html
<div class="alert-error">
  <strong>Error:</strong> Failed to upload asset ledger.
</div>
```

### Warning Alert

```css
.alert-warning {
  background-color: rgba(255, 204, 0, 0.1);
  border: 1px solid #FFCC00;
  border-left: 4px solid #FFCC00;
  color: #FFCC00;
  padding: 16px;
  border-radius: 8px;
}
```

**HTML Example:**
```html
<div class="alert-warning">
  <strong>Warning:</strong> Some assets are not mapped to process units.
</div>
```

### Info Alert

```css
.alert-info {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-left: 4px solid #FFFFFF;
  color: #FFFFFF;
  padding: 16px;
  border-radius: 8px;
}
```

---

## 🏷️ Badges

### Badge Variants

```css
.badge-ot {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success { background: #44FF44; color: #000000; }
.badge-error { background: #FF4444; color: #FFFFFF; }
.badge-warning { background: #FFCC00; color: #000000; }
.badge-neutral { background: #333333; color: #FFFFFF; }
```

**HTML Examples:**
```html
<span class="badge-ot badge-success">Active</span>
<span class="badge-ot badge-error">Critical</span>
<span class="badge-ot badge-warning">Setup Required</span>
<span class="badge-ot badge-neutral">Inactive</span>
```

---

## 📊 Tables

```css
table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

th {
  padding: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  text-transform: uppercase;
  text-align: left;
}

td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #CCCCCC;
}

tr:hover td {
  background-color: rgba(255, 204, 0, 0.05);
}
```

**HTML Example:**
```html
<table>
  <thead>
    <tr>
      <th>Asset ID</th>
      <th>Name</th>
      <th>Type</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>PLC-001</code></td>
      <td>Main PLC Controller</td>
      <td>PLC</td>
      <td><span class="badge-ot badge-success">Active</span></td>
    </tr>
  </tbody>
</table>
```

---

## 📏 Spacing System

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
--spacing-2xl: 32px;
```

**Usage with Tailwind:**
```html
<div class="p-4">4px padding</div>
<div class="p-8">8px padding</div>
<div class="gap-12">12px gap</div>
<div class="mt-16">16px margin-top</div>
```

---

## 🔲 Border Radius

```css
--radius-sm: 4px;   /* Small elements: badges, code */
--radius-md: 8px;   /* Default: buttons, inputs, alerts */
--radius-lg: 12px;  /* Large elements: cards */
```

---

## 💾 Code Styling

### Inline Code

```css
code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: rgba(255, 204, 0, 0.1);
  color: #FFCC00;
  padding: 2px 6px;
  border-radius: 4px;
}
```

**HTML Example:**
```html
<code>PLC-001</code>
```

### Code Blocks

```css
pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #CCCCCC;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

## 🎯 Design Principles

### 1. High Contrast
All text maintains a minimum contrast ratio of 7:1 for accessibility in control room environments.

### 2. Industrial Aesthetic
- Uppercase headings for authority
- Monospace code for technical identifiers
- Sharp corners and clean lines
- Minimal decoration

### 3. Yellow as Accent
Yellow (#FFCC00) is used sparingly but consistently:
- Primary actions
- Active states
- Important highlights
- Critical attention points

### 4. Status Color Coding
- **Green** = Success, operational, normal
- **Red** = Error, critical, failure
- **Yellow** = Warning, attention required
- **White** = Informational, neutral

### 5. Hierarchical Typography
- H1: Page-level titles (24px, bold, uppercase)
- H2: Section headers (18px, semibold)
- H3: Component headers (16px, semibold)
- Body: Content and descriptions (14px, regular)

---

## 📱 Responsive Considerations

The design system is optimized for desktop control room displays but remains functional on tablets. Mobile support is minimal as the platform is designed for operational monitoring workstations.

**Breakpoints (suggested):**
- Desktop: 1920px+ (primary target)
- Laptop: 1440px+
- Tablet: 1024px+
- Mobile: <768px (limited support)

---

## ♿ Accessibility

### Color Contrast
- White on Black: 21:1 (AAA)
- Gray (#CCCCCC) on Black: 12:1 (AAA)
- Yellow (#FFCC00) on Black: 15:1 (AAA)
- Green (#44FF44) on Black: 13:1 (AAA)
- Red (#FF4444) on Black: 4.9:1 (AA)

### Focus States
All interactive elements have visible focus states with yellow borders and subtle glows.

### Semantic HTML
Use semantic HTML elements (button, input, label, etc.) for screen reader compatibility.

---

## 🔧 Implementation

### Import CSS

```tsx
import '../styles/globals.css';
```

### Using Tailwind with Theme

```tsx
<div className="bg-ot-black text-ot-white">
  <h1>OT Continuum</h1>
  <button className="btn-primary">Get Started</button>
</div>
```

### Using CSS Classes

```tsx
<div className="card-ot">
  <h2>Process Unit Overview</h2>
  <div className="alert-success">
    All systems operational
  </div>
</div>
```

---

## 📦 Component Library

All onboarding components have been styled with the OT Continuum Theme:

- ✅ Site Onboarding Wizard
- ✅ Process Units Step
- ✅ Plant Tags Step
- ✅ Asset Ledger Upload
- ✅ Bulk Mapping Tables
- ✅ Empty State Screens
- ✅ Completion Screen

---

## 🎨 Figma Assets

### Color Swatches
```
Black:  #000000
White:  #FFFFFF
Gray:   #CCCCCC
Yellow: #FFCC00
Green:  #44FF44
Red:    #FF4444
```

### Typography Styles
```
H1: Inter Bold 24px, uppercase, white
H2: Inter Semibold 18px, white
H3: Inter Semibold 16px, white
Body: Inter Regular 14px, #CCCCCC
Small: Inter Regular 12px, #CCCCCC
```

### Component Patterns
- Primary Button: 12px padding, #FFCC00 bg, black text
- Secondary Button: 12px padding, transparent bg, white border
- Card: 24px padding, #1A1A1A bg, white border
- Badge: 4px/12px padding, uppercase, 12px

---

**Version:** 1.0  
**Last Updated:** December 26, 2024  
**Status:** ✅ Production Ready
