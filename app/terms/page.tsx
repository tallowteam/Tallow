import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Tallow Terms of Service - Read our terms and conditions for using our secure file transfer platform.',
  keywords: 'tallow terms, terms of service, user agreement, legal',
  openGraph: {
    title: 'Terms of Service | Tallow',
    description: 'Read our terms and conditions for using Tallow.',
    type: 'website',
  },
};

export default function TermsPage() {
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
      <section className="hero-section" style={{ minHeight: '40vh' }}>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Terms of
              <span className="gradient-text"> Service</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
              Please read these terms carefully before using Tallow. By using our service,
              you agree to be bound by these terms.
            </p>

            <p style={{
              color: 'var(--color-foreground-tertiary)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--spacing-4)',
            }}>
              Last updated: February 3, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)' }}>
        <div className="section-container" style={{ maxWidth: '900px' }}>
          <article style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-12)',
          }}>
            {/* Acceptance */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                1. Acceptance of Terms
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                By accessing or using Tallow ("the Service"), you agree to be bound by these Terms of Service
                ("Terms"). If you do not agree to these Terms, please do not use the Service.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                These Terms apply to all users of the Service, including both free and paid subscribers.
              </p>
            </section>

            {/* Description of Service */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                2. Description of Service
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                Tallow provides a secure, encrypted file transfer platform that enables users to send files
                directly between devices using peer-to-peer connections and end-to-end encryption.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof)
                at any time with or without notice.
              </p>
            </section>

            {/* User Accounts */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                3. User Accounts
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                To access certain features, you must create an account. You agree to:
              </p>
              <ul style={{
                listStyle: 'disc',
                paddingLeft: 'var(--spacing-8)',
                marginBottom: 'var(--spacing-6)',
              }}>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Provide accurate, current, and complete information during registration
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Maintain and update your information to keep it accurate
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Maintain the security of your account credentials
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Notify us immediately of any unauthorized access
                </li>
              </ul>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                You are responsible for all activities that occur under your account.
              </p>
            </section>

            {/* Acceptable Use */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                4. Acceptable Use Policy
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                You agree NOT to use the Service to:
              </p>
              <ul style={{
                listStyle: 'disc',
                paddingLeft: 'var(--spacing-8)',
                marginBottom: 'var(--spacing-6)',
              }}>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Violate any laws, regulations, or third-party rights
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Transmit malware, viruses, or harmful code
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Harass, abuse, or harm others
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Impersonate others or misrepresent your identity
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Attempt to gain unauthorized access to our systems
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Interfere with or disrupt the Service
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Use automated systems to access the Service without permission
                </li>
              </ul>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                We reserve the right to investigate and take appropriate action against anyone who violates
                this policy, including suspending or terminating accounts.
              </p>
            </section>

            {/* Intellectual Property */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                5. Intellectual Property
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                The Service, including its design, features, text, graphics, and code, is owned by Tallow
                and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                You retain all rights to files you transfer through the Service. By using the Service,
                you grant us a limited license to transmit your files as necessary to provide the Service.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                Due to our zero-knowledge encryption, we cannot access your files and therefore cannot
                view, copy, or use your content.
              </p>
            </section>

            {/* Payment Terms */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                6. Payment Terms
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                For paid subscriptions:
              </p>
              <ul style={{
                listStyle: 'disc',
                paddingLeft: 'var(--spacing-8)',
                marginBottom: 'var(--spacing-6)',
              }}>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Fees are billed in advance on a monthly or annual basis
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  All fees are non-refundable except as required by law or our refund policy
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Subscriptions automatically renew unless cancelled
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  We reserve the right to change pricing with 30 days notice
                </li>
              </ul>
            </section>

            {/* Termination */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                7. Termination
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                You may terminate your account at any time by contacting us. We may suspend or terminate
                your account if you violate these Terms or for other legitimate business reasons.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                Upon termination, your right to use the Service will immediately cease. We will delete
                your account data in accordance with our Privacy Policy.
              </p>
            </section>

            {/* Disclaimers */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                8. Disclaimers
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                We do not warrant that the Service will be uninterrupted, error-free, or completely
                secure. You use the Service at your own risk.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                9. Limitation of Liability
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TALLOW SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
                REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
                OR OTHER INTANGIBLE LOSSES.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                Our total liability shall not exceed the amount you paid us in the 12 months preceding
                the claim, or $100, whichever is greater.
              </p>
            </section>

            {/* Indemnification */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                10. Indemnification
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                You agree to indemnify and hold harmless Tallow, its officers, directors, employees,
                and agents from any claims, damages, losses, liabilities, and expenses (including legal
                fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                11. Dispute Resolution
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                Any disputes arising from these Terms or the Service shall be resolved through binding
                arbitration in accordance with the rules of the American Arbitration Association.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                These Terms shall be governed by the laws of the State of California, without regard
                to conflict of law principles.
              </p>
            </section>

            {/* Changes to Terms */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                12. Changes to Terms
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                We may modify these Terms at any time. We will notify you of material changes via
                email or through the Service. Your continued use after changes constitutes acceptance
                of the modified Terms.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                13. Contact Information
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                For questions about these Terms, please contact us:
              </p>
              <ul style={{
                listStyle: 'none',
                paddingLeft: '0',
              }}>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Email:{' '}
                  <a
                    href="mailto:legal@tallow.app"
                    style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}
                  >
                    legal@tallow.app
                  </a>
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  General:{' '}
                  <a
                    href="mailto:hello@tallow.app"
                    style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}
                  >
                    hello@tallow.app
                  </a>
                </li>
              </ul>
            </section>
          </article>
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
