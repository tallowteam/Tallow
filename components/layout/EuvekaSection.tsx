import React, { type HTMLAttributes } from 'react';
import styles from './EuvekaSection.module.css';

export type BackgroundVariant = 'default' | 'gradient' | 'dots' | 'grid' | 'noise';
export type PaddingSize = 'sm' | 'md' | 'lg';

export interface EuvekaSectionProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  background?: BackgroundVariant;
  padding?: PaddingSize;
  fullHeight?: boolean;
  className?: string;
  id?: string;
}

/**
 * EuvekaSection - Full-viewport section component for marketing pages
 *
 * @param background - Background style variant (default, gradient, dots, grid, noise)
 * @param padding - Vertical padding size (sm: 80px, md: 120px, lg: 160px)
 * @param fullHeight - Enable min-height: 100vh
 * @param className - Additional CSS classes
 * @param id - HTML id attribute for anchor links
 *
 * @example
 * <EuvekaSection background="gradient" padding="lg" id="hero">
 *   <EuvekaContainer>
 *     <h1>Welcome to Tallow</h1>
 *   </EuvekaContainer>
 * </EuvekaSection>
 */
export function EuvekaSection({
  children,
  background = 'default',
  padding = 'md',
  fullHeight = false,
  className = '',
  id,
  ...props
}: EuvekaSectionProps) {
  const sectionClasses = [
    styles.section,
    styles[`bg-${background}`],
    styles[`padding-${padding}`],
    fullHeight ? styles.fullHeight : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <section
      id={id}
      className={sectionClasses}
      {...props}
    >
      {children}
    </section>
  );
}
