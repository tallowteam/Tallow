import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  FolderIcon,
  ClockIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  CpuChipIcon,
  LockClosedIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore all Tallow features: Post-quantum encryption, peer-to-peer transfers, folder sharing, resume capability, and more. Built for security and ease of use.',
  keywords: 'tallow features, secure file transfer features, p2p file sharing, encrypted transfers',
  openGraph: {
    title: 'Features | Tallow',
    description: 'Explore all the features that make Tallow the most secure file transfer platform.',
    type: 'website',
  },
};

const coreFeatures = [
  {
    icon: ShieldCheckIcon,
    title: 'Post-Quantum Encryption',
    description: 'Future-proof security with Kyber-1024 and ML-KEM algorithms that resist quantum computer attacks.',
    benefits: [
      'NIST-approved quantum-safe algorithms',
      'Hybrid classical + PQC encryption',
      'Protection against future quantum threats',
    ],
  },
  {
    icon: LockClosedIcon,
    title: 'End-to-End Encryption',
    description: 'Files are encrypted on your device before leaving and can only be decrypted by the recipient.',
    benefits: [
      'AES-256-GCM encryption',
      'Zero server-side access to files',
      'Perfect forward secrecy',
    ],
  },
  {
    icon: BoltIcon,
    title: 'Blazing Fast Transfers',
    description: 'Direct peer-to-peer connections deliver files at maximum speed without server bottlenecks.',
    benefits: [
      'WebRTC P2P technology',
      'Multi-path data streaming',
      'Automatic speed optimization',
    ],
  },
  {
    icon: EyeSlashIcon,
    title: 'Zero-Knowledge Architecture',
    description: 'We literally cannot see your files, recipients, or any metadata. Privacy by design.',
    benefits: [
      'Client-side encryption only',
      'No server-side key storage',
      'Complete user privacy',
    ],
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Cross-Platform',
    description: 'Works seamlessly across desktop, mobile, and tablet on any operating system.',
    benefits: [
      'Web app (no installation)',
      'iOS and Android support',
      'Consistent experience everywhere',
    ],
  },
  {
    icon: FolderIcon,
    title: 'Folder Transfers',
    description: 'Send entire folders with full directory structure preserved. Perfect for project sharing.',
    benefits: [
      'Maintains folder hierarchy',
      'Batch file processing',
      'Progress tracking per file',
    ],
  },
];

const advancedFeatures = [
  {
    icon: ClockIcon,
    title: 'Resume Interrupted Transfers',
    description: 'Connection dropped? No problem. Resume transfers exactly where they left off.',
    useCases: ['Large file transfers', 'Unstable connections', 'Mobile network switches'],
  },
  {
    icon: DocumentDuplicateIcon,
    title: 'Metadata Stripping',
    description: 'Automatically remove EXIF data, GPS coordinates, and other identifying information.',
    useCases: ['Privacy-sensitive photos', 'Whistleblower protection', 'Anonymous sharing'],
  },
  {
    icon: GlobeAltIcon,
    title: 'Onion Routing',
    description: 'Multi-layer routing through encrypted relays for enhanced anonymity.',
    useCases: ['Journalist communications', 'Activist file sharing', 'Maximum privacy needs'],
  },
  {
    icon: CpuChipIcon,
    title: 'Hardware Acceleration',
    description: 'Leverage your device\'s GPU and crypto co-processors for faster encryption.',
    useCases: ['Large video files', 'Bulk transfers', 'Performance-critical workflows'],
  },
  {
    icon: ArrowPathIcon,
    title: 'Automatic Sync',
    description: 'Keep folders synchronized across devices with automatic encrypted transfers.',
    useCases: ['Team collaboration', 'Multi-device workflows', 'Backup automation'],
  },
  {
    icon: UserGroupIcon,
    title: 'Group Transfers',
    description: 'Send files to multiple recipients simultaneously with individual encryption.',
    useCases: ['Team distribution', 'Class materials', 'Multi-party collaboration'],
  },
];

const useCases = [
  {
    title: 'For Professionals',
    description: 'Share confidential documents, contracts, and client files with complete security.',
    icon: '💼',
  },
  {
    title: 'For Journalists',
    description: 'Receive sensitive documents from sources with guaranteed anonymity and encryption.',
    icon: '📰',
  },
  {
    title: 'For Healthcare',
    description: 'Transfer patient records and medical images in HIPAA-compliant encrypted channels.',
    icon: '🏥',
  },
  {
    title: 'For Legal',
    description: 'Share case files and privileged communications with attorney-client protection.',
    icon: '⚖️',
  },
  {
    title: 'For Creators',
    description: 'Send large media files, raw footage, and project assets to collaborators securely.',
    icon: '🎨',
  },
  {
    title: 'For Activists',
    description: 'Coordinate securely with quantum-safe encryption and anonymous routing.',
    icon: '✊',
  },
];

export default function FeaturesPage() {
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
              Everything You Need for
              <span className="gradient-text"> Secure Transfers</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
              Powerful features built on a foundation of military-grade encryption and
              zero-knowledge architecture. Transfer files with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container">
          <h2 className="section-title">Core Features</h2>
          <p className="section-subtitle">
            Essential capabilities included in every plan
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--spacing-8)',
            marginTop: 'var(--spacing-16)',
          }}>
            {coreFeatures.map((feature, index) => {
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
                    {feature.benefits.map((benefit, idx) => (
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
                          {benefit}
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

      {/* Advanced Features */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)' }}>
        <div className="section-container">
          <h2 className="section-title">Advanced Features</h2>
          <p className="section-subtitle">
            Power user capabilities for demanding workflows
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--spacing-6)',
            marginTop: 'var(--spacing-16)',
          }}>
            {advancedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-6)',
                  }}
                  className="feature-card"
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-3)',
                    marginBottom: 'var(--spacing-4)',
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'rgba(124, 58, 237, 0.1)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        color: 'var(--color-accent-primary)',
                      }} />
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: 'var(--spacing-2)',
                        color: 'var(--color-foreground-primary)',
                      }}>
                        {feature.title}
                      </h3>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-foreground-secondary)',
                        lineHeight: '1.6',
                      }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-foreground-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'var(--spacing-2)',
                    }}>
                      Perfect for:
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-2)',
                    }}>
                      {feature.useCases.map((useCase, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(124, 58, 237, 0.1)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            borderRadius: 'var(--radius-full)',
                            color: 'var(--color-foreground-secondary)',
                          }}
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container">
          <h2 className="section-title">Built for Your Industry</h2>
          <p className="section-subtitle">
            Trusted by professionals across industries who demand security
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-6)',
            marginTop: 'var(--spacing-16)',
          }}>
            {useCases.map((useCase, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-6)',
                  textAlign: 'center',
                }}
                className="feature-card"
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  {useCase.icon}
                </div>
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-3)',
                  color: 'var(--color-foreground-primary)',
                }}>
                  {useCase.title}
                </h3>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.6',
                }}>
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Experience All Features Today</h2>
          <p className="cta-description">
            Start with our Free plan and upgrade anytime to unlock advanced features.
          </p>
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-4)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 'var(--spacing-8)',
          }}>
            <Link href="/app" className="btn btn-primary btn-large">
              Try Free Now
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-large">
              View Pricing
            </Link>
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
