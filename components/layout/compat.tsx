/**
 * Compatibility layer for layout components
 * Maps shadcn/ui-style props to existing Tallow components
 */

import { Button as TallowButton, ButtonProps as TallowButtonProps } from '@/components/ui/button';
import { forwardRef } from 'react';

interface ButtonProps extends Omit<TallowButtonProps, 'variant'> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

/**
 * Button component wrapper for layout compatibility
 * Maps shadcn/ui style props to Tallow's Button component
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', asChild, children, ...props }, ref) => {
    // Map shadcn variants to Tallow variants
    const tallowVariant: TallowButtonProps['variant'] =
      variant === 'default'
        ? 'primary'
        : variant === 'outline'
        ? 'secondary'
        : variant === 'destructive'
        ? 'danger'
        : 'ghost';

    // If asChild, render children directly (for Link components)
    if (asChild) {
      return <>{children}</>;
    }

    return (
      <TallowButton ref={ref} variant={tallowVariant} size={size} {...props}>
        {children}
      </TallowButton>
    );
  }
);

Button.displayName = 'Button';
