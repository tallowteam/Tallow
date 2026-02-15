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

export default function AdvancedFeaturesGuide() {
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
              <span>Advanced Features</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Advanced Features</h1>
            <p className={styles.heroDescription}>
              Unlock Tallow&#39;s full power with batch operations, scheduling, clipboard sync, and more.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>12 min read</span>
              <span className={styles.badge}>Advanced</span>
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
                  <a className={styles.tocLink} href="#batch-operations">Batch Operations</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#scheduled-transfers">Scheduled Transfers</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#clipboard-sync">Clipboard Sync</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#delta-sync">Delta Sync</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#transfer-templates">Transfer Templates</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#watched-folders">Watched Folders</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#file-requests">File Requests</a>
                </li>
                <li>
                  <a className={styles.tocLink} href="#voice-memos">Voice Memos</a>
                </li>
              </ul>
            </nav>

            {/* ============================================
                Section 1 — Batch Operations
                ============================================ */}
            <section id="batch-operations" className={styles.section}>
              <h2 className={styles.sectionTitle}>Batch Operations</h2>
              <p className={styles.sectionDescription}>
                Select multiple files at once and apply operations in bulk. Batch mode saves time when
                you need to transfer, rename, compress, or filter dozens of files.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x2611;&#xFE0F;</div>
                  <h3 className={styles.featureTitle}>Multi-Select</h3>
                  <p className={styles.featureText}>
                    Hold Ctrl or Shift to select multiple files, or use the &quot;Select All&quot; toggle to
                    grab everything in a directory at once.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x270F;&#xFE0F;</div>
                  <h3 className={styles.featureTitle}>Batch Rename</h3>
                  <p className={styles.featureText}>
                    Apply rename rules across all selected files. Use patterns like adding prefixes,
                    suffixes, sequential numbering, or find-and-replace.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F50D;</div>
                  <h3 className={styles.featureTitle}>Filter by Type &amp; Size</h3>
                  <p className={styles.featureText}>
                    Quickly filter your selection by file type (images, documents, videos) or size
                    threshold to focus on exactly what you need.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4E6;</div>
                  <h3 className={styles.featureTitle}>Batch Compress</h3>
                  <p className={styles.featureText}>
                    Compress all selected files before transfer using Brotli, LZ4, or Zstandard. Reduce
                    transfer time without touching individual files.
                  </p>
                </div>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Select your files</h3>
                    <p className={styles.stepText}>
                      Open the transfer panel and click the batch toggle in the toolbar. Select files
                      individually or use the filter controls to auto-select by type.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Apply batch rules</h3>
                    <p className={styles.stepText}>
                      Open the batch rule editor to add rename patterns, compression settings, or
                      size filters. Rules apply to every file in the selection.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Send in one click</h3>
                    <p className={styles.stepText}>
                      Hit &quot;Send All&quot; to queue every file for transfer. A batch progress panel tracks
                      each file individually so you know exactly where things stand.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Pro Tip</p>
                  <p className={styles.calloutText}>
                    Combine batch rename with batch compress to prepare files for archival before
                    transferring them to a backup device.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 2 — Scheduled Transfers
                ============================================ */}
            <section id="scheduled-transfers" className={styles.section}>
              <h2 className={styles.sectionTitle}>Scheduled Transfers</h2>
              <p className={styles.sectionDescription}>
                Set a future time to auto-send files. Ideal for overnight backups, timed deliveries,
                or syncing during off-peak hours.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x23F0;</div>
                  <h3 className={styles.featureTitle}>One-Time Schedule</h3>
                  <p className={styles.featureText}>
                    Pick a date and time. Tallow queues the transfer and fires it automatically when
                    the moment arrives.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F501;</div>
                  <h3 className={styles.featureTitle}>Recurring Schedules</h3>
                  <p className={styles.featureText}>
                    Set daily, weekly, or custom recurring schedules. Perfect for automated backups
                    or periodic data syncs.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4A1;</div>
                  <h3 className={styles.featureTitle}>Wake-on-Send</h3>
                  <p className={styles.featureText}>
                    If the receiving device supports Wake-on-LAN, Tallow can wake it before the
                    scheduled transfer begins.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Keep Tallow Running</p>
                  <p className={styles.calloutText}>
                    Scheduled transfers require Tallow to be running (or the background service
                    active) when the scheduled time arrives. If the app is closed, the transfer will
                    fire the next time Tallow starts.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 3 — Clipboard Sync
                ============================================ */}
            <section id="clipboard-sync" className={styles.section}>
              <h2 className={styles.sectionTitle}>Clipboard Sync</h2>
              <p className={styles.sectionDescription}>
                Copy on one device, paste on another. Clipboard sync works with text, images, and
                even small files &mdash; all end-to-end encrypted.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4CB;</div>
                  <h3 className={styles.featureTitle}>Universal Clipboard</h3>
                  <p className={styles.featureText}>
                    Copy text or images on your laptop and paste directly on your phone (or vice
                    versa). No manual transfer steps required.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F512;</div>
                  <h3 className={styles.featureTitle}>Encrypted &amp; Opt-In</h3>
                  <p className={styles.featureText}>
                    Clipboard data is encrypted before it leaves your device. The feature is opt-in
                    only &mdash; you decide which devices share a clipboard.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4C4;</div>
                  <h3 className={styles.featureTitle}>Text, Images &amp; Files</h3>
                  <p className={styles.featureText}>
                    Supports plain text, rich text, images, and small files. Large clipboard items
                    are automatically chunked and streamed.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Privacy First</p>
                  <p className={styles.calloutText}>
                    Unlike cloud clipboard services, Tallow clipboard sync is peer-to-peer. Your
                    clipboard data never touches a server.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 4 — Delta Sync
                ============================================ */}
            <section id="delta-sync" className={styles.section}>
              <h2 className={styles.sectionTitle}>Delta Sync</h2>
              <p className={styles.sectionDescription}>
                Only send the bytes that changed. Delta sync dramatically reduces transfer time for
                large files that change incrementally.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x26A1;</div>
                  <h3 className={styles.featureTitle}>Hash-Based Diff</h3>
                  <p className={styles.featureText}>
                    Tallow splits files into chunks and hashes each one. Only chunks that differ from
                    the previous version are sent over the wire.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4BE;</div>
                  <h3 className={styles.featureTitle}>Great for Large Files</h3>
                  <p className={styles.featureText}>
                    Perfect for database backups, VM images, or design files. A 2 GB file with 1%
                    changes transfers in seconds, not minutes.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F9E9;</div>
                  <h3 className={styles.featureTitle}>Automatic Detection</h3>
                  <p className={styles.featureText}>
                    When both sender and receiver have a previous version, delta sync activates
                    automatically. No configuration needed.
                  </p>
                </div>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Initial transfer</h3>
                    <p className={styles.stepText}>
                      The first transfer sends the full file. Tallow stores chunk hashes locally for
                      future comparisons.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Subsequent transfers</h3>
                    <p className={styles.stepText}>
                      On the next transfer, Tallow compares chunk hashes. Only new or modified chunks
                      are sent, dramatically reducing bandwidth.
                    </p>
                  </div>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Reassembly</h3>
                    <p className={styles.stepText}>
                      The receiver combines cached chunks with incoming deltas to reconstruct the
                      full, updated file.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>When to Use Delta Sync</p>
                  <p className={styles.calloutText}>
                    Delta sync shines for files you transfer repeatedly &mdash; project archives, database
                    dumps, disk images. For one-off transfers it behaves like a normal send.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 5 — Transfer Templates
                ============================================ */}
            <section id="transfer-templates" className={styles.section}>
              <h2 className={styles.sectionTitle}>Transfer Templates</h2>
              <p className={styles.sectionDescription}>
                Save frequently-used configurations &mdash; recipients, compression level, encryption
                options &mdash; as reusable templates. Apply them in one click.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4D1;</div>
                  <h3 className={styles.featureTitle}>Save Configurations</h3>
                  <p className={styles.featureText}>
                    After setting up a transfer, click &quot;Save as Template.&quot; Give it a name and it
                    appears in your template library for instant re-use.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F680;</div>
                  <h3 className={styles.featureTitle}>Quick-Apply</h3>
                  <p className={styles.featureText}>
                    Select a template from the dropdown before adding files. All settings &mdash;
                    recipient, compression, encryption &mdash; are applied automatically.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F465;</div>
                  <h3 className={styles.featureTitle}>Recipient Presets</h3>
                  <p className={styles.featureText}>
                    Templates can store default recipients. Send to your work laptop, home NAS, or a
                    team member without re-selecting every time.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Workflow Accelerator</p>
                  <p className={styles.calloutText}>
                    Combine templates with scheduled transfers for fully automated workflows. For
                    example, &quot;Nightly Backup&quot; can compress with Zstandard, send to your NAS, and
                    run every night at midnight.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 6 — Watched Folders
                ============================================ */}
            <section id="watched-folders" className={styles.section}>
              <h2 className={styles.sectionTitle}>Watched Folders</h2>
              <p className={styles.sectionDescription}>
                Monitor a folder on your device. Any new file dropped into it is automatically sent
                to a trusted device &mdash; no interaction required.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4C2;</div>
                  <h3 className={styles.featureTitle}>Auto-Send</h3>
                  <p className={styles.featureText}>
                    Designate any folder as a &quot;watched folder.&quot; New files are detected within seconds
                    and queued for transfer to your chosen device.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F91D;</div>
                  <h3 className={styles.featureTitle}>Trusted Devices Only</h3>
                  <p className={styles.featureText}>
                    Watched folders send only to devices you have explicitly trusted. Untrusted
                    devices never receive auto-sent files.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.warningCallout}`}>
                <AlertCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Be Selective</p>
                  <p className={styles.calloutText}>
                    Avoid watching high-churn folders like your Downloads directory. Use a dedicated
                    folder to prevent unintended transfers of temporary or duplicate files.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 7 — File Requests
                ============================================ */}
            <section id="file-requests" className={styles.section}>
              <h2 className={styles.sectionTitle}>File Requests</h2>
              <p className={styles.sectionDescription}>
                Request specific files from a peer device. The owner receives a notification and can
                approve or deny the request.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F4E9;</div>
                  <h3 className={styles.featureTitle}>Send a Request</h3>
                  <p className={styles.featureText}>
                    Describe the file you need (by name, type, or description). The request appears
                    as a notification on the peer device.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x2705;</div>
                  <h3 className={styles.featureTitle}>Approve &amp; Send</h3>
                  <p className={styles.featureText}>
                    The file owner reviews the request, selects the file, and approves. The transfer
                    starts immediately after approval.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F6E1;&#xFE0F;</div>
                  <h3 className={styles.featureTitle}>Always Consent-Based</h3>
                  <p className={styles.featureText}>
                    File requests never access the peer&#39;s file system directly. The owner always
                    chooses which file to share.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.infoCallout}`}>
                <Info className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Use Case</p>
                  <p className={styles.calloutText}>
                    File requests are great for collaborative workflows. Ask a teammate for the
                    latest design mockup without leaving Tallow.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================
                Section 8 — Voice Memos
                ============================================ */}
            <section id="voice-memos" className={styles.section}>
              <h2 className={styles.sectionTitle}>Voice Memos</h2>
              <p className={styles.sectionDescription}>
                Record and send short audio messages alongside your file transfers. Add context,
                instructions, or a personal touch.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F3A4;</div>
                  <h3 className={styles.featureTitle}>Quick Record</h3>
                  <p className={styles.featureText}>
                    Tap the microphone icon to record a voice memo. Release to stop. The recording
                    attaches to your current transfer automatically.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F50A;</div>
                  <h3 className={styles.featureTitle}>Inline Playback</h3>
                  <p className={styles.featureText}>
                    Recipients see an audio player inline with the transferred files. Play, pause,
                    and scrub through the memo without leaving Tallow.
                  </p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>&#x1F510;</div>
                  <h3 className={styles.featureTitle}>Encrypted Audio</h3>
                  <p className={styles.featureText}>
                    Voice memos are encrypted with the same end-to-end encryption as file transfers.
                    Only the intended recipient can listen.
                  </p>
                </div>
              </div>

              <div className={`${styles.callout} ${styles.successCallout}`}>
                <CheckCircle className={styles.calloutIcon} />
                <div className={styles.calloutContent}>
                  <p className={styles.calloutTitle}>Add Context to Transfers</p>
                  <p className={styles.calloutText}>
                    Voice memos are perfect for explaining what&#39;s in a batch of files, leaving
                    review instructions, or just saying hello.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div>
            <Link href="/settings" className={styles.navLink}>
              <span className={styles.navLabel}>
                <ArrowLeft />
                Previous
              </span>
              <span className={styles.navTitle}>Settings</span>
            </Link>
            <Link href="/docs/guides" className={styles.navLink}>
              <span className={styles.navLabel}>
                Next
                <ArrowRight />
              </span>
              <span className={styles.navTitle}>All Guides</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
