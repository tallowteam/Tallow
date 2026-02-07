'use client';

import { useState, useEffect } from 'react';
import { useDeviceStore } from '@/lib/stores/device-store';
import { scheduleTransfer, type RepeatType } from '@/lib/transfer/scheduled-transfer';
import styles from './ScheduleTransferDialog.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScheduleTransferDialogProps {
  files: File[];
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: (scheduleId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduleTransferDialog({
  files,
  isOpen,
  onClose,
  onScheduled,
}: ScheduleTransferDialogProps) {
  const devices = useDeviceStore(state => state.devices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [autoRetry, setAutoRetry] = useState(true);

  // Set minimum datetime to now
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5); // Default to 5 minutes from now
      const formatted = now.toISOString().slice(0, 16);
      setScheduledTime(formatted);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const onlineDevices = devices.filter(d => d.isOnline);

  const handleSchedule = () => {
    if (!selectedDeviceId || !scheduledTime) return;

    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      alert('Please select a future time');
      return;
    }

    const scheduleId = scheduleTransfer({
      files,
      deviceId: selectedDeviceId,
      scheduledTime: scheduleDate,
      repeat,
      autoRetry,
      maxRetries: 3,
    });

    if (onScheduled) {
      onScheduled(scheduleId);
    }

    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getMinDateTime = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.icon}>⏰</span>
            Schedule Transfer
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.info}>
            <span className={styles.infoIcon}>ℹ️</span>
            <div className={styles.infoText}>
              Schedule this transfer to be sent automatically at a specific time. The target device must be online when the scheduled time arrives.
            </div>
          </div>

          {/* Files Preview */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Files to Transfer ({files.length})
            </label>
            <div className={styles.filesList}>
              {files.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <span className={styles.fileIcon}>📄</span>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Target Device <span className={styles.required}>*</span>
            </label>
            {onlineDevices.length === 0 ? (
              <div className={styles.info}>
                <span className={styles.infoIcon}>⚠️</span>
                <div className={styles.infoText}>
                  No devices are currently online. You can still schedule a transfer, but it will only execute when a device becomes available.
                </div>
              </div>
            ) : (
              <select
                className={styles.select}
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
              >
                <option value="">Select a device...</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.platform}) {device.isOnline ? '🟢' : '⚫'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Device Info */}
          {selectedDevice && (
            <div className={styles.deviceSelect}>
              <div className={styles.deviceAvatar}>
                {selectedDevice.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.deviceInfo}>
                <div className={styles.deviceName}>{selectedDevice.name}</div>
                <div className={styles.deviceStatus}>
                  <span className={selectedDevice.isOnline ? styles.statusOnline : styles.statusOffline} />
                  {selectedDevice.isOnline ? 'Online' : 'Offline'} • {selectedDevice.platform}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Time */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Scheduled Time <span className={styles.required}>*</span>
            </label>
            <input
              type="datetime-local"
              className={styles.input}
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              min={getMinDateTime()}
            />
          </div>

          {/* Repeat Options */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Repeat</label>
            <div className={styles.repeatOptions}>
              <button
                type="button"
                className={`${styles.repeatOption} ${repeat === 'once' ? styles.active : ''}`}
                onClick={() => setRepeat('once')}
              >
                Once
              </button>
              <button
                type="button"
                className={`${styles.repeatOption} ${repeat === 'daily' ? styles.active : ''}`}
                onClick={() => setRepeat('daily')}
              >
                Daily
              </button>
              <button
                type="button"
                className={`${styles.repeatOption} ${repeat === 'weekly' ? styles.active : ''}`}
                onClick={() => setRepeat('weekly')}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Auto Retry Checkbox */}
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRetry}
                onChange={e => setAutoRetry(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span className={styles.label} style={{ margin: 0 }}>
                Auto-retry if device is unavailable (up to 3 times)
              </span>
            </label>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.scheduleButton}
            onClick={handleSchedule}
            disabled={!selectedDeviceId || !scheduledTime}
          >
            Schedule Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
