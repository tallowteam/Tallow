'use client';

import { HTMLAttributes } from 'react';
import styles from './Progress.module.css';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export function Progress({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  indeterminate = false,
  className = '',
  ...props
}: ProgressProps) {
  const percentage = indeterminate ? 0 : Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={`${styles.wrapper} ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={indeterminate ? 'Loading...' : `Progress: ${percentage.toFixed(0)}%`}
      {...props}
    >
      <div className={`${styles.track} ${styles[size]} ${styles[variant]}`}>
        <div
          className={`${styles.fill} ${indeterminate ? styles.indeterminate : ''}`}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
      {showLabel && !indeterminate && (
        <span className={styles.label} aria-hidden="true">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
