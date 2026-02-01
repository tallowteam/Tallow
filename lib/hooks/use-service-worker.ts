'use client';

import { useEffect, useState } from 'react';
import { secureLog, LogCategory } from '../utils/secure-logger';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  needsUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Hook to manage service worker registration and state
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    needsUpdate: false,
    registration: null,
  });

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Skip service worker in development to prevent conflicts
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/service-worker.js',
          { scope: '/' }
        );

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                setState((prev) => ({ ...prev, needsUpdate: true }));
              }
            });
          }
        });

        // Check for updates on page load
        registration.update();

        // Cache PQC chunks after registration
        if (registration.active) {
          registration.active.postMessage({ type: 'CACHE_PQC_CHUNKS' });
        }

        secureLog.category(LogCategory.SW, 'Service worker registered successfully');
      } catch (error) {
        secureLog.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Monitor online/offline status
    const updateOnlineStatus = () => {
      setState((prev) => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  /**
   * Update to the latest service worker
   */
  const updateServiceWorker = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  /**
   * Clear all caches
   */
  const clearCache = async () => {
    if (state.registration?.active) {
      state.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  };

  /**
   * Preload PQC chunks
   */
  const preloadPQCChunks = () => {
    if (state.registration?.active) {
      state.registration.active.postMessage({ type: 'CACHE_PQC_CHUNKS' });
    }
  };

  return {
    ...state,
    updateServiceWorker,
    clearCache,
    preloadPQCChunks,
  };
}
