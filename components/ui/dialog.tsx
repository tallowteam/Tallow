"use client"

/**
 * EUVEKA Dialog Component
 *
 * Design Specifications:
 * - Border-radius: 24px-32px (rounded-[24px] to rounded-[28px])
 * - Padding: 32px (p-8)
 * - Backdrop: blur(84px)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Primary bg: #fefefc (light) / #191610 (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Text: #191610 (light) / #fefefc (dark)
 * - Muted: #b2987d
 *
 * Spacing Guidelines:
 * - Dialog max-width: sm:max-w-md (default)
 * - Dialog padding: p-8 (32px standard)
 * - Header: gap-4 between title/description
 * - Title: text-lg font-semibold
 * - Content: mt-6 spacing from header
 * - Footer: mt-8 from content, gap-4 between buttons
 * - Close button: top-6 right-6, w-10 h-10
 */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // EUVEKA backdrop overlay with 84px blur
        "fixed inset-0 z-50",
        "bg-[#191610]/40 dark:bg-[#191610]/70 backdrop-blur-[84px]",
        // Smooth fade animations - EUVEKA 0.3s
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-300",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        role="dialog"
        aria-modal="true"
        className={cn(
          // Position & Layout
          "fixed top-[50%] left-[50%] z-50",
          "translate-x-[-50%] translate-y-[-50%]",
          // Default max-w-md
          "grid w-full max-w-[calc(100%-2rem)] sm:max-w-md",

          // EUVEKA content background and border
          "bg-[#fefefc] dark:bg-[#191610]",
          // EUVEKA: rounded-[24px] to rounded-[32px] (24-32px range)
          "rounded-[24px] sm:rounded-[28px]",
          "border border-[#e5dac7] dark:border-[#544a36]",

          // EUVEKA: p-8 (32px) padding
          "p-8",

          // Elevated shadow with subtle glow
          "shadow-[0_8px_32px_rgba(25,22,16,0.12),0_4px_16px_rgba(25,22,16,0.08)]",
          "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(84,74,54,0.2)]",

          // Spring animations - EUVEKA 0.3s
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "duration-300",

          // EUVEKA focus outline
          "outline-none focus-visible:ring-2 focus-visible:ring-[#b2987d]/50 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]",

          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            aria-label="Close dialog"
            className={cn(
              // Position - aligned with p-8 padding
              "absolute top-6 right-6",

              // EUVEKA close button - w-10 h-10 (40px) pill shape
              "flex items-center justify-center",
              "w-10 h-10 rounded-full",

              // EUVEKA theme-aware colors
              "text-[#b2987d]",
              "hover:text-[#191610] dark:hover:text-[#fefefc]",
              "hover:bg-[#e5dac7]/50 dark:hover:bg-[#544a36]/50",

              // EUVEKA transition
              "transition-all duration-300",

              // Focus state
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[#b2987d]/50",
              "focus-visible:ring-offset-2",
              "focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]",

              // Disabled state
              "disabled:pointer-events-none disabled:opacity-50",

              // SVG styling - 18px icon
              "[&_svg]:pointer-events-none [&_svg]:shrink-0",
              "[&_svg]:size-[18px] [&_svg]:stroke-[1.5]"
            )}
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col",
        // EUVEKA gap-4 (16px)
        "gap-4",
        "text-center sm:text-left",
        // Right padding to avoid close button overlap
        "pr-12",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // EUVEKA flex layout with gap-4
        "flex flex-col-reverse gap-4 sm:flex-row sm:justify-end",
        // EUVEKA mt-8 spacing from content
        "mt-8 pt-6",
        // EUVEKA top border separator
        "border-t border-[#e5dac7] dark:border-[#544a36]",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // EUVEKA: text-lg font-semibold
        "text-lg font-semibold leading-none tracking-tight",
        "text-[#191610] dark:text-[#fefefc]",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm leading-relaxed",
        // EUVEKA muted text
        "text-[#b2987d]",
        className
      )}
      {...props}
    />
  )
}

/**
 * DialogBody - Content wrapper with proper EUVEKA spacing
 * Use this to wrap main dialog content between header and footer
 */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        // EUVEKA mt-6 spacing from header
        "mt-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
