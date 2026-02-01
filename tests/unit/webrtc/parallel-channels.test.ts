import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParallelChannelManager } from '@/lib/webrtc/parallel-channels';
import type { TransferChunk } from '@/lib/types';

// Mock RTCPeerConnection and RTCDataChannel
class MockRTCDataChannel {
  label: string;
  readyState: RTCDataChannelState = 'connecting';
  bufferedAmount = 0;
  bufferedAmountLowThreshold = 0;
  binaryType: BinaryType = 'arraybuffer';
  ordered = false;
  maxRetransmits: number | null = 0;
  maxPacketLifeTime: number | null = null;

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onbufferedamountlow: ((event: Event) => void) | null = null;

  private sendBuffer: ArrayBuffer[] = [];

  constructor(label: string, init?: RTCDataChannelInit) {
    this.label = label;
    if (init) {
      if (init.ordered !== undefined) {this.ordered = init.ordered;}
      if (init.maxRetransmits !== undefined) {this.maxRetransmits = init.maxRetransmits;}
      if (init.maxPacketLifeTime !== undefined) {this.maxPacketLifeTime = init.maxPacketLifeTime;}
    }
  }

  send(data: ArrayBuffer | string): void {
    if (typeof data === 'string') {
      this.sendBuffer.push(new TextEncoder().encode(data).buffer);
    } else {
      this.sendBuffer.push(data);
    }
    this.bufferedAmount += data instanceof ArrayBuffer ? data.byteLength : data.length;
  }

  close(): void {
    this.readyState = 'closed';
    this.onclose?.(new Event('close'));
  }

  simulateOpen(): void {
    this.readyState = 'open';
    this.onopen?.(new Event('open'));
  }

  simulateDrain(): void {
    this.bufferedAmount = 0;
    this.onbufferedamountlow?.(new Event('bufferedamountlow'));
  }

  simulateReceive(data: ArrayBuffer): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  getSentData(): ArrayBuffer[] {
    return this.sendBuffer;
  }
}

class MockRTCPeerConnection {
  private channels: MockRTCDataChannel[] = [];
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null = null;

  createDataChannel(label: string, init?: RTCDataChannelInit): MockRTCDataChannel {
    const channel = new MockRTCDataChannel(label, init);
    this.channels.push(channel);
    return channel;
  }

  simulateRemoteChannel(label: string): MockRTCDataChannel {
    const channel = new MockRTCDataChannel(label);
    const event = new Event('datachannel') as RTCDataChannelEvent;
    (event as any).channel = channel;
    this.ondatachannel?.(event);
    return channel;
  }

  getChannels(): MockRTCDataChannel[] {
    return this.channels;
  }

  close(): void {
    for (const channel of this.channels) {
      channel.close();
    }
  }
}

describe('ParallelChannelManager', () => {
  let mockPC: MockRTCPeerConnection;

  beforeEach(() => {
    mockPC = new MockRTCPeerConnection();
  });

  afterEach(() => {
    mockPC.close();
  });

  describe('Initialization', () => {
    it('should create specified number of channels as initiator', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 3 }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      expect(channels).toHaveLength(3);
      expect(channels[0]?.label).toBe('tallow-parallel-0');
      expect(channels[1]?.label).toBe('tallow-parallel-1');
      expect(channels[2]?.label).toBe('tallow-parallel-2');
    });

    it('should configure channels with optimal settings', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        {
          channelCount: 2,
          ordered: false,
          maxRetransmits: 0,
          bufferLowThreshold: 4 * 1024 * 1024,
        }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      expect(channels[0]?.ordered).toBe(false);
      expect(channels[0]?.maxRetransmits).toBe(0);
      expect(channels[0]?.bufferedAmountLowThreshold).toBe(4 * 1024 * 1024);
    });

    it('should wait for remote channels as receiver', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        false,
        { channelCount: 2 }
      );

      const initPromise = manager.initialize();

      // Simulate remote channels
      setTimeout(() => {
        const ch1 = mockPC.simulateRemoteChannel('tallow-parallel-0');
        const ch2 = mockPC.simulateRemoteChannel('tallow-parallel-1');
        ch1.simulateOpen();
        ch2.simulateOpen();
      }, 10);

      await initPromise;
      expect(manager.areAllChannelsReady()).toBe(true);
    });

    it('should validate channel count', () => {
      expect(() => {
        new ParallelChannelManager(mockPC as any, true, { channelCount: 0 });
      }).toThrow('Channel count must be between 1 and 8');

      expect(() => {
        new ParallelChannelManager(mockPC as any, true, { channelCount: 9 });
      }).toThrow('Channel count must be between 1 and 8');
    });
  });

  describe('Sending', () => {
    it('should send chunks using round-robin distribution', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 3 }
      );

      await manager.initialize();

      // Simulate channels opening
      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
      }

      // Send 6 chunks
      const chunks: TransferChunk[] = [];
      for (let i = 0; i < 6; i++) {
        chunks.push({
          transferId: 'test-transfer',
          chunkIndex: i,
          totalChunks: 6,
          data: new Uint8Array([i]).buffer,
          hash: `hash-${i}`,
          encrypted: false,
        });
      }

      for (const chunk of chunks) {
        await manager.sendChunk(chunk);
      }

      const stats = manager.getStats();
      expect(stats.totalChunksSent).toBe(6);

      // Each channel should have received ~2 chunks
      expect(stats.channels[0]?.chunksSent).toBe(2);
      expect(stats.channels[1]?.chunksSent).toBe(2);
      expect(stats.channels[2]?.chunksSent).toBe(2);
    });

    it('should handle backpressure by pausing channels', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        {
          channelCount: 2,
          bufferThreshold: 100, // Low threshold for testing
        }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
      }

      // Simulate high buffer
      channels[0]!.bufferedAmount = 150; // Exceeds threshold

      const chunk: TransferChunk = {
        transferId: 'test',
        chunkIndex: 0,
        totalChunks: 1,
        data: new Uint8Array(50).buffer,
        hash: 'hash',
        encrypted: false,
      };

      // Should use channel 1 (channel 0 is over threshold)
      await manager.sendChunk(chunk);

      const stats = manager.getStats();
      expect(stats.channels[0]?.chunksSent).toBe(0);
      expect(stats.channels[1]?.chunksSent).toBe(1);
    });

    it('should throw error when all channels have backpressure', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        {
          channelCount: 2,
          bufferThreshold: 100,
        }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
        ch.bufferedAmount = 150; // All over threshold
      }

      const chunk: TransferChunk = {
        transferId: 'test',
        chunkIndex: 0,
        totalChunks: 1,
        data: new Uint8Array(50).buffer,
        hash: 'hash',
        encrypted: false,
      };

      await expect(manager.sendChunk(chunk)).rejects.toThrow(
        'All channels are experiencing backpressure'
      );
    });

    it('should resume sending after drain event', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        {
          channelCount: 1,
          bufferThreshold: 100,
        }
      );

      await manager.initialize();

      const channel = mockPC.getChannels()[0]!;
      channel.simulateOpen();

      // Simulate backpressure
      channel.bufferedAmount = 150;

      const chunk: TransferChunk = {
        transferId: 'test',
        chunkIndex: 0,
        totalChunks: 1,
        data: new Uint8Array(50).buffer,
        hash: 'hash',
        encrypted: false,
      };

      // First send should fail
      await expect(manager.sendChunk(chunk)).rejects.toThrow();

      // Simulate drain
      channel.simulateDrain();

      // Second send should succeed
      await manager.sendChunk(chunk);

      const stats = manager.getStats();
      expect(stats.totalChunksSent).toBe(1);
    });
  });

  describe('Receiving', () => {
    it('should receive and store chunks', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 2 }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
      }

      let receivedCount = 0;
      manager.on('chunk', (chunk, channelId) => {
        receivedCount++;
        expect(chunk.transferId).toBe('test-transfer');
        expect(channelId).toBeGreaterThanOrEqual(0);
        expect(channelId).toBeLessThan(2);
      });

      // Simulate receiving chunks
      const chunk1: TransferChunk = {
        transferId: 'test-transfer',
        chunkIndex: 0,
        totalChunks: 2,
        data: new Uint8Array([1]).buffer,
        hash: 'hash-0',
        encrypted: false,
      };

      const chunk2: TransferChunk = {
        transferId: 'test-transfer',
        chunkIndex: 1,
        totalChunks: 2,
        data: new Uint8Array([2]).buffer,
        hash: 'hash-1',
        encrypted: false,
      };

      // Send chunk through manager to serialize it
      await manager.sendChunk(chunk1);
      await manager.sendChunk(chunk2);

      const sentData = [
        ...channels[0]!.getSentData(),
        ...channels[1]!.getSentData(),
      ];

      // Simulate receiving
      for (let i = 0; i < sentData.length; i++) {
        channels[i % 2]!.simulateReceive(sentData[i]!);
      }

      expect(receivedCount).toBe(2);

      const ordered = manager.getOrderedChunks('test-transfer');
      expect(ordered).toHaveLength(2);
      expect(ordered[0]?.chunkIndex).toBe(0);
      expect(ordered[1]?.chunkIndex).toBe(1);
    });

    it('should order received chunks correctly', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 1 }
      );

      await manager.initialize();

      const channel = mockPC.getChannels()[0]!;
      channel.simulateOpen();

      // Send chunks in order
      for (let i = 0; i < 5; i++) {
        const chunk: TransferChunk = {
          transferId: 'test',
          chunkIndex: i,
          totalChunks: 5,
          data: new Uint8Array([i]).buffer,
          hash: `hash-${i}`,
          encrypted: false,
        };
        await manager.sendChunk(chunk);
      }

      // Simulate receiving in random order
      const sentData = channel.getSentData();
      const randomOrder = [2, 0, 4, 1, 3];
      for (const idx of randomOrder) {
        channel.simulateReceive(sentData[idx]!);
      }

      // Should be ordered correctly
      const ordered = manager.getOrderedChunks('test');
      expect(ordered).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(ordered[i]?.chunkIndex).toBe(i);
      }
    });
  });

  describe('Statistics', () => {
    it('should track statistics per channel', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 2 }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
      }

      // Send chunks
      for (let i = 0; i < 4; i++) {
        const chunk: TransferChunk = {
          transferId: 'test',
          chunkIndex: i,
          totalChunks: 4,
          data: new Uint8Array(1000).buffer,
          hash: `hash-${i}`,
          encrypted: false,
        };
        await manager.sendChunk(chunk);
      }

      const stats = manager.getStats();

      expect(stats.totalChunksSent).toBe(4);
      expect(stats.totalBytesSent).toBeGreaterThan(4000); // Includes metadata
      expect(stats.channels).toHaveLength(2);
      expect(stats.channels[0]?.chunksSent).toBe(2);
      expect(stats.channels[1]?.chunksSent).toBe(2);
    });

    it('should track paused channels', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        {
          channelCount: 2,
          bufferThreshold: 100,
        }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
      }

      channels[0]!.bufferedAmount = 150;

      const chunk: TransferChunk = {
        transferId: 'test',
        chunkIndex: 0,
        totalChunks: 1,
        data: new Uint8Array(50).buffer,
        hash: 'hash',
        encrypted: false,
      };

      await manager.sendChunk(chunk);

      const stats = manager.getStats();
      expect(stats.pausedChannels).toBe(1);
      expect(stats.channels[0]?.isPaused).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should close all channels', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 3 }
      );

      await manager.initialize();

      const channels = mockPC.getChannels();
      for (const ch of channels) {
        ch.simulateOpen();
      }

      manager.close();

      for (const ch of channels) {
        expect(ch.readyState).toBe('closed');
      }
    });

    it('should clear transfer data', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 1 }
      );

      await manager.initialize();

      const channel = mockPC.getChannels()[0]!;
      channel.simulateOpen();

      const chunk: TransferChunk = {
        transferId: 'test',
        chunkIndex: 0,
        totalChunks: 1,
        data: new Uint8Array(100).buffer,
        hash: 'hash',
        encrypted: false,
      };

      await manager.sendChunk(chunk);
      channel.simulateReceive(channel.getSentData()[0]!);

      expect(manager.getOrderedChunks('test')).toHaveLength(1);

      manager.clearTransfer('test');

      expect(manager.getOrderedChunks('test')).toHaveLength(0);
    });
  });

  describe('Event Handlers', () => {
    it('should trigger ready event when all channels open', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 2 }
      );

      let readyCalled = false;
      manager.on('ready', () => {
        readyCalled = true;
      });

      await manager.initialize();

      const channels = mockPC.getChannels();
      channels[0]?.simulateOpen();

      expect(readyCalled).toBe(false);

      channels[1]?.simulateOpen();

      expect(readyCalled).toBe(true);
    });

    it('should trigger drain event', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 1 }
      );

      let drainedChannelId = -1;
      manager.on('drain', (channelId) => {
        drainedChannelId = channelId;
      });

      await manager.initialize();

      const channel = mockPC.getChannels()[0]!;
      channel.simulateOpen();

      // Simulate backpressure
      channel.bufferedAmount = 1000000;
      const chunk: TransferChunk = {
        transferId: 'test',
        chunkIndex: 0,
        totalChunks: 1,
        data: new Uint8Array(100).buffer,
        hash: 'hash',
        encrypted: false,
      };

      await expect(manager.sendChunk(chunk)).rejects.toThrow();

      // Simulate drain
      channel.simulateDrain();

      expect(drainedChannelId).toBe(0);
    });

    it('should trigger error event', async () => {
      const manager = new ParallelChannelManager(
        mockPC as any,
        true,
        { channelCount: 1 }
      );

      let errorReceived: Error | null = null;
      let errorChannelId = -1;

      manager.on('error', (error, channelId) => {
        errorReceived = error;
        errorChannelId = channelId;
      });

      await manager.initialize();

      const channel = mockPC.getChannels()[0]!;
      channel.onerror?.(new Event('error'));

      expect(errorReceived).toBeInstanceOf(Error);
      expect(errorChannelId).toBe(0);
    });
  });
});
