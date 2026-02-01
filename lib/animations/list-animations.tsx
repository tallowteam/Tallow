'use client';

/**
 * List Animation Components
 * Optimized staggered list animations with reduced motion support
 * GPU-accelerated transforms only
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem, transitions, springs } from './presets';

/**
 * ============================================================================
 * ANIMATED LIST - Staggered entrance animations
 * ============================================================================
 */

export interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation (seconds) */
  staggerDelay?: number;
  /** Initial delay before first child (seconds) */
  delayChildren?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Whether to animate only once on viewport entry */
  once?: boolean;
  /** Custom viewport margin for triggering animation */
  viewport?: string;
}

export const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
  (
    {
      children,
      className,
      staggerDelay = 0.05,
      delayChildren = 0.1,
      once = true,
      viewport = '-50px',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }

    const variants = staggerContainer(staggerDelay, delayChildren);

    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial="initial"
        whileInView="animate"
        viewport={{ once, margin: viewport }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedList.displayName = 'AnimatedList';

/**
 * ============================================================================
 * ANIMATED LIST ITEM - Child component for AnimatedList
 * ============================================================================
 */

export interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Custom index for manual stagger control */
  index?: number;
  /** Enable layout animations */
  layout?: boolean;
}

export const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ children, className, direction = 'up', layout = false, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }

    // Direction-based variants
    const directionVariants = {
      up: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      },
      down: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
      },
      left: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
      },
      right: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      },
    };

    return (
      <motion.div
        ref={ref}
        variants={directionVariants[direction]}
        layout={layout}
        transition={transitions.default}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedListItem.displayName = 'AnimatedListItem';

/**
 * ============================================================================
 * GRID LIST - Animated grid with stagger
 * ============================================================================
 */

export interface AnimatedGridProps {
  children: React.ReactNode;
  className?: string;
  /** Grid columns configuration */
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Gap between items */
  gap?: number;
  /** Stagger delay */
  staggerDelay?: number;
  /** Whether to animate only once */
  once?: boolean;
}

export function AnimatedGrid({
  children,
  className,
  cols = { sm: 2, md: 3, lg: 4 },
  gap = 4,
  staggerDelay = 0.05,
  once = true,
}: AnimatedGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const gridCols = cn(
    'grid',
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    `gap-${gap}`
  );

  if (prefersReducedMotion) {
    return <div className={cn(gridCols, className)}>{children}</div>;
  }

  const variants = staggerContainer(staggerDelay, 0.1);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      whileInView="animate"
      viewport={{ once, margin: '-50px' }}
      className={cn(gridCols, className)}
    >
      {children}
    </motion.div>
  );
}

AnimatedGrid.displayName = 'AnimatedGrid';

/**
 * ============================================================================
 * SORTABLE LIST - Animated list with reordering
 * ============================================================================
 */

export interface SortableListProps {
  children: React.ReactNode;
  className?: string;
  /** Layout transition spring config */
  layoutTransition?: typeof springs.standard;
}

export function SortableList({
  children,
  className,
  layoutTransition = springs.standard,
}: SortableListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div layout transition={layoutTransition} className={className}>
      {children}
    </motion.div>
  );
}

SortableList.displayName = 'SortableList';

/**
 * ============================================================================
 * SORTABLE ITEM - Child of SortableList
 * ============================================================================
 */

export interface SortableItemProps {
  children: React.ReactNode;
  className?: string;
  /** Unique ID for the item */
  id: string | number;
  /** Enable drag */
  draggable?: boolean;
}

export const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  ({ children, className, id, draggable = false, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        layout
        layoutId={String(id)}
        drag={draggable ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        whileDrag={{ scale: 1.02, zIndex: 10 }}
        transition={springs.standard}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

SortableItem.displayName = 'SortableItem';

/**
 * ============================================================================
 * CARD GRID - Animated card grid with hover effects
 * ============================================================================
 */

export interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  /** Enable hover lift effect */
  hoverEffect?: boolean;
  /** Grid columns */
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export function CardGrid({
  children,
  className,
  hoverEffect = true,
  cols = { sm: 1, md: 2, lg: 3 },
}: CardGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const gridCols = cn(
    'grid gap-6',
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`
  );

  if (prefersReducedMotion) {
    return <div className={cn(gridCols, className)}>{children}</div>;
  }

  const variants = staggerContainer(0.05, 0.1);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      className={cn(gridCols, className)}
    >
      {React.Children.map(children, (child) => {
        const hoverProps = hoverEffect
          ? {
              whileHover: {
                y: -8,
                scale: 1.02,
                transition: springs.standard,
              },
              whileTap: { scale: 0.98 },
            }
          : {};
        return (
          <motion.div variants={staggerItem} {...hoverProps}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

CardGrid.displayName = 'CardGrid';

/**
 * ============================================================================
 * REMOVE ITEM - Animated item removal
 * ============================================================================
 */

export interface RemovableItemProps {
  children: React.ReactNode | ((props: { onRemove: () => void }) => React.ReactNode);
  /** Item unique ID */
  id: string | number;
  /** Removal callback */
  onRemove?: (id: string | number) => void;
  /** Custom className */
  className?: string;
}

export function RemovableItem({ children, id, onRemove, className }: RemovableItemProps) {
  const [isRemoving, setIsRemoving] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleRemove = () => {
    setIsRemoving(true);
    // Delay actual removal to allow exit animation
    setTimeout(() => {
      onRemove?.(id);
    }, prefersReducedMotion ? 10 : 300);
  };

  if (isRemoving && prefersReducedMotion) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {!isRemoving && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.8,
            height: 0,
            marginBottom: 0,
            transition: transitions.fast,
          }}
          className={className}
        >
          {typeof children === 'function'
            ? children({ onRemove: handleRemove })
            : children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

RemovableItem.displayName = 'RemovableItem';

/**
 * ============================================================================
 * MASONRY GRID - Pinterest-style animated layout
 * ============================================================================
 */

export interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  /** Column count at different breakpoints */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Gap between items */
  gap?: string;
}

export function MasonryGrid({
  children,
  className,
  columns = { sm: 1, md: 2, lg: 3 },
  gap = '1rem',
}: MasonryGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const masonryClass = cn(
    'grid',
    columns.sm && `grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    className
  );

  if (prefersReducedMotion) {
    return (
      <div className={masonryClass} style={{ gap }}>
        {children}
      </div>
    );
  }

  const variants = staggerContainer(0.05, 0.1);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      className={masonryClass}
      style={{ gap }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          layout
          transition={springs.standard}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

MasonryGrid.displayName = 'MasonryGrid';

/**
 * ============================================================================
 * INFINITE SCROLL LIST - Auto-load with animation
 * ============================================================================
 */

export interface InfiniteScrollListProps {
  children: React.ReactNode;
  className?: string;
  /** Callback when reaching bottom */
  onLoadMore?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Has more items */
  hasMore?: boolean;
  /** Loading component */
  loader?: React.ReactNode;
}

export function InfiniteScrollList({
  children,
  className,
  onLoadMore,
  isLoading,
  hasMore,
  loader,
}: InfiniteScrollListProps) {
  const observerRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && hasMore && !isLoading) {
          onLoadMore?.();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const variants = staggerContainer(0.05, 0);

  return (
    <div className={className}>
      {prefersReducedMotion ? (
        <div>{children}</div>
      ) : (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
        >
          {children}
        </motion.div>
      )}
      {hasMore && (
        <div ref={observerRef} className="py-4">
          {isLoading && loader}
        </div>
      )}
    </div>
  );
}

InfiniteScrollList.displayName = 'InfiniteScrollList';
