/**
 * EUVEKA Animation Tokens
 * Exact animation specifications from euveka.com
 *
 * Design Philosophy:
 * - Custom expo-out easing [0.16, 1, 0.3, 1]
 * - Duration hierarchy: 0.3s normal, 0.5s slow, 0.8s slower
 * - Stagger: 0.05-0.15s between children
 * - Blur effect: filter blur(84px) for floating orbs
 * - Clip-path reveals for headlines
 * - Split text animations for premium feel
 */

import { Variants, Transition, type Easing } from 'framer-motion';

// =============================================================================
// EUVEKA CORE TOKENS
// =============================================================================

/**
 * EUVEKA signature easing curve
 * Custom expo-out for smooth, premium feel
 */
export const EUVEKA_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EUVEKA_EASING_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * EUVEKA duration hierarchy
 */
export const EUVEKA_DURATIONS = {
  instant: 0.15,
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  slower: 1.2,
} as const;

/**
 * EUVEKA stagger delays
 */
export const EUVEKA_STAGGER = {
  tight: 0.05,
  normal: 0.08,
  relaxed: 0.12,
  wide: 0.15,
} as const;

/**
 * EUVEKA blur values
 */
export const EUVEKA_BLUR = {
  orb: 84,
  subtle: 12,
  medium: 24,
  heavy: 48,
} as const;

/**
 * EUVEKA colors
 */
export const EUVEKA_COLORS = {
  dark: '#191610',
  light: '#fefefc',
  lightAlpha: {
    10: 'rgba(254, 254, 252, 0.1)',
    15: 'rgba(254, 254, 252, 0.15)',
    30: 'rgba(254, 254, 252, 0.3)',
    50: 'rgba(254, 254, 252, 0.5)',
    60: 'rgba(254, 254, 252, 0.6)',
    70: 'rgba(254, 254, 252, 0.7)',
  },
  darkAlpha: {
    10: 'rgba(25, 22, 16, 0.1)',
    30: 'rgba(25, 22, 16, 0.3)',
    50: 'rgba(25, 22, 16, 0.5)',
  },
} as const;

// =============================================================================
// EUVEKA TRANSITIONS
// =============================================================================

/**
 * Base EUVEKA transition with signature easing
 */
export const euvekaTransition: Transition = {
  duration: EUVEKA_DURATIONS.normal,
  ease: EUVEKA_EASING as Easing,
};

/**
 * Fast EUVEKA transition
 */
export const euvekaTransitionFast: Transition = {
  duration: EUVEKA_DURATIONS.fast,
  ease: EUVEKA_EASING as Easing,
};

/**
 * Slow EUVEKA transition for dramatic reveals
 */
export const euvekaTransitionSlow: Transition = {
  duration: EUVEKA_DURATIONS.slow,
  ease: EUVEKA_EASING as Easing,
};

/**
 * Slower EUVEKA transition for headline reveals
 */
export const euvekaTransitionSlower: Transition = {
  duration: EUVEKA_DURATIONS.slower,
  ease: EUVEKA_EASING as Easing,
};

// =============================================================================
// EUVEKA HEADLINE ANIMATIONS (Clip-path reveal)
// =============================================================================

/**
 * Clip-path reveal for headlines
 * Reveals from bottom to top with EUVEKA easing
 */
export const euvekaHeadlineVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    clipPath: 'inset(100% 0% 0% 0%)',
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: {
      duration: EUVEKA_DURATIONS.slower,
      ease: EUVEKA_EASING as Easing,
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    clipPath: 'inset(0% 0% 100% 0%)',
    transition: {
      duration: EUVEKA_DURATIONS.fast,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

/**
 * Alternative reveal from left to right
 */
export const euvekaRevealLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    clipPath: 'inset(0% 100% 0% 0%)',
  },
  visible: {
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: euvekaTransitionSlow,
  },
};

/**
 * Alternative reveal from right to left
 */
export const euvekaRevealRightVariants: Variants = {
  hidden: {
    opacity: 0,
    clipPath: 'inset(0% 0% 0% 100%)',
  },
  visible: {
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: euvekaTransitionSlow,
  },
};

// =============================================================================
// EUVEKA SPLIT TEXT ANIMATION
// =============================================================================

/**
 * Container for split text animation
 */
export const euvekaSplitTextContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: EUVEKA_STAGGER.tight,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

/**
 * Individual character animation for split text
 */
export const euvekaSplitTextChar: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: EUVEKA_DURATIONS.slow,
      ease: EUVEKA_EASING as Easing,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: EUVEKA_DURATIONS.instant,
    },
  },
};

/**
 * Word-level animation for split text (less intense than char)
 */
export const euvekaSplitTextWord: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

// =============================================================================
// EUVEKA FLOATING ORB ANIMATIONS
// =============================================================================

/**
 * Floating blur orb animation
 * Scale [1, 1.1, 1], opacity [0.3, 0.5, 0.3], y [0, -20, 0]
 */
export const euvekaOrbFloatVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 0.3,
    y: 0,
  },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.5, 0.3],
    y: [0, -20, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Orb float with custom delay (for staggered orbs)
 */
export const createOrbFloatVariants = (delay: number): Variants => ({
  initial: {
    scale: 1,
    opacity: 0.3,
    y: 0,
  },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.5, 0.3],
    y: [0, -20, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    },
  },
});

/**
 * Faster orb animation for smaller orbs
 */
export const euvekaOrbFloatFastVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 0.2,
    y: 0,
  },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.2, 0.4, 0.2],
    y: [0, -15, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// EUVEKA SCROLL INDICATOR
// =============================================================================

/**
 * Scroll indicator container animation
 */
export const euvekaScrollIndicatorVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      delay: 1.2,
      ease: EUVEKA_EASING as Easing,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: EUVEKA_DURATIONS.fast,
    },
  },
};

/**
 * Scroll indicator dot animation
 */
export const euvekaScrollDotVariants: Variants = {
  animate: {
    y: [0, 12, 0],
    opacity: [0.6, 0.3, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// EUVEKA CONTAINER / STAGGER ANIMATIONS
// =============================================================================

/**
 * EUVEKA stagger container
 */
export const euvekaStaggerContainer = (
  staggerDelay = EUVEKA_STAGGER.normal,
  delayChildren = 0.2
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
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

/**
 * EUVEKA stagger item (fade up)
 */
export const euvekaStaggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: euvekaTransition,
  },
  exit: {
    opacity: 0,
    y: -15,
    transition: euvekaTransitionFast,
  },
};

/**
 * EUVEKA stagger item with scale
 */
export const euvekaStaggerItemScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: euvekaTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: euvekaTransitionFast,
  },
};

// =============================================================================
// EUVEKA FADE ANIMATIONS
// =============================================================================

/**
 * EUVEKA fade in
 */
export const euvekaFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: euvekaTransition,
  },
  exit: {
    opacity: 0,
    transition: euvekaTransitionFast,
  },
};

/**
 * EUVEKA fade up
 */
export const euvekaFadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: euvekaTransitionSlow,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: euvekaTransitionFast,
  },
};

/**
 * EUVEKA fade down
 */
export const euvekaFadeDown: Variants = {
  hidden: {
    opacity: 0,
    y: -40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: euvekaTransitionSlow,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: euvekaTransitionFast,
  },
};

// =============================================================================
// EUVEKA SCALE ANIMATIONS
// =============================================================================

/**
 * EUVEKA scale in
 */
export const euvekaScaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: euvekaTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: euvekaTransitionFast,
  },
};

/**
 * EUVEKA CTA button animation
 */
export const euvekaCTAVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      ease: EUVEKA_EASING as Easing,
      delay: 0.8,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: EUVEKA_DURATIONS.fast,
      ease: EUVEKA_EASING as Easing,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// =============================================================================
// EUVEKA HOVER ANIMATIONS
// =============================================================================

/**
 * EUVEKA card hover
 */
export const euvekaCardHover: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -8,
    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2)',
    transition: euvekaTransition,
  },
  tap: {
    y: -4,
    scale: 0.98,
    transition: euvekaTransitionFast,
  },
};

/**
 * EUVEKA button hover (with glow)
 */
export const euvekaButtonHover: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 0 40px rgba(254, 254, 252, 0.15)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 60px rgba(254, 254, 252, 0.25)',
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      ease: EUVEKA_EASING as Easing,
    },
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 0 30px rgba(254, 254, 252, 0.1)',
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * EUVEKA link underline animation
 */
export const euvekaLinkUnderline: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  hover: {
    scaleX: 1,
    transition: {
      duration: EUVEKA_DURATIONS.fast,
      ease: EUVEKA_EASING as Easing,
    },
  },
  exit: {
    scaleX: 0,
    originX: 1,
    transition: {
      duration: EUVEKA_DURATIONS.instant,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

// =============================================================================
// EUVEKA NAV ANIMATIONS
// =============================================================================

/**
 * EUVEKA nav item animation
 */
export const euvekaNavVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

// =============================================================================
// EUVEKA SUBHEADLINE ANIMATIONS
// =============================================================================

/**
 * EUVEKA subheadline animation
 */
export const euvekaSubheadlineVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: EUVEKA_DURATIONS.slow,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

// =============================================================================
// EUVEKA REDUCED MOTION VARIANTS
// =============================================================================

/**
 * Reduced motion fallback - instant transitions
 */
export const euvekaReducedMotion = {
  transition: { duration: 0.01 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' },
} as const;

/**
 * Create reduced motion safe variant
 */
export function withEuvekaReducedMotion(variants: Variants): Variants {
  const visibleVariant = variants['visible'];
  return {
    ...variants,
    visible: {
      ...(visibleVariant as object),
      transition: { duration: 0.01 },
    },
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create EUVEKA transition with custom duration
 */
export function createEuvekaTransition(
  duration: number = EUVEKA_DURATIONS.normal,
  delay: number = 0
): Transition {
  return {
    duration,
    ease: EUVEKA_EASING as Easing,
    delay,
  };
}

/**
 * Create custom EUVEKA fade up variants
 */
export function createEuvekaFadeUp(
  yOffset: number = 40,
  duration: number = EUVEKA_DURATIONS.slow,
  delay: number = 0
): Variants {
  return {
    hidden: {
      opacity: 0,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: createEuvekaTransition(duration, delay),
    },
    exit: {
      opacity: 0,
      y: -yOffset / 2,
      transition: createEuvekaTransition(EUVEKA_DURATIONS.fast),
    },
  };
}

/**
 * Create custom EUVEKA headline reveal
 */
export function createEuvekaHeadlineReveal(
  delay: number = 0,
  duration: number = EUVEKA_DURATIONS.slower
): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 60,
      clipPath: 'inset(100% 0% 0% 0%)',
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0% 0% 0% 0%)',
      transition: createEuvekaTransition(duration, delay),
    },
  };
}
