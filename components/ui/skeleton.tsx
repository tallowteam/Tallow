'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { shimmerVariants } from '@/lib/animations/motion-config';

/**
 * EUVEKA Skeleton Component
 *
 * Design Specifications:
 * - Border-radius: 12px (rounded-xl) default, rounded-full for circular
 * - Uses EUVEKA muted colors for placeholder
 *
 * Colors:
 * - Background: #e5dac7/50 (light) / #544a36/50 (dark)
 * - Shimmer: warm gradient
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  animation?: 'shimmer' | 'pulse' | 'none';
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'default',
      animation = 'shimmer',
      width,
      height,
      style,
      ...props
    },
    ref
  ) => {
    // EUVEKA rounded variants
    const variantClasses = {
      default: 'rounded-xl',
      text: 'rounded-md h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
    };

    const animationClasses = {
      shimmer: 'skeleton-shimmer',
      pulse: 'animate-pulse',
      none: '',
    };

    const inlineStyles: React.CSSProperties = {
      width: width || undefined,
      height: height || undefined,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          // EUVEKA muted background
          'bg-[#e5dac7]/50 dark:bg-[#544a36]/50',
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        style={inlineStyles}
        {...props}
      >
        {animation === 'shimmer' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b2987d]/10 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Skeleton Text
 * Pre-configured skeleton for text loading
 */
export const SkeletonText = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'variant'>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="text"
    className={cn('w-full', className)}
    {...props}
  />
));

SkeletonText.displayName = 'SkeletonText';

/**
 * Skeleton Avatar
 * Pre-configured skeleton for avatar/profile images
 */
export const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'variant'>
>(({ className, width = 40, height = 40, ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="circular"
    width={width}
    height={height}
    className={className}
    {...props}
  />
));

SkeletonAvatar.displayName = 'SkeletonAvatar';

/**
 * EUVEKA Skeleton Button
 * Pre-configured skeleton for button loading (pill shape)
 */
export const SkeletonButton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'variant'>
>(({ className, width = 120, height = 56, ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="default"
    width={width}
    height={height}
    // EUVEKA pill shape
    className={cn('rounded-[60px]', className)}
    {...props}
  />
));

SkeletonButton.displayName = 'SkeletonButton';

/**
 * EUVEKA Skeleton Card
 * Pre-configured skeleton for card loading
 */
export const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // EUVEKA card styling
      'rounded-3xl p-8 space-y-4',
      'bg-[#fefefc] dark:bg-[#191610]',
      'border border-[#e5dac7] dark:border-[#544a36]',
      className
    )}
    {...props}
  >
    {children || (
      <>
        <div className="flex items-center gap-4">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <SkeletonText className="w-3/4" />
            <SkeletonText className="w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonText />
          <SkeletonText className="w-5/6" />
        </div>
      </>
    )}
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Component-Specific Skeleton Screens
 */

/**
 * EUVEKA Device List Skeleton
 * Loading state for device discovery
 */
export function DeviceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610]"
        >
          <SkeletonAvatar width={48} height={48} />
          <div className="flex-1 space-y-2">
            <SkeletonText className="w-2/3" />
            <SkeletonText className="w-1/2 h-3" />
          </div>
          <Skeleton width={80} height={32} className="rounded-[60px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * EUVEKA Transfer Card Skeleton
 * Loading state for file transfers
 */
export function TransferCardSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-6 rounded-3xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610]"
        >
          <Skeleton width={48} height={48} />
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <SkeletonText className="w-3/4" />
              <SkeletonText className="w-1/2 h-3" />
            </div>
            <Skeleton height={8} className="w-full rounded-full" />
            <div className="flex justify-between">
              <SkeletonText className="w-24 h-3" />
              <SkeletonText className="w-20 h-3" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton width={36} height={36} variant="circular" />
            <Skeleton width={36} height={36} variant="circular" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * EUVEKA File List Skeleton
 * Loading state for file selection
 */
export function FileListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610]"
        >
          <Skeleton width={40} height={40} />
          <div className="flex-1 space-y-2">
            <SkeletonText className="w-2/3" />
            <SkeletonText className="w-1/3 h-3" />
          </div>
          <Skeleton width={20} height={20} variant="circular" />
        </div>
      ))}
    </div>
  );
}

/**
 * EUVEKA Settings Skeleton
 * Loading state for settings page
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton width={200} height={32} />
        <SkeletonText className="w-1/2" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-5 rounded-2xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610]"
          >
            <div className="flex-1 space-y-2">
              <SkeletonText className="w-1/3" />
              <SkeletonText className="w-2/3 h-3" />
            </div>
            <Skeleton width={52} height={28} className="rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * EUVEKA Transfer Progress Skeleton
 * Loading state during transfer initialization
 */
export function TransferProgressSkeleton() {
  return (
    <div className="space-y-4 p-8 rounded-3xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610]">
      <div className="flex items-center gap-4">
        <Skeleton width={64} height={64} />
        <div className="flex-1 space-y-2">
          <SkeletonText className="w-3/4" />
          <SkeletonText className="w-1/2 h-3" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton height={12} className="w-full rounded-full" />
        <div className="flex justify-between">
          <SkeletonText className="w-24 h-3" />
          <SkeletonText className="w-20 h-3" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <SkeletonButton width={100} height={44} />
        <SkeletonButton width={100} height={44} />
      </div>
    </div>
  );
}

/**
 * Grid Skeleton
 * Generic grid loading state
 */
export function GridSkeleton({
  columns = 3,
  rows = 2
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export { Skeleton };
