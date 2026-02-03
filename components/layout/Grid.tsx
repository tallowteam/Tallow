import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GridColumns = 1 | 2 | 3 | 4;
export type GridGap = 'sm' | 'md' | 'lg' | 'xl';

interface GridProps {
  children: ReactNode;
  cols?: GridColumns;
  gap?: GridGap;
  className?: string;
  responsive?: boolean;
}

const colClasses: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const gapClasses: Record<GridGap, string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

/**
 * Responsive grid component with configurable columns and gaps
 *
 * @example
 * ```tsx
 * <Grid cols={3} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 * ```
 */
export function Grid({
  children,
  cols = 3,
  gap = 'md',
  className,
  responsive = true,
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        responsive ? colClasses[cols] : `grid-cols-${cols}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
