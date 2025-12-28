# Normalized Onboarding Components Catalog

**Visual reference for all shared components**

---

## 📦 Component Library

### 1. StepHeader

```
┌────────────────────────────────────────────────────────────┐
│ [Info box - White border, subtle background]              │
│                                                             │
│  ℹ️  What are Process Units?                              │
│                                                             │
│     Process Units represent functional production          │
│     units within your site, such as reactors,             │
│     distillation columns, or compressors.                  │
│                                                             │
│     Unlike physical areas, process units define            │
│     what work is being done, not where it's located.      │
│                                                             │
│     Examples: Crude Distillation Unit, Catalytic          │
│     Cracker, Cooling Water System                         │
│                                                             │
└────────────────────────────────────────────────────────────┘

Props:
  title: string          // H3, white
  description: string    // Body text, #E0E0E0
  children?: ReactNode   // Optional additional content
```

---

### 2. EmptyState

```
┌────────────────────────────────────────────────────────────┐
│ [Dashed border, centered layout]                           │
│                                                             │
│                       ⚠️                                    │
│                                                             │
│              No Process Units Defined                       │
│                                                             │
│     Process units organize plant operations by             │
│     functional area. Without process units, you cannot:    │
│                                                             │
│     • Add plant tags                                       │
│     • Map OT assets                                        │
│     • Track operational risks                              │
│                                                             │
│         [Create First Process Unit]                        │
│         (Yellow button, sentence case)                     │
│                                                             │
└────────────────────────────────────────────────────────────┘

Props:
  icon: LucideIcon           // Icon component
  title: string              // What is missing
  description?: string       // Why it matters
  blockedActions?: string[]  // What you cannot do
  primaryAction?: Action     // How to resolve
  secondaryAction?: Action   // Alternative action
```

---

### 3. DataTable

```
┌────────────────────────────────────────────────────────────┐
│ [Table - Dark theme]                                       │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Unit Code  │ Name              │ Description  │ Actions││
│ ├──────────────────────────────────────────────────────┤  │
│ │ CDU-1      │ Crude Distill...  │ Primary...   │  🗑️   ││
│ │ FCC-1      │ Fluid Catalytic..  │ Secondary... │  🗑️   ││
│ │ CWS-1      │ Cooling Water...  │ Utility...   │  🗑️   ││
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Headers: 12px, bold, sentence case, white                  │
│ Cells: 14px, regular, #E0E0E0                              │
│ Hover: Yellow tint background                              │
└────────────────────────────────────────────────────────────┘

Props:
  columns: Column[]       // Column definitions
  data: any[]             // Row data
  onRowClick?: Function   // Optional row click handler
  emptyMessage?: string   // Empty state message
  maxHeight?: string      // Max height for scrolling

Column interface:
  key: string            // Data key
  header: string         // Column header (sentence case)
  render?: Function      // Custom cell renderer
  width?: string         // Column width
  align?: 'left'|'right' // Text alignment
```

---

### 4. StepFooter

```
┌────────────────────────────────────────────────────────────┐
│ [Border-top separator]                                     │
│                                                             │
│ ✅ 3 process units added    [Skip]  [Save & Continue]     │
│ (Status message)            (Secondary) (Primary)          │
│                                                             │
└────────────────────────────────────────────────────────────┘

With loading state:
┌────────────────────────────────────────────────────────────┐
│ ✅ 3 process units added    [Skip]  [⏳ Saving...]        │
└────────────────────────────────────────────────────────────┘

Props:
  statusMessage: string|ReactNode  // Left-side status
  primaryAction: Action            // Main CTA
  secondaryAction?: Action         // Optional skip/back
  showIcons?: boolean              // Show button icons

Action interface:
  label: string
  onClick: Function
  disabled?: boolean
  loading?: boolean
  testId?: string
```

---

### 5. AiAssistButton

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│  [✨ AI: Clean & Label Tags]                               │
│  (Purple border, purple text, light purple background)     │
│                                                             │
└────────────────────────────────────────────────────────────┘

Loading state:
┌────────────────────────────────────────────────────────────┐
│  [✨ Processing...]                                         │
└────────────────────────────────────────────────────────────┘

Props:
  label: string               // Button text
  onClick: Function           // Handler
  disabled?: boolean
  loading?: boolean
  testId?: string
  requiresConfirmation?: boolean  // Show confirm dialog
```

---

### 6. AiSuggestionsPanel

```
┌────────────────────────────────────────────────────────────┐
│ [Purple border, subtle purple background]                  │
│                                                             │
│  ✨  AI Suggestions                                        │
│                                                             │
│     Review these AI-generated suggestions. Click           │
│     "Apply" to use them.                                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Field   │ Current        │ AI Suggestion  │ Confidence││
│  ├──────────────────────────────────────────────────────┤ │
│  │ PI-101  │ No description │ Pressure Ind.  │ 95%      ││
│  │ TI-205  │ No description │ Temp Indicator │ 92%      ││
│  │ FI-301  │ Flow meter     │ Flow Indicator │ 88%      ││
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  [✓ Apply All Suggestions]  [Cancel]                      │
│  (Purple button)            (Secondary)                    │
│                                                             │
└────────────────────────────────────────────────────────────┘

Props:
  suggestions: AiSuggestion[]  // AI suggestions
  onApply: Function            // Apply handler
  onCancel: Function           // Cancel handler
  title?: string               // Panel title
  description?: string         // Panel description

AiSuggestion interface:
  id: string
  field: string          // Field identifier
  original: string|null  // Current value
  suggested: string      // AI suggestion
  confidence?: number    // Confidence score (0-1)
```

---

### 7. FormSection

```
┌────────────────────────────────────────────────────────────┐
│ [Yellow border, subtle yellow background - highlight]     │
│                                                             │
│  Add Process Unit                                          │
│                                                             │
│  [Form fields inside...]                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘

Or default variant:
┌────────────────────────────────────────────────────────────┐
│ [Gray border, no background]                               │
│                                                             │
│  Select Options                                            │
│                                                             │
│  [Form fields inside...]                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘

Props:
  title?: string              // Section title
  description?: string        // Section description
  children: ReactNode         // Form content
  variant?: 'default'|'highlight'  // Style variant
```

---

### 8. FormField + FormInput

```
┌────────────────────────────────────────────────────────────┐
│  Unit Code *                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │ CDU-1                                              │   │
│  └────────────────────────────────────────────────────┘   │
│  Short identifier (e.g., CDU-1, FCC-2)                    │
└────────────────────────────────────────────────────────────┘

Focus state:
┌────────────────────────────────────────────────────────────┐
│  Unit Code *                                               │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ CDU-1                                              ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│  (Yellow border, yellow shadow ring)                      │
└────────────────────────────────────────────────────────────┘

Error state:
┌────────────────────────────────────────────────────────────┐
│  Unit Code *                                               │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃                                                    ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│  This field is required                                   │
│  (Red border, red error text)                             │
└────────────────────────────────────────────────────────────┘

FormField Props:
  label: string          // Field label
  required?: boolean     // Show asterisk
  hint?: string          // Helper text
  error?: string         // Error message
  children: ReactNode    // Input component

FormInput Props:
  ...standard input props
  error?: boolean        // Error state
```

---

### 9. ProgressIndicator

```
Success variant:
┌────────────────────────────────────────────────────────────┐
│  ✅ 3 process units added                                  │
└────────────────────────────────────────────────────────────┘

Count variant:
┌────────────────────────────────────────────────────────────┐
│  15 tags of 50                                             │
└────────────────────────────────────────────────────────────┘

Empty state:
┌────────────────────────────────────────────────────────────┐
│  Add process units to continue                             │
└────────────────────────────────────────────────────────────┘

Props:
  currentCount: number      // Items added
  totalCount?: number       // Total expected
  label?: string            // Singular label ("tag", "unit")
  variant?: 'count'|'success'  // Style variant
```

---

## 🎨 Color Palette Reference

```
┌─────────────────────────────────────────────────────────┐
│  COMPONENT COLOR USAGE                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  StepHeader (Info):    White border, subtle bg          │
│  EmptyState:           Gray border (dashed)             │
│  DataTable:            White borders, yellow hover      │
│  StepFooter:           White border-top                 │
│  AiAssistButton:       Purple border, purple bg         │
│  AiSuggestionsPanel:   Purple border, purple bg         │
│  FormSection:          Yellow (highlight) / Gray        │
│  FormInput (focus):    Yellow border + shadow           │
│  FormInput (error):    Red border                       │
│  ProgressIndicator:    Green checkmark (success)        │
│                                                          │
└─────────────────────────────────────────────────────────┘

SEMANTIC COLORS:
- Info/Educational: White (#FFF border)
- Warning: Yellow (#FFCC00)
- Error: Red (#FF4444)
- Success: Green (#44FF44)
- AI Features: Purple (#A855F7)
- Inactive: Gray (#999)
```

---

## 📏 Spacing Reference

```
┌─────────────────────────────────────────────────────────┐
│  COMPONENT SPACING                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  StepHeader:                                            │
│    Internal: 24px padding                               │
│    Gap to next: 24px                                    │
│                                                          │
│  DataTable:                                             │
│    Cell padding: 12px (horizontal + vertical)           │
│    Gap to next: 24px                                    │
│                                                          │
│  EmptyState:                                            │
│    Internal: 48px padding (spacious)                    │
│    Gap to next: 24px                                    │
│                                                          │
│  FormSection:                                           │
│    Internal: 24px padding                               │
│    Field gaps: 16px                                     │
│    Gap to next: 24px                                    │
│                                                          │
│  StepFooter:                                            │
│    Top border + 24px padding above                      │
│    Internal: 16px padding                               │
│    Button gap: 12px                                     │
│                                                          │
│  AiSuggestionsPanel:                                    │
│    Internal: 24px padding                               │
│    Table max-height: 400px (scrollable)                 │
│    Gap to next: 24px                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘

SPACING SCALE:
  xs: 4px     sm: 8px      md: 12px     lg: 16px
  xl: 24px    2xl: 32px    3xl: 48px
```

---

## 🔤 Typography Reference

```
┌─────────────────────────────────────────────────────────┐
│  COMPONENT TYPOGRAPHY                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  StepHeader title:        16px, semibold, white         │
│  StepHeader body:         14px, regular, #E0E0E0        │
│                                                          │
│  EmptyState title:        16px, semibold, white         │
│  EmptyState description:  14px, regular, #E0E0E0        │
│                                                          │
│  DataTable headers:       12px, bold, sentence case     │
│  DataTable cells:         14px, regular, #E0E0E0        │
│                                                          │
│  FormSection title:       16px, semibold, white         │
│  FormField label:         14px, semibold, white         │
│  FormField hint:          12px, regular, #999           │
│  FormField error:         12px, regular, red            │
│  FormInput text:          14px, regular, white          │
│                                                          │
│  Button text:             14px, bold, sentence case     │
│                                                          │
│  ProgressIndicator:       14px, regular, #E0E0E0        │
│                                                          │
└─────────────────────────────────────────────────────────┘

IMPORTANT RULES:
- Headers: Sentence case (NOT uppercase)
- Buttons: Sentence case (NOT uppercase)
- Table headers: Sentence case (NOT uppercase)
- Table cells: 14px (NOT 12px for readability)
```

---

## 🎯 Component Selection Guide

**Need to explain a concept?**  
→ Use `<StepHeader>`

**Need to show when data is empty?**  
→ Use `<EmptyState>` with What/Why/How structure

**Need to display a list/table?**  
→ Use `<DataTable>` with column definitions

**Need a form to add/edit data?**  
→ Use `<FormSection>` + `<FormField>` + `<FormInput/Select/Textarea>`

**Need AI features?**  
→ Use `<AiAssistButton>` + `<AiSuggestionsPanel>`

**Need to show progress/status?**  
→ Use `<ProgressIndicator>` in footer statusMessage

**Need action buttons at bottom?**  
→ Use `<StepFooter>` with primaryAction + optional secondaryAction

---

## ✅ Quality Checklist

When using these components, verify:

**Visual:**
- [ ] Colors match design system (white/yellow/green/red/purple)
- [ ] Typography follows size/weight/case rules
- [ ] Spacing uses 4px rhythm (4, 8, 12, 16, 24, 32, 48)
- [ ] Borders are consistent (dashed for empty, solid for sections)

**Interaction:**
- [ ] Focus states show yellow border + shadow
- [ ] Hover states are subtle (no transforms)
- [ ] Loading states show spinner + text
- [ ] Disabled states are 50% opacity
- [ ] Error states show red border + message

**Accessibility:**
- [ ] All interactive elements ≥44px height
- [ ] Focus visible on keyboard navigation
- [ ] Labels associated with inputs
- [ ] Error messages descriptive
- [ ] Test IDs provided for automation

**Content:**
- [ ] Empty states explain What/Why/How
- [ ] Educational headers provide context
- [ ] Button text is specific ("Save & Continue" not "Next")
- [ ] Error messages are actionable
- [ ] AI features require confirmation

---

**This catalog serves as the visual reference for all normalized onboarding components.** Use it when building or reviewing onboarding steps to ensure consistency.
