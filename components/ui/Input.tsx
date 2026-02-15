'use client';

import { forwardRef, useId, InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';
import { cva } from '@/lib/ui/cva';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const inputWrapperVariants = cva(styles.wrapper, {
  variants: {
    fullWidth: {
      true: styles.fullWidth,
      false: '',
    },
  },
  defaultVariants: {
    fullWidth: 'false',
  },
});

const inputFieldWrapperVariants = cva(styles.inputWrapper, {
  variants: {
    error: {
      true: styles.error,
      false: '',
    },
    leadingIcon: {
      true: styles.hasLeadingIcon,
      false: '',
    },
    trailingIcon: {
      true: styles.hasTrailingIcon,
      false: '',
    },
  },
  defaultVariants: {
    error: 'false',
    leadingIcon: 'false',
    trailingIcon: 'false',
  },
});

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = Boolean(error);
    const describedBy = error
      ? `${inputId}-error`
      : helperText
      ? `${inputId}-helper`
      : undefined;

    const wrapperClasses = inputWrapperVariants({
      fullWidth: fullWidth ? 'true' : 'false',
    });

    const inputWrapperClasses = inputFieldWrapperVariants({
      error: hasError ? 'true' : 'false',
      leadingIcon: leadingIcon ? 'true' : 'false',
      trailingIcon: trailingIcon ? 'true' : 'false',
    });

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required} aria-label="required"> *</span>}
          </label>
        )}
        <div className={inputWrapperClasses}>
          {leadingIcon && (
            <span className={styles.leadingIcon} aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${styles.input} ${className}`}
            aria-invalid={hasError}
            aria-required={props.required}
            aria-describedby={describedBy}
            {...props}
          />
          {trailingIcon && (
            <span className={styles.trailingIcon} aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
