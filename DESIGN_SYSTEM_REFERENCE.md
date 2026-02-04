# Tallow Design System Reference

Complete reference for the Tallow global styles and design tokens.

## Quick Start

The design system is defined in `C:\Users\aamir\Documents\Apps\Tallow\app\globals.css` and provides CSS custom properties (variables) and utility classes for consistent styling across the entire application.

## Color Palette

### Dark Theme (Primary)

```css
/* Background Colors */
--color-background-primary: #0a0a0a;
--color-background-secondary: #111111;
--color-background-tertiary: #171717;
--color-background-elevated: #1a1a1a;

/* Foreground Colors */
--color-foreground-primary: #ffffff;
--color-foreground-secondary: #a1a1a1;
--color-foreground-tertiary: #666666;
--color-foreground-muted: #404040;

/* Accent Colors (Purple-Blue Gradient) */
--color-accent-primary: #7c3aed;
--color-accent-secondary: #6366f1;
--color-accent-tertiary: #3b82f6;
```

### Semantic Colors

```css
--color-success: #10b981;  /* Green */
--color-warning: #f59e0b;  /* Yellow/Orange */
--color-error: #ef4444;    /* Red */
--color-info: #3b82f6;     /* Blue */
```

### Gradients

```css
--gradient-accent: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%);
--gradient-accent-reverse: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%);
--gradient-subtle: linear-gradient(180deg, #0a0a0a 0%, #111111 100%);
--gradient-glow: radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
```

## Typography

### Font Families

```css
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, ...;
--font-family-mono: 'Geist Mono', ui-monospace, ...;
--font-family-display: 'Geist', var(--font-family-sans);
```

### Font Size Scale

| Token | Size | Pixels |
|-------|------|--------|
| `--font-size-xs` | 0.75rem | 12px |
| `--font-size-sm` | 0.875rem | 14px |
| `--font-size-base` | 1rem | 16px |
| `--font-size-lg` | 1.125rem | 18px |
| `--font-size-xl` | 1.25rem | 20px |
| `--font-size-2xl` | 1.5rem | 24px |
| `--font-size-3xl` | 1.875rem | 30px |
| `--font-size-4xl` | 2.25rem | 36px |
| `--font-size-5xl` | 3rem | 48px |
| `--font-size-6xl` | 3.75rem | 60px |
| `--font-size-7xl` | 4.5rem | 72px |

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1.2;
--line-height-snug: 1.4;
--line-height-normal: 1.5;
--line-height-relaxed: 1.6;
```

### Typography Classes

```html
<h1 class="h1">Main heading</h1>
<h2 class="h2">Section heading</h2>
<p class="lead">Lead paragraph</p>
<p class="body">Normal paragraph</p>
<small class="small">Small text</small>
<span class="caption">Caption text</span>
```

## Spacing Scale

| Token | Size | Pixels |
|-------|------|--------|
| `--spacing-1` | 0.25rem | 4px |
| `--spacing-2` | 0.5rem | 8px |
| `--spacing-3` | 0.75rem | 12px |
| `--spacing-4` | 1rem | 16px |
| `--spacing-5` | 1.25rem | 20px |
| `--spacing-6` | 1.5rem | 24px |
| `--spacing-8` | 2rem | 32px |
| `--spacing-10` | 2.5rem | 40px |
| `--spacing-12` | 3rem | 48px |
| `--spacing-16` | 4rem | 64px |
| `--spacing-20` | 5rem | 80px |
| `--spacing-24` | 6rem | 96px |
| `--spacing-32` | 8rem | 128px |

## Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Fully rounded */
```

### Utility Classes

```html
<div class="rounded-sm">Small radius</div>
<div class="rounded">Base radius</div>
<div class="rounded-lg">Large radius</div>
<div class="rounded-full">Fully rounded</div>
```

## Shadows & Glows

### Shadow Scale

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.6), ...;
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.6), ...;
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.7), ...;
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.7), ...;
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
```

### Glow Effects

```css
--glow-sm: 0 0 10px rgba(124, 58, 237, 0.3);
--glow-base: 0 0 20px rgba(124, 58, 237, 0.4);
--glow-md: 0 0 30px rgba(124, 58, 237, 0.5);
--glow-lg: 0 0 40px rgba(124, 58, 237, 0.6);
```

### Utility Classes

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-lg">Large shadow</div>
<button class="glow">Glowing button</button>
```

## Transitions & Animations

### Transition Durations

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Easing Functions

```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Animation Classes

```html
<div class="animate-fadeIn">Fade in</div>
<div class="animate-slideInUp">Slide up</div>
<div class="animate-scaleIn">Scale in</div>
<div class="animate-spin">Spinning loader</div>
<div class="animate-pulse">Pulsing element</div>
<div class="animate-glow">Glowing animation</div>
```

## Utility Classes

### Layout

```html
<div class="flex items-center justify-between gap-4">
  <span>Flex layout</span>
</div>

<div class="grid">Grid layout</div>

<div class="container">Responsive container</div>
```

### Display

```html
<div class="hidden">Hidden</div>
<div class="block">Block</div>
<div class="flex">Flex</div>
<div class="grid">Grid</div>
<div class="sr-only">Screen reader only</div>
```

### Text

```html
<p class="text-center">Centered text</p>
<p class="text-primary">Primary color</p>
<p class="text-accent">Accent color</p>
<p class="font-bold">Bold text</p>
<p class="uppercase">Uppercase</p>
```

### Background

```html
<div class="bg-primary">Primary background</div>
<div class="bg-secondary">Secondary background</div>
<div class="bg-accent">Gradient background</div>
```

### Special Effects

```html
<h1 class="gradient-text">Gradient text</h1>
<div class="backdrop-blur">Blurred backdrop</div>
<div class="glow-lg">Large glow effect</div>
```

## Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Container Max Widths

The `.container` class automatically adjusts its max-width at each breakpoint:

- Mobile: 100% width with padding
- sm (640px+): 640px max-width
- md (768px+): 768px max-width
- lg (1024px+): 1024px max-width
- xl (1280px+): 1280px max-width
- 2xl (1536px+): 1536px max-width

## Z-Index Scale

```css
--z-base: 1;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

## Usage Examples

### Creating a Card Component

```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-secondary rounded-lg shadow-md border border-primary p-6">
      {children}
    </div>
  );
}
```

### Creating a Button with Custom Styles

```tsx
export function PrimaryButton({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-accent text-primary font-semibold rounded-md px-6 py-3 shadow-md glow hover:shadow-lg transition-all"
      style={{ transition: 'var(--transition-base)' }}
    >
      {children}
    </button>
  );
}
```

### Using CSS Variables in Inline Styles

```tsx
export function CustomComponent() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-background-elevated)',
        padding: 'var(--spacing-6)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      Content
    </div>
  );
}
```

### Creating a Hero Section

```tsx
export function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center gap-6 py-24">
      <h1 className="h1 gradient-text text-center animate-fadeIn">
        Secure File Transfer
      </h1>
      <p className="lead text-center text-secondary max-w-2xl animate-slideInUp">
        End-to-end encrypted file sharing with zero knowledge architecture
      </p>
      <button className="bg-accent text-primary font-semibold rounded-lg px-8 py-4 shadow-lg glow-lg animate-scaleIn">
        Get Started
      </button>
    </section>
  );
}
```

## Accessibility Features

### Focus Styles

All interactive elements have accessible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

### Reduced Motion

Respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast

Supports high contrast mode for better visibility.

### Screen Reader Support

Use `.sr-only` class for screen reader-only content:

```html
<button>
  <span class="sr-only">Close dialog</span>
  <svg>...</svg>
</button>
```

## Light Mode Support

The design system includes light mode support via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: light) {
  :root {
    --color-background-primary: #ffffff;
    --color-foreground-primary: #0a0a0a;
    /* ... other overrides */
  }
}
```

## Custom Scrollbar

All scrollable elements have styled scrollbars matching the dark theme:

- Firefox: `scrollbar-width: thin`
- Chrome/Edge/Safari: Custom webkit scrollbar styles

## Print Styles

Optimized print styles included for better document printing:

- Removes backgrounds and shadows
- Adds link URLs after anchor text
- Prevents page breaks in images and tables
- Hides non-essential UI elements

## Files Reference

- **Main CSS**: `C:\Users\aamir\Documents\Apps\Tallow\app\globals.css`
- **Font Files**: `C:\Users\aamir\Documents\Apps\Tallow\public\fonts\`
  - Inter: `inter-latin-wght-normal.woff2`
  - Geist Mono: `GeistMonoVF.woff2`

## Best Practices

1. **Use CSS variables** for all colors, spacing, and sizes
2. **Prefer utility classes** for common patterns
3. **Maintain consistency** by using the design tokens
4. **Test accessibility** with screen readers and keyboard navigation
5. **Respect user preferences** (dark/light mode, reduced motion)
6. **Use semantic HTML** elements where possible
7. **Leverage animations** sparingly for important state changes
8. **Apply focus styles** to all interactive elements

## Next Steps

1. Create component library using these design tokens
2. Build reusable UI components (Button, Card, Input, etc.)
3. Implement responsive layouts using the container and breakpoints
4. Add dark/light mode toggle functionality
5. Create Storybook documentation for components
