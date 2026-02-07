/**
 * Cache Strategy Configuration
 * Defines caching rules for different resource types
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CacheStrategy {
  cacheName: string;
  maxAge: number; // seconds
  maxEntries?: number;
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
}

export interface CacheConfig {
  version: string;
  strategies: Record<string, CacheStrategy>;
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const CACHE_VERSION = 'v1';

export const CACHE_CONFIG: CacheConfig = {
  version: CACHE_VERSION,
  strategies: {
    // Static assets (JS, CSS, fonts, images)
    static: {
      cacheName: `tallow-static-${CACHE_VERSION}`,
      maxAge: 31536000, // 1 year
      maxEntries: 100,
      strategy: 'cache-first',
    },

    // Pages and navigation
    pages: {
      cacheName: `tallow-pages-${CACHE_VERSION}`,
      maxAge: 86400, // 1 day
      maxEntries: 50,
      strategy: 'network-first',
    },

    // API responses
    api: {
      cacheName: `tallow-api-${CACHE_VERSION}`,
      maxAge: 300, // 5 minutes
      maxEntries: 100,
      strategy: 'network-first',
    },

    // Images
    images: {
      cacheName: `tallow-images-${CACHE_VERSION}`,
      maxAge: 2592000, // 30 days
      maxEntries: 200,
      strategy: 'cache-first',
    },

    // Fonts
    fonts: {
      cacheName: `tallow-fonts-${CACHE_VERSION}`,
      maxAge: 31536000, // 1 year
      maxEntries: 30,
      strategy: 'cache-first',
    },

    // WebSocket/Signaling (never cache)
    realtime: {
      cacheName: `tallow-realtime-${CACHE_VERSION}`,
      maxAge: 0,
      strategy: 'network-only',
    },
  },
};

// =============================================================================
// ROUTE MATCHERS
// =============================================================================

export function getStrategyForRequest(request: Request): CacheStrategy | null {
  const url = new URL(request.url);

  // Never cache WebSocket/SignalR connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return CACHE_CONFIG.strategies['realtime'] ?? null;
  }

  // Never cache hot updates (HMR)
  if (url.pathname.includes('_next/webpack-hmr') || url.pathname.includes('__nextjs')) {
    return CACHE_CONFIG.strategies['realtime'] ?? null;
  }

  // API routes
  if (url.pathname.startsWith('/api/')) {
    return CACHE_CONFIG.strategies['api'] ?? null;
  }

  // Static assets from _next/static
  if (url.pathname.startsWith('/_next/static/')) {
    return CACHE_CONFIG.strategies['static'] ?? null;
  }

  // Font files
  if (url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    return CACHE_CONFIG.strategies['fonts'] ?? null;
  }

  // Image files
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/)) {
    return CACHE_CONFIG.strategies['images'] ?? null;
  }

  // JavaScript and CSS
  if (url.pathname.match(/\.(js|css)$/)) {
    return CACHE_CONFIG.strategies['static'] ?? null;
  }

  // HTML pages
  if (request.mode === 'navigate' || request.destination === 'document') {
    return CACHE_CONFIG.strategies['pages'] ?? null;
  }

  return null;
}

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Check if a cached response is still fresh
 */
export function isCacheFresh(
  response: Response,
  maxAge: number
): boolean {
  const cachedTime = response.headers.get('sw-cache-time');
  if (!cachedTime) {return false;}

  const age = (Date.now() - parseInt(cachedTime, 10)) / 1000;
  return age < maxAge;
}

/**
 * Add cache metadata to response
 */
export function addCacheMetadata(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', Date.now().toString());
  headers.set('sw-cached', 'true');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Clean up old cache versions
 */
export async function cleanupOldCaches(): Promise<void> {
  if (typeof caches === 'undefined') {return;}

  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_CONFIG.strategies).map(
    (s) => s.cacheName
  );

  await Promise.all(
    cacheNames.map((cacheName) => {
      if (!currentCaches.includes(cacheName)) {
        console.info('[Cache] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
      return Promise.resolve();
    })
  );
}

/**
 * Prune cache entries to respect maxEntries limit
 */
export async function pruneCache(
  cacheName: string,
  maxEntries: number
): Promise<void> {
  if (typeof caches === 'undefined') {return;}

  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries
    const entriesToDelete = keys.length - maxEntries;
    await Promise.all(
      keys.slice(0, entriesToDelete).map((key) => cache.delete(key))
    );
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof caches === 'undefined') {return;}

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.info('[Cache] All caches cleared');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  caches: Array<{ name: string; size: number; entries: number }>;
  totalSize: number;
  totalEntries: number;
}> {
  if (typeof caches === 'undefined') {
    return { caches: [], totalSize: 0, totalEntries: 0 };
  }

  const cacheNames = await caches.keys();
  const stats = await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const responses = await Promise.all(keys.map((key) => cache.match(key)));

      let size = 0;
      for (const response of responses) {
        if (response) {
          const blob = await response.blob();
          size += blob.size;
        }
      }

      return {
        name,
        size,
        entries: keys.length,
      };
    })
  );

  const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
  const totalEntries = stats.reduce((sum, s) => sum + s.entries, 0);

  return {
    caches: stats,
    totalSize,
    totalEntries,
  };
}

// =============================================================================
// CACHE STRATEGIES IMPLEMENTATION
// =============================================================================

/**
 * Cache-First Strategy
 * Serve from cache if available, otherwise fetch from network
 */
export async function cacheFirst(
  request: Request,
  strategy: CacheStrategy
): Promise<Response> {
  if (typeof caches === 'undefined') {
    return fetch(request);
  }

  const cache = await caches.open(strategy.cacheName);
  const cached = await cache.match(request);

  if (cached && isCacheFresh(cached, strategy.maxAge)) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok) {
    const responseToCache = addCacheMetadata(response.clone());
    await cache.put(request, responseToCache);

    // Prune cache if needed
    if (strategy.maxEntries) {
      await pruneCache(strategy.cacheName, strategy.maxEntries);
    }
  }

  return response;
}

/**
 * Network-First Strategy
 * Try network first, fallback to cache on failure
 */
export async function networkFirst(
  request: Request,
  strategy: CacheStrategy
): Promise<Response> {
  if (typeof caches === 'undefined') {
    return fetch(request);
  }

  const cache = await caches.open(strategy.cacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      const responseToCache = addCacheMetadata(response.clone());
      await cache.put(request, responseToCache);

      // Prune cache if needed
      if (strategy.maxEntries) {
        await pruneCache(strategy.cacheName, strategy.maxEntries);
      }
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Serve from cache immediately, update cache in background
 */
export async function staleWhileRevalidate(
  request: Request,
  strategy: CacheStrategy
): Promise<Response> {
  if (typeof caches === 'undefined') {
    return fetch(request);
  }

  const cache = await caches.open(strategy.cacheName);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const responseToCache = addCacheMetadata(response.clone());
      cache.put(request, responseToCache);

      // Prune cache if needed
      if (strategy.maxEntries) {
        pruneCache(strategy.cacheName, strategy.maxEntries);
      }
    }
    return response;
  });

  // Return cached response immediately if available
  if (cached) {
    return cached;
  }

  // Otherwise wait for network
  return fetchPromise;
}

/**
 * Execute strategy
 */
export async function executeStrategy(
  request: Request,
  strategy: CacheStrategy
): Promise<Response> {
  switch (strategy.strategy) {
    case 'cache-first':
      return cacheFirst(request, strategy);
    case 'network-first':
      return networkFirst(request, strategy);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, strategy);
    case 'network-only':
      return fetch(request);
    case 'cache-only':
      if (typeof caches === 'undefined') {
        throw new Error('Cache not available');
      }
      const cache = await caches.open(strategy.cacheName);
      const cached = await cache.match(request);
      if (!cached) {
        throw new Error('No cached response available');
      }
      return cached;
    default:
      return fetch(request);
  }
}
