'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * EUVEKA Select Component
 *
 * Design Specifications:
 * - Border-radius: 12px (rounded-xl)
 * - Height: 48px (h-12)
 * - Transition: all 0.3s ease
 * - WCAG 2.1 compliant touch targets (44px minimum)
 *
 * Colors:
 * - Background: #fefefc (light) / #191610 (dark)
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Text: #191610 (light) / #fefefc (dark)
 * - Placeholder: #b2987d
 * - Focus ring: #b2987d
 */

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // EUVEKA: 48px height, rounded-xl
      'flex h-12 w-full items-center justify-between px-4 py-3 text-base',
      'rounded-xl',
      // EUVEKA background and border
      'bg-[#fefefc] dark:bg-[#191610]',
      'border border-[#e5dac7] dark:border-[#544a36]',
      // EUVEKA text
      'text-[#191610] dark:text-[#fefefc]',
      // EUVEKA placeholder
      'placeholder:text-[#b2987d] [&>span]:line-clamp-1',
      // EUVEKA: transition 0.3s
      'transition-all duration-300 ease-out',
      // EUVEKA focus ring
      'focus:outline-none',
      'focus-visible:border-[#b2987d] focus-visible:ring-[3px] focus-visible:ring-[#b2987d]/15',
      'focus-visible:shadow-[0_0_0_4px_rgba(178,152,125,0.08)]',
      // EUVEKA hover state
      'hover:border-[#b2987d]/50 hover:shadow-[0_2px_8px_-2px_rgba(178,152,125,0.08)]',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50',
      'disabled:bg-[#e5dac7]/30 dark:disabled:bg-[#544a36]/30',
      // Desktop adjustment
      'sm:h-11 sm:text-sm',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-5 w-5 text-[#b2987d] shrink-0 ml-2" aria-hidden="true" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // EUVEKA: rounded-2xl, shadow, colors
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        'rounded-2xl',
        'bg-[#fefefc] dark:bg-[#191610]',
        'text-[#191610] dark:text-[#fefefc]',
        'border border-[#e5dac7] dark:border-[#544a36]',
        'shadow-lg',
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-2',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-2 pl-10 pr-3 text-sm font-medium',
      // EUVEKA muted label
      'text-[#b2987d]',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * EUVEKA SelectItem with WCAG 2.1 compliant touch target
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // EUVEKA: 44px min height, rounded-xl
      'relative flex w-full cursor-default select-none items-center',
      'rounded-xl min-h-[44px] py-3 pl-10 pr-3 text-base outline-none',
      // EUVEKA text
      'text-[#191610] dark:text-[#fefefc]',
      // EUVEKA: transition 0.3s
      'transition-colors duration-200',
      // EUVEKA focus/hover states
      'focus:bg-[#e5dac7]/50 dark:focus:bg-[#544a36]/50',
      'hover:bg-[#e5dac7]/30 dark:hover:bg-[#544a36]/30',
      // Disabled state
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      // Desktop adjustments
      'sm:min-h-[40px] sm:py-2.5 sm:text-sm',
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[#191610] dark:text-[#fefefc]" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      // EUVEKA separator
      '-mx-1 my-1 h-px',
      'bg-[#e5dac7] dark:bg-[#544a36]',
      className
    )}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
