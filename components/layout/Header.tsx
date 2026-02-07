'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './header.module.css';

const navLinks = [
  { href: '/#features', label: 'FEATURES' },
  { href: '/how-it-works', label: 'HOW IT WORKS' },
  { href: '/docs', label: 'HELP' },
  { href: '/about', label: 'ABOUT' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActiveLink = (href: string) => {
    if (href.startsWith('/#')) {
      return pathname === '/' && typeof window !== 'undefined' && window.location.hash === href.slice(1);
    }
    return pathname === href;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            Tallow
          </Link>
          <div className={styles.divider} />
          <span className={styles.tagline}>QUANTUM-SAFE TRANSFER</span>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActiveLink(link.href) ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/transfer" className={styles.cta}>
            OPEN APP
          </Link>
        </nav>

        <button
          className={styles.hamburger}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            <ul className={styles.mobileNavList}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`${styles.mobileNavLink} ${isActiveLink(link.href) ? styles.active : ''}`}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/transfer"
                  className={styles.mobileCta}
                  onClick={closeMobileMenu}
                >
                  OPEN APP
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
