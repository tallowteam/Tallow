/**
 * useInView Hook
 *
 * Intersection Observer-based hook for scroll animations.
 * Performance optimized with configurable thresholds.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  /**
   * Threshold(s) at which to trigger the callback
   * 0 = as soon as one pixel is visible
   * 1 = when fully visible
   */
  threshold?: number | number[];

  /**
   * Root margin (e.g., '0px 0px -100px 0px')
   * Useful for triggering before element enters viewport
   */
  rootMargin?: string;

  /**
   * Root element for intersection
   * Default: viewport
   */
  root?: Element | null;

  /**
   * Trigger only once
   * Default: true (better performance)
   */
  once?: boolean;

  /**
   * Initial state
   * Default: false
   */
  initialInView?: boolean;

  /**
   * Enable/disable observer
   * Default: true
   */
  enabled?: boolean;
}

export interface UseInViewResult<T extends Element> {
  /**
   * Ref to attach to the element to observe
   */
  ref: (node: T | null) => void;

  /**
   * Whether the element is in view
   */
  isInView: boolean;

  /**
   * Entry object from IntersectionObserver
   */
  entry?: IntersectionObserverEntry | undefined;
}

/**
 * Hook to detect when an element enters the viewport
 *
 * @example
 * ```tsx
 * const { ref, isInView } = useInView({ threshold: 0.5, once: true });
 *
 * return (
 *   <div ref={ref} className={isInView ? 'animate-in' : ''}>
 *     Content
 *   </div>
 * );
 * ```
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {}
): UseInViewResult<T> {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    once = true,
    initialInView = false,
    enabled = true,
  } = options;

  const [isInView, setIsInView] = useState(initialInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const nodeRef = useRef<T | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Early return if not enabled or no IntersectionObserver support
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const node = nodeRef.current;
    if (!node) return undefined;

    // Early return if already triggered and once is true
    if (once && hasTriggered.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const isIntersecting = entry.isIntersecting;

        setEntry(entry);

        // Update state
        if (isIntersecting) {
          setIsInView(true);
          hasTriggered.current = true;

          // Disconnect if once option is true
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          // Only update to false if not once
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, root, once, enabled]);

  const ref = (node: T | null) => {
    nodeRef.current = node;
  };

  return { ref, isInView, entry };
}

/**
 * Multiple elements variant - observe multiple elements with one hook
 *
 * @example
 * ```tsx
 * const { register, inView } = useInViewMultiple();
 *
 * return (
 *   <>
 *     <div ref={register(0)} className={inView[0] ? 'show' : 'hide'}>Item 1</div>
 *     <div ref={register(1)} className={inView[1] ? 'show' : 'hide'}>Item 2</div>
 *   </>
 * );
 * ```
 */
export function useInViewMultiple<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {}
): {
  register: (index: number) => (node: T | null) => void;
  inView: Record<number, boolean>;
} {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    once = true,
  } = options;

  const [inView, setInView] = useState<Record<number, boolean>>({});
  const nodesRef = useRef<Map<number, T>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggeredRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates: Record<number, boolean> = {};

        entries.forEach((entry) => {
          const index = Array.from(nodesRef.current.entries()).find(
            ([, node]) => node === entry.target
          )?.[0];

          if (index !== undefined) {
            const isIntersecting = entry.isIntersecting;

            if (isIntersecting) {
              updates[index] = true;
              triggeredRef.current.add(index);

              if (once && observerRef.current) {
                observerRef.current.unobserve(entry.target);
              }
            } else if (!once) {
              updates[index] = false;
            }
          }
        });

        if (Object.keys(updates).length > 0) {
          setInView((prev) => ({ ...prev, ...updates }));
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    // Observe all existing nodes
    nodesRef.current.forEach((node) => {
      observerRef.current?.observe(node);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, root, once]);

  const register = (index: number) => (node: T | null) => {
    if (node) {
      nodesRef.current.set(index, node);
      observerRef.current?.observe(node);
    } else {
      const existingNode = nodesRef.current.get(index);
      if (existingNode && observerRef.current) {
        observerRef.current.unobserve(existingNode);
      }
      nodesRef.current.delete(index);
    }
  };

  return { register, inView };
}
