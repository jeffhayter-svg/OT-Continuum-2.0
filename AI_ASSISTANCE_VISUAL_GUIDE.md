# AI Assistance Visual Guide — OT Continuum

**Decision Support for Regulated Environments**  
**Version:** 1.0.0  
**Status:** Design Frozen ❄️

---

## Core Principle: Advisory, Not Authoritative

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   PRIMARY ACTIONS          vs      AI SUGGESTIONS          │
│   (Authoritative)                  (Advisory)              │
│                                                             │
│   ┏━━━━━━━━━━━━━━━┓              ┌───────────────┐        │
│   ┃ Save & Continue┃              │ AI Suggest   │        │
│   ┗━━━━━━━━━━━━━━━┛              └───────────────┘        │
│   Yellow #FFCC00                  Blue #44CCFF            │
│   Solid fill                      Light tint               │
│   High contrast                   Lower contrast           │
│   Commands action                 Offers recommendation    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Button Comparison

### Primary Button (Authoritative)
```
┏━━━━━━━━━━━━━━━━━━━┓
┃ 💾 Save & Continue ┃  
┗━━━━━━━━━━━━━━━━━━━┛
Background: #FFCC00 (solid)
Color: #000000
Border: none
Box-shadow: 0 2px 4px rgba(0,0,0,0.5)
```

### AI Assist Button (Advisory)
```
┌───────────────────┐
│ ✨ AI Suggest     │
└───────────────────┘
Background: rgba(68, 204, 255, 0.1)
Color: #44CCFF
Border: 1px solid #44CCFF
Box-shadow: none
```

### Visual Weight Scale
```
Primary:    ████████████  100%
Secondary:  ░░░░░░░░░░░░   60%
AI Assist:  ▒▒▒▒▒▒▒▒▒▒▒▒   40%
Ghost:      ············   20%
```

---

## AI Badge

```
╔═══════════════╗
║ AI-Suggested  ║  
╚═══════════════╝

Background: rgba(68, 204, 255, 0.1)
Color: #44CCFF
Border: 1px solid #44CCFF
Font-size: 12px
Padding: 2px 8px
Border-radius: 999px
```

**Mandatory Usage:**
Every AI-generated element MUST display this badge.

---

## AI Suggestions Panel

```
╔═══════════════════════════════════════════════════════════╗
║ ✨ AI-Generated Suggestions         [AI-Suggested]       ║
║                                                           ║
║ Review these AI-generated suggestions. All               ║
║ recommendations require your verification...              ║
╟───────────────────────────────────────────────────────────╢
║ ℹ️ Confidence Distribution:                               ║
║    ● High (3)  ● Medium (2)  ○ Low (1)                   ║
╟───────────────────────────────────────────────────────────╢
║ ┌─────────────────────────────────────────────────────┐ ║
║ │ Field       │ Current │ Suggested │ Confidence    │ ║ ║
║ ├─────────────┼─────────┼───────────┼───────────────┤ ║ ║
║ │ unit_name   │ pu1     │ Process…  │ ● 95%         │ ║ ║
║ │ unit_type   │ dist    │ Distill…  │ ● 92%         │ ║ ║
║ │ equip_tag   │ PU-01   │ PU-001…   │ ▲ 87%         │ ║ ║
║ │ location    │ bldg2   │ Building… │ ▲ 78%         │ ║ ║
║ │ criticality │ hi      │ High      │ ○ 65%         │ ║ ║
║ └─────────────────────────────────────────────────────┘ ║ ║
╟───────────────────────────────────────────────────────────╢
║ ⚠️  Verification Required:                                ║
║ These are AI-generated suggestions only. You must        ║
║ verify against your site documentation before applying.  ║
║ All changes can be reviewed and reverted after applying. ║
╟───────────────────────────────────────────────────────────╢
║ [Review & Apply Suggestions]  [Cancel]                   ║
╚═══════════════════════════════════════════════════════════╝

Border: 2px solid #44CCFF
Background: rgba(68, 204, 255, 0.03)
Padding: 24px
```

---

## AI Inline Suggestion

```
╔═══════════════════════════════════════════════════════════╗
║ ✨ [AI Suggested] 95% confidence                         ║
║                                                           ║
║ process_unit_type: dist → Distillation Column           ║
║ Based on nomenclature pattern: [type] + [abbrev]        ║
║                                                           ║
║                              [Accept]  [Reject]           ║
╚═══════════════════════════════════════════════════════════╝

Border: 1px solid #44CCFF
Background: rgba(68, 204, 255, 0.05)
Padding: 12px 16px
Height: Auto
```

---

## Confidence Indicators

```
HIGH (≥90%)          MEDIUM (75-89%)      LOW (<75%)
  ● 95%                ▲ 87%                ○ 65%
  
Symbol: ●             Symbol: ▲             Symbol: ○
Color: #44FF44        Color: #44CCFF        Color: #999999
Badge: success        Badge: neutral        Badge: neutral
```

### Visual Representation

```
High:    ●━━━━━━━━━━  (Green circle, solid)
Medium:  ▲━━━━━━━━━   (Blue triangle, solid)
Low:     ○- - - - -   (Gray circle, outline)
```

---

## Confirmation Dialog

```
┌─────────────────────────────────────────────────────────┐
│ AI Analysis                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ This AI assistant will analyze your data and generate  │
│ suggestions for your review.                           │
│                                                         │
│ Analysis scope:                                         │
│ • Process units                                         │
│ • Equipment tags                                        │
│ • Location names                                        │
│                                                         │
│ ⚠️  Important:                                          │
│ • All suggestions require your approval                 │
│ • No automatic changes will be made                     │
│ • You maintain full control over decisions              │
│                                                         │
│ Continue with AI analysis?                              │
│                                                         │
│                               [Cancel]  [OK]            │
└─────────────────────────────────────────────────────────┘
```

---

## Color Palette

### Primary vs AI Colors

```
PRIMARY YELLOW (Authoritative Commands)
┏━━━━━━━━━━━━━┓
┃   #FFCC00   ┃  Save, Confirm, Primary CTAs
┗━━━━━━━━━━━━━┛

AI INFO BLUE (Advisory Suggestions)
┌─────────────┐
│   #44CCFF   │  AI Suggest, Recommendations
└─────────────┘

Ratio: 1:0
Never use yellow for AI elements
Never use blue for primary actions
```

### Semantic Colors

```
Success (High Confidence)    Warning (Medium)       Neutral (Low)
┌───────────┐               ┌───────────┐          ┌───────────┐
│ #44FF44   │               │ #FFCC00   │          │ #999999   │
└───────────┘               └───────────┘          └───────────┘
Green                       Yellow                 Gray
```

### Background Tints

```
AI Light:    rgba(68, 204, 255, 0.03)  /* Panel background */
AI Medium:   rgba(68, 204, 255, 0.05)  /* Inline suggestion */
AI Strong:   rgba(68, 204, 255, 0.1)   /* Button background */
AI Border:   #44CCFF                   /* Solid border */
```

---

## Typography

```
Button Label:        14px, Semibold, Info Blue
Badge Text:          12px, Semibold, Info Blue
Panel Title:         20px, Semibold, White
Panel Description:   14px, Regular, Gray #CCCCCC
Table Header:        12px, Semibold, Uppercase, Gray
Table Cell:          14px, Regular, White
Suggested Value:     14px, Regular, Info Blue
Helper Text:         12px, Regular, Gray #999999
```

---

## Spacing

```
Panel Padding:        24px
Inline Padding:       12px 16px
Badge Padding:        2px 8px
Button Padding:       12px 24px
Table Cell Padding:   12px 16px
Gap Between Actions:  12px
Margin Bottom:        16px
```

---

## State Transitions

### Button Hover

```
Default → Hover

Background:  rgba(68, 204, 255, 0.1) → rgba(68, 204, 255, 0.15)
Border:      #44CCFF (no change)
Duration:    150ms ease-out
```

### Button Active

```
Hover → Active

Background:  rgba(68, 204, 255, 0.15) → rgba(68, 204, 255, 0.2)
Transform:   none (no movement for AI buttons)
Duration:    100ms ease-out
```

**Note:** No translateY transform for AI buttons to maintain advisory nature

---

## Layout Examples

### Trigger Analysis

```
┌─────────────────────────────────────────────────────────┐
│ Tag Nomenclature Cleanup                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Clean up inconsistent equipment tags and codes         │
│                                                         │
│ [✨ Analyze & Suggest Cleanup]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
     ↑
     AI button positioned prominently but not as primary CTA
```

### Review Suggestions

```
┌─────────────────────────────────────────────────────────┐
│ Review AI Suggestions                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ╔═══════════════════════════════════════════════════╗ │
│ ║ ✨ AI-Generated Suggestions  [AI-Suggested]      ║ │
│ ║                                                   ║ │
│ ║ [Suggestions table here]                          ║ │
│ ║                                                   ║ │
│ ║ ⚠️  Verification Required: ...                    ║ │
│ ║                                                   ║ │
│ ║ [Review & Apply]  [Cancel]                       ║ │
│ ╚═══════════════════════════════════════════════════╝ │
│                                                         │
│ [Continue to Next Step]                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
     ↑                        ↑
     AI panel                 Primary action below
```

### Inline Context

```
┌─────────────────────────────────────────────────────────┐
│ Process Unit Configuration                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Unit Name *                                             │
│ [Refinery Unit 1_______________________________]        │
│                                                         │
│ Unit Type *                                             │
│ [dist______________________________________]            │
│                                                         │
│ ╔═══════════════════════════════════════════════════╗ │
│ ║ ✨ [AI Suggested] 95%                            ║ │
│ ║ unit_type: dist → Distillation Column           ║ │
│ ║                              [Accept]  [Reject]  ║ │
│ ╚═══════════════════════════════════════════════════╝ │
│                                                         │
│ Location                                                │
│ [Building 2_________________________________]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
     ↑
     Inline suggestion flows naturally with form
```

---

## Accessibility

### Screen Reader Announcements

```html
<button
  className="btn-ai"
  aria-label="Trigger AI-assisted analysis. All suggestions will require your approval."
  data-ai-assist="true"
>
  <Sparkles aria-hidden="true" />
  Analyze & Suggest
</button>

Screen reader says:
"Button: Trigger AI-assisted analysis. All suggestions will require your approval."
```

### Badge Announcement

```html
<span className="badge-ai" role="status">
  AI-Suggested
</span>

Screen reader says:
"Status: AI-Suggested"
```

### Focus Indicators

```
Default:     No focus ring
Focus:       box-shadow: 0 0 0 3px rgba(68, 204, 255, 0.2)
Keyboard:    Always visible
Mouse:       Optional (focus-visible)
```

---

## Contrast Ratios (WCAG)

```
Info blue on black:       8.2:1  (AAA) ✓
Info blue on dark gray:   7.1:1  (AAA) ✓
White on info blue:       5.8:1  (AA)  ✓
Badge text:               8.2:1  (AAA) ✓
Border visibility:        4.5:1  (AA)  ✓
```

---

## Responsive Behavior

### Desktop (> 1024px)
```
AI Panel: Full width, table scrolls horizontally
Inline: Horizontal layout (content | actions)
Buttons: Full labels visible
```

### Tablet (768-1024px)
```
AI Panel: Full width, table scrolls
Inline: Horizontal layout (slightly tighter)
Buttons: Full labels
```

### Mobile (< 768px)
```
AI Panel: Full width, table becomes cards
Inline: Vertical layout (content above actions)
Buttons: Icon + "Suggest" (shorter label)
```

---

## Animation Guidelines

### DO Use
- Fade in for suggestions panel (150ms)
- Smooth background color transitions (150ms)
- Loading spinner during analysis

### DON'T Use
- Slide animations (too distracting)
- Bounce effects (not industrial)
- Scale transforms (unstable)
- Auto-scroll to suggestions (user control)

---

## Testing Checklist

### Visual
- [ ] AI button is info blue, not yellow
- [ ] "AI-Suggested" badge always visible
- [ ] Lower visual weight than primary buttons
- [ ] Confidence indicators display correctly
- [ ] Border color distinct (#44CCFF)

### Functional
- [ ] Confirmation dialog before analysis
- [ ] Accept button applies suggestion
- [ ] Reject button dismisses suggestion
- [ ] Cancel closes panel without changes
- [ ] Loading state shows during processing

### Compliance
- [ ] All AI content labeled as "AI-Suggested"
- [ ] Verification warnings prominent
- [ ] Basis/reasoning provided
- [ ] Confidence scores visible
- [ ] Human approval required

### Accessibility
- [ ] Screen reader announces "AI-Suggested"
- [ ] Keyboard navigation works
- [ ] Focus visible on all elements
- [ ] Color contrast ≥ 4.5:1
- [ ] ARIA labels present

---

## Quick Reference

### Colors
```css
--color-info:     #44CCFF   /* AI elements */
--color-primary:  #FFCC00   /* Primary actions */
--color-success:  #44FF44   /* High confidence */
--color-warning:  #FFCC00   /* Medium confidence */
```

### Classes
```css
.btn-ai                  /* AI button */
.badge-ai                /* AI badge */
.ai-suggestions-panel    /* Bulk panel */
.ai-inline-suggestion    /* Single suggestion */
.ai-summary              /* Confidence summary */
.ai-suggestions-table    /* Suggestion table */
```

### Icons
```tsx
<Sparkles />   /* AI indicator (✨) */
<Info />       /* Information (ℹ️) */
<AlertTriangle /> /* Warning (⚠️) */
<Check />      /* Accept (✓) */
<X />          /* Reject (✗) */
```

---

**END OF AI ASSISTANCE VISUAL GUIDE**

