import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: 'Privacy is a fundamental right. We built Tallow because file sharing should not come at the cost of your privacy.',
  alternates: {
    canonical: 'https://tallow.app/about',
  },
  openGraph: {
    title: 'About | Tallow',
    description: 'Privacy is a fundamental right. We built Tallow because file sharing should not come at the cost of your privacy.',
    url: '/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Tallow',
    description: 'Privacy is a fundamental right. We built Tallow because file sharing should not come at the cost of your privacy.',
  },
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <p className={styles.label}>ABOUT</p>
          <h1 className={styles.heroTitle}>
            Privacy is a fundamental right.
          </h1>
        </div>
      </section>

      {/* Manifesto */}
      <section className={styles.manifesto}>
        <div className={styles.manifestoContainer}>
          <p className={styles.manifestoParagraph}>
            We built Tallow because we believe file sharing shouldn't come at the cost of your privacy.
          </p>
          <p className={styles.manifestoParagraph}>
            In a world where every cloud service logs your data, reads your metadata, and sells your habits, we chose a different path. Tallow transfers files directly between devices. No servers. No accounts. No tracking.
          </p>
          <p className={styles.manifestoParagraph}>
            Post-quantum encryption ensures your transfers remain private not just today, but decades from now. When quantum computers arrive, your past transfers will still be unreadable.
          </p>
          <p className={styles.manifestoParagraph}>
            Tallow is open source because trust must be verifiable. Every line of code is auditable. Every decision is transparent.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className={styles.values}>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Privacy First</h3>
            <p className={styles.valueDescription}>
              Your data belongs to you. Period.
            </p>
          </div>

          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Open Source</h3>
            <p className={styles.valueDescription}>
              Trust through transparency. MIT licensed.
            </p>
          </div>

          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Future-Proof</h3>
            <p className={styles.valueDescription}>
              Built to withstand the quantum age.
            </p>
          </div>
        </div>
      </section>

      {/* GitHub CTA */}
      <section className={styles.github}>
        <div className={styles.githubContainer}>
          <p className={styles.githubText}>
            View the source. Verify the claims. Contribute to the mission.
          </p>
          <Link
            href="https://github.com/tallowteam/Tallow"
            className={styles.githubButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub →
          </Link>
        </div>
      </section>
    </main>
  );
}
