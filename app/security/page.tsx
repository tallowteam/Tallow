import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Security — Tallow',
  description: 'Post-quantum encryption runs silently on every transfer. No toggles, no upgrades, no premium tier.',
};

export default function SecurityPage() {
  return (
    <main className={styles.main}>
      {/* Ambient gradient blobs */}
      <div className={styles.ambient}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.heroLabel}>SECURITY</span>
        <h1 className={styles.heroHeading}>Security you don&apos;t configure</h1>
        <p className={styles.heroSubtitle}>
          Post-quantum encryption runs silently on every transfer. No toggles, no upgrades, no premium tier.
        </p>
      </section>

      {/* Encryption Stack — Centered glass card */}
      <section className={styles.stackSection}>
        <div className={styles.stackCard}>
          <h2 className={styles.stackTitle}>ENCRYPTION STACK</h2>
          <div className={styles.stackRows}>
            <div className={styles.stackRow}>
              <span className={styles.stackLabel}>Key Exchange</span>
              <span className={styles.stackTag}>ML-KEM-768</span>
            </div>
            <div className={styles.stackRow}>
              <span className={styles.stackLabel}>Symmetric Cipher</span>
              <span className={styles.stackTag}>AES-256-GCM</span>
            </div>
            <div className={styles.stackRow}>
              <span className={styles.stackLabel}>Transport</span>
              <span className={styles.stackTag}>WebRTC DTLS-SRTP</span>
            </div>
            <div className={styles.stackRow}>
              <span className={styles.stackLabel}>Forward Secrecy</span>
              <span className={styles.stackTag}>Per-Session Keys</span>
            </div>
            <div className={styles.stackRow}>
              <span className={styles.stackLabel}>Architecture</span>
              <span className={styles.stackTag}>Zero-Knowledge</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1 — Post-Quantum Key Exchange (text left, visual right) */}
      <section className={styles.deepDive}>
        <div className={styles.deepDiveText}>
          <h2 className={styles.deepDiveHeading}>ML-KEM-768</h2>
          <p className={styles.deepDiveBody}>
            Module-Lattice Key Encapsulation Mechanism provides 192-bit security against both classical and quantum attacks. NIST standardized in 2024. Every key exchange in Tallow uses ML-KEM.
          </p>
        </div>
        <div className={styles.deepDiveVisual}>
          <div className={styles.visualCard}>
            <div className={styles.flowDiagram}>
              <div className={styles.flowStep}>
                <div className={styles.flowIcon}>A</div>
                <span className={styles.flowLabel}>Alice</span>
              </div>
              <div className={styles.flowArrow}>
                <svg viewBox="0 0 60 20" fill="none">
                  <path d="M0 10 L50 10 M50 10 L45 5 M50 10 L45 15" stroke="var(--accent-2)" strokeWidth="1.5" />
                </svg>
                <span className={styles.flowTag}>Encapsulate</span>
              </div>
              <div className={styles.flowStep}>
                <div className={styles.flowIcon}>B</div>
                <span className={styles.flowLabel}>Bob</span>
              </div>
            </div>
            <div className={styles.visualCaption}>768-dimension lattice</div>
          </div>
        </div>
      </section>

      {/* Section 2 — Symmetric Encryption (visual left, text right) */}
      <section className={`${styles.deepDive} ${styles.deepDiveReverse}`}>
        <div className={styles.deepDiveVisual}>
          <div className={styles.visualCard}>
            <div className={styles.flowDiagram}>
              <div className={styles.flowStep}>
                <div className={styles.flowIcon}>P</div>
                <span className={styles.flowLabel}>Plaintext</span>
              </div>
              <div className={styles.flowArrow}>
                <svg viewBox="0 0 60 20" fill="none">
                  <path d="M0 10 L50 10 M50 10 L45 5 M50 10 L45 15" stroke="var(--accent-2)" strokeWidth="1.5" />
                </svg>
                <span className={styles.flowTag}>AES-256-GCM</span>
              </div>
              <div className={styles.flowStep}>
                <div className={styles.flowIcon}>C</div>
                <span className={styles.flowLabel}>Ciphertext</span>
              </div>
            </div>
            <div className={styles.visualCaption}>+ Auth Tag</div>
          </div>
        </div>
        <div className={styles.deepDiveText}>
          <h2 className={styles.deepDiveHeading}>AES-256-GCM</h2>
          <p className={styles.deepDiveBody}>
            After quantum-safe key exchange, all file data is encrypted with AES-256 in Galois/Counter Mode. Authenticated encryption ensures both confidentiality and integrity.
          </p>
        </div>
      </section>

      {/* Section 3 — Direct Transport (text left, visual right) */}
      <section className={styles.deepDive}>
        <div className={styles.deepDiveText}>
          <h2 className={styles.deepDiveHeading}>WebRTC P2P</h2>
          <p className={styles.deepDiveBody}>
            Files travel directly between devices over WebRTC data channels with DTLS-SRTP encryption. No relay servers. No cloud storage. Your files never leave the peer-to-peer tunnel.
          </p>
        </div>
        <div className={styles.deepDiveVisual}>
          <div className={styles.visualCard}>
            <div className={styles.p2pDiagram}>
              <div className={styles.p2pDevice}>
                <div className={styles.p2pDeviceIcon}>D1</div>
                <span className={styles.p2pDeviceLabel}>Device 1</span>
              </div>
              <div className={styles.p2pConnection}>
                <div className={styles.p2pLine} />
                <span className={styles.p2pConnectionLabel}>Direct P2P</span>
              </div>
              <div className={styles.p2pDevice}>
                <div className={styles.p2pDeviceIcon}>D2</div>
                <span className={styles.p2pDeviceLabel}>Device 2</span>
              </div>
            </div>
            <div className={styles.noServer}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
              </svg>
              <span>No Server</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Zero Knowledge (visual left, text right) */}
      <section className={`${styles.deepDive} ${styles.deepDiveReverse}`}>
        <div className={styles.deepDiveVisual}>
          <div className={styles.visualCard}>
            <div className={styles.zkDiagram}>
              <div className={styles.zkRow}>
                <div className={styles.zkBox}>Client 1</div>
                <div className={styles.zkArrow}>
                  <svg viewBox="0 0 40 20" fill="none">
                    <path d="M0 10 L30 10 M30 10 L25 5 M30 10 L25 15" stroke="var(--accent-2)" strokeWidth="1.5" />
                  </svg>
                  <span className={styles.zkLabel}>encrypted</span>
                </div>
                <div className={styles.zkBox}>Signaling</div>
                <div className={styles.zkArrow}>
                  <svg viewBox="0 0 40 20" fill="none">
                    <path d="M0 10 L30 10 M30 10 L25 5 M30 10 L25 15" stroke="var(--accent-2)" strokeWidth="1.5" />
                  </svg>
                  <span className={styles.zkLabel}>encrypted</span>
                </div>
                <div className={styles.zkBox}>Client 2</div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.deepDiveText}>
          <h2 className={styles.deepDiveHeading}>Zero-Knowledge Architecture</h2>
          <p className={styles.deepDiveBody}>
            Tallow&apos;s signaling server facilitates peer discovery but never sees file content, metadata, or encryption keys. Even if compromised, the server learns nothing about your transfers.
          </p>
        </div>
      </section>

      {/* Open Source Audit */}
      <section className={styles.openSource}>
        <h2 className={styles.openSourceHeading}>Trust through transparency</h2>
        <p className={styles.openSourceBody}>
          Every line of Tallow&apos;s code is open source and auditable. We believe security should be verifiable, not just promised.
        </p>
        <Link href="https://github.com/tallow-app/tallow" className={styles.githubButton}>
          View on GitHub →
        </Link>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaHeading}>Ready to transfer securely?</h2>
        <Link href="/transfer" className={styles.ctaButton}>
          Open Tallow →
        </Link>
      </section>
    </main>
  );
}
