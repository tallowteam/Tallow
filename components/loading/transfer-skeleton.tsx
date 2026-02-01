'use client';

/**
 * Transfer Skeleton Components
 * EUVEKA-styled loading skeletons for transfer components
 *
 * EUVEKA Specs:
 * - Skeleton background: #e5dac7 (light) / #544a36 (dark)
 * - Shimmer animation with warm gradient
 * - Card skeleton with 24px radius
 * - Pill-shaped buttons (60px radius)
 */

import { cn } from '@/lib/utils';
import {
  EuvekaSkeleton,
  EuvekaSkeletonButton,
  EuvekaSkeletonProgress,
} from './euveka-skeleton';

// ============================================================================
// TRANSFER CARD SKELETON
// ============================================================================

export interface TransferCardSkeletonProps {
  /** Animation delay for staggered loading */
  delay?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Variant: active transfer or completed */
  variant?: 'active' | 'completed';
}

export function TransferCardSkeleton({
  delay = 0,
  showProgress = true,
  showActions = true,
  variant = 'active',
}: TransferCardSkeletonProps) {
  return (
    <div
      className={cn(
        'p-4 sm:p-5',
        // EUVEKA card styling
        'rounded-2xl sm:rounded-3xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      <div className="flex items-start gap-4">
        {/* File icon skeleton */}
        <EuvekaSkeleton
          width={48}
          height={48}
          className="rounded-xl shrink-0"
          delay={delay}
        />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* File name */}
          <EuvekaSkeleton
            height={18}
            className="w-3/4"
            delay={delay + 50}
          />
          {/* File size / status */}
          <EuvekaSkeleton
            height={14}
            className="w-1/2"
            delay={delay + 100}
          />
        </div>

        {/* Action buttons skeleton */}
        {showActions && (
          <div className="flex items-center gap-2 shrink-0">
            <EuvekaSkeleton
              variant="circular"
              width={36}
              height={36}
              delay={delay + 150}
            />
            {variant === 'active' && (
              <EuvekaSkeleton
                variant="circular"
                width={36}
                height={36}
                delay={delay + 200}
              />
            )}
          </div>
        )}
      </div>

      {/* Progress bar skeleton */}
      {showProgress && variant === 'active' && (
        <div className="mt-3 space-y-2">
          <EuvekaSkeletonProgress delay={delay + 250} />
          <div className="flex justify-between">
            <EuvekaSkeleton height={12} width={80} delay={delay + 300} />
            <EuvekaSkeleton height={12} width={60} delay={delay + 350} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRANSFER LIST SKELETON
// ============================================================================

export interface TransferListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Show section header */
  showHeader?: boolean;
  /** Variant: active or completed transfers */
  variant?: 'active' | 'completed';
  /** Base animation delay */
  baseDelay?: number;
}

export function TransferListSkeleton({
  count = 3,
  showHeader = true,
  variant = 'active',
  baseDelay = 0,
}: TransferListSkeletonProps) {
  const staggerDelay = 100;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      {showHeader && (
        <EuvekaSkeleton
          height={20}
          width={variant === 'active' ? 140 : 100}
          delay={baseDelay}
        />
      )}

      {/* Transfer cards */}
      <div className="space-y-2 sm:space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <TransferCardSkeleton
            key={i}
            delay={baseDelay + (showHeader ? 50 : 0) + i * staggerDelay}
            variant={variant}
            showProgress={variant === 'active'}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TRANSFER QUEUE SKELETON (Full component with stats)
// ============================================================================

export interface TransferQueueSkeletonProps {
  /** Number of active transfers */
  activeCount?: number;
  /** Number of completed transfers */
  completedCount?: number;
  /** Show stats bar */
  showStats?: boolean;
}

export function TransferQueueSkeleton({
  activeCount = 2,
  completedCount = 1,
  showStats = true,
}: TransferQueueSkeletonProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Stats Bar Skeleton */}
      {showStats && (
        <div
          className={cn(
            'p-4 sm:p-5',
            'rounded-2xl sm:rounded-3xl',
            'bg-[#fefefc] dark:bg-[#191610]',
            'border border-[#e5dac7] dark:border-[#544a36]'
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Stats - Grid on mobile, flex on desktop */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
              {/* Active stat */}
              <div className="text-center sm:text-left space-y-1">
                <EuvekaSkeleton height={12} width={48} delay={0} />
                <EuvekaSkeleton height={18} width={80} delay={25} />
              </div>

              {/* Separator - hidden on mobile */}
              <div className="hidden sm:block w-px h-8 bg-[#e5dac7] dark:bg-[#544a36]" />

              {/* Total Size stat */}
              <div className="text-center sm:text-left space-y-1">
                <EuvekaSkeleton height={12} width={64} delay={50} />
                <EuvekaSkeleton height={18} width={72} delay={75} />
              </div>

              {/* Separator - hidden on mobile */}
              <div className="hidden sm:block w-px h-8 bg-[#e5dac7] dark:bg-[#544a36]" />

              {/* Speed stat */}
              <div className="text-center sm:text-left space-y-1">
                <EuvekaSkeleton height={12} width={40} delay={100} />
                <EuvekaSkeleton height={18} width={88} delay={125} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <EuvekaSkeletonButton
                size="sm"
                width={100}
                height={40}
                delay={150}
              />
              <EuvekaSkeletonButton
                size="sm"
                width={110}
                height={40}
                delay={200}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Transfers Section */}
      {activeCount > 0 && (
        <TransferListSkeleton
          count={activeCount}
          variant="active"
          showHeader
          baseDelay={showStats ? 250 : 0}
        />
      )}

      {/* Completed Transfers Section */}
      {completedCount > 0 && (
        <TransferListSkeleton
          count={completedCount}
          variant="completed"
          showHeader
          baseDelay={showStats ? 500 : 250}
        />
      )}
    </div>
  );
}

// ============================================================================
// TRANSFER PROGRESS SKELETON (Large single transfer view)
// ============================================================================

export interface TransferProgressSkeletonProps {
  /** Show file preview */
  showPreview?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Animation delay */
  delay?: number;
}

export function TransferProgressSkeleton({
  showPreview = true,
  showActions = true,
  delay = 0,
}: TransferProgressSkeletonProps) {
  return (
    <div
      className={cn(
        'p-6 sm:p-8 space-y-6',
        // EUVEKA card styling
        'rounded-3xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        {showPreview && (
          <EuvekaSkeleton
            width={64}
            height={64}
            className="rounded-xl shrink-0"
            delay={delay}
          />
        )}
        <div className="flex-1 space-y-2">
          <EuvekaSkeleton height={24} className="w-3/4" delay={delay + 50} />
          <EuvekaSkeleton height={16} className="w-1/2" delay={delay + 100} />
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <EuvekaSkeleton
          variant="pill"
          height={12}
          className="w-full"
          delay={delay + 150}
        />
        <div className="flex justify-between items-center">
          <EuvekaSkeleton height={14} width={120} delay={delay + 200} />
          <EuvekaSkeleton height={14} width={80} delay={delay + 250} />
        </div>
      </div>

      {/* Transfer details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <EuvekaSkeleton height={12} width={60} delay={delay + 300} />
          <EuvekaSkeleton height={16} width={100} delay={delay + 350} />
        </div>
        <div className="space-y-1">
          <EuvekaSkeleton height={12} width={80} delay={delay + 400} />
          <EuvekaSkeleton height={16} width={90} delay={delay + 450} />
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3 justify-end pt-2">
          <EuvekaSkeletonButton size="md" delay={delay + 500} />
          <EuvekaSkeletonButton size="md" delay={delay + 550} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRANSFER EMPTY STATE SKELETON
// ============================================================================

export function TransferEmptySkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className={cn(
        'p-8 sm:p-12 flex flex-col items-center text-center space-y-4',
        'rounded-3xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      <EuvekaSkeleton
        variant="circular"
        width={80}
        height={80}
        delay={delay}
      />
      <div className="space-y-2">
        <EuvekaSkeleton
          height={24}
          width={200}
          className="mx-auto"
          delay={delay + 50}
        />
        <EuvekaSkeleton
          height={16}
          width={280}
          className="mx-auto"
          delay={delay + 100}
        />
      </div>
      <EuvekaSkeletonButton size="lg" delay={delay + 150} />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TransferCardSkeleton;
