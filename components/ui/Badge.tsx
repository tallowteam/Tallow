'use client';

import { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  showDot?: boolean;
  children: ReactNode;
}

export function Badge({
  variant = 'neutral',
  showDot = false,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {showDot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
