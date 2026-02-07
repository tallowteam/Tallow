'use client';

import { useEffect, useState } from 'react';
import styles from './OnionRoutingIndicator.module.css';

interface OnionRoutingIndicatorProps {
  enabled: boolean;
  hopCount?: number;
  compact?: boolean;
}

export function OnionRoutingIndicator({
  enabled,
  hopCount = 3,
  compact = false
}: OnionRoutingIndicatorProps) {
  const [activeHop, setActiveHop] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setActiveHop(0);
      return;
    }

    // Animate through hops
    const interval = setInterval(() => {
      setActiveHop((prev) => (prev + 1) % (hopCount + 1));
    }, 800);

    return () => clearInterval(interval);
  }, [enabled, hopCount]);

  if (!enabled) {
    return null;
  }

  if (compact) {
    return (
      <div className={styles.compact} title="Onion routing active (3 hops)">
        <OnionIcon />
        <span className={styles.hops}>{hopCount} hops</span>
      </div>
    );
  }

  return (
    <div className={styles.indicator}>
      <div className={styles.header}>
        <OnionIcon />
        <h3 className={styles.title}>Onion Routing Active</h3>
      </div>

      <div className={styles.circuit}>
        <div className={styles.node}>
          <div className={`${styles.nodeIcon} ${activeHop === 0 ? styles.active : ''}`}>
            <ComputerIcon />
          </div>
          <span className={styles.nodeLabel}>You</span>
        </div>

        <div className={`${styles.connection} ${activeHop >= 1 ? styles.active : ''}`}>
          <div className={styles.arrow} />
        </div>

        <div className={styles.node}>
          <div className={`${styles.nodeIcon} ${activeHop === 1 ? styles.active : ''}`}>
            <ServerIcon />
          </div>
          <span className={styles.nodeLabel}>Relay 1</span>
        </div>

        <div className={`${styles.connection} ${activeHop >= 2 ? styles.active : ''}`}>
          <div className={styles.arrow} />
        </div>

        <div className={styles.node}>
          <div className={`${styles.nodeIcon} ${activeHop === 2 ? styles.active : ''}`}>
            <ServerIcon />
          </div>
          <span className={styles.nodeLabel}>Relay 2</span>
        </div>

        <div className={`${styles.connection} ${activeHop >= 3 ? styles.active : ''}`}>
          <div className={styles.arrow} />
        </div>

        <div className={styles.node}>
          <div className={`${styles.nodeIcon} ${activeHop === 3 ? styles.active : ''}`}>
            <ServerIcon />
          </div>
          <span className={styles.nodeLabel}>Exit</span>
        </div>

        <div className={`${styles.connection} ${activeHop >= 4 ? styles.active : ''}`}>
          <div className={styles.arrow} />
        </div>

        <div className={styles.node}>
          <div className={`${styles.nodeIcon} ${activeHop === 4 ? styles.active : ''}`}>
            <ComputerIcon />
          </div>
          <span className={styles.nodeLabel}>Peer</span>
        </div>
      </div>

      <p className={styles.description}>
        Your traffic is encrypted and routed through {hopCount} relay nodes for maximum anonymity
      </p>
    </div>
  );
}

// Icons
function OnionIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ComputerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
