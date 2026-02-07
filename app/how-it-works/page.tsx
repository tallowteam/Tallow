import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'How It Works — Tallow',
  description: 'Learn how to transfer files with Tallow across local networks, the internet, and with friends.',
  openGraph: {
    title: 'How It Works | Tallow',
    description: 'Learn how to transfer files with Tallow across local networks, the internet, and with friends.',
    url: '/how-it-works',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | Tallow',
    description: 'Learn how to transfer files with Tallow across local networks, the internet, and with friends.',
  },
};

export default function HowItWorksPage() {
  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.label}>HOW IT WORKS</span>
        <h1 className={styles.title}>Simple by design. Powerful by nature.</h1>
        <p className={styles.subtitle}>
          Three transfer modes for every situation. All with the same end-to-end encryption.
        </p>
      </header>

      {/* Section 1: Local Network */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>LOCAL NETWORK TRANSFER</span>
          <h2 className={styles.sectionTitle}>Devices on the same network</h2>
          <p className={styles.sectionDescription}>
            The fastest way to transfer files when you&apos;re on the same Wi-Fi or Ethernet network.
            Perfect for home, office, or coffee shop transfers.
          </p>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Open Tallow</h3>
              <p className={styles.stepDescription}>
                Launch the app on both devices. They must be on the same network (Wi-Fi or Ethernet).
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Select Local Network</h3>
              <p className={styles.stepDescription}>
                Choose &quot;Local Network&quot; from the mode selector. Devices will start broadcasting.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Discover Devices</h3>
              <p className={styles.stepDescription}>
                Devices appear automatically. Look for the two-word device name (e.g., &quot;Silent Falcon&quot;).
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>04</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Drop &amp; Send</h3>
              <p className={styles.stepDescription}>
                Drop files into the zone, select a device, and send. Files transfer directly with PQC encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Internet P2P */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>INTERNET P2P TRANSFER</span>
          <h2 className={styles.sectionTitle}>Send files anywhere in the world</h2>
          <p className={styles.sectionDescription}>
            Transfer files across different networks using room codes, QR codes, or shareable links.
            Direct P2P connection established automatically.
          </p>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Choose Internet P2P</h3>
              <p className={styles.stepDescription}>
                Select &quot;Internet P2P&quot; mode. A unique 6-digit room code is generated automatically.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Share the Code</h3>
              <p className={styles.stepDescription}>
                Send the room code, QR code, or link to your recipient via any channel (chat, email, etc.).
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Connect</h3>
              <p className={styles.stepDescription}>
                The recipient enters the code. A direct P2P tunnel is established through NAT traversal.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>04</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Transfer</h3>
              <p className={styles.stepDescription}>
                Files flow directly between devices, encrypted end-to-end. No cloud storage involved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Friends */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>FRIENDS TRANSFER</span>
          <h2 className={styles.sectionTitle}>One-tap sends to saved contacts</h2>
          <p className={styles.sectionDescription}>
            Add friends once, send files forever. No codes, no setup, just instant transfers when online.
          </p>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Add a Friend</h3>
              <p className={styles.stepDescription}>
                Share your Tallow ID (e.g., tallow#a8f3) or scan their QR code. Confirm the connection.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Go Online</h3>
              <p className={styles.stepDescription}>
                When a friend is online, you&apos;ll see a green dot next to their name. Presence is updated automatically.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>One-Tap Send</h3>
              <p className={styles.stepDescription}>
                Select a friend, drop files, and send. No codes needed. Direct P2P connection every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to try it?</h2>
        <Link href="/transfer" className={styles.ctaButton}>
          Open Tallow
        </Link>
      </section>
    </main>
  );
}
