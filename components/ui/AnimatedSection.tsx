'use client';

import { type CSSProperties, type ReactNode, type ElementType, type JSX, Children, cloneElement, isValidElement } from 'react';
import { useIntersectionObserver, useReducedMotion } from '@/lib/hooks/use-intersection-observer';
import styles from './AnimatedSection.module.css';

export type AnimationType =
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'fadeInScale'
  | 'slideUp'
  | 'blur'
  | 'none';

export interface AnimatedSectionProps {
  children: ReactNode;
  /**
   * Animation type
   * @default 'fadeInUp'
   */
  animation?: AnimationType;
  /**
   * Enable staggered animation for children
   * @default false
   */
  staggerChildren?: boolean;
  /**
   * Delay between each child animation in milliseconds
   * @default 100
   */
  staggerDelay?: number;
  /**
   * Intersection observer threshold (0-1)
   * @default 0.1
   */
  threshold?: number;
  /**
   * Intersection observer root margin
   * @default '0px 0px -50px 0px'
   */
  rootMargin?: string;
  /**
   * Only trigger animation once when element enters viewport
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Animation duration in seconds
   * @default 0.6
   */
  duration?: number;
  /**
   * Animation easing function
   * @default 'cubic-bezier(0.16, 1, 0.3, 1)'
   */
  easing?: string;
  /**
   * Initial delay before animation starts in milliseconds
   * @default 0
   */
  delay?: number;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * HTML element type to render as
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * Additional inline styles
   */
  style?: CSSProperties;
}

/**
 * AnimatedSection - Euveka-level scroll reveal animations
 *
 * Features:
 * - Multiple animation types (fadeInUp, fadeInDown, fadeInLeft, fadeInRight, fadeInScale, slideUp, blur, none)
 * - Stagger support for child elements
 * - Customizable duration, easing, and delay
 * - Enhanced IntersectionObserver options
 * - Respects prefers-reduced-motion
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * <AnimatedSection animation="fadeInUp" staggerChildren staggerDelay={150}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </AnimatedSection>
 * ```
 */
export function AnimatedSection({
  children,
  animation = 'fadeInUp',
  staggerChildren = false,
  staggerDelay = 100,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  duration = 0.6,
  easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
  delay = 0,
  className = '',
  as = 'div',
  style,
  ...props
}: AnimatedSectionProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLElement>({
    threshold,
    triggerOnce,
    rootMargin,
  });

  const prefersReducedMotion = useReducedMotion();

  // Map animation type to CSS class
  const animationClassMap: Record<AnimationType, string> = {
    fadeInUp: styles.fadeInUp ?? '',
    fadeInDown: styles.fadeInDown ?? '',
    fadeInLeft: styles.fadeInLeft ?? '',
    fadeInRight: styles.fadeInRight ?? '',
    fadeInScale: styles.fadeInScale ?? '',
    slideUp: styles.slideUp ?? '',
    blur: styles.blur ?? '',
    none: styles.noAnimation ?? '',
  };

  const animationClass = prefersReducedMotion || animation === 'none'
    ? (styles.noAnimation ?? '')
    : animationClassMap[animation] || (styles.fadeInUp ?? '');

  const visibilityClass = isVisible ? (styles.visible ?? '') : (styles.hidden ?? '');

  // CSS custom properties for animation timing
  const customProperties: CSSProperties = {
    ...style,
    // @ts-ignore - CSS custom properties
    '--animation-duration': `${duration}s`,
    '--animation-easing': easing,
    '--animation-delay': delay > 0 ? `${delay}ms` : '0ms',
  };

  // Handle staggered children
  const processedChildren = staggerChildren && !prefersReducedMotion && animation !== 'none'
    ? Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        // Add stagger index to child as CSS custom property
        const staggerStyle: CSSProperties = {
          // @ts-ignore - CSS custom properties
          '--stagger-index': index,
          '--stagger-delay': `${staggerDelay}ms`,
        };

        const childProps = child.props as Record<string, unknown>;
        return cloneElement(child, {
          // @ts-ignore - merging styles and className
          style: {
            ...staggerStyle,
            ...((childProps.style as CSSProperties) || {}),
          },
          className: `${styles.staggerChild ?? ''} ${(childProps.className as string) || ''}`,
        });
      })
    : children;

  const Component = as as ElementType;

  return (
    <Component
      ref={ref}
      className={`${animationClass} ${visibilityClass} ${className}`.trim()}
      style={customProperties}
      {...props}
    >
      {processedChildren}
    </Component>
  );
}
