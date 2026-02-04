import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the perfect plan for your secure file transfer needs. Free forever for personal use, Pro for power users, and Enterprise for teams.',
  keywords: 'tallow pricing, secure file transfer plans, free file transfer, enterprise file sharing',
  openGraph: {
    title: 'Pricing | Tallow',
    description: 'Choose the perfect plan for your secure file transfer needs.',
    type: 'website',
  },
};

const plans = [
  {
    name: 'Free',
    icon: UserIcon,
    price: '$0',
    period: 'forever',
    description: 'Perfect for personal use and occasional transfers',
    features: [
      { text: 'Up to 5GB file size', included: true },
      { text: 'End-to-end encryption', included: true },
      { text: 'Post-quantum cryptography', included: true },
      { text: 'Unlimited transfers', included: true },
      { text: 'P2P direct connections', included: true },
      { text: 'Basic security features', included: true },
      { text: 'Community support', included: true },
      { text: 'Resume interrupted transfers', included: false },
      { text: 'Transfer history', included: false },
      { text: 'Priority support', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: 'Start Free',
    ctaHref: '/app',
    highlighted: false,
  },
  {
    name: 'Pro',
    icon: SparklesIcon,
    price: '$9.99',
    period: 'per month',
    description: 'For power users who need advanced features',
    features: [
      { text: 'Unlimited file size', included: true },
      { text: 'End-to-end encryption', included: true },
      { text: 'Post-quantum cryptography', included: true },
      { text: 'Unlimited transfers', included: true },
      { text: 'P2P direct connections', included: true },
      { text: 'Advanced security features', included: true },
      { text: 'Resume interrupted transfers', included: true },
      { text: 'Transfer history (90 days)', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Folder transfers', included: true },
      { text: 'Custom branding', included: false },
    ],
    cta: 'Get Pro',
    ctaHref: '/app',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    icon: BuildingOfficeIcon,
    price: 'Custom',
    period: 'contact us',
    description: 'For teams and organizations with advanced needs',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Custom file size limits', included: true },
      { text: 'Dedicated infrastructure', included: true },
      { text: 'Team management', included: true },
      { text: 'Custom branding', included: true },
      { text: 'SSO & SAML integration', included: true },
      { text: 'Audit logs', included: true },
      { text: 'Compliance reports', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'On-premise deployment', included: true },
    ],
    cta: 'Contact Sales',
    ctaHref: '/about#contact',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Is the Free plan really free forever?',
    answer: 'Yes! The Free plan is completely free forever with no hidden fees. It includes all core features including post-quantum encryption and unlimited transfers.',
  },
  {
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer: 'Absolutely. You can upgrade to Pro or Enterprise at any time. If you downgrade, you\'ll retain Pro features until the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and for Enterprise customers, we can arrange invoicing and wire transfers.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us for a full refund within 30 days of purchase.',
  },
  {
    question: 'What happens if I exceed the file size limit?',
    answer: 'On the Free plan, files larger than 5GB will be rejected. Pro users have no file size limits. Enterprise customers can set custom limits based on their needs.',
  },
  {
    question: 'Can I use Tallow for commercial purposes on the Free plan?',
    answer: 'The Free plan is intended for personal use. For commercial use, we recommend the Pro or Enterprise plans which include additional features and support.',
  },
  {
    question: 'How does Enterprise pricing work?',
    answer: 'Enterprise pricing is customized based on your needs, including number of users, data volume, support requirements, and deployment options. Contact our sales team for a quote.',
  },
  {
    question: 'Do you offer discounts for non-profits or education?',
    answer: 'Yes! We offer special pricing for educational institutions and registered non-profit organizations. Contact us at hello@tallow.app for details.',
  },
];

export default function PricingPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-[rgba(10,10,10,0.8)] border-b border-[rgba(255,255,255,0.05)]">
        <div className="section-container">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-2xl font-bold gradient-text">
              Tallow
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-secondary hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/app" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                Launch App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ minHeight: '60vh' }}>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Simple, Transparent
              <span className="gradient-text"> Pricing</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '600px' }}>
              Choose the plan that fits your needs. All plans include post-quantum encryption
              and end-to-end security. Start free, upgrade anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--spacing-8)',
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  style={{
                    background: plan.highlighted
                      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: plan.highlighted
                      ? '2px solid rgba(124, 58, 237, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-12)',
                    position: 'relative',
                    transition: 'all var(--transition-base)',
                  }}
                  className="feature-card"
                >
                  {plan.highlighted && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--gradient-accent)',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div style={{ marginBottom: 'var(--spacing-8)' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: plan.highlighted ? 'var(--gradient-accent)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--spacing-4)',
                    }}>
                      <Icon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                    </div>
                    <h3 style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      marginBottom: 'var(--spacing-2)',
                    }}>
                      {plan.name}
                    </h3>
                    <p style={{
                      color: 'var(--color-foreground-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      marginBottom: 'var(--spacing-6)',
                    }}>
                      {plan.description}
                    </p>
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                      <span style={{
                        fontSize: 'var(--font-size-5xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        background: 'var(--gradient-accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {plan.price}
                      </span>
                      <span style={{
                        color: 'var(--color-foreground-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        marginLeft: 'var(--spacing-2)',
                      }}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className={plan.highlighted ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      marginBottom: 'var(--spacing-8)',
                    }}
                  >
                    {plan.cta}
                    <ArrowRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  </Link>

                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {plan.features.map((feature, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                        {feature.included ? (
                          <CheckIcon style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            color: 'var(--color-success)',
                            flexShrink: 0,
                            marginTop: '0.125rem',
                          }} />
                        ) : (
                          <XMarkIcon style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            color: 'var(--color-foreground-muted)',
                            flexShrink: 0,
                            marginTop: '0.125rem',
                          }} />
                        )}
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          color: feature.included ? 'var(--color-foreground-primary)' : 'var(--color-foreground-tertiary)',
                        }}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)' }}>
        <div className="section-container" style={{ maxWidth: '900px' }}>
          <h2 className="section-title">Frequently Asked Questions</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', marginTop: 'var(--spacing-12)' }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-8)',
                }}
              >
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-3)',
                  color: 'var(--color-foreground-primary)',
                }}>
                  {faq.question}
                </h3>
                <p style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">
            Start transferring files securely today. No credit card required for Free plan.
          </p>
          <Link href="/app" className="btn btn-primary btn-large">
            Start Free
            <ArrowRightIcon className="btn-icon" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Tallow</h3>
              <p>Secure file transfers, quantum-safe.</p>
            </div>

            <div className="footer-column">
              <h4>Product</h4>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/security">Security</Link>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>

            <div className="footer-column">
              <h4>Support</h4>
              <Link href="/about#contact">Contact</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Tallow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
