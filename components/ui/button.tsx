import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full",
  {
    variants: {
      variant: {
        // Euveka Primary - Dark solid button
        default: "bg-primary text-primary-foreground hover:opacity-85 uppercase tracking-[0.1em] text-sm",
        // Euveka Outline - Border only, inverts on hover
        outline: "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background uppercase tracking-[0.1em] text-sm",
        // Secondary - Subtle background
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 uppercase tracking-[0.1em] text-sm",
        // Ghost - Text only with underline hover effect
        ghost: "bg-transparent text-foreground hover:bg-muted uppercase tracking-[0.1em] text-sm",
        // Destructive
        destructive: "bg-destructive text-primary-foreground hover:bg-destructive/90 uppercase tracking-[0.1em] text-sm",
        // Link style
        link: "text-foreground underline-offset-4 hover:underline",
        // Legacy pill styles (for backward compatibility)
        pill: "bg-primary text-primary-foreground hover:opacity-85 rounded-full uppercase tracking-[0.05em]",
        "pill-gradient": "bg-primary text-primary-foreground hover:opacity-90 rounded-full uppercase tracking-[0.05em]",
        "pill-outline": "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background rounded-full uppercase tracking-[0.05em]",
      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-10 px-6 py-2",
        lg: "h-14 px-10 py-4",
        xl: "h-16 px-12 py-5",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
