'use client';

import { useState, useCallback, type DragEvent } from 'react';
import styles from './DeviceBubble.module.css';

interface DeviceBubbleProps {
  id: string;
  name: string;
  platform: string;
  status: 'online' | 'connecting' | 'offline';
  isFriend: boolean;
  isSelected: boolean;
  avatar?: string;
  transferProgress?: number; // 0-100
  transferStatus?: 'connecting' | 'transferring';
  onSelect: () => void;
  onDrop: (files: File[]) => void;
}

export function DeviceBubble(props: DeviceBubbleProps) {
  const {
    id: _id,
    name,
    platform,
    status,
    isFriend,
    isSelected,
    avatar,
    transferProgress,
    transferStatus,
    onSelect,
    onDrop,
  } = props;

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDropFiles = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && status === 'online') {
        onDrop(files);
      }
    },
    [status, onDrop]
  );

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'laptop':
      case 'macbook':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 16V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10m16 0H4m16 0 1 2H3l1-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'phone':
      case 'iphone':
      case 'android':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="6"
              y="2"
              width="12"
              height="20"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'tablet':
      case 'ipad':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="4"
              y="3"
              width="16"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'desktop':
      default:
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="2"
              y="4"
              width="20"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 20h8m-4-4v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  const getProgressCircle = () => {
    if (typeof transferProgress !== 'number') return null;

    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (transferProgress / 100) * circumference;

    return (
      <svg className={styles.progressRing} width="96" height="96" aria-hidden="true">
        <circle
          className={styles.progressRingBackground}
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="3"
        />
        <circle
          className={styles.progressRingForeground}
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={`${styles.bubble} ${isSelected ? styles.selected : ''} ${
          isDragOver ? styles.dragOver : ''
        } ${status === 'offline' ? styles.offline : ''}`}
        onClick={onSelect}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropFiles}
        aria-label={`${name} - ${platform} - ${status}`}
        aria-pressed={isSelected}
        disabled={status === 'offline'}
      >
        {/* Friend badge */}
        {isFriend && (
          <div className={styles.friendBadge} aria-label="Friend">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}

        {/* Transfer progress ring */}
        {getProgressCircle()}

        {/* Device circle */}
        <div className={styles.circle}>
          {avatar ? (
            <img src={avatar} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.icon}>{getPlatformIcon()}</div>
          )}
        </div>

        {/* Status dot */}
        <div
          className={`${styles.statusDot} ${styles[`status-${status}`]}`}
          aria-label={status}
        />

        {/* Drag over state */}
        {isDragOver && <div className={styles.dropLabel}>Drop here</div>}

        {/* Transfer status */}
        {transferStatus && (
          <div className={styles.transferStatus}>
            {transferStatus === 'connecting' ? 'Connecting...' : `${transferProgress}%`}
          </div>
        )}
      </button>

      {/* Device name */}
      <div className={styles.name} title={name}>
        {name}
      </div>
    </div>
  );
}
