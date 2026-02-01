"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Dropdown Menu Component
 *
 * Design Specifications:
 * - Border-radius: 16px (rounded-2xl)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Background: #fefefc (light) / #191610 (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Text: #191610 (light) / #fefefc (dark)
 * - Muted: #b2987d
 * - Hover: #e5dac7/50 (light) / #544a36/50 (dark)
 */

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          // EUVEKA background and border
          "bg-[#fefefc] dark:bg-[#191610]",
          "text-[#191610] dark:text-[#fefefc]",
          "border border-[#e5dac7] dark:border-[#544a36]",
          // EUVEKA: rounded-2xl (16px)
          "rounded-2xl",
          // Padding and sizing
          "p-2 min-w-[8rem]",
          "max-h-(--radix-dropdown-menu-content-available-height)",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "overflow-x-hidden overflow-y-auto",
          // Shadow
          "shadow-lg",
          // Animations - EUVEKA 0.3s
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "z-50",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

/**
 * DropdownMenuItem with EUVEKA styling and WCAG 2.1 compliant touch targets
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // EUVEKA base styles with 44px min-height for touch compliance
        "relative flex cursor-default items-center gap-3 min-h-[44px] px-3 py-2.5 text-base",
        // EUVEKA: rounded-xl (12px)
        "rounded-xl",
        "outline-hidden select-none",
        // EUVEKA text color
        "text-[#191610] dark:text-[#fefefc]",
        // EUVEKA: transition
        "transition-colors duration-200",
        // EUVEKA hover/focus states
        "focus:bg-[#e5dac7]/50 dark:focus:bg-[#544a36]/50",
        "hover:bg-[#e5dac7]/30 dark:hover:bg-[#544a36]/30",
        // Destructive variant
        "data-[variant=destructive]:text-red-500",
        "data-[variant=destructive]:focus:bg-red-500/10 dark:data-[variant=destructive]:focus:bg-red-500/20",
        "data-[variant=destructive]:*:[svg]:!text-red-500",
        // Icon styling - EUVEKA muted
        "[&_svg:not([class*='text-'])]:text-[#b2987d]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Inset variant
        "data-[inset]:pl-10",
        // Desktop size adjustment
        "sm:min-h-[40px] sm:py-2 sm:text-sm sm:gap-2 sm:[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * DropdownMenuCheckboxItem with EUVEKA styling
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        // EUVEKA: 44px min-height, rounded-xl
        "relative flex cursor-default items-center gap-3 rounded-xl min-h-[44px] py-2.5 pr-3 pl-10 text-base",
        "outline-hidden select-none",
        "text-[#191610] dark:text-[#fefefc]",
        "transition-colors duration-200",
        "focus:bg-[#e5dac7]/50 dark:focus:bg-[#544a36]/50",
        "hover:bg-[#e5dac7]/30 dark:hover:bg-[#544a36]/30",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        "sm:min-h-[40px] sm:py-2 sm:text-sm sm:gap-2 sm:[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...(checked !== undefined ? { checked } : {})}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-[#191610] dark:text-[#fefefc]" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * DropdownMenuRadioItem with EUVEKA styling
 */
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        // EUVEKA: 44px min-height, rounded-xl
        "relative flex cursor-default items-center gap-3 rounded-xl min-h-[44px] py-2.5 pr-3 pl-10 text-base",
        "outline-hidden select-none",
        "text-[#191610] dark:text-[#fefefc]",
        "transition-colors duration-200",
        "focus:bg-[#e5dac7]/50 dark:focus:bg-[#544a36]/50",
        "hover:bg-[#e5dac7]/30 dark:hover:bg-[#544a36]/30",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        "sm:min-h-[40px] sm:py-2 sm:text-sm sm:gap-2 sm:[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2.5 fill-current text-[#191610] dark:text-[#fefefc]" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2 text-sm font-medium",
        // EUVEKA muted text for labels
        "text-[#b2987d]",
        "data-[inset]:pl-10",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        // EUVEKA separator
        "bg-[#e5dac7] dark:bg-[#544a36]",
        "-mx-1 my-1 h-px",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        // EUVEKA muted shortcut text
        "text-[#b2987d] ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        // EUVEKA styling
        "flex cursor-default items-center gap-2 rounded-xl px-3 py-2 text-sm",
        "outline-hidden select-none",
        "text-[#191610] dark:text-[#fefefc]",
        "transition-colors duration-200",
        "focus:bg-[#e5dac7]/50 dark:focus:bg-[#544a36]/50",
        "data-[state=open]:bg-[#e5dac7]/50 dark:data-[state=open]:bg-[#544a36]/50",
        "hover:bg-[#e5dac7]/30 dark:hover:bg-[#544a36]/30",
        "[&_svg:not([class*='text-'])]:text-[#b2987d]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[inset]:pl-10",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        // EUVEKA background, border, and rounded-2xl
        "bg-[#fefefc] dark:bg-[#191610]",
        "text-[#191610] dark:text-[#fefefc]",
        "border border-[#e5dac7] dark:border-[#544a36]",
        "rounded-2xl p-2 min-w-[8rem]",
        "origin-(--radix-dropdown-menu-content-transform-origin)",
        "overflow-hidden shadow-lg z-50",
        // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
