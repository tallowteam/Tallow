'use client';

/**
 * Traffic Obfuscation Module
 * 
 * Implements padded constant bitrate transfers for traffic analysis resistance.
 * Makes file transfers undetectable through traffic pattern analysis.
 * 
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 10
 * PRIORITY: HIGH
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ObfuscationConfig {
    paddingMin: number;           // Minimum padding percentage (0.1 = 10%)
    paddingMax: number;           // Maximum padding percentage (0.3 = 30%)
    chunkSizeMin: number;         // Minimum chunk size in bytes
    chunkSizeMax: number;         // Maximum chunk size in bytes
    decoyProbability: number;     // Probability of sending decoy traffic (0-1)
    targetBitrate: number;        // Target bitrate in bits per second
    enableCoverTraffic: boolean;  // Enable continuous cover traffic
}

export interface ObfuscatedChunk {
    data: Uint8Array;
    isDecoy: boolean;
    sequenceNumber: number;
    timestamp: number;
}

export interface TransferStats {
    originalSize: number;
    paddedSize: number;
    totalChunks: number;
    decoyChunks: number;
    averageBitrate: number;
    timingVariance: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: ObfuscationConfig = {
    paddingMin: 0.10,           // 10% minimum padding
    paddingMax: 0.30,           // 30% maximum padding
    chunkSizeMin: 16 * 1024,    // 16KB minimum
    chunkSizeMax: 1024 * 1024,  // 1MB maximum
    decoyProbability: 0.3,      // 30% decoy traffic
    targetBitrate: 1_000_000,   // 1 Mbps
    enableCoverTraffic: true,
};

// Magic bytes to identify packet types
const PACKET_TYPE = {
    DATA: 0x01,
    PADDING: 0x02,
    DECOY: 0x03,
    END: 0xFF,
};

// ============================================================================
// Traffic Obfuscator Class
// ============================================================================

export class TrafficObfuscator {
    private config: ObfuscationConfig;
    private coverTrafficInterval: ReturnType<typeof setInterval> | null = null;
    private sequenceNumber: number = 0;
    private stats: TransferStats;

    constructor(config: Partial<ObfuscationConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.stats = this.initStats();
    }

    private initStats(): TransferStats {
        return {
            originalSize: 0,
            paddedSize: 0,
            totalChunks: 0,
            decoyChunks: 0,
            averageBitrate: 0,
            timingVariance: 0,
        };
    }

    // ==========================================================================
    // Padding Calculator
    // ==========================================================================

    /**
     * Calculate random padding size for a given file size
     * Adds 10-30% random padding to obscure true file size
     */
    calculatePadding(fileSize: number): number {
        const noise = crypto.getRandomValues(new Uint8Array(1))[0];
        const paddingPercent = this.config.paddingMin +
            (noise / 255) * (this.config.paddingMax - this.config.paddingMin);
        return Math.floor(fileSize * paddingPercent);
    }

    /**
     * Generate cryptographically random padding bytes
     */
    generatePadding(size: number): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(size));
    }

    /**
     * Add padding to data with metadata header
     */
    padData(data: Uint8Array): Uint8Array {
        const paddingSize = this.calculatePadding(data.length);
        const padding = this.generatePadding(paddingSize);

        // Create padded packet: [type:1][originalSize:4][data][padding]
        const paddedData = new Uint8Array(1 + 4 + data.length + paddingSize);
        const view = new DataView(paddedData.buffer);

        paddedData[0] = PACKET_TYPE.DATA;
        view.setUint32(1, data.length, false);
        paddedData.set(data, 5);
        paddedData.set(padding, 5 + data.length);

        this.stats.originalSize += data.length;
        this.stats.paddedSize += paddedData.length;

        return paddedData;
    }

    /**
     * Extract original data from padded packet
     */
    unpadData(paddedData: Uint8Array): Uint8Array | null {
        if (paddedData.length < 5) return null;

        const type = paddedData[0];
        if (type === PACKET_TYPE.DECOY) return null; // Discard decoy
        if (type !== PACKET_TYPE.DATA) return null;

        const view = new DataView(paddedData.buffer, paddedData.byteOffset);
        const originalSize = view.getUint32(1, false);

        if (originalSize > paddedData.length - 5) return null;

        return paddedData.slice(5, 5 + originalSize);
    }

    // ==========================================================================
    // Random Chunk Sizing
    // ==========================================================================

    /**
     * Split file into random-sized chunks to prevent size-based fingerprinting
     */
    randomChunking(data: Uint8Array): Uint8Array[] {
        const chunks: Uint8Array[] = [];
        let offset = 0;

        while (offset < data.length) {
            // Generate random chunk size within bounds
            const randomBytes = crypto.getRandomValues(new Uint8Array(4));
            const randomValue = new DataView(randomBytes.buffer).getUint32(0, false);
            const range = this.config.chunkSizeMax - this.config.chunkSizeMin;
            const chunkSize = this.config.chunkSizeMin + (randomValue % range);

            // Ensure we don't exceed data bounds
            const actualSize = Math.min(chunkSize, data.length - offset);
            chunks.push(data.slice(offset, offset + actualSize));
            offset += actualSize;
        }

        this.stats.totalChunks += chunks.length;
        return chunks;
    }

    /**
     * Reassemble chunks into original data
     */
    reassembleChunks(chunks: Uint8Array[]): Uint8Array {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    }

    // ==========================================================================
    // Constant Bitrate Transfer
    // ==========================================================================

    /**
     * Transfer data at constant bitrate using async generator
     * Adds timing obfuscation to prevent timing-based analysis
     */
    async *constantBitrateTransfer(
        data: Uint8Array,
        targetBitrate: number = this.config.targetBitrate
    ): AsyncGenerator<ObfuscatedChunk> {
        const chunks = this.randomChunking(data);
        const bytesPerMs = targetBitrate / 8 / 1000;
        let lastSendTime = Date.now();
        let sequenceNumber = 0;

        for (const chunk of chunks) {
            const paddedChunk = this.padData(chunk);

            // Calculate required delay for constant bitrate
            const expectedDelay = paddedChunk.length / bytesPerMs;
            const elapsed = Date.now() - lastSendTime;
            const delay = Math.max(0, expectedDelay - elapsed);

            // Add random jitter (±10%) to prevent timing correlation
            const jitter = (crypto.getRandomValues(new Uint8Array(1))[0] / 255 - 0.5) * 0.2;
            const actualDelay = delay * (1 + jitter);

            if (actualDelay > 0) {
                await this.sleep(actualDelay);
            }

            // Maybe insert decoy traffic before real data
            if (this.shouldSendDecoy()) {
                yield this.generateDecoyChunk(sequenceNumber++);
            }

            yield {
                data: paddedChunk,
                isDecoy: false,
                sequenceNumber: sequenceNumber++,
                timestamp: Date.now(),
            };

            // Maybe insert decoy traffic after real data
            if (this.shouldSendDecoy()) {
                yield this.generateDecoyChunk(sequenceNumber++);
            }

            lastSendTime = Date.now();
        }

        // Send end marker
        yield {
            data: new Uint8Array([PACKET_TYPE.END]),
            isDecoy: false,
            sequenceNumber: sequenceNumber,
            timestamp: Date.now(),
        };
    }

    /**
     * Receive and reconstruct data from constant bitrate stream
     */
    async receiveConstantBitrateTransfer(
        chunkIterator: AsyncIterable<ObfuscatedChunk>
    ): Promise<Uint8Array> {
        const chunks: Uint8Array[] = [];

        for await (const chunk of chunkIterator) {
            // Skip decoys
            if (chunk.isDecoy || chunk.data[0] === PACKET_TYPE.DECOY) {
                this.stats.decoyChunks++;
                continue;
            }

            // Check for end marker
            if (chunk.data[0] === PACKET_TYPE.END) {
                break;
            }

            const unpadded = this.unpadData(chunk.data);
            if (unpadded) {
                chunks.push(unpadded);
            }
        }

        return this.reassembleChunks(chunks);
    }

    // ==========================================================================
    // Decoy Traffic Generator
    // ==========================================================================

    /**
     * Determine if decoy traffic should be sent
     */
    private shouldSendDecoy(): boolean {
        const random = crypto.getRandomValues(new Uint8Array(1))[0] / 255;
        return random < this.config.decoyProbability;
    }

    /**
     * Generate a decoy chunk that looks like real traffic
     */
    generateDecoyChunk(sequenceNumber: number): ObfuscatedChunk {
        // Random size within normal chunk range
        const randomBytes = crypto.getRandomValues(new Uint8Array(2));
        const size = 1024 + (new DataView(randomBytes.buffer).getUint16(0, false) % 16384);

        const decoyData = new Uint8Array(size + 1);
        decoyData[0] = PACKET_TYPE.DECOY;
        crypto.getRandomValues(decoyData.subarray(1));

        this.stats.decoyChunks++;

        return {
            data: decoyData,
            isDecoy: true,
            sequenceNumber,
            timestamp: Date.now(),
        };
    }

    /**
     * Generate continuous cover traffic to mask real transfers
     * @param duration Duration in milliseconds (0 = indefinite)
     * @param onChunk Callback for each cover traffic chunk
     */
    generateCoverTraffic(
        duration: number,
        onChunk: (chunk: ObfuscatedChunk) => void
    ): void {
        if (!this.config.enableCoverTraffic) return;

        const startTime = Date.now();
        let seqNum = 0;

        const generateChunk = () => {
            if (duration > 0 && Date.now() - startTime >= duration) {
                this.stopCoverTraffic();
                return;
            }

            onChunk(this.generateDecoyChunk(seqNum++));
        };

        // Random intervals to avoid pattern detection
        const scheduleNext = () => {
            const baseInterval = 100; // 100ms base
            const jitter = crypto.getRandomValues(new Uint8Array(1))[0];
            const interval = baseInterval + jitter * 4; // 100-1124ms

            this.coverTrafficInterval = setTimeout(() => {
                generateChunk();
                scheduleNext();
            }, interval);
        };

        scheduleNext();
    }

    /**
     * Stop cover traffic generation
     */
    stopCoverTraffic(): void {
        if (this.coverTrafficInterval) {
            clearTimeout(this.coverTrafficInterval);
            this.coverTrafficInterval = null;
        }
    }

    // ==========================================================================
    // Packet Framing
    // ==========================================================================

    /**
     * Frame a chunk for transmission with obfuscation headers
     */
    frameChunk(chunk: ObfuscatedChunk): Uint8Array {
        // Frame format: [magic:2][seq:4][timestamp:8][length:4][data]
        const frame = new Uint8Array(18 + chunk.data.length);
        const view = new DataView(frame.buffer);

        // Magic bytes (TA = 0x54 0x41, LW = 0x4C 0x57)
        frame[0] = 0x54; // 'T'
        frame[1] = 0x41; // 'A'

        view.setUint32(2, chunk.sequenceNumber, false);
        view.setBigUint64(6, BigInt(chunk.timestamp), false);
        view.setUint32(14, chunk.data.length, false);
        frame.set(chunk.data, 18);

        return frame;
    }

    /**
     * Parse a framed chunk
     */
    parseFrame(frame: Uint8Array): ObfuscatedChunk | null {
        if (frame.length < 18) return null;

        const view = new DataView(frame.buffer, frame.byteOffset);

        const sequenceNumber = view.getUint32(2, false);
        const timestamp = Number(view.getBigUint64(6, false));
        const length = view.getUint32(14, false);

        if (frame.length < 18 + length) return null;

        const data = frame.slice(18, 18 + length);
        const isDecoy = data[0] === PACKET_TYPE.DECOY;

        return { data, isDecoy, sequenceNumber, timestamp };
    }

    // ==========================================================================
    // Statistics & Monitoring
    // ==========================================================================

    /**
     * Get transfer statistics
     */
    getStats(): TransferStats {
        return { ...this.stats };
    }

    /**
     * Calculate timing variance for analysis resistance metric
     */
    calculateTimingVariance(timestamps: number[]): number {
        if (timestamps.length < 2) return 0;

        const intervals: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) =>
            sum + Math.pow(val - mean, 2), 0) / intervals.length;

        return Math.sqrt(variance) / mean; // Coefficient of variation
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = this.initStats();
        this.sequenceNumber = 0;
    }

    // ==========================================================================
    // Utility Methods
    // ==========================================================================

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<ObfuscationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): ObfuscationConfig {
        return { ...this.config };
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.stopCoverTraffic();
        this.resetStats();
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let obfuscatorInstance: TrafficObfuscator | null = null;

export function getTrafficObfuscator(config?: Partial<ObfuscationConfig>): TrafficObfuscator {
    if (!obfuscatorInstance) {
        obfuscatorInstance = new TrafficObfuscator(config);
    }
    return obfuscatorInstance;
}

// Export default instance
export const trafficObfuscator = new TrafficObfuscator();

export default TrafficObfuscator;
