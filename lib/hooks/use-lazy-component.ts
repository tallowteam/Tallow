/**
 * Smart Lazy Loading Hook
 * Uses Intersection Observer to load components only when they're about to be visible
 *
 * Performance Benefits:
 * - Reduces initial bundle size
 * - Improves Time to Interactive (TTI)
 * - Lower memory footprint
 * - Better mobile performance
 */

import { useEffect, useState, RefObject } from 'react';

export interface LazyComponentOptions {
  /**
   * Distance in pixels from viewport before loading
   * Default: 200px (loads slightly before visible)
   */
  rootMargin?: string;

  /**
   * Percentage of element that must be visible
   * Default: 0 (load as soon as it enters viewport)
   */
  threshold?: number | number[];

  /**
   * Disable lazy loading (useful for above-the-fold content)
   * Default: false
   */
  disabled?: boolean;

  /**
   * Load on idle instead of intersection
   * Default: false
   */
  loadOnIdle?: boolean;

  /**
   * Timeout for idle loading (ms)
   * Default: 2000
   */
  idleTimeout?: number;
}

/**
 * Hook for lazy loading components based on visibility
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useRef(null);
 *   const shouldLoad = useLazyComponent(ref);
 *
 *   return (
 *     <div ref={ref}>
 *       {shouldLoad ? <HeavyComponent /> : <Skeleton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyComponent(
  ref: RefObject<Element>,
  options: LazyComponentOptions = {}
): boolean {
  const {
    rootMargin = '200px',
    threshold = 0,
    disabled = false,
    loadOnIdle = false,
    idleTimeout = 2000,
  } = options;

  const [shouldLoad, setShouldLoad] = useState(disabled);

  useEffect(() => {
    // Always load if disabled or no ref
    if (disabled || !ref.current) {
      setShouldLoad(true);
      return undefined;
    }

    // Load on idle if specified
    if (loadOnIdle) {
      const timeoutId = setTimeout(() => {
        setShouldLoad(true);
      }, idleTimeout);

      if ('requestIdleCallback' in window) {
        const idleId = requestIdleCallback(() => {
          setShouldLoad(true);
        });

        return () => {
          clearTimeout(timeoutId);
          cancelIdleCallback(idleId);
        };
      }

      return () => clearTimeout(timeoutId);
    }

    // Use Intersection Observer for viewport-based loading
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        {
          rootMargin,
          threshold,
        }
      );

      observer.observe(ref.current);

      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback for browsers without IntersectionObserver
      setShouldLoad(true);
      return undefined;
    }
  }, [ref, rootMargin, threshold, disabled, loadOnIdle, idleTimeout]);

  return shouldLoad;
}

/**
 * Hook for preloading components on user interaction
 *
 * @example
 * ```tsx
 * function Button() {
 *   const ref = useRef(null);
 *   const { preload, shouldLoad } = usePreloadComponent(ref);
 *
 *   return (
 *     <button ref={ref} onMouseEnter={preload}>
 *       {shouldLoad ? 'Loaded' : 'Click me'}
 *     </button>
 *   );
 * }
 * ```
 */
export function usePreloadComponent() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  const preload = () => {
    if (!shouldLoad && !isPreloading) {
      setIsPreloading(true);
      // Small delay to avoid flickering
      requestAnimationFrame(() => {
        setShouldLoad(true);
      });
    }
  };

  return {
    shouldLoad,
    isPreloading,
    preload,
  };
}

/**
 * Hook for progressive loading with multiple stages
 * Useful for complex components with multiple heavy parts
 *
 * @example
 * ```tsx
 * function ComplexComponent() {
 *   const { stage } = useProgressiveLoad([0, 500, 1000]);
 *
 *   return (
 *     <>
 *       {stage >= 0 && <CoreContent />}
 *       {stage >= 1 && <SecondaryContent />}
 *       {stage >= 2 && <EnhancedFeatures />}
 *     </>
 *   );
 * }
 * ```
 */
export function useProgressiveLoad(stages: number[] = [0, 500, 1000]) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    stages.forEach((delay, index) => {
      const timer = setTimeout(() => {
        setCurrentStage(index);
      }, delay);

      return () => clearTimeout(timer);
    });
  }, [stages]);

  return {
    stage: currentStage,
    isComplete: currentStage === stages.length - 1,
  };
}

/**
 * Hook for loading components based on network conditions
 * Only loads heavy components on fast connections
 */
export function useNetworkAwareLazyLoad() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      // Load by default if Network Information API not available
      setShouldLoad(true);
      return undefined;
    }

    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    // Load on 4g or faster
    if (effectiveType === '4g' || !effectiveType) {
      setShouldLoad(true);
      return undefined;
    } else {
      // On slow connections, wait for user interaction
      const loadOnInteraction = () => {
        setShouldLoad(true);
      };

      document.addEventListener('click', loadOnInteraction, { once: true });
      return () =>
        document.removeEventListener('click', loadOnInteraction);
    }
  }, []);

  return shouldLoad;
}

/**
 * Hook for lazy loading with memory constraints
 * Monitors available memory and defers loading if low
 */
export function useMemoryAwareLazyLoad(
  thresholdMB: number = 100
): boolean {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      // Load by default if Memory API not available
      setShouldLoad(true);
      return undefined;
    }

    const memory = (performance as any).memory;
    const availableMB =
      (memory.jsHeapSizeLimit - memory.usedJSHeapSize) / 1024 / 1024;

    if (availableMB > thresholdMB) {
      setShouldLoad(true);
    } else {
      // Retry after garbage collection opportunity
      setTimeout(() => {
        setShouldLoad(true);
      }, 1000);
    }
    return undefined;
  }, [thresholdMB]);

  return shouldLoad;
}

/**
 * Composite hook combining multiple loading strategies
 */
export interface SmartLazyLoadOptions extends LazyComponentOptions {
  checkNetwork?: boolean;
  checkMemory?: boolean;
  memoryThresholdMB?: number;
}

export function useSmartLazyLoad(
  ref: RefObject<Element>,
  options: SmartLazyLoadOptions = {}
): boolean {
  const {
    checkNetwork = false,
    checkMemory = false,
    memoryThresholdMB = 100,
    ...lazyOptions
  } = options;

  const intersectionLoad = useLazyComponent(ref, lazyOptions);
  const networkLoad = useNetworkAwareLazyLoad();
  const memoryLoad = useMemoryAwareLazyLoad(memoryThresholdMB);

  // Combine all conditions
  if (checkNetwork && !networkLoad) {return false;}
  if (checkMemory && !memoryLoad) {return false;}
  return intersectionLoad;
}

/**
 * Priority levels for component loading
 */
export enum LoadPriority {
  CRITICAL = 0, // Load immediately
  HIGH = 1, // Load on idle
  MEDIUM = 2, // Load on intersection
  LOW = 3, // Load on user interaction
}

/**
 * Hook for priority-based lazy loading
 */
export function usePriorityLazyLoad(
  priority: LoadPriority = LoadPriority.MEDIUM
): boolean {
  const [shouldLoad, setShouldLoad] = useState(
    priority === LoadPriority.CRITICAL
  );

  useEffect(() => {
    if (shouldLoad) {return undefined;}

    switch (priority) {
      case LoadPriority.HIGH:
        // Load on next idle
        if ('requestIdleCallback' in window) {
          const id = requestIdleCallback(() => setShouldLoad(true));
          return () => cancelIdleCallback(id);
        }
        setTimeout(() => setShouldLoad(true), 100);
        return undefined;

      case LoadPriority.MEDIUM:
        // Load after short delay
        const timer = setTimeout(() => setShouldLoad(true), 500);
        return () => clearTimeout(timer);

      case LoadPriority.LOW:
        // Load on user interaction
        const handleInteraction = () => setShouldLoad(true);
        document.addEventListener('click', handleInteraction, {
          once: true,
        });
        document.addEventListener('scroll', handleInteraction, {
          once: true,
          passive: true,
        });
        return () => {
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('scroll', handleInteraction);
        };

      default:
        setShouldLoad(true);
        return undefined;
    }
  }, [priority, shouldLoad]);

  return shouldLoad;
}
