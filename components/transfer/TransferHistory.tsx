'use client';

import React, { useMemo } from 'react';
import styles from './transferhistory.module.css';

interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: string;
  direction: 'sent' | 'received';
  deviceName: string;
  timestamp: string;
  speed: string;
}

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    fileName: 'report-Q4.pdf',
    fileSize: '3.2 MB',
    direction: 'sent',
    deviceName: 'Crystal Echo',
    timestamp: '2 min ago',
    speed: '14.1 MB/s'
  },
  {
    id: '2',
    fileName: 'song.mp3',
    fileSize: '8.4 MB',
    direction: 'received',
    deviceName: 'Silent Falcon',
    timestamp: '15 min ago',
    speed: '10.2 MB/s'
  },
  {
    id: '3',
    fileName: 'backup.tar.gz',
    fileSize: '892.1 MB',
    direction: 'sent',
    deviceName: 'Amber Wolf',
    timestamp: '1 hour ago',
    speed: '22.8 MB/s'
  },
  {
    id: '4',
    fileName: 'design-mockups.fig',
    fileSize: '45.7 MB',
    direction: 'received',
    deviceName: 'Crystal Echo',
    timestamp: '3 hours ago',
    speed: '18.3 MB/s'
  }
];

interface HistoryItemComponentProps {
  item: HistoryItem;
}

const HistoryItemComponent = React.memo(function HistoryItemComponent({ item }: HistoryItemComponentProps) {
  const directionText = useMemo(() => item.direction === 'sent' ? 'to' : 'from', [item.direction]);

  return (
    <div className={styles.historyItem}>
      <div
        className={`${styles.directionIcon} ${
          item.direction === 'sent' ? styles.sent : styles.received
        }`}
      >
        {item.direction === 'sent' ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3v10M8 3l3 3M8 3L5 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 13V3M8 13l3-3M8 13l-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.fileInfo}>
          <div className={styles.fileName}>{item.fileName}</div>
          <div className={styles.fileSize}>{item.fileSize}</div>
        </div>

        <div className={styles.details}>
          <span className={styles.deviceName}>
            {directionText} {item.deviceName}
          </span>
          <span className={styles.separator}>·</span>
          <span className={styles.timestamp}>{item.timestamp}</span>
          <span className={styles.separator}>·</span>
          <span className={styles.speed}>{item.speed}</span>
        </div>
      </div>

      <div className={styles.status}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="7" fill="var(--success)" opacity="0.15" />
          <path
            d="M5 8l2 2 4-4"
            stroke="var(--success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
});

function TransferHistoryComponent() {
  const historyCount = useMemo(() => mockHistory.length, []);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Transfer History</h2>
      </div>

      {historyCount === 0 ? (
        <div className={styles.empty}>No transfer history yet</div>
      ) : (
        <div className={styles.list}>
          {mockHistory.map((item) => (
            <HistoryItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export const TransferHistory = React.memo(TransferHistoryComponent);
