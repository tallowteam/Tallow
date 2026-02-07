'use client';

/**
 * ConnectionTunnel Component
 *
 * Hero moment animation showing data transfer connection.
 * Features:
 * - Two device icons (sender/receiver)
 * - Animated dashed tunnel between devices
 * - Flowing particles through the tunnel
 * - Connection type label (LAN/Internet/Relay)
 * - Pure CSS + inline SVG
 *
 * Usage:
 * ```tsx
 * <ConnectionTunnel connectionType="LAN" />
 * <ConnectionTunnel connectionType="Internet" />
 * <ConnectionTunnel connectionType="Relay" />
 * ```
 */

import styles from './ConnectionTunnel.module.css';

interface ConnectionTunnelProps {
  connectionType?: 'LAN' | 'Internet' | 'Relay';
}

export default function ConnectionTunnel({
  connectionType = 'LAN'
}: ConnectionTunnelProps) {
  const connectionColors = {
    LAN: 'var(--success-500)',
    Internet: 'var(--info-500)',
    Relay: 'var(--warning-500)',
  };

  const connectionLabels = {
    LAN: 'Local Network',
    Internet: 'Direct P2P',
    Relay: 'Relay Server',
  };

  return (
    <div className={styles.container}>
      {/* Sender Device */}
      <div className={styles.device}>
        <div className={styles.deviceIcon}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Laptop icon */}
            <rect
              x="2"
              y="5"
              width="20"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="var(--bg-elevated)"
            />
            <path
              d="M2 15H22L21 18C21 18.5523 20.5523 19 20 19H4C3.44772 19 3 18.5523 3 18L2 15Z"
              fill="currentColor"
            />
            <circle cx="12" cy="17" r="0.5" fill="var(--bg-base)" />
          </svg>
        </div>
        <div className={styles.deviceLabel}>Sender</div>
      </div>

      {/* Connection Tunnel */}
      <div className={styles.tunnel}>
        {/* Animated dashed lines */}
        <svg className={styles.tunnelSvg} viewBox="0 0 200 60" preserveAspectRatio="none">
          {/* Top line */}
          <path
            d="M 0 15 Q 100 5, 200 15"
            stroke="var(--border-strong)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 6"
            className={styles.tunnelLine}
          />
          {/* Bottom line */}
          <path
            d="M 0 45 Q 100 55, 200 45"
            stroke="var(--border-strong)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 6"
            className={styles.tunnelLine}
          />
          {/* Middle glow line */}
          <path
            d="M 0 30 L 200 30"
            stroke={connectionColors[connectionType]}
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
        </svg>

        {/* Flowing particles */}
        <div className={styles.particlesContainer}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={styles.tunnelParticle}
              style={{
                '--particle-delay': `${i * 0.15}s`,
                '--particle-color': connectionColors[connectionType],
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Connection type badge */}
        <div
          className={styles.connectionBadge}
          style={{ '--badge-color': connectionColors[connectionType] } as React.CSSProperties}
        >
          <span className={styles.statusDot} />
          <span className={styles.connectionLabel}>{connectionLabels[connectionType]}</span>
        </div>
      </div>

      {/* Receiver Device */}
      <div className={styles.device}>
        <div className={styles.deviceIcon}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Desktop/monitor icon */}
            <rect
              x="3"
              y="4"
              width="18"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="var(--bg-elevated)"
            />
            <path
              d="M8 20H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 16V20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Screen content lines */}
            <line x1="6" y1="8" x2="10" y2="8" stroke="var(--primary-500)" strokeWidth="1" />
            <line x1="6" y1="10" x2="14" y2="10" stroke="var(--primary-400)" strokeWidth="1" opacity="0.5" />
            <line x1="6" y1="12" x2="12" y2="12" stroke="var(--primary-400)" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <div className={styles.deviceLabel}>Receiver</div>
      </div>
    </div>
  );
}
