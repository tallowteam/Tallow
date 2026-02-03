'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={buttonClasses}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinnerWrapper} aria-hidden="true">
            <Spinner size={size === 'sm' ? 'sm' : 'md'} />
          </span>
        )}
        <span className={loading ? styles.contentHidden : ''}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
