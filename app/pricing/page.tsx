import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Pricing - Tallow',
  description: 'Free. Forever. No catch. Unlimited file transfers with post-quantum encryption.',
  openGraph: {
    title: 'Pricing | Tallow',
    description: 'Free. Forever. No catch. Unlimited file transfers with post-quantum encryption.',
    url: '/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Tallow',
    description: 'Free. Forever. No catch. Unlimited file transfers with post-quantum encryption.',
  },
};

export default function PricingPage() {
  const features = [
    'Unlimited file transfers',
    'No file size limits',
    'Post-quantum encryption',
    'All transfer modes (Local, Internet, Friends)',
    'Cross-platform support',
    'No accounts required',
    'No ads, no tracking',
    'Open source',
  ];

  const supportCards = [
    {
      title: 'Star on GitHub',
      description: 'Show your support',
      icon: '★',
      href: 'https://github.com/tallowteam/Tallow',
    },
    {
      title: 'Contribute',
      description: 'Help build the future',
      icon: '</>',
      href: 'https://github.com/tallowteam/Tallow',
    },
    {
      title: 'Spread the Word',
      description: 'Tell someone about Tallow',
      icon: '→',
      href: 'https://github.com/tallowteam/Tallow',
    },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.label}>PRICING</div>
          <h1 className={styles.heading}>
            Free. Forever.
            <br />
            No catch.
          </h1>
        </section>

        {/* Pricing Card */}
        <section className={styles.pricingSection}>
          <div className={styles.pricingCard}>
            <div className={styles.priceWrapper}>
              <div className={styles.price}>$0</div>
              <div className={styles.priceSubtitle}>
                per month, per year, per everything
              </div>
            </div>

            <div className={styles.features}>
              {features.map((feature, index) => (
                <div key={index} className={styles.feature}>
                  <svg
                    className={styles.checkmark}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Link href="/transfer" className={styles.ctaButton}>
              Start Transferring
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className={styles.philosophy}>
          <h2 className={styles.philosophyHeading}>
            We don't believe privacy should have a price tag.
          </h2>
          <div className={styles.philosophyContent}>
            <p>
              In an age where your data is commodified and your privacy is sold
              to the highest bidder, Tallow takes a different path. We believe
              that secure, private file sharing is a fundamental right—not a
              premium feature locked behind a paywall.
            </p>
            <p>
              Every feature, every line of code, every security enhancement is
              available to everyone, immediately, forever. No artificial limits.
              No upsell tactics. No compromises.
            </p>
            <p>
              Tallow is funded by the community for the community. No venture
              capital. No corporate agenda. Just a commitment to building
              technology that respects your privacy and serves your needs.
            </p>
          </div>
        </section>

        {/* Support Section */}
        <section className={styles.support}>
          <div className={styles.supportHeader}>
            <h2 className={styles.supportHeading}>Support the Mission</h2>
            <p className={styles.supportSubheading}>
              If Tallow has earned your trust, consider supporting the project.
            </p>
          </div>

          <div className={styles.supportGrid}>
            {supportCards.map((card, index) => (
              <a
                key={index}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.supportCard}
              >
                <div className={styles.supportIcon}>{card.icon}</div>
                <h3 className={styles.supportCardTitle}>{card.title}</h3>
                <p className={styles.supportCardDescription}>
                  {card.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
