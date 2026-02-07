'use client';

/**
 * ScreenShare Example/Demo Component
 *
 * Demonstrates how to use the ScreenShare component in different modes:
 * - Sender mode: Share your screen
 * - Receiver mode: View someone else's screen share
 * - With WebRTC peer connection for actual transmission
 */

import { useState } from 'react';
import { ScreenShare } from './ScreenShare';
import type { ScreenShareState } from './ScreenShare';
import styles from './ScreenShareExample.module.css';

export function ScreenShareExample() {
  const [mode, setMode] = useState<'sender' | 'receiver'>('sender');
  const [currentState, setCurrentState] = useState<ScreenShareState>('idle');
  const [peerConnection] = useState<RTCPeerConnection | undefined>(undefined);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Screen Share Demo</h2>
        <p className={styles.description}>
          Share your screen with quantum-resistant encryption or view incoming screen shares.
        </p>

        {/* Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            onClick={() => setMode('sender')}
            className={`${styles.modeButton} ${mode === 'sender' ? styles.active : ''}`}
            aria-pressed={mode === 'sender'}
          >
            <MonitorIcon />
            <span>Share Screen</span>
          </button>
          <button
            onClick={() => setMode('receiver')}
            className={`${styles.modeButton} ${mode === 'receiver' ? styles.active : ''}`}
            aria-pressed={mode === 'receiver'}
          >
            <EyeIcon />
            <span>View Screen</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className={styles.statusBadge}>
          <StatusIndicator state={currentState} />
        </div>
      </div>

      {/* Screen Share Component */}
      <div className={styles.screenShareWrapper}>
        {mode === 'sender' ? (
          <ScreenShare
            {...(peerConnection ? { peerConnection } : {})}
            onSharingStart={() => console.log('Screen sharing started')}
            onSharingStop={() => console.log('Screen sharing stopped')}
            onStateChange={setCurrentState}
            initialQuality="1080p"
            enableAudio={false}
          />
        ) : (
          <ScreenShare
            receiverMode={true}
            remoteStream={null} // Would be set from WebRTC connection
            sourceName="Remote User's Screen"
            onStateChange={setCurrentState}
          />
        )}
      </div>

      {/* Information Panel */}
      <div className={styles.infoPanel}>
        <InfoCard
          icon={<ShieldIcon />}
          title="Quantum-Resistant Encryption"
          description="Screen shares are protected with ML-KEM-768 + X25519 hybrid encryption"
        />
        <InfoCard
          icon={<ZapIcon />}
          title="Adaptive Quality"
          description="Automatically adjusts quality based on network conditions"
        />
        <InfoCard
          icon={<LockIcon />}
          title="Privacy First"
          description="No recording, no cloud storage. Direct peer-to-peer streaming only"
        />
      </div>

      {/* Integration Example */}
      <div className={styles.codeExample}>
        <h3 className={styles.codeTitle}>Integration Example</h3>
        <pre className={styles.code}>
          {`import { ScreenShare } from '@/components/transfer/ScreenShare';

// Sender mode
<ScreenShare
  peerConnection={rtcConnection}
  onSharingStart={() => console.log('Started')}
  onSharingStop={() => console.log('Stopped')}
  initialQuality="1080p"
  enableAudio={false}
/>

// Receiver mode
<ScreenShare
  receiverMode={true}
  remoteStream={incomingStream}
  sourceName="Remote User"
/>`}
        </pre>
      </div>
    </div>
  );
}

// Status Indicator Component
function StatusIndicator({ state }: { state: ScreenShareState }) {
  const statusConfig = {
    idle: { label: 'Ready', color: '#a1a1a1' },
    'requesting-permission': { label: 'Requesting Permission', color: '#f5a623' },
    sharing: { label: 'Sharing', color: '#ee0000' },
    viewing: { label: 'Viewing', color: '#0cce6b' },
    error: { label: 'Error', color: '#ee0000' },
  };

  const { label, color } = statusConfig[state];

  return (
    <div className={styles.statusIndicator}>
      <div className={styles.statusDot} style={{ backgroundColor: color }} />
      <span className={styles.statusLabel}>{label}</span>
    </div>
  );
}

// Info Card Component
interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoIcon}>{icon}</div>
      <h4 className={styles.infoTitle}>{title}</h4>
      <p className={styles.infoDescription}>{description}</p>
    </div>
  );
}

// Icons
function MonitorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
