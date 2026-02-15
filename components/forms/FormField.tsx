'use client';

import { type ReactNode, useId } from 'react';
import { deriveAriaIds, buildDescribedBy } from '@/lib/forms/form-policy';
import styles from './FormField.module.css';

// ============================================================================
// FormField
// ============================================================================

export interface FormFieldProps {
  /** Visible label text. Always rendered (not just placeholder). */
  label: string;
  /** Unique ID for the input element. Auto-generated if omitted. */
  fieldId?: string;
  /** Error message to display below the field. */
  error?: string;
  /** Help text displayed when there is no error. */
  helpText?: string;
  /** Whether the field is required (shows asterisk). */
  required?: boolean;
  /** The input element(s) rendered inside the field. */
  children: ReactNode;
  /** Additional CSS class for the wrapper. */
  className?: string;
}

/**
 * FormField wraps an input with a visible label, error message, and help text.
 * It wires up aria-describedby and aria-invalid attributes.
 *
 * The child input should use the `fieldId` for its `id` attribute and
 * the `describedBy` for its `aria-describedby`.
 *
 * Alternatively, use ValidatedInput which handles this automatically.
 */
export function FormField({
  label,
  fieldId: fieldIdProp,
  error,
  helpText,
  required: isRequired,
  children,
  className,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = fieldIdProp ?? `form-field-${generatedId}`;
  const hasError = Boolean(error);
  const hasHelpText = Boolean(helpText);
  const { errorId, helpId } = deriveAriaIds(fieldId);

  return (
    <div
      className={`${styles.field}${className ? ` ${className}` : ''}`}
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

      {children}

      {hasError && (
        <p
          id={errorId}
          className={styles.errorMessage}
          role="alert"
          aria-live="assertive"
        >
          <ErrorIcon className={styles.errorIcon ?? ''} />
          <span>{error}</span>
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

/**
 * Returns the describedBy string for a child input inside a FormField.
 * Utility for cases where the child is not a ValidatedInput.
 */
export function useFieldDescribedBy(
  fieldId: string,
  error?: string,
  helpText?: string
): string | undefined {
  return buildDescribedBy(fieldId, Boolean(error), Boolean(helpText));
}

// ============================================================================
// Inline error icon (avoids extra imports for a tiny SVG)
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
