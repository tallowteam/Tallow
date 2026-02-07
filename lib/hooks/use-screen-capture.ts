'use client';

/**
 * @fileoverview React hook wrapper for screen sharing functionality
 * @module hooks/use-screen-capture
 *
 * Thin wrapper around lib/webrtc/screen-sharing.ts ScreenSharingManager
 * Provides React-friendly state management with automatic cleanup.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ScreenSharingManager,
  ScreenShareQuality,
  FrameRate,
  ScreenShareConfig,
  ScreenShareState,
  ScreenShareStats,
  isScreenShareSupported
} from '@/lib/webrtc/screen-sharing';

/**
 * Options for screen capture hook
 */
export interface UseScreenCaptureOptions {
  /** Initial quality preset (default: '1080p') */
  quality?: ScreenShareQuality;
  /** Initial frame rate (default: 30) */
  frameRate?: FrameRate;
  /** Enable audio sharing (default: false) */
  shareAudio?: boolean;
  /** Show cursor in screen share (default: true) */
  shareCursor?: boolean;
  /** Auto-stop when user stops via browser UI (default: true) */
  autoStop?: boolean;
  /** Callback when state changes */
  onStateChange?: (state: ScreenShareState) => void;
  /** Callback when stats update */
  onStatsUpdate?: (stats: ScreenShareStats) => void;
}

/**
 * Custom hook for screen capture/sharing functionality
 *
 * Wraps ScreenSharingManager as a React hook with state management
 * and automatic cleanup on unmount.
 *
 * @param {UseScreenCaptureOptions} options - Configuration options
 * @returns Screen capture state and control methods
 *
 * @example
 * ```tsx
 * const {
 *   isCapturing,
 *   stream,
 *   error,
 *   startCapture,
 *   stopCapture,
 *   updateQuality
 * } = useScreenCapture({
 *   quality: '1080p',
 *   shareAudio: false
 * });
 *
 * // Start capturing
 * await startCapture();
 *
 * // Attach stream to video element
 * if (stream) {
 *   videoRef.current.srcObject = stream;
 * }
 * ```
 */
export function useScreenCapture(options: UseScreenCaptureOptions = {}) {
  const {
    quality = '1080p',
    frameRate = 30,
    shareAudio = false,
    shareCursor = true,
    autoStop = true,
    onStateChange,
    onStatsUpdate
  } = options;

  // Manager instance (persists across renders)
  const managerRef = useRef<ScreenSharingManager | null>(null);

  // React state mirrors the manager state
  const [state, setState] = useState<ScreenShareState>({
    isSharing: false,
    isPaused: false,
    quality,
    frameRate,
    shareAudio,
    streamId: null,
    error: null
  });

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [stats, setStats] = useState<ScreenShareStats | null>(null);
  const [isSupported] = useState(() => isScreenShareSupported());

  // Initialize manager on mount
  useEffect(() => {
    const config: Partial<ScreenShareConfig> = {
      quality,
      frameRate,
      shareAudio,
      shareCursor,
      autoStop
    };

    managerRef.current = new ScreenSharingManager(config);

    // Set up state change callback
    managerRef.current.setStateCallback((newState) => {
      setState(newState);
      onStateChange?.(newState);
    });

    // Set up stats callback
    managerRef.current.setStatsCallback((newStats) => {
      setStats(newStats);
      onStatsUpdate?.(newStats);
    });

    // Cleanup on unmount
    return () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, []); // Only run once on mount

  /**
   * Start screen capture
   */
  const startCapture = useCallback(async (peerConnection?: RTCPeerConnection): Promise<MediaStream | null> => {
    if (!managerRef.current) {
      setState(prev => ({ ...prev, error: 'Manager not initialized' }));
      return null;
    }

    try {
      const capturedStream = await managerRef.current.startSharing(peerConnection);
      setStream(capturedStream);
      return capturedStream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start capture';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  /**
   * Stop screen capture
   */
  const stopCapture = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stopSharing();
      setStream(null);
      setStats(null);
    }
  }, []);

  /**
   * Pause screen capture (mute video)
   */
  const pauseCapture = useCallback(() => {
    managerRef.current?.pauseSharing();
  }, []);

  /**
   * Resume screen capture (unmute video)
   */
  const resumeCapture = useCallback(() => {
    managerRef.current?.resumeSharing();
  }, []);

  /**
   * Switch to different screen/window
   */
  const switchSource = useCallback(async () => {
    if (!managerRef.current) {return;}

    try {
      await managerRef.current.switchSource();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch source';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  /**
   * Update capture quality
   */
  const updateQuality = useCallback(async (newQuality: ScreenShareQuality) => {
    if (!managerRef.current) {return;}

    try {
      await managerRef.current.updateQuality(newQuality);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quality';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  /**
   * Update frame rate
   */
  const updateFrameRate = useCallback(async (fps: FrameRate) => {
    if (!managerRef.current) {return;}

    try {
      await managerRef.current.updateFrameRate(fps);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update frame rate';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  /**
   * Toggle audio sharing
   */
  const toggleAudio = useCallback(async (enabled: boolean) => {
    if (!managerRef.current) {return;}

    try {
      await managerRef.current.toggleAudio(enabled);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle audio';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  /**
   * Mark session as PQC-protected (call after establishing PQC connection)
   */
  const markAsPQCProtected = useCallback(() => {
    managerRef.current?.markAsPQCProtected();
  }, []);

  /**
   * Get PQC protection status
   */
  const getPQCStatus = useCallback(() => {
    return managerRef.current?.getPQCStatus() || {
      protected: false,
      algorithm: null,
      warning: 'Manager not initialized'
    };
  }, []);

  /**
   * Get display media directly (low-level API)
   */
  const getDisplayMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Screen sharing not supported' }));
      return null;
    }

    try {
      const capturedStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: shareAudio
      });
      setStream(capturedStream);
      return capturedStream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get display media';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [isSupported, shareAudio]);

  return {
    // State
    isCapturing: state.isSharing,
    isPaused: state.isPaused,
    stream,
    error: state.error,
    stats,
    quality: state.quality,
    frameRate: state.frameRate,
    shareAudio: state.shareAudio,
    streamId: state.streamId,
    isSupported,

    // Computed
    isActive: state.isSharing && !state.isPaused,

    // Methods
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    switchSource,
    updateQuality,
    updateFrameRate,
    toggleAudio,
    getDisplayMedia,
    markAsPQCProtected,
    getPQCStatus,

    // Access to full state (for advanced use cases)
    fullState: state
  };
}

export default useScreenCapture;
