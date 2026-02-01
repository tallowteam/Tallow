'use client';

/**
 * Animated Component Wrappers
 * Ready-to-use animated versions of common components
 */

import * as React from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  fadeVariants,
  fadeUpVariants,
  fadeDownVariants,
  scaleVariants,
  slideLeftVariants,
  slideRightVariants,
  staggerContainerVariants,
  listItemVariants,
  modalVariants,
  backdropVariants,
  cardHoverVariants,
  buttonVariants,
  getTransition,
  defaultTransition,
} from './motion-config';

/**
 * Props type for animated components
 * Using a minimal props interface to avoid exactOptionalPropertyTypes conflicts with framer-motion
 */
interface MotionDivProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  role?: React.AriaRole;
  tabIndex?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

interface MotionButtonProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}

/**
 * Animated Container
 * For page-level animations
 */
export const AnimatedContainer = React.forwardRef<
  HTMLDivElement,
  MotionDivProps & {
    variant?: 'fade' | 'fadeUp' | 'fadeDown' | 'scale';
    delay?: number;
  }
>(({ children, className, variant = 'fadeUp', delay = 0, ...props }, ref) => {
  const variants = {
    fade: fadeVariants,
    fadeUp: fadeUpVariants,
    fadeDown: fadeDownVariants,
    scale: scaleVariants,
  }[variant];

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ ...getTransition(defaultTransition), delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedContainer.displayName = 'AnimatedContainer';

/**
 * Animated List
 * For lists with stagger animation
 */
export const AnimatedList = React.forwardRef<
  HTMLDivElement,
  MotionDivProps
>(({ children, className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedList.displayName = 'AnimatedList';

/**
 * Animated List Item
 * Use inside AnimatedList for stagger effect
 */
export const AnimatedListItem = React.forwardRef<
  HTMLDivElement,
  MotionDivProps
>(({ children, className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={listItemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedListItem.displayName = 'AnimatedListItem';

/**
 * Animated Card
 * Card with hover animation
 */
export const AnimatedCard = React.forwardRef<
  HTMLDivElement,
  MotionDivProps & {
    hoverEffect?: boolean;
  }
>(({ children, className, hoverEffect = true, ...props }, ref) => {
  const hoverProps = hoverEffect
    ? { whileHover: 'hover' as const, whileTap: 'tap' as const }
    : {};

  return (
    <motion.div
      ref={ref}
      initial="rest"
      {...hoverProps}
      variants={cardHoverVariants}
      className={cn(
        'rounded-xl border border-border bg-card shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

/**
 * Animated Button
 * Button with hover and tap animations
 */
export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  MotionButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

/**
 * Animated Modal/Dialog
 * Modal with backdrop and content animations
 */
export interface AnimatedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  className,
  backdropClassName,
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
              backdropClassName
            )}
            onClick={onClose}
          />
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'relative bg-card rounded-xl border border-border shadow-xl max-w-lg w-full',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// PageTransition has been moved to ./page-transition.tsx
// Use the dedicated file for proper page transitions with AnimatePresence

/**
 * Slide Animation (for slides/carousels)
 */
export const AnimatedSlide = React.forwardRef<
  HTMLDivElement,
  MotionDivProps & {
    direction?: 'left' | 'right';
  }
>(({ children, className, direction = 'right', ...props }, ref) => {
  const variants = direction === 'left' ? slideLeftVariants : slideRightVariants;

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedSlide.displayName = 'AnimatedSlide';

/**
 * Collapse/Expand Animation
 */
export const AnimatedCollapse = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'> & {
    isOpen: boolean;
  }
>(({ children, className, isOpen, ...props }, ref) => {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: getTransition(defaultTransition),
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: getTransition({ duration: 0.2 }),
          }}
          className={cn('overflow-hidden', className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AnimatedCollapse.displayName = 'AnimatedCollapse';

/**
 * Presence Wrapper
 * Simple AnimatePresence wrapper
 */
export function Presence({
  children,
  mode = 'wait',
}: {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}

/**
 * Ripple Effect Component
 * For button clicks and interactions
 */
export function RippleEffect({
  trigger,
  className,
}: {
  trigger: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'absolute inset-0 bg-white/30 rounded-full pointer-events-none',
            className
          )}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * Badge with Animation
 */
export const AnimatedBadge = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> & {
    show?: boolean;
  }
>(({ children, className, show = true, ...props }, ref) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={ref}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={className}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AnimatedBadge.displayName = 'AnimatedBadge';

/**
 * Number Counter Animation
 */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

/**
 * Layout Animation Wrapper
 * For smooth layout transitions
 */
export const AnimatedLayout = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<'div'>, 'layout' | 'transition'>
>(({ children, className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      transition={getTransition(defaultTransition)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedLayout.displayName = 'AnimatedLayout';
