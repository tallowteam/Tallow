"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Avatar Component
 *
 * Design Specifications:
 * - Border-radius: full (circular)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Fallback bg: #e5dac7 (light) / #544a36 (dark)
 * - Fallback text: #191610 (light) / #fefefc (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 */

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        // EUVEKA: circular with subtle border
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        "border border-[#e5dac7] dark:border-[#544a36]",
        // EUVEKA: transition 0.3s
        "transition-all duration-300 ease-out",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // EUVEKA fallback styling
        "flex size-full items-center justify-center rounded-full",
        "bg-[#e5dac7] dark:bg-[#544a36]",
        "text-[#191610] dark:text-[#fefefc]",
        "font-medium text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
