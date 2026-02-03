# Visual Guidelines

Comprehensive visual guidelines for the Tallow Design System, including layout patterns, spacing rules, visual hierarchy, and composition principles.

## Table of Contents

- [Layout System](#layout-system)
- [Spacing & Rhythm](#spacing--rhythm)
- [Visual Hierarchy](#visual-hierarchy)
- [Composition Principles](#composition-principles)
- [Grid System](#grid-system)
- [Iconography](#iconography)
- [Imagery](#imagery)
- [Motion Design](#motion-design)
- [Accessibility](#accessibility)

---

## Layout System

### Container Widths

Use consistent container widths for content areas:

```tsx
// Small containers (forms, modals)
<div className="max-w-sm mx-auto"> // 384px

// Medium containers (cards, content blocks)
<div className="max-w-2xl mx-auto"> // 672px

// Large containers (main content)
<div className="max-w-4xl mx-auto"> // 896px

// Extra large containers (landing pages)
<div className="max-w-7xl mx-auto"> // 1280px

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">
```

### Page Layouts

#### Single Column (Mobile-First)

```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-sticky bg-background-elevated
                     border-b border-border">
    {/* Header content */}
  </header>

  <main className="max-w-4xl mx-auto px-4 py-8">
    {/* Main content */}
  </main>

  <footer className="border-t border-border">
    {/* Footer content */}
  </footer>
</div>
```

#### Two Column (Sidebar + Content)

```tsx
<div className="flex min-h-screen bg-background">
  {/* Sidebar */}
  <aside className="hidden lg:block w-64 border-r border-border">
    {/* Sidebar content */}
  </aside>

  {/* Main content */}
  <main className="flex-1 overflow-y-auto">
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Content */}
    </div>
  </main>
</div>
```

#### Three Column (Navigation + Content + Sidebar)

```tsx
<div className="flex min-h-screen bg-background">
  {/* Left Navigation */}
  <aside className="hidden lg:block w-64 border-r border-border">
    {/* Navigation */}
  </aside>

  {/* Main Content */}
  <main className="flex-1 overflow-y-auto">
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Content */}
    </div>
  </main>

  {/* Right Sidebar */}
  <aside className="hidden xl:block w-80 border-l border-border">
    {/* Sidebar */}
  </aside>
</div>
```

---

## Spacing & Rhythm

### Vertical Rhythm

Maintain consistent vertical spacing using the spacing scale:

```tsx
// Tight spacing (related elements)
<div className="space-y-2"> // 8px between children

// Default spacing (content sections)
<div className="space-y-4"> // 16px between children

// Comfortable spacing (major sections)
<div className="space-y-8"> // 32px between children

// Generous spacing (page sections)
<div className="space-y-16"> // 64px between children
```

### Component Spacing

#### Form Fields

```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <label>Field Label</label>
    <input />
    <p className="text-sm">Helper text</p>
  </div>

  <div className="space-y-2">
    <label>Another Field</label>
    <input />
  </div>

  <div className="flex gap-3">
    <button>Cancel</button>
    <button>Submit</button>
  </div>
</form>
```

#### Card Content

```tsx
<div className="p-6 space-y-4">
  <h3 className="text-xl font-semibold">Title</h3>
  <p className="text-neutral-400">Description</p>
  <div className="flex gap-2">
    {/* Actions */}
  </div>
</div>
```

#### Lists

```tsx
<ul className="space-y-3">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Horizontal Spacing

```tsx
// Tight (inline elements)
<div className="flex gap-2"> // 8px

// Default (buttons, tags)
<div className="flex gap-3"> // 12px

// Comfortable (sections)
<div className="flex gap-6"> // 24px

// Wide (major sections)
<div className="flex gap-12"> // 48px
```

---

## Visual Hierarchy

### Heading Hierarchy

```tsx
// Page title (Hero)
<h1 className="text-6xl lg:text-8xl font-bold tracking-tight mb-6">

// Section title
<h2 className="text-4xl lg:text-5xl font-bold mb-8">

// Subsection title
<h3 className="text-2xl lg:text-3xl font-semibold mb-4">

// Component title
<h4 className="text-xl font-semibold mb-3">

// Small heading
<h5 className="text-lg font-medium mb-2">

// Tiny heading
<h6 className="text-base font-medium mb-2">
```

### Text Hierarchy

```tsx
// Large body (introduction, emphasis)
<p className="text-lg text-neutral-300 leading-relaxed">

// Default body
<p className="text-base text-neutral-300">

// Small text (captions, meta)
<p className="text-sm text-neutral-400">

// Fine print (legal, footnotes)
<p className="text-xs text-neutral-500">
```

### Weight Hierarchy

```tsx
// Primary emphasis
<span className="font-bold text-foreground">

// Secondary emphasis
<span className="font-semibold text-foreground">

// Moderate emphasis
<span className="font-medium text-foreground-muted">

// Default
<span className="font-normal text-foreground-muted">

// De-emphasized
<span className="font-light text-foreground-subtle">
```

---

## Composition Principles

### F-Pattern Layout

Place important content in an F-shape for natural eye movement:

```
┌─────────────────────────┐
│ ████████████            │  ← Primary headline (full width)
│                         │
│ ██████ ██████ ██████    │  ← Secondary content (left-aligned)
│ ████                    │
│                         │
│ ████████                │  ← Supporting content
│ ██████                  │
│                         │
└─────────────────────────┘
```

### Z-Pattern Layout

For landing pages and focused conversions:

```
┌─────────────────────────┐
│ Logo           CTA      │  ← Header (Z top)
│   ↘                     │
│      Value Prop         │  ← Hero (Z middle)
│                    ↙    │
│ Features       CTA      │  ← Content (Z bottom)
└─────────────────────────┘
```

### Card Grid Layouts

```tsx
// 2-column grid (mobile)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

// 3-column grid (tablet+)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 4-column grid (desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Auto-fit (responsive)
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
```

### Feature Sections

```tsx
<section className="py-24">
  <div className="max-w-7xl mx-auto px-4">
    {/* Section Header */}
    <div className="text-center max-w-3xl mx-auto mb-16">
      <h2 className="text-4xl font-bold mb-4">Section Title</h2>
      <p className="text-xl text-neutral-400">
        Section description
      </p>
    </div>

    {/* Feature Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Feature cards */}
    </div>
  </div>
</section>
```

---

## Grid System

### 12-Column Grid

```tsx
// Full width
<div className="col-span-12">

// Half width
<div className="col-span-6">

// Third width
<div className="col-span-4">

// Quarter width
<div className="col-span-3">

// Responsive
<div className="col-span-12 md:col-span-6 lg:col-span-4">
```

### Asymmetric Layouts

```tsx
// 2:1 ratio
<div className="grid grid-cols-3 gap-6">
  <div className="col-span-2">{/* Main */}</div>
  <div className="col-span-1">{/* Sidebar */}</div>
</div>

// 3:2 ratio
<div className="grid grid-cols-5 gap-6">
  <div className="col-span-3">{/* Main */}</div>
  <div className="col-span-2">{/* Sidebar */}</div>
</div>
```

---

## Iconography

### Icon Sizing

```tsx
// Extra small (inline text)
<Icon className="w-3 h-3" /> // 12px

// Small (buttons, badges)
<Icon className="w-4 h-4" /> // 16px

// Base (default)
<Icon className="w-5 h-5" /> // 20px

// Large (headings, features)
<Icon className="w-6 h-6" /> // 24px

// Extra large (hero sections)
<Icon className="w-8 h-8" /> // 32px

// Huge (decorative)
<Icon className="w-12 h-12" /> // 48px
```

### Icon Colors

```tsx
// Default (matches text)
<Icon className="text-current" />

// Muted
<Icon className="text-neutral-400" />

// Brand
<Icon className="text-purple-500" />

// Status colors
<Icon className="text-green-400" /> // Success
<Icon className="text-red-400" />   // Error
<Icon className="text-yellow-400" /> // Warning
```

### Icon Placement

```tsx
// Leading icon
<button className="flex items-center gap-2">
  <IconPlus className="w-5 h-5" />
  Add Item
</button>

// Trailing icon
<button className="flex items-center gap-2">
  Continue
  <IconArrowRight className="w-5 h-5" />
</button>

// Icon only (with aria-label)
<button aria-label="Close">
  <IconX className="w-5 h-5" />
</button>
```

---

## Imagery

### Image Aspect Ratios

```tsx
// Square (avatars, logos)
<div className="aspect-square">

// Landscape 16:9 (videos, headers)
<div className="aspect-video">

// Portrait 3:4 (profiles)
<div className="aspect-[3/4]">

// Wide 21:9 (banners)
<div className="aspect-[21/9]">
```

### Image Treatments

```tsx
// Default (sharp corners)
<img className="rounded-lg" />

// Circular (avatars)
<img className="rounded-full" />

// With border
<img className="rounded-lg border border-neutral-800" />

// With shadow
<img className="rounded-lg shadow-lg" />

// Grayscale (decorative)
<img className="grayscale hover:grayscale-0 transition-all" />
```

### Placeholder Images

```tsx
<div className="aspect-video bg-neutral-800 rounded-lg
                flex items-center justify-center">
  <IconImage className="w-12 h-12 text-neutral-600" />
</div>
```

---

## Motion Design

### Transition Timing

```tsx
// Instant (micro-interactions)
<div className="transition-all duration-[75ms]">

// Fast (tooltips, dropdowns)
<div className="transition-all duration-150">

// Base (default)
<div className="transition-all duration-200">

// Smooth (page transitions)
<div className="transition-all duration-300">

// Slow (complex animations)
<div className="transition-all duration-500">
```

### Easing Functions

```tsx
// Linear (constant speed)
<div className="ease-linear">

// Ease-in (slow start)
<div className="ease-in">

// Ease-out (slow end)
<div className="ease-out">

// Ease-in-out (slow start and end)
<div className="ease-in-out">

// Custom smooth (Linear-inspired)
<div className="transition-all duration-300"
     style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
```

### Animation Patterns

#### Hover States

```tsx
// Scale up
<button className="transition-transform hover:scale-105">

// Move up
<button className="transition-transform hover:-translate-y-1">

// Glow
<button className="transition-shadow hover:shadow-glow-md">

// Rotate
<button className="transition-transform hover:rotate-3">
```

#### Loading States

```tsx
// Spinner
<div className="animate-spin">
  <IconLoader />
</div>

// Pulse
<div className="animate-pulse">
  Loading...
</div>

// Skeleton
<div className="bg-neutral-800 animate-pulse rounded" />
```

#### Enter/Exit Animations

```tsx
// Fade in
<div className="animate-fade-in">

// Slide in from bottom
<div className="animate-slide-in-up">

// Scale in
<div className="animate-scale-in">
```

---

## Accessibility

### Focus States

Always provide visible focus indicators:

```tsx
// Ring focus (default)
<button className="focus:outline-none focus:ring-2 focus:ring-purple-500
                   focus:ring-offset-2 focus:ring-offset-neutral-950">

// Outline focus
<button className="focus:outline-2 focus:outline-purple-500
                   focus:outline-offset-2">

// Custom focus
<button className="focus:border-purple-500 focus:shadow-brand-md">
```

### Keyboard Navigation

Ensure logical tab order:

```tsx
// Explicit tab order (when needed)
<input tabIndex={1} />
<input tabIndex={2} />
<input tabIndex={3} />

// Skip navigation
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Screen Reader Support

```tsx
// Accessible labels
<button aria-label="Close dialog">
  <IconX />
</button>

// Descriptions
<div aria-describedby="help-text">
  <input />
</div>
<p id="help-text">Helper text</p>

// Live regions
<div role="status" aria-live="polite">
  Loading...
</div>

// Hidden from screen readers
<div aria-hidden="true">
  Decorative element
</div>
```

### Color Contrast

Maintain WCAG 2.1 AA standards:

- **Normal text**: 4.5:1 minimum
- **Large text** (18px+ or 14px+ bold): 3:1 minimum
- **Interactive elements**: 3:1 minimum

```tsx
// Good contrast
<p className="text-neutral-50 bg-neutral-950"> // High contrast

// Acceptable contrast
<p className="text-neutral-300 bg-neutral-900"> // Medium contrast

// Poor contrast (avoid)
<p className="text-neutral-600 bg-neutral-700"> // Low contrast
```

### Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// Conditional animations
<div className="motion-safe:animate-fade-in">
  Respects reduced motion preference
</div>
```

---

## Best Practices Summary

### Layout
- Use consistent container widths
- Follow mobile-first responsive design
- Maintain proper spacing hierarchy
- Use grid systems for alignment

### Typography
- Clear heading hierarchy (h1 → h6)
- Appropriate line heights for readability
- Consistent font weights for emphasis
- Proper text colors for hierarchy

### Color
- Use semantic color names
- Maintain contrast ratios
- Limit color palette per screen
- Purple for brand, not errors

### Spacing
- Follow the spacing scale
- Consistent vertical rhythm
- Appropriate horizontal gaps
- Generous whitespace

### Motion
- Purposeful animations only
- Smooth 60fps performance
- Respect reduced motion
- Consistent timing

### Accessibility
- Visible focus states
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

---

**These guidelines ensure consistency, accessibility, and visual excellence across all Tallow interfaces.**
