import React, { type HTMLAttributes } from 'react';
import styles from './GlassCard.module.css';

export type GlassCardPadding = 'sm' | 'md' | 'lg';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  padding?: GlassCardPadding;
  className?: string;
  as?: 'div' | 'article' | 'section';
}

/**
 * GlassCard - Glassmorphism card component
 *
 * @param hover - Enable lift effect on hover
 * @param glow - Enable purple border glow on hover
 * @param padding - Internal padding size (sm: 16px, md: 24px, lg: 32px)
 * @param as - HTML element type
 * @param className - Additional CSS classes
 *
 * @example
 * <GlassCard hover glow padding="lg">
 *   <h3>Glassmorphism Card</h3>
 *   <p>Beautiful frosted glass effect</p>
 * </GlassCard>
 */
export function GlassCard({
  children,
  hover = false,
  glow = false,
  padding = 'md',
  className = '',
  as: Component = 'div',
  ...props
}: GlassCardProps) {
  const cardClasses = [
    styles.glassCard,
    hover ? styles.hover : '',
    glow ? styles.glow : '',
    styles[`padding-${padding}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={cardClasses} {...props}>
      {children}
    </Component>
  );
}
