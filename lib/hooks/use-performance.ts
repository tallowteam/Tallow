'use client';

/**
 * React Hook for Performance Monitoring
 *
 * Provides easy access to performance metrics and monitoring utilities
 * within React components.
 *
 * @module lib/hooks/use-performance
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  markStart,
  markEnd,
  measure,
  initCoreWebVitals,
  onMetric,
  observeLongTasks,
  type PerformanceMetric,
} from '@/lib/performance/monitoring';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePerformanceOptions {
  /** Enable Core Web Vitals tracking */
  trackWebVitals?: boolean;
  /** Enable long task detection */
  trackLongTasks?: boolean;
  /** Metric callback */
  onMetric?: (metric: PerformanceMetric) => void;
  /** Long task callback */
  onLongTask?: (entry: PerformanceEntry) => void;
}

export interface UsePerformanceReturn {
  /** Mark start of a measurement */
  markStart: (name: string) => void;
  /** Mark end and get duration */
  markEnd: (name: string) => number;
  /** Measure an async function */
  measure: <T>(name: string, fn: () => T | Promise<T>) => Promise<{ result: T; duration: number }>;
  /** Collected metrics */
  metrics: PerformanceMetric[];
  /** Long tasks detected */
  longTasks: PerformanceEntry[];
}

// ============================================================================
// HOOK: usePerformance
// ============================================================================

/**
 * Hook for performance monitoring in components
 *
 * @example
 * function MyComponent() {
 *   const { markStart, markEnd, metrics } = usePerformance({
 *     trackWebVitals: true,
 *     onMetric: (m) => console.log('Metric:', m),
 *   });
 *
 *   useEffect(() => {
 *     markStart('data-fetch');
 *     fetchData().then(() => {
 *       const duration = markEnd('data-fetch');
 *       console.log('Fetch took:', duration);
 *     });
 *   }, []);
 *
 *   return <div>Metrics: {metrics.length}</div>;
 * }
 */
export function usePerformance(
  options: UsePerformanceOptions = {}
): UsePerformanceReturn {
  const {
    trackWebVitals = false,
    trackLongTasks = false,
    onMetric: onMetricCallback,
    onLongTask,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [longTasks, setLongTasks] = useState<PerformanceEntry[]>([]);

  // Track Web Vitals
  useEffect(() => {
    if (!trackWebVitals) {return;}

    const handleMetric = (metric: PerformanceMetric) => {
      setMetrics((prev) => [...prev, metric]);
      onMetricCallback?.(metric);
    };

    initCoreWebVitals(handleMetric);
    const unsubscribe = onMetric(handleMetric);

    return unsubscribe;
  }, [trackWebVitals, onMetricCallback]);

  // Track long tasks
  useEffect(() => {
    if (!trackLongTasks) {return;}

    return observeLongTasks((entry) => {
      setLongTasks((prev) => [...prev, entry]);
      onLongTask?.(entry);
    });
  }, [trackLongTasks, onLongTask]);

  return {
    markStart,
    markEnd,
    measure,
    metrics,
    longTasks,
  };
}

// ============================================================================
// HOOK: useRenderTime
// ============================================================================

/**
 * Hook to measure component render time
 *
 * @example
 * function MyComponent() {
 *   const renderTime = useRenderTime('MyComponent');
 *
 *   // renderTime is the last render duration in ms
 *   return <div>Render time: {renderTime}ms</div>;
 * }
 */
export function useRenderTime(componentName: string): number {
  const startTime = useRef(performance.now());
  const [renderTime, setRenderTime] = useState(0);

  // Mark start time on each render
  startTime.current = performance.now();

  // Measure after render
  useEffect(() => {
    const duration = performance.now() - startTime.current;
    setRenderTime(duration);

    // Report to performance API
    try {
      performance.measure(`render-${componentName}`, {
        start: startTime.current,
        duration,
      });
    } catch {
      // Ignore if measure fails
    }

    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(`[Performance] Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  });

  return renderTime;
}

// ============================================================================
// HOOK: useAsyncTiming
// ============================================================================

/**
 * Hook to time async operations
 *
 * @example
 * function MyComponent() {
 *   const { time, isLoading, lastDuration } = useAsyncTiming();
 *
 *   const handleClick = async () => {
 *     const data = await time('api-call', () => fetch('/api/data'));
 *     console.log('Took:', lastDuration);
 *   };
 *
 *   return <button onClick={handleClick}>Fetch</button>;
 * }
 */
export function useAsyncTiming() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const time = useCallback(async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const { result, duration } = await measure(name, fn);
      setLastDuration(duration);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { time, isLoading, lastDuration, error };
}

// ============================================================================
// HOOK: useIdleCallback
// ============================================================================

/**
 * Hook to run code during idle time
 *
 * @example
 * function MyComponent() {
 *   const scheduleIdle = useIdleCallback();
 *
 *   useEffect(() => {
 *     scheduleIdle(() => {
 *       // Run expensive operation during idle time
 *       preloadHeavyAssets();
 *     });
 *   }, []);
 * }
 */
export function useIdleCallback(): (callback: () => void, timeout?: number) => void {
  const callbackRef = useRef<(() => void) | null>(null);
  const idleRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (idleRef.current !== null) {
        if ('cancelIdleCallback' in window) {
          (window as Window & typeof globalThis & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleRef.current);
        }
      }
    };
  }, []);

  return useCallback((callback: () => void, timeout = 2000) => {
    callbackRef.current = callback;

    if ('requestIdleCallback' in window) {
      idleRef.current = (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        () => callbackRef.current?.(),
        { timeout }
      );
    } else {
      // Fallback for Safari
      setTimeout(() => callbackRef.current?.(), 1);
    }
  }, []);
}

// ============================================================================
// HOOK: useIntersectionLoad
// ============================================================================

/**
 * Hook to load content when element is visible
 *
 * @example
 * function LazySection() {
 *   const { ref, isVisible, hasLoaded } = useIntersectionLoad({
 *     rootMargin: '100px',
 *     onLoad: () => fetchData(),
 *   });
 *
 *   return (
 *     <section ref={ref}>
 *       {hasLoaded ? <Content /> : <Placeholder />}
 *     </section>
 *   );
 * }
 */
export function useIntersectionLoad(options: {
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  once?: boolean;
} = {}): {
  ref: React.RefCallback<Element>;
  isVisible: boolean;
  hasLoaded: boolean;
} {
  const { rootMargin = '50px', threshold = 0, onLoad, once = true } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<Element | null>(null);

  const ref = useCallback((element: Element | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!element) {
      elementRef.current = null;
      return;
    }

    elementRef.current = element;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            setHasLoaded(true);
            onLoad?.();
          }
          if (once) {
            observerRef.current?.disconnect();
          }
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observerRef.current.observe(element);
  }, [rootMargin, threshold, onLoad, once]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isVisible, hasLoaded };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default usePerformance;
