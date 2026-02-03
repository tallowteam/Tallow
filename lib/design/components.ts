/**
 * Tallow Design System - Component Specifications
 *
 * Component variants, styles, and configurations
 * Provides type-safe component styling with Tailwind utilities
 */

/**
 * Button Component Specifications
 */
export const buttonVariants = {
  // Base Styles (Applied to all buttons)
  base: [
    'inline-flex items-center justify-center',
    'font-medium',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none',
  ].join(' '),

  // Variant Styles
  variants: {
    primary: [
      'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700',
      'text-white',
      'shadow-brand-sm',
      'hover:shadow-brand-md hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:ring-purple-500 focus:ring-offset-neutral-950',
    ].join(' '),

    secondary: [
      'bg-neutral-800 border border-neutral-700',
      'text-neutral-50',
      'hover:bg-neutral-700 hover:border-neutral-600',
      'active:bg-neutral-750',
      'focus:ring-purple-500 focus:ring-offset-neutral-950',
    ].join(' '),

    ghost: [
      'bg-transparent',
      'text-neutral-300',
      'hover:bg-neutral-800 hover:text-neutral-50',
      'active:bg-neutral-750',
      'focus:ring-purple-500 focus:ring-offset-neutral-950',
    ].join(' '),

    danger: [
      'bg-gradient-to-r from-red-500 via-red-600 to-red-700',
      'text-white',
      'shadow-sm',
      'hover:shadow-md hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:ring-red-500 focus:ring-offset-neutral-950',
    ].join(' '),

    outline: [
      'bg-transparent border-2 border-purple-500',
      'text-purple-400',
      'hover:bg-purple-500/10 hover:border-purple-400',
      'active:bg-purple-500/20',
      'focus:ring-purple-500 focus:ring-offset-neutral-950',
    ].join(' '),

    glass: [
      'bg-neutral-900/60 backdrop-blur-xl border border-white/10',
      'text-neutral-50',
      'hover:bg-neutral-800/70 hover:border-white/20',
      'active:bg-neutral-750/80',
      'focus:ring-purple-500 focus:ring-offset-neutral-950',
    ].join(' '),

    gradient: [
      'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500',
      'text-white',
      'shadow-brand-md',
      'hover:shadow-brand-lg hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:ring-purple-500 focus:ring-offset-neutral-950',
      'relative overflow-hidden',
      'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
      'before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
    ].join(' '),
  },

  // Size Variants
  sizes: {
    xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
    sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
    base: 'h-10 px-4 text-base rounded-lg gap-2',
    lg: 'h-12 px-6 text-lg rounded-xl gap-2.5',
    xl: 'h-14 px-8 text-xl rounded-xl gap-3',
  },

  // Icon Button Variants
  iconSizes: {
    xs: 'h-7 w-7 rounded-md',
    sm: 'h-8 w-8 rounded-lg',
    base: 'h-10 w-10 rounded-lg',
    lg: 'h-12 w-12 rounded-xl',
    xl: 'h-14 w-14 rounded-xl',
  },
} as const;

/**
 * Card Component Specifications
 */
export const cardVariants = {
  base: [
    'rounded-2xl',
    'transition-all duration-300',
  ].join(' '),

  variants: {
    default: [
      'bg-neutral-900 border border-neutral-800',
      'shadow-md',
    ].join(' '),

    elevated: [
      'bg-neutral-850 border border-neutral-800',
      'shadow-lg',
      'hover:shadow-xl hover:border-neutral-700',
    ].join(' '),

    glass: [
      'bg-neutral-900/60 backdrop-blur-xl border border-white/10',
      'shadow-glass-md',
      'hover:bg-neutral-900/70 hover:border-white/20',
    ].join(' '),

    gradient: [
      'bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/20',
      'border border-purple-800/30',
      'shadow-brand-sm',
      'hover:shadow-brand-md',
    ].join(' '),

    interactive: [
      'bg-neutral-900 border border-neutral-800',
      'shadow-md',
      'hover:shadow-xl hover:border-purple-700/50 hover:scale-[1.02]',
      'active:scale-[0.98]',
      'cursor-pointer',
    ].join(' '),

    outlined: [
      'bg-transparent border-2 border-neutral-800',
      'hover:border-purple-700/50 hover:bg-neutral-900/50',
    ].join(' '),
  },

  padding: {
    none: 'p-0',
    sm: 'p-4',
    base: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  },
} as const;

/**
 * Input Component Specifications
 */
export const inputVariants = {
  base: [
    'w-full',
    'rounded-lg',
    'border',
    'font-medium',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:text-neutral-500',
  ].join(' '),

  variants: {
    default: [
      'bg-neutral-900 border-neutral-800',
      'text-neutral-50',
      'focus:border-purple-500 focus:ring-purple-500',
      'hover:border-neutral-700',
    ].join(' '),

    filled: [
      'bg-neutral-850 border-transparent',
      'text-neutral-50',
      'focus:border-purple-500 focus:ring-purple-500 focus:bg-neutral-900',
      'hover:bg-neutral-800',
    ].join(' '),

    glass: [
      'bg-neutral-900/60 backdrop-blur-xl border-white/10',
      'text-neutral-50',
      'focus:border-purple-500/50 focus:ring-purple-500 focus:bg-neutral-900/80',
      'hover:border-white/20',
    ].join(' '),

    error: [
      'bg-neutral-900 border-red-500',
      'text-neutral-50',
      'focus:border-red-500 focus:ring-red-500',
    ].join(' '),

    success: [
      'bg-neutral-900 border-green-500',
      'text-neutral-50',
      'focus:border-green-500 focus:ring-green-500',
    ].join(' '),
  },

  sizes: {
    sm: 'h-8 px-3 text-sm',
    base: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
  },
} as const;

/**
 * Navigation Component Specifications
 */
export const navigationVariants = {
  // Header/Navbar
  header: {
    base: [
      'fixed top-0 left-0 right-0',
      'z-sticky',
      'transition-all duration-300',
    ].join(' '),

    variants: {
      solid: 'bg-neutral-950 border-b border-neutral-900',
      glass: 'bg-neutral-950/80 backdrop-blur-xl border-b border-white/10',
      transparent: 'bg-transparent',
    },
  },

  // Navigation Links
  link: {
    base: [
      'px-3 py-2',
      'rounded-lg',
      'font-medium',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-purple-500',
    ].join(' '),

    variants: {
      default: 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800',
      active: 'text-neutral-50 bg-neutral-800',
      ghost: 'text-neutral-400 hover:text-purple-400',
    },
  },

  // Sidebar
  sidebar: {
    base: [
      'fixed left-0 top-0 bottom-0',
      'w-64',
      'z-fixed',
      'transition-transform duration-300',
    ].join(' '),

    variants: {
      solid: 'bg-neutral-950 border-r border-neutral-900',
      glass: 'bg-neutral-950/80 backdrop-blur-xl border-r border-white/10',
    },
  },
} as const;

/**
 * Modal/Dialog Component Specifications
 */
export const modalVariants = {
  overlay: [
    'fixed inset-0',
    'z-overlay',
    'bg-black/80 backdrop-blur-sm',
    'flex items-center justify-center',
    'p-4',
  ].join(' '),

  content: {
    base: [
      'relative',
      'w-full',
      'rounded-2xl',
      'shadow-2xl',
      'z-modal',
      'animate-scale-in',
    ].join(' '),

    variants: {
      default: 'bg-neutral-900 border border-neutral-800',
      glass: 'bg-neutral-900/90 backdrop-blur-xl border border-white/10',
      gradient: 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/20 border border-purple-800/30',
    },

    sizes: {
      sm: 'max-w-sm',
      base: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      full: 'max-w-full mx-4',
    },
  },

  header: 'px-6 py-4 border-b border-neutral-800',
  body: 'px-6 py-4',
  footer: 'px-6 py-4 border-t border-neutral-800 flex justify-end gap-3',
} as const;

/**
 * Hero Section Specifications
 */
export const heroVariants = {
  container: [
    'relative',
    'min-h-screen',
    'flex items-center justify-center',
    'overflow-hidden',
  ].join(' '),

  variants: {
    default: 'bg-neutral-950',
    gradient: 'bg-gradient-to-br from-neutral-950 via-neutral-950 to-purple-950/30',
    glass: 'bg-neutral-950',
  },

  content: [
    'relative z-10',
    'max-w-7xl mx-auto',
    'px-4 sm:px-6 lg:px-8',
    'text-center',
  ].join(' '),

  title: [
    'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl',
    'font-bold',
    'tracking-tight',
    'mb-6',
  ].join(' '),

  subtitle: [
    'text-lg sm:text-xl lg:text-2xl',
    'text-neutral-400',
    'max-w-3xl mx-auto',
    'mb-8',
  ].join(' '),

  // Background Effects
  background: {
    gradient: [
      'absolute inset-0',
      'bg-gradient-to-br from-purple-500/10 via-transparent to-fuchsia-500/10',
      'opacity-50',
    ].join(' '),

    grid: [
      'absolute inset-0',
      'bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]',
      'bg-[size:4rem_4rem]',
      '[mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]',
    ].join(' '),

    glow: [
      'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'w-[800px] h-[800px]',
      'bg-purple-500/20',
      'rounded-full',
      'blur-[120px]',
      'animate-pulse',
    ].join(' '),
  },
} as const;

/**
 * Badge Component Specifications
 */
export const badgeVariants = {
  base: [
    'inline-flex items-center',
    'px-2.5 py-0.5',
    'rounded-full',
    'text-xs font-medium',
    'transition-colors',
  ].join(' '),

  variants: {
    default: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
    primary: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    gradient: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0',
  },
} as const;

/**
 * Toast/Notification Component Specifications
 */
export const toastVariants = {
  container: [
    'fixed z-toast',
    'flex flex-col gap-2',
    'pointer-events-none',
  ].join(' '),

  positions: {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  },

  toast: {
    base: [
      'flex items-start gap-3',
      'min-w-[300px] max-w-md',
      'p-4',
      'rounded-xl',
      'shadow-xl',
      'pointer-events-auto',
      'animate-slide-in-up',
    ].join(' '),

    variants: {
      default: 'bg-neutral-900 border border-neutral-800 text-neutral-50',
      success: 'bg-green-950 border border-green-800 text-green-50',
      error: 'bg-red-950 border border-red-800 text-red-50',
      warning: 'bg-yellow-950 border border-yellow-800 text-yellow-50',
      info: 'bg-blue-950 border border-blue-800 text-blue-50',
      glass: 'bg-neutral-900/90 backdrop-blur-xl border border-white/10 text-neutral-50',
    },
  },
} as const;

/**
 * Tooltip Component Specifications
 */
export const tooltipVariants = {
  base: [
    'absolute z-tooltip',
    'px-3 py-2',
    'text-sm font-medium',
    'rounded-lg',
    'shadow-lg',
    'pointer-events-none',
    'animate-fade-in',
  ].join(' '),

  variants: {
    default: 'bg-neutral-900 border border-neutral-800 text-neutral-50',
    dark: 'bg-neutral-950 text-neutral-50',
    glass: 'bg-neutral-900/90 backdrop-blur-xl border border-white/10 text-neutral-50',
  },

  arrow: [
    'absolute',
    'w-2 h-2',
    'rotate-45',
    'bg-inherit border-inherit',
  ].join(' '),
} as const;

/**
 * Divider Component Specifications
 */
export const dividerVariants = {
  horizontal: 'w-full h-px bg-neutral-800',
  vertical: 'w-px h-full bg-neutral-800',

  variants: {
    default: 'bg-neutral-800',
    subtle: 'bg-neutral-850',
    strong: 'bg-neutral-700',
    gradient: 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent',
  },
} as const;

/**
 * Skeleton Loader Specifications
 */
export const skeletonVariants = {
  base: [
    'bg-neutral-800',
    'rounded-lg',
    'animate-pulse',
  ].join(' '),

  variants: {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
    card: 'h-48 w-full',
  },
} as const;

/**
 * Progress Bar Specifications
 */
export const progressVariants = {
  container: [
    'w-full',
    'h-2',
    'bg-neutral-800',
    'rounded-full',
    'overflow-hidden',
  ].join(' '),

  bar: {
    base: [
      'h-full',
      'transition-all duration-300',
      'rounded-full',
    ].join(' '),

    variants: {
      default: 'bg-purple-500',
      gradient: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    },
  },
} as const;

/**
 * Utility: Combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility: Get button classes
 */
export function getButtonClasses(
  variant: keyof typeof buttonVariants.variants = 'primary',
  size: keyof typeof buttonVariants.sizes = 'base'
): string {
  return cn(
    buttonVariants.base,
    buttonVariants.variants[variant],
    buttonVariants.sizes[size]
  );
}

/**
 * Utility: Get card classes
 */
export function getCardClasses(
  variant: keyof typeof cardVariants.variants = 'default',
  padding: keyof typeof cardVariants.padding = 'base'
): string {
  return cn(
    cardVariants.base,
    cardVariants.variants[variant],
    cardVariants.padding[padding]
  );
}

/**
 * Utility: Get input classes
 */
export function getInputClasses(
  variant: keyof typeof inputVariants.variants = 'default',
  size: keyof typeof inputVariants.sizes = 'base'
): string {
  return cn(
    inputVariants.base,
    inputVariants.variants[variant],
    inputVariants.sizes[size]
  );
}
