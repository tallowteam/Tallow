"use client"

/**
 * EUVEKA Alert Dialog Component
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
 */

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
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
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        // Position & Layout
        "fixed top-[50%] left-[50%] z-50",
        "translate-x-[-50%] translate-y-[-50%]",
        "grid w-full max-w-[calc(100%-2rem)] sm:max-w-lg",
        "gap-4",

        // EUVEKA content background and border
        "bg-[#fefefc] dark:bg-[#191610]",
        // EUVEKA: rounded-[24px] to rounded-[28px] (24-32px range)
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
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col",
      // EUVEKA gap-4 (16px)
      "gap-4",
      "text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // EUVEKA flex layout with gap-4
      "flex flex-col-reverse gap-4 sm:flex-row sm:justify-end",
      // EUVEKA mt-8 spacing from content with top border
      "mt-8 pt-6",
      "border-t border-[#e5dac7] dark:border-[#544a36]",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      // EUVEKA: text-lg font-semibold
      "text-lg font-semibold leading-none tracking-tight",
      "text-[#191610] dark:text-[#fefefc]",
      className
    )}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      // EUVEKA muted text
      "text-[#b2987d]",
      className
    )}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      buttonVariants({ variant: "default", size: "default" }),
      // EUVEKA: pill shape with appropriate padding
      "rounded-full px-6",
      className
    )}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline", size: "default" }),
      // EUVEKA: pill shape with appropriate padding
      "rounded-full px-6",
      // EUVEKA border colors
      "border-[#e5dac7] dark:border-[#544a36]",
      "hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/20",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
