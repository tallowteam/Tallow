'use client';

/**
 * EncryptionAnimation Component
 *
 * Hero moment animation showing encryption in progress.
 * Features:
 * - Animated lock icon with radiating purple pulses
 * - Rotating rings around the lock
 * - Flowing particles into the lock
 * - "Encrypting..." status text
 * - Pure CSS animations for smooth performance
 * - Fits in 200x200px area
 *
 * Usage:
 * ```tsx
 * <EncryptionAnimation />
 * ```
 */

import styles from './EncryptionAnimation.module.css';

export default function EncryptionAnimation() {
  return (
    <div className={styles.container}>
      {/* Radiating pulse rings */}
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing} style={{ animationDelay: '0.5s' }} />
      <div className={styles.pulseRing} style={{ animationDelay: '1s' }} />

      {/* Rotating outer ring */}
      <div className={styles.outerRing}>
        <svg className={styles.ringSvg} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        </svg>
      </div>

      {/* Lock icon container */}
      <div className={styles.lockContainer}>
        {/* Lock SVG */}
        <svg
          className={styles.lockIcon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shackle */}
          <path
            d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Body */}
          <rect
            x="5"
            y="11"
            width="14"
            height="10"
            rx="2"
            fill="currentColor"
          />
          {/* Keyhole */}
          <circle cx="12" cy="15" r="1.5" fill="var(--bg-base)" />
          <rect
            x="11.25"
            y="15"
            width="1.5"
            height="3"
            rx="0.5"
            fill="var(--bg-base)"
          />
        </svg>

        {/* Shield glow effect */}
        <div className={styles.shieldGlow} />
      </div>

      {/* Flowing particles */}
      <div className={styles.particle} style={{ '--angle': '45deg', '--delay': '0s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '135deg', '--delay': '0.3s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '225deg', '--delay': '0.6s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '315deg', '--delay': '0.9s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '90deg', '--delay': '1.2s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '180deg', '--delay': '1.5s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '270deg', '--delay': '1.8s' } as React.CSSProperties} />
      <div className={styles.particle} style={{ '--angle': '0deg', '--delay': '2.1s' } as React.CSSProperties} />

      {/* Status text */}
      <div className={styles.statusText}>
        <span className={styles.text}>Encrypting</span>
        <span className={styles.dots}>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
  );
}
