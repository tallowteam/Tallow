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

export default function GettingStartedGuide() {
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
              <span>Getting Started</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Getting Started with Tallow</h1>
            <p className={styles.heroDescription}>
              Learn how to use Tallow for your first secure file transfer. This guide covers the basics,
              no technical knowledge required.
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
                  <a href="#opening-app">Opening the App</a>
                </li>
                <li>
                  <a href="#first-transfer">Your First Transfer</a>
                </li>
                <li>
                  <a href="#connection-types">Understanding Connection Types</a>
                </li>
                <li>
                  <a href="#security">Security & Privacy</a>
                </li>
                <li>
                  <a href="#troubleshooting">Common Questions</a>
                </li>
              </ul>
            </nav>

            {/* Opening the App */}
            <section id="opening-app" className={styles.section}>
              <h2 className={styles.sectionTitle}>Opening the App</h2>
              <p className={styles.sectionDescription}>
                Tallow works on Windows, macOS, and Linux. You can also use it through your web browser
                at the Tallow website.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Download or Open</h3>
                    <p className={styles.stepDescription}>
                      If you haven't installed Tallow yet, download it from the official website or use
                      the web version. No installation or account signup required.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Wait for Startup</h3>
                    <p className={styles.stepDescription}>
                      The app takes a few seconds to start. It will automatically search for other devices
                      on your network.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>See Your Device Name</h3>
                    <p className={styles.stepDescription}>
                      Your device will appear in the app with an auto-generated name like "John's Laptop".
                      You can customize this in settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutInfo}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Pro Tip</p>
                  <p className={styles.calloutText}>
                    Give your devices descriptive names like "Work MacBook" or "Desktop PC" to easily
                    identify them during transfers.
                  </p>
                </div>
              </div>
            </section>

            {/* Your First Transfer */}
            <section id="first-transfer" className={styles.section}>
              <h2 className={styles.sectionTitle}>Your First Transfer</h2>
              <p className={styles.sectionDescription}>
                Transferring a file with Tallow is simple and takes just a few steps.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Select Files</h3>
                    <p className={styles.stepDescription}>
                      Click the "+" button or drag files into the app. You can select individual files,
                      multiple files, or entire folders.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Choose Destination</h3>
                    <p className={styles.stepDescription}>
                      Select the device you want to send to. If it's on your local network, it will
                      appear automatically. For internet transfers, see the section below.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Confirm on Receiving Device</h3>
                    <p className={styles.stepDescription}>
                      The receiving device will show a notification. Click "Accept" to start the transfer.
                      You can always reject unwanted transfers.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Transfer Completes</h3>
                    <p className={styles.stepDescription}>
                      Watch the progress bar. Once complete, files arrive in the download folder or
                      custom location you specified.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutWarning}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Important</p>
                  <p className={styles.calloutText}>
                    Always verify you're sending to the correct device. Once a transfer starts, the
                    receiving device must accept it.
                  </p>
                </div>
              </div>
            </section>

            {/* Connection Types */}
            <section id="connection-types" className={styles.section}>
              <h2 className={styles.sectionTitle}>Understanding Connection Types</h2>
              <p className={styles.sectionDescription}>
                Tallow supports multiple ways to transfer files. Choose based on your situation.
              </p>

              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Local Network (LAN)</h3>
                  <ul className={styles.comparisonList}>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Fastest transfers
                    </li>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      No internet required
                    </li>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Automatic device discovery
                    </li>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Most reliable
                    </li>
                  </ul>
                  <p className={styles.comparisonWhen}>
                    <strong>Best for:</strong> Transferring between devices on the same WiFi or Ethernet
                    network.
                  </p>
                </div>

                <div className={styles.comparisonCard}>
                  <h3 className={styles.comparisonTitle}>Internet (P2P via Room Code)</h3>
                  <ul className={styles.comparisonList}>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Works across networks
                    </li>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Share room codes with anyone
                    </li>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Still end-to-end encrypted
                    </li>
                    <li>
                      <CheckCircle className={styles.checkIcon} />
                      Secure & private
                    </li>
                  </ul>
                  <p className={styles.comparisonWhen}>
                    <strong>Best for:</strong> Sending files to friends or colleagues in different
                    locations.
                  </p>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutSuccess}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Smart Selection</p>
                  <p className={styles.calloutText}>
                    Tallow automatically uses the fastest available connection. It tries local network
                    first, then falls back to internet.
                  </p>
                </div>
              </div>
            </section>

            {/* Security & Privacy */}
            <section id="security" className={styles.section}>
              <h2 className={styles.sectionTitle}>Security & Privacy</h2>
              <p className={styles.sectionDescription}>
                Your files are protected with military-grade encryption from the moment you select them.
              </p>

              <div className={styles.securityFeatures}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🔐</div>
                  <h3 className={styles.featureTitle}>End-to-End Encryption</h3>
                  <p className={styles.featureText}>
                    Files are encrypted on your device and decrypted only on the receiving device.
                    Nobody else, not even Tallow servers, can see your files.
                  </p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🔑</div>
                  <h3 className={styles.featureTitle}>Automatic Key Exchange</h3>
                  <p className={styles.featureText}>
                    Encryption keys are negotiated automatically using industry-standard cryptography.
                    You don't need to share passwords.
                  </p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>📵</div>
                  <h3 className={styles.featureTitle}>No Server Storage</h3>
                  <p className={styles.featureText}>
                    Files go directly from your device to the receiving device. They're never stored on
                    any server.
                  </p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>🧹</div>
                  <h3 className={styles.featureTitle}>Metadata Stripping</h3>
                  <p className={styles.featureText}>
                    Optional metadata stripping removes sensitive information from images and documents
                    before transfer.
                  </p>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutSuccess}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Post-Quantum Ready</p>
                  <p className={styles.calloutText}>
                    Tallow uses post-quantum cryptography algorithms, protecting your files against future
                    quantum computer attacks.
                  </p>
                </div>
              </div>
            </section>

            {/* Common Questions */}
            <section id="troubleshooting" className={styles.section}>
              <h2 className={styles.sectionTitle}>Common Questions</h2>

              <div className={styles.faqList}>
                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Do I need to create an account?</h3>
                  <p className={styles.faqAnswer}>
                    No. Tallow doesn't require any account or registration. Just open the app and start
                    transferring. You remain anonymous.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>How large can files be?</h3>
                  <p className={styles.faqAnswer}>
                    There's no hard limit. You can transfer files from a few KB to multiple GB. Speed
                    depends on your network connection.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Can I cancel a transfer?</h3>
                  <p className={styles.faqAnswer}>
                    Yes. Both the sender and receiver can cancel at any time. If cancelled before
                    completion, partial files are cleaned up.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Is my WiFi password at risk?</h3>
                  <p className={styles.faqAnswer}>
                    No. Tallow only transfers files. It doesn't access network credentials or require
                    any special network permissions.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>What if the transfer fails?</h3>
                  <p className={styles.faqAnswer}>
                    Tallow has resumable transfers. If the connection drops, simply try again and it will
                    resume from where it left off (when available).
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Can I transfer folders?</h3>
                  <p className={styles.faqAnswer}>
                    Yes. You can drag and drop entire folders. Tallow preserves the folder structure on
                    the receiving device.
                  </p>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section className={styles.nextSteps}>
              <h2 className={styles.nextStepsTitle}>You're Ready!</h2>
              <p className={styles.nextStepsDescription}>
                You now know how to use Tallow. Ready to try your first transfer?
              </p>

              <div className={styles.nextStepsActions}>
                <Link href="/transfer" className={styles.primaryAction}>
                  <span>Open Tallow</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides/local-transfer" className={styles.secondaryAction}>
                  <span>Learn More: Local Network Transfer</span>
                  <ArrowRight />
                </Link>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div className={styles.navigationContainer}>
            <Link href="/docs/guides" className={styles.navPrevious}>
              <ArrowLeft />
              <span>Back to Guides</span>
            </Link>
            <Link href="/docs/guides/local-transfer" className={styles.navNext}>
              <span>Next: Local Network Transfer</span>
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
