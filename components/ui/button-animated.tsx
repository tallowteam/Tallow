'use client';

/**
 * Animated Button Component
 * Enhanced button with micro-interactions and ripple effect
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { buttonVariants as baseButtonVariants } from './button';

const buttonVariants = baseButtonVariants;

export interface ButtonAnimatedProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ripple?: boolean;
  pulse?: boolean;
}

/**
 * Get theme-aware ripple color based on button variant
 * Light ripple for dark backgrounds, dark ripple for light backgrounds
 */
function getRippleColorClass(variant: ButtonAnimatedProps['variant']): string {
  switch (variant) {
    // These variants have dark backgrounds in light mode, light backgrounds in dark mode
    case 'default':
    case 'primary':
      // Ripple appears on hover (filled state) - white ripple on dark, black on light
      return 'bg-white/30 dark:bg-black/20';
    case 'secondary':
      // Light mode: dark bg -> white ripple; Dark mode: light bg -> black ripple
      return 'bg-white/30 dark:bg-black/20';
    case 'destructive':
      // Red background in both themes - white ripple works best
      return 'bg-white/30';
    case 'ghost':
    case 'outline':
      // Transparent/light in light mode -> dark ripple; darker in dark mode -> light ripple
      return 'bg-black/10 dark:bg-white/20';
    case 'link':
      // Text-only, subtle ripple
      return 'bg-black/5 dark:bg-white/10';
    default:
      // Default fallback - adaptive ripple
      return 'bg-black/10 dark:bg-white/20';
  }
}

/**
 * Button with animations and ripple effect
 */
const ButtonAnimated = React.forwardRef<HTMLButtonElement, ButtonAnimatedProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ripple = true,
      pulse = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<
      Array<{ id: number; x: number; y: number }>
    >([]);
    const rippleIdRef = React.useRef(0);

    const Comp = asChild ? Slot : motion.button;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !props.disabled) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {
          id: rippleIdRef.current++,
          x,
          y,
        };

        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
      }

      onClick?.(e);
    };

    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(
          buttonVariants({ variant, size }),
          'relative overflow-hidden',
          className
        )}
        onClick={handleClick}
        whileHover={{ scale: props.disabled ? 1 : 1.02 }}
        whileTap={{ scale: props.disabled ? 1 : 0.98 }}
        animate={
          pulse
            ? {
                scale: [1, 1.05, 1],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
            : undefined
        }
        {...(props as any)}
      >
        {children}

        {/* Theme-aware Ripple Effect */}
        {ripple && (
          <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
            <AnimatePresence>
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className={cn(
                    'absolute rounded-full',
                    getRippleColorClass(variant)
                  )}
                  style={{
                    left: r.x,
                    top: r.y,
                  }}
                  initial={{
                    width: 0,
                    height: 0,
                    x: 0,
                    y: 0,
                    opacity: 0.6,
                  }}
                  animate={{
                    width: 200,
                    height: 200,
                    x: -100,
                    y: -100,
                    opacity: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ))}
            </AnimatePresence>
          </span>
        )}
      </Comp>
    );
  }
);

ButtonAnimated.displayName = 'ButtonAnimated';

/**
 * Icon Button with Scale Animation
 * Uses rounded-lg from base buttonVariants (inherits from size="icon")
 */
export const IconButtonAnimated = React.forwardRef<
  HTMLButtonElement,
  ButtonAnimatedProps
>(({ className, children, ...props }, ref) => {
  return (
    <ButtonAnimated
      ref={ref}
      size="icon"
      className={className}
      {...props}
    >
      <motion.div
        whileHover={{ rotate: 10 }}
        whileTap={{ rotate: -10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </ButtonAnimated>
  );
});

IconButtonAnimated.displayName = 'IconButtonAnimated';

/**
 * Button Group with Stagger Animation
 */
export function ButtonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('flex gap-2', className)}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { ButtonAnimated };
