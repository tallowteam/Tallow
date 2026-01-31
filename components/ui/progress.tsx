"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Progress Component
 *
 * Design Specifications:
 * - Border-radius: 60px (pill shape)
 * - Height: 8px (h-2)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Track bg: #e5dac7 (light) / #544a36 (dark)
 * - Indicator: #191610 (light) / #fefefc (dark)
 * - Alternative: #b2987d for accent
 */

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Accessible label describing what this progress represents */
  label?: string;
  /** Whether to show the percentage value to screen readers */
  showValueLabel?: boolean;
}

function Progress({
  className,
  value,
  label,
  showValueLabel = true,
  ...props
}: ProgressProps) {
  const progressValue = value ?? 0;
  const ariaLabel = label || props['aria-label'] || 'Progress';
  const valueLabel = showValueLabel ? `${Math.round(progressValue)}% complete` : undefined;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        // EUVEKA: pill shape with rounded-full
        "relative h-2 w-full overflow-hidden rounded-full",
        // EUVEKA track background
        "bg-[#e5dac7] dark:bg-[#544a36]",
        className
      )}
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
          "h-full w-full flex-1",
          // EUVEKA indicator color
          "bg-[#191610] dark:bg-[#fefefc]",
          // EUVEKA: transition all 0.3s ease
          "transition-all duration-300 ease-out"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
