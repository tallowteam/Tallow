import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft } from '@/components/icons';
import styles from './page.module.css';

const categories = [
  {
    icon: '\u{1F680}',
    title: 'Getting Started',
    description: 'New to Tallow? Learn the basics of opening the app and making your first transfer.',
    href: '/docs/guides/getting-started',
  },
  {
    icon: '\u{1F4E1}',
    title: 'Transfer Guides',
    description: 'Step-by-step guides for local network and internet P2P file transfers.',
    href: '/docs/guides',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    title: 'Security & Privacy',
    description: 'Understand end-to-end encryption, post-quantum cryptography, and privacy features.',
    href: '/docs/guides/security',
  },
  {
    icon: '\u{1F3E0}',
    title: 'Room System',
    description: 'Learn how room codes work to connect devices across different networks.',
    href: '/docs/guides/rooms',
  },
  {
    icon: '\u{2699}\uFE0F',
    title: 'Settings & Configuration',
    description: 'Customize Tallow to fit your workflow including themes, notifications, and defaults.',
    href: '/docs/guides/settings',
  },
  {
    icon: '\u{1F4BB}',
    title: 'CLI & Advanced',
    description: 'Use the Tallow command-line interface for scripted, headless, and batch transfers.',
    href: '/docs/guides/cli',
  },
];

const faqs = [
  {
    question: 'What is Tallow?',
    answer:
      'Tallow is a free, open-source file transfer application that sends files directly between devices using peer-to-peer connections. All transfers are end-to-end encrypted with post-quantum cryptography, and no data is ever stored on a server.',
  },
  {
    question: 'Is Tallow free to use?',
    answer:
      'Yes. The core file transfer features are completely free with no account required. Premium plans are available for teams and power users who need advanced features like scheduled transfers and priority relay access.',
  },
  {
    question: 'What does "post-quantum" mean?',
    answer:
      'Post-quantum cryptography uses algorithms that remain secure even if a large-scale quantum computer is built. Tallow uses NIST-standardized Kyber-1024 (ML-KEM) so that files you send today cannot be decrypted by future quantum computers.',
  },
  {
    question: 'How does peer-to-peer transfer work?',
    answer:
      'When two devices connect, Tallow negotiates a direct WebRTC data channel between them. Files travel straight from sender to receiver without passing through a central server. If a direct connection is not possible, an encrypted relay is used as a fallback.',
  },
  {
    question: 'Is my data stored on any server?',
    answer:
      'No. Tallow never stores your files on a server. Files move directly from one device to another. The signaling server only coordinates the initial connection handshake and never sees file contents.',
  },
  {
    question: 'Are there file size limits?',
    answer:
      'There is no hard file size limit. You can transfer files from a few kilobytes to multiple gigabytes. Transfer speed depends on your network connection. Large files are automatically chunked and can be resumed if the connection drops.',
  },
  {
    question: 'How do room codes work?',
    answer:
      'A room code is a short, randomly generated code that both devices enter to find each other through the signaling server. Once both devices join the same room, a direct encrypted connection is established and the room code is discarded.',
  },
  {
    question: 'Can I use Tallow on mobile devices?',
    answer:
      'Yes. Tallow works in modern mobile browsers (Chrome, Safari, Firefox) on both iOS and Android. A dedicated mobile app is also in development for native performance and system-level integration.',
  },
  {
    question: 'How do I self-host Tallow?',
    answer:
      'Tallow provides official Docker images and a standalone signaling server you can run on your own infrastructure. See the deployment documentation for step-by-step instructions on self-hosting with Docker Compose or Kubernetes.',
  },
  {
    question: 'What browsers are supported?',
    answer:
      'Tallow supports all modern browsers with WebRTC and WebCrypto APIs: Chrome 90+, Firefox 90+, Safari 15+, and Edge 90+. Internet Explorer is not supported.',
  },
  {
    question: 'How do I verify a peer\'s identity (SAS)?',
    answer:
      'After connecting, both devices display a Short Authentication String, a set of matching words or numbers. Compare them out of band (verbally, via text) to confirm there is no man-in-the-middle attack. If they match, the connection is authenticated.',
  },
  {
    question: 'What happens if my connection drops mid-transfer?',
    answer:
      'Tallow supports resumable transfers. If the connection is interrupted, reconnect and the transfer picks up from the last successfully received chunk instead of starting over.',
  },
  {
    question: 'Can I send entire folders?',
    answer:
      'Yes. Drag and drop a folder into the Tallow drop zone and the entire directory structure is preserved on the receiving end. The folder is transferred as a structured archive with all subfolders and files intact.',
  },
  {
    question: 'How do I use the CLI tool?',
    answer:
      'Install the Tallow CLI with npm or download the standalone binary. Use "tallow send <file>" and "tallow receive <room-code>" to transfer files from the terminal. Run "tallow --help" for the full list of commands and options.',
  },
  {
    question: 'How is Tallow different from email or cloud storage?',
    answer:
      'Unlike email or cloud storage, Tallow never stores your files on a third-party server. Files are encrypted on your device and decrypted only on the recipient\'s device. There is no account, no upload limit, and no data mining. Your files never leave the direct path between sender and receiver.',
  },
  {
    question: 'Is Tallow open source?',
    answer:
      'Yes. Tallow is fully open source. The code is publicly available on GitHub for anyone to inspect, audit, or contribute to. This transparency ensures there are no hidden backdoors or data collection.',
  },
];

export default function HelpCenterPage() {
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
              <span>Help Center</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Help Center</h1>
            <p className={styles.heroDescription}>
              Find answers to every question about Tallow &mdash; from getting started to advanced
              configuration, troubleshooting, and community resources.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>FAQs</span>
              <span className={styles.badge}>Guides</span>
              <span className={styles.badge}>Support</span>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className={styles.article}>
          <div className={styles.contentContainer}>
            {/* Browse by Topic */}
            <section id="topics" className={styles.section}>
              <h2 className={styles.sectionTitle}>Browse by Topic</h2>

              <div className={styles.categoryGrid}>
                {categories.map((cat) => (
                  <Link key={cat.href} href={cat.href} className={styles.categoryCard}>
                    <span className={styles.categoryIcon}>{cat.icon}</span>
                    <h3 className={styles.categoryTitle}>{cat.title}</h3>
                    <p className={styles.categoryDescription}>{cat.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Frequently Asked Questions */}
            <section id="faq" className={styles.section}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>

              <div className={styles.faqList}>
                {faqs.map((faq, idx) => (
                  <div key={idx} className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>{faq.question}</h3>
                    <p className={styles.faqAnswer}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact & Support */}
            <section id="support" className={styles.section}>
              <div className={styles.contactCard}>
                <h2>Still need help?</h2>
                <p>
                  Can&apos;t find what you&apos;re looking for? Reach out through one of these channels and
                  the Tallow community or maintainers will be happy to assist.
                </p>
                <div className={styles.contactGrid}>
                  <a
                    href="https://github.com/nicholasoxford/tallow/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Open a GitHub Issue</span>
                    <ArrowRight />
                  </a>
                  <a
                    href="https://github.com/nicholasoxford/tallow/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Community Discussions</span>
                    <ArrowRight />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div className={styles.contentContainer}>
            <Link href="/docs" className={styles.navLink}>
              <span className={styles.navLabel}>
                <ArrowLeft />
                Previous
              </span>
              <span className={styles.navTitle}>Docs</span>
            </Link>
            <Link href="/docs/guides/getting-started" className={styles.navLink}>
              <span className={styles.navLabel}>
                Next
                <ArrowRight />
              </span>
              <span className={styles.navTitle}>Getting Started</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
