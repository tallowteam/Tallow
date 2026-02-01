'use client';

/**
 * Motion Animation Utility Components
 * Reusable Framer Motion components for consistent animations
 * Includes reduced motion support for accessibility
 */

import * as React from 'react';
import {
  motion,
  HTMLMotionProps,
  useReducedMotion,
  Variants,
} from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Base props for motion components
 */
interface MotionBaseProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FadeIn - Fade in on scroll with optional vertical offset
 * Perfect for section content that appears as user scrolls
 */
export interface FadeInProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Vertical offset for slide effect (pixels) */
  offset?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Whether to only animate once */
  once?: boolean;
  /** Viewport margin for triggering animation */
  margin?: string;
}

export const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  (
    {
      children,
      delay = 0,
      offset = 20,
      duration = 0.5,
      once = true,
      margin = '-50px',
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: offset }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, margin }}
        transition={
          prefersReducedMotion
            ? { duration: 0.01 }
            : { duration, delay, ease: [0.4, 0, 0.2, 1] }
        }
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

FadeIn.displayName = 'FadeIn';

/**
 * ScaleOnHover - Scale animation on hover with tap feedback
 * Perfect for interactive cards and buttons
 */
export interface ScaleOnHoverProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Scale factor on hover (default 1.02) */
  scale?: number;
  /** Scale factor on tap (default 0.98) */
  tapScale?: number;
  /** Disable animations (e.g., when element is disabled) */
  disabled?: boolean;
}

export const ScaleOnHover = React.forwardRef<HTMLDivElement, ScaleOnHoverProps>(
  (
    { children, scale = 1.02, tapScale = 0.98, disabled = false, className, ...props },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion || disabled) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: tapScale }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

ScaleOnHover.displayName = 'ScaleOnHover';

/**
 * StaggerContainer - Container for staggered child animations
 * Use with StaggerItem for sequential entrance animations
 */
export interface StaggerContainerProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Delay between each child animation (seconds) */
  staggerDelay?: number;
  /** Initial delay before first child animates (seconds) */
  delayChildren?: number;
  /** Whether to only animate once on viewport entry */
  once?: boolean;
}

export const StaggerContainer = React.forwardRef<HTMLDivElement, StaggerContainerProps>(
  (
    {
      children,
      staggerDelay = 0.08,
      delayChildren = 0.1,
      once = true,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren,
            },
          },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerContainer.displayName = 'StaggerContainer';

/**
 * StaggerItem - Child item for StaggerContainer
 * Animates with stagger effect when parent becomes visible
 */
export interface StaggerItemProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
}

const staggerItemVariants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  },
  left: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  },
  right: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  },
};

export const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, direction = 'up', className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        variants={staggerItemVariants[direction]}
        className={className}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerItem.displayName = 'StaggerItem';

/**
 * SlideIn - Slide in from specified direction
 * Perfect for page sections and modal content
 */
export interface SlideInProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Direction to slide from */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Animation delay (seconds) */
  delay?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Distance to slide (pixels) */
  distance?: number;
  /** Whether to only animate once on viewport entry */
  once?: boolean;
}

export const SlideIn = React.forwardRef<HTMLDivElement, SlideInProps>(
  (
    {
      children,
      direction = 'left',
      delay = 0,
      duration = 0.5,
      distance = 50,
      once = true,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const getInitial = () => {
      switch (direction) {
        case 'left':
          return { opacity: 0, x: -distance };
        case 'right':
          return { opacity: 0, x: distance };
        case 'up':
          return { opacity: 0, y: distance };
        case 'down':
          return { opacity: 0, y: -distance };
        default:
          return { opacity: 0, x: -distance };
      }
    };

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={getInitial()}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once, margin: '-50px' }}
        transition={{
          duration,
          delay,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

SlideIn.displayName = 'SlideIn';

/**
 * GlowPulse - Pulsing glow animation for highlights and CTAs
 * Perfect for drawing attention to important elements
 */
export interface GlowPulseProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Glow color (CSS color value) */
  color?: string;
  /** Glow intensity (shadow blur radius) */
  intensity?: number;
  /** Animation duration for one pulse cycle (seconds) */
  duration?: number;
  /** Whether the glow should pulse continuously */
  continuous?: boolean;
}

export const GlowPulse = React.forwardRef<HTMLDivElement, GlowPulseProps>(
  (
    {
      children,
      color = 'rgba(59, 130, 246, 0.5)',
      intensity = 20,
      duration = 2,
      continuous = true,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div
          ref={ref}
          className={className}
          style={{ boxShadow: `0 0 ${intensity}px ${color}` }}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        animate={
          continuous
            ? {
                boxShadow: [
                  `0 0 ${intensity * 0.5}px ${color}`,
                  `0 0 ${intensity}px ${color}`,
                  `0 0 ${intensity * 1.5}px ${color}`,
                  `0 0 ${intensity}px ${color}`,
                  `0 0 ${intensity * 0.5}px ${color}`,
                ],
              }
            : undefined
        }
        whileHover={
          !continuous
            ? {
                boxShadow: `0 0 ${intensity * 1.5}px ${color}`,
              }
            : undefined
        }
        transition={
          continuous
            ? {
                duration,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {
                duration: 0.3,
              }
        }
        className={className}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

GlowPulse.displayName = 'GlowPulse';

/**
 * Reveal - Clip-path reveal animation
 * Perfect for dramatic content reveals
 */
export interface RevealProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Direction of reveal */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Animation delay (seconds) */
  delay?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Whether to only animate once */
  once?: boolean;
}

export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(
  (
    { children, direction = 'up', delay = 0, duration = 0.8, once = true, className, ...props },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const getClipPath = () => {
      switch (direction) {
        case 'up':
          return { initial: 'inset(100% 0 0 0)', animate: 'inset(0 0 0 0)' };
        case 'down':
          return { initial: 'inset(0 0 100% 0)', animate: 'inset(0 0 0 0)' };
        case 'left':
          return { initial: 'inset(0 100% 0 0)', animate: 'inset(0 0 0 0)' };
        case 'right':
          return { initial: 'inset(0 0 0 100%)', animate: 'inset(0 0 0 0)' };
        default:
          return { initial: 'inset(100% 0 0 0)', animate: 'inset(0 0 0 0)' };
      }
    };

    const clipPath = getClipPath();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ clipPath: clipPath.initial }}
        whileInView={{ clipPath: clipPath.animate }}
        viewport={{ once, margin: '-50px' }}
        transition={{
          duration,
          delay,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

Reveal.displayName = 'Reveal';

/**
 * Bounce - Bouncy entrance animation
 * Perfect for notifications, badges, and playful elements
 */
export interface BounceProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Animation delay (seconds) */
  delay?: number;
  /** Whether to only animate once */
  once?: boolean;
}

export const Bounce = React.forwardRef<HTMLDivElement, BounceProps>(
  ({ children, delay = 0, once = true, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.3 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 15,
          delay,
        }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

Bounce.displayName = 'Bounce';

/**
 * Float - Subtle floating animation
 * Perfect for decorative elements and backgrounds
 */
export interface FloatProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Floating distance (pixels) */
  distance?: number;
  /** Animation duration for one cycle (seconds) */
  duration?: number;
}

export const Float = React.forwardRef<HTMLDivElement, FloatProps>(
  ({ children, distance = 10, duration = 3, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        animate={{
          y: [-distance, distance, -distance],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

Float.displayName = 'Float';

/**
 * Rotate - Continuous rotation animation
 * Perfect for loading indicators and decorative elements
 */
export interface RotateProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Rotation duration for one full cycle (seconds) */
  duration?: number;
  /** Rotation direction */
  direction?: 'clockwise' | 'counterclockwise';
}

export const Rotate = React.forwardRef<HTMLDivElement, RotateProps>(
  ({ children, duration = 2, direction = 'clockwise', className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        animate={{
          rotate: direction === 'clockwise' ? 360 : -360,
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

Rotate.displayName = 'Rotate';

/**
 * Shake - Attention-grabbing shake animation
 * Perfect for error states and form validation
 */
export interface ShakeProps
  extends MotionBaseProps,
    Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Whether to trigger the shake */
  trigger?: boolean;
  /** Shake intensity (pixels) */
  intensity?: number;
}

export const Shake = React.forwardRef<HTMLDivElement, ShakeProps>(
  ({ children, trigger = false, intensity = 10, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        animate={
          trigger
            ? {
                x: [0, -intensity, intensity, -intensity, intensity, 0],
              }
            : { x: 0 }
        }
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
        className={className}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }
);

Shake.displayName = 'Shake';

/**
 * TypeWriter - Typewriter text animation effect
 * Perfect for hero headlines and attention-grabbing text
 */
export interface TypeWriterProps {
  /** Text to animate */
  text: string;
  /** Delay between each character (seconds) */
  charDelay?: number;
  /** Initial delay before starting (seconds) */
  startDelay?: number;
  /** Class name for the container */
  className?: string;
  /** Class name for the cursor */
  cursorClassName?: string;
  /** Show blinking cursor */
  showCursor?: boolean;
}

export function TypeWriter({
  text,
  charDelay = 0.05,
  startDelay = 0,
  className,
  cursorClassName,
  showCursor = true,
}: TypeWriterProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn('inline-flex', className)}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: startDelay + index * charDelay,
            duration: 0.01,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      {showCursor && (
        <motion.span
          className={cn('ml-0.5', cursorClassName)}
          animate={{ opacity: [1, 0, 1] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            times: [0, 0.5, 1],
          }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

TypeWriter.displayName = 'TypeWriter';
