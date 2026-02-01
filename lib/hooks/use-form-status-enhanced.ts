'use client';

/**
 * Enhanced Form Status Hook
 * React 19 useFormStatus with additional utilities
 */

import { useFormStatus } from 'react-dom';
import { useCallback, useEffect, useState } from 'react';

export interface FormStatusState {
  pending: boolean;
  data: FormData | null;
  method: string | null;
  action: string | ((formData: FormData) => void | Promise<void>) | null;
}

export interface EnhancedFormStatus extends FormStatusState {
  isSubmitting: boolean;
  isIdle: boolean;
  submissionCount: number;
  getFieldValue: (name: string) => string | null;
  hasField: (name: string) => boolean;
  reset: () => void;
}

/**
 * Enhanced form status hook with utilities
 */
export function useFormStatusEnhanced(): EnhancedFormStatus {
  const status = useFormStatus();
  const [submissionCount, setSubmissionCount] = useState(0);

  // Track submission count
  useEffect(() => {
    if (status.pending) {
      setSubmissionCount((count) => count + 1);
    }
  }, [status.pending]);

  /**
   * Get field value from form data
   */
  const getFieldValue = useCallback(
    (name: string): string | null => {
      if (!status.data) {return null;}
      const value = status.data.get(name);
      return typeof value === 'string' ? value : null;
    },
    [status.data]
  );

  /**
   * Check if field exists in form data
   */
  const hasField = useCallback(
    (name: string): boolean => {
      if (!status.data) {return false;}
      return status.data.has(name);
    },
    [status.data]
  );

  /**
   * Reset submission state
   */
  const reset = useCallback(() => {
    setSubmissionCount(0);
  }, []);

  return {
    ...status,
    isSubmitting: status.pending,
    isIdle: !status.pending,
    submissionCount,
    getFieldValue,
    hasField,
    reset,
  };
}

/**
 * Hook for tracking form submission history
 */
export function useFormSubmissionHistory(maxHistory = 10) {
  const [history, setHistory] = useState<
    Array<{ timestamp: number; data: FormData; success: boolean }>
  >([]);

  const addToHistory = useCallback(
    (data: FormData, success: boolean) => {
      setHistory((prev) => [
        { timestamp: Date.now(), data, success },
        ...prev.slice(0, maxHistory - 1),
      ]);
    },
    [maxHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getLastSubmission = useCallback(() => {
    return history[0] || null;
  }, [history]);

  const getSuccessCount = useCallback(() => {
    return history.filter((h) => h.success).length;
  }, [history]);

  const getFailureCount = useCallback(() => {
    return history.filter((h) => !h.success).length;
  }, [history]);

  return {
    history,
    addToHistory,
    clearHistory,
    getLastSubmission,
    getSuccessCount,
    getFailureCount,
  };
}

/**
 * Hook for form validation with debouncing
 */
export function useDebouncedFormValidation<T>(
  validateFn: (data: T) => Promise<boolean> | boolean,
  delay = 300
) {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const validate = useCallback(
    async (data: T) => {
      setIsValidating(true);
      setError(null);

      try {
        const result = await Promise.resolve(validateFn(data));
        setIsValid(result);
        return result;
      } catch (err) {
        setError(err as Error);
        setIsValid(false);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [validateFn]
  );

  // Debounced validate function
  const debouncedValidate = useCallback(
    (data: T) => {
      const timer = setTimeout(() => validate(data), delay);
      return () => clearTimeout(timer);
    },
    [validate, delay]
  );

  return {
    validate,
    debouncedValidate,
    isValidating,
    isValid,
    error,
  };
}

export default useFormStatusEnhanced;
