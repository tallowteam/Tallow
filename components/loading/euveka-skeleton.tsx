'use client';

/**
 * EUVEKA Skeleton Components
 * Loading skeletons following EUVEKA design specifications:
 * - Skeleton background: #e5dac7 (light) / #544a36 (dark)
 * - Shimmer animation with warm gradient
 * - Pill-shaped skeleton for buttons (60px radius)
 * - Card skeleton with 24px radius
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// EUVEKA COLOR TOKENS
// ============================================================================

/**
 * EUVEKA skeleton color tokens for reference.
 * These colors are applied via Tailwind classes in the components below.
 *
 * Light mode:
 *   - background: #e5dac7
 *   - backgroundSubtle: rgba(229, 218, 199, 0.5)
 *   - shimmer: rgba(178, 152, 125, 0.2) (#b2987d with opacity)
 *
 * Dark mode:
 *   - background: #544a36
 *   - backgroundSubtle: rgba(84, 74, 54, 0.5)
 *   - shimmer: rgba(178, 152, 125, 0.15) (#b2987d with opacity)
 */

// ============================================================================
// SKELETON BASE COMPONENT
// ============================================================================

export interface EuvekaSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant determines border radius
   * - default: 12px (rounded-xl)
   * - pill: 60px (EUVEKA pill shape for buttons)
   * - card: 24px (EUVEKA card radius)
   * - circular: 9999px (perfect circle)
   */
  variant?: 'default' | 'pill' | 'card' | 'circular';
  /**
   * Animation type
   * - shimmer: Moving gradient (default)
   * - pulse: Opacity pulse
   * - none: No animation
   */
  animation?: 'shimmer' | 'pulse' | 'none';
  /** Fixed width in pixels or CSS value */
  width?: string | number;
  /** Fixed height in pixels or CSS value */
  height?: string | number;
  /** Delay animation start (for staggered loading) */
  delay?: number;
}

const radiusMap = {
  default: 'rounded-xl', // 12px
  pill: 'rounded-[60px]', // EUVEKA pill
  card: 'rounded-3xl', // 24px
  circular: 'rounded-full', // 9999px
};

export const EuvekaSkeleton = React.forwardRef<HTMLDivElement, EuvekaSkeletonProps>(
  (
    {
      className,
      variant = 'default',
      animation = 'shimmer',
      width,
      height,
      delay = 0,
      style,
      ...props
    },
    ref
  ) => {
    const inlineStyles: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      animationDelay: delay ? `${delay}ms` : undefined,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          // EUVEKA skeleton background colors
          'bg-[#e5dac7] dark:bg-[#544a36]',
          radiusMap[variant],
          animation === 'pulse' && 'animate-pulse',
          animation === 'shimmer' && 'euveka-skeleton-shimmer',
          className
        )}
        style={inlineStyles}
        aria-hidden="true"
        role="presentation"
        {...props}
      >
        {animation === 'shimmer' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b2987d]/20 dark:via-[#b2987d]/10 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: 'linear',
              delay: delay / 1000,
            }}
          />
        )}
      </div>
    );
  }
);

EuvekaSkeleton.displayName = 'EuvekaSkeleton';

// ============================================================================
// EUVEKA SKELETON TEXT
// ============================================================================

export interface EuvekaSkeletonTextProps extends Omit<EuvekaSkeletonProps, 'variant'> {
  /** Number of text lines */
  lines?: number;
  /** Width of last line as percentage (for natural text appearance) */
  lastLineWidth?: string;
}

export const EuvekaSkeletonText = React.forwardRef<HTMLDivElement, EuvekaSkeletonTextProps>(
  ({ className, lines = 1, lastLineWidth = '75%', height = 16, ...props }, ref) => {
    if (lines === 1) {
      return (
        <EuvekaSkeleton
          ref={ref}
          variant="default"
          height={height}
          className={cn('w-full', className)}
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <EuvekaSkeleton
            key={i}
            variant="default"
            height={height}
            className={i === lines - 1 ? '' : 'w-full'}
            style={i === lines - 1 ? { width: lastLineWidth } : undefined}
            delay={i * 50}
          />
        ))}
      </div>
    );
  }
);

EuvekaSkeletonText.displayName = 'EuvekaSkeletonText';

// ============================================================================
// EUVEKA SKELETON AVATAR
// ============================================================================

export interface EuvekaSkeletonAvatarProps extends Omit<EuvekaSkeletonProps, 'variant'> {
  /** Size in pixels */
  size?: number;
}

export const EuvekaSkeletonAvatar = React.forwardRef<HTMLDivElement, EuvekaSkeletonAvatarProps>(
  ({ size = 48, className, ...props }, ref) => (
    <EuvekaSkeleton
      ref={ref}
      variant="circular"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      {...props}
    />
  )
);

EuvekaSkeletonAvatar.displayName = 'EuvekaSkeletonAvatar';

// ============================================================================
// EUVEKA SKELETON BUTTON (Pill Shape - 60px radius)
// ============================================================================

export interface EuvekaSkeletonButtonProps extends Omit<EuvekaSkeletonProps, 'variant'> {
  /** Button size preset */
  size?: 'sm' | 'md' | 'lg';
}

const buttonSizes = {
  sm: { width: 80, height: 36 },
  md: { width: 120, height: 44 },
  lg: { width: 160, height: 56 },
};

export const EuvekaSkeletonButton = React.forwardRef<HTMLDivElement, EuvekaSkeletonButtonProps>(
  ({ size = 'md', width, height, className, ...props }, ref) => {
    const defaultSize = buttonSizes[size];
    return (
      <EuvekaSkeleton
        ref={ref}
        variant="pill"
        width={width || defaultSize.width}
        height={height || defaultSize.height}
        className={className}
        {...props}
      />
    );
  }
);

EuvekaSkeletonButton.displayName = 'EuvekaSkeletonButton';

// ============================================================================
// EUVEKA SKELETON CARD (24px radius)
// ============================================================================

export interface EuvekaSkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show header section */
  showHeader?: boolean;
  /** Show avatar in header */
  showAvatar?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Show footer with actions */
  showFooter?: boolean;
  /** Animation delay */
  delay?: number;
}

export const EuvekaSkeletonCard = React.forwardRef<HTMLDivElement, EuvekaSkeletonCardProps>(
  (
    {
      className,
      showHeader = true,
      showAvatar = true,
      contentLines = 3,
      showFooter = false,
      delay = 0,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        // EUVEKA card styling
        'rounded-3xl p-6 space-y-4',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]',
        className
      )}
      {...props}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4">
          {showAvatar && <EuvekaSkeletonAvatar delay={delay} />}
          <div className="flex-1 space-y-2">
            <EuvekaSkeleton height={18} className="w-3/4" delay={delay + 50} />
            <EuvekaSkeleton height={14} className="w-1/2" delay={delay + 100} />
          </div>
        </div>
      )}

      {/* Content */}
      {contentLines > 0 && (
        <EuvekaSkeletonText
          lines={contentLines}
          lastLineWidth="65%"
          delay={delay + 150}
        />
      )}

      {/* Footer */}
      {showFooter && (
        <div className="flex justify-end gap-3 pt-2">
          <EuvekaSkeletonButton size="sm" delay={delay + 200} />
          <EuvekaSkeletonButton size="sm" delay={delay + 250} />
        </div>
      )}
    </div>
  )
);

EuvekaSkeletonCard.displayName = 'EuvekaSkeletonCard';

// ============================================================================
// EUVEKA SKELETON PROGRESS BAR
// ============================================================================

export interface EuvekaSkeletonProgressProps extends Omit<EuvekaSkeletonProps, 'variant'> {
  /** Show percentage text */
  showLabel?: boolean;
}

export const EuvekaSkeletonProgress = React.forwardRef<HTMLDivElement, EuvekaSkeletonProgressProps>(
  ({ className, showLabel = false, delay = 0, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between">
          <EuvekaSkeleton height={12} width={80} delay={delay} />
          <EuvekaSkeleton height={12} width={40} delay={delay + 50} />
        </div>
      )}
      <EuvekaSkeleton
        variant="pill"
        height={8}
        className="w-full"
        delay={delay + 100}
      />
    </div>
  )
);

EuvekaSkeletonProgress.displayName = 'EuvekaSkeletonProgress';

// ============================================================================
// EUVEKA SKELETON ICON
// ============================================================================

export interface EuvekaSkeletonIconProps extends Omit<EuvekaSkeletonProps, 'variant'> {
  /** Size in pixels */
  size?: number;
}

export const EuvekaSkeletonIcon = React.forwardRef<HTMLDivElement, EuvekaSkeletonIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <EuvekaSkeleton
      ref={ref}
      variant="default"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      {...props}
    />
  )
);

EuvekaSkeletonIcon.displayName = 'EuvekaSkeletonIcon';

// ============================================================================
// EUVEKA SKELETON WITH FADE TRANSITION
// ============================================================================

export interface EuvekaSkeletonTransitionProps {
  /** Whether content is loading */
  isLoading: boolean;
  /** Skeleton to show while loading */
  skeleton: React.ReactNode;
  /** Content to show when loaded */
  children: React.ReactNode;
  /** Fade animation duration in seconds */
  duration?: number;
}

export function EuvekaSkeletonTransition({
  isLoading,
  skeleton,
  children,
  duration = 0.3,
}: EuvekaSkeletonTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  EuvekaSkeleton as Skeleton,
  EuvekaSkeletonText as SkeletonText,
  EuvekaSkeletonAvatar as SkeletonAvatar,
  EuvekaSkeletonButton as SkeletonButton,
  EuvekaSkeletonCard as SkeletonCard,
  EuvekaSkeletonProgress as SkeletonProgress,
  EuvekaSkeletonIcon as SkeletonIcon,
  EuvekaSkeletonTransition as SkeletonTransition,
};
