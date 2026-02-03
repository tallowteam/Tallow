/**
 * Tallow Design System - Design Tokens
 *
 * A comprehensive design token system merging the best elements from:
 * - Vercel: Clean dark themes, developer-focused aesthetic, gradient accents
 * - Linear: Minimalist design, smooth animations, purple accents, premium feel
 * - Euveka: Technology/innovation presentation, unique visual identity
 *
 * Brand values: Privacy-first, secure, modern, trustworthy, professional
 */

/**
 * Color Palette
 *
 * Primary palette uses deep purples (Linear-inspired) with secure, trustworthy undertones
 * Accent colors provide gradient capabilities (Vercel-inspired)
 */
export const colors = {
  // Brand Colors - Purple spectrum for premium, secure feel
  brand: {
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',  // Main brand color
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',  // Secondary brand color
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
  },

  // Neutral Colors - Dark mode optimized
  neutral: {
    // Dark mode (primary)
    dark: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      850: '#1a1a1a',
      900: '#171717',
      925: '#141414',
      950: '#0a0a0a',
      975: '#050505',
    },
    // Light mode (secondary)
    light: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },

  // Gradient Colors (Vercel-inspired)
  gradients: {
    primary: {
      from: '#8b5cf6',  // brand.primary.500
      via: '#7c3aed',   // brand.primary.600
      to: '#6d28d9',    // brand.primary.700
    },
    secondary: {
      from: '#a855f7',  // brand.secondary.500
      via: '#9333ea',   // brand.secondary.600
      to: '#7e22ce',    // brand.secondary.700
    },
    accent: {
      from: '#8b5cf6',
      via: '#a855f7',
      to: '#c084fc',
    },
    security: {
      from: '#6d28d9',
      via: '#5b21b6',
      to: '#4c1d95',
    },
    glass: {
      from: 'rgba(139, 92, 246, 0.1)',
      via: 'rgba(168, 85, 247, 0.05)',
      to: 'rgba(192, 132, 252, 0.1)',
    },
  },

  // Overlay Colors
  overlay: {
    dark: {
      subtle: 'rgba(0, 0, 0, 0.4)',
      medium: 'rgba(0, 0, 0, 0.6)',
      strong: 'rgba(0, 0, 0, 0.8)',
      intense: 'rgba(0, 0, 0, 0.95)',
    },
    light: {
      subtle: 'rgba(255, 255, 255, 0.4)',
      medium: 'rgba(255, 255, 255, 0.6)',
      strong: 'rgba(255, 255, 255, 0.8)',
      intense: 'rgba(255, 255, 255, 0.95)',
    },
  },

  // Glass Morphism Colors
  glass: {
    dark: {
      subtle: 'rgba(10, 10, 10, 0.6)',
      medium: 'rgba(10, 10, 10, 0.7)',
      strong: 'rgba(10, 10, 10, 0.8)',
    },
    light: {
      subtle: 'rgba(255, 255, 255, 0.6)',
      medium: 'rgba(255, 255, 255, 0.7)',
      strong: 'rgba(255, 255, 255, 0.8)',
    },
    purple: {
      subtle: 'rgba(139, 92, 246, 0.1)',
      medium: 'rgba(139, 92, 246, 0.15)',
      strong: 'rgba(139, 92, 246, 0.2)',
    },
  },
} as const;

/**
 * Typography Scale
 *
 * Modern, readable typography with clear hierarchy
 */
export const typography = {
  // Font Families
  fontFamily: {
    sans: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'var(--font-geist-mono), "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    display: 'var(--font-playfair-display), "Playfair Display", Georgia, serif',
  },

  // Font Sizes (with line heights)
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },   // 14px
    base: { size: '1rem', lineHeight: '1.5rem' },      // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },   // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },    // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },     // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' },  // 36px
    '5xl': { size: '3rem', lineHeight: '1' },          // 48px
    '6xl': { size: '3.75rem', lineHeight: '1' },       // 60px
    '7xl': { size: '4.5rem', lineHeight: '1' },        // 72px
    '8xl': { size: '6rem', lineHeight: '1' },          // 96px
    '9xl': { size: '8rem', lineHeight: '1' },          // 128px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

/**
 * Spacing Scale
 *
 * Consistent spacing system based on 4px base unit
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

/**
 * Border Radius Scale
 *
 * Modern, consistent border radius system
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  base: '0.25rem',    // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

/**
 * Box Shadows
 *
 * Layered shadow system for depth and elevation
 */
export const shadows = {
  // Standard Shadows
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 35px 60px -15px rgb(0 0 0 / 0.3)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Colored Shadows (Brand)
  'brand-sm': '0 4px 12px 0 rgb(139 92 246 / 0.2)',
  'brand-md': '0 8px 24px 0 rgb(139 92 246 / 0.25)',
  'brand-lg': '0 16px 40px 0 rgb(139 92 246 / 0.3)',

  // Glow Effects (for emphasis)
  'glow-sm': '0 0 12px rgb(139 92 246 / 0.3)',
  'glow-md': '0 0 24px rgb(139 92 246 / 0.4)',
  'glow-lg': '0 0 40px rgb(139 92 246 / 0.5)',

  // Glass Morphism Shadows
  'glass-sm': '0 4px 6px rgb(0 0 0 / 0.1), inset 0 1px 0 rgb(255 255 255 / 0.1)',
  'glass-md': '0 8px 16px rgb(0 0 0 / 0.15), inset 0 1px 0 rgb(255 255 255 / 0.1)',
  'glass-lg': '0 16px 32px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.1)',

  none: 'none',
} as const;

/**
 * Transitions and Animations
 *
 * Smooth, Linear-inspired motion system
 */
export const transitions = {
  // Duration
  duration: {
    instant: '75ms',
    fast: '150ms',
    base: '200ms',
    smooth: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Timing Functions (Easing)
  timing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Linear-inspired smooth easing
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Custom easings
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Common Transition Combinations
  common: {
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Keyframe Animation Durations
  animation: {
    spin: '1s linear infinite',
    ping: '1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: '2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: '1s infinite',
    fadeIn: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
    fadeOut: '200ms cubic-bezier(0.4, 0, 1, 1)',
    slideIn: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
    slideOut: '200ms cubic-bezier(0.4, 0, 1, 1)',
    scaleIn: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
    scaleOut: '150ms cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

/**
 * Z-Index Scale
 *
 * Organized layering system
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
  notification: 1800,
  max: 9999,
} as const;

/**
 * Breakpoints
 *
 * Responsive design breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

/**
 * Container Widths
 *
 * Maximum content widths for different contexts
 */
export const containers = {
  xs: '20rem',     // 320px
  sm: '24rem',     // 384px
  md: '28rem',     // 448px
  lg: '32rem',     // 512px
  xl: '36rem',     // 576px
  '2xl': '42rem',  // 672px
  '3xl': '48rem',  // 768px
  '4xl': '56rem',  // 896px
  '5xl': '64rem',  // 1024px
  '6xl': '72rem',  // 1152px
  '7xl': '80rem',  // 1280px
  full: '100%',
} as const;

/**
 * Backdrop Blur
 *
 * Blur values for glass morphism effects
 */
export const blur = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const;

/**
 * Border Widths
 */
export const borderWidth = {
  0: '0',
  base: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

/**
 * Opacity Scale
 */
export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',
} as const;

/**
 * Type Exports
 */
export type ColorScale = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
