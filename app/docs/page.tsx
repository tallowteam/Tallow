import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Everything you need to know about Tallow - guides, API reference, architecture, and help center.',
  alternates: {
    canonical: 'https://tallow.app/docs',
  },
  openGraph: {
    title: 'Documentation | Tallow',
    description: 'Everything you need to know about Tallow - guides, API reference, architecture, and help center.',
    url: '/docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation | Tallow',
    description: 'Everything you need to know about Tallow - guides, API reference, and help center.',
  },
};

export default function DocsPage() {
  const quickLinks = [
    {
      title: 'Help Center',
      description: 'Find answers to every question',
      href: '/docs/help',
      icon: '?',
    },
    {
      title: 'Getting Started',
      description: 'Set up Tallow in under 2 minutes',
      href: '/docs/guides/getting-started',
      icon: '1',
    },
    {
      title: 'Transfer Guides',
      description: 'Master all transfer modes',
      href: '/docs/guides',
      icon: '2',
    },
    {
      title: 'API Reference',
      description: 'For developers and integrators',
      href: '/docs/api',
      icon: '3',
    },
  ];

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      articles: [
        { name: 'Quick Start Guide', href: '/docs/guides/getting-started' },
        { name: 'Your First Transfer', href: '/docs/guides/getting-started#first-transfer' },
        { name: 'Understanding Transfer Modes', href: '/docs/guides/getting-started#connection-types' },
        { name: 'System Requirements', href: '/docs/guides/getting-started#opening-app' },
      ],
    },
    {
      id: 'transfer-guides',
      title: 'Transfer Guides',
      articles: [
        { name: 'Local Network Transfers', href: '/docs/guides/local-transfer' },
        { name: 'Internet P2P Transfers', href: '/docs/guides/internet-transfer' },
        { name: 'Room System & Group Transfers', href: '/docs/guides/rooms' },
        { name: 'Friends & Contacts', href: '/docs/guides/friends' },
      ],
    },
    {
      id: 'features',
      title: 'Features & Tools',
      articles: [
        { name: 'Advanced Features', href: '/docs/guides/advanced-features' },
        { name: 'Keyboard Shortcuts', href: '/docs/guides/keyboard-shortcuts' },
        { name: 'Settings & Configuration', href: '/docs/guides/settings' },
        { name: 'CLI Tool', href: '/docs/guides/cli' },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      articles: [
        { name: 'Security Overview', href: '/docs/guides/security' },
        { name: 'Privacy Features', href: '/docs/guides/privacy' },
        { name: 'Post-Quantum Cryptography', href: '/docs/guides/security#pqc' },
        { name: 'Threat Model', href: '/docs/architecture#crypto-architecture' },
      ],
    },
    {
      id: 'platform',
      title: 'Platform & Deployment',
      articles: [
        { name: 'Mobile App Guide', href: '/docs/guides/mobile' },
        { name: 'Self-Hosting with Docker', href: '/docs/guides/self-hosting' },
        { name: 'Architecture Overview', href: '/docs/architecture' },
        { name: 'Troubleshooting', href: '/docs/guides/troubleshooting' },
      ],
    },
    {
      id: 'developer',
      title: 'Developer',
      articles: [
        { name: 'API Reference', href: '/docs/api' },
        { name: 'Architecture Diagrams', href: '/docs/architecture' },
        { name: 'React Hooks & Components', href: '/docs/hooks' },
        { name: 'Playground', href: '/docs/playground' },
      ],
    },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.label}>DOCUMENTATION</div>
          <h1 className={styles.heading}>Everything you need to know.</h1>
          <p className={styles.subheading}>
            Guides, API reference, architecture docs, and a complete help center for Tallow.
          </p>
        </section>

        {/* Search Bar */}
        <section className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search documentation..."
              className={styles.searchInput}
              disabled
            />
          </div>
        </section>

        {/* Quick Links */}
        <section className={styles.quickLinks}>
          <div className={styles.quickLinksGrid}>
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href} className={styles.quickLinkCard}>
                <div className={styles.quickLinkIcon}>{link.icon}</div>
                <h3 className={styles.quickLinkTitle}>{link.title}</h3>
                <p className={styles.quickLinkDescription}>
                  {link.description}
                </p>
                <svg
                  className={styles.quickLinkArrow}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* All Guides Grid */}
        <section className={styles.allGuides}>
          <h2 className={styles.allGuidesTitle}>All Guides</h2>
          <div className={styles.allGuidesGrid}>
            {[
              { title: 'Getting Started', desc: 'First transfer in under 2 minutes', href: '/docs/guides/getting-started', badge: 'Beginner', time: '5 min' },
              { title: 'Local Network Transfer', desc: 'Fast LAN transfers between nearby devices', href: '/docs/guides/local-transfer', badge: 'Beginner', time: '8 min' },
              { title: 'Internet P2P Transfer', desc: 'Send files across the internet with room codes', href: '/docs/guides/internet-transfer', badge: 'Intermediate', time: '10 min' },
              { title: 'Room System', desc: 'Create rooms, group transfers, permissions', href: '/docs/guides/rooms', badge: 'Intermediate', time: '8 min' },
              { title: 'Friends & Contacts', desc: 'Trust levels, favorites, SAS verification', href: '/docs/guides/friends', badge: 'Beginner', time: '6 min' },
              { title: 'Settings & Configuration', desc: 'Themes, privacy, network, notifications', href: '/docs/guides/settings', badge: 'Beginner', time: '5 min' },
              { title: 'Security Guide', desc: 'E2E encryption and post-quantum crypto', href: '/docs/guides/security', badge: 'Intermediate', time: '12 min' },
              { title: 'Privacy Features', desc: 'Metadata stripping, zero tracking, onion routing', href: '/docs/guides/privacy', badge: 'Intermediate', time: '10 min' },
              { title: 'Advanced Features', desc: 'Batch ops, scheduling, clipboard, delta sync', href: '/docs/guides/advanced-features', badge: 'Advanced', time: '12 min' },
              { title: 'Keyboard Shortcuts', desc: 'Complete shortcut reference', href: '/docs/guides/keyboard-shortcuts', badge: 'Reference', time: '3 min' },
              { title: 'Mobile App', desc: 'iOS, Android, PWA installation and usage', href: '/docs/guides/mobile', badge: 'Beginner', time: '7 min' },
              { title: 'CLI Tool', desc: 'Command-line transfers like croc', href: '/docs/guides/cli', badge: 'Advanced', time: '8 min' },
              { title: 'Self-Hosting', desc: 'Docker, Synology NAS, Cloudflare Tunnel', href: '/docs/guides/self-hosting', badge: 'Advanced', time: '15 min' },
              { title: 'Troubleshooting', desc: 'Fix connection, speed, and firewall issues', href: '/docs/guides/troubleshooting', badge: 'Reference', time: '10 min' },
            ].map((guide, i) => (
              <Link key={i} href={guide.href} className={styles.guideCard}>
                <div className={styles.guideCardHeader}>
                  <span className={styles.guideBadge}>{guide.badge}</span>
                  <span className={styles.guideTime}>{guide.time}</span>
                </div>
                <h3 className={styles.guideCardTitle}>{guide.title}</h3>
                <p className={styles.guideCardDesc}>{guide.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Documentation Categories */}
        <section className={styles.categories}>
          <div className={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <div key={index} id={category.id} className={styles.categoryCard}>
                <h2 className={styles.categoryTitle}>{category.title}</h2>
                <ul className={styles.articleList}>
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex} className={styles.articleItem}>
                      <Link href={article.href} className={styles.articleLink}>
                        <span>{article.name}</span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Help CTA */}
        <section className={styles.helpCta}>
          <div className={styles.helpCtaContent}>
            <h2 className={styles.helpCtaHeading}>
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className={styles.helpCtaDescription}>
              Visit the Help Center for answers to every question, or open a GitHub issue.
            </p>
            <div className={styles.helpCtaActions}>
              <Link href="/docs/help" className={styles.helpCtaButtonPrimary}>
                Help Center
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a
                href="https://github.com/tallowteam/Tallow/issues"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.helpCtaButton}
              >
                Open an Issue on GitHub
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
