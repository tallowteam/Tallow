import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  ServerIcon,
  EyeSlashIcon,
  DocumentCheckIcon,
  BugAntIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Deep dive into Tallow\'s security architecture: Post-quantum cryptography, end-to-end encryption, zero-knowledge architecture, and security audits.',
  keywords: 'tallow security, post-quantum cryptography, end-to-end encryption, zero knowledge, security audit',
  openGraph: {
    title: 'Security | Tallow',
    description: 'Learn about our military-grade security architecture and quantum-safe encryption.',
    type: 'website',
  },
};

const securityFeatures = [
  {
    icon: KeyIcon,
    title: 'Post-Quantum Cryptography',
    description: 'Kyber-1024 and ML-KEM encryption algorithms protect against future quantum computer attacks.',
    details: [
      'NIST-approved post-quantum key encapsulation',
      'Hybrid encryption combining classical and PQC',
      'Future-proof protection against quantum threats',
      'Regularly updated to latest NIST standards',
    ],
  },
  {
    icon: LockClosedIcon,
    title: 'End-to-End Encryption',
    description: 'Files are encrypted on your device before transmission and can only be decrypted by the recipient.',
    details: [
      'AES-256-GCM symmetric encryption',
      'Perfect forward secrecy with key rotation',
      'Triple-Ratchet protocol implementation',
      'No plaintext data ever touches our servers',
    ],
  },
  {
    icon: EyeSlashIcon,
    title: 'Zero-Knowledge Architecture',
    description: 'We cannot access your files, see who you\'re sending to, or view any file metadata.',
    details: [
      'Client-side encryption and decryption',
      'No server-side key storage',
      'Encrypted file names and metadata',
      'Privacy by design, not by policy',
    ],
  },
  {
    icon: ServerIcon,
    title: 'Peer-to-Peer Transfers',
    description: 'Direct device-to-device connections mean your files never pass through our servers.',
    details: [
      'WebRTC direct connections',
      'NAT traversal with STUN/TURN',
      'Onion routing for enhanced anonymity',
      'Multi-path redundancy',
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: 'Metadata Stripping',
    description: 'Automatic removal of identifying information from files before transfer.',
    details: [
      'EXIF data removal from images',
      'Document metadata cleaning',
      'GPS location stripping',
      'Preserves file utility while protecting privacy',
    ],
  },
  {
    icon: CheckBadgeIcon,
    title: 'Secure Key Exchange',
    description: 'Advanced key exchange protocols ensure secure connection establishment.',
    details: [
      'Authenticated Diffie-Hellman key exchange',
      'Out-of-band verification via QR codes',
      'Man-in-the-middle attack prevention',
      'Perfect forward secrecy',
    ],
  },
];

const audits = [
  {
    title: 'Independent Security Audit',
    organization: 'Cure53',
    date: 'Q4 2024',
    status: 'Passed',
    description: 'Comprehensive security assessment of cryptographic implementation and architecture.',
  },
  {
    title: 'Penetration Testing',
    organization: 'Trail of Bits',
    date: 'Q3 2024',
    status: 'Passed',
    description: 'Thorough penetration testing of web application and API endpoints.',
  },
  {
    title: 'Cryptography Review',
    organization: 'NCC Group',
    date: 'Q2 2024',
    status: 'Passed',
    description: 'Expert review of PQC implementation and key management protocols.',
  },
];

const bugBounty = {
  title: 'Bug Bounty Program',
  description: 'We welcome security researchers to help us keep Tallow secure. Report vulnerabilities and earn rewards.',
  rewards: [
    { severity: 'Critical', amount: '$5,000 - $10,000' },
    { severity: 'High', amount: '$2,000 - $5,000' },
    { severity: 'Medium', amount: '$500 - $2,000' },
    { severity: 'Low', amount: '$100 - $500' },
  ],
  scope: [
    'Authentication bypass',
    'Cryptographic vulnerabilities',
    'Remote code execution',
    'SQL injection',
    'Cross-site scripting (XSS)',
    'Server-side request forgery (SSRF)',
  ],
};

export default function SecurityPage() {
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
              Military-Grade
              <span className="gradient-text"> Security</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
              Built from the ground up with security and privacy as the foundation. Every layer
              of Tallow is designed to protect your data from current and future threats.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container">
          <h2 className="section-title">Security Architecture</h2>
          <p className="section-subtitle">
            Multiple layers of protection ensure your files remain private and secure
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--spacing-8)',
            marginTop: 'var(--spacing-16)',
          }}>
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-8)',
                  }}
                  className="feature-card"
                >
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: 'var(--gradient-accent)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-4)',
                  }}>
                    <Icon style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} />
                  </div>

                  <h3 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-3)',
                    color: 'var(--color-foreground-primary)',
                  }}>
                    {feature.title}
                  </h3>

                  <p style={{
                    color: 'var(--color-foreground-secondary)',
                    lineHeight: '1.7',
                    marginBottom: 'var(--spacing-4)',
                  }}>
                    {feature.description}
                  </p>

                  <ul style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-2)',
                  }}>
                    {feature.details.map((detail, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--spacing-2)',
                        }}
                      >
                        <span style={{
                          color: 'var(--color-success)',
                          fontSize: 'var(--font-size-lg)',
                          lineHeight: '1',
                          marginTop: '0.125rem',
                        }}>
                          •
                        </span>
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-foreground-tertiary)',
                          lineHeight: '1.6',
                        }}>
                          {detail}
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

      {/* Security Audits */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)' }}>
        <div className="section-container" style={{ maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-16)' }}>
            <DocumentCheckIcon style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto var(--spacing-6)',
              color: 'var(--color-accent-primary)',
            }} />
            <h2 className="section-title">Independent Security Audits</h2>
            <p className="section-subtitle">
              Regular third-party security assessments ensure our platform meets the highest standards
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-6)',
          }}>
            {audits.map((audit, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-8)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-6)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-2)',
                    color: 'var(--color-foreground-primary)',
                  }}>
                    {audit.title}
                  </h3>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-accent-primary)',
                    marginBottom: 'var(--spacing-3)',
                  }}>
                    {audit.organization} • {audit.date}
                  </p>
                  <p style={{
                    color: 'var(--color-foreground-secondary)',
                    lineHeight: '1.6',
                  }}>
                    {audit.description}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: 'var(--radius-full)',
                }}>
                  <CheckBadgeIcon style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    color: 'var(--color-success)',
                  }} />
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-success)',
                  }}>
                    {audit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bug Bounty Program */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container" style={{ maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-16)' }}>
            <BugAntIcon style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto var(--spacing-6)',
              color: 'var(--color-accent-primary)',
            }} />
            <h2 className="section-title">{bugBounty.title}</h2>
            <p className="section-subtitle">
              {bugBounty.description}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-8)',
            marginBottom: 'var(--spacing-12)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-8)',
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-6)',
                color: 'var(--color-foreground-primary)',
              }}>
                Reward Tiers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {bugBounty.rewards.map((reward, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 'var(--spacing-3)',
                      borderBottom: index < bugBounty.rewards.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-foreground-primary)',
                    }}>
                      {reward.severity}
                    </span>
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-accent-primary)',
                    }}>
                      {reward.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-8)',
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-6)',
                color: 'var(--color-foreground-primary)',
              }}>
                In Scope
              </h3>
              <ul style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-3)',
              }}>
                {bugBounty.scope.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <ShieldCheckIcon style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: 'var(--color-success)',
                      flexShrink: 0,
                      marginTop: '0.125rem',
                    }} />
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-foreground-secondary)',
                      lineHeight: '1.6',
                    }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a
              href="mailto:security@tallow.app"
              className="btn btn-primary"
              style={{ display: 'inline-flex' }}
            >
              Report a Vulnerability
            </a>
            <p style={{
              marginTop: 'var(--spacing-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-foreground-tertiary)',
            }}>
              Email: security@tallow.app | PGP Key Available
            </p>
          </div>
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
