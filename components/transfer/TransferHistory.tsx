'use client';

/**
 * TransferHistory — Past transfers list with empty state
 * Apple-inspired design with smooth animations
 * Division Charlie (UI/UX) — Component Forger #032
 */

import styles from './TransferHistory.module.css';

interface TransferHistoryProps {
  onStartTransfer: () => void;
}

export function TransferHistory({ onStartTransfer }: TransferHistoryProps) {
  // For now, render empty state
  // Real data integration will come later

  return (
    <div className={styles.container}>
      {/* Section header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Transfer History</h2>
        <span className={styles.count}>0 transfers</span>
      </div>

      {/* Empty state */}
      <div className={styles.emptyState}>
        {/* Illustration */}
        <div className={styles.illustration}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Circular background */}
            <circle cx="60" cy="60" r="60" fill="var(--accent-alpha-8)" />

            {/* Document stack */}
            <g opacity="0.5">
              <rect
                x="35"
                y="38"
                width="40"
                height="50"
                rx="4"
                fill="var(--bg-elevated)"
                stroke="var(--border-2)"
                strokeWidth="2"
              />
            </g>
            <g opacity="0.7">
              <rect
                x="40"
                y="34"
                width="40"
                height="50"
                rx="4"
                fill="var(--bg-elevated)"
                stroke="var(--border-2)"
                strokeWidth="2"
              />
            </g>
            <g>
              <rect
                x="45"
                y="30"
                width="40"
                height="50"
                rx="4"
                fill="var(--bg-elevated)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              {/* Document lines */}
              <line
                x1="52"
                y1="42"
                x2="78"
                y2="42"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="52"
                y1="50"
                x2="72"
                y2="50"
                stroke="var(--text-4)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="52"
                y1="58"
                x2="75"
                y2="58"
                stroke="var(--text-4)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Arrows indicating transfer */}
            <g opacity="0.6">
              <path
                d="M25 60L15 60M15 60L19 56M15 60L19 64"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M95 60L105 60M105 60L101 56M105 60L101 64"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* Text content */}
        <div className={styles.emptyContent}>
          <h3 className={styles.emptyTitle}>No transfers yet</h3>
          <p className={styles.emptyDescription}>
            Start by selecting a device and dropping files to begin your first transfer
          </p>
        </div>

        {/* CTA button */}
        <button type="button" className={styles.ctaButton} onClick={onStartTransfer}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 4V16M4 10H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Start Transfer
        </button>
      </div>
    </div>
  );
}
