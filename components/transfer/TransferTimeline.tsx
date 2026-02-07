'use client';

import { useState, useMemo, useRef, type JSX } from 'react';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { Transfer } from '@/lib/types';
import { useToast } from '@/components/ui/ToastProvider';
import styles from './TransferTimeline.module.css';

export interface TransferTimelineProps {
  onClose?: () => void;
}

export function TransferTimeline({ onClose }: TransferTimelineProps) {
  const { transfers, clearCompleted, removeTransfer } = useTransferStore();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const completedTransfers = transfers.filter((t) =>
    ['completed', 'failed', 'cancelled'].includes(t.status)
  );

  // Filter transfers based on search and date
  const filteredTransfers = useMemo(() => {
    let filtered = completedTransfers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.files.some((f) => f.name.toLowerCase().includes(query)) ||
          t.from.name.toLowerCase().includes(query) ||
          t.to.name.toLowerCase().includes(query)
      );
    }

    // Date filter
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    if (dateFilter === 'today') {
      filtered = filtered.filter((t) => (t.endTime || 0) >= oneDayAgo);
    } else if (dateFilter === 'week') {
      filtered = filtered.filter((t) => (t.endTime || 0) >= oneWeekAgo);
    } else if (dateFilter === 'month') {
      filtered = filtered.filter((t) => (t.endTime || 0) >= oneMonthAgo);
    }

    return filtered;
  }, [completedTransfers, searchQuery, dateFilter]);

  // Group transfers by date
  const groupedTransfers = useMemo(() => {
    const groups: { label: string; date: Date; transfers: Transfer[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateMap = new Map<string, Transfer[]>();

    filteredTransfers.forEach((transfer) => {
      const transferDate = new Date(transfer.endTime || transfer.startTime || 0);
      const dateKey = new Date(
        transferDate.getFullYear(),
        transferDate.getMonth(),
        transferDate.getDate()
      ).toISOString();

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(transfer);
    });

    // Sort by date descending
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    sortedDates.forEach((dateKey) => {
      const date = new Date(dateKey);
      let label: string;

      if (date.getTime() === today.getTime()) {
        label = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }

      groups.push({
        label,
        date,
        transfers: dateMap.get(dateKey) || [],
      });
    });

    return groups;
  }, [filteredTransfers]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (startTime: number | null, endTime: number | null): string => {
    if (!startTime || !endTime) return '';
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (speed: number): string => {
    return `${formatSize(speed)}/s`;
  };

  const getFileIcon = (fileName: string): JSX.Element => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
      return <ImageIcon />;
    }
    // Video files
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(ext)) {
      return <VideoIcon />;
    }
    // Audio files
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
      return <AudioIcon />;
    }
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
      return <DocumentIcon />;
    }
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
      return <ArchiveIcon />;
    }
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html'].includes(ext)) {
      return <CodeIcon />;
    }

    return <FileIcon />;
  };

  const getEncryptionType = (transfer: Transfer): string => {
    if (!transfer.encryptionMetadata) return 'None';
    // Add more specific encryption info if available from metadata
    return 'AES-256';
  };

  const handleDelete = (transfer: Transfer) => {
    removeTransfer(transfer.id);
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`${fileName} removed from timeline`);
  };

  const handleClearHistory = () => {
    clearCompleted();
    toast?.success('Transfer history cleared');
  };

  if (completedTransfers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Transfer Timeline</h2>
            {onClose && (
              <button onClick={onClose} className={styles.closeButton} aria-label="Close timeline">
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
        <div className={styles.empty}>
          <TimelineEmptyIcon />
          <p>No transfer history</p>
          <span>Your completed transfers will appear here in a visual timeline</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Transfer Timeline</h2>
          {onClose && (
            <button onClick={onClose} className={styles.closeButton} aria-label="Close timeline">
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search files, devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchButton}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div className={styles.dateFilters}>
            <button
              onClick={() => setDateFilter('all')}
              className={`${styles.filterButton} ${dateFilter === 'all' ? styles.active : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`${styles.filterButton} ${dateFilter === 'today' ? styles.active : ''}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`${styles.filterButton} ${dateFilter === 'week' ? styles.active : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`${styles.filterButton} ${dateFilter === 'month' ? styles.active : ''}`}
            >
              Month
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <span className={styles.count}>
            {filteredTransfers.length} transfer{filteredTransfers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className={styles.timeline}>
        {groupedTransfers.map((group) => (
          <div key={group.label} className={styles.dateGroup}>
            <div className={styles.dateLabel}>
              <span>{group.label}</span>
            </div>

            {group.transfers.map((transfer) => {
              const isSent = transfer.direction === 'send';
              const peerName = isSent ? transfer.to.name : transfer.from.name;
              const fileName = transfer.files.map((f) => f.name).join(', ');
              const isHovered = hoveredId === transfer.id;

              return (
                <div
                  key={transfer.id}
                  className={`${styles.timelineItem} ${isSent ? styles.sent : styles.received}`}
                  onMouseEnter={() => setHoveredId(transfer.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className={styles.timelineLine}>
                    <div className={styles.timelineDot} />
                  </div>

                  <div className={styles.timelineCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.fileIconWrapper}>
                        {getFileIcon(transfer.files[0]?.name || '')}
                      </div>

                      <div className={styles.cardInfo}>
                        <div className={styles.fileName}>{fileName}</div>
                        <div className={styles.cardMeta}>
                          <span className={styles.metaItem}>
                            <span className={styles.directionIcon}>
                              {isSent ? <UploadIcon /> : <DownloadIcon />}
                            </span>
                            {isSent ? 'to' : 'from'} {peerName}
                          </span>
                          <span className={styles.separator}>•</span>
                          <span className={styles.metaItem}>{formatSize(transfer.totalSize)}</span>
                          <span className={styles.separator}>•</span>
                          <span className={styles.metaItem}>{formatTime(transfer.endTime)}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <span
                          className={`${styles.statusBadge} ${styles[transfer.status]}`}
                          title={transfer.status}
                        >
                          {transfer.status === 'completed' ? (
                            <CheckIcon />
                          ) : transfer.status === 'failed' ? (
                            <ErrorIcon />
                          ) : (
                            <CancelIcon />
                          )}
                        </span>
                        <button
                          onClick={() => handleDelete(transfer)}
                          className={styles.deleteButton}
                          aria-label="Remove from history"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {/* Hover Details */}
                    {isHovered && (
                      <div className={styles.hoverDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Encryption:</span>
                          <span className={styles.detailValue}>{getEncryptionType(transfer)}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Speed:</span>
                          <span className={styles.detailValue}>{formatSpeed(transfer.speed)}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Duration:</span>
                          <span className={styles.detailValue}>
                            {formatDuration(transfer.startTime, transfer.endTime)}
                          </span>
                        </div>
                        {transfer.error && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Error:</span>
                            <span className={`${styles.detailValue} ${styles.error}`}>
                              {transfer.error.message}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {filteredTransfers.length > 0 && (
        <div className={styles.footer}>
          <button onClick={handleClearHistory} className={styles.clearButton}>
            <TrashIcon />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function TimelineEmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
