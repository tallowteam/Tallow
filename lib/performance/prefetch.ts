/**
 * Prefetching Utilities
 *
 * Intelligent prefetching for routes, links, and resources.
 * Uses IntersectionObserver and network-aware loading.
 *
 * @module lib/performance/prefetch
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PrefetchOptions {
  /** Priority: high for critical, low for opportunistic */
  priority?: 'high' | 'low';
  /** Prefetch type */
  as?: 'document' | 'script' | 'style' | 'image' | 'font' | 'fetch';
  /** Cross-origin mode */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Only prefetch on fast connections */
  respectDataSaver?: boolean;
  /** Timeout before prefetch is cancelled */
  timeout?: number;
}

export interface PrefetchLinkOptions extends PrefetchOptions {
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Delay after intersection before prefetching */
  delay?: number;
}

export interface NetworkInfo {
  saveData: boolean;
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
}

// ============================================================================
// NETWORK DETECTION
// ============================================================================

/**
 * Get network information if available
 */
export function getNetworkInfo(): NetworkInfo | null {
  if (typeof navigator === 'undefined') {return null;}

  // Navigator connection API
  type NavigatorWithConnection = Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };

  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) {return null;}

  return {
    saveData: connection.saveData || false,
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
  };
}

/**
 * Check if connection is fast enough for prefetching
 */
export function canPrefetch(options: PrefetchOptions = {}): boolean {
  if (typeof window === 'undefined') {return false;}

  const networkInfo = getNetworkInfo();

  // Respect data saver mode
  if (options.respectDataSaver && networkInfo?.saveData) {
    return false;
  }

  // Skip on slow connections for non-critical prefetches
  if (options.priority === 'low' && networkInfo) {
    const slowConnections = ['slow-2g', '2g'];
    if (slowConnections.includes(networkInfo.effectiveType)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// PREFETCH CORE
// ============================================================================

const prefetchedUrls = new Set<string>();

/**
 * Prefetch a URL using link rel="prefetch"
 *
 * @example
 * prefetchUrl('/api/data', { as: 'fetch' });
 * prefetchUrl('/about', { as: 'document' });
 */
export function prefetchUrl(
  url: string,
  options: PrefetchOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Skip if already prefetched
    if (prefetchedUrls.has(url)) {
      resolve();
      return;
    }

    // Check network conditions
    if (!canPrefetch(options)) {
      resolve();
      return;
    }

    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = options.priority === 'high' ? 'preload' : 'prefetch';
    link.href = url;

    if (options.as) {
      link.as = options.as;
    }

    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    // Handle load/error
    link.onload = () => {
      prefetchedUrls.add(url);
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to prefetch: ${url}`));
    };

    // Optional timeout
    if (options.timeout) {
      setTimeout(() => {
        if (!prefetchedUrls.has(url)) {
          link.remove();
          resolve(); // Resolve anyway - prefetching is opportunistic
        }
      }, options.timeout);
    }

    document.head.appendChild(link);
  });
}

/**
 * Prefetch multiple URLs
 *
 * @example
 * prefetchUrls(['/about', '/contact', '/pricing']);
 */
export async function prefetchUrls(
  urls: string[],
  options: PrefetchOptions = {}
): Promise<void[]> {
  // Stagger prefetches to avoid blocking
  const results: Promise<void>[] = [];

  for (let i = 0; i < urls.length; i++) {
    results.push(
      new Promise((resolve) => {
        setTimeout(() => {
          const url = urls[i];
          if (url) {
            prefetchUrl(url, options).then(resolve).catch(() => resolve());
          } else {
            resolve();
          }
        }, i * 100);
      })
    );
  }

  return Promise.all(results);
}

// ============================================================================
// INTERSECTION-BASED PREFETCHING
// ============================================================================

/**
 * Create an intersection observer for prefetching links
 *
 * @example
 * const observer = createLinkPrefetcher();
 * observer.observe(linkElement);
 */
export function createLinkPrefetcher(
  options: PrefetchLinkOptions = {}
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {return null;}

  const { rootMargin = '200px', delay = 0, ...prefetchOptions } = options;

  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.href;

          if (href && !prefetchedUrls.has(href)) {
            if (delay > 0) {
              setTimeout(() => {
                prefetchUrl(href, { ...prefetchOptions, as: 'document' });
              }, delay);
            } else {
              prefetchUrl(href, { ...prefetchOptions, as: 'document' });
            }
          }
        }
      }
    },
    {
      root: null,
      rootMargin,
      threshold: 0,
    }
  );
}

/**
 * Auto-prefetch all internal links in a container
 *
 * @example
 * autoPreetchLinks(document.querySelector('nav'));
 */
export function autoPrefetchLinks(
  container: Element = document.body,
  options: PrefetchLinkOptions = {}
): () => void {
  const observer = createLinkPrefetcher(options);
  if (!observer) {return () => {};}

  const links = container.querySelectorAll('a[href^="/"]');
  links.forEach((link) => observer.observe(link));

  return () => observer.disconnect();
}

// ============================================================================
// HOVER-BASED PREFETCHING
// ============================================================================

const hoverTimers = new Map<Element, ReturnType<typeof setTimeout>>();

/**
 * Prefetch on hover with delay
 *
 * @example
 * addHoverPrefetch(linkElement, '/dashboard');
 */
export function addHoverPrefetch(
  element: Element,
  url: string,
  options: PrefetchOptions & { hoverDelay?: number } = {}
): () => void {
  const { hoverDelay = 100, ...prefetchOptions } = options;

  const handleMouseEnter = () => {
    const timer = setTimeout(() => {
      prefetchUrl(url, { ...prefetchOptions, as: 'document' });
    }, hoverDelay);
    hoverTimers.set(element, timer);
  };

  const handleMouseLeave = () => {
    const timer = hoverTimers.get(element);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.delete(element);
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    const timer = hoverTimers.get(element);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.delete(element);
    }
  };
}

// ============================================================================
// SPECULATIVE PREFETCHING
// ============================================================================

/**
 * Prefetch likely next pages based on current route
 *
 * @example
 * prefetchLikelyRoutes('/products/123', {
 *   '/products/123': ['/cart', '/products/123/reviews'],
 *   '/cart': ['/checkout'],
 * });
 */
export function prefetchLikelyRoutes(
  currentPath: string,
  routeMap: Record<string, string[]>,
  options: PrefetchOptions = {}
): void {
  const likelyRoutes = routeMap[currentPath];
  if (likelyRoutes) {
    prefetchUrls(likelyRoutes, { ...options, priority: 'low' });
  }
}

/**
 * Prefetch based on user intent signals
 *
 * @example
 * prefetchOnIntent(buttonElement, '/checkout', ['mousedown', 'touchstart']);
 */
export function prefetchOnIntent(
  element: Element,
  url: string,
  events: string[] = ['mousedown', 'touchstart', 'focus']
): () => void {
  let prefetched = false;

  const handler = () => {
    if (!prefetched) {
      prefetched = true;
      prefetchUrl(url, { priority: 'high', as: 'document' });
    }
  };

  events.forEach((event) => {
    element.addEventListener(event, handler, { once: true, passive: true });
  });

  return () => {
    events.forEach((event) => {
      element.removeEventListener(event, handler);
    });
  };
}

// ============================================================================
// RESOURCE HINTS
// ============================================================================

/**
 * Add DNS prefetch for external domains
 *
 * @example
 * dnsPrefetch('https://api.example.com');
 */
export function dnsPrefetch(url: string): void {
  if (typeof document === 'undefined') {return;}

  try {
    const { hostname } = new URL(url);
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${hostname}`;
    document.head.appendChild(link);
  } catch {
    // Invalid URL - ignore
  }
}

/**
 * Add preconnect for critical third-party origins
 *
 * @example
 * preconnect('https://fonts.googleapis.com');
 */
export function preconnect(url: string, crossOrigin = true): void {
  if (typeof document === 'undefined') {return;}

  try {
    const { origin } = new URL(url);
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  } catch {
    // Invalid URL - ignore
  }
}

/**
 * Add multiple resource hints at once
 *
 * @example
 * addResourceHints({
 *   preconnect: ['https://fonts.googleapis.com', 'https://api.example.com'],
 *   dnsPrefetch: ['https://analytics.example.com'],
 * });
 */
export function addResourceHints(hints: {
  preconnect?: string[];
  dnsPrefetch?: string[];
  prefetch?: string[];
}): void {
  hints.preconnect?.forEach((url) => preconnect(url));
  hints.dnsPrefetch?.forEach((url) => dnsPrefetch(url));
  hints.prefetch?.forEach((url) => prefetchUrl(url));
}

// ============================================================================
// IDLE PREFETCHING
// ============================================================================

/**
 * Prefetch resources during idle time
 *
 * @example
 * prefetchOnIdle(['/about', '/contact'], { timeout: 5000 });
 */
export function prefetchOnIdle(
  urls: string[],
  options: { timeout?: number } = {}
): void {
  if (typeof window === 'undefined') {return;}

  const { timeout = 2000 } = options;

  if ('requestIdleCallback' in window) {
    (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
      () => {
        prefetchUrls(urls, { priority: 'low' });
      },
      { timeout }
    );
  } else {
    // Fallback for Safari
    setTimeout(() => {
      prefetchUrls(urls, { priority: 'low' });
    }, 1000);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getNetworkInfo,
  canPrefetch,
  prefetchUrl,
  prefetchUrls,
  createLinkPrefetcher,
  autoPrefetchLinks,
  addHoverPrefetch,
  prefetchLikelyRoutes,
  prefetchOnIntent,
  dnsPrefetch,
  preconnect,
  addResourceHints,
  prefetchOnIdle,
};
