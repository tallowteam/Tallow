"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type Variants, type Transition } from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * EUVEKA Card Component with Micro-Interactions
 *
 * Design Specifications:
 * - Border-radius: 24px-32px (rounded-3xl to rounded-[32px])
 * - Padding: 32px (p-8)
 * - Gap: 16px (gap-4)
 *
 * EUVEKA Micro-Interactions:
 * - Easing: [0.16, 1, 0.3, 1] (custom expo-out)
 * - Hover: translateY(-4px) lift effect with enhanced shadow
 * - Subtle glow on hover
 *
 * Colors:
 * - Primary bg: #191610 (dark) / #fefefc (light)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Muted: #b2987d
 */

// =============================================================================
// EUVEKA ANIMATION TOKENS
// =============================================================================

// EUVEKA signature easing curve
const EUVEKA_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1]

// EUVEKA transition configurations
const euvekaTransition: Transition = {
  duration: 0.3,
  ease: EUVEKA_EASING,
}

const euvekaTransitionSlow: Transition = {
  duration: 0.5,
  ease: EUVEKA_EASING,
}

// =============================================================================
// CARD VARIANTS
// =============================================================================

const cardVariants = cva(
  // Base styles - EUVEKA aesthetic
  [
    "relative overflow-hidden",
    // EUVEKA: transition all 0.3s ease
    "transition-all duration-300 ease-out",
    "outline-none",
    // Focus ring - warm/muted
    "focus-visible:ring-[3px] focus-visible:ring-[#fefefc]/30 focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[#191610]",
  ].join(" "),
  {
    variants: {
      /**
       * Visual style variants - EUVEKA warm neutrals
       */
      variant: {
        // Default - EUVEKA dark mode only
        default: [
          "bg-[#191610] border border-[#544a36]",
          "shadow-[0_2px_16px_-4px_rgba(0,0,0,0.4),0_4px_32px_-8px_rgba(0,0,0,0.3)]",
        ].join(" "),

        // Glass - Frosted glass morphism effect (dark mode only)
        glass: [
          "bg-[#191610]/60 backdrop-blur-xl backdrop-saturate-150",
          "border border-[#544a36]",
          "shadow-[0_4px_32px_-6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(254,254,252,0.02)]",
        ].join(" "),

        // Elevated - More prominent depth (dark mode only)
        elevated: [
          "bg-[#191610] border border-[#544a36]",
          "shadow-[0_8px_48px_-12px_rgba(0,0,0,0.5),0_4px_20px_-4px_rgba(0,0,0,0.4)]",
        ].join(" "),

        // Outline - Minimal, border-focused (dark mode only)
        outline: [
          "bg-[#191610] border border-[#544a36]",
          "shadow-none",
        ].join(" "),

        // Ghost - Transparent background
        ghost: [
          "bg-transparent border-0 shadow-none",
        ].join(" "),
      },

      /**
       * Border radius options - EUVEKA 24px-32px
       */
      radius: {
        none: "rounded-none",
        sm: "rounded-xl", // 12px
        default: "rounded-3xl", // 24px - EUVEKA standard
        lg: "rounded-[32px]", // 32px - EUVEKA large
        xl: "rounded-[40px]", // 40px
        full: "rounded-full",
      },

      /**
       * Bento grid span options
       */
      span: {
        "1": "",
        "2": "col-span-2",
        "3": "col-span-3",
        "full": "col-span-full",
        "row-2": "row-span-2",
        "2x2": "col-span-2 row-span-2",
      },

      /**
       * Internal padding - EUVEKA 32px standard
       */
      padding: {
        none: "",
        xs: "p-4",
        sm: "p-6",
        default: "p-8", // 32px - EUVEKA standard
        lg: "p-10",
        xl: "p-12",
      },

      /**
       * Interactive state (clickable cards)
       */
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "default", // 24px
      span: "1",
      padding: "default", // 32px
      interactive: false,
    },
  }
)

// =============================================================================
// CARD TYPES
// =============================================================================

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "style">,
    VariantProps<typeof cardVariants> {
  /** Enable hover lift animation (translateY -4px) */
  hoverLift?: boolean
  /** Enable subtle border glow effect on hover */
  hoverGlow?: boolean
  /** Enable scale effect on hover */
  hoverScale?: boolean
  /** Disable all animations (for reduced motion) */
  disableAnimations?: boolean
  /** Style prop */
  style?: React.CSSProperties | undefined
  /** Children content */
  children?: React.ReactNode
}

// =============================================================================
// EUVEKA CARD ANIMATION CONFIGURATIONS
// =============================================================================

type VariantKey = "default" | "glass" | "elevated" | "outline" | "ghost"

interface ShadowConfig {
  initial: string
  hover: string
  glow: string
}

const shadowConfigs: Record<VariantKey, ShadowConfig> = {
  default: {
    initial: "0 2px 16px -4px rgba(0,0,0,0.4), 0 4px 32px -8px rgba(0,0,0,0.3)",
    hover: "0 16px 48px -12px rgba(0,0,0,0.5), 0 8px 24px -8px rgba(0,0,0,0.4)",
    glow: "0 16px 48px -12px rgba(0,0,0,0.5), 0 0 32px -4px rgba(254,254,252,0.15)",
  },
  glass: {
    initial: "0 4px 32px -6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(254,254,252,0.02)",
    hover: "0 20px 56px -12px rgba(0,0,0,0.5)",
    glow: "0 20px 56px -12px rgba(0,0,0,0.5), 0 0 40px -4px rgba(254,254,252,0.12)",
  },
  elevated: {
    initial: "0 8px 48px -12px rgba(0,0,0,0.5), 0 4px 20px -4px rgba(0,0,0,0.4)",
    hover: "0 24px 64px -16px rgba(0,0,0,0.6), 0 12px 32px -8px rgba(0,0,0,0.5)",
    glow: "0 24px 64px -16px rgba(0,0,0,0.6), 0 0 48px -4px rgba(254,254,252,0.18)",
  },
  outline: {
    initial: "none",
    hover: "0 12px 40px -8px rgba(0,0,0,0.4)",
    glow: "0 12px 40px -8px rgba(0,0,0,0.4), 0 0 24px -4px rgba(254,254,252,0.1)",
  },
  ghost: {
    initial: "none",
    hover: "0 8px 24px -4px rgba(0,0,0,0.3)",
    glow: "0 8px 24px -4px rgba(0,0,0,0.3), 0 0 20px -4px rgba(254,254,252,0.08)",
  },
}

function getShadowConfig(variant: string | null | undefined): ShadowConfig {
  const key = (variant || "default") as VariantKey
  return shadowConfigs[key] || shadowConfigs.default
}

/**
 * EUVEKA Card Lift Animation Variants
 * - Hover: translateY(-4px) with enhanced shadow
 * - Uses EUVEKA easing [0.16, 1, 0.3, 1]
 */
function createCardAnimations(
  shadows: ShadowConfig,
  hoverLift: boolean,
  hoverScale: boolean,
  hoverGlow: boolean,
  interactive: boolean | null | undefined
): Variants {
  return {
    initial: {
      y: 0,
      scale: 1,
      boxShadow: shadows.initial,
    },
    hover: {
      y: hoverLift ? -4 : 0,
      scale: hoverScale ? 1.02 : 1,
      boxShadow: hoverGlow ? shadows.glow : shadows.hover,
      transition: euvekaTransitionSlow,
    },
    tap: interactive
      ? {
          scale: 0.98,
          y: hoverLift ? -2 : 0,
          transition: euvekaTransition,
        }
      : {},
  }
}

// Glow overlay animation variants
const glowOverlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  hover: {
    opacity: 1,
    transition: euvekaTransition,
  },
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      radius,
      span,
      padding,
      interactive,
      hoverLift = true,
      hoverGlow = true,
      hoverScale = false,
      disableAnimations = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const shadows = getShadowConfig(variant)
    const cardAnimations = createCardAnimations(
      shadows,
      hoverLift,
      hoverScale,
      hoverGlow,
      interactive
    )

    // Hover border animation - monochrome white accent
    const hoverBorderClass = hoverGlow
      ? "hover:border-[#fefefc]/30"
      : ""

    const shouldAnimate = !disableAnimations && (hoverLift || hoverGlow || hoverScale)

    // Filter out undefined values
    const safeProps = Object.fromEntries(
      Object.entries(props).filter(([, v]) => v !== undefined)
    )

    // Build motion props
    const motionDivProps = {
      ref,
      "data-slot": "card",
      "data-variant": variant,
      className: cn(
        cardVariants({ variant, radius, span, padding, interactive }),
        hoverBorderClass,
        className
      ),
      initial: "initial" as const,
      ...(interactive ? { tabIndex: 0, role: "button" as const } : {}),
      ...(shouldAnimate ? { variants: cardAnimations, whileHover: "hover" as const } : {}),
      ...(interactive ? { whileTap: "tap" as const } : {}),
      ...(style !== undefined ? { style } : {}),
      ...safeProps,
    }

    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <motion.div {...(motionDivProps as any)}>
        {/* Monochrome white glow overlay on hover */}
        {hoverGlow && !disableAnimations && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(254,254,252,0.08) 0%, transparent 60%)",
            }}
            variants={glowOverlayVariants}
            initial="initial"
            aria-hidden="true"
          />
        )}
        {children}
      </motion.div>
    )
  }
)
Card.displayName = "Card"

// =============================================================================
// CARD HEADER - EUVEKA 32px padding, gap-4
// =============================================================================

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spacing between header elements */
  spacing?: "tight" | "default" | "loose"
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, spacing = "default", ...props }, ref) => {
    const spacingClasses = {
      tight: "gap-2 p-6 pb-0",
      default: "gap-4 p-8 pb-0", // EUVEKA: p-8 (32px), gap-4 (16px)
      loose: "gap-6 p-10 pb-0",
    }

    return (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn("flex flex-col", spacingClasses[spacing], className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = "CardHeader"

// =============================================================================
// CARD TITLE
// =============================================================================

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level (affects semantics, not style) */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  /** Size variant */
  size?: "sm" | "default" | "lg" | "xl"
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", size = "default", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "text-base font-semibold leading-snug",
      default: "text-lg font-semibold leading-snug tracking-tight",
      lg: "text-xl font-semibold leading-snug tracking-tight",
      xl: "text-2xl font-bold leading-tight tracking-tight",
    }

    return (
      <Component
        ref={ref}
        data-slot="card-title"
        className={cn(
          sizeClasses[size],
          // EUVEKA dark mode text color
          "text-[#fefefc]",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
CardTitle.displayName = "CardTitle"

// =============================================================================
// CARD DESCRIPTION
// =============================================================================

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Size variant */
  size?: "sm" | "default" | "lg"
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-xs leading-relaxed",
      default: "text-sm leading-relaxed",
      lg: "text-base leading-relaxed",
    }

    return (
      <p
        ref={ref}
        data-slot="card-description"
        className={cn(
          sizeClasses[size],
          // EUVEKA muted text color
          "text-[#b2987d]",
          className
        )}
        {...props}
      />
    )
  }
)
CardDescription.displayName = "CardDescription"

// =============================================================================
// CARD CONTENT - EUVEKA 32px padding
// =============================================================================

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding variant */
  padding?: "none" | "sm" | "default" | "lg"
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = "default", ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-6 pt-0",
      default: "p-8 pt-0", // EUVEKA: p-8 (32px)
      lg: "p-10 pt-0",
    }

    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn(paddingClasses[padding], className)}
        {...props}
      />
    )
  }
)
CardContent.displayName = "CardContent"

// =============================================================================
// CARD FOOTER - EUVEKA 32px padding, gap-4
// =============================================================================

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of footer items */
  align?: "start" | "center" | "end" | "between"
  /** Padding variant */
  padding?: "sm" | "default" | "lg"
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align = "start", padding = "default", ...props }, ref) => {
    const alignClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    }

    const paddingClasses = {
      sm: "p-6 pt-0",
      default: "p-8 pt-0", // EUVEKA: p-8 (32px)
      lg: "p-10 pt-0",
    }

    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn(
          "flex items-center gap-4", // EUVEKA: gap-4 (16px)
          alignClasses[align],
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

// =============================================================================
// BENTO CARD (Specialized for Bento Grid layouts)
// =============================================================================

interface BentoCardProps extends CardProps {
  /** Grid span: 1, 2, or full width */
  gridSpan?: "1" | "2" | "full"
  /** Optional icon component */
  icon?: React.ReactNode
  /** Card title */
  title?: string
  /** Card description */
  description?: string
}

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  (
    {
      className,
      gridSpan = "1",
      icon,
      title,
      description,
      children,
      ...props
    },
    ref
  ) => {
    const spanClasses = {
      "1": "",
      "2": "col-span-2",
      "full": "col-span-full",
    }

    return (
      <Card
        ref={ref}
        className={cn(spanClasses[gridSpan], "group", className)}
        hoverLift
        hoverGlow
        {...props}
      >
        <CardHeader>
          {icon && (
            <motion.div
              className="w-12 h-12 rounded-2xl bg-[#191610] border border-[#544a36] flex items-center justify-center mb-2"
              whileHover={{ scale: 1.05 }}
              transition={euvekaTransition}
            >
              <span className="text-[#fefefc]">{icon}</span>
            </motion.div>
          )}
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
      </Card>
    )
  }
)
BentoCard.displayName = "BentoCard"

// =============================================================================
// BENTO GRID (Container for Bento Cards)
// =============================================================================

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns */
  columns?: 2 | 3 | 4
  /** Gap between items - EUVEKA 16px standard */
  gap?: "sm" | "default" | "lg"
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, columns = 3, gap = "default", children, ...props }, ref) => {
    const columnClasses = {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }

    const gapClasses = {
      sm: "gap-3",
      default: "gap-4 md:gap-4", // EUVEKA: gap-4 (16px)
      lg: "gap-6 md:gap-8",
    }

    return (
      <div
        ref={ref}
        data-slot="bento-grid"
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BentoGrid.displayName = "BentoGrid"

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  BentoCard,
  BentoGrid,
  cardVariants,
}
