'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DocsSidebar.module.css';

interface NavItem {
  title: string;
  href: string;
  icon?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Documentation', href: '/docs', icon: '📚' },
      { title: 'Getting Started', href: '/docs/getting-started', icon: '🚀' },
    ],
  },
  {
    title: 'Components',
    items: [
      { title: 'Components', href: '/docs/components', icon: '🧩' },
      { title: 'UI', href: '/docs/components?category=ui', icon: '✨' },
      { title: 'Layout', href: '/docs/components?category=layout', icon: '📐' },
      { title: 'Forms', href: '/docs/components?category=forms', icon: '📝' },
      { title: 'Feedback', href: '/docs/components?category=feedback', icon: '💬' },
      { title: 'Navigation', href: '/docs/components?category=navigation', icon: '🧭' },
      { title: 'Effects', href: '/docs/components?category=effects', icon: '✨' },
    ],
  },
  {
    title: 'Design',
    items: [
      { title: 'Design System', href: '/docs/design-system', icon: '🎨' },
      { title: 'Colors', href: '/docs/design-system#colors', icon: '🌈' },
      { title: 'Typography', href: '/docs/design-system#typography', icon: '🔤' },
      { title: 'Spacing', href: '/docs/design-system#spacing', icon: '📏' },
      { title: 'Tokens', href: '/docs/design-system#tokens', icon: '🎯' },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Logo */}
        <Link href="/docs" className={styles.logo}>
          <div className={styles.logoIcon}>T</div>
          <div className={styles.logoText}>
            <div className={styles.logoTitle}>Tallow</div>
            <div className={styles.logoSubtitle}>Docs</div>
          </div>
        </Link>

        {/* Navigation Sections */}
        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <h4 className={styles.navSectionTitle}>{section.title}</h4>
              <ul className={styles.navList}>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${
                        pathname === item.href ? styles.navLinkActive : ''
                      }`}
                    >
                      {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                      <span className={styles.navLabel}>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer Links */}
        <div className={styles.sidebarFooter}>
          <a href="#" className={styles.footerLink}>
            GitHub
          </a>
          <a href="#" className={styles.footerLink}>
            Issues
          </a>
          <a href="#" className={styles.footerLink}>
            Support
          </a>
        </div>
      </div>
    </aside>
  );
}
