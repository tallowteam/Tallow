'use client';

/**
 * Lazy Section Component
 *
 * Defers rendering of below-fold content until it's near the viewport.
 * Uses Intersection Observer for efficient visibility detection.
 *
 * Benefits:
 * - Reduces initial JavaScript execution
 * - Improves LCP and TTI metrics
 * - Lower memory usage on initial load
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  /** Content to render when visible */
  children: ReactNode;
  /** Additional classes for the container */
  className?: string;
  /** How far before the viewport to start loading (CSS margin format) */
  rootMargin?: string;
  /** Minimum height before content loads (prevents layout shift) */
  minHeight?: string;
  /** Placeholder to show while loading */
  placeholder?: ReactNode;
  /** Whether to keep content mounted after first view */
  keepMounted?: boolean;
  /** Callback when section becomes visible */
  onVisible?: () => void;
}

export function LazySection({
  children,
  className,
  rootMargin = '100px',
  minHeight = '500px',
  placeholder,
  keepMounted = true,
  onVisible,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) { return; }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          onVisible?.();

          if (keepMounted) {
            observer.disconnect();
          }
        } else if (!keepMounted) {
          setIsVisible(false);
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, keepMounted, onVisible]);

  const shouldRender = keepMounted ? hasBeenVisible : isVisible;

  return (
    <div
      ref={ref}
      className={cn('lazy-section', className)}
      style={{
        minHeight: shouldRender ? 'auto' : minHeight,
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${minHeight}`,
      }}
    >
      {shouldRender ? children : placeholder}
    </div>
  );
}

/**
 * Animate on visible wrapper
 * Adds fade-in animation when section enters viewport
 */
interface AnimateOnVisibleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  rootMargin?: string;
}

export function AnimateOnVisible({
  children,
  className,
  delay = 0,
  duration = 0.6,
  rootMargin = '-50px',
}: AnimateOnVisibleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) { return; }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className
      )}
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}s`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default LazySection;
