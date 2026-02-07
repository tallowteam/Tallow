'use client';

import React, { useState } from 'react';
import styles from './transferprogress.module.css';

interface Transfer {
  id: string;
  fileName: string;
  fileSize: string;
  progress: number;
  speed: string;
  deviceName: string;
  timeRemaining: string;
}

const mockTransfers: Transfer[] = [
  {
    id: '1',
    fileName: 'presentation.pdf',
    fileSize: '24.8 MB',
    progress: 67,
    speed: '12.4 MB/s',
    deviceName: 'Silent Falcon',
    timeRemaining: '~1 min remaining'
  },
  {
    id: '2',
    fileName: 'vacation-photos.zip',
    fileSize: '156.2 MB',
    progress: 23,
    speed: '8.7 MB/s',
    deviceName: 'Amber Wolf',
    timeRemaining: '~12 min remaining'
  }
];

export function TransferProgress() {
  const [transfers, setTransfers] = useState<Transfer[]>(mockTransfers);

  const handlePause = (id: string) => {
    console.log('Pause transfer:', id);
  };

  const handleCancel = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Active Transfers</h2>
        {transfers.length > 0 && (
          <span className={styles.count}>{transfers.length}</span>
        )}
      </div>

      {transfers.length === 0 ? (
        <div className={styles.empty}>No active transfers</div>
      ) : (
        <div className={styles.list}>
          {transfers.map((transfer) => (
            <div key={transfer.id} className={styles.transferItem}>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{transfer.fileName}</div>
                <div className={styles.fileSize}>{transfer.fileSize}</div>
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${transfer.progress}%` }}
                  />
                </div>
                <div className={styles.progressLabel}>{transfer.progress}%</div>
              </div>

              <div className={styles.details}>
                <div className={styles.speedInfo}>
                  {transfer.speed} · to {transfer.deviceName} · {transfer.timeRemaining}
                </div>
                <div className={styles.encryption}>
                  <svg
                    className={styles.lockIcon}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 7V5a4 4 0 10-8 0v2H3a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2V8a1 1 0 00-1-1h-1zm-6-2a2 2 0 114 0v2H6V5z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Encrypted</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handlePause(transfer.id)}
                  aria-label="Pause transfer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
                    <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
                  </svg>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleCancel(transfer.id)}
                  aria-label="Cancel transfer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4.7L11.3 4 8 7.3 4.7 4 4 4.7 7.3 8 4 11.3l.7.7L8 8.7l3.3 3.3.7-.7L8.7 8 12 4.7z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
