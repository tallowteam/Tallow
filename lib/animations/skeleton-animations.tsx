'use client';

/**
 * Skeleton Loading Animations
 * GPU-optimized loading placeholders with shimmer effects
 * Respects reduced motion preferences
 */

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ============================================================================
 * BASE SKELETON - Foundation component
 * ============================================================================
 */

export interface SkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Enable shimmer animation */
  shimmer?: boolean;
  /** Custom className */
  className?: string;
  /** Pulse instead of shimmer */
  pulse?: boolean;
}

export function Skeleton({
  width,
  height,
  radius = 'md',
  shimmer = true,
  className,
  pulse = false,
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  const radiusClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const baseClass = cn(
    'relative overflow-hidden bg-zinc-200 dark:bg-zinc-800',
    radiusClasses[radius],
    className
  );

  if (prefersReducedMotion) {
    return <div className={baseClass} style={{ width, height }} />;
  }

  if (pulse) {
    return (
      <motion.div
        className={baseClass}
        style={{ width, height }}
        animate={{
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  return (
    <div className={baseClass} style={{ width, height }}>
      {shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

Skeleton.displayName = 'Skeleton';

/**
 * ============================================================================
 * SKELETON TEXT - Text placeholder
 * ============================================================================
 */

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Custom className */
  className?: string;
  /** Line height */
  lineHeight?: 'sm' | 'md' | 'lg';
  /** Last line width percentage */
  lastLineWidth?: number;
}

export function SkeletonText({
  lines = 3,
  className,
  lineHeight = 'md',
  lastLineWidth = 60,
}: SkeletonTextProps) {
  const heights = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5',
  };

  const gaps = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div className={cn(gaps[lineHeight], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={heights[lineHeight]}
          width={i === lines - 1 ? `${lastLineWidth}%` : '100%'}
          radius="sm"
        />
      ))}
    </div>
  );
}

SkeletonText.displayName = 'SkeletonText';

/**
 * ============================================================================
 * SKELETON CARD - Card placeholder
 * ============================================================================
 */

export interface SkeletonCardProps {
  /** Show image placeholder */
  showImage?: boolean;
  /** Image aspect ratio */
  imageAspect?: 'square' | 'video' | 'wide';
  /** Number of text lines */
  lines?: number;
  /** Custom className */
  className?: string;
}

export function SkeletonCard({
  showImage = true,
  imageAspect = 'video',
  lines = 3,
  className,
}: SkeletonCardProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  };

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border bg-card p-4 space-y-4',
        className
      )}
    >
      {showImage && (
        <Skeleton
          width="100%"
          className={aspectClasses[imageAspect]}
          radius="lg"
        />
      )}
      <div className="space-y-3">
        <Skeleton height="1.5rem" width="70%" radius="sm" />
        <SkeletonText lines={lines} lineHeight="sm" />
      </div>
    </div>
  );
}

SkeletonCard.displayName = 'SkeletonCard';

/**
 * ============================================================================
 * SKELETON LIST - List item placeholder
 * ============================================================================
 */

export interface SkeletonListProps {
  /** Number of items */
  count?: number;
  /** Show avatar */
  showAvatar?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonList({ count = 3, showAvatar = true, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton width="40px" height="40px" radius="full" />}
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="40%" radius="sm" />
            <Skeleton height="0.875rem" width="60%" radius="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonList.displayName = 'SkeletonList';

/**
 * ============================================================================
 * SKELETON TABLE - Table placeholder
 * ============================================================================
 */

export interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header */
  showHeader?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="1rem" width="60%" radius="sm" />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                height="1.5rem"
                width={colIndex === 0 ? '80%' : '60%'}
                radius="sm"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

SkeletonTable.displayName = 'SkeletonTable';

/**
 * ============================================================================
 * SKELETON AVATAR - Avatar placeholder
 * ============================================================================
 */

export interface SkeletonAvatarProps {
  /** Size of avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom className */
  className?: string;
}

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      radius="full"
    />
  );
}

SkeletonAvatar.displayName = 'SkeletonAvatar';

/**
 * ============================================================================
 * SKELETON BUTTON - Button placeholder
 * ============================================================================
 */

export interface SkeletonButtonProps {
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonButton({ size = 'md', fullWidth = false, className }: SkeletonButtonProps) {
  const sizeClasses = {
    sm: 'h-9 w-20',
    md: 'h-10 w-24',
    lg: 'h-11 w-28',
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], fullWidth && 'w-full', className)}
      radius="lg"
    />
  );
}

SkeletonButton.displayName = 'SkeletonButton';

/**
 * ============================================================================
 * SKELETON GRID - Grid of cards
 * ============================================================================
 */

export interface SkeletonGridProps {
  /** Number of items */
  count?: number;
  /** Columns at different breakpoints */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Custom className */
  className?: string;
  /** Card configuration */
  cardProps?: Partial<SkeletonCardProps>;
}

export function SkeletonGrid({
  count = 6,
  columns = { sm: 1, md: 2, lg: 3 },
  className,
  cardProps,
}: SkeletonGridProps) {
  const gridCols = cn(
    'grid gap-6',
    columns.sm && `grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`
  );

  return (
    <div className={cn(gridCols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...cardProps} />
      ))}
    </div>
  );
}

SkeletonGrid.displayName = 'SkeletonGrid';

/**
 * ============================================================================
 * SKELETON FORM - Form placeholder
 * ============================================================================
 */

export interface SkeletonFormProps {
  /** Number of fields */
  fields?: number;
  /** Show submit button */
  showButton?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonForm({ fields = 4, showButton = true, className }: SkeletonFormProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="1rem" width="30%" radius="sm" />
          <Skeleton height="2.5rem" width="100%" radius="lg" />
        </div>
      ))}
      {showButton && (
        <div className="pt-2">
          <SkeletonButton size="lg" fullWidth />
        </div>
      )}
    </div>
  );
}

SkeletonForm.displayName = 'SkeletonForm';

/**
 * ============================================================================
 * SKELETON PAGE - Full page placeholder
 * ============================================================================
 */

export interface SkeletonPageProps {
  /** Show header */
  showHeader?: boolean;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonPage({ showHeader = true, showSidebar = false, className }: SkeletonPageProps) {
  return (
    <div className={cn('min-h-screen', className)}>
      {showHeader && (
        <div className="border-b border-border p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Skeleton height="2rem" width="150px" radius="lg" />
            <div className="flex gap-3">
              <SkeletonButton />
              <SkeletonAvatar />
            </div>
          </div>
        </div>
      )}

      <div className={cn('container mx-auto p-6', showSidebar && 'flex gap-6')}>
        {showSidebar && (
          <aside className="w-64 space-y-4">
            <SkeletonList count={5} showAvatar={false} />
          </aside>
        )}

        <main className="flex-1 space-y-6">
          <div className="space-y-2">
            <Skeleton height="2.5rem" width="60%" radius="lg" />
            <Skeleton height="1.25rem" width="40%" radius="sm" />
          </div>

          <SkeletonGrid count={6} />
        </main>
      </div>
    </div>
  );
}

SkeletonPage.displayName = 'SkeletonPage';

/**
 * ============================================================================
 * SKELETON TRANSFER - Transfer-specific skeleton
 * ============================================================================
 */

export interface SkeletonTransferProps {
  /** Show progress bar */
  showProgress?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonTransfer({ showProgress = true, className }: SkeletonTransferProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Skeleton width="48px" height="48px" radius="xl" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton height="1.25rem" width="50%" radius="sm" />
            <Skeleton height="1.5rem" width="80px" radius="full" />
          </div>
          {showProgress && (
            <>
              <Skeleton height="12px" width="100%" radius="full" />
              <div className="flex items-center justify-between">
                <Skeleton height="0.875rem" width="120px" radius="sm" />
                <Skeleton height="0.875rem" width="80px" radius="sm" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

SkeletonTransfer.displayName = 'SkeletonTransfer';

/**
 * ============================================================================
 * SKELETON STAT - Statistics card skeleton
 * ============================================================================
 */

export interface SkeletonStatProps {
  /** Show icon */
  showIcon?: boolean;
  /** Custom className */
  className?: string;
}

export function SkeletonStat({ showIcon = true, className }: SkeletonStatProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 space-y-3',
        className
      )}
    >
      {showIcon && (
        <Skeleton width="48px" height="48px" radius="lg" className="mx-auto" />
      )}
      <Skeleton height="2rem" width="60%" radius="sm" className="mx-auto" />
      <Skeleton height="1rem" width="80%" radius="sm" className="mx-auto" />
    </div>
  );
}

SkeletonStat.displayName = 'SkeletonStat';
