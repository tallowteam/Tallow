'use client';

import { forwardRef, useEffect, useState } from 'react';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastPreview {
  type: 'image' | 'file' | 'transfer';
  src?: string;
  fileName?: string;
  fileSize?: string;
  progress?: number;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  action?: ToastAction;
  actions?: ToastAction[];
  preview?: ToastPreview;
}

const ToastIcon = ({ variant }: { variant: ToastVariant }) => {
  switch (variant) {
    case 'success':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 17H19L10 2L1 17ZM11 14H9V12H11V14ZM11 10H9V6H11V10Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'info':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z"
            fill="currentColor"
          />
        </svg>
      );
  }
};

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12.4697 4.53033C12.7626 4.23744 12.7626 3.76256 12.4697 3.46967C12.1768 3.17678 11.7019 3.17678 11.409 3.46967L8 6.87868L4.59099 3.46967C4.2981 3.17678 3.82322 3.17678 3.53033 3.46967C3.23744 3.76256 3.23744 4.23744 3.53033 4.53033L6.93934 7.93934L3.53033 11.3483C3.23744 11.6412 3.23744 12.1161 3.53033 12.409C3.82322 12.7019 4.2981 12.7019 4.59099 12.409L8 9L11.409 12.409C11.7019 12.7019 12.1768 12.7019 12.4697 12.409C12.7626 12.1161 12.7626 11.6412 12.4697 11.3483L9.06066 7.93934L12.4697 4.53033Z"
      fill="currentColor"
    />
  </svg>
);

const FileIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill="currentColor"
      opacity="0.3"
    />
    <path
      d="M14 2V8H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ToastPreviewComponent = ({ preview }: { preview: ToastPreview }) => {
  switch (preview.type) {
    case 'image':
      return (
        <div className={styles.previewContainer}>
          {preview.src ? (
            <img
              src={preview.src}
              alt={preview.fileName || 'Preview'}
              className={styles.previewImage}
              loading="lazy"
            />
          ) : (
            <div className={styles.previewPlaceholder}>
              <FileIcon />
            </div>
          )}
        </div>
      );

    case 'file':
      return (
        <div className={styles.previewContainer}>
          <div className={styles.previewFile}>
            <FileIcon />
            <div className={styles.previewFileInfo}>
              {preview.fileName && (
                <div className={styles.previewFileName}>{preview.fileName}</div>
              )}
              {preview.fileSize && (
                <div className={styles.previewFileSize}>{preview.fileSize}</div>
              )}
            </div>
          </div>
        </div>
      );

    case 'transfer':
      return (
        <div className={styles.previewContainer}>
          <div className={styles.previewTransfer}>
            <div className={styles.previewTransferText}>
              {preview.fileName && (
                <div className={styles.previewFileName}>{preview.fileName}</div>
              )}
              {preview.progress !== undefined && (
                <div className={styles.previewProgressText}>
                  {Math.round(preview.progress)}%
                </div>
              )}
            </div>
            {preview.progress !== undefined && (
              <div className={styles.previewProgressBar}>
                <div
                  className={styles.previewProgressFill}
                  style={{ width: `${preview.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ id, title, message, variant = 'info', duration = 5000, onClose, action, actions, preview }, ref) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    // Support both single action and multiple actions
    const actionButtons = actions || (action ? [action] : []);
    const hasRichContent = !!preview;

    useEffect(() => {
      if (!duration || duration === Infinity) {return;}

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
      }, 16); // ~60fps

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
      // handleClose is stable and defined inline
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, id, onClose]);

    const handleClose = () => {
      setIsExiting(true);
      setTimeout(() => {
        onClose(id);
      }, 200); // Match exit animation duration
    };

    const handleActionClick = (actionHandler: () => void) => {
      actionHandler();
      handleClose();
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`${styles.toast} ${styles[variant]} ${isExiting ? styles.exiting : ''} ${hasRichContent ? styles.richToast : ''}`}
        data-toast-id={id}
      >
        {/* Preview Content (left side for rich notifications) */}
        {preview && <ToastPreviewComponent preview={preview} />}

        {/* Icon (only shown when no preview) */}
        {!preview && (
          <div className={styles.iconContainer}>
            <ToastIcon variant={variant} />
          </div>
        )}

        {/* Main Content */}
        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}
          <div className={styles.message}>{message}</div>

          {/* Action Buttons */}
          {actionButtons.length > 0 && (
            <div className={styles.actionsRow}>
              {actionButtons.map((actionItem, index) => (
                <button
                  key={index}
                  type="button"
                  className={styles.actionButton}
                  onClick={() => handleActionClick(actionItem.onClick)}
                >
                  {actionItem.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close notification"
        >
          <CloseIcon />
        </button>

        {/* Progress Bar */}
        {duration && duration !== Infinity && (
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';
