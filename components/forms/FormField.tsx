'use client';

import { forwardRef, ReactNode } from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      htmlFor,
      error,
      helperText,
      required = false,
      optional = false,
      children,
      fullWidth = false,
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const fieldId =
      htmlFor || `form-field-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const wrapperClasses = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
      hasError ? styles.error : '',
      disabled ? styles.disabled : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={wrapperClasses}>
        {label && (
          <div className={styles.labelWrapper}>
            <label htmlFor={fieldId} className={styles.label}>
              {label}
              {required && (
                <span className={styles.required} aria-label="required">
                  *
                </span>
              )}
              {optional && (
                <span className={styles.optional} aria-label="optional">
                  (optional)
                </span>
              )}
            </label>
          </div>
        )}

        <div className={styles.inputWrapper}>{children}</div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            <svg
              className={styles.errorIcon}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 4V8M8 11H8.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {helperText && !error && (
          <div className={styles.helperText}>
            <svg
              className={styles.helperIcon}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 7V11M8 5H8.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{helperText}</span>
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
