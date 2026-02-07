'use client';

import { type HTMLAttributes } from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Color variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'white' | 'current';

  /**
   * Animation speed
   * @default 'normal'
   */
  speed?: 'slow' | 'normal' | 'fast';

  /**
   * Spinner type
   * @default 'circular'
   */
  type?: 'circular' | 'dots' | 'bars' | 'pulse' | 'ring';

  /**
   * Label for screen readers
   * @default 'Loading...'
   */
  label?: string;

  /**
   * Center the spinner in its container
   * @default false
   */
  center?: boolean;
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  speed = 'normal',
  type = 'circular',
  label = 'Loading...',
  center = false,
  className = '',
  ...props
}: SpinnerProps) {
  const containerClasses = [
    styles.container,
    center && styles.center,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[variant],
    styles[speed],
    styles[type],
  ]
    .filter(Boolean)
    .join(' ');

  const renderSpinner = () => {
    switch (type) {
      case 'circular':
        return (
          <svg
            className={spinnerClasses}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-label={label}
            role="img"
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" className={styles.spinPath} />
          </svg>
        );

      case 'dots':
        return (
          <div className={spinnerClasses} {...props}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        );

      case 'bars':
        return (
          <div className={spinnerClasses} {...props}>
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </div>
        );

      case 'pulse':
        return (
          <div className={spinnerClasses} {...props}>
            <span className={styles.pulseRing} />
            <span className={styles.pulseCore} />
          </div>
        );

      case 'ring':
        return (
          <div className={spinnerClasses} {...props}>
            <span className={styles.ringOuter} />
            <span className={styles.ringInner} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {renderSpinner()}
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Compound components for common use cases

export function SpinnerOverlay({
  visible,
  label = 'Loading...',
  blur = true,
}: {
  visible: boolean;
  label?: string;
  blur?: boolean;
}) {
  if (!visible) {return null;}

  return (
    <div className={`${styles.overlay} ${blur ? styles.overlayBlur : ''}`}>
      <div className={styles.overlayContent}>
        <Spinner size="lg" variant="white" label={label} />
        <p className={styles.overlayLabel}>{label}</p>
      </div>
    </div>
  );
}

export function SpinnerButton({ loading, children }: { loading?: boolean; children?: React.ReactNode }) {
  return (
    <div className={styles.buttonWrapper}>
      {loading && (
        <Spinner size="sm" variant="current" className={styles.buttonSpinner} />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
    </div>
  );
}

export function SpinnerInline({
  text,
  ...props
}: SpinnerProps & { text?: string }) {
  return (
    <div className={styles.inline}>
      <Spinner size="sm" {...props} />
      {text && <span className={styles.inlineText}>{text}</span>}
    </div>
  );
}

export function SpinnerPage({
  message = 'Loading...',
}: {
  message?: string;
}) {
  return (
    <div className={styles.page}>
      <Spinner size="xl" />
      <p className={styles.pageMessage}>{message}</p>
    </div>
  );
}
