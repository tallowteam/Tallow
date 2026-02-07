'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { useDeviceStore } from '@/lib/stores/device-store';
import styles from './GuestModeBanner.module.css';

export function GuestModeBanner() {
  const { guestMode, setGuestMode } = useSettingsStore();

  useEffect(() => {
    if (!guestMode) {
      return;
    }

    // Auto-cleanup on page unload when in guest mode
    const handleBeforeUnload = () => {
      if (guestMode) {
        const transferStore = useTransferStore.getState();
        const deviceStore = useDeviceStore.getState();

        // Clear transfer history
        transferStore.clearTransfers();

        // Clear device cache (except favorites which are persistent)
        deviceStore.clearRecent();

        console.log('[GuestMode] Cleared transfer history and device cache');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [guestMode]);

  if (!guestMode) {
    return null;
  }

  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <EyeOffIcon />
        </div>
        <div className={styles.textContent}>
          <div className={styles.title}>
            <span>Guest Mode</span>
            <span className={styles.badge}>Active</span>
          </div>
          <p className={styles.description}>
            Transfers won't be saved to history. Data cleared on session end.
          </p>
        </div>
      </div>
      <button
        onClick={() => setGuestMode(false)}
        className={styles.closeButton}
        aria-label="Exit guest mode"
        title="Exit guest mode"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// Icons
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
