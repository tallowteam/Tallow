'use client';

/**
 * EUVEKA Scroll Indicator Component
 *
 * Exact replica of euveka.com scroll indicator:
 * - "SCROLL TO REVEAL" text with wide letter-spacing
 * - Mouse/scroll wheel shape with animated dot
 * - Respects prefers-reduced-motion
 */

import * as React from 'react';
import { motion, useReducedMotion, type Easing, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  EUVEKA_COLORS,
  EUVEKA_DURATIONS,
  EUVEKA_EASING,
  euvekaScrollIndicatorVariants,
} from '@/lib/animations/euveka-tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface ScrollIndicatorProps {
  /** Text to display above the scroll indicator */
  text?: string;
  /** Custom color for the indicator */
  color?: string;
  /** Position from bottom of container */
  bottom?: number | string;
  /** Additional class names */
  className?: string;
  /** Whether to show the scroll indicator */
  visible?: boolean;
  /** Callback when scroll indicator is clicked */
  onClick?: () => void;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const dotAnimateVariants: Variants = {
  animate: {
    y: [0, 12, 0],
    opacity: [0.6, 0.3, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as Easing,
    },
  },
  reducedMotion: {
    y: 6,
    opacity: 0.5,
  },
};

const textRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      delay: 1.4,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

const wheelShapeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: EUVEKA_DURATIONS.normal,
      delay: 1.3,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const ScrollIndicator = React.memo(function ScrollIndicator({
  text = 'SCROLL TO REVEAL',
  color = EUVEKA_COLORS.light,
  bottom = 32,
  className,
  visible = true,
  onClick,
}: ScrollIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: scroll to next section
      window.scrollTo({
        top: window.innerHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [onClick, prefersReducedMotion]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  if (!visible) {
    return null;
  }


  return (
    <motion.div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-4',
        'cursor-pointer select-none',
        className
      )}
      style={{ bottom }}
      variants={euvekaScrollIndicatorVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Scroll down to see more content"
    >
      {/* Text Label */}
      <motion.span
        className="text-xs font-medium uppercase"
        style={{
          letterSpacing: '0.25em',
          color: `color-mix(in srgb, ${color} 60%, transparent)`,
        }}
        variants={textRevealVariants}
      >
        {text}
      </motion.span>

      {/* Mouse/Scroll Wheel Shape */}
      <motion.div
        className="relative flex items-start justify-center p-2"
        style={{
          width: 24,
          height: 40,
          borderRadius: 12,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}
        variants={wheelShapeVariants}
        aria-hidden="true"
      >
        {/* Animated Dot */}
        <motion.div
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            backgroundColor: `color-mix(in srgb, ${color} 60%, transparent)`,
          }}
          variants={dotAnimateVariants}
          animate={prefersReducedMotion ? 'reducedMotion' : 'animate'}
        />
      </motion.div>
    </motion.div>
  );
});

ScrollIndicator.displayName = 'ScrollIndicator';

// =============================================================================
// ALTERNATIVE: LINE SCROLL INDICATOR
// =============================================================================

export interface LineScrollIndicatorProps {
  /** Line height */
  height?: number;
  /** Custom color */
  color?: string;
  /** Position from bottom */
  bottom?: number | string;
  /** Additional class names */
  className?: string;
}

const lineVariants: Variants = {
  hidden: {
    scaleY: 0,
    opacity: 0,
  },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: {
      duration: EUVEKA_DURATIONS.slow,
      delay: 1.2,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

const lineAnimateVariants: Variants = {
  animate: {
    y: [0, 20, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as Easing,
    },
  },
};

export const LineScrollIndicator = React.memo(function LineScrollIndicator({
  height = 60,
  color = EUVEKA_COLORS.light,
  bottom = 32,
  className,
}: LineScrollIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  // Handle variants and animate props to avoid undefined issues
  const lineInnerVariants = prefersReducedMotion ? {} : lineAnimateVariants;
  const lineInnerAnimate = prefersReducedMotion ? 'initial' : 'animate';

  return (
    <motion.div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 flex flex-col items-center',
        className
      )}
      style={{ bottom }}
      variants={lineVariants}
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      {/* Animated Line */}
      <motion.div
        className="origin-top"
        style={{
          width: 1,
          height,
          background: `linear-gradient(to bottom, ${color}, transparent)`,
        }}
        variants={lineInnerVariants}
        animate={lineInnerAnimate}
      />
    </motion.div>
  );
});

LineScrollIndicator.displayName = 'LineScrollIndicator';

// =============================================================================
// ALTERNATIVE: ARROW SCROLL INDICATOR
// =============================================================================

export interface ArrowScrollIndicatorProps {
  /** Custom color */
  color?: string;
  /** Position from bottom */
  bottom?: number | string;
  /** Additional class names */
  className?: string;
  /** Callback when clicked */
  onClick?: () => void;
}

const arrowContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
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
};

const arrowAnimateVariants: Variants = {
  animate: {
    y: [0, 8, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut' as Easing,
    },
  },
};

export const ArrowScrollIndicator = React.memo(function ArrowScrollIndicator({
  color = EUVEKA_COLORS.light,
  bottom = 32,
  className,
  onClick,
}: ArrowScrollIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [onClick, prefersReducedMotion]);

  // Handle variants and animate props to avoid undefined issues
  const arrowSvgVariants = prefersReducedMotion ? {} : arrowAnimateVariants;
  const arrowSvgAnimate = prefersReducedMotion ? 'initial' : 'animate';

  return (
    <motion.button
      className={cn(
        'absolute left-1/2 -translate-x-1/2 p-4',
        'cursor-pointer hover:opacity-80 transition-opacity',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        className
      )}
      style={{ bottom }}
      variants={arrowContainerVariants}
      initial="hidden"
      animate="visible"
      onClick={handleClick}
      aria-label="Scroll down"
      type="button"
    >
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={arrowSvgVariants}
        animate={arrowSvgAnimate}
        aria-hidden="true"
      >
        <path d="M12 5v14" />
        <path d="M19 12l-7 7-7-7" />
      </motion.svg>
    </motion.button>
  );
});

ArrowScrollIndicator.displayName = 'ArrowScrollIndicator';

export default ScrollIndicator;
