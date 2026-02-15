import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything you need for secure, private, peer-to-peer file transfer. No limits, no compromises.',
  alternates: {
    canonical: 'https://tallow.app/features',
  },
  openGraph: {
    title: 'Features | Tallow',
    description: 'Everything you need for secure, private, peer-to-peer file transfer. No limits, no compromises.',
    url: '/features',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features | Tallow',
    description: 'Everything you need for secure, private, peer-to-peer file transfer. No limits, no compromises.',
  },
};

export default function FeaturesPage() {
  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.label}>FEATURES</span>
        <h1 className={styles.title}>Everything you need. Nothing you don&apos;t.</h1>
        <p className={styles.subtitle}>
          File transfer reimagined for privacy, security, and freedom.
        </p>
      </header>

      {/* Feature 01 - P2P Transfer */}
      <section className={styles.feature}>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>01 — TRANSFER</div>
          <h2 className={styles.featureTitle}>Lightning-fast peer-to-peer</h2>
          <p className={styles.featureDescription}>
            Direct device-to-device transfer at full network speed. No cloud intermediaries, no throttling, no waiting.
            Your files travel the shortest path possible.
          </p>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.statsCard}>
            <div className={styles.stat}>
              <div className={styles.statValue}>12.4 MB/s</div>
              <div className={styles.statLabel}>Transfer Speed</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>0ms</div>
              <div className={styles.statLabel}>Server Latency</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>Peer-to-Peer</div>
              <div className={styles.statLabel}>Connection Type</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 02 - PQC Encryption */}
      <section className={`${styles.feature} ${styles.featureReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.cryptoCard}>
            <div className={styles.cryptoSpec}>
              <span className={styles.cryptoLabel}>Key Exchange</span>
              <span className={styles.cryptoValue}>ML-KEM-768</span>
            </div>
            <div className={styles.cryptoSpec}>
              <span className={styles.cryptoLabel}>Encryption</span>
              <span className={styles.cryptoValue}>AES-256-GCM</span>
            </div>
            <div className={styles.cryptoSpec}>
              <span className={styles.cryptoLabel}>ECDH Fallback</span>
              <span className={styles.cryptoValue}>X25519</span>
            </div>
            <div className={styles.cryptoBadge}>Quantum-Safe</div>
          </div>
        </div>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>02 — SECURITY</div>
          <h2 className={styles.featureTitle}>Post-quantum cryptographic security</h2>
          <p className={styles.featureDescription}>
            Protected against both classical and quantum computer attacks. ML-KEM (Kyber) key exchange with AES-256-GCM encryption.
            Future-proof security, today.
          </p>
        </div>
      </section>

      {/* Feature 03 - Cross-Platform */}
      <section className={styles.feature}>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>03 — PLATFORM</div>
          <h2 className={styles.featureTitle}>Works everywhere</h2>
          <p className={styles.featureDescription}>
            Native desktop apps for macOS, Windows, and Linux. Progressive web app for iOS, Android, and browsers.
            One protocol, every platform.
          </p>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.platformGrid}>
            <div className={styles.platformItem}>macOS</div>
            <div className={styles.platformItem}>Windows</div>
            <div className={styles.platformItem}>Linux</div>
            <div className={styles.platformItem}>iOS</div>
            <div className={styles.platformItem}>Android</div>
            <div className={styles.platformItem}>Web</div>
          </div>
        </div>
      </section>

      {/* Feature 04 - Zero Knowledge */}
      <section className={`${styles.feature} ${styles.featureReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.privacyCard}>
            <div className={styles.privacyStats}>
              <span className={styles.privacyStat}>0</span>
              <span className={styles.privacyLabel}>servers</span>
            </div>
            <div className={styles.privacyDivider}>•</div>
            <div className={styles.privacyStats}>
              <span className={styles.privacyStat}>0</span>
              <span className={styles.privacyLabel}>logs</span>
            </div>
            <div className={styles.privacyDivider}>•</div>
            <div className={styles.privacyStats}>
              <span className={styles.privacyStat}>0</span>
              <span className={styles.privacyLabel}>metadata</span>
            </div>
          </div>
        </div>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>04 — PRIVACY</div>
          <h2 className={styles.featureTitle}>We know nothing about your files</h2>
          <p className={styles.featureDescription}>
            True peer-to-peer architecture means your files never touch our servers. We can&apos;t see what you send,
            to whom, or when. Privacy by design, not by promise.
          </p>
        </div>
      </section>

      {/* Feature 05 - No File Limits */}
      <section className={styles.feature}>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>05 — FREEDOM</div>
          <h2 className={styles.featureTitle}>Send anything, any size</h2>
          <p className={styles.featureDescription}>
            No file size restrictions. No file type restrictions. No bandwidth throttling.
            Transfer a 1KB text file or a 100GB video project at the same priority.
          </p>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.infinityCard}>
            <div className={styles.infinitySymbol}>∞</div>
            <div className={styles.infinityLabel}>file size</div>
          </div>
        </div>
      </section>

      <section className={styles.comparisonSection}>
        <div className={styles.comparisonHeader}>
          <span className={styles.comparisonLabel}>COMPARISON</span>
          <h2 className={styles.comparisonTitle}>How Tallow Compares</h2>
          <p className={styles.comparisonSubtitle}>
            Privacy-first transfer compared with typical cloud sharing and email attachments.
          </p>
        </div>
        <div className={styles.comparisonTableWrap}>
          <table className={styles.comparisonTable}>
            <caption className={styles.comparisonCaption}>
              Feature comparison between Tallow, cloud services, and email attachments
            </caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Tallow</th>
                <th scope="col">Cloud Services</th>
                <th scope="col">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Post-Quantum Security</th>
                <td>Yes</td>
                <td>No</td>
                <td>No</td>
              </tr>
              <tr>
                <th scope="row">Direct Peer-to-Peer Path</th>
                <td>Yes</td>
                <td>No</td>
                <td>No</td>
              </tr>
              <tr>
                <th scope="row">Default File Size Limits</th>
                <td>No hard limit</td>
                <td>Plan-dependent</td>
                <td>Low</td>
              </tr>
              <tr>
                <th scope="row">Provider Access to File Contents</th>
                <td>No</td>
                <td>Usually possible</td>
                <td>Usually possible</td>
              </tr>
              <tr>
                <th scope="row">Cryptographic Verification (SAS)</th>
                <td>Built in</td>
                <td>Rare</td>
                <td>No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.educationSection} aria-labelledby="education-journey-title">
        <div className={styles.educationHeader}>
          <span className={styles.educationLabel}>GUIDED JOURNEY</span>
          <h2 id="education-journey-title" className={styles.educationTitle}>Your secure transfer journey</h2>
          <p className={styles.educationSubtitle}>
            Start simple, then dive deeper into architecture and security details when you are ready.
          </p>
        </div>
        <ol className={styles.educationSteps}>
          <li className={styles.educationStep}>
            <span className={styles.educationStepNumber}>01</span>
            <div className={styles.educationStepContent}>
              <h3>Explore Features</h3>
              <p>See what Tallow can do across transfer speed, privacy, and platform coverage.</p>
              <Link href="/features" className={styles.educationLink}>Open Features</Link>
            </div>
          </li>
          <li className={styles.educationStep}>
            <span className={styles.educationStepNumber}>02</span>
            <div className={styles.educationStepContent}>
              <h3>Understand the Flow</h3>
              <p>Learn the transfer lifecycle from discovery and trust checks to delivery.</p>
              <Link href="/how-it-works" className={styles.educationLink}>Read How It Works</Link>
            </div>
          </li>
          <li className={styles.educationStep}>
            <span className={styles.educationStepNumber}>03</span>
            <div className={styles.educationStepContent}>
              <h3>Inspect Security Details</h3>
              <p>Review post-quantum encryption, threat model assumptions, and FAQ answers.</p>
              <Link href="/security#faq" className={styles.educationLink}>Open Security FAQ</Link>
            </div>
          </li>
          <li className={styles.educationStep}>
            <span className={styles.educationStepNumber}>04</span>
            <div className={styles.educationStepContent}>
              <h3>Keep Docs Handy</h3>
              <p>Use docs as your reference for setup, API details, and troubleshooting.</p>
              <Link href="/docs" className={styles.educationLink}>Go to Documentation</Link>
            </div>
          </li>
        </ol>
      </section>

      {/* Feature 06 - Anonymous Discovery */}
      <section className={`${styles.feature} ${styles.featureReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.deviceCard}>
            <div className={styles.deviceName}>Silent Falcon</div>
            <div className={styles.deviceName}>Crystal Echo</div>
            <div className={styles.deviceName}>Amber Wolf</div>
            <div className={styles.deviceName}>Midnight Raven</div>
            <div className={styles.deviceSubtext}>Device names rotate automatically</div>
          </div>
        </div>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>06 — DISCOVERY</div>
          <h2 className={styles.featureTitle}>Two-word device names that rotate</h2>
          <p className={styles.featureDescription}>
            No device names, no usernames, no identifying information broadcast on the network.
            Randomly generated two-word names that change automatically. Privacy by design.
          </p>
        </div>
      </section>

      {/* Feature 07 - Internet P2P */}
      <section className={styles.feature}>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>07 — CONNECTIVITY</div>
          <h2 className={styles.featureTitle}>Send to anyone, anywhere</h2>
          <p className={styles.featureDescription}>
            Room codes, QR codes, shareable links, and email invites. Transfer files across the globe
            with peer-to-peer connections. No same-network requirement.
          </p>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.connectCard}>
            <div className={styles.roomCode}>847-293</div>
            <div className={styles.qrPlaceholder}>
              <div className={styles.qrBox} />
            </div>
            <div className={styles.shareLink}>tallow.app/r/847293</div>
          </div>
        </div>
      </section>

      {/* Feature 08 - Friends System */}
      <section className={`${styles.feature} ${styles.featureReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.friendsCard}>
            <div className={styles.friendItem}>
              <div className={styles.friendStatus} data-status="online" />
              <div className={styles.friendId}>tallow#a8f3</div>
            </div>
            <div className={styles.friendItem}>
              <div className={styles.friendStatus} data-status="online" />
              <div className={styles.friendId}>tallow#7k2m</div>
            </div>
            <div className={styles.friendItem}>
              <div className={styles.friendStatus} data-status="offline" />
              <div className={styles.friendId}>tallow#p4n9</div>
            </div>
            <div className={styles.friendItem}>
              <div className={styles.friendStatus} data-status="online" />
              <div className={styles.friendId}>tallow#x1v8</div>
            </div>
          </div>
        </div>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>08 — COMMUNITY</div>
          <h2 className={styles.featureTitle}>Saved contacts, instant send</h2>
          <p className={styles.featureDescription}>
            Add friends with Tallow IDs or QR codes. See when they&apos;re online.
            Send files with one tap—no codes, no setup, no friction.
          </p>
        </div>
      </section>

      {/* Feature 09 - Open Source */}
      <section className={styles.feature}>
        <div className={styles.featureContent}>
          <div className={styles.featureLabel}>09 — TRANSPARENCY</div>
          <h2 className={styles.featureTitle}>Every line of code is auditable</h2>
          <p className={styles.featureDescription}>
            MIT licensed and completely open source. Review the cryptography, verify the security claims,
            contribute improvements. No black boxes, no proprietary protocols.
          </p>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.ossCard}>
            <div className={styles.ossLabel}>License</div>
            <div className={styles.ossValue}>MIT</div>
            <div className={styles.ossStats}>
              <div className={styles.ossStat}>
                <span className={styles.ossStatValue}>50+</span>
                <span className={styles.ossStatLabel}>Contributors</span>
              </div>
              <div className={styles.ossStat}>
                <span className={styles.ossStatValue}>2.5k</span>
                <span className={styles.ossStatLabel}>Stars</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to transfer?</h2>
        <Link href="/transfer" className={styles.ctaButton}>
          Open Tallow
        </Link>
      </section>
    </main>
  );
}
