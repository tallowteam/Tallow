/**
 * Responsive Grid Component
 * Automatically adjusts columns based on device breakpoint
 */

'use client';

import React from 'react';


import { useBreakpoint } from '@/lib/hooks/use-breakpoint';
import type { Breakpoint } from '@/lib/hooks/use-breakpoint';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: Partial<Record<Breakpoint, number>>;
  gap?: number | Partial<Record<Breakpoint, number>>;
  className?: string;
  minChildWidth?: string;
  autoFill?: boolean;
}

/**
 * Grid that automatically adjusts columns based on breakpoint
 */
export function ResponsiveGrid({
  children,
  columns = {
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    tv: 4,
  },
  gap = 6,
  className = '',
  minChildWidth,
  autoFill = false,
}: ResponsiveGridProps) {
  const { breakpoint } = useBreakpoint();

  // Get columns for current breakpoint
  const currentColumns = columns[breakpoint] || columns.mobile || 1;

  // Get gap for current breakpoint
  const currentGap = typeof gap === 'number'
    ? gap
    : (gap[breakpoint] || gap.mobile || 6);

  // Build grid template columns
  const gridTemplateColumns = minChildWidth
    ? `repeat(${autoFill ? 'auto-fill' : 'auto-fit'}, minmax(${minChildWidth}, 1fr))`
    : `repeat(${currentColumns}, 1fr)`;

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns,
        gap: `${currentGap * 0.25}rem`, // Tailwind spacing scale
      }}
    >
      {children}
    </div>
  );
}

/**
 * Responsive feature grid with preset configurations
 */
export function FeatureGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,
        tablet: 2,
        laptop: 3,
        desktop: 4,
        tv: 4,
      }}
      gap={{
        mobile: 4,
        tablet: 6,
        laptop: 6,
        desktop: 8,
        tv: 12,
      }}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

/**
 * Responsive card grid with preset configurations
 */
export function CardGrid({
  children,
  className = '',
  dense = false,
}: {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,
        tablet: 2,
        laptop: dense ? 4 : 3,
        desktop: dense ? 5 : 4,
        tv: 4,
      }}
      gap={{
        mobile: 4,
        tablet: 5,
        laptop: 6,
        desktop: 6,
        tv: 10,
      }}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

/**
 * Responsive masonry grid
 */
export function MasonryGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { breakpoint } = useBreakpoint();

  const columnCount = {
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    tv: 4,
  }[breakpoint];

  return (
    <div
      className={className}
      style={{
        columnCount,
        columnGap: breakpoint === 'mobile' ? '1rem' : '1.5rem',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Responsive list grid (for items that need consistent height)
 */
export function ListGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,
        tablet: 1,
        laptop: 2,
        desktop: 2,
        tv: 2,
      }}
      gap={{
        mobile: 3,
        tablet: 4,
        laptop: 5,
        desktop: 6,
        tv: 8,
      }}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

/**
 * Responsive gallery grid (for images)
 */
export function GalleryGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveGrid
      minChildWidth="250px"
      autoFill
      gap={{
        mobile: 2,
        tablet: 3,
        laptop: 4,
        desktop: 4,
        tv: 6,
      }}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}
