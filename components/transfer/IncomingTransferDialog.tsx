'use client';

/**
 * Incoming Transfer Dialog
 * Shows a dialog when another device wants to send files
 */

import { useState, useEffect } from 'react';
import { ConfirmDialog, InfoIcon } from '@/components/ui/ConfirmDialog';
import styles from './IncomingTransferDialog.module.css';

export interface IncomingTransferDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Device name requesting to send */
  deviceName: string;
  /** File name to be sent */
  fileName: string;
  /** File size in bytes */
  fileSize?: number;
  /** File type/MIME type */
  fileType?: string;
  /** Callback when user accepts */
  onAccept: () => void;
  /** Callback when user rejects */
  onReject: () => void;
  /** Auto-reject timeout in ms (default: 30000) */
  timeout?: number;
}

export function IncomingTransferDialog({
  open,
  deviceName,
  fileName,
  fileSize,
  fileType,
  onAccept,
  onReject,
  timeout = 30000,
}: IncomingTransferDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeout / 1000);

  useEffect(() => {
    if (!open) {
      setTimeRemaining(timeout / 1000);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((timeout - elapsed) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onReject();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [open, timeout, onReject]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) {return '';}
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (type?: string): string => {
    if (!type) {return '📄';}
    if (type.startsWith('image/')) {return '🖼️';}
    if (type.startsWith('video/')) {return '🎬';}
    if (type.startsWith('audio/')) {return '🎵';}
    if (type.includes('pdf')) {return '📕';}
    if (type.includes('zip') || type.includes('archive')) {return '📦';}
    if (type.includes('text')) {return '📝';}
    return '📄';
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onReject}
      onConfirm={onAccept}
      title="Incoming Transfer Request"
      description={
        <div className={styles.content}>
          <div className={styles.device}>
            <strong>{deviceName}</strong> wants to send you a file:
          </div>
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon}>{getFileIcon(fileType)}</div>
            <div className={styles.fileDetails}>
              <div className={styles.fileName}>{fileName}</div>
              {fileSize && (
                <div className={styles.fileSize}>{formatFileSize(fileSize)}</div>
              )}
            </div>
          </div>
          <div className={styles.timeout}>
            Auto-reject in {timeRemaining} seconds
          </div>
        </div>
      }
      confirmText="Accept"
      cancelText="Reject"
      icon={<InfoIcon />}
      size="md"
    />
  );
}
