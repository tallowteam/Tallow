'use client';

import { type SVGProps } from 'react';
import styles from './AlgorithmComparison.module.css';

type IconProps = SVGProps<SVGSVGElement>;

function CheckCircleIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function XCircleIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function TrophyIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

interface Algorithm {
  name: string;
  keySize: string;
  securityLevel: string;
  quantumSafe: boolean;
  performance: string;
  performanceScore: number;
  isWinner: boolean;
  description: string;
}

const algorithms: Algorithm[] = [
  {
    name: 'ML-KEM-768',
    keySize: '2,400 bytes',
    securityLevel: 'NIST Level 3',
    quantumSafe: true,
    performance: 'Fast',
    performanceScore: 90,
    isWinner: true,
    description: 'Post-quantum lattice-based cryptography, resistant to quantum attacks',
  },
  {
    name: 'RSA-2048',
    keySize: '256 bytes',
    securityLevel: '112-bit',
    quantumSafe: false,
    performance: 'Slow',
    performanceScore: 45,
    isWinner: false,
    description: 'Classical factorization-based, vulnerable to quantum computers',
  },
  {
    name: 'ECDH-P256',
    keySize: '32 bytes',
    securityLevel: '128-bit',
    quantumSafe: false,
    performance: 'Very Fast',
    performanceScore: 95,
    isWinner: false,
    description: 'Elliptic curve cryptography, quantum vulnerable but efficient',
  },
];

export default function AlgorithmComparison() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>Algorithm Comparison</span>
        <h2 className={styles.title}>Why Post-Quantum?</h2>
        <p className={styles.description}>
          Comparing classical cryptographic algorithms with modern post-quantum
          alternatives. Tallow uses ML-KEM-768 for quantum-safe key exchange.
        </p>
      </div>

      <div className={styles.comparison}>
        {algorithms.map((algorithm, index) => (
          <div
            key={algorithm.name}
            className={`${styles.algorithmCard} ${
              algorithm.isWinner ? styles.winnerCard : ''
            }`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {algorithm.isWinner && (
              <div className={styles.winnerBadge}>
                <TrophyIcon />
                <span>Tallow's Choice</span>
              </div>
            )}

            <div className={styles.cardHeader}>
              <h3 className={styles.algorithmName}>{algorithm.name}</h3>
              <p className={styles.algorithmDescription}>{algorithm.description}</p>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Key Size</span>
                <span className={styles.metricValue}>{algorithm.keySize}</span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>Security Level</span>
                <span className={styles.metricValue}>{algorithm.securityLevel}</span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>Quantum Safe?</span>
                <span className={styles.metricValue}>
                  {algorithm.quantumSafe ? (
                    <span className={styles.statusYes}>
                      <CheckCircleIcon />
                      Yes
                    </span>
                  ) : (
                    <span className={styles.statusNo}>
                      <XCircleIcon />
                      No
                    </span>
                  )}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>Performance</span>
                <span className={styles.metricValue}>
                  <span className={styles.performanceText}>{algorithm.performance}</span>
                  <div className={styles.performanceBar}>
                    <div
                      className={styles.performanceBarFill}
                      style={{ width: `${algorithm.performanceScore}%` }}
                    />
                  </div>
                </span>
              </div>
            </div>

            {algorithm.isWinner && (
              <div className={styles.cardFooter}>
                <div className={styles.highlight}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.highlightIcon}
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Best security for the quantum era</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.note}>
          <div className={styles.noteIcon}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className={styles.noteContent}>
            <strong>Hybrid Mode:</strong> Tallow combines ML-KEM-768 with X25519 for defense-in-depth.
            If one algorithm is broken, the other still protects your data.
          </div>
        </div>
      </div>
    </div>
  );
}
