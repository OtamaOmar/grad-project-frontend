---
name: Academic Planning System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d2daf0'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#dbe2f9'
  on-surface: '#141b2c'
  on-surface-variant: '#454653'
  inverse-surface: '#293041'
  inverse-on-surface: '#edf0ff'
  outline: '#757684'
  outline-variant: '#c5c5d5'
  surface-tint: '#4154c1'
  primary: '#001060'
  on-primary: '#ffffff'
  primary-container: '#021f94'
  on-primary-container: '#7f91ff'
  inverse-primary: '#bbc3ff'
  secondary: '#525f73'
  on-secondary: '#ffffff'
  secondary-container: '#d6e3fb'
  on-secondary-container: '#586579'
  tertiary: '#00115e'
  on-tertiary: '#ffffff'
  tertiary-container: '#002093'
  on-tertiary-container: '#7e92ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bbc3ff'
  on-primary-fixed: '#000f5d'
  on-primary-fixed-variant: '#253aa9'
  secondary-fixed: '#d6e3fb'
  secondary-fixed-dim: '#bac7de'
  on-secondary-fixed: '#0f1c2d'
  on-secondary-fixed-variant: '#3b485a'
  tertiary-fixed: '#dee0ff'
  tertiary-fixed-dim: '#bac3ff'
  on-tertiary-fixed: '#00105b'
  on-tertiary-fixed-variant: '#0d32c1'
  background: '#f9f9ff'
  on-background: '#141b2c'
  surface-variant: '#dbe2f9'
typography:
  headline-xl:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-xs:
    fontFamily: Source Sans 3
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  label-lg:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers a dense, highly structured administrative work environment built specifically for curriculum oversight, faculty assignment, and lecture timetabling. The visual character reflects institutional permanence, computational precision, and academic scholarship. It eschews generic tech trends, decorative flourishes, glass effects, and playful rounding in favor of utilitarian clarity, high visual density, and structured typographic hierarchy.

The emotional signature is composed, authoritative, and reliable. Faculty chairs, department coordinators, and administrative deans must feel total command over complex, interlocked course schedules and prerequisite chains. Interface elements prioritize scan-speed, contrast, and information density, treating data tables, section matrix grids, and status tokens as first-class citizens.

## Colors

The core color system is strictly restrained to academic deep blues, muted stone backgrounds, and deliberate functional status tones:

- **Canvas & Surfaces**: The base workspace background is `#F5F2F3`. Default cards and panels rest on crisp `#FFFFFF`, while tertiary levels, row hover fills, and subtle segment containers use `#F0EEF0`. Structural outlines, dividers, and data grids rely on `#D0D5DD`.
- **Text Tiers**: Primary academic content, metrics, and header labels use high-legibility `#101828`. Secondary metadata, course IDs, credit breakdowns, and structural helper strings use `#475467`. Inverted text atop primary blue surfaces is `#FFFFFF`.
- **Primary Interactive**: Deep institutional cobalt `#021F94` serves as the primary action anchor, elevating to `#1436C4` on hover states.
- **Status Tokens (Light Default)**:
  - *Success* (Approved / Finalized / Reconciled): `#067647` text and icon on `#E7F6EF` badge background.
  - *Danger* (Conflict / Room Overfill / Missing Prereq): `#B42318` text and icon on `#FDECEC` badge background.
  - *Pending* (Under Review / Draft Syllabus / Unassigned): `#B54708` text and icon on `#FFF6E8` badge background.
- **Status Tokens (Dark Reference)**:
  - *Success*: `#3DDC97` on `#0E2A22`.
  - *Danger*: `#FF8A80` on `#2C1518`.
  - *Pending*: `#FFC46B` on `#2A2112`.

## Typography

The type scale strictly pairs 'Source Serif 4' for intellectual weight with 'Source Sans 3' for information density and mechanical legibility:

- **Source Serif 4**: Applied exclusively to high-level academic titles, semester banner designations, department headers, and major curriculum document sections. It conveys scholarship, administrative tenure, and formal authority.
- **Source Sans 3**: Powers all functional interface tiers, tabular data cells, form controls, navigation paths, and schedule timetables. Monospaced tabular figures must be enabled (`font-variant-numeric: tabular-nums`) across all data grids and course codes.
- **Forbidden Elements**: Do not use Inter, Roboto, emoji characters, stylized script fonts, or non-academic display typography. All iconography must use 1.5px monoline strokes matching text weight rather than graphic pictograms or emoji.

## Layout & Spacing

The layout is built for complex, high-density academic operations:

- **Desktop (>= 1280px)**: A 12-column layout structured around an anchored 240px curriculum sidebar and a fluid primary workspace. Gutters remain compact at 16px (`1rem`), with outer canvas padding set to 24px (`1.5rem`). This permits dense timetable matrix views (Monday through Saturday, 08:00 to 20:00) without excessive vertical pagination.
- **Tablet (768px - 1279px)**: Columns collapse to 8, sidebars collapse to narrow rail navigations, and gutters maintain 16px. Tables transition to horizontal scroll containers with frozen subject/section identifier columns.
- **Mobile (< 768px)**: A 4-column layout with 8px gutters and 16px outer margin. Dense matrices convert to sequential card-stack schedules.
- **Data Densities**: Row padding inside standard academic records tables is clamped to `0.5rem` top/bottom, maximizing the number of visible courses above the fold.

## Elevation & Depth

Visual separation relies on sharp structural boundaries, surface contrast, and controlled hairline rules rather than heavy shadows or blurred layers:

- **Flat Architectural Depth**: The foundation relies on low-contrast outlines (`1px solid #D0D5DD`) separating `#FFFFFF` containers from the `#F5F2F3` canvas.
- **Hover & Active Depth**: Interactive surfaces do not cast prominent drop shadows. Instead, elevation is communicated through background shifts into `#F0EEF0` (for outlined items, table rows, and secondary selectors) or state shifts to `#1436C4` (for solid primary controls).
- **Overlays & Drawers**: Modals, filter sheets, and lecture conflict inspection panels use a subtle, crisp shadow: `0 4px 12px rgba(16, 24, 40, 0.08)`, bounded by a `1px solid #D0D5DD` outer border.
- **Prohibitions**: Never use glassmorphism, background blurs, neon halos, or multi-colored glow effects.

## Shapes

The geometry of the interface maintains a disciplined structural posture:

- **Cards & Data Modules**: Defined with an exact corner radius of `12px` (`border-radius: 12px`).
- **Inner Controls**: Form inputs, small select dropdowns, search bars, and tabular chip indicators use `6px` to `8px` corner radiuses to sit neatly inside parent cards without clashing.
- **Iconography**: Clean, monoline linear icons using a uniform `1.5px` stroke width, geometric joins, and a strict 20x20px or 16x16px grid. No filled shapes, duotone fills, or decorative pictorial markers.

## Components

### Buttons
- **Primary**: Solid background `#021F94`, foreground `#FFFFFF`, border none, 8px radius, bold `13px` Source Sans 3. Hover state switches background to `#1436C4`. Focus ring is a clean `2px` offset outline in `#1436C4`.
- **Secondary / Outlined**: Transparent background, `1px solid #D0D5DD`, text `#101828`. Hover state fills with `#F0EEF0`. Active state reinforces border to `#475467`.
- **Text Link**: Plain text, `#021F94`, regular weight, baseline underline on hover, transitions to `#1436C4`.

### Chips & Status Badges
- Strict pill or rounded rectangle geometry (4px radius). Height capped at 22px.
- **Success Badge**: Background `#E7F6EF`, text `#067647`, 1.5px stroke check or dot.
- **Danger Badge**: Background `#FDECEC`, text `#B42318`, 1.5px stroke warning triangle or cross.
- **Pending Badge**: Background `#FFF6E8`, text `#B54708`, 1.5px stroke clock icon.

### Form Inputs & Controls
- **Input Fields**: Crisp `1px solid #D0D5DD` border on `#FFFFFF` background, 8px radius, height 36px (compact density). Text `#101828`, placeholder `#475467`. Active focus transitions border to `#021F94` with a sharp `1px` inner glow.
- **Checkboxes & Radios**: 16x16px bounds. Checked state fills `#021F94` with a crisp white 1.5px stroke mark. Unchecked state is `#FFFFFF` with `#D0D5DD` border.

### Course Schedule Grid & Tables
- **Table Container**: Encapsulated in a `12px` rounded card with a `1px solid #D0D5DD` perimeter.
- **Header Cells**: Background `#F0EEF0`, Source Sans 3 `11px` bold uppercase, text `#475467`, border-bottom `1px solid #D0D5DD`.
- **Data Rows**: Background `#FFFFFF`, padded `8px 12px`. Row hover unconditionally changes background to `#F0EEF0`. Course code columns display in semi-bold tabular font.
- **Timetable Matrix**: Time-slots demarcated with `1px solid #D0D5DD` horizontal guides. Scheduled sections snap into column intervals with solid white backgrounds, a 3px left-accent border in `#021F94` (or `#B54708` if unassigned), and condensed details.