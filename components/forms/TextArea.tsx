'use client';

import {
  forwardRef,
  TextareaHTMLAttributes,
  useState,
  useEffect,
  useRef,
} from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      autoResize = false,
      maxLength,
      showCharacterCount = false,
      fullWidth = false,
      className = '',
      id,
      rows = 4,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const textareaId =
      id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    useEffect(() => {
      if (value) {
        setCharCount(String(value).length);
      }
    }, [value]);

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      if (maxLength && newValue.length > maxLength) {
        return;
      }

      setCharCount(newValue.length);

      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }

      onChange?.(e);
    };

    const wrapperClasses = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
    ]
      .filter(Boolean)
      .join(' ');

    const textareaClasses = [
      styles.textarea,
      hasError ? styles.error : '',
      autoResize ? styles.autoResize : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isAtLimit = maxLength && charCount >= maxLength;
    const isNearLimit = maxLength && charCount >= maxLength * 0.9;

    return (
      <div className={wrapperClasses}>
        <div className={styles.header}>
          {label && (
            <label htmlFor={textareaId} className={styles.label}>
              {label}
            </label>
          )}
          {(showCharacterCount || maxLength) && (
            <span
              className={`${styles.charCount} ${
                isAtLimit
                  ? styles.atLimit
                  : isNearLimit
                  ? styles.nearLimit
                  : ''
              }`}
              aria-live="polite"
            >
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </span>
          )}
        </div>

        <textarea
          ref={(node) => {
            textareaRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={textareaId}
          className={textareaClasses}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={hasError}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          value={value}
          onChange={handleChange}
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className={styles.errorText}
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
