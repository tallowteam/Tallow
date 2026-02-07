import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.container} role="main">
      {/* Ambient Gradient Blob */}
      <div className={styles.ambientBlob} />

      {/* Glass Card */}
      <div className={styles.glassCard}>
        <div className={styles.errorCode}>404</div>

        <h1 className={styles.heading}>Page not found</h1>

        <p className={styles.description}>
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.buttonPrimary}>
            Go Home
          </Link>
          <Link href="/transfer" className={styles.buttonGlass}>
            Open App
          </Link>
        </div>
      </div>
    </main>
  );
}
