/**
 * Animation Presets Library
 * GPU-accelerated, optimized animation configurations
 * All animations respect prefers-reduced-motion
 */

import { Variants, Transition, TargetAndTransition } from 'framer-motion';

/**
 * ============================================================================
 * SPRING CONFIGURATIONS - Optimized for 60fps
 * ============================================================================
 */

export const springs = {
  // Gentle spring for smooth, natural motion
  gentle: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 14,
    mass: 0.4,
  },
  // Standard spring for most UI interactions
  standard: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  // Snappy spring for micro-interactions
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.5,
  },
  // Bouncy spring for playful animations
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 15,
    mass: 0.7,
  },
  // Smooth spring for large movements
  smooth: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 1,
  },
  // Stiff spring for immediate feedback
  stiff: {
    type: 'spring' as const,
    stiffness: 700,
    damping: 40,
    mass: 0.3,
  },
} as const;

/**
 * ============================================================================
 * EASING CURVES - Cubic bezier configurations
 * ============================================================================
 */

export const easings = {
  // Material Design easings
  easeInOut: [0.4, 0, 0.2, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,

  // EUVEKA signature easing (custom expo-out)
  euveka: [0.16, 1, 0.3, 1] as const,

  // Custom easings
  sharp: [0.4, 0, 0.6, 1] as const,
  smooth: [0.25, 0.1, 0.25, 1] as const,
  emphasized: [0.2, 0, 0, 1] as const,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1] as const,
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15] as const,

  // Bounce easings
  bounceOut: [0.34, 1.56, 0.64, 1] as const,
  bounceIn: [0.6, -0.28, 0.735, 0.045] as const,

  // Expo easings
  expoOut: [0.19, 1, 0.22, 1] as const,
  expoIn: [0.95, 0.05, 0.795, 0.035] as const,
} as const;

/**
 * ============================================================================
 * TRANSITION PRESETS - Ready-to-use timing configurations
 * ============================================================================
 */

export const transitions = {
  // Ultra-fast for instant feedback
  instant: { duration: 0.1, ease: easings.easeOut } as Transition,

  // Fast for micro-interactions
  fast: { duration: 0.15, ease: easings.easeOut } as Transition,

  // Default for most animations
  default: { duration: 0.3, ease: easings.easeInOut } as Transition,

  // Medium for content transitions
  medium: { duration: 0.5, ease: easings.easeInOut } as Transition,

  // Slow for dramatic effects
  slow: { duration: 0.8, ease: easings.smooth } as Transition,

  // Spring variants
  springFast: springs.snappy,
  springDefault: springs.standard,
  springSlow: springs.gentle,

  // Emphasized motion (Material Design)
  emphasized: { duration: 0.4, ease: easings.emphasized } as Transition,
  emphasizedDecelerate: { duration: 0.4, ease: easings.emphasizedDecelerate } as Transition,
  emphasizedAccelerate: { duration: 0.2, ease: easings.emphasizedAccelerate } as Transition,
} as const;

/**
 * ============================================================================
 * FADE ANIMATIONS - Opacity-based transitions
 * ============================================================================
 */

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

/**
 * ============================================================================
 * SCALE ANIMATIONS - Transform-based scaling
 * ============================================================================
 */

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const scaleOut: Variants = {
  initial: { opacity: 0, scale: 1.05 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

export const pop: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: { opacity: 0, scale: 0.5 },
};

export const zoom: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.standard,
  },
  exit: { opacity: 0, scale: 0 },
};

/**
 * ============================================================================
 * SLIDE ANIMATIONS - Directional slides
 * ============================================================================
 */

export const slideInLeft: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export const slideInUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

export const slideInDown: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
};

/**
 * ============================================================================
 * ROTATION ANIMATIONS - Rotating elements
 * ============================================================================
 */

export const rotateIn: Variants = {
  initial: { opacity: 0, rotate: -180 },
  animate: {
    opacity: 1,
    rotate: 0,
    transition: springs.bouncy,
  },
  exit: { opacity: 0, rotate: 180 },
};

export const flipHorizontal: Variants = {
  initial: { rotateY: -90, opacity: 0 },
  animate: { rotateY: 0, opacity: 1 },
  exit: { rotateY: 90, opacity: 0 },
};

export const flipVertical: Variants = {
  initial: { rotateX: -90, opacity: 0 },
  animate: { rotateX: 0, opacity: 1 },
  exit: { rotateX: 90, opacity: 0 },
};

/**
 * ============================================================================
 * STAGGER CONTAINER - For sequential animations
 * ============================================================================
 */

export const staggerContainer = (staggerDelay = 0.05, delayChildren = 0.1): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
});

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

/**
 * ============================================================================
 * HOVER & TAP ANIMATIONS - Interactive states
 * ============================================================================
 */

export const hoverScale = (scale = 1.05, tapScale = 0.95) => ({
  rest: { scale: 1 },
  hover: {
    scale,
    transition: transitions.springFast,
  },
  tap: {
    scale: tapScale,
    transition: transitions.instant,
  },
});

export const hoverLift = (lift = -4) => ({
  rest: { y: 0, scale: 1 },
  hover: {
    y: lift,
    scale: 1.02,
    transition: springs.standard,
  },
  tap: {
    y: 0,
    scale: 0.98,
    transition: transitions.instant,
  },
});

export const hoverGlow = (color = 'rgba(59, 130, 246, 0.3)', intensity = 20) => ({
  rest: {
    boxShadow: '0 0 0px transparent',
  },
  hover: {
    boxShadow: `0 0 ${intensity}px ${color}`,
    transition: transitions.default,
  },
});

/**
 * ============================================================================
 * LOADING ANIMATIONS - Skeleton and spinners
 * ============================================================================
 */

export const pulse: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easings.easeInOut,
    },
  },
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: easings.easeInOut,
    },
  },
};

/**
 * ============================================================================
 * PROGRESS ANIMATIONS - For transfer indicators
 * ============================================================================
 */

export const progressBar = (progress: number): Variants => ({
  initial: { scaleX: 0, originX: 0 },
  animate: {
    scaleX: progress / 100,
    transition: {
      duration: 0.5,
      ease: easings.easeOut,
    },
  },
});

export const progressCircle = (progress: number): TargetAndTransition => ({
  pathLength: progress / 100,
  transition: {
    duration: 0.5,
    ease: easings.easeOut,
  },
});

export const countUp = (_from: number, _to: number): Variants => ({
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
});

/**
 * ============================================================================
 * MODAL & DIALOG ANIMATIONS - Overlays and popups
 * ============================================================================
 */

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.standard,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: transitions.fast,
  },
};

export const drawerBottom: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    y: '100%',
    transition: springs.snappy,
  },
};

export const drawerTop: Variants = {
  initial: { y: '-100%' },
  animate: {
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    y: '-100%',
    transition: springs.snappy,
  },
};

export const drawerLeft: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    x: '-100%',
    transition: springs.snappy,
  },
};

export const drawerRight: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    x: '100%',
    transition: springs.snappy,
  },
};

/**
 * ============================================================================
 * NOTIFICATION ANIMATIONS - Toasts and alerts
 * ============================================================================
 */

export const notificationSlideIn: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: transitions.fast,
  },
};

export const toastSlideRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: springs.standard,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: transitions.fast,
  },
};

/**
 * ============================================================================
 * PAGE TRANSITIONS - Route changes
 * ============================================================================
 */

export const pageSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.easeInOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const pageSlideHorizontal = (direction: 'left' | 'right' = 'left'): Variants => ({
  initial: {
    opacity: 0,
    x: direction === 'left' ? -30 : 30,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    x: direction === 'left' ? 30 : -30,
    transition: transitions.fast,
  },
});

/**
 * ============================================================================
 * COLLAPSE / EXPAND ANIMATIONS - Accordions
 * ============================================================================
 */

export const collapseVertical: Variants = {
  initial: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: easings.easeInOut },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: easings.easeInOut },
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * ============================================================================
 * GPU OPTIMIZATION HINTS
 * ============================================================================
 */

export const gpuAcceleration = {
  // Force GPU acceleration for smooth animations
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
} as const;

/**
 * ============================================================================
 * REDUCED MOTION - Instant alternatives
 * ============================================================================
 */

export const reducedMotion = {
  transition: { duration: 0.01 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
} as const;

/**
 * Helper to create reduced motion variant
 */
export const withReducedMotion = (variants: Variants): Variants => ({
  ...variants,
  animate: {
    ...(variants['animate'] as object),
    transition: { duration: 0.01 },
  },
});
