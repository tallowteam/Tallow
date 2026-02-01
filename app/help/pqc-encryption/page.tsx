import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lock,
  Key,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  Zap,
  Server,
  Cpu,
  BookOpen,
} from 'lucide-react';

export default function PQCEncryptionGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/help" className="hover:text-foreground transition-colors">
              Help Center
            </Link>
            <span>/</span>
            <span className="text-foreground">Post-Quantum Encryption</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="section-hero-dark grid-pattern">
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Link href="/help" className="inline-flex items-center text-hero-muted hover:text-hero-fg mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help Center
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Security Guide</span>
            </div>

            <h1 className="display-lg mb-6">
              Understanding <span className="italic">Post-Quantum</span> Encryption
            </h1>

            <p className="body-xl text-hero-muted max-w-3xl">
              Learn how Tallow uses cutting-edge post-quantum cryptography to protect your files
              against both current and future quantum computer threats.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-content-lg">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Table of Contents */}
            <div className="bg-secondary/30 rounded-lg p-6 mb-12">
              <h2 className="heading-md mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                In This Guide
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#what-is-pqc" className="hover:text-primary transition-colors">
                    1. What is Post-Quantum Cryptography?
                  </a>
                </li>
                <li>
                  <a href="#why-pqc" className="hover:text-primary transition-colors">
                    2. Why Does It Matter?
                  </a>
                </li>
                <li>
                  <a href="#how-tallow-uses-pqc" className="hover:text-primary transition-colors">
                    3. How Tallow Implements PQC
                  </a>
                </li>
                <li>
                  <a href="#algorithms" className="hover:text-primary transition-colors">
                    4. The Algorithms We Use
                  </a>
                </li>
                <li>
                  <a href="#security-layers" className="hover:text-primary transition-colors">
                    5. Multiple Security Layers
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-primary transition-colors">
                    6. Frequently Asked Questions
                  </a>
                </li>
              </ul>
            </div>

            {/* Section 1: What is PQC */}
            <section id="what-is-pqc" className="mb-16">
              <h2 className="display-sm mb-6">1. What is Post-Quantum Cryptography?</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Post-Quantum Cryptography (PQC) refers to cryptographic algorithms designed to be secure
                against attacks from both classical and quantum computers. Unlike traditional encryption
                methods, PQC algorithms are based on mathematical problems that quantum computers cannot
                easily solve.
              </p>

              <div className="bg-white/20/10 border border-white/20 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-white mb-2">Simple Explanation</h3>
                    <p className="text-muted-foreground">
                      Think of traditional encryption as a lock that can be picked by someone with enough
                      time and the right tools (a quantum computer). Post-quantum encryption is like a
                      completely different type of lock that those tools simply cannot open, no matter
                      how powerful they become.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="heading-md mb-4">Key Concepts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-background border border-border rounded-lg p-4">
                  <Lock className="w-6 h-6 text-primary mb-2" />
                  <h4 className="font-medium mb-2">Classical Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on math problems that are hard for regular computers (like factoring large numbers).
                    Quantum computers could break these.
                  </p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <Shield className="w-6 h-6 text-green-500 mb-2" />
                  <h4 className="font-medium mb-2">Post-Quantum Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on different math problems (like lattice problems) that even quantum computers
                    cannot efficiently solve.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Why PQC Matters */}
            <section id="why-pqc" className="mb-16">
              <h2 className="display-sm mb-6">2. Why Does Post-Quantum Encryption Matter?</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Quantum computers are advancing rapidly, and security experts agree it is a matter of
                "when" not "if" they will be able to break current encryption. This presents two
                critical threats:
              </p>

              <div className="space-y-4 mb-8">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-amber-500 mb-2">
                        Threat 1: "Harvest Now, Decrypt Later"
                      </h3>
                      <p className="text-muted-foreground">
                        Attackers can collect encrypted data today and store it until quantum computers
                        can break the encryption. If your files are intercepted now, they could be
                        decrypted in the future.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-red-500 mb-2">
                        Threat 2: Q-Day Vulnerability
                      </h3>
                      <p className="text-muted-foreground">
                        "Q-Day" is the day when quantum computers become powerful enough to break
                        current encryption. Systems not using PQC will be immediately vulnerable
                        on that day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="heading-md mb-4">Timeline</h3>
              <div className="bg-secondary/30 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm font-medium">2024</span>
                    <div className="flex-1 h-2 bg-green-500 rounded" style={{ width: '100%' }} />
                    <span className="text-sm text-muted-foreground">NIST standardizes PQC algorithms</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm font-medium">2025-2030</span>
                    <div className="flex-1 h-2 bg-amber-500 rounded" style={{ width: '80%' }} />
                    <span className="text-sm text-muted-foreground">Critical infrastructure migrates to PQC</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-sm font-medium">2030-2040</span>
                    <div className="flex-1 h-2 bg-red-500 rounded" style={{ width: '60%' }} />
                    <span className="text-sm text-muted-foreground">Estimated Q-Day window</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  By using Tallow, you are already protected against these future threats.
                </p>
              </div>
            </section>

            {/* Section 3: How Tallow Uses PQC */}
            <section id="how-tallow-uses-pqc" className="mb-16">
              <h2 className="display-sm mb-6">3. How Tallow Implements Post-Quantum Encryption</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow uses a hybrid encryption approach that combines post-quantum and classical
                algorithms. This ensures maximum security while maintaining compatibility and performance.
              </p>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm">Tallow Encryption Pipeline</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Key Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          Both devices generate ML-KEM-768 and X25519 key pairs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Key Exchange</h4>
                        <p className="text-sm text-muted-foreground">
                          Public keys are exchanged via secure signaling channel
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Shared Secret Derivation</h4>
                        <p className="text-sm text-muted-foreground">
                          HKDF-SHA256 combines both PQC and classical secrets
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">File Encryption</h4>
                        <p className="text-sm text-muted-foreground">
                          Files encrypted with ChaCha20-Poly1305 using derived key
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Secure Transfer</h4>
                        <p className="text-sm text-muted-foreground">
                          Encrypted data transferred directly peer-to-peer
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Algorithms */}
            <section id="algorithms" className="mb-16">
              <h2 className="display-sm mb-6">4. The Algorithms We Use</h2>

              <div className="grid gap-6 mb-8">
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="heading-sm mb-2">ML-KEM-768 (Kyber)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        NIST-standardized post-quantum key encapsulation mechanism based on lattice problems.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400">
                          NIST Approved
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white/20/10 text-white">
                          192-bit Security
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          Lattice-Based
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white/20/10 flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="heading-sm mb-2">X25519</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Elliptic curve Diffie-Hellman for classical security layer.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400">
                          Industry Standard
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white/20/10 text-white">
                          128-bit Security
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          Elliptic Curve
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="heading-sm mb-2">ChaCha20-Poly1305</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Authenticated encryption cipher for symmetric encryption of file data.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400">
                          AEAD
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white/20/10 text-white">
                          256-bit Key
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          High Performance
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-700 dark:text-green-400 mb-2">Why Hybrid?</h3>
                    <p className="text-muted-foreground">
                      By combining PQC and classical algorithms, Tallow provides defense in depth.
                      Even if one algorithm is compromised, the other still protects your data.
                      This is the approach recommended by NIST and security experts worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Security Layers */}
            <section id="security-layers" className="mb-16">
              <h2 className="display-sm mb-6">5. Multiple Security Layers</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow does not rely on just one security measure. Your files are protected by
                multiple overlapping security layers:
              </p>

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-8">
                  <div className="relative flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center z-10">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="heading-sm mb-2">Layer 1: Post-Quantum Encryption</h3>
                      <p className="text-muted-foreground">
                        ML-KEM-768 + X25519 hybrid key exchange protects against both classical
                        and quantum attacks.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/20/10 border-4 border-background flex items-center justify-center z-10">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="heading-sm mb-2">Layer 2: Transport Encryption (DTLS)</h3>
                      <p className="text-muted-foreground">
                        WebRTC connections use DTLS 1.2 with forward secrecy for additional
                        transport-level protection.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border-4 border-background flex items-center justify-center z-10">
                      <Key className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="heading-sm mb-2">Layer 3: Optional Password Protection</h3>
                      <p className="text-muted-foreground">
                        Add a second layer with Argon2id key derivation (600k iterations) and
                        AES-256-GCM encryption.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 border-4 border-background flex items-center justify-center z-10">
                      <Server className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="heading-sm mb-2">Layer 4: No Server Storage</h3>
                      <p className="text-muted-foreground">
                        Files are never stored on servers. Direct peer-to-peer transfer means
                        there is no data at rest to attack.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: FAQ */}
            <section id="faq" className="mb-16">
              <h2 className="display-sm mb-6">6. Frequently Asked Questions</h2>

              <div className="space-y-4">
                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">Is Tallow slower because of PQC encryption?</h3>
                  <p className="text-muted-foreground">
                    No. ML-KEM-768 is actually very fast - key generation and encapsulation take
                    only milliseconds. The encryption overhead is negligible compared to file
                    transfer time.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">Are the algorithms NIST approved?</h3>
                  <p className="text-muted-foreground">
                    Yes. ML-KEM (formerly Kyber) was selected by NIST in 2024 as the primary
                    post-quantum key encapsulation standard after years of rigorous analysis.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">What if quantum computers never become powerful enough?</h3>
                  <p className="text-muted-foreground">
                    Even in that scenario, you lose nothing. The hybrid approach means you still
                    have full classical security. PQC is additional protection, not a replacement.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">Can I verify Tallow is using PQC?</h3>
                  <p className="text-muted-foreground">
                    Yes. Tallow is open source. You can review the encryption implementation in
                    our GitHub repository. We also provide a security test page that demonstrates
                    the encryption in action.
                  </p>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section className="bg-secondary/30 rounded-lg p-8">
              <h2 className="heading-md mb-4">Ready to Experience Quantum-Safe File Sharing?</h2>
              <p className="text-muted-foreground mb-6">
                Start using post-quantum encryption today. No setup required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app">
                  <Button size="lg">
                    Start Transferring
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/security">
                  <Button size="lg" variant="outline">
                    Read Security Details
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="border-t border-border py-16">
        <div className="container mx-auto px-6">
          <h2 className="heading-md mb-8">Related Help Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/help/file-transfer" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">File Transfer Guide</h3>
              <p className="text-sm text-muted-foreground">Learn how to send and receive files securely.</p>
            </Link>
            <Link href="/help/privacy-settings" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Privacy Settings</h3>
              <p className="text-sm text-muted-foreground">Configure metadata stripping and more.</p>
            </Link>
            <Link href="/help/troubleshooting" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Cpu className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Troubleshooting</h3>
              <p className="text-sm text-muted-foreground">Fix common connection and transfer issues.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="text-xl tracking-tight lowercase font-serif text-foreground">
              tallow
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/help" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Help
              </Link>
              <Link href="/security" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Security
              </Link>
              <Link href="/privacy" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Privacy
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Quantum-safe file sharing</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
