'use client';

import { useState, useEffect } from 'react';
import {
  getScheduledTransfers,
  cancelScheduled,
  deleteScheduled,
  onScheduledTransfersChange,
  type ScheduledTransfer,
} from '@/lib/transfer/scheduled-transfer';
import { useDeviceStore } from '@/lib/stores/device-store';
import styles from './ScheduledTransfersPanel.module.css';

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduledTransfersPanel() {
  const [scheduled, setScheduled] = useState<ScheduledTransfer[]>([]);
  const devices = useDeviceStore(state => state.devices);

  useEffect(() => {
    setScheduled(getScheduledTransfers());

    const unsubscribe = onScheduledTransfersChange(() => {
      setScheduled(getScheduledTransfers());
    });

    return unsubscribe;
  }, []);

  const handleCancel = (id: string) => {
    if (confirm('Cancel this scheduled transfer?')) {
      cancelScheduled(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this scheduled transfer from history?')) {
      deleteScheduled(id);
    }
  };

  const activeScheduled = scheduled.filter(s => s.status === 'scheduled');
  const completedScheduled = scheduled.filter(s => ['completed', 'failed', 'cancelled'].includes(s.status));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>⏰</span>
          Scheduled Transfers
        </h2>
      </div>

      {activeScheduled.length === 0 && completedScheduled.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <div className={styles.emptyTitle}>No Scheduled Transfers</div>
          <div className={styles.emptyText}>
            Schedule a transfer to send files automatically at a specific time
          </div>
        </div>
      )}

      {activeScheduled.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Active ({activeScheduled.length})</h3>
          <div className={styles.list}>
            {activeScheduled.map(item => (
              <ScheduledTransferCard
                key={item.id}
                scheduled={item}
                devices={devices}
                onCancel={() => handleCancel(item.id)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {completedScheduled.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>History ({completedScheduled.length})</h3>
          <div className={styles.list}>
            {completedScheduled.map(item => (
              <ScheduledTransferCard
                key={item.id}
                scheduled={item}
                devices={devices}
                onCancel={() => handleCancel(item.id)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCHEDULED TRANSFER CARD
// ============================================================================

interface ScheduledTransferCardProps {
  scheduled: ScheduledTransfer;
  devices: any[];
  onCancel: () => void;
  onDelete: () => void;
}

function ScheduledTransferCard({ scheduled, devices, onCancel, onDelete }: ScheduledTransferCardProps) {
  const device = devices.find(d => d.id === scheduled.deviceId);
  const isActive = scheduled.status === 'scheduled';

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) return 'Overdue';

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    return `in ${minutes}m`;
  };

  const getStatusColor = () => {
    switch (scheduled.status) {
      case 'scheduled':
        return '#8b5cf6';
      case 'running':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.statusBadge} style={{ background: getStatusColor() }}>
          {scheduled.status}
        </div>
        {scheduled.repeat !== 'once' && (
          <div className={styles.repeatBadge}>
            🔁 {scheduled.repeat}
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.deviceInfo}>
          <div className={styles.deviceAvatar}>
            {device?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className={styles.deviceName}>
              {device?.name || 'Unknown Device'}
            </div>
            <div className={styles.deviceStatus}>
              {device?.isOnline ? '🟢 Online' : '⚫ Offline'}
            </div>
          </div>
        </div>

        <div className={styles.files}>
          <div className={styles.filesCount}>
            📁 {scheduled.files.length} file{scheduled.files.length !== 1 ? 's' : ''}
          </div>
          <div className={styles.filesSize}>
            {formatFileSize(scheduled.files.reduce((sum, f) => sum + f.size, 0))}
          </div>
        </div>

        <div className={styles.timing}>
          <div className={styles.timingLabel}>Scheduled for:</div>
          <div className={styles.timingValue}>
            {formatDateTime(scheduled.nextRun || scheduled.scheduledTime)}
          </div>
          {isActive && scheduled.nextRun && (
            <div className={styles.countdown}>
              {formatTimeRemaining(scheduled.nextRun)}
            </div>
          )}
        </div>

        {scheduled.error && (
          <div className={styles.error}>
            ⚠️ {scheduled.error}
          </div>
        )}

        {scheduled.retryCount > 0 && (
          <div className={styles.retryInfo}>
            🔄 Retry attempt {scheduled.retryCount} of {scheduled.maxRetries}
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {isActive ? (
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <button className={styles.deleteButton} onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
