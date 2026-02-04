/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible to screen readers
 * WCAG 2.1: 1.3.1 Info and Relationships (Level A)
 */

'use client';

import { HTMLAttributes, ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  className = '',
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      className={`${styles.visuallyHidden} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Combined visual + screen reader text
 */
export interface ScreenReaderOnlyProps extends HTMLAttributes<HTMLSpanElement> {
  visualText?: ReactNode;
  srText: ReactNode;
}

export function ScreenReaderText({
  visualText,
  srText,
  className = '',
  ...props
}: ScreenReaderOnlyProps) {
  return (
    <span className={className} {...props}>
      {visualText && <span aria-hidden="true">{visualText}</span>}
      <VisuallyHidden>{srText}</VisuallyHidden>
    </span>
  );
}
