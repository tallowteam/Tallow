'use client';

/**
 * Device Skeleton Components
 * EUVEKA-styled loading skeletons for device components
 *
 * EUVEKA Specs:
 * - Skeleton background: #e5dac7 (light) / #544a36 (dark)
 * - Shimmer animation with warm gradient
 * - Card skeleton with 24px radius
 */

import { cn } from '@/lib/utils';
import {
  EuvekaSkeleton,
  EuvekaSkeletonAvatar,
  EuvekaSkeletonButton,
} from './euveka-skeleton';

// ============================================================================
// DEVICE CARD SKELETON
// ============================================================================

export interface DeviceCardSkeletonProps {
  /** Animation delay for staggered loading */
  delay?: number;
  /** Show connection button */
  showConnectButton?: boolean;
  /** Show favorite button */
  showFavoriteButton?: boolean;
}

export function DeviceCardSkeleton({
  delay = 0,
  showConnectButton = true,
  showFavoriteButton = true,
}: DeviceCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 sm:p-5',
        // EUVEKA card styling
        'rounded-2xl sm:rounded-3xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      {/* Avatar skeleton */}
      <EuvekaSkeletonAvatar size={56} delay={delay} />

      {/* Device info skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Device name */}
        <EuvekaSkeleton height={18} className="w-32 sm:w-40" delay={delay + 50} />
        {/* Platform/Type */}
        <EuvekaSkeleton height={14} className="w-24 sm:w-28" delay={delay + 100} />
        {/* IP Address */}
        <EuvekaSkeleton height={12} className="w-36 sm:w-44" delay={delay + 150} />
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center gap-2 shrink-0">
        {showFavoriteButton && (
          <EuvekaSkeleton
            variant="circular"
            width={40}
            height={40}
            delay={delay + 200}
          />
        )}
        {showConnectButton && (
          <EuvekaSkeletonButton
            size="sm"
            width={80}
            height={40}
            delay={delay + 250}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DEVICE LIST SKELETON
// ============================================================================

export interface DeviceListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Show section headers */
  showSections?: boolean;
  /** Base animation delay */
  baseDelay?: number;
}

export function DeviceListSkeleton({
  count = 5,
  showSections = true,
  baseDelay = 0,
}: DeviceListSkeletonProps) {
  const staggerDelay = 100; // 100ms between each item

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Section Header - Favorites */}
      {showSections && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <EuvekaSkeleton
              variant="circular"
              width={16}
              height={16}
              delay={baseDelay}
            />
            <EuvekaSkeleton height={14} width={80} delay={baseDelay + 25} />
            <EuvekaSkeleton
              variant="pill"
              height={20}
              width={28}
              delay={baseDelay + 50}
            />
          </div>
          <DeviceCardSkeleton delay={baseDelay + 75} />
        </div>
      )}

      {/* Section Header - Available */}
      {showSections && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <EuvekaSkeleton
              variant="circular"
              width={16}
              height={16}
              delay={baseDelay + 350}
            />
            <EuvekaSkeleton height={14} width={72} delay={baseDelay + 375} />
            <EuvekaSkeleton
              variant="pill"
              height={20}
              width={28}
              delay={baseDelay + 400}
            />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: Math.ceil(count / 2) }).map((_, i) => (
              <DeviceCardSkeleton
                key={`available-${i}`}
                delay={baseDelay + 425 + i * staggerDelay}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section Header - Recently Seen */}
      {showSections && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <EuvekaSkeleton
              variant="circular"
              width={16}
              height={16}
              delay={baseDelay + 800}
            />
            <EuvekaSkeleton height={14} width={96} delay={baseDelay + 825} />
            <EuvekaSkeleton
              variant="pill"
              height={20}
              width={28}
              delay={baseDelay + 850}
            />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: Math.floor(count / 2) }).map((_, i) => (
              <DeviceCardSkeleton
                key={`recent-${i}`}
                delay={baseDelay + 875 + i * staggerDelay}
              />
            ))}
          </div>
        </div>
      )}

      {/* Simple list without sections */}
      {!showSections && (
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <DeviceCardSkeleton
              key={i}
              delay={baseDelay + i * staggerDelay}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DEVICE GRID SKELETON
// ============================================================================

export interface DeviceGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Base animation delay */
  baseDelay?: number;
}

export function DeviceGridSkeleton({
  count = 6,
  columns = 3,
  baseDelay = 0,
}: DeviceGridSkeletonProps) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', colClasses[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <DeviceCardSkeleton key={i} delay={baseDelay + i * 80} />
      ))}
    </div>
  );
}

// ============================================================================
// DEVICE DISCOVERY SKELETON (Full component with tabs)
// ============================================================================

export interface DeviceDiscoverySkeletonProps {
  /** Show QR code section */
  showQRCode?: boolean;
  /** Number of device cards */
  deviceCount?: number;
}

export function DeviceDiscoverySkeleton({
  showQRCode = true,
  deviceCount = 4,
}: DeviceDiscoverySkeletonProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Tab Bar Skeleton */}
      <div
        className={cn(
          'grid grid-cols-2 h-11 sm:h-12 p-1 rounded-lg sm:rounded-xl',
          'bg-[#f3ede2] dark:bg-[#0a0a0a]',
          'border border-[#e5dac7] dark:border-[#1f1f1f]'
        )}
      >
        <EuvekaSkeleton
          variant="default"
          className="h-9 sm:h-10 rounded-md sm:rounded-lg"
          delay={0}
        />
        <EuvekaSkeleton
          variant="default"
          className="h-9 sm:h-10 rounded-md sm:rounded-lg"
          animation="none"
        />
      </div>

      {/* Search Bar Skeleton */}
      <div className="flex items-center gap-2 sm:gap-3">
        <EuvekaSkeleton
          variant="default"
          height={44}
          className="flex-1 rounded-lg sm:rounded-xl"
          delay={50}
        />
        <EuvekaSkeleton
          variant="default"
          width={44}
          height={44}
          className="rounded-lg sm:rounded-xl"
          delay={100}
        />
      </div>

      {/* Device List Skeleton */}
      <DeviceListSkeleton count={deviceCount} showSections baseDelay={150} />

      {/* QR Code Card Skeleton */}
      {showQRCode && (
        <div
          className={cn(
            'flex items-center gap-4 p-4 sm:p-5',
            'rounded-2xl sm:rounded-3xl',
            'bg-gradient-to-br from-[#fefefc] to-[#f3ede2]',
            'dark:from-[#191610] dark:to-[#0a0a0a]',
            'border border-[#e5dac7] dark:border-[#544a36]'
          )}
        >
          {/* QR Code placeholder */}
          <div
            className={cn(
              'p-2 rounded-xl shrink-0',
              'bg-white border border-[#e5dac7]',
              'dark:bg-white dark:border-[#d6cec2]'
            )}
          >
            <EuvekaSkeleton width={88} height={88} className="rounded-lg" delay={600} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <EuvekaSkeleton
                variant="circular"
                width={16}
                height={16}
                delay={650}
              />
              <EuvekaSkeleton height={16} width={120} delay={675} />
            </div>

            {/* Code button */}
            <EuvekaSkeleton
              variant="default"
              height={40}
              className="w-full rounded-lg"
              delay={700}
            />

            {/* Full ID text */}
            <EuvekaSkeleton height={12} width={160} delay={750} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DeviceCardSkeleton;
