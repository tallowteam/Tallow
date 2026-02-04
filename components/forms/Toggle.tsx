'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  labelPosition?: 'left' | 'right';
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      labelPosition = 'right',
      disabled = false,
      checked,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const wrapperClasses = [
      styles.wrapper,
      styles[`label-${labelPosition}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const toggleClasses = [
      styles.toggle,
      hasError ? styles.error : '',
      styles[size],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <div className={styles.toggleWrapper}>
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={toggleId}
            className={toggleClasses}
            checked={checked}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${toggleId}-error`
                : description
                ? `${toggleId}-description`
                : undefined
            }
            {...props}
          />
          <label htmlFor={toggleId} className={styles.label}>
            <span
              className={`${styles.track} ${styles[size]}`}
              aria-hidden="true"
            >
              <span className={`${styles.thumb} ${styles[size]}`} />
            </span>
            {(label || description) && (
              <span className={styles.labelContent}>
                {label && <span className={styles.labelText}>{label}</span>}
                {description && (
                  <span
                    id={`${toggleId}-description`}
                    className={styles.description}
                  >
                    {description}
                  </span>
                )}
              </span>
            )}
          </label>
        </div>

        {error && (
          <p id={`${toggleId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
