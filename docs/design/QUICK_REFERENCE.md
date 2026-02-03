# Design System Quick Reference

Fast reference for common design system patterns and utilities.

## Import Statements

```tsx
// Design tokens
import { colors, typography, spacing } from '@/lib/design/tokens';

// Component helpers
import { getButtonClasses, getCardClasses, getInputClasses } from '@/lib/design/components';

// CSS (in layout.tsx)
import './design-system.css';
```

## Color Classes

```tsx
// Backgrounds
bg-background          // Main background
bg-background-elevated // Elevated surface
bg-background-muted    // Muted background

// Text
text-foreground        // Primary text
text-foreground-muted  // Secondary text
text-foreground-subtle // Tertiary text

// Borders
border-border          // Default border
border-border-subtle   // Subtle border

// Brand
bg-brand-primary-500   // Purple primary
bg-brand-secondary-500 // Purple secondary

// Semantic
bg-green-500           // Success
bg-red-500             // Error
bg-yellow-500          // Warning
bg-blue-500            // Info
```

## Typography

```tsx
// Sizes
text-xs    // 12px
text-sm    // 14px
text-base  // 16px (default)
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px
text-4xl   // 36px
text-6xl   // 60px

// Weights
font-normal    // 400
font-medium    // 500
font-semibold  // 600
font-bold      // 700

// Families
font-sans      // Geist Sans (UI)
font-mono      // Geist Mono (code)
font-display   // Playfair Display (headings)
```

## Spacing

```tsx
// Padding
p-2   // 8px
p-4   // 16px
p-6   // 24px
p-8   // 32px

// Margin
m-2   // 8px
m-4   // 16px
m-6   // 24px
m-8   // 32px

// Gap
gap-2  // 8px
gap-4  // 16px
gap-6  // 24px
gap-8  // 32px

// Space between
space-y-2  // 8px vertical
space-y-4  // 16px vertical
space-y-8  // 32px vertical
space-x-4  // 16px horizontal
```

## Border Radius

```tsx
rounded-none  // 0
rounded-sm    // 2px
rounded       // 4px
rounded-md    // 6px
rounded-lg    // 8px
rounded-xl    // 12px
rounded-2xl   // 16px
rounded-full  // 9999px
```

## Shadows

```tsx
shadow-sm         // Light shadow
shadow-md         // Medium shadow
shadow-lg         // Large shadow
shadow-xl         // Extra large
shadow-brand-md   // Purple glow
shadow-glow-md    // Glow effect
```

## Buttons

```tsx
import { getButtonClasses } from '@/lib/design/components';

// Variants
getButtonClasses('primary', 'base')    // Purple gradient
getButtonClasses('secondary', 'base')  // Dark bg
getButtonClasses('ghost', 'base')      // Transparent
getButtonClasses('danger', 'base')     // Red gradient
getButtonClasses('outline', 'base')    // Purple border
getButtonClasses('glass', 'base')      // Glass effect
getButtonClasses('gradient', 'base')   // Animated gradient

// Sizes
'xs'   // h-7 px-2.5 text-xs
'sm'   // h-8 px-3 text-sm
'base' // h-10 px-4 text-base
'lg'   // h-12 px-6 text-lg
'xl'   // h-14 px-8 text-xl
```

## Cards

```tsx
import { getCardClasses } from '@/lib/design/components';

// Variants
getCardClasses('default', 'base')     // Standard card
getCardClasses('elevated', 'lg')      // Higher shadow
getCardClasses('glass', 'base')       // Glass effect
getCardClasses('gradient', 'lg')      // Purple gradient
getCardClasses('interactive', 'base') // Hover effects
getCardClasses('outlined', 'base')    // Just border

// Padding
'none' // p-0
'sm'   // p-4
'base' // p-6
'lg'   // p-8
'xl'   // p-10
```

## Inputs

```tsx
import { getInputClasses } from '@/lib/design/components';

// Variants
getInputClasses('default', 'base')  // Standard input
getInputClasses('filled', 'base')   // Filled bg
getInputClasses('glass', 'base')    // Glass effect
getInputClasses('error', 'base')    // Error state
getInputClasses('success', 'base')  // Success state

// Sizes
'sm'   // h-8 px-3 text-sm
'base' // h-10 px-4 text-base
'lg'   // h-12 px-5 text-lg
```

## Layout Patterns

### Container

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Flex Row

```tsx
<div className="flex items-center justify-between gap-4">
  {/* Content */}
</div>
```

### Flex Column

```tsx
<div className="flex flex-col gap-4">
  {/* Content */}
</div>
```

### Centered Content

```tsx
<div className="flex items-center justify-center min-h-screen">
  {/* Content */}
</div>
```

## Glass Morphism

```tsx
// Utility class
<div className="glass p-6 rounded-2xl">

// Manual
<div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10">
```

## Gradients

```tsx
// Background gradients
bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700

// Text gradient
<h1 className="gradient-text text-6xl font-bold">
  Gradient Text
</h1>

// CSS variable
style={{ background: 'var(--gradient-primary)' }}
```

## Animations

```tsx
// Transitions
transition-all duration-200          // Default
transition-colors duration-200       // Colors only
transition-transform duration-200    // Transform only

// Hover effects
hover:scale-105                      // Scale up
hover:-translate-y-1                 // Move up
hover:shadow-glow-md                 // Glow

// Enter animations
animate-fade-in                      // Fade in
animate-slide-in-up                  // Slide from bottom
animate-scale-in                     // Scale from center

// Loading
animate-spin                         // Spinner
animate-pulse                        // Pulse
```

## Responsive Design

```tsx
// Breakpoints
sm:   // 640px+
md:   // 768px+
lg:   // 1024px+
xl:   // 1280px+
2xl:  // 1536px+

// Example
<div className="text-sm md:text-base lg:text-lg
                p-4 md:p-6 lg:p-8
                grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

## Focus States

```tsx
// Ring focus
focus:outline-none focus:ring-2 focus:ring-purple-500
focus:ring-offset-2 focus:ring-offset-neutral-950

// Outline focus
focus:outline-2 focus:outline-purple-500 focus:outline-offset-2
```

## Common Patterns

### Button with Icon

```tsx
<button className={getButtonClasses('primary', 'base')}>
  <IconPlus className="w-5 h-5" />
  Add File
</button>
```

### Input with Label

```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium">Label</label>
  <input className={getInputClasses('default', 'base')} />
</div>
```

### Card with Header

```tsx
<div className={getCardClasses('default', 'none')}>
  <div className="px-6 py-4 border-b border-neutral-800">
    <h3 className="text-lg font-semibold">Title</h3>
  </div>
  <div className="px-6 py-4">
    Content
  </div>
</div>
```

### Modal Overlay

```tsx
<div className="fixed inset-0 z-overlay bg-black/80 backdrop-blur-sm
                flex items-center justify-center p-4">
  <div className="w-full max-w-md bg-neutral-900 border border-neutral-800
                  rounded-2xl shadow-2xl">
    {/* Modal content */}
  </div>
</div>
```

### Hero Section

```tsx
<section className="relative min-h-screen flex items-center justify-center">
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-br
                  from-purple-500/10 via-transparent to-fuchsia-500/10" />

  {/* Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
    <h1 className="text-6xl lg:text-8xl font-bold mb-6">
      Hero Title
    </h1>
    <p className="text-xl text-neutral-400 mb-8">
      Subtitle
    </p>
    <button className={getButtonClasses('primary', 'lg')}>
      CTA Button
    </button>
  </div>
</section>
```

## Accessibility

```tsx
// Screen reader only
<span className="sr-only">Screen reader text</span>

// ARIA labels
<button aria-label="Close">
  <IconX />
</button>

// ARIA described by
<input aria-describedby="help-text" />
<p id="help-text">Helper text</p>

// Focus visible
<button className="focus-visible:ring-2 focus-visible:ring-purple-500">
```

## Theme Switching

```tsx
// Set theme
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-theme', 'light');

// Get current theme
const theme = document.documentElement.getAttribute('data-theme');
```

## Z-Index Scale

```tsx
z-0      // 0 (base)
z-10     // 10
z-20     // 20
z-sticky // 1100
z-fixed  // 1200
z-modal  // 1400
z-toast  // 1600
z-max    // 9999
```

## Common CSS Variables

```css
/* Colors */
var(--color-background)
var(--color-foreground)
var(--color-border)
var(--color-primary)

/* Spacing */
var(--spacing-4)
var(--spacing-6)
var(--spacing-8)

/* Radius */
var(--radius-lg)
var(--radius-xl)

/* Shadows */
var(--shadow-md)
var(--shadow-brand-md)

/* Transitions */
var(--transition-base)
var(--ease-smooth)

/* Gradients */
var(--gradient-primary)
var(--gradient-accent)
```

## Utility Classes

```tsx
// Glass morphism
glass
glass-subtle
glass-strong

// Gradient text
gradient-text

// Glow
glow
glow-sm
glow-lg

// Transitions
transition-smooth
transition-colors
transition-transform

// Focus ring
focus-ring
focus-ring-inset

// Disabled
disabled
```

## Quick Component Template

```tsx
import { getButtonClasses, getCardClasses } from '@/lib/design/components';

export function MyComponent() {
  return (
    <div className={getCardClasses('default', 'lg')}>
      <h2 className="text-2xl font-bold mb-4">Component Title</h2>
      <p className="text-neutral-400 mb-6">
        Component description
      </p>
      <div className="flex gap-3">
        <button className={getButtonClasses('ghost', 'base')}>
          Cancel
        </button>
        <button className={getButtonClasses('primary', 'base')}>
          Confirm
        </button>
      </div>
    </div>
  );
}
```

---

**For complete documentation, see:**
- [Design System Overview](./DESIGN_SYSTEM_OVERVIEW.md)
- [Component Specifications](./COMPONENT_SPECIFICATIONS.md)
- [Visual Guidelines](./VISUAL_GUIDELINES.md)
- [Tailwind Config Guide](./TAILWIND_CONFIG_GUIDE.md)
