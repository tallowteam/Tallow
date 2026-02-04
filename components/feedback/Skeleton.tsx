'use client';

import { HTMLAttributes } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
  animated?: boolean;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  animated = true,
  style,
  ...props
}: SkeletonProps) {
  const customStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${animated ? styles.animated : ''} ${className}`}
      style={customStyle}
      aria-busy="true"
      aria-live="polite"
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export interface SkeletonGroupProps {
  count?: number;
  variant?: SkeletonProps['variant'];
  width?: SkeletonProps['width'];
  height?: SkeletonProps['height'];
  className?: string;
  gap?: string | number;
}

export function SkeletonGroup({
  count = 3,
  variant = 'text',
  width,
  height,
  className = '',
  gap = 'var(--spacing-3)',
}: SkeletonGroupProps) {
  return (
    <div
      className={`${styles.group} ${className}`}
      style={{ gap: typeof gap === 'number' ? `${gap}px` : gap }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant={variant} width={width} height={height} />
      ))}
    </div>
  );
}
