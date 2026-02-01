'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Euveka-Style Spinner Component
 *
 * Design Principles:
 * - Minimal, thin circles (1-2px stroke)
 * - Subtle white on dark backgrounds
 * - Smooth rotation with ease-out
 * - Optional pulsing glow effect
 */

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'ring' | 'pulse';
  /** Show text label below spinner */
  label?: string;
}

const sizeMap = {
  xs: { container: 16, stroke: 1.5 },
  sm: { container: 24, stroke: 1.5 },
  default: { container: 32, stroke: 2 },
  lg: { container: 48, stroke: 2 },
  xl: { container: 64, stroke: 2.5 },
};

/**
 * Ring Spinner - Thin circular spinner with gradient
 */
function RingSpinner({ size = 'default', className }: { size?: SpinnerProps['size']; className?: string }) {
  const { container, stroke } = sizeMap[size || 'default'];

  return (
    <motion.div
      className={cn('relative', className)}
      style={{ width: container, height: container }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        viewBox="0 0 50 50"
        className="w-full h-full"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[#262626]"
        />
        {/* Animated arc */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="80 126"
          className="text-[#fefefc]"
        />
      </svg>
    </motion.div>
  );
}

/**
 * Dots Spinner - Three pulsing dots
 */
function DotsSpinner({ size = 'default', className }: { size?: SpinnerProps['size']; className?: string }) {
  const dotSize = sizeMap[size || 'default'].container / 4;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="bg-[#fefefc] rounded-full"
          style={{ width: dotSize, height: dotSize }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pulse Spinner - Single pulsing circle with glow
 */
function PulseSpinner({ size = 'default', className }: { size?: SpinnerProps['size']; className?: string }) {
  const { container } = sizeMap[size || 'default'];

  return (
    <div
      className={cn('relative', className)}
      style={{ width: container, height: container }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#fefefc]/20"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
      {/* Core pulse */}
      <motion.div
        className="absolute inset-[25%] rounded-full bg-[#fefefc]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </div>
  );
}

/**
 * Default Spinner - Classic thin ring
 */
function DefaultSpinner({ size = 'default', className }: { size?: SpinnerProps['size']; className?: string }) {
  const { container, stroke } = sizeMap[size || 'default'];

  return (
    <motion.div
      className={cn('relative', className)}
      style={{ width: container, height: container }}
    >
      {/* Static track */}
      <div
        className="absolute inset-0 rounded-full border-[#262626]"
        style={{ borderWidth: stroke }}
      />
      {/* Rotating indicator */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          borderWidth: stroke,
          borderColor: 'transparent',
          borderTopColor: '#fefefc',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}

/**
 * Spinner Component
 * Elegant loading spinner with Euveka styling
 */
export function Spinner({ size = 'default', variant = 'default', label, className, ...props }: SpinnerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Static indicator for reduced motion
  if (prefersReducedMotion) {
    return (
      <div
        className={cn('flex flex-col items-center gap-2', className)}
        role="status"
        aria-label={label || 'Loading'}
        {...props}
      >
        <div
          className="rounded-full border-2 border-[#262626] border-t-[#fefefc]"
          style={{
            width: sizeMap[size].container,
            height: sizeMap[size].container,
          }}
        />
        {label && <span className="text-sm text-[#a8a29e]">{label}</span>}
      </div>
    );
  }

  const SpinnerComponent = {
    default: DefaultSpinner,
    ring: RingSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
  }[variant];

  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      role="status"
      aria-label={label || 'Loading'}
      {...props}
    >
      <SpinnerComponent size={size} />
      {label && (
        <motion.span
          className="text-sm text-[#a8a29e]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {label}
        </motion.span>
      )}
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  );
}

/**
 * Inline Spinner - For use within buttons or text
 */
export function InlineSpinner({ size = 'xs', className }: { size?: 'xs' | 'sm'; className?: string }) {
  return <Spinner size={size} variant="default" className={cn('inline-flex', className)} />;
}

/**
 * Page Loading Spinner - Centered full-page loader
 */
export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a08]/80 backdrop-blur-sm z-50">
      <Spinner size="lg" variant="ring" label={label} />
    </div>
  );
}

/**
 * Button Spinner - Sized for button content replacement
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" variant="default" className={className} />;
}
