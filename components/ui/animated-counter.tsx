'use client';

/**
 * Animated Counter Component
 * Number animation from 0 to target value
 * Perfect for stats sections, dashboards, and metrics displays
 */

import * as React from 'react';
import {
  motion,
  useMotionValue,
  animate,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * AnimatedCounter - Animates a number from 0 to target value
 */
export interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before starting animation */
  delay?: number;
  /** Number of decimal places to show */
  decimals?: number;
  /** Prefix to display before the number (e.g., "$") */
  prefix?: string;
  /** Suffix to display after the number (e.g., "%", "+") */
  suffix?: string;
  /** Custom formatting function */
  formatter?: (value: number) => string;
  /** Class name for the container */
  className?: string;
  /** Whether to animate only once when in view */
  once?: boolean;
  /** Whether to use locale-specific number formatting */
  useLocale?: boolean;
  /** Easing function type */
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
}

export function AnimatedCounter({
  value,
  duration = 2,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
  className,
  once = true,
  useLocale = true,
  easing = 'easeOut',
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  // Format the displayed number
  const formatNumber = React.useCallback(
    (num: number): string => {
      if (formatter) {
        return formatter(num);
      }

      const roundedNum = Number(num.toFixed(decimals));

      if (useLocale) {
        return roundedNum.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }

      return roundedNum.toFixed(decimals);
    },
    [formatter, decimals, useLocale]
  );

  React.useEffect(() => {
    if (!isInView) {return;}

    // If reduced motion is preferred, show final value immediately
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // Get the easing configuration
    const easingConfig = {
      linear: { ease: 'linear' as const },
      easeOut: { ease: [0, 0, 0.2, 1] as const },
      easeInOut: { ease: [0.4, 0, 0.2, 1] as const },
      spring: { type: 'spring' as const, stiffness: 100, damping: 30 },
    }[easing];

    // Start animation
    const controls = animate(count, value, {
      duration,
      delay,
      ...easingConfig,
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, delay, prefersReducedMotion, count, easing]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

AnimatedCounter.displayName = 'AnimatedCounter';

/**
 * AnimatedPercentage - Specialized counter for percentages
 */
export interface AnimatedPercentageProps
  extends Omit<AnimatedCounterProps, 'suffix' | 'decimals'> {
  /** Number of decimal places for percentage */
  decimals?: number;
}

export function AnimatedPercentage({
  decimals = 0,
  ...props
}: AnimatedPercentageProps) {
  return <AnimatedCounter {...props} decimals={decimals} suffix="%" />;
}

AnimatedPercentage.displayName = 'AnimatedPercentage';

/**
 * AnimatedCurrency - Specialized counter for currency values
 */
export interface AnimatedCurrencyProps
  extends Omit<AnimatedCounterProps, 'prefix' | 'useLocale'> {
  /** Currency symbol or code */
  currency?: string;
  /** Position of currency symbol */
  currencyPosition?: 'before' | 'after';
}

export function AnimatedCurrency({
  currency = '$',
  currencyPosition = 'before',
  ...props
}: AnimatedCurrencyProps) {
  return (
    <AnimatedCounter
      {...props}
      prefix={currencyPosition === 'before' ? currency : ''}
      suffix={currencyPosition === 'after' ? ` ${currency}` : ''}
      useLocale
    />
  );
}

AnimatedCurrency.displayName = 'AnimatedCurrency';

/**
 * StatsCard - Complete animated stats card component
 */
export interface StatsCardProps {
  /** Label for the stat */
  label: string;
  /** Target value */
  value: number;
  /** Prefix (e.g., "$") */
  prefix?: string;
  /** Suffix (e.g., "+", "%") */
  suffix?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional description text */
  description?: string;
  /** Container class name */
  className?: string;
  /** Value class name */
  valueClassName?: string;
  /** Label class name */
  labelClassName?: string;
  /** Animation duration */
  duration?: number;
  /** Animation delay */
  delay?: number;
  /** Number of decimal places */
  decimals?: number;
}

export function StatsCard({
  label,
  value,
  prefix,
  suffix,
  icon,
  description,
  className,
  valueClassName,
  labelClassName,
  duration = 2,
  delay = 0,
  decimals = 0,
}: StatsCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : false}
      transition={
        prefersReducedMotion
          ? { duration: 0.01 }
          : { duration: 0.5, delay: delay * 0.5 }
      }
      className={cn(
        'flex flex-col items-center text-center p-6 rounded-xl',
        'bg-card border border-border',
        className
      )}
    >
      {icon && (
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { type: 'spring', stiffness: 300, damping: 20, delay: delay * 0.5 + 0.2 }
          }
          className="mb-4 text-primary"
        >
          {icon}
        </motion.div>
      )}
      <div className={cn('text-4xl font-bold text-foreground', valueClassName)}>
        <AnimatedCounter
          value={value}
          prefix={prefix ?? ''}
          suffix={suffix ?? ''}
          duration={duration}
          delay={delay}
          decimals={decimals}
        />
      </div>
      <p className={cn('mt-2 text-sm font-medium text-muted-foreground', labelClassName)}>
        {label}
      </p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
      )}
    </motion.div>
  );
}

StatsCard.displayName = 'StatsCard';

/**
 * StatsGrid - Grid layout for multiple stats
 */
export interface StatsGridProps {
  /** Stats to display */
  stats: Array<Omit<StatsCardProps, 'delay'>>;
  /** Container class name */
  className?: string;
  /** Stagger delay between stats (seconds) */
  staggerDelay?: number;
  /** Number of columns on different breakpoints */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export function StatsGrid({
  stats,
  className,
  staggerDelay = 0.1,
  columns = { sm: 2, md: 3, lg: 4 },
}: StatsGridProps) {
  const getGridCols = () => {
    const colClasses: string[] = ['grid-cols-1'];
    if (columns.sm) {colClasses.push(`sm:grid-cols-${columns.sm}`);}
    if (columns.md) {colClasses.push(`md:grid-cols-${columns.md}`);}
    if (columns.lg) {colClasses.push(`lg:grid-cols-${columns.lg}`);}
    return colClasses.join(' ');
  };

  return (
    <div className={cn('grid gap-4', getGridCols(), className)}>
      {stats.map((stat, index) => (
        <StatsCard key={stat.label} {...stat} delay={index * staggerDelay} />
      ))}
    </div>
  );
}

StatsGrid.displayName = 'StatsGrid';

/**
 * CountUp - Simple inline counter without any styling
 * For maximum flexibility in custom layouts
 */
export interface CountUpProps {
  /** Target value */
  to: number;
  /** Starting value */
  from?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Animation delay (seconds) */
  delay?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Custom render function */
  children?: (value: number) => React.ReactNode;
}

export function CountUp({
  to,
  from = 0,
  duration = 2,
  delay = 0,
  decimals = 0,
  children,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(from);

  React.useEffect(() => {
    if (!isInView) {return;}

    if (prefersReducedMotion) {
      setDisplayValue(to);
      return;
    }

    const controls = animate(from, to, {
      duration,
      delay,
      ease: [0, 0, 0.2, 1],
      onUpdate: (latest) => setDisplayValue(latest),
    });

    return () => controls.stop();
  }, [isInView, from, to, duration, delay, prefersReducedMotion]);

  const formattedValue = Number(displayValue.toFixed(decimals));

  return (
    <span ref={ref}>
      {children ? children(formattedValue) : formattedValue}
    </span>
  );
}

CountUp.displayName = 'CountUp';
