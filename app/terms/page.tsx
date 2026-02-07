import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Simple terms for a simple tool. Read the terms of service for using Tallow, the quantum-safe file transfer application.',
  openGraph: {
    title: 'Terms of Service | Tallow',
    description:
      'Simple terms for a simple tool. Read the terms of service for using Tallow.',
  },
};

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.label}>TERMS OF SERVICE</span>
          <h1 className={styles.title}>Simple terms for a simple tool.</h1>
          <p className={styles.date}>Last updated: February 2026</p>
        </header>

        {/* Table of Contents */}
        <nav className={styles.toc}>
          <h2 className={styles.tocTitle}>Contents</h2>
          <ol className={styles.tocList}>
            <li>
              <a href="#acceptance">Acceptance of Terms</a>
            </li>
            <li>
              <a href="#description">Description of Service</a>
            </li>
            <li>
              <a href="#responsibilities">User Responsibilities</a>
            </li>
            <li>
              <a href="#warranty">No Warranty</a>
            </li>
            <li>
              <a href="#liability">Limitation of Liability</a>
            </li>
            <li>
              <a href="#privacy">Privacy</a>
            </li>
            <li>
              <a href="#intellectual">Intellectual Property</a>
            </li>
            <li>
              <a href="#modifications">Modifications</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ol>
        </nav>

        {/* Section 1 */}
        <section id="acceptance" className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <div className={styles.content}>
            <p>
              By using Tallow, you agree to these terms. Tallow is free and
              open-source software provided as-is.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="description" className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Description of Service</h2>
          <div className={styles.content}>
            <p>
              Tallow is a peer-to-peer file transfer application. Files are
              transferred directly between devices without passing through
              central servers.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="responsibilities" className={styles.section}>
          <h2 className={styles.sectionTitle}>3. User Responsibilities</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>You are responsible for the files you transfer</li>
              <li>Do not use Tallow to transfer illegal content</li>
              <li>You must have the right to share any files you transfer</li>
              <li>You are responsible for securing your devices</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section id="warranty" className={styles.section}>
          <h2 className={styles.sectionTitle}>4. No Warranty</h2>
          <div className={styles.content}>
            <p>
              Tallow is provided "as is" without warranty of any kind, express
              or implied. We do not guarantee uninterrupted or error-free
              service.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="liability" className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Limitation of Liability</h2>
          <div className={styles.content}>
            <p>
              Tallow and its contributors shall not be liable for any damages
              arising from the use of the software.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section id="privacy" className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Privacy</h2>
          <div className={styles.content}>
            <p>
              See our{' '}
              <a href="/privacy" className={styles.link}>
                Privacy Policy
              </a>{' '}
              for details. In short: we can't see your files and we don't track
              you.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section id="intellectual" className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Intellectual Property</h2>
          <div className={styles.content}>
            <p>
              Tallow is open-source software licensed under the MIT License. You
              are free to use, modify, and distribute it.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section id="modifications" className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Modifications</h2>
          <div className={styles.content}>
            <p>
              We may update these terms. Changes will be reflected on this page
              with an updated date.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section id="contact" className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Contact</h2>
          <div className={styles.content}>
            <p>
              Questions:{' '}
              <a href="mailto:legal@tallow.app" className={styles.link}>
                legal@tallow.app
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
