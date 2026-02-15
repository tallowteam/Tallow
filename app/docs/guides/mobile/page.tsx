import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from '@/components/icons';
import styles from './page.module.css';

export default function MobileAppGuide() {
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
              <span>Mobile App</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Mobile App</h1>
            <p className={styles.heroDescription}>
              Transfer files on iOS and Android with the same quantum-safe encryption.
              Install Tallow as a PWA or use the native app for the best mobile experience.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>7 min read</span>
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
                  <a className={styles.tocLink} href="#platform-options">Platform Options</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#pwa-installation">PWA Installation</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#ios-features">iOS Features</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#android-features">Android Features</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#mobile-transfers">Mobile Transfers</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#share-sheet">Share Sheet Integration</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#background-transfers">Background Transfers</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#mobile-tips">Mobile Tips</a>
                </li>
              </ul>
            </nav>

            {/* Platform Options */}
            <section id="platform-options" className={styles.section}>
              <h2 className={styles.sectionTitle}>Platform Options</h2>
              <p className={styles.sectionDescription}>
                Tallow runs on any mobile device. Choose the option that works best for you.
              </p>

              <div className={styles.platformGrid}>
                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🌐</div>
                  <h3 className={styles.platformTitle}>PWA (Any Browser)</h3>
                  <p className={styles.platformDescription}>
                    Install Tallow directly from your browser. Works on any device with Safari,
                    Chrome, or Firefox. No app store needed. Automatic updates.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>📱</div>
                  <h3 className={styles.platformTitle}>Flutter Native App</h3>
                  <p className={styles.platformDescription}>
                    A dedicated native app built with Flutter for the best performance and
                    deeper OS integration. Coming soon to iOS and Android app stores.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>💻</div>
                  <h3 className={styles.platformTitle}>Desktop PWA</h3>
                  <p className={styles.platformDescription}>
                    Install Tallow on desktop from Chrome, Edge, or other Chromium-based
                    browsers for a native-like windowed experience.
                  </p>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.infoCallout}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>PWA vs Native</p>
                  <p className={styles.calloutText}>
                    The PWA is fully functional today and receives the same quantum-safe
                    encryption as the desktop version. The native Flutter app will add
                    deeper integrations like background transfers and NFC discovery.
                  </p>
                </div>
              </div>
            </section>

            {/* PWA Installation */}
            <section id="pwa-installation" className={styles.section}>
              <h2 className={styles.sectionTitle}>PWA Installation</h2>
              <p className={styles.sectionDescription}>
                Install Tallow as a Progressive Web App in three simple steps. Works offline
                and feels like a native app.
              </p>

              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: '0 0 var(--space-4) 0' }}>
                iOS (Safari)
              </h3>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Open in Safari</h4>
                    <p className={styles.stepText}>
                      Navigate to tallow.app in Safari. PWA installation only works in Safari on iOS.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Tap the Share Button</h4>
                    <p className={styles.stepText}>
                      Tap the share icon (square with arrow) in the bottom toolbar of Safari.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Add to Home Screen</h4>
                    <p className={styles.stepText}>
                      Scroll down and tap &ldquo;Add to Home Screen&rdquo;. Confirm the name and tap
                      &ldquo;Add&rdquo;. Tallow now appears as an app icon on your home screen.
                    </p>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 'var(--space-8) 0 var(--space-4) 0' }}>
                Android (Chrome)
              </h3>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Open in Chrome</h4>
                    <p className={styles.stepText}>
                      Navigate to tallow.app in Google Chrome on your Android device.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Tap the Menu</h4>
                    <p className={styles.stepText}>
                      Tap the three-dot menu icon in the top-right corner of Chrome.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Install App</h4>
                    <p className={styles.stepText}>
                      Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;. Confirm
                      the installation. Tallow appears in your app drawer and home screen.
                    </p>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 'var(--space-8) 0 var(--space-4) 0' }}>
                Desktop
              </h3>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Look for the Install Icon</h4>
                    <p className={styles.stepText}>
                      In Chrome or Edge, look for the install icon in the address bar (a monitor
                      with a download arrow). Click it and confirm to install Tallow as a desktop app.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.successCallout}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Auto-Updates</p>
                  <p className={styles.calloutText}>
                    PWA installations update automatically in the background. You always get the
                    latest features and security patches without visiting an app store.
                  </p>
                </div>
              </div>
            </section>

            {/* iOS Features */}
            <section id="ios-features" className={styles.section}>
              <h2 className={styles.sectionTitle}>iOS Features</h2>
              <p className={styles.sectionDescription}>
                Tallow takes advantage of iOS capabilities to deliver a native-quality experience.
              </p>

              <div className={styles.platformGrid}>
                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🏠</div>
                  <h3 className={styles.platformTitle}>Home Screen Icon</h3>
                  <p className={styles.platformDescription}>
                    A custom app icon on your home screen. Launch Tallow with a single tap,
                    just like any native app.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>📺</div>
                  <h3 className={styles.platformTitle}>Full-Screen Mode</h3>
                  <p className={styles.platformDescription}>
                    Runs in standalone mode without the Safari address bar, giving you the
                    full screen for file transfers.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>📳</div>
                  <h3 className={styles.platformTitle}>Haptic Feedback</h3>
                  <p className={styles.platformDescription}>
                    Subtle vibrations confirm actions like accepting transfers, completing
                    sends, and device connections.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🔐</div>
                  <h3 className={styles.platformTitle}>Face ID / Touch ID</h3>
                  <p className={styles.platformDescription}>
                    Lock Tallow behind biometric authentication. Require Face ID or Touch ID
                    before accessing transfers.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>📤</div>
                  <h3 className={styles.platformTitle}>iOS Share Sheet</h3>
                  <p className={styles.platformDescription}>
                    Share files from Photos, Files, or any app directly to Tallow through
                    the native iOS share sheet.
                  </p>
                </div>
              </div>
            </section>

            {/* Android Features */}
            <section id="android-features" className={styles.section}>
              <h2 className={styles.sectionTitle}>Android Features</h2>
              <p className={styles.sectionDescription}>
                Android offers deeper PWA integration with system-level features.
              </p>

              <div className={styles.platformGrid}>
                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🏠</div>
                  <h3 className={styles.platformTitle}>Home Screen Shortcut</h3>
                  <p className={styles.platformDescription}>
                    A full app icon on your home screen and in the app drawer. Appears
                    alongside native apps.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🔔</div>
                  <h3 className={styles.platformTitle}>Notification Badges</h3>
                  <p className={styles.platformDescription}>
                    Get notified when someone wants to send you files. Badge counts show
                    pending transfer requests.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>⚡</div>
                  <h3 className={styles.platformTitle}>Quick Settings Tile</h3>
                  <p className={styles.platformDescription}>
                    Add a Tallow toggle to your Quick Settings panel for instant access
                    to transfer mode.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>📨</div>
                  <h3 className={styles.platformTitle}>Direct Share Targets</h3>
                  <p className={styles.platformDescription}>
                    Frequently contacted devices appear as Direct Share targets in the
                    Android share menu.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🎨</div>
                  <h3 className={styles.platformTitle}>Material You Theming</h3>
                  <p className={styles.platformDescription}>
                    Tallow adapts to your device&apos;s Material You color scheme on
                    Android 12 and later for a cohesive look.
                  </p>
                </div>
              </div>
            </section>

            {/* Mobile Transfers */}
            <section id="mobile-transfers" className={styles.section}>
              <h2 className={styles.sectionTitle}>Mobile Transfers</h2>
              <p className={styles.sectionDescription}>
                The mobile interface is optimized for touch with gesture-based controls.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Tap to Select Device</h4>
                    <p className={styles.stepText}>
                      Discovered devices appear as large, touch-friendly cards. Tap a device
                      to select it as your transfer target.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Select or Drop Files</h4>
                    <p className={styles.stepText}>
                      Tap the file picker to browse your device, or use the share sheet from
                      any other app. Drag and drop also works on tablets.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Swipe to Cancel</h4>
                    <p className={styles.stepText}>
                      Swipe left on an active transfer to cancel it. A confirmation dialog
                      prevents accidental cancellations.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Pull to Refresh</h4>
                    <p className={styles.stepText}>
                      Pull down on the device list to manually refresh and discover new
                      nearby devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.infoCallout}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Touch-Optimized UI</p>
                  <p className={styles.calloutText}>
                    All buttons and targets are at least 44px to meet accessibility guidelines.
                    The interface adapts to one-handed use on phones and two-handed use on tablets.
                  </p>
                </div>
              </div>
            </section>

            {/* Share Sheet Integration */}
            <section id="share-sheet" className={styles.section}>
              <h2 className={styles.sectionTitle}>Share Sheet Integration</h2>
              <p className={styles.sectionDescription}>
                Send files to Tallow from any app on your device using the native share menu.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Share from Any App</h4>
                    <p className={styles.stepText}>
                      In Photos, Files, or any app, tap the Share button and select Tallow from
                      the list of available apps. The file is queued for transfer.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Choose Destination</h4>
                    <p className={styles.stepText}>
                      Tallow opens with your file ready. Select a nearby device and confirm to
                      begin the encrypted transfer.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Receive into Tallow</h4>
                    <p className={styles.stepText}>
                      When someone sends you files, Tallow displays a notification. Tap to accept
                      and the file is saved to your device&apos;s download location.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Background Transfers */}
            <section id="background-transfers" className={styles.section}>
              <h2 className={styles.sectionTitle}>Background Transfers</h2>
              <p className={styles.sectionDescription}>
                Understand the limitations and capabilities of background file transfers on mobile.
              </p>

              <div className={styles.platformGrid}>
                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🍎</div>
                  <h3 className={styles.platformTitle}>iOS Limitations</h3>
                  <p className={styles.platformDescription}>
                    Safari pauses background tabs after a short period. Keep Tallow in the
                    foreground during active transfers. The native app (coming soon) will
                    support true background transfers via iOS Background URLSession.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🤖</div>
                  <h3 className={styles.platformTitle}>Android Reliability</h3>
                  <p className={styles.platformDescription}>
                    Android PWAs can run in the background more reliably than iOS. Chrome
                    keeps the service worker active during transfers. For best results,
                    disable battery optimization for Tallow.
                  </p>
                </div>

                <div className={styles.platformCard}>
                  <div className={styles.platformIcon}>🔆</div>
                  <h3 className={styles.platformTitle}>Keep Screen On</h3>
                  <p className={styles.platformDescription}>
                    Enable the &ldquo;Keep Screen On&rdquo; option in Tallow settings during
                    large transfers. This prevents the screen from locking and pausing
                    the transfer.
                  </p>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.warningCallout}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>iOS Background Limitation</p>
                  <p className={styles.calloutText}>
                    On iOS, switching to another app or locking the screen may pause your transfer.
                    Keep Tallow in the foreground for uninterrupted transfers. The native Flutter
                    app will resolve this limitation.
                  </p>
                </div>
              </div>
            </section>

            {/* Mobile Tips */}
            <section id="mobile-tips" className={styles.section}>
              <h2 className={styles.sectionTitle}>Mobile Tips</h2>
              <p className={styles.sectionDescription}>
                Get the best experience when transferring files on your phone or tablet.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Use Wi-Fi, Not Cellular</h4>
                    <p className={styles.stepText}>
                      Wi-Fi is faster and doesn&apos;t count against your data plan. For LAN
                      transfers, Wi-Fi is required since both devices must be on the same
                      local network.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Same Network for LAN Mode</h4>
                    <p className={styles.stepText}>
                      For the fastest transfers, keep both devices on the same Wi-Fi network.
                      LAN mode sends files directly between devices at full network speed
                      without going through the internet.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Watch Your Battery</h4>
                    <p className={styles.stepText}>
                      Large file transfers use CPU for encryption and Wi-Fi radio, which
                      drains battery. Plug in during large transfers if possible, or at
                      least ensure you have 20% or more battery remaining.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Manage Storage</h4>
                    <p className={styles.stepText}>
                      Check your available storage before receiving large files. Tallow shows
                      the incoming file size so you can verify you have enough space. Clear
                      old received files regularly to free up room.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.successCallout}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Same Encryption Everywhere</p>
                  <p className={styles.calloutText}>
                    Whether you use the PWA on a phone or the desktop app on a laptop, every
                    transfer uses the same post-quantum encryption. Your files are equally
                    protected on all platforms.
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
              Privacy Features
            </span>
          </Link>
          <Link href="/docs/guides/self-hosting" className={styles.navLink}>
            <span className={styles.navLabel}>Next</span>
            <span className={styles.navTitle}>
              Self-Hosting
              <ArrowRight />
            </span>
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}
