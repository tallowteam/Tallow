'use client';

/**
 * Progress Animation Components
 * Specialized animations for file transfers and loading states
 * Optimized for smooth 60fps performance
 */

import * as React from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { transitions, springs, easings } from './presets';

/**
 * ============================================================================
 * ANIMATED PROGRESS BAR - Smooth progress indication
 * ============================================================================
 */

export interface AnimatedProgressBarProps {
  /** Progress value (0-100) */
  progress: number;
  /** Custom className */
  className?: string;
  /** Bar className */
  barClassName?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Animation duration for changes (seconds) */
  duration?: number;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Enable shimmer effect */
  shimmer?: boolean;
  /** Height of the bar */
  height?: 'sm' | 'md' | 'lg';
}

export function AnimatedProgressBar({
  progress,
  className,
  barClassName,
  showPercentage = false,
  duration = 0.5,
  variant = 'primary',
  shimmer = true,
  height = 'md',
}: AnimatedProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const progressValue = useMotionValue(0);

  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  React.useEffect(() => {
    const controls = animate(progressValue, clampedProgress, {
      duration: prefersReducedMotion ? 0.01 : duration,
      ease: easings.easeOut,
    });

    return () => controls.stop();
  }, [clampedProgress, duration, prefersReducedMotion, progressValue]);

  const widthTransform = useTransform(progressValue, (v) => `${v}%`);

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#fefefc] to-[#d6cec2]',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
    error: 'bg-gradient-to-r from-red-500 to-red-400',
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'relative w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden',
          heightClasses[height]
        )}
      >
        <motion.div
          style={{ width: widthTransform }}
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-colors duration-300',
            variantClasses[variant],
            barClassName
          )}
        >
          {/* Shimmer effect */}
          {shimmer && clampedProgress > 0 && clampedProgress < 100 && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Percentage text */}
      {showPercentage && (
        <motion.span
          key={Math.floor(clampedProgress)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-6 right-0 text-xs font-semibold text-foreground"
        >
          {Math.round(clampedProgress)}%
        </motion.span>
      )}
    </div>
  );
}

AnimatedProgressBar.displayName = 'AnimatedProgressBar';

/**
 * ============================================================================
 * CIRCULAR PROGRESS - Ring-style progress indicator
 * ============================================================================
 */

export interface CircularProgressProps {
  /** Progress value (0-100) */
  progress: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage in center */
  showPercentage?: boolean;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Custom className */
  className?: string;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  showPercentage = true,
  variant = 'primary',
  className,
}: CircularProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const progressValue = useMotionValue(0);

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  React.useEffect(() => {
    const controls = animate(progressValue, clampedProgress, {
      duration: prefersReducedMotion ? 0.01 : 0.5,
      ease: easings.easeOut,
    });

    return () => controls.stop();
  }, [clampedProgress, prefersReducedMotion, progressValue]);

  const strokeDashoffset = useTransform(
    progressValue,
    (v) => circumference - (v / 100) * circumference
  );

  const colors = {
    primary: '#fefefc',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-zinc-200 dark:text-zinc-800"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>

      {/* Center percentage */}
      {showPercentage && (
        <motion.div
          key={Math.floor(clampedProgress)}
          initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-foreground">
            {Math.round(clampedProgress)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}

CircularProgress.displayName = 'CircularProgress';

/**
 * ============================================================================
 * TRANSFER SPEED INDICATOR - Real-time speed display
 * ============================================================================
 */

export interface TransferSpeedProps {
  /** Speed in bytes per second */
  bytesPerSecond: number;
  /** Custom className */
  className?: string;
  /** Show icon */
  showIcon?: boolean;
}

export function TransferSpeed({ bytesPerSecond, className, showIcon = true }: TransferSpeedProps) {
  const formatSpeed = (bytes: number): string => {
    if (bytes === 0) {return '0 B/s';}
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const speed = formatSpeed(bytesPerSecond);

  return (
    <motion.div
      key={speed}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitions.fast}
      className={cn('flex items-center gap-1.5 text-[#fefefc] font-medium', className)}
    >
      {showIcon && (
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-current"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path
            d="M8 2L10 6H6L8 2Z"
            fill="currentColor"
          />
          <path
            d="M8 14L6 10H10L8 14Z"
            fill="currentColor"
          />
        </motion.svg>
      )}
      <span className="text-sm">{speed}</span>
    </motion.div>
  );
}

TransferSpeed.displayName = 'TransferSpeed';

/**
 * ============================================================================
 * ETA COUNTDOWN - Estimated time remaining
 * ============================================================================
 */

export interface ETACountdownProps {
  /** Seconds remaining */
  seconds: number;
  /** Custom className */
  className?: string;
}

export function ETACountdown({ seconds, className }: ETACountdownProps) {
  const formatTime = (secs: number): string => {
    if (secs < 1) {return '< 1s';}
    if (secs < 60) {return `${Math.ceil(secs)}s`;}
    if (secs < 3600) {
      const mins = Math.floor(secs / 60);
      const remainingSecs = Math.ceil(secs % 60);
      return `${mins}m ${remainingSecs}s`;
    }
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const timeLeft = formatTime(seconds);

  return (
    <motion.div
      key={timeLeft}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.fast}
      className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{timeLeft} left</span>
    </motion.div>
  );
}

ETACountdown.displayName = 'ETACountdown';

/**
 * ============================================================================
 * COMPLETION CELEBRATION - Success animation
 * ============================================================================
 */

export interface CompletionCelebrationProps {
  /** Show the celebration */
  show: boolean;
  /** Success message */
  message?: string;
  /** Custom className */
  className?: string;
  /** Duration before auto-hide (ms) */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

export function CompletionCelebration({
  show,
  message = 'Transfer complete!',
  className,
  duration = 3000,
  onComplete,
}: CompletionCelebrationProps) {
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.5, rotate: -10 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, rotate: 0 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.8, y: -20 }
          }
          transition={springs.bouncy}
          className={cn(
            'flex items-center gap-3 px-6 py-4 rounded-2xl',
            'bg-emerald-500/10 border-2 border-emerald-500/30',
            'backdrop-blur-sm shadow-lg shadow-emerald-500/10',
            className
          )}
        >
          {/* Success icon with confetti */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{
              scale: springs.bouncy,
              rotate: {
                delay: 0.2,
                duration: 0.6,
                ease: easings.easeInOut,
              },
            }}
            className="relative"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="text-emerald-500"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <motion.path
                d="M8 12L11 15L16 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: easings.easeOut }}
              />
            </svg>

            {/* Confetti particles */}
            {!prefersReducedMotion && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500"
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{
                      x: [0, (Math.random() - 0.5) * 60],
                      y: [0, -Math.random() * 60],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      delay: 0.4 + i * 0.05,
                      duration: 0.8,
                      ease: easings.easeOut,
                    }}
                    style={{
                      top: '50%',
                      left: '50%',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Message */}
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="font-semibold text-emerald-600 dark:text-emerald-400"
          >
            {message}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

CompletionCelebration.displayName = 'CompletionCelebration';

/**
 * ============================================================================
 * PULSE LOADER - Animated loading indicator
 * ============================================================================
 */

export interface PulseLoaderProps {
  /** Size of dots */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'muted';
  /** Custom className */
  className?: string;
}

export function PulseLoader({ size = 'md', variant = 'primary', className }: PulseLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    primary: 'bg-[#fefefc]',
    muted: 'bg-muted-foreground',
  };

  if (prefersReducedMotion) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn('rounded-full', sizeClasses[size], colorClasses[variant])}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('rounded-full', sizeClasses[size], colorClasses[variant])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: easings.easeInOut,
          }}
        />
      ))}
    </div>
  );
}

PulseLoader.displayName = 'PulseLoader';

/**
 * ============================================================================
 * SKELETON SHIMMER - Loading placeholder
 * ============================================================================
 */

export interface SkeletonShimmerProps {
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Border radius */
  radius?: 'sm' | 'md' | 'lg' | 'full';
  /** Custom className */
  className?: string;
}

export function SkeletonShimmer({
  width = '100%',
  height = '1rem',
  radius = 'md',
  className,
}: SkeletonShimmerProps) {
  const prefersReducedMotion = useReducedMotion();

  const radiusClasses = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-zinc-200 dark:bg-zinc-800',
        radiusClasses[radius],
        className
      )}
      style={{ width, height }}
    >
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

SkeletonShimmer.displayName = 'SkeletonShimmer';
