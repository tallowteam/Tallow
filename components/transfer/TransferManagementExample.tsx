'use client';

/**
 * Transfer Management Example
 *
 * Complete example demonstrating scheduled transfers and templates integration
 * in a production-ready transfer management interface.
 */

import { useState, useEffect } from 'react';
import {
  FileDropZone,
  ScheduleTransferDialog,
  TransferTemplates,
  ScheduledTransfersPanel,
  DeviceDiscovery,
} from '@/components/transfer';
import {
  scheduleTransfer,
  getScheduledTransfers,
  onScheduledTransfersChange,
} from '@/lib/transfer/scheduled-transfer';
import {
  getTemplateStats,
  type TransferTemplateOptions,
} from '@/lib/transfer/transfer-templates';
import { useDeviceStore } from '@/lib/stores/device-store';

export default function TransferManagementExample() {
  // State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TransferTemplateOptions | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Store hooks
  const devices = useDeviceStore(state => state.devices);
  const onlineDevices = useDeviceStore(state => state.getOnlineDevices());
  const selectedDevice = useDeviceStore(state => state.selectedDevice);

  // Update scheduled count
  useEffect(() => {
    const updateCount = () => {
      const scheduled = getScheduledTransfers();
      const active = scheduled.filter(s => s.status === 'scheduled').length;
      setScheduledCount(active);
    };

    updateCount();
    const unsubscribe = onScheduledTransfersChange(updateCount);
    return unsubscribe;
  }, []);

  // Handlers
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    console.log('Files selected:', files.length);
  };

  const handleScheduleTransfer = () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first');
      return;
    }

    if (onlineDevices.length === 0) {
      alert('No devices available. You can schedule anyway, but the transfer will only execute when a device is online.');
    }

    setShowScheduleDialog(true);
  };

  const handleTransferScheduled = (scheduleId: string) => {
    console.log('Transfer scheduled successfully:', scheduleId);
    setShowScheduleDialog(false);
    setSelectedFiles([]);

    // Show success notification
    alert(`Transfer scheduled successfully! Check the "Scheduled Transfers" section to manage it.`);
  };

  const handleApplyTemplate = (options: TransferTemplateOptions) => {
    setActiveTemplate(options);
    console.log('Template applied:', options);

    // Auto-select device if template has one
    if (options.deviceId) {
      const device = devices.find(d => d.id === options.deviceId);
      if (device) {
        useDeviceStore.getState().selectDevice(device);
      }
    }

    // Show success notification
    alert(`Template applied! Settings: ${JSON.stringify(options, null, 2)}`);
  };

  const handleInstantTransfer = () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first');
      return;
    }

    if (!selectedDevice) {
      alert('Please select a target device');
      return;
    }

    // In a real implementation, this would trigger the actual transfer
    console.log('Starting instant transfer:', {
      files: selectedFiles,
      device: selectedDevice,
      options: activeTemplate,
    });

    alert('Transfer started! (This is a demo - actual transfer logic would be implemented here)');
    setSelectedFiles([]);
  };

  const handleQuickSchedule = (hours: number) => {
    if (selectedFiles.length === 0) {
      alert('Please select files first');
      return;
    }

    if (!selectedDevice) {
      alert('Please select a target device');
      return;
    }

    const scheduledTime = new Date(Date.now() + hours * 60 * 60 * 1000);

    const scheduleId = scheduleTransfer({
      files: selectedFiles,
      deviceId: selectedDevice.id,
      scheduledTime,
      repeat: 'once',
      autoRetry: true,
      maxRetries: 3,
    });

    console.log('Quick schedule:', scheduleId);
    alert(`Transfer scheduled for ${scheduledTime.toLocaleString()}`);
    setSelectedFiles([]);
  };

  // Template stats
  const templateStats = getTemplateStats();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Transfer Management</h1>
          <p style={styles.subtitle}>
            Schedule transfers, use templates, and manage your file transfers
          </p>
        </div>
        <div style={styles.stats}>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{onlineDevices.length}</div>
            <div style={styles.statLabel}>Online Devices</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{scheduledCount}</div>
            <div style={styles.statLabel}>Scheduled</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{templateStats.total}</div>
            <div style={styles.statLabel}>Templates</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Left Column - File Selection & Actions */}
        <div style={styles.leftColumn}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Select Files</h2>
            <FileDropZone onFilesSelected={handleFilesSelected} />

            {selectedFiles.length > 0 && (
              <div style={styles.selectedFiles}>
                <h3>Selected Files ({selectedFiles.length})</h3>
                <ul style={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <li key={index} style={styles.fileItem}>
                      {file.name} ({formatFileSize(file.size)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Select Device</h2>
            <DeviceDiscovery selectedFiles={selectedFiles} onDeviceSelect={() => {}} />
            {selectedDevice && (
              <div style={styles.selectedDevice}>
                <strong>Selected:</strong> {selectedDevice.name} ({selectedDevice.platform})
              </div>
            )}
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Transfer Options</h2>

            {activeTemplate && (
              <div style={styles.activeTemplate}>
                <h3>Active Template Settings:</h3>
                <ul>
                  <li>Encryption: {activeTemplate.encryption || 'standard'}</li>
                  <li>Compression: {activeTemplate.compression ? 'Enabled' : 'Disabled'}</li>
                  {activeTemplate.stripMetadata && <li>Metadata Stripping: Enabled</li>}
                  {activeTemplate.enableOnionRouting && <li>Onion Routing: Enabled</li>}
                </ul>
                <button onClick={() => setActiveTemplate(null)}>Clear Template</button>
              </div>
            )}

            <div style={styles.actions}>
              <button
                style={styles.primaryButton}
                onClick={handleInstantTransfer}
                disabled={selectedFiles.length === 0 || !selectedDevice}
              >
                Send Now
              </button>

              <button
                style={styles.secondaryButton}
                onClick={handleScheduleTransfer}
                disabled={selectedFiles.length === 0}
              >
                Schedule Transfer
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? 'Hide' : 'Show'} Templates
              </button>
            </div>

            {/* Quick Schedule Options */}
            {selectedFiles.length > 0 && selectedDevice && (
              <div style={styles.quickSchedule}>
                <h3>Quick Schedule:</h3>
                <div style={styles.quickScheduleButtons}>
                  <button onClick={() => handleQuickSchedule(1)}>In 1 hour</button>
                  <button onClick={() => handleQuickSchedule(6)}>In 6 hours</button>
                  <button onClick={() => handleQuickSchedule(24)}>Tomorrow</button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Templates & Scheduled Transfers */}
        <div style={styles.rightColumn}>
          {showTemplates && (
            <section style={styles.section}>
              <TransferTemplates onApplyTemplate={handleApplyTemplate} />
            </section>
          )}

          <section style={styles.section}>
            <ScheduledTransfersPanel />
          </section>
        </div>
      </div>

      {/* Schedule Dialog */}
      <ScheduleTransferDialog
        files={selectedFiles}
        isOpen={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        onScheduled={handleTransferScheduled}
      />
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
    padding: '2rem',
  },
  header: {
    marginBottom: '2rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#9ca3af',
    margin: 0,
  },
  stats: {
    display: 'flex',
    gap: '2rem',
    marginTop: '1.5rem',
  },
  statBox: {
    flex: 1,
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  section: {
    padding: '2rem',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 0,
    marginBottom: '1.5rem',
  },
  selectedFiles: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.05)',
    borderRadius: '8px',
  },
  fileList: {
    listStyle: 'none',
    padding: 0,
    margin: '0.5rem 0 0 0',
  },
  fileItem: {
    padding: '0.5rem',
    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
    color: '#e5e7eb',
  },
  selectedDevice: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '8px',
    color: '#ffffff',
  },
  activeTemplate: {
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '8px',
    marginBottom: '1rem',
    color: '#ffffff',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  primaryButton: {
    padding: '1rem',
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  secondaryButton: {
    padding: '1rem',
    background: 'transparent',
    color: '#9ca3af',
    border: '1px solid rgba(156, 163, 175, 0.3)',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  quickSchedule: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
  },
  quickScheduleButtons: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
};
