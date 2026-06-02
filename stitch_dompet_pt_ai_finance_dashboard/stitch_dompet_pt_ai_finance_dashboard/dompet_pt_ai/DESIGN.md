---
name: DOMPET PT AI
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#c5c6cd'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#8f9097'
  outline-variant: '#44474d'
  surface-tint: '#b9c7e4'
  primary: '#b9c7e4'
  on-primary: '#233148'
  primary-container: '#0a192f'
  on-primary-container: '#74829d'
  inverse-primary: '#515f78'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#001c22'
  on-tertiary-container: '#008ea6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#081425'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  grid-columns-desktop: '12'
  grid-gutter: 16px
  grid-margin: 24px
---

## Brand & Style

The design system is engineered for a high-stakes enterprise financial environment, prioritizing clarity, efficiency, and a sense of institutional security. The aesthetic is rooted in **Corporate Modernism**, heavily influenced by **Material 3 (M3)** principles, utilizing a "Compact" density model to maximize data visualization for financial analysts.

The personality is authoritative yet technologically advanced. It avoids unnecessary decoration, focusing instead on structural hierarchy, purposeful color application for data signaling, and precise alignment. The target audience consists of financial controllers and enterprise stakeholders who require an interface that feels both "heavyweight" in capability and "lightweight" in cognitive load.

## Colors

The palette is optimized for a deep dark-mode experience to reduce eye strain during extended financial auditing sessions. 

- **Primary (Deep Navy):** Used for structural surfaces, sidebars, and high-level containers. It provides the "institutional" anchor.
- **Success/Income (Emerald):** Reserved strictly for positive financial delta, completed transactions, and growth indicators.
- **AI/Information (Cyan):** Used for AI-driven insights, data tooltips, and system-level information updates.
- **Warning/Pending (Amber):** Identifies items requiring attention or funds currently in escrow/transit.
- **Error/Expense (Red):** Used for negative cash flow, critical system errors, or budget overruns.

Surface colors follow the M3 "Elevation Overlay" logic, where higher-level components (like modals) use a slightly lighter navy/grey mix to indicate depth.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy contexts and its neutral, professional character. 

The type scale is tighter than standard consumer apps to accommodate complex dashboards. **Display** and **Headline** roles use tighter letter spacing to maintain a "locked-in" enterprise feel. **Label-sm** is specifically designed for table headers and micro-data, utilizing a slight uppercase transform and increased tracking for maximum readability at small scales. Tabular figures (monospaced numbers) should be enabled via CSS `font-variant-numeric: tabular-nums` to ensure financial columns align perfectly.

## Layout & Spacing

This design system employs a **4px baseline grid** to achieve a compact, high-density interface. 

- **Web/Desktop:** A 12-column fluid grid. To maintain professionalism, content containers should have a maximum width of 1440px, centering on ultra-wide displays. Gutters are kept tight (16px) to maximize horizontal real estate for tables.
- **Mobile/Handheld:** A 4-column fluid grid with 16px side margins. Transaction lists should span the full width of the grid.
- **Density:** We utilize "Compact" density for enterprise data. Components like buttons and table rows are reduced in height (e.g., 32px or 40px heights instead of the standard 48px).

## Elevation & Depth

Depth is communicated through **Tonal Layering** and subtle **Ambient Shadows**, consistent with Material 3's dark mode specifications.

- **Level 0 (Base):** The primary background (#0A192F).
- **Level 1 (Cards/Tables):** A slightly lighter navy hex created by a 5% white overlay.
- **Level 2 (Active States/Tooltips):** An 8% white overlay with a soft 4px blur shadow.
- **Level 3 (Modals/Drawers):** An 11% white overlay with a 12px blur, 0.15 opacity black shadow.

Avoid high-contrast borders; instead, use 1px inner strokes in a slightly lighter shade of the surface color to define boundaries without adding visual noise.

## Shapes

The shape language is **Soft (Level 1)**, utilizing a 4px (0.25rem) base radius. This provides a balance between the "hardness" of traditional finance and the "softness" of modern AI-driven tools.

- **Small Components (Chips, Inputs):** 4px radius.
- **Medium Components (Cards, Buttons):** 8px (rounded-lg) radius.
- **Large Components (Drawers, Modals):** 12px (rounded-xl) radius.

This subtle rounding ensures the UI feels modern while maintaining a geometric rigour that communicates precision and stability.

## Components

### KPI & AI Insight Cards
KPI cards feature a primary value in `headline-lg`, with a secondary trend indicator using the color tokens for Emerald (Up) or Red (Down). **AI Insight Cards** are distinguished by a subtle 1px Cyan border or a faint Cyan glow at the top edge to signal "intelligence."

### Transaction Cards (Mobile)
Optimized for Android/Material You. These use a horizontal layout: Leading Icon (Category), Center Column (Entity Name/Timestamp), and Trailing Column (Amount). Amounts should use `tabular-nums` for alignment.

### Professional Tables (Web)
Tables are the backbone of the system. 
- **Headers:** `label-sm` with a subtle grey background.
- **Rows:** Alternating "Zebra" striping is avoided; use a 1px border-bottom in a neutral-low-contrast color. 
- **Density:** Row heights should be fixed at 40px.

### Status Badges
Small, pill-shaped indicators. Use a "Subtle Tonal" approach: a low-opacity version of the status color for the background and the full-strength color for the text (e.g., 15% Emerald background with 100% Emerald text).

### Drawer Forms
Forms for adding transactions or editing profiles emerge from the right side of the screen. They use a Level 3 elevation and contain grouped input fields with `label-md` floating labels, adhering to the Material You text field style (filled with a bottom-line indicator).