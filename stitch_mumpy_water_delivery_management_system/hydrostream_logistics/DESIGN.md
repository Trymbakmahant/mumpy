---
name: HydroStream Logistics
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434652'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747684'
  outline-variant: '#c4c6d4'
  surface-tint: '#2e59ba'
  primary: '#002e7c'
  on-primary: '#ffffff'
  primary-container: '#1044a5'
  on-primary-container: '#a1b9ff'
  inverse-primary: '#b3c5ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#003757'
  on-tertiary: '#ffffff'
  tertiary-container: '#004f7a'
  on-tertiary-container: '#77c2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#0640a1'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the purity, freshness, and crystalline clarity of packaged drinking water, united with the efficiency, predictability, and precision required for fleet operations and logistical fulfillment. 

The aesthetic marries **Corporate / Modern** utilitarian structure with fluid, refreshing accents reminiscent of pure mineral water. The audience spans plant managers, dispatch operators, route delivery drivers, and retail/B2B inventory leads. The emotional response aims to convey confidence, crystal-clear operational visibility, and refreshing simplicity over traditionally cluttered telematics dashboards. Interfaces feature ultra-clean whitespace, crisp typography, translucent aqua-tinted status containers, and polished card surfaces that evoke pure, hygienic hydration and dependable supply chain momentum.

## Colors

The palette is derived directly from the vivid blue water bottle caps, vibrant packaging label gradients, and optical transparency of crystal-clear mineral water.

- **Primary (`#1044A5`)**: A confident, deep royal blue echoing the bottle cap and deep aquatic branding. Used for primary calls to action, active navigation states, key metric highlights, and authoritative headers.
- **Secondary (`#0EA5E9`)**: An invigorating azure sky blue representing fluid motion, real-time vehicle dispatch, and live operational updates.
- **Tertiary (`#0284C7`)**: A balanced ocean cyan serving as an intermediate tone for secondary telemetry, data visualizations, hover treatments, and badge borders.
- **Neutral (`#64748B`)**: Slate neutral delivering readable body typography, clean outlines, inactive tab treatments, and subtle grid dividers without visual fatigue.
- **Surface Accents (`#F0F9FF` to `#E0F2FE`)**: Sparkling aqua tints used for card backgrounds, vehicle route lines, progress bars, and soft table highlights.

## Typography

The typography system relies on **Plus Jakarta Sans** across all levels. Its contemporary geometric geometry with subtly softened terminals complements the fluid, hydration-forward identity while offering high tabular legibility for route tables, inventory tallies, and dispatch timestamps.

Numerical data in delivery tables, vehicle speedometers, and bottle inventory counters should utilize proportional tabular figures (`font-variant-numeric: tabular-nums`) to maintain alignment across fluctuating data feeds.

## Layout & Spacing

The layout employs an adaptable fluid grid architecture designed for operations centers, handheld delivery terminals, and tablet-mounted vehicle dashboards:

- **Desktop (12 Columns)**: 24px-32px margins, 20px gutters. Houses dual-pane dispatch layouts (interactive route map on the left, order manifest queue on the right).
- **Tablet (8 Columns)**: 20px margins, 16px gutters. Dashboard widgets collapse into structured 2x2 modular blocks.
- **Mobile (4 Columns)**: 16px margins, 12px gutters. Interfaces collapse to single-column feeds with sticky bottom action trays for delivery confirmation, bottle scan checks, and quick contact buttons.

Layout padding prioritizes breathing room around operational widgets to prevent touch errors in fast-paced loading dock and in-transit environments.

## Elevation & Depth

Visual hierarchy leverages crisp aquatic tonal layers paired with ultra-soft atmospheric ambient shadows:

- **Base Layer (Ground)**: Pure, cool background (`#F8FAFC` to `#F0F9FF`) simulating fresh water clarity.
- **Level 1 (Card & Module Surface)**: Pure crisp white (`#FFFFFF`) with a delicate ghost border (`1px solid #E2E8F0`) and an ambient shadow (`0px 4px 20px -2px rgba(16, 68, 165, 0.05)`).
- **Level 2 (Interactive Floating Sheets & Popovers)**: Pure white background raised with a hydro-tinted elevation (`0px 12px 32px -4px rgba(14, 165, 233, 0.12)`).
- **Level 3 (Modal Dialogs & Live Telemetry Overlays)**: Surface floating atop a 20% backdrop-blur scrim (`rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(8px)`).

## Shapes

The shape vocabulary uses level **2 (Rounded)**:
- Standard buttons, text inputs, chips, and table line selectors apply an `8px` (`0.5rem`) corner radius.
- Cards, dispatch panels, metrics containers, and map overlays employ `16px` (`1rem`) border radius (`rounded-lg`).
- Feature banners and driver status badges use `24px` (`1.5rem`) border radius (`rounded-xl`).
- Micro-indicators, notification counters, and vehicle status pills adopt full pill geometry (`9999px`).

This subtle rounding reflects the molded contours of bottled water packaging without sacrificing the crisp, structured alignment needed for complex logistics data.

## Components

### Buttons
- **Primary Action**: Solid royal blue (`#1044A5`) background, white text, subtle hover lift with shadow `0 4px 12px rgba(16, 68, 165, 0.25)`.
- **Secondary / Operational**: Crisp white background, 1px border in `#BAE6FD`, text in `#0284C7`, background tinting to `#F0F9FF` on hover.
- **Destructive**: Pale crimson background (`#FEF2F2`), border in `#FECACA`, text `#DC2626`.

### Cards & Dispatch Panels
- White container base with smooth 16px corner radius, hairline outline in `#E0F2FE`, and gentle aqua-tinted drop shadow. Header rows within cards include subtle lower dividers in `#F1F5F9`.

### Chips & Badges
- **Status: In Transit / Out for Delivery**: `#E0F2FE` background, `#0369A1` text, with a pulsating `#0EA5E9` live dot.
- **Status: Delivered / Stocked**: `#DCFCE7` background, `#15803D` text.
- **Status: Delayed / Maintenance**: `#FEF3C7` background, `#B45309` text.

### Inputs & Form Fields
- Crisp white fill, `#CBD5E1` border, 8px radius, and standard 14px text. Focused states transition cleanly into a 2px royal blue ring (`#1044A5`) with a 3px soft outer aura (`rgba(14, 165, 233, 0.2)`).

### Checkboxes & Radio Controls
- Circular radios and softened square checkboxes (4px radius) sporting an active fill in `#1044A5` and white glyphs. Inactive borders remain neutral `#94A3B8`.

### Specialized Platform Components
- **Crate & Bottle Counter Pill**: Segmented increment/decrement badge with high-contrast numerical readouts.
- **Fleet Telemetry Banner**: Floating glassmorphic strip displaying fuel status, current water crate payload capacity (e.g., *720/800 20L Cans Loaded*), driver name, and route temperature.