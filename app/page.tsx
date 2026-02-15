import Link from 'next/link';
import styles from './page.module.css';

/* ============================================
   Tallow — #16 Magazine Landing Page
   Powered by Operation TALLOW 100-Agent Hierarchy
   ============================================ */

export default function LandingPage() {
  return (
    <div className={styles.main}>
      {/* Ambient Background */}
      <div className={styles.ambientBlob1} aria-hidden="true" />
      <div className={styles.ambientBlob2} aria-hidden="true" />

      {/* ═══════════════════════════════════════
          SECTION 1: HERO — 100vh, 55/45 Grid
          ═══════════════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          {/* Left Side — 55% */}
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              QUANTUM-SAFE FILE TRANSFER
            </div>

            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingPrimary}>Your files.</span>
              <span className={styles.heroHeadingSecondary}>Your rules.</span>
            </h1>

            <p className={styles.heroParagraph}>
              Transfer files directly between devices with military-grade
              encryption. No servers, no compromises, no limits. Just secure,
              peer-to-peer file sharing built for the quantum era.
            </p>

            <div className={styles.heroButtons}>
              <Link href="/transfer" className={styles.btnPrimary}>
                Start Transferring
              </Link>
              <Link href="/security" className={styles.btnSecondary}>
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Side — 45% Glass App Window */}
          <div className={styles.heroRight}>
            <div className={styles.appWindow}>
              {/* macOS Window Chrome */}
              <div className={styles.windowChrome}>
                <div className={styles.trafficLights} aria-hidden="true">
                  <span className={styles.trafficRed} />
                  <span className={styles.trafficYellow} />
                  <span className={styles.trafficGreen} />
                </div>
                <div className={styles.urlBar}>tallow.app</div>
              </div>

              {/* Window Body */}
              <div className={styles.windowBody}>
                {/* Drop Zone */}
                <div className={styles.dropZone}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Drop files here to transfer
                </div>

                {/* Device List — ONLINE DEVICES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Device 1 */}
                  <div className={styles.deviceCard}>
                    <span className={styles.deviceDot} style={{ background: '#22c55e' }} />
                    <div className={styles.deviceInfo}>
                      <div className={styles.deviceName}>MacBook Pro</div>
                      <div className={styles.deviceStatus}>Ready</div>
                    </div>
                  </div>
                  {/* Device 2 */}
                  <div className={styles.deviceCard}>
                    <span className={styles.deviceDot} style={{ background: '#3b82f6' }} />
                    <div className={styles.deviceInfo}>
                      <div className={styles.deviceName}>iPhone 15</div>
                      <div className={styles.deviceStatus}>Nearby</div>
                    </div>
                  </div>
                  {/* Device 3 */}
                  <div className={styles.deviceCard}>
                    <span className={styles.deviceDot} style={{ background: '#a855f7' }} />
                    <div className={styles.deviceInfo}>
                      <div className={styles.deviceName}>iPad Air</div>
                      <div className={styles.deviceStatus}>Available</div>
                    </div>
                  </div>
                </div>

                {/* Transfer Progress */}
                <div className={styles.transferProgress}>
                  <div className={styles.transferHeader}>
                    <span className={styles.transferFile}>photos-album.zip</span>
                    <span className={styles.transferSize}>14.2 MB</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '67%' }} />
                  </div>
                  <div className={styles.transferFooter}>
                    <span className={styles.transferSpeed}>12.4 MB/s</span>
                    <span className={styles.encryptionBadge}>Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2: MARQUEE TRUST STRIP
          ═══════════════════════════════════════ */}
      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={styles.marqueeContent}>
              &nbsp;&nbsp;ENCRYPTED&nbsp;&nbsp;·&nbsp;&nbsp;ZERO KNOWLEDGE&nbsp;&nbsp;·&nbsp;&nbsp;OPEN SOURCE&nbsp;&nbsp;·&nbsp;&nbsp;QUANTUM-SAFE&nbsp;&nbsp;·&nbsp;&nbsp;NO FILE LIMITS&nbsp;&nbsp;·&nbsp;&nbsp;DIRECT P2P&nbsp;&nbsp;·&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 3: FEATURE 01 — TRANSFER
          ═══════════════════════════════════════ */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <span className={styles.featureLabel}>01 — TRANSFER</span>
          <h2 className={styles.featureHeading}>Lightning-fast peer-to-peer.</h2>
          <p className={styles.featureParagraph}>
            Send files directly between devices at full local network speed.
            No upload limits, no cloud storage bottlenecks, no waiting. Your data travels the
            shortest path possible, encrypted every step of the way.
          </p>
          <Link href="/features" className={styles.featureLink}>
            See how it works →
          </Link>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.featureCard}>
            <div className={styles.statsPanel}>
              <div className={styles.statsPanelHeader}>
                <span className={styles.statsPanelTitle}>PEER-TO-PEER</span>
                <span className={styles.statsPanelBadge}>ACTIVE</span>
              </div>
              <div className={styles.statsPanelRow}>
                <span className={styles.statsPanelLabel}>Transfer Speed</span>
                <span className={`${styles.statsPanelValue} ${styles.valueGreen}`}>4.2 MB/s</span>
              </div>
              <div className={styles.statsPanelRow}>
                <span className={styles.statsPanelLabel}>Latency</span>
                <span className={`${styles.statsPanelValue} ${styles.valueAccent}`}>&lt;1ms</span>
              </div>
              <div className={styles.statsPanelRow}>
                <span className={styles.statsPanelLabel}>Privacy</span>
                <span className={`${styles.statsPanelValue} ${styles.valueAccent}`}>End-to-End</span>
              </div>
              <div className={styles.statsPanelRow}>
                <span className={styles.statsPanelLabel}>Integrity</span>
                <span className={`${styles.statsPanelValue} ${styles.valueGreen}`}>Verified</span>
              </div>
              <div className={styles.statsPanelRow}>
                <span className={styles.statsPanelLabel}>Encryption</span>
                <span className={`${styles.statsPanelValue} ${styles.valueAccent}`}>Quantum-Safe</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 4: FEATURE 02 — SECURITY (reversed)
          ═══════════════════════════════════════ */}
      <section className={`${styles.featureBlock} ${styles.featureBlockReverse}`}>
        <div className={styles.featureText}>
          <span className={styles.featureLabel}>02 — SECURITY</span>
          <h2 className={styles.featureHeading}>Future-proof encryption.</h2>
          <p className={styles.featureParagraph}>
            Built on NIST-standardized post-quantum cryptography. Your files
            are protected against both current and future threats, including
            quantum computers. Military-grade security that doesn&rsquo;t
            compromise speed.
          </p>
          <Link href="/security" className={styles.featureLink}>
            Read the whitepaper →
          </Link>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.featureCard}>
            <div className={styles.comparisonTable} role="table" aria-label="Tallow vs competitors comparison">
              <div className={styles.comparisonHeader} role="row">
                <span role="columnheader">Feature</span>
                <span role="columnheader">Tallow</span>
                <span role="columnheader">Others</span>
              </div>
              <div className={styles.comparisonRow} role="row">
                <span className={styles.comparisonFeature} role="rowheader">Encryption Standard</span>
                <span className={styles.comparisonTallow} role="cell">ML-KEM-768</span>
                <span className={styles.comparisonOthers} role="cell">AES-128</span>
              </div>
              <div className={styles.comparisonRow} role="row">
                <span className={styles.comparisonFeature} role="rowheader">Quantum Safe</span>
                <span className={styles.comparisonTallow} role="cell" style={{ color: '#22c55e' }}>Yes</span>
                <span className={styles.comparisonOthers} role="cell">No</span>
              </div>
              <div className={styles.comparisonRow} role="row">
                <span className={styles.comparisonFeature} role="rowheader">Key Exchange</span>
                <span className={styles.comparisonTallow} role="cell">ML-KEM-768</span>
                <span className={styles.comparisonOthers} role="cell">RSA-2048</span>
              </div>
              <div className={styles.comparisonRow} role="row">
                <span className={styles.comparisonFeature} role="rowheader">Max File Size</span>
                <span className={styles.comparisonTallow} role="cell" style={{ color: '#22c55e' }}>None</span>
                <span className={styles.comparisonOthers} role="cell">2 GB</span>
              </div>
              <div className={styles.comparisonRow} role="row">
                <span className={styles.comparisonFeature} role="rowheader">Open Source</span>
                <span className={styles.comparisonTallow} role="cell" style={{ color: '#22c55e' }}>✓</span>
                <span className={styles.comparisonOthers} role="cell">—</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 5: FEATURE 03 — PLATFORM
          ═══════════════════════════════════════ */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <span className={styles.featureLabel}>03 — PLATFORM</span>
          <h2 className={styles.featureHeading}>Works everywhere.</h2>
          <p className={styles.featureParagraph}>
            Native experience across all your devices. Transfer seamlessly
            between desktop, mobile, and web — with the same security and
            performance guarantees everywhere.
          </p>
          <Link href="/features" className={styles.featureLink}>
            View all platforms →
          </Link>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.featureCard}>
            <div className={styles.platformVisual}>
              {/* Top Row: Desktop */}
              <div className={styles.platformRow}>
                <div className={styles.platformItem}>
                  <div className={styles.platformIconBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" />
                      <path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
                    </svg>
                  </div>
                  <span className={styles.platformItemLabel}>macOS</span>
                </div>
                <div className={styles.platformItem}>
                  <div className={styles.platformIconBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="8" height="8" rx="1" />
                      <rect x="13" y="3" width="8" height="8" rx="1" />
                      <rect x="3" y="13" width="8" height="8" rx="1" />
                      <rect x="13" y="13" width="8" height="8" rx="1" />
                    </svg>
                  </div>
                  <span className={styles.platformItemLabel}>Windows</span>
                </div>
                <div className={styles.platformItem}>
                  <div className={styles.platformIconBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="5" />
                      <path d="M12 13v8M8 21h8M9 18l-3 3M15 18l3 3" />
                    </svg>
                  </div>
                  <span className={styles.platformItemLabel}>Linux</span>
                </div>
              </div>
              {/* Bottom Row: Mobile */}
              <div className={styles.platformRow}>
                <div className={styles.platformItem}>
                  <div className={styles.platformIconBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="7" y="2" width="10" height="20" rx="3" />
                      <line x1="12" y1="18" x2="12" y2="18.01" />
                    </svg>
                  </div>
                  <span className={styles.platformItemLabel}>iOS</span>
                </div>
                <div className={styles.platformItem}>
                  <div className={styles.platformIconBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 6l-1-3M16 6l1-3M5 10a7 7 0 0 1 14 0" />
                    </svg>
                  </div>
                  <span className={styles.platformItemLabel}>Android</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 6: PULL QUOTE
          ═══════════════════════════════════════ */}
      <section className={styles.pullQuote}>
        <div className={styles.quoteAccent} aria-hidden="true" />
        <blockquote className={styles.quote}>
          &ldquo;Privacy isn&rsquo;t a feature. It&rsquo;s a fundamental right.&rdquo;
        </blockquote>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 7: STATS — 4 Columns
          ═══════════════════════════════════════ */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>256</div>
            <div className={styles.statLabel}>BIT ENCRYPTION</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>SERVERS TOUCHED</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>P2P</div>
            <div className={styles.statLabel}>DIRECT CONNECTION</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>∞</div>
            <div className={styles.statLabel}>FILE SIZE LIMIT</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 8: CTA — Two Column
          ═══════════════════════════════════════ */}
      <section className={styles.cta}>
        <div className={styles.ctaGrid}>
          <div className={styles.ctaLeft}>
            <h2 className={styles.ctaHeading}>
              Ready to send without compromise?
            </h2>
          </div>
          <div className={styles.ctaRight}>
            <p className={styles.ctaParagraph}>
              Join thousands of users who trust Tallow for secure, private file
              transfers. No signup required, no credit card needed. Start
              transferring files in seconds.
            </p>
            <Link href="/transfer" className={styles.ctaButton}>
              Get Started — It&rsquo;s Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
