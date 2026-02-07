'use client';

import { type SVGProps } from 'react';
import styles from './PQCEncryptionFlow.module.css';

type IconProps = SVGProps<SVGSVGElement>;

// Inline SVG icons for encryption steps
function KeyIcon({ className, ...props }: IconProps) {
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
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function CapsuleIcon({ className, ...props }: IconProps) {
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
      <rect x="3" y="7" width="18" height="10" rx="5" />
      <line x1="12" y1="7" x2="12" y2="17" />
    </svg>
  );
}

function ExchangeIcon({ className, ...props }: IconProps) {
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
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function LockIcon({ className, ...props }: IconProps) {
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckShieldIcon({ className, ...props }: IconProps) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

interface EncryptionStep {
  id: number;
  title: string;
  algorithm: string;
  description: string;
  icon: React.ComponentType<IconProps>;
}

const encryptionSteps: EncryptionStep[] = [
  {
    id: 1,
    title: 'Key Generation',
    algorithm: 'ML-KEM-768',
    description: 'Post-quantum key pair generated locally on your device',
    icon: KeyIcon,
  },
  {
    id: 2,
    title: 'Key Encapsulation',
    algorithm: 'Kyber Encaps',
    description: 'Quantum-safe key exchange mechanism using lattice cryptography',
    icon: CapsuleIcon,
  },
  {
    id: 3,
    title: 'Hybrid Exchange',
    algorithm: 'X25519',
    description: 'Classical elliptic curve combined with PQC for defense-in-depth',
    icon: ExchangeIcon,
  },
  {
    id: 4,
    title: 'Symmetric Encryption',
    algorithm: 'AES-256-GCM',
    description: 'Military-grade authenticated encryption with Galois/Counter Mode',
    icon: LockIcon,
  },
  {
    id: 5,
    title: 'Integrity Verification',
    algorithm: 'HMAC-SHA256',
    description: 'Cryptographic signature ensures data integrity and authenticity',
    icon: CheckShieldIcon,
  },
];

export default function PQCEncryptionFlow() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>Post-Quantum Cryptography</span>
        <h2 className={styles.title}>Encryption Flow</h2>
        <p className={styles.description}>
          Every file transfer goes through five layers of cryptographic protection,
          combining classical and quantum-safe algorithms.
        </p>
      </div>

      <div className={styles.flow}>
        {encryptionSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.id}>
              <div className={styles.stepCard} style={{ animationDelay: `${index * 150}ms` }}>
                <div className={styles.stepNumber}>{step.id}</div>
                <div className={styles.stepIcon}>
                  <Icon />
                </div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <span className={styles.stepAlgorithm}>{step.algorithm}</span>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
              {index < encryptionSteps.length - 1 && (
                <div
                  className={styles.connector}
                  style={{ animationDelay: `${(index + 0.5) * 150}ms` }}
                >
                  <svg
                    viewBox="0 0 24 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.connectorArrow}
                  >
                    <path
                      d="M12 0 L12 42 M5 35 L12 42 L19 35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.securityIcon}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>All cryptographic operations happen locally on your device</span>
        </div>
      </div>
    </div>
  );
}
