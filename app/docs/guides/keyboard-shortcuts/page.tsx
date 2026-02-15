import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, ArrowLeft, Info } from '@/components/icons';
import styles from './page.module.css';

export default function KeyboardShortcutsPage() {
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
              <Link href="/docs/guides">Guides</Link>
            </li>
            <li>
              <span>Keyboard Shortcuts</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>Keyboard Shortcuts</h1>
            <p className={styles.heroDescription}>
              Navigate and control Tallow entirely from your keyboard.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>3 min read</span>
              <span className={styles.badge}>Reference</span>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className={styles.article}>
          <div className={styles.contentContainer}>

            {/* Navigation Shortcuts */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Navigation</h2>
              <div className={styles.shortcutTable}>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>1</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Go to Transfer page</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>2</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Go to Settings</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>K</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Open command palette</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Escape</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Close modal/panel</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Tab</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Navigate between elements</span>
                </div>
              </div>
            </section>

            {/* Transfer Controls */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Transfer Controls</h2>
              <div className={styles.shortcutTable}>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>O</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Open file picker</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>V</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Paste files/text</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>Shift</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>V</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Paste as text snippet</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Space</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Pause/resume transfer</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Delete</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Cancel selected transfer</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>A</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Select all transfers</span>
                </div>
              </div>
            </section>

            {/* Room Controls */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Room Controls</h2>
              <div className={styles.shortcutTable}>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>N</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Create new room</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>J</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Join room by code</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>L</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Copy room code</span>
                </div>
              </div>
            </section>

            {/* View & Layout */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>View &amp; Layout</h2>
              <div className={styles.shortcutTable}>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>D</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Toggle dark/light theme</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>B</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Toggle sidebar</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>+</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Zoom in</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>-</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Zoom out</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Ctrl</kbd>
                    <span>/</span>
                    <kbd className={styles.kbd}>Cmd</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>0</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Reset zoom</span>
                </div>
              </div>
            </section>

            {/* Accessibility */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Accessibility</h2>
              <div className={styles.shortcutTable}>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Alt</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>1</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Skip to main content</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>Alt</kbd>
                    <span>+</span>
                    <kbd className={styles.kbd}>S</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Focus search</span>
                </div>
                <div className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    <kbd className={styles.kbd}>?</kbd>
                  </div>
                  <span className={styles.shortcutAction}>Show keyboard shortcuts help</span>
                </div>
              </div>
            </section>

            {/* Info Callout */}
            <div className={`${styles.callout} ${styles.infoCallout}`}>
              <Info className={styles.calloutIcon} />
              <div className={styles.calloutContent}>
                <p className={styles.calloutTitle}>Platform Note</p>
                <p className={styles.calloutText}>
                  On macOS, use <kbd className={styles.kbd}>Cmd</kbd> instead of <kbd className={styles.kbd}>Ctrl</kbd>. Shortcuts can be customized in Settings.
                </p>
              </div>
            </div>

          </div>
        </article>

        {/* Navigation */}
        <section className={styles.navigation}>
          <div>
            <Link href="/docs/guides/security" className={styles.navLink}>
              <span className={styles.navLabel}>
                <ArrowLeft />
                Previous
              </span>
              <span className={styles.navTitle}>Advanced Features</span>
            </Link>
            <Link href="/docs/guides/getting-started" className={styles.navLink}>
              <span className={styles.navLabel}>
                Next
                <ArrowRight />
              </span>
              <span className={styles.navTitle}>CLI Tool</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
