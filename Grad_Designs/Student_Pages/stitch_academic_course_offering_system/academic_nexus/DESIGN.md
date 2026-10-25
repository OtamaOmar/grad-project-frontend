---
name: Academic Nexus
colors:
  surface: '#0d1225'
  surface-dim: '#0d1225'
  surface-bright: '#34384c'
  surface-container-lowest: '#080d1f'
  surface-container-low: '#161b2d'
  surface-container: '#1a1f31'
  surface-container-high: '#24293c'
  surface-container-highest: '#2f3448'
  on-surface: '#dde1fb'
  on-surface-variant: '#c4c5d5'
  inverse-surface: '#dde1fb'
  inverse-on-surface: '#2b3043'
  outline: '#8e909f'
  outline-variant: '#444653'
  surface-tint: '#b6c4ff'
  primary: '#b6c4ff'
  on-primary: '#00277f'
  primary-container: '#6b8cff'
  on-primary-container: '#002375'
  inverse-primary: '#3055c6'
  secondary: '#bec6df'
  on-secondary: '#283044'
  secondary-container: '#41495e'
  on-secondary-container: '#b0b8d1'
  tertiary: '#42e09a'
  on-tertiary: '#003822'
  tertiary-container: '#00a86e'
  on-tertiary-container: '#00331e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#0a3bad'
  secondary-fixed: '#dae2fc'
  secondary-fixed-dim: '#bec6df'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3e475b'
  tertiary-fixed: '#65fdb5'
  tertiary-fixed-dim: '#42e09a'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005233'
  background: '#0d1225'
  on-background: '#dde1fb'
  surface-variant: '#2f3448'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Source Sans 3
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  title-sm:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Source Sans 3
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.5rem
  margin: 1.5rem
  margin-compact: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system serves the Department of Computer Science at Nile University for course offering planning and curriculum scheduling. The environment caters to academic department chairs, curriculum committees, faculty, and registrars who require dense, high-throughput planning interfaces.

The design language balances authoritative academic gravitas with precise, modern computer science tooling. The style is an engineered modern-academic architecture: dense, structured, dark-first, and highly legible. It avoids decorative clutter in favor of crisp delineation, explicit grid alignments, and high information density. Surfaces project deep, nocturnal blue tones reminiscent of integrated development environments combined with institutional prestige.

## Colors

The palette employs an intentional deep-navy tonal stack optimized for extensive nocturnal planning sessions and complex data density.

### Core Tones
- **Canvas / Surface Baseline:** `#080D1F` creates the deep, low-luminance foundation.
- **Card / Surface Container:** `#10172D` provides contrast for panels, table rows, and grid modules.
- **Elevated / Surface Container High:** `#171F3A` handles modals, popovers, active slots, and transient flyouts.
- **Primary Accent:** `#6B8CFF` serves as the primary visual driver for actions, selections, and interactive course markers.
- **Primary Hover:** `#8DA5FF` gives an accessible luminescent lift under pointer interactions.
- **Text on Primary:** `#07102E` guarantees AAA contrast against bright primary fills.
- **Border / Outline:** `#293451` creates surgical structural delineation between cells, timelines, and sidebar splits without visual noise.

### Typography Colors
- **On-Surface (Primary Text):** `#F5F7FF` ensures maximum clarity for course codes, credits, and metrics.
- **On-Surface Variant (Secondary Text):** `#B8C0D9` handles metadata, instructor titles, prerequisites, and secondary metrics.

### Academic Status Indicators
Status indicators are strictly bound to paired background and foreground tokens to preserve accessibility in dense data matrices:
- **Success (Approved / Staffed / Validated):** Text `#3DDC97` on Background `#0E2A22`.
- **Danger (Conflict / Over-capacity / Prerequisite Error):** Text `#FF8A80` on Background `#2C1518`.
- **Pending (Unassigned / Under Review / Draft Slot):** Text `#FFC46B` on Background `#2A2112`.

## Typography

The typographic hierarchy implements a bifurcated structure:

1. **Source Serif 4** is reserved strictly for institutional identity: the Nile University Department of Computer Science wordmark, major module headers, and top-level page views. It infuses academic credibility and university heritage into an otherwise computational tool.
2. **Source Sans 3** commands the entire operational interface: course matriculation codes, schedule matrices, data tables, dialogs, forms, badges, and controls. Its clear grotesque terminals maintain high readability in dense layouts.

Tabular figures (`font-variant-numeric: tabular-nums`) must be enforced across all course codes, credit loads, room capacities, and time allocation values to guarantee column alignment across schedule rosters.

## Layout & Spacing

The system utilizes a 12-column fluid grid tailored to high-density administrative work benches, with support for fixed master-detail sidebars.

### Layout Model
- **Workstation Viewports (Desktop 1280px+):** Main viewport operates with a multi-pane split: fixed global navigation (64px collapsed or 220px expanded), an expandable Course Offering Matrix (fluid), and an auxiliary Explain/Audit Side Panel (fixed 380px to 440px).
- **Dense Academic Density:** Standard vertical paddings scale on a strict 4px grid (`0.25rem` baseline). Table cell height is fixed to a compact 36px to 40px to surface at least 15–20 course offerings above the fold.
- **Reflow and Breakpoints:** Below 1024px, the Explain Side Panel transitions from a side-by-side dock into an off-canvas drawer. The weekly scheduling grid transitions from simultaneous 5-day columns to a single-day segmented track view.

## Elevation & Depth

Visual hierarchy does not rely on heavy drop shadows, keeping data readable in dark mode. Depth is established through tonal layering, crisp borders, and subtle glows.

- **Level 0 (Canvas Base):** Background `#080D1F`. Sits at the lowest z-index, containing structural headers and inactive layout zones.
- **Level 1 (Card & Content Blocks):** Surface `#10172D` bounded by a 1px border of `#293451`. This forms course modules, semester timelines, and planning panels. Shadows are absent; border contrast provides the division.
- **Level 2 (Elevated & Active States):** Surface `#171F3A` bordered by `#293451`. Used for active schedule slots, drag previews, and hover states over curriculum blocks. Features a subtle ambient diffusion: `0 4px 20px -2px rgba(4, 7, 18, 0.7)`.
- **Level 3 (Explain Side Panel & Dialogs):** Surface `#171F3A` with high visual priority. Accompanied by a 1px border of `#293451` and an elevated shadow: `0 12px 32px -4px rgba(2, 4, 12, 0.85)`. Dragged course entities project an accent ring: `0 0 0 1px #6B8CFF, 0 8px 24px rgba(107, 140, 255, 0.15)`.

## Shapes

The design system implements a deliberate dual-radius hierarchy to differentiate modular data units from overarching analytical panels:

- **Standard Cards, Inputs, Tables, and Course Slots:** Bound to a precise **12px** border-radius (`0.75rem`). This curvature softens the dense technical layout while remaining compact enough to prevent excessive dead space at slot intersections.
- **Explain Side Panel & Inspector Drawers:** Styled with a distinct **20px** corner radius (`1.25rem`) on exposed edges. This pronounced curvature visually distinguishes the contextual reasoning panel (used for prerequisite graphs, load conflicts, and scheduling explanations) as an analytical layer resting above the structural schedule.
- **Chips, Badges, and Micro-Indicators:** Bound to a tighter **6px** corner radius (`0.375rem`) to maintain legibility within dense table rows.
- **Icons:** Standardized with a uniform **1.5px** stroke width. Icons must render sharp and consistent across both 16px and 20px scales without filled weights, preserving the clean technical feel.

## Components

### Buttons
- **Primary:** Background `#6B8CFF`, Text `#07102E`, Font `Source Sans 3` Weight 600. Border radius 12px. Padding: 6px 14px for compact, 8px 18px for default. Hover transforms background to `#8DA5FF`. Focus ring: 2px `#8DA5FF` offset by 2px `#080D1F`.
- **Secondary / Outlined:** Background `transparent`, Border 1px solid `#293451`, Text `#F5F7FF`. Hover brings background `#171F3A` with border color transition to `#6B8CFF`.
- **Ghost / Utility:** Background `transparent`, Text `#B8C0D9`. Hover brings background `#10172D` with text `#F5F7FF`.

### Status Chips & Course Tags
- Compact tags with a 6px radius, uppercase label styling (`label-sm`), and 1.5px stroke mini-icons.
- **Approved / Validated:** Background `#0E2A22`, Text `#3DDC97`, Border 1px solid rgba(61, 220, 151, 0.25).
- **Conflict / Critical:** Background `#2C1518`, Text `#FF8A80`, Border 1px solid rgba(255, 138, 128, 0.25).
- **Pending / Unassigned:** Background `#2A2112`, Text `#FFC46B`, Border 1px solid rgba(255, 196, 107, 0.25).

### Cards & Grid Containers
- Background `#10172D`, Border 1px solid `#293451`, Border Radius 12px.
- Internal headers use Source Sans 3 `title-sm` with bottom borders of 1px solid `#293451`. Padding adheres strictly to `space-md` (12px) for high density.

### Explain Side Panel
- Background `#171F3A`, Border 1px solid `#293451`, Border Radius 20px on internal viewport corners (or leading edge when docked).
- Houses AI scheduling explanations, prerequisite conflict trace logs, and room utilization analytics.
- Header showcases the panel title in Source Serif 4 `headline-md` paired with secondary metadata in Source Sans 3 `body-sm`.

### Input Fields & Selectors
- Background `#080D1F`, Border 1px solid `#293451`, Border Radius 12px, Text `#F5F7FF`. Placeholder `#B8C0D9` at 50% opacity.
- Focus state: Border color transitions directly to `#6B8CFF` accompanied by a 1px glow ring of rgba(107, 140, 255, 0.35).
- Compact vertical height: 34px for quick-filter tables; 40px for formal configuration forms.

### Selection Controls (Checkboxes & Radios)
- Box: 16px × 16px, Border 1.5px solid `#293451`, Radius 4px (Checkbox) or 50% (Radio), Background `#080D1F`.
- Checked state: Fill `#6B8CFF`, Icon/Pip `#07102E`.

### Data Grid & Course Timetable Matrix
- Table header row: Background `#080D1F`, Text `#B8C0D9`, Border-bottom 1px solid `#293451`, Height 32px.
- Table body row: Height 38px, Border-bottom 1px solid `#293451`. Hover background: `#171F3A`. Selected row: Background `#10172D` with a 2px vertical border-left accent of `#6B8CFF`.