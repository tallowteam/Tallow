import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Alert Component
 *
 * Design Specifications:
 * - Border-radius: 16px (rounded-2xl)
 * - Padding: 16px (p-4)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Default: bg-[#fefefc] border-[#e5dac7] (light) / bg-[#191610] border-[#544a36] (dark)
 * - Destructive: red tones
 * - Warning: amber/warm tones
 * - Text: #191610 (light) / #fefefc (dark)
 * - Muted: #b2987d
 */

const alertVariants = cva(
  [
    "relative w-full px-4 py-4 text-sm",
    // EUVEKA: rounded-2xl
    "rounded-2xl",
    // Grid layout for icon
    "grid has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] grid-cols-[0_1fr]",
    "has-[>svg]:gap-x-3 gap-y-1 items-start",
    // Icon styling
    "[&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current",
    // EUVEKA: transition 0.3s
    "transition-all duration-300 ease-out",
  ].join(" "),
  {
    variants: {
      variant: {
        // EUVEKA default - warm neutral
        default: [
          "bg-[#fefefc] dark:bg-[#191610]",
          "border border-[#e5dac7] dark:border-[#544a36]",
          "text-[#191610] dark:text-[#fefefc]",
        ].join(" "),
        // Destructive - red tones
        destructive: [
          "bg-red-50 dark:bg-red-950",
          "border border-red-200 dark:border-red-800",
          "text-red-600 dark:text-red-400",
          "[&>svg]:text-red-500",
          "*:data-[slot=alert-description]:text-red-600/80 dark:*:data-[slot=alert-description]:text-red-400/80",
        ].join(" "),
        // EUVEKA warning - warm amber
        warning: [
          "bg-amber-50 dark:bg-amber-950",
          "border border-amber-200 dark:border-amber-800",
          "text-amber-700 dark:text-amber-300",
          "[&>svg]:text-[#b2987d]",
        ].join(" "),
        // EUVEKA success - green
        success: [
          "bg-green-50 dark:bg-green-950",
          "border border-green-200 dark:border-green-800",
          "text-green-700 dark:text-green-300",
          "[&>svg]:text-green-500",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        // EUVEKA muted description
        "text-[#b2987d] col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
