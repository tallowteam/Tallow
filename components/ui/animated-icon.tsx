'use client';

/**
 * Animated Icon Component - Euveka Style
 *
 * Features:
 * - Subtle rotation on hover
 * - Scale animation
 * - Pulse effect for attention
 * - Bounce animation
 * - Reduced motion support
 */

import * as React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  iconPulseVariants,
  iconBounceVariants,
  tactileSpring,
  snappySpring,
} from '@/lib/animations/micro-interactions';

// =============================================================================
// ANIMATED ICON WRAPPER
// =============================================================================

export interface AnimatedIconProps {
  children: React.ReactNode;
  /** Animation type on hover */
  animation?: 'rotate' | 'scale' | 'bounce' | 'none';
  /** Enable pulse animation (continuous) */
  pulse?: boolean;
  /** Spin on click */
  spinOnClick?: boolean;
  /** Custom scale factor for hover */
  hoverScale?: number;
  /** Custom rotation degrees for hover */
  hoverRotation?: number;
  /** Disable all animations */
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  /** Accessible label for the button (required when onClick is provided) */
  'aria-label'?: string;
}

export function AnimatedIcon({
  children,
  animation = 'rotate',
  pulse = false,
  spinOnClick = false,
  hoverScale = 1.1,
  hoverRotation = 8,
  disabled = false,
  className,
  onClick,
  'aria-label': ariaLabel,
}: AnimatedIconProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disabled && !prefersReducedMotion;

  // Custom variants based on props
  const customVariants = {
    initial: {
      scale: 1,
      rotate: 0,
    },
    hover: {
      scale: animation === 'scale' || animation === 'rotate' ? hoverScale : 1,
      rotate: animation === 'rotate' ? hoverRotation : 0,
      transition: tactileSpring,
    },
    tap: spinOnClick
      ? {
          rotate: 180,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        }
      : {
          scale: 0.9,
          transition: snappySpring,
        },
  };

  if (!shouldAnimate) {
    if (onClick) {
      return (
        <button
          type="button"
          className={cn('inline-flex items-center justify-center bg-transparent border-0 p-0 cursor-pointer', className)}
          onClick={onClick}
          aria-label={ariaLabel}
        >
          {children}
        </button>
      );
    }
    return (
      <span className={cn('inline-flex items-center justify-center', className)} aria-hidden="true">
        {children}
      </span>
    );
  }

  // Bounce animation uses different structure
  if (animation === 'bounce') {
    return (
      <motion.span
        className={cn('inline-flex items-center justify-center', className)}
        variants={iconBounceVariants}
        initial="initial"
        whileHover="hover"
        onClick={onClick}
      >
        {children}
      </motion.span>
    );
  }

  const animateProps = pulse ? { animate: iconPulseVariants['animate'] as import('framer-motion').TargetAndTransition } : {};
  const tapProps = spinOnClick || onClick ? { whileTap: 'tap' as const } : {};

  return (
    <motion.span
      className={cn('inline-flex items-center justify-center', className)}
      variants={customVariants}
      initial="initial"
      whileHover="hover"
      {...tapProps}
      {...animateProps}
      onClick={onClick}
    >
      {children}
    </motion.span>
  );
}

// =============================================================================
// ICON BUTTON WITH MICRO-INTERACTIONS
// =============================================================================

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'ghost' | 'outline';
  /** Show loading state */
  loading?: boolean;
  /** Disable animation */
  disableAnimation?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      size = 'md',
      variant = 'default',
      loading = false,
      disableAnimation = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimation && !prefersReducedMotion && !disabled && !loading;

    const sizeClasses = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
    };

    const variantClasses = {
      default:
        'bg-[#1f1f1f] border border-[#333333] text-[#fafafc] hover:bg-[#2a2a2a] hover:border-[#444444]',
      ghost: 'bg-transparent text-[#a0a0a0] hover:text-[#fafafc] hover:bg-white/5',
      outline:
        'bg-transparent border border-[#333333] text-[#fafafc] hover:border-[#444444]',
    };

    const hoverProps = shouldAnimate ? { whileHover: { scale: 1.05 } } : {};
    const tapProps = shouldAnimate ? { whileTap: { scale: 0.95 } } : {};

    return (
      // @ts-expect-error - exactOptionalPropertyTypes conflict between React and Framer Motion types
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
          'disabled:opacity-50 disabled:pointer-events-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        disabled={disabled || loading}
        {...hoverProps}
        {...tapProps}
        transition={tactileSpring}
        {...props}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{
                rotate: { duration: 0.8, repeat: Infinity, ease: 'linear' },
              }}
            >
              <LoadingSpinner size={size} />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatedIcon animation="rotate" disabled={!shouldAnimate}>
                {children}
              </AnimatedIcon>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

// =============================================================================
// LOADING SPINNER
// =============================================================================

function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 14, md: 18, lg: 22 };
  const iconSize = sizeMap[size];

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// =============================================================================
// NOTIFICATION BADGE WITH ICON
// =============================================================================

export interface NotificationIconProps {
  children: React.ReactNode;
  /** Show notification badge */
  showBadge?: boolean;
  /** Badge count (shows number if > 0) */
  count?: number;
  /** Max count to display (shows 99+ if exceeded) */
  maxCount?: number;
  /** Badge color */
  badgeColor?: string;
  className?: string;
}

export function NotificationIcon({
  children,
  showBadge = false,
  count,
  maxCount = 99,
  badgeColor = '#ef4444',
  className,
}: NotificationIconProps) {
  const prefersReducedMotion = useReducedMotion();
  const displayCount = count && count > maxCount ? `${maxCount}+` : count;

  return (
    <span className={cn('relative inline-flex', className)}>
      <AnimatedIcon animation="scale">{children}</AnimatedIcon>

      <AnimatePresence>
        {(showBadge || (count && count > 0)) && (
          <motion.span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white rounded-full"
            style={{ backgroundColor: badgeColor }}
            initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 15 }}
          >
            {displayCount}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// =============================================================================
// TOGGLE ICON (for expand/collapse, menu, etc.)
// =============================================================================

export interface ToggleIconProps {
  /** Whether the toggle is in "open" state */
  isOpen: boolean;
  /** Icon for closed state */
  closedIcon: React.ReactNode;
  /** Icon for open state */
  openIcon: React.ReactNode;
  className?: string;
}

export function ToggleIcon({
  isOpen,
  closedIcon,
  openIcon,
  className,
}: ToggleIconProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isOpen ? 'open' : 'closed'}
          initial={prefersReducedMotion ? {} : { opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, rotate: 90, scale: 0.8 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {isOpen ? openIcon : closedIcon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================
// Note: Named exports only for proper barrel re-export via components/ui/index.ts
