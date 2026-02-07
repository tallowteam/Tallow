'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Zap,
  Shield,
  Wifi,
  Globe,
  ArrowRight,
  Lock,
  AlertCircle,
  CheckCircle,
} from '@/components/icons';
import { Badge } from '@/components/ui';
import styles from './page.module.css';

const guides = [
  {
    category: 'Getting Started',
    icon: Zap,
    description: 'Begin your Tallow journey',
    items: [
      {
        title: 'Getting Started',
        description: 'Learn the basics of opening the app, creating your first transfer, and understanding connection types.',
        href: '/docs/guides/getting-started',
        duration: '5 min read',
        difficulty: 'Beginner',
      },
    ],
  },
  {
    category: 'File Transfer',
    icon: Globe,
    description: 'Learn different ways to transfer files',
    items: [
      {
        title: 'Local Network Transfer',
        description: 'Transfer files securely within your local network. Fastest and most reliable for LAN transfers.',
        href: '/docs/guides/local-transfer',
        duration: '8 min read',
        difficulty: 'Beginner',
      },
      {
        title: 'Internet Transfer (P2P)',
        description: 'Send files over the internet using room codes. Works across different networks with end-to-end encryption.',
        href: '/docs/guides/internet-transfer',
        duration: '10 min read',
        difficulty: 'Intermediate',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    icon: Shield,
    description: 'Understand how Tallow protects you',
    items: [
      {
        title: 'Security Guide',
        description: 'Learn about end-to-end encryption, post-quantum cryptography, and privacy features that protect your files.',
        href: '/docs/guides/security',
        duration: '12 min read',
        difficulty: 'Intermediate',
      },
    ],
  },
];

export default function GuidesPage() {
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
              <span>Guides</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <Badge variant="secondary">User Guides</Badge>
            <h1 className={styles.heroTitle}>
              Learn Tallow
              <br />
              <span className={styles.heroTitleGradient}>Step by Step</span>
            </h1>
            <p className={styles.heroDescription}>
              Comprehensive guides to help you master secure file transfers with Tallow.
              From your first transfer to advanced security features.
            </p>
          </div>
        </section>

        {/* Guide Categories */}
        <section className={styles.guidesSection}>
          <div className={styles.contentContainer}>
            {guides.map((category, categoryIndex) => (
              <div key={categoryIndex} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryTitleWrapper}>
                    <div className={styles.categoryIcon}>
                      <category.icon />
                    </div>
                    <div>
                      <h2 className={styles.categoryTitle}>{category.category}</h2>
                      <p className={styles.categoryDescription}>{category.description}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.guidesList}>
                  {category.items.map((guide, guideIndex) => (
                    <Link
                      key={guideIndex}
                      href={guide.href}
                      className={styles.guideCard}
                    >
                      <div className={styles.guideContent}>
                        <h3 className={styles.guideTitle}>{guide.title}</h3>
                        <p className={styles.guideDescription}>{guide.description}</p>
                        <div className={styles.guideMeta}>
                          <span className={styles.guideDuration}>{guide.duration}</span>
                          <span className={styles.guideDifficulty}>
                            {guide.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className={styles.guideArrow}>
                        <ArrowRight />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Tips */}
        <section className={styles.quickTips}>
          <div className={styles.contentContainer}>
            <h2 className={styles.quickTipsTitle}>Quick Tips</h2>
            <div className={styles.tipsGrid}>
              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>
                  <Wifi />
                </div>
                <h3 className={styles.tipTitle}>Use LAN for Speed</h3>
                <p className={styles.tipText}>
                  Local network transfers are faster and more reliable than internet transfers.
                </p>
              </div>

              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>
                  <Lock />
                </div>
                <h3 className={styles.tipTitle}>Always Encrypted</h3>
                <p className={styles.tipText}>
                  All transfers use end-to-end encryption. Your files are always protected.
                </p>
              </div>

              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>
                  <AlertCircle />
                </div>
                <h3 className={styles.tipTitle}>No Account Needed</h3>
                <p className={styles.tipText}>
                  Tallow doesn't require registration. Just open the app and start transferring.
                </p>
              </div>

              <div className={styles.tipCard}>
                <div className={styles.tipIcon}>
                  <CheckCircle />
                </div>
                <h3 className={styles.tipTitle}>Verify Connections</h3>
                <p className={styles.tipText}>
                  Always verify the receiving device matches before confirming large transfers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Help CTA */}
        <section className={styles.helpCta}>
          <div className={styles.contentContainer}>
            <div className={styles.helpCard}>
              <h2 className={styles.helpTitle}>Still need help?</h2>
              <p className={styles.helpDescription}>
                Check the troubleshooting guides or visit our community discussions for answers.
              </p>
              <div className={styles.helpActions}>
                <Link href="/docs/troubleshooting" className={styles.helpLink}>
                  <span>Troubleshooting</span>
                  <ArrowRight />
                </Link>
                <a
                  href="https://github.com/tallow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.helpLink}
                >
                  <span>GitHub Community</span>
                  <ArrowRight />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
