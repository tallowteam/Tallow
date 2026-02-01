/**
 * Cache Statistics and Debugging Utilities
 * Provides insights into service worker cache performance
 */

import { secureLog } from './secure-logger';

export interface CacheStats {
  name: string;
  size: number;
  items: number;
  oldestItem: string | null;
  newestItem: string | null;
  totalSize: number;
}

export interface CacheItem {
  url: string;
  size: number;
  timestamp: Date | null;
  type: string;
}

/**
 * Get statistics for all caches
 */
export async function getCacheStats(): Promise<CacheStats[]> {
  if (!('caches' in window)) {
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    const stats: CacheStats[] = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const items: CacheItem[] = [];

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const dateHeader = response.headers.get('date');

          items.push({
            url: request.url,
            size: blob.size,
            timestamp: dateHeader ? new Date(dateHeader) : null,
            type: response.headers.get('content-type') || 'unknown',
          });
        }
      }

      items.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) {return 0;}
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      const totalSize = items.reduce((sum, item) => sum + item.size, 0);

      stats.push({
        name,
        size: totalSize,
        items: items.length,
        oldestItem: items[0]?.url || null,
        newestItem: items[items.length - 1]?.url || null,
        totalSize,
      });
    }

    return stats;
  } catch (error) {
    secureLog.error('[Cache Stats] Failed to get cache statistics:', error);
    return [];
  }
}

/**
 * Get detailed items for a specific cache
 */
export async function getCacheItems(cacheName: string): Promise<CacheItem[]> {
  if (!('caches' in window)) {
    return [];
  }

  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const items: CacheItem[] = [];

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        const dateHeader = response.headers.get('date');

        items.push({
          url: request.url,
          size: blob.size,
          timestamp: dateHeader ? new Date(dateHeader) : null,
          type: response.headers.get('content-type') || 'unknown',
        });
      }
    }

    return items.sort((a, b) => b.size - a.size); // Sort by size descending
  } catch (error) {
    secureLog.error(`[Cache Stats] Failed to get items for ${cacheName}:`, error);
    return [];
  }
}

/**
 * Clear a specific cache
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (!('caches' in window)) {
    return false;
  }

  try {
    return await caches.delete(cacheName);
  } catch (error) {
    secureLog.error(`[Cache Stats] Failed to clear cache ${cacheName}:`, error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let cleared = 0;

    for (const name of cacheNames) {
      const deleted = await caches.delete(name);
      if (deleted) {cleared++;}
    }

    return cleared;
  } catch (error) {
    secureLog.error('[Cache Stats] Failed to clear all caches:', error);
    return 0;
  }
}

/**
 * Get cache hit/miss statistics
 * Note: This requires tracking hits/misses in the service worker
 */
export async function getCacheHitRate(): Promise<{
  hits: number;
  misses: number;
  rate: number;
} | null> {
  // This would need to be implemented in the service worker
  // with message passing to track actual hit/miss rates
  return null;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Log cache statistics to console (development only)
 */
export async function logCacheStats(): Promise<void> {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'development') {return;}

  const stats = await getCacheStats();

  console.group('📦 Service Worker Cache Statistics');

  if (stats.length === 0) {
    secureLog.log('No caches found');
    console.groupEnd();
    return;
  }

  const totalSize = stats.reduce((sum, cache) => sum + cache.size, 0);
  const totalItems = stats.reduce((sum, cache) => sum + cache.items, 0);

  secureLog.log(`Total Caches: ${stats.length}`);
  secureLog.log(`Total Items: ${totalItems}`);
  secureLog.log(`Total Size: ${formatBytes(totalSize)}`);
  secureLog.log('');

  for (const cache of stats) {
    console.group(`📂 ${cache.name}`);
    secureLog.log(`Items: ${cache.items}`);
    secureLog.log(`Size: ${formatBytes(cache.size)}`);

    if (cache.oldestItem) {
      const url = new URL(cache.oldestItem);
      secureLog.log(`Oldest: ${url.pathname}`);
    }

    if (cache.newestItem) {
      const url = new URL(cache.newestItem);
      secureLog.log(`Newest: ${url.pathname}`);
    }

    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Estimate quota usage
 */
export async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentage,
    };
  } catch (error) {
    secureLog.error('[Cache Stats] Failed to get storage quota:', error);
    return null;
  }
}

/**
 * Check if persistent storage is available
 */
export async function checkPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator && 'persist' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    secureLog.error('[Cache Stats] Failed to check persistent storage:', error);
    return false;
  }
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator && 'persist' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch (error) {
    secureLog.error('[Cache Stats] Failed to request persistent storage:', error);
    return false;
  }
}
