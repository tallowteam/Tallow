'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const BiometricAuthExample = dynamic(
  () => import('@/components/transfer/BiometricAuthExample').then((mod) => mod.BiometricAuthExample),
  { loading: () => <div style={{ height: 400, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} />, ssr: false }
);
import styles from './page.module.css';

/**
 * Biometric Authentication Demo Page
 *
 * Live demonstration of WebAuthn/FIDO2 biometric authentication.
 * Navigate to /biometric-demo to test the implementation.
 */
export default function BiometricDemoPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.backLink}>
            <BackIcon />
            <span>Back to Home</span>
          </Link>
          <div className={styles.headerBadge}>
            <span className={styles.badgeIcon}>🔐</span>
            <span className={styles.badgeText}>WebAuthn/FIDO2 Demo</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <BiometricAuthExample />
      </main>

      <footer className={styles.pageFooter}>
        <p className={styles.footerText}>
          Built with{' '}
          <a
            href="https://www.w3.org/TR/webauthn-2/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            W3C WebAuthn
          </a>
          {' '}and{' '}
          <a
            href="https://fidoalliance.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            FIDO2
          </a>
          {' '}standards
        </p>
      </footer>
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
