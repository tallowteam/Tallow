import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from '@/components/icons';
import styles from './page.module.css';

export default function SettingsGuide() {
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
              <span>Settings</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Settings &amp; Configuration</h1>
            <p className={styles.heroDescription}>
              Customize every aspect of Tallow to match your workflow. From appearance and
              privacy to network tuning and advanced options, make it yours.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>5 min read</span>
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
                  <a href="#appearance" className={styles.tocLink}>Appearance</a>
                </li>
                <li>
                  <a href="#privacy-security" className={styles.tocLink}>Privacy &amp; Security</a>
                </li>
                <li>
                  <a href="#network" className={styles.tocLink}>Network</a>
                </li>
                <li>
                  <a href="#notifications" className={styles.tocLink}>Notifications</a>
                </li>
                <li>
                  <a href="#transfer-defaults" className={styles.tocLink}>Transfer Defaults</a>
                </li>
                <li>
                  <a href="#storage" className={styles.tocLink}>Storage</a>
                </li>
                <li>
                  <a href="#advanced" className={styles.tocLink}>Advanced</a>
                </li>
              </ul>
            </nav>

            {/* ==============================
                Appearance
               ============================== */}
            <section id="appearance" className={styles.section}>
              <h2 className={styles.sectionTitle}>Appearance</h2>
              <p className={styles.sectionDescription}>
                Control how Tallow looks and feels. Theme, language, and motion preferences
                are applied instantly across the entire application.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Theme</p>
                  <p className={styles.settingDescription}>
                    Choose between System, Light, or Dark mode. System follows your OS preference automatically.
                  </p>
                  <p className={styles.settingDefault}>System</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Language</p>
                  <p className={styles.settingDescription}>
                    Select the UI language. Tallow supports English, Spanish, French, German, Japanese, and more.
                  </p>
                  <p className={styles.settingDefault}>English</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Animations</p>
                  <p className={styles.settingDescription}>
                    Toggle UI animations and transitions. Disabling respects prefers-reduced-motion and can improve performance on older devices.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Compact mode</p>
                  <p className={styles.settingDescription}>
                    Reduce padding and spacing throughout the interface for a denser layout, ideal for power users and smaller screens.
                  </p>
                  <p className={styles.settingDefault}>Off</p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Tip: System theme</p>
                  <p className={styles.calloutText}>
                    When set to System, Tallow watches for OS-level theme changes in real time.
                    Switch your OS to dark mode and Tallow follows instantly.
                  </p>
                </div>
              </div>
            </section>

            {/* ==============================
                Privacy & Security
               ============================== */}
            <section id="privacy-security" className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy &amp; Security</h2>
              <p className={styles.sectionDescription}>
                Fine-tune how Tallow handles your data. Every privacy setting defaults to the
                most protective option.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Analytics opt-in</p>
                  <p className={styles.settingDescription}>
                    Share anonymous, aggregate usage statistics to help improve Tallow. No personal data or file contents are ever collected.
                  </p>
                  <p className={styles.settingDefault}>Off</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Metadata stripping</p>
                  <p className={styles.settingDescription}>
                    Automatically remove EXIF, GPS, author, and device data from images and documents before sending.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Auto-clear history</p>
                  <p className={styles.settingDescription}>
                    Automatically delete transfer history after a set period (1 day, 7 days, 30 days, or never).
                  </p>
                  <p className={styles.settingDefault}>Never</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Biometric lock</p>
                  <p className={styles.settingDescription}>
                    Require fingerprint or face recognition to unlock the app. Uses WebAuthn for secure, on-device verification.
                  </p>
                  <p className={styles.settingDefault}>Off</p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Metadata stripping is on by default</p>
                  <p className={styles.calloutText}>
                    Tallow strips metadata before transfer to protect your location and identity.
                    Turn this off only if the recipient specifically needs original file metadata.
                  </p>
                </div>
              </div>
            </section>

            {/* ==============================
                Network
               ============================== */}
            <section id="network" className={styles.section}>
              <h2 className={styles.sectionTitle}>Network</h2>
              <p className={styles.sectionDescription}>
                Configure how Tallow discovers peers and routes data. Most users can leave
                these at their defaults.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Auto-select mode</p>
                  <p className={styles.settingDescription}>
                    Let Tallow automatically choose between local network (WebRTC) and internet relay based on connectivity.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>TURN server</p>
                  <p className={styles.settingDescription}>
                    Specify a custom TURN relay server for internet transfers. Leave blank to use the default Tallow relay.
                  </p>
                  <p className={styles.settingDefault}>Default</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Bandwidth limit</p>
                  <p className={styles.settingDescription}>
                    Cap the maximum upload/download speed to avoid saturating your connection. Set to 0 for unlimited.
                  </p>
                  <p className={styles.settingDefault}>Unlimited</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Discovery</p>
                  <p className={styles.settingDescription}>
                    Toggle local network device discovery. When disabled, you can still connect via room codes or QR scanning.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Corporate networks</p>
                  <p className={styles.calloutText}>
                    If you are behind a strict firewall, you may need to configure a custom TURN
                    server or ask your IT team to allow WebRTC traffic. See the Internet Transfer
                    guide for details.
                  </p>
                </div>
              </div>
            </section>

            {/* ==============================
                Notifications
               ============================== */}
            <section id="notifications" className={styles.section}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <p className={styles.sectionDescription}>
                Control which events trigger alerts. All notification types can be toggled
                independently.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Browser notifications</p>
                  <p className={styles.settingDescription}>
                    Show system-level notifications for incoming transfers and connection events, even when Tallow is in the background.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Sound alerts</p>
                  <p className={styles.settingDescription}>
                    Play an audio cue when a transfer starts, completes, or encounters an error.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Transfer complete</p>
                  <p className={styles.settingDescription}>
                    Display a toast notification when a file transfer finishes successfully.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Error notifications</p>
                  <p className={styles.settingDescription}>
                    Alert you immediately when a transfer fails or a connection drops unexpectedly.
                  </p>
                  <p className={styles.settingDefault}>On</p>
                </div>
              </div>
            </section>

            {/* ==============================
                Transfer Defaults
               ============================== */}
            <section id="transfer-defaults" className={styles.section}>
              <h2 className={styles.sectionTitle}>Transfer Defaults</h2>
              <p className={styles.sectionDescription}>
                Set baseline behavior for all file transfers. Individual transfers can still
                override these values.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Auto-accept trusted</p>
                  <p className={styles.settingDescription}>
                    Automatically accept incoming files from devices you have previously verified and marked as trusted.
                  </p>
                  <p className={styles.settingDefault}>Off</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Save location</p>
                  <p className={styles.settingDescription}>
                    Default download folder for received files. Uses the system Downloads folder if not customized.
                  </p>
                  <p className={styles.settingDefault}>~/Downloads</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Compression level</p>
                  <p className={styles.settingDescription}>
                    Set default compression for outgoing files. Options: None, Fast, Balanced, or Maximum. Higher levels reduce transfer size but use more CPU.
                  </p>
                  <p className={styles.settingDefault}>Balanced</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Chunk size</p>
                  <p className={styles.settingDescription}>
                    Size of each data chunk during transfer. Larger chunks improve throughput on fast connections; smaller chunks improve reliability on unstable links.
                  </p>
                  <p className={styles.settingDefault}>64 KB</p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Auto-accept requires trust</p>
                  <p className={styles.calloutText}>
                    Only devices you have explicitly verified through SAS (Short Authentication
                    String) comparison are eligible for auto-accept. Unknown devices always
                    prompt for approval.
                  </p>
                </div>
              </div>
            </section>

            {/* ==============================
                Storage
               ============================== */}
            <section id="storage" className={styles.section}>
              <h2 className={styles.sectionTitle}>Storage</h2>
              <p className={styles.sectionDescription}>
                Manage where files land and how transfer records are kept on your device.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Download location</p>
                  <p className={styles.settingDescription}>
                    Root directory where all received files are saved. You can change this at any time without affecting existing files.
                  </p>
                  <p className={styles.settingDefault}>~/Downloads</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Organize by sender</p>
                  <p className={styles.settingDescription}>
                    Automatically create sub-folders named after each sender device, keeping files from different sources separated.
                  </p>
                  <p className={styles.settingDefault}>Off</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Duplicate detection</p>
                  <p className={styles.settingDescription}>
                    When receiving a file that already exists, prompt to rename, overwrite, or skip. Uses content hashing for accurate detection.
                  </p>
                  <p className={styles.settingDefault}>Prompt</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Clear history</p>
                  <p className={styles.settingDescription}>
                    Manually delete all transfer history records from the local database. This does not remove downloaded files.
                  </p>
                  <p className={styles.settingDefault}>Manual</p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>History vs. files</p>
                  <p className={styles.calloutText}>
                    Clearing transfer history removes log entries only. Your downloaded files
                    remain untouched on disk. To remove files, delete them from your file
                    manager.
                  </p>
                </div>
              </div>
            </section>

            {/* ==============================
                Advanced
               ============================== */}
            <section id="advanced" className={styles.section}>
              <h2 className={styles.sectionTitle}>Advanced</h2>
              <p className={styles.sectionDescription}>
                Power-user settings for debugging, custom infrastructure, and configuration
                portability. Change these only if you know what you are doing.
              </p>

              <div className={styles.settingsTable}>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Debug logging</p>
                  <p className={styles.settingDescription}>
                    Enable verbose console output for WebRTC, signaling, and encryption operations. Useful for troubleshooting connection issues.
                  </p>
                  <p className={styles.settingDefault}>Off</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>ICE configuration</p>
                  <p className={styles.settingDescription}>
                    Override the default WebRTC ICE servers with custom STUN/TURN endpoints. Accepts a JSON array of RTCIceServer objects.
                  </p>
                  <p className={styles.settingDefault}>Default</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Signaling server</p>
                  <p className={styles.settingDescription}>
                    Point Tallow to a self-hosted signaling server instead of the default. Requires a WebSocket URL.
                  </p>
                  <p className={styles.settingDefault}>Default</p>
                </div>
                <div className={styles.settingsRow}>
                  <p className={styles.settingName}>Export / Import</p>
                  <p className={styles.settingDescription}>
                    Export all settings to a JSON file for backup or import a previously exported configuration to restore your setup on a new device.
                  </p>
                  <p className={styles.settingDefault}>--</p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Advanced settings can break connectivity</p>
                  <p className={styles.calloutText}>
                    Incorrect ICE or signaling server values will prevent Tallow from establishing
                    peer connections. If transfers stop working after a change, reset these
                    fields to their defaults.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <nav className={styles.navigation} aria-label="Guide navigation">
          <Link href="/docs/guides/security" className={styles.navLink}>
            <span className={styles.navLabel}>Previous</span>
            <span className={styles.navTitle}>
              <ArrowLeft />
              Security Guide
            </span>
          </Link>
          <Link href="/docs/guides/getting-started" className={styles.navLink}>
            <span className={styles.navLabel}>Next</span>
            <span className={styles.navTitle}>
              Getting Started
              <ArrowRight />
            </span>
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}
