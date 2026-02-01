"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Label Component
 *
 * Design Specifications:
 * - Text: #191610 (light) / #fefefc (dark)
 * - Muted/disabled: #b2987d
 * - Transition: all 0.3s ease
 */

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Base styles
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        // EUVEKA transition
        "transition-colors duration-300",
        // EUVEKA theme-aware text
        "text-[#191610] dark:text-[#fefefc]",
        // Disabled states - EUVEKA muted
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-[#b2987d]",
        "peer-disabled:cursor-not-allowed peer-disabled:text-[#b2987d]",
        // Required indicator
        "[&_[data-required]]:text-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Label }
