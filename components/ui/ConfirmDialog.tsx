'use client';

import { type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether this is a destructive action (shows red confirm button) */
  destructive?: boolean;
  /** Whether the confirm action is loading */
  loading?: boolean;
  /** Icon to show in dialog */
  icon?: ReactNode;
  /** Size of the dialog */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for dialog */
  className?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
  icon,
  size = 'sm',
  className = '',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Let parent handle error
      console.error('Confirm action failed:', error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
      showCloseButton={false}
      className={`${styles.dialog} ${className}`}
    >
      <div className={styles.container}>
        {icon && <div className={styles.icon}>{icon}</div>}

        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.description}>{description}</div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            size="md"
            fullWidth
          >
            {cancelText}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            size="md"
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Preset icon components for common scenarios
export function DeleteIcon() {
  return (
    <div className={styles.iconDelete}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </div>
  );
}

export function WarningIcon() {
  return (
    <div className={styles.iconWarning}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  );
}

export function InfoIcon() {
  return (
    <div className={styles.iconInfo}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  );
}

export function SuccessIcon() {
  return (
    <div className={styles.iconSuccess}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    </div>
  );
}
