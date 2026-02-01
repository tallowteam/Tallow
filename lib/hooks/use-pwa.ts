'use client';

import { useState, useEffect, useCallback } from 'react';
import { secureLog } from '../utils/secure-logger';
import {
  registerServiceWorker,
  isPWA,
  isInstalled,
  markAsInstalled
} from '@/lib/pwa/service-worker-registration';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isOnline: boolean;
  needsUpdate: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isOnline: true,
    needsUpdate: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check initial states
    setState((prev) => ({
      ...prev,
      isInstalled: isInstalled(),
      isStandalone: isPWA(),
      isOnline: navigator.onLine,
    }));

    // Register service worker
    registerServiceWorker({
      onSuccess: () => {
        secureLog.log('Service Worker registered successfully');
      },
      onUpdate: () => {
        setState((prev) => ({ ...prev, needsUpdate: true }));
      },
      onError: (error) => {
        secureLog.error('Service Worker error:', error);
      },
    });

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setState((prev) => ({ ...prev, canInstall: true }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      markAsInstalled();
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }));
      setDeferredPrompt(null);
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Trigger the install prompt
   */
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      secureLog.warn('Install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        secureLog.log('User accepted the install prompt');
        setDeferredPrompt(null);
        setState((prev) => ({ ...prev, canInstall: false }));
        return true;
      } else {
        secureLog.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      secureLog.error('Error during install:', error);
      return false;
    }
  }, [deferredPrompt]);

  /**
   * Reload to activate new service worker
   */
  const update = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    ...state,
    install,
    update,
  };
}
