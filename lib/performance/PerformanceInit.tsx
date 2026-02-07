'use client';

/**
 * PerformanceInit
 *
 * Client component that initializes performance monitoring and
 * registers the service worker. Renders nothing visible -- purely
 * a side-effect component placed in the root layout.
 */

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance/web-vitals';

/**
 * Register the service worker if available.
 * Only registers in production to avoid caching issues during development.
 */
function registerServiceWorker(): void {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }

  // Only register SW in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates periodically (every 60 minutes)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for new service worker activation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) {
            return;
          }

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available - the SW will take over on next navigation
              if (process.env.NODE_ENV === 'development') {
                console.info('[SW] New version available. Refresh to update.');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[SW] Registration failed:', error);
      });
  });
}

export function PerformanceInit() {
  useEffect(() => {
    // Initialize Core Web Vitals tracking
    initWebVitals();

    // Register service worker (production only)
    registerServiceWorker();
  }, []);

  // This component renders nothing
  return null;
}
