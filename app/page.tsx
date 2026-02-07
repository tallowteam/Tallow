'use client';

import Link from 'next/link';
import { Shield, Lock, Zap, Check, Upload } from '@/components/icons';
import styles from './page.module.css';

export default function LandingPage() {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className={styles.main}>
      {/* Ambient Background Blobs */}
      <div className={styles.ambientBlob1} />
      <div className={styles.ambientBlob2} />

      {/* 1. HERO SECTION — 100vh Grid 55%/45% */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          {/* Left Side — 55% */}
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.pulseDot} />
              QUANTUM-SAFE FILE TRANSFER
            </div>
            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingPrimary}>Your files.</span>
              <span className={styles.heroHeadingSecondary}>Your rules.</span>
            </h1>
            <p className={styles.heroParagraph}>
              Post-quantum encrypted. Peer-to-peer. No servers touch your files. No accounts track your activity. Just open and send.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/transfer" className={styles.btnPrimary}>
                Open App
              </Link>
              <a
                href="#features"
                className={styles.btnSecondary}
                onClick={(e) => handleSmoothScroll(e, 'features')}
              >
                See How It Works →
              </a>
            </div>
          </div>

          {/* Right Side — 45% Glass App Window */}
          <div className={styles.heroRight}>
            <div className={styles.appWindow}>
              {/* Window Chrome */}
              <div className={styles.windowChrome}>
                <div className={styles.trafficLights}>
                  <span className={styles.trafficRed} />
                  <span className={styles.trafficYellow} />
                  <span className={styles.trafficGreen} />
                </div>
                <div className={styles.urlBar}>tallow.app/transfer</div>
              </div>
              {/* Window Body */}
              <div className={styles.windowBody}>
                {/* Drop Zone */}
                <div className={styles.dropZone}>
                  <Upload />
                  <span>Drop files here or click to browse</span>
                </div>
                {/* Device Cards */}
                <div className={styles.deviceCard}>
                  <span className={styles.deviceDot} style={{ background: '#28c840' }} />
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceName}>MacBook Pro</span>
                    <span className={styles.deviceStatus}>Online</span>
                  </div>
                </div>
                <div className={styles.deviceCard}>
                  <span className={styles.deviceDot} style={{ background: '#0099ff' }} />
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceName}>iPhone 15</span>
                    <span className={styles.deviceStatus}>Nearby</span>
                  </div>
                </div>
                <div className={styles.deviceCard}>
                  <span className={styles.deviceDot} style={{ background: '#febc2e' }} />
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceName}>Pixel 8</span>
                    <span className={styles.deviceStatus}>Connecting...</span>
                  </div>
                </div>
                {/* Transfer Progress */}
                <div className={styles.transferProgress}>
                  <div className={styles.transferHeader}>
                    <span className={styles.transferFile}>presentation.pdf</span>
                    <span className={styles.transferSize}>24.7 MB</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '67%' }} />
                  </div>
                  <div className={styles.transferFooter}>
                    <span className={styles.transferSpeed}>12.4 MB/s</span>
                    <span className={styles.encryptionBadge}>ML-KEM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MARQUEE TRUST STRIP */}
      <section className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          <span className={styles.marqueeContent}>
            End-to-End Encrypted · Zero Knowledge · Open Source · Post-Quantum Safe · No File Limits · WebRTC P2P · End-to-End Encrypted · Zero Knowledge · Open Source · Post-Quantum Safe · No File Limits · WebRTC P2P · End-to-End Encrypted · Zero Knowledge · Open Source · Post-Quantum Safe · No File Limits · WebRTC P2P
          </span>
        </div>
      </section>

      {/* 3. FEATURES SECTION — 3 Alternating 50/50 Magazine Blocks */}
      <section className={styles.features} id="features">
        {/* Block 1 — Transfer (text left, visual right) */}
        <div className={styles.featureBlock}>
          <div className={styles.featureText}>
            <span className={styles.featureLabel}>01</span>
            <h2 className={styles.featureHeading}>Direct peer-to-peer transfer</h2>
            <p className={styles.featureParagraph}>
              Your files travel directly from device to device with zero intermediaries. No cloud storage, no server bottlenecks—just pure P2P speed at your network's maximum capacity. WebRTC ensures the fastest possible connection while maintaining end-to-end encryption.
            </p>
            <a href="/features" className={styles.featureLink}>Learn more →</a>
          </div>
          <div className={styles.featureVisual}>
            <div className={styles.featureCard}>
              <div className={styles.transferMockup}>
                <div className={styles.mockupHeader}>
                  <Zap />
                  <span>P2P Direct Connection</span>
                </div>
                <div className={styles.mockupDevice}>
                  <div className={styles.deviceIcon}>💻</div>
                  <div className={styles.deviceLabel}>Sender</div>
                </div>
                <div className={styles.mockupArrow}>→</div>
                <div className={styles.mockupDevice}>
                  <div className={styles.deviceIcon}>📱</div>
                  <div className={styles.deviceLabel}>Receiver</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2 — Security (visual left, text right) */}
        <div className={`${styles.featureBlock} ${styles.featureBlockReverse}`}>
          <div className={styles.featureVisual}>
            <div className={styles.featureCard}>
              <div className={styles.securityStack}>
                <div className={styles.stackItem}>
                  <Shield />
                  <span>ML-KEM-768</span>
                </div>
                <div className={styles.stackDivider} />
                <div className={styles.stackItem}>
                  <Lock />
                  <span>AES-256-GCM</span>
                </div>
                <div className={styles.stackDivider} />
                <div className={styles.stackItem}>
                  <Zap />
                  <span>WebRTC P2P</span>
                </div>
                <div className={styles.stackDivider} />
                <div className={styles.stackItem}>
                  <Check />
                  <span>Zero-Knowledge</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.featureText}>
            <span className={styles.featureLabel}>02</span>
            <h2 className={styles.featureHeading}>Post-quantum encryption</h2>
            <p className={styles.featureParagraph}>
              Protected against both current and future threats with ML-KEM-768 post-quantum cryptography. Your files are encrypted with military-grade AES-256-GCM, ensuring security that will withstand even the quantum computers of tomorrow.
            </p>
            <a href="/security" className={styles.featureLink}>Learn more →</a>
          </div>
        </div>

        {/* Block 3 — Platform (text left, visual right) */}
        <div className={styles.featureBlock}>
          <div className={styles.featureText}>
            <span className={styles.featureLabel}>03</span>
            <h2 className={styles.featureHeading}>Works everywhere</h2>
            <p className={styles.featureParagraph}>
              No apps to install, no accounts to create. Tallow runs in any modern browser—Chrome, Firefox, Safari, Edge. Desktop, mobile, tablet. Windows, macOS, Linux, iOS, Android. One codebase, infinite compatibility.
            </p>
            <a href="/about" className={styles.featureLink}>Learn more →</a>
          </div>
          <div className={styles.featureVisual}>
            <div className={styles.featureCard}>
              <div className={styles.platformGrid}>
                <div className={styles.platformIcon}>🌐</div>
                <div className={styles.platformIcon}>💻</div>
                <div className={styles.platformIcon}>📱</div>
                <div className={styles.platformIcon}>🖥️</div>
              </div>
              <div className={styles.platformLabels}>
                <span>Browser</span>
                <span>Desktop</span>
                <span>Mobile</span>
                <span>Tablet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PULL QUOTE */}
      <section className={styles.pullQuote}>
        <div className={styles.quoteAccent} />
        <blockquote className={styles.quote}>
          Privacy isn't a feature. It's a fundamental right.
        </blockquote>
      </section>

      {/* 5. STATS SECTION — 4 Inline Blocks */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>256</div>
            <div className={styles.statLabel}>Bit Encryption</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Servers Involved</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>P2P</div>
            <div className={styles.statLabel}>Direct Transfer</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>∞</div>
            <div className={styles.statLabel}>No File Limits</div>
          </div>
        </div>
      </section>

      {/* 6. CTA SECTION — 50/50 Grid */}
      <section className={styles.cta}>
        <div className={styles.ctaGrid}>
          <div className={styles.ctaLeft}>
            <h2 className={styles.ctaHeading}>Ready to take control of your files?</h2>
          </div>
          <div className={styles.ctaRight}>
            <p className={styles.ctaParagraph}>
              No signup required. No credit card needed. No tracking. Just open Tallow in your browser and start sharing files the way it should be—secure, private, and directly between devices.
            </p>
            <Link href="/transfer" className={styles.ctaButton}>
              Open Tallow →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
