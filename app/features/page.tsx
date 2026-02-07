import Link from 'next/link';
import styles from './page.module.css';

export default function FeaturesPage() {
  return (
    <main className={styles.main}>
      {/* Ambient gradient blobs */}
      <div className={styles.ambient}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>FEATURES</div>
        <h1 className={styles.heroTitle}>Everything you need, nothing you don't.</h1>
        <p className={styles.heroSubtitle}>
          Simple, secure, built for people who care about their files.
        </p>
      </section>

      {/* Feature 01 - Direct P2P Transfer (text left, visual right) */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <div className={styles.featureNumber}>01</div>
          <h2 className={styles.featureTitle}>Direct P2P Transfer</h2>
          <p className={styles.featureDescription}>
            Files travel directly between devices. No cloud relay, no middleman, no temporary storage. Your data never touches our servers.
          </p>
          <Link href="/docs" className={styles.featureLink}>
            Learn more →
          </Link>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.glassCard}>
            <div className={styles.connectionDiagram}>
              <div className={styles.device}>
                <div className={styles.deviceIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
              </div>
              <div className={styles.connectionLine}>
                <svg width="100%" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
                  <line x1="0" y1="1" x2="100" y2="1" stroke="var(--accent-2)" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
                <div className={styles.arrowRight}>→</div>
              </div>
              <div className={styles.device}>
                <div className={styles.deviceIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={styles.cardLabel}>Direct Connection</div>
          </div>
        </div>
      </section>

      {/* Feature 02 - Post-Quantum Encryption (visual left, text right) */}
      <section className={`${styles.featureBlock} ${styles.featureBlockReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.glassCard}>
            <h3 className={styles.cardTitle}>Encryption Stack</h3>
            <div className={styles.encryptionList}>
              <div className={styles.encryptionItem}>
                <span className={styles.tag}>ML-KEM-768</span>
              </div>
              <div className={styles.encryptionItem}>
                <span className={styles.tag}>AES-256-GCM</span>
              </div>
              <div className={styles.encryptionItem}>
                <span className={styles.tag}>Forward Secrecy</span>
              </div>
              <div className={styles.encryptionItem}>
                <span className={styles.tag}>Zero-Knowledge</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.featureText}>
          <div className={styles.featureNumber}>02</div>
          <h2 className={styles.featureTitle}>Post-Quantum Encryption</h2>
          <p className={styles.featureDescription}>
            ML-KEM-768 key exchange with AES-256-GCM symmetric encryption. Resistant to both classical and quantum computing attacks.
          </p>
          <Link href="/security" className={styles.featureLink}>
            Learn more →
          </Link>
        </div>
      </section>

      {/* Feature 03 - Cross-Platform (text left, visual right) */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <div className={styles.featureNumber}>03</div>
          <h2 className={styles.featureTitle}>Cross-Platform</h2>
          <p className={styles.featureDescription}>
            Works on any device with a modern browser. No downloads, no installs, no app store. Just open and transfer.
          </p>
          <Link href="/docs" className={styles.featureLink}>
            Learn more →
          </Link>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.glassCard}>
            <div className={styles.deviceGrid}>
              <div className={styles.deviceItem}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className={styles.deviceItem}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div className={styles.deviceItem}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
            </div>
            <div className={styles.cardLabel}>Browser-Based</div>
          </div>
        </div>
      </section>

      {/* Feature 04 - Zero Knowledge (visual left, text right) */}
      <section className={`${styles.featureBlock} ${styles.featureBlockReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.glassCard}>
            <h3 className={styles.cardTitle}>Zero Knowledge Architecture</h3>
            <div className={styles.checkList}>
              <div className={styles.checkItem}>
                <span className={styles.checkmark}>✓</span>
                <span>No File Access</span>
              </div>
              <div className={styles.checkItem}>
                <span className={styles.checkmark}>✓</span>
                <span>No Metadata Logs</span>
              </div>
              <div className={styles.checkItem}>
                <span className={styles.checkmark}>✓</span>
                <span>No User Tracking</span>
              </div>
              <div className={styles.checkItem}>
                <span className={styles.checkmark}>✓</span>
                <span>No Analytics</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.featureText}>
          <div className={styles.featureNumber}>04</div>
          <h2 className={styles.featureTitle}>Zero Knowledge</h2>
          <p className={styles.featureDescription}>
            We can't see your files. We can't see your metadata. We don't log transfers. We don't track users. Privacy by architecture.
          </p>
          <Link href="/privacy" className={styles.featureLink}>
            Learn more →
          </Link>
        </div>
      </section>

      {/* Feature 05 - No Limits (text left, visual right) */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <div className={styles.featureNumber}>05</div>
          <h2 className={styles.featureTitle}>No Limits</h2>
          <p className={styles.featureDescription}>
            Any file type, any file size. No artificial restrictions, no premium tiers, no upgrade nags. Transfer freely.
          </p>
          <Link href="/pricing" className={styles.featureLink}>
            Learn more →
          </Link>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.glassCard}>
            <div className={styles.fileTypes}>
              <div className={styles.fileType}>.pdf</div>
              <div className={styles.fileType}>.zip</div>
              <div className={styles.fileType}>.mov</div>
              <div className={styles.fileType}>.psd</div>
            </div>
            <div className={styles.infinitySymbol}>∞</div>
          </div>
        </div>
      </section>

      {/* Feature 06 - Open Source (visual left, text right) */}
      <section className={`${styles.featureBlock} ${styles.featureBlockReverse}`}>
        <div className={styles.featureVisual}>
          <div className={styles.glassCard}>
            <div className={styles.codeSnippet}>
              <div className={styles.codeLine}>
                <span className={styles.codeKeyword}>const</span> <span className={styles.codeVariable}>transfer</span> = <span className={styles.codeBracket}>{'{'}</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.codeProperty}>  encrypted:</span> <span className={styles.codeBoolean}>true</span>,
              </div>
              <div className={styles.codeLine}>
                <span className={styles.codeProperty}>  p2p:</span> <span className={styles.codeBoolean}>true</span>,
              </div>
              <div className={styles.codeLine}>
                <span className={styles.codeProperty}>  quantum:</span> <span className={styles.codeString}>'safe'</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.codeBracket}>{'}'}</span>
              </div>
            </div>
            <div className={styles.licenseBadge}>MIT License</div>
          </div>
        </div>
        <div className={styles.featureText}>
          <div className={styles.featureNumber}>06</div>
          <h2 className={styles.featureTitle}>Open Source</h2>
          <p className={styles.featureDescription}>
            Every line of code is public and auditable. Trust through transparency, not promises.
          </p>
          <a
            href="https://github.com/yourusername/tallow"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.featureLink}
          >
            Learn more →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to transfer?</h2>
        <p className={styles.ctaSubtitle}>No signup. No download. Just open and send.</p>
        <Link href="/transfer" className={styles.ctaButton}>
          Open Tallow →
        </Link>
      </section>
    </main>
  );
}
