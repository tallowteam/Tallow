/**
 * Service Worker Registration and Management
 * Handles PWA installation and caching
 */

import secureLog, { LogCategory } from '@/lib/utils/secure-logger';

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(config?: ServiceWorkerConfig) {
  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    secureLog.category(LogCategory.SW, 'Service Workers not supported');
    return;
  }

  // In development, unregister any existing service workers to prevent HMR conflicts
  if (process.env.NODE_ENV === 'development' || process.env['SKIP_SERVICE_WORKER'] === 'true') {
    secureLog.category(LogCategory.SW, 'Development mode - unregistering service workers');

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        secureLog.category(LogCategory.SW, 'Service Worker unregistered for development');
      }

      // Clear all caches to ensure fresh content
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        secureLog.category(LogCategory.SW, 'All caches cleared for development');
      }
    } catch (err) {
      secureLog.error('Failed to unregister service workers:', err);
    }

    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    secureLog.category(LogCategory.SW, 'Service Worker registered successfully');

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) {return;}

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available
          secureLog.category(LogCategory.SW, 'New content available, please refresh');
          config?.onUpdate?.(registration);
        } else if (newWorker.state === 'activated') {
          // First time installed
          secureLog.category(LogCategory.SW, 'Service Worker activated');
          config?.onSuccess?.(registration);
        }
      });
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    return registration;
  } catch (err) {
    secureLog.error('Service Worker registration failed:', err);
    config?.onError?.(err as Error);
    return undefined;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
      secureLog.category(LogCategory.SW, 'Service Worker unregistered');
    }
  } catch (err) {
    secureLog.error('Service Worker unregistration failed:', err);
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

/**
 * Clear all caches
 */
export async function clearCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    secureLog.category(LogCategory.SW, 'All caches cleared');
  } catch (err) {
    secureLog.error('Failed to clear caches:', err);
  }
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') {return false;}

  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check navigator.standalone (iOS)
  const isIOSStandalone = (navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * Check if app is installed
 */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') {return false;}

  // Check localStorage flag
  const installedFlag = localStorage.getItem('tallow-pwa-installed');

  return installedFlag === 'true' || isPWA();
}

/**
 * Mark app as installed
 */
export function markAsInstalled() {
  if (typeof window === 'undefined') {return;}

  localStorage.setItem('tallow-pwa-installed', 'true');
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (err) {
    secureLog.error('Failed to get service worker registration:', err);
    return null;
  }
}
