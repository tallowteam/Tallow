'use client';

import React, { useEffect } from 'react';
import styles from './incomingmodal.module.css';

interface IncomingModalProps {
  isOpen: boolean;
  senderName: string;
  fileName: string;
  fileSize: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingModal({
  isOpen,
  senderName,
  fileName,
  fileSize,
  onAccept,
  onDecline
}: IncomingModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onDecline();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onDecline]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onDecline}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incoming-title"
      >
        <div className={styles.iconContainer}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16V8m0 8l-4-4m4 4l4-4M3 12c0 7.2 1.8 9 9 9s9-1.8 9-9-1.8-9-9-9-9 1.8-9 9z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="incoming-title" className={styles.title}>
          {senderName} wants to send you a file
        </h2>

        <div className={styles.fileCard}>
          <div className={styles.fileIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 2v7h7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.fileDetails}>
            <div className={styles.fileName}>{fileName}</div>
            <div className={styles.fileSize}>{fileSize}</div>
          </div>
        </div>

        <div className={styles.security}>
          🔒 PQC Encrypted
        </div>

        <div className={styles.actions}>
          <button
            className={styles.declineBtn}
            onClick={onDecline}
            type="button"
          >
            Decline
          </button>
          <button
            className={styles.acceptBtn}
            onClick={onAccept}
            type="button"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
