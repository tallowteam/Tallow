'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import styles from './Radio.module.css';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  options: RadioOption[];
  orientation?: 'horizontal' | 'vertical';
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
}

export const Radio = forwardRef<HTMLDivElement, RadioProps>(
  (
    {
      label,
      options,
      orientation = 'vertical',
      error,
      helperText,
      onChange,
      value: selectedValue,
      name,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const radioGroupId =
      name || `radio-group-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const handleChange = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
      }
    };

    const groupClasses = [
      styles.radioGroup,
      styles[orientation],
      hasError ? styles.error : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={styles.wrapper}>
        {label && (
          <div className={styles.groupLabel} id={`${radioGroupId}-label`}>
            {label}
          </div>
        )}

        <div
          className={groupClasses}
          role="radiogroup"
          aria-labelledby={label ? `${radioGroupId}-label` : undefined}
          aria-describedby={
            error
              ? `${radioGroupId}-error`
              : helperText
              ? `${radioGroupId}-helper`
              : undefined
          }
          aria-invalid={hasError}
        >
          {options.map((option, index) => {
            const radioId = `${radioGroupId}-${option.value}`;
            const isChecked = selectedValue === option.value;
            const isDisabled = disabled || option.disabled;

            const radioClasses = [
              styles.radioWrapper,
              isDisabled ? styles.disabled : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div key={option.value} className={radioClasses}>
                <input
                  type="radio"
                  id={radioId}
                  name={radioGroupId}
                  value={option.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => handleChange(option.value)}
                  className={styles.radio}
                  {...props}
                />
                <label htmlFor={radioId} className={styles.label}>
                  <span className={styles.radioButton} aria-hidden="true">
                    <span className={styles.radioInner} />
                  </span>
                  <span className={styles.labelContent}>
                    <span className={styles.labelText}>{option.label}</span>
                    {option.description && (
                      <span className={styles.description}>
                        {option.description}
                      </span>
                    )}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        {error && (
          <p
            id={`${radioGroupId}-error`}
            className={styles.errorText}
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${radioGroupId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
