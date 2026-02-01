'use client';

/**
 * Euveka-Style Stats Row Component
 * Horizontal layout with dashed separators
 *
 * Design inspired by Euveka:
 * - Horizontal layout on desktop, stacked on mobile
 * - Elegant dashed separators between stats
 * - Staggered scroll-triggered animations
 * - Responsive grid layout
 */

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StatCounter, type StatCounterProps } from './stat-counter';

// ============================================================================
// TYPES
// ============================================================================

export interface StatItem extends Omit<StatCounterProps, 'delay'> {
  /** Unique identifier for the stat */
  id: string;
}

export interface StatsRowProps {
  /** Array of stat items to display */
  stats: StatItem[];
  /** Container class name */
  className?: string;
  /** Stagger delay between stat animations (seconds) */
  staggerDelay?: number;
  /** Show dashed separators between stats */
  showSeparators?: boolean;
  /** Separator style */
  separatorStyle?: 'dashed' | 'dotted' | 'solid' | 'gradient';
  /** Size variant for all stats */
  size?: StatCounterProps['size'];
  /** Layout variant */
  variant?: 'default' | 'compact' | 'spacious' | 'centered';
  /** Animation variant */
  animation?: 'fade' | 'scale' | 'slide' | 'none';
  /** Custom separator element */
  customSeparator?: React.ReactNode;
}

// ============================================================================
// LAYOUT CONFIGURATIONS
// ============================================================================

const layoutConfig = {
  default: {
    container: 'gap-8 md:gap-12 lg:gap-16',
    item: 'py-6 md:py-0',
  },
  compact: {
    container: 'gap-4 md:gap-8 lg:gap-12',
    item: 'py-4 md:py-0',
  },
  spacious: {
    container: 'gap-12 md:gap-16 lg:gap-24',
    item: 'py-8 md:py-0',
  },
  centered: {
    container: 'gap-8 md:gap-16 lg:gap-20 justify-center',
    item: 'py-6 md:py-0',
  },
};

// ============================================================================
// SEPARATOR STYLES
// ============================================================================

const separatorStyles = {
  dashed: 'border-dashed border-border/40',
  dotted: 'border-dotted border-border/40',
  solid: 'border-solid border-border/30',
  gradient: 'bg-gradient-to-b from-transparent via-border/30 to-transparent',
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const animationVariants = {
  fade: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  slide: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
};

// ============================================================================
// SEPARATOR COMPONENT
// ============================================================================

interface SeparatorProps {
  style: 'dashed' | 'dotted' | 'solid' | 'gradient';
  customSeparator?: React.ReactNode;
}

function Separator({ style, customSeparator }: SeparatorProps) {
  if (customSeparator) {
    return <>{customSeparator}</>;
  }

  if (style === 'gradient') {
    return (
      <div
        className={cn(
          'hidden md:block w-px h-16 lg:h-20',
          separatorStyles[style]
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        'hidden md:block w-px h-16 lg:h-20 border-l',
        separatorStyles[style]
      )}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StatsRow({
  stats,
  className,
  staggerDelay = 0.15,
  showSeparators = true,
  separatorStyle = 'dashed',
  size = 'lg',
  variant = 'default',
  animation = 'fade',
  customSeparator,
}: StatsRowProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();
  const config = layoutConfig[variant];
  const variants = animationVariants[animation];

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  // Item animation
  const itemVariants = {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: prefersReducedMotion
        ? { duration: 0.01 }
        : {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as const,
          },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={cn(
        // Base layout
        'flex flex-col md:flex-row items-center',
        // Layout variant
        config.container,
        // Custom class
        className
      )}
      role="list"
      aria-label="Statistics"
    >
      {stats.map((stat, index) => (
        <React.Fragment key={stat.id}>
          {/* Stat Item */}
          <motion.div
            variants={itemVariants}
            className={cn(
              'flex-1 min-w-0',
              config.item,
              // Mobile separator (horizontal line)
              showSeparators && index < stats.length - 1 && [
                'md:border-none',
                'border-b border-dashed border-border/30 pb-6 md:pb-0',
                'w-full md:w-auto',
              ]
            )}
            role="listitem"
          >
            <StatCounter
              {...stat}
              size={size}
              delay={index * staggerDelay}
            />
          </motion.div>

          {/* Desktop Separator */}
          {showSeparators && index < stats.length - 1 && (
            <motion.div
              variants={itemVariants}
              className="hidden md:flex items-center"
            >
              <Separator style={separatorStyle} customSeparator={customSeparator} />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
}

StatsRow.displayName = 'StatsRow';

// ============================================================================
// TALLOW STATS SECTION (Pre-configured for TALLOW)
// ============================================================================

export interface TallowStatsSectionProps {
  /** Container class name */
  className?: string;
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Size variant */
  size?: StatCounterProps['size'];
  /** Show section header */
  showHeader?: boolean;
}

/**
 * Pre-configured stats section with TALLOW-specific statistics
 */
export function TallowStatsSection({
  className,
  title = 'TALLOW by the numbers',
  description = 'Privacy-first file transfers at unprecedented speed',
  size = 'xl',
  showHeader = true,
}: TallowStatsSectionProps) {
  const tallowStats: StatItem[] = [
    {
      id: 'transfer-speed',
      value: 2.5,
      suffix: 'GB/s',
      label: 'Transfer Speed',
      sublabel: 'Peak local network speed',
      decimals: 1,
    },
    {
      id: 'encryption',
      value: 256,
      label: 'Bit Encryption',
      sublabel: 'Military-grade AES-256-GCM',
    },
    {
      id: 'files-transferred',
      value: 10000,
      suffix: '+',
      label: 'Files Transferred',
      sublabel: 'By our community',
    },
    {
      id: 'zero-data',
      value: 0,
      label: 'Data Stored',
      sublabel: 'Zero-knowledge architecture',
    },
  ];

  return (
    <section className={cn('py-20 md:py-32', className)}>
      <div className="container mx-auto px-4">
        {showHeader && (
          <div className="text-center mb-16 md:mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-light text-4xl md:text-5xl lg:text-6xl text-foreground mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              {title}
            </motion.h2>
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                {description}
              </motion.p>
            )}
          </div>
        )}

        <StatsRow
          stats={tallowStats}
          size={size}
          variant="spacious"
          separatorStyle="dashed"
        />
      </div>
    </section>
  );
}

TallowStatsSection.displayName = 'TallowStatsSection';

// ============================================================================
// COMPACT STATS GRID
// ============================================================================

export interface StatsGridProps {
  /** Array of stat items to display */
  stats: StatItem[];
  /** Container class name */
  className?: string;
  /** Number of columns */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Size variant for all stats */
  size?: StatCounterProps['size'];
  /** Stagger delay between stat animations */
  staggerDelay?: number;
}

/**
 * Grid layout for stats (alternative to row layout)
 */
export function StatsGrid({
  stats,
  className,
  columns = 4,
  size = 'md',
  staggerDelay = 0.1,
}: StatsGridProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();

  const gridColsMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.4 }}
      className={cn(
        'grid gap-8 md:gap-12',
        gridColsMap[columns],
        className
      )}
      role="list"
      aria-label="Statistics grid"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 0.5,
                  delay: index * staggerDelay,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          className="p-6 rounded-2xl bg-card/50 border border-border/50"
          role="listitem"
        >
          <StatCounter {...stat} size={size} delay={0} />
        </motion.div>
      ))}
    </motion.div>
  );
}

StatsGrid.displayName = 'StatsGrid';

// ============================================================================
// EXPORTS
// ============================================================================

export default StatsRow;
