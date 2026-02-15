'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';
import { cva } from '@/lib/ui/cva';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      primary: styles.primary,
      secondary: styles.secondary,
      outline: styles.outline,
      ghost: styles.ghost,
      accent: styles.accent,
      danger: styles.danger,
      link: styles.link,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
      icon: styles.icon,
    },
    loading: {
      true: styles.loading,
      false: '',
    },
    fullWidth: {
      true: styles.fullWidth,
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    loading: 'false',
    fullWidth: 'false',
  },
});

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = buttonVariants({
      variant,
      size,
      loading: loading ? 'true' : 'false',
      fullWidth: fullWidth ? 'true' : 'false',
      className,
    });

    // Build the aria-label: loading state annotation takes priority,
    // then any explicit aria-label from props. Icon-only buttons (no
    // children text) rely on the consumer passing aria-label.
    const computedAriaLabel = (() => {
      if (loading && typeof children === 'string') {
        return `${children}, loading`;
      }
      return props['aria-label'];
    })();

    // Prevent click when disabled (belt-and-suspenders with native disabled)
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        className={classes}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
        aria-label={computedAriaLabel}
        onClick={handleClick}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={styles.iconSlot} aria-hidden="true">{icon}</span>
        )}
        {children && <span className={styles.label}>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className={styles.iconSlot} aria-hidden="true">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
