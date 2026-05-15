# Design System – AttendU

## Color Strategy
**Restrained + Committed blend**: Tinted neutrals as base with one accent carrying 20–35% of interface surfaces.

### Palette (OKLCH)
- **Primary accent**: `oklch(54.5% 0.18 242)` — Educational blue, trust & professionalism
- **Success**: `oklch(67.5% 0.15 142)` — Attendance confirmed
- **Alert**: `oklch(60% 0.2 25)` — Warnings, errors, attention needed
- **Neutral dark**: `oklch(16% 0.005 242)` — Text on light backgrounds (not pure black)
- **Neutral light**: `oklch(97% 0.01 242)` — Light backgrounds (not pure white)
- **Surface**: `oklch(8% 0.008 242)` — Dark mode base (slight blue tint)

### Application
- Primary action buttons: blue accent
- Form inputs: neutral with blue focus state
- Backgrounds: light in light mode, surface in dark mode
- Cards: slight elevation with soft shadows
- Accents in data visualizations (attendance status badges, session progress)

## Typography
- **Font stack**: `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (geometric, modern, education-appropriate)
- **Scale**: 1.125 ratio (12 → 13.5 → 15.2 → 17.1 → 19.3 → 21.7 → 24.4 → 27.5 → 31 px)
- **Line height**: 1.5 for body, 1.2 for headings
- **Max body width**: 70 characters per line

## Elevation & Spacing
- **Space scale**: 8px base (0.5rem, 1rem, 1.5rem, 2rem, 2.5rem, 3rem, 3.5rem, 4rem, 4.5rem, 5rem)
- **Shadow system**: 
  - Subtle: `0 1px 3px rgba(0, 0, 0, 0.08)`
  - Medium: `0 4px 12px rgba(0, 0, 0, 0.12)`
  - Strong: `0 12px 32px rgba(0, 0, 0, 0.16)`
- **Border radius**: 8px (standard), 4px (inputs/small), 12px (large cards/modals)

## Components
- **Buttons**: Filled primary (blue), outlined secondary, ghost tertiary
- **Inputs**: Light border, full-width, clear focus state (blue ring)
- **Cards**: White/dark surface with subtle border, rounded corners
- **Status badges**: Inline, colored background with matching text
- **Alerts**: Colored left border + background tint (no full blur/glass)

## Motion
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for all transitions
- **Timing**: 200ms for micro-interactions, 400ms for layout changes
- **Avoid**: Animating layout properties directly; use transform instead

## Dark Mode
- Toggle in top-right of auth pages
- Primary surfaces: `oklch(8% 0.008 242)`
- Text: `oklch(94% 0.01 242)` (near-white)
- Accents: Same blue, slightly lifted for contrast

## Responsive
- **Desktop (1200px+)**: Two-column splits, full layouts
- **Tablet (768–1199px)**: Single column, stacked panels
- **Mobile (<768px)**: Full-screen single column, touch-friendly tap targets (48px min)
