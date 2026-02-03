import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  ServerIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Tallow - Secure File Transfers. Quantum-Safe.',
  description: 'Transfer files directly between devices with post-quantum encryption. No cloud storage, no compromises. Peer-to-peer, zero-knowledge file sharing.',
  keywords: 'secure file transfer, quantum-safe, post-quantum encryption, peer-to-peer, p2p, zero knowledge, encrypted file sharing',
  openGraph: {
    title: 'Tallow - Secure File Transfers. Quantum-Safe.',
    description: 'Transfer files directly between devices with post-quantum encryption. No cloud storage, no compromises.',
    type: 'website',
    url: 'https://tallow.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tallow - Secure File Transfers. Quantum-Safe.',
    description: 'Transfer files directly between devices with post-quantum encryption.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Secure File Transfers.
              <span className="gradient-text"> Quantum-Safe.</span>
            </h1>

            <p className="hero-subtitle">
              Transfer files directly between devices with post-quantum encryption.
              No cloud storage, no compromises.
            </p>

            <div className="hero-cta">
              <Link href="/app" className="btn btn-primary">
                Start Transferring
                <ArrowRightIcon className="btn-icon" />
              </Link>
              <Link href="#how-it-works" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          </div>

          <div className="hero-glow" aria-hidden="true"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <h2 className="section-title">Built for Security & Privacy</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <ShieldCheckIcon />
              </div>
              <h3 className="feature-title">Post-Quantum Encryption</h3>
              <p className="feature-description">
                Protected against quantum computer attacks with Kyber-1024 and ML-KEM encryption.
                Your files are safe today and tomorrow.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <ServerIcon />
              </div>
              <h3 className="feature-title">Peer-to-Peer Transfers</h3>
              <p className="feature-description">
                Direct device-to-device connections using WebRTC. Your files never touch our servers
                or any cloud storage.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <EyeSlashIcon />
              </div>
              <h3 className="feature-title">Zero Knowledge</h3>
              <p className="feature-description">
                End-to-end encryption means only you and your recipient can access the files.
                We can't see what you share.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <DevicePhoneMobileIcon />
              </div>
              <h3 className="feature-title">Cross-Platform</h3>
              <p className="feature-description">
                Works seamlessly across desktop, mobile, and tablet. Transfer between any devices,
                any operating systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Three simple steps to secure file transfers
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Connect Devices</h3>
              <p className="step-description">
                Scan QR code or share a secure link to establish encrypted connection
                between your devices.
              </p>
            </div>

            <div className="step-arrow" aria-hidden="true">
              <ArrowRightIcon />
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Select Files</h3>
              <p className="step-description">
                Choose files, folders, or drag and drop. Supports unlimited file sizes
                and multiple files.
              </p>
            </div>

            <div className="step-arrow" aria-hidden="true">
              <ArrowRightIcon />
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Transfer Securely</h3>
              <p className="step-description">
                Files are encrypted and sent directly to the recipient. No intermediary
                servers, no data retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section" id="security">
        <div className="section-container">
          <div className="security-content">
            <div className="security-text">
              <h2 className="section-title">Military-Grade Security</h2>
              <p className="security-intro">
                Tallow uses multiple layers of encryption to ensure your files remain private
                and secure at all times.
              </p>

              <div className="security-features">
                <div className="security-feature">
                  <CheckIcon className="check-icon" />
                  <div>
                    <h4>Post-Quantum Cryptography</h4>
                    <p>Kyber-1024 and ML-KEM resistant to quantum attacks</p>
                  </div>
                </div>

                <div className="security-feature">
                  <CheckIcon className="check-icon" />
                  <div>
                    <h4>Triple-Ratchet Protocol</h4>
                    <p>Forward secrecy with automatic key rotation</p>
                  </div>
                </div>

                <div className="security-feature">
                  <CheckIcon className="check-icon" />
                  <div>
                    <h4>Metadata Stripping</h4>
                    <p>Automatic removal of identifying information from files</p>
                  </div>
                </div>

                <div className="security-feature">
                  <CheckIcon className="check-icon" />
                  <div>
                    <h4>Onion Routing</h4>
                    <p>Multi-layer routing for enhanced anonymity</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="security-visual">
              <div className="encryption-diagram">
                <div className="encryption-layer">
                  <span className="layer-label">Post-Quantum</span>
                </div>
                <div className="encryption-layer">
                  <span className="layer-label">AES-256-GCM</span>
                </div>
                <div className="encryption-layer">
                  <span className="layer-label">Triple Ratchet</span>
                </div>
                <div className="encryption-core">
                  <span>Your Files</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10M+</div>
              <div className="stat-label">Files Transferred</div>
            </div>

            <div className="stat-card">
              <div className="stat-number">500TB+</div>
              <div className="stat-label">Data Encrypted</div>
            </div>

            <div className="stat-card">
              <div className="stat-number">150+</div>
              <div className="stat-label">Countries Served</div>
            </div>

            <div className="stat-card">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Transfer Securely?</h2>
          <p className="cta-description">
            Join thousands of users who trust Tallow for secure, private file transfers.
          </p>
          <Link href="/app" className="btn btn-primary btn-large">
            Try Tallow Now
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

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link href="/app">App</Link>
                <Link href="#features">Features</Link>
                <Link href="#security">Security</Link>
                <Link href="#how-it-works">How It Works</Link>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <Link href="/about">About</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/security">Security</Link>
              </div>

              <div className="footer-column">
                <h4>Resources</h4>
                <Link href="/docs">Documentation</Link>
                <Link href="/help">Help Center</Link>
                <Link href="/api">API</Link>
                <Link href="/blog">Blog</Link>
              </div>

              <div className="footer-column">
                <h4>Connect</h4>
                <a href="https://github.com/tallow" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://twitter.com/tallow" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="https://discord.gg/tallow" target="_blank" rel="noopener noreferrer">Discord</a>
                <a href="mailto:hello@tallow.app">Contact</a>
              </div>
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
