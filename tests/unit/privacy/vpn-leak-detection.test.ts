import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { VPNLeakDetector } from '@/lib/privacy/vpn-leak-detection';

function createPeerConnectionMock(candidateIP: string) {
  return class MockRTCPeerConnection {
    onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;

    createDataChannel(): RTCDataChannel {
      return {} as RTCDataChannel;
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
      return { type: 'offer', sdp: 'mock-offer' };
    }

    async setLocalDescription(_description: RTCSessionDescriptionInit): Promise<void> {
      setTimeout(() => {
        this.onicecandidate?.({
          candidate: {
            candidate: `candidate:1 1 udp 2122260223 ${candidateIP} 53558 typ host`,
          } as RTCIceCandidate,
        } as RTCPeerConnectionIceEvent);
      }, 10);
    }

    close(): void {
      // noop
    }
  };
}

describe('VPNLeakDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('detects WebRTC IP leak and raises critical privacy risk when VPN is likely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ip: '1.1.1.1' }),
    }));
    vi.stubGlobal(
      'RTCPeerConnection',
      createPeerConnectionMock('8.8.8.8') as unknown as typeof RTCPeerConnection
    );

    const detector = new VPNLeakDetector();
    const pending = detector.performPrivacyCheck(false);

    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.publicIP).toBe('1.1.1.1');
    expect(result.hasWebRTCLeak).toBe(true);
    expect(result.leakedIPs).toContain('8.8.8.8');
    expect(result.isVPNLikely).toBe(true);
    expect(result.riskLevel).toBe('critical');
    expect(result.recommendations.some((r) => r.includes('Relay-only mode'))).toBe(true);
  });

  it('does not flag external leak risk when only private WebRTC IPs are exposed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ip: '1.1.1.1' }),
    }));
    vi.stubGlobal(
      'RTCPeerConnection',
      createPeerConnectionMock('192.168.1.10') as unknown as typeof RTCPeerConnection
    );

    const detector = new VPNLeakDetector();
    const pending = detector.performPrivacyCheck(false);

    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.hasWebRTCLeak).toBe(false);
    expect(result.leakedIPs).toEqual([]);
    expect(result.riskLevel).toBe('low');
  });

  it('uses cached results to avoid repeated network calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ip: '1.1.1.1' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal(
      'RTCPeerConnection',
      createPeerConnectionMock('8.8.4.4') as unknown as typeof RTCPeerConnection
    );

    const detector = new VPNLeakDetector();

    const first = detector.performPrivacyCheck(true);
    await vi.runAllTimersAsync();
    await first;

    const second = await detector.performPrivacyCheck(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.leakedIPs).toContain('8.8.4.4');
  });
});
