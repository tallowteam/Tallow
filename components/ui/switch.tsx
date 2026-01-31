"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Switch Component
 *
 * Design Specifications:
 * - Border-radius: 60px (pill shape)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Track unchecked: #e5dac7 (light) / #544a36 (dark)
 * - Track checked: #191610 (light) / #fefefc (dark)
 * - Thumb: #fefefc (light) / #191610 (dark)
 * - Focus ring: #b2987d
 *
 * WCAG 2.1 Compliant:
 * - Visual switch: 28x52px
 * - Touch target: 44x52px minimum
 */
interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  /** Accessible label when switch is checked */
  onLabel?: string;
  /** Accessible label when switch is unchecked */
  offLabel?: string;
}

function Switch({
  className,
  onLabel = 'On',
  offLabel = 'Off',
  ...props
}: SwitchProps) {
  // Use defaultChecked for uncontrolled, checked for controlled
  const isChecked = props.checked ?? props.defaultChecked ?? false;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // EUVEKA: pill shape, 28px height, 52px width
        "peer relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full",
        "border border-transparent shadow-xs cursor-pointer",
        // EUVEKA: transition all 0.3s ease
        "transition-all duration-300 ease-out outline-none",
        // EUVEKA track colors - unchecked
        "data-[state=unchecked]:bg-[#e5dac7] dark:data-[state=unchecked]:bg-[#544a36]",
        // EUVEKA track colors - checked
        "data-[state=checked]:bg-[#191610] dark:data-[state=checked]:bg-[#fefefc]",
        // Focus states - EUVEKA muted accent
        "focus-visible:border-[#b2987d] focus-visible:ring-[3px] focus-visible:ring-[#b2987d]/30",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Touch target expansion - ensures 44px minimum touch area
        "before:absolute before:-inset-2 before:content-['']",
        // Hover feedback - EUVEKA colors
        "hover:data-[state=unchecked]:bg-[#d9cbb5] dark:hover:data-[state=unchecked]:bg-[#665a44]",
        "hover:data-[state=checked]:bg-[#2a2620] dark:hover:data-[state=checked]:bg-[#e5e5e3]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // EUVEKA thumb colors
          "bg-[#fefefc] dark:bg-[#191610]",
          "pointer-events-none block size-6 rounded-full shadow-md ring-0",
          // EUVEKA: transition 0.3s
          "transition-transform duration-300 ease-out",
          "data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-0.5"
        )}
      />
      <span className="sr-only">{isChecked ? onLabel : offLabel}</span>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
