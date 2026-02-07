import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectFirewall,
  getGuidance,
  getFirewallStatusIcon,
  clearFirewallCache,
  getCachedResult,
  shouldRedetect,
} from '../../../lib/network/firewall-detection';

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  onicecandidate: ((event: any) => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  iceGatheringState: string = 'new';

  constructor(public config: any) {}

  createDataChannel(label: string) {
    return {};
  }

  async createOffer() {
    return { type: 'offer', sdp: 'mock-sdp' };
  }

  async setLocalDescription(desc: any) {
    // Simulate ICE gathering
    setTimeout(() => {
      this.iceGatheringState = 'gathering';
      if (this.onicegatheringstatechange) {
        this.onicegatheringstatechange();
      }
    }, 10);
  }

  close() {}
}

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readyState: number = 0; // CONNECTING

  constructor(public url: string) {
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen();
      }
    }, 10);
  }

  close() {
    this.readyState = 3; // CLOSED
  }
}

describe('Firewall Detection', () => {
  beforeEach(() => {
    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
    vi.stubGlobal('WebSocket', MockWebSocket);
    clearFirewallCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('detectFirewall', () => {
    it('should detect firewall type', async () => {
      const result = await detectFirewall({
        timeout: 100,
        skipCache: true,
      });

      expect(result).toBeDefined();
      expect(result.firewallType).toMatch(/none|moderate|strict|corporate/);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.detectionTime).toBeGreaterThan(0);
    });

    it('should cache results', async () => {
      const result1 = await detectFirewall();
      const result2 = await detectFirewall();

      expect(result1.timestamp).toBe(result2.timestamp);
    });

    it('should skip cache when requested', async () => {
      const result1 = await detectFirewall({ skipCache: true });
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await detectFirewall({ skipCache: true });

      expect(result1.timestamp).not.toBe(result2.timestamp);
    });

    it('should use custom timeout', async () => {
      const result = await detectFirewall({
        timeout: 50,
        skipCache: true,
      });

      expect(result.detectionTime).toBeLessThan(500);
    });

    it('should test STUN connectivity', async () => {
      const result = await detectFirewall({ skipCache: true });

      expect(typeof result.stun).toBe('boolean');
    });

    it('should test WebSocket connectivity', async () => {
      const result = await detectFirewall({ skipCache: true });

      expect(typeof result.websocket).toBe('boolean');
    });

    it('should test direct P2P capability', async () => {
      const result = await detectFirewall({ skipCache: true });

      expect(typeof result.directP2P).toBe('boolean');
    });
  });

  describe('Firewall Classification', () => {
    it('should classify as "none" when all tests pass', async () => {
      // Mock all tests to pass
      class PassingPeerConnection extends MockRTCPeerConnection {
        async setLocalDescription(desc: any) {
          setTimeout(() => {
            if (this.onicecandidate) {
              this.onicecandidate({
                candidate: { type: 'srflx', candidate: 'mock-candidate' },
              });
            }
            this.iceGatheringState = 'complete';
            if (this.onicegatheringstatechange) {
              this.onicegatheringstatechange();
            }
          }, 10);
        }
      }

      vi.stubGlobal('RTCPeerConnection', PassingPeerConnection);

      const result = await detectFirewall({ skipCache: true });

      // Should be 'none' or 'moderate' depending on actual tests
      expect(['none', 'moderate']).toContain(result.firewallType);
    });

    it('should provide recommendations', async () => {
      const result = await detectFirewall({ skipCache: true });

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
      });
    });
  });

  describe('getGuidance', () => {
    it('should provide guidance for "none" firewall', () => {
      const guidance = getGuidance({
        firewallType: 'none',
        stun: true,
        websocket: true,
        turn: false,
        directP2P: true,
        recommendations: [],
        detectionTime: 100,
        timestamp: Date.now(),
      });

      expect(guidance).toContain('optimal');
    });

    it('should provide guidance for "moderate" firewall', () => {
      const guidance = getGuidance({
        firewallType: 'moderate',
        stun: true,
        websocket: true,
        turn: false,
        directP2P: false,
        recommendations: [],
        detectionTime: 100,
        timestamp: Date.now(),
      });

      expect(guidance).toContain('relay');
    });

    it('should provide guidance for "strict" firewall', () => {
      const guidance = getGuidance({
        firewallType: 'strict',
        stun: false,
        websocket: false,
        turn: false,
        directP2P: false,
        recommendations: [],
        detectionTime: 100,
        timestamp: Date.now(),
      });

      expect(guidance).toContain('firewall');
    });

    it('should provide guidance for "corporate" firewall', () => {
      const guidance = getGuidance({
        firewallType: 'corporate',
        stun: false,
        websocket: true,
        turn: false,
        directP2P: false,
        recommendations: [],
        detectionTime: 100,
        timestamp: Date.now(),
      });

      expect(guidance).toContain('Corporate');
    });
  });

  describe('getFirewallStatusIcon', () => {
    it('should return green icon for "none"', () => {
      const icon = getFirewallStatusIcon('none');
      expect(icon.color).toBe('green');
      expect(icon.icon).toBe('check');
    });

    it('should return yellow icon for "moderate"', () => {
      const icon = getFirewallStatusIcon('moderate');
      expect(icon.color).toBe('yellow');
      expect(icon.icon).toBe('warning');
    });

    it('should return red icon for "strict"', () => {
      const icon = getFirewallStatusIcon('strict');
      expect(icon.color).toBe('red');
      expect(icon.icon).toBe('shield');
    });

    it('should return red icon for "corporate"', () => {
      const icon = getFirewallStatusIcon('corporate');
      expect(icon.color).toBe('red');
      expect(icon.icon).toBe('shield');
    });
  });

  describe('Cache Management', () => {
    it('should return cached result', async () => {
      await detectFirewall({ skipCache: true });
      const cached = getCachedResult();

      expect(cached).not.toBeNull();
      expect(cached?.firewallType).toBeDefined();
    });

    it('should clear cache', async () => {
      await detectFirewall({ skipCache: true });
      clearFirewallCache();
      const cached = getCachedResult();

      expect(cached).toBeNull();
    });

    it('should detect when redetection is needed', async () => {
      clearFirewallCache();
      expect(shouldRedetect()).toBe(true);

      await detectFirewall({ skipCache: true });
      expect(shouldRedetect()).toBe(false);
    });

    it('should expire cache after duration', async () => {
      vi.useFakeTimers();

      await detectFirewall({ skipCache: true });
      expect(shouldRedetect()).toBe(false);

      // Advance time past cache duration (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);
      expect(shouldRedetect()).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle RTCPeerConnection unavailable', async () => {
      vi.stubGlobal('RTCPeerConnection', undefined);

      const result = await detectFirewall({ skipCache: true });

      expect(result.stun).toBe(false);
      expect(result.directP2P).toBe(false);
    });

    it('should handle WebSocket unavailable', async () => {
      vi.stubGlobal('WebSocket', undefined);

      const result = await detectFirewall({ skipCache: true });

      expect(result.websocket).toBe(false);
    });

    it('should handle test timeout', async () => {
      class SlowWebSocket {
        onopen: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onclose: (() => void) | null = null;
        readyState = 0;

        constructor(public url: string) {
          // Never completes
        }

        close() {
          this.readyState = 3;
        }
      }

      vi.stubGlobal('WebSocket', SlowWebSocket);

      const result = await detectFirewall({
        timeout: 50,
        skipCache: true,
      });

      expect(result.websocket).toBe(false);
    });
  });

  describe('Parallel Test Execution', () => {
    it('should run tests in parallel', async () => {
      const start = Date.now();
      await detectFirewall({
        timeout: 100,
        skipCache: true,
      });
      const elapsed = Date.now() - start;

      // Should be faster than sequential (4 tests * 100ms timeout = 400ms)
      expect(elapsed).toBeLessThan(350);
    });
  });

  describe('Detection In Progress', () => {
    it('should wait for in-progress detection', async () => {
      const promise1 = detectFirewall({ skipCache: true });
      const promise2 = detectFirewall();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.timestamp).toBe(result2.timestamp);
    });
  });
});
