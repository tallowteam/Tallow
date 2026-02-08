import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Your privacy is our architecture. Learn how Tallow is designed so that we cannot access your files.',
  alternates: {
    canonical: 'https://tallow.app/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Tallow',
    description:
      'Your privacy is our architecture. Learn how Tallow is designed so that we cannot access your files.',
    url: '/privacy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Tallow',
    description:
      'Your privacy is our architecture. Learn how Tallow is designed so that we cannot access your files.',
  },
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.label}>PRIVACY POLICY</span>
          <h1 className={styles.title}>Your privacy is our architecture.</h1>
          <p className={styles.date}>Last updated: February 2026</p>
        </header>

        {/* Table of Contents */}
        <nav className={styles.toc}>
          <h2 className={styles.tocTitle}>Contents</h2>
          <ol className={styles.tocList}>
            <li>
              <a href="#overview">Overview</a>
            </li>
            <li>
              <a href="#dont-collect">Information We Don't Collect</a>
            </li>
            <li>
              <a href="#how-works">How Tallow Works</a>
            </li>
            <li>
              <a href="#signaling">Signaling Servers</a>
            </li>
            <li>
              <a href="#cookies">Cookies &amp; Local Storage</a>
            </li>
            <li>
              <a href="#third-party">Third-Party Services</a>
            </li>
            <li>
              <a href="#open-source">Open Source</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ol>
        </nav>

        {/* Overview */}
        <section id="overview" className={styles.section}>
          <p className={styles.lead}>
            Tallow is designed so that we cannot access your files. This isn't
            a policy choice — it's an architectural one.
          </p>
        </section>

        {/* Section 1 */}
        <section id="dont-collect" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            1. Information We Don't Collect
          </h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>
                <strong>File contents</strong> — never transmitted through our
                servers
              </li>
              <li>
                <strong>File metadata</strong> — names, sizes, types remain
                between sender and receiver
              </li>
              <li>
                <strong>Transfer history</strong> — we have no record of your
                transfers
              </li>
              <li>
                <strong>Personal information</strong> — no accounts, no
                registration, no email
              </li>
              <li>
                <strong>IP addresses</strong> — connections are peer-to-peer
              </li>
              <li>
                <strong>Usage analytics</strong> — no tracking, no telemetry
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section id="how-works" className={styles.section}>
          <h2 className={styles.sectionTitle}>2. How Tallow Works</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>All transfers occur directly between devices (P2P)</li>
              <li>
                Encryption keys are generated locally and never shared with us
              </li>
              <li>Device discovery uses local network protocols (mDNS)</li>
              <li>
                Internet P2P uses relay servers only for signaling (connection
                setup), not file transfer
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section id="signaling" className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Signaling Servers</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>
                Our signaling servers facilitate initial peer discovery for
                Internet P2P mode
              </li>
              <li>
                They handle connection setup only — no file data passes through
                them
              </li>
              <li>Signaling data is ephemeral and not logged</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section id="cookies" className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Cookies &amp; Local Storage</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>
                Tallow uses browser localStorage for preferences (theme, device
                name)
              </li>
              <li>No tracking cookies</li>
              <li>No third-party cookies</li>
              <li>No advertising identifiers</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section id="third-party" className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Third-Party Services</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>
                Tallow does not integrate with any analytics, advertising, or
                tracking services
              </li>
              <li>
                STUN/TURN servers are used for NAT traversal in Internet P2P
                mode
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section id="open-source" className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Open Source</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>
                Tallow's source code is publicly available at{' '}
                <a
                  href="https://github.com/tallowteam/Tallow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  https://github.com/tallowteam/Tallow
                </a>
              </li>
              <li>
                You can verify every claim in this policy by reading the code
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section id="contact" className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Contact</h2>
          <div className={styles.content}>
            <ul className={styles.list}>
              <li>
                Questions about privacy:{' '}
                <a href="mailto:privacy@tallow.app" className={styles.link}>
                  privacy@tallow.app
                </a>
              </li>
              <li>
                Security vulnerabilities:{' '}
                <a href="mailto:security@tallow.app" className={styles.link}>
                  security@tallow.app
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
