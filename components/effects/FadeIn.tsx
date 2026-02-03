/**
 * FadeIn Component
 *
 * Fade in animation with directional options.
 * Triggers on scroll using Intersection Observer.
 */

'use client';

import React, { CSSProperties } from 'react';
import { useInView } from '@/lib/animations/useInView';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';
import { DURATION, EASING } from '@/lib/animations';

export interface FadeInProps {
  /**
   * Child elements to animate
   */
  children: React.ReactNode;

  /**
   * Animation direction
   * @default 'up'
   */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';

  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;

  /**
   * Animation duration in milliseconds
   * @default 500
   */
  duration?: number;

  /**
   * Distance to travel during animation (in pixels)
   * @default 20
   */
  distance?: number;

  /**
   * Trigger animation only once
   * @default true
   */
  once?: boolean;

  /**
   * Intersection threshold (0-1)
   * @default 0.1
   */
  threshold?: number;

  /**
   * Root margin for intersection observer
   * @default '0px'
   */
  rootMargin?: string;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: CSSProperties;

  /**
   * Element tag to render
   * @default 'div'
   */
  as?: keyof React.JSX.IntrinsicElements;

  /**
   * Stagger children animations
   * @default false
   */
  stagger?: boolean;

  /**
   * Stagger delay between children (ms)
   * @default 50
   */
  staggerDelay?: number;
}

/**
 * FadeIn component with scroll-triggered animation
 *
 * @example
 * ```tsx
 * <FadeIn direction="up" delay={100}>
 *   <h1>Animated Heading</h1>
 * </FadeIn>
 * ```
 */
export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = DURATION.slow,
  distance = 20,
  once = true,
  threshold = 0.1,
  rootMargin = '0px',
  className = '',
  style = {},
  as = 'div',
  stagger = false,
  staggerDelay = 50,
}: FadeInProps) {
  const Component = as as keyof React.JSX.IntrinsicElements;
  const { ref, isInView } = useInView<HTMLElement>({
    threshold,
    rootMargin,
    once,
  });

  const prefersReducedMotion = useReducedMotion();

  // Transform values based on direction
  const getTransform = (visible: boolean) => {
    if (prefersReducedMotion || visible) {
      return 'translate3d(0, 0, 0)';
    }

    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0)`;
      case 'down':
        return `translate3d(0, -${distance}px, 0)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0)`;
      default:
        return 'translate3d(0, 0, 0)';
    }
  };

  const baseStyles: CSSProperties = {
    opacity: prefersReducedMotion ? 1 : isInView ? 1 : 0,
    transform: getTransform(isInView),
    transition: prefersReducedMotion
      ? 'none'
      : `opacity ${duration}ms ${EASING.easeOut} ${delay}ms,
         transform ${duration}ms ${EASING.easeOut} ${delay}ms`,
    willChange: isInView ? 'auto' : 'opacity, transform',
    ...style,
  };

  // If stagger is enabled and children is an array
  if (stagger && Array.isArray(children)) {
    return (
      <Component ref={ref as any} className={className} style={style}>
        {React.Children.map(children, (child, index) => {
          const childDelay = delay + index * staggerDelay;
          const childStyles: CSSProperties = {
            opacity: prefersReducedMotion ? 1 : isInView ? 1 : 0,
            transform: getTransform(isInView),
            transition: prefersReducedMotion
              ? 'none'
              : `opacity ${duration}ms ${EASING.easeOut} ${childDelay}ms,
                 transform ${duration}ms ${EASING.easeOut} ${childDelay}ms`,
            willChange: isInView ? 'auto' : 'opacity, transform',
          };

          return (
            <div style={childStyles} key={index}>
              {child}
            </div>
          );
        })}
      </Component>
    );
  }

  return (
    <Component ref={ref as any} className={className} style={baseStyles}>
      {children}
    </Component>
  );
}

/**
 * FadeInStagger - Wrapper for staggered children animations
 *
 * @example
 * ```tsx
 * <FadeInStagger staggerDelay={100}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </FadeInStagger>
 * ```
 */
export function FadeInStagger({
  children,
  staggerDelay = 50,
  ...props
}: Omit<FadeInProps, 'stagger'>) {
  return (
    <FadeIn {...props} stagger staggerDelay={staggerDelay}>
      {children}
    </FadeIn>
  );
}
