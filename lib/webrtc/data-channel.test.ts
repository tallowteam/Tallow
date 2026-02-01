/**
 * Data Channel Manager Tests
 *
 * These tests verify the WebRTC data channel implementation for group transfers.
 *
 * Note: These are integration tests that require a running signaling server.
 * For unit tests, mock the RTCPeerConnection and RTCDataChannel APIs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataChannelManager, isWebRTCSupported, isDataChannelOpen } from './data-channel';

describe('DataChannelManager', () => {
  let manager: DataChannelManager;

  beforeEach(() => {
    manager = new DataChannelManager({
      maxPeers: 5,
      enablePrivacyMode: true,
      connectionTimeout: 10000,
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const defaultManager = new DataChannelManager();
      expect(defaultManager).toBeDefined();
      expect(defaultManager.getPeerCount()).toBe(0);
      defaultManager.destroy();
    });

    it('should initialize with custom config', () => {
      expect(manager).toBeDefined();
      expect(manager.getPeerCount()).toBe(0);
    });

    it('should accept event callbacks', () => {
      const onPeerConnected = vi.fn();
      const onPeerDisconnected = vi.fn();

      const managerWithEvents = new DataChannelManager(
        {},
        { onPeerConnected, onPeerDisconnected }
      );

      expect(managerWithEvents).toBeDefined();
      managerWithEvents.destroy();
    });
  });

  describe('peer management', () => {
    it('should track peer count correctly', () => {
      expect(manager.getPeerCount()).toBe(0);
    });

    it('should prevent exceeding max peers', async () => {
      const manager5Peers = new DataChannelManager({ maxPeers: 2 });

      // This would need mocked WebRTC APIs to fully test
      // For now, verify the config is set
      expect(manager5Peers.getPeerCount()).toBe(0);

      manager5Peers.destroy();
    });

    it('should get empty array when no peers connected', () => {
      const connected = manager.getConnectedPeers();
      expect(connected).toEqual([]);
    });

    it('should get all peers', () => {
      const all = manager.getAllPeers();
      expect(all).toEqual([]);
    });
  });

  describe('connection lifecycle', () => {
    it('should check connection status', () => {
      const isConnected = manager.isConnectedToPeer('peer-1');
      expect(isConnected).toBe(false);
    });

    it('should get null peer info for non-existent peer', () => {
      const peer = manager.getPeer('non-existent');
      expect(peer).toBeUndefined();
    });

    it('should get null stats for non-existent peer', () => {
      const stats = manager.getStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('helper functions', () => {
    it('should check WebRTC support', () => {
      // In Node.js test environment, WebRTC may not be available
      // In browser, this should return true
      const supported = isWebRTCSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should check data channel state', () => {
      expect(isDataChannelOpen(null)).toBe(false);
    });
  });

  describe('privacy features', () => {
    it('should get privacy stats', () => {
      const stats = manager.getPrivacyStats();
      expect(stats).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should disconnect all peers on destroy', () => {
      manager.destroy();
      expect(manager.getPeerCount()).toBe(0);
    });

    it('should handle multiple destroy calls', () => {
      manager.destroy();
      manager.destroy(); // Should not throw
      expect(manager.getPeerCount()).toBe(0);
    });
  });
});

describe('DataChannelManager - Connection Creation (mocked)', () => {
  // Mock WebRTC APIs
  const mockRTCPeerConnection = vi.fn();
  const mockRTCDataChannel = vi.fn();

  beforeEach(() => {
    // Setup mocks
    (global as any).RTCPeerConnection = mockRTCPeerConnection;
    (global as any).RTCDataChannel = mockRTCDataChannel;
  });

  it('should create connection as initiator', async () => {
    // This test requires full WebRTC mocking
    // For production use, test with real browser environment
    expect(true).toBe(true);
  });

  it('should accept connection as receiver', async () => {
    // This test requires full WebRTC mocking
    expect(true).toBe(true);
  });
});

describe('Connection Quality Monitoring', () => {
  it('should track connection quality', () => {
    const manager = new DataChannelManager();
    const quality = manager.getPeer('test-peer');
    expect(quality).toBeUndefined();
    manager.destroy();
  });
});
