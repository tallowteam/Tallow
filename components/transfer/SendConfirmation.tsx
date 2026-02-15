'use client';

import { useEffect, useRef } from 'react';
import styles from './SendConfirmation.module.css';

interface SendConfirmationProps {
  deviceName: string;
  fileCount: number;
  totalSize: number;
  onConfirm: () => void;
  onCancel: () => void;
  autoAccept: boolean;
}

export function SendConfirmation(props: SendConfirmationProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Format file size nicely
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onCancel();
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement && lastElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement && firstElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the confirm button on mount
    confirmButtonRef.current?.focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [props]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      props.onCancel();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.iconContainer}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.icon}
          >
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
        </div>

        <h2 className={styles.title}>Send to {props.deviceName}?</h2>

        <div className={styles.summary}>
          <span className={styles.fileCount}>
            {props.fileCount} {props.fileCount === 1 ? 'file' : 'files'}
          </span>
          <span className={styles.separator}>•</span>
          <span className={styles.totalSize}>{formatSize(props.totalSize)}</span>
        </div>

        {props.autoAccept && (
          <div className={styles.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Auto-accepted
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={props.onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={props.onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            Send
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
