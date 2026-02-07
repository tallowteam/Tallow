'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);

  return (
    <main className={styles.container} role="main">
      {/* Ambient Gradient Blob */}
      <div className={styles.ambientBlob} />

      {/* Glass Card */}
      <div className={styles.glassCard}>
        <div className={styles.errorCode}>500</div>

        <h1 className={styles.heading}>Something went wrong</h1>

        <p className={styles.description}>
          An unexpected error occurred. Please try again.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.buttonPrimary}>
            Go Home
          </Link>
          <button
            onClick={reset}
            className={styles.buttonGlass}
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
