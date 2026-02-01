'use client';

/**
 * Prefetch Link Component
 * Intelligent link component with automatic prefetching
 * React 19 and Next.js 16 optimized
 */

import React, { forwardRef, useCallback } from 'react';
import Link, { LinkProps } from 'next/link';
import { useHoverPrefetch } from '@/lib/prefetch/route-prefetcher';

export interface PrefetchLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchDelay?: number;
  prefetchOnHover?: boolean;
  prefetchPriority?: 'high' | 'low' | 'auto';
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Enhanced Link component with hover prefetching
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  function PrefetchLink(
    {
      href,
      children,
      className,
      prefetchDelay = 100,
      prefetchOnHover = true,
      prefetchPriority = 'auto',
      onClick,
      ...props
    },
    ref
  ) {
    const { onMouseEnter, onMouseLeave } = useHoverPrefetch(href, {
      delay: prefetchDelay,
      priority: prefetchPriority,
    });

    const handleMouseEnter = useCallback(
      () => {
        if (prefetchOnHover) {
          onMouseEnter();
        }
      },
      [prefetchOnHover, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      () => {
        if (prefetchOnHover) {
          onMouseLeave();
        }
      },
      [prefetchOnHover, onMouseLeave]
    );

    return (
      <Link
        ref={ref}
        href={href}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick ?? (() => {})}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PrefetchLink.displayName = 'PrefetchLink';

export default PrefetchLink;
