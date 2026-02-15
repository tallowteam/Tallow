'use client';

/**
 * Adaptive Bitrate Transfer System
 * Dynamically adjusts transfer parameters based on real-time network conditions
 * to maintain optimal performance without overwhelming the connection.
 */

import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// BANDWIDTH TARGETS (AGENT 021 - WEBRTC-CONDUIT)
// These are governance-enforced throughput targets. Do not lower without
// updating docs/governance/WEBRTC_CONDUIT_POLICY.md.
// ============================================================================

/** Target throughput for LAN transfers: 100 MB/s (bytes per second) */
export const BANDWIDTH_TARGET_LAN = 100 * 1024 * 1024;

/** Target throughput for internet transfers: 10 MB/s (bytes per second) */
export const BANDWIDTH_TARGET_INTERNET = 10 * 1024 * 1024;

/** Target throughput for LAN Gigabit Ethernet: 62 MB/s (bytes per second) */
export const BANDWIDTH_TARGET_LAN_GIGABIT = 62 * 1024 * 1024;

/** Target throughput for LAN WiFi 6: 25 MB/s (bytes per second) */
export const BANDWIDTH_TARGET_LAN_WIFI6 = 25 * 1024 * 1024;

// ============================================================================
// BACKPRESSURE THRESHOLDS (AGENT 021 - WEBRTC-CONDUIT)
// ============================================================================

/** High water mark: pause sending when buffer exceeds this (16 MB) */
export const BACKPRESSURE_HIGH_WATER_MARK = 16 * 1024 * 1024;

/** Low water mark: resume sending when buffer drains below this (4 MB) */
export const BACKPRESSURE_LOW_WATER_MARK = 4 * 1024 * 1024;

// Chunk size options (bytes)
const CHUNK_SIZES = {
    TINY: 16 * 1024,     // 16KB - for very poor connections
    SMALL: 32 * 1024,    // 32KB - for poor connections
    DEFAULT: 64 * 1024,  // 64KB - WebRTC optimal
    MEDIUM: 128 * 1024,  // 128KB - for good connections
    LARGE: 256 * 1024,   // 256KB - for very good connections
    XLARGE: 512 * 1024,  // 512KB - for excellent connections
    LAN: 1024 * 1024,    // 1MB - for local network
    LAN_FAST: 4 * 1024 * 1024, // 4MB - for gigabit LAN
};

export interface TransferMetrics {
    timestamp: number;
    bytesTransferred: number;
    chunksSent: number;
    chunksAcked: number;
    rtt: number;           // Round-trip time in ms
    packetLoss: number;    // Loss rate (0-1)
    jitter: number;        // RTT variance in ms
    bufferLevel: number;   // Buffer usage (0-1)
}

export interface AdaptiveConfig {
    currentChunkSize: number;
    targetBitrate: number;     // Target bytes/second
    maxBitrate: number;        // Maximum allowed bytes/second
    minBitrate: number;        // Minimum allowed bytes/second
    concurrency: number;       // Parallel chunk count
    mode: 'aggressive' | 'balanced' | 'conservative';
    isLAN: boolean;
}

interface MetricWindow {
    metrics: TransferMetrics[];
    windowSize: number;
    startTime: number;
}

/**
 * Adaptive Bitrate Controller
 * Implements AIMD-like congestion control with network-aware optimizations
 */
export class AdaptiveBitrateController {
    private config: AdaptiveConfig;
    private metricWindow: MetricWindow;
    private lastAdjustment: number = 0;
    private consecutiveGoodPeriods: number = 0;
    private consecutiveBadPeriods: number = 0;
    private baseRTT: number = 0;
    private onConfigChange?: (config: AdaptiveConfig) => void;

    constructor(isLAN: boolean = false, mode: 'aggressive' | 'balanced' | 'conservative' = 'balanced') {
        const baseChunkSize = isLAN ? CHUNK_SIZES.LAN : CHUNK_SIZES.DEFAULT;
        const baseBitrate = isLAN ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB/s LAN, 5MB/s internet

        this.config = {
            currentChunkSize: baseChunkSize,
            targetBitrate: baseBitrate,
            maxBitrate: isLAN ? 1000 * 1024 * 1024 : 50 * 1024 * 1024, // 1GB/s LAN, 50MB/s internet
            minBitrate: 64 * 1024, // 64KB/s minimum
            concurrency: isLAN ? 8 : 3,
            mode,
            isLAN,
        };

        this.metricWindow = {
            metrics: [],
            windowSize: 50, // Keep last 50 samples
            startTime: Date.now(),
        };
    }

    /**
     * Register callback for config changes
     */
    onUpdate(callback: (config: AdaptiveConfig) => void): void {
        this.onConfigChange = callback;
    }

    /**
     * Report transfer metrics for adaptation
     */
    reportMetrics(metrics: TransferMetrics): void {
        // Add to window
        this.metricWindow.metrics.push(metrics);

        // Trim old metrics
        if (this.metricWindow.metrics.length > this.metricWindow.windowSize) {
            this.metricWindow.metrics.shift();
        }

        // Establish baseline RTT
        if (this.baseRTT === 0 && metrics.rtt > 0) {
            this.baseRTT = metrics.rtt;
        }

        // Adapt based on accumulated metrics
        this.adapt();
    }

    /**
     * Main adaptation logic
     */
    private adapt(): void {
        const now = Date.now();

        // Don't adjust too frequently (minimum 500ms between adjustments)
        if (now - this.lastAdjustment < 500) {return;}

        // Need at least 5 samples
        if (this.metricWindow.metrics.length < 5) {return;}

        const analysis = this.analyzeMetrics();

        // Determine action based on network conditions
        if (analysis.isHealthy) {
            this.consecutiveGoodPeriods++;
            this.consecutiveBadPeriods = 0;

            // Increase aggressively if consistently good
            if (this.consecutiveGoodPeriods >= 3) {
                this.increaseRate();
            }
        } else if (analysis.isCongested) {
            this.consecutiveBadPeriods++;
            this.consecutiveGoodPeriods = 0;

            // Decrease immediately on congestion
            this.decreaseRate(analysis.severity);
        }

        this.lastAdjustment = now;
    }

    /**
     * Analyze recent metrics
     */
    private analyzeMetrics(): {
        isHealthy: boolean;
        isCongested: boolean;
        severity: number;
        avgRTT: number;
        avgLoss: number;
        avgJitter: number;
        throughput: number;
    } {
        const recent = this.metricWindow.metrics.slice(-10);

        if (recent.length < 2) {
            return {
                isHealthy: true,
                isCongested: false,
                severity: 0,
                avgRTT: 0,
                avgLoss: 0,
                avgJitter: 0,
                throughput: 0,
            };
        }

        const avgRTT = recent.reduce((sum, m) => sum + m.rtt, 0) / recent.length;
        const avgLoss = recent.reduce((sum, m) => sum + m.packetLoss, 0) / recent.length;
        const avgJitter = recent.reduce((sum, m) => sum + m.jitter, 0) / recent.length;
        const avgBuffer = recent.reduce((sum, m) => sum + m.bufferLevel, 0) / recent.length;

        // Calculate throughput - safely access array elements
        const lastMetric = recent[recent.length - 1];
        const firstMetric = recent[0];
        const timeSpan = lastMetric && firstMetric ? lastMetric.timestamp - firstMetric.timestamp : 0;
        const bytesTotal = recent.reduce((sum, m) => sum + m.bytesTransferred, 0);
        const throughput = timeSpan > 0 ? (bytesTotal / timeSpan) * 1000 : 0;

        // RTT degradation ratio (compared to baseline)
        const rttRatio = this.baseRTT > 0 ? avgRTT / this.baseRTT : 1;

        // Determine health
        const isHealthy = (
            avgLoss < 0.01 &&           // < 1% packet loss
            rttRatio < 1.5 &&           // RTT not increased by > 50%
            avgJitter < 50 &&           // Jitter < 50ms
            avgBuffer < 0.7             // Buffer not overwhelmed
        );

        // Determine congestion
        const isCongested = (
            avgLoss > 0.05 ||           // > 5% packet loss
            rttRatio > 2 ||             // RTT doubled
            avgBuffer > 0.9             // Buffer nearly full
        );

        // Calculate severity (0-1)
        const severity = Math.min(1, Math.max(0,
            (avgLoss * 5) +             // Weight loss heavily
            ((rttRatio - 1) * 0.3) +    // RTT contribution
            (avgBuffer > 0.8 ? 0.3 : 0) // Buffer contribution
        ));

        return { isHealthy, isCongested, severity, avgRTT, avgLoss, avgJitter, throughput };
    }

    /**
     * Increase transfer rate (AIMD additive increase)
     */
    private increaseRate(): void {
        const increase = this.config.mode === 'aggressive' ? 1.25 :
                        this.config.mode === 'conservative' ? 1.05 : 1.1;

        // Increase bitrate
        this.config.targetBitrate = Math.min(
            this.config.maxBitrate,
            this.config.targetBitrate * increase
        );

        // Increase chunk size if appropriate
        this.adjustChunkSize();

        // Possibly increase concurrency
        if (this.config.targetBitrate > this.config.maxBitrate * 0.7 && this.config.concurrency < 10) {
            this.config.concurrency++;
        }

        this.notifyChange();
        secureLog.debug('[Adaptive] Increased rate:', {
            bitrate: Math.round(this.config.targetBitrate / 1024) + ' KB/s',
            chunkSize: this.config.currentChunkSize,
            concurrency: this.config.concurrency,
        });
    }

    /**
     * Decrease transfer rate (AIMD multiplicative decrease)
     */
    private decreaseRate(severity: number): void {
        // More severe = larger decrease (min 0.5, max 0.9 of current)
        const factor = Math.max(0.5, 0.9 - (severity * 0.3));

        // Decrease bitrate
        this.config.targetBitrate = Math.max(
            this.config.minBitrate,
            this.config.targetBitrate * factor
        );

        // Decrease chunk size if needed
        this.adjustChunkSize();

        // Possibly decrease concurrency
        if (severity > 0.5 && this.config.concurrency > 1) {
            this.config.concurrency = Math.max(1, this.config.concurrency - 1);
        }

        // Reset good period counter
        this.consecutiveGoodPeriods = 0;

        this.notifyChange();
        secureLog.debug('[Adaptive] Decreased rate:', {
            bitrate: Math.round(this.config.targetBitrate / 1024) + ' KB/s',
            chunkSize: this.config.currentChunkSize,
            concurrency: this.config.concurrency,
            severity,
        });
    }

    /**
     * Adjust chunk size based on RTT and packet loss (optimized for WebRTC DataChannels)
     *
     * Dynamic chunk sizing rules:
     * - RTT < 10ms, loss < 1%: 256KB chunks (LAN conditions)
     * - RTT < 50ms, loss < 5%: 128KB chunks (good internet)
     * - Otherwise: 64KB chunks (default WebRTC optimal)
     */
    private adjustChunkSize(): void {
        const analysis = this.analyzeMetrics();

        // RTT-based adaptive chunk sizing
        if (this.config.isLAN || (analysis.avgRTT < 10 && analysis.avgLoss < 0.01)) {
            // LAN conditions: very low latency and loss
            this.config.currentChunkSize = CHUNK_SIZES.LARGE; // 256KB
        } else if (analysis.avgRTT < 50 && analysis.avgLoss < 0.05) {
            // Good internet: reasonable latency and low loss
            this.config.currentChunkSize = CHUNK_SIZES.MEDIUM; // 128KB
        } else if (analysis.avgRTT < 100 && analysis.avgLoss < 0.1) {
            // Moderate internet: higher latency or some loss
            this.config.currentChunkSize = CHUNK_SIZES.DEFAULT; // 64KB
        } else if (analysis.avgRTT < 200) {
            // Poor connection: high latency
            this.config.currentChunkSize = CHUNK_SIZES.SMALL; // 32KB
        } else {
            // Very poor connection: very high latency or loss
            this.config.currentChunkSize = CHUNK_SIZES.TINY; // 16KB
        }

        // For LAN, allow larger chunks if conditions are excellent
        if (this.config.isLAN) {
            const bitrateKBs = this.config.targetBitrate / 1024;
            if (bitrateKBs > 500 * 1024 && analysis.avgRTT < 5 && analysis.avgLoss < 0.001) {
                this.config.currentChunkSize = CHUNK_SIZES.LAN_FAST; // 4MB
            } else if (bitrateKBs > 100 * 1024 && analysis.avgRTT < 10 && analysis.avgLoss < 0.01) {
                this.config.currentChunkSize = CHUNK_SIZES.LAN; // 1MB
            }
        }
    }

    /**
     * Notify listeners of config change
     */
    private notifyChange(): void {
        this.onConfigChange?.({ ...this.config });
    }

    /**
     * Get current configuration
     */
    getConfig(): AdaptiveConfig {
        return { ...this.config };
    }

    /**
     * Get optimal chunk size for current conditions
     */
    getChunkSize(): number {
        return this.config.currentChunkSize;
    }

    /**
     * Get target transfer rate
     */
    getTargetBitrate(): number {
        return this.config.targetBitrate;
    }

    /**
     * Get recommended concurrency
     */
    getConcurrency(): number {
        return this.config.concurrency;
    }

    /**
     * Calculate optimal send interval (ms) for chunks
     */
    getSendInterval(): number {
        // Time to send one chunk at target bitrate
        const chunkTime = (this.config.currentChunkSize / this.config.targetBitrate) * 1000;
        return Math.max(1, Math.floor(chunkTime / this.config.concurrency));
    }

    /**
     * Reset controller state
     */
    reset(): void {
        this.metricWindow.metrics = [];
        this.metricWindow.startTime = Date.now();
        this.lastAdjustment = 0;
        this.consecutiveGoodPeriods = 0;
        this.consecutiveBadPeriods = 0;
        this.baseRTT = 0;

        // Reset to initial config
        const baseChunkSize = this.config.isLAN ? CHUNK_SIZES.LAN : CHUNK_SIZES.DEFAULT;
        const baseBitrate = this.config.isLAN ? 100 * 1024 * 1024 : 5 * 1024 * 1024;

        this.config.currentChunkSize = baseChunkSize;
        this.config.targetBitrate = baseBitrate;
        this.config.concurrency = this.config.isLAN ? 8 : 3;

        this.notifyChange();
    }

    /**
     * Get transfer statistics
     */
    getStats(): {
        averageRTT: number;
        averageLoss: number;
        averageThroughput: number;
        sampleCount: number;
    } {
        if (this.metricWindow.metrics.length === 0) {
            return { averageRTT: 0, averageLoss: 0, averageThroughput: 0, sampleCount: 0 };
        }

        const metrics = this.metricWindow.metrics;
        const avgRTT = metrics.reduce((sum, m) => sum + m.rtt, 0) / metrics.length;
        const avgLoss = metrics.reduce((sum, m) => sum + m.packetLoss, 0) / metrics.length;

        const lastMetric = metrics[metrics.length - 1];
        const firstMetric = metrics[0];
        const timeSpan = lastMetric && firstMetric ? lastMetric.timestamp - firstMetric.timestamp : 0;
        const bytesTotal = metrics.reduce((sum, m) => sum + m.bytesTransferred, 0);
        const avgThroughput = timeSpan > 0 ? (bytesTotal / timeSpan) * 1000 : 0;

        return {
            averageRTT: Math.round(avgRTT),
            averageLoss: Math.round(avgLoss * 1000) / 1000,
            averageThroughput: Math.round(avgThroughput),
            sampleCount: metrics.length,
        };
    }
}

/**
 * Create an adaptive bitrate controller
 */
export function createAdaptiveController(
    isLAN: boolean = false,
    mode: 'aggressive' | 'balanced' | 'conservative' = 'balanced'
): AdaptiveBitrateController {
    return new AdaptiveBitrateController(isLAN, mode);
}

/**
 * Helper to measure RTT for a data channel
 */
export async function measureRTT(
    channel: RTCDataChannel,
    timeoutMs: number = 5000
): Promise<number> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const pingId = `ping-${startTime}`;
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(timeoutMs); // Return timeout as RTT on failure
            }
        }, timeoutMs);

        const handler = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : null;
                if (data?.type === 'pong' && data?.id === pingId) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        channel.removeEventListener('message', handler);
                        resolve(Date.now() - startTime);
                    }
                }
            } catch {
                // Ignore parse errors
            }
        };

        channel.addEventListener('message', handler);
        channel.send(JSON.stringify({ type: 'ping', id: pingId }));
    });
}

/**
 * Calculate buffer level from RTCDataChannel
 */
export function getBufferLevel(channel: RTCDataChannel): number {
    const bufferedAmount = channel.bufferedAmount;

    // Normalize to 0-1 range (assuming max buffer ~16MB)
    const maxBuffer = 16 * 1024 * 1024;
    return Math.min(1, bufferedAmount / maxBuffer);
}

export default {
    AdaptiveBitrateController,
    createAdaptiveController,
    measureRTT,
    getBufferLevel,
    CHUNK_SIZES,
    BANDWIDTH_TARGET_LAN,
    BANDWIDTH_TARGET_INTERNET,
    BANDWIDTH_TARGET_LAN_GIGABIT,
    BANDWIDTH_TARGET_LAN_WIFI6,
    BACKPRESSURE_HIGH_WATER_MARK,
    BACKPRESSURE_LOW_WATER_MARK,
};
