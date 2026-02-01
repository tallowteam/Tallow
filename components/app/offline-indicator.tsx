'use client';

import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { WifiOff, Wifi, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Offline Indicator Component
 * Shows the current network status and service worker state
 */
export function OfflineIndicator() {
  const { isOnline, needsUpdate, updateServiceWorker } = useServiceWorker();
  const [showIndicator, setShowIndicator] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Show indicator when offline
  useEffect(() => {
    setShowIndicator(!isOnline);
  }, [isOnline]);

  // Show update banner when update is available
  useEffect(() => {
    setShowUpdateBanner(needsUpdate);
  }, [needsUpdate]);

  return (
    <>
      {/* Offline Indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 px-4 py-3 text-sm font-medium text-yellow-950 shadow-lg"
            role="status"
            aria-live="polite"
          >
            <WifiOff className="h-4 w-4" />
            <span>You are currently offline. Some features may be limited.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Indicator (brief notification) */}
      <AnimatePresence>
        {!isOnline && (
          <OnlineNotification />
        )}
      </AnimatePresence>

      {/* Update Available Banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-[#fefefc] px-4 py-3 text-sm font-medium text-[#191610] dark:text-[#fefefc] shadow-lg"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>A new version of Tallow is available</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="rounded px-3 py-1 text-sm font-medium text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Later
              </button>
              <button
                onClick={() => {
                  updateServiceWorker();
                  setShowUpdateBanner(false);
                }}
                className="rounded bg-white px-3 py-1 text-sm font-medium text-[#191610] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Update Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Shows a brief notification when connection is restored
 */
function OnlineNotification() {
  const { isOnline } = useServiceWorker();
  const [showNotification, setShowNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        setWasOffline(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, wasOffline]);

  if (!showNotification) {return null;}

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-green-500 px-4 py-3 text-sm font-medium text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      <Wifi className="h-4 w-4" />
      <span>You are back online</span>
    </motion.div>
  );
}
