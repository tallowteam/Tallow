# Linear Design System Specification

Comprehensive design language analysis and specification based on Linear.app's visual system.

---

## 1. Color Palette

### Brand Colors

Linear's signature indigo/purple-based brand palette creates a sophisticated, modern feel.

```css
/* Primary Brand Colors */
--color-brand-primary: #5e6ad2;     /* Main brand color - indigo blue */
--color-accent: #7170ff;            /* Vibrant purple accent */
--color-accent-hover: #828fff;      /* Lighter purple on hover */
--color-accent-tint: #18182f;       /* Dark purple tint for backgrounds */

/* Link Colors */
--color-link-primary: #828fff;      /* Interactive link color */
--color-link-hover: #ffffff;        /* Links on hover become white */
```

**Implementation Notes:**
- The brand indigo (#5e6ad2) is used sparingly for CTAs and important UI elements
- Accent purple (#7170ff) provides visual interest without overwhelming
- Hover states use lighter tints to indicate interactivity

### Text Colors

Linear uses a nuanced grayscale system with 4 levels of text hierarchy:

```css
/* Text Hierarchy */
--color-text-primary: #f7f8f8;      /* Primary text - near white */
--color-text-secondary: #d0d6e0;    /* Secondary text - light gray */
--color-text-tertiary: #8a8f98;     /* Tertiary text - medium gray */
--color-text-quaternary: #62666d;   /* Quaternary text - darker gray */
```

**Usage Guide:**
- Primary: Main headlines, important content
- Secondary: Body text, descriptions
- Tertiary: Supporting text, metadata
- Quaternary: Placeholder text, disabled states

### Background Colors

Multi-level background system creates depth without stark contrasts:

```css
/* Background Levels */
--color-bg-primary: #08090a;        /* Main background - almost black */
--color-bg-secondary: #1c1c1f;      /* Cards, elevated surfaces */
--color-bg-tertiary: #232326;       /* Nested elements */
--color-bg-quaternary: #28282c;     /* Hover states */
--color-bg-quinary: #282828;        /* Deepest level */

/* Granular Levels */
--color-bg-level-0: #08090a;        /* Base level */
--color-bg-level-1: #0f1011;        /* First elevation */
--color-bg-level-2: #141516;        /* Second elevation */
--color-bg-level-3: #191a1b;        /* Third elevation */

/* Special Backgrounds */
--color-bg-marketing: #010102;      /* Ultra-dark for hero sections */
--color-bg-tint: #141516;           /* Subtle tint overlay */
--color-bg-translucent: rgba(255,255,255,.05);  /* Glass effect */
```

### Border & Line Colors

Subtle borders maintain separation without harsh divisions:

```css
/* Borders */
--color-border-primary: #23252a;
--color-border-secondary: #34343a;
--color-border-tertiary: #3e3e44;
--color-border-translucent: rgba(255,255,255,.05);

/* Lines (thinner than borders) */
--color-line-primary: #37393a;
--color-line-secondary: #202122;
--color-line-tertiary: #18191a;
--color-line-quaternary: #141515;
--color-line-tint: #141516;
```

### Semantic Colors

```css
/* Status & Feedback Colors */
--color-red: #eb5757;       /* Error, danger */
--color-green: #4cb782;     /* Success, positive */
--color-blue: #4ea7fc;      /* Info, neutral */
--color-yellow: #f2c94c;    /* Warning, caution */
--color-orange: #fc7840;    /* Attention */
--color-indigo: #5e6ad2;    /* Primary actions */
```

### Product-Specific Colors

```css
/* Linear Product Colors */
--color-linear-plan: #68cc58;       /* Green for planning features */
--color-linear-build: #d4b144;      /* Gold for build features */
--color-linear-security: #7a7fad;   /* Purple for security features */
```

---

## 2. Typography System

### Font Families

Linear uses Inter Variable as their primary typeface with comprehensive fallbacks:

```css
/* Primary Font Stack */
--font-regular: "Inter Variable", "SF Pro Display", -apple-system,
  BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
  "Open Sans", "Helvetica Neue", sans-serif;

/* Monospace for Code */
--font-monospace: "Berkeley Mono", ui-monospace, "SF Mono", "Menlo", monospace;

/* Serif Display (Headers) */
--font-serif-display: "Tiempos Headline", ui-serif, Georgia, Cambria,
  "Times New Roman", Times, serif;

/* Emoji Support */
--font-emoji: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
  "Segoe UI", "Twemoji Mozilla", "Noto Color Emoji", "Android Emoji";
```

**Key Feature:** Inter Variable enables precise font weight control (not just 100-900 increments).

### Font Weights

Linear uses custom font weights for refined typography:

```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 510;      /* Custom weight for subtle emphasis */
--font-weight-semibold: 590;    /* Custom weight for headings */
--font-weight-bold: 680;        /* Heavy weight for strong emphasis */
```

**Why Custom Weights?** The 510 and 590 weights provide more granular control than standard 500/600.

### Heading Scale (Titles)

9-level title system from small to massive:

```css
/* Title 1 - Small (17px) */
--title-1-size: 1.0625rem;
--title-1-weight: 590;
--title-1-line-height: 1.4;
--title-1-letter-spacing: -0.012em;

/* Title 2 - Medium (21px) */
--title-2-size: 1.3125rem;
--title-2-weight: 590;
--title-2-line-height: 1.33;
--title-2-letter-spacing: -0.012em;

/* Title 3 - Large (24px) */
--title-3-size: 1.5rem;
--title-3-weight: 590;
--title-3-line-height: 1.33;
--title-3-letter-spacing: -0.012em;

/* Title 4 - XL (32px) */
--title-4-size: 2rem;
--title-4-weight: 590;
--title-4-line-height: 1.125;
--title-4-letter-spacing: -0.022em;

/* Title 5 - 2XL (40px) */
--title-5-size: 2.5rem;
--title-5-weight: 590;
--title-5-line-height: 1.1;
--title-5-letter-spacing: -0.022em;

/* Title 6 - 3XL (48px) */
--title-6-size: 3rem;
--title-6-weight: 590;
--title-6-line-height: 1.1;
--title-6-letter-spacing: -0.022em;

/* Title 7 - 4XL (56px) */
--title-7-size: 3.5rem;
--title-7-weight: 590;
--title-7-line-height: 1.1;
--title-7-letter-spacing: -0.022em;

/* Title 8 - 5XL (64px) */
--title-8-size: 4rem;
--title-8-weight: 590;
--title-8-line-height: 1.06;
--title-8-letter-spacing: -0.022em;

/* Title 9 - 6XL (72px) */
--title-9-size: 4.5rem;
--title-9-weight: 590;
--title-9-line-height: 1;
--title-9-letter-spacing: -0.022em;
```

**Key Pattern:** Negative letter spacing increases with size for optical balance.

### Body Text Scale

6-level text system for body content:

```css
/* Large Text (17px) */
--text-large-size: 1.0625rem;
--text-large-line-height: 1.6;
--text-large-letter-spacing: 0;

/* Regular Text (15px) - Default body */
--text-regular-size: 0.9375rem;
--text-regular-line-height: 1.6;
--text-regular-letter-spacing: -0.011em;

/* Small Text (14px) */
--text-small-size: 0.875rem;
--text-small-line-height: calc(21/14);  /* 1.5 */
--text-small-letter-spacing: -0.013em;

/* Mini Text (13px) */
--text-mini-size: 0.8125rem;
--text-mini-line-height: 1.5;
--text-mini-letter-spacing: -0.01em;

/* Micro Text (12px) */
--text-micro-size: 0.75rem;
--text-micro-line-height: 1.4;
--text-micro-letter-spacing: 0;

/* Tiny Text (10px) */
--text-tiny-size: 0.625rem;
--text-tiny-line-height: 1.5;
--text-tiny-letter-spacing: -0.015em;
```

**Real-World Example - H1 on Homepage:**
```css
h1 {
  font-size: 64px;
  font-weight: 510;
  line-height: 1.06;
  letter-spacing: -1.408px;
}
```

---

## 3. Spacing System

### Border Radius

Consistent rounded corners throughout the interface:

```css
--radius-4: 4px;      /* Subtle - small buttons, tags */
--radius-6: 6px;      /* Small - inputs, chips */
--radius-8: 8px;      /* Standard - buttons, cards */
--radius-12: 12px;    /* Medium - larger cards */
--radius-16: 16px;    /* Large - panels */
--radius-24: 24px;    /* XL - hero sections */
--radius-32: 32px;    /* 2XL - major components */
--radius-circle: 50%; /* Avatars */
--radius-rounded: 9999px; /* Pill buttons */
```

**Primary Use:** 8px is the standard radius for most interactive elements.

### Page Layout

```css
/* Page Container */
--page-max-width: 1024px;
--page-padding-inline: 24px;
--page-padding-block: 64px;
--page-padding-left: max(0px, 24px);
--page-padding-right: max(0px, 24px);

/* Prose Content */
--prose-max-width: 624px;  /* Optimal reading width */
```

### Grid System

```css
--grid-columns: 12;
--1fr: minmax(0, 1fr);  /* Flexible grid fraction */
```

---

## 4. Component Patterns

### Buttons

Linear buttons feature minimal design with smooth transitions:

```css
/* Primary CTA Button */
.button-primary {
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 510;
  background-color: #e6e6e6;
  color: #08090a;
  box-shadow:
    0px 8px 2px 0px transparent,
    0px 5px 2px 0px rgba(0,0,0,.01),
    0px 3px 2px 0px rgba(0,0,0,.04),
    0px 1px 1px 0px rgba(0,0,0,.07),
    0px 0px 1px 0px rgba(0,0,0,.08);
  transition:
    background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Ghost/Secondary Button */
.button-secondary {
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 510;
  background-color: transparent;
  color: #8a8f98;
  border: none;
  transition:
    color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.button-secondary:hover {
  color: #f7f8f8;
  background-color: rgba(255,255,255,0.05);
}
```

### Navigation (Header)

Glassmorphism effect with blur backdrop:

```css
.header {
  height: 64px;  /* --header-height */
  background: rgba(11, 11, 11, 0.8);  /* --header-bg */
  backdrop-filter: blur(20px);  /* --header-blur */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);  /* --header-border */
}
```

### Cards & Containers

Glass container with gradient border effect:

```css
.glass-container {
  background: linear-gradient(
    134deg,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0) 55%
  );
  border-radius: 12px;
  padding: 24px;
}
```

---

## 5. Shadow System

Layered shadow approach for depth:

```css
/* No Shadow */
--shadow-none: 0px 0px 0px transparent;

/* Subtle Elevation */
--shadow-low: 0px 2px 4px rgba(0, 0, 0, 0.1);

/* Medium Elevation */
--shadow-medium: 0px 4px 24px rgba(0, 0, 0, 0.2);

/* High Elevation (Modals, Popovers) */
--shadow-high: 0px 7px 32px rgba(0, 0, 0, 0.35);

/* Stacked Shadow (Realistic) */
--shadow-stack-low:
  0px 8px 2px 0px transparent,
  0px 5px 2px 0px rgba(0, 0, 0, 0.01),
  0px 3px 2px 0px rgba(0, 0, 0, 0.04),
  0px 1px 1px 0px rgba(0, 0, 0, 0.07),
  0px 0px 1px 0px rgba(0, 0, 0, 0.08);
```

**Pattern:** Multiple layered shadows create more realistic depth than single shadows.

---

## 6. Animation & Motion

### Easing Functions

Comprehensive easing curve library for natural motion:

```css
/* Quad Easing */
--ease-in-quad: cubic-bezier(0.55, 0.085, 0.68, 0.53);
--ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* Most common */
--ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);

/* Cubic Easing */
--ease-in-cubic: cubic-bezier(0.55, 0.055, 0.675, 0.19);
--ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
--ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);

/* Quart Easing (Stronger) */
--ease-in-quart: cubic-bezier(0.895, 0.03, 0.685, 0.22);
--ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
--ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);

/* Quint Easing (Strongest) */
--ease-in-quint: cubic-bezier(0.755, 0.05, 0.855, 0.06);
--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out-quint: cubic-bezier(0.86, 0, 0.07, 1);

/* Expo Easing (Dramatic) */
--ease-in-expo: cubic-bezier(0.95, 0.05, 0.795, 0.035);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-in-out-expo: cubic-bezier(1, 0, 0, 1);

/* Circ Easing (Smooth) */
--ease-in-circ: cubic-bezier(0.6, 0.04, 0.98, 0.335);
--ease-out-circ: cubic-bezier(0.075, 0.82, 0.165, 1);
--ease-in-out-circ: cubic-bezier(0.785, 0.135, 0.15, 0.86);
```

### Timing/Duration

```css
--speed-quick-transition: 0.1s;      /* Fast interactions (hover) */
--speed-regular-transition: 0.25s;   /* Standard animations */
--speed-highlight-fade-in: 0s;       /* Instant appear */
--speed-highlight-fade-out: 0.15s;   /* Quick disappear */
```

### Standard Transition Pattern

```css
/* Most elements use this pattern */
transition:
  color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
  background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
  transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

**Key Insight:** Linear prefers `ease-out-quad` for most transitions - quick start, smooth finish.

---

## 7. Visual Effects

### Gradients

Linear uses gradients sparingly but effectively:

```css
/* Subtle Section Fade */
.section-gradient {
  background: linear-gradient(
    rgba(255, 255, 255, 0.05),
    rgba(0, 0, 0, 0) 20%
  );
}

/* Glass Container Gradient */
.glass-gradient {
  background: linear-gradient(
    134deg,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0) 55%
  );
}

/* Text Gradient (Headings) */
.text-gradient {
  background: linear-gradient(
    to right,
    rgb(247, 248, 248),
    rgba(0, 0, 0, 0) 80%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Status Gradient (Selected Items) */
.selected-gradient {
  background: linear-gradient(
    rgb(52, 52, 52) 0%,
    rgb(45, 45, 45) 100%
  );
}
```

### Glassmorphism

Frosted glass effect for elevated UI:

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

### Overlay System

Layered overlay colors for modals and backgrounds:

```css
--color-overlay-primary: rgba(0, 0, 0, 0.85);  /* Modal backdrop */
--color-overlay-dim-rgb: 255, 255, 255;         /* For custom overlays */
```

---

## 8. Dark Mode Implementation

Linear is dark-first with sophisticated dark backgrounds:

### Background Strategy

Uses multi-level backgrounds (#08090a → #191a1b) rather than pure black:

```css
/* Base Level - Near Black */
body {
  background-color: #08090a;
  color: #f7f8f8;
}

/* Elevated Surfaces */
.card {
  background-color: #141516;  /* Slightly lighter */
}

/* Nested Elements */
.nested {
  background-color: #191a1b;  /* Even lighter */
}
```

**Why Not Pure Black?**
- Reduces eye strain
- Better OLED display optimization
- Creates subtle depth hierarchy

### Selection Colors

```css
::selection {
  background: color-mix(in lch, #5e6ad2, black 10%);
  color: #fff;
}

/* Dimmed Selection */
.dim-selection::selection {
  background: color-mix(in lch, #5e6ad2, transparent 80%);
}
```

---

## 9. Accessibility Features

### Focus Rings

Prominent, accessible focus indicators:

```css
--focus-ring-color: #5e6ad2;
--focus-ring-width: 2px;
--focus-ring-offset: 2px;
--focus-ring-outline: 2px solid #5e6ad2;

*:focus-visible {
  outline: var(--focus-ring-outline);
  outline-offset: var(--focus-ring-offset);
}
```

### Minimum Touch Targets

```css
--min-tap-size: 44px;  /* WCAG AAA compliant */
```

### Cursor States

```css
--cursor-pointer: pointer;
--cursor-disabled: not-allowed;
--cursor-tooltip: help;
--cursor-none: none;
```

---

## 10. Z-Index System

Organized layer hierarchy:

```css
--layer-1: 1;
--layer-2: 2;
--layer-3: 3;
--layer-footer: 50;
--layer-scrollbar: 75;
--layer-header: 100;
--layer-overlay: 500;
--layer-popover: 600;
--layer-command-menu: 650;
--layer-dialog-overlay: 699;
--layer-dialog: 700;
--layer-toasts: 800;
--layer-tooltip: 1100;
--layer-context-menu: 1200;
--layer-skip-nav: 5000;
--layer-debug: 5100;
--layer-max: 10000;
```

---

## 11. Responsive Breakpoints

Based on observed behavior:

```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## 12. Micro-Interactions

### Hover Effects

```css
/* Button Hover */
button:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
  transition: all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Link Hover */
a:hover {
  color: #ffffff;
  transition: color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Active States

```css
button:active {
  transform: translateY(0);
  transition-duration: 0.05s;
}
```

### Loading States

Smooth skeleton screens and spinners use subtle animations.

---

## 13. Icon System

```css
/* Grayscale Icon Filter */
--icon-grayscale-image-filter: grayscale(100%) brightness(400%);
```

Icons appear to use custom Linear icon set with consistent stroke width.

---

## 14. Real-World Component Examples

### Hero Section

```css
.hero {
  background: #010102;  /* --color-bg-marketing */
  padding: 64px 24px;
}

.hero h1 {
  font-size: 64px;
  font-weight: 510;
  line-height: 1.06;
  letter-spacing: -1.408px;
  color: #f7f8f8;
}

.hero p {
  font-size: 15px;
  line-height: 1.6;
  color: #d0d6e0;
  max-width: 624px;
}
```

### Primary CTA

```css
.cta-button {
  padding: 0 12px;
  height: 40px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 510;
  background: #e6e6e6;
  color: #08090a;
  border: none;
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.cta-button:hover {
  background: #ffffff;
  transform: translateY(-1px);
}
```

### Navigation Link

```css
.nav-link {
  font-size: 13px;
  font-weight: 510;
  color: #8a8f98;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.nav-link:hover {
  color: #f7f8f8;
}
```

---

## 15. Performance Considerations

### Font Loading

```css
/* Variable font reduces requests */
@font-face {
  font-family: 'Inter Variable';
  font-display: swap;  /* Prevent FOIT */
}
```

### Hardware Acceleration

```css
/* Use transform for animations */
.animated {
  transform: translateZ(0);  /* Promote to GPU layer */
  will-change: transform;    /* Hint to browser */
}
```

---

## 16. Design Principles

Based on observed patterns:

1. **Subtle Over Stark**: Near-black backgrounds, not pure black
2. **Consistent Spacing**: 8px base unit for rhythm
3. **Fast Interactions**: 100ms transitions feel instant
4. **Progressive Enhancement**: Glassmorphism where supported
5. **Typography First**: Careful attention to weights and spacing
6. **Accessible by Default**: Strong focus indicators, proper contrast
7. **Minimal Color Use**: Indigo accent used sparingly for impact
8. **Depth Through Elevation**: Multi-level backgrounds create hierarchy

---

## 17. Implementation Quick Start

### CSS Custom Properties Setup

```css
:root {
  /* Colors */
  --brand-primary: #5e6ad2;
  --bg-primary: #08090a;
  --text-primary: #f7f8f8;

  /* Typography */
  --font-body: "Inter Variable", sans-serif;
  --font-weight-medium: 510;
  --font-weight-semibold: 590;

  /* Spacing */
  --radius-standard: 8px;
  --spacing-base: 8px;

  /* Animation */
  --ease-standard: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --duration-quick: 0.1s;
}
```

### Body Baseline

```css
body {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: -0.011em;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 18. Key Takeaways

1. **Purple/Indigo Brand**: #5e6ad2 and #7170ff define Linear's visual identity
2. **Inter Variable**: Enables precise font weights (510, 590) for refined typography
3. **Multi-Level Backgrounds**: 9 levels (#08090a → #191a1b) create depth
4. **Fast Transitions**: 100ms with ease-out-quad for instant feel
5. **8px Border Radius**: Standard for most interactive elements
6. **Glassmorphism**: Subtle backdrop blur on headers and modals
7. **Negative Letter Spacing**: -0.012em to -0.022em on large text
8. **Layered Shadows**: Multiple shadow layers for realistic depth
9. **Accessible Focus**: 2px solid #5e6ad2 outline with 2px offset
10. **Dark-First Design**: Near-black (#08090a) not pure black

---

## Additional Resources

- **Font**: Download Inter Variable from https://rsms.me/inter/
- **Color Tool**: Use oklch() for perceptually uniform color adjustments
- **Motion**: Prefer ease-out curves for UI elements entering view

---

*Last Updated: 2026-02-03*
*Based on analysis of linear.app homepage*
