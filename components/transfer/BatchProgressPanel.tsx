'use client';

import { useState, useEffect, useMemo } from 'react';
import { BatchProcessor, BatchItem } from '@/lib/transfer/batch-processor';
import { Button } from '@/components/ui/Button';
import styles from './BatchProgressPanel.module.css';

interface BatchProgressPanelProps {
  /** Batch processor instance */
  processor: BatchProcessor;
  /** Show panel */
  show: boolean;
  /** Callback when closed */
  onClose?: () => void;
  /** Callback when all complete */
  onComplete?: () => void;
}

export function BatchProgressPanel({
  processor,
  show,
  onClose,
  onComplete,
}: BatchProgressPanelProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [stats, setStats] = useState(processor.getStats());
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Update items and stats periodically
  useEffect(() => {
    if (!show) return;

    const updateState = () => {
      setItems(processor.getItems());
      setStats(processor.getStats());
      setIsProcessing(processor.isCurrentlyProcessing());
    };

    updateState();
    const interval = setInterval(updateState, 500);

    return () => clearInterval(interval);
  }, [processor, show]);

  // Check if processing complete
  useEffect(() => {
    if (stats.total > 0 && stats.completed + stats.failed + stats.cancelled === stats.total) {
      if (onComplete) {
        onComplete();
      }
    }
  }, [stats, onComplete]);

  const progressPercentage = useMemo(() => {
    if (stats.total === 0) return 0;
    const completed = stats.completed + stats.failed + stats.cancelled;
    return (completed / stats.total) * 100;
  }, [stats]);

  const handleCancel = async () => {
    if (isProcessing && confirm('Are you sure you want to cancel batch processing?')) {
      processor.cancel();
    }
  };

  const handleRetryFailed = async () => {
    await processor.retryFailed();
    setItems(processor.getItems());
    setStats(processor.getStats());
  };

  const handleClose = () => {
    if (isProcessing) {
      if (confirm('Processing is still in progress. Are you sure you want to close?')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  if (!show) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Batch Processing</h2>
          <p className={styles.subtitle}>
            {stats.completed + stats.failed + stats.cancelled} of {stats.total} files processed
          </p>
        </div>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close panel"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M5 5l10 10M15 5l-10 10" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Overall Progress */}
      <div className={styles.overallProgress}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Overall Progress</span>
          <span className={styles.progressPercentage}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.pending}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.processing}</span>
          <span className={styles.statLabel}>Processing</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.success}`}>
            {stats.completed}
          </span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.error}`}>
            {stats.failed}
          </span>
          <span className={styles.statLabel}>Failed</span>
        </div>
        {stats.cancelled > 0 && (
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.cancelled}`}>
              {stats.cancelled}
            </span>
            <span className={styles.statLabel}>Cancelled</span>
          </div>
        )}
      </div>

      {/* File List */}
      <div className={styles.fileList}>
        {items.map((item) => (
          <div key={item.id} className={styles.fileItem}>
            <div
              className={`${styles.fileItemHeader} ${
                expandedItemId === item.id ? styles.expanded : ''
              }`}
              onClick={() => toggleItemExpanded(item.id)}
            >
              <div className={styles.fileIcon}>
                {item.status === 'completed' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" fill="#10b981" />
                    <path
                      d="M6 10l2.5 2.5L14 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.status === 'failed' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" fill="#ef4444" />
                    <path
                      d="M7 7l6 6M13 7l-6 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {item.status === 'processing' && (
                  <div className={styles.spinner} />
                )}
                {item.status === 'pending' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle
                      cx="10"
                      cy="10"
                      r="9"
                      stroke="#9ca3af"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {item.status === 'cancelled' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" fill="#6b7280" />
                    <path
                      d="M7 10h6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{item.file.name}</div>
                <div className={styles.fileSize}>{formatBytes(item.file.size)}</div>
              </div>

              <div className={styles.fileStatus}>
                <span
                  className={`${styles.statusBadge} ${styles[item.status]}`}
                >
                  {item.status}
                </span>
              </div>

              <button className={styles.expandButton}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  style={{
                    transform:
                      expandedItemId === item.id ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {expandedItemId === item.id && (
              <div className={styles.fileItemDetails}>
                {item.appliedRules.length > 0 ? (
                  <div className={styles.appliedRules}>
                    <span className={styles.detailLabel}>Applied Rules:</span>
                    <ul className={styles.ruleList}>
                      {item.appliedRules.map((ruleId) => (
                        <li key={ruleId} className={styles.ruleItem}>
                          {ruleId}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className={styles.noRules}>No rules applied</div>
                )}

                {item.error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.errorLabel}>Error:</span>
                    <span className={styles.errorText}>{item.error}</span>
                  </div>
                )}

                {item.startTime && item.endTime && (
                  <div className={styles.timing}>
                    <span className={styles.detailLabel}>Duration:</span>
                    <span className={styles.detailValue}>
                      {((item.endTime - item.startTime) / 1000).toFixed(2)}s
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {isProcessing ? (
          <Button variant="outline" onClick={handleCancel}>
            Cancel Processing
          </Button>
        ) : (
          <>
            {stats.failed > 0 && (
              <Button variant="outline" onClick={handleRetryFailed}>
                Retry Failed ({stats.failed})
              </Button>
            )}
            <Button onClick={handleClose}>
              {stats.completed + stats.failed + stats.cancelled === stats.total
                ? 'Close'
                : 'Close Anyway'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
