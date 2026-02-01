'use client';

/**
 * Animated Link Component - Euveka Style
 *
 * Features:
 * - Underline animation on hover (scaleX from 0 to 1)
 * - Subtle text lift effect
 * - Reduced motion support
 * - Works with Next.js Link
 */

import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { linkTextVariants, snappySpring } from '@/lib/animations/micro-interactions';

// =============================================================================
// ANIMATED LINK
// =============================================================================

export interface AnimatedLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Underline color (defaults to currentColor) */
  underlineColor?: string;
  /** Underline thickness in pixels */
  underlineHeight?: number;
  /** Animation direction: left-to-right or center-out */
  direction?: 'ltr' | 'center';
  /** Disable animation */
  disableAnimation?: boolean;
  /** External link (adds rel and target) */
  external?: boolean;
  'aria-label'?: string;
}

export const AnimatedLink = React.forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  (
    {
      href,
      children,
      className,
      underlineColor,
      underlineHeight = 1,
      direction = 'ltr',
      disableAnimation = false,
      external = false,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimation && !prefersReducedMotion;

    // Determine underline origin based on direction
    const underlineOrigin = direction === 'center' ? 0.5 : 0;

    const externalProps = external
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};

    if (!shouldAnimate) {
      return (
        <Link
          ref={ref}
          href={href}
          className={cn(
            'relative inline-flex items-center',
            'text-inherit hover:opacity-80 transition-opacity',
            'underline-offset-4 hover:underline',
            className
          )}
          {...externalProps}
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={cn('relative inline-flex items-center group', className)}
        {...externalProps}
        {...props}
      >
        <motion.span
          className="relative"
          initial="initial"
          whileHover="hover"
          variants={linkTextVariants}
        >
          {children}
          {/* Animated underline */}
          <motion.span
            className="absolute left-0 right-0 bottom-0 h-px"
            style={{
              height: underlineHeight,
              backgroundColor: underlineColor || 'currentColor',
              originX: underlineOrigin,
            }}
            variants={{
              initial: {
                scaleX: 0,
              },
              hover: {
                scaleX: 1,
                transition: {
                  duration: 0.25,
                  ease: [0.4, 0, 0.2, 1],
                },
              },
            }}
          />
        </motion.span>
      </Link>
    );
  }
);

AnimatedLink.displayName = 'AnimatedLink';

// =============================================================================
// NAV LINK (for navigation menus)
// =============================================================================

export interface NavLinkProps extends AnimatedLinkProps {
  /** Whether this link is currently active */
  isActive?: boolean;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, children, className, isActive = false, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          'relative px-3 py-2 text-sm font-medium transition-colors',
          'text-[#a0a0a0] hover:text-[#fafafc]',
          isActive && 'text-[#fafafc]',
          className
        )}
        {...props}
      >
        <motion.span
          initial={false}
          animate={prefersReducedMotion ? {} : { opacity: isActive ? 1 : 0.8 }}
          whileHover={prefersReducedMotion ? {} : { opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.span>
        {/* Active indicator */}
        {isActive && (
          <motion.span
            className="absolute inset-x-3 bottom-0 h-px bg-[#fafafc]"
            layoutId="nav-underline"
            transition={prefersReducedMotion ? { duration: 0 } : snappySpring}
          />
        )}
      </Link>
    );
  }
);

NavLink.displayName = 'NavLink';

// =============================================================================
// TEXT LINK (inline link within paragraphs)
// =============================================================================

export interface TextLinkProps extends Omit<AnimatedLinkProps, 'direction'> {
  /** Link style variant */
  variant?: 'default' | 'muted' | 'accent';
}

export const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  (
    { href, children, className, variant = 'default', external = false, ...props },
    ref
  ) => {
    const variantClasses = {
      default: 'text-[#fafafc] hover:text-white',
      muted: 'text-[#a0a0a0] hover:text-[#fafafc]',
      accent: 'text-[#fafafc] font-medium',
    };

    return (
      <AnimatedLink
        ref={ref}
        href={href}
        className={cn(variantClasses[variant], className)}
        underlineHeight={1}
        direction="ltr"
        external={external}
        {...props}
      >
        {children}
        {external && (
          <svg
            className="ml-1 inline-block h-3 w-3 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </AnimatedLink>
    );
  }
);

TextLink.displayName = 'TextLink';

// =============================================================================
// EXPORTS
// =============================================================================
// Note: Named exports only for proper barrel re-export via components/ui/index.ts
