'use client';

/**
 * useScreenShare Hook
 *
 * React hook for managing screen sharing in Tallow.
 * Provides easy-to-use interface for screen sharing with quality controls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    ScreenSharingManager,
    ScreenShareQuality,
    FrameRate,
    ScreenShareState,
    ScreenShareStats,
    ScreenShareConfig,
} from '../webrtc/screen-sharing';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseScreenShareResult {
    // State
    state: ScreenShareState;
    stats: ScreenShareStats | null;
    stream: MediaStream | null;

    // Actions
    startSharing: (peerConnection?: RTCPeerConnection) => Promise<void>;
    stopSharing: () => void;
    pauseSharing: () => void;
    resumeSharing: () => void;
    switchSource: () => Promise<void>;

    // Settings
    updateQuality: (quality: ScreenShareQuality) => Promise<void>;
    updateFrameRate: (fps: FrameRate) => Promise<void>;
    toggleAudio: (enabled: boolean) => Promise<void>;

    // Manager instance (for advanced use)
    manager: ScreenSharingManager | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useScreenShare(config?: Partial<ScreenShareConfig>): UseScreenShareResult {
    const managerRef = useRef<ScreenSharingManager | null>(null);
    const [state, setState] = useState<ScreenShareState>({
        isSharing: false,
        isPaused: false,
        quality: config?.quality || '1080p',
        frameRate: config?.frameRate || 30,
        shareAudio: config?.shareAudio ?? false,
        streamId: null,
        error: null,
    });
    const [stats, setStats] = useState<ScreenShareStats | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Initialize manager
    useEffect(() => {
        if (!managerRef.current) {
            managerRef.current = new ScreenSharingManager(config);

            // Set up callbacks
            managerRef.current.setStateCallback((newState) => {
                setState(newState);
            });

            managerRef.current.setStatsCallback((newStats) => {
                setStats(newStats);
            });
        }

        return () => {
            if (managerRef.current) {
                managerRef.current.dispose();
                managerRef.current = null;
            }
        };
    }, []);

    // Start sharing
    const startSharing = useCallback(async (peerConnection?: RTCPeerConnection) => {
        if (!managerRef.current) {
            throw new Error('Screen sharing manager not initialized');
        }

        try {
            const mediaStream = await managerRef.current.startSharing(peerConnection);
            setStream(mediaStream);
        } catch (error) {
            secureLog.error('[useScreenShare] Failed to start sharing:', error);
            throw error;
        }
    }, []);

    // Stop sharing
    const stopSharing = useCallback(() => {
        if (!managerRef.current) {return;}

        managerRef.current.stopSharing();
        setStream(null);
        setStats(null);
    }, []);

    // Pause sharing
    const pauseSharing = useCallback(() => {
        if (!managerRef.current) {return;}
        managerRef.current.pauseSharing();
    }, []);

    // Resume sharing
    const resumeSharing = useCallback(() => {
        if (!managerRef.current) {return;}
        managerRef.current.resumeSharing();
    }, []);

    // Switch source
    const switchSource = useCallback(async () => {
        if (!managerRef.current) {return;}

        try {
            await managerRef.current.switchSource();
            const newStream = managerRef.current.getStream();
            setStream(newStream);
        } catch (error) {
            secureLog.error('[useScreenShare] Failed to switch source:', error);
            throw error;
        }
    }, []);

    // Update quality
    const updateQuality = useCallback(async (quality: ScreenShareQuality) => {
        if (!managerRef.current) {return;}

        try {
            await managerRef.current.updateQuality(quality);
        } catch (error) {
            secureLog.error('[useScreenShare] Failed to update quality:', error);
            throw error;
        }
    }, []);

    // Update frame rate
    const updateFrameRate = useCallback(async (fps: FrameRate) => {
        if (!managerRef.current) {return;}

        try {
            await managerRef.current.updateFrameRate(fps);
        } catch (error) {
            secureLog.error('[useScreenShare] Failed to update frame rate:', error);
            throw error;
        }
    }, []);

    // Toggle audio
    const toggleAudio = useCallback(async (enabled: boolean) => {
        if (!managerRef.current) {return;}

        try {
            await managerRef.current.toggleAudio(enabled);
        } catch (error) {
            secureLog.error('[useScreenShare] Failed to toggle audio:', error);
            throw error;
        }
    }, []);

    return {
        state,
        stats,
        stream,
        startSharing,
        stopSharing,
        pauseSharing,
        resumeSharing,
        switchSource,
        updateQuality,
        updateFrameRate,
        toggleAudio,
        manager: managerRef.current,
    };
}

export default useScreenShare;
