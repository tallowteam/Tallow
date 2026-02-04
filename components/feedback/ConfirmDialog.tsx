'use client';

import { ReactNode } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  icon?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!loading) {
      onClose();
    }
  };

  const defaultIcon =
    variant === 'danger' ? (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M24 16v12m0 4h.02"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M24 22v10m0-16h.02"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
    >
      <div className={`${styles.dialog} ${styles[variant]}`}>
        {icon !== null && (
          <div className={styles.iconWrapper} aria-hidden="true">
            {icon || defaultIcon}
          </div>
        )}

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.message}>{message}</div>
        </div>

        <div className={styles.actions}>
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={loading}
            fullWidth
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            disabled={loading}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
