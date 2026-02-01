'use client';

/**
 * Page Skeletons
 * EUVEKA-styled full page loading skeletons for different layouts
 * Used with React 19 Suspense boundaries
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
  EuvekaSkeletonCard,
  EuvekaSkeletonButton,
} from './euveka-skeleton';
import { DeviceListSkeleton, DeviceDiscoverySkeleton } from './device-skeleton';
import { TransferQueueSkeleton, TransferProgressSkeleton } from './transfer-skeleton';

// ============================================================================
// DASHBOARD SKELETON
// ============================================================================

export interface DashboardSkeletonProps {
  /** Show header section */
  showHeader?: boolean;
  /** Show stats cards */
  showStats?: boolean;
  /** Number of device cards */
  deviceCount?: number;
  /** Number of transfer cards */
  transferCount?: number;
}

export function DashboardSkeleton({
  showHeader = true,
  showStats = true,
  deviceCount = 3,
  transferCount = 2,
}: DashboardSkeletonProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header skeleton */}
      {showHeader && (
        <div className="space-y-2">
          <EuvekaSkeleton height={32} width={256} delay={0} />
          <EuvekaSkeleton height={18} width={384} delay={50} />
        </div>
      )}

      {/* Stats cards skeleton */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'p-6 space-y-3',
                'rounded-3xl',
                'bg-[#fefefc] dark:bg-[#191610]',
                'border border-[#e5dac7] dark:border-[#544a36]'
              )}
            >
              <EuvekaSkeleton height={14} width={96} delay={100 + i * 50} />
              <EuvekaSkeleton height={28} width={128} delay={125 + i * 50} />
              <EuvekaSkeleton height={12} width={160} delay={150 + i * 50} />
            </div>
          ))}
        </div>
      )}

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Devices section */}
        <div className="space-y-4">
          <EuvekaSkeleton height={24} width={128} delay={300} />
          <DeviceListSkeleton count={deviceCount} showSections={false} baseDelay={350} />
        </div>

        {/* Transfers section */}
        <div className="space-y-4">
          <EuvekaSkeleton height={24} width={128} delay={400} />
          <TransferQueueSkeleton
            activeCount={transferCount}
            completedCount={1}
            showStats={false}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APP PAGE SKELETON (Main app view with discovery + transfer)
// ============================================================================

export interface AppPageSkeletonProps {
  /** Show device discovery section */
  showDevices?: boolean;
  /** Show transfer section */
  showTransfers?: boolean;
}

export function AppPageSkeleton({
  showDevices = true,
  showTransfers = true,
}: AppPageSkeletonProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Device Discovery */}
        {showDevices && (
          <div className="space-y-4">
            <DeviceDiscoverySkeleton deviceCount={4} showQRCode />
          </div>
        )}

        {/* Transfer Queue */}
        {showTransfers && (
          <div className="space-y-4">
            <TransferProgressSkeleton />
            <TransferQueueSkeleton activeCount={2} completedCount={1} showStats />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS SKELETON
// ============================================================================

export interface SettingsSkeletonProps {
  /** Number of settings sections */
  sectionCount?: number;
  /** Items per section */
  itemsPerSection?: number;
}

export function SettingsSkeleton({
  sectionCount = 4,
  itemsPerSection = 3,
}: SettingsSkeletonProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* Header skeleton */}
      <div className="space-y-2">
        <EuvekaSkeleton height={32} width={192} delay={0} />
        <EuvekaSkeleton height={18} width={320} delay={50} />
      </div>

      {/* Settings sections skeleton */}
      <div className="space-y-6">
        {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className={cn(
              'p-6 space-y-5',
              'rounded-3xl',
              'bg-[#fefefc] dark:bg-[#191610]',
              'border border-[#e5dac7] dark:border-[#544a36]'
            )}
          >
            {/* Section title */}
            <EuvekaSkeleton
              height={22}
              width={160}
              delay={100 + sectionIndex * 150}
            />

            {/* Settings items */}
            <div className="space-y-4">
              {Array.from({ length: itemsPerSection }).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1.5 flex-1">
                    <EuvekaSkeleton
                      height={16}
                      width={128}
                      delay={125 + sectionIndex * 150 + itemIndex * 40}
                    />
                    <EuvekaSkeleton
                      height={12}
                      width={192}
                      delay={140 + sectionIndex * 150 + itemIndex * 40}
                    />
                  </div>
                  <EuvekaSkeleton
                    variant="pill"
                    width={52}
                    height={28}
                    delay={155 + sectionIndex * 150 + itemIndex * 40}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FEATURE PAGE SKELETON
// ============================================================================

export interface FeaturePageSkeletonProps {
  /** Number of feature cards */
  featureCount?: number;
  /** Number of columns */
  columns?: 2 | 3;
}

export function FeaturePageSkeleton({
  featureCount = 6,
  columns = 3,
}: FeaturePageSkeletonProps) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8 sm:space-y-12">
      {/* Hero skeleton */}
      <div className="text-center space-y-4 py-8 sm:py-12">
        <EuvekaSkeleton
          height={48}
          width={384}
          className="mx-auto"
          delay={0}
        />
        <EuvekaSkeleton
          height={24}
          width={600}
          className="mx-auto max-w-full"
          delay={50}
        />
        <div className="flex justify-center gap-4 mt-6">
          <EuvekaSkeletonButton size="lg" delay={100} />
          <EuvekaSkeletonButton size="lg" delay={150} />
        </div>
      </div>

      {/* Features grid skeleton */}
      <div className={cn('grid gap-6', colClasses[columns])}>
        {Array.from({ length: featureCount }).map((_, i) => (
          <EuvekaSkeletonCard
            key={i}
            showHeader={false}
            contentLines={3}
            showFooter={false}
            delay={200 + i * 80}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FORM SKELETON
// ============================================================================

export interface FormSkeletonProps {
  /** Number of form fields */
  fieldCount?: number;
  /** Show header */
  showHeader?: boolean;
  /** Show submit button */
  showSubmit?: boolean;
}

export function FormSkeleton({
  fieldCount = 4,
  showHeader = true,
  showSubmit = true,
}: FormSkeletonProps) {
  return (
    <div
      className={cn(
        'p-6 sm:p-8 max-w-md mx-auto space-y-6',
        'rounded-3xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      {showHeader && (
        <div className="space-y-2">
          <EuvekaSkeleton height={28} width={128} delay={0} />
          <EuvekaSkeleton height={16} width={192} delay={50} />
        </div>
      )}

      <div className="space-y-5">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <EuvekaSkeleton
              height={14}
              width={96}
              delay={100 + i * 60}
            />
            <EuvekaSkeleton
              variant="default"
              height={44}
              className="w-full rounded-xl"
              delay={125 + i * 60}
            />
          </div>
        ))}
      </div>

      {showSubmit && (
        <EuvekaSkeletonButton
          size="lg"
          className="w-full"
          width="100%"
          height={56}
          delay={100 + fieldCount * 60 + 50}
        />
      )}
    </div>
  );
}

// ============================================================================
// HELP PAGE SKELETON
// ============================================================================

export function HelpPageSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <EuvekaSkeleton height={40} width={300} className="mx-auto" delay={0} />
        <EuvekaSkeleton height={20} width={400} className="mx-auto" delay={50} />
      </div>

      {/* Search bar */}
      <EuvekaSkeleton
        variant="default"
        height={56}
        className="w-full max-w-xl mx-auto rounded-2xl"
        delay={100}
      />

      {/* FAQ sections */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'p-5',
              'rounded-2xl',
              'bg-[#fefefc] dark:bg-[#191610]',
              'border border-[#e5dac7] dark:border-[#544a36]'
            )}
          >
            <div className="flex items-center justify-between">
              <EuvekaSkeleton height={20} className="w-3/4" delay={150 + i * 80} />
              <EuvekaSkeleton
                variant="circular"
                width={24}
                height={24}
                delay={175 + i * 80}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PROFILE SKELETON
// ============================================================================

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8 max-w-2xl">
      {/* Profile header */}
      <div
        className={cn(
          'p-8 flex flex-col items-center text-center space-y-4',
          'rounded-3xl',
          'bg-[#fefefc] dark:bg-[#191610]',
          'border border-[#e5dac7] dark:border-[#544a36]'
        )}
      >
        <EuvekaSkeleton variant="circular" width={120} height={120} delay={0} />
        <EuvekaSkeleton height={28} width={200} delay={50} />
        <EuvekaSkeleton height={16} width={160} delay={100} />
        <div className="flex gap-3">
          <EuvekaSkeletonButton size="md" delay={150} />
          <EuvekaSkeletonButton size="md" delay={200} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'p-4 text-center',
              'rounded-2xl',
              'bg-[#fefefc] dark:bg-[#191610]',
              'border border-[#e5dac7] dark:border-[#544a36]'
            )}
          >
            <EuvekaSkeleton
              height={28}
              width={64}
              className="mx-auto"
              delay={250 + i * 50}
            />
            <EuvekaSkeleton
              height={14}
              width={80}
              className="mx-auto mt-2"
              delay={275 + i * 50}
            />
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="space-y-4">
        <EuvekaSkeleton height={24} width={160} delay={400} />
        {Array.from({ length: 3 }).map((_, i) => (
          <EuvekaSkeletonCard
            key={i}
            showAvatar={false}
            contentLines={2}
            delay={450 + i * 100}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DashboardSkeleton;
