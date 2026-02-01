/**
 * useScrollProgress Hook
 *
 * Tracks global scroll progress and provides scroll-related state
 * for Euveka-style scroll animations.
 *
 * Features:
 * - Global scroll position tracking
 * - Scroll progress (0-1 for entire page)
 * - Scroll direction detection
 * - Scroll velocity tracking
 * - Debounced scroll end detection
 * - Integration with Zustand scroll animation store
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useScrollAnimationStore } from '@/lib/stores/scroll-animation-store';

export interface UseScrollProgressOptions {
  /** Throttle interval in ms (default: 16 for 60fps) */
  throttle?: number;
  /** Debounce time for scroll end detection in ms */
  scrollEndDelay?: number;
  /** Container element to track (defaults to window) */
  container?: React.RefObject<HTMLElement | null>;
  /** Callback when scroll progress changes */
  onProgressChange?: (progress: number) => void;
  /** Callback when scroll direction changes */
  onDirectionChange?: (direction: 'up' | 'down' | 'none') => void;
  /** Callback when scrolling starts */
  onScrollStart?: () => void;
  /** Callback when scrolling ends */
  onScrollEnd?: () => void;
}

export interface UseScrollProgressReturn {
  /** Current scroll Y position */
  scrollY: number;
  /** Current scroll X position */
  scrollX: number;
  /** Scroll progress (0-1) */
  progress: number;
  /** Scroll direction */
  direction: 'up' | 'down' | 'none';
  /** Whether currently scrolling */
  isScrolling: boolean;
  /** Current scroll velocity */
  velocity: number;
  /** Scroll to top with animation */
  scrollToTop: (smooth?: boolean) => void;
  /** Scroll to specific position */
  scrollTo: (position: number, smooth?: boolean) => void;
  /** Scroll to specific progress (0-1) */
  scrollToProgress: (progress: number, smooth?: boolean) => void;
}

export function useScrollProgress(
  options: UseScrollProgressOptions = {}
): UseScrollProgressReturn {
  const {
    throttle = 16,
    scrollEndDelay = 150,
    container,
    onProgressChange,
    onDirectionChange,
    onScrollStart,
    onScrollEnd,
  } = options;

  // Store state
  const {
    scrollY,
    scrollX,
    scrollProgress,
    scrollDirection,
    isScrolling,
    scrollVelocity,
    setScrollPosition,
    setScrollProgress,
    setIsScrolling,
    animationPreferences,
  } = useScrollAnimationStore();

  // Refs for throttling and debouncing
  const lastScrollTime = useRef<number>(0);
  const scrollEndTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDirection = useRef(scrollDirection);
  const wasScrolling = useRef(false);

  // Calculate scroll progress
  const calculateProgress = useCallback(() => {
    const element = container?.current ?? document.documentElement;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const currentScroll = container?.current
      ? element.scrollTop
      : window.scrollY;
    return scrollHeight > 0 ? currentScroll / scrollHeight : 0;
  }, [container]);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    const now = Date.now();

    // Throttle scroll updates
    if (now - lastScrollTime.current < throttle) {
      return;
    }
    lastScrollTime.current = now;

    // Get current scroll position
    const currentY = container?.current
      ? container.current.scrollTop
      : window.scrollY;
    const currentX = container?.current
      ? container.current.scrollLeft
      : window.scrollX;

    // Update store
    setScrollPosition(currentY, currentX);

    // Calculate and update progress
    const progress = calculateProgress();
    setScrollProgress(progress);
    onProgressChange?.(progress);

    // Handle scroll direction change
    const { scrollDirection: newDirection } = useScrollAnimationStore.getState();
    if (newDirection !== lastDirection.current) {
      lastDirection.current = newDirection;
      onDirectionChange?.(newDirection);
    }

    // Handle scroll start
    if (!wasScrolling.current) {
      wasScrolling.current = true;
      setIsScrolling(true);
      onScrollStart?.();
    }

    // Clear existing scroll end timeout
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
    }

    // Set scroll end timeout
    scrollEndTimeout.current = setTimeout(() => {
      wasScrolling.current = false;
      setIsScrolling(false);
      onScrollEnd?.();
    }, scrollEndDelay);
  }, [
    throttle,
    scrollEndDelay,
    container,
    calculateProgress,
    setScrollPosition,
    setScrollProgress,
    setIsScrolling,
    onProgressChange,
    onDirectionChange,
    onScrollStart,
    onScrollEnd,
  ]);

  // Set up scroll listener
  useEffect(() => {
    const target = container?.current ?? window;
    target.addEventListener('scroll', handleScroll, { passive: true });

    // Initial calculation
    handleScroll();

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
    };
  }, [container, handleScroll]);

  // Scroll utility functions
  const scrollToTop = useCallback(
    (smooth = true) => {
      const behavior = smooth && !animationPreferences.reducedMotion ? 'smooth' : 'auto';
      if (container?.current) {
        container.current.scrollTo({ top: 0, behavior });
      } else {
        window.scrollTo({ top: 0, behavior });
      }
    },
    [container, animationPreferences.reducedMotion]
  );

  const scrollTo = useCallback(
    (position: number, smooth = true) => {
      const behavior = smooth && !animationPreferences.reducedMotion ? 'smooth' : 'auto';
      if (container?.current) {
        container.current.scrollTo({ top: position, behavior });
      } else {
        window.scrollTo({ top: position, behavior });
      }
    },
    [container, animationPreferences.reducedMotion]
  );

  const scrollToProgress = useCallback(
    (progress: number, smooth = true) => {
      const element = container?.current ?? document.documentElement;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const position = scrollHeight * Math.max(0, Math.min(1, progress));
      scrollTo(position, smooth);
    },
    [container, scrollTo]
  );

  return {
    scrollY,
    scrollX,
    progress: scrollProgress,
    direction: scrollDirection,
    isScrolling,
    velocity: scrollVelocity,
    scrollToTop,
    scrollTo,
    scrollToProgress,
  };
}

/**
 * Hook for tracking scroll progress of a specific element
 */
export interface UseElementScrollProgressOptions {
  /** Offset from top of viewport to consider "in view" */
  offset?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

export function useElementScrollProgress(
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseElementScrollProgressOptions = {}
) {
  const { offset = 0 } = options;
  const { scrollY } = useScrollAnimationStore();

  const getProgress = useCallback(() => {
    if (!elementRef.current) {return 0;}

    const rect = elementRef.current.getBoundingClientRect();
    const elementTop = rect.top + scrollY - offset;
    const elementHeight = rect.height;
    const viewportHeight = window.innerHeight;

    // Progress from when element enters viewport to when it leaves
    const scrollProgress =
      (scrollY + viewportHeight - elementTop) / (elementHeight + viewportHeight);

    return Math.max(0, Math.min(1, scrollProgress));
  }, [elementRef, scrollY, offset]);

  return {
    progress: getProgress(),
    scrollY,
  };
}

export default useScrollProgress;
