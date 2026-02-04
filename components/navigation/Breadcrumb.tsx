'use client';

import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
  homeIcon?: React.ReactNode;
  maxItems?: number;
  className?: string;
}

const defaultHomeIcon = (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const defaultSeparator = (
  <svg
    className="w-4 h-4 text-zinc-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

/**
 * Breadcrumb - Navigation breadcrumb component
 *
 * Features:
 * - Dynamic items with links
 * - Home icon support
 * - Custom separator
 * - Truncation for long paths
 * - ARIA navigation
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Current Project' }
 *   ]}
 *   showHomeIcon
 * />
 * ```
 */
export function Breadcrumb({
  items,
  separator = defaultSeparator,
  showHomeIcon = false,
  homeIcon = defaultHomeIcon,
  maxItems,
  className = '',
}: BreadcrumbProps) {
  // Truncate items if maxItems is specified
  let displayItems = items;
  let isCollapsed = false;

  if (maxItems && items.length > maxItems) {
    isCollapsed = true;
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));
    displayItems = [firstItem, ...lastItems];
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 flex-wrap">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;
          const isCollapsedIndicator = isCollapsed && index === 1;

          // Show collapsed indicator
          if (isCollapsedIndicator) {
            return (
              <React.Fragment key="collapsed">
                <li className="flex items-center gap-2">
                  <span
                    className="text-zinc-500 px-2"
                    aria-label="More items"
                  >
                    ...
                  </span>
                </li>
                <li aria-hidden="true" className="flex items-center">
                  {separator}
                </li>
              </React.Fragment>
            );
          }

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="flex items-center">
                  {separator}
                </span>
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-1"
                >
                  {isFirst && showHomeIcon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {homeIcon}
                    </span>
                  )}
                  {item.icon && !showHomeIcon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-2 text-sm ${
                    isLast ? 'text-white font-medium' : 'text-zinc-400'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && showHomeIcon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {homeIcon}
                    </span>
                  )}
                  {item.icon && !showHomeIcon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
