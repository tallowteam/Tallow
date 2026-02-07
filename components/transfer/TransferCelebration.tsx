'use client';

import { useEffect, useState } from 'react';
import styles from './TransferCelebration.module.css';

export interface TransferCelebrationProps {
  /**
   * Controls visibility of the celebration
   */
  show: boolean;
  /**
   * Name of the transferred file
   */
  fileName: string;
  /**
   * Callback triggered when celebration auto-dismisses
   */
  onDismiss: () => void;
}

export function TransferCelebration({ show, fileName, onDismiss }: TransferCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for exit animation to complete before calling onDismiss
        setTimeout(onDismiss, 300);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
    return undefined;
  }, [show, onDismiss]);

  if (!show && !isVisible) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.overlayVisible : styles.overlayHidden}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.container}>
        {/* Checkmark Icon */}
        <div className={styles.checkmarkWrapper}>
          <svg
            className={styles.checkmark}
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className={styles.checkmarkCircle}
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className={styles.checkmarkCheck}
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>

        {/* Confetti Particles */}
        <div className={styles.confetti} aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                '--particle-delay': `${i * 0.05}s`,
                '--particle-angle': `${(i * 30) - 180}deg`,
                '--particle-color': getParticleColor(i),
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Success Message */}
        <div className={styles.messageWrapper}>
          <h2 className={styles.title}>Transfer Complete!</h2>
          <p className={styles.fileName}>{fileName}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Get particle color based on index
 * Cycles through accent and success colors for variety
 */
function getParticleColor(index: number): string {
  const colors = [
    'var(--accent)',
    'var(--success-500)',
    'var(--accent-light)',
    'var(--primary-400)',
  ];
  return colors[index % colors.length] ?? 'var(--primary-400)';
}
