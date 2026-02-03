/**
 * Counter Component
 *
 * Animated number counter that triggers on scroll.
 * Configurable duration and formatting options.
 */

'use client';

import React, { useEffect, useState, useRef, CSSProperties } from 'react';
import { useInView } from '@/lib/animations/useInView';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface CounterProps {
  /**
   * Target number to count to
   */
  end: number;

  /**
   * Starting number
   * @default 0
   */
  start?: number;

  /**
   * Animation duration in milliseconds
   * @default 2000
   */
  duration?: number;

  /**
   * Decimal places
   * @default 0
   */
  decimals?: number;

  /**
   * Prefix (e.g., '$', '+')
   */
  prefix?: string;

  /**
   * Suffix (e.g., '%', 'K', 'M')
   */
  suffix?: string;

  /**
   * Separator for thousands
   * @default ','
   */
  separator?: string;

  /**
   * Decimal separator
   * @default '.'
   */
  decimalSeparator?: string;

  /**
   * Easing function
   * @default 'easeOutExpo'
   */
  easing?: 'linear' | 'easeOutExpo' | 'easeInOutQuad';

  /**
   * Trigger only once
   * @default true
   */
  once?: boolean;

  /**
   * Callback when animation completes
   */
  onComplete?: () => void;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: CSSProperties;

  /**
   * Element tag to render
   * @default 'span'
   */
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Easing functions for counter animation
 */
const easingFunctions = {
  linear: (t: number) => t,
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

/**
 * Format number with separators
 */
function formatNumber(
  value: number,
  decimals: number,
  separator: string,
  decimalSeparator: string
): string {
  const [integer, decimal] = value.toFixed(decimals).split('.');

  // Add thousands separator
  const formattedInteger = (integer || '0').replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return decimals > 0 && decimal
    ? `${formattedInteger}${decimalSeparator}${decimal}`
    : formattedInteger;
}

/**
 * Counter component with scroll-triggered animation
 *
 * @example
 * ```tsx
 * <Counter
 *   end={1000}
 *   duration={2000}
 *   separator=","
 *   suffix="+"
 * />
 * ```
 */
export function Counter({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  decimalSeparator = '.',
  easing = 'easeOutExpo',
  once = true,
  onComplete,
  className = '',
  style = {},
  as = 'span',
}: CounterProps) {
  const Component = as as keyof React.JSX.IntrinsicElements;
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.5, once });
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(start);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || (once && hasAnimated.current)) return;

    // If reduced motion, jump to end immediately
    if (prefersReducedMotion) {
      setCount(end);
      onComplete?.();
      return;
    }

    hasAnimated.current = true;

    const startTime = Date.now();
    const difference = end - start;
    const easingFn = easingFunctions[easing];

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easedProgress = easingFn(progress);
      const currentValue = start + difference * easedProgress;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [
    isInView,
    start,
    end,
    duration,
    easing,
    once,
    onComplete,
    prefersReducedMotion,
  ]);

  const formattedValue = formatNumber(
    count,
    decimals,
    separator,
    decimalSeparator
  );

  return (
    <Component ref={ref as any} className={className} style={style}>
      {prefix}
      {formattedValue}
      {suffix}
    </Component>
  );
}

/**
 * Counter with plus sign for positive numbers
 *
 * @example
 * ```tsx
 * <CounterPlus end={1500} />
 * // Output: +1,500
 * ```
 */
export function CounterPlus({
  end,
  ...props
}: Omit<CounterProps, 'prefix' | 'suffix'>) {
  return <Counter end={end} prefix={end > 0 ? '+' : ''} {...props} />;
}

/**
 * Percentage counter
 *
 * @example
 * ```tsx
 * <PercentageCounter end={95.5} decimals={1} />
 * // Output: 95.5%
 * ```
 */
export function PercentageCounter({
  end,
  ...props
}: Omit<CounterProps, 'suffix'>) {
  return <Counter end={end} suffix="%" {...props} />;
}

/**
 * Currency counter
 *
 * @example
 * ```tsx
 * <CurrencyCounter end={1250} currency="$" />
 * // Output: $1,250
 * ```
 */
export function CurrencyCounter({
  end,
  currency = '$',
  ...props
}: Omit<CounterProps, 'prefix'> & { currency?: string }) {
  return <Counter end={end} prefix={currency} {...props} />;
}

/**
 * Abbreviated counter (K, M, B)
 *
 * @example
 * ```tsx
 * <AbbreviatedCounter end={1500000} />
 * // Output: 1.5M
 * ```
 */
export function AbbreviatedCounter({
  end,
  ...props
}: Omit<CounterProps, 'end' | 'suffix'> & { end: number }) {
  let value = end;
  let suffix = '';
  let decimals = 0;

  if (end >= 1_000_000_000) {
    value = end / 1_000_000_000;
    suffix = 'B';
    decimals = 1;
  } else if (end >= 1_000_000) {
    value = end / 1_000_000;
    suffix = 'M';
    decimals = 1;
  } else if (end >= 1_000) {
    value = end / 1_000;
    suffix = 'K';
    decimals = 1;
  }

  return <Counter end={value} suffix={suffix} decimals={decimals} {...props} />;
}

/**
 * Stat card with animated counter
 *
 * @example
 * ```tsx
 * <CounterStat
 *   value={1250}
 *   label="Users"
 *   suffix="+"
 * />
 * ```
 */
export function CounterStat({
  value,
  label,
  description,
  className = '',
  style = {},
  ...counterProps
}: Omit<CounterProps, 'end'> & {
  value: number;
  label: string;
  description?: string;
}) {
  const containerStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    ...style,
  };

  const valueStyles: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    lineHeight: 1,
  };

  const labelStyles: CSSProperties = {
    fontSize: '1rem',
    opacity: 0.7,
  };

  return (
    <div className={className} style={containerStyles}>
      <Counter
        end={value}
        style={valueStyles}
        as="div"
        {...counterProps}
      />
      <div style={labelStyles}>{label}</div>
      {description && (
        <div style={{ fontSize: '0.875rem', opacity: 0.5 }}>
          {description}
        </div>
      )}
    </div>
  );
}

/**
 * Multiple counters in a grid
 *
 * @example
 * ```tsx
 * <CounterGrid
 *   stats={[
 *     { value: 1000, label: 'Users', suffix: '+' },
 *     { value: 50, label: 'Countries' },
 *     { value: 99.9, label: 'Uptime', suffix: '%' },
 *   ]}
 * />
 * ```
 */
export function CounterGrid({
  stats,
  columns = 3,
  gap = '2rem',
  className = '',
  style = {},
}: {
  stats: Array<{
    value: number;
    label: string;
    description?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }>;
  columns?: number;
  gap?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const gridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
    ...style,
  };

  return (
    <div className={className} style={gridStyles}>
      {stats.map((stat, index) => (
        <CounterStat key={index} {...stat} />
      ))}
    </div>
  );
}
