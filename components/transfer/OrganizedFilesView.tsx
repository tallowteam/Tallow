'use client';

import { useState, useMemo } from 'react';
import type { TransferRecord } from '@/lib/storage/transfer-history';
import {
  organizeByType,
  organizeBySender,
  organizeByDate,
  type OrganizedByType,
  type OrganizedBySender,
  type OrganizedByDate,
} from '@/lib/storage/file-organizer';
import { formatDataSize } from '@/lib/storage/transfer-history';
import styles from './OrganizedFilesView.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type OrganizeMode = 'all' | 'type' | 'sender' | 'date';

interface OrganizedFilesViewProps {
  transfers: TransferRecord[];
  onOpenFile?: (transfer: TransferRecord) => void;
  onShareFile?: (transfer: TransferRecord) => void;
  onDeleteFile?: (transfer: TransferRecord) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrganizedFilesView({
  transfers,
  onOpenFile,
  onShareFile,
  onDeleteFile,
}: OrganizedFilesViewProps) {
  const [mode, setMode] = useState<OrganizeMode>('all');

  // Filter received transfers only
  const receivedTransfers = useMemo(
    () => transfers.filter((t) => t.direction === 'receive' && t.status === 'completed'),
    [transfers]
  );

  // Organize data based on mode
  const organizedByType = useMemo(
    () => organizeByType(receivedTransfers),
    [receivedTransfers]
  );

  const organizedBySender = useMemo(
    () => organizeBySender(receivedTransfers),
    [receivedTransfers]
  );

  const organizedByDate = useMemo(
    () => organizeByDate(receivedTransfers),
    [receivedTransfers]
  );


  if (receivedTransfers.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <DownloadIcon />
        </div>
        <p>No received files</p>
        <span>Files you receive will appear here</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${mode === 'all' ? styles.tabActive : ''}`}
          onClick={() => setMode('all')}
        >
          All
          <span className={styles.tabBadge}>{receivedTransfers.length}</span>
        </button>
        <button
          className={`${styles.tab} ${mode === 'type' ? styles.tabActive : ''}`}
          onClick={() => setMode('type')}
        >
          By Type
        </button>
        <button
          className={`${styles.tab} ${mode === 'sender' ? styles.tabActive : ''}`}
          onClick={() => setMode('sender')}
        >
          By Sender
        </button>
        <button
          className={`${styles.tab} ${mode === 'date' ? styles.tabActive : ''}`}
          onClick={() => setMode('date')}
        >
          By Date
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {mode === 'all' && (
          <AllFilesView
            transfers={receivedTransfers}
            {...(onOpenFile ? { onOpenFile } : {})}
            {...(onShareFile ? { onShareFile } : {})}
            {...(onDeleteFile ? { onDeleteFile } : {})}
          />
        )}

        {mode === 'type' && (
          <TypeView
            groups={organizedByType}
            {...(onOpenFile ? { onOpenFile } : {})}
            {...(onShareFile ? { onShareFile } : {})}
            {...(onDeleteFile ? { onDeleteFile } : {})}
          />
        )}

        {mode === 'sender' && (
          <SenderView
            groups={organizedBySender}
            {...(onOpenFile ? { onOpenFile } : {})}
            {...(onShareFile ? { onShareFile } : {})}
            {...(onDeleteFile ? { onDeleteFile } : {})}
          />
        )}

        {mode === 'date' && (
          <DateView
            groups={organizedByDate}
            {...(onOpenFile ? { onOpenFile } : {})}
            {...(onShareFile ? { onShareFile } : {})}
            {...(onDeleteFile ? { onDeleteFile } : {})}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ALL FILES VIEW
// ============================================================================

function AllFilesView({
  transfers,
  onOpenFile,
  onShareFile,
  onDeleteFile,
}: {
  transfers: TransferRecord[];
  onOpenFile?: (transfer: TransferRecord) => void;
  onShareFile?: (transfer: TransferRecord) => void;
  onDeleteFile?: (transfer: TransferRecord) => void;
}) {
  return (
    <div className={styles.list}>
      {transfers.map((transfer) => (
        <FileRow
          key={transfer.id}
          transfer={transfer}
          {...(onOpenFile ? { onOpen: onOpenFile } : {})}
          {...(onShareFile ? { onShare: onShareFile } : {})}
          {...(onDeleteFile ? { onDelete: onDeleteFile } : {})}
        />
      ))}
    </div>
  );
}

// ============================================================================
// TYPE VIEW
// ============================================================================

function TypeView({
  groups,
  onOpenFile,
  onShareFile,
  onDeleteFile,
}: {
  groups: OrganizedByType[];
  onOpenFile?: (transfer: TransferRecord) => void;
  onShareFile?: (transfer: TransferRecord) => void;
  onDeleteFile?: (transfer: TransferRecord) => void;
}) {
  return (
    <div className={styles.groupsContainer}>
      {groups.map((group) => (
        <div key={group.category} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.groupHeaderLeft}>
              <span className={styles.groupIcon}>{group.icon}</span>
              <h3 className={styles.groupTitle}>{group.label}</h3>
            </div>
            <div className={styles.groupStats}>
              <span className={styles.groupCount}>{group.fileCount} files</span>
              <span className={styles.groupSeparator}>·</span>
              <span className={styles.groupSize}>
                {formatDataSize(group.totalSize)}
              </span>
            </div>
          </div>
          <div className={styles.groupContent}>
            {group.transfers.map((transfer) => (
              <FileRow
                key={transfer.id}
                transfer={transfer}
                {...(onOpenFile ? { onOpen: onOpenFile } : {})}
                {...(onShareFile ? { onShare: onShareFile } : {})}
                {...(onDeleteFile ? { onDelete: onDeleteFile } : {})}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SENDER VIEW
// ============================================================================

function SenderView({
  groups,
  onOpenFile,
  onShareFile,
  onDeleteFile,
}: {
  groups: OrganizedBySender[];
  onOpenFile?: (transfer: TransferRecord) => void;
  onShareFile?: (transfer: TransferRecord) => void;
  onDeleteFile?: (transfer: TransferRecord) => void;
}) {
  return (
    <div className={styles.groupsContainer}>
      {groups.map((group) => (
        <div key={group.senderId} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.groupHeaderLeft}>
              <div className={styles.senderAvatar}>
                {group.senderName.charAt(0).toUpperCase()}
              </div>
              <h3 className={styles.groupTitle}>{group.senderName}</h3>
            </div>
            <div className={styles.groupStats}>
              <span className={styles.groupCount}>{group.fileCount} files</span>
              <span className={styles.groupSeparator}>·</span>
              <span className={styles.groupSize}>
                {formatDataSize(group.totalSize)}
              </span>
            </div>
          </div>
          <div className={styles.groupContent}>
            {group.transfers.map((transfer) => (
              <FileRow
                key={transfer.id}
                transfer={transfer}
                {...(onOpenFile ? { onOpen: onOpenFile } : {})}
                {...(onShareFile ? { onShare: onShareFile } : {})}
                {...(onDeleteFile ? { onDelete: onDeleteFile } : {})}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// DATE VIEW
// ============================================================================

function DateView({
  groups,
  onOpenFile,
  onShareFile,
  onDeleteFile,
}: {
  groups: OrganizedByDate[];
  onOpenFile?: (transfer: TransferRecord) => void;
  onShareFile?: (transfer: TransferRecord) => void;
  onDeleteFile?: (transfer: TransferRecord) => void;
}) {
  return (
    <div className={styles.groupsContainer}>
      {groups.map((group) => (
        <div key={group.category} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.groupHeaderLeft}>
              <h3 className={styles.groupTitle}>{group.label}</h3>
            </div>
            <div className={styles.groupStats}>
              <span className={styles.groupCount}>{group.fileCount} files</span>
              <span className={styles.groupSeparator}>·</span>
              <span className={styles.groupSize}>
                {formatDataSize(group.totalSize)}
              </span>
            </div>
          </div>
          <div className={styles.groupContent}>
            {group.transfers.map((transfer) => (
              <FileRow
                key={transfer.id}
                transfer={transfer}
                {...(onOpenFile ? { onOpen: onOpenFile } : {})}
                {...(onShareFile ? { onShare: onShareFile } : {})}
                {...(onDeleteFile ? { onDelete: onDeleteFile } : {})}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// FILE ROW COMPONENT
// ============================================================================

function FileRow({
  transfer,
  onOpen,
  onShare,
  onDelete,
}: {
  transfer: TransferRecord;
  onOpen?: (transfer: TransferRecord) => void;
  onShare?: (transfer: TransferRecord) => void;
  onDelete?: (transfer: TransferRecord) => void;
}) {
  const fileName = transfer.files.map((f) => f.name).join(', ');
  const fileExtension = transfer.files[0]?.name.split('.').pop()?.toLowerCase();

  const formatTime = (date: Date): string => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.fileRow}>
      <div className={styles.fileIcon}>
        <FileIconByType {...(fileExtension ? { extension: fileExtension } : {})} />
      </div>

      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{fileName}</div>
        <div className={styles.fileMeta}>
          <span className={styles.fileSize}>
            {formatDataSize(transfer.totalSize)}
          </span>
          <span className={styles.metaSeparator}>·</span>
          <span className={styles.fileSender}>{transfer.peerName}</span>
          <span className={styles.metaSeparator}>·</span>
          <span className={styles.fileDate}>{formatTime(transfer.completedAt)}</span>
        </div>
      </div>

      <div className={styles.fileActions}>
        {onOpen && (
          <button
            className={styles.actionButton}
            onClick={() => onOpen(transfer)}
            title="Open file"
          >
            <OpenIcon />
          </button>
        )}
        {onShare && (
          <button
            className={styles.actionButton}
            onClick={() => onShare(transfer)}
            title="Share file"
          >
            <ShareIcon />
          </button>
        )}
        {onDelete && (
          <button
            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
            onClick={() => onDelete(transfer)}
            title="Delete from history"
          >
            <DeleteIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FILE ICON BY TYPE
// ============================================================================

function FileIconByType({ extension }: { extension?: string }) {
  const ext = extension?.toLowerCase() || '';

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon />;
  }

  // Videos
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return <VideoIcon />;
  }

  // Documents
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
    return <DocumentIcon />;
  }

  // Audio
  if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) {
    return <AudioIcon />;
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <ArchiveIcon />;
  }

  // Code
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go', 'java'].includes(ext)) {
    return <CodeIcon />;
  }

  return <FileIcon />;
}

// ============================================================================
// ICONS
// ============================================================================

function DownloadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
