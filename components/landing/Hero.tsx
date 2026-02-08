import Link from 'next/link';
import styles from './hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <span className={styles.label}>QUANTUM-SAFE FILE TRANSFER</span>
            <h1 className={styles.headline}>
              Your files deserve better than the cloud.
            </h1>
            <p className={styles.description}>
              Tallow sends files directly between devices using peer-to-peer technology with post-quantum encryption. No servers. No accounts. No compromise.
            </p>
            <Link href="/transfer" className={styles.cta}>
              Start Transferring →
            </Link>
          </div>

          <div className={styles.visual}>
            <div className={styles.glassCard}>
              <div className={styles.transferSim}>
                <div className={styles.recipient}>Sending to Silent Falcon</div>

                <div className={styles.fileInfo}>
                  <div className={styles.fileIcon}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M20 2H8C6.9 2 6 2.9 6 4V28C6 29.1 6.9 30 8 30H24C25.1 30 26 29.1 26 28V8L20 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 2V8H26"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 18H20M12 22H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className={styles.fileDetails}>
                    <div className={styles.fileName}>presentation.pdf</div>
                    <div className={styles.fileSize}>24.8 MB</div>
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressBar} />
                  </div>
                  <div className={styles.progressInfo}>
                    12.4 MB/s — PQC Encrypted
                  </div>
                </div>

                <div className={styles.completeBadge}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.2" />
                    <path
                      d="M5 8L7 10L11 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Transfer Complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
