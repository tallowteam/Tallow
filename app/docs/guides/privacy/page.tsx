import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Globe,
} from '@/components/icons';
import styles from './page.module.css';

export default function PrivacyFeaturesGuide() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol className={styles.breadcrumbList}>
            <li>
              <Link href="/docs">Docs</Link>
            </li>
            <li>
              <Link href="/docs/guides">Guides</Link>
            </li>
            <li>
              <span>Privacy Features</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Privacy Features</h1>
            <p className={styles.heroDescription}>
              Tallow protects more than just your files — it protects your identity,
              metadata, and behavior.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>10 min read</span>
              <span className={styles.badge}>Intermediate</span>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className={styles.article}>
          <div className={styles.contentContainer}>
            {/* Table of Contents */}
            <nav className={styles.toc}>
              <h2 className={styles.tocTitle}>On this page</h2>
              <ul className={styles.tocList}>
                <li><a className={styles.tocLink} href="#privacy-philosophy">Privacy Philosophy</a></li>
                <li><a className={styles.tocLink} href="#metadata-stripping">Metadata Stripping</a></li>
                <li><a className={styles.tocLink} href="#zero-tracking">Zero Tracking</a></li>
                <li><a className={styles.tocLink} href="#filename-encryption">Filename Encryption</a></li>
                <li><a className={styles.tocLink} href="#traffic-analysis-resistance">Traffic Analysis Resistance</a></li>
                <li><a className={styles.tocLink} href="#onion-routing">Onion Routing</a></li>
                <li><a className={styles.tocLink} href="#no-accounts-required">No Accounts Required</a></li>
                <li><a className={styles.tocLink} href="#data-retention">Data Retention</a></li>
                <li><a className={styles.tocLink} href="#privacy-vs-competitors">Privacy vs Competitors</a></li>
              </ul>
            </nav>

            {/* ========================================
                Section 1: Privacy Philosophy
                ======================================== */}
            <section id="privacy-philosophy" className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy Philosophy</h2>
              <p className={styles.sectionDescription}>
                Tallow is built on a privacy-by-design philosophy. Rather than bolting on
                privacy controls after the fact, every architectural decision starts with the
                question: how do we minimize the data we touch?
              </p>

              <div className={styles.privacyGrid}>
                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Shield /></div>
                  <h3 className={styles.privacyTitle}>Zero-Knowledge Architecture</h3>
                  <p className={styles.privacyText}>
                    Tallow servers never see your files, filenames, or metadata. All
                    encryption happens on-device before any data leaves your machine.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><EyeOff /></div>
                  <h3 className={styles.privacyTitle}>No Analytics by Default</h3>
                  <p className={styles.privacyText}>
                    There is no analytics code running unless you explicitly opt in to
                    privacy-respecting Plausible analytics. No Google Analytics, ever.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Lock /></div>
                  <h3 className={styles.privacyTitle}>No Accounts Needed</h3>
                  <p className={styles.privacyText}>
                    You can use every core feature without creating an account, providing an
                    email, or verifying a phone number. Your identity is yours.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Globe /></div>
                  <h3 className={styles.privacyTitle}>Open Source</h3>
                  <p className={styles.privacyText}>
                    Every privacy claim is verifiable. The full source code is available for
                    independent audit by researchers and security professionals.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Privacy First, Always</p>
                  <p className={styles.calloutText}>
                    Every feature in Tallow goes through a privacy review before release. If a
                    feature cannot be built without compromising user privacy, it does not ship.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 2: Metadata Stripping
                ======================================== */}
            <section id="metadata-stripping" className={styles.section}>
              <h2 className={styles.sectionTitle}>Metadata Stripping</h2>
              <p className={styles.sectionDescription}>
                Files carry hidden data that can reveal your identity, location, and device
                information. Tallow strips this metadata before transfer so your files
                arrive clean.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>EXIF Data from Images</h3>
                    <p className={styles.stepText}>
                      Photos contain EXIF data including GPS coordinates, camera model and
                      serial number, lens information, date and time of capture, and
                      thumbnail previews. Tallow removes all of it.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Document Metadata</h3>
                    <p className={styles.stepText}>
                      Office documents, PDFs, and other files embed author names, organization
                      info, revision history, comments, and creation timestamps. All stripped
                      before transfer.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>What Gets Removed</h3>
                    <p className={styles.stepText}>
                      GPS coordinates, camera model and serial number, author and organization,
                      editing software details, creation and modification timestamps,
                      thumbnail previews, and comment history.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Enable Metadata Stripping</p>
                  <p className={styles.calloutText}>
                    Metadata stripping is opt-in to preserve file integrity for professional
                    workflows. Enable it in Settings before transferring sensitive files.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 3: Zero Tracking
                ======================================== */}
            <section id="zero-tracking" className={styles.section}>
              <h2 className={styles.sectionTitle}>Zero Tracking</h2>
              <p className={styles.sectionDescription}>
                Tallow does not track you. Period. There are no cookies, no tracking pixels,
                no server-side analytics on your transfers.
              </p>

              <div className={styles.privacyGrid}>
                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><EyeOff /></div>
                  <h3 className={styles.privacyTitle}>No Cookies</h3>
                  <p className={styles.privacyText}>
                    Tallow does not set tracking cookies. The only local storage used is for
                    your device settings and trust preferences, which never leave your machine.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Shield /></div>
                  <h3 className={styles.privacyTitle}>Opt-In Analytics Only</h3>
                  <p className={styles.privacyText}>
                    If you choose to help improve Tallow, privacy-respecting Plausible
                    analytics collects aggregate, anonymized page views. No personal data,
                    no cross-site tracking.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Lock /></div>
                  <h3 className={styles.privacyTitle}>No Server Logs of Transfers</h3>
                  <p className={styles.privacyText}>
                    Transfer metadata such as file names, sizes, sender identity, and receiver
                    identity is never logged on Tallow servers. Relay servers see only encrypted
                    blobs.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Globe /></div>
                  <h3 className={styles.privacyTitle}>No IP Logging</h3>
                  <p className={styles.privacyText}>
                    Your IP address is not recorded or stored by Tallow. Signaling servers
                    process connections in memory only, with no persistent logging of client
                    addresses.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 4: Filename Encryption
                ======================================== */}
            <section id="filename-encryption" className={styles.section}>
              <h2 className={styles.sectionTitle}>Filename Encryption</h2>
              <p className={styles.sectionDescription}>
                Even file names can reveal sensitive information. Tallow encrypts original
                filenames so they are only visible to the sender and receiver.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Encrypted in Transit</h3>
                    <p className={styles.stepText}>
                      File names are encrypted alongside file contents using the same
                      end-to-end encryption keys. Network observers, ISPs, and relay servers
                      see only opaque identifiers.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Prevents Network Sniffing</h3>
                    <p className={styles.stepText}>
                      ISPs, corporate network administrators, and other network observers
                      cannot determine what types of files you are sending based on file names
                      or extensions.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Restored on Arrival</h3>
                    <p className={styles.stepText}>
                      The receiver's device decrypts the original filename automatically. Files
                      arrive with their correct names and extensions, exactly as the sender
                      intended.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Always On</p>
                  <p className={styles.calloutText}>
                    Filename encryption is enabled by default for all transfers. You do not
                    need to configure anything — filenames are always protected.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 5: Traffic Analysis Resistance
                ======================================== */}
            <section id="traffic-analysis-resistance" className={styles.section}>
              <h2 className={styles.sectionTitle}>Traffic Analysis Resistance</h2>
              <p className={styles.sectionDescription}>
                Even when data is encrypted, an observer can learn things from traffic
                patterns. Tallow actively resists traffic analysis with multiple techniques.
              </p>

              <div className={styles.privacyGrid}>
                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Shield /></div>
                  <h3 className={styles.privacyTitle}>Packet Padding</h3>
                  <p className={styles.privacyText}>
                    All packets are padded to uniform sizes, preventing observers from
                    inferring file types or content structure based on packet lengths.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Lock /></div>
                  <h3 className={styles.privacyTitle}>Timing Jitter</h3>
                  <p className={styles.privacyText}>
                    Random delays are introduced between packets to prevent timing-based
                    analysis that could reveal transfer patterns or file characteristics.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><EyeOff /></div>
                  <h3 className={styles.privacyTitle}>Dummy Traffic</h3>
                  <p className={styles.privacyText}>
                    In privacy mode, Tallow generates cover traffic that is
                    indistinguishable from real transfers. This prevents observers from
                    knowing when actual transfers occur.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Globe /></div>
                  <h3 className={styles.privacyTitle}>Traffic Morphing</h3>
                  <p className={styles.privacyText}>
                    Transfer traffic is shaped to resemble ordinary HTTPS browsing,
                    making it difficult to distinguish Tallow usage from regular web
                    activity.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Performance Trade-off</p>
                  <p className={styles.calloutText}>
                    Packet padding and timing jitter add a small overhead to transfers.
                    For maximum speed, these features can be disabled in Settings, though
                    we recommend keeping them on for sensitive transfers.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 6: Onion Routing
                ======================================== */}
            <section id="onion-routing" className={styles.section}>
              <h2 className={styles.sectionTitle}>Onion Routing</h2>
              <p className={styles.sectionDescription}>
                For maximum anonymity, Tallow supports optional onion routing that bounces
                your encrypted transfer through multiple relays, preventing any single
                node from knowing both sender and receiver.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>1 to 3 Hop Routing</h3>
                    <p className={styles.stepText}>
                      Choose the number of relay hops based on your threat model. One hop
                      hides your IP from the receiver, two hops add relay-level anonymity,
                      and three hops provide full onion routing protection.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Tor Integration</h3>
                    <p className={styles.stepText}>
                      Tallow can route traffic through the Tor network for established,
                      battle-tested anonymity infrastructure. Useful when transferring from
                      regions with internet censorship.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>I2P Support</h3>
                    <p className={styles.stepText}>
                      For users who prefer the I2P network, Tallow supports garlic routing
                      as an alternative to Tor. I2P is optimized for internal services and
                      peer-to-peer transfers.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>When to Use It</h3>
                    <p className={styles.stepText}>
                      Use onion routing when you need to hide the fact that a transfer is
                      happening at all, when operating in hostile network environments, or
                      when the receiver must not learn your IP address.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Speed Impact</p>
                  <p className={styles.calloutText}>
                    Onion routing significantly reduces transfer speed due to multi-hop
                    relay overhead. Use direct P2P for large files when anonymity is not
                    critical.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 7: No Accounts Required
                ======================================== */}
            <section id="no-accounts-required" className={styles.section}>
              <h2 className={styles.sectionTitle}>No Accounts Required</h2>
              <p className={styles.sectionDescription}>
                Tallow is designed to work without any account creation. No email, no phone
                number, no social login. You open the app and start transferring.
              </p>

              <div className={styles.privacyGrid}>
                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Eye /></div>
                  <h3 className={styles.privacyTitle}>Guest Mode</h3>
                  <p className={styles.privacyText}>
                    Every user starts as a guest. You get full access to local transfers,
                    internet transfers, and all privacy features without providing any
                    personal information.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Lock /></div>
                  <h3 className={styles.privacyTitle}>No Email Required</h3>
                  <p className={styles.privacyText}>
                    Unlike most services, Tallow never asks for an email address. Optional
                    accounts for premium features use privacy-preserving identifiers
                    instead.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Shield /></div>
                  <h3 className={styles.privacyTitle}>Device-Based Identity</h3>
                  <p className={styles.privacyText}>
                    Trust is established at the device level using cryptographic keys, not
                    through personal identity. Your devices know each other without a
                    central authority.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 8: Data Retention
                ======================================== */}
            <section id="data-retention" className={styles.section}>
              <h2 className={styles.sectionTitle}>Data Retention</h2>
              <p className={styles.sectionDescription}>
                Understanding what Tallow stores and what it does not is critical to
                trusting the platform.
              </p>

              <div className={styles.privacyGrid}>
                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Shield /></div>
                  <h3 className={styles.privacyTitle}>Stored Locally</h3>
                  <p className={styles.privacyText}>
                    Device trust keys, display settings, theme preferences, and trusted
                    device list. All stored on-device only and never sent to any server.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><EyeOff /></div>
                  <h3 className={styles.privacyTitle}>Never Stored on Server</h3>
                  <p className={styles.privacyText}>
                    Transferred files, file names, transfer history, IP addresses, user
                    behavior, and analytics data. The server processes connections but
                    retains nothing.
                  </p>
                </div>

                <div className={styles.privacyFeature}>
                  <div className={styles.privacyIcon}><Lock /></div>
                  <h3 className={styles.privacyTitle}>Auto-Clear Options</h3>
                  <p className={styles.privacyText}>
                    Configure automatic clearing of local transfer history, cached
                    thumbnails, and device trust after a set period. Available in Settings
                    under Privacy.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Full Control</p>
                  <p className={styles.calloutText}>
                    You can clear all locally stored data at any time from Settings. This
                    removes device trust, preferences, and any local history. It is
                    equivalent to a fresh install.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                Section 9: Privacy vs Competitors
                ======================================== */}
            <section id="privacy-vs-competitors" className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy vs Competitors</h2>
              <p className={styles.sectionDescription}>
                See how Tallow's privacy features compare to other popular file sharing
                services.
              </p>

              <div className={styles.comparisonGrid}>
                {/* Tallow */}
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Tallow</h3>
                  <ul className={styles.comparisonList}>
                    <li>End-to-end encryption</li>
                    <li>No account required</li>
                    <li>No server storage</li>
                    <li>Metadata stripping</li>
                    <li>No IP logging</li>
                    <li>No cookies or tracking</li>
                    <li>Filename encryption</li>
                    <li>Traffic analysis resistance</li>
                    <li>Onion routing support</li>
                    <li>Open source</li>
                  </ul>
                </div>

                {/* WeTransfer */}
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>WeTransfer</h3>
                  <ul className={styles.comparisonList}>
                    <li>Files stored on servers</li>
                    <li>No E2E encryption</li>
                    <li className="has">No account for basic use</li>
                    <li>No metadata stripping</li>
                    <li>IP addresses logged</li>
                    <li>Tracking cookies used</li>
                    <li>Filenames visible to service</li>
                    <li>No traffic obfuscation</li>
                    <li>No onion routing</li>
                    <li>Closed source</li>
                  </ul>
                </div>

                {/* AirDrop */}
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>AirDrop</h3>
                  <ul className={styles.comparisonList}>
                    <li className="has">Encrypted in transit</li>
                    <li>Apple ID required</li>
                    <li className="has">No server storage</li>
                    <li>No metadata stripping</li>
                    <li className="partial">Local only, no IP risk</li>
                    <li>Apple ecosystem tracking</li>
                    <li>Filenames visible locally</li>
                    <li>No traffic obfuscation</li>
                    <li>No onion routing</li>
                    <li>Closed source</li>
                  </ul>
                </div>

                {/* Google Drive */}
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Google Drive</h3>
                  <ul className={styles.comparisonList}>
                    <li>No E2E encryption</li>
                    <li>Google account required</li>
                    <li>Files stored on servers</li>
                    <li>No metadata stripping</li>
                    <li>IP addresses logged</li>
                    <li>Extensive tracking</li>
                    <li>Filenames visible to Google</li>
                    <li>No traffic obfuscation</li>
                    <li>No onion routing</li>
                    <li>Closed source</li>
                  </ul>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Different Tools, Different Goals</p>
                  <p className={styles.calloutText}>
                    Cloud storage services prioritize convenience, collaboration, and
                    availability. Tallow prioritizes privacy, security, and direct
                    transfer. Choose the right tool for your needs.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', padding: '0 var(--space-4)', maxWidth: 'none', margin: '0 auto' }}>
            <Link href="/docs/guides/security" className={styles.navLink}>
              <ArrowLeft />
              <div>
                <div className={styles.navLabel}>Previous</div>
                <div className={styles.navTitle}>Security Guide</div>
              </div>
            </Link>
            <Link href="/docs/guides" className={styles.navLink}>
              <div style={{ flex: 1 }}>
                <div className={styles.navLabel}>Next</div>
                <div className={styles.navTitle}>All Guides</div>
              </div>
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
