'use client';

import {
  forwardRef,
  FormHTMLAttributes,
  ReactNode,
  FormEvent,
  useState,
} from 'react';
import styles from './Form.module.css';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
  showValidation?: boolean;
  fullWidth?: boolean;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      children,
      onSubmit,
      loading = false,
      error,
      success,
      showValidation = true,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (loading || isSubmitting) {
        return;
      }

      if (onSubmit) {
        try {
          setIsSubmitting(true);
          await onSubmit(e);
        } catch (err) {
          console.error('Form submission error:', err);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    const formClasses = [
      styles.form,
      fullWidth ? styles.fullWidth : '',
      loading || isSubmitting ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isLoading = loading || isSubmitting;

    return (
      <div className={styles.wrapper}>
        <form
          ref={ref}
          className={formClasses}
          onSubmit={handleSubmit}
          noValidate={showValidation}
          aria-busy={isLoading}
          {...props}
        >
          {isLoading && (
            <div className={styles.loadingOverlay} aria-hidden="true">
              <div className={styles.spinner}>
                <svg
                  className={styles.spinnerIcon}
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                >
                  <circle
                    className={styles.spinnerTrack}
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <circle
                    className={styles.spinnerCircle}
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {children}
        </form>

        {error && (
          <div className={styles.errorMessage} role="alert" aria-live="polite">
            <svg
              className={styles.messageIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M10 6V10M10 14H10.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className={styles.successMessage}
            role="status"
            aria-live="polite"
          >
            <svg
              className={styles.messageIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M6 10L9 13L14 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}
      </div>
    );
  }
);

Form.displayName = 'Form';
