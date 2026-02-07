'use client';

import { useState, useCallback } from 'react';
import ModeSelector from '@/components/transfer/ModeSelector';
import Sidebar from '@/components/transfer/Sidebar';
import { Dashboard } from '@/components/transfer/Dashboard';
import { DropZone } from '@/components/transfer/DropZone';
import DeviceList from '@/components/transfer/DeviceList';
import ShareCard from '@/components/transfer/ShareCard';
import { TransferProgress } from '@/components/transfer/TransferProgress';
import { TransferHistory } from '@/components/transfer/TransferHistory';
import { IncomingModal } from '@/components/transfer/IncomingModal';
import styles from './page.module.css';

type TransferMode = 'local' | 'internet' | 'friends';
type PanelView = 'dashboard' | 'history' | 'statistics' | 'notifications' | 'settings';

export default function TransferPage() {
  const [mode, setMode] = useState<TransferMode | null>(null);
  const [activePanel, setActivePanel] = useState<PanelView>('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [showIncoming, setShowIncoming] = useState(false);

  const handleSelectMode = useCallback((selected: TransferMode) => {
    setMode(selected);
    setActivePanel('dashboard');
    setSelectedDevice(null);
  }, []);

  const handleModeChange = useCallback((newMode: TransferMode) => {
    setMode(newMode);
    setSelectedDevice(null);
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    setFileQueue(prev => [...prev, ...files]);
  }, []);

  const handleSelectDevice = useCallback((deviceId: string) => {
    setSelectedDevice(deviceId);
  }, []);

  // Mode selection screen
  if (!mode) {
    return (
      <main className={styles.page}>
        <ModeSelector onSelectMode={handleSelectMode} />
        <div className={styles.backgroundGlow} aria-hidden="true" />
      </main>
    );
  }

  // Dashboard view with sidebar
  return (
    <main className={styles.page}>
      <div className={styles.appLayout}>
        <Sidebar
          activeMode={mode}
          activePanel={activePanel}
          onModeChange={handleModeChange}
          onPanelChange={(panel) => setActivePanel(panel as PanelView)}
        />

        <div className={styles.mainContent}>
          {activePanel === 'dashboard' && (
            <Dashboard mode={mode}>
              {/* Top row: Drop Zone + Devices/Share */}
              <div className={styles.topRow}>
                <div className={styles.dropZoneCol}>
                  <DropZone
                    onFilesSelected={handleFilesSelected}
                    selectedDevice={selectedDevice}
                  />
                </div>
                <div className={styles.devicesCol}>
                  {mode === 'internet' ? (
                    <ShareCard />
                  ) : (
                    <DeviceList
                      mode={mode}
                      selectedDevice={selectedDevice}
                      onSelectDevice={handleSelectDevice}
                    />
                  )}
                </div>
              </div>

              {/* Bottom row: Active Transfers + History */}
              <div className={styles.bottomRow}>
                <div className={styles.transfersCol}>
                  <TransferProgress />
                </div>
                <div className={styles.historyCol}>
                  <TransferHistory />
                </div>
              </div>
            </Dashboard>
          )}

          {activePanel === 'history' && (
            <div className={styles.fullPanel}>
              <TransferHistory />
            </div>
          )}

          {activePanel === 'statistics' && (
            <div className={styles.fullPanel}>
              <div className={styles.placeholderPanel}>
                <h2 className={styles.placeholderTitle}>Statistics</h2>
                <p className={styles.placeholderText}>Transfer analytics and usage stats will appear here.</p>
              </div>
            </div>
          )}

          {activePanel === 'notifications' && (
            <div className={styles.fullPanel}>
              <div className={styles.placeholderPanel}>
                <h2 className={styles.placeholderTitle}>Notifications</h2>
                <p className={styles.placeholderText}>Transfer alerts and activity notifications will appear here.</p>
              </div>
            </div>
          )}

          {activePanel === 'settings' && (
            <div className={styles.fullPanel}>
              <div className={styles.placeholderPanel}>
                <h2 className={styles.placeholderTitle}>Settings</h2>
                <p className={styles.placeholderText}>Device name, encryption preferences, and transfer configuration.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incoming transfer modal */}
      <IncomingModal
        isOpen={showIncoming}
        senderName="Silent Falcon"
        fileName="report.pdf"
        fileSize="12 MB"
        onAccept={() => setShowIncoming(false)}
        onDecline={() => setShowIncoming(false)}
      />

      <div className={styles.backgroundGlow} aria-hidden="true" />
    </main>
  );
}
