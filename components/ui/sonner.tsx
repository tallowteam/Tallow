"use client"

/**
 * EUVEKA Toast Notifications Component
 *
 * Design Specifications:
 * - Border-radius: 60px (pill shape)
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Background: #fefefc (light) / #191610 (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Text: #191610 (light) / #fefefc (dark)
 * - Muted: #b2987d
 * - Success: green accent
 * - Error: #ff4f4f
 * - Info: #fefefc
 * - Blur backdrop effect
 */

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "next-themes"

const Toaster = ({ theme: _propsTheme, ...props }: ToasterProps) => {
  const { theme: currentTheme } = useTheme()

  // Ensure theme is always a valid value for Sonner
  const resolvedTheme: "dark" | "light" | "system" =
    currentTheme === "dark" || currentTheme === "light" ? currentTheme : "system"

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      position="bottom-right"
      expand={false}
      richColors={false}
      closeButton
      duration={4000}
      gap={12}
      icons={{
        success: <CircleCheckIcon className="size-5" strokeWidth={1.5} />,
        info: <InfoIcon className="size-5" strokeWidth={1.5} />,
        warning: <TriangleAlertIcon className="size-5" strokeWidth={1.5} />,
        error: <OctagonXIcon className="size-5" strokeWidth={1.5} />,
        loading: <Loader2Icon className="size-5 animate-spin" strokeWidth={1.5} />,
      }}
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            // EUVEKA background
            "group-[.toaster]:bg-[#fefefc]",
            "group-[.toaster]:dark:bg-[#191610]",
            // EUVEKA text
            "group-[.toaster]:text-[#191610]",
            "group-[.toaster]:dark:text-[#fefefc]",
            // EUVEKA border
            "group-[.toaster]:border",
            "group-[.toaster]:border-[#e5dac7]",
            "group-[.toaster]:dark:border-[#544a36]",
            // EUVEKA: pill shape (60px radius)
            "group-[.toaster]:rounded-[60px]",
            // Shadow and effects
            "group-[.toaster]:shadow-xl",
            "group-[.toaster]:backdrop-blur-xl",
            "group-[.toaster]:font-sans",
            // EUVEKA: transition 0.3s
            "group-[.toaster]:transition-all",
            "group-[.toaster]:duration-300",
            "group-[.toaster]:ease-out",
            // Padding for pill shape
            "group-[.toaster]:px-6",
            "group-[.toaster]:py-4",
          ].join(" "),
          // EUVEKA title styling
          title: [
            "group-[.toast]:font-medium",
            "group-[.toast]:text-[#191610]",
            "group-[.toast]:dark:text-[#fefefc]",
            "group-[.toast]:tracking-tight",
          ].join(" "),
          // EUVEKA description - muted
          description: [
            "group-[.toast]:text-[#b2987d]",
            "group-[.toast]:text-sm",
          ].join(" "),
          // EUVEKA action button - pill with dark fill
          actionButton: [
            "group-[.toast]:bg-[#191610]",
            "group-[.toast]:dark:bg-[#fefefc]",
            "group-[.toast]:text-[#fefefc]",
            "group-[.toast]:dark:text-[#191610]",
            "group-[.toast]:rounded-[60px]",
            "group-[.toast]:px-6",
            "group-[.toast]:py-2.5",
            "group-[.toast]:font-medium",
            "group-[.toast]:text-sm",
            "group-[.toast]:transition-all",
            "group-[.toast]:duration-300",
            "group-[.toast]:hover:opacity-90",
            "group-[.toast]:active:scale-[0.97]",
          ].join(" "),
          // EUVEKA cancel button - outline pill
          cancelButton: [
            "group-[.toast]:bg-transparent",
            "group-[.toast]:text-[#b2987d]",
            "group-[.toast]:border",
            "group-[.toast]:border-[#e5dac7]",
            "group-[.toast]:dark:border-[#544a36]",
            "group-[.toast]:rounded-[60px]",
            "group-[.toast]:px-6",
            "group-[.toast]:py-2.5",
            "group-[.toast]:font-medium",
            "group-[.toast]:text-sm",
            "group-[.toast]:transition-all",
            "group-[.toast]:duration-300",
            "group-[.toast]:hover:bg-[#e5dac7]/30",
            "group-[.toast]:dark:hover:bg-[#544a36]/30",
            "group-[.toast]:hover:text-[#191610]",
            "group-[.toast]:dark:hover:text-[#fefefc]",
          ].join(" "),
          // EUVEKA close button - circular
          closeButton: [
            "group-[.toast]:bg-[#e5dac7]/50",
            "group-[.toast]:dark:bg-[#544a36]/50",
            "group-[.toast]:text-[#b2987d]",
            "group-[.toast]:border-[#e5dac7]",
            "group-[.toast]:dark:border-[#544a36]",
            "group-[.toast]:rounded-full",
            "group-[.toast]:transition-all",
            "group-[.toast]:duration-300",
            "group-[.toast]:hover:bg-[#e5dac7]",
            "group-[.toast]:dark:hover:bg-[#544a36]",
            "group-[.toast]:hover:text-[#191610]",
            "group-[.toast]:dark:hover:text-[#fefefc]",
          ].join(" "),
          // Success variant - EUVEKA green accent
          success: [
            "group-[.toast]:border-green-400/50",
            "group-[.toast]:dark:border-green-600/50",
            "[&_[data-icon]]:text-green-600",
            "[&_[data-icon]]:dark:text-green-400",
          ].join(" "),
          // Error variant - EUVEKA #ff4f4f
          error: [
            "group-[.toast]:border-[#ff4f4f]/50",
            "group-[.toast]:dark:border-[#ff4f4f]/50",
            "[&_[data-icon]]:text-[#ff4f4f]",
            "[&_[data-icon]]:dark:text-[#ff4f4f]",
          ].join(" "),
          // Warning variant - EUVEKA warm amber (closer to #b2987d)
          warning: [
            "group-[.toast]:border-amber-400/50",
            "group-[.toast]:dark:border-amber-600/50",
            "[&_[data-icon]]:text-[#b2987d]",
            "[&_[data-icon]]:dark:text-amber-400",
          ].join(" "),
          // Info variant - EUVEKA #fefefc
          info: [
            "group-[.toast]:border-[#fefefc]/50",
            "group-[.toast]:dark:border-[#fefefc]/50",
            "[&_[data-icon]]:text-[#fefefc]",
            "[&_[data-icon]]:dark:text-[#fefefc]",
          ].join(" "),
          // Loading variant - EUVEKA muted
          loading: [
            "group-[.toast]:border-[#e5dac7]",
            "group-[.toast]:dark:border-[#544a36]",
            "[&_[data-icon]]:text-[#b2987d]",
          ].join(" "),
        },
      }}
      {...(props as ToasterProps)}
    />
  )
}

export { Toaster }
