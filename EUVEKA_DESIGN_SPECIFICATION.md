# Euveka Design System Specification

> **Source**: https://www.euveka.com/
> **Analyzed**: February 2026
> **Purpose**: Complete design language specification for recreating Euveka's visual aesthetic

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography System](#typography-system)
3. [Spacing & Layout](#spacing--layout)
4. [Component Patterns](#component-patterns)
5. [Animation & Motion](#animation--motion)
6. [Visual Effects](#visual-effects)
7. [Brand Elements](#brand-elements)
8. [Implementation Guide](#implementation-guide)

---

## Color Palette

### Primary Colors

```css
/* Foundation */
--euveka-white: #fefefc;           /* Off-white background */
--euveka-black: #191610;           /* Near-black primary dark */
--euveka-charcoal: #29251c;        /* Secondary dark */
--euveka-dark-brown: #242018;      /* Card backgrounds */

/* Accent Colors */
--euveka-blue-primary: #0099ff;    /* Primary accent */
--euveka-blue-dark: #000dff;       /* Secondary accent */
```

### Neutral Scale

```css
/* Warm Neutrals */
--euveka-neutral-100: #fcf6ec;     /* Lightest */
--euveka-neutral-200: #f3ede2;
--euveka-neutral-300: #e5dac7;
--euveka-neutral-400: #d6cec2;     /* Border light */
--euveka-neutral-500: #b2987d;
--euveka-neutral-600: #544a36;     /* Border dark */
--euveka-neutral-700: #242018;
--euveka-neutral-800: #191610;
--euveka-neutral-900: #18160f;     /* Darkest */
```

### Gradients

```css
/* Vertical Fade */
--euveka-gradient-fade: linear-gradient(
  180deg,
  rgba(252, 247, 237, 0) 0%,
  rgb(252, 246, 236) 100%
);

/* Mask Gradients (for edge fading) */
--euveka-mask-vertical: linear-gradient(
  to bottom,
  transparent 0%,
  black 20%,
  black 80%,
  transparent 100%
);
```

### Usage Guidelines

- **Light Theme**: Use `#fefefc` as primary background with `#191610` text
- **Dark Theme**: Use `#191610` as primary background with `#fefefc` text
- **Borders**: Light theme uses `#d6cec2`, dark theme uses `#544a36`
- **Accent Usage**: Blue accents sparingly for CTAs and interactive elements
- **Warm Tones**: The neutral palette has warm undertones (beige/brown) for sophistication

---

## Typography System

### Font Families

```css
/* Display Typography */
--font-display: 'PP Eiko Thin', system-ui, sans-serif;
--font-display-fallback: -apple-system, BlinkMacSystemFont, sans-serif;

/* Body Typography */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Weights

```css
/* PP Eiko Thin (Display) */
--weight-thin: 300;           /* Primary display weight */

/* Inter (Body) */
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Type Scale

```css
/* Font Sizes */
--text-xs: 12px;              /* Small labels, meta */
--text-sm: 14px;              /* Secondary text */
--text-base: 16px;            /* Body text */
--text-lg: 18px;              /* Large body */
--text-xl: 20px;              /* Subheadings */
--text-2xl: 24px;             /* Small headings */
--text-3xl: 32px;             /* Headings */
--text-4xl: 40px;             /* Large headings */
--text-5xl: 48px;             /* Hero subheadings */
--text-6xl: 64px;             /* Hero headings */
--text-display: clamp(48px, 8vw, 120px); /* Responsive display */
```

### Line Heights

```css
--leading-tight: 1.1;         /* Display text */
--leading-snug: 1.2;          /* Headings */
--leading-normal: 1.5;        /* Body text */
--leading-relaxed: 1.6;       /* Long-form content */
```

### Typography Classes

```css
/* Hero Display */
.hero-display {
  font-family: var(--font-display);
  font-weight: var(--weight-thin);
  font-size: var(--text-display);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
}

/* Section Heading */
.section-heading {
  font-family: var(--font-display);
  font-weight: var(--weight-thin);
  font-size: var(--text-3xl);
  line-height: var(--leading-snug);
}

/* Body Text */
.body-text {
  font-family: var(--font-body);
  font-weight: var(--weight-regular);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

/* Label Text */
.label-text {
  font-family: var(--font-body);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Spacing & Layout

### Spacing Scale

```css
/* Base Spacing System */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-30: 120px;
--space-40: 160px;
--space-55: 220px;
```

### Container Widths

```css
/* Layout Containers */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1200px;
--container-2xl: 1320px;
--container-max: 1400px;
```

### Grid System

```css
/* CSS Grid Layout */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(4, minmax(50px, 1fr));
  grid-template-rows: repeat(11, minmax(0, 1fr));
  gap: 16px;
}

/* Responsive Grid */
@media (min-width: 768px) {
  .grid-layout {
    grid-template-columns: repeat(8, minmax(50px, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: repeat(12, minmax(50px, 1fr));
  }
}
```

### Section Spacing

```css
/* Vertical Rhythm */
--section-spacing-sm: 60px;
--section-spacing-md: 80px;
--section-spacing-lg: 120px;
--section-spacing-xl: 160px;

/* Component Spacing */
--component-gap-sm: 10px;
--component-gap-md: 20px;
--component-gap-lg: 40px;
```

---

## Component Patterns

### Buttons

```css
/* Primary Button */
.btn-primary {
  height: 64px;
  min-width: 112px;
  padding: 0 32px;

  /* Visual */
  background: transparent;
  border: 1px solid var(--euveka-neutral-400);
  border-radius: 60px; /* Full pill shape */

  /* Typography */
  font-family: var(--font-body);
  font-weight: var(--weight-medium);
  font-size: var(--text-base);

  /* Interaction */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.btn-primary:hover {
  transform: scale(1.05);
  border-color: var(--euveka-neutral-600);
}

/* Dark Theme Button */
.btn-primary-dark {
  border-color: var(--euveka-neutral-600);
  color: var(--euveka-white);
}

.btn-primary-dark:hover {
  background: rgba(254, 254, 252, 0.1);
}

/* Accent Button */
.btn-accent {
  background: var(--euveka-blue-primary);
  border-color: var(--euveka-blue-primary);
  color: var(--euveka-white);
}

.btn-accent:hover {
  background: var(--euveka-blue-dark);
  border-color: var(--euveka-blue-dark);
}
```

### Cards

```css
/* Base Card */
.card {
  background: var(--euveka-dark-brown);
  border-radius: 24px;
  padding: 32px;

  /* Optional border */
  border: 1px dashed var(--euveka-black);
}

/* Large Card */
.card-lg {
  border-radius: 32px;
  padding: 48px;
}

/* Light Theme Card */
.card-light {
  background: var(--euveka-white);
  border-color: var(--euveka-neutral-400);
}

/* Hover State */
.card-interactive {
  transition: transform 0.3s ease;
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-4px);
}
```

### Input Fields

```css
/* Text Input */
.input-field {
  /* Reset */
  border: none;
  border-bottom: 1px solid rgba(254, 253, 251, 0.24);
  background: transparent;

  /* Spacing */
  padding: 0 0 24px 0;

  /* Typography */
  font-family: var(--font-display);
  font-weight: var(--weight-thin);
  font-size: 32px;
  color: var(--euveka-white);

  /* Interaction */
  outline: none;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  border-bottom-color: rgba(254, 254, 252, 0.4);
}

.input-field::placeholder {
  color: rgba(254, 254, 252, 0.4);
}
```

### Navigation

```css
/* Fixed Navigation */
.nav-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  z-index: 10;

  /* Visual Effect */
  mix-blend-mode: difference;

  /* Typography */
  font-family: var(--font-body);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
}

/* Navigation Items */
.nav-item {
  padding: 16px 20px;
  color: var(--euveka-white);
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.nav-item:hover {
  opacity: 0.7;
}
```

### Hero Section

```css
/* Hero Container */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  /* Spacing */
  padding: 120px 40px;
}

/* Hero Content */
.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Hero Heading */
.hero-heading {
  font-family: var(--font-display);
  font-weight: var(--weight-thin);
  font-size: clamp(48px, 8vw, 120px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 32px;
}

/* Hero Subheading */
.hero-subheading {
  font-family: var(--font-body);
  font-weight: var(--weight-regular);
  font-size: var(--text-xl);
  line-height: 1.6;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto 48px;
}

/* Hero Background */
.hero-background {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.hero-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--euveka-gradient-fade);
}
```

---

## Animation & Motion

### Transition System

```css
/* Base Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);

/* Easing Curves */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effects

```css
/* Scale on Hover */
.hover-scale {
  transition: transform var(--transition-base);
  will-change: transform;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Lift on Hover */
.hover-lift {
  transition: transform var(--transition-base);
}

.hover-lift:hover {
  transform: translateY(-4px);
}

/* Opacity on Hover */
.hover-opacity {
  transition: opacity var(--transition-base);
}

.hover-opacity:hover {
  opacity: 0.7;
}
```

### Performance Optimization

```css
/* GPU Acceleration */
.will-change-transform {
  will-change: transform;
}

.will-change-opacity {
  will-change: opacity;
}

/* Remove will-change after animation */
.animated {
  will-change: auto;
}
```

### Scroll Animations

```css
/* Fade In on Scroll */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-fade-in {
  animation: fadeInUp 0.8s var(--ease-out) forwards;
}

/* Stagger Children */
.stagger-children > * {
  animation: fadeInUp 0.8s var(--ease-out) forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 100ms; }
.stagger-children > *:nth-child(3) { animation-delay: 200ms; }
.stagger-children > *:nth-child(4) { animation-delay: 300ms; }
```

---

## Visual Effects

### Blur Effects

```css
/* Background Blur */
.blur-background {
  filter: blur(84px);
  -webkit-filter: blur(84px);
}

/* Glass Morphism */
.glass-effect {
  background: rgba(254, 254, 252, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(254, 254, 252, 0.2);
}
```

### Blend Modes

```css
/* Difference Blend (for navigation) */
.blend-difference {
  mix-blend-mode: difference;
}

/* Lighten Blend (for accents) */
.blend-lighten {
  mix-blend-mode: lighten;
}
```

### Mask Gradients

```css
/* Fade Edges */
.mask-fade-vertical {
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}

.mask-fade-horizontal {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}
```

### Shadows

```css
/* Shadow System (inferred from aesthetic) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Inset Shadow for depth */
--shadow-inset: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
```

### Aspect Ratios

```css
/* Common Aspect Ratios */
--aspect-hero: 1.645933 / 1;
--aspect-card: 0.5 / 1;
--aspect-wide: 7.333 / 1;
--aspect-square: 1 / 1;
--aspect-video: 16 / 9;

/* Usage */
.aspect-hero {
  aspect-ratio: var(--aspect-hero);
}
```

---

## Brand Elements

### Design Philosophy

**Euveka's design embodies:**
1. **Minimalist Luxury** - Restraint in visual elements, maximum impact
2. **Technological Sophistication** - Clean, precise, future-forward
3. **Warm Minimalism** - Warm neutral tones prevent cold sterility
4. **Spatial Elegance** - Generous whitespace, breathing room
5. **Typographic Hierarchy** - Thin display fonts contrast with body text

### Key Differentiators

```css
/* Thin Display Typography */
.euveka-signature-text {
  font-family: var(--font-display);
  font-weight: 300; /* Signature thin weight */
  letter-spacing: -0.02em;
}

/* Warm Neutral Palette */
.euveka-warm-bg {
  background: var(--euveka-neutral-100); /* #fcf6ec */
}

/* Pill-Shaped Buttons */
.euveka-pill-button {
  border-radius: 60px; /* Full pill */
  border: 1px solid;
}

/* High Contrast Dark Mode */
.euveka-dark-mode {
  background: var(--euveka-black);
  color: var(--euveka-white);
}
```

### Industry Aesthetic: Technology + Innovation

**How Euveka presents tech:**

1. **Abstraction Over Literalism**
   - No clichéd circuit boards or binary code
   - Abstract geometric patterns
   - Sophisticated blur and gradient effects

2. **Precision Engineering**
   - Grid-based layouts
   - Mathematical spacing ratios
   - Pixel-perfect alignment

3. **Human-Centered Tech**
   - Warm color palette (not cold blue/gray)
   - Readable typography hierarchy
   - Approachable interactions

4. **Premium Positioning**
   - Generous whitespace
   - Understated animations
   - Quality over quantity in visual elements

### Visual Signature Elements

```css
/* Euveka's signature visual elements */

/* 1. Thin display typography with tight tracking */
.signature-display {
  font-family: 'PP Eiko Thin';
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* 2. Warm beige backgrounds */
.signature-background {
  background: #fefefc;
}

/* 3. Near-black, not pure black */
.signature-dark {
  background: #191610;
}

/* 4. Pill buttons with minimal padding */
.signature-button {
  border-radius: 60px;
  height: 64px;
  padding: 0 32px;
  border: 1px solid;
}

/* 5. Vertical gradient fades */
.signature-gradient {
  background: linear-gradient(
    180deg,
    rgba(252, 247, 237, 0) 0%,
    rgb(252, 246, 236) 100%
  );
}

/* 6. Mix blend mode on navigation */
.signature-nav {
  mix-blend-mode: difference;
}
```

---

## Implementation Guide

### Step 1: Setup Custom Properties

```css
/* root-variables.css */
:root {
  /* Colors */
  --euveka-white: #fefefc;
  --euveka-black: #191610;
  --euveka-neutral-400: #d6cec2;
  --euveka-neutral-600: #544a36;
  --euveka-blue-primary: #0099ff;

  /* Typography */
  --font-display: 'PP Eiko Thin', system-ui;
  --font-body: 'Inter', sans-serif;

  /* Spacing */
  --space-8: 32px;
  --space-10: 40px;
  --space-16: 64px;

  /* Transitions */
  --transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Step 2: Load Fonts

```html
<!-- In <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Inter from Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- PP Eiko Thin (Custom font - requires license) -->
<!-- Alternative: Use 'Lato' thin (300) as fallback -->
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300&display=swap" rel="stylesheet">
```

### Step 3: Base Styles

```css
/* base.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.5;
  color: var(--euveka-black);
  background: var(--euveka-white);
}

/* Dark mode */
body.dark-mode {
  color: var(--euveka-white);
  background: var(--euveka-black);
}
```

### Step 4: Component Library Structure

```
styles/
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   └── effects.css
├── components/
│   ├── buttons.css
│   ├── cards.css
│   ├── inputs.css
│   └── navigation.css
├── layouts/
│   ├── containers.css
│   ├── grid.css
│   └── hero.css
└── utilities/
    ├── animations.css
    └── helpers.css
```

### Step 5: Responsive Breakpoints

```css
/* breakpoints.css */
/* Mobile first approach */

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  :root {
    --text-display: clamp(56px, 8vw, 120px);
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  :root {
    --section-spacing: 80px;
  }
}

/* Large devices (desktops, 1024px and up) */
@media (min-width: 1024px) {
  :root {
    --section-spacing: 120px;
  }
}

/* Extra large devices (large desktops, 1280px and up) */
@media (min-width: 1280px) {
  :root {
    --container-padding: 48px;
  }
}

/* XXL devices (ultra-wide, 1536px and up) */
@media (min-width: 1536px) {
  :root {
    --section-spacing: 160px;
  }
}
```

### Step 6: Accessibility Considerations

```css
/* Focus states */
*:focus-visible {
  outline: 2px solid var(--euveka-blue-primary);
  outline-offset: 4px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --euveka-neutral-400: #a0a0a0;
    --euveka-neutral-600: #404040;
  }
}
```

---

## Quick Reference Cheat Sheet

### Most Important Values

```css
/* Primary Colors */
Background Light: #fefefc
Background Dark: #191610
Border Light: #d6cec2
Border Dark: #544a36
Accent: #0099ff

/* Typography */
Display Font: PP Eiko Thin (300)
Body Font: Inter (400-600)
Display Size: clamp(48px, 8vw, 120px)
Body Size: 16px

/* Spacing */
Component Gap: 20px, 40px
Section Spacing: 80px, 120px
Button Height: 64px
Card Padding: 32px

/* Border Radius */
Cards: 24px or 32px
Buttons: 60px (pill shape)

/* Effects */
Background Blur: 84px
Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)
Mix Blend: difference (navigation)
```

---

## Font Alternatives

Since **PP Eiko Thin** is a premium font, here are alternatives:

```css
/* Free Alternatives for PP Eiko Thin */
--font-display-alt-1: 'Lato', sans-serif; /* Weight: 300 */
--font-display-alt-2: 'Work Sans', sans-serif; /* Weight: 300 */
--font-display-alt-3: 'Poppins', sans-serif; /* Weight: 300 */
--font-display-alt-4: 'Montserrat', sans-serif; /* Weight: 300 */

/* Usage */
.hero-heading {
  font-family: 'Lato', var(--font-display-fallback);
  font-weight: 300;
}
```

---

## Complete Example Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Euveka-Inspired Design</title>

  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lato:wght@300&display=swap" rel="stylesheet">

  <style>
    /* CSS Variables */
    :root {
      --euveka-white: #fefefc;
      --euveka-black: #191610;
      --euveka-neutral-400: #d6cec2;
      --euveka-neutral-600: #544a36;
      --euveka-blue: #0099ff;

      --font-display: 'Lato', system-ui;
      --font-body: 'Inter', sans-serif;

      --space-8: 32px;
      --space-16: 64px;
      --transition: 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-body);
      background: var(--euveka-white);
      color: var(--euveka-black);
      line-height: 1.5;
    }

    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 120px 40px;
    }

    .hero-heading {
      font-family: var(--font-display);
      font-weight: 300;
      font-size: clamp(48px, 8vw, 120px);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-8);
    }

    .hero-subheading {
      font-size: 18px;
      opacity: 0.8;
      max-width: 600px;
      margin: 0 auto 48px;
    }

    /* Button */
    .btn {
      display: inline-block;
      height: 64px;
      padding: 0 32px;
      background: transparent;
      border: 1px solid var(--euveka-neutral-400);
      border-radius: 60px;
      font-weight: 500;
      text-decoration: none;
      color: inherit;
      transition: all var(--transition);
      line-height: 64px;
    }

    .btn:hover {
      transform: scale(1.05);
      border-color: var(--euveka-neutral-600);
    }
  </style>
</head>
<body>
  <section class="hero">
    <div>
      <h1 class="hero-heading">Build the Future</h1>
      <p class="hero-subheading">
        Sophisticated technology meets elegant design in a seamless experience
      </p>
      <a href="#" class="btn">Get Started</a>
    </div>
  </section>
</body>
</html>
```

---

## Summary

Euveka's design language is characterized by:

- **Minimalist sophistication** with generous whitespace
- **Warm neutral palette** (#fefefc, #191610) avoiding stark black/white
- **Thin display typography** (PP Eiko 300) for elegant headlines
- **Pill-shaped buttons** (60px border-radius) with minimal styling
- **Subtle animations** using transform and opacity
- **High contrast** between light/dark themes
- **Grid-based precision** in layout and spacing
- **Blur and gradient effects** for depth and atmosphere
- **Mix blend modes** for sophisticated layering (navigation)
- **Mathematical spacing** (multiples of 4-8px base unit)

This design system positions Euveka as a **premium technology brand** that values elegance, precision, and human-centered design over flashy effects or trendy aesthetics.

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Created By**: UI/UX Design Specialist
**Purpose**: Reference guide for implementing Euveka-inspired design language
