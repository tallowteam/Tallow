'use client';

import React from 'react';

/**
 * Visually Hidden Component
 * WCAG 2.1 AA: Provides screen-reader-only text
 * Text is hidden visually but accessible to assistive technology
 *
 * Use for:
 * - Additional context for screen readers
 * - Icon-only buttons (describe purpose)
 * - Form labels that aren't visually shown
 * - Status messages that don't need visual presentation
 */


import { cn } from '@/lib/utils';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Element type to render
   * @default 'span'
   */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  children: React.ReactNode;
}

/**
 * Screen reader only component
 * Uses sr-only class which provides:
 * - position: absolute
 * - width: 1px, height: 1px
 * - padding: 0, margin: -1px
 * - overflow: hidden
 * - clip: rect(0, 0, 0, 0)
 * - white-space: nowrap
 * - border-width: 0
 */
export function VisuallyHidden({
  as: Component = 'span',
  className,
  children,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component className={cn('sr-only', className)} {...props}>
      {children}
    </Component>
  );
}

/**
 * Focusable visually hidden component
 * Becomes visible when focused (for skip links, etc.)
 */
export interface FocusableHiddenProps extends VisuallyHiddenProps {
  /**
   * Classes to apply when focused
   */
  focusClasses?: string;
}

export function FocusableHidden({
  as: Component = 'span',
  className,
  focusClasses = 'focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-md',
  children,
  ...props
}: FocusableHiddenProps) {
  return (
    <Component className={cn('sr-only', focusClasses, className)} {...props}>
      {children}
    </Component>
  );
}

export default VisuallyHidden;
