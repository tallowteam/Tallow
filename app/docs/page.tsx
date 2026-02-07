'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from '@/components/icons';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import styles from './page.module.css';

const popularTopics = [
  {
    emoji: '🚀',
    title: 'Getting Started',
    description: 'Quick start guide, installation, first transfer',
    href: '/docs/guides/getting-started',
  },
  {
    emoji: '⚡',
    title: 'API Reference',
    description: 'REST API, WebSocket events, authentication',
    href: '/docs/api',
  },
  {
    emoji: '🔒',
    title: 'Security',
    description: 'Encryption protocols, architecture, audits',
    href: '/docs/architecture',
  },
  {
    emoji: '📐',
    title: 'Architecture',
    description: 'System design, data flow, components',
    href: '/docs/architecture',
  },
  {
    emoji: '📖',
    title: 'Guides',
    description: 'Tutorials, best practices, advanced usage',
    href: '/docs/guides',
  },
  {
    emoji: '🪝',
    title: 'Hooks & Components',
    description: 'React hooks, UI components, utilities',
    href: '/docs/hooks',
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Header />
      <div className={styles.docsLayout}>
        <DocsSidebar />

        <main className={styles.main}>
          {/* Hero with Search */}
          <section className={styles.hero}>
            <div className={styles.heroContainer}>
              <h1 className={styles.heroTitle}>Documentation</h1>
              <p className={styles.heroSubtitle}>
                Everything you need to know about Tallow.
              </p>

              <div className={styles.searchBar}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search documentation"
                />
              </div>
            </div>
          </section>

          {/* Popular Topics Grid */}
          <section className={styles.popularTopics}>
            <div className={styles.container}>
              <p className={styles.sectionLabel}>POPULAR TOPICS</p>
              <div className={styles.topicsGrid}>
                {popularTopics.map((topic, index) => (
                  <Link
                    key={index}
                    href={topic.href}
                    className={styles.topicCard}
                  >
                    <div className={styles.topicEmoji}>{topic.emoji}</div>
                    <h3 className={styles.topicTitle}>{topic.title}</h3>
                    <p className={styles.topicDescription}>{topic.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
