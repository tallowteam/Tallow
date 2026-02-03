# Tallow Design System

> A comprehensive, production-ready design system merging the best elements from Vercel, Linear, and Euveka — built for privacy-first, secure, and modern applications.

## Quick Start

```tsx
// 1. Import design system CSS
import '@/app/design-system.css';

// 2. Import design tokens
import { colors, typography, spacing } from '@/lib/design/tokens';

// 3. Use component helpers
import { getButtonClasses, getCardClasses } from '@/lib/design/components';

// 4. Build beautiful UIs
export function MyComponent() {
  return (
    <div className={getCardClasses('glass', 'lg')}>
      <h2 className="text-2xl font-bold mb-4">Welcome to Tallow</h2>
      <button className={getButtonClasses('primary', 'lg')}>
        Get Started
      </button>
    </div>
  );
}
```

## Overview

The Tallow Design System provides:

- **Design Tokens** - Colors, typography, spacing, shadows, and more
- **CSS Variables** - Complete CSS custom properties with dark/light mode
- **Component Specs** - Pre-built component variants with Tailwind utilities
- **Visual Guidelines** - Layout patterns, spacing rules, composition principles
- **Accessibility** - WCAG 2.1 AA compliant by default

## Features

### 🎨 Complete Color System
- Purple brand identity (Linear-inspired)
- Dark mode primary, light mode secondary
- Semantic color tokens
- Gradient system
- Glass morphism effects

### ✍️ Typography Scale
- Three font families (Sans, Mono, Display)
- 13-step size scale
- Optimized line heights
- Clear hierarchy

### 📐 Spacing System
- 4px base unit
- Consistent rhythm
- Responsive spacing
- Grid alignment

### 🎭 Component Library
- 7 button variants
- 6 card variants
- Form components
- Navigation patterns
- Modals & dialogs
- And more...

### 🌙 Dark Mode First
- Optimized for dark theme
- Automatic light mode adaptation
- Smooth theme transitions
- System preference support

### ♿ Accessible by Default
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- Color contrast validated

### 🎬 Smooth Animations
- Linear-inspired motion
- Custom easing functions
- 60fps performance
- Reduced motion support

## Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [**Design System Overview**](./DESIGN_SYSTEM_OVERVIEW.md) | Philosophy, principles, and architecture |
| [**Component Specifications**](./COMPONENT_SPECIFICATIONS.md) | Complete component variants and usage |
| [**Visual Guidelines**](./VISUAL_GUIDELINES.md) | Layout, composition, and best practices |
| [**Tailwind Config Guide**](./TAILWIND_CONFIG_GUIDE.md) | Tailwind integration and configuration |

### Source Files

| File | Purpose |
|------|---------|
| [`lib/design/tokens.ts`](../../lib/design/tokens.ts) | Design tokens (TypeScript) |
| [`lib/design/components.ts`](../../lib/design/components.ts) | Component specifications |
| [`app/design-system.css`](../../app/design-system.css) | CSS variables and utilities |

## Installation

### 1. Install Dependencies

```bash
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install geist @fontsource/playfair-display
```

### 2. Configure Tailwind

Update `tailwind.config.ts` (see [Tailwind Config Guide](./TAILWIND_CONFIG_GUIDE.md)):

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // See TAILWIND_CONFIG_GUIDE.md for complete config
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### 3. Import Fonts and CSS

```tsx
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@fontsource/playfair-display';
import './design-system.css';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 4. Start Building

```tsx
import { getButtonClasses } from '@/lib/design/components';

export function MyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Hello Tallow</h1>
        <button className={getButtonClasses('primary', 'lg')}>
          Get Started
        </button>
      </main>
    </div>
  );
}
```

## Usage Examples

### Buttons

```tsx
import { getButtonClasses } from '@/lib/design/components';

// Primary button
<button className={getButtonClasses('primary', 'base')}>
  Primary Action
</button>

// Secondary button
<button className={getButtonClasses('secondary', 'base')}>
  Secondary Action
</button>

// Ghost button
<button className={getButtonClasses('ghost', 'base')}>
  Subtle Action
</button>

// Danger button
<button className={getButtonClasses('danger', 'base')}>
  Delete
</button>

// With icon
<button className={getButtonClasses('primary', 'lg')}>
  <IconPlus className="w-5 h-5" />
  Add File
</button>
```

### Cards

```tsx
import { getCardClasses } from '@/lib/design/components';

// Default card
<div className={getCardClasses('default', 'base')}>
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Glass card
<div className={getCardClasses('glass', 'lg')}>
  <h3>Glass Effect</h3>
  <p>Frosted glass with backdrop blur</p>
</div>

// Interactive card
<div className={getCardClasses('interactive', 'base')}
     onClick={handleClick}>
  <h3>Clickable Card</h3>
  <p>Hover and click me</p>
</div>
```

### Inputs

```tsx
import { getInputClasses } from '@/lib/design/components';

// Text input
<input
  type="text"
  className={getInputClasses('default', 'base')}
  placeholder="Enter text..."
/>

// Input with label
<div className="space-y-2">
  <label className="block text-sm font-medium">
    Email
  </label>
  <input
    type="email"
    className={getInputClasses('default', 'base')}
  />
</div>

// Input with error
<input
  type="text"
  className={getInputClasses('error', 'base')}
  aria-invalid="true"
/>
<p className="text-sm text-red-400">Error message</p>
```

### Colors

```tsx
// Background colors
<div className="bg-background">           // Main background
<div className="bg-background-elevated">  // Elevated surface
<div className="bg-background-muted">     // Muted background

// Text colors
<p className="text-foreground">           // Primary text
<p className="text-foreground-muted">     // Secondary text
<p className="text-foreground-subtle">    // Tertiary text

// Brand colors
<div className="bg-brand-primary-500">    // Primary brand
<div className="bg-brand-secondary-500">  // Secondary brand

// Border colors
<div className="border border-border">    // Default border
<div className="border border-border-subtle"> // Subtle border
```

### Typography

```tsx
// Headings
<h1 className="text-6xl font-bold">Page Title</h1>
<h2 className="text-4xl font-bold">Section Title</h2>
<h3 className="text-2xl font-semibold">Subsection</h3>

// Body text
<p className="text-lg">Large body text</p>
<p className="text-base">Default body text</p>
<p className="text-sm text-neutral-400">Small secondary text</p>

// Font families
<p className="font-sans">Geist Sans (UI text)</p>
<code className="font-mono">Geist Mono (code)</code>
<h1 className="font-display">Playfair Display (headlines)</h1>
```

### Spacing

```tsx
// Vertical spacing
<div className="space-y-2">   // Tight (8px)
<div className="space-y-4">   // Default (16px)
<div className="space-y-8">   // Comfortable (32px)
<div className="space-y-16">  // Generous (64px)

// Padding
<div className="p-4">   // 16px all sides
<div className="px-6">  // 24px horizontal
<div className="py-8">  // 32px vertical

// Margins
<div className="mt-4">  // 16px top
<div className="mb-8">  // 32px bottom
```

### Glass Morphism

```tsx
// Glass utility class
<div className="glass p-6 rounded-2xl">
  <h3>Glass Effect</h3>
  <p>Automatic frosted glass with backdrop blur</p>
</div>

// Manual glass effect
<div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10
                p-6 rounded-2xl">
  <h3>Custom Glass</h3>
</div>
```

### Gradients

```tsx
// Gradient backgrounds
<div className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700">
  Purple gradient
</div>

// Gradient text
<h1 className="gradient-text text-6xl font-bold">
  Gradient Heading
</h1>

// Using CSS variables
<div style={{ background: 'var(--gradient-primary)' }}>
  Primary gradient
</div>
```

### Animations

```tsx
// Fade in
<div className="animate-fade-in">
  Fades in smoothly
</div>

// Slide in from bottom
<div className="animate-slide-in-up">
  Slides up from bottom
</div>

// Scale in
<div className="animate-scale-in">
  Scales in from center
</div>

// Hover effects
<button className="transition-transform hover:scale-105">
  Hover me
</button>
```

## Theme Switching

Implement dark/light mode switching:

```tsx
// hooks/use-theme.ts
import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
}

// Usage
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={getButtonClasses('ghost', 'base')}
    >
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  );
}
```

## Best Practices

### DO ✅

- Use design tokens consistently
- Follow the spacing scale
- Maintain WCAG AA contrast ratios
- Test on multiple devices
- Include focus states on all interactive elements
- Use semantic HTML
- Document custom components
- Test with screen readers

### DON'T ❌

- Use arbitrary values (avoid `mt-[13px]`)
- Mix different spacing systems
- Forget dark mode support
- Ignore accessibility requirements
- Over-animate interfaces
- Use purple for error states (use red)
- Nest glass effects
- Skip responsive testing

## Component Checklist

When creating new components:

- [ ] Supports all required variants
- [ ] Includes all size options
- [ ] Has proper focus states
- [ ] Works with keyboard navigation
- [ ] Includes ARIA labels where needed
- [ ] Maintains color contrast
- [ ] Works in both dark and light mode
- [ ] Responsive on all breakpoints
- [ ] Smooth animations (respects reduced motion)
- [ ] Documented with examples

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- CSS variables for runtime theme switching
- Minimal CSS bundle size
- Optimized animations (60fps)
- Web font optimization
- Lazy loading for non-critical styles

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader tested
- Focus indicators on all interactive elements
- Proper heading hierarchy
- Color contrast validated
- Reduced motion support

## Contributing

To extend or modify the design system:

1. Review existing patterns
2. Follow naming conventions
3. Document new components
4. Add usage examples
5. Update relevant documentation
6. Test accessibility
7. Verify dark/light mode support

## Support

For questions or issues:

1. Check documentation in `/docs/design/`
2. Review component examples
3. Consult design tokens
4. Review Tailwind configuration

## Version History

### v1.0.0 (2026-02-03)
- Initial design system release
- Complete design token system
- Component specifications
- Tailwind integration
- Comprehensive documentation
- Dark/light mode support
- Accessibility compliance

## File Structure

```
tallow/
├── lib/design/
│   ├── tokens.ts              # Design tokens (TypeScript)
│   └── components.ts          # Component specifications
├── app/
│   ├── design-system.css      # CSS variables and utilities
│   ├── globals.css            # Global styles
│   └── layout.tsx             # Root layout with fonts
├── docs/design/
│   ├── README.md              # This file
│   ├── DESIGN_SYSTEM_OVERVIEW.md
│   ├── COMPONENT_SPECIFICATIONS.md
│   ├── VISUAL_GUIDELINES.md
│   └── TAILWIND_CONFIG_GUIDE.md
└── tailwind.config.ts         # Tailwind configuration
```

## Resources

- [Design System Overview](./DESIGN_SYSTEM_OVERVIEW.md)
- [Component Specifications](./COMPONENT_SPECIFICATIONS.md)
- [Visual Guidelines](./VISUAL_GUIDELINES.md)
- [Tailwind Config Guide](./TAILWIND_CONFIG_GUIDE.md)
- [Tailwind CSS](https://tailwindcss.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Built with care for privacy, security, and exceptional user experience.**

*Design System crafted for Tallow — Privacy-first P2P file sharing with post-quantum cryptography.*
