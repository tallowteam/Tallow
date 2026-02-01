'use client';

/**
 * Transfer Queue Component
 * Displays active and completed file transfers with EUVEKA styling
 * Includes Suspense boundaries and loading states
 */

import { memo, Suspense, useCallback, useOptimistic, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NoTransfersEmpty } from '@/components/ui/empty-state-presets';
import { TransferQueueSkeleton } from '@/components/loading';
import { Pause, Play, Trash2 } from 'lucide-react';
import { Transfer } from '@/lib/types';
import { TransferCard } from './transfer-card';
import { cn } from '@/lib/utils';
import { listItemVariants, staggerContainerVariants } from '@/lib/animations/motion-config';

// ============================================================================
// TYPES
// ============================================================================

export interface TransferQueueProps {
  transfers: Transfer[];
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onPauseAll?: () => void;
  onResumeAll?: () => void;
  onClearCompleted?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// STATS BAR COMPONENT
// ============================================================================

interface StatsBarProps {
  activeCount: number;
  totalSize: number;
  totalSpeed: number;
  onPauseAll?: () => void;
  onResumeAll?: () => void;
  isPauseAllPending?: boolean;
  isResumeAllPending?: boolean;
}

const StatsBar = memo(function StatsBar({
  activeCount,
  totalSize,
  totalSpeed,
  onPauseAll,
  onResumeAll,
  isPauseAllPending,
  isResumeAllPending,
}: StatsBarProps) {
  return (
    <Card
      className={cn(
        'p-4 sm:p-5',
        'rounded-2xl sm:rounded-3xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'border border-[#e5dac7] dark:border-[#544a36]'
      )}
    >
      {/* Mobile: Stack vertically, Desktop: Row layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Stats - Grid on mobile, flex on desktop */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-[#b2987d] dark:text-[#b2987d]">
              Active
            </p>
            <p className="font-semibold text-sm sm:text-base text-[#191610] dark:text-[#fefefc]">
              {activeCount} transfer{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Separator
            orientation="vertical"
            className="hidden sm:block h-8 bg-[#e5dac7] dark:bg-[#544a36]"
          />
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-[#b2987d] dark:text-[#b2987d]">
              Total Size
            </p>
            <p className="font-semibold text-sm sm:text-base text-[#191610] dark:text-[#fefefc]">
              {formatFileSize(totalSize)}
            </p>
          </div>
          <Separator
            orientation="vertical"
            className="hidden sm:block h-8 bg-[#e5dac7] dark:bg-[#544a36]"
          />
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-[#b2987d] dark:text-[#b2987d]">
              Speed
            </p>
            <p className="font-semibold text-sm sm:text-base text-[#191610] dark:text-[#fefefc]">
              {formatFileSize(totalSpeed)}/s
            </p>
          </div>
        </div>
        {/* Action buttons - 44px height for touch compliance */}
        <div className="flex items-center gap-2">
          {onPauseAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPauseAll}
              disabled={isPauseAllPending}
              className={cn(
                'flex-1 sm:flex-none h-11 sm:h-10',
                'rounded-[60px]',
                'border-[#e5dac7] dark:border-[#544a36]',
                'hover:bg-[#f3ede2] dark:hover:bg-[#242018]',
                'transition-all duration-200'
              )}
              aria-label="Pause all active transfers"
            >
              <Pause className="w-4 h-4 mr-2" aria-hidden="true" />
              {isPauseAllPending ? 'Pausing...' : 'Pause All'}
            </Button>
          )}
          {onResumeAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResumeAll}
              disabled={isResumeAllPending}
              className={cn(
                'flex-1 sm:flex-none h-11 sm:h-10',
                'rounded-[60px]',
                'border-[#e5dac7] dark:border-[#544a36]',
                'hover:bg-[#f3ede2] dark:hover:bg-[#242018]',
                'transition-all duration-200'
              )}
              aria-label="Resume all paused transfers"
            >
              <Play className="w-4 h-4 mr-2" aria-hidden="true" />
              {isResumeAllPending ? 'Resuming...' : 'Resume All'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

// ============================================================================
// TRANSFER LIST COMPONENT
// ============================================================================

interface TransferListProps {
  transfers: Transfer[];
  title: string;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onClearCompleted?: () => void;
  showClearButton?: boolean;
}

const TransferList = memo(function TransferList({
  transfers,
  title,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onClearCompleted,
  showClearButton = false,
}: TransferListProps) {
  if (transfers.length === 0) {return null;}

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#191610] dark:text-[#fefefc]">
          {title}
        </h3>
        {showClearButton && onClearCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCompleted}
            className={cn(
              'h-10 sm:h-9',
              'text-[#b2987d] hover:text-[#191610]',
              'dark:text-[#b2987d] dark:hover:text-[#fefefc]',
              'hover:bg-[#f3ede2] dark:hover:bg-[#242018]'
            )}
            aria-label="Clear completed transfers from history"
          >
            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-[400px]">
        <motion.div
          className="space-y-2 sm:space-y-3"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {transfers.map((transfer) => (
              <motion.div
                key={transfer.id}
                variants={listItemVariants}
                layout
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <TransferCard
                  transfer={transfer}
                  {...(onPause ? { onPause } : {})}
                  {...(onResume ? { onResume } : {})}
                  {...(onCancel ? { onCancel } : {})}
                  {...(onRetry ? { onRetry } : {})}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </ScrollArea>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TransferQueue = memo(function TransferQueue({
  transfers,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onPauseAll,
  onResumeAll,
  onClearCompleted,
  isLoading = false,
}: TransferQueueProps) {
  // React 19 transitions for smooth UI updates
  const [isPauseAllPending, startPauseAllTransition] = useTransition();
  const [isResumeAllPending, startResumeAllTransition] = useTransition();
  const [isClearPending, startClearTransition] = useTransition();

  // Optimistic updates for immediate UI feedback
  const [optimisticTransfers, updateOptimisticTransfers] = useOptimistic(
    transfers,
    (state, action: { type: 'pause' | 'resume' | 'cancel' | 'clear'; id?: string }) => {
      switch (action.type) {
        case 'pause':
          return state.map((t) =>
            t.id === action.id && t.status === 'transferring'
              ? { ...t, status: 'paused' as const }
              : t
          );
        case 'resume':
          return state.map((t) =>
            t.id === action.id && t.status === 'paused'
              ? { ...t, status: 'transferring' as const }
              : t
          );
        case 'cancel':
          return state.map((t) =>
            t.id === action.id ? { ...t, status: 'cancelled' as const } : t
          );
        case 'clear':
          return state.filter(
            (t) => !['completed', 'failed', 'cancelled'].includes(t.status)
          );
        default:
          return state;
      }
    }
  );

  // Handlers with optimistic updates
  const handlePause = useCallback(
    (id: string) => {
      updateOptimisticTransfers({ type: 'pause', id });
      onPause?.(id);
    },
    [onPause, updateOptimisticTransfers]
  );

  const handleResume = useCallback(
    (id: string) => {
      updateOptimisticTransfers({ type: 'resume', id });
      onResume?.(id);
    },
    [onResume, updateOptimisticTransfers]
  );

  const handleCancel = useCallback(
    (id: string) => {
      updateOptimisticTransfers({ type: 'cancel', id });
      onCancel?.(id);
    },
    [onCancel, updateOptimisticTransfers]
  );

  const handlePauseAll = useCallback(() => {
    startPauseAllTransition(() => {
      onPauseAll?.();
    });
  }, [onPauseAll]);

  const handleResumeAll = useCallback(() => {
    startResumeAllTransition(() => {
      onResumeAll?.();
    });
  }, [onResumeAll]);

  const handleClearCompleted = useCallback(() => {
    startClearTransition(() => {
      updateOptimisticTransfers({ type: 'clear' });
      onClearCompleted?.();
    });
  }, [onClearCompleted, updateOptimisticTransfers]);

  // Categorize transfers
  const activeTransfers = optimisticTransfers.filter((t) =>
    ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
  );
  const completedTransfers = optimisticTransfers.filter((t) =>
    ['completed', 'failed', 'cancelled'].includes(t.status)
  );

  const totalActiveSize = activeTransfers.reduce((acc, t) => acc + t.totalSize, 0);
  const totalSpeed = activeTransfers.reduce((acc, t) => acc + (t.speed || 0), 0);
  const hasActiveTransfers = activeTransfers.length > 0;

  // Show loading skeleton
  if (isLoading) {
    return (
      <Suspense fallback={<TransferQueueSkeleton />}>
        <TransferQueueSkeleton activeCount={2} completedCount={1} />
      </Suspense>
    );
  }

  // Empty state
  if (transfers.length === 0) {
    return (
      <Card
        className={cn(
          'overflow-hidden',
          'rounded-2xl sm:rounded-3xl',
          'bg-[#fefefc] dark:bg-[#191610]',
          'border border-[#e5dac7] dark:border-[#544a36]'
        )}
      >
        <NoTransfersEmpty />
      </Card>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5" aria-labelledby="transfer-queue-heading">
      <h2 id="transfer-queue-heading" className="sr-only">
        Transfer Queue
      </h2>

      {/* Live region for transfer updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {hasActiveTransfers
          ? `${activeTransfers.length} active transfer${activeTransfers.length !== 1 ? 's' : ''}`
          : 'No active transfers'}
      </div>

      {/* Stats Bar */}
      {hasActiveTransfers && (
        <StatsBar
          activeCount={activeTransfers.length}
          totalSize={totalActiveSize}
          totalSpeed={totalSpeed}
          {...(onPauseAll && { onPauseAll: handlePauseAll })}
          {...(onResumeAll && { onResumeAll: handleResumeAll })}
          isPauseAllPending={isPauseAllPending}
          isResumeAllPending={isResumeAllPending}
        />
      )}

      {/* Active Transfers */}
      <Suspense
        fallback={
          <TransferQueueSkeleton activeCount={activeTransfers.length} completedCount={0} showStats={false} />
        }
      >
        <TransferList
          transfers={activeTransfers}
          title="Active Transfers"
          {...(onPause && { onPause: handlePause })}
          {...(onResume && { onResume: handleResume })}
          {...(onCancel && { onCancel: handleCancel })}
        />
      </Suspense>

      {/* Completed Transfers */}
      <Suspense
        fallback={
          <TransferQueueSkeleton activeCount={0} completedCount={completedTransfers.length} showStats={false} />
        }
      >
        <TransferList
          transfers={completedTransfers}
          title="Completed"
          {...(onRetry && { onRetry })}
          onClearCompleted={handleClearCompleted}
          showClearButton={!isClearPending}
        />
      </Suspense>
    </section>
  );
});

TransferQueue.displayName = 'TransferQueue';

export default TransferQueue;
