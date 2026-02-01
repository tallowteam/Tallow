'use client';

/**
 * useScreenCapture Hook
 *
 * Low-level hook for screen capture using getDisplayMedia API.
 * Provides direct access to screen capture without WebRTC integration.
 */

import { useState, useCallback, useRef } from 'react';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ScreenCaptureOptions {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
    preferCurrentTab?: boolean;
    systemAudio?: 'include' | 'exclude';
    surfaceType?: 'monitor' | 'window' | 'browser';
}

export interface ScreenCaptureState {
    isCapturing: boolean;
    error: string | null;
    streamId: string | null;
}

export interface UseScreenCaptureResult {
    state: ScreenCaptureState;
    stream: MediaStream | null;
    startCapture: (options?: ScreenCaptureOptions) => Promise<MediaStream>;
    stopCapture: () => void;
    switchCapture: (options?: ScreenCaptureOptions) => Promise<MediaStream>;
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: ScreenCaptureOptions = {
    video: {
        cursor: 'always',
        displaySurface: 'monitor',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
    } as MediaTrackConstraints,
    audio: false,
    preferCurrentTab: false,
    systemAudio: 'exclude',
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useScreenCapture(): UseScreenCaptureResult {
    const [state, setState] = useState<ScreenCaptureState>({
        isCapturing: false,
        error: null,
        streamId: null,
    });
    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    /**
     * Start screen capture
     */
    const startCapture = useCallback(async (options: ScreenCaptureOptions = {}): Promise<MediaStream> => {
        try {
            // Check browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('Screen capture is not supported in this browser');
            }

            // Merge with default options
            const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

            // Build constraints
            const constraints = {
                ...(mergedOptions.video !== undefined ? { video: mergedOptions.video } : {}),
                ...(mergedOptions.audio !== undefined ? { audio: mergedOptions.audio } : {}),
            };

            // Add preferCurrentTab if supported (Chrome)
            if (mergedOptions.preferCurrentTab && 'preferCurrentTab' in constraints) {
                (constraints as any).preferCurrentTab = true;
            }

            // Add systemAudio if supported (Chrome, Edge)
            if (mergedOptions.systemAudio === 'include' && 'systemAudio' in constraints) {
                (constraints as any).systemAudio = 'include';
            }

            // Request screen capture
            const mediaStream = await navigator.mediaDevices.getDisplayMedia(constraints);

            if (!mediaStream) {
                throw new Error('Failed to get display media stream');
            }

            // Store stream reference
            streamRef.current = mediaStream;
            setStream(mediaStream);

            // Set up track end handler
            const videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    secureLog.log('[ScreenCapture] User stopped sharing via browser UI');
                    stopCapture();
                };
            }

            // Update state
            setState({
                isCapturing: true,
                error: null,
                streamId: mediaStream.id,
            });

            secureLog.log('[ScreenCapture] Started capture:', {
                videoTracks: mediaStream.getVideoTracks().length,
                audioTracks: mediaStream.getAudioTracks().length,
                streamId: mediaStream.id,
            });

            return mediaStream;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            secureLog.error('[ScreenCapture] Failed to start capture:', error);

            setState({
                isCapturing: false,
                error: errorMessage,
                streamId: null,
            });

            // Handle specific errors
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    throw new Error('Screen capture permission denied');
                } else if (error.name === 'NotFoundError') {
                    throw new Error('No screen capture source found');
                } else if (error.name === 'NotSupportedError') {
                    throw new Error('Screen capture is not supported');
                }
            }

            throw error;
        }
    }, []);

    /**
     * Stop screen capture
     */
    const stopCapture = useCallback(() => {
        if (streamRef.current) {
            // Stop all tracks
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                secureLog.log('[ScreenCapture] Stopped track:', track.kind);
            });

            streamRef.current = null;
            setStream(null);
        }

        setState({
            isCapturing: false,
            error: null,
            streamId: null,
        });

        secureLog.log('[ScreenCapture] Stopped capture');
    }, []);

    /**
     * Switch to a different capture source
     */
    const switchCapture = useCallback(async (options?: ScreenCaptureOptions): Promise<MediaStream> => {
        // Stop current capture
        stopCapture();

        // Start new capture
        return await startCapture(options);
    }, [startCapture, stopCapture]);

    return {
        state,
        stream,
        startCapture,
        stopCapture,
        switchCapture,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if screen capture is supported
 */
export function isScreenCaptureSupported(): boolean {
    return !!(
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getDisplayMedia === 'function'
    );
}

/**
 * Check if system audio capture is supported
 */
export function isSystemAudioSupported(): boolean {
    // System audio is supported in Chrome and Edge
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    return isChrome || isEdge;
}

/**
 * Get supported display surfaces
 */
export function getSupportedSurfaces(): string[] {
    const surfaces: string[] = ['monitor', 'window', 'browser'];

    // Check if preferCurrentTab is supported
    if ('preferCurrentTab' in navigator.mediaDevices) {
        surfaces.push('current-tab');
    }

    return surfaces;
}

/**
 * Get screen capture capabilities
 */
export async function getScreenCaptureCapabilities(): Promise<{
    supported: boolean;
    systemAudio: boolean;
    surfaces: string[];
}> {
    return {
        supported: isScreenCaptureSupported(),
        systemAudio: isSystemAudioSupported(),
        surfaces: getSupportedSurfaces(),
    };
}

export default useScreenCapture;
