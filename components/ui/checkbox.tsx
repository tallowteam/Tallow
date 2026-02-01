"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Checkbox Component
 *
 * Design Specifications:
 * - Border-radius: 6px (rounded-md)
 * - Transition: all 0.3s ease
 * - WCAG 2.1 compliant touch targets (44x44px)
 *
 * Colors:
 * - Unchecked border: #e5dac7 (light) / #544a36 (dark)
 * - Checked bg: #191610 (light) / #fefefc (dark)
 * - Check icon: #fefefc (light) / #191610 (dark)
 * - Focus ring: #b2987d
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // EUVEKA checkbox - 20x20px visual with 44x44px touch target
      "peer relative h-5 w-5 shrink-0 rounded-md border-2",
      // EUVEKA border color
      "border-[#e5dac7] dark:border-[#544a36]",
      // EUVEKA: transition 0.3s
      "transition-all duration-300 ease-out",
      // EUVEKA focus ring
      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#b2987d]/30",
      "focus-visible:border-[#b2987d]",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      // EUVEKA checked state
      "data-[state=checked]:bg-[#191610] dark:data-[state=checked]:bg-[#fefefc]",
      "data-[state=checked]:border-[#191610] dark:data-[state=checked]:border-[#fefefc]",
      "data-[state=checked]:text-[#fefefc] dark:data-[state=checked]:text-[#191610]",
      // Touch target expansion - 44x44px
      "before:absolute before:-inset-3 before:content-['']",
      // EUVEKA hover states
      "hover:border-[#b2987d]/50",
      "data-[state=checked]:hover:bg-[#2a2620] dark:data-[state=checked]:hover:bg-[#e5e5e3]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
