'use client';

import * as React from 'react';
import { motion, type Variants, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react';

/* =============================================================================
   EUVEKA ICON SYSTEM

   Design Philosophy (matching Euveka's minimal style):
   - Thin stroke weight (1-1.5px via strokeWidth prop)
   - Minimal, geometric designs
   - Consistent sizing: 16x16, 20x20, 24x24, 32x32
   - Color: currentColor (inherits text color)
   - Optional: animated micro-interactions on hover

   EUVEKA Color Reference:
   - Primary icon color: #b2987d
   - Dark mode icons: #fefefc
   - Light mode icons: #191610
   - Accent: #0099ff

   Size Standards:
   - h-4 w-4 (16px): Small/compact
   - h-5 w-5 (20px): Default
   - h-6 w-6 (24px): Large
   ============================================================================= */

/* =============================================================================
   TYPE DEFINITIONS
   ============================================================================= */

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends Omit<LucideProps, 'size'> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Size preset: xs (12px), sm (16px), md (20px), lg (24px), xl (32px) */
  size?: IconSize;
  /** Custom size in pixels (overrides size preset) */
  customSize?: number;
  /** Stroke width: thin (1), default (1.5), medium (2) */
  strokeWeight?: 'thin' | 'default' | 'medium';
  /** Enable hover animation */
  animated?: boolean;
  /** Animation type on hover */
  hoverEffect?: 'scale' | 'rotate' | 'bounce' | 'pulse' | 'none';
  /** Additional class names */
  className?: string;
  /** Label for accessibility (uses aria-label if provided, otherwise aria-hidden="true") */
  label?: string;
}

export interface AnimatedIconProps extends IconProps {
  /** Whether the icon is in active/selected state */
  isActive?: boolean;
  /** Continuous animation (not just on hover) */
  continuous?: boolean;
}

/* =============================================================================
   SIZE MAPPINGS
   ============================================================================= */

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const strokeWeightMap: Record<'thin' | 'default' | 'medium', number> = {
  thin: 1,
  default: 1.5,
  medium: 2,
};

/* =============================================================================
   ANIMATION VARIANTS
   ============================================================================= */

const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

const hoverVariants: Record<string, Variants> = {
  scale: {
    initial: { scale: 1 },
    hover: {
      scale: 1.15,
      transition: springTransition
    },
    tap: {
      scale: 0.95,
      transition: { type: 'spring', stiffness: 500, damping: 20 }
    },
  },
  rotate: {
    initial: { rotate: 0 },
    hover: {
      rotate: 15,
      transition: springTransition
    },
    tap: {
      rotate: -5,
      transition: { type: 'spring', stiffness: 500, damping: 20 }
    },
  },
  bounce: {
    initial: { y: 0 },
    hover: {
      y: -3,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10,
        repeat: Infinity,
        repeatType: 'reverse',
        duration: 0.3,
      }
    },
  },
  pulse: {
    initial: { opacity: 1 },
    hover: {
      opacity: [1, 0.6, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    },
  },
  none: {
    initial: {},
    hover: {},
  },
};

/* =============================================================================
   ICON COMPONENT

   Base icon wrapper that applies Euveka styling to Lucide icons
   ============================================================================= */

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = 'md',
      customSize,
      strokeWeight = 'thin',
      animated = false,
      hoverEffect = 'scale',
      className,
      label,
      ...props
    },
    ref
  ) => {
    const pixelSize = customSize ?? sizeMap[size];
    const strokeWidth = strokeWeightMap[strokeWeight];

    const iconElement = (
      <IconComponent
        ref={ref}
        width={pixelSize}
        height={pixelSize}
        strokeWidth={strokeWidth}
        className={cn(
          'shrink-0 transition-colors duration-200',
          className
        )}
        aria-hidden={!label}
        aria-label={label}
        {...props}
      />
    );

    if (!animated) {
      return iconElement;
    }

    const variants = hoverVariants[hoverEffect];
    const variantsProps = variants ? { variants } : {};

    return (
      <motion.span
        className="inline-flex items-center justify-center"
        {...variantsProps}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        {iconElement}
      </motion.span>
    );
  }
);

Icon.displayName = 'Icon';

/* =============================================================================
   ANIMATED ICON COMPONENT

   Extended icon with continuous animations and active states
   ============================================================================= */

const activeVariants: Variants = {
  inactive: { scale: 1, opacity: 0.7 },
  active: {
    scale: 1.1,
    opacity: 1,
    transition: springTransition,
  },
};

const continuousVariants: Record<string, Variants> = {
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  pulse: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  bounce: {
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
};

export const AnimatedIcon = React.forwardRef<HTMLSpanElement, AnimatedIconProps>(
  (
    {
      icon: IconComponent,
      size = 'md',
      customSize,
      strokeWeight = 'thin',
      hoverEffect = 'scale',
      isActive = false,
      continuous = false,
      className,
      label,
      ...props
    },
    ref
  ) => {
    const pixelSize = customSize ?? sizeMap[size];
    const strokeWidth = strokeWeightMap[strokeWeight];

    const iconElement = (
      <IconComponent
        width={pixelSize}
        height={pixelSize}
        strokeWidth={strokeWidth}
        className={cn(
          'shrink-0 transition-colors duration-200',
          className
        )}
        aria-hidden={!label}
        aria-label={label}
        {...props}
      />
    );

    if (continuous) {
      const contVariants = continuousVariants[hoverEffect] ?? continuousVariants['pulse'];
      const contVariantsProps = contVariants ? { variants: contVariants } : {};
      return (
        <motion.span
          ref={ref}
          className="inline-flex items-center justify-center"
          {...contVariantsProps}
          animate="animate"
        >
          {iconElement}
        </motion.span>
      );
    }

    return (
      <motion.span
        ref={ref}
        className="inline-flex items-center justify-center"
        variants={activeVariants}
        initial="inactive"
        animate={isActive ? 'active' : 'inactive'}
        whileHover="hover"
        whileTap="tap"
      >
        {iconElement}
      </motion.span>
    );
  }
);

AnimatedIcon.displayName = 'AnimatedIcon';

/* =============================================================================
   ICON BUTTON COMPONENT

   A button wrapper for icons with proper touch targets (44px minimum)
   ============================================================================= */

export interface IconButtonProps extends Omit<IconProps, 'animated' | 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'ghost' | 'outline' | 'solid';
  buttonSize?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

const buttonSizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const buttonVariantMap = {
  ghost: cn(
    'bg-transparent hover:bg-foreground/5',
    'text-muted-foreground hover:text-foreground'
  ),
  outline: cn(
    'bg-transparent border border-border',
    'hover:bg-foreground/5',
    'hover:border-border/80',
    'text-muted-foreground hover:text-foreground'
  ),
  solid: cn(
    'bg-muted',
    'hover:bg-muted/80',
    'text-foreground'
  ),
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      size = 'md',
      customSize,
      strokeWeight = 'thin',
      hoverEffect: _hoverEffect = 'scale',
      onClick,
      disabled = false,
      variant = 'ghost',
      buttonSize = 'md',
      className,
      'aria-label': ariaLabel,
      ...iconProps
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-xl',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          buttonSizeMap[buttonSize],
          buttonVariantMap[variant],
          className
        )}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        aria-label={ariaLabel}
        aria-disabled={disabled}
      >
        <Icon
          icon={icon}
          size={size}
          {...(customSize !== undefined ? { customSize } : {})}
          strokeWeight={strokeWeight}
          animated={false}
          {...iconProps}
        />
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

/* =============================================================================
   STATUS ICON COMPONENT

   Icon with status indicator (dot)
   ============================================================================= */

export interface StatusIconProps extends IconProps {
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  showStatus?: boolean;
  dotPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const statusColorMap = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-zinc-400',
};

const dotPositionMap = {
  'top-right': '-top-0.5 -right-0.5',
  'top-left': '-top-0.5 -left-0.5',
  'bottom-right': '-bottom-0.5 -right-0.5',
  'bottom-left': '-bottom-0.5 -left-0.5',
};

export const StatusIcon = React.forwardRef<SVGSVGElement, StatusIconProps>(
  (
    {
      status = 'neutral',
      showStatus = true,
      dotPosition = 'top-right',
      ...iconProps
    },
    ref
  ) => {
    return (
      <span className="relative inline-flex">
        <Icon ref={ref} {...iconProps} />
        {showStatus && (
          <motion.span
            className={cn(
              'absolute w-2 h-2 rounded-full',
              'ring-2 ring-background',
              statusColorMap[status],
              dotPositionMap[dotPosition]
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          />
        )}
      </span>
    );
  }
);

StatusIcon.displayName = 'StatusIcon';

/* =============================================================================
   LOADING ICON COMPONENT

   Animated loading spinner following Euveka style (thin strokes)
   ============================================================================= */

export interface LoadingIconProps {
  size?: IconSize;
  customSize?: number;
  strokeWeight?: 'thin' | 'default' | 'medium';
  className?: string;
}

export const LoadingIcon: React.FC<LoadingIconProps> = ({
  size = 'md',
  customSize,
  strokeWeight = 'thin',
  className,
}) => {
  const pixelSize = customSize ?? sizeMap[size];
  const strokeWidth = strokeWeightMap[strokeWeight];

  return (
    <motion.svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeOpacity="0.2"
      />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </motion.svg>
  );
};

LoadingIcon.displayName = 'LoadingIcon';
