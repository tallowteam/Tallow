'use client';

/**
 * Intelligent Route Prefetcher
 * Next.js 16 optimized route prefetching
 * Prefetches routes on hover and predicted navigation
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export interface PrefetchOptions {
  priority?: 'high' | 'low' | 'auto';
  delay?: number;
  condition?: () => boolean;
}

/**
 * Route prefetcher class
 */
class RoutePrefetcher {
  private router: ReturnType<typeof useRouter> | null = null;
  private prefetchedRoutes = new Set<string>();
  private prefetchTimeouts = new Map<string, NodeJS.Timeout>();

  setRouter(router: ReturnType<typeof useRouter>) {
    this.router = router;
  }

  /**
   * Prefetch a route
   */
  prefetch(route: string, options: PrefetchOptions = {}) {
    const { priority = 'auto', delay = 0, condition } = options;

    // Check condition
    if (condition && !condition()) {
      return;
    }

    // Skip if already prefetched
    if (this.prefetchedRoutes.has(route)) {
      return;
    }

    // Clear existing timeout
    const existingTimeout = this.prefetchTimeouts.get(route);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule prefetch
    const timeout = setTimeout(() => {
      if (this.router) {
        this.router.prefetch(route);
        this.prefetchedRoutes.add(route);
        this.prefetchTimeouts.delete(route);
        console.info(`[Prefetch] ${route} (${priority})`);
      }
    }, delay);

    this.prefetchTimeouts.set(route, timeout);
  }

  /**
   * Cancel prefetch
   */
  cancel(route: string) {
    const timeout = this.prefetchTimeouts.get(route);
    if (timeout) {
      clearTimeout(timeout);
      this.prefetchTimeouts.delete(route);
    }
  }

  /**
   * Clear all prefetches
   */
  clear() {
    this.prefetchTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.prefetchTimeouts.clear();
    this.prefetchedRoutes.clear();
  }

  /**
   * Get prefetch stats
   */
  getStats() {
    return {
      prefetched: this.prefetchedRoutes.size,
      pending: this.prefetchTimeouts.size,
    };
  }
}

// Singleton instance
const prefetcher = new RoutePrefetcher();

/**
 * Hook for route prefetching
 */
export function useRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    prefetcher.setRouter(router);
  }, [router]);

  const prefetch = useCallback(
    (route: string, options?: PrefetchOptions) => {
      prefetcher.prefetch(route, options);
    },
    []
  );

  const cancel = useCallback((route: string) => {
    prefetcher.cancel(route);
  }, []);

  const clear = useCallback(() => {
    prefetcher.clear();
  }, []);

  return { prefetch, cancel, clear };
}

/**
 * Hook for hover-based prefetching
 */
export function useHoverPrefetch(route: string, options?: PrefetchOptions) {
  const { prefetch, cancel } = useRoutePrefetch();

  const onMouseEnter = useCallback(() => {
    prefetch(route, { delay: 100, ...options });
  }, [route, prefetch, options]);

  const onMouseLeave = useCallback(() => {
    cancel(route);
  }, [route, cancel]);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook for intersection-based prefetching
 */
export function useIntersectionPrefetch(
  route: string,
  options?: PrefetchOptions & { threshold?: number }
) {
  const { prefetch } = useRoutePrefetch();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {return;}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch(route, options);
          }
        });
      },
      { threshold: options?.threshold ?? 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [route, prefetch, options]);

  return elementRef;
}

/**
 * Prefetch multiple routes
 */
export function useBatchPrefetch(routes: string[], options?: PrefetchOptions) {
  const { prefetch } = useRoutePrefetch();

  useEffect(() => {
    routes.forEach((route, index) => {
      prefetch(route, { ...options, delay: index * 100 });
    });
  }, [routes, prefetch, options]);
}

/**
 * Predictive prefetching based on user behavior
 */
export function usePredictivePrefetch() {
  const { prefetch } = useRoutePrefetch();
  const navigationHistory = useRef<string[]>([]);

  const recordNavigation = useCallback((route: string) => {
    navigationHistory.current.push(route);
    // Keep last 10 navigations
    if (navigationHistory.current.length > 10) {
      navigationHistory.current.shift();
    }
  }, []);

  const predictNextRoute = useCallback((): string | null => {
    const history = navigationHistory.current;
    if (history.length < 2) {return null;}

    // Simple prediction: if user alternates between two routes, predict the other
    const lastRoute = history[history.length - 1];
    const secondLastRoute = history[history.length - 2];

    if (lastRoute && secondLastRoute && lastRoute !== secondLastRoute) {
      return secondLastRoute;
    }

    return null;
  }, []);

  const prefetchPredicted = useCallback(() => {
    const predicted = predictNextRoute();
    if (predicted) {
      prefetch(predicted, { priority: 'low', delay: 500 });
    }
  }, [predictNextRoute, prefetch]);

  return {
    recordNavigation,
    predictNextRoute,
    prefetchPredicted,
  };
}

export default prefetcher;
