'use client';

/**
 * Virtualized Transfer List
 * High-performance list rendering using @tanstack/react-virtual
 * Optimized for React 19
 */

import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { Transfer } from '@/lib/types';
import { TransferCard } from './transfer-card';

export interface VirtualizedTransferListProps {
  transfers: Transfer[];
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  height?: number;
  overscan?: number;
}

/**
 * Virtualized Transfer List Component
 * Uses windowing to render only visible items for better performance
 */
export const VirtualizedTransferList = memo(function VirtualizedTransferList({
  transfers,
  onPause,
  onResume,
  onCancel,
  onRetry,
  height = 500,
  overscan = 5,
}: VirtualizedTransferListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: transfers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each transfer card
    overscan, // Number of items to render outside visible area
  });

  if (transfers.length === 0) {
    return (
      <Card className="p-8 rounded-xl border border-border bg-card text-center">
        <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No transfers yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Select files and a recipient to start transferring
        </p>
      </Card>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{ height: `${height}px` }}
      className="overflow-auto rounded-lg border border-border bg-card/50"
      role="list"
      aria-label="Transfer list"
    >
      {/* Total height container */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Only render visible items */}
        {virtualItems.map((virtualItem) => {
          const transfer = transfers[virtualItem.index];

          if (!transfer) {return null;}

          return (
            <div
              key={transfer.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-2 py-1"
            >
              <TransferCard
                transfer={transfer}
                {...(onPause ? { onPause } : {})}
                {...(onResume ? { onResume } : {})}
                {...(onCancel ? { onCancel } : {})}
                {...(onRetry ? { onRetry } : {})}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedTransferList.displayName = 'VirtualizedTransferList';

export default VirtualizedTransferList;
