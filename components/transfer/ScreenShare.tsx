'use client';

/**
 * ScreenShare Component
 *
 * Main screen sharing component with controls, preview panel, and status indicators.
 * Supports both sender (sharing) and receiver (viewing) modes.
 *
 * States:
 * - idle: Not sharing, ready to start
 * - requesting-permission: Browser permission dialog shown
 * - sharing: Currently sharing screen
 * - viewing: Viewing someone else's screen share
 * - error: Permission denied or other error
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useScreenCapture } from '@/lib/hooks/use-screen-capture';
import type { ScreenShareQuality } from '@/lib/webrtc/screen-sharing';
import { ScreenShareControls } from './ScreenShareControls';
import styles from './ScreenShare.module.css';

export type ScreenShareState = 'idle' | 'requesting-permission' | 'sharing' | 'viewing' | 'error';

export interface ScreenShareProps {
  /** Optional peer connection for WebRTC streaming */
  peerConnection?: RTCPeerConnection;
  /** Callback when sharing starts */
  onSharingStart?: () => void;
  /** Callback when sharing stops */
  onSharingStop?: () => void;
  /** Callback when state changes */
  onStateChange?: (state: ScreenShareState) => void;
  /** Initial quality preset */
  initialQuality?: ScreenShareQuality;
  /** Enable audio sharing */
  enableAudio?: boolean;
  /** Receiver mode: viewing someone else's screen */
  receiverMode?: boolean;
  /** Stream to display (in receiver mode) */
  remoteStream?: MediaStream | null;
  /** Name of the sharing source */
  sourceName?: string;
}

export function ScreenShare({
  peerConnection,
  onSharingStart,
  onSharingStop,
  onStateChange,
  initialQuality = '1080p',
  enableAudio = false,
  receiverMode = false,
  remoteStream = null,
  sourceName = 'Entire Screen',
}: ScreenShareProps) {
  const [componentState, setComponentState] = useState<ScreenShareState>(
    receiverMode ? 'viewing' : 'idle'
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [displayedSourceName, setDisplayedSourceName] = useState(sourceName);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isPaused,
    stream,
    error,
    stats,
    quality,
    isSupported,
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    updateQuality,
    markAsPQCProtected,
  } = useScreenCapture({
    quality: initialQuality,
    shareAudio: enableAudio,
    onStateChange: (state) => {
      if (state.isSharing) {
        setComponentState('sharing');
      } else if (state.error) {
        setComponentState('error');
      } else {
        setComponentState('idle');
      }
    },
  });

  // Update component state when it changes
  useEffect(() => {
    onStateChange?.(componentState);
  }, [componentState, onStateChange]);

  // Handle starting screen capture
  const handleStart = useCallback(async () => {
    if (!isSupported) {
      setComponentState('error');
      return;
    }

    setComponentState('requesting-permission');

    try {
      const capturedStream = await startCapture(peerConnection);

      if (capturedStream) {
        onSharingStart?.();
        setComponentState('sharing');

        // Mark as PQC protected if using peer connection
        if (peerConnection) {
          markAsPQCProtected();
        }

        // Extract source name from track label
        const videoTrack = capturedStream.getVideoTracks()[0];
        if (videoTrack?.label) {
          setDisplayedSourceName(videoTrack.label);
        }
      } else {
        setComponentState('error');
      }
    } catch (err) {
      console.error('[ScreenShare] Failed to start:', err);
      setComponentState('error');
    }
  }, [isSupported, startCapture, peerConnection, onSharingStart, markAsPQCProtected]);

  // Handle stopping screen capture
  const handleStop = useCallback(() => {
    stopCapture();
    setComponentState('idle');
    onSharingStop?.();
    setIsMinimized(false);
  }, [stopCapture, onSharingStop]);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeCapture();
    } else {
      pauseCapture();
    }
  }, [isPaused, pauseCapture, resumeCapture]);

  // Attach stream to video element
  useEffect(() => {
    if (!videoRef.current) return;

    const displayStream = receiverMode ? remoteStream : stream;

    if (displayStream) {
      videoRef.current.srcObject = displayStream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream, remoteStream, receiverMode]);

  // Auto-hide controls after inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  // Render based on current state
  if (!receiverMode && componentState === 'idle') {
    return (
      <div className={styles.idleState}>
        <button
          onClick={handleStart}
          className={styles.startButton}
          disabled={!isSupported}
          aria-label="Share screen"
        >
          <MonitorIcon />
          <span>Share Screen</span>
        </button>

        {!isSupported && (
          <p className={styles.unsupportedMessage}>
            Screen sharing is not supported in this browser
          </p>
        )}
      </div>
    );
  }

  if (componentState === 'error') {
    return (
      <div className={styles.errorState}>
        <ErrorIcon />
        <h3 className={styles.errorTitle}>Screen Sharing Failed</h3>
        <p className={styles.errorMessage}>
          {error || 'Permission denied or screen sharing is not available'}
        </p>
        <button onClick={handleStart} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (componentState === 'requesting-permission') {
    return (
      <div className={styles.requestingState}>
        <div className={styles.spinner} />
        <p className={styles.requestingMessage}>
          Select a screen, window, or tab to share...
        </p>
      </div>
    );
  }

  // Sharing or viewing mode
  const isActive = componentState === 'sharing' || componentState === 'viewing';

  return (
    <div
      className={`${styles.container} ${isMinimized ? styles.minimized : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Preview/Display */}
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!receiverMode} // Mute own screen share, not remote
          className={styles.video}
          aria-label={receiverMode ? 'Remote screen share' : 'Screen share preview'}
        />

        {/* Recording Indicator */}
        {componentState === 'sharing' && !isMinimized && (
          <div className={styles.recordingIndicator}>
            <div className={styles.recordingDot} />
            <span>Sharing</span>
          </div>
        )}

        {/* Status Information */}
        <div className={styles.statusBar}>
          <div className={styles.statusLeft}>
            <span className={styles.statusLabel}>
              {receiverMode ? 'Viewing' : 'Sharing'}: {displayedSourceName}
            </span>
          </div>

          {stats && !receiverMode && (
            <div className={styles.statusRight}>
              <ConnectionQualityIndicator
                fps={stats.fps}
                resolution={stats.resolution}
                bitrate={stats.bitrate}
              />
            </div>
          )}
        </div>

        {/* Paused Overlay */}
        {isPaused && !receiverMode && (
          <div className={styles.pausedOverlay}>
            <PauseIcon />
            <span>Screen sharing paused</span>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      {isActive && (
        <div className={`${styles.controlsWrapper} ${showControls ? styles.controlsVisible : ''}`}>
          <ScreenShareControls
            isSharing={componentState === 'sharing'}
            isPaused={isPaused}
            quality={quality}
            isMinimized={isMinimized}
            onStop={handleStop}
            onPauseResume={handlePauseResume}
            onQualityChange={updateQuality}
            onMinimize={() => setIsMinimized(!isMinimized)}
            showFullControls={!receiverMode}
          />
        </div>
      )}
    </div>
  );
}

// Connection Quality Indicator
interface ConnectionQualityIndicatorProps {
  fps: number;
  resolution: { width: number; height: number };
  bitrate: number;
}

function ConnectionQualityIndicator({ fps, resolution, bitrate }: ConnectionQualityIndicatorProps) {
  // Determine quality level based on metrics
  const getQualityLevel = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (fps >= 30 && bitrate > 2_000_000) return 'excellent';
    if (fps >= 20 && bitrate > 1_000_000) return 'good';
    if (fps >= 15 && bitrate > 500_000) return 'fair';
    return 'poor';
  };

  const quality = getQualityLevel();
  const qualityColors = {
    excellent: '#0cce6b',
    good: '#5E5CE6',
    fair: '#f5a623',
    poor: '#ee0000',
  };

  return (
    <div className={styles.qualityIndicator}>
      <div
        className={styles.qualityDot}
        style={{ backgroundColor: qualityColors[quality] }}
        aria-label={`Connection quality: ${quality}`}
      />
      <span className={styles.qualityText}>
        {resolution.width}x{resolution.height} @ {fps}fps
      </span>
    </div>
  );
}

// Icons
function MonitorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
