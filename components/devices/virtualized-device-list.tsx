'use client';

/**
 * Virtualized Device List
 * High-performance device list rendering using @tanstack/react-virtual
 * Optimized for React 19 with infinite scrolling support
 */

import React, { memo, useRef, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Loader2, Wifi } from 'lucide-react';
import { Device } from '@/lib/types';
import { DeviceCard } from './device-card';

export interface VirtualizedDeviceListProps {
  devices: Device[];
  onSelect?: (device: Device) => void;
  onToggleFavorite?: (device: Device) => void;
  selectedDeviceId?: string;
  showSecurityBadge?: boolean;
  height?: number;
  overscan?: number;
  // Infinite scroll
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * Virtualized Device List Component
 * Uses windowing to render only visible items for better performance
 * Supports infinite scrolling for large device lists
 */
export const VirtualizedDeviceList = memo(function VirtualizedDeviceList({
  devices,
  onSelect,
  onToggleFavorite,
  selectedDeviceId,
  showSecurityBadge = true,
  height = 500,
  overscan = 5,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: VirtualizedDeviceListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isLoadingTriggered, setIsLoadingTriggered] = useState(false);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: devices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Estimated height of each device card
    overscan,
  });

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || isLoadingMore || isLoadingTriggered || !onLoadMore) { return; }

      const target = e.currentTarget;
      const scrollPercentage =
        (target.scrollTop + target.clientHeight) / target.scrollHeight;

      // Load more when scrolled to 80%
      if (scrollPercentage > 0.8) {
        setIsLoadingTriggered(true);
        onLoadMore();
        // Reset trigger after a delay
        setTimeout(() => setIsLoadingTriggered(false), 1000);
      }
    },
    [hasMore, isLoadingMore, isLoadingTriggered, onLoadMore]
  );

  if (devices.length === 0 && !isLoadingMore) {
    return (
      <Card className="p-8 rounded-xl border border-border bg-card text-center">
        <Wifi className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No devices found</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Connect devices on the same network to see them here
        </p>
      </Card>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      style={{ height: `${height}px` }}
      className="overflow-auto rounded-lg border border-border bg-card/50"
      role="list"
      aria-label="Device list"
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
          const device = devices[virtualItem.index];

          if (!device) { return null; }

          return (
            <div
              key={device.id}
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
              <DeviceCard
                device={device}
                onSelect={onSelect ?? (() => {})}
                onToggleFavorite={onToggleFavorite ?? (() => {})}
                isSelected={device.id === selectedDeviceId}
                showSecurityBadge={showSecurityBadge}
              />
            </div>
          );
        })}

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div
            style={{
              position: 'absolute',
              top: virtualizer.getTotalSize(),
              left: 0,
              width: '100%',
              padding: '16px',
            }}
            className="flex items-center justify-center"
          >
            <Loader2 className="w-6 h-6 animate-spin text-[#fefefc]" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading more devices...
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

VirtualizedDeviceList.displayName = 'VirtualizedDeviceList';

export default VirtualizedDeviceList;
