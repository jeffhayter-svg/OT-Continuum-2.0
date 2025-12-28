# Applying OT Continuum Design System to App.tsx

**Issue:** The main App.tsx file still uses the old blue/gray theme instead of the OT Continuum black/yellow branding we designed.

## Changes Needed:

### Login Page
- Background: `bg-gray-50` → `bg-ot-black`
- Form card: `bg-white` → `bg-card` (#1A1A1A)
- Text: `text-gray-600` → `var(--color-text-secondary)`
- Buttons: `bg-blue-600` → `.btn-hero` (yellow, uppercase for brand moment)
- Focus rings: `focus:ring-blue-500` → yellow focus
- Success button: `bg-green-600` → `.btn-success`

### Dashboard
- Background: `bg-gray-50` → `bg-ot-black`
- Nav: `bg-white` → `bg-card` (#1A1A1A)
- Cards: `bg-white` → `.card-ot`
- Site card: `bg-blue-50, border-blue-200` → yellow accent
- Screen cards: `border-gray-200` → `var(--color-border-default)`
- Icons: `bg-blue-600` → `bg-ot-yellow`
- Hover: `hover:text-blue-600` → `hover:text-accent`

### Loading State
- Background: `bg-gray-50` → `bg-ot-black`
- Spinner: `border-blue-600` → `border-ot-yellow`
- Text: `text-gray-600` → `var(--color-text-secondary)`

**This will be fixed in the next update to App.tsx to match the frozen design system.**
