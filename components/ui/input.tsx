"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Input Component
 *
 * Design Specifications:
 * - Border-radius: 12px (rounded-xl)
 * - Height: 48px (h-12)
 * - Border: 1px solid subtle
 * - Transition: all 0.3s ease
 *
 * Colors:
 * - Primary bg: #fefefc (light) / #191610 (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Text: #191610 (light) / #fefefc (dark)
 * - Placeholder: #b2987d
 * - Focus: #b2987d accent glow
 */

const inputVariants = cva(
  // Base styles - EUVEKA aesthetic
  [
    "flex w-full text-sm",
    // EUVEKA: transition all 0.3s ease
    "transition-all duration-300 ease-out",
    "outline-none appearance-none",
    // EUVEKA: rounded-xl (12px)
    "rounded-xl",
    // Light mode - EUVEKA colors
    "bg-[#fefefc] border border-[#e5dac7] text-[#191610]",
    "placeholder:text-[#b2987d]",
    "shadow-[0_1px_4px_-1px_rgba(25,22,16,0.04),inset_0_1px_2px_rgba(25,22,16,0.02)]",
    // Dark mode - EUVEKA colors
    "dark:bg-[#191610] dark:border-[#544a36] dark:text-[#fefefc]",
    "dark:placeholder:text-[#b2987d]/60",
    "dark:shadow-[0_1px_6px_-1px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(0,0,0,0.1)]",
    // Hover state - EUVEKA warm accent
    "hover:border-[#b2987d]/50 hover:shadow-[0_2px_8px_-2px_rgba(178,152,125,0.08)]",
    "dark:hover:border-[#b2987d]/40",
    // Focus state - EUVEKA warm glow
    "focus:border-[#b2987d] focus:ring-[3px] focus:ring-[#b2987d]/15",
    "focus:shadow-[0_0_0_4px_rgba(178,152,125,0.08),0_2px_8px_-2px_rgba(178,152,125,0.1)]",
    "dark:focus:border-[#b2987d] dark:focus:ring-[#b2987d]/25",
    "dark:focus:shadow-[0_0_0_4px_rgba(178,152,125,0.12),0_2px_12px_-2px_rgba(178,152,125,0.15)]",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#e5dac7]/30",
    "dark:disabled:bg-[#544a36]/30",
    // File input styling
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "file:text-[#191610] dark:file:text-[#fefefc]",
    "file:mr-4 file:py-2 file:px-4 file:rounded-xl",
    "file:bg-[#e5dac7]/50 file:hover:bg-[#e5dac7]",
    "file:transition-colors file:duration-200",
    "dark:file:bg-[#544a36]/50 dark:file:hover:bg-[#544a36]",
  ].join(" "),
  {
    variants: {
      inputSize: {
        sm: "h-10 px-3 py-2 text-sm",
        default: "h-12 px-4 py-3 text-sm", // EUVEKA: h-12 (48px)
        lg: "h-14 px-5 py-3 text-base",
      },
      state: {
        default: "",
        error: [
          "border-red-400 focus:border-red-500 focus:ring-red-500/15",
          "focus:shadow-[0_0_0_4px_rgba(239,68,68,0.08),0_2px_8px_-2px_rgba(239,68,68,0.1)]",
          "dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-500/25",
          "hover:border-red-400 dark:hover:border-red-500",
        ].join(" "),
        success: [
          "border-green-400 focus:border-green-500 focus:ring-green-500/15",
          "focus:shadow-[0_0_0_4px_rgba(34,197,94,0.08),0_2px_8px_-2px_rgba(34,197,94,0.1)]",
          "dark:border-green-500 dark:focus:border-green-400 dark:focus:ring-green-500/25",
          "hover:border-green-400 dark:hover:border-green-500",
        ].join(" "),
      },
    },
    defaultVariants: {
      inputSize: "default",
      state: "default",
    },
  }
)

// Floating label component
interface FloatingLabelProps {
  label: string
  htmlFor: string
  isFloating: boolean
  isFocused: boolean
  hasError?: boolean
  hasSuccess?: boolean
  required?: boolean
}

const FloatingLabel = ({
  label,
  htmlFor,
  isFloating,
  isFocused,
  hasError,
  hasSuccess,
  required,
}: FloatingLabelProps) => (
  <motion.label
    htmlFor={htmlFor}
    className={cn(
      "absolute left-4 pointer-events-none origin-left",
      "transition-colors duration-200",
      // EUVEKA colors based on state
      isFocused && !hasError && !hasSuccess && "text-[#b2987d]",
      hasError && "text-red-500",
      hasSuccess && "text-green-500",
      !isFocused && !hasError && !hasSuccess && "text-[#b2987d]/60",
    )}
    initial={false}
    animate={{
      y: isFloating ? -28 : 0,
      scale: isFloating ? 0.85 : 1,
      x: isFloating ? -4 : 0,
    }}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 25,
    }}
  >
    {label}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </motion.label>
)

// Error message component with animation
const ErrorMessage = ({ message, id }: { message: string; id?: string }) => (
  <motion.p
    id={id}
    className="text-sm text-red-500 mt-2 flex items-center gap-1.5"
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
    role="alert"
    aria-live="polite"
  >
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
    {message}
  </motion.p>
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Show error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Show success state */
  success?: boolean
  /** Floating label text */
  floatingLabel?: string
  /** Icon to show at the start */
  prefixIcon?: React.ReactNode
  /** Icon to show at the end */
  suffixIcon?: React.ReactNode
  /** Text addon at the start */
  prefixText?: string
  /** Text addon at the end */
  suffixText?: string
  /** Container class name */
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      inputSize,
      state,
      error,
      errorMessage,
      success,
      floatingLabel,
      prefixIcon,
      suffixIcon,
      prefixText,
      suffixText,
      containerClassName,
      disabled,
      required,
      id,
      placeholder,
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(
      Boolean(value || defaultValue)
    )
    const inputId = id || React.useId()

    // Determine state from props
    const computedState = error ? "error" : success ? "success" : state

    // Check if floating label should be elevated
    const isFloating = isFocused || hasValue

    // Has addons
    const hasPrefix = prefixIcon || prefixText
    const hasSuffix = suffixIcon || suffixText

    // Handle focus events
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(Boolean(e.target.value))
      onBlur?.(e)
    }

    // Update hasValue when controlled value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setHasValue(Boolean(value))
      }
    }, [value])

    const inputElement = (
      <input
        ref={ref}
        id={inputId}
        type={type}
        data-slot="input"
        data-state={computedState}
        disabled={disabled}
        required={required}
        value={value}
        defaultValue={defaultValue}
        placeholder={floatingLabel ? (isFloating ? placeholder : "") : placeholder}
        className={cn(
          inputVariants({ inputSize, state: computedState }),
          floatingLabel && "pt-5 pb-2",
          hasPrefix && inputSize === "sm" && "pl-10",
          hasPrefix && inputSize === "default" && "pl-12",
          hasPrefix && inputSize === "lg" && "pl-14",
          hasPrefix && !inputSize && "pl-12",
          hasSuffix && inputSize === "sm" && "pr-10",
          hasSuffix && inputSize === "default" && "pr-12",
          hasSuffix && inputSize === "lg" && "pr-14",
          hasSuffix && !inputSize && "pr-12",
          className
        )}
        aria-invalid={error || undefined}
        aria-describedby={error && errorMessage ? `${inputId}-error` : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )

    // Simple input without addons or floating label
    if (!hasPrefix && !hasSuffix && !floatingLabel) {
      return (
        <div className={cn("relative", containerClassName)}>
          {inputElement}
          <AnimatePresence>
            {error && errorMessage && (
              <ErrorMessage message={errorMessage} id={`${inputId}-error`} />
            )}
          </AnimatePresence>
        </div>
      )
    }

    return (
      <div className={cn("relative", containerClassName)}>
        <div className="relative flex items-center">
          {/* Floating label */}
          {floatingLabel && (
            <FloatingLabel
              label={floatingLabel}
              htmlFor={inputId}
              isFloating={isFloating}
              isFocused={isFocused}
              hasError={error ?? false}
              hasSuccess={success ?? false}
              required={required ?? false}
            />
          )}

          {/* Prefix */}
          {hasPrefix && (
            <div
              className={cn(
                "absolute left-0 flex items-center justify-center",
                "text-[#b2987d] pointer-events-none",
                inputSize === "sm" && "pl-3",
                inputSize === "default" && "pl-4",
                inputSize === "lg" && "pl-5",
                !inputSize && "pl-4",
                isFocused && "text-[#b2987d]",
                error && "text-red-500",
                success && "text-green-500",
              )}
              aria-hidden="true"
            >
              {prefixIcon && (
                <span className="size-5 flex items-center justify-center">
                  {prefixIcon}
                </span>
              )}
              {prefixText && (
                <span className="text-sm font-medium">{prefixText}</span>
              )}
            </div>
          )}

          {inputElement}

          {/* Suffix */}
          {hasSuffix && (
            <div
              className={cn(
                "absolute right-0 flex items-center justify-center",
                "text-[#b2987d]",
                suffixIcon && !disabled && "pointer-events-auto cursor-pointer",
                !suffixIcon && "pointer-events-none",
                inputSize === "sm" && "pr-3",
                inputSize === "default" && "pr-4",
                inputSize === "lg" && "pr-5",
                !inputSize && "pr-4",
              )}
              aria-hidden={!suffixIcon}
            >
              {suffixIcon && (
                <span className="size-5 flex items-center justify-center hover:text-[#191610] dark:hover:text-[#fefefc] transition-colors duration-200">
                  {suffixIcon}
                </span>
              )}
              {suffixText && (
                <span className="text-sm font-medium text-[#b2987d]">{suffixText}</span>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && errorMessage && (
            <ErrorMessage message={errorMessage} id={`${inputId}-error`} />
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
