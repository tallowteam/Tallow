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
  AlertTriangle,
} from '@/components/icons';
import styles from './page.module.css';

export default function LocalTransferGuide() {
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
              <span>Local Network Transfer</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Local Network File Transfer</h1>
            <p className={styles.heroDescription}>
              Learn how to securely transfer files between devices on the same network.
              Fast, reliable, and no internet required.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>8 min read</span>
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
                  <a href="#requirements">Prerequisites</a>
                </li>
                <li>
                  <a href="#setup">Setting Up</a>
                </li>
                <li>
                  <a href="#transfer-steps">Transfer Steps</a>
                </li>
                <li>
                  <a href="#optimization">Performance Tips</a>
                </li>
                <li>
                  <a href="#troubleshooting">Troubleshooting</a>
                </li>
              </ul>
            </nav>

            {/* Requirements */}
            <section id="requirements" className={styles.section}>
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p className={styles.sectionDescription}>
                Local network transfers require minimal setup. Make sure you have everything ready.
              </p>

              <div className={styles.requirementsList}>
                <div className={styles.requirement}>
                  <CheckCircle className={styles.requirementIcon} />
                  <div>
                    <h3 className={styles.requirementTitle}>Same Network</h3>
                    <p className={styles.requirementText}>
                      Both devices must be connected to the same WiFi or Ethernet network. They don't
                      need to be in the same room.
                    </p>
                  </div>
                </div>

                <div className={styles.requirement}>
                  <CheckCircle className={styles.requirementIcon} />
                  <div>
                    <h3 className={styles.requirementTitle}>Tallow Running</h3>
                    <p className={styles.requirementText}>
                      Open Tallow on both the sending and receiving device. The app must be running to
                      receive transfers.
                    </p>
                  </div>
                </div>

                <div className={styles.requirement}>
                  <CheckCircle className={styles.requirementIcon} />
                  <div>
                    <h3 className={styles.requirementTitle}>mDNS Enabled (Usually Default)</h3>
                    <p className={styles.requirementText}>
                      Tallow uses mDNS (multicast DNS) to discover devices. Most home/office networks
                      have this enabled by default.
                    </p>
                  </div>
                </div>

                <div className={styles.requirement}>
                  <CheckCircle className={styles.requirementIcon} />
                  <div>
                    <h3 className={styles.requirementTitle}>No Firewall Blocking</h3>
                    <p className={styles.requirementText}>
                      Ensure your firewall or antivirus doesn't block Tallow. See troubleshooting for
                      common firewall issues.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutInfo}>
                <Info className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Router Tip</p>
                  <p className={styles.calloutText}>
                    If devices still don't see each other after waiting 10 seconds, your router might
                    disable mDNS. Try connecting to a different network or see troubleshooting section.
                  </p>
                </div>
              </div>
            </section>

            {/* Setup */}
            <section id="setup" className={styles.section}>
              <h2 className={styles.sectionTitle}>Setting Up</h2>
              <p className={styles.sectionDescription}>
                Local network setup is automatic. Just open Tallow and wait for device discovery.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Open Tallow on Both Devices</h3>
                    <p className={styles.stepDescription}>
                      Launch Tallow on your first device (sender) and second device (receiver). Both
                      should be on the same WiFi network.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Wait for Discovery</h3>
                    <p className={styles.stepDescription}>
                      Tallow automatically searches for other devices. This usually takes 2-5 seconds.
                      Look for device names in the list.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Verify Device Names</h3>
                    <p className={styles.stepDescription}>
                      You should see the other device listed with a friendly name. If not, check the
                      troubleshooting section.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Customize Names (Optional)</h3>
                    <p className={styles.stepDescription}>
                      Go to settings to rename your devices with descriptive names like "Home Laptop" or
                      "Bedroom Desktop".
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Transfer Steps */}
            <section id="transfer-steps" className={styles.section}>
              <h2 className={styles.sectionTitle}>Performing a Transfer</h2>
              <p className={styles.sectionDescription}>
                Once devices are discovered, transferring files is a simple 3-step process.
              </p>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Select Files</h3>
                    <p className={styles.stepDescription}>
                      Click the "+" button or drag-and-drop files/folders into Tallow. You can select
                      multiple files at once.
                    </p>
                    <ul className={styles.supportedList}>
                      <li>Individual files (any size)</li>
                      <li>Multiple files (selected at once)</li>
                      <li>Entire folders (preserves structure)</li>
                      <li>Mixed files and folders</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Choose Destination Device</h3>
                    <p className={styles.stepDescription}>
                      From the device list, click on the device you want to send to. It will be
                      highlighted.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Confirm on Receiving Device</h3>
                    <p className={styles.stepDescription}>
                      The receiving device will show a notification with:
                    </p>
                    <ul className={styles.supportedList}>
                      <li>Sending device name</li>
                      <li>File names and total size</li>
                      <li>Accept or Reject buttons</li>
                    </ul>
                    <p className={styles.stepDescription}>
                      Click "Accept" to start the transfer. Files arrive in your download folder.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutSuccess}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Parallel Transfers</p>
                  <p className={styles.calloutText}>
                    You can send multiple files to different devices simultaneously. Each transfer runs
                    independently.
                  </p>
                </div>
              </div>
            </section>

            {/* Optimization */}
            <section id="optimization" className={styles.section}>
              <h2 className={styles.sectionTitle}>Performance Tips</h2>
              <p className={styles.sectionDescription}>
                Get the fastest possible transfer speeds with these optimization tips.
              </p>

              <div className={styles.tipsGrid}>
                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Use 5GHz WiFi</h3>
                  <p className={styles.tipText}>
                    If your router supports dual-band WiFi, connect to the 5GHz band for faster speeds.
                    2.4GHz has more interference.
                  </p>
                </div>

                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Minimize Network Activity</h3>
                  <p className={styles.tipText}>
                    Pause large downloads or video streams on other devices to free up bandwidth for
                    faster transfers.
                  </p>
                </div>

                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Close to Router</h3>
                  <p className={styles.tipText}>
                    Move closer to the router or WiFi access point for a stronger signal and more stable
                    connection.
                  </p>
                </div>

                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Use Ethernet if Possible</h3>
                  <p className={styles.tipText}>
                    Wired Ethernet connections are faster and more reliable than WiFi. Use for the
                    largest transfers.
                  </p>
                </div>

                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Batch Multiple Files</h3>
                  <p className={styles.tipText}>
                    Sending one large batch transfer is faster than multiple small transfers due to
                    connection setup overhead.
                  </p>
                </div>

                <div className={styles.tipCard}>
                  <h3 className={styles.tipTitle}>Monitor Connection Quality</h3>
                  <p className={styles.tipText}>
                    Tallow shows connection quality indicators. A stable connection means faster, more
                    reliable transfers.
                  </p>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className={styles.section}>
              <h2 className={styles.sectionTitle}>Troubleshooting</h2>
              <p className={styles.sectionDescription}>
                Common issues and how to fix them.
              </p>

              <div className={styles.troubleshootingList}>
                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Device Not Appearing
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Check network:</strong> Verify both devices are on the same WiFi
                        network by checking Settings.
                      </li>
                      <li>
                        <strong>Restart Tallow:</strong> Close and reopen Tallow on both devices. Wait
                        10 seconds for discovery.
                      </li>
                      <li>
                        <strong>Check firewall:</strong> Temporarily disable firewall/antivirus to test if
                        it's blocking mDNS (port 5353).
                      </li>
                      <li>
                        <strong>Restart router:</strong> Power cycle your router and wait 30 seconds for
                        it to fully restart.
                      </li>
                      <li>
                        <strong>Check mDNS:</strong> Some corporate networks disable mDNS. Try on a
                        personal network.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertTriangle className={styles.troubleIcon} />
                    Transfer Slow
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Check network congestion:</strong> Pause other downloads on your network.
                      </li>
                      <li>
                        <strong>Check signal strength:</strong> Look at WiFi signal indicator. Move closer
                        to router if weak.
                      </li>
                      <li>
                        <strong>Try 5GHz band:</strong> If on 2.4GHz, switch to 5GHz for faster speeds.
                      </li>
                      <li>
                        <strong>Use Ethernet:</strong> Wired connections are much faster than WiFi.
                      </li>
                      <li>
                        <strong>Check CPU usage:</strong> High CPU usage on either device can slow
                        transfers. Close other apps.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Transfer Disconnects
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Check connection:</strong> Verify you still have network connectivity
                        between devices.
                      </li>
                      <li>
                        <strong>WiFi stability:</strong> WiFi can be unstable. Try using Ethernet for the
                        receiving device.
                      </li>
                      <li>
                        <strong>Resume transfer:</strong> Tallow supports resumable transfers. Try again
                        and it should pick up where it left off.
                      </li>
                      <li>
                        <strong>Check firewall:</strong> Firewall interruptions might block ongoing
                        transfers. Whitelist Tallow.
                      </li>
                      <li>
                        <strong>Router issues:</strong> Some routers timeout idle connections. Try again
                        with continuous network activity.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Firewall Issues
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Windows Defender:</strong> Add Tallow to exclusions in Windows Defender
                        Firewall.
                      </li>
                      <li>
                        <strong>macOS:</strong> Check System Preferences &gt; Security &amp; Privacy &gt;
                        Firewall Options.
                      </li>
                      <li>
                        <strong>Third-party firewall:</strong> Whitelist Tallow ports (default uses
                        dynamic ports).
                      </li>
                      <li>
                        <strong>mDNS blocking:</strong> Some firewalls block port 5353 (mDNS). Try
                        enabling mDNS in firewall settings.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.troubleItem}>
                  <h3 className={styles.troubleTitle}>
                    <AlertCircle className={styles.troubleIcon} />
                    Files Not Received
                  </h3>
                  <div className={styles.troubleSolutions}>
                    <h4>Solutions:</h4>
                    <ul>
                      <li>
                        <strong>Check download folder:</strong> Files go to your Downloads folder by
                        default. Check there first.
                      </li>
                      <li>
                        <strong>Verify transfer completed:</strong> Look at transfer history or progress
                        panel for status.
                      </li>
                      <li>
                        <strong>Check disk space:</strong> Ensure receiving device has enough free disk
                        space.
                      </li>
                      <li>
                        <strong>File permissions:</strong> Verify you have write permissions to the
                        download folder.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className={styles.callout + ' ' + styles.calloutWarning}>
                <AlertCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Still having issues?</p>
                  <p className={styles.calloutText}>
                    Check the{' '}
                    <Link href="/docs/troubleshooting" style={{ color: 'inherit', textDecoration: 'underline' }}>
                      troubleshooting guide
                    </Link>
                    {' '}for more help, or reach out to the community on GitHub.
                  </p>
                </div>
              </div>
            </section>

            {/* Related Topics */}
            <section className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>Related Topics</h2>
              <div className={styles.relatedLinks}>
                <Link href="/docs/guides/getting-started" className={styles.relatedLink}>
                  <span>Getting Started</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides/internet-transfer" className={styles.relatedLink}>
                  <span>Internet P2P Transfers</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides/security" className={styles.relatedLink}>
                  <span>Security Guide</span>
                  <ArrowRight />
                </Link>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div className={styles.navigationContainer}>
            <Link href="/docs/guides/getting-started" className={styles.navPrevious}>
              <ArrowLeft />
              <span>Previous: Getting Started</span>
            </Link>
            <Link href="/docs/guides/internet-transfer" className={styles.navNext}>
              <span>Next: Internet Transfer</span>
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
