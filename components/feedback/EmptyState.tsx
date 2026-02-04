'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { Button } from '../ui/Button';
import styles from './EmptyState.module.css';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className = '',
  ...props
}: EmptyStateProps) {
  const defaultIcon = (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect
        x="8"
        y="16"
        width="48"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 28h48M24 16v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="32"
        cy="40"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      className={`${styles.emptyState} ${className}`}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon || defaultIcon}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>

      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}

      {children && <div className={styles.extra}>{children}</div>}
    </div>
  );
}
