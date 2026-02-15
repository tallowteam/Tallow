'use client';

/**
 * TransferSheet — Bottom sheet showing active transfers
 * Apple-inspired design with slide-up animation
 * Division Charlie (UI/UX) — Component Forger #032
 */

import { useState } from 'react';
import type { ActiveTransfer } from './transfer-types';
import styles from './TransferSheet.module.css';

interface TransferSheetProps {
  transfers: ActiveTransfer[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}

export function TransferSheet({ transfers, onPause, onResume, onCancel }: TransferSheetProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Hide sheet when no active transfers
  if (transfers.length === 0) {
    return null;
  }

  const activeCount = transfers.filter(
    (t) => t.status === 'connecting' || t.status === 'transferring'
  ).length;

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    if (bytesPerSecond < 1024 * 1024 * 1024)
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
  };

  const formatETA = (seconds: number): string => {
    if (seconds < 0) return 'Calculating...';
    if (seconds < 60) return `~${Math.ceil(seconds)}s remaining`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `~${minutes}m remaining`;
    const hours = Math.floor(minutes / 60);
    return `~${hours}h ${minutes % 60}m remaining`;
  };

  const getStatusText = (status: ActiveTransfer['status']): string => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'transferring':
        return 'Transferring...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'paused':
        return 'Paused';
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.sheet} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* Drag handle */}
      <div className={styles.dragHandle} />

      {/* Header bar */}
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse transfer sheet' : 'Expand transfer sheet'}
      >
        <span className={styles.headerText}>
          {activeCount === 1 ? '1 active transfer' : `${activeCount} active transfers`}
        </span>
        <svg
          className={styles.chevron}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 12.5L10 7.5L15 12.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Transfer list */}
      {isExpanded && (
        <div className={styles.transferList}>
          {transfers.map((transfer) => (
            <div key={transfer.id} className={styles.transferItem}>
              {/* Left: Icon + Info */}
              <div className={styles.transferInfo}>
                {/* File icon */}
                <div className={styles.fileIcon}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2V8H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* File name + device */}
                <div className={styles.transferDetails}>
                  <div className={styles.fileName}>
                    {transfer.fileName}
                    <span className={styles.directionArrow}>
                      {transfer.direction === 'send' ? '→' : '←'}
                    </span>
                    <span className={styles.deviceName}>{transfer.deviceName}</span>
                  </div>

                  {/* Status text */}
                  <div className={styles.statusText}>{getStatusText(transfer.status)}</div>
                </div>
              </div>

              {/* Right: Progress + Controls */}
              <div className={styles.transferProgress}>
                {/* Progress bar */}
                {(transfer.status === 'transferring' || transfer.status === 'paused') && (
                  <>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${transfer.progress}%` }} />
                    </div>
                    <div className={styles.progressStats}>
                      <span className={styles.speed}>{formatSpeed(transfer.speed)}</span>
                      <span className={styles.eta}>
                        {transfer.eta !== null ? formatETA(transfer.eta) : ''}
                      </span>
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className={styles.actions}>
                  {transfer.status === 'transferring' && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => onPause(transfer.id)}
                      aria-label="Pause transfer"
                      title="Pause"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
                        <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
                      </svg>
                    </button>
                  )}
                  {transfer.status === 'paused' && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => onResume(transfer.id)}
                      aria-label="Resume transfer"
                      title="Resume"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M5 3L13 8L5 13V3Z" fill="currentColor" />
                      </svg>
                    </button>
                  )}
                  {(transfer.status === 'transferring' ||
                    transfer.status === 'paused' ||
                    transfer.status === 'connecting') && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => onCancel(transfer.id)}
                      aria-label="Cancel transfer"
                      title="Cancel"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M12 4L4 12M4 4L12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
