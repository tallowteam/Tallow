"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Tabs Component
 *
 * EUVEKA Design Specifications:
 * - Clean minimal design
 * - Border-radius: 60px for list (pill), rounded-full for triggers
 * - Transition: all 0.3s ease
 * - Height: 56-64px for tab list
 *
 * Colors:
 * - List bg: #e5dac7/30 (light) / #544a36/30 (dark)
 * - Active trigger: #fefefc (light) / #191610 (dark)
 * - Inactive text: #b2987d
 * - Active text: #191610 (light) / #fefefc (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

/**
 * TabsList - EUVEKA pill container
 * Height: 56-64px range for proper touch targets
 */
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // EUVEKA: pill shape container with 60px radius
        "inline-flex w-fit items-center justify-center gap-1 rounded-[60px] p-1.5",
        // EUVEKA: 56-64px height range
        "h-14 min-h-[56px] 3xl:h-16 3xl:min-h-[64px]",
        // EUVEKA border
        "border border-[#e5dac7] dark:border-[#544a36]",
        // EUVEKA background
        "bg-[#e5dac7]/30 dark:bg-[#544a36]/30",
        className
      )}
      {...props}
    />
  )
}

/**
 * TabsTrigger - EUVEKA pill button style
 * Height inherits from TabsList (56-64px container)
 */
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles - EUVEKA pill triggers with 60px radius
        "inline-flex h-full flex-1 items-center justify-center gap-2",
        "rounded-[60px] px-6 py-2 text-sm font-medium whitespace-nowrap",
        // EUVEKA: minimum touch target
        "min-h-[44px]",
        // EUVEKA: transition all 0.3s ease
        "transition-all duration-300 ease-out",
        // Default state - EUVEKA muted text
        "text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]",
        // Active state - EUVEKA filled pill
        "data-[state=active]:bg-[#fefefc] dark:data-[state=active]:bg-[#191610]",
        "data-[state=active]:text-[#191610] dark:data-[state=active]:text-[#fefefc]",
        "data-[state=active]:font-semibold data-[state=active]:shadow-sm",
        // Focus states - EUVEKA muted accent
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b2987d]/50",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        // Focus states - EUVEKA muted accent
        "focus-visible:ring-2 focus-visible:ring-[#b2987d]/50",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]",
        "rounded-3xl", // EUVEKA rounded content area
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
