import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';

export const metadata = {
  title: 'About Tallow - Why We Built It',
  description: 'Because privacy shouldn\'t require a PhD in cryptography. Learn why we built Tallow, a file transfer tool that respects your privacy by design.',
  openGraph: {
    title: 'About Tallow - Why We Built It',
    description: 'Because privacy shouldn\'t require a PhD in cryptography.',
  },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Ambient gradients */}
        <div className={styles.gradient1} />
        <div className={styles.gradient2} />

        {/* Hero */}
        <section className={styles.hero}>
          <span className={styles.heroLabel}>ABOUT</span>
          <h1 className={styles.heroTitle}>Why we built Tallow</h1>
          <p className={styles.heroSubtitle}>
            Because privacy shouldn't require a PhD in cryptography.
          </p>
        </section>

        {/* Mission Statement */}
        <section className={styles.mission}>
          <div className={styles.missionContent}>
            <p className={styles.paragraph}>
              File transfer should be simple. You pick a file, you pick a device, and the file moves. That's it. No accounts to create, no apps to install, no storage limits to worry about.
            </p>
            <p className={styles.paragraph}>
              But somewhere along the way, we accepted that sending a file means uploading it to someone else's server. We accepted that "free" means our data is the product. We accepted that encryption is an upgrade, not the default.
            </p>
            <p className={styles.paragraph}>
              Tallow exists because we refused to accept that. We built the file transfer tool we wanted to use — one that respects your privacy by design, encrypts everything by default, and never asks you to trust a server with your data.
            </p>
          </div>
        </section>

        {/* Core Principles */}
        <section className={styles.principles}>
          <div className={styles.principlesGrid}>
            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>🔒</div>
              <h3 className={styles.principleTitle}>Privacy First</h3>
              <p className={styles.principleText}>
                Your data is yours. We can't read your files, we don't log your transfers, and we don't track your activity. Privacy isn't a feature — it's our foundation.
              </p>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>👁</div>
              <h3 className={styles.principleTitle}>Transparency</h3>
              <p className={styles.principleText}>
                Every line of code is open source. Our encryption is auditable. Our architecture is documented. Trust should be verifiable.
              </p>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>✦</div>
              <h3 className={styles.principleTitle}>Simplicity</h3>
              <p className={styles.principleText}>
                No accounts, no installs, no configuration. Open a browser, drop a file, done. Complexity is the enemy of security.
              </p>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>🛡</div>
              <h3 className={styles.principleTitle}>Security</h3>
              <p className={styles.principleText}>
                Post-quantum encryption on every transfer. Not as an option, not as an upgrade. AES-256-GCM + ML-KEM-768, always.
              </p>
            </div>
          </div>
        </section>

        {/* Open Source Commitment */}
        <section className={styles.openSource}>
          <div className={styles.openSourceGrid}>
            <div className={styles.openSourceText}>
              <h2 className={styles.openSourceTitle}>Built in the open</h2>
              <p className={styles.openSourceDescription}>
                Tallow is fully open source under the MIT license. We believe that security tools must be transparent to be trustworthy. Every commit, every protocol decision, every line of encryption code is public.
              </p>
              <a
                href="https://github.com/yourusername/tallow"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openSourceLink}
              >
                View source on GitHub →
              </a>
            </div>

            <div className={styles.openSourceVisual}>
              <div className={styles.commitHistory}>
                <div className={styles.commitItem}>
                  <div className={styles.commitHash}>a3f8b2c</div>
                  <div className={styles.commitMessage}>
                    feat: implement ML-KEM-768 key exchange
                  </div>
                  <div className={styles.commitTime}>2 days ago</div>
                </div>
                <div className={styles.commitItem}>
                  <div className={styles.commitHash}>d9e4f1a</div>
                  <div className={styles.commitMessage}>
                    fix: strengthen nonce generation
                  </div>
                  <div className={styles.commitTime}>5 days ago</div>
                </div>
                <div className={styles.commitItem}>
                  <div className={styles.commitHash}>b7c2e9f</div>
                  <div className={styles.commitMessage}>
                    docs: update security architecture
                  </div>
                  <div className={styles.commitTime}>1 week ago</div>
                </div>
                <div className={styles.commitItem}>
                  <div className={styles.commitHash}>e5a1d8c</div>
                  <div className={styles.commitMessage}>
                    test: add PQC encryption benchmarks
                  </div>
                  <div className={styles.commitTime}>2 weeks ago</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Try Tallow today</h2>
          <p className={styles.ctaSubtitle}>
            No signup needed. Just open and transfer.
          </p>
          <Link href="/transfer" className={styles.ctaButton}>
            Open Tallow →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
