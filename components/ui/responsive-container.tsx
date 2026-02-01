/**
 * Responsive Container Component
 * Provides consistent padding and max-width across breakpoints
 */

'use client';

import React from 'react';


import { useBreakpoint } from '@/lib/hooks/use-breakpoint';
import type { Breakpoint } from '@/lib/hooks/use-breakpoint';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'narrow' | 'default' | 'wide' | 'full' | Partial<Record<Breakpoint, string>>;
  padding?: boolean | Partial<Record<Breakpoint, number>>;
  center?: boolean;
}

const MAX_WIDTH_PRESETS = {
  narrow: {
    mobile: '100%',
    tablet: '640px',
    laptop: '768px',
    desktop: '896px',
    tv: '1024px',
  },
  default: {
    mobile: '100%',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
    tv: '1536px',
  },
  wide: {
    mobile: '100%',
    tablet: '100%',
    laptop: '1280px',
    desktop: '1536px',
    tv: '1920px',
  },
  full: {
    mobile: '100%',
    tablet: '100%',
    laptop: '100%',
    desktop: '100%',
    tv: '100%',
  },
};

const DEFAULT_PADDING = {
  mobile: 4,    // 1rem
  tablet: 6,    // 1.5rem
  laptop: 8,    // 2rem
  desktop: 10,  // 2.5rem
  tv: 16,       // 4rem
};

/**
 * Container component with responsive padding and max-width
 */
export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'default',
  padding = true,
  center = true,
}: ResponsiveContainerProps) {
  const { breakpoint } = useBreakpoint();

  // Get max-width for current breakpoint
  const maxWidthValue = typeof maxWidth === 'string'
    ? MAX_WIDTH_PRESETS[maxWidth][breakpoint]
    : maxWidth[breakpoint] || '100%';

  // Get padding for current breakpoint
  const paddingValue = padding === false
    ? 0
    : padding === true
    ? DEFAULT_PADDING[breakpoint]
    : padding[breakpoint] || DEFAULT_PADDING[breakpoint];

  return (
    <div
      className={`${center ? 'mx-auto' : ''} ${className}`}
      style={{
        maxWidth: maxWidthValue,
        paddingLeft: `${paddingValue * 0.25}rem`,
        paddingRight: `${paddingValue * 0.25}rem`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Narrow container for reading content
 */
export function NarrowContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveContainer maxWidth="narrow" className={className}>
      {children}
    </ResponsiveContainer>
  );
}

/**
 * Wide container for dashboards and data
 */
export function WideContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveContainer maxWidth="wide" className={className}>
      {children}
    </ResponsiveContainer>
  );
}

/**
 * Full-width container with padding
 */
export function FullWidthContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveContainer maxWidth="full" className={className}>
      {children}
    </ResponsiveContainer>
  );
}

/**
 * Section container with vertical spacing
 */
export function SectionContainer({
  children,
  className = '',
  spacing = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  spacing?: 'compact' | 'default' | 'spacious';
}) {
  const { breakpoint } = useBreakpoint();

  const spacingMap = {
    compact: {
      mobile: 8,
      tablet: 12,
      laptop: 16,
      desktop: 20,
      tv: 24,
    },
    default: {
      mobile: 12,
      tablet: 16,
      laptop: 20,
      desktop: 24,
      tv: 32,
    },
    spacious: {
      mobile: 16,
      tablet: 24,
      laptop: 32,
      desktop: 40,
      tv: 48,
    },
  };

  const verticalPadding = spacingMap[spacing][breakpoint];

  return (
    <section
      className={className}
      style={{
        paddingTop: `${verticalPadding * 0.25}rem`,
        paddingBottom: `${verticalPadding * 0.25}rem`,
      }}
    >
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </section>
  );
}
