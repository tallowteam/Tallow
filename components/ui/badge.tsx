import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Badge Component
 *
 * Design Specifications:
 * - Border-radius: 60px (pill shape)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Default: bg-[#191610] text-[#fefefc] (dark) / bg-[#fefefc] text-[#191610] (light)
 * - Secondary: bg-[#e5dac7] (light) / bg-[#544a36] (dark)
 * - Muted: #b2987d
 * - Border: #e5dac7 (light) / #544a36 (dark)
 */

const badgeVariants = cva(
  // Base EUVEKA styling
  [
    "inline-flex items-center justify-center",
    // EUVEKA: pill shape (60px)
    "rounded-[60px]",
    "border px-3 py-1 text-xs font-medium",
    "w-fit whitespace-nowrap shrink-0",
    "[&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none",
    // EUVEKA: transition 0.3s
    "transition-all duration-300 ease-out",
    // Focus states
    "focus-visible:ring-[3px] focus-visible:ring-[#b2987d]/30",
    "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500",
    "overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        // EUVEKA default - dark fill
        default: [
          "border-transparent",
          "bg-[#191610] dark:bg-[#fefefc]",
          "text-[#fefefc] dark:text-[#191610]",
          "[a&]:hover:bg-[#2a2620] dark:[a&]:hover:bg-[#e5e5e3]",
        ].join(" "),
        // EUVEKA secondary - warm neutral
        secondary: [
          "border-transparent",
          "bg-[#e5dac7] dark:bg-[#544a36]",
          "text-[#191610] dark:text-[#fefefc]",
          "[a&]:hover:bg-[#d9cbb5] dark:[a&]:hover:bg-[#665a44]",
        ].join(" "),
        // Destructive
        destructive: [
          "border-transparent",
          "bg-red-500 dark:bg-red-600",
          "text-white",
          "[a&]:hover:bg-red-600 dark:[a&]:hover:bg-red-700",
          "focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40",
        ].join(" "),
        // EUVEKA outline - subtle border
        outline: [
          "border-[#e5dac7] dark:border-[#544a36]",
          "bg-transparent",
          "text-[#191610] dark:text-[#fefefc]",
          "[a&]:hover:bg-[#e5dac7]/30 dark:[a&]:hover:bg-[#544a36]/30",
        ].join(" "),
        // EUVEKA muted variant
        muted: [
          "border-transparent",
          "bg-[#b2987d]/20",
          "text-[#b2987d]",
          "[a&]:hover:bg-[#b2987d]/30",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
