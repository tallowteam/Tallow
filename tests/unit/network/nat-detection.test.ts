/**
 * NAT Detection Unit Tests
 *
 * Tests the NAT type detection and connection strategy logic including:
 * - NAT type classification from ICE candidates
 * - Connection strategy determination
 * - ICE configuration optimization
 * - Caching behavior
 * - Helper utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  detectNATType,
  getConnectionStrategy,
  getOptimizedICEConfig,
  clearNATCache,
  getNATTypeDescription,
  isRestrictiveNAT,
  isDirectConnectionLikely,
} from '@/lib/network/nat-detection';

describe('NAT Detection', () => {
  const stubPeerConnection = (pc: MockRTCPeerConnection) => {
    const ctor = vi.fn(function () {
      return pc;
    });
    vi.stubGlobal('RTCPeerConnection', ctor as unknown as typeof RTCPeerConnection);
    return ctor;
  };

  // Mock RTCPeerConnection
  class MockRTCPeerConnection {
    iceGatheringState: RTCIceGatheringState = 'new';
    onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
    onicegatheringstatechange: (() => void) | null = null;
    localDescription: RTCSessionDescriptionInit | null = null;

    createDataChannel = vi.fn();
    createOffer = vi.fn(async () => ({ type: 'offer' as const, sdp: 'mock-sdp' }));
    setLocalDescription = vi.fn(async (desc: RTCSessionDescriptionInit) => {
      this.localDescription = desc;
      this.startGathering();
    });
    close = vi.fn();

    private startGathering() {
      this.iceGatheringState = 'gathering';
      setTimeout(() => {
        if (this.onicegatheringstatechange) {
          this.onicegatheringstatechange();
        }
        this.iceGatheringState = 'complete';
        if (this.onicegatheringstatechange) {
          this.onicegatheringstatechange();
        }
      }, 10);
    }

    simulateCandidate(candidate: Partial<RTCIceCandidate>) {
      if (this.onicecandidate) {
        this.onicecandidate({
          candidate: candidate as RTCIceCandidate,
        });
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    clearNATCache();
    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
    vi.stubGlobal('performance', {
      now: vi.fn(() => Date.now()),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('NAT type detection', () => {
    it('detects FULL_CONE NAT', async () => {
      const pc = new MockRTCPeerConnection();
      stubPeerConnection(pc);

      const detectionPromise = detectNATType({ timeout: 100 });

      // Simulate srflx candidate with same port
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:1 1 udp 2122194687 203.0.113.5 12345 typ srflx raddr 192.168.1.100 rport 12345',
      });

      const result = await detectionPromise;
      expect(result.type).toBe('FULL_CONE');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('detects SYMMETRIC NAT', async () => {
      const pc = new MockRTCPeerConnection();
      stubPeerConnection(pc);

      const detectionPromise = detectNATType({ timeout: 100 });

      // Simulate multiple srflx candidates with different ports
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:1 1 udp 2122194687 203.0.113.5 12345 typ srflx raddr 192.168.1.100 rport 5000',
      });
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:2 1 udp 2122194687 203.0.113.6 12346 typ srflx raddr 192.168.1.100 rport 5000',
      });
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:3 1 udp 2122194687 203.0.113.7 12347 typ srflx raddr 192.168.1.100 rport 5000',
      });

      const result = await detectionPromise;
      expect(result.type).toBe('SYMMETRIC');
    });

    it('detects BLOCKED NAT', async () => {
      const pc = new MockRTCPeerConnection();
      stubPeerConnection(pc);

      const detectionPromise = detectNATType({ timeout: 100 });

      // No srflx candidates, only host
      pc.simulateCandidate({
        type: 'host',
        candidate: 'candidate:1 1 udp 2122194687 192.168.1.100 5000 typ host',
      });

      const result = await detectionPromise;
      expect(result.type).toBe('BLOCKED');
    });

    it('detects PORT_RESTRICTED NAT', async () => {
      const pc = new MockRTCPeerConnection();
      stubPeerConnection(pc);

      const detectionPromise = detectNATType({ timeout: 100 });

      // Simulate srflx candidates with varying ports
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:1 1 udp 2122194687 203.0.113.5 12345 typ srflx raddr 192.168.1.100 rport 5000',
      });
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:2 1 udp 2122194687 203.0.113.5 12346 typ srflx raddr 192.168.1.100 rport 5001',
      });

      const result = await detectionPromise;
      expect(result.type).toBe('PORT_RESTRICTED');
    });

    it('returns UNKNOWN when RTCPeerConnection unavailable', async () => {
      vi.unstubAllGlobals();

      const result = await detectNATType({ timeout: 100 });
      expect(result.type).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });

    it('includes candidate counts', async () => {
      const pc = new MockRTCPeerConnection();
      stubPeerConnection(pc);

      const detectionPromise = detectNATType({ timeout: 100 });

      pc.simulateCandidate({
        type: 'host',
        candidate: 'candidate:1 1 udp 2122194687 192.168.1.100 5000 typ host',
      });
      pc.simulateCandidate({
        type: 'srflx',
        candidate: 'candidate:2 1 udp 2122194687 203.0.113.5 12345 typ srflx',
      });
      pc.simulateCandidate({
        type: 'relay',
        candidate: 'candidate:3 1 udp 2122194687 198.51.100.1 3478 typ relay',
      });

      const result = await detectionPromise;
      expect(result.candidateCount).toBe(3);
      expect(result.hostCount).toBe(1);
      expect(result.srflxCount).toBe(1);
      expect(result.relayCount).toBe(1);
    });
  });

  describe('caching', () => {
    it('caches detection results', async () => {
      const pc = new MockRTCPeerConnection();
      const spy = stubPeerConnection(pc);

      await detectNATType({ timeout: 100 });
      await detectNATType({ timeout: 100 });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clears cache', async () => {
      const pc = new MockRTCPeerConnection();
      const spy = stubPeerConnection(pc);

      await detectNATType({ timeout: 100 });
      clearNATCache();
      await detectNATType({ timeout: 100 });

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('connection strategy', () => {
    it('recommends TURN only for blocked NATs', () => {
      const strategy = getConnectionStrategy('BLOCKED', 'FULL_CONE');

      expect(strategy.strategy).toBe('turn_only');
      expect(strategy.useTURN).toBe(true);
      expect(strategy.prioritizeRelay).toBe(true);
    });

    it('recommends TURN only for symmetric-to-symmetric', () => {
      const strategy = getConnectionStrategy('SYMMETRIC', 'SYMMETRIC');

      expect(strategy.strategy).toBe('turn_only');
      expect(strategy.directTimeout).toBe(0);
    });

    it('recommends quick fallback for one symmetric NAT', () => {
      const strategy = getConnectionStrategy('SYMMETRIC', 'FULL_CONE');

      expect(strategy.strategy).toBe('turn_fallback');
      expect(strategy.directTimeout).toBe(5000);
      expect(strategy.useTURN).toBe(true);
    });

    it('recommends direct for favorable NAT combination', () => {
      const strategy = getConnectionStrategy('FULL_CONE', 'FULL_CONE');

      expect(strategy.strategy).toBe('direct');
      expect(strategy.directTimeout).toBe(15000);
      expect(strategy.useTURN).toBe(false);
    });

    it('handles unknown NAT types conservatively', () => {
      const strategy = getConnectionStrategy('UNKNOWN', 'FULL_CONE');

      expect(strategy.strategy).toBe('turn_fallback');
      expect(strategy.useTURN).toBe(true);
    });

    it('includes reasoning', () => {
      const strategy = getConnectionStrategy('SYMMETRIC', 'SYMMETRIC');

      expect(strategy.reason).toBeTruthy();
      expect(strategy.reason.length).toBeGreaterThan(0);
    });
  });

  describe('ICE configuration optimization', () => {
    it('optimizes for BLOCKED NAT', () => {
      const config = getOptimizedICEConfig('BLOCKED');

      expect(config.iceTransportPolicy).toBe('all');
      expect(config.iceCandidatePoolSize).toBe(0);
    });

    it('optimizes for SYMMETRIC NAT', () => {
      const config = getOptimizedICEConfig('SYMMETRIC');

      expect(config.iceCandidatePoolSize).toBe(3);
      expect(config.bundlePolicy).toBe('max-bundle');
    });

    it('optimizes for FULL_CONE NAT', () => {
      const config = getOptimizedICEConfig('FULL_CONE');

      expect(config.iceCandidatePoolSize).toBe(8);
      expect(config.iceTransportPolicy).toBe('all');
    });

    it('includes STUN servers', () => {
      const config = getOptimizedICEConfig('FULL_CONE');

      expect(config.iceServers).toBeDefined();
      expect(config.iceServers!.length).toBeGreaterThan(0);
      expect(config.iceServers![0]!.urls).toContain('stun');
    });

    it('includes TURN server when provided', () => {
      const config = getOptimizedICEConfig(
        'SYMMETRIC',
        'turn:turn.example.com:3478',
        { username: 'user', credential: 'pass' }
      );

      const turnServer = config.iceServers?.find(s =>
        s.urls.toString().includes('turn')
      );
      expect(turnServer).toBeDefined();
      expect(turnServer?.username).toBe('user');
      expect(turnServer?.credential).toBe('pass');
    });
  });

  describe('NAT type descriptions', () => {
    it('provides description for FULL_CONE', () => {
      const desc = getNATTypeDescription('FULL_CONE');
      expect(desc).toContain('permissive');
    });

    it('provides description for SYMMETRIC', () => {
      const desc = getNATTypeDescription('SYMMETRIC');
      expect(desc).toContain('Restrictive');
    });

    it('provides description for BLOCKED', () => {
      const desc = getNATTypeDescription('BLOCKED');
      expect(desc).toContain('Blocked');
    });

    it('provides description for UNKNOWN', () => {
      const desc = getNATTypeDescription('UNKNOWN');
      expect(desc).toContain('Unknown');
    });
  });

  describe('helper functions', () => {
    it('identifies restrictive NATs', () => {
      expect(isRestrictiveNAT('SYMMETRIC')).toBe(true);
      expect(isRestrictiveNAT('BLOCKED')).toBe(true);
      expect(isRestrictiveNAT('FULL_CONE')).toBe(false);
      expect(isRestrictiveNAT('RESTRICTED')).toBe(false);
    });

    it('predicts direct connection likelihood', () => {
      expect(isDirectConnectionLikely('FULL_CONE', 'FULL_CONE')).toBe(true);
      expect(isDirectConnectionLikely('SYMMETRIC', 'SYMMETRIC')).toBe(false);
      expect(isDirectConnectionLikely('BLOCKED', 'FULL_CONE')).toBe(false);
    });
  });

  describe('timeout handling', () => {
    it('respects custom timeout', async () => {
      const pc = new MockRTCPeerConnection();
      stubPeerConnection(pc);

      const start = Date.now();
      await detectNATType({ timeout: 50 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('custom STUN servers', () => {
    it('uses custom STUN servers', async () => {
      const customServers = ['stun:custom.stun.server:3478'];
      const result = await detectNATType({
        stunServers: customServers,
        timeout: 100,
      });

      expect(result).toBeDefined();
    });
  });
});
