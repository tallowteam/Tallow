import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Tallow Privacy Policy - Learn how we protect your data with zero-knowledge encryption and privacy-first architecture. We never see your files.',
  keywords: 'tallow privacy policy, zero knowledge, data privacy, file transfer privacy',
  openGraph: {
    title: 'Privacy Policy | Tallow',
    description: 'Learn how we protect your data with zero-knowledge encryption.',
    type: 'website',
  },
};

export default function PrivacyPage() {
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
              Privacy
              <span className="gradient-text"> Policy</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
              Your privacy is our top priority. This policy explains how we handle your data
              with complete transparency.
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
            {/* Introduction */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                Our Commitment to Privacy
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                At Tallow, we believe privacy is a fundamental human right. We've built our entire platform
                around the principle of zero-knowledge encryption, which means we literally cannot access
                your files or see what you're sharing.
              </p>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                This Privacy Policy describes how we handle your data, what information we collect, and your
                rights regarding your personal information.
              </p>
            </section>

            {/* Information We Collect */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                1. Information We Collect
              </h2>

              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-3)',
                color: 'var(--color-foreground-primary)',
              }}>
                1.1 Information You Provide
              </h3>
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
                  <strong>Account Information:</strong> Email address, username, and password (encrypted)
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Profile Information:</strong> Optional display name and avatar
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Payment Information:</strong> Processed securely by our payment provider (we never see your card details)
                </li>
              </ul>

              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-3)',
                color: 'var(--color-foreground-primary)',
              }}>
                1.2 Information We Do NOT Collect
              </h3>
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
                  <strong>File Contents:</strong> We cannot see your files due to end-to-end encryption
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>File Names:</strong> File metadata is encrypted and invisible to us
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Transfer Recipients:</strong> We don't know who you're sending files to
                </li>
              </ul>

              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-3)',
                color: 'var(--color-foreground-primary)',
              }}>
                1.3 Automatically Collected Information
              </h3>
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
                  <strong>Usage Data:</strong> Basic analytics like number of transfers (not content)
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Device Information:</strong> Browser type, operating system, IP address
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Cookies:</strong> Essential cookies for authentication and preferences
                </li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                2. How We Use Your Information
              </h2>
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
                  Provide and maintain the Tallow service
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Send important service announcements and security updates
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Improve our service based on aggregated, anonymous usage patterns
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Detect and prevent security threats and abuse
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Comply with legal obligations
                </li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                3. Data Sharing and Disclosure
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                We do not sell, rent, or share your personal information with third parties except in the
                following limited circumstances:
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
                  <strong>Service Providers:</strong> Trusted partners who help us operate our service
                  (hosting, payment processing) under strict confidentiality agreements
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Legal Requirements:</strong> When required by law or to protect our rights
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Business Transfers:</strong> In case of merger or acquisition (with continued
                  privacy protections)
                </li>
              </ul>
            </section>

            {/* Your Rights */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                4. Your Privacy Rights
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                You have the following rights regarding your personal data:
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
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Correction:</strong> Update or correct inaccurate data
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Deletion:</strong> Request deletion of your account and data
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Export:</strong> Download your data in a portable format
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Opt-out:</strong> Unsubscribe from marketing communications
                </li>
              </ul>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                To exercise these rights, contact us at{' '}
                <a
                  href="mailto:privacy@tallow.app"
                  style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}
                >
                  privacy@tallow.app
                </a>
              </p>
            </section>

            {/* Data Security */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                5. Data Security
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                We implement industry-leading security measures to protect your data:
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
                  End-to-end encryption with post-quantum cryptography (Kyber-1024)
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Zero-knowledge architecture (we cannot access your files)
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Regular security audits and penetration testing
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Encrypted data at rest and in transit
                </li>
              </ul>
            </section>

            {/* Data Retention */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                6. Data Retention
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                We retain your data only as long as necessary:
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
                  <strong>Account Data:</strong> Retained while your account is active
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Transfer Data:</strong> Deleted immediately after completion (P2P transfers)
                </li>
                <li style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.7',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  <strong>Logs:</strong> Retained for 90 days for security purposes
                </li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                7. Children's Privacy
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                Tallow is not intended for users under 13 years of age. We do not knowingly collect
                information from children under 13. If you believe we have collected such information,
                please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-foreground-primary)',
              }}>
                8. Changes to This Policy
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
              }}>
                We may update this Privacy Policy from time to time. We will notify you of significant
                changes via email or through the service. Your continued use after changes constitutes
                acceptance of the updated policy.
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
                9. Contact Us
              </h2>
              <p style={{
                color: 'var(--color-foreground-secondary)',
                lineHeight: '1.7',
                marginBottom: 'var(--spacing-4)',
              }}>
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
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
                    href="mailto:privacy@tallow.app"
                    style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}
                  >
                    privacy@tallow.app
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
