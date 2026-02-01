"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type Variants, type Transition, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Button Component with Micro-Interactions
 *
 * Design Specifications:
 * - Border-radius: 60px (pill shape) - rounded-[60px]
 * - Height: 56px-64px (h-14 to h-16)
 * - Border: 1px solid
 * - Padding: 0 32px (px-8)
 *
 * EUVEKA Micro-Interactions:
 * - Easing: [0.16, 1, 0.3, 1] (custom expo-out)
 * - Hover: subtle scale (1.02) + glow effect
 * - Tap: scale down (0.97)
 * - Ripple: on click
 *
 * Colors:
 * - Primary bg: #191610 (dark) / #fefefc (light)
 * - Text: #fefefc (on dark) / #191610 (on light)
 * - Muted: #b2987d
 * - Border: #e5dac7 (light) / #544a36 (dark)
 *
 * Variants: default, primary, secondary, ghost, outline, destructive, link
 * Sizes: sm, default, lg, icon
 */

// EUVEKA signature easing curve
const EUVEKA_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1]

// EUVEKA transition with signature easing
const euvekaTransition: Transition = {
  duration: 0.3,
  ease: EUVEKA_EASING,
}

const euvekaTransitionFast: Transition = {
  duration: 0.15,
  ease: EUVEKA_EASING,
}

const buttonVariants = cva(
  // Base styles - EUVEKA pill aesthetic
  [
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-semibold select-none",
    // EUVEKA: transition all 0.3s ease
    "transition-all duration-300 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0",
    // Focus state
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    // Overflow hidden for ripple effect
    "overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        // Default/Primary - EUVEKA outlined style with fill on hover (dark mode only)
        default: [
          "border border-[#fefefc] bg-transparent text-[#fefefc]",
          "shadow-[0_2px_8px_-2px_rgba(254,254,252,0.05)]",
          "hover:bg-[#fefefc] hover:text-[#191610]",
          "hover:shadow-[0_4px_16px_-4px_rgba(254,254,252,0.12)]",
          "focus-visible:ring-[#fefefc]/50 focus-visible:ring-offset-[#191610]",
        ].join(" "),

        // Primary - Filled style (dark mode only)
        primary: [
          "border border-[#fefefc] bg-[#fefefc] text-[#191610]",
          "shadow-[0_2px_8px_-2px_rgba(254,254,252,0.1)]",
          "hover:bg-[#e5e5e3] hover:border-[#e5e5e3]",
          "hover:shadow-[0_4px_16px_-4px_rgba(254,254,252,0.2)]",
          "focus-visible:ring-[#fefefc]/50 focus-visible:ring-offset-[#191610]",
        ].join(" "),

        // Secondary - Muted/warm accent (dark mode only)
        secondary: [
          "border border-[#544a36] bg-[#544a36] text-[#fefefc]",
          "shadow-[0_2px_8px_-2px_rgba(84,74,54,0.15)]",
          "hover:bg-[#665a44] hover:border-[#665a44]",
          "hover:shadow-[0_4px_12px_-4px_rgba(84,74,54,0.25)]",
          "focus-visible:ring-[#b2987d]/40 focus-visible:ring-offset-[#191610]",
        ].join(" "),

        // Ghost - Transparent with subtle hover (dark mode only)
        ghost: [
          "bg-transparent text-[#fefefc] border-0",
          "hover:bg-[#fefefc]/10 hover:text-[#fefefc]",
          "active:bg-[#fefefc]/15",
          "focus-visible:ring-[#fefefc]/25 focus-visible:ring-offset-[#191610]",
        ].join(" "),

        // Outline - EUVEKA border style (dark mode only)
        outline: [
          "border border-[#544a36] bg-transparent text-[#fefefc]",
          "hover:border-[#b2987d] hover:text-[#fefefc] hover:bg-[#544a36]/30",
          "active:bg-[#544a36]/40",
          "focus-visible:ring-[#b2987d]/40 focus-visible:ring-offset-[#191610]",
        ].join(" "),

        // Destructive - Error/danger state (dark mode only)
        destructive: [
          "bg-[#ef4444] border-[#ef4444] text-white border",
          "shadow-[0_2px_8px_-2px_rgba(239,68,68,0.3)]",
          "hover:bg-[#dc2626] hover:border-[#dc2626]",
          "hover:shadow-[0_4px_12px_-4px_rgba(220,38,38,0.4)]",
          "focus-visible:ring-[#ef4444]/50 focus-visible:ring-offset-[#191610]",
        ].join(" "),

        // Link - Text style with underline (dark mode only)
        link: [
          "text-[#fefefc] bg-transparent underline-offset-4 border-0",
          "hover:underline hover:text-[#b2987d]",
          "focus-visible:ring-[#fefefc]/30 focus-visible:ring-offset-[#191610]",
        ].join(" "),
      },
      size: {
        // Small - EUVEKA pill with smaller height
        sm: "h-10 px-6 text-sm rounded-[60px]",
        // Default - EUVEKA standard height 56px, padding 32px
        default: "h-14 px-8 text-sm rounded-[60px]",
        // Large - EUVEKA larger height 64px
        lg: "h-16 px-10 text-base rounded-[60px]",
        // Icon - Square with pill radius
        icon: "h-14 w-14 p-0 rounded-[60px]",
        // Icon small
        "icon-sm": "h-10 w-10 p-0 rounded-[60px]",
        // Icon large
        "icon-lg": "h-16 w-16 p-0 rounded-[60px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Animated loading spinner with smooth rotation
const LoadingSpinner = ({ className }: { className?: string }) => (
  <motion.svg
    className={cn("size-5", className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    animate={{ rotate: 360 }}
    transition={{
      duration: 0.9,
      repeat: Infinity,
      ease: "linear",
    }}
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeOpacity="0.2"
    />
    <path
      d="M12 2C6.47715 2 2 6.47715 2 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </motion.svg>
)

/**
 * EUVEKA Button Micro-Interaction Variants
 * - Hover: scale 1.02 + glow
 * - Tap: scale 0.97
 * - All transitions use EUVEKA easing [0.16, 1, 0.3, 1]
 */
const euvekaButtonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: euvekaTransition,
  },
  tap: {
    scale: 0.97,
    transition: euvekaTransitionFast,
  },
}

// Glow overlay variants for hover effect
const glowOverlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  hover: {
    opacity: 1,
    transition: euvekaTransition,
  },
}

// Content fade animation for loading state
const contentVariants: Variants = {
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  hidden: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

// Ripple effect interface
interface RippleEffect {
  id: number
  x: number
  y: number
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Enable ripple effect on click */
  enableRipple?: boolean
  /** Enable glow effect on hover */
  enableGlow?: boolean
}

// Inner motion button component
const MotionButton = motion.button

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      enableRipple = true,
      enableGlow = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg"
    const isLink = variant === "link"
    const enableAnimation = !isLink && !isDisabled

    // Ripple state
    const [ripples, setRipples] = React.useState<RippleEffect[]>([])
    const rippleIdRef = React.useRef(0)

    // Handle ripple creation on click
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (enableRipple && !isDisabled) {
          const button = event.currentTarget
          const rect = button.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top

          const newRipple: RippleEffect = {
            id: rippleIdRef.current++,
            x,
            y,
          }

          setRipples((prev) => [...prev, newRipple])

          // Remove ripple after animation completes
          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
          }, 600)
        }

        onClick?.(event)
      },
      [enableRipple, isDisabled, onClick]
    )

    // For asChild, use Slot without motion wrapper
    if (asChild) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={cn(buttonVariants({ variant, size, className }))}
          data-loading={loading || undefined}
          aria-disabled={isDisabled}
          aria-busy={loading}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {children}
        </Slot>
      )
    }

    // Determine glow color based on variant (monochrome white accent)
    const getGlowColor = () => {
      switch (variant) {
        case "primary":
        case "default":
          return "rgba(254, 254, 252, 0.15)"
        case "secondary":
          return "rgba(178, 152, 125, 0.2)"
        case "destructive":
          return "rgba(239, 68, 68, 0.3)"
        default:
          return "rgba(254, 254, 252, 0.1)"
      }
    }

    const motionButtonProps = {
      ref,
      "data-slot": "button" as const,
      "data-variant": variant,
      "data-size": size,
      "data-loading": loading || undefined,
      className: cn(buttonVariants({ variant, size, className })),
      disabled: isDisabled,
      "aria-disabled": isDisabled,
      "aria-busy": loading,
      variants: enableAnimation ? euvekaButtonVariants : undefined,
      initial: "initial" as const,
      whileHover: enableAnimation ? ("hover" as const) : undefined,
      whileTap: enableAnimation ? ("tap" as const) : undefined,
      type,
      onClick: handleClick,
      ...props,
    } as const

    return (
      // @ts-expect-error - framer-motion types conflict with exactOptionalPropertyTypes
      <MotionButton {...motionButtonProps}>
        {/* Glow overlay for hover effect */}
        {enableGlow && enableAnimation && (
          <motion.span
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              boxShadow: `0 0 40px ${getGlowColor()}, inset 0 0 20px ${getGlowColor()}`,
            }}
            variants={glowOverlayVariants}
            initial="initial"
            aria-hidden="true"
          />
        )}

        {/* Ripple effects container */}
        {enableRipple && (
          <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]" aria-hidden="true">
            <AnimatePresence>
              {ripples.map((ripple) => (
                <motion.span
                  key={ripple.id}
                  className="absolute rounded-full bg-current"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    opacity: 0.2,
                  }}
                  initial={{
                    width: 0,
                    height: 0,
                    x: 0,
                    y: 0,
                    opacity: 0.3,
                  }}
                  animate={{
                    width: 300,
                    height: 300,
                    x: -150,
                    y: -150,
                    opacity: 0,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: EUVEKA_EASING,
                  }}
                />
              ))}
            </AnimatePresence>
          </span>
        )}

        {/* Loading spinner overlay */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden={!loading}
        >
          {loading && <LoadingSpinner />}
        </motion.span>

        {/* Button content */}
        <motion.span
          className="inline-flex items-center justify-center gap-2 relative z-10"
          variants={contentVariants}
          animate={loading && !isIconOnly ? "hidden" : "visible"}
        >
          {leftIcon && (
            <span className="shrink-0 -ml-1" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="shrink-0 -mr-1" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </motion.span>
      </MotionButton>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
