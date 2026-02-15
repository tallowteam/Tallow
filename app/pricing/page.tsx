import type { Metadata } from 'next';
import Link from 'next/link';
import { getPlan, type PlanTier } from '@/lib/payments/pricing-config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the Tallow plan that fits your workflow: Free, Pro, Business, or Enterprise.',
  alternates: {
    canonical: 'https://tallow.app/pricing',
  },
  openGraph: {
    title: 'Pricing | Tallow',
    description: 'Choose the Tallow plan that fits your workflow: Free, Pro, Business, or Enterprise.',
    url: '/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Tallow',
    description: 'Choose the Tallow plan that fits your workflow: Free, Pro, Business, or Enterprise.',
  },
};

function formatPrice(price: number): string {
  if (price === 0) {
    return '$0';
  }
  return `$${price.toFixed(2)}`;
}

export default function PricingPage() {
  const tiers: PlanTier[] = ['free', 'pro', 'business', 'enterprise'];
  const plans = tiers.map((tier) => getPlan(tier));

  const supportCards = [
    {
      title: 'Star on GitHub',
      description: 'Show your support',
      icon: '*',
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
      icon: '->',
      href: 'https://github.com/tallowteam/Tallow',
    },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.label}>PRICING</div>
          <h1 className={styles.heading}>Plans for every transfer mission.</h1>
        </section>

        <section className={styles.pricingSection}>
          <div className={styles.planGrid}>
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ''}`}
              >
                <div className={styles.planHeader}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planDescription}>{plan.description}</p>
                  <div className={styles.planPrice}>
                    {formatPrice(plan.price)}
                    <span className={styles.planPriceSuffix}>
                      {plan.price === 0 ? ' forever' : ' / month'}
                    </span>
                  </div>
                </div>

                <div className={styles.features}>
                  {plan.included.slice(0, 6).map((feature, index) => (
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

                {plan.limitations && plan.limitations.length > 0 && (
                  <p className={styles.limitations}>
                    Not included: {plan.limitations.slice(0, 2).join(', ')}
                  </p>
                )}

                <Link href="/transfer" className={styles.ctaButton}>
                  {plan.id === 'free' ? 'Start Free' : `Choose ${plan.name}`}
                </Link>
              </article>
            ))}
          </div>

          <p className={styles.billingNote}>
            Billing is processed by Stripe. Webhook processing is idempotent and
            subscription state is validated server-side.
          </p>
        </section>

        <section className={styles.philosophy}>
          <h2 className={styles.philosophyHeading}>
            Privacy-first by default across all plans.
          </h2>
          <div className={styles.philosophyContent}>
            <p>
              Every tier includes the same core cryptographic and privacy
              posture. Paid tiers unlock operational scale, support, and
              integration depth without reducing protection on the Free tier.
            </p>
            <p>
              Payment processing is delegated to Stripe. Tallow does not store
              raw card numbers, CVC values, or bank account details in local app
              state.
            </p>
            <p>
              Webhooks are processed with idempotency checks to avoid duplicate
              subscription transitions.
            </p>
          </div>
        </section>

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
