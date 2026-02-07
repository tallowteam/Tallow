'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  dot?: boolean;
}

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    dot && styles.dot,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className={styles.dotIndicator} />}
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
