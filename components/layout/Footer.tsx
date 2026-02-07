import Link from 'next/link';
import styles from './footer.module.css';

const productLinks = [
  { href: '/features', label: 'Features' },
  { href: '/security', label: 'Security' },
  { href: '/transfer', label: 'Transfer' },
  { href: '/docs', label: 'Docs' },
];

const resourceLinks = [
  { href: '/docs', label: 'Documentation' },
  { href: '/docs/api', label: 'API' },
  { href: '#', label: 'Changelog' },
  { href: '#', label: 'Status' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/security', label: 'Security' },
  { href: '#', label: 'GDPR' },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        {/* Main Grid */}
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <h3 className={styles.brandTitle}>Tallow</h3>
            <p className={styles.brandDescription}>
              Quantum-safe peer-to-peer file transfer. No servers. No accounts. No compromise.
            </p>
          </div>

          {/* Product Links */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>PRODUCT</h4>
            <ul className={styles.linkList}>
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>RESOURCES</h4>
            <ul className={styles.linkList}>
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>LEGAL</h4>
            <ul className={styles.linkList}>
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; 2026 Tallow. All rights reserved.
          </p>
          <p className={styles.tagline}>
            Your files. Your rules.
          </p>
        </div>
      </div>
    </footer>
  );
}
