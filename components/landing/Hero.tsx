'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './hero.module.css';

export function Hero() {
  const [progress, setProgress] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    const animationDuration = 4000; // 4 seconds to complete
    const pauseDuration = 2000; // 2 seconds pause when complete
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const cycleTime = animationDuration + pauseDuration;
      const timeInCycle = elapsed % cycleTime;

      if (timeInCycle < animationDuration) {
        // Progress from 0 to 100 over 4 seconds
        const newProgress = (timeInCycle / animationDuration) * 100;
        setProgress(newProgress);
        setShowComplete(newProgress >= 100);
      } else {
        // Pause at 100% for 2 seconds
        setProgress(100);
        setShowComplete(true);
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

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
                    <div
                      className={styles.progressBar}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className={styles.progressInfo}>
                    12.4 MB/s — PQC Encrypted
                  </div>
                </div>

                <div className={`${styles.completeBadge} ${showComplete ? styles.visible : ''}`}>
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
