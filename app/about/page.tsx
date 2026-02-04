import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Tallow\'s mission to provide secure, private file transfers for everyone. Built with privacy-first principles and quantum-safe encryption.',
  keywords: 'about tallow, secure file transfer mission, privacy-first, quantum-safe encryption team',
  openGraph: {
    title: 'About Us | Tallow',
    description: 'Learn about our mission to provide secure, private file transfers for everyone.',
    type: 'website',
  },
};

const mission = {
  title: 'Our Mission',
  description: 'To make secure, private file transfers accessible to everyone through cutting-edge post-quantum cryptography and zero-knowledge architecture.',
  values: [
    {
      icon: ShieldCheckIcon,
      title: 'Security First',
      description: 'Every decision we make prioritizes the security and privacy of your data. We use post-quantum cryptography to protect against future threats.',
    },
    {
      icon: LockClosedIcon,
      title: 'Privacy by Design',
      description: 'We built Tallow with zero-knowledge architecture. We can\'t see your files, and we never will. Your privacy is fundamental, not optional.',
    },
    {
      icon: UserGroupIcon,
      title: 'Open & Transparent',
      description: 'We believe in transparency. Our encryption protocols are well-documented, and we welcome security audits from the community.',
    },
    {
      icon: RocketLaunchIcon,
      title: 'Innovation',
      description: 'We\'re constantly pushing the boundaries of secure file transfer technology, staying ahead of emerging threats.',
    },
  ],
};

const timeline = [
  {
    year: '2024',
    title: 'Foundation',
    description: 'Tallow was founded with a vision to bring military-grade encryption to everyday file transfers. We started with a simple question: Why should secure file sharing be complicated?',
  },
  {
    year: '2024 Q2',
    title: 'Post-Quantum Integration',
    description: 'We integrated Kyber-1024 post-quantum cryptography, becoming one of the first file transfer platforms to be quantum-resistant.',
  },
  {
    year: '2024 Q3',
    title: 'Public Beta Launch',
    description: 'Launched public beta with peer-to-peer transfers, zero-knowledge architecture, and end-to-end encryption. Reached 10,000 early adopters.',
  },
  {
    year: '2024 Q4',
    title: 'Enterprise Features',
    description: 'Introduced enterprise features including team management, audit logs, and custom branding. Secured first major enterprise customers.',
  },
  {
    year: '2025',
    title: 'Global Expansion',
    description: 'Expanded to 150+ countries with localized support. Processed over 10 million secure file transfers. Continued innovation in privacy-preserving technologies.',
  },
];

const team = [
  {
    name: 'Engineering Team',
    role: 'Building the Future',
    description: 'Our engineers work tirelessly to create the most secure and user-friendly file transfer platform.',
  },
  {
    name: 'Security Team',
    role: 'Protecting Your Data',
    description: 'Dedicated security experts ensuring Tallow remains at the forefront of encryption technology.',
  },
  {
    name: 'Support Team',
    role: 'Here to Help',
    description: 'Committed to providing exceptional support and ensuring your experience with Tallow is seamless.',
  },
];

export default function AboutPage() {
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
              Building the Future of
              <span className="gradient-text"> Secure File Sharing</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
              At Tallow, we believe privacy is a fundamental right. We're on a mission to make
              secure, encrypted file transfers accessible to everyone, everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-16)' }}>
            <h2 className="section-title">{mission.title}</h2>
            <p style={{
              fontSize: 'var(--font-size-xl)',
              color: 'var(--color-foreground-secondary)',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.7',
            }}>
              {mission.description}
            </p>
          </div>

          <div className="features-grid">
            {mission.values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <h3 className="feature-title">{value.title}</h3>
                  <p className="feature-description">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)' }}>
        <div className="section-container" style={{ maxWidth: '900px' }}>
          <h2 className="section-title">Our Journey</h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-8)',
            marginTop: 'var(--spacing-12)',
            position: 'relative',
          }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '2rem',
              top: '0',
              bottom: '0',
              width: '2px',
              background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.5) 0%, rgba(124, 58, 237, 0.1) 100%)',
            }} />

            {timeline.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-6)',
                  position: 'relative',
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  width: '4rem',
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    background: 'var(--gradient-accent)',
                    borderRadius: '50%',
                    boxShadow: 'var(--glow-base)',
                  }} />
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  paddingBottom: 'var(--spacing-6)',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-6)',
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-accent-primary)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-2)',
                    }}>
                      {item.year}
                    </div>
                    <h3 style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-3)',
                      color: 'var(--color-foreground-primary)',
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      color: 'var(--color-foreground-secondary)',
                      lineHeight: '1.7',
                    }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section style={{ padding: 'var(--spacing-24) var(--spacing-4)', background: 'var(--color-background-secondary)' }}>
        <div className="section-container">
          <h2 className="section-title">Our Team</h2>
          <p className="section-subtitle">
            Dedicated professionals working to keep your data secure
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-8)',
            marginTop: 'var(--spacing-12)',
          }}>
            {team.map((member, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-12)',
                  textAlign: 'center',
                }}
                className="feature-card"
              >
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'var(--gradient-accent)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--spacing-4)',
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                }}>
                  {member.name.charAt(0)}
                </div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  {member.name}
                </h3>
                <p style={{
                  color: 'var(--color-accent-primary)',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  {member.role}
                </p>
                <p style={{
                  color: 'var(--color-foreground-secondary)',
                  lineHeight: '1.6',
                }}>
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: 'var(--spacing-24) var(--spacing-4)' }}>
        <div className="section-container" style={{ maxWidth: '800px' }}>
          <h2 className="section-title">Get in Touch</h2>
          <p className="section-subtitle">
            We'd love to hear from you. Reach out with questions, feedback, or partnership inquiries.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-8)',
            marginTop: 'var(--spacing-12)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-8)',
              textAlign: 'center',
            }}>
              <EnvelopeIcon style={{
                width: '2rem',
                height: '2rem',
                margin: '0 auto var(--spacing-4)',
                color: 'var(--color-accent-primary)',
              }} />
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Email
              </h3>
              <a
                href="mailto:hello@tallow.app"
                style={{
                  color: 'var(--color-foreground-secondary)',
                  textDecoration: 'none',
                }}
                className="hover:text-accent"
              >
                hello@tallow.app
              </a>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-8)',
              textAlign: 'center',
            }}>
              <MapPinIcon style={{
                width: '2rem',
                height: '2rem',
                margin: '0 auto var(--spacing-4)',
                color: 'var(--color-accent-primary)',
              }} />
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Location
              </h3>
              <p style={{
                color: 'var(--color-foreground-secondary)',
              }}>
                San Francisco, CA
              </p>
            </div>
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
