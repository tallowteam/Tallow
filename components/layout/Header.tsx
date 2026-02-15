'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from './header.module.css';

const navLinks = [
  { href: '/features', label: 'FEATURES' },
  { href: '/how-it-works', label: 'HOW IT WORKS' },
  { href: '/docs', label: 'DOCS' },
  { href: '/about', label: 'ABOUT' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const firstLink = mobileMenuRef.current.querySelector<HTMLElement>('a, button');
      firstLink?.focus();
    } else if (!mobileMenuOpen) {
      hamburgerRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  // Keyboard close for modal-style mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

        <nav className={styles.nav} aria-label="Main navigation">
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.label}>
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
          ref={hamburgerRef}
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
        <div ref={mobileMenuRef} className={styles.mobileMenu} role="dialog" aria-label="Navigation menu">
          <div className={styles.mobileMenuContent}>
            <ul className={styles.mobileNavList}>
              {navLinks.map((link) => (
                <li key={link.label}>
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
