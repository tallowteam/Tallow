/**
 * Cache Buster Utility
 *
 * Forces browsers to clear old cached versions of the application.
 * This is particularly important after major updates or when fixing
 * syntax errors in cached files.
 */

// Increment this version whenever you need to force a cache clear
const APP_VERSION = '2026-01-29-v1';

export async function clearOldCaches() {
  if (typeof window === 'undefined') {return;}

  try {
    const currentVersion = localStorage.getItem('tallow-app-version');

    // If the version has changed, clear all caches
    if (currentVersion !== APP_VERSION) {
      console.info('[Cache Buster] Version mismatch detected. Clearing old caches...');
      console.info('[Cache Buster] Old version:', currentVersion);
      console.info('[Cache Buster] New version:', APP_VERSION);

      // Clear service worker caches
      if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.info('[Cache Buster] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }

      // Unregister old service workers
      if (
        'serviceWorker' in navigator &&
        navigator.serviceWorker &&
        typeof navigator.serviceWorker.getRegistrations === 'function'
      ) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.info('[Cache Buster] Unregistering service worker');
          await registration.unregister();
        }
      }

      // Clear localStorage items that might be stale
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('tallow-cache-') ||
          key.startsWith('sw-') ||
          key === 'workbox-precache'
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.info('[Cache Buster] Removing localStorage key:', key);
        localStorage.removeItem(key);
      });

      // Update the version
      localStorage.setItem('tallow-app-version', APP_VERSION);

      console.info('[Cache Buster] Cache clearing complete. Page will reload in 2 seconds...');

      // Reload the page to ensure fresh content
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      return true;
    }

    console.info('[Cache Buster] App version is current:', APP_VERSION);
    return false;
  } catch (error) {
    console.error('[Cache Buster] Error clearing caches:', error);
    return false;
  }
}

/**
 * Force a hard refresh of the current page
 */
export function forceHardRefresh() {
  if (typeof window === 'undefined') {return;}

  window.location.reload();
}

/**
 * Check if the current page is served from cache
 */
export async function isServedFromCache(): Promise<boolean> {
  if (typeof window === 'undefined') {return false;}

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker?.controller) {
      return true;
    }

    // Check if the current document was served from cache
    if ('performance' in window) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        const navigationEntry = entries[0];
        return navigationEntry ? navigationEntry.transferSize === 0 : false;
      }
    }

    return false;
  } catch {
    return false;
  }
}
