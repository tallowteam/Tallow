'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { setupAutoSend, type AutoSendConfig, type AutoSendCallbacks } from '@/lib/clipboard/auto-send';
import { ClipboardMonitor } from '@/lib/clipboard/clipboard-monitor';
import { PastePreview } from './PastePreview';
import { useDeviceStore } from '@/lib/stores/device-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { useToast } from '@/components/ui/ToastProvider';
import styles from './ClipboardPanel.module.css';

interface PastePreviewData {
  type: 'image' | 'file' | 'text';
  files?: File[];
  blob?: Blob;
  dataUrl?: string;
  text?: string;
}

export function ClipboardPanel() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState<string | undefined>();
  const [confirmBeforeSend, setConfirmBeforeSend] = useState(true);
  const [sendImages, setSendImages] = useState(true);
  const [sendDocuments, setSendDocuments] = useState(false);
  const [sendText, setSendText] = useState(false);
  const [sendAllTypes, setSendAllTypes] = useState(false);
  const [lastPasted, setLastPasted] = useState<PastePreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const monitorRef = useRef<ClipboardMonitor | null>(null);
  const devices = useDeviceStore(state => state.devices);
  const selectedDevice = useDeviceStore(state => state.selectedDevice);
  const connectionStatus = useDeviceStore(state => state.connection.status);
  const addToQueue = useTransferStore(state => state.addToQueue);
  const toast = useToast();

  // Initialize target device from selected device
  useEffect(() => {
    if (selectedDevice && connectionStatus === 'connected') {
      setTargetDeviceId(selectedDevice.id);
    }
  }, [selectedDevice, connectionStatus]);

  // Setup auto-send
  useEffect(() => {
    const config: Partial<AutoSendConfig> = {
      enabled: isEnabled,
      ...(targetDeviceId ? { targetDeviceId } : {}),
      confirmBeforeSend,
      sendImages,
      sendDocuments,
      sendText,
      sendAllTypes,
    };

    const callbacks: AutoSendCallbacks = {
      onSend: handleAutoSend,
      onConfirmationRequired: handleConfirmationRequired,
      onError: handleError,
    };

    if (monitorRef.current) {
      monitorRef.current.destroy();
    }

    monitorRef.current = setupAutoSend(config, callbacks);

    return () => {
      if (monitorRef.current) {
        monitorRef.current.destroy();
        monitorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, targetDeviceId, confirmBeforeSend, sendImages, sendDocuments, sendText, sendAllTypes]);

  const handleAutoSend = useCallback((files: File[], deviceId?: string) => {
    if (!deviceId) {
      toast.error('No target device selected');
      return;
    }

    // Add files to transfer queue
    addToQueue(files);

    toast.success(`Added ${files.length} file(s) to transfer queue`, {
      title: 'Clipboard Send',
      duration: 3000,
    });

    setLastPasted({
      type: 'file',
      files,
    });
  }, [addToQueue, toast]);

  const handleConfirmationRequired = useCallback(async (
    files: File[],
    _deviceId?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const isImage = files[0]?.type.startsWith('image/');
      setLastPasted({
        type: isImage ? 'image' : 'file',
        files,
        ...(isImage && files[0] ? { dataUrl: URL.createObjectURL(files[0]) } : {}),
      });

      setShowPreview(true);

      // Store resolve function to be called by send/cancel buttons
      (window as any).__clipboardConfirmResolve = resolve;
    });
  }, [devices]);

  const handleError = useCallback((error: Error) => {
    toast.error(error.message, {
      title: 'Clipboard Error',
      duration: 5000,
    });
  }, [toast]);

  const handleSendConfirmed = useCallback(() => {
    setSending(true);

    if (lastPasted?.files && lastPasted.files.length > 0) {
      addToQueue(lastPasted.files);

      toast.success(`Sending ${lastPasted.files.length} file(s)`, {
        title: 'Transfer Started',
      });
    }

    // Resolve the confirmation promise
    if ((window as any).__clipboardConfirmResolve) {
      (window as any).__clipboardConfirmResolve(true);
      delete (window as any).__clipboardConfirmResolve;
    }

    setTimeout(() => {
      setSending(false);
      setShowPreview(false);
    }, 500);
  }, [lastPasted, addToQueue, toast]);

  const handleCancelConfirmed = useCallback(() => {
    // Resolve the confirmation promise with false
    if ((window as any).__clipboardConfirmResolve) {
      (window as any).__clipboardConfirmResolve(false);
      delete (window as any).__clipboardConfirmResolve;
    }

    setShowPreview(false);
  }, []);

  const onlineDevices = devices.filter(d => d.isOnline);
  const targetDevice = devices.find(d => d.id === targetDeviceId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h3 className={styles.title}>Clipboard Sharing</h3>
          <p className={styles.subtitle}>
            Automatically send pasted files to connected devices
          </p>
        </div>

        <label className={styles.toggleContainer}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className={styles.toggleInput}
          />
          <span className={styles.toggle} />
          <span className={styles.toggleLabel}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {isEnabled && (
        <div className={styles.settings}>
          {/* Device Selection */}
          <div className={styles.settingGroup}>
            <label htmlFor="target-device" className={styles.label}>
              Target Device
            </label>
            <select
              id="target-device"
              value={targetDeviceId || ''}
              onChange={(e) => setTargetDeviceId(e.target.value || undefined)}
              className={styles.select}
              disabled={onlineDevices.length === 0}
            >
              <option value="">Select device...</option>
              {onlineDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.platform})
                </option>
              ))}
            </select>
            {onlineDevices.length === 0 && (
              <p className={styles.hint}>No devices online</p>
            )}
          </div>

          {/* File Type Filters */}
          <div className={styles.settingGroup}>
            <label className={styles.label}>File Types</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={sendImages}
                  onChange={(e) => setSendImages(e.target.checked)}
                  disabled={sendAllTypes}
                />
                <span>Images</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={sendDocuments}
                  onChange={(e) => setSendDocuments(e.target.checked)}
                  disabled={sendAllTypes}
                />
                <span>Documents</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={sendText}
                  onChange={(e) => setSendText(e.target.checked)}
                  disabled={sendAllTypes}
                />
                <span>Text</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={sendAllTypes}
                  onChange={(e) => setSendAllTypes(e.target.checked)}
                />
                <span>All Types</span>
              </label>
            </div>
          </div>

          {/* Confirmation Setting */}
          <div className={styles.settingGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={confirmBeforeSend}
                onChange={(e) => setConfirmBeforeSend(e.target.checked)}
              />
              <span>Confirm before sending</span>
            </label>
          </div>

          {/* Paste Area */}
          <div className={styles.pasteArea}>
            <div className={styles.pasteIcon}>
              <PasteIcon />
            </div>
            <div className={styles.pasteText}>
              <p className={styles.pasteTitle}>Paste here (Ctrl+V / Cmd+V)</p>
              <p className={styles.pasteHint}>
                Files will be {confirmBeforeSend ? 'confirmed before sending' : 'sent automatically'}
                {targetDevice && ` to ${targetDevice.name}`}
              </p>
            </div>
          </div>

          {/* Last Pasted Preview */}
          {lastPasted && !showPreview && (
            <div className={styles.lastPasted}>
              <div className={styles.lastPastedHeader}>
                <span className={styles.lastPastedLabel}>Last pasted</span>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setLastPasted(null)}
                  aria-label="Clear preview"
                >
                  <CloseIcon />
                </button>
              </div>
              {lastPasted.type === 'file' && lastPasted.files && (
                <div className={styles.lastPastedContent}>
                  <FileIcon />
                  <span>
                    {lastPasted.files.length} file(s)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Preview */}
      {showPreview && lastPasted && (
        <div className={styles.previewOverlay}>
          <PastePreview
            type={lastPasted.type}
            {...(lastPasted.dataUrl ? { src: lastPasted.dataUrl } : {})}
            {...(lastPasted.files?.[0]?.name ? { fileName: lastPasted.files[0].name } : {})}
            {...(lastPasted.files?.[0]?.size != null ? { fileSize: lastPasted.files[0].size } : {})}
            {...(lastPasted.text ? { text: lastPasted.text } : {})}
            {...(lastPasted.files?.[0]?.type ? { fileType: lastPasted.files[0].type } : {})}
            onSend={handleSendConfirmed}
            onCancel={handleCancelConfirmed}
            {...(targetDevice?.name ? { targetDeviceName: targetDevice.name } : {})}
            loading={sending}
          />
        </div>
      )}
    </div>
  );
}

// Icons
function PasteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
