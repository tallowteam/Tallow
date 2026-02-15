import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectFirewall,
  getGuidance,
  getFirewallStatusIcon,
  clearFirewallCache,
  getCachedResult,
  shouldRedetect,
  getDiagnosticReport,
  isNetworkUsable,
  needsProxyCredentials,
  onNetworkChange,
  type FirewallDetectionResult,
  type FirewallType,
} from '../../../lib/network/firewall-detection';

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Build a minimal valid FirewallDetectionResult for getGuidance / utility tests.
 * Only the fields actually read by the utility functions need to be present.
 */
function makeResult(overrides: Partial<FirewallDetectionResult> = {}): FirewallDetectionResult {
  return {
    stun: false,
    websocket: false,
    turn: false,
    turns: false,
    directP2P: false,
    httpsFetch: false,
    transparentProxy: { detected: false, injectedHeaders: [], responseModified: false, detail: '' },
    proxyAuth: { required: false, schemes: [], realm: '', rawHeader: '' },
    firewallType: 'none',
    recommendedTransport: 'none',
    fallbackChain: [],
    recommendations: [],
    diagnosticSummary: '',
    detectionTime: 100,
    timestamp: Date.now(),
    testDetails: {
      stun: { success: false, time: 0, availability: 'not_tested' },
      websocket: { success: false, time: 0, availability: 'not_tested' },
      turn: { success: false, time: 0, availability: 'not_tested' },
      turns: { success: false, time: 0, availability: 'not_tested' },
      directP2P: { success: false, time: 0, availability: 'not_tested' },
      httpsFetch: { success: false, time: 0, availability: 'not_tested' },
    },
    ...overrides,
  };
}

// ============================================================================
// Mock RTCPeerConnection (default: gathering completes without useful candidates)
// ============================================================================

class MockRTCPeerConnection {
  onicecandidate: ((event: any) => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  iceGatheringState: string = 'new';

  constructor(public config: any) {}

  createDataChannel(_label: string) {
    return {};
  }

  async createOffer() {
    return { type: 'offer', sdp: 'mock-sdp' };
  }

  async setLocalDescription(_desc: any) {
    // Simulate ICE gathering that completes without finding useful candidates
    setTimeout(() => {
      this.iceGatheringState = 'complete';
      if (this.onicegatheringstatechange) {
        this.onicegatheringstatechange();
      }
    }, 10);
  }

  close() {}
}

// ============================================================================
// Mock WebSocket (default: opens successfully)
// ============================================================================

class MockWebSocket {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readyState: number = 0; // CONNECTING

  constructor(public url: string) {
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

// ============================================================================
// Mock fetch (default: success with no proxy headers)
// ============================================================================

function createMockFetch(opts: {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
  reject?: boolean;
  abortReject?: boolean;
} = {}) {
  return vi.fn().mockImplementation((_url: string, options?: any) => {
    return new Promise((resolve, reject) => {
      if (opts.reject) {
        reject(new TypeError('Network error'));
        return;
      }
      if (opts.abortReject) {
        const err = new DOMException('The operation was aborted', 'AbortError');
        reject(err);
        return;
      }
      // Respect AbortSignal
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      }
      const headersMap = new Map(Object.entries(opts.headers || {}));
      resolve({
        ok: opts.ok ?? true,
        status: opts.status ?? 200,
        headers: {
          get: (name: string) => headersMap.get(name.toLowerCase()) ?? null,
          has: (name: string) => headersMap.has(name.toLowerCase()),
        },
      });
    });
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('Firewall Detection', () => {
  beforeEach(() => {
    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.stubGlobal('fetch', createMockFetch());
    clearFirewallCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // --------------------------------------------------------------------------
  // Core detection
  // --------------------------------------------------------------------------

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

    it('should include test details for all probes', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.testDetails).toBeDefined();
      expect(result.testDetails.stun).toBeDefined();
      expect(result.testDetails.websocket).toBeDefined();
      expect(result.testDetails.turn).toBeDefined();
      expect(result.testDetails.turns).toBeDefined();
      expect(result.testDetails.directP2P).toBeDefined();
      expect(result.testDetails.httpsFetch).toBeDefined();
    });

    it('should include TURNS and httpsFetch booleans', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(typeof result.turns).toBe('boolean');
      expect(typeof result.httpsFetch).toBe('boolean');
    });

    it('should include transparent proxy evidence', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.transparentProxy).toBeDefined();
      expect(typeof result.transparentProxy.detected).toBe('boolean');
      expect(result.transparentProxy.injectedHeaders).toBeInstanceOf(Array);
    });

    it('should include proxy auth info', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.proxyAuth).toBeDefined();
      expect(typeof result.proxyAuth.required).toBe('boolean');
      expect(result.proxyAuth.schemes).toBeInstanceOf(Array);
    });

    it('should select a recommended transport', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.recommendedTransport).toBeDefined();
      expect(result.fallbackChain).toBeInstanceOf(Array);
    });

    it('should provide a diagnostic summary string', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(typeof result.diagnosticSummary).toBe('string');
      expect(result.diagnosticSummary.length).toBeGreaterThan(0);
      expect(result.diagnosticSummary).toContain('Firewall Detection Report');
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

    it('should invoke onTestComplete callback for each test', async () => {
      const completedTests: string[] = [];
      await detectFirewall({
        timeout: 100,
        skipCache: true,
        onTestComplete: (name) => { completedTests.push(name); },
      });

      expect(completedTests).toContain('stun');
      expect(completedTests).toContain('websocket');
      expect(completedTests).toContain('turn');
      expect(completedTests).toContain('turns');
      expect(completedTests).toContain('directP2P');
      expect(completedTests).toContain('httpsFetch');
    });
  });

  // --------------------------------------------------------------------------
  // Classification
  // --------------------------------------------------------------------------

  describe('Firewall Classification', () => {
    it('should classify as "none" when all tests pass', async () => {
      class PassingPeerConnection extends MockRTCPeerConnection {
        async setLocalDescription(_desc: any) {
          setTimeout(() => {
            if (this.onicecandidate) {
              // Emit both host and srflx candidates
              this.onicecandidate({
                candidate: { type: 'host', candidate: 'mock-host-candidate' },
              });
              this.onicecandidate({
                candidate: { type: 'srflx', candidate: 'mock-srflx-candidate' },
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

      const result = await detectFirewall({ skipCache: true, timeout: 200 });

      // With host+srflx candidates, websocket open, and fetch success, should be "none"
      expect(['none', 'moderate']).toContain(result.firewallType);
    });

    it('should classify as corporate when only HTTPS works', async () => {
      // No RTC, no WebSocket
      vi.stubGlobal('RTCPeerConnection', undefined);

      class FailingWebSocket {
        onopen: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onclose: (() => void) | null = null;
        readyState = 0;
        constructor() {
          setTimeout(() => { if (this.onerror) this.onerror(); }, 5);
        }
        close() { this.readyState = 3; }
      }
      vi.stubGlobal('WebSocket', FailingWebSocket);

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      // STUN=false, WS=false, P2P=false, httpsFetch=true => corporate
      expect(result.firewallType).toBe('corporate');
    });

    it('should provide recommendations', async () => {
      const result = await detectFirewall({ skipCache: true, timeout: 100 });

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Proxy detection
  // --------------------------------------------------------------------------

  describe('Transparent Proxy Detection', () => {
    it('should detect proxy-injected headers', async () => {
      vi.stubGlobal('fetch', createMockFetch({
        ok: true,
        headers: { 'via': '1.1 proxy.corp.example.com', 'x-forwarded-for': '10.0.0.1' },
      }));

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.transparentProxy.detected).toBe(true);
      expect(result.transparentProxy.injectedHeaders.length).toBeGreaterThan(0);
    });

    it('should report no proxy when headers are clean', async () => {
      vi.stubGlobal('fetch', createMockFetch({ ok: true, headers: {} }));

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.transparentProxy.detected).toBe(false);
      expect(result.transparentProxy.injectedHeaders.length).toBe(0);
    });
  });

  describe('Proxy Auth Detection', () => {
    it('should detect 407 proxy authentication required', async () => {
      vi.stubGlobal('fetch', createMockFetch({
        ok: false,
        status: 407,
        headers: { 'proxy-authenticate': 'NTLM, Basic realm="Corporate Proxy"' },
      }));

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.proxyAuth.required).toBe(true);
      expect(result.proxyAuth.schemes).toContain('ntlm');
      expect(result.proxyAuth.schemes).toContain('basic');
      expect(result.proxyAuth.realm).toBe('Corporate Proxy');
      expect(result.firewallType).toBe('corporate');
    });

    it('should report no auth when fetch succeeds normally', async () => {
      vi.stubGlobal('fetch', createMockFetch({ ok: true }));

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.proxyAuth.required).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Fallback chain
  // --------------------------------------------------------------------------

  describe('Fallback Chain', () => {
    it('should include websocket_relay when WS is available', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      // Default MockWebSocket opens successfully
      expect(result.websocket).toBe(true);
      expect(result.fallbackChain).toContain('websocket_relay');
    });

    it('should include http2_streaming when fetch succeeds', async () => {
      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.httpsFetch).toBe(true);
      expect(result.fallbackChain).toContain('http2_streaming');
    });

    it('should return none when nothing works', async () => {
      vi.stubGlobal('RTCPeerConnection', undefined);

      class FailingWebSocket {
        onopen: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onclose: (() => void) | null = null;
        readyState = 0;
        constructor() {
          setTimeout(() => { if (this.onerror) this.onerror(); }, 5);
        }
        close() { this.readyState = 3; }
      }
      vi.stubGlobal('WebSocket', FailingWebSocket);
      vi.stubGlobal('fetch', createMockFetch({ reject: true }));

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.recommendedTransport).toBe('none');
      expect(result.fallbackChain.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Guidance helpers
  // --------------------------------------------------------------------------

  describe('getGuidance', () => {
    it('should provide guidance for "none" firewall', () => {
      const guidance = getGuidance(makeResult({ firewallType: 'none' }));
      expect(guidance).toContain('optimal');
    });

    it('should provide guidance for "moderate" firewall', () => {
      const guidance = getGuidance(makeResult({ firewallType: 'moderate' }));
      expect(guidance).toContain('relay');
    });

    it('should provide guidance for "strict" firewall', () => {
      const guidance = getGuidance(makeResult({ firewallType: 'strict' }));
      expect(guidance).toContain('firewall');
    });

    it('should provide guidance for "corporate" firewall', () => {
      const guidance = getGuidance(makeResult({ firewallType: 'corporate' }));
      expect(guidance).toContain('Corporate');
    });
  });

  // --------------------------------------------------------------------------
  // Status icon
  // --------------------------------------------------------------------------

  describe('getFirewallStatusIcon', () => {
    it('should return green for "none"', () => {
      const icon = getFirewallStatusIcon('none');
      expect(icon.color).toBe('green');
      expect(icon.icon).toBe('check');
    });

    it('should return yellow for "moderate"', () => {
      const icon = getFirewallStatusIcon('moderate');
      expect(icon.color).toBe('yellow');
      expect(icon.icon).toBe('warning');
    });

    it('should return orange for "strict"', () => {
      const icon = getFirewallStatusIcon('strict');
      expect(icon.color).toBe('orange');
      expect(icon.icon).toBe('shield');
    });

    it('should return red for "corporate"', () => {
      const icon = getFirewallStatusIcon('corporate');
      expect(icon.color).toBe('red');
      expect(icon.icon).toBe('shield');
    });
  });

  // --------------------------------------------------------------------------
  // Cache management
  // --------------------------------------------------------------------------

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
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime);
      await detectFirewall({ skipCache: true });
      expect(shouldRedetect()).toBe(false);

      // Advance time past cache duration (5 minutes)
      vi.spyOn(Date, 'now').mockReturnValue(startTime + (6 * 60 * 1000));
      expect(shouldRedetect()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Utility functions
  // --------------------------------------------------------------------------

  describe('Utility Functions', () => {
    it('getDiagnosticReport should return the diagnosticSummary', () => {
      const result = makeResult({ diagnosticSummary: 'test-report' });
      expect(getDiagnosticReport(result)).toBe('test-report');
    });

    it('isNetworkUsable should return true when transport is available', () => {
      expect(isNetworkUsable(makeResult({ recommendedTransport: 'websocket_relay' }))).toBe(true);
    });

    it('isNetworkUsable should return false when no transport', () => {
      expect(isNetworkUsable(makeResult({ recommendedTransport: 'none' }))).toBe(false);
    });

    it('needsProxyCredentials should reflect proxyAuth.required', () => {
      expect(needsProxyCredentials(makeResult({
        proxyAuth: { required: true, schemes: ['ntlm'], realm: 'corp', rawHeader: 'NTLM' },
      }))).toBe(true);
      expect(needsProxyCredentials(makeResult())).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

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

    it('should handle fetch unavailable', async () => {
      vi.stubGlobal('fetch', undefined);

      const result = await detectFirewall({ skipCache: true, timeout: 100 });

      expect(result.httpsFetch).toBe(false);
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

    it('should handle fetch network error', async () => {
      vi.stubGlobal('fetch', createMockFetch({ reject: true }));

      const result = await detectFirewall({ timeout: 100, skipCache: true });

      expect(result.httpsFetch).toBe(false);
      expect(result.testDetails.httpsFetch.availability).toBe('blocked');
    });
  });

  // --------------------------------------------------------------------------
  // Parallel execution
  // --------------------------------------------------------------------------

  describe('Parallel Test Execution', () => {
    it('should run tests in parallel', async () => {
      const start = Date.now();
      await detectFirewall({
        timeout: 100,
        skipCache: true,
      });
      const elapsed = Date.now() - start;

      // 6 tests in parallel should complete within ~1 timeout period
      expect(elapsed).toBeLessThan(500);
    });
  });

  // --------------------------------------------------------------------------
  // Concurrent detection
  // --------------------------------------------------------------------------

  describe('Detection In Progress', () => {
    it('should wait for in-progress detection', async () => {
      const promise1 = detectFirewall({ skipCache: true });
      const promise2 = detectFirewall();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.timestamp).toBe(result2.timestamp);
    });
  });

  // --------------------------------------------------------------------------
  // Network change monitoring
  // --------------------------------------------------------------------------

  describe('Network Change Monitoring', () => {
    it('should register and unregister callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = onNetworkChange(callback);

      expect(typeof unsubscribe).toBe('function');

      // Unsubscribe should not throw
      unsubscribe();
    });
  });
});
