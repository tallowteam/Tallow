'use client';

import { MetadataInfo } from '@/lib/privacy/metadata-stripper';
import styles from './FileMetadataBadge.module.css';

interface FileMetadataBadgeProps {
  metadataInfo?: MetadataInfo;
  bytesRemoved: number;
  showDetails?: boolean;
}

export function FileMetadataBadge({ metadataInfo, bytesRemoved, showDetails = false }: FileMetadataBadgeProps) {
  if (!metadataInfo || bytesRemoved === 0) {
    return null;
  }

  const { hasSensitiveData, hasGPS, hasDeviceInfo, hasTimestamps, hasAuthorInfo } = metadataInfo;

  if (!hasSensitiveData) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSensitiveItems = (): string[] => {
    const items: string[] = [];
    if (hasGPS) {items.push('GPS location');}
    if (hasDeviceInfo) {items.push('Device info');}
    if (hasTimestamps) {items.push('Timestamps');}
    if (hasAuthorInfo) {items.push('Author data');}
    return items;
  };

  const sensitiveItems = getSensitiveItems();

  if (!showDetails) {
    return (
      <div className={styles.badge} title={`Removed ${formatBytes(bytesRemoved)} of metadata`}>
        <ShieldCheckIcon />
        <span>Metadata Stripped</span>
      </div>
    );
  }

  return (
    <div className={styles.badgeExpanded}>
      <div className={styles.badgeHeader}>
        <ShieldCheckIcon />
        <span className={styles.badgeTitle}>Metadata Stripped</span>
      </div>
      <div className={styles.badgeDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Removed:</span>
          <span className={styles.detailValue}>{formatBytes(bytesRemoved)}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Protected:</span>
          <span className={styles.detailValue}>{sensitiveItems.join(', ')}</span>
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
