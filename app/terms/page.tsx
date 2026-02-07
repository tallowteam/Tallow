import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service - Tallow',
  description: 'Tallow terms of service. Free, open source, and provided as-is.',
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} />
      <div className={styles.card}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: February 2026</p>

        <section>
          <h2 className={styles.heading}>Acceptance</h2>
          <p className={styles.paragraph}>
            By using Tallow, you agree to these terms. Tallow is provided as-is, free and open source.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Service Description</h2>
          <p className={styles.paragraph}>
            Tallow is a peer-to-peer file transfer tool. Files are transferred directly between
            your devices without passing through our servers.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Your Responsibility</h2>
          <p className={styles.paragraph}>
            You are responsible for the files you transfer. Do not use Tallow for illegal file
            sharing or distribution of harmful content.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>No Warranty</h2>
          <p className={styles.paragraph}>
            Tallow is provided &quot;as is&quot; without warranty of any kind. We do not guarantee
            uninterrupted or error-free operation.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Limitation of Liability</h2>
          <p className={styles.paragraph}>
            To the maximum extent permitted by law, Tallow and its contributors shall not be liable
            for any damages arising from the use of this service.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Encryption</h2>
          <p className={styles.paragraph}>
            Tallow encrypts all transfers with post-quantum cryptography. However, no encryption system
            is guaranteed to be unbreakable. Use at your own discretion for sensitive files.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Open Source License</h2>
          <p className={styles.paragraph}>
            Tallow is released under the MIT License. You may use, modify, and distribute the software
            in accordance with the license terms.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Changes</h2>
          <p className={styles.paragraph}>
            We may update these terms. Continued use of Tallow after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className={styles.heading}>Contact</h2>
          <p className={styles.paragraph}>
            Questions? Open an issue on our{' '}
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
