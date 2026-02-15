'use client';

import {
  forwardRef,
  useCallback,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { z } from 'zod';
import { deriveAriaIds, buildDescribedBy } from '@/lib/forms/form-policy';
import { validateField } from '@/lib/forms/validators';
import styles from './FormField.module.css';

// ============================================================================
// ValidatedInput
// ============================================================================

export interface ValidatedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Visible label text. Always rendered. */
  label: string;
  /** Unique ID for the input. Auto-generated if omitted. */
  fieldId?: string;
  /** Error message. Overrides schema validation errors when set. */
  error?: string;
  /** Help text shown when there is no error. */
  helpText?: string;
  /** Zod schema for on-blur validation. */
  schema?: z.ZodType<unknown>;
  /** Called when the input value changes. */
  onValueChange?: (value: string) => void;
  /** Called with the validation error (or null) after blur. */
  onValidate?: (error: string | null) => void;
  /** Whether to show success styling when valid and touched. */
  showValid?: boolean;
  /** Whether the field has been touched (blurred). Controlled externally. */
  touched?: boolean;
  /** Icon rendered before the input text. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the input text. */
  trailingIcon?: ReactNode;
  /** Additional class for the outer wrapper. */
  wrapperClassName?: string;
}

/**
 * ValidatedInput is a self-contained form input with label, validation,
 * error display, and full ARIA support. It validates on blur and clears
 * errors on change.
 *
 * For external validation control, pass `error` and `touched` props
 * from useFormValidation.
 */
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      fieldId: fieldIdProp,
      error: externalError,
      helpText,
      schema,
      onValueChange,
      onValidate,
      showValid = false,
      touched: externalTouched,
      leadingIcon,
      trailingIcon,
      wrapperClassName,
      required: isRequired,
      className,
      onChange,
      onBlur,
      ...inputProps
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = fieldIdProp ?? `validated-input-${generatedId}`;
    const { errorId, helpId } = deriveAriaIds(fieldId);

    const hasError = Boolean(externalError);
    const hasHelpText = Boolean(helpText);
    const describedBy = buildDescribedBy(fieldId, hasError, hasHelpText);

    // Show success ring only when touched, no error, and showValid enabled
    const showSuccess = showValid && externalTouched && !hasError;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      },
      [onChange, onValueChange]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(e);

        // Run schema validation on blur
        if (schema) {
          const errorMsg = validateField(schema, e.target.value);
          onValidate?.(errorMsg);
        }
      },
      [onBlur, schema, onValidate]
    );

    // Build input classes
    const inputClasses = [
      styles.validatedInput,
      hasError ? styles.inputError : '',
      showSuccess ? styles.inputValid : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={`${styles.field}${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
        data-field-id={fieldId}
      >
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {isRequired && (
            <span className={styles.requiredMarker} aria-label="required">
              *
            </span>
          )}
        </label>

        <div className={styles.inputWrapper}>
          {leadingIcon && (
            <span
              style={{
                position: 'absolute',
                left: 12,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-3, #5a5a70)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={fieldId}
            className={inputClasses}
            aria-invalid={hasError}
            aria-required={isRequired}
            aria-describedby={describedBy}
            required={isRequired}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{
              ...(leadingIcon ? { paddingLeft: 40 } : {}),
              ...(trailingIcon ? { paddingRight: 40 } : {}),
            }}
            {...inputProps}
          />

          {trailingIcon && (
            <span
              style={{
                position: 'absolute',
                right: 12,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-3, #5a5a70)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              {trailingIcon}
            </span>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            <ErrorIcon className={styles.errorIcon ?? ''} />
            <span>{externalError}</span>
          </p>
        )}

        {!hasError && hasHelpText && (
          <p id={helpId} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// ============================================================================
// Inline error icon
// ============================================================================

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
