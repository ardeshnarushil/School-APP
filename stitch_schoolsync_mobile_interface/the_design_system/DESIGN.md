---
name: The Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#00505f'
  on-tertiary: '#ffffff'
  tertiary-container: '#006a7c'
  on-tertiary-container: '#93e8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  h1:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '900'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '900'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '900'
    lineHeight: '1.4'
    letterSpacing: 0em
  body-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-padding: 1.5rem
  stack-gap: 1rem
  section-margin: 2rem
  touch-target: 3rem
---

## Brand & Style

This design system is built for a mobile-first educational environment where clarity and approachability are paramount. It balances institutional reliability with a friendly, modern interface designed to reduce cognitive load for students, teachers, and parents.

The aesthetic leans into a **Corporate Modern** style but softens the edges—literally and figuratively. By combining high-contrast typography with ultra-rounded geometry, the system evokes a sense of "soft-professionalism." The experience is tactile and responsive, prioritizing ease of navigation and a "non-threatening" educational atmosphere.

## Colors

The palette is anchored by **Indigo**, representing trust and intellectual growth, and **Slate**, providing a neutral, calm foundation. 

- **Primary (Indigo):** Used for primary actions, active states, and brand-critical elements.
- **Secondary (Slate):** Used for secondary text, icons, and less emphasized UI components.
- **Surface:** A bright, clean white surface is used for content, resting on a very light Slate-50 background to create a subtle distinction between the canvas and the components.
- **Accents:** Occasional use of Cyan for specialized tracking or success indicators to maintain a fresh, modern feel.

## Typography

The design system utilizes **Lexend**, a typeface specifically designed to improve reading proficiency. This choice reinforces the educational mission of the platform while providing a clean, geometric look that complements the ultra-rounded UI.

Headings utilize a **Black (900)** weight to create an undeniable visual hierarchy, ensuring that even on small mobile screens, the user immediately understands the context of the page. Body text remains light and spacious to ensure legibility during long reading sessions or grade reviews.

## Layout & Spacing

This design system follows a **fluid grid** model optimized for handheld devices. It utilizes a 4px baseline grid to maintain rhythmic consistency. 

Key layout principles:
- **Safe Zones:** Standardized 24px (1.5rem) horizontal padding for all mobile containers.
- **Vertical Rhythm:** Generous vertical spacing between cards to allow the ultra-rounded corners to "breathe" without visual crowding.
- **Touch Targets:** All interactive elements maintain a minimum height of 48px to ensure accessibility for all age groups.

## Elevation & Depth

The design system uses a combination of **low-contrast outlines** and **ambient shadows** to create a sense of organized layering.

- **Outlines:** Every card and major container utilizes a 1px border in Slate-100. This provides structure without the visual "heaviness" of darker borders.
- **Shadows:** A very subtle, diffused shadow (`shadow-sm`) is applied to cards to lift them slightly from the background.
- **Transparency:** The system utilizes `backdrop-blur` for elevated surfaces like side-drawers and navigation bars, allowing the user to maintain a sense of context of the underlying content.

## Shapes

The defining characteristic of this design system is its **ultra-rounded shape language**. This serves to make the platform feel safe, modern, and friendly.

- **Primary Containers:** Large cards and modal sheets use a 40px (2.5rem) corner radius.
- **Interactive Elements:** Buttons and input fields use a more conservative 16px (1rem) radius to balance functionality with the overall theme.
- **Consistency:** All nested elements must follow the "concentric rounding" rule, where inner radii are slightly smaller than outer radii to maintain visual harmony.

## Components

### Buttons & Inputs
- **Behavior:** All interactive components must include an `active:scale-95` transform to provide tactile feedback.
- **Transitions:** Use a global transition duration of `500ms` with a `cubic-bezier` timing function for smooth, non-linear movement.
- **Fields:** Input fields use a white background, Slate-100 border, and Lexend medium for placeholder text.

### Cards
- **Structure:** Cards are the primary content vessel. They must feature a `border-slate-100`, `shadow-sm`, and `rounded-[2.5rem]`.
- **Padding:** Internal card padding should be a minimum of 24px to ensure text doesn't clash with the heavy corner radii.

### Sliding Side-Drawer
- **Visuals:** Drawers slide from the left or right, utilizing a semi-transparent background with a high-density `backdrop-blur`.
- **Overlay:** The backdrop overlay should be a low-opacity Indigo tint to keep the brand present even in modal states.

### Chips & Badges
- **Style:** Small, pill-shaped indicators with high-contrast text used for category labels or status indicators (e.g., "Homework," "Late," "Graded").