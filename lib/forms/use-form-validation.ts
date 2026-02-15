/**
 * Form Validation Hook
 * Agent 036 -- FORM-ARCHITECT
 *
 * Provides a React hook for managing form field validation state.
 * Validation runs on blur and on submit. Errors clear on change.
 *
 * Usage:
 *   const { errors, touched, validate, validateAll, setFieldError, clearFieldError, reset } =
 *     useFormValidation({ deviceName: deviceNameSchema });
 *
 *   <input
 *     onBlur={() => validate('deviceName', value)}
 *     aria-invalid={!!errors.deviceName}
 *   />
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { z } from 'zod';
import { focusFirstError } from './form-policy';

// ============================================================================
// TYPES
// ============================================================================

/** Map of field names to their Zod schemas. */
export type FieldSchemaMap = Record<string, z.ZodType<unknown>>;

/** Map of field names to error messages (or undefined if no error). */
export type FieldErrors<T extends FieldSchemaMap> = Partial<Record<keyof T, string>>;

/** Map of field names to whether they have been blurred/touched. */
export type FieldTouched<T extends FieldSchemaMap> = Partial<Record<keyof T, boolean>>;

export interface UseFormValidationReturn<T extends FieldSchemaMap> {
  /** Current error messages, keyed by field name. */
  errors: FieldErrors<T>;
  /** Which fields have been touched (blurred at least once). */
  touched: FieldTouched<T>;
  /** Validate a single field. Returns the error message or null. */
  validate: (field: keyof T, value: unknown) => string | null;
  /** Mark a field as touched and validate it. Returns the error message or null. */
  validateOnBlur: (field: keyof T, value: unknown) => string | null;
  /** Validate all fields at once. Returns true if all pass. */
  validateAll: (values: Record<keyof T, unknown>) => boolean;
  /** Manually set an error on a field. */
  setFieldError: (field: keyof T, message: string) => void;
  /** Clear the error on a field (e.g., on change). */
  clearFieldError: (field: keyof T) => void;
  /** Mark a field as touched. */
  markTouched: (field: keyof T) => void;
  /** Reset all errors and touched state. */
  reset: () => void;
  /** Whether any errors exist. */
  hasErrors: boolean;
  /** Total count of errors. */
  errorCount: number;
  /** List of error entries for the error summary component. */
  errorList: Array<{ field: string; message: string }>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFormValidation<T extends FieldSchemaMap>(
  schemas: T,
  fieldOrder?: Array<keyof T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<FieldTouched<T>>({});

  // Store schemas in a ref to avoid re-creating callbacks
  const schemasRef = useRef(schemas);
  schemasRef.current = schemas;

  const fieldOrderRef = useRef(fieldOrder);
  fieldOrderRef.current = fieldOrder;

  const validate = useCallback(
    (field: keyof T, value: unknown): string | null => {
      const schema = schemasRef.current[field];
      if (!schema) return null;

      const result = schema.safeParse(value);
      if (result.success) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return null;
      }

      const message = result.error.issues[0]?.message ?? 'Invalid value.';
      setErrors((prev) => ({ ...prev, [field]: message }));
      return message;
    },
    []
  );

  const markTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateOnBlur = useCallback(
    (field: keyof T, value: unknown): string | null => {
      markTouched(field);
      return validate(field, value);
    },
    [validate, markTouched]
  );

  const validateAll = useCallback(
    (values: Record<keyof T, unknown>): boolean => {
      const newErrors: FieldErrors<T> = {};
      const newTouched: FieldTouched<T> = {};
      let allValid = true;

      for (const field of Object.keys(schemasRef.current) as Array<keyof T>) {
        const schema = schemasRef.current[field];
        if (!schema) continue;

        newTouched[field] = true;
        const result = schema.safeParse(values[field]);
        if (!result.success) {
          allValid = false;
          newErrors[field] = result.error.issues[0]?.message ?? 'Invalid value.';
        }
      }

      setErrors(newErrors);
      setTouched(newTouched);

      // Focus the first field with an error
      if (!allValid) {
        const order = fieldOrderRef.current ?? (Object.keys(schemasRef.current) as Array<keyof T>);
        const errorMap: Record<string, string | undefined> = {};
        for (const [k, v] of Object.entries(newErrors)) {
          errorMap[k] = v as string | undefined;
        }
        focusFirstError(
          errorMap,
          order.map((f) => String(f))
        );
      }

      return allValid;
    },
    []
  );

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const errorEntries = Object.entries(errors).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );

  return {
    errors,
    touched,
    validate,
    validateOnBlur,
    validateAll,
    setFieldError,
    clearFieldError,
    markTouched,
    reset,
    hasErrors: errorEntries.length > 0,
    errorCount: errorEntries.length,
    errorList: errorEntries.map(([field, message]) => ({ field, message })),
  };
}
