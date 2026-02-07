import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy - Tallow',
  description: 'Tallow privacy policy. We don\'t collect, store, or process your files. Privacy by design.',
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} />
      <div className={styles.card}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: February 2026</p>

        <section>
          <h2 className={styles.heading}>Overview</h2>
          <p className={styles.paragraph}>
            Tallow is designed with privacy as its core architecture. We don&apos;t collect, store,
            or process your files. This isn&apos;t just a policy — it&apos;s how the technology works.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>What We Don&apos;t Collect</h2>
          <ul className={styles.list}>
            <li>File contents or metadata</li>
            <li>Transfer history or logs</li>
            <li>User accounts or profiles</li>
            <li>IP addresses or location data</li>
            <li>Device fingerprints or analytics</li>
            <li>Cookies or tracking data</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.heading}>How Tallow Works</h2>
          <p className={styles.paragraph}>
            Files are transferred directly between devices using peer-to-peer WebRTC connections.
            Our signaling server facilitates the initial connection but never sees or stores file data.
            All transfers are encrypted end-to-end with post-quantum cryptography (ML-KEM-768 + AES-256-GCM).
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Signaling Server</h2>
          <p className={styles.paragraph}>
            Our signaling server helps devices find each other. It processes:
          </p>
          <ul className={styles.list}>
            <li>Temporary session identifiers (deleted after connection)</li>
            <li>WebRTC signaling data (ICE candidates, SDP offers)</li>
          </ul>
          <p className={styles.paragraph}>
            This data is ephemeral and never stored permanently.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Third-Party Services</h2>
          <p className={styles.paragraph}>
            Tallow does not use any third-party analytics, advertising, or tracking services.
            We do not share data with any third parties because we don&apos;t collect data to share.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Open Source</h2>
          <p className={styles.paragraph}>
            Our entire codebase is open source and auditable. You can verify these privacy claims
            by examining the source code.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Contact</h2>
          <p className={styles.paragraph}>
            Questions about privacy? Open an issue on our{' '}
            <a href="https://github.com/tallow-app/tallow" className={styles.link}>
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
