'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from '@/components/icons';
import styles from './DocsSidebar.module.css';

interface SidebarLink {
  title: string;
  href: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

const sections: SidebarSection[] = [
  {
    title: 'Getting Started',
    links: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quick Start', href: '/docs/guides/getting-started' },
      { title: 'Help Center', href: '/docs/help' },
    ],
  },
  {
    title: 'Transfer Guides',
    links: [
      { title: 'Local Network Transfer', href: '/docs/guides/local-transfer' },
      { title: 'Internet P2P Transfer', href: '/docs/guides/internet-transfer' },
      { title: 'Room System', href: '/docs/guides/rooms' },
      { title: 'Friends & Contacts', href: '/docs/guides/friends' },
    ],
  },
  {
    title: 'Features',
    links: [
      { title: 'Advanced Features', href: '/docs/guides/advanced-features' },
      { title: 'Keyboard Shortcuts', href: '/docs/guides/keyboard-shortcuts' },
      { title: 'Settings', href: '/docs/guides/settings' },
      { title: 'CLI Tool', href: '/docs/guides/cli' },
    ],
  },
  {
    title: 'Security & Privacy',
    links: [
      { title: 'Security Guide', href: '/docs/guides/security' },
      { title: 'Privacy Features', href: '/docs/guides/privacy' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { title: 'Mobile App', href: '/docs/guides/mobile' },
      { title: 'Self-Hosting', href: '/docs/guides/self-hosting' },
      { title: 'Troubleshooting', href: '/docs/guides/troubleshooting' },
    ],
  },
  {
    title: 'Developer',
    links: [
      { title: 'API Reference', href: '/docs/api' },
      { title: 'Architecture', href: '/docs/architecture' },
      { title: 'React Hooks', href: '/docs/hooks' },
      { title: 'Playground', href: '/docs/playground' },
    ],
  },
];

interface DocsSidebarProps {
  activeSection?: string;
  onLinkClick?: (href: string) => void;
}

export function DocsSidebar({ activeSection, onLinkClick }: DocsSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Getting Started'])
  );

  useEffect(() => {
    if (activeSection) {
      sections.forEach((section) => {
        const hasActiveLink = section.links.some(
          (link) => link.href === activeSection
        );
        if (hasActiveLink) {
          setExpandedSections((prev) => new Set(prev).add(section.title));
        }
      });
    }
  }, [activeSection]);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const handleLinkClick = (href: string) => {
    onLinkClick?.(href);
  };

  return (
    <aside className={styles.sidebar} aria-label="Documentation navigation">
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Documentation</h2>
      </div>

      <nav className={styles.nav}>
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.title);

          return (
            <div key={section.title} className={styles.section}>
              <button
                onClick={() => toggleSection(section.title)}
                className={styles.sectionButton}
                aria-expanded={isExpanded}
                type="button"
              >
                <span className={styles.sectionTitle}>{section.title}</span>
                <span className={styles.chevronWrapper}>
                  {isExpanded ? (
                    <ChevronDown className={styles.chevron} />
                  ) : (
                    <ChevronRight className={styles.chevron} />
                  )}
                </span>
              </button>

              {isExpanded && (
                <ul className={styles.linkList}>
                  {section.links.map((link) => {
                    const isActive = activeSection === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => handleLinkClick(link.href)}
                          className={`${styles.link} ${
                            isActive ? styles.active : ''
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {link.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
