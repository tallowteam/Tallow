'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Check, Minus, ArrowRight, ChevronDown } from '@/components/icons';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';

const plans = [
  {
    name: 'Free',
    description: 'Perfect for personal use',
    price: '$0',
    period: 'forever',
    features: [
      'Local network transfers',
      'Up to 5 devices',
      'Basic encryption',
      'Community support',
    ],
    cta: 'Get Started',
    ctaVariant: 'secondary' as const,
    href: '/transfer',
  },
  {
    name: 'Pro',
    description: 'For power users and teams',
    price: '$9.99',
    period: '/month',
    badge: 'POPULAR',
    features: [
      'Everything in Free, plus:',
      'Internet P2P transfers',
      'Unlimited devices',
      'Priority relay servers',
      'Scheduled transfers',
      'Chat integration',
      'Custom themes',
    ],
    cta: 'Upgrade to Pro',
    ctaVariant: 'primary' as const,
    href: '/transfer',
    highlighted: true,
  },
  {
    name: 'Business',
    description: 'For organizations at scale',
    price: '$24.99',
    period: '/month',
    features: [
      'Everything in Pro, plus:',
      'Team workspaces',
      'Admin dashboard',
      'Usage analytics',
      'Priority support',
      'API access',
      'SSO integration',
    ],
    cta: 'Contact Sales',
    ctaVariant: 'secondary' as const,
    href: 'mailto:business@tallow.io',
  },
];

const comparisonFeatures = [
  { name: 'Local network transfers', free: true, pro: true, business: true },
  { name: 'End-to-end encryption', free: true, pro: true, business: true },
  { name: 'Maximum devices', free: '5', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Internet P2P transfers', free: false, pro: true, business: true },
  { name: 'Priority relay servers', free: false, pro: true, business: true },
  { name: 'Scheduled transfers', free: false, pro: true, business: true },
  { name: 'Chat integration', free: false, pro: true, business: true },
  { name: 'Custom themes', free: false, pro: true, business: true },
  { name: 'Team workspaces', free: false, pro: false, business: true },
  { name: 'Admin dashboard', free: false, pro: false, business: true },
  { name: 'Usage analytics', free: false, pro: false, business: true },
  { name: 'API access', free: false, pro: false, business: true },
  { name: 'SSO integration', free: false, pro: false, business: true },
  { name: 'Support level', free: 'Community', pro: 'Priority', business: 'Dedicated' },
];

const faqs = [
  {
    question: 'Can I use Tallow for free?',
    answer: 'Yes! Local network transfers are always free. You can transfer files between devices on the same network without any limitations. Upgrade to Pro or Business for internet transfers and advanced features.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We use Stripe to process all payments securely. We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and other payment methods supported by Stripe.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely! There are no long-term contracts or commitments. You can cancel your subscription at any time from your account settings. No questions asked, no hidden fees.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'You keep everything! Tallow is peer-to-peer, meaning your data never lives on our servers. All transfers are direct between your devices. Your data is yours, always.',
  },
  {
    question: 'Do you offer discounts for annual plans?',
    answer: 'Yes! Annual subscribers get 2 months free (16% discount). Contact our sales team for custom pricing for large teams or enterprise deployments.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Yes. We never store your payment information. All transactions are processed securely through Stripe, which is PCI DSS Level 1 certified—the highest level of security in the payment industry.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.faqItem}>
      <button
        className={styles.faqButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className={styles.faqQuestion}>{question}</h3>
        <ChevronDown className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`} />
      </button>
      <div className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={styles.heroGradient} />
            <div className={styles.heroGrid} />
          </div>
          <div className={`container ${styles.heroContainer}`}>
            <AnimatedSection animation="fadeInDown">
              <Badge variant="secondary">Pricing</Badge>
            </AnimatedSection>
            <AnimatedSection animation="fadeInUp" delay={100}>
              <h1 className={styles.heroTitle}>
                Simple, Transparent
                <br />
                <span className={styles.heroTitleGradient}>Pricing</span>
              </h1>
            </AnimatedSection>
            <AnimatedSection animation="fadeInUp" delay={200}>
              <p className={styles.heroDescription}>
                Start free, upgrade when you need more.
                <br />
                No hidden fees. No surprises.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className={styles.pricing}>
          <div className="container">
            <div className={styles.pricingGrid}>
              {plans.map((plan, index) => (
                <AnimatedSection
                  key={index}
                  animation="fadeInUp"
                  delay={index * 100}
                  className={`${styles.pricingCard} ${plan.highlighted ? styles.highlighted : ''}`}
                >
                  {plan.badge && (
                    <div className={styles.popularBadge}>
                      <span className={styles.popularBadgeText}>{plan.badge}</span>
                    </div>
                  )}
                  <div className={styles.pricingHeader}>
                    <h3 className={styles.pricingName}>{plan.name}</h3>
                    <p className={styles.pricingDescription}>{plan.description}</p>
                  </div>
                  <div className={styles.pricingPrice}>
                    <span className={styles.priceValue}>{plan.price}</span>
                    <span className={styles.pricePeriod}>{plan.period}</span>
                  </div>
                  <ul className={styles.pricingFeatures}>
                    {plan.features.map((feature, i) => (
                      <li key={i} className={styles.pricingFeature}>
                        <Check className={styles.checkIcon} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.pricingAction}>
                    <Link href={plan.href} className={styles.pricingLink}>
                      <Button
                        variant={plan.ctaVariant}
                        fullWidth
                        icon={<ArrowRight />}
                        iconPosition="right"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className={styles.comparison}>
          <div className="container">
            <AnimatedSection animation="fadeInUp">
              <div className={styles.sectionHeader}>
                <Badge variant="outline">Compare Plans</Badge>
                <h2 className={styles.sectionTitle}>Feature Comparison</h2>
                <p className={styles.sectionDescription}>
                  Choose the plan that fits your needs
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fadeInUp" delay={100}>
              <div className={styles.tableWrapper}>
                <table className={styles.comparisonTable}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th className={styles.tableHeader}>Feature</th>
                      <th className={styles.tableHeader}>Free</th>
                      <th className={styles.tableHeader}>Pro</th>
                      <th className={styles.tableHeader}>Business</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {comparisonFeatures.map((feature, index) => (
                      <tr key={index} className={styles.tableRow}>
                        <td className={styles.tableCell}>{feature.name}</td>
                        <td className={styles.tableCell}>
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className={styles.tableCheckIcon} />
                            ) : (
                              <Minus className={styles.tableMinusIcon} />
                            )
                          ) : (
                            <span className={styles.tableCellText}>{feature.free}</span>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check className={styles.tableCheckIcon} />
                            ) : (
                              <Minus className={styles.tableMinusIcon} />
                            )
                          ) : (
                            <span className={styles.tableCellText}>{feature.pro}</span>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          {typeof feature.business === 'boolean' ? (
                            feature.business ? (
                              <Check className={styles.tableCheckIcon} />
                            ) : (
                              <Minus className={styles.tableMinusIcon} />
                            )
                          ) : (
                            <span className={styles.tableCellText}>{feature.business}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className={styles.faq}>
          <div className="container">
            <AnimatedSection animation="fadeInUp">
              <div className={styles.sectionHeader}>
                <Badge variant="outline">FAQ</Badge>
                <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                <p className={styles.sectionDescription}>
                  Everything you need to know about our pricing
                </p>
              </div>
            </AnimatedSection>

            <div className={styles.faqGrid}>
              {faqs.map((faq, index) => (
                <AnimatedSection key={index} animation="fadeInUp" delay={index * 50}>
                  <FAQItem question={faq.question} answer={faq.answer} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <AnimatedSection animation="fadeInScale">
              <div className={styles.ctaCard}>
                <div className={styles.ctaGlow} />
                <h2 className={styles.ctaTitle}>Ready to get started?</h2>
                <p className={styles.ctaDescription}>
                  No credit card required. Start sharing today.
                </p>
                <div className={styles.ctaActions}>
                  <Link href="/transfer">
                    <Button size="lg" icon={<ArrowRight />} iconPosition="right">
                      Start Free
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button size="lg" variant="secondary">
                      View Features
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
