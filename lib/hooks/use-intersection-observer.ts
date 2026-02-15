'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * Only trigger once when element enters viewport
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Enable/disable the observer
   * @default true
   */
  enabled?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    triggerOnce = true,
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) {return;}

    // Skip if already triggered and triggerOnce is enabled
    if (triggerOnce && hasIntersected) {return;}

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {return;}

        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce, hasIntersected, enabled]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
    isVisible: triggerOnce ? hasIntersected : isIntersecting,
  };
}

/**
 * Hook for staggered animations on a list of items
 */
export function useStaggeredIntersectionObserver<T extends HTMLElement = HTMLElement>(
  count: number,
  options: UseIntersectionObserverOptions = {}
) {
  const refs = useRef<(T | null)[]>([]);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    triggerOnce = true,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) {return;}

    const observers: IntersectionObserver[] = [];

    refs.current.forEach((element, index) => {
      if (!element) {return;}

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) {return;}

          if (entry.isIntersecting) {
            setVisibleIndices((prev) => new Set([...prev, index]));
            if (triggerOnce) {
              observer.disconnect();
            }
          } else if (!triggerOnce) {
            setVisibleIndices((prev) => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });
          }
        },
        {
          threshold,
          root,
          rootMargin,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [count, threshold, root, rootMargin, triggerOnce, enabled]);

  const setRef = (index: number) => (element: T | null) => {
    refs.current[index] = element;
  };

  const isVisible = (index: number) => visibleIndices.has(index);

  return {
    setRef,
    isVisible,
    visibleIndices,
  };
}

/**
 * Hook to detect if user prefers reduced motion.
 *
 * Reads the `prefers-reduced-motion: reduce` media query and
 * returns a reactive boolean. Listens for changes (e.g., user
 * toggles the OS accessibility setting while the page is open).
 *
 * SSR-safe: returns false during server rendering.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook that returns a motion-aware duration value.
 *
 * When the user prefers reduced motion, returns 0.
 * Otherwise returns the base duration.
 *
 * @param baseMs - Duration in milliseconds when motion is allowed
 * @returns 0 if reduced motion is active, baseMs otherwise
 */
export function useMotionDuration(baseMs: number): number {
  const reduced = useReducedMotion();
  return reduced ? 0 : baseMs;
}

/**
 * Hook that returns a slowed duration for essential animations.
 *
 * Loading spinners, progress bars, and similar essential motion
 * should not be eliminated entirely under reduced motion, only
 * slowed down significantly (3x slower).
 *
 * @param baseMs - Duration in ms
 * @returns Slowed duration if reduced motion, base otherwise
 */
export function useEssentialMotionDuration(baseMs: number): number {
  const reduced = useReducedMotion();
  return reduced ? baseMs * 3 : baseMs;
}
