'use client';

import React, { useState, useCallback, Component, ReactNode } from 'react';
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

interface TransferErrorBoundaryProps {
  children: ReactNode;
}

interface TransferErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TransferErrorBoundary extends Component<TransferErrorBoundaryProps, TransferErrorBoundaryState> {
  constructor(props: TransferErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TransferErrorBoundaryState {
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
        <div className={styles.page} data-transfer-page role="region" aria-label="Transfer error">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'var(--danger, #ef4444)', marginBottom: '1.5rem' }}
            >
              <path
                d="M32 16v20M32 42v2"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" />
            </svg>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
              The transfer interface encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function TransferPage() {
  const [mode, setMode] = useState<TransferMode | null>(null);
  const [activePanel, setActivePanel] = useState<PanelView>('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [, setFileQueue] = useState<File[]>([]);
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
      <TransferErrorBoundary>
        <main className={styles.page} data-transfer-page>
          <ModeSelector onSelectMode={handleSelectMode} />
          <div className={styles.backgroundGlow} aria-hidden="true" />
        </main>
      </TransferErrorBoundary>
    );
  }

  // Dashboard view with sidebar
  return (
    <TransferErrorBoundary>
      <main className={styles.page} data-transfer-page>
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

        {/* Incoming transfer modal — only mount when active */}
        {showIncoming && (
          <IncomingModal
            isOpen={showIncoming}
            senderName="Silent Falcon"
            fileName="report.pdf"
            fileSize="12 MB"
            onAccept={() => setShowIncoming(false)}
            onDecline={() => setShowIncoming(false)}
          />
        )}

        <div className={styles.backgroundGlow} aria-hidden="true" />
      </main>
    </TransferErrorBoundary>
  );
}
