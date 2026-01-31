"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Slider Component
 *
 * Design Specifications:
 * - Track border-radius: 60px (pill shape)
 * - Thumb border-radius: 60px (pill/circle)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Track bg: #e5dac7 (light) / #544a36 (dark)
 * - Range: #191610 (light) / #fefefc (dark)
 * - Thumb: #fefefc (light) / #191610 (dark) with border
 * - Focus ring: #b2987d
 *
 * WCAG 2.1 Compliant:
 * - Visual thumb: 28x28px
 * - Touch target: 44x44px minimum via pseudo-element
 * - Track: 8px height for better visibility
 */
interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Accessible label for the slider */
  label?: string;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  label,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(value !== undefined ? { value } : {})}
      min={min}
      max={max}
      className={cn(
        // Ensure sufficient padding for touch targets
        "relative flex w-full touch-none items-center select-none py-2",
        "data-[disabled]:opacity-50",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2 data-[orientation=vertical]:py-0",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          // EUVEKA: pill shape, 8px height
          "relative grow overflow-hidden rounded-full",
          // EUVEKA track background
          "bg-[#e5dac7] dark:bg-[#544a36]",
          "data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            // EUVEKA range indicator
            "absolute rounded-full",
            "bg-[#191610] dark:bg-[#fefefc]",
            "data-[orientation=horizontal]:h-full",
            "data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={label ? `${label} thumb ${_values.length > 1 ? index + 1 : ''}` : `Slider thumb ${_values.length > 1 ? index + 1 : ''}`}
          aria-valuetext={`${_values[index] ?? 0}`}
          className={cn(
            // EUVEKA: 28x28px visual thumb with pill/circle shape
            "relative block size-7 shrink-0 rounded-full cursor-pointer",
            // EUVEKA colors
            "bg-[#fefefc] dark:bg-[#191610]",
            "border-2 border-[#191610] dark:border-[#fefefc]",
            "shadow-md",
            // EUVEKA: transition all 0.3s ease
            "transition-all duration-300 ease-out",
            // Ring effects - EUVEKA muted accent
            "ring-[#b2987d]/50 hover:ring-4 hover:scale-105",
            "focus-visible:ring-4 focus-visible:outline-hidden focus-visible:scale-105",
            // Active/pressed state
            "active:scale-95 active:ring-2",
            // Disabled state
            "disabled:pointer-events-none disabled:opacity-50",
            // Touch target expansion to 44x44px minimum
            "before:absolute before:-inset-2 before:content-['']"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
