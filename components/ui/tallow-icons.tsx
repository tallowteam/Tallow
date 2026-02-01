'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* =============================================================================
   TALLOW ICON SYSTEM - EUVEKA DESIGN SPECIFICATIONS

   Color Palette:
   - Primary icon color: #b2987d (EUVEKA neutral)
   - Dark mode icons: #fefefc (off-white)
   - Light mode icons: #191610 (charcoal)

   Size Standards:
   - Small (h-4 w-4): 16px - for inline/compact use
   - Default (h-5 w-5): 20px - standard icon size
   - Large (h-6 w-6): 24px - for emphasis

   Stroke Standards:
   - Thin 1px strokes for geometric, minimal designs
   - currentColor inheritance for theme support
   ============================================================================= */

/* =============================================================================
   EUVEKA ICON COLOR CLASSES

   Use these utility classes for consistent icon coloring:
   - icon-primary: Uses EUVEKA primary color (#b2987d)
   - icon-foreground: Theme-aware foreground color
   - icon-muted: Muted/secondary icon color
   ============================================================================= */

export const EUVEKA_ICON_COLORS = {
  primary: 'text-[#b2987d]',
  foreground: 'text-[#191610] dark:text-[#fefefc]',
  muted: 'text-[#b2987d]',
  accent: 'text-[#fefefc]',
} as const;

export const EUVEKA_ICON_SIZES = {
  sm: 'h-4 w-4',    // 16px
  md: 'h-5 w-5',    // 20px (default)
  lg: 'h-6 w-6',    // 24px
  xl: 'h-8 w-8',    // 32px
} as const;

/* =============================================================================
   TYPE DEFINITIONS
   ============================================================================= */

export type EuvekaIconSize = keyof typeof EUVEKA_ICON_SIZES;
export type EuvekaIconColor = keyof typeof EUVEKA_ICON_COLORS;

export interface CustomIconProps {
  /** Icon size: 'sm' (16px), 'md' (20px), 'lg' (24px), 'xl' (32px) */
  size?: EuvekaIconSize | number;
  /** Additional CSS classes */
  className?: string;
  /** SVG stroke width (default: 1 for EUVEKA thin stroke) */
  strokeWidth?: number;
  /** Color variant from EUVEKA palette */
  color?: EuvekaIconColor;
  /** Accessible label - if provided, aria-hidden will be false */
  label?: string;
}

/**
 * Get numeric size from size prop
 */
function getIconSize(size: EuvekaIconSize | number | undefined): number {
  if (typeof size === 'number') {return size;}
  const sizeMap: Record<EuvekaIconSize, number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };
  return sizeMap[size ?? 'md'];
}

/**
 * Get size class from size prop
 */
function getIconSizeClass(size: EuvekaIconSize | number | undefined): string {
  if (typeof size === 'number') {return '';}
  return EUVEKA_ICON_SIZES[size ?? 'md'];
}

/**
 * Get color class from color prop
 */
function getIconColorClass(color: EuvekaIconColor | undefined): string {
  if (!color) {return '';}
  return EUVEKA_ICON_COLORS[color];
}

/* =============================================================================
   TALLOW LOGO ICON

   Circle with upward-pointing triangle (play icon rotated)
   EUVEKA: 1px stroke, geometric minimal design
   ============================================================================= */

export const TallowLogoIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
      />
      <path
        d="M9 7.5v9l7-4.5-7-4.5z"
        fill="var(--bg-primary, #191610)"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
};

TallowLogoIcon.displayName = 'TallowLogoIcon';

/* =============================================================================
   SECURE TRANSFER ICON

   Shield with arrow - represents secure file transfer
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const SecureTransferIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Shield outline */}
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Upload arrow */}
      <path
        d="M12 16V9M9 11l3-3 3 3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

SecureTransferIcon.displayName = 'SecureTransferIcon';

/* =============================================================================
   P2P CONNECTION ICON

   Two devices with connecting line
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const P2PConnectionIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Left device */}
      <rect
        x="2"
        y="6"
        width="6"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <line
        x1="3.5"
        y1="15"
        x2="6.5"
        y2="15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Right device */}
      <rect
        x="16"
        y="6"
        width="6"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <line
        x1="17.5"
        y1="15"
        x2="20.5"
        y2="15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Connection line with dots */}
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray="2 2"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
};

P2PConnectionIcon.displayName = 'P2PConnectionIcon';

/* =============================================================================
   QUANTUM SHIELD ICON

   Shield with quantum/atomic symbol inside
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const QuantumShieldIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Shield */}
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Atomic/quantum symbol */}
      <ellipse
        cx="12"
        cy="11"
        rx="4"
        ry="2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        transform="rotate(45 12 11)"
      />
      <ellipse
        cx="12"
        cy="11"
        rx="4"
        ry="2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        transform="rotate(-45 12 11)"
      />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
    </svg>
  );
};

QuantumShieldIcon.displayName = 'QuantumShieldIcon';

/* =============================================================================
   ENCRYPTION KEY ICON

   Minimal geometric key design
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const EncryptionKeyIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      <circle
        cx="8"
        cy="8"
        r="5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="8"
        cy="8"
        r="2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M12 12l8 8M16 20h4v-4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

EncryptionKeyIcon.displayName = 'EncryptionKeyIcon';

/* =============================================================================
   ANIMATED SIGNAL ICON

   Pulsing connection signal indicator
   EUVEKA: 1px stroke with subtle animation
   ============================================================================= */

export const AnimatedSignalIcon: React.FC<CustomIconProps & { active?: boolean }> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
  active = true,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <motion.svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Center dot */}
      <motion.circle
        cx="12"
        cy="12"
        r="2"
        fill="currentColor"
        animate={active ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Inner ring */}
      <motion.circle
        cx="12"
        cy="12"
        r="5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        initial={{ opacity: 0.3 }}
        animate={active ? { opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* Outer ring */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        initial={{ opacity: 0.2 }}
        animate={active ? { opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
};

AnimatedSignalIcon.displayName = 'AnimatedSignalIcon';

/* =============================================================================
   ZERO KNOWLEDGE ICON

   Eye with slash - represents privacy/no data collection
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const ZeroKnowledgeIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Eye outline */}
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Pupil */}
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Slash */}
      <line
        x1="4"
        y1="4"
        x2="20"
        y2="20"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

ZeroKnowledgeIcon.displayName = 'ZeroKnowledgeIcon';

/* =============================================================================
   FILE TRANSFER ICON

   Document with bidirectional arrows
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const FileTransferIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Document */}
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrows */}
      <path
        d="M9 13h6M12 10l3 3-3 3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

FileTransferIcon.displayName = 'FileTransferIcon';

/* =============================================================================
   PRIVACY SHIELD ICON

   Shield with lock symbol - represents privacy protection
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const PrivacyShieldIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Shield */}
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lock */}
      <rect
        x="9"
        y="10"
        width="6"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M10 10V8a2 2 0 114 0v2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

PrivacyShieldIcon.displayName = 'PrivacyShieldIcon';

/* =============================================================================
   ONION ROUTING ICON

   Layered circles representing onion routing
   EUVEKA: 1px stroke, minimal geometric design
   ============================================================================= */

export const OnionRoutingIcon: React.FC<CustomIconProps> = ({
  size = 'md',
  className,
  strokeWidth = 1,
  color,
  label,
}) => {
  const pixelSize = getIconSize(size);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0', sizeClass, colorClass, className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* Outer layer */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Middle layer */}
      <circle
        cx="12"
        cy="12"
        r="6.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Inner layer */}
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Core */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
};

OnionRoutingIcon.displayName = 'OnionRoutingIcon';

/* =============================================================================
   ICON BUTTON WRAPPER

   Wraps an icon in an accessible button with EUVEKA styling
   Ensures 44px minimum touch target for accessibility
   ============================================================================= */

export interface IconButtonWrapperProps {
  /** Icon component to render */
  children: React.ReactNode;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string;
  /** Button disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'solid';
}

const buttonSizeClasses = {
  sm: 'h-8 w-8 min-h-[32px] min-w-[32px]',
  md: 'h-10 w-10 min-h-[40px] min-w-[40px]',
  lg: 'h-12 w-12 min-h-[44px] min-w-[44px]',
} as const;

const buttonVariantClasses = {
  ghost: cn(
    'bg-transparent',
    'text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]',
    'hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/20'
  ),
  outline: cn(
    'bg-transparent',
    'border border-[#e5dac7] dark:border-[#544a36]',
    'text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]',
    'hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/20',
    'hover:border-[#d6cec2] dark:hover:border-[#b2987d]'
  ),
  solid: cn(
    'bg-[#e5dac7] dark:bg-[#544a36]',
    'text-[#191610] dark:text-[#fefefc]',
    'hover:bg-[#d6cec2] dark:hover:bg-[#b2987d]'
  ),
} as const;

export const IconButtonWrapper = React.forwardRef<HTMLButtonElement, IconButtonWrapperProps>(
  (
    {
      children,
      onClick,
      'aria-label': ariaLabel,
      disabled = false,
      className,
      size = 'md',
      variant = 'ghost',
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-xl',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[#fefefc] focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]',
          'disabled:opacity-50 disabled:pointer-events-none',
          buttonSizeClasses[size],
          buttonVariantClasses[variant],
          className
        )}
        aria-label={ariaLabel}
        aria-disabled={disabled}
      >
        {children}
      </button>
    );
  }
);

IconButtonWrapper.displayName = 'IconButtonWrapper';

/* =============================================================================
   DECORATIVE ICON WRAPPER

   Wraps an icon with aria-hidden="true" for decorative icons
   ============================================================================= */

export interface DecorativeIconProps {
  /** Icon component to render */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const DecorativeIcon: React.FC<DecorativeIconProps> = ({
  children,
  className,
}) => {
  return (
    <span className={cn('inline-flex shrink-0', className)} aria-hidden="true">
      {children}
    </span>
  );
};

DecorativeIcon.displayName = 'DecorativeIcon';

/* =============================================================================
   NAMED EXPORTS FOR BARREL RE-EXPORT
   ============================================================================= */

export const TallowIcons = {
  TallowLogoIcon,
  SecureTransferIcon,
  P2PConnectionIcon,
  QuantumShieldIcon,
  EncryptionKeyIcon,
  AnimatedSignalIcon,
  ZeroKnowledgeIcon,
  FileTransferIcon,
  PrivacyShieldIcon,
  OnionRoutingIcon,
};

export default TallowIcons;
