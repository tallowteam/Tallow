'use client';

/**
 * Euveka-Style Stat Counter Component
 * Large elegant numbers with thin typography and animated count-up
 *
 * Design inspired by Euveka:
 * - Large numbers: "10,000", "90 sec", "80%", "40%"
 * - Thin elegant font (Cormorant Garamond 300)
 * - Subtle descriptive text below
 * - Scroll-triggered animations
 */

import * as React from 'react';
import { motion, useMotionValue, animate, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface StatCounterProps {
  /** The target value to count to */
  value: number;
  /** Optional suffix (e.g., "%", "+", "GB/s", "sec") */
  suffix?: string;
  /** Optional prefix (e.g., "<", ">", "$") */
  prefix?: string;
  /** Label/description displayed below the number */
  label: string;
  /** Optional sublabel for additional context */
  sublabel?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Animation delay in seconds */
  delay?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Whether to format with locale (add commas) */
  formatLocale?: boolean;
  /** Custom formatter function */
  formatter?: (value: number) => string;
  /** Container class name */
  className?: string;
  /** Value class name for custom styling */
  valueClassName?: string;
  /** Label class name for custom styling */
  labelClassName?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show the value immediately (no animation) */
  immediate?: boolean;
  /** Animation easing type */
  easing?: 'linear' | 'easeOut' | 'spring';
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const sizeConfig = {
  sm: {
    value: 'text-3xl sm:text-4xl',
    label: 'text-xs sm:text-sm',
    sublabel: 'text-xs',
    spacing: 'gap-1',
  },
  md: {
    value: 'text-4xl sm:text-5xl md:text-6xl',
    label: 'text-sm sm:text-base',
    sublabel: 'text-xs sm:text-sm',
    spacing: 'gap-1.5',
  },
  lg: {
    value: 'text-5xl sm:text-6xl md:text-7xl',
    label: 'text-base sm:text-lg',
    sublabel: 'text-sm',
    spacing: 'gap-2',
  },
  xl: {
    value: 'text-6xl sm:text-7xl md:text-8xl',
    label: 'text-lg sm:text-xl',
    sublabel: 'text-base',
    spacing: 'gap-3',
  },
  '2xl': {
    value: 'text-7xl sm:text-8xl md:text-9xl',
    label: 'text-xl sm:text-2xl',
    sublabel: 'text-lg',
    spacing: 'gap-4',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function StatCounter({
  value,
  suffix = '',
  prefix = '',
  label,
  sublabel,
  duration = 2.5,
  delay = 0,
  decimals = 0,
  formatLocale = true,
  formatter,
  className,
  valueClassName,
  labelClassName,
  size = 'lg',
  immediate = false,
  easing = 'easeOut',
}: StatCounterProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);
  const config = sizeConfig[size];

  const formatNumber = React.useCallback(
    (num: number): string => {
      if (formatter) {return formatter(num);}
      const roundedNum = Number(num.toFixed(decimals));
      if (formatLocale) {
        return roundedNum.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      return roundedNum.toFixed(decimals);
    },
    [formatter, decimals, formatLocale]
  );

  React.useEffect(() => {
    if (!isInView) {return;}
    if (prefersReducedMotion || immediate) {
      setDisplayValue(value);
      return;
    }
    const easingConfig = {
      linear: { ease: 'linear' as const },
      easeOut: { ease: [0, 0, 0.2, 1] as const },
      spring: { type: 'spring' as const, stiffness: 50, damping: 20 },
    }[easing];
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ...easingConfig,
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [isInView, value, duration, delay, prefersReducedMotion, immediate, motionValue, easing]);

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : false}
      transition={
        prefersReducedMotion
          ? { duration: 0.01 }
          : { duration: 0.6, delay: delay * 0.3, ease: [0.16, 1, 0.3, 1] }
      }
      className={cn('flex flex-col items-center text-center', config.spacing, className)}
    >
      <div
        className={cn(
          'font-display font-light tracking-tight text-foreground tabular-nums dark:text-glow',
          config.value,
          valueClassName
        )}
        style={{ fontFeatureSettings: '"tnum" 1', letterSpacing: '-0.03em' }}
      >
        {prefix && <span className="text-muted-foreground opacity-70">{prefix}</span>}
        <span>{formatNumber(displayValue)}</span>
        {suffix && <span className="text-muted-foreground opacity-70 ml-1">{suffix}</span>}
      </div>
      <p
        className={cn(
          'font-sans font-medium tracking-wide text-muted-foreground uppercase',
          config.label,
          labelClassName
        )}
        style={{ letterSpacing: '0.1em' }}
      >
        {label}
      </p>
      {sublabel && (
        <p className={cn('font-sans text-muted-foreground/60', config.sublabel)}>{sublabel}</p>
      )}
    </motion.div>
  );
}

StatCounter.displayName = 'StatCounter';

export interface PercentageStatProps extends Omit<StatCounterProps, 'suffix' | 'decimals'> {
  decimals?: number;
}

export function PercentageStat({ decimals = 0, ...props }: PercentageStatProps) {
  return <StatCounter {...props} suffix="%" decimals={decimals} />;
}

PercentageStat.displayName = 'PercentageStat';

export interface SpeedStatProps extends Omit<StatCounterProps, 'suffix'> {
  unit?: 'MB/s' | 'GB/s' | 'Gbps' | 'Mbps';
}

export function SpeedStat({ unit = 'GB/s', ...props }: SpeedStatProps) {
  return <StatCounter {...props} suffix={unit} />;
}

SpeedStat.displayName = 'SpeedStat';

export interface TimeStatProps extends Omit<StatCounterProps, 'suffix'> {
  unit?: 'sec' | 'ms' | 'min' | 'hrs';
}

export function TimeStat({ unit = 'sec', ...props }: TimeStatProps) {
  return <StatCounter {...props} suffix={unit} />;
}

TimeStat.displayName = 'TimeStat';

export interface CountStatProps extends Omit<StatCounterProps, 'suffix'> {
  showPlus?: boolean;
}

export function CountStat({ showPlus = true, ...props }: CountStatProps) {
  return <StatCounter {...props} suffix={showPlus ? '+' : ''} />;
}

CountStat.displayName = 'CountStat';

export interface UseAnimatedValueOptions {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  easing?: 'linear' | 'easeOut' | 'spring';
}

export function useAnimatedValue({
  value,
  duration = 2.5,
  delay = 0,
  decimals = 0,
  easing = 'easeOut',
}: UseAnimatedValueOptions) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (!isInView) {return;}
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    const easingConfig = {
      linear: { ease: 'linear' as const },
      easeOut: { ease: [0, 0, 0.2, 1] as const },
      spring: { type: 'spring' as const, stiffness: 50, damping: 20 },
    }[easing];
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ...easingConfig,
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [isInView, value, duration, delay, prefersReducedMotion, motionValue, easing]);

  return { ref, displayValue: Number(displayValue.toFixed(decimals)), isInView };
}

export default StatCounter;
