import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Textarea Component
 *
 * Design Specifications:
 * - Border-radius: 12px (rounded-xl)
 * - Min-height: 100px
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Primary bg: #fefefc (light) / #191610 (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Text: #191610 (light) / #fefefc (dark)
 * - Placeholder: #b2987d
 * - Focus: #b2987d accent glow
 */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error message for aria-describedby */
  error?: string;
  /** Success state */
  success?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, id, ...props }, ref) => {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <>
    <textarea
      ref={ref}
      id={textareaId}
      data-slot="textarea"
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      className={cn(
        // Base styles
        "flex field-sizing-content min-h-[100px] w-full text-base shadow-xs outline-none md:text-sm",
        // EUVEKA: rounded-xl (12px)
        "rounded-xl",
        // EUVEKA: transition all 0.3s ease
        "transition-all duration-300 ease-out",
        // Padding
        "px-4 py-3",
        // EUVEKA theme-aware background
        "bg-[#fefefc] dark:bg-[#191610]",
        // EUVEKA theme-aware border
        "border border-[#e5dac7] dark:border-[#544a36]",
        // EUVEKA theme-aware text
        "text-[#191610] dark:text-[#fefefc]",
        // EUVEKA placeholder - muted
        "placeholder:text-[#b2987d] dark:placeholder:text-[#b2987d]/60",
        // EUVEKA hover state
        "hover:border-[#b2987d]/50 hover:shadow-[0_2px_8px_-2px_rgba(178,152,125,0.08)]",
        "dark:hover:border-[#b2987d]/40",
        // EUVEKA focus ring - warm accent
        "focus-visible:border-[#b2987d] focus-visible:ring-[3px] focus-visible:ring-[#b2987d]/15",
        "focus-visible:shadow-[0_0_0_4px_rgba(178,152,125,0.08),0_2px_8px_-2px_rgba(178,152,125,0.1)]",
        "dark:focus-visible:border-[#b2987d] dark:focus-visible:ring-[#b2987d]/25",
        "dark:focus-visible:shadow-[0_0_0_4px_rgba(178,152,125,0.12),0_2px_12px_-2px_rgba(178,152,125,0.15)]",
        // Invalid states
        "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500",
        // EUVEKA disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:bg-[#e5dac7]/30 dark:disabled:bg-[#544a36]/30",
        // Error and success states
        error && "border-red-400 dark:border-red-500",
        success && "border-green-400 dark:border-green-500",
        className
      )}
      {...props}
    />
    {error && (
      <p id={errorId} className="text-sm text-red-500 mt-2" role="alert">
        {error}
      </p>
    )}
    </>
  )
})

Textarea.displayName = "Textarea"

export { Textarea, type TextareaProps }
