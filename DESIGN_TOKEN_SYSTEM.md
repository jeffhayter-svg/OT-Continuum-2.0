# OT Continuum Design Token System

**Version:** 2.0  
**Last Updated:** December 26, 2024  
**Status:** Foundation Ready - Not Yet Applied

---

## 📘 Purpose

This document defines the complete design token system for OT Continuum, a multi-tenant operational technology risk management platform. These tokens create a cohesive, accessible dark theme optimized for industrial control room environments where operators monitor critical systems 24/7.

**Key Requirements:**
- High contrast for readability in varied lighting conditions
- Minimal cognitive load for operators under stress
- Yellow accent for critical attention points (industry standard warning color)
- Professional, utilitarian aesthetic appropriate for industrial settings
- Accessibility compliance (WCAG AAA where possible)

---

## 🎨 COLOR TOKENS

### Core Brand Colors

```css
/* Primary Brand Colors */
--color-brand-black: #000000;      /* Primary background, text on light surfaces */
--color-brand-white: #FFFFFF;      /* Primary text, headings, icons */
--color-brand-gray: #CCCCCC;       /* Secondary text, body copy */
--color-brand-yellow: #FFCC00;     /* Accent, primary actions, warnings */

/* Extended Palette */
--color-brand-green: #44FF44;      /* Success states, operational normal */
--color-brand-red: #FF4444;        /* Error states, critical alerts */
--color-brand-blue: #4488FF;       /* Informational (optional, not in current theme) */
--color-brand-orange: #FF8844;     /* Medium priority (optional) */
```

**Rationale:**
- Black background reduces eye strain during long shifts
- Yellow (#FFCC00) chosen for 15:1 contrast ratio on black (WCAG AAA)
- Green (#44FF44) represents normal operations in industrial HMI systems
- Red (#FF4444) for critical alarms (universal industrial standard)

---

### Semantic Color Tokens

#### Background Colors

```css
/* Primary backgrounds */
--color-bg-primary: #000000;                  /* Main app background */
--color-bg-secondary: #0A0A0A;                /* Subtle variation for depth */
--color-bg-tertiary: #1A1A1A;                 /* Card and panel backgrounds */

/* Elevated surfaces */
--color-bg-elevated-1: #1A1A1A;               /* Cards, modals */
--color-bg-elevated-2: #262626;               /* Nested cards, dropdowns */
--color-bg-elevated-3: #333333;               /* Highest elevation (tooltips) */

/* Interactive backgrounds */
--color-bg-input: rgba(255, 255, 255, 0.05);  /* Form inputs default */
--color-bg-input-hover: rgba(255, 255, 255, 0.08); /* Form inputs hover */
--color-bg-input-focus: rgba(255, 255, 255, 0.10); /* Form inputs focus */
--color-bg-input-disabled: rgba(255, 255, 255, 0.02); /* Disabled inputs */

/* Overlay backgrounds */
--color-bg-overlay: rgba(0, 0, 0, 0.85);      /* Modal backdrop */
--color-bg-overlay-heavy: rgba(0, 0, 0, 0.95); /* Loading screen */

/* Semantic backgrounds */
--color-bg-success: rgba(68, 255, 68, 0.1);   /* Success alert background */
--color-bg-error: rgba(255, 68, 68, 0.1);     /* Error alert background */
--color-bg-warning: rgba(255, 204, 0, 0.1);   /* Warning alert background */
--color-bg-info: rgba(255, 255, 255, 0.05);   /* Info alert background */

/* Hover states */
--color-bg-hover-subtle: rgba(255, 255, 255, 0.05);
--color-bg-hover-accent: rgba(255, 204, 0, 0.05);
```

#### Text Colors

```css
/* Primary text */
--color-text-primary: #FFFFFF;                /* Headings, labels, important text */
--color-text-secondary: #CCCCCC;              /* Body text, descriptions */
--color-text-tertiary: #999999;               /* Hints, placeholders */
--color-text-disabled: rgba(255, 255, 255, 0.4); /* Disabled text */

/* Text on colored backgrounds */
--color-text-on-accent: #000000;              /* Text on yellow */
--color-text-on-success: #000000;             /* Text on green */
--color-text-on-error: #FFFFFF;               /* Text on red */
--color-text-on-dark: #FFFFFF;                /* Text on dark surfaces */

/* Semantic text colors */
--color-text-accent: #FFCC00;                 /* Accent text, links */
--color-text-success: #44FF44;                /* Success messages */
--color-text-error: #FF4444;                  /* Error messages */
--color-text-warning: #FFCC00;                /* Warning messages */
--color-text-info: #FFFFFF;                   /* Info messages */

/* Code and technical text */
--color-text-code: #FFCC00;                   /* Inline code */
--color-text-code-bg: rgba(255, 204, 0, 0.1); /* Code background */
```

**Contrast Ratios (WCAG Compliance):**
- Primary text on black: 21:1 (AAA)
- Secondary text on black: 12:1 (AAA)
- Yellow on black: 15:1 (AAA)
- Green on black: 13:1 (AAA)
- Red on black: 4.9:1 (AA)

#### Border Colors

```css
/* Standard borders */
--color-border-default: rgba(255, 255, 255, 0.2);   /* Default border */
--color-border-subtle: rgba(255, 255, 255, 0.1);    /* Subtle dividers */
--color-border-strong: rgba(255, 255, 255, 0.3);    /* Strong borders */

/* Input borders */
--color-border-input: rgba(255, 255, 255, 0.3);     /* Form field default */
--color-border-input-hover: rgba(255, 255, 255, 0.4);
--color-border-input-focus: #FFCC00;                /* Focus state */
--color-border-input-error: #FF4444;                /* Error state */

/* Semantic borders */
--color-border-success: #44FF44;
--color-border-error: #FF4444;
--color-border-warning: #FFCC00;
--color-border-info: rgba(255, 255, 255, 0.3);
```

#### Interactive State Colors

```css
/* Focus states */
--color-focus-ring: #FFCC00;
--color-focus-ring-alpha: rgba(255, 204, 0, 0.3);

/* Selection */
--color-selection-bg: rgba(255, 204, 0, 0.3);
--color-selection-text: #000000;

/* Disabled states */
--color-disabled-bg: rgba(255, 255, 255, 0.02);
--color-disabled-text: rgba(255, 255, 255, 0.4);
--color-disabled-border: rgba(255, 255, 255, 0.1);
```

---

## 🔤 TYPOGRAPHY TOKENS

### Font Families

```css
/* Primary font stack */
--font-family-primary: 'Inter', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;

/* Monospace for code and technical identifiers */
--font-family-mono: 'Courier New', 'Consolas', 'Monaco', 'Menlo', monospace;

/* System fallback (if fonts fail to load) */
--font-family-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

**Rationale:**
- Inter: Optimized for screen legibility, wide character support
- IBM Plex Sans: Backup with similar metrics to Inter
- System fonts: Fast loading fallback

**⚠️ USABILITY RESOLUTION:** See `/BRAND_VS_USABILITY_RESOLUTIONS.md` for all typography conflict resolutions, including:
- Button text: Sentence case (NOT uppercase) for 10% faster recognition
- Table headers: Sentence case (NOT uppercase) for 12% faster scanning  
- Table cells: 14px minimum (NOT 12px) for extended readability
- Long-form text: White/bright gray only (NOT yellow) to prevent eye strain

### Font Sizes

```css
/* Type scale (based on 14px base) */
--font-size-2xs: 10px;      /* 0.714rem - Micro text, legal */
--font-size-xs: 11px;       /* 0.786rem - Tiny labels */
--font-size-sm: 12px;       /* 0.857rem - Small text, captions, TABLE HEADERS */
--font-size-base: 14px;     /* 1rem - Body text, inputs, TABLE CELLS */
--font-size-md: 16px;       /* 1.143rem - H3, emphasized body */
--font-size-lg: 18px;       /* 1.286rem - H2, section headers */
--font-size-xl: 20px;       /* 1.429rem - Large headers */
--font-size-2xl: 24px;      /* 1.714rem - H1, page titles */
--font-size-3xl: 32px;      /* 2.286rem - Display text */
--font-size-4xl: 40px;      /* 2.857rem - Hero text */

/* Semantic font sizes */
--font-size-h1: 24px;
--font-size-h2: 18px;
--font-size-h3: 16px;
--font-size-body: 14px;
--font-size-small: 12px;
--font-size-tiny: 11px;

/* USABILITY OVERRIDE: Table-specific sizes */
--font-size-table-cell: 14px;    /* NOT 12px - readability over density */
--font-size-table-header: 12px;  /* Acceptable for headers (bold, short) */
```

### Font Weights

```css
--font-weight-light: 300;
--font-weight-regular: 400;    /* Body text */
--font-weight-medium: 500;
--font-weight-semibold: 600;   /* H2, H3, labels */
--font-weight-bold: 700;       /* H1, buttons, strong emphasis */
--font-weight-extrabold: 800;
```

### Line Heights

```css
/* Relative line heights */
--line-height-tight: 1.2;      /* Headings */
--line-height-snug: 1.3;       /* H1, compact text */
--line-height-normal: 1.5;     /* H3, short paragraphs */
--line-height-relaxed: 1.6;    /* Body text, forms */
--line-height-loose: 1.8;      /* Long-form content */

/* Fixed line heights for consistency */
--line-height-input: 1.5;      /* Form inputs */
--line-height-button: 1.2;     /* Button text */
```

### Letter Spacing

```css
--letter-spacing-tight: -0.5px;   /* Large headings */
--letter-spacing-normal: 0px;     /* Body text */
--letter-spacing-wide: 0.5px;     /* Buttons, badges, uppercase */
--letter-spacing-wider: 1px;      /* All-caps headings */
```

### Typography Semantic Tokens

```css
/* Heading tokens (composite) */
--typography-h1: var(--font-weight-bold) var(--font-size-h1)/var(--line-height-snug) var(--font-family-primary);
--typography-h2: var(--font-weight-semibold) var(--font-size-h2)/var(--line-height-normal) var(--font-family-primary);
--typography-h3: var(--font-weight-semibold) var(--font-size-h3)/var(--line-height-normal) var(--font-family-primary);

/* Body tokens */
--typography-body: var(--font-weight-regular) var(--font-size-body)/var(--line-height-relaxed) var(--font-family-primary);
--typography-body-strong: var(--font-weight-semibold) var(--font-size-body)/var(--line-height-relaxed) var(--font-family-primary);

/* Utility tokens */
--typography-small: var(--font-weight-regular) var(--font-size-small)/var(--line-height-normal) var(--font-family-primary);
--typography-code: var(--font-weight-regular) var(--font-size-small)/var(--line-height-normal) var(--font-family-mono);
--typography-button: var(--font-weight-bold) var(--font-size-body)/var(--line-height-button) var(--font-family-primary);
```

---

## 📏 SPACING TOKENS

### Base Spacing Scale

```css
/* Base unit: 4px (0.25rem) */
--spacing-0: 0px;       /* No spacing */
--spacing-0-5: 2px;     /* Hairline spacing */
--spacing-1: 4px;       /* 0.25rem - Minimum touch target spacing */
--spacing-2: 8px;       /* 0.5rem - Compact spacing */
--spacing-3: 12px;      /* 0.75rem - Default spacing */
--spacing-4: 16px;      /* 1rem - Standard spacing */
--spacing-5: 20px;      /* 1.25rem */
--spacing-6: 24px;      /* 1.5rem - Large spacing */
--spacing-8: 32px;      /* 2rem - Section spacing */
--spacing-10: 40px;     /* 2.5rem */
--spacing-12: 48px;     /* 3rem - Major section spacing */
--spacing-16: 64px;     /* 4rem - Page-level spacing */
--spacing-20: 80px;     /* 5rem */
--spacing-24: 96px;     /* 6rem - Hero spacing */

/* Semantic spacing aliases */
--spacing-xs: 4px;      /* Extra small */
--spacing-sm: 8px;      /* Small */
--spacing-md: 12px;     /* Medium (default) */
--spacing-lg: 16px;     /* Large */
--spacing-xl: 24px;     /* Extra large */
--spacing-2xl: 32px;    /* 2X large */
--spacing-3xl: 48px;    /* 3X large */
```

### Component-Specific Spacing

```css
/* Buttons */
--spacing-button-x: 12px;          /* Horizontal padding */
--spacing-button-y: 12px;          /* Vertical padding */
--spacing-button-gap: 8px;         /* Gap between button icon and text */

/* Inputs */
--spacing-input-x: 12px;
--spacing-input-y: 12px;
--spacing-label-gap: 6px;          /* Gap between label and input */

/* Cards */
--spacing-card-padding: 24px;      /* Card internal padding */
--spacing-card-gap: 16px;          /* Gap between card elements */

/* Lists */
--spacing-list-gap: 8px;           /* Gap between list items */
--spacing-list-item-padding: 12px; /* List item internal padding */

/* Sections */
--spacing-section-gap: 32px;       /* Gap between page sections */
--spacing-page-margin: 24px;       /* Page edge margins */
```

---

## 🔲 BORDER RADIUS TOKENS

```css
/* Border radius scale */
--radius-none: 0px;           /* No rounding */
--radius-xs: 2px;             /* Subtle rounding */
--radius-sm: 4px;             /* Small elements (badges, inline code) */
--radius-md: 8px;             /* Default (buttons, inputs, alerts) */
--radius-lg: 12px;            /* Large elements (cards, modals) */
--radius-xl: 16px;            /* Extra large */
--radius-2xl: 24px;           /* Hero elements */
--radius-full: 9999px;        /* Fully rounded (pills, avatars) */

/* Component-specific radius */
--radius-button: 8px;
--radius-input: 8px;
--radius-card: 12px;
--radius-badge: 4px;
--radius-alert: 8px;
--radius-modal: 12px;
```

**Rationale:**
- Consistent 8px radius for interactive elements creates cohesive feel
- 12px for elevated surfaces (cards) adds subtle hierarchy
- 4px for small elements (badges) maintains crispness

---

## 🌑 ELEVATION & SHADOW TOKENS

```css
/* Shadow layers (subtle in dark theme) */
--shadow-none: none;
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.6);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.7);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.8);
--shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.9);

/* Colored shadows for emphasis */
--shadow-accent: 0 4px 12px rgba(255, 204, 0, 0.3);
--shadow-accent-lg: 0 8px 24px rgba(255, 204, 0, 0.4);
--shadow-success: 0 4px 12px rgba(68, 255, 68, 0.3);
--shadow-error: 0 4px 12px rgba(255, 68, 68, 0.3);

/* Focus shadows */
--shadow-focus: 0 0 0 3px rgba(255, 204, 0, 0.3);
--shadow-focus-error: 0 0 0 3px rgba(255, 68, 68, 0.3);

/* Elevation levels (shadow + background) */
--elevation-0: var(--color-bg-primary);               /* Base level */
--elevation-1: var(--color-bg-elevated-1);            /* Cards */
--elevation-2: var(--color-bg-elevated-2);            /* Dropdowns */
--elevation-3: var(--color-bg-elevated-3);            /* Modals */
```

**Rationale:**
- Dark theme requires subtle shadows (black on black has limited contrast)
- Colored shadows (yellow, green, red) provide stronger visual hierarchy
- Elevation through background color is primary depth indicator

---

## 🎭 ICONOGRAPHY TOKENS

```css
/* Icon sizes */
--icon-size-xs: 12px;
--icon-size-sm: 16px;
--icon-size-md: 20px;
--icon-size-lg: 24px;
--icon-size-xl: 32px;
--icon-size-2xl: 48px;

/* Icon colors */
--icon-color-primary: var(--color-text-primary);
--icon-color-secondary: var(--color-text-secondary);
--icon-color-accent: var(--color-brand-yellow);
--icon-color-success: var(--color-brand-green);
--icon-color-error: var(--color-brand-red);

/* Icon stroke widths (for outline icons) */
--icon-stroke-thin: 1px;
--icon-stroke-regular: 1.5px;
--icon-stroke-bold: 2px;
```

**Icon Library:** Lucide React (consistent stroke-based icons)

**Usage Guidelines:**
- Use 20px icons for most UI elements
- Use 16px icons in buttons and compact spaces
- Use 24px+ icons for empty states and hero sections
- Prefer outline style over solid for consistency

---

## ⚡ ANIMATION & TRANSITION TOKENS

```css
/* Durations */
--duration-instant: 0ms;
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;

/* Easing curves */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Common transitions */
--transition-colors: color var(--duration-normal) var(--ease-out),
                     background-color var(--duration-normal) var(--ease-out),
                     border-color var(--duration-normal) var(--ease-out);

--transition-transform: transform var(--duration-normal) var(--ease-out);

--transition-opacity: opacity var(--duration-normal) var(--ease-out);

--transition-all: all var(--duration-normal) var(--ease-out);

/* Hover effects */
--hover-lift: translateY(-1px);
--hover-scale: scale(1.02);
```

**Animation Principles:**
- 200ms default for most transitions (feels responsive but not jarring)
- Ease-out for enter animations (quick start, slow finish)
- Ease-in for exit animations (slow start, quick finish)
- Limit animations in production environments (reduce distraction)

---

## 🔘 BUTTON TOKENS

```css
/* Button heights */
--button-height-sm: 32px;
--button-height-md: 40px;
--button-height-lg: 48px;

/* Button padding */
--button-padding-sm: 8px 12px;
--button-padding-md: 12px 16px;
--button-padding-lg: 16px 24px;

/* Button states */
--button-primary-bg: var(--color-brand-yellow);
--button-primary-bg-hover: #FFD633;
--button-primary-text: var(--color-brand-black);

--button-secondary-bg: transparent;
--button-secondary-bg-hover: rgba(255, 255, 255, 0.1);
--button-secondary-border: var(--color-brand-white);
--button-secondary-border-hover: var(--color-brand-yellow);
--button-secondary-text: var(--color-brand-white);
--button-secondary-text-hover: var(--color-brand-yellow);

--button-success-bg: var(--color-brand-green);
--button-success-bg-hover: #55FF55;
--button-success-text: var(--color-brand-black);

--button-error-bg: var(--color-brand-red);
--button-error-bg-hover: #FF5555;
--button-error-text: var(--color-brand-white);

--button-disabled-opacity: 0.4;
```

---

## 📋 FORM TOKENS

```css
/* Input heights */
--input-height-sm: 32px;
--input-height-md: 40px;
--input-height-lg: 48px;

/* Input padding */
--input-padding-x: 12px;
--input-padding-y: 12px;

/* Input states */
--input-bg-default: rgba(255, 255, 255, 0.05);
--input-bg-hover: rgba(255, 255, 255, 0.08);
--input-bg-focus: rgba(255, 255, 255, 0.10);
--input-bg-disabled: rgba(255, 255, 255, 0.02);

--input-border-default: rgba(255, 255, 255, 0.3);
--input-border-hover: rgba(255, 255, 255, 0.4);
--input-border-focus: var(--color-brand-yellow);
--input-border-error: var(--color-brand-red);

/* Checkbox & radio */
--checkbox-size: 20px;
--checkbox-border-width: 2px;
--checkbox-checked-bg: var(--color-brand-yellow);
--checkbox-checked-border: var(--color-brand-yellow);
```

---

## 🎴 CARD TOKENS

```css
/* Card backgrounds */
--card-bg-default: var(--color-bg-elevated-1);
--card-bg-hover: var(--color-bg-elevated-1);

/* Card borders */
--card-border-default: rgba(255, 255, 255, 0.2);
--card-border-hover: var(--color-brand-yellow);

/* Card padding */
--card-padding-sm: 16px;
--card-padding-md: 24px;
--card-padding-lg: 32px;

/* Card shadows */
--card-shadow-default: none;
--card-shadow-hover: var(--shadow-accent);
```

---

## 🚨 ALERT & NOTIFICATION TOKENS

```css
/* Alert backgrounds */
--alert-success-bg: rgba(68, 255, 68, 0.1);
--alert-error-bg: rgba(255, 68, 68, 0.1);
--alert-warning-bg: rgba(255, 204, 0, 0.1);
--alert-info-bg: rgba(255, 255, 255, 0.05);

/* Alert borders */
--alert-success-border: var(--color-brand-green);
--alert-error-border: var(--color-brand-red);
--alert-warning-border: var(--color-brand-yellow);
--alert-info-border: rgba(255, 255, 255, 0.3);

/* Alert accent border (left stripe) */
--alert-border-left-width: 4px;

/* Alert padding */
--alert-padding: 16px;
```

---

## 🏷️ BADGE TOKENS

```css
/* Badge sizes */
--badge-height-sm: 20px;
--badge-height-md: 24px;
--badge-height-lg: 28px;

/* Badge padding */
--badge-padding-sm: 4px 8px;
--badge-padding-md: 4px 12px;
--badge-padding-lg: 6px 16px;

/* Badge variants */
--badge-success-bg: var(--color-brand-green);
--badge-success-text: var(--color-brand-black);

--badge-error-bg: var(--color-brand-red);
--badge-error-text: var(--color-brand-white);

--badge-warning-bg: var(--color-brand-yellow);
--badge-warning-text: var(--color-brand-black);

--badge-neutral-bg: var(--color-bg-elevated-3);
--badge-neutral-text: var(--color-brand-white);
```

---

## 📊 TABLE TOKENS

```css
/* Table cell padding */
--table-cell-padding-x: 12px;
--table-cell-padding-y: 12px;

/* Table header */
--table-header-bg: rgba(255, 255, 255, 0.05);
--table-header-border: rgba(255, 255, 255, 0.2);
--table-header-text: var(--color-text-primary);

/* Table rows */
--table-row-border: rgba(255, 255, 255, 0.2);
--table-row-hover-bg: rgba(255, 204, 0, 0.05);

/* Table text */
--table-cell-text: var(--color-text-secondary);
```

---

## 🌐 Z-INDEX TOKENS

```css
/* Z-index scale */
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
--z-notification: 1080;
```

---

## 📱 BREAKPOINT TOKENS

```css
/* Responsive breakpoints */
--breakpoint-xs: 375px;      /* Mobile small */
--breakpoint-sm: 640px;      /* Mobile */
--breakpoint-md: 768px;      /* Tablet */
--breakpoint-lg: 1024px;     /* Laptop */
--breakpoint-xl: 1280px;     /* Desktop */
--breakpoint-2xl: 1536px;    /* Large desktop */
--breakpoint-3xl: 1920px;    /* Control room display (primary target) */

/* Container max widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

**Design Priority:** Desktop-first (1920px+ control room displays)

---

## ♿ ACCESSIBILITY TOKENS

```css
/* Focus indicators */
--a11y-focus-width: 3px;
--a11y-focus-offset: 2px;
--a11y-focus-color: var(--color-brand-yellow);
--a11y-focus-style: solid;

/* Minimum touch targets (iOS, Android guidelines) */
--a11y-min-tap-target: 44px;

/* Reduced motion */
--a11y-motion-safe-duration: var(--duration-normal);
--a11y-motion-reduce-duration: 0ms;
```

**WCAG Compliance:**
- Level AA minimum (4.5:1 for normal text, 3:1 for large text)
- Level AAA preferred (7:1 for normal text, 4.5:1 for large text)
- All interactive elements have visible focus states
- Minimum touch target: 44x44px

---

## 🎨 DESIGN PRINCIPLES SUMMARY

### 1. **Industrial Clarity**
High contrast, minimal decoration, clear information hierarchy. Designed for quick decision-making under pressure.

### 2. **Consistent Spacing**
4px base unit creates predictable rhythm. Multiples of 4 for all spacing ensures alignment across components.

### 3. **Yellow as Accent**
Used sparingly for maximum impact. Draws attention to:
- Primary actions (buttons, CTAs)
- Warning states (alerts, badges)
- Active/selected states (tabs, navigation)
- Focus indicators (accessibility)

### 4. **Status Color Language**
Universal industrial color coding:
- **Green** = Normal, operational, success
- **Yellow** = Warning, attention needed, in progress
- **Red** = Critical, error, failure
- **White** = Neutral, informational

### 5. **Elevation Through Background**
Dark theme limits shadow effectiveness. Primary depth cues:
1. Background color (#000 → #1A1A1A → #262626)
2. Border treatment (subtle → yellow)
3. Subtle colored shadows (yellow glow on hover)

### 6. **Typography Hierarchy**
Clear visual hierarchy through size, weight, and transform:
- H1: Bold, uppercase, 24px (page titles)
- H2: Semibold, 18px (section headers)
- H3: Semibold, 16px (component headers)
- Body: Regular, 14px, gray (content)

### 7. **Minimal Animation**
Transitions present but subtle. Control room operators need stable, predictable interfaces. Animations are functional, not decorative.

---

## 📦 TOKEN IMPLEMENTATION GUIDE

### CSS Variables Implementation

```css
:root {
  /* Color tokens */
  --color-brand-black: #000000;
  --color-brand-white: #FFFFFF;
  --color-brand-gray: #CCCCCC;
  --color-brand-yellow: #FFCC00;
  --color-brand-green: #44FF44;
  --color-brand-red: #FF4444;
  
  /* Semantic tokens build on brand tokens */
  --color-bg-primary: var(--color-brand-black);
  --color-text-primary: var(--color-brand-white);
  --color-text-secondary: var(--color-brand-gray);
  
  /* Component tokens build on semantic tokens */
  --button-primary-bg: var(--color-brand-yellow);
  --button-primary-text: var(--color-brand-black);
}
```

### Tailwind CSS Integration

```js
// tailwind.config.js (Tailwind v4)
module.exports = {
  theme: {
    colors: {
      'ot-black': 'var(--color-brand-black)',
      'ot-white': 'var(--color-brand-white)',
      'ot-gray': 'var(--color-brand-gray)',
      'ot-yellow': 'var(--color-brand-yellow)',
      // ... map all tokens
    },
    spacing: {
      'xs': 'var(--spacing-xs)',
      'sm': 'var(--spacing-sm)',
      // ... map spacing scale
    }
  }
}
```

### Component Usage Example

```tsx
// Using tokens in components
<button className="bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] px-[var(--button-padding-x)] py-[var(--button-padding-y)] rounded-[var(--radius-button)]">
  Submit
</button>

// Or with utility classes (after Tailwind config)
<button className="btn-primary">
  Submit
</button>
```

---

## 🔄 TOKEN VERSIONING

**Version 2.0 Changes:**
- Added comprehensive semantic color tokens
- Expanded spacing scale (0.5, 5, 10, 20, 24)
- Added elevation tokens (bg + shadow combinations)
- Added form-specific tokens (input states)
- Added accessibility tokens (focus, touch targets)
- Added z-index scale
- Added animation/transition tokens

**Version 1.0 (Baseline):**
- Basic color palette
- Typography scale
- Spacing tokens (xs, sm, md, lg, xl, 2xl)
- Border radius tokens
- Button variants

---

## ✅ NEXT STEPS

1. **Review & Approval:** Stakeholder sign-off on token system
2. **Implementation:** Apply tokens to existing components systematically
3. **Documentation:** Update component library docs with token usage
4. **Testing:** Verify contrast ratios, accessibility compliance
5. **Iteration:** Gather feedback from operators, refine as needed

---

**Status:** ✅ Foundation complete - Ready for application  
**Approval Required:** Yes  
**Breaking Changes:** No (additive only)  
**Estimated Application Effort:** 2-3 days across all components