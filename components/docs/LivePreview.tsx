'use client';

import { useState, type ReactNode } from 'react';
import styles from './LivePreview.module.css';

export interface LivePreviewProps {
  children: ReactNode;
  label?: string;
  showBackgroundToggle?: boolean;
  showResponsiveControls?: boolean;
  defaultTheme?: 'light' | 'dark';
  defaultWidth?: 'mobile' | 'tablet' | 'desktop';
  centered?: boolean;
  loading?: boolean;
  error?: string;
}

export function LivePreview({
  children,
  label = 'Preview',
  showBackgroundToggle = true,
  showResponsiveControls = true,
  defaultTheme = 'dark',
  defaultWidth = 'desktop',
  centered = true,
  loading = false,
  error,
}: LivePreviewProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);
  const [width, setWidth] = useState<'mobile' | 'tablet' | 'desktop'>(defaultWidth);

  const widthLabels = {
    mobile: '375px',
    tablet: '768px',
    desktop: '100%',
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.label}>
          {label}
          <span className={styles.badge}>Live</span>
        </div>

        <div className={styles.controls}>
          {showBackgroundToggle && (
            <>
              <button
                type="button"
                className={`${styles.controlButton} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => setTheme('dark')}
                aria-label="Dark theme"
                title="Dark theme"
              >
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.controlButton} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => setTheme('light')}
                aria-label="Light theme"
                title="Light theme"
              >
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </button>
            </>
          )}

          {showResponsiveControls && (
            <>
              <div
                style={{
                  width: '1px',
                  height: '20px',
                  background: 'var(--border-default)',
                }}
              />
              <button
                type="button"
                className={`${styles.controlButton} ${width === 'mobile' ? styles.active : ''}`}
                onClick={() => setWidth('mobile')}
                aria-label="Mobile view"
                title="Mobile (375px)"
              >
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.controlButton} ${width === 'tablet' ? styles.active : ''}`}
                onClick={() => setWidth('tablet')}
                aria-label="Tablet view"
                title="Tablet (768px)"
              >
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.controlButton} ${width === 'desktop' ? styles.active : ''}`}
                onClick={() => setWidth('desktop')}
                aria-label="Desktop view"
                title="Desktop (100%)"
              >
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`${styles.previewArea} ${styles[theme]} ${styles[width]} ${centered ? styles.centered : ''}`}
      >
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={`${styles.content} ${width !== 'desktop' ? styles.deviceFrame : ''}`}>
            {children}
          </div>
        )}

        {showResponsiveControls && !loading && !error && (
          <div className={styles.widthIndicator}>{widthLabels[width]}</div>
        )}
      </div>
    </div>
  );
}
