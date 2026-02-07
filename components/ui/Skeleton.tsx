'use client';

import { type HTMLAttributes } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton (any valid CSS width value)
   */
  width?: string | number;

  /**
   * Height of the skeleton (any valid CSS height value)
   */
  height?: string | number;

  /**
   * Border radius variant
   * @default 'md'
   */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Skeleton variant for different UI elements
   * @default 'default'
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular';

  /**
   * Animation type
   * @default 'pulse'
   */
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';

  /**
   * Number of skeleton lines to render (for text variant)
   * @default 1
   */
  lines?: number;

  /**
   * Spacing between skeleton lines
   * @default 'md'
   */
  spacing?: 'sm' | 'md' | 'lg';
}

export function Skeleton({
  width,
  height,
  radius = 'md',
  variant = 'default',
  animation = 'pulse',
  lines = 1,
  spacing = 'md',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  // If variant is text and lines > 1, render multiple skeleton lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`${styles.textGroup} ${styles[`spacing-${spacing}`]}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeleton} ${styles[radius]} ${styles[animation]} ${className}`}
            style={{
              width: index === lines - 1 ? '80%' : '100%',
              height: height || '1em',
              ...style,
            }}
            {...props}
          />
        ))}
      </div>
    );
  }

  const variantStyles = {
    default: {},
    text: { height: height || '1em' },
    circular: { borderRadius: '50%', width: width || height || '40px', height: height || width || '40px' },
    rectangular: {},
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[radius]} ${styles[animation]} ${className}`}
      style={{
        width,
        height,
        ...variantStyles[variant],
        ...style,
      }}
      aria-live="polite"
      aria-busy="true"
      {...props}
    />
  );
}

// Compound components for common patterns

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton variant="rectangular" height="200px" radius="lg" />
      <div className={styles.cardContent}>
        <Skeleton variant="text" height="24px" width="70%" />
        <Skeleton variant="text" lines={2} spacing="sm" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Skeleton variant="circular" width="32px" height="32px" />
          <Skeleton variant="text" width="120px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = '40px' }: { size?: string | number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonButton({ width = '100px' }: { width?: string | number }) {
  return <Skeleton height="40px" width={width} radius="lg" />;
}

export function SkeletonInput() {
  return <Skeleton height="44px" width="100%" radius="lg" />;
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className={styles.table}>
      {/* Header */}
      <div className={styles.tableRow}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="24px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={styles.listItem}>
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className={styles.listItemContent}>
            <Skeleton variant="text" height="20px" width="60%" />
            <Skeleton variant="text" height="16px" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDeviceCard() {
  return (
    <div className={styles.deviceCard}>
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className={styles.deviceCardContent}>
        <Skeleton variant="text" height="20px" width="120px" />
        <Skeleton variant="text" height="16px" width="80px" />
      </div>
      <Skeleton height="36px" width="80px" radius="lg" />
    </div>
  );
}
