/**
 * Framer Motion Configuration
 * GPU-accelerated animation settings with reduced motion support
 * Only uses transform and opacity for optimal 60fps performance
 */

import { Transition, Variants } from 'framer-motion';

/**
 * GPU Acceleration Hints
 * Apply these to elements that will be animated for better performance
 */
export const gpuAcceleration = {
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
} as const;

// Easing curves for smooth 60fps animations
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  // EUVEKA signature easing (custom expo-out from euveka.com)
  euveka: [0.16, 1, 0.3, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  smooth: { type: 'spring', stiffness: 100, damping: 20 },
  bouncy: { type: 'spring', stiffness: 400, damping: 25 },
} as const;

// Default transition for most animations
export const defaultTransition: Transition = {
  duration: 0.3,
  ease: easings.easeInOut,
};

// Fast transition for micro-interactions
export const fastTransition: Transition = {
  duration: 0.15,
  ease: easings.easeOut,
};

// Smooth spring transition
export const springTransition: Transition = easings.spring;

// Check for reduced motion preference
export const getReducedMotionTransition = (): Transition => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { duration: 0.01 };
  }
  return defaultTransition;
};

/**
 * Common Animation Variants
 */

// Fade animations
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    transition: fastTransition,
  },
};

// Fade up (slide from bottom)
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: fastTransition,
  },
};

// Fade down (slide from top)
export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: fastTransition,
  },
};

// Scale animations
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: fastTransition,
  },
};

// Pop animation (bouncy scale)
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: easings.bouncy,
  },
};

// Slide in from left
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: fastTransition,
  },
};

// Slide in from right
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: fastTransition,
  },
};

// Stagger children animation
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
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

// List item animation (for stagger)
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: fastTransition,
  },
};

// Card hover animation
export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springTransition,
  },
  tap: {
    scale: 0.98,
    transition: fastTransition,
  },
};

// Button hover/tap animation
export const buttonVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: fastTransition,
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Ripple effect animation
export const rippleVariants: Variants = {
  hidden: { scale: 0, opacity: 0.5 },
  visible: {
    scale: 2,
    opacity: 0,
    transition: { duration: 0.6, ease: easings.easeOut },
  },
};

// Progress bar animation
export const progressVariants: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (progress: number) => ({
    scaleX: progress / 100,
    transition: { duration: 0.5, ease: easings.easeOut },
  }),
};

// Rotate animation
export const rotateVariants: Variants = {
  hidden: { rotate: -180, opacity: 0 },
  visible: {
    rotate: 0,
    opacity: 1,
    transition: easings.bouncy,
  },
};

// Page transition variants
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.easeInOut,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Modal/Dialog animation
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: fastTransition,
  },
};

// Backdrop animation
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Notification/Toast animation
export const notificationVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: easings.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: fastTransition,
  },
};

// Skeleton loading shimmer
export const shimmerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

// Pulse animation for loading states
export const pulseVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: easings.easeInOut,
    },
  },
};

// Float animation
export const floatVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 0, -8],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: easings.easeInOut,
    },
  },
};

// Badge notification animation
export const badgeVariants: Variants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: easings.bouncy,
  },
  exit: {
    scale: 0,
    transition: fastTransition,
  },
};

/**
 * Utility Functions
 */

// Create stagger delay for list items
export const getStaggerDelay = (index: number, baseDelay = 0.05): number => {
  return index * baseDelay;
};

// Get transition based on reduced motion preference
export const getTransition = (transition: Transition = defaultTransition): Transition => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { duration: 0.01 };
  }
  return transition;
};

// Variants factory for custom animations
export const createVariants = (
  hiddenState: Record<string, unknown>,
  visibleState: Record<string, unknown>,
  transition: Transition = defaultTransition
): Variants => ({
  hidden: hiddenState,
  visible: { ...visibleState, transition: getTransition(transition) },
} as Variants);
