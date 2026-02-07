'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { useDeviceStore } from '@/lib/stores/device-store';
import { TransferRateGraph } from './TransferRateGraph';
import { TransferCelebration } from './TransferCelebration';
import styles from './TransferProgress.module.css';

export function TransferProgress() {
  const { currentTransfer, progress, transfers } = useTransferStore();
  const { connection } = useDeviceStore();

  // Track speed history (last 30 samples, one per second)
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const lastUpdateRef = useRef<number>(Date.now());
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationFileName, setCelebrationFileName] = useState('');
  const hasShownCelebrationRef = useRef(false);

  const progressValue = useMemo(() => {
    return currentTransfer.isTransferring
      ? progress.uploadProgress
      : progress.downloadProgress;
  }, [currentTransfer.isTransferring, progress.uploadProgress, progress.downloadProgress]);

  const transferredBytes = useMemo(() => {
    return (currentTransfer.fileSize * progressValue) / 100;
  }, [currentTransfer.fileSize, progressValue]);

  // Detect when transfer completes
  useEffect(() => {
    if (progressValue >= 100 && (currentTransfer.isTransferring || currentTransfer.isReceiving)) {
      if (!hasShownCelebrationRef.current) {
        setCelebrationFileName(currentTransfer.fileName || 'File');
        setShowCelebration(true);
        hasShownCelebrationRef.current = true;
      }
    } else if (progressValue < 100) {
      // Reset the flag when a new transfer starts
      hasShownCelebrationRef.current = false;
    }
  }, [progressValue, currentTransfer.isTransferring, currentTransfer.isReceiving, currentTransfer.fileName]);

  // Update speed history every second
  useEffect(() => {
    if (!currentTransfer.isTransferring && !currentTransfer.isReceiving) {
      // Reset speed history when not transferring
      setSpeedHistory([]);
      setCurrentSpeed(0);
      return;
    }

    // Get current transfer speed from active transfers
    const activeTransfer = transfers.find(
      (t) => t.status === 'transferring' || t.status === 'connecting'
    );
    const speed = activeTransfer?.speed || 0;
    setCurrentSpeed(speed);

    // Update speed history at 1-second intervals
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= 1000) {
        setSpeedHistory((prev) => {
          const updated = [...prev, speed];
          // Keep only last 30 samples (30 seconds)
          return updated.slice(-30);
        });
        lastUpdateRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTransfer.isTransferring, currentTransfer.isReceiving, transfers]);

  if (!currentTransfer.isTransferring && !currentTransfer.isReceiving) {
    return null;
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const connectionTypeLabel = connection.connectionType === 'p2p' ? 'Direct' : 'Relay';

  const handleCelebrationDismiss = () => {
    setShowCelebration(false);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.info}>
          <div className={styles.fileInfo}>
            <span className={styles.direction}>
              {currentTransfer.isTransferring ? (
                <UploadIcon />
              ) : (
                <DownloadIcon />
              )}
            </span>
            <span className={styles.fileName}>
              {currentTransfer.fileName || 'Unknown file'}
            </span>
            <span className={styles.fileSize}>
              {formatSize(transferredBytes)} / {formatSize(currentTransfer.fileSize)}
            </span>
            {connection.peerName && (
              <span className={styles.peerName}>
                to {connection.peerName}
              </span>
            )}
            <span className={styles.connectionBadge}>
              {connectionTypeLabel}
            </span>
          </div>
          <span className={styles.percentage}>{Math.round(progressValue)}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressValue}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progressValue)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Transfer progress: ${Math.round(progressValue)}%`}
          />
        </div>

        {/* Transfer Rate Graph */}
        {speedHistory.length > 0 && (
          <TransferRateGraph speeds={speedHistory} currentSpeed={currentSpeed} />
        )}
      </div>

      <TransferCelebration
        show={showCelebration}
        fileName={celebrationFileName}
        onDismiss={handleCelebrationDismiss}
      />
    </>
  );
}

// Icons
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
