'use client';

import { useGesture } from '@use-gesture/react';
import { useCallback, useState } from 'react';

export interface SwipeActionConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export interface PinchZoomConfig {
  onZoom?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  enabled?: boolean;
}

export interface DragConfig {
  onDrag?: (offset: { x: number; y: number }) => void;
  onDragEnd?: () => void;
  bounds?: { left: number; right: number; top: number; bottom: number };
  enabled?: boolean;
}

/**
 * Advanced swipe gesture hook using @use-gesture/react
 * Provides smooth swipe-to-action functionality with visual feedback
 */
export function useSwipeActions(config: SwipeActionConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 100,
    enabled = true,
  } = config;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const bind = useGesture(
    {
      onDrag: ({ active, movement: [mx, my], direction: [_dx, _dy], cancel }) => {
        if (!enabled) {return;}

        setIsDragging(active);

        if (active) {
          setOffset({ x: mx, y: my });

          // Determine swipe direction
          if (Math.abs(mx) > Math.abs(my)) {
            setSwipeDirection(mx > 0 ? 'right' : 'left');
          } else {
            setSwipeDirection(my > 0 ? 'down' : 'up');
          }

          // Auto-complete swipe if threshold exceeded
          if (Math.abs(mx) > threshold * 2 || Math.abs(my) > threshold * 2) {
            cancel();
            handleSwipeComplete(mx, my);
          }
        } else {
          handleSwipeComplete(mx, my);
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 10,
      },
    }
  );

  const handleSwipeComplete = useCallback((mx: number, my: number) => {
    const absX = Math.abs(mx);
    const absY = Math.abs(my);

    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (mx > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (mx < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (my > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (my < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset
    setOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
    setIsDragging(false);
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    bind,
    offset,
    isDragging,
    swipeDirection,
    style: {
      transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  };
}

/**
 * Pinch-to-zoom gesture hook
 * Supports image and content zooming with smooth animations
 */
export function usePinchZoom(config: PinchZoomConfig = {}) {
  const { onZoom, minScale = 0.5, maxScale = 4, enabled = true } = config;

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const bind = useGesture(
    {
      onPinch: ({ offset: [s], memo = scale }) => {
        if (!enabled) {return memo;}

        const newScale = Math.max(minScale, Math.min(maxScale, s));
        setScale(newScale);
        onZoom?.(newScale);
        return memo;
      },
      onDrag: ({ offset: [x, y], pinching }) => {
        if (!enabled || pinching) {return;}

        if (scale > 1) {
          setOffset({ x, y });
        }
      },
      onWheel: ({ delta: [, dy] }) => {
        if (!enabled) {return;}

        const newScale = Math.max(minScale, Math.min(maxScale, scale - dy * 0.01));
        setScale(newScale);
        onZoom?.(newScale);
      },
    },
    {
      pinch: {
        scaleBounds: { min: minScale, max: maxScale },
        rubberband: true,
      },
      drag: {
        from: () => [offset.x, offset.y],
      },
    }
  );

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    onZoom?.(1);
  }, [onZoom]);

  return {
    bind,
    scale,
    offset,
    reset,
    isZoomed: scale > 1,
    style: {
      transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
      transformOrigin: 'center',
    },
  };
}

/**
 * Swipe-to-dismiss hook with customizable threshold
 * Used for dismissible cards, modals, etc.
 */
export function useSwipeToDismiss(
  onDismiss: () => void,
  config: {
    direction?: 'left' | 'right' | 'up' | 'down';
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { direction = 'left', threshold = 150, enabled = true } = config;

  const [offset, setOffset] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [isDismissing, setIsDismissing] = useState(false);

  const bind = useGesture(
    {
      onDrag: ({ active, movement, direction: dragDir, cancel }) => {
        if (!enabled) {return;}

        const isHorizontal = direction === 'left' || direction === 'right';
        const moveValue = isHorizontal ? movement[0] : movement[1];
        const dragValue = isHorizontal ? dragDir[0] : dragDir[1];

        // Check if dragging in correct direction
        const isCorrectDirection =
          (direction === 'left' && dragValue < 0) ||
          (direction === 'right' && dragValue > 0) ||
          (direction === 'up' && dragValue < 0) ||
          (direction === 'down' && dragValue > 0);

        if (!isCorrectDirection) {
          setOffset(0);
          setOpacity(1);
          return;
        }

        if (active) {
          setOffset(moveValue);
          setOpacity(1 - Math.abs(moveValue) / threshold / 2);

          // Auto-dismiss if threshold exceeded
          if (Math.abs(moveValue) > threshold * 1.5) {
            cancel();
            setIsDismissing(true);
            setTimeout(() => {
              onDismiss();
            }, 200);
          }
        } else {
          if (Math.abs(moveValue) > threshold) {
            setIsDismissing(true);
            setTimeout(() => {
              onDismiss();
            }, 200);
          } else {
            setOffset(0);
            setOpacity(1);
          }
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        axis: direction === 'left' || direction === 'right' ? 'x' : 'y',
      },
    }
  );

  return {
    bind,
    offset,
    opacity,
    isDismissing,
    style: {
      transform:
        direction === 'left' || direction === 'right'
          ? `translateX(${offset}px)`
          : `translateY(${offset}px)`,
      opacity,
      transition: isDismissing ? 'all 0.2s ease-out' : 'none',
    },
  };
}

/**
 * Pull-to-refresh gesture hook
 * Commonly used in mobile apps for refreshing content
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  config: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 80, enabled = true } = config;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const bind = useGesture(
    {
      onDrag: async ({ active, movement: [, my], direction: [, dy], cancel: _cancel, memo = 0 }) => {
        if (!enabled || isRefreshing) {return memo;}

        // Only allow pulling down from top
        if (window.scrollY > 0 || dy < 0) {
          setPullDistance(0);
          setShouldRefresh(false);
          return memo;
        }

        if (active) {
          const distance = Math.max(0, Math.min(my, threshold * 2));
          setPullDistance(distance);
          setShouldRefresh(distance >= threshold);
        } else {
          if (shouldRefresh) {
            setIsRefreshing(true);
            try {
              await onRefresh();
            } finally {
              setIsRefreshing(false);
              setPullDistance(0);
              setShouldRefresh(false);
            }
          } else {
            setPullDistance(0);
            setShouldRefresh(false);
          }
        }

        return memo;
      },
    },
    {
      drag: {
        axis: 'y',
        filterTaps: true,
      },
    }
  );

  const progress = Math.min(pullDistance / threshold, 1);

  return {
    bind,
    pullDistance,
    isRefreshing,
    shouldRefresh,
    progress,
    style: {
      transform: `translateY(${pullDistance}px)`,
      transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
    },
  };
}

/**
 * Long press gesture hook
 * Useful for context menus and alternative actions
 */
export function useLongPress(
  onLongPress: () => void,
  config: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 500, enabled = true } = config;

  const [isPressed, setIsPressed] = useState(false);

  const bind = useGesture(
    {
      onDrag: ({ active, elapsedTime, cancel }) => {
        if (!enabled) {return;}

        if (active) {
          setIsPressed(true);
          if (elapsedTime > threshold) {
            cancel();
            onLongPress();
            setIsPressed(false);
          }
        } else {
          setIsPressed(false);
        }
      },
    },
    {
      drag: {
        threshold: 5, // Small threshold to detect movement
      },
    }
  );

  return {
    bind,
    isPressed,
  };
}
