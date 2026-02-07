import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Everything you need to know about Tallow - guides, API reference, and architecture documentation.',
  openGraph: {
    title: 'Documentation | Tallow',
    description: 'Everything you need to know about Tallow - guides, API reference, and architecture documentation.',
    url: '/docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation | Tallow',
    description: 'Everything you need to know about Tallow - guides, API reference, and architecture documentation.',
  },
};

export default function DocsPage() {
  const quickLinks = [
    {
      title: 'Getting Started',
      description: 'Set up Tallow in under 2 minutes',
      href: '#getting-started',
    },
    {
      title: 'User Guide',
      description: 'Master all transfer modes',
      href: '#transfer-guides',
    },
    {
      title: 'API Reference',
      description: 'For developers and integrators',
      href: '#developer',
    },
    {
      title: 'Architecture',
      description: 'How Tallow works under the hood',
      href: '#developer',
    },
  ];

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      articles: [
        'Installation & Setup',
        'Your First Transfer',
        'Understanding Transfer Modes',
        'System Requirements',
      ],
    },
    {
      id: 'transfer-guides',
      title: 'Transfer Guides',
      articles: [
        'Local Network Transfers',
        'Internet P2P Transfers',
        'Friends & Contacts',
        'Troubleshooting Connections',
      ],
    },
    {
      id: 'security',
      title: 'Security',
      articles: [
        'Encryption Overview',
        'Post-Quantum Cryptography',
        'Threat Model',
        'Security Audit Reports',
      ],
    },
    {
      id: 'developer',
      title: 'Developer',
      articles: [
        'API Reference',
        'Contributing Guide',
        'Building from Source',
        'Architecture Overview',
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
              <a key={index} href={link.href} className={styles.quickLinkCard}>
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
              </a>
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
                      <a href="#" className={styles.articleLink}>
                        <span>{article}</span>
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
                      </a>
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
              Can't find what you're looking for?
            </h2>
            <p className={styles.helpCtaDescription}>
              Check our GitHub issues or ask the community for help.
            </p>
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
        </section>
      </div>
    </main>
  );
}
