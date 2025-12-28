# AI Brand Voice Guidelines for OT Continuum

**Version:** 1.0  
**Audience:** Industrial operators, plant managers, OT security professionals  
**Context:** Mission-critical operational technology risk management

---

## 🎯 Core Principles

### 1. **Confident, Not Authoritative**

AI suggestions are **advisory tools**, not automated decisions. They inform human judgment, never replace it.

**✅ Good:**
- "Based on ISA-95 naming patterns, this tag likely represents..."
- "Consider reviewing these mappings for process unit alignment"
- "Pattern analysis suggests this asset type is..."

**❌ Bad:**
- "This tag IS a pressure indicator"
- "You should map these assets immediately"
- "The AI has determined the correct classification"

### 2. **Technical, Not Vague**

Use specific, operations-focused language. Avoid generic tech-speak.

**✅ Good:**
- "Based on ISA-5.1 tag nomenclature (PI-prefix)"
- "Matches DCS communication protocol patterns"
- "Aligns with ANSI/ISA-88 batch control structure"

**❌ Bad:**
- "The AI analyzed the data"
- "Smart suggestions based on machine learning"
- "Our intelligent system recommends..."

### 3. **Non-Speculative**

State what was analyzed and what patterns were found. Don't guess or assume.

**✅ Good:**
- "Tag prefix 'PI-' matches pressure instrumentation convention"
- "Asset appears in 3 process units, typical for shared safety systems"
- "Description field is blank (47% of imported tags)"

**❌ Bad:**
- "This might be a pressure sensor"
- "Probably belongs to the cooling system"
- "Could indicate a DCS configuration issue"

### 4. **Operations-Focused**

Frame suggestions in terms of operational outcomes, not AI capabilities.

**✅ Good:**
- "Standardizing tag descriptions improves signal traceability during incidents"
- "Complete process unit mappings enable accurate risk scoring"
- "Identifying shared assets helps scope maintenance windows"

**❌ Bad:**
- "Our AI can analyze your tags!"
- "Let machine learning optimize your workflow"
- "Experience the power of intelligent automation"

### 5. **No Anthropomorphism**

AI doesn't "think," "believe," "understand," or "know." It analyzes patterns.

**✅ Good:**
- "Pattern analysis identified..."
- "Based on nomenclature matching..."
- "Analysis of tag structure suggests..."

**❌ Bad:**
- "The AI thinks this is..."
- "Our system understands your data"
- "The assistant knows what you need"
- "AI believes this mapping is correct"

---

## 📝 Copy Patterns

### Button Labels

**Format:** `Action: Specific Outcome` (no "AI magic" framing)

**✅ Good:**
```
- "Analyze Tag Nomenclature"
- "Suggest Mappings by Protocol"
- "Review Asset Classifications"
- "Identify Missing Descriptions"
```

**❌ Bad:**
```
- "AI Magic ✨"
- "Smart Cleanup"
- "Let AI Help"
- "Automagically Fix"
```

### Panel Titles

**Format:** Clear identification as AI-generated, specific scope

**✅ Good:**
```
- "AI-Suggested Tag Descriptions (ISA-5.1 Based)"
- "Pattern-Based Mapping Recommendations"
- "Asset Classification Proposals (Review Required)"
```

**❌ Bad:**
```
- "Smart Suggestions"
- "AI Insights"
- "Intelligent Recommendations"
- "What We Found"
```

### Descriptions

**Format:** What was analyzed, what patterns were found, what action to take

**✅ Good:**
```
"Analysis of 47 tags found 32 with blank descriptions. Based on ISA-5.1 
nomenclature patterns, suggestions below provide standard descriptions. 
Review each suggestion before applying to ensure site-specific accuracy."
```

**❌ Bad:**
```
"Our AI analyzed your tags and found some issues! We've generated smart 
suggestions to help you out. Just click apply and let the magic happen!"
```

### Confirmation Dialogs

**Format:** What will happen, what won't happen, user responsibility

**✅ Good:**
```
"This analysis will:
• Parse tag nomenclature using ISA-5.1 patterns
• Suggest descriptions based on prefix/suffix matching
• Flag tags that don't match standard conventions

You will review and approve each suggestion individually.
No automatic changes will be applied.

Continue with analysis?"
```

**❌ Bad:**
```
"Let our AI assistant analyze your tags and make improvements!
The system will intelligently enhance your data.
Ready to get started?"
```

---

## 🎨 Visual Distinction

### Suggested vs. Verified Data

AI suggestions must be **visually distinct** from verified, human-confirmed data.

**Suggested Data (AI):**
- Purple accent color (#A855F7)
- "AI-Suggested" label always visible
- Italicized text or special formatting
- Confidence scores shown when available
- Requires explicit user approval

**Verified Data (Human-Confirmed):**
- Standard white/yellow color scheme
- No special labeling
- Regular text formatting
- No confidence scores
- Editable/deletable by user

**Example:**

```
┌─────────────────────────────────────────────────────┐
│ Tag: PI-101                                         │
├─────────────────────────────────────────────────────┤
│ Current Description:                                │
│   [blank]                                           │
│                                                      │
│ AI-Suggested Description: (ISA-5.1 Pattern Match)  │
│   Pressure Indicator - Reactor Inlet                │
│   Confidence: 87%                                   │
│   [Review] [Apply] [Reject]                        │
│                                                      │
│ After applying, you can edit or revert this change.│
└─────────────────────────────────────────────────────┘
```

---

## 📊 Confidence Score Presentation

When showing confidence scores, frame them as **pattern match strength**, not AI certainty.

**✅ Good:**
```
"Pattern Match: 92% (PI- prefix + reactor tag range)"
"Nomenclature Alignment: 78% (partial ISA-5.1 compliance)"
"Protocol Similarity: 85% (Modbus TCP register pattern)"
```

**❌ Bad:**
```
"AI Confidence: 92%"
"How sure we are: 78%"
"Certainty Level: 85%"
```

### Thresholds

- **90-100%:** Strong pattern match (green indicator)
- **75-89%:** Moderate pattern match (yellow indicator)
- **Below 75%:** Weak pattern match (gray indicator, not shown to user)

**Never auto-apply suggestions below 90% confidence.**

---

## 🔍 Error Handling

When AI analysis fails or finds no patterns, be specific about what didn't work.

**✅ Good:**
```
"Analysis complete: No ISA-5.1 nomenclature patterns detected in tag names.

Your tags may use:
• Site-specific naming conventions
• Legacy numbering systems
• Non-standard abbreviations

Manual description entry recommended. Consider documenting your 
site's tag nomenclature standard for future reference."
```

**❌ Bad:**
```
"Oops! Our AI couldn't figure out your tags.
Try uploading better data or contact support."
```

---

## 🎯 Use Case Examples

### 1. Tag Description Cleanup

**Button Label:**
```
"Analyze Tag Nomenclature"
```

**Confirmation Dialog:**
```
Nomenclature Analysis

This analysis will parse tag names using ISA-5.1 instrumentation 
standards to suggest descriptions for tags with missing or incomplete 
metadata.

Analysis scope:
• 47 tags with blank descriptions
• ISA-5.1 prefix/suffix pattern matching
• Process unit context consideration

You will review each suggestion before applying.
Estimated time: 30 seconds

Continue?   [Cancel] [Analyze Tags]
```

**Results Panel Title:**
```
Tag Description Suggestions (ISA-5.1 Based)
```

**Results Panel Description:**
```
Based on ISA-5.1 nomenclature analysis, 32 of 47 tags match standard 
instrumentation patterns. Review each suggestion below and apply those 
that align with your site's conventions.

Pattern match confidence scores indicate nomenclature alignment 
strength. Verify suggestions against your P&ID documentation.
```

**Individual Suggestion:**
```
┌─────────────────────────────────────────────────────┐
│ Tag: FIC-205                                        │
│                                                      │
│ Current: [blank]                                    │
│                                                      │
│ AI-Suggested: Flow Indicator Controller             │
│ Pattern Match: 94% (FIC- prefix, -205 range)       │
│ Basis: ISA-5.1 functional identifier convention     │
│                                                      │
│ [Apply This Suggestion] [Skip]                     │
└─────────────────────────────────────────────────────┘
```

### 2. Asset-to-Process-Unit Mapping

**Button Label:**
```
"Suggest Mappings by Protocol"
```

**Confirmation Dialog:**
```
Protocol-Based Mapping Analysis

This analysis will examine asset communication protocols and process 
unit associations to suggest many-to-many mappings.

Analysis basis:
• Asset protocol types (Modbus, Ethernet/IP, OPC-UA)
• Existing partial mappings (23 assets already mapped)
• Process unit boundary definitions

You will review mapping suggestions in a bulk interface before 
approving. No mappings are created automatically.

Continue?   [Cancel] [Analyze Protocols]
```

**Results Panel Title:**
```
Asset Mapping Recommendations (Protocol-Based)
```

**Results Panel Description:**
```
Analysis of 156 assets identified 89 potential mappings based on 
protocol alignment with process unit control systems. 

Safety systems (PLC-based) appear in multiple process units as 
expected. DCS controllers show 1:1 process unit association.

Review suggested mappings below. Verify against your network 
segmentation and control architecture documentation.
```

### 3. Missing Data Identification

**Button Label:**
```
"Identify Missing Metadata"
```

**Results Panel:**
```
Data Completeness Report

Analysis of 156 OT assets found:

Required fields missing:
• IP Address: 12 assets (8%)
• Vendor: 0 assets (0%) ✓
• Model: 5 assets (3%)
• Firmware Version: 89 assets (57%)

Optional but recommended:
• Asset Owner: 34 assets (22%)
• Commissioning Date: 67 assets (43%)
• Maintenance Schedule: 112 assets (72%)

Incomplete data reduces risk scoring accuracy. Consider prioritizing:
1. Firmware version collection (critical for CVE matching)
2. IP address verification (needed for network monitoring)
3. Commissioning date (helps estimate lifecycle stage)

[Export Missing Data Report] [Close]
```

---

## ❌ What to Avoid

### Playful Language
```
❌ "Let's clean up those messy tags!"
❌ "Time to supercharge your asset data!"
❌ "Watch the magic happen ✨"
❌ "AI to the rescue!"
```

### Anthropomorphism
```
❌ "The AI assistant thinks this is a pressure sensor"
❌ "Our system learned your naming patterns"
❌ "The model understands your site layout"
❌ "Smart suggestions from your AI companion"
```

### Vague Tech-Speak
```
❌ "Using advanced machine learning algorithms..."
❌ "Powered by cutting-edge AI technology"
❌ "Intelligent data enhancement"
❌ "Next-generation automation"
```

### Overconfidence
```
❌ "Guaranteed accurate classifications"
❌ "100% automated mapping"
❌ "No human review needed"
❌ "Trust our AI to handle it"
```

### Consumer App Tone
```
❌ "Yay! We found 32 tags to improve!"
❌ "Uh oh, looks like some data is missing"
❌ "Great job! Your tags are looking better"
❌ "Oopsie! Something went wrong"
```

---

## ✅ Voice Checklist

Before releasing any AI feature copy, verify:

**Tone:**
- [ ] Confident but not authoritative
- [ ] Advisory, not prescriptive
- [ ] Technical and specific, not vague
- [ ] Operations-focused, not feature-focused

**Language:**
- [ ] No anthropomorphism (AI doesn't "think")
- [ ] No speculation ("might," "probably," "could be")
- [ ] No playful or casual language
- [ ] No consumer app tone

**Clarity:**
- [ ] States what was analyzed
- [ ] Explains the pattern/basis
- [ ] Provides confidence context
- [ ] Describes user's next action

**Visual:**
- [ ] "AI-Suggested" label visible
- [ ] Purple color differentiation
- [ ] Confidence scores explained
- [ ] Approval mechanism clear

**Trust:**
- [ ] User approval required
- [ ] Revert/edit option mentioned
- [ ] Verification against documentation encouraged
- [ ] No automatic application without review

---

## 📋 Copy Templates

### Button Label Template
```
[Verb] [Specific Object/Pattern]

Examples:
- "Analyze Tag Nomenclature"
- "Suggest Process Unit Mappings"
- "Review Asset Classifications"
```

### Confirmation Dialog Template
```
[Analysis Type]

[What this analysis does - 1 sentence]

[Scope section:]
• [Specific detail 1]
• [Specific detail 2]
• [Specific detail 3]

[User control statement]
[Time estimate]

[Question]   [Cancel Button] [Action Button]
```

### Results Panel Template
```
[Suggestion Type] ([Basis/Method])

[Summary of findings - 2-3 sentences stating what was found and any notable patterns]

[User instruction - what to do next]
```

### Individual Suggestion Template
```
[Item Identifier]

Current: [current value or "blank"]

AI-Suggested: [suggested value]
Pattern Match: [confidence %] ([brief basis])
Basis: [technical explanation]

[Action Buttons]
```

---

## 🎓 Training Examples

### Example 1: Tag Cleanup

**Scenario:** 100 tags imported from CSV, 60 have no descriptions

**❌ Bad Copy:**
```
Button: "AI Magic ✨"
Dialog: "Let our smart AI analyze your tags and make them better!"
Results: "We found 60 tags that need love! Here are our suggestions:"
```

**✅ Good Copy:**
```
Button: "Analyze Tag Nomenclature"

Dialog:
"Nomenclature Analysis

Parse tag names using ISA-5.1 instrumentation patterns to suggest 
descriptions for 60 tags with missing metadata.

Analysis basis:
• ISA-5.1 functional identifier prefixes (PI-, TI-, FIC-, etc.)
• Tag numbering range patterns
• Process unit context

You will review each suggestion individually.
Estimated time: 45 seconds

Continue?   [Cancel] [Analyze Tags]"

Results:
"Tag Description Suggestions (ISA-5.1 Based)

Nomenclature analysis matched 47 of 60 tags to standard ISA-5.1 
patterns. 13 tags use non-standard naming and require manual entry.

Review suggestions below. Verify against your site's P&ID 
documentation before applying."
```

### Example 2: Asset Mapping

**Scenario:** Suggest which assets belong to which process units based on network data

**❌ Bad Copy:**
```
Button: "Smart Mapping"
Panel: "Our AI figured out where your assets should go! Just click 
        Apply All to automatically map everything."
```

**✅ Good Copy:**
```
Button: "Suggest Mappings by Network Segment"

Panel:
"Network-Based Mapping Recommendations

Analysis of asset IP addresses identified 127 potential process unit 
associations based on network segmentation alignment.

Note: Safety systems (PLC-based) intentionally span multiple process 
units. DCS controllers show expected 1:1 associations.

Review each suggested mapping below. Verify against your control 
system architecture and network topology documentation.

[Bulk Review Interface]"
```

---

## 🚀 Implementation Checklist

For every new AI feature:

**Pre-Development:**
- [ ] Define analysis method (what patterns/rules)
- [ ] Determine confidence threshold (when to show suggestions)
- [ ] Write technical basis explanation
- [ ] Define user approval workflow

**Development:**
- [ ] Use approved copy templates
- [ ] Implement purple visual distinction
- [ ] Add "AI-Suggested" labels
- [ ] Include confidence scores with context
- [ ] Require explicit user approval
- [ ] Provide revert/edit mechanisms

**Review:**
- [ ] Voice checklist passed
- [ ] No anthropomorphic language
- [ ] No playful/casual tone
- [ ] Technical explanations present
- [ ] Confidence framing clear
- [ ] User control explicit

**Testing:**
- [ ] Test with operators (40+ years old)
- [ ] Verify language feels trustworthy
- [ ] Confirm suggestions don't feel authoritative
- [ ] Validate approval workflow is clear

---

**This document is the authoritative guide for all AI feature copy in OT Continuum.** All AI-assisted elements must comply with these guidelines to maintain trust with operators and executives.
