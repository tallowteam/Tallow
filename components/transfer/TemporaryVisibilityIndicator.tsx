'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import styles from './TemporaryVisibilityIndicator.module.css';

interface TemporaryVisibilityIndicatorProps {
  onVisibilityChange?: (isVisible: boolean) => void;
}

export function TemporaryVisibilityIndicator({ onVisibilityChange }: TemporaryVisibilityIndicatorProps) {
  const { temporaryVisibility } = useSettingsStore();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!temporaryVisibility) {
      return;
    }

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);

      // Notify parent component of visibility change
      if (onVisibilityChange) {
        onVisibilityChange(visible);
      }

      if (visible) {
        console.log('[TemporaryVisibility] Tab is visible - broadcasting on mDNS');
      } else {
        console.log('[TemporaryVisibility] Tab is hidden - stopping mDNS broadcast');
      }
    };

    // Check initial visibility
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [temporaryVisibility, onVisibilityChange]);

  if (!temporaryVisibility) {
    return null;
  }

  return (
    <div className={`${styles.indicator} ${!isVisible ? styles.hidden : ''}`}>
      <div className={styles.iconWrapper}>
        {isVisible ? <EyeIcon /> : <EyeOffIcon />}
      </div>
      <div className={styles.content}>
        <div className={styles.status}>
          {isVisible ? (
            <>
              <span className={styles.dot} />
              <span>Visible on network</span>
            </>
          ) : (
            <>
              <span className={`${styles.dot} ${styles.dotInactive}`} />
              <span>Hidden from network</span>
            </>
          )}
        </div>
        <p className={styles.description}>
          {isVisible ? 'Device is discoverable' : 'Tab not focused'}
        </p>
      </div>
    </div>
  );
}

// Icons
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
