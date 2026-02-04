'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      indeterminate = false,
      disabled = false,
      checked,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');

    const checkboxClasses = [
      styles.checkbox,
      hasError ? styles.error : '',
      indeterminate ? styles.indeterminate : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <div className={styles.checkboxWrapper}>
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={checkboxClasses}
            checked={checked}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${checkboxId}-error`
                : helperText
                ? `${checkboxId}-helper`
                : undefined
            }
            {...props}
          />
          <label htmlFor={checkboxId} className={styles.label}>
            <span className={styles.checkboxBox} aria-hidden="true">
              {indeterminate ? (
                <svg
                  className={styles.icon}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 8H12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className={styles.icon}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M13.3333 4L6 11.3333L2.66666 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {label && <span className={styles.labelText}>{label}</span>}
          </label>
        </div>

        {error && (
          <p
            id={`${checkboxId}-error`}
            className={styles.errorText}
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${checkboxId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
