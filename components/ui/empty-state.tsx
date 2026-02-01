'use client';

/**
 * Empty State Component - EUVEKA Design System
 *
 * Elegant, centered empty states with:
 * - EUVEKA icon color (#b2987d - warm gold)
 * - EUVEKA neutral backgrounds
 * - Pill-shaped CTA buttons (60px radius)
 * - EUVEKA typography hierarchy
 * - Subtle floating animation
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    EUVEKA_EASING,
    EUVEKA_DURATIONS,
    euvekaTransition,
} from '@/lib/animations/euveka-tokens';

export interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    variant?: 'default' | 'primary' | 'muted' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    animated?: boolean;
    children?: React.ReactNode;
}

/**
 * EUVEKA Variant Styles
 * Using exact EUVEKA neutral palette:
 * - Icon color: #b2987d (neutrals.500)
 * - Backgrounds: EUVEKA neutrals
 * - Rings: subtle EUVEKA borders
 */
const variantStyles = {
    default: {
        iconBg: 'bg-[#f3ede2] dark:bg-[#242018]',
        iconColor: 'text-[#b2987d]',
        iconRing: 'ring-[#e5dac7]/50 dark:ring-[#2c261c]/50',
    },
    primary: {
        iconBg: 'bg-[#fefefc]/10 dark:bg-[#fefefc]/15',
        iconColor: 'text-[#fefefc]',
        iconRing: 'ring-[#fefefc]/20 dark:ring-[#fefefc]/30',
    },
    muted: {
        iconBg: 'bg-[#fcf6ec] dark:bg-[#191610]',
        iconColor: 'text-[#b2987d]/70',
        iconRing: 'ring-[#e5dac7]/30 dark:ring-[#2c261c]/30',
    },
    success: {
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        iconRing: 'ring-emerald-200/50 dark:ring-emerald-500/20',
    },
    warning: {
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        iconColor: 'text-amber-500 dark:text-amber-400',
        iconRing: 'ring-amber-200/50 dark:ring-amber-500/20',
    },
};

const sizeStyles = {
    sm: {
        container: 'py-8 sm:py-10',
        iconWrapper: 'w-14 h-14 sm:w-16 sm:h-16',
        icon: 'w-6 h-6 sm:w-7 sm:h-7',
        title: 'text-base sm:text-lg',
        description: 'text-xs sm:text-sm max-w-[240px] sm:max-w-xs',
        spacing: 'mt-4 sm:mt-5',
        buttonSpacing: 'mt-5 sm:mt-6',
    },
    md: {
        container: 'py-12 sm:py-16',
        iconWrapper: 'w-18 h-18 sm:w-20 sm:h-20',
        icon: 'w-8 h-8 sm:w-9 sm:h-9',
        title: 'text-lg sm:text-xl',
        description: 'text-sm max-w-xs sm:max-w-sm',
        spacing: 'mt-5 sm:mt-6',
        buttonSpacing: 'mt-6 sm:mt-8',
    },
    lg: {
        container: 'py-16 sm:py-24',
        iconWrapper: 'w-20 h-20 sm:w-24 sm:h-24',
        icon: 'w-9 h-9 sm:w-11 sm:h-11',
        title: 'text-xl sm:text-2xl',
        description: 'text-sm sm:text-base max-w-sm sm:max-w-md',
        spacing: 'mt-6 sm:mt-8',
        buttonSpacing: 'mt-8 sm:mt-10',
    },
};

interface AnimatedIconWrapperProps {
    children: React.ReactNode;
    animated: boolean;
    className?: string;
}

function AnimatedIconWrapper({ children, animated, className }: AnimatedIconWrapperProps) {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion || !animated) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{
                opacity: 1,
                scale: 1,
                y: [0, -4, 0],
            }}
            transition={{
                opacity: { duration: EUVEKA_DURATIONS.normal, ease: EUVEKA_EASING },
                scale: { duration: EUVEKA_DURATIONS.normal, ease: EUVEKA_EASING },
                y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                },
            }}
        >
            {children}
        </motion.div>
    );
}

interface AnimatedContentProps {
    children: React.ReactNode;
    delay?: number;
    animated: boolean;
}

function AnimatedContent({ children, delay = 0, animated }: AnimatedContentProps) {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion || !animated) {
        return <>{children}</>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                ...euvekaTransition,
                delay: delay,
            }}
        >
            {children}
        </motion.div>
    );
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    variant = 'default',
    size = 'md',
    className,
    animated = true,
    children,
}: EmptyStateProps) {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center px-4',
                sizeStyle.container,
                className
            )}
            role="status"
            aria-label={title}
        >
            {/* Icon Container - EUVEKA styled */}
            <AnimatedIconWrapper
                animated={animated}
                className={cn(
                    'rounded-full flex items-center justify-center',
                    'ring-1 ring-inset',
                    'transition-colors duration-300',
                    sizeStyle.iconWrapper,
                    variantStyle.iconBg,
                    variantStyle.iconRing
                )}
            >
                <Icon
                    className={cn(
                        sizeStyle.icon,
                        variantStyle.iconColor,
                        'stroke-[1.5]'
                    )}
                    aria-hidden="true"
                />
            </AnimatedIconWrapper>

            {/* Title - EUVEKA typography */}
            <AnimatedContent delay={0.1} animated={animated}>
                <h3
                    className={cn(
                        'font-semibold tracking-tight',
                        'text-[#191610] dark:text-[#fefefc]',
                        sizeStyle.title,
                        sizeStyle.spacing
                    )}
                >
                    {title}
                </h3>
            </AnimatedContent>

            {/* Description - EUVEKA muted text */}
            {description && (
                <AnimatedContent delay={0.2} animated={animated}>
                    <p
                        className={cn(
                            'text-[#544a36] dark:text-[#b2987d]',
                            'leading-relaxed',
                            sizeStyle.description,
                            'mt-2 sm:mt-3'
                        )}
                    >
                        {description}
                    </p>
                </AnimatedContent>
            )}

            {/* Custom children */}
            {children && (
                <AnimatedContent delay={0.3} animated={animated}>
                    <div className="mt-4">{children}</div>
                </AnimatedContent>
            )}

            {/* CTA Buttons - EUVEKA pill style */}
            {(actionLabel || secondaryActionLabel) && (
                <AnimatedContent delay={0.3} animated={animated}>
                    <div
                        className={cn(
                            'flex flex-col sm:flex-row items-center gap-3',
                            sizeStyle.buttonSpacing
                        )}
                    >
                        {/* Primary CTA - EUVEKA pill button */}
                        {actionLabel && onAction && (
                            <Button
                                onClick={onAction}
                                className={cn(
                                    // EUVEKA pill shape (60px radius)
                                    'rounded-[60px] px-6 h-11 sm:h-12',
                                    // EUVEKA accent color
                                    'bg-[#fefefc] hover:bg-[#0088e6]',
                                    'text-white font-medium',
                                    // EUVEKA shadow
                                    'shadow-sm shadow-[#fefefc]/20',
                                    // EUVEKA smooth transition
                                    'transition-all duration-300',
                                    'hover:shadow-md hover:shadow-[#fefefc]/30',
                                    'hover:-translate-y-0.5',
                                    'active:translate-y-0',
                                    // Focus state
                                    'focus-visible:outline-none focus-visible:ring-2',
                                    'focus-visible:ring-[#fefefc] focus-visible:ring-offset-2',
                                    'focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]'
                                )}
                            >
                                {actionLabel}
                            </Button>
                        )}
                        {/* Secondary CTA - EUVEKA ghost pill */}
                        {secondaryActionLabel && onSecondaryAction && (
                            <Button
                                variant="ghost"
                                onClick={onSecondaryAction}
                                className={cn(
                                    // EUVEKA pill shape
                                    'rounded-[60px] px-5 h-11 sm:h-12',
                                    // EUVEKA colors
                                    'text-[#544a36] dark:text-[#b2987d]',
                                    'hover:text-[#191610] dark:hover:text-[#fefefc]',
                                    'hover:bg-[#f3ede2] dark:hover:bg-[#2c261c]',
                                    'font-medium',
                                    // Smooth transition
                                    'transition-all duration-300',
                                    // Focus state
                                    'focus-visible:outline-none focus-visible:ring-2',
                                    'focus-visible:ring-[#b2987d] focus-visible:ring-offset-2',
                                    'focus-visible:ring-offset-[#fefefc] dark:focus-visible:ring-offset-[#191610]'
                                )}
                            >
                                {secondaryActionLabel}
                            </Button>
                        )}
                    </div>
                </AnimatedContent>
            )}
        </div>
    );
}

EmptyState.displayName = 'EmptyState';
