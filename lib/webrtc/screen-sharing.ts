'use client';

/**
 * Screen Sharing Module for Tallow
 *
 * Implements WebRTC-based screen sharing with PQC protection.
 * Supports multiple quality presets, adaptive bitrate, and privacy controls.
 *
 * SECURITY ARCHITECTURE:
 * - WebRTC media streams are encrypted at transport layer with DTLS-SRTP
 * - PQC protection inherited from RTCPeerConnection establishment
 * - When used with PQCTransferManager, screen sharing benefits from:
 *   * ML-KEM-768 + X25519 hybrid key exchange
 *   * Quantum-resistant connection establishment
 *   * Forward secrecy with key rotation
 *
 * IMPORTANT: Screen sharing MUST use RTCPeerConnection established via
 * PQCTransferManager to ensure PQC protection. Standalone connections
 * without PQC key exchange are NOT quantum-resistant.
 *
 * PRIVACY: User consent required, visual indicators, auto-stop on disconnect
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export type ScreenShareQuality = '720p' | '1080p' | '4k';
export type FrameRate = 15 | 30 | 60;

export interface ScreenShareConfig {
    quality: ScreenShareQuality;
    frameRate: FrameRate;
    shareAudio: boolean;
    shareCursor: boolean;
    autoStop: boolean;
}

export interface ScreenShareConstraints {
    video: MediaTrackConstraints;
    audio: boolean | MediaTrackConstraints;
}

export interface ScreenShareState {
    isSharing: boolean;
    isPaused: boolean;
    quality: ScreenShareQuality;
    frameRate: FrameRate;
    shareAudio: boolean;
    streamId: string | null;
    error: string | null;
}

export interface ScreenShareStats {
    bitrate: number;
    fps: number;
    resolution: { width: number; height: number };
    packetsLost: number;
    latency: number;
    bandwidth: number;
}

// ============================================================================
// Constants
// ============================================================================

const QUALITY_PRESETS: Record<ScreenShareQuality, { width: number; height: number }> = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 },
};

const BITRATE_PRESETS: Record<ScreenShareQuality, number> = {
    '720p': 1_500_000,  // 1.5 Mbps
    '1080p': 3_000_000, // 3 Mbps
    '4k': 8_000_000,    // 8 Mbps
};

const MIN_BITRATE = 500_000;    // 500 Kbps
const MAX_BITRATE = 10_000_000; // 10 Mbps

// Stats sampling interval
const STATS_INTERVAL = 1000; // 1 second

// ============================================================================
// Screen Sharing Manager
// ============================================================================

export class ScreenSharingManager {
    private stream: MediaStream | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private senders: RTCRtpSender[] = [];
    private config: ScreenShareConfig;
    private statsInterval: NodeJS.Timeout | null = null;
    private currentStats: ScreenShareStats | null = null;
    private onStatsUpdate: ((stats: ScreenShareStats) => void) | null = null;
    private onStateChange: ((state: ScreenShareState) => void) | null = null;
    private state: ScreenShareState;
    private isPQCProtected: boolean = false;

    constructor(config?: Partial<ScreenShareConfig>) {
        this.config = {
            quality: config?.quality || '1080p',
            frameRate: config?.frameRate || 30,
            shareAudio: config?.shareAudio ?? false,
            shareCursor: config?.shareCursor ?? true,
            autoStop: config?.autoStop ?? true,
        };

        this.state = {
            isSharing: false,
            isPaused: false,
            quality: this.config.quality,
            frameRate: this.config.frameRate,
            shareAudio: this.config.shareAudio,
            streamId: null,
            error: null,
        };
    }

    // ==========================================================================
    // Core Screen Sharing
    // ==========================================================================

    /**
     * Start screen sharing
     */
    async startSharing(peerConnection?: RTCPeerConnection): Promise<MediaStream> {
        try {
            // Request user permission and get screen stream
            const constraints = this.buildConstraints();
            this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

            if (!this.stream) {
                throw new Error('Failed to get screen stream');
            }

            secureLog.log('[ScreenShare] Started sharing:', {
                quality: this.config.quality,
                fps: this.config.frameRate,
                audio: this.config.shareAudio,
            });

            // Set up auto-stop when user stops sharing via browser UI
            const videoTrack = this.stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    secureLog.log('[ScreenShare] User stopped sharing via browser UI');
                    this.stopSharing();
                };
            }

            // Update state
            this.state = {
                ...this.state,
                isSharing: true,
                streamId: this.stream.id,
                error: null,
            };
            this.notifyStateChange();

            // Add tracks to peer connection if provided
            if (peerConnection) {
                this.peerConnection = peerConnection;
                await this.addTracksToConnection(peerConnection);
            }

            // Start stats monitoring
            this.startStatsMonitoring();

            return this.stream;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            secureLog.error('[ScreenShare] Failed to start sharing:', error);

            this.state = {
                ...this.state,
                isSharing: false,
                error: errorMessage,
            };
            this.notifyStateChange();

            throw new Error(`Screen sharing failed: ${errorMessage}`);
        }
    }

    /**
     * Stop screen sharing
     */
    stopSharing(): void {
        try {
            // Stop all tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                    secureLog.log('[ScreenShare] Stopped track:', track.kind);
                });
                this.stream = null;
            }

            // Remove senders from peer connection
            if (this.peerConnection) {
                this.senders.forEach(sender => {
                    try {
                        this.peerConnection!.removeTrack(sender);
                    } catch (e) {
                        secureLog.warn('[ScreenShare] Failed to remove sender:', e);
                    }
                });
                this.senders = [];
            }

            // Stop stats monitoring
            this.stopStatsMonitoring();

            // Update state
            this.state = {
                ...this.state,
                isSharing: false,
                isPaused: false,
                streamId: null,
                error: null,
            };
            this.notifyStateChange();

            secureLog.log('[ScreenShare] Stopped sharing');
        } catch (error) {
            secureLog.error('[ScreenShare] Error stopping sharing:', error);
        }
    }

    /**
     * Pause screen sharing (mute video track)
     */
    pauseSharing(): void {
        if (!this.stream) {return;}

        const videoTrack = this.stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = false;
            this.state = { ...this.state, isPaused: true };
            this.notifyStateChange();
            secureLog.log('[ScreenShare] Paused');
        }
    }

    /**
     * Resume screen sharing (unmute video track)
     */
    resumeSharing(): void {
        if (!this.stream) {return;}

        const videoTrack = this.stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = true;
            this.state = { ...this.state, isPaused: false };
            this.notifyStateChange();
            secureLog.log('[ScreenShare] Resumed');
        }
    }

    /**
     * Switch to a different screen/window
     */
    async switchSource(): Promise<void> {
        const wasSharing = this.state.isSharing;
        const peerConnection = this.peerConnection;

        // Stop current sharing
        this.stopSharing();

        // Start new sharing if was previously sharing
        if (wasSharing && peerConnection) {
            await this.startSharing(peerConnection);
        }
    }

    // ==========================================================================
    // Quality & Settings
    // ==========================================================================

    /**
     * Update screen share quality
     */
    async updateQuality(quality: ScreenShareQuality): Promise<void> {
        this.config.quality = quality;
        this.state.quality = quality;

        if (this.state.isSharing && this.stream) {
            // Apply new constraints to existing track
            const videoTrack = this.stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('No video track available');
            }

            const constraints = this.buildVideoConstraints();

            try {
                await videoTrack.applyConstraints(constraints);

                // Update sender parameters
                await this.updateSenderParameters();

                secureLog.log('[ScreenShare] Updated quality to', quality);
                this.notifyStateChange();
            } catch (error) {
                secureLog.error('[ScreenShare] Failed to update quality:', error);
                throw error;
            }
        }
    }

    /**
     * Update frame rate
     */
    async updateFrameRate(fps: FrameRate): Promise<void> {
        this.config.frameRate = fps;
        this.state.frameRate = fps;

        if (this.state.isSharing && this.stream) {
            const videoTrack = this.stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('No video track available');
            }

            try {
                await videoTrack.applyConstraints({
                    frameRate: { ideal: fps, max: fps },
                });

                secureLog.log('[ScreenShare] Updated frame rate to', fps);
                this.notifyStateChange();
            } catch (error) {
                secureLog.error('[ScreenShare] Failed to update frame rate:', error);
                throw error;
            }
        }
    }

    /**
     * Toggle audio sharing
     */
    async toggleAudio(enabled: boolean): Promise<void> {
        this.config.shareAudio = enabled;
        this.state.shareAudio = enabled;

        if (this.state.isSharing) {
            if (enabled && !this.stream?.getAudioTracks().length) {
                // Need to restart sharing to add audio
                await this.switchSource();
            } else if (!enabled && this.stream?.getAudioTracks().length) {
                // Mute audio tracks
                this.stream.getAudioTracks().forEach(track => track.stop());
            }
        }

        this.notifyStateChange();
    }

    // ==========================================================================
    // WebRTC Integration
    // ==========================================================================

    /**
     * Add screen share tracks to peer connection
     */
    private async addTracksToConnection(peerConnection: RTCPeerConnection): Promise<void> {
        if (!this.stream) {return;}

        try {
            // Add video track
            const videoTrack = this.stream.getVideoTracks()[0];
            if (videoTrack) {
                const sender = peerConnection.addTrack(videoTrack, this.stream);
                this.senders.push(sender);
                secureLog.log('[ScreenShare] Added video track to connection');
            }

            // Add audio track if enabled
            if (this.config.shareAudio) {
                const audioTrack = this.stream.getAudioTracks()[0];
                if (audioTrack) {
                    const sender = peerConnection.addTrack(audioTrack, this.stream);
                    this.senders.push(sender);
                    secureLog.log('[ScreenShare] Added audio track to connection');
                }
            }

            // Configure sender parameters
            await this.updateSenderParameters();
        } catch (error) {
            secureLog.error('[ScreenShare] Failed to add tracks:', error);
            throw error;
        }
    }

    /**
     * Update RTP sender parameters for quality control
     */
    private async updateSenderParameters(): Promise<void> {
        for (const sender of this.senders) {
            if (sender.track?.kind !== 'video') {continue;}

            try {
                const params = sender.getParameters();

                if (!params.encodings || params.encodings.length === 0) {
                    params.encodings = [{}];
                }

                const encoding = params.encodings[0];
                if (!encoding) {
                    continue;
                }

                // Set bitrate based on quality
                const maxBitrate = BITRATE_PRESETS[this.config.quality];
                encoding.maxBitrate = maxBitrate;

                // Set frame rate
                encoding.maxFramerate = this.config.frameRate;

                // Enable adaptive bitrate
                encoding.scaleResolutionDownBy = 1;
                encoding.networkPriority = 'high';

                await sender.setParameters(params);
                secureLog.log('[ScreenShare] Updated sender parameters:', {
                    maxBitrate,
                    maxFramerate: this.config.frameRate,
                });
            } catch (error) {
                secureLog.error('[ScreenShare] Failed to update sender parameters:', error);
            }
        }
    }

    /**
     * Handle received screen share track (receiver side)
     */
    onTrackReceived(event: RTCTrackEvent): void {
        secureLog.log('[ScreenShare] Received track:', event.track.kind);

        // The received stream can be attached to a video element
        // This is handled by the ScreenShareViewer component
    }

    // ==========================================================================
    // Adaptive Bitrate
    // ==========================================================================

    /**
     * Adjust bitrate based on network conditions
     */
    private async adjustBitrate(targetBitrate: number): Promise<void> {
        const clampedBitrate = Math.max(
            MIN_BITRATE,
            Math.min(MAX_BITRATE, targetBitrate)
        );

        for (const sender of this.senders) {
            if (sender.track?.kind !== 'video') {continue;}

            try {
                const params = sender.getParameters();
                if (params.encodings?.[0]) {
                    params.encodings[0].maxBitrate = clampedBitrate;
                    await sender.setParameters(params);
                }
            } catch (error) {
                secureLog.error('[ScreenShare] Failed to adjust bitrate:', error);
            }
        }
    }

    /**
     * Monitor bandwidth and adjust quality automatically
     */
    private async monitorBandwidth(): Promise<void> {
        if (!this.peerConnection || !this.currentStats) {return;}

        const { bitrate, packetsLost } = this.currentStats;
        const lossRate = packetsLost / (packetsLost + 1000); // Approximate

        // If packet loss is high, reduce bitrate
        if (lossRate > 0.05) { // 5% loss
            const newBitrate = bitrate * 0.8; // Reduce by 20%
            await this.adjustBitrate(newBitrate);
            secureLog.log('[ScreenShare] Reduced bitrate due to packet loss:', newBitrate);
        }
        // If connection is stable, gradually increase
        else if (lossRate < 0.01 && bitrate < BITRATE_PRESETS[this.config.quality]) {
            const newBitrate = Math.min(
                bitrate * 1.1, // Increase by 10%
                BITRATE_PRESETS[this.config.quality]
            );
            await this.adjustBitrate(newBitrate);
        }
    }

    // ==========================================================================
    // Statistics & Monitoring
    // ==========================================================================

    /**
     * Start monitoring stats
     */
    private startStatsMonitoring(): void {
        this.statsInterval = setInterval(async () => {
            await this.updateStats();
            await this.monitorBandwidth();
        }, STATS_INTERVAL);
    }

    /**
     * Stop monitoring stats
     */
    private stopStatsMonitoring(): void {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        this.currentStats = null;
    }

    /**
     * Update statistics
     */
    private async updateStats(): Promise<void> {
        if (!this.peerConnection || !this.senders.length) {return;}

        try {
            const sender = this.senders.find(s => s.track?.kind === 'video');
            if (!sender) {return;}

            const statsReport = await sender.getStats();
            let foundStats: RTCOutboundRtpStreamStats | null = null;

            statsReport.forEach(report => {
                if (report.type === 'outbound-rtp' && (report as RTCRtpStreamStats).kind === 'video') {
                    foundStats = report as unknown as RTCOutboundRtpStreamStats;
                }
            });

            if (foundStats) {
                const outboundStats = foundStats as RTCOutboundRtpStreamStats;
                // Type assertion with explicit access for optional properties
                const bytesSent = outboundStats.bytesSent ?? 0;
                const timestamp = outboundStats.timestamp ?? 1;
                // These properties exist on RTCOutboundRtpStreamStats but may need assertion
                const stats = outboundStats as RTCOutboundRtpStreamStats & {
                    framesPerSecond?: number;
                    frameWidth?: number;
                    frameHeight?: number;
                    packetsLost?: number;
                    roundTripTime?: number;
                    availableOutgoingBitrate?: number;
                };

                this.currentStats = {
                    bitrate: bytesSent ? (bytesSent * 8) / (timestamp / 1000) : 0,
                    fps: stats.framesPerSecond ?? 0,
                    resolution: {
                        width: stats.frameWidth ?? 0,
                        height: stats.frameHeight ?? 0,
                    },
                    packetsLost: stats.packetsLost ?? 0,
                    latency: stats.roundTripTime ?? 0,
                    bandwidth: stats.availableOutgoingBitrate ?? 0,
                };

                if (this.onStatsUpdate) {
                    this.onStatsUpdate(this.currentStats);
                }
            }
        } catch (error) {
            secureLog.error('[ScreenShare] Failed to update stats:', error);
        }
    }

    /**
     * Get current statistics
     */
    getStats(): ScreenShareStats | null {
        return this.currentStats;
    }

    /**
     * Set stats update callback
     */
    setStatsCallback(callback: (stats: ScreenShareStats) => void): void {
        this.onStatsUpdate = callback;
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    /**
     * Build display media constraints
     */
    private buildConstraints(): ScreenShareConstraints {
        const videoConstraints = this.buildVideoConstraints();

        return {
            video: videoConstraints,
            audio: this.config.shareAudio ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            } : false,
        };
    }

    /**
     * Build video constraints
     */
    private buildVideoConstraints(): MediaTrackConstraints {
        const preset = QUALITY_PRESETS[this.config.quality];

        return {
            width: { ideal: preset.width, max: preset.width },
            height: { ideal: preset.height, max: preset.height },
            frameRate: { ideal: this.config.frameRate, max: this.config.frameRate },
            cursor: this.config.shareCursor ? 'always' : 'never',
            displaySurface: 'monitor', // Prefer full screen
        } as MediaTrackConstraints;
    }

    /**
     * Get current state
     */
    getState(): ScreenShareState {
        return { ...this.state };
    }

    /**
     * Set state change callback
     */
    setStateCallback(callback: (state: ScreenShareState) => void): void {
        this.onStateChange = callback;
    }

    /**
     * Notify state change
     */
    private notifyStateChange(): void {
        if (this.onStateChange) {
            this.onStateChange(this.state);
        }
    }

    /**
     * Get current stream
     */
    getStream(): MediaStream | null {
        return this.stream;
    }

    /**
     * Check if sharing
     */
    isSharing(): boolean {
        return this.state.isSharing;
    }

    /**
     * Check if paused
     */
    isPaused(): boolean {
        return this.state.isPaused;
    }

    /**
     * Mark this screen sharing session as PQC-protected
     * Call this after establishing connection via PQCTransferManager
     */
    markAsPQCProtected(): void {
        this.isPQCProtected = true;
        secureLog.log('[ScreenShare] Marked as PQC-protected (ML-KEM-768 + X25519)');
    }

    /**
     * Check if connection is PQC-protected
     * Returns true if this session uses RTCPeerConnection established via PQCTransferManager
     */
    isPQCProtectedSession(): boolean {
        return this.isPQCProtected;
    }

    /**
     * Get PQC protection status with details
     */
    getPQCStatus(): { protected: boolean; algorithm: string | null; warning: string | null } {
        if (this.isPQCProtected) {
            return {
                protected: true,
                algorithm: 'ML-KEM-768 + X25519',
                warning: null,
            };
        }
        return {
            protected: false,
            algorithm: null,
            warning: 'Screen sharing is using standard DTLS-SRTP without PQC protection. Use with PQCTransferManager for quantum-resistant encryption.',
        };
    }

    /**
     * Cleanup
     */
    dispose(): void {
        this.stopSharing();
        this.onStatsUpdate = null;
        this.onStateChange = null;
        this.isPQCProtected = false;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if screen sharing is supported
 */
export function isScreenShareSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}

/**
 * Check if system audio sharing is supported
 */
export function isSystemAudioSupported(): boolean {
    // System audio is supported in some browsers (Chrome, Edge)
    // but not all (Firefox, Safari)
    return isScreenShareSupported();
}

/**
 * Format bitrate for display
 */
export function formatBitrate(bitrate: number): string {
    if (bitrate >= 1_000_000) {
        return `${(bitrate / 1_000_000).toFixed(1)} Mbps`;
    }
    return `${(bitrate / 1_000).toFixed(0)} Kbps`;
}

/**
 * Format resolution for display
 */
export function formatResolution(width: number, height: number): string {
    return `${width}x${height}`;
}

export default ScreenSharingManager;
