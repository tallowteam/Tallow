'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon, Contrast } from '@/components/icons';
import styles from './theme-toggle.module.css';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${theme === 'dark' ? styles.active : ''}`}
        onClick={() => setTheme('dark')}
        aria-label="Dark theme"
        title="Dark theme"
      >
        <Moon aria-hidden="true" />
        <span>Dark</span>
      </button>
      <button
        className={`${styles.button} ${theme === 'light' ? styles.active : ''}`}
        onClick={() => setTheme('light')}
        aria-label="Light theme"
        title="Light theme"
      >
        <Sun aria-hidden="true" />
        <span>Light</span>
      </button>
      <button
        className={`${styles.button} ${theme === 'high-contrast' ? styles.active : ''}`}
        onClick={() => setTheme('high-contrast')}
        aria-label="High contrast theme"
        title="High contrast theme"
      >
        <Contrast aria-hidden="true" />
        <span>High Contrast</span>
      </button>
    </div>
  );
}
