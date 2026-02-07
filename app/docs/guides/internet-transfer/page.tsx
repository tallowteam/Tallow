'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info,
} from '@/components/icons';
import styles from './page.module.css';

export default function InternetTransferGuide() {
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
              <span>Internet Transfer (P2P)</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Internet File Transfer via P2P</h1>
            <p className={styles.heroDescription}>
              Share files securely across the internet using room codes. End-to-end encrypted,
              completely private, and works across any network.
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
                <li>
                  <a href="#overview">How It Works</a>
                </li>
                <li>
                  <a href="#room-codes">Understanding Room Codes</a>
                </li>
                <li>
                  <a href="#creating-rooms">Creating a Room</a>
                </li>
                <li>
                  <a href="#sharing">Sharing & Receiving</a>
                </li>
                <li>
                  <a href="#privacy">Privacy & Security</a>
                </li>
                <li>
                  <a href="#troubleshooting">Troubleshooting</a>
                </li>
              </ul>
            </nav>

            {/* Overview */}
            <section id="overview" className={styles.section}>
              <h2 className={styles.sectionTitle}>How Internet P2P Works</h2>
              <p className={styles.sectionDescription}>
                Internet transfers use a different approach than local network transfers. Instead of
                automatic discovery, you manually create a room and share a code.
              </p>

              <div className={styles.flowDiagram}>
                <div className={styles.flowStep}>
                  <div className={styles.flowNumber}>1</div>
                  <div className={styles.flowText}>You create a room in Tallow</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowStep}>
                  <div className={styles.flowNumber}>2</div>
                  <div className={styles.flowText}>Tallow generates a room code</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowStep}>
                  <div className={styles.flowNumber}>3</div>
                  <div className={styles.flowText}>You share the code with recipient</div>
                </div>
              </div>

              <div className={styles.flowDiagram}>
                <div className={styles.flowStep}>
                  <div className={styles.flowNumber}>4</div>
                  <div className={styles.flowText}>Recipient joins the room with code</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowStep}>
                  <div className={styles.flowNumber}>5</div>
                  <div className={styles.flowText}>Direct P2P connection established</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowStep}>
                  <div className={styles.flowNumber}>6</div>
                  <div className={styles.flowText}>Files transfer securely & privately</div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutInfo}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>No Central Server</p>
                  <p className={styles.calloutText}>
                    After initial connection, files transfer directly between devices. Tallow servers
                    never see your files, only manage the room briefly for connection setup.
                  </p>
                </div>
              </div>
            </section>

            {/* Room Codes */}
            <section id="room-codes" className={styles.section}>
              <h2 className={styles.sectionTitle}>Understanding Room Codes</h2>
              <p className={styles.sectionDescription}>
                Room codes are secure, temporary tokens that enable file sharing across the internet.
              </p>

              <div className={styles.roomCodeGrid}>
                <div className={styles.roomCodeCard}>
                  <h3 className={styles.roomCodeTitle}>What is a Room Code?</h3>
                  <p className={styles.roomCodeText}>
                    A room code is a short string of characters (usually 8-12 characters) that both
                    devices use to find and connect to each other. Think of it as a temporary "meeting room"
                    address.
                  </p>
                </div>

                <div className={styles.roomCodeCard}>
                  <h3 className={styles.roomCodeTitle}>How Secure Are They?</h3>
                  <p className={styles.roomCodeText}>
                    Room codes are cryptographically secure and unique. Each code works only once and
                    expires after the transfer completes or after a timeout period.
                  </p>
                </div>

                <div className={styles.roomCodeCard}>
                  <h3 className={styles.roomCodeTitle}>Can I Reuse a Code?</h3>
                  <p className={styles.roomCodeText}>
                    No. Each room is single-use for security. Once you're done, the code becomes invalid.
                    For multiple transfers, create new rooms.
                  </p>
                </div>

                <div className={styles.roomCodeCard}>
                  <h3 className={styles.roomCodeTitle}>What if I Share the Code Publicly?</h3>
                  <p className={styles.roomCodeText}>
                    Anyone with the code can join the room. For confidential transfers, share only with
                    trusted recipients or use shorter timeouts.
                  </p>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutWarning}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Treat Codes Like Passwords</p>
                  <p className={styles.calloutText}>
                    Room codes grant access to your files. Share them only with intended recipients via
                    secure channels (encrypted messaging, call, etc).
                  </p>
                </div>
              </div>
            </section>

            {/* Creating Rooms */}
            <section id="creating-rooms" className={styles.section}>
              <h2 className={styles.sectionTitle}>Creating a Room</h2>
              <p className={styles.sectionDescription}>
                Setting up an internet transfer is quick and straightforward.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open Tallow</h3>
                    <p className={styles.stepDescription}>
                      Make sure Tallow is running on your device. You don't need to be on the same network
                      as the recipient.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Click "Create Room"</h3>
                    <p className={styles.stepDescription}>
                      In the main interface, look for the "Create Room" or "Internet Transfer" option. Click
                      it to start.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Select Files</h3>
                    <p className={styles.stepDescription}>
                      Choose the files or folders you want to send. You can drag-and-drop or use the file
                      picker.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Generate Room Code</h3>
                    <p className={styles.stepDescription}>
                      Click "Generate" to create a new room code. Tallow shows a unique code for this
                      transfer.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>5</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Share the Code</h3>
                    <p className={styles.stepDescription}>
                      Copy the code and send it to the recipient via email, messaging app, or any secure
                      channel. A button makes copying easy.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>6</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Wait for Recipient</h3>
                    <p className={styles.stepDescription}>
                      Once sent, the room waits for someone to join. You'll see a countdown timer showing
                      how long the room remains open.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutInfo}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Room Timeout</p>
                  <p className={styles.calloutText}>
                    Rooms typically stay open for 30-60 minutes. If the recipient doesn't join in time,
                    the room expires and you'll need to create a new one.
                  </p>
                </div>
              </div>
            </section>

            {/* Sharing & Receiving */}
            <section id="sharing" className={styles.section}>
              <h2 className={styles.sectionTitle}>Sharing and Receiving Files</h2>
              <p className={styles.sectionDescription}>
                Both sending and receiving work through the same room-code system.
              </p>

              <div className={styles.tabContent}>
                <h3 className={styles.tabTitle}>As the Sender</h3>
                <ul className={styles.stepList}>
                  <li>Create a room and set up your files</li>
                  <li>Share the room code securely with recipient</li>
                  <li>Wait for recipient to join (you'll see a notification)</li>
                  <li>Review and confirm the recipient</li>
                  <li>Click "Send" to start the transfer</li>
                  <li>Monitor progress as files upload</li>
                </ul>

                <h3 className={styles.tabTitle} style={{ marginTop: 'var(--space-8)' }}>
                  As the Recipient
                </h3>
                <ul className={styles.stepList}>
                  <li>Open Tallow on your device</li>
                  <li>Click "Join Room" or "Internet Transfer"</li>
                  <li>Paste the room code you received</li>
                  <li>Click "Join" to connect to the room</li>
                  <li>Review files the sender is offering</li>
                  <li>Choose your download location</li>
                  <li>Click "Accept" to receive the files</li>
                  <li>Wait for download to complete</li>
                </ul>
              </div>

              <div className={styles.connectionQuality}>
                <h3 className={styles.qualityTitle}>Connection Quality Indicators</h3>
                <div className={styles.qualityGrid}>
                  <div className={styles.qualityIndicator}>
                    <div className={styles.qualityDot + ' ' + styles.qualityGood} />
                    <div>
                      <p className={styles.qualityLabel}>Good</p>
                      <p className={styles.qualityDesc}>Direct P2P connection. Fastest transfer.</p>
                    </div>
                  </div>

                  <div className={styles.qualityIndicator}>
                    <div className={styles.qualityDot + ' ' + styles.qualityModerate} />
                    <div>
                      <p className={styles.qualityLabel}>Moderate</p>
                      <p className={styles.qualityDesc}>Connection via relay. Reliable but slower.</p>
                    </div>
                  </div>

                  <div className={styles.qualityIndicator}>
                    <div className={styles.qualityDot + ' ' + styles.qualityPoor} />
                    <div>
                      <p className={styles.qualityLabel}>Poor</p>
                      <p className={styles.qualityDesc}>Unstable connection. May disconnect.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutInfo}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Simultaneous Transfers</p>
                  <p className={styles.calloutText}>
                    You can send to multiple recipients at once by creating separate rooms for each.
                    Each transfer uses its own secure connection.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy & Security */}
            <section id="privacy" className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy and Security</h2>
              <p className={styles.sectionDescription}>
                Internet transfers maintain the same security guarantees as local transfers,
                with additional privacy protections.
              </p>

              <div className={styles.securityFeatures}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🔐</div>
                  <h3 className={styles.featureTitle}>End-to-End Encryption</h3>
                  <p className={styles.featureText}>
                    Files are encrypted before leaving your device and decrypted only on the receiving
                    device. Nobody in between sees unencrypted data.
                  </p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🔗</div>
                  <h3 className={styles.featureTitle}>Secure Handshake</h3>
                  <p className={styles.featureText}>
                    Devices authenticate each other using cryptographic signatures before any data
                    transfer. Prevents man-in-the-middle attacks.
                  </p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🌐</div>
                  <h3 className={styles.featureTitle}>Relay Privacy</h3>
                  <p className={styles.featureText}>
                    If P2P connection fails, transfers go through Tallow relays. Relays never see
                    unencrypted data, just encrypted packets.
                  </p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🧹</div>
                  <h3 className={styles.featureTitle}>No Log Storage</h3>
                  <p className={styles.featureText}>
                    Tallow doesn't log transfers. Once a room closes, all metadata about that transfer is
                    erased from servers.
                  </p>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutSuccess}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>GDPR Compliant</p>
                  <p className={styles.calloutText}>
                    Tallow's internet transfers are GDPR compliant. No personal data is stored, and all
                    data is automatically deleted after transfer.
                  </p>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className={styles.section}>
              <h2 className={styles.sectionTitle}>Troubleshooting</h2>
              <p className={styles.sectionDescription}>
                Common issues with internet transfers and how to resolve them.
              </p>

              <div className={styles.troubleshootingList}>
                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Recipient Can't Join
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Check code:</strong> Verify you copied the code correctly. Codes are
                        case-sensitive.
                      </li>
                      <li>
                        <strong>Room expired:</strong> Codes expire after 30-60 minutes. If it's taking
                        too long, create a new room.
                      </li>
                      <li>
                        <strong>Typo in code:</strong> Even one wrong character makes the code invalid.
                        Copy-paste rather than typing.
                      </li>
                      <li>
                        <strong>Check internet:</strong> Verify both devices have working internet
                        connections.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Transfer Very Slow
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Check connection quality:</strong> Look at the indicator in Tallow. If it
                        says "Poor", try again.
                      </li>
                      <li>
                        <strong>Internet speed:</strong> Upload/download speed limits your transfer speed.
                        Check your ISP.
                      </li>
                      <li>
                        <strong>Relay vs P2P:</strong> Direct P2P is faster. If using relay, location
                        distance affects speed.
                      </li>
                      <li>
                        <strong>Network congestion:</strong> Pause other downloads on your network.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Connection Keeps Dropping
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Stable internet:</strong> Unstable internet causes drops. Check your WiFi
                        signal strength.
                      </li>
                      <li>
                        <strong>Use Ethernet:</strong> Wired connection is much more stable than WiFi.
                      </li>
                      <li>
                        <strong>Firewall/VPN:</strong> Some VPNs or firewalls interrupt connections. Try
                        disabling temporarily.
                      </li>
                      <li>
                        <strong>Resume transfer:</strong> Tallow supports resumable transfers. Try again
                        after reconnecting.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    P2P Connection Failing
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Relay fallback:</strong> Tallow automatically uses relay servers if P2P
                        fails. Transfer continues but may be slower.
                      </li>
                      <li>
                        <strong>NAT/Firewall:</strong> Some network configurations prevent P2P. Relay
                        provides fallback option.
                      </li>
                      <li>
                        <strong>Network type:</strong> Corporate networks often block P2P. Relay works on
                        restricted networks.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section className={styles.bestPractices}>
              <h2 className={styles.bestPracticesTitle}>Best Practices</h2>

              <div className={styles.practicesList}>
                <div className={styles.practice}>
                  <h3 className={styles.practiceTitle}>For Sensitive Files</h3>
                  <ul className={styles.practiceItems}>
                    <li>Share codes through encrypted messaging</li>
                    <li>Confirm recipient identity before sending</li>
                    <li>Delete the code after recipient joins</li>
                    <li>Use metadata stripping for documents/images</li>
                  </ul>
                </div>

                <div className={styles.practice}>
                  <h3 className={styles.practiceTitle}>For Better Speed</h3>
                  <ul className={styles.practiceItems}>
                    <li>Use Ethernet when available</li>
                    <li>Transfer during off-peak hours</li>
                    <li>Close bandwidth-heavy applications</li>
                    <li>Keep devices relatively close to avoid WiFi issues</li>
                  </ul>
                </div>

                <div className={styles.practice}>
                  <h3 className={styles.practiceTitle}>For Reliability</h3>
                  <ul className={styles.practiceItems}>
                    <li>Keep Tallow running during transfer</li>
                    <li>Avoid putting device to sleep</li>
                    <li>Use stable internet (not mobile hotspot)</li>
                    <li>Transfer during stable network conditions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Related Topics */}
            <section className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>Related Topics</h2>
              <div className={styles.relatedLinks}>
                <Link href="/docs/guides/local-transfer" className={styles.relatedLink}>
                  <span>Local Network Transfer</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides/security" className={styles.relatedLink}>
                  <span>Security Guide</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides/getting-started" className={styles.relatedLink}>
                  <span>Getting Started</span>
                  <ArrowRight />
                </Link>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div className={styles.navigationContainer}>
            <Link href="/docs/guides/local-transfer" className={styles.navPrevious}>
              <ArrowLeft />
              <span>Previous: Local Network Transfer</span>
            </Link>
            <Link href="/docs/guides/security" className={styles.navNext}>
              <span>Next: Security Guide</span>
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
