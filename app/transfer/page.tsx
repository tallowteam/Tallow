'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  Component,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';

// ---- Components (direct imports, NO barrel) ----
import Sidebar from '@/components/transfer/Sidebar';
import { MobileTabBar } from '@/components/transfer/MobileTabBar';
import { FileDropZone } from '@/components/transfer/FileDropZone';
import { DeviceGrid } from '@/components/transfer/DeviceGrid';
import { RemoteConnect } from '@/components/transfer/RemoteConnect';
import { SendConfirmation } from '@/components/transfer/SendConfirmation';
import { TransferSheet } from '@/components/transfer/TransferSheet';
import { TransferHistory } from '@/components/transfer/TransferHistory';
import { ClipboardPanel } from '@/components/transfer/ClipboardPanel';

// ---- Hooks ----
import { useTransferOrchestrator } from '@/lib/hooks/use-transfer-orchestrator';
import { useDeviceDiscovery } from '@/lib/hooks/use-device-discovery';
import { useDeviceStore } from '@/lib/stores/device-store';
import { useFriendsStore } from '@/lib/stores/friends-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useShallow } from 'zustand/react/shallow';

// ---- Plain TS modules (Turbopack-safe store access) ----
import {
  getMergedDeviceGridItems,
  getDeviceTransferMap,
  shouldAutoAccept,
  getDeviceGridItemById,
} from '@/lib/transfer/transfer-page-actions';
import {
  resolveAutoSelectMode,
  recordModeSelection,
} from '@/lib/transfer/flow-preferences';

// ---- Types ----
import type {
  TransferMode,
  MobileTab,
  SendConfirmationData,
} from '@/components/transfer/transfer-types';

// ---- Styles ----
import styles from './page.module.css';

// ============================================================================
// PANEL / TAB TYPES
// ============================================================================

type PanelView = 'dashboard' | 'history' | 'clipboard' | 'settings';

const mobileTabToPanel: Record<MobileTab, PanelView> = {
  devices: 'dashboard',
  history: 'history',
  clipboard: 'clipboard',
  settings: 'settings',
};

const panelToMobileTab: Record<PanelView, MobileTab> = {
  dashboard: 'devices',
  history: 'history',
  clipboard: 'clipboard',
  settings: 'settings',
};

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TransferErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Transfer Page Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.page} role="region" aria-label="Transfer error">
          <div className={styles.errorFallback}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
              <path d="M28 16v16M28 38v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorText}>
              The transfer interface hit a snag. Try refreshing.
            </p>
            <button className={styles.errorButton} onClick={this.handleReset}>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// TRANSFER PAGE
// ============================================================================

export default function TransferPage() {
  const searchParams = useSearchParams();
  const hasAppliedRoomLink = useRef(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ---- Reactive store subscriptions ----

  const settings = useSettingsStore(
    useShallow((s) => ({
      deviceName: s.deviceName,
      autoAcceptFromFriends: s.autoAcceptFromFriends,
      saveLocation: s.saveLocation,
      maxConcurrentTransfers: s.maxConcurrentTransfers,
      allowLocalDiscovery: s.allowLocalDiscovery,
      allowInternetP2P: s.allowInternetP2P,
      setDeviceName: s.setDeviceName,
      setAutoAcceptFromFriends: s.setAutoAcceptFromFriends,
      setSaveLocation: s.setSaveLocation,
      setMaxConcurrentTransfers: s.setMaxConcurrentTransfers,
      setAllowLocalDiscovery: s.setAllowLocalDiscovery,
      setAllowInternetP2P: s.setAllowInternetP2P,
    }))
  );

  const storeDevices = useDeviceStore((s) => s.devices);
  const storeFriends = useFriendsStore((s) => s.friends);
  const storeTransfers = useTransferStore((s) => s.transfers);

  // ---- Mode & panel ----

  const hasRoomCode = !!searchParams.get('room')?.trim();
  const [mode, setMode] = useState<TransferMode>(() =>
    resolveAutoSelectMode({
      hasRoomCode,
      allowLocalDiscovery: settings.allowLocalDiscovery,
      allowInternetP2P: settings.allowInternetP2P,
    })
  );
  const [activePanel, setActivePanel] = useState<PanelView>('dashboard');

  // ---- File staging ----

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // ---- Device selection & send confirmation ----

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sendConfirmation, setSendConfirmation] = useState<SendConfirmationData | null>(null);

  // ---- Room state (remote mode) ----

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isRoomConnected, setIsRoomConnected] = useState(false);
  const [roomMembers, setRoomMembers] = useState<
    Array<{ id: string; name: string; platform: string; isOnline: boolean }>
  >([]);
  const [roomError, setRoomError] = useState<string | null>(null);

  // ---- Hooks ----

  const {
    state: transferState,
    connectToDevice,
    disconnect,
    sendFiles,
  } = useTransferOrchestrator({
    enableEncryption: true,
    enableNATOptimization: true,
  });
  const { status: discoveryStatus, refresh: refreshDiscovery } =
    useDeviceDiscovery();

  // ---- Derived data (computed via plain TS modules — Turbopack safe) ----

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gridDevices = useMemo(() => getMergedDeviceGridItems(), [storeDevices, storeFriends]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transferStates = useMemo(() => getDeviceTransferMap(), [storeTransfers]);

  const isScanning = discoveryStatus.isScanning;

  const bottomSheetTransfers = useMemo(() => {
    const activeStatuses = new Set([
      'pending', 'initializing', 'connecting', 'key-exchange',
      'transferring', 'paused', 'resuming', 'verifying',
    ]);

    return storeTransfers
      .filter((t) => activeStatuses.has(t.status))
      .map((t) => {
        let mapped: 'connecting' | 'transferring' | 'completed' | 'failed';
        if (['connecting', 'initializing', 'key-exchange', 'pending'].includes(t.status)) {
          mapped = 'connecting';
        } else if (['transferring', 'resuming', 'verifying'].includes(t.status)) {
          mapped = 'transferring';
        } else {
          mapped = 'failed';
        }
        return {
          id: t.id,
          fileName: t.files?.[0]?.name ?? 'Unknown',
          fileSize: t.totalSize ?? 0,
          progress: t.progress ?? 0,
          speed: t.speed ?? 0,
          eta: t.eta ?? null,
          direction: t.direction,
          status: mapped,
          deviceName: (t.direction === 'send' ? t.to?.name : t.from?.name) ?? 'Unknown',
        };
      });
  }, [storeTransfers]);

  const activeTransferCount = bottomSheetTransfers.length;

  // ---- Mode & panel handlers ----

  const handleModeChange = useCallback((newMode: TransferMode) => {
    setMode(newMode);
    recordModeSelection(newMode);
    setSelectedDeviceId(null);
    setSendConfirmation(null);
    setActivePanel('dashboard');
  }, []);

  const handlePanelChange = useCallback((panel: string) => {
    setActivePanel(panel as PanelView);
  }, []);

  const handleMobileTabChange = useCallback((tab: MobileTab) => {
    setActivePanel(mobileTabToPanel[tab]);
  }, []);

  // ---- File handlers ----

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setStagedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileRemoved = useCallback((index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearFiles = useCallback(() => {
    setStagedFiles([]);
  }, []);

  // ---- Device selection ----

  const handleSelectDevice = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);

      if (stagedFiles.length > 0) {
        const device = getDeviceGridItemById(deviceId);
        if (device) {
          setSendConfirmation({
            deviceId,
            deviceName: device.name,
            files: stagedFiles,
            totalSize: stagedFiles.reduce((sum, f) => sum + f.size, 0),
            autoAccept: shouldAutoAccept(deviceId),
          });
        }
      }
    },
    [stagedFiles]
  );

  const handleDropOnDevice = useCallback(
    (deviceId: string, files: File[]) => {
      const allFiles = [...stagedFiles, ...files];
      setStagedFiles(allFiles);

      const device = getDeviceGridItemById(deviceId);
      if (device) {
        setSendConfirmation({
          deviceId,
          deviceName: device.name,
          files: allFiles,
          totalSize: allFiles.reduce((sum, f) => sum + f.size, 0),
          autoAccept: shouldAutoAccept(deviceId),
        });
      }
    },
    [stagedFiles]
  );

  // ---- Send confirmation ----

  const handleConfirmSend = useCallback(async () => {
    if (!sendConfirmation) return;

    try {
      const device = getDeviceGridItemById(sendConfirmation.deviceId);
      if (device?.deviceData) {
        const deviceData = device.deviceData as { id: string };
        if (
          !transferState.isConnected ||
          transferState.connectedDevice?.id !== deviceData.id
        ) {
          await connectToDevice(device.deviceData as Parameters<typeof connectToDevice>[0]);
        }
        await sendFiles(sendConfirmation.files);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setSendConfirmation(null);
      setStagedFiles([]);
    }
  }, [
    sendConfirmation,
    transferState.isConnected,
    transferState.connectedDevice,
    connectToDevice,
    sendFiles,
  ]);

  const handleCancelSend = useCallback(() => {
    setSendConfirmation(null);
  }, []);

  // ---- Room handlers (remote mode) ----

  const handleJoinRoom = useCallback((code: string) => {
    setRoomCode(code);
    setIsRoomConnected(true);
    setRoomError(null);
  }, []);

  const handleCreateRoom = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setIsRoomConnected(true);
    setRoomError(null);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setRoomCode(null);
    setIsRoomConnected(false);
    setRoomMembers([]);
    disconnect();
  }, [disconnect]);

  const handleCopyCode = useCallback(() => {
    if (roomCode) void navigator.clipboard.writeText(roomCode);
  }, [roomCode]);

  const handleShareLink = useCallback(() => {
    if (roomCode) {
      const url = `${window.location.origin}/transfer?room=${roomCode}`;
      void navigator.clipboard.writeText(url);
    }
  }, [roomCode]);

  // ---- Effects ----

  // Global drag listener for file drops
  useEffect(() => {
    const el = document.querySelector('[data-transfer-main]');
    if (!el) return;

    const onDragEnter = (e: Event) => {
      if ((e as DragEvent).dataTransfer?.types.includes('Files')) {
        setIsDragActive(true);
      }
    };
    const onDragLeave = (e: Event) => {
      if ((e as DragEvent).relatedTarget === null) {
        setIsDragActive(false);
      }
    };
    const onDragOver = (e: Event) => e.preventDefault();
    const onDrop = (e: Event) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = Array.from((e as DragEvent).dataTransfer?.files ?? []);
      if (files.length > 0) {
        setStagedFiles((prev) => [...prev, ...files]);
      }
    };

    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);

    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  // Room link from URL (?room=CODE)
  useEffect(() => {
    const roomParam = searchParams.get('room')?.trim().toUpperCase();
    if (!roomParam || hasAppliedRoomLink.current) return;
    hasAppliedRoomLink.current = true;
    setMode('remote');
    setActivePanel('dashboard');
    handleJoinRoom(roomParam);
  }, [searchParams, handleJoinRoom]);

  // ---- Render ----

  return (
    <TransferErrorBoundary>
      <main className={styles.page} data-transfer-main>
        <div className={styles.appLayout}>
          {/* Desktop sidebar */}
          <Sidebar
            activeMode={mode}
            activePanel={activePanel}
            onModeChange={handleModeChange}
            onPanelChange={handlePanelChange}
            deviceName={mounted ? settings.deviceName : 'My Device'}
          />

          <div className={styles.mainContent}>
            {/* ---- DASHBOARD ---- */}
            {activePanel === 'dashboard' && (
              <div className={styles.dashboardPanel}>
                {/* Inline mode pills (visible on all screens) */}
                <div className={styles.modePills}>
                  <button
                    type="button"
                    className={`${styles.modePill} ${mode === 'nearby' ? styles.modePillActive : ''}`}
                    onClick={() => handleModeChange('nearby')}
                    aria-pressed={mode === 'nearby'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      <circle cx="12" cy="20" r="1" fill="currentColor" />
                    </svg>
                    Nearby
                    {isScanning && <span className={styles.scanDot} />}
                  </button>
                  <button
                    type="button"
                    className={`${styles.modePill} ${mode === 'remote' ? styles.modePillActive : ''}`}
                    onClick={() => handleModeChange('remote')}
                    aria-pressed={mode === 'remote'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Remote
                  </button>
                </div>

                <FileDropZone
                  files={stagedFiles}
                  onFilesAdded={handleFilesAdded}
                  onFileRemoved={handleFileRemoved}
                  onClearAll={handleClearFiles}
                  isDragActive={isDragActive}
                />

                <div className={styles.gridSection}>
                  {mode === 'nearby' ? (
                    <DeviceGrid
                      devices={gridDevices}
                      selectedDeviceId={selectedDeviceId}
                      onSelectDevice={handleSelectDevice}
                      onDropFiles={handleDropOnDevice}
                      transferStates={transferStates}
                      isScanning={isScanning}
                      onRefresh={refreshDiscovery}
                    />
                  ) : (
                    <RemoteConnect
                      roomCode={roomCode}
                      isConnected={isRoomConnected}
                      members={roomMembers}
                      onJoinRoom={handleJoinRoom}
                      onCreateRoom={handleCreateRoom}
                      onLeaveRoom={handleLeaveRoom}
                      onCopyCode={handleCopyCode}
                      onShareLink={handleShareLink}
                      error={roomError}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ---- HISTORY ---- */}
            {activePanel === 'history' && (
              <div className={styles.fullPanel}>
                <TransferHistory onStartTransfer={() => setActivePanel('dashboard')} />
              </div>
            )}

            {/* ---- CLIPBOARD ---- */}
            {activePanel === 'clipboard' && (
              <div className={styles.fullPanel}>
                <ClipboardPanel />
              </div>
            )}

            {/* ---- SETTINGS ---- */}
            {activePanel === 'settings' && (
              <div className={styles.fullPanel}>
                <section className={styles.settingsCard} aria-label="Transfer settings">
                  <h2 className={styles.settingsTitle}>Settings</h2>
                  <p className={styles.settingsDescription}>
                    Device name, encryption preferences, and transfer configuration.
                  </p>
                  <div className={styles.settingsForm}>
                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel} htmlFor="device-name">
                        Device Name
                      </label>
                      <input
                        id="device-name"
                        className={styles.settingsInput}
                        type="text"
                        value={settings.deviceName}
                        onChange={(e) => settings.setDeviceName(e.target.value)}
                        autoComplete="off"
                      />
                      <p className={styles.settingsHint}>
                        Visible to other devices on your network.
                      </p>
                    </div>

                    <label className={styles.settingsCheckboxRow} htmlFor="auto-accept">
                      <input
                        id="auto-accept"
                        className={styles.settingsCheckbox}
                        type="checkbox"
                        checked={settings.autoAcceptFromFriends}
                        onChange={(e) => settings.setAutoAcceptFromFriends(e.target.checked)}
                      />
                      <span>Auto-accept from trusted friends</span>
                    </label>

                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel} htmlFor="save-location">
                        Save Location
                      </label>
                      <input
                        id="save-location"
                        className={styles.settingsInput}
                        type="text"
                        value={settings.saveLocation}
                        onChange={(e) => settings.setSaveLocation(e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    <div className={styles.settingsField}>
                      <label className={styles.settingsLabel} htmlFor="max-concurrent">
                        Max Concurrent Transfers
                      </label>
                      <select
                        id="max-concurrent"
                        className={styles.settingsSelect}
                        value={String(settings.maxConcurrentTransfers)}
                        onChange={(e) => {
                          const v = Number.parseInt(e.target.value, 10);
                          if (v === 1 || v === 2 || v === 3 || v === 5) {
                            settings.setMaxConcurrentTransfers(v);
                          }
                        }}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="5">5</option>
                      </select>
                    </div>

                    <div className={styles.settingsGroup}>
                      <p className={styles.settingsGroupTitle}>Connection</p>
                      <label className={styles.settingsCheckboxRow} htmlFor="allow-local">
                        <input
                          id="allow-local"
                          className={styles.settingsCheckbox}
                          type="checkbox"
                          checked={settings.allowLocalDiscovery}
                          onChange={(e) => settings.setAllowLocalDiscovery(e.target.checked)}
                        />
                        <span>Allow local device discovery</span>
                      </label>
                      <label className={styles.settingsCheckboxRow} htmlFor="allow-internet">
                        <input
                          id="allow-internet"
                          className={styles.settingsCheckbox}
                          type="checkbox"
                          checked={settings.allowInternetP2P}
                          onChange={(e) => settings.setAllowInternetP2P(e.target.checked)}
                        />
                        <span>Allow internet P2P transfers</span>
                      </label>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        {/* Mobile tab bar */}
        <MobileTabBar
          activeTab={panelToMobileTab[activePanel]}
          onTabChange={handleMobileTabChange}
          transferCount={activeTransferCount}
        />

        {/* Send confirmation overlay */}
        {sendConfirmation && (
          <SendConfirmation
            deviceName={sendConfirmation.deviceName}
            fileCount={sendConfirmation.files.length}
            totalSize={sendConfirmation.totalSize}
            onConfirm={() => {
              void handleConfirmSend();
            }}
            onCancel={handleCancelSend}
            autoAccept={sendConfirmation.autoAccept}
          />
        )}

        {/* Active transfers bottom sheet */}
        <TransferSheet
          transfers={bottomSheetTransfers}
          onPause={() => {}}
          onResume={() => {}}
          onCancel={() => {}}
        />
      </main>
    </TransferErrorBoundary>
  );
}
