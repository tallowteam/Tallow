'use client';

import { ReactNode, useState } from 'react';
import styles from './Alert.module.css';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  className?: string;
}

const variantIcons: Record<AlertVariant, ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M16.667 5L7.5 14.167L3.333 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 6.667V10m0 3.333h.008M18.333 10c0 4.602-3.731 8.333-8.333 8.333S1.667 14.602 1.667 10 5.398 1.667 10 1.667 18.333 5.398 18.333 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M8.486 2.686a1.75 1.75 0 0 1 3.028 0l7.5 13A1.75 1.75 0 0 1 17.5 18h-15a1.75 1.75 0 0 1-1.514-2.314l7.5-13zM10 7v4m0 3h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 13.333V10m0-3.333h.008M18.333 10c0 4.602-3.731 8.333-8.333 8.333S1.667 14.602 1.667 10 5.398 1.667 10 1.667 18.333 5.398 18.333 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${styles.alert} ${styles[variant]} ${className}`}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon || variantIcons[variant]}
      </div>

      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.description}>{children}</div>
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className={styles.closeButton}
          aria-label="Dismiss alert"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
