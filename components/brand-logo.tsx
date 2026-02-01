"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * 2026 Brand Logo Component
 *
 * Design Features:
 * - Black circle with white triangle (play button style)
 * - Inverts colors in dark mode (white circle, black triangle)
 * - Hover animation with subtle rotation or pulse
 * - "tallow" text in display font
 * - Multiple size variants
 * - Optional link wrapper
 */

export interface BrandLogoProps {
  /** Size of the logo */
  size?: "xs" | "sm" | "default" | "lg" | "xl"
  /** Show text alongside icon */
  showText?: boolean
  /** Animation style on hover */
  hoverAnimation?: "rotate" | "pulse" | "glow" | "none"
  /** Link href (wraps logo in Link) */
  href?: string
  /** Additional class name */
  className?: string
  /** Text color override */
  textClassName?: string
  /** Disable animations */
  disableAnimations?: boolean
}

// Size configurations
const sizes = {
  xs: {
    icon: 24,
    text: "text-base",
    gap: "gap-1.5",
    triangle: { width: 8, height: 10, offset: 1 },
  },
  sm: {
    icon: 32,
    text: "text-lg",
    gap: "gap-2",
    triangle: { width: 10, height: 13, offset: 1.5 },
  },
  default: {
    icon: 40,
    text: "text-xl",
    gap: "gap-2.5",
    triangle: { width: 13, height: 16, offset: 2 },
  },
  lg: {
    icon: 48,
    text: "text-2xl",
    gap: "gap-3",
    triangle: { width: 16, height: 20, offset: 2 },
  },
  xl: {
    icon: 64,
    text: "text-3xl",
    gap: "gap-4",
    triangle: { width: 21, height: 26, offset: 3 },
  },
}

// Logo icon component
const LogoIcon = ({
  size,
  hoverAnimation,
  disableAnimations,
}: {
  size: keyof typeof sizes
  hoverAnimation: BrandLogoProps["hoverAnimation"]
  disableAnimations?: boolean
}) => {
  const config = sizes[size]
  const iconSize = config.icon
  const { width: triWidth, height: triHeight, offset: triOffset } = config.triangle

  // Calculate triangle points (centered, slightly offset right for optical center)
  const centerX = iconSize / 2 + triOffset
  const centerY = iconSize / 2
  const trianglePoints = `
    ${centerX - triWidth / 2},${centerY - triHeight / 2}
    ${centerX + triWidth / 2},${centerY}
    ${centerX - triWidth / 2},${centerY + triHeight / 2}
  `

  // Hover animation variants
  const getHoverAnimation = () => {
    if (disableAnimations || hoverAnimation === "none") {return {}}

    switch (hoverAnimation) {
      case "rotate":
        return { rotate: 15 }
      case "pulse":
        return { scale: 1.1 }
      case "glow":
        return { filter: "drop-shadow(0 0 12px rgba(0,102,255,0.6))" }
      default:
        return { scale: 1.1 }
    }
  }

  return (
    <motion.svg
      width={iconSize}
      height={iconSize}
      viewBox={`0 0 ${iconSize} ${iconSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 1, rotate: 0, filter: "drop-shadow(0 0 0px rgba(0,102,255,0))" }}
      whileHover={getHoverAnimation()}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15,
      }}
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Circle background - black in light mode, white in dark mode */}
      <circle
        cx={iconSize / 2}
        cy={iconSize / 2}
        r={iconSize / 2}
        className="fill-gray-900 dark:fill-white transition-colors duration-200"
      />

      {/* Triangle play icon - white in light mode, black in dark mode */}
      <polygon
        points={trianglePoints}
        className="fill-white dark:fill-gray-900 transition-colors duration-200"
      />
    </motion.svg>
  )
}

// Logo text component
const LogoText = ({
  size,
  className,
}: {
  size: keyof typeof sizes
  className?: string
}) => {
  const config = sizes[size]

  return (
    <span
      className={cn(
        config.text,
        "font-semibold tracking-tight",
        "text-gray-900 dark:text-white",
        "transition-colors duration-200",
        className
      )}
    >
      tallow
    </span>
  )
}

export const BrandLogo = React.forwardRef<
  HTMLDivElement,
  BrandLogoProps
>(({
  size = "default",
  showText = true,
  hoverAnimation = "pulse",
  href,
  className,
  textClassName,
  disableAnimations = false,
}, ref) => {
  const config = sizes[size]

  const content = (
    <motion.div
      ref={ref}
      className={cn(
        "inline-flex items-center",
        config.gap,
        href && "cursor-pointer",
        className
      )}
      initial={{ opacity: 1 }}
      whileHover={disableAnimations ? {} : { opacity: 1 }}
      role={href ? undefined : "img"}
      aria-label="Tallow"
    >
      <LogoIcon
        size={size}
        hoverAnimation={hoverAnimation}
        disableAnimations={disableAnimations}
      />
      {showText && (
        <LogoText size={size} {...(textClassName ? { className: textClassName } : {})} />
      )}
    </motion.div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fefefc]/50 focus-visible:ring-offset-2 rounded-lg"
        aria-label="Tallow - Go to home"
      >
        {content}
      </Link>
    )
  }

  return content
})
BrandLogo.displayName = "BrandLogo"

// Animated version with continuous animation (for loading states, etc.)
export const BrandLogoAnimated = ({
  size = "default",
  className,
}: {
  size?: BrandLogoProps["size"]
  className?: string
}) => {
  const config = sizes[size || "default"]
  const iconSize = config.icon
  const { width: triWidth, height: triHeight, offset: triOffset } = config.triangle

  const centerX = iconSize / 2 + triOffset
  const centerY = iconSize / 2
  const trianglePoints = `
    ${centerX - triWidth / 2},${centerY - triHeight / 2}
    ${centerX + triWidth / 2},${centerY}
    ${centerX - triWidth / 2},${centerY + triHeight / 2}
  `

  return (
    <motion.svg
      width={iconSize}
      height={iconSize}
      viewBox={`0 0 ${iconSize} ${iconSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      animate={{
        rotate: [0, 0, 360],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 1],
      }}
      aria-hidden="true"
      role="img"
      aria-label="Loading"
    >
      <circle
        cx={iconSize / 2}
        cy={iconSize / 2}
        r={iconSize / 2}
        className="fill-gray-900 dark:fill-white"
      />
      <polygon
        points={trianglePoints}
        className="fill-white dark:fill-gray-900"
      />
    </motion.svg>
  )
}

// Icon-only export for favicon/app icon uses
export const BrandIcon = ({
  size = "default",
  className,
}: {
  size?: BrandLogoProps["size"]
  className?: string
}) => {
  const config = sizes[size || "default"]
  const iconSize = config.icon
  const { width: triWidth, height: triHeight, offset: triOffset } = config.triangle

  const centerX = iconSize / 2 + triOffset
  const centerY = iconSize / 2
  const trianglePoints = `
    ${centerX - triWidth / 2},${centerY - triHeight / 2}
    ${centerX + triWidth / 2},${centerY}
    ${centerX - triWidth / 2},${centerY + triHeight / 2}
  `

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox={`0 0 ${iconSize} ${iconSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle
        cx={iconSize / 2}
        cy={iconSize / 2}
        r={iconSize / 2}
        className="fill-gray-900 dark:fill-white transition-colors duration-200"
      />
      <polygon
        points={trianglePoints}
        className="fill-white dark:fill-gray-900 transition-colors duration-200"
      />
    </svg>
  )
}

export default BrandLogo
