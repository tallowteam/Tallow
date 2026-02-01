"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * EUVEKA ScrollArea Component
 *
 * Colors:
 * - Scrollbar track: transparent
 * - Scrollbar thumb: #e5dac7 (light) / #544a36 (dark)
 * - Focus ring: #b2987d
 */

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full rounded-[inherit] outline-none",
          // EUVEKA focus ring
          "focus-visible:ring-[3px] focus-visible:ring-[#b2987d]/30",
          "transition-[color,box-shadow] duration-300",
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-0.5 select-none",
        // EUVEKA: transition 0.3s
        "transition-all duration-300 ease-out",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn(
          // EUVEKA thumb colors
          "bg-[#e5dac7] dark:bg-[#544a36]",
          "relative flex-1 rounded-full",
          // Hover state
          "hover:bg-[#d9cbb5] dark:hover:bg-[#665a44]",
          "transition-colors duration-200",
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
