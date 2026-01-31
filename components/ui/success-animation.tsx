'use client';

/**
 * EUVEKA Success Animation Components
 *
 * Elegant checkmark and completion animations with EUVEKA styling
 *
 * EUVEKA Micro-Interactions:
 * - Easing: [0.16, 1, 0.3, 1] (custom expo-out)
 * - Path drawing animation for checkmark
 * - Spring physics for organic feel
 * - Reduced motion support
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// EUVEKA ANIMATION TOKENS
// =============================================================================

// EUVEKA signature easing curve
const EUVEKA_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1];

// EUVEKA transition configurations
const euvekaTransition: Transition = {
  duration: 0.3,
  ease: EUVEKA_EASING,
};

// Note: euvekaTransitionSlow exported for future use
export const euvekaTransitionSlow: Transition = {
  duration: 0.5,
  ease: EUVEKA_EASING,
};

// =============================================================================
// EUVEKA SUCCESS ANIMATION VARIANTS
// =============================================================================

/**
 * EUVEKA Checkmark path animation
 * Draw path animation with EUVEKA easing
 */
const euvekaCheckmarkPathVariants: Variants = {
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
        ease: EUVEKA_EASING,
        delay: 0.15,
      },
      opacity: {
        duration: 0.1,
        delay: 0.1,
      },
    },
  },
};

/**
 * EUVEKA Circle animation
 * Circle draws before checkmark with EUVEKA easing
 */
const euvekaCircleVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.35,
        ease: EUVEKA_EASING,
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
};

/**
 * EUVEKA Container animation
 * Scale and fade in with EUVEKA spring physics
 */
const euvekaContainerVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: EUVEKA_EASING,
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: EUVEKA_EASING,
    },
  },
};

/**
 * EUVEKA Completion badge variants
 * Pop in effect with rotation
 */
const euvekaCompletionBadgeVariants: Variants = {
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
      duration: 0.5,
      ease: EUVEKA_EASING,
      delay: 0.2,
    },
  },
};

/**
 * EUVEKA Confetti animation
 */
const euvekaConfettiVariants: Variants = {
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
      ease: EUVEKA_EASING,
    },
  }),
};

// =============================================================================
// SUCCESS CHECKMARK
// =============================================================================

export interface SuccessCheckmarkProps {
  /** Whether to show the animation */
  show: boolean;
  /** Size in pixels */
  size?: number;
  /** Stroke color - defaults to EUVEKA success green */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Show circle around checkmark */
  showCircle?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  className?: string;
}

export function SuccessCheckmark({
  show,
  size = 64,
  color = '#22c55e',
  strokeWidth = 3,
  showCircle = true,
  onAnimationComplete,
  className,
}: SuccessCheckmarkProps) {
  const prefersReducedMotion = useReducedMotion();

  const animationCompleteProps = onAnimationComplete
    ? { onAnimationComplete }
    : {};

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn('flex items-center justify-center', className)}
          variants={prefersReducedMotion ? {} : euvekaContainerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          {...animationCompleteProps}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            aria-label="Success"
            role="img"
          >
            {/* Circle */}
            {showCircle && (
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                variants={prefersReducedMotion ? {} : euvekaCircleVariants}
                initial="initial"
                animate="animate"
              />
            )}
            {/* Checkmark */}
            <motion.path
              d="M20 32L28 40L44 24"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={prefersReducedMotion ? {} : euvekaCheckmarkPathVariants}
              initial="initial"
              animate="animate"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// EUVEKA SUCCESS CHECKMARK (Themed variant)
// =============================================================================

export interface EuvekaSuccessCheckmarkProps {
  /** Whether to show the animation */
  show: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant - uses EUVEKA warm neutrals */
  variant?: 'success' | 'primary' | 'muted';
  /** Show circle around checkmark */
  showCircle?: boolean;
  /** Show glow effect */
  showGlow?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  className?: string;
}

export function EuvekaSuccessCheckmark({
  show,
  size = 'md',
  variant = 'success',
  showCircle = true,
  showGlow = true,
  onAnimationComplete,
  className,
}: EuvekaSuccessCheckmarkProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizeConfig = {
    sm: { size: 48, strokeWidth: 2.5 },
    md: { size: 64, strokeWidth: 3 },
    lg: { size: 80, strokeWidth: 3.5 },
    xl: { size: 96, strokeWidth: 4 },
  };

  const colorConfig = {
    success: '#22c55e',
    primary: '#191610',
    muted: '#b2987d',
  };

  const glowConfig = {
    success: 'rgba(34, 197, 94, 0.3)',
    primary: 'rgba(25, 22, 16, 0.2)',
    muted: 'rgba(178, 152, 125, 0.25)',
  };

  const { size: svgSize, strokeWidth } = sizeConfig[size];
  const color = colorConfig[variant];
  const glowColor = glowConfig[variant];

  const animationCompleteProps = onAnimationComplete
    ? { onAnimationComplete }
    : {};

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn('relative flex items-center justify-center', className)}
          variants={prefersReducedMotion ? {} : euvekaContainerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          {...animationCompleteProps}
        >
          {/* Glow effect */}
          {showGlow && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 0.6],
                scale: [0.5, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                ease: EUVEKA_EASING,
              }}
              aria-hidden="true"
            />
          )}

          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 64 64"
            fill="none"
            aria-label="Success"
            role="img"
            className="relative z-10"
          >
            {/* Circle */}
            {showCircle && (
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                variants={prefersReducedMotion ? {} : euvekaCircleVariants}
                initial="initial"
                animate="animate"
              />
            )}
            {/* Checkmark */}
            <motion.path
              d="M20 32L28 40L44 24"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={prefersReducedMotion ? {} : euvekaCheckmarkPathVariants}
              initial="initial"
              animate="animate"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// COMPLETION BADGE
// =============================================================================

export interface CompletionBadgeProps {
  /** Whether to show the badge */
  show: boolean;
  /** Badge content (icon or text) */
  children: React.ReactNode;
  /** Badge variant */
  variant?: 'success' | 'info' | 'warning';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompletionBadge({
  show,
  children,
  variant = 'success',
  size = 'md',
  className,
}: CompletionBadgeProps) {
  const prefersReducedMotion = useReducedMotion();

  const variantClasses = {
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'flex items-center justify-center rounded-full border',
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          variants={prefersReducedMotion ? {} : euvekaCompletionBadgeVariants}
          initial="initial"
          animate="animate"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// SUCCESS MESSAGE
// =============================================================================

export interface SuccessMessageProps {
  /** Whether to show the message */
  show: boolean;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom icon (defaults to checkmark) */
  icon?: React.ReactNode;
  /** Action button */
  action?: React.ReactNode;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  className?: string;
}

export function SuccessMessage({
  show,
  title = 'Success!',
  description,
  icon,
  action,
  onAnimationComplete,
  className,
}: SuccessMessageProps) {
  const prefersReducedMotion = useReducedMotion();
  const animationCompletePropsMsgContainer = onAnimationComplete
    ? { onAnimationComplete }
    : {};

  // EUVEKA stagger animation for content
  const contentItemVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: euvekaTransition,
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'flex flex-col items-center justify-center text-center p-8',
            className
          )}
          variants={prefersReducedMotion ? {} : euvekaContainerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          {...animationCompletePropsMsgContainer}
        >
          {/* Icon */}
          <div className="mb-4">
            {icon || <EuvekaSuccessCheckmark show size="lg" showGlow />}
          </div>

          {/* Title */}
          <motion.h3
            className="text-xl font-semibold text-[#191610] dark:text-[#fefefc] mb-2"
            variants={prefersReducedMotion ? {} : contentItemVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            {title}
          </motion.h3>

          {/* Description */}
          {description && (
            <motion.p
              className="text-[#b2987d] max-w-sm"
              variants={prefersReducedMotion ? {} : contentItemVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            >
              {description}
            </motion.p>
          )}

          {/* Action */}
          {action && (
            <motion.div
              className="mt-6"
              variants={prefersReducedMotion ? {} : contentItemVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.5 }}
            >
              {action}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// CONFETTI CELEBRATION
// =============================================================================

interface ConfettiParticle {
  id: number;
  x: number;
  rotation: number;
  color: string;
}

export interface ConfettiCelebrationProps {
  /** Whether to trigger confetti */
  trigger: boolean;
  /** Number of particles */
  particleCount?: number;
  /** Confetti colors - defaults to EUVEKA palette */
  colors?: string[];
  /** Duration before cleanup (ms) */
  duration?: number;
  className?: string;
}

export function ConfettiCelebration({
  trigger,
  particleCount = 20,
  colors = ['#22c55e', '#b2987d', '#191610', '#e5dac7', '#544a36'],
  duration = 1500,
  className,
}: ConfettiCelebrationProps) {
  const [particles, setParticles] = React.useState<ConfettiParticle[]>([]);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      const newParticles: ConfettiParticle[] = Array.from(
        { length: particleCount },
        (_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 200,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)] ?? '#22c55e',
        })
      );
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trigger, particleCount, colors, duration, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-sm"
            style={{ backgroundColor: particle.color }}
            custom={{ x: particle.x, rotation: particle.rotation }}
            variants={euvekaConfettiVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TRANSFER COMPLETE ANIMATION
// =============================================================================

export interface TransferCompleteProps {
  /** Whether to show the animation */
  show: boolean;
  /** Number of files transferred */
  fileCount?: number;
  /** Total size transferred */
  totalSize?: string;
  /** Transfer speed */
  speed?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
  className?: string;
}

export function TransferComplete({
  show,
  fileCount = 1,
  totalSize,
  speed,
  onDismiss,
  className,
}: TransferCompleteProps) {
  const prefersReducedMotion = useReducedMotion();

  // EUVEKA stagger animation for content
  const contentItemVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: euvekaTransition,
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'relative p-6 rounded-3xl',
            'bg-[#fefefc] dark:bg-[#191610]',
            'border border-[#e5dac7] dark:border-[#544a36]',
            'shadow-[0_8px_32px_-8px_rgba(25,22,16,0.15)]',
            'dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]',
            className
          )}
          variants={prefersReducedMotion ? {} : euvekaContainerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Confetti */}
          <ConfettiCelebration trigger={show} />

          {/* Content */}
          <div className="relative flex flex-col items-center text-center">
            <EuvekaSuccessCheckmark show size="md" showGlow />

            <motion.h3
              className="mt-4 text-lg font-semibold text-[#191610] dark:text-[#fefefc]"
              variants={prefersReducedMotion ? {} : contentItemVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              Transfer Complete
            </motion.h3>

            <motion.div
              className="mt-2 text-sm text-[#b2987d] space-y-1"
              variants={prefersReducedMotion ? {} : contentItemVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            >
              <p>
                {fileCount} {fileCount === 1 ? 'file' : 'files'} transferred
                {totalSize && ` (${totalSize})`}
              </p>
              {speed && <p className="text-xs">Average speed: {speed}</p>}
            </motion.div>

            {onDismiss && (
              <motion.button
                className={cn(
                  'mt-4 px-6 py-2 text-sm font-medium rounded-[60px]',
                  'border border-[#e5dac7] dark:border-[#544a36]',
                  'text-[#191610] dark:text-[#fefefc]',
                  'hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/30',
                  'transition-all duration-300'
                )}
                variants={prefersReducedMotion ? {} : contentItemVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5 }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                onClick={onDismiss}
              >
                Done
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================
// Note: Named exports only for proper barrel re-export via components/ui/index.ts
