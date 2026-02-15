import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from '@/components/icons';
import styles from './page.module.css';

export default function FriendsContactsGuide() {
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
              <span>Friends &amp; Contacts</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Friends &amp; Contacts</h1>
            <p className={styles.heroDescription}>
              Manage trusted devices, set trust levels, and verify peers for instant transfers.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>6 min read</span>
              <span className={styles.badge}>Beginner</span>
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
                  <a className={styles.tocLink} href="#trust-system">Trust System</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#adding-friends">Adding Friends</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#trust-levels">Trust Levels</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#sas-verification">SAS Verification</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#favorites">Favorites</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#auto-accept">Auto-Accept</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#block-list">Block List</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#guest-mode">Guest Mode</a>
                </li>
              </ul>
            </nav>

            {/* Trust System Overview */}
            <section id="trust-system" className={styles.section}>
              <h2 className={styles.sectionTitle}>Trust System Overview</h2>
              <p className={styles.sectionDescription}>
                Tallow uses a three-tier trust system to manage how your device interacts with
                others. Every device you encounter starts as Unknown and can be promoted to
                Trusted after verification, or demoted to Blocked if you no longer want to
                receive transfers from it.
              </p>
              <p className={styles.sectionDescription}>
                The trust system is entirely local to your device. Your trust decisions are never
                shared with a server or with the other party. This means you stay in full control
                of who can send you files, with no centralized authority involved.
              </p>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Peer-to-Peer Trust</p>
                  <p className={styles.calloutText}>
                    Trust is established directly between two devices using cryptographic
                    verification. No accounts, passwords, or central servers are involved.
                  </p>
                </div>
              </div>
            </section>

            {/* Adding Friends */}
            <section id="adding-friends" className={styles.section}>
              <h2 className={styles.sectionTitle}>Adding Friends</h2>
              <p className={styles.sectionDescription}>
                Adding a friend saves a device to your contact list so you can find it quickly
                in the future. Here is how to add a friend on your local network.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Discover a Nearby Device</h3>
                    <p className={styles.stepText}>
                      Open Tallow on both devices. They must be on the same network. The other
                      device appears automatically in your device list within a few seconds.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Tap Add Friend</h3>
                    <p className={styles.stepText}>
                      Select the device from the list and tap the &quot;Add Friend&quot; button.
                      A pairing request is sent to the other device over an encrypted channel.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Confirm on Both Sides</h3>
                    <p className={styles.stepText}>
                      The other device receives a friend request notification. Once both sides
                      accept, the devices are saved to each other&apos;s contact list and can
                      optionally proceed to SAS verification to upgrade trust.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Mutual Consent</p>
                  <p className={styles.calloutText}>
                    Both devices must accept the friend request. You cannot be added to
                    someone&apos;s contact list without your explicit approval.
                  </p>
                </div>
              </div>
            </section>

            {/* Trust Levels */}
            <section id="trust-levels" className={styles.section}>
              <h2 className={styles.sectionTitle}>Trust Levels</h2>
              <p className={styles.sectionDescription}>
                Every contact in Tallow has one of three trust levels. Each level controls
                whether incoming transfers are automatically accepted, require manual approval,
                or are rejected outright.
              </p>

              <div className={styles.trustLevels}>
                <div className={styles.trustLevel}>
                  <span className={styles.trustIcon}>&#x2753;</span>
                  <h3 className={styles.trustName}>Unknown</h3>
                  <p className={styles.trustDescription}>
                    The default level for every new device. Each incoming transfer must be
                    manually reviewed and approved before it starts. This is the safest option
                    for devices you have not verified.
                  </p>
                </div>

                <div className={styles.trustLevel}>
                  <span className={styles.trustIcon}>&#x2705;</span>
                  <h3 className={styles.trustName}>Trusted</h3>
                  <p className={styles.trustDescription}>
                    Granted after successful SAS verification. Transfers from trusted devices
                    can be auto-accepted based on your settings. Ideal for your own devices or
                    close colleagues.
                  </p>
                </div>

                <div className={styles.trustLevel}>
                  <span className={styles.trustIcon}>&#x26D4;</span>
                  <h3 className={styles.trustName}>Blocked</h3>
                  <p className={styles.trustDescription}>
                    All transfer requests from this device are silently rejected. The blocked
                    device is not notified. Use this for devices you do not recognize or no
                    longer trust.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Trust is Per-Device</p>
                  <p className={styles.calloutText}>
                    Trust levels are tied to a specific device identity, not a person.
                    If someone gets a new device, you will need to verify and trust
                    that new device separately.
                  </p>
                </div>
              </div>
            </section>

            {/* SAS Verification */}
            <section id="sas-verification" className={styles.section}>
              <h2 className={styles.sectionTitle}>SAS Verification</h2>
              <p className={styles.sectionDescription}>
                Short Authentication Strings (SAS) let you verify that no one is intercepting
                the connection between two devices. During verification, both devices display
                a sequence of emoji. If the emoji match, you can be confident the connection
                is genuine.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Start Verification</h3>
                    <p className={styles.stepText}>
                      Open your contact&apos;s details and tap &quot;Verify Device&quot;. A
                      secure key exchange begins in the background.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Compare Emoji</h3>
                    <p className={styles.stepText}>
                      Both screens show a sequence of emoji derived from the shared secret.
                      Verbally confirm the emoji match with the other person, either in person
                      or over a trusted voice call.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Confirm or Reject</h3>
                    <p className={styles.stepText}>
                      If the emoji match, tap &quot;Confirm&quot; on both devices. The
                      contact is promoted to Trusted. If they do not match, tap
                      &quot;Reject&quot; immediately &mdash; this may indicate a
                      man-in-the-middle attack.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Security Warning</p>
                  <p className={styles.calloutText}>
                    Never skip emoji comparison. If the emoji do not match, do not proceed
                    with the transfer. A mismatch means a third party may be intercepting
                    your connection.
                  </p>
                </div>
              </div>
            </section>

            {/* Favorites */}
            <section id="favorites" className={styles.section}>
              <h2 className={styles.sectionTitle}>Favorites</h2>
              <p className={styles.sectionDescription}>
                Pin your most frequently used contacts to the top of your device list for
                one-tap access. Favorites appear first in discovery and make quick-send
                effortless.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open Contact Details</h3>
                    <p className={styles.stepText}>
                      Tap on any contact in your Friends list to open their detail view.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Toggle Favorite</h3>
                    <p className={styles.stepText}>
                      Tap the star icon to mark them as a favorite. Favorited contacts are
                      pinned to the top of the device list and highlighted with a star badge.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Quick Send</p>
                  <p className={styles.calloutText}>
                    Drag a file onto a favorited contact to send immediately, skipping the
                    device selection step entirely.
                  </p>
                </div>
              </div>
            </section>

            {/* Auto-Accept Settings */}
            <section id="auto-accept" className={styles.section}>
              <h2 className={styles.sectionTitle}>Auto-Accept Settings</h2>
              <p className={styles.sectionDescription}>
                Configure which trust levels are allowed to send files to your device without
                manual approval. By default, auto-accept is disabled for all contacts.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open Settings</h3>
                    <p className={styles.stepText}>
                      Navigate to Settings and find the &quot;Transfer Preferences&quot; section.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Choose Auto-Accept Level</h3>
                    <p className={styles.stepText}>
                      Select which trust levels can auto-send files. Options include
                      &quot;Trusted only&quot;, &quot;Trusted and Favorites&quot;, or
                      &quot;Nobody&quot; (manual approval for all).
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Set File Size Limit (Optional)</h3>
                    <p className={styles.stepText}>
                      Optionally set a maximum file size for auto-accepted transfers. Files
                      above this threshold always require manual approval, even from trusted
                      contacts.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Use with Caution</p>
                  <p className={styles.calloutText}>
                    Enabling auto-accept means files arrive on your device without a
                    confirmation prompt. Only enable this for devices you have verified
                    with SAS and fully trust.
                  </p>
                </div>
              </div>
            </section>

            {/* Block List */}
            <section id="block-list" className={styles.section}>
              <h2 className={styles.sectionTitle}>Block List</h2>
              <p className={styles.sectionDescription}>
                Block unwanted devices to silently reject all incoming transfer requests from
                them. Blocked devices are not notified and cannot see your device in discovery.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Block a Device</h3>
                    <p className={styles.stepText}>
                      Tap on the device in your contact list or the discovery panel, then
                      select &quot;Block Device&quot;. A confirmation dialog appears before
                      the block takes effect.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Manage Blocked Devices</h3>
                    <p className={styles.stepText}>
                      View and manage your full block list in Settings under &quot;Blocked
                      Devices&quot;. You can unblock a device at any time to restore it to
                      Unknown status.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Silent Rejection</p>
                  <p className={styles.calloutText}>
                    Blocked devices receive no notification that they have been blocked.
                    Their transfer requests are silently dropped, maintaining your privacy.
                  </p>
                </div>
              </div>
            </section>

            {/* Guest Mode */}
            <section id="guest-mode" className={styles.section}>
              <h2 className={styles.sectionTitle}>Guest Mode</h2>
              <p className={styles.sectionDescription}>
                Guest Mode lets you share files with someone without saving them as a contact.
                This is ideal for one-time transfers at conferences, coffee shops, or any
                situation where you need a quick, temporary connection.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Initiate Guest Transfer</h3>
                    <p className={styles.stepText}>
                      When a device appears in discovery, select it and choose
                      &quot;Send as Guest&quot; instead of &quot;Add Friend&quot;.
                      The transfer proceeds with full encryption but no contact is saved.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Automatic Cleanup</h3>
                    <p className={styles.stepText}>
                      Once the transfer completes, all session keys and connection data are
                      securely wiped. No record of the guest device remains on either side.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Still Encrypted</p>
                  <p className={styles.calloutText}>
                    Guest Mode transfers use the same end-to-end encryption as regular
                    transfers. The only difference is that no contact information is retained
                    after the session ends.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div style={{ maxWidth: 'none', margin: '0 auto', padding: '0 var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Link href="/docs/guides/security" className={styles.navLink}>
              <span className={styles.navLabel}>Previous</span>
              <span className={styles.navTitle}>
                <ArrowLeft />
                Room System
              </span>
            </Link>
            <Link href="/settings" className={styles.navLink} style={{ textAlign: 'right' }}>
              <span className={styles.navLabel}>Next</span>
              <span className={styles.navTitle} style={{ justifyContent: 'flex-end' }}>
                Settings
                <ArrowRight />
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
