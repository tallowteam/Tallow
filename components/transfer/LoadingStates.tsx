'use client';

import { Skeleton, SkeletonDeviceCard, Spinner } from '@/components/ui';
import styles from './LoadingStates.module.css';

/**
 * Device Discovery Loading State
 * Shows skeleton screens while scanning for devices
 */
export function DeviceDiscoveryLoading({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.deviceDiscovery}>
      <div className={styles.scanStatus}>
        <Spinner size="sm" variant="primary" type="dots" />
        <span className={styles.scanText}>Scanning for devices...</span>
      </div>

      <div className={styles.deviceList}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonDeviceCard key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * File Upload Processing State
 * Shows processing animation while files are being prepared
 */
export function FileProcessingLoading({
  fileName,
  progress,
}: {
  fileName?: string;
  progress?: number;
}) {
  return (
    <div className={styles.fileProcessing}>
      <div className={styles.processingIcon}>
        <Spinner size="lg" type="pulse" variant="primary" />
      </div>
      <div className={styles.processingContent}>
        <h3 className={styles.processingTitle}>Processing files...</h3>
        {fileName && (
          <p className={styles.processingFile}>{fileName}</p>
        )}
        {progress !== undefined && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Transfer Queue Loading State
 * Shows loading state for transfer queue
 */
export function TransferQueueLoading({ items = 2 }: { items?: number }) {
  return (
    <div className={styles.transferQueue}>
      <div className={styles.queueHeader}>
        <Skeleton width="150px" height="24px" />
        <Skeleton width="60px" height="20px" />
      </div>
      <div className={styles.queueList}>
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className={styles.queueItem}>
            <div className={styles.queueItemIcon}>
              <Skeleton variant="circular" width="40px" height="40px" />
            </div>
            <div className={styles.queueItemContent}>
              <Skeleton width="200px" height="18px" />
              <Skeleton width="120px" height="14px" />
            </div>
            <Skeleton width="60px" height="32px" radius="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Transfer History Loading State
 * Shows loading state for transfer history
 */
export function TransferHistoryLoading({ items = 5 }: { items?: number }) {
  return (
    <div className={styles.transferHistory}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={styles.historyItem}>
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className={styles.historyContent}>
            <Skeleton width="180px" height="18px" />
            <Skeleton width="140px" height="14px" />
          </div>
          <div className={styles.historyMeta}>
            <Skeleton width="80px" height="14px" />
            <Skeleton width="60px" height="20px" radius="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Room Code Connect Loading State
 * Shows loading state when connecting to a room
 */
export function RoomConnectLoading({
  message = 'Connecting to room...',
}: {
  message?: string;
}) {
  return (
    <div className={styles.roomConnect}>
      <div className={styles.roomConnectSpinner}>
        <Spinner size="xl" type="ring" variant="primary" />
      </div>
      <h3 className={styles.roomConnectTitle}>{message}</h3>
      <div className={styles.roomConnectSteps}>
        <LoadingStep label="Establishing connection" active />
        <LoadingStep label="Verifying security" />
        <LoadingStep label="Preparing transfer" />
      </div>
    </div>
  );
}

/**
 * Loading Step Component
 * Individual step in a loading sequence
 */
function LoadingStep({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={`${styles.loadingStep} ${active ? styles.loadingStepActive : ''}`}>
      <div className={styles.loadingStepIcon}>
        {active ? (
          <Spinner size="xs" type="circular" variant="primary" />
        ) : (
          <div className={styles.loadingStepDot} />
        )}
      </div>
      <span className={styles.loadingStepLabel}>{label}</span>
    </div>
  );
}

/**
 * File Drop Zone Loading State
 * Shows loading state in drop zone
 */
export function DropZoneLoading() {
  return (
    <div className={styles.dropZoneLoading}>
      <Spinner size="lg" type="pulse" variant="primary" />
      <p className={styles.dropZoneText}>Processing files...</p>
    </div>
  );
}

/**
 * Page Transition Loading State
 * Full-page loading state for route transitions
 */
export function PageTransitionLoading() {
  return (
    <div className={styles.pageTransition}>
      <Spinner size="xl" type="circular" variant="primary" />
    </div>
  );
}

/**
 * Inline Loading State
 * Small inline loading indicator
 */
export function InlineLoading({
  text,
  size = 'sm',
}: {
  text?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <div className={styles.inlineLoading}>
      <Spinner size={size} type="dots" variant="current" />
      {text && <span className={styles.inlineText}>{text}</span>}
    </div>
  );
}

/**
 * Card Loading State
 * Generic card with loading skeleton
 */
export function CardLoading({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.cardLoading}>
      <Skeleton width="100%" height="120px" radius="lg" />
      <div className={styles.cardContent}>
        <Skeleton width="70%" height="20px" />
        <Skeleton variant="text" lines={lines} spacing="sm" />
      </div>
    </div>
  );
}

/**
 * Button Loading State
 * Loading state for buttons (used with Button component)
 */
export function ButtonLoadingIcon() {
  return (
    <svg
      className={styles.buttonSpinner}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

/**
 * Scanning Animation
 * Specialized scanning animation for device discovery
 */
export function ScanningAnimation() {
  return (
    <div className={styles.scanning}>
      <div className={styles.scanningRings}>
        <span className={styles.scanningRing} />
        <span className={styles.scanningRing} />
        <span className={styles.scanningRing} />
      </div>
      <div className={styles.scanningIcon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Upload Animation
 * Specialized animation for file uploads
 */
export function UploadAnimation() {
  return (
    <div className={styles.upload}>
      <div className={styles.uploadIcon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className={styles.uploadDots}>
        <span className={styles.uploadDot} />
        <span className={styles.uploadDot} />
        <span className={styles.uploadDot} />
      </div>
    </div>
  );
}
