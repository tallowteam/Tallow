'use client';

/**
 * ScreenShareControls Component
 *
 * Floating control panel for screen sharing with settings and actions.
 * Appears on hover over the screen share preview.
 */

import { useState, useRef, useEffect } from 'react';
import type { ScreenShareQuality } from '@/lib/webrtc/screen-sharing';
import styles from './ScreenShareControls.module.css';

export interface ScreenShareControlsProps {
  /** Whether currently sharing */
  isSharing: boolean;
  /** Whether sharing is paused */
  isPaused: boolean;
  /** Current quality setting */
  quality: ScreenShareQuality;
  /** Whether preview is minimized */
  isMinimized: boolean;
  /** Callback to stop sharing */
  onStop: () => void;
  /** Callback to pause/resume */
  onPauseResume: () => void;
  /** Callback to change quality */
  onQualityChange: (quality: ScreenShareQuality) => void;
  /** Callback to minimize/maximize */
  onMinimize: () => void;
  /** Show all controls (hide some in viewer mode) */
  showFullControls?: boolean;
}

export function ScreenShareControls({
  isSharing: _isSharing,
  isPaused,
  quality,
  isMinimized,
  onStop,
  onPauseResume,
  onQualityChange,
  onMinimize,
  showFullControls = true,
}: ScreenShareControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showSettings]);

  return (
    <div className={styles.container}>
      {/* Main Controls */}
      <div className={styles.toolbar}>
        {/* Pause/Resume */}
        {showFullControls && (
          <button
            onClick={onPauseResume}
            className={styles.controlButton}
            aria-label={isPaused ? 'Resume sharing' : 'Pause sharing'}
            title={isPaused ? 'Resume sharing' : 'Pause sharing'}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </button>
        )}

        {/* Settings */}
        {showFullControls && (
          <div className={styles.settingsWrapper} ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`${styles.controlButton} ${showSettings ? styles.active : ''}`}
              aria-label="Settings"
              aria-expanded={showSettings}
              title="Quality settings"
            >
              <SettingsIcon />
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className={styles.settingsDropdown}>
                <div className={styles.settingsHeader}>
                  <h4 className={styles.settingsTitle}>Quality</h4>
                </div>

                <div className={styles.qualityOptions}>
                  <QualityOption
                    label="Low"
                    description="720p • 15fps"
                    value="720p"
                    selected={quality === '720p'}
                    onClick={() => {
                      onQualityChange('720p');
                      setShowSettings(false);
                    }}
                  />
                  <QualityOption
                    label="Medium"
                    description="1080p • 30fps"
                    value="1080p"
                    selected={quality === '1080p'}
                    onClick={() => {
                      onQualityChange('1080p');
                      setShowSettings(false);
                    }}
                  />
                  <QualityOption
                    label="High"
                    description="4K • 60fps"
                    value="4k"
                    selected={quality === '4k'}
                    onClick={() => {
                      onQualityChange('4k');
                      setShowSettings(false);
                    }}
                  />
                </div>

                <div className={styles.settingsFooter}>
                  <p className={styles.settingsHint}>
                    Higher quality requires more bandwidth
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Minimize/Maximize */}
        <button
          onClick={onMinimize}
          className={styles.controlButton}
          aria-label={isMinimized ? 'Maximize preview' : 'Minimize preview'}
          title={isMinimized ? 'Maximize preview' : 'Minimize preview'}
        >
          {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
        </button>

        {/* Divider */}
        {showFullControls && <div className={styles.divider} />}

        {/* Stop Button */}
        {showFullControls && (
          <button
            onClick={onStop}
            className={`${styles.controlButton} ${styles.stopButton}`}
            aria-label="Stop sharing"
            title="Stop sharing"
          >
            <StopIcon />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Quality Option Component
interface QualityOptionProps {
  label: string;
  description: string;
  value: ScreenShareQuality;
  selected: boolean;
  onClick: () => void;
}

function QualityOption({ label, description, value: _value, selected, onClick }: QualityOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.qualityOption} ${selected ? styles.selected : ''}`}
      aria-label={`${label} quality - ${description}`}
      aria-pressed={selected}
    >
      <div className={styles.qualityOptionContent}>
        <span className={styles.qualityLabel}>{label}</span>
        <span className={styles.qualityDescription}>{description}</span>
      </div>
      {selected && (
        <div className={styles.qualityCheckmark}>
          <CheckIcon />
        </div>
      )}
    </button>
  );
}

// Icons
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m8.66-15l-3 5.2M6.34 17.8l-3 5.2m0-17.8l3 5.2m11.32 7.4l3 5.2M12 12h0" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
