import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Security | Tallow',
  description: 'Post-quantum cryptographic security. End-to-end encrypted file transfers that outlast the quantum age.',
  openGraph: {
    title: 'Security | Tallow',
    description: 'Post-quantum cryptographic security. End-to-end encrypted file transfers that outlast the quantum age.',
  },
};

export default function SecurityPage() {
  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <p className={styles.label}>SECURITY</p>
          <h1 className={styles.heroTitle}>
            Encryption that outlasts the quantum age.
          </h1>
          <p className={styles.heroSubtitle}>
            Military-grade post-quantum cryptography protects your files from today's threats and tomorrow's quantum computers.
          </p>
        </div>
      </section>

      {/* Overview Cards */}
      <section className={styles.overview}>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className={styles.overviewTitle}>End-to-End Encrypted</h3>
            <p className={styles.overviewDescription}>
              Every file is encrypted before leaving your device. No plaintext ever touches the network.
            </p>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            </div>
            <h3 className={styles.overviewTitle}>Zero Knowledge</h3>
            <p className={styles.overviewDescription}>
              No servers see your data, ever. Transfers happen directly between devices via peer-to-peer connections.
            </p>
          </div>

          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className={styles.overviewTitle}>Post-Quantum Safe</h3>
            <p className={styles.overviewDescription}>
              ML-KEM-768 key exchange protects against future quantum computers. Your transfers stay private for decades.
            </p>
          </div>
        </div>
      </section>

      {/* Encryption Journey */}
      <section className={styles.journey}>
        <div className={styles.journeyContainer}>
          <h2 className={styles.sectionTitle}>The Encryption Journey</h2>
          <p className={styles.sectionSubtitle}>
            What happens when you send a file through Tallow
          </p>

          <div className={styles.journeySteps}>
            <div className={styles.journeyStep}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>File Chunked</h3>
              <p className={styles.stepDescription}>
                Your file is divided into secure segments for efficient streaming and integrity verification.
              </p>
            </div>

            <div className={styles.journeyStep}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>Chunk Encryption</h3>
              <p className={styles.stepDescription}>
                Each chunk is encrypted with AES-256-GCM, the gold standard in symmetric encryption.
              </p>
            </div>

            <div className={styles.journeyStep}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>Quantum-Safe Key Exchange</h3>
              <p className={styles.stepDescription}>
                ML-KEM-768 (Kyber) establishes a shared secret that even quantum computers cannot break.
              </p>
            </div>

            <div className={styles.journeyStep}>
              <div className={styles.stepNumber}>04</div>
              <h3 className={styles.stepTitle}>P2P Transfer</h3>
              <p className={styles.stepDescription}>
                Encrypted chunks travel directly to the recipient via WebRTC. No servers in between.
              </p>
            </div>

            <div className={styles.journeyStep}>
              <div className={styles.stepNumber}>05</div>
              <h3 className={styles.stepTitle}>Recipient Decrypts</h3>
              <p className={styles.stepDescription}>
                Only the recipient's private key can decrypt the file. Complete end-to-end privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptographic Specifications */}
      <section className={styles.specs}>
        <div className={styles.specsContainer}>
          <h2 className={styles.sectionTitle}>Cryptographic Specifications</h2>
          <p className={styles.sectionSubtitle}>
            Technical implementation details
          </p>

          <div className={styles.specsCard}>
            <dl className={styles.specsList}>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Key Exchange</dt>
                <dd className={styles.specValue}>ML-KEM-768 (Kyber)</dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Symmetric Encryption</dt>
                <dd className={styles.specValue}>AES-256-GCM</dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Key Derivation</dt>
                <dd className={styles.specValue}>HKDF-SHA256</dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Authentication</dt>
                <dd className={styles.specValue}>Ed25519 signatures</dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Forward Secrecy</dt>
                <dd className={styles.specValue}>Per-session ephemeral keys</dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Nonce</dt>
                <dd className={styles.specValue}>96-bit random, never reused</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Threat Model */}
      <section className={styles.threats}>
        <div className={styles.threatsContainer}>
          <h2 className={styles.sectionTitle}>Threat Model</h2>
          <p className={styles.sectionSubtitle}>
            What Tallow protects against
          </p>

          <div className={styles.threatsGrid}>
            <div className={styles.threatCard}>
              <div className={styles.threatCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.threatTitle}>Man-in-the-Middle Attacks</h3>
              <p className={styles.threatDescription}>
                End-to-end encryption prevents interception. Attackers see only encrypted data.
              </p>
            </div>

            <div className={styles.threatCard}>
              <div className={styles.threatCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.threatTitle}>Quantum Computing Threats</h3>
              <p className={styles.threatDescription}>
                Post-quantum ML-KEM resists attacks from future quantum computers.
              </p>
            </div>

            <div className={styles.threatCard}>
              <div className={styles.threatCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.threatTitle}>Server Compromise</h3>
              <p className={styles.threatDescription}>
                No servers exist. Your data never touches infrastructure we control.
              </p>
            </div>

            <div className={styles.threatCard}>
              <div className={styles.threatCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.threatTitle}>Metadata Leakage</h3>
              <p className={styles.threatDescription}>
                Minimal metadata. File names and sizes are encrypted during transfer.
              </p>
            </div>

            <div className={styles.threatCard}>
              <div className={styles.threatCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.threatTitle}>File Tampering</h3>
              <p className={styles.threatDescription}>
                Authenticated encryption detects any modification. Tampered files are rejected.
              </p>
            </div>

            <div className={styles.threatCard}>
              <div className={styles.threatCheck}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.threatTitle}>Replay Attacks</h3>
              <p className={styles.threatDescription}>
                Unique nonces and session keys prevent replay of captured traffic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faq}>
        <div className={styles.faqContainer}>
          <h2 className={styles.sectionTitle}>Security FAQ</h2>
          <p className={styles.sectionSubtitle}>
            Common questions about Tallow's security
          </p>

          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Is Tallow really post-quantum safe?
              </h3>
              <p className={styles.faqAnswer}>
                Yes. Tallow uses ML-KEM-768 (formerly known as Kyber), which is a NIST-standardized post-quantum key encapsulation mechanism. It's designed to resist attacks from both classical and quantum computers. The algorithm is based on lattice cryptography, which has no known efficient quantum algorithm to break it.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Where are files stored?
              </h3>
              <p className={styles.faqAnswer}>
                Nowhere. Tallow doesn't store files on any server. Files are transferred directly from sender to recipient using peer-to-peer WebRTC connections. This zero-knowledge architecture means we physically cannot access your data, even if compelled to do so.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Can Tallow see my files?
              </h3>
              <p className={styles.faqAnswer}>
                No. Files are encrypted on your device before any network activity begins. They travel encrypted through the peer-to-peer connection and are only decrypted on the recipient's device. We never have access to encryption keys or plaintext data. This is mathematically guaranteed by the architecture.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                What happens if the connection drops?
              </h3>
              <p className={styles.faqAnswer}>
                Transfers can be resumed from where they left off. Tallow maintains a secure session state that allows reconnection without restarting the entire transfer. The encryption context is preserved, so the same keys continue to protect resumed chunks.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Is Tallow open source?
              </h3>
              <p className={styles.faqAnswer}>
                Yes. Every line of code is available on GitHub under the MIT license. The cryptographic implementation can be audited by security researchers. We believe trust must be verifiable, and closed-source security is an oxymoron. You can review the source, run your own instance, or contribute improvements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
