# Tailwind Configuration Guide

This guide explains how to extend your `tailwind.config.ts` file to integrate the Tallow Design System tokens.

## Installation

1. **Install Required Dependencies**

```bash
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install -D @fontsource/playfair-display
```

2. **Import Fonts in Your Layout**

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

## Complete Tailwind Configuration

Create or update `tailwind.config.ts` with the following configuration:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // ============================
      // COLORS
      // ============================
      colors: {
        // Brand Colors
        brand: {
          primary: {
            50: 'rgb(var(--color-brand-primary-50) / <alpha-value>)',
            100: 'rgb(var(--color-brand-primary-100) / <alpha-value>)',
            200: 'rgb(var(--color-brand-primary-200) / <alpha-value>)',
            300: 'rgb(var(--color-brand-primary-300) / <alpha-value>)',
            400: 'rgb(var(--color-brand-primary-400) / <alpha-value>)',
            500: 'rgb(var(--color-brand-primary-500) / <alpha-value>)',
            600: 'rgb(var(--color-brand-primary-600) / <alpha-value>)',
            700: 'rgb(var(--color-brand-primary-700) / <alpha-value>)',
            800: 'rgb(var(--color-brand-primary-800) / <alpha-value>)',
            900: 'rgb(var(--color-brand-primary-900) / <alpha-value>)',
            950: 'rgb(var(--color-brand-primary-950) / <alpha-value>)',
          },
          secondary: {
            50: 'rgb(var(--color-brand-secondary-50) / <alpha-value>)',
            100: 'rgb(var(--color-brand-secondary-100) / <alpha-value>)',
            200: 'rgb(var(--color-brand-secondary-200) / <alpha-value>)',
            300: 'rgb(var(--color-brand-secondary-300) / <alpha-value>)',
            400: 'rgb(var(--color-brand-secondary-400) / <alpha-value>)',
            500: 'rgb(var(--color-brand-secondary-500) / <alpha-value>)',
            600: 'rgb(var(--color-brand-secondary-600) / <alpha-value>)',
            700: 'rgb(var(--color-brand-secondary-700) / <alpha-value>)',
            800: 'rgb(var(--color-brand-secondary-800) / <alpha-value>)',
            900: 'rgb(var(--color-brand-secondary-900) / <alpha-value>)',
            950: 'rgb(var(--color-brand-secondary-950) / <alpha-value>)',
          },
        },

        // Neutral Colors
        neutral: {
          50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
          400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
          500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
          600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
          700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
          800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
          850: 'rgb(var(--color-neutral-850) / <alpha-value>)',
          900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
          925: 'rgb(var(--color-neutral-925) / <alpha-value>)',
          950: 'rgb(var(--color-neutral-950) / <alpha-value>)',
          975: 'rgb(var(--color-neutral-975) / <alpha-value>)',
        },

        // Semantic Theme Colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        'background-subtle': 'rgb(var(--color-background-subtle) / <alpha-value>)',
        'background-muted': 'rgb(var(--color-background-muted) / <alpha-value>)',
        'background-elevated': 'rgb(var(--color-background-elevated) / <alpha-value>)',
        'background-hover': 'rgb(var(--color-background-hover) / <alpha-value>)',

        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--color-foreground-muted) / <alpha-value>)',
        'foreground-subtle': 'rgb(var(--color-foreground-subtle) / <alpha-value>)',

        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        'border-muted': 'rgb(var(--color-border-muted) / <alpha-value>)',

        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'primary-active': 'rgb(var(--color-primary-active) / <alpha-value>)',

        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-hover': 'rgb(var(--color-secondary-hover) / <alpha-value>)',
        'secondary-active': 'rgb(var(--color-secondary-active) / <alpha-value>)',
      },

      // ============================
      // TYPOGRAPHY
      // ============================
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
        display: 'var(--font-display)',
      },

      fontSize: {
        xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-xs)' }],
        sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-sm)' }],
        base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-base)' }],
        lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-lg)' }],
        xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-xl)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-2xl)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-3xl)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-4xl)' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-none)' }],
        '6xl': ['var(--font-size-6xl)', { lineHeight: 'var(--line-height-none)' }],
        '7xl': ['var(--font-size-7xl)', { lineHeight: 'var(--line-height-none)' }],
        '8xl': ['var(--font-size-8xl)', { lineHeight: 'var(--line-height-none)' }],
        '9xl': ['var(--font-size-9xl)', { lineHeight: 'var(--line-height-none)' }],
      },

      // ============================
      // SPACING
      // ============================
      spacing: {
        px: 'var(--spacing-px)',
        0: 'var(--spacing-0)',
        0.5: 'var(--spacing-0-5)',
        1: 'var(--spacing-1)',
        1.5: 'var(--spacing-1-5)',
        2: 'var(--spacing-2)',
        2.5: 'var(--spacing-2-5)',
        3: 'var(--spacing-3)',
        3.5: 'var(--spacing-3-5)',
        4: 'var(--spacing-4)',
        5: 'var(--spacing-5)',
        6: 'var(--spacing-6)',
        7: 'var(--spacing-7)',
        8: 'var(--spacing-8)',
        9: 'var(--spacing-9)',
        10: 'var(--spacing-10)',
        12: 'var(--spacing-12)',
        16: 'var(--spacing-16)',
        20: 'var(--spacing-20)',
        24: 'var(--spacing-24)',
        32: 'var(--spacing-32)',
        40: 'var(--spacing-40)',
        48: 'var(--spacing-48)',
        56: 'var(--spacing-56)',
        64: 'var(--spacing-64)',
      },

      // ============================
      // BORDER RADIUS
      // ============================
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        base: 'var(--radius-base)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },

      // ============================
      // SHADOWS
      // ============================
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        base: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        'brand-sm': 'var(--shadow-brand-sm)',
        'brand-md': 'var(--shadow-brand-md)',
        'brand-lg': 'var(--shadow-brand-lg)',
        'glow-sm': 'var(--shadow-glow-sm)',
        'glow-md': 'var(--shadow-glow-md)',
        'glow-lg': 'var(--shadow-glow-lg)',
        none: 'none',
      },

      // ============================
      // TRANSITIONS
      // ============================
      transitionDuration: {
        instant: 'var(--transition-instant)',
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        smooth: 'var(--transition-smooth)',
        slow: 'var(--transition-slow)',
      },

      transitionTimingFunction: {
        smooth: 'var(--ease-smooth)',
        spring: 'var(--ease-spring)',
      },

      // ============================
      // ANIMATIONS
      // ============================
      animation: {
        'fade-in': 'fadeIn var(--transition-smooth) var(--ease-smooth)',
        'fade-out': 'fadeOut var(--transition-base) var(--ease-in)',
        'slide-in-up': 'slideInUp var(--transition-smooth) var(--ease-smooth)',
        'slide-in-down': 'slideInDown var(--transition-smooth) var(--ease-smooth)',
        'scale-in': 'scaleIn var(--transition-base) var(--ease-smooth)',
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // ============================
      // Z-INDEX
      // ============================
      zIndex: {
        base: '0',
        dropdown: '1000',
        sticky: '1100',
        fixed: '1200',
        overlay: '1300',
        modal: '1400',
        popover: '1500',
        toast: '1600',
        tooltip: '1700',
        notification: '1800',
        max: '9999',
      },

      // ============================
      // BACKDROP BLUR
      // ============================
      backdropBlur: {
        xs: 'var(--blur-sm)',
        sm: 'var(--blur-base)',
        base: 'var(--blur-md)',
        md: 'var(--blur-lg)',
        lg: 'var(--blur-xl)',
        xl: 'var(--blur-2xl)',
        '2xl': 'var(--blur-3xl)',
      },

      // ============================
      // BACKGROUND IMAGES
      // ============================
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-security': 'var(--gradient-security)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

## Usage Examples

### Using Design Tokens

```tsx
// Using color tokens
<div className="bg-background text-foreground border border-border">
  Content
</div>

// Using brand colors
<button className="bg-brand-primary-500 hover:bg-brand-primary-600">
  Click me
</button>

// Using semantic colors
<div className="bg-background-elevated shadow-lg">
  Elevated card
</div>
```

### Using Component Specifications

```tsx
import { getButtonClasses, getCardClasses } from '@/lib/design/components';

// Button
<button className={getButtonClasses('primary', 'lg')}>
  Primary Button
</button>

// Card
<div className={getCardClasses('glass', 'lg')}>
  Glass morphism card
</div>
```

### Using Utility Classes

```tsx
// Glass effect
<div className="glass">
  Glass morphism content
</div>

// Gradient text
<h1 className="gradient-text text-6xl font-bold">
  Gradient Heading
</h1>

// Glow effect
<button className="glow bg-brand-primary-500">
  Glowing Button
</button>

// Smooth transitions
<div className="transition-smooth hover:scale-105">
  Hover me
</div>
```

### Dark Mode Support

```tsx
// Automatic dark mode support
<div className="bg-background text-foreground">
  This automatically switches between dark and light mode
</div>

// Manual dark mode classes
<div className="bg-neutral-950 dark:bg-neutral-50">
  Custom dark mode styling
</div>
```

## Best Practices

1. **Use Design Tokens**: Always use the design token classes instead of arbitrary values
2. **Consistent Spacing**: Use the spacing scale for margins, padding, and gaps
3. **Typography Hierarchy**: Follow the font size scale for consistent typography
4. **Color Semantics**: Use semantic color names (background, foreground, border) for theme compatibility
5. **Transitions**: Apply smooth transitions to interactive elements
6. **Component Specifications**: Use the component helper functions for consistent styling

## Theme Switching

Implement theme switching with this utility:

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
```

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design Tokens Specification](../lib/design/tokens.ts)
- [Component Specifications](../lib/design/components.ts)
- [CSS Variables Reference](../app/design-system.css)
