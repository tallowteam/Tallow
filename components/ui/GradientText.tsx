import React, { type HTMLAttributes } from 'react';
import styles from './GradientText.module.css';

export type GradientVariant = 'default' | 'purple' | 'blue' | 'green';

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  gradient?: GradientVariant;
  animate?: boolean;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

/**
 * GradientText - Applies gradient text effect
 *
 * @param gradient - Gradient color variant (default: white→purple, purple, blue, green)
 * @param animate - Enable animated gradient shift
 * @param as - HTML element type
 * @param className - Additional CSS classes
 *
 * @example
 * <GradientText gradient="purple" animate>
 *   Beautiful Gradient Text
 * </GradientText>
 */
export function GradientText({
  children,
  gradient = 'default',
  animate = false,
  className = '',
  as: Component = 'span',
  ...props
}: GradientTextProps) {
  const textClasses = [
    styles.gradientText,
    styles[`gradient-${gradient}`],
    animate ? styles.animate : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={textClasses} {...props}>
      {children}
    </Component>
  );
}
