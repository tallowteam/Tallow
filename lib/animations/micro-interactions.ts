/**
 * Euveka-Style Micro-Interactions
 * Premium, tactile animations for UI polish
 *
 * Design Philosophy:
 * - Subtle but noticeable feedback
 * - Spring physics for organic feel
 * - GPU-accelerated (transform/opacity only)
 * - Reduced motion support
 *
 * EUVEKA Animation Specs:
 * - Easing: [0.16, 1, 0.3, 1] (custom expo-out)
 * - Duration: 0.3s normal, 0.5s slow, 0.8s slower
 * - Stagger: 0.05-0.15s between children
 */

import { Variants, Transition, TargetAndTransition } from 'framer-motion';

// EUVEKA signature easing curve
export const EUVEKA_EASE = [0.16, 1, 0.3, 1] as const;

// =============================================================================
// SPRING PHYSICS CONFIGURATIONS
// =============================================================================

/**
 * Tactile spring - feels like pressing a physical button
 */
export const tactileSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

/**
 * Soft spring - gentle, premium feel
 */
export const softSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 0.8,
};

/**
 * Snappy spring - quick response for micro-interactions
 */
export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.3,
};

/**
 * Bouncy spring - playful, attention-grabbing
 */
export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
  mass: 0.6,
};

// =============================================================================
// BUTTON MICRO-INTERACTIONS
// =============================================================================

/**
 * Button hover variants - Euveka style
 * Subtle scale + enhanced shadow on hover
 */
export const buttonMicroVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.15)',
  },
  hover: {
    scale: 1.03,
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.2)',
    transition: tactileSpring,
  },
  tap: {
    scale: 0.97,
    boxShadow: '0 2px 4px -1px rgba(0,0,0,0.1)',
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20,
    },
  },
};

/**
 * Ghost button - minimal, text-based
 */
export const ghostButtonVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 0.9,
  },
  hover: {
    scale: 1.02,
    opacity: 1,
    transition: snappySpring,
  },
  tap: {
    scale: 0.98,
    transition: snappySpring,
  },
};

/**
 * Icon button - rotation on hover
 */
export const iconButtonMicroVariants: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: tactileSpring,
  },
  tap: {
    scale: 0.9,
    rotate: -5,
    transition: snappySpring,
  },
};

/**
 * Floating action button - lift effect
 */
export const fabVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.2)',
  },
  hover: {
    scale: 1.05,
    y: -2,
    boxShadow: '0 12px 32px -4px rgba(0,0,0,0.3)',
    transition: tactileSpring,
  },
  tap: {
    scale: 0.95,
    y: 0,
    boxShadow: '0 2px 8px -1px rgba(0,0,0,0.15)',
    transition: snappySpring,
  },
};

// =============================================================================
// CARD MICRO-INTERACTIONS
// =============================================================================

/**
 * Card lift animation - Euveka signature
 * Y: -4px lift with enhanced shadow
 */
export const cardLiftVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
    boxShadow: '0 2px 16px -4px rgba(0,0,0,0.15)',
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 16px 48px -12px rgba(0,0,0,0.25)',
    transition: softSpring,
  },
  tap: {
    y: -2,
    scale: 0.99,
    boxShadow: '0 8px 24px -8px rgba(0,0,0,0.2)',
    transition: snappySpring,
  },
};

/**
 * Interactive card - for clickable cards
 */
export const interactiveCardVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
    boxShadow: '0 2px 16px -4px rgba(0,0,0,0.15)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 20px 56px -16px rgba(0,0,0,0.3)',
    borderColor: 'rgba(255,255,255,0.2)',
    transition: softSpring,
  },
  tap: {
    y: 0,
    scale: 0.98,
    boxShadow: '0 4px 12px -4px rgba(0,0,0,0.2)',
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
};

/**
 * Glass card - frosted glass effect enhancement
 */
export const glassCardVariants: Variants = {
  initial: {
    y: 0,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 32px -6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)',
  },
  hover: {
    y: -4,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 16px 56px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    transition: softSpring,
  },
};

/**
 * Feature card - for feature showcase
 */
export const featureCardVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  tap: {
    scale: 0.98,
    transition: snappySpring,
  },
};

// =============================================================================
// LINK MICRO-INTERACTIONS
// =============================================================================

/**
 * Underline animation variants
 * Animate scaleX from 0 to 1 on hover
 */
export const linkUnderlineVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  hover: {
    scaleX: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    scaleX: 0,
    originX: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Link text animation - slight lift on hover
 */
export const linkTextVariants: Variants = {
  initial: {
    y: 0,
    color: 'inherit',
  },
  hover: {
    y: -1,
    transition: snappySpring,
  },
};

/**
 * Nav link - full underline animation
 */
export const navLinkVariants: Variants = {
  initial: {
    opacity: 0.8,
  },
  hover: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  active: {
    opacity: 1,
  },
};

// =============================================================================
// ICON MICRO-INTERACTIONS
// =============================================================================

/**
 * Icon hover - subtle rotation
 */
export const iconHoverVariants: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 8,
    transition: tactileSpring,
  },
};

/**
 * Icon pulse - for attention
 */
export const iconPulseVariants: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeInOut',
    },
  },
};

/**
 * Icon bounce - playful interaction
 */
export const iconBounceVariants: Variants = {
  initial: {
    y: 0,
  },
  hover: {
    y: [-2, 2, -2, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

/**
 * Icon spin on click
 */
export const iconSpinVariants: Variants = {
  initial: {
    rotate: 0,
  },
  tap: {
    rotate: 180,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// =============================================================================
// SUCCESS / COMPLETION ANIMATIONS
// =============================================================================

/**
 * Success checkmark animation
 * Draw path animation for elegant reveal
 */
export const checkmarkPathVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        delay: 0.1,
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
};

/**
 * Success circle animation
 * Circle draws before checkmark
 */
export const successCircleVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
};

/**
 * Success container - scale and fade in
 */
export const successContainerVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: bouncySpring,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Completion badge - pop in effect
 */
export const completionBadgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    rotate: -180,
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      delay: 0.2,
    },
  },
};

/**
 * Confetti particle animation
 */
export const confettiVariants: Variants = {
  initial: {
    y: 0,
    x: 0,
    opacity: 1,
    scale: 0,
    rotate: 0,
  },
  animate: (custom: { x: number; rotation: number }) => ({
    y: [0, -100, 200],
    x: [0, custom.x, custom.x * 1.5],
    opacity: [1, 1, 0],
    scale: [0, 1, 0.5],
    rotate: [0, custom.rotation, custom.rotation * 2],
    transition: {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// =============================================================================
// INPUT MICRO-INTERACTIONS
// =============================================================================

/**
 * Input focus animation
 */
export const inputFocusVariants: Variants = {
  initial: {
    boxShadow: '0 0 0 0 transparent',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  focus: {
    boxShadow: '0 0 0 3px rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Input label float animation
 */
export const inputLabelVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
    color: 'rgba(255,255,255,0.5)',
  },
  focus: {
    y: -24,
    scale: 0.85,
    color: 'rgba(255,255,255,0.8)',
    transition: snappySpring,
  },
};

// =============================================================================
// TOGGLE / SWITCH MICRO-INTERACTIONS
// =============================================================================

/**
 * Toggle thumb animation
 */
export const toggleThumbVariants: Variants = {
  off: {
    x: 0,
    scale: 1,
  },
  on: {
    x: 20,
    scale: 1,
    transition: tactileSpring,
  },
  hover: {
    scale: 1.1,
    transition: snappySpring,
  },
};

/**
 * Toggle track animation
 */
export const toggleTrackVariants: Variants = {
  off: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  on: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    transition: {
      duration: 0.2,
    },
  },
};

// =============================================================================
// TOOLTIP / POPOVER MICRO-INTERACTIONS
// =============================================================================

/**
 * Tooltip animation
 */
export const tooltipVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: snappySpring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 5,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * Dropdown menu animation
 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

// =============================================================================
// LOADING MICRO-INTERACTIONS
// =============================================================================

/**
 * Skeleton shimmer animation
 */
export const skeletonShimmerAnimation: TargetAndTransition = {
  backgroundPosition: ['200% 0', '-200% 0'],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

/**
 * Spinner rotation
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Dot loading animation
 */
export const loadingDotVariants: Variants = {
  initial: {
    y: 0,
  },
  animate: (i: number) => ({
    y: [0, -8, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      delay: i * 0.1,
      ease: 'easeInOut',
    },
  }),
};

// =============================================================================
// NOTIFICATION MICRO-INTERACTIONS
// =============================================================================

/**
 * Toast notification animation
 */
export const toastMicroVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: bouncySpring,
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Badge notification animation
 */
export const notificationBadgeVariants: Variants = {
  initial: {
    scale: 0,
  },
  animate: {
    scale: 1,
    transition: bouncySpring,
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
      repeat: 2,
    },
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a custom button variant with specific shadow colors
 */
export function createButtonVariants(shadowColor = 'rgba(0,0,0,0.15)'): Variants {
  return {
    initial: {
      scale: 1,
      boxShadow: `0 2px 8px -2px ${shadowColor}`,
    },
    hover: {
      scale: 1.03,
      boxShadow: `0 8px 24px -4px ${shadowColor}`,
      transition: tactileSpring,
    },
    tap: {
      scale: 0.97,
      boxShadow: `0 2px 4px -1px ${shadowColor}`,
      transition: snappySpring,
    },
  };
}

/**
 * Creates a custom card lift variant with specific shadow colors
 */
export function createCardLiftVariants(shadowColor = 'rgba(0,0,0,0.15)'): Variants {
  return {
    initial: {
      y: 0,
      scale: 1,
      boxShadow: `0 2px 16px -4px ${shadowColor}`,
    },
    hover: {
      y: -4,
      scale: 1.01,
      boxShadow: `0 16px 48px -12px ${shadowColor}`,
      transition: softSpring,
    },
    tap: {
      y: -2,
      scale: 0.99,
      boxShadow: `0 8px 24px -8px ${shadowColor}`,
      transition: snappySpring,
    },
  };
}

/**
 * Get reduced motion safe transition
 */
export function getReducedMotionSafeTransition(transition: Transition): Transition {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { duration: 0.01 };
  }
  return transition;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =============================================================================
// EUVEKA-SPECIFIC MICRO-INTERACTIONS
// =============================================================================

/**
 * EUVEKA button micro-interaction
 * Uses EUVEKA signature easing with glow effect
 */
export const euvekaButtonMicroVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 0 40px rgba(254, 254, 252, 0.15)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 60px rgba(254, 254, 252, 0.25)',
    transition: {
      duration: 0.5,
      ease: EUVEKA_EASE,
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
 * EUVEKA card micro-interaction
 * Subtle lift with EUVEKA timing
 */
export const euvekaCardMicroVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -8,
    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2)',
    transition: {
      duration: 0.5,
      ease: EUVEKA_EASE,
    },
  },
  tap: {
    y: -4,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: EUVEKA_EASE,
    },
  },
};

/**
 * EUVEKA link underline animation
 */
export const euvekaLinkUnderlineVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  hover: {
    scaleX: 1,
    transition: {
      duration: 0.3,
      ease: EUVEKA_EASE,
    },
  },
  exit: {
    scaleX: 0,
    originX: 1,
    transition: {
      duration: 0.15,
      ease: EUVEKA_EASE,
    },
  },
};

/**
 * EUVEKA fade up animation
 */
export const euvekaFadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: EUVEKA_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: EUVEKA_EASE,
    },
  },
};

/**
 * EUVEKA stagger configuration
 */
export const euvekaStaggerConfig = {
  tight: 0.05,
  normal: 0.08,
  relaxed: 0.12,
  wide: 0.15,
} as const;

/**
 * Create EUVEKA stagger container variants
 */
export function createEuvekaStaggerContainer(
  staggerDelay = euvekaStaggerConfig.normal,
  delayChildren = 0.2
): Variants {
  return {
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
  };
}

/**
 * Create EUVEKA transition with custom duration
 */
export function createEuvekaTransition(
  duration = 0.5,
  delay = 0
): Transition {
  return {
    duration,
    delay,
    ease: EUVEKA_EASE,
  };
}
