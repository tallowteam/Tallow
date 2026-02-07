'use client';

import { useState, useEffect } from 'react';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { FileActions } from './FileActions';
import { Transfer } from '@/lib/types';
import { useToast } from '@/components/ui/ToastProvider';
import { TransferAnnotation } from './TransferAnnotation';
import { OrganizedFilesView } from './OrganizedFilesView';
import {
  getAllTransfers,
  type TransferRecord,
} from '@/lib/storage/transfer-history';
import styles from './TransferHistory.module.css';

type ViewMode = 'chronological' | 'organized';

export function TransferHistory() {
  const { transfers, clearCompleted, removeTransfer } = useTransferStore();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('chronological');
  const [persistedTransfers, setPersistedTransfers] = useState<TransferRecord[]>([]);

  // Load persisted transfers from IndexedDB
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getAllTransfers();
        setPersistedTransfers(history);
      } catch (error) {
        console.error('Failed to load transfer history:', error);
      }
    };

    loadHistory();
  }, [transfers]); // Reload when transfers change

  const completedTransfers = transfers.filter((t) =>
    ['completed', 'failed', 'cancelled'].includes(t.status)
  );

  const formatSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) {return '';}
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenFile = (transfer: Transfer) => {
    // Trigger download again for the file
    // In a real implementation, this would re-download or open the file
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`Opening ${fileName}...`);

    // For files that can be viewed in browser, open in new tab
    // For others, trigger download
    // This is a placeholder - actual implementation would depend on file type
  };

  const handleShareFile = (transfer: Transfer) => {
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`Sharing ${fileName}...`);
  };

  const handleDeleteFile = (transfer: Transfer) => {
    removeTransfer(transfer.id);
    const fileName = transfer.files[0]?.name || 'file';
    toast?.success(`${fileName} removed from history`);
  };

  // Handler for deleting from persisted history
  const handleDeletePersistedFile = async (transfer: TransferRecord) => {
    try {
      const { deleteTransfer } = await import('@/lib/storage/transfer-history');
      await deleteTransfer(transfer.id);

      // Refresh the list
      const history = await getAllTransfers();
      setPersistedTransfers(history);

      const fileName = transfer.files[0]?.name || 'file';
      toast?.success(`${fileName} removed from history`);
    } catch (error) {
      toast?.error('Failed to delete file from history');
    }
  };

  if (completedTransfers.length === 0 && persistedTransfers.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyIcon />
        <p>No transfer history</p>
        <span>Completed transfers will appear here</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.count}>
          {completedTransfers.length} transfer{completedTransfers.length !== 1 ? 's' : ''}
        </span>
        <div className={styles.headerActions}>
          {/* View Mode Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${
                viewMode === 'chronological' ? styles.toggleButtonActive : ''
              }`}
              onClick={() => setViewMode('chronological')}
              title="Chronological view"
            >
              <ListIcon />
            </button>
            <button
              className={`${styles.toggleButton} ${
                viewMode === 'organized' ? styles.toggleButtonActive : ''
              }`}
              onClick={() => setViewMode('organized')}
              title="Organized view"
            >
              <GridIcon />
            </button>
          </div>

          <button onClick={clearCompleted} className={styles.clearButton}>
            Clear history
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on View Mode */}
      {viewMode === 'chronological' ? (
        <div className={styles.list}>
          {completedTransfers.map((transfer) => (
            <div key={transfer.id} className={styles.itemWrapper}>
              <div className={styles.item}>
                <div className={styles.iconWrapper}>
                  {transfer.status === 'completed' ? (
                    <span className={styles.iconSuccess}>
                      <CheckIcon />
                    </span>
                  ) : (
                    <span className={styles.iconError}>
                      <ErrorIcon />
                    </span>
                  )}
                </div>
                <div className={styles.info}>
                  <span className={styles.fileName}>
                    {transfer.files.map((f) => f.name).join(', ') || 'Unknown'}
                  </span>
                  <div className={styles.meta}>
                    <span className={styles.size}>{formatSize(transfer.totalSize)}</span>
                    <span className={styles.separator}>·</span>
                    <span className={styles.time}>{formatTime(transfer.endTime)}</span>
                    <span className={styles.separator}>·</span>
                    <span className={`${styles.status} ${styles[transfer.status]}`}>
                      {transfer.status}
                    </span>
                  </div>
                </div>
                <span className={styles.direction}>
                  {transfer.direction === 'send' ? (
                    <UploadIcon />
                  ) : (
                    <DownloadIcon />
                  )}
                </span>

                {/* Desktop Actions */}
                <div className={styles.desktopActions}>
                  <FileActions
                    transfer={transfer}
                    onOpen={handleOpenFile}
                    onShare={handleShareFile}
                    onDelete={handleDeleteFile}
                  />
                </div>

                {/* Mobile Actions */}
                <div className={styles.mobileActions}>
                  <FileActions
                    transfer={transfer}
                    onOpen={handleOpenFile}
                    onShare={handleShareFile}
                    onDelete={handleDeleteFile}
                    mobileMenu
                  />
                </div>
              </div>

              {/* Annotations Section */}
              <div className={styles.annotationSection}>
                <TransferAnnotation transferId={transfer.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <OrganizedFilesView
          transfers={persistedTransfers}
          onOpenFile={(transfer) => {
            const fileName = transfer.files[0]?.name || 'file';
            toast?.success(`Opening ${fileName}...`);
          }}
          onShareFile={(transfer) => {
            const fileName = transfer.files[0]?.name || 'file';
            toast?.success(`Sharing ${fileName}...`);
          }}
          onDeleteFile={handleDeletePersistedFile}
        />
      )}
    </div>
  );
}

// Icons
function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
