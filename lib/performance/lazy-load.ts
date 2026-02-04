/**
 * Lazy Loading Utilities
 *
 * Provides utilities for lazy loading components, modules, and resources
 * to optimize initial bundle size and improve Core Web Vitals.
 *
 * @module lib/performance/lazy-load
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LazyComponentOptions {
  /** Delay before loading starts (ms) - useful for perceived performance */
  delay?: number;
  /** Minimum time to show loading state (ms) - prevents flash */
  minimumLoadingTime?: number;
  /** Retry count on failure */
  retries?: number;
  /** Retry delay (ms) */
  retryDelay?: number;
  /** Preload on hover/focus */
  preloadOnInteraction?: boolean;
}

export interface LazyModuleResult<T> {
  module: T;
  loadTime: number;
}

// ============================================================================
// LAZY COMPONENT LOADER
// ============================================================================

/**
 * Enhanced lazy loader with retry logic and timing
 *
 * @example
 * const HeavyChart = lazyLoad(() => import('@/components/HeavyChart'));
 * const Modal = lazyLoad(() => import('@/components/Modal'), { retries: 3 });
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const { delay = 0, minimumLoadingTime = 0, retries = 2, retryDelay = 1000 } = options;

  return lazy(async () => {
    const startTime = performance.now();

    // Optional delay before loading
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Retry logic
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const module = await importFn();

        // Ensure minimum loading time for smooth UX
        const loadTime = performance.now() - startTime;
        if (loadTime < minimumLoadingTime) {
          await new Promise((resolve) =>
            setTimeout(resolve, minimumLoadingTime - loadTime)
          );
        }

        // Track successful load
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark(`lazy-load-${importFn.toString().slice(0, 50)}`);
        }

        return module;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  });
}

// ============================================================================
// DYNAMIC IMPORT WITH TRACKING
// ============================================================================

/**
 * Dynamic import with performance tracking
 *
 * @example
 * const { module, loadTime } = await dynamicImport(() => import('heavy-lib'));
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  name?: string
): Promise<LazyModuleResult<T>> {
  const startTime = performance.now();
  const markName = `dynamic-import-${name || 'module'}`;

  if (typeof window !== 'undefined') {
    performance.mark(`${markName}-start`);
  }

  const module = await importFn();
  const loadTime = performance.now() - startTime;

  if (typeof window !== 'undefined') {
    performance.mark(`${markName}-end`);
    performance.measure(markName, `${markName}-start`, `${markName}-end`);
  }

  return { module, loadTime };
}

// ============================================================================
// PRELOAD UTILITIES
// ============================================================================

const preloadedModules = new Set<string>();

/**
 * Preload a module in the background
 *
 * @example
 * // Preload on hover
 * onMouseEnter={() => preloadModule(() => import('./HeavyComponent'))}
 */
export function preloadModule(
  importFn: () => Promise<unknown>,
  identifier?: string
): void {
  const id = identifier || importFn.toString();
  if (preloadedModules.has(id)) return;

  preloadedModules.add(id);

  // Use requestIdleCallback for non-critical preloading
  if ('requestIdleCallback' in window) {
    (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
      importFn().catch(() => {
        // Silent fail - preloading is opportunistic
        preloadedModules.delete(id);
      });
    });
  } else {
    // Fallback for Safari
    setTimeout(() => {
      importFn().catch(() => {
        preloadedModules.delete(id);
      });
    }, 100);
  }
}

/**
 * Create a preloadable lazy component
 *
 * @example
 * const [LazyModal, preloadModal] = createPreloadableComponent(
 *   () => import('./Modal')
 * );
 *
 * // In component
 * <button onMouseEnter={preloadModal}>Open Modal</button>
 */
export function createPreloadableComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): [LazyExoticComponent<T>, () => void] {
  const LazyComponent = lazyLoad(importFn, options);
  const preload = () => preloadModule(importFn);

  return [LazyComponent, preload];
}

// ============================================================================
// INTERSECTION OBSERVER LOADER
// ============================================================================

/**
 * Load component when it enters viewport
 *
 * @example
 * useIntersectionLoad(ref, () => import('./HeavySection'));
 */
export function createIntersectionLoader(
  importFn: () => Promise<unknown>,
  options: IntersectionObserverInit = {}
): {
  observe: (element: Element) => void;
  disconnect: () => void;
} {
  let loaded = false;
  let observer: IntersectionObserver | null = null;

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '100px', // Preload when 100px from viewport
    threshold: 0,
    ...options,
  };

  const observe = (element: Element) => {
    if (loaded || typeof IntersectionObserver === 'undefined') {
      // Load immediately if already loaded or no IO support
      importFn();
      return;
    }

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loaded) {
          loaded = true;
          importFn();
          observer?.disconnect();
        }
      }
    }, defaultOptions);

    observer.observe(element);
  };

  const disconnect = () => {
    observer?.disconnect();
    observer = null;
  };

  return { observe, disconnect };
}

// ============================================================================
// CONDITIONAL LOADING
// ============================================================================

/**
 * Conditionally load a module based on feature detection
 *
 * @example
 * const WebGL = await conditionalLoad(
 *   () => import('webgl-lib'),
 *   () => 'WebGL2RenderingContext' in window
 * );
 */
export async function conditionalLoad<T>(
  importFn: () => Promise<T>,
  condition: () => boolean
): Promise<T | null> {
  if (!condition()) {
    return null;
  }
  return importFn();
}

/**
 * Load polyfill only if needed
 *
 * @example
 * await loadPolyfillIfNeeded(
 *   () => import('intersection-observer'),
 *   () => !('IntersectionObserver' in window)
 * );
 */
export async function loadPolyfillIfNeeded(
  importFn: () => Promise<unknown>,
  needsPolyfill: () => boolean
): Promise<void> {
  if (needsPolyfill()) {
    await importFn();
  }
}

// ============================================================================
// CHUNK NAMING HELPERS
// ============================================================================

/**
 * Named chunks for better debugging and caching
 * Use with webpack magic comments
 *
 * @example
 * const Chart = lazyLoad(
 *   namedChunk('chart', () => import('./Chart'))
 * );
 */
export function namedChunk<T>(
  _name: string,
  importFn: () => Promise<T>
): () => Promise<T> {
  // The name is used by webpack magic comments in the actual import
  // This wrapper just provides a clean API
  return importFn;
}

// ============================================================================
// SUSPENSE HELPERS
// ============================================================================

/**
 * Create a suspense resource for data fetching
 * Implements the "render-as-you-fetch" pattern
 */
export function createResource<T>(
  asyncFn: () => Promise<T>
): {
  read: () => T;
} {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: T;
  let error: Error;

  const promise = asyncFn().then(
    (data) => {
      status = 'success';
      result = data;
    },
    (err) => {
      status = 'error';
      error = err;
    }
  );

  return {
    read(): T {
      switch (status) {
        case 'pending':
          throw promise;
        case 'error':
          throw error;
        case 'success':
          return result;
        default:
          throw new Error('Unknown resource state');
      }
    },
  };
}

// ============================================================================
// ROUTE-BASED CODE SPLITTING HELPERS
// ============================================================================

/**
 * Preload route on link interaction
 *
 * @example
 * <Link href="/dashboard" onMouseEnter={() => preloadRoute('/dashboard')}>
 */
export function preloadRoute(path: string): void {
  // Next.js handles this via Link prefetch, but we can add our own logic
  if (typeof window !== 'undefined') {
    // Use link preload for the route
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'document';
    document.head.appendChild(link);
  }
}

/**
 * Preload multiple routes
 *
 * @example
 * preloadRoutes(['/dashboard', '/settings', '/profile']);
 */
export function preloadRoutes(paths: string[]): void {
  if (typeof window === 'undefined') return;

  // Spread out preloading to avoid blocking
  paths.forEach((path, index) => {
    setTimeout(() => preloadRoute(path), index * 100);
  });
}

export default {
  lazyLoad,
  dynamicImport,
  preloadModule,
  createPreloadableComponent,
  createIntersectionLoader,
  conditionalLoad,
  loadPolyfillIfNeeded,
  namedChunk,
  createResource,
  preloadRoute,
  preloadRoutes,
};
