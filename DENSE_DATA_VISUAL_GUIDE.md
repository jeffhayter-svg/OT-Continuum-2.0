# Dense Data Visual Guide — OT Continuum

**Mapping Matrices & CSV Upload Screens**  
**Version:** 1.0.0  
**Status:** Design Frozen ❄️

---

## Mapping Matrix Anatomy

```
╔═══════════════════════════════════════════════════════════════════════╗
║ Search [🔍 Search assets...]     [Filter ▼]     [✨ AI Suggest]     ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Status: 8 of 15 assets mapped          Showing 15 assets             ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────┬───────────────┬───────────────┬───────────────┐
│ Asset           │ PU-001        │ PU-002        │ PU-003        │
│ (Sticky)        │ Distillation  │ Cracker       │ Compressor    │
│                 │ [Select All]  │ [Select All]  │ [Select All]  │
├─────────────────┼───────────────┼───────────────┼───────────────┤
│ [PLC-001]       │      █        │      ░        │      ░        │
│ Main Controller │               │               │               │
│ PLC             │               │               │               │
│ ✓ 1 mapping     │               │               │               │
├─────────────────┼───────────────┼───────────────┼───────────────┤
│ [HMI-001]       │      █        │      █        │      ░        │
│ Operator HMI    │               │               │               │
│ HMI             │               │               │               │
│ ✓ 2 mappings    │               │               │               │
├─────────────────┼───────────────┼───────────────┼───────────────┤
│ [TT-101]        │      ░        │      ░        │      ░        │
│ Temp Sensor     │               │               │               │
│ Transmitter     │               │               │               │
└─────────────────┴───────────────┴───────────────┴───────────────┘

Legend:
  █ = Selected (yellow #FFCC00)
  ░ = Unselected (gray border)
  [Code] = Monospace identifier
```

---

## Checkbox Matrix States

### Unselected (Default)
```
┌──────┐
│      │  32×32px
│      │  Border: 2px solid #333333
└──────┘  Background: transparent
          Cursor: pointer
```

### Hover (Unselected)
```
┌──────┐
│░░░░░░│  Yellow tint
│░░░░░░│  Background: rgba(255, 204, 0, 0.1)
└──────┘  Border: 2px solid #FFCC00
```

### Selected
```
┏━━━━━━┓
┃  ✓   ┃  Yellow fill
┃  ✓   ┃  Background: #FFCC00
┗━━━━━━┛  Color: #000000
          Border: 2px solid #FFCC00
```

### Selected + Hover
```
┏━━━━━━┓
┃  ✓   ┃  Lighter yellow
┃  ✓   ┃  Background: #FFD633
┗━━━━━━┛  Border: 2px solid #FFD633
```

---

## CSV Upload Panel

```
╔═══════════════════════════════════════════════════════════════════╗
║ ℹ️ What is an OT Asset Ledger?                                   ║
║                                                                   ║
║ Your OT Asset Ledger contains the inventory of operational       ║
║ technology equipment at this site...                             ║
║                                                                   ║
║ Required columns: asset_id, asset_name, asset_type               ║
║ Optional columns: manufacturer, model, serial_number, ip_address ║
╚═══════════════════════════════════════════════════════════════════╝

┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                                 │
│                    ⬆️  Upload Icon (16×16, gray)                │
│                                                                 │
│              Upload Your OT Asset Inventory                     │
│                                                                 │
│  Upload a CSV file containing your OT asset ledger.            │
│  Download the template below for the correct format.           │
│                                                                 │
│                  [⬆️ Choose File]                               │
│                   (Primary button)                              │
│                                                                 │
│                [⬇️ Download CSV Template]                       │
│                    (Ghost button)                               │
│                                                                 │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                Dashed border: #333333
```

---

## Asset Preview Table

```
╔═══════════════════════════════════════════════════════════════════╗
║ ✓ Upload successful! 5 assets loaded.        [Upload different…] ║
╚═══════════════════════════════════════════════════════════════════╝

Asset Preview
┌──────────┬─────────────────┬─────────┬──────────┬───────────────┐
│ Asset ID │ Name            │ Type    │ Mfr      │ Model         │
├──────────┼─────────────────┼─────────┼──────────┼───────────────┤
│ PLC-001  │ Main Controller │ PLC     │ Siemens  │ S7-1500       │
│ HMI-001  │ Operator HMI    │ HMI     │ Rockwell │ FactoryTalk   │
│ TT-101   │ Temp Sensor     │ Sensor  │ Emerson  │ Rosemount 30… │
└──────────┴─────────────────┴─────────┴──────────┴───────────────┘
                 ↑
                 Code badge (monospace, elevated)
```

---

## Status Bar

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ 8 of 15 assets mapped             Showing 15 assets          │
└─────────────────────────────────────────────────────────────────┘
  ↑                                    ↑
  Progress indicator                   Filter count
  (green checkmark)                    (tertiary text)

Background: var(--color-bg-elevated-1)
Border: 1px solid var(--color-border-default)
Padding: 12px 16px
```

---

## Mapping Summary

```
╔═══════════════════════════════════════════════════════════════════╗
║ ✓ Mapping Summary:                                               ║
║                                                                   ║
║   • PU-001 Distillation: 3 assets                                ║
║   • PU-002 Cracker: 5 assets                                     ║
║   • PU-003 Compressor: 2 assets                                  ║
╚═══════════════════════════════════════════════════════════════════╝

Background: var(--color-success-muted)
Border: 1px solid var(--color-success)
Color: var(--color-success)
```

---

## Row States

### Default Row
```
│ [PLC-001]       │      ░        │      ░        │      ░        │
│ Main Controller │               │               │               │
│ PLC             │               │               │               │
  ↑               ↑               ↑
  Code badge      Type            Checkboxes
  (elevated)      (tertiary)      (unselected)
```

### Hover Row
```
│ [PLC-001]       │      ░        │      ░        │      ░        │
│ Main Controller │               │               │               │
│ PLC             │               │               │               │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
  ↑
  Background: var(--color-bg-elevated-1)
  Sticky column also changes
```

### Mapped Row
```
│ [PLC-001]       │      █        │      █        │      ░        │
│ Main Controller │               │               │               │
│ PLC             │               │               │               │
│ ✓ 2 mappings    │               │               │               │
  ↑
  Success indicator (green)
```

---

## Typography Scale (Dense Data)

```
Table Headers:    12px, SEMIBOLD, UPPERCASE, #CCCCCC
Row Labels:       14px, REGULAR, #FFFFFF
Row Metadata:     12px, REGULAR, #999999
Code Badges:      12px, MONOSPACE, #FFFFFF
Status Text:      14px, SEMIBOLD, #44FF44
Helper Text:      12px, REGULAR, #999999
```

---

## Spacing System (Dense Data)

```
Cell Padding:         12px horizontal, 12px vertical
Checkbox Margin:      8px all sides
Row Height:           Auto (min 48px for accessibility)
Column Min-Width:     120px (except sticky: 200px)
Header Min-Height:    80px (code + name + "Select All")
Gap Between Rows:     1px border
Gap Between Columns:  1px border
```

---

## Sticky Column Behavior

```
[Scroll Position: Left]
┌─────────────────┬───────────────┬───────────────┐
│ Asset (sticky)  │ PU-001        │ PU-002        │
├─────────────────┼───────────────┼───────────────┤
│ PLC-001         │      █        │      ░        │
└─────────────────┴───────────────┴───────────────┘

[Scroll Position: Right]
┌─────────────────┬───────────────┬───────────────┐
│ Asset (sticky)  │ PU-003        │ PU-004        │
├─────────────────┼───────────────┼───────────────┤
│ PLC-001         │      ░        │      █        │
└─────────────────┴───────────────┴───────────────┘
       ↑
       Stays in place (position: sticky; left: 0)
       z-index: 10 (above scrolling columns)
       2px strong border on right
```

---

## Search & Filter Controls

```
┌──────────────────────────────────────┐  ┌──────────────┐  ┌─────────────┐
│ 🔍 Search assets...                  │  │ All Types ▼  │  │ ✨ AI Suggest│
└──────────────────────────────────────┘  └──────────────┘  └─────────────┘
  ↑                                       ↑                 ↑
  input-ot (with left icon)               select-ot         btn-secondary
  Flex: 1, Max-width: 400px               Auto-width        Auto-width

Icon Position:
  position: absolute
  left: 12px
  top: 50%
  transform: translateY(-50%)
  color: var(--color-text-tertiary)

Input Padding:
  padding-left: 40px (to avoid icon overlap)
```

---

## Code Badge Component

```
╔═══════════╗
║ PLC-001   ║  Font: Monospace
╚═══════════╝  Size: 12px
               Background: var(--color-bg-elevated-1)
               Padding: 2px 6px
               Border-radius: 4px
               Color: var(--color-text-primary)
               White-space: nowrap
```

**Usage:**
```tsx
<code className="code-ot">{asset.asset_id}</code>
```

---

## Validation Error States

### Row-Level Error (Future)
```
│ [PLC-001]       │  ⚠️  │      ░        │      ░        │
│ Main Controller │      │               │               │
│ PLC             │      │               │               │
│ ❌ Required      │      │               │               │
  ↑
  Error badge (red)
```

### Cell-Level Error (Future)
```
│ [PLC-001]       │     ❌     │      ░        │      ░        │
│ Main Controller │ Invalid   │               │               │
│ PLC             │  type     │               │               │
  ↑
  Tooltip on hover
```

---

## Empty States

### No Search Results
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                       ⚠️  (64×64, gray)                     │
│                                                             │
│                   No assets found                           │
│                                                             │
│         Try adjusting your search or filters                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Padding: 48px vertical
Text: var(--color-text-tertiary)
```

### No Assets Uploaded
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                                 │
│                    ⬆️  (64×64, gray)                           │
│                                                                 │
│            Upload Your OT Asset Inventory                       │
│                                                                 │
│   Upload a CSV file containing your OT asset ledger.           │
│                                                                 │
│                  [⬆️ Choose File]                               │
│                                                                 │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

---

## Responsive Breakpoints

### Desktop (> 1024px)
- Sticky column: 200px
- Regular columns: 120px min
- Table scrolls horizontally
- All controls in single row

### Tablet (768-1024px)
- Sticky column: 160px
- Regular columns: 100px min
- Search takes full width
- Filters stack below

### Mobile (< 768px)
- Matrix becomes vertical cards
- One asset per card
- Checkboxes inline
- "Select All" removed

---

## Performance Metrics

```
Target Metrics:
- Initial render: < 100ms (up to 100 rows)
- Checkbox toggle: < 16ms (60fps)
- Search filter: < 300ms (debounced)
- Horizontal scroll: 60fps (GPU accelerated)
- Memory usage: < 10MB per 1000 rows
```

**Optimization Techniques:**
- Virtual scrolling (not implemented yet)
- Memoized filter functions
- CSS-only hover states
- GPU-accelerated sticky positioning

---

## Browser Compatibility

```
Chrome 90+:  ✓ Full support
Firefox 88+: ✓ Full support
Safari 14+:  ✓ Full support
Edge 90+:    ✓ Full support

Features Used:
- position: sticky (✓ All modern browsers)
- CSS Grid (✓ All modern browsers)
- Flexbox (✓ All modern browsers)
- CSS Custom Properties (✓ All modern browsers)
```

---

## Quick Reference

### CSS Classes
```css
.mapping-matrix      /* Outer container */
.sticky-col          /* First column (asset labels) */
.mapping-header      /* Column headers */
.checkbox-matrix     /* Selection checkboxes */
.status-bar          /* Progress indicator */
.table-footer        /* "... and X more" text */
.code-ot             /* Monospace identifiers */
```

### Data Attributes
```html
<button data-selected="true">   /* Checkbox selected state */
<tr data-testid="mapping-row-{id}">  /* Test automation */
<button data-testid="select-all-{targetId}">  /* Bulk action */
```

### Color Variables
```css
--color-primary:       #FFCC00  /* Selected state */
--color-success:       #44FF44  /* Mapped indicator */
--color-danger:        #FF4444  /* Validation error */
--color-bg-surface:    #1A1A1A  /* Table background */
--color-bg-elevated-1: #2A2A2A  /* Headers, footers */
--color-border-default:#333333  /* Grid lines */
--color-border-strong: #444444  /* Sticky column border */
```

---

**END OF DENSE DATA VISUAL GUIDE**

