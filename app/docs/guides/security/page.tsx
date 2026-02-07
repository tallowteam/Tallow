'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
} from '@/components/icons';
import styles from './page.module.css';

export default function SecurityGuide() {
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
              <span>Security Guide</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Security and Privacy Guide</h1>
            <p className={styles.heroDescription}>
              Understand how Tallow protects your files. Learn about end-to-end encryption,
              post-quantum cryptography, and privacy-first design in plain English.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>12 min read</span>
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
                  <a href="#e2e-encryption">End-to-End Encryption</a>
                </li>
                <li>
                  <a href="#pqc">Post-Quantum Cryptography</a>
                </li>
                <li>
                  <a href="#privacy">Privacy Features</a>
                </li>
                <li>
                  <a href="#comparison">Comparison with Others</a>
                </li>
                <li>
                  <a href="#best-practices">Best Practices</a>
                </li>
              </ul>
            </nav>

            {/* E2E Encryption */}
            <section id="e2e-encryption" className={styles.section}>
              <h2 className={styles.sectionTitle}>End-to-End Encryption (E2E)</h2>
              <p className={styles.sectionDescription}>
                End-to-end encryption is the foundation of Tallow's security. Here's how it works
                in plain language.
              </p>

              <div className={styles.conceptBox}>
                <h3 className={styles.conceptTitle}>What is End-to-End Encryption?</h3>
                <p className={styles.conceptText}>
                  When you send a file with Tallow, it's encrypted on your device using a cryptographic
                  key. Only the receiving device, which has the matching key, can decrypt and read the
                  file. Everything in between—internet providers, routers, relay servers—sees only
                  scrambled, unreadable data.
                </p>
              </div>

              <div className={styles.flowVisual}>
                <div className={styles.flowBox}>
                  <div className={styles.flowIcon}>📁</div>
                  <div className={styles.flowLabel}>Your File</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>
                  <div className={styles.flowIcon}>🔐</div>
                  <div className={styles.flowLabel}>Encrypted</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>
                  <div className={styles.flowIcon}>☁️</div>
                  <div className={styles.flowLabel}>Internet</div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>
                  <div className={styles.flowIcon}>🔓</div>
                  <div className={styles.flowLabel}>Decrypted</div>
                </div>
              </div>

              <h3 className={styles.subsectionTitle}>Key Exchange</h3>
              <p className={styles.subsectionText}>
                Both devices need to establish a shared secret key for encryption. Tallow uses a
                process called the Diffie-Hellman key exchange, which is designed so that:
              </p>
              <ul className={styles.featureList}>
                <li>Keys are generated independently on each device</li>
                <li>Devices share only public parts, never the secret</li>
                <li>Both devices compute the same shared secret</li>
                <li>Even if an attacker sees all communications, they can't derive the secret</li>
              </ul>

              <h3 className={styles.subsectionTitle}>File Encryption Details</h3>
              <p className={styles.subsectionText}>
                Files are encrypted using ChaCha20-Poly1305, a modern AEAD (Authenticated Encryption
                with Associated Data) cipher that:
              </p>
              <ul className={styles.featureList}>
                <li>Encrypts your data so only the recipient can read it</li>
                <li>Authenticates the data to ensure it hasn't been tampered with</li>
                <li>Is extremely fast and secure</li>
                <li>Is used by millions of security professionals worldwide</li>
              </ul>

              <div className={styles.callout + ' ' + styles.calloutSuccess}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Military Grade</p>
                  <p className={styles.calloutText}>
                    The encryption Tallow uses is approved by security agencies worldwide and is the
                    same standard used for military and government communications.
                  </p>
                </div>
              </div>
            </section>

            {/* Post-Quantum Cryptography */}
            <section id="pqc" className={styles.section}>
              <h2 className={styles.sectionTitle}>Post-Quantum Cryptography</h2>
              <p className={styles.sectionDescription}>
                Tallow uses post-quantum cryptography, which means your files are protected even
                against future quantum computer attacks.
              </p>

              <h3 className={styles.subsectionTitle}>Why Post-Quantum?</h3>
              <p className={styles.subsectionText}>
                Today's encryption is unbreakable with current computers. However, quantum computers,
                when they become practical, could potentially break some modern encryption methods.
                Tallow protects you against this future threat.
              </p>

              <div className={styles.comparisonBox}>
                <div className={styles.comparisonItem}>
                  <h4 className={styles.comparisonItemTitle}>Current Computers</h4>
                  <p className={styles.comparisonItemText}>
                    Breaking today's encryption would take billions of years, even with the fastest
                    supercomputers.
                  </p>
                </div>

                <div className={styles.comparisonItem}>
                  <h4 className={styles.comparisonItemTitle}>Future Quantum Computers</h4>
                  <p className={styles.comparisonItemText}>
                    Quantum computers could break some encryption in hours or days. Post-quantum
                    encryption resists even quantum computers.
                  </p>
                </div>
              </div>

              <h3 className={styles.subsectionTitle}>Kyber-1024 Algorithm</h3>
              <p className={styles.subsectionText}>
                Tallow uses Kyber-1024, which is:
              </p>
              <ul className={styles.featureList}>
                <li>
                  <strong>NIST Standardized:</strong> Selected by the US National Institute of Standards
                  and Technology (NIST) as secure for the quantum era
                </li>
                <li>
                  <strong>Hybrid Secure:</strong> Combines classical and quantum-resistant encryption,
                  so it's secure against both current and quantum computers
                </li>
                <li>
                  <strong>Fast:</strong> Quantum-resistant encryption is fast and efficient
                </li>
                <li>
                  <strong>Approved:</strong> Endorsed by cryptographers, governments, and security experts
                </li>
              </ul>

              <div className={styles.callout + ' ' + styles.calloutInfo}>
                <Shield className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Future-Proof Protection</p>
                  <p className={styles.calloutText}>
                    Files you send today with Tallow are protected against decryption in 10, 20, or 50
                    years, even if quantum computers exist then.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy Features */}
            <section id="privacy" className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy Features</h2>
              <p className={styles.sectionDescription}>
                Beyond encryption, Tallow includes multiple privacy-first features.
              </p>

              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🧹</div>
                  <h3 className={styles.featureTitle}>Metadata Stripping</h3>
                  <p className={styles.featureText}>
                    Optional feature that removes sensitive metadata from images and documents before
                    transfer:
                  </p>
                  <ul className={styles.featureSubList}>
                    <li>GPS location data from photos</li>
                    <li>Camera/phone model information</li>
                    <li>Document edit history</li>
                    <li>Author names and comments</li>
                    <li>Creation dates and timestamps</li>
                  </ul>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>📵</div>
                  <h3 className={styles.featureTitle}>No Server Storage</h3>
                  <p className={styles.featureText}>
                    Your files never sit on servers. They go directly from your device to the recipient:
                  </p>
                  <ul className={styles.featureSubList}>
                    <li>No files on Tallow's servers</li>
                    <li>No backups or caches</li>
                    <li>No logging of file contents</li>
                    <li>No data mining</li>
                    <li>No retention policies</li>
                  </ul>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🔐</div>
                  <h3 className={styles.featureTitle}>Device Verification</h3>
                  <p className={styles.featureText}>
                    Tallow uses device fingerprinting to ensure you're talking to the right device:
                  </p>
                  <ul className={styles.featureSubList}>
                    <li>Unique device identifiers</li>
                    <li>Digital signatures on all messages</li>
                    <li>Replay attack protection</li>
                    <li>Man-in-the-middle attack prevention</li>
                  </ul>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>👁️</div>
                  <h3 className={styles.featureTitle}>No Tracking</h3>
                  <p className={styles.featureText}>
                    Tallow doesn't track you or your transfers:
                  </p>
                  <ul className={styles.featureSubList}>
                    <li>No analytics on transfers</li>
                    <li>No IP address logging</li>
                    <li>No user profiling</li>
                    <li>No cookies or tracking pixels</li>
                    <li>No data sharing with third parties</li>
                  </ul>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🧬</div>
                  <h3 className={styles.featureTitle}>Open Source</h3>
                  <p className={styles.featureText}>
                    Tallow's code is publicly available for inspection by security researchers:
                  </p>
                  <ul className={styles.featureSubList}>
                    <li>Code auditable by anyone</li>
                    <li>No hidden backdoors possible</li>
                    <li>Peer review by security experts</li>
                    <li>Community contributions welcome</li>
                  </ul>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🗑️</div>
                  <h3 className={styles.featureTitle}>Secure Deletion</h3>
                  <p className={styles.featureText}>
                    Files are securely deleted after transfer:
                  </p>
                  <ul className={styles.featureSubList}>
                    <li>Files overwritten multiple times</li>
                    <li>Unrecoverable even with forensics</li>
                    <li>Applies to cache and temp files</li>
                    <li>Manual deletion also available</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Comparison */}
            <section id="comparison" className={styles.section}>
              <h2 className={styles.sectionTitle}>Comparison with Other Services</h2>
              <p className={styles.sectionDescription}>
                How Tallow compares to popular file sharing services.
              </p>

              <div className={styles.comparisonTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Tallow</th>
                      <th>Google Drive</th>
                      <th>Dropbox</th>
                      <th>WeTransfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>End-to-End Encryption</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.limited}>Limited</td>
                    </tr>
                    <tr>
                      <td>Post-Quantum Crypto</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                    </tr>
                    <tr>
                      <td>No Server Storage</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                    </tr>
                    <tr>
                      <td>No Account Required</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.yes}>Yes</td>
                    </tr>
                    <tr>
                      <td>No Metadata Collection</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.limited}>Limited</td>
                    </tr>
                    <tr>
                      <td>Open Source</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                    </tr>
                    <tr>
                      <td>Works Offline</td>
                      <td className={styles.yes}>Yes*</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.no}>No</td>
                    </tr>
                    <tr>
                      <td>No Data Mining</td>
                      <td className={styles.yes}>Yes</td>
                      <td className={styles.no}>No</td>
                      <td className={styles.limited}>Limited</td>
                      <td className={styles.limited}>Limited</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className={styles.tableNote}>* Tallow works on local networks without internet for file transfer.</p>

              <div className={styles.callout + ' ' + styles.calloutSuccess}>
                <CheckCircle className={styles.calloutIcon} />
                <div>
                  <p className={styles.calloutTitle}>Privacy First</p>
                  <p className={styles.calloutText}>
                    Tallow prioritizes privacy over features. You don't get cloud storage, sync, or
                    collaboration—you get secure, private file transfer.
                  </p>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section id="best-practices" className={styles.section}>
              <h2 className={styles.sectionTitle}>Security Best Practices</h2>
              <p className={styles.sectionDescription}>
                Even with strong encryption, following good security practices maximizes safety.
              </p>

              <div className={styles.bestPracticesList}>
                <div className={styles.bestPractice}>
                  <div className={styles.bestPracticeNumber}>1</div>
                  <div className={styles.bestPracticeContent}>
                    <h3 className={styles.bestPracticeTitle}>Verify Recipients</h3>
                    <p className={styles.bestPracticeText}>
                      Always confirm the recipient's identity before sending sensitive files. A room code
                      doesn't guarantee who joined—verify through a separate channel.
                    </p>
                  </div>
                </div>

                <div className={styles.bestPractice}>
                  <div className={styles.bestPracticeNumber}>2</div>
                  <div className={styles.bestPracticeContent}>
                    <h3 className={styles.bestPracticeTitle}>Share Codes Securely</h3>
                    <p className={styles.bestPracticeText}>
                      Never send room codes in unencrypted channels. Use encrypted messaging, phone calls,
                      or in-person delivery.
                    </p>
                  </div>
                </div>

                <div className={styles.bestPractice}>
                  <div className={styles.bestPracticeNumber}>3</div>
                  <div className={styles.bestPracticeContent}>
                    <h3 className={styles.bestPracticeTitle}>Enable Metadata Stripping</h3>
                    <p className={styles.bestPracticeText}>
                      For sensitive images or documents, enable metadata stripping to remove hidden
                      information like location data.
                    </p>
                  </div>
                </div>

                <div className={styles.bestPractice}>
                  <div className={styles.bestPracticeNumber}>4</div>
                  <div className={styles.bestPracticeContent}>
                    <h3 className={styles.bestPracticeTitle}>Keep Tallow Updated</h3>
                    <p className={styles.bestPracticeText}>
                      Regularly update Tallow to get the latest security patches and improvements.
                      Security is an ongoing process.
                    </p>
                  </div>
                </div>

                <div className={styles.bestPractice}>
                  <div className={styles.bestPracticeNumber}>5</div>
                  <div className={styles.bestPracticeContent}>
                    <h3 className={styles.bestPracticeTitle}>Use Strong Passwords</h3>
                    <p className={styles.bestPracticeText}>
                      If password-protecting transfers, use long, random passwords. Avoid common words
                      or personal information.
                    </p>
                  </div>
                </div>

                <div className={styles.bestPractice}>
                  <div className={styles.bestPracticeNumber}>6</div>
                  <div className={styles.bestPracticeContent}>
                    <h3 className={styles.bestPracticeTitle}>Be Careful on Shared Devices</h3>
                    <p className={styles.bestPracticeText}>
                      If using Tallow on shared computers, ensure you don't leave sensitive files in the
                      download folder.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className={styles.faqSection}>
              <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>

              <div className={styles.faqList}>
                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Can Tallow staff see my files?</h3>
                  <p className={styles.faqAnswer}>
                    No. With end-to-end encryption, files are encrypted before leaving your device.
                    Tallow's encryption is so strong that even Tallow staff cannot decrypt your files.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>What if someone intercepts my transfer?</h3>
                  <p className={styles.faqAnswer}>
                    An interceptor would see only encrypted data, not your actual files. Without the
                    encryption key (which only the recipient has), they cannot read anything.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>How long does Tallow keep file data?</h3>
                  <p className={styles.faqAnswer}>
                    Tallow doesn't store your files. Once you send a file, it goes directly to the
                    recipient and is never stored on Tallow servers. After transfer, nothing remains.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Can Tallow be hacked?</h3>
                  <p className={styles.faqAnswer}>
                    No system is unhackable, but Tallow is designed with security-first principles. E2E
                    encryption means even if servers are compromised, files remain protected.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Is the encryption backdoored?</h3>
                  <p className={styles.faqAnswer}>
                    No. Tallow uses standard, audited encryption algorithms. The code is open source so
                    researchers can verify there are no hidden backdoors.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>What about government requests?</h3>
                  <p className={styles.faqAnswer}>
                    Tallow cannot comply with requests to decrypt files because files are encrypted end-to-end.
                    Only the recipient has the decryption key. Tallow has no key to provide.
                  </p>
                </div>
              </div>
            </section>

            {/* Related Topics */}
            <section className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>Related Topics</h2>
              <div className={styles.relatedLinks}>
                <Link href="/docs/guides/internet-transfer" className={styles.relatedLink}>
                  <span>Internet Transfer Guide</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides/local-transfer" className={styles.relatedLink}>
                  <span>Local Network Transfer</span>
                  <ArrowRight />
                </Link>
                <Link href="/docs/guides" className={styles.relatedLink}>
                  <span>Back to Guides</span>
                  <ArrowRight />
                </Link>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div className={styles.navigationContainer}>
            <Link href="/docs/guides/internet-transfer" className={styles.navPrevious}>
              <ArrowLeft />
              <span>Previous: Internet Transfer</span>
            </Link>
            <Link href="/docs/guides" className={styles.navNext}>
              <span>Back to Guides</span>
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
