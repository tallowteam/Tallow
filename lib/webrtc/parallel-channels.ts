'use client';

/**
 * Parallel WebRTC DataChannel Manager
 *
 * Implements multiple parallel DataChannels for maximum throughput.
 * Features:
 * - 2-4 parallel channels for bandwidth aggregation
 * - Round-robin chunk distribution
 * - Synchronized reassembly on receiver
 * - Per-channel backpressure handling
 * - Automatic failure recovery
 *
 * Targets:
 * - LAN WiFi: 200+ Mbps
 * - LAN Ethernet: 500+ Mbps
 * - Internet: 50+ Mbps
 */

import secureLog from '../utils/secure-logger';
import type { TransferChunk } from '../types';

export interface ParallelChannelConfig {
  /** Number of parallel channels (2-4 recommended) */
  channelCount: number;
  /** Channel ordered delivery (false for max speed) */
  ordered: boolean;
  /** Max retransmits (0 for unreliable, undefined for reliable) */
  maxRetransmits?: number;
  /** Max packet lifetime in ms */
  maxPacketLifeTime?: number;
  /** Buffer threshold for backpressure (16MB default) */
  bufferThreshold: number;
  /** Low buffer threshold for resuming (4MB default) */
  bufferLowThreshold: number;
}

export interface ParallelChannelStats {
  channelId: number;
  bytesSent: number;
  bytesReceived: number;
  chunksSent: number;
  chunksReceived: number;
  bufferedAmount: number;
  isPaused: boolean;
  state: RTCDataChannelState;
}

const DEFAULT_CONFIG: ParallelChannelConfig = {
  channelCount: 3,
  ordered: false,
  maxRetransmits: 0, // Unreliable for max speed
  bufferThreshold: 16 * 1024 * 1024, // 16MB
  bufferLowThreshold: 4 * 1024 * 1024, // 4MB
};

/**
 * Parallel Channel Manager
 * Manages multiple DataChannels for aggregated throughput
 */
export class ParallelChannelManager {
  private config: ParallelChannelConfig;
  private channels: RTCDataChannel[] = [];
  private connection: RTCPeerConnection;
  private isInitiator: boolean;

  // Sending state
  private currentChannelIndex = 0;
  private pausedChannels = new Set<number>();
  private channelStats: Map<number, ParallelChannelStats> = new Map();

  // Receiving state
  private receivedChunks: Map<string, Map<number, TransferChunk>> = new Map();
  private chunkOrder: Map<string, number> = new Map();

  // Event handlers
  private onChannelReady?: () => void;
  private onChunkReceived?: (chunk: TransferChunk, channelId: number) => void;
  private onError?: (error: Error, channelId: number) => void;
  private onDrain?: ((channelId: number) => void) | undefined;

  constructor(
    connection: RTCPeerConnection,
    isInitiator: boolean,
    config?: Partial<ParallelChannelConfig>
  ) {
    this.connection = connection;
    this.isInitiator = isInitiator;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Validate config
    if (this.config.channelCount < 1 || this.config.channelCount > 8) {
      throw new Error('Channel count must be between 1 and 8');
    }
  }

  /**
   * Initialize parallel channels
   */
  async initialize(): Promise<void> {
    if (this.isInitiator) {
      // Initiator creates channels
      for (let i = 0; i < this.config.channelCount; i++) {
        const channel = this.createChannel(i);
        this.channels.push(channel);
        this.setupChannelHandlers(channel, i);
        this.initializeStats(i);
      }
      secureLog.log(`[ParallelChannels] Created ${this.config.channelCount} channels (initiator)`);
    } else {
      // Receiver waits for channels
      return new Promise((resolve) => {
        let receivedCount = 0;
        const handler = (event: RTCDataChannelEvent) => {
          const channel = event.channel;
          const channelId = this.extractChannelId(channel.label);

          if (channelId !== null && channelId < this.config.channelCount) {
            this.channels[channelId] = channel;
            this.setupChannelHandlers(channel, channelId);
            this.initializeStats(channelId);
            receivedCount++;

            if (receivedCount === this.config.channelCount) {
              this.connection.removeEventListener('datachannel', handler);
              secureLog.log(`[ParallelChannels] Received ${this.config.channelCount} channels`);
              resolve();
            }
          }
        };

        this.connection.addEventListener('datachannel', handler);

        // Timeout after 30 seconds
        setTimeout(() => {
          if (receivedCount < this.config.channelCount) {
            this.connection.removeEventListener('datachannel', handler);
            const error = new Error(`Timeout: Only received ${receivedCount}/${this.config.channelCount} channels`);
            secureLog.error('[ParallelChannels]', error);
            this.onError?.(error, -1);
          }
        }, 30000);
      });
    }
  }

  /**
   * Create a data channel with optimized config
   */
  private createChannel(channelId: number): RTCDataChannel {
    const init: RTCDataChannelInit = {
      ordered: this.config.ordered,
      id: channelId,
    };

    if (this.config.maxRetransmits !== undefined) {
      init.maxRetransmits = this.config.maxRetransmits;
    }

    if (this.config.maxPacketLifeTime !== undefined) {
      init.maxPacketLifeTime = this.config.maxPacketLifeTime;
    }

    const channel = this.connection.createDataChannel(
      `tallow-parallel-${channelId}`,
      init
    );

    channel.binaryType = 'arraybuffer';

    // Set bufferedAmountLowThreshold for backpressure handling
    channel.bufferedAmountLowThreshold = this.config.bufferLowThreshold;

    return channel;
  }

  /**
   * Extract channel ID from label
   */
  private extractChannelId(label: string): number | null {
    const match = /tallow-parallel-(\d+)/.exec(label);
    const captured = match?.[1];
    return captured ? parseInt(captured, 10) : null;
  }

  /**
   * Initialize stats for a channel
   */
  private initializeStats(channelId: number): void {
    this.channelStats.set(channelId, {
      channelId,
      bytesSent: 0,
      bytesReceived: 0,
      chunksSent: 0,
      chunksReceived: 0,
      bufferedAmount: 0,
      isPaused: false,
      state: 'connecting',
    });
  }

  /**
   * Setup channel event handlers
   */
  private setupChannelHandlers(channel: RTCDataChannel, channelId: number): void {
    channel.onopen = () => {
      secureLog.log(`[ParallelChannels] Channel ${channelId} opened`);
      const stats = this.channelStats.get(channelId);
      if (stats) {
        stats.state = 'open';
      }

      // Check if all channels are ready
      if (this.areAllChannelsReady()) {
        this.onChannelReady?.();
      }
    };

    channel.onclose = () => {
      secureLog.log(`[ParallelChannels] Channel ${channelId} closed`);
      const stats = this.channelStats.get(channelId);
      if (stats) {
        stats.state = 'closed';
      }
    };

    channel.onerror = (event) => {
      secureLog.error(`[ParallelChannels] Channel ${channelId} error:`, event);
      const error = new Error(`Data channel ${channelId} error`);
      this.onError?.(error, channelId);
    };

    channel.onmessage = (event) => {
      this.handleMessage(event.data, channelId);
    };

    channel.onbufferedamountlow = () => {
      // Resume sending on this channel
      if (this.pausedChannels.has(channelId)) {
        this.pausedChannels.delete(channelId);
        const stats = this.channelStats.get(channelId);
        if (stats) {
          stats.isPaused = false;
          stats.bufferedAmount = channel.bufferedAmount;
        }
        secureLog.log(`[ParallelChannels] Channel ${channelId} drained, resuming`);
        this.onDrain?.(channelId);
      }
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: ArrayBuffer, channelId: number): void {
    try {
      // Update stats
      const stats = this.channelStats.get(channelId);
      if (stats) {
        stats.bytesReceived += data.byteLength;
        stats.chunksReceived++;
      }

      // Parse chunk
      const chunk = this.deserializeChunk(data);

      // Store chunk
      if (!this.receivedChunks.has(chunk.transferId)) {
        this.receivedChunks.set(chunk.transferId, new Map());
        this.chunkOrder.set(chunk.transferId, 0);
      }

      const transferChunks = this.receivedChunks.get(chunk.transferId)!;
      transferChunks.set(chunk.chunkIndex, chunk);

      // Notify handler
      this.onChunkReceived?.(chunk, channelId);

    } catch (error) {
      secureLog.error(`[ParallelChannels] Error handling message on channel ${channelId}:`, error);
    }
  }

  /**
   * Send chunk using round-robin channel selection
   */
  async sendChunk(chunk: TransferChunk): Promise<void> {
    // Find next available (non-paused) channel
    let attempts = 0;

    while (attempts < this.config.channelCount) {
      const channelId = this.currentChannelIndex;
      const channel = this.channels[channelId];

      if (!channel) {
        throw new Error(`Channel ${channelId} not initialized`);
      }

      // Check if channel is ready and not paused
      if (
        channel.readyState === 'open' &&
        !this.pausedChannels.has(channelId)
      ) {
        // Check backpressure
        const bufferedAmount = channel.bufferedAmount;

        if (bufferedAmount < this.config.bufferThreshold) {
          // Send chunk
          const serialized = this.serializeChunk(chunk);
          channel.send(serialized);

          // Update stats
          const stats = this.channelStats.get(channelId);
          if (stats) {
            stats.bytesSent += serialized.byteLength;
            stats.chunksSent++;
            stats.bufferedAmount = channel.bufferedAmount;
          }

          // Move to next channel
          this.currentChannelIndex = (this.currentChannelIndex + 1) % this.config.channelCount;

          return;
        } else {
          // Pause this channel due to backpressure
          this.pausedChannels.add(channelId);
          const stats = this.channelStats.get(channelId);
          if (stats) {
            stats.isPaused = true;
            stats.bufferedAmount = bufferedAmount;
          }
          secureLog.log(`[ParallelChannels] Channel ${channelId} paused (buffer: ${bufferedAmount})`);
        }
      }

      // Try next channel
      this.currentChannelIndex = (this.currentChannelIndex + 1) % this.config.channelCount;
      attempts++;
    }

    // All channels are paused, wait for drain
    throw new Error('All channels are experiencing backpressure');
  }

  /**
   * Send chunks in batch with automatic backpressure handling
   */
  async sendChunks(chunks: TransferChunk[]): Promise<void> {
    for (const chunk of chunks) {
      // Retry with exponential backoff if all channels are blocked
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        try {
          await this.sendChunk(chunk);
          break;
        } catch (error) {
          if ((error as Error).message.includes('backpressure')) {
            retries++;
            if (retries >= maxRetries) {
              throw new Error('Failed to send chunk: All channels blocked');
            }
            // Wait for drain event
            await this.waitForDrain();
          } else {
            throw error;
          }
        }
      }
    }
  }

  /**
   * Wait for at least one channel to drain
   */
  private waitForDrain(): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 5000); // 5 second timeout

      const handler = () => {
        clearTimeout(timeout);
        this.onDrain = undefined;
        resolve();
      };

      this.onDrain = handler;
    });
  }

  /**
   * Serialize chunk for transmission
   */
  private serializeChunk(chunk: TransferChunk): ArrayBuffer {
    const metadata = {
      transferId: chunk.transferId,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      hash: chunk.hash,
      encrypted: chunk.encrypted,
      dataLength: chunk.data.byteLength,
    };

    const metadataStr = JSON.stringify(metadata);
    const metadataBytes = new TextEncoder().encode(metadataStr);
    const metadataLength = metadataBytes.byteLength;

    // Format: [4 bytes metadata length][metadata][data]
    const buffer = new ArrayBuffer(4 + metadataLength + chunk.data.byteLength);
    const view = new DataView(buffer);

    view.setUint32(0, metadataLength, true);
    new Uint8Array(buffer, 4, metadataLength).set(metadataBytes);
    new Uint8Array(buffer, 4 + metadataLength).set(new Uint8Array(chunk.data));

    return buffer;
  }

  /**
   * Deserialize chunk from transmission
   */
  private deserializeChunk(buffer: ArrayBuffer): TransferChunk {
    const view = new DataView(buffer);
    const metadataLength = view.getUint32(0, true);

    const metadataBytes = new Uint8Array(buffer, 4, metadataLength);
    const metadataStr = new TextDecoder().decode(metadataBytes);
    const metadata = JSON.parse(metadataStr);

    const data = buffer.slice(4 + metadataLength);

    return {
      transferId: metadata.transferId,
      chunkIndex: metadata.chunkIndex,
      totalChunks: metadata.totalChunks,
      hash: metadata.hash,
      encrypted: metadata.encrypted,
      data,
    };
  }

  /**
   * Check if all channels are ready
   */
  areAllChannelsReady(): boolean {
    return this.channels.every((ch) => ch && ch.readyState === 'open');
  }

  /**
   * Get aggregated stats across all channels
   */
  getStats(): {
    totalBytesSent: number;
    totalBytesReceived: number;
    totalChunksSent: number;
    totalChunksReceived: number;
    totalBufferedAmount: number;
    pausedChannels: number;
    channels: ParallelChannelStats[];
  } {
    let totalBytesSent = 0;
    let totalBytesReceived = 0;
    let totalChunksSent = 0;
    let totalChunksReceived = 0;
    let totalBufferedAmount = 0;

    const channels: ParallelChannelStats[] = [];

    for (const stats of this.channelStats.values()) {
      totalBytesSent += stats.bytesSent;
      totalBytesReceived += stats.bytesReceived;
      totalChunksSent += stats.chunksSent;
      totalChunksReceived += stats.chunksReceived;
      totalBufferedAmount += stats.bufferedAmount;
      channels.push({ ...stats });
    }

    return {
      totalBytesSent,
      totalBytesReceived,
      totalChunksSent,
      totalChunksReceived,
      totalBufferedAmount,
      pausedChannels: this.pausedChannels.size,
      channels,
    };
  }

  /**
   * Get received chunks in order for a transfer
   */
  getOrderedChunks(transferId: string): TransferChunk[] {
    const chunks = this.receivedChunks.get(transferId);
    if (!chunks) {return [];}

    const ordered: TransferChunk[] = [];
    const sortedIndices = Array.from(chunks.keys()).sort((a, b) => a - b);

    for (const index of sortedIndices) {
      const chunk = chunks.get(index);
      if (chunk) {
        ordered.push(chunk);
      }
    }

    return ordered;
  }

  /**
   * Clear received chunks for a transfer
   */
  clearTransfer(transferId: string): void {
    this.receivedChunks.delete(transferId);
    this.chunkOrder.delete(transferId);
  }

  /**
   * Register event handlers
   */
  on(event: 'ready', handler: () => void): void;
  on(event: 'chunk', handler: (chunk: TransferChunk, channelId: number) => void): void;
  on(event: 'error', handler: (error: Error, channelId: number) => void): void;
  on(event: 'drain', handler: (channelId: number) => void): void;
  on(event: string, handler: ((...args: unknown[]) => void) | (() => void)): void {
    switch (event) {
      case 'ready':
        this.onChannelReady = handler as () => void;
        break;
      case 'chunk':
        this.onChunkReceived = handler as (chunk: TransferChunk, channelId: number) => void;
        break;
      case 'error':
        this.onError = handler as (error: Error, channelId: number) => void;
        break;
      case 'drain':
        this.onDrain = handler as (channelId: number) => void;
        break;
    }
  }

  /**
   * Close all channels
   */
  close(): void {
    for (const channel of this.channels) {
      if (channel && channel.readyState !== 'closed') {
        try {
          channel.close();
        } catch (error) {
          secureLog.error('[ParallelChannels] Error closing channel:', error);
        }
      }
    }

    this.channels = [];
    this.channelStats.clear();
    this.pausedChannels.clear();
    this.receivedChunks.clear();
    this.chunkOrder.clear();
  }
}

export default ParallelChannelManager;
