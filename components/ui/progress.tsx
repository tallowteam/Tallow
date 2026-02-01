"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Progress Component
 *
 * Design Specifications:
 * - Border-radius: 9999px (pill shape)
 * - Height: 8px default (h-2), supports sm/md/lg
 * - Transition: all 0.3s ease
 *
 * EUVEKA Colors:
 * - Primary: #fefefc (electric blue accent)
 * - Secondary: #b2987d (warm accent)
 * - Track bg: #e5dac7 (light) / #544a36 (dark)
 * - Neutral indicator: #191610 (light) / #fefefc (dark)
 * - Background dark: #191610
 * - Background light: #fefefc
 */

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full transition-all duration-300",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
      variant: {
        default: "bg-[#e5dac7] dark:bg-[#544a36]",
        primary: "bg-[#fefefc]/20 dark:bg-[#fefefc]/10",
        accent: "bg-[#b2987d]/20 dark:bg-[#b2987d]/15",
        muted: "bg-[#f3ede2] dark:bg-[#2c261c]",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-[#191610] dark:bg-[#fefefc]",
        primary: "bg-[#fefefc]",
        accent: "bg-[#b2987d]",
        gradient: "bg-gradient-to-r from-[#fefefc] to-[#fefefc]/70",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  /** Accessible label describing what this progress represents */
  label?: string;
  /** Whether to show the percentage value to screen readers */
  showValueLabel?: boolean;
  /** Indicator color variant */
  indicatorVariant?: "default" | "primary" | "accent" | "gradient" | "success" | "warning" | "error";
  /** Show shimmer animation for active progress */
  showShimmer?: boolean;
  /** Custom indicator class name */
  indicatorClassName?: string;
}

function Progress({
  className,
  value,
  label,
  showValueLabel = true,
  size,
  variant,
  indicatorVariant = "default",
  showShimmer = false,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const progressValue = value ?? 0;
  const ariaLabel = label || props['aria-label'] || 'Progress';
  const valueLabel = showValueLabel ? `${Math.round(progressValue)}% complete` : undefined;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressVariants({ size, variant }), className)}
      value={progressValue}
      aria-valuenow={progressValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-valuetext={valueLabel}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          indicatorVariants({ variant: indicatorVariant }),
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - progressValue}%)` }}
      />
      {/* EUVEKA shimmer effect for active transfers */}
      {showShimmer && progressValue > 0 && progressValue < 100 && (
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer"
          style={{ width: `${progressValue}%` }}
        />
      )}
    </ProgressPrimitive.Root>
  )
}

/**
 * Circular Progress Component - EUVEKA Styled
 * For circular progress indicators with percentage display
 */
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  variant?: "default" | "primary" | "accent";
  label?: string;
}

function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  className,
  showValue = true,
  variant = "primary",
  label,
}: CircularProgressProps) {
  const progressValue = Math.min(100, Math.max(0, value));
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressValue / 100);

  // EUVEKA color mapping
  const colors = {
    default: { track: "#e5dac7", progress: "#191610", darkTrack: "#544a36", darkProgress: "#fefefc" },
    primary: { track: "#fefefc20", progress: "#fefefc", darkTrack: "#fefefc15", darkProgress: "#fefefc" },
    accent: { track: "#b2987d20", progress: "#b2987d", darkTrack: "#b2987d15", darkProgress: "#b2987d" },
  };

  const colorSet = colors[variant];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={progressValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${Math.round(progressValue)}% complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track circle - EUVEKA themed */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-[#e5dac7] dark:stroke-[#544a36]"
          style={{
            stroke: variant !== "default" ? colorSet.track : undefined,
          }}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle - EUVEKA themed */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={cn(
            "transition-all duration-300 ease-out",
            variant === "default" && "stroke-[#191610] dark:stroke-[#fefefc]",
            variant === "primary" && "stroke-[#fefefc]",
            variant === "accent" && "stroke-[#b2987d]"
          )}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium text-foreground tabular-nums">
          {Math.round(progressValue)}
        </span>
      )}
    </div>
  );
}

export { Progress, CircularProgress, progressVariants, indicatorVariants }
