'use client';

/**
 * QuantumShield Component
 *
 * Hero moment animation showing quantum-safe encryption status.
 * Features:
 * - Hexagonal shield with subtle glow
 * - "PQC" (Post-Quantum Cryptography) text inside
 * - Pulsing outer ring animation
 * - Hover state shows expanded encryption details
 * - Pure CSS animations
 *
 * Usage:
 * ```tsx
 * <QuantumShield />
 * <QuantumShield algorithm="Kyber-1024" />
 * ```
 */

import { useState } from 'react';
import styles from './QuantumShield.module.css';

interface QuantumShieldProps {
  algorithm?: string;
  keyStrength?: string;
}

export default function QuantumShield({
  algorithm = 'Kyber-1024',
  keyStrength = '256-bit'
}: QuantumShieldProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer pulsing rings */}
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing} style={{ animationDelay: '1s' }} />

      {/* Shield container */}
      <div className={styles.shieldContainer}>
        {/* Hexagon shield */}
        <div className={styles.shield}>
          <svg
            className={styles.hexagon}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hexagon background */}
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-600)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary-800)" stopOpacity="0.5" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Outer hexagon */}
            <polygon
              points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
              fill="url(#shieldGradient)"
              stroke="var(--primary-500)"
              strokeWidth="2"
              className={styles.hexagonOuter}
              filter="url(#glow)"
            />

            {/* Inner hexagon */}
            <polygon
              points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5"
              fill="none"
              stroke="var(--primary-400)"
              strokeWidth="1"
              strokeDasharray="4 4"
              className={styles.hexagonInner}
              opacity="0.6"
            />
          </svg>

          {/* PQC Text */}
          <div className={styles.shieldContent}>
            <div className={styles.pqcText}>PQC</div>
            <div className={styles.checkmark}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Corner decorations */}
          <div className={styles.cornerDots}>
            <div className={styles.dot} style={{ top: '15%', left: '15%' }} />
            <div className={styles.dot} style={{ top: '15%', right: '15%' }} />
            <div className={styles.dot} style={{ bottom: '15%', left: '15%' }} />
            <div className={styles.dot} style={{ bottom: '15%', right: '15%' }} />
          </div>
        </div>

        {/* Floating particles */}
        <div className={styles.particleOrbit}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={styles.orbitParticle}
              style={{
                '--orbit-angle': `${i * 60}deg`,
                '--orbit-delay': `${i * 0.3}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Info panel (shows on hover) */}
      <div className={`${styles.infoPanel} ${isHovered ? styles.visible : ''}`}>
        <div className={styles.infoHeader}>
          <div className={styles.statusBadge}>
            <span className={styles.statusDot} />
            <span>Quantum Safe</span>
          </div>
        </div>
        <div className={styles.infoContent}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Algorithm:</span>
            <span className={styles.infoValue}>{algorithm}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Key Strength:</span>
            <span className={styles.infoValue}>{keyStrength}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Status:</span>
            <span className={styles.infoValue}>Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
