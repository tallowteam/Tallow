import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getRTCConfigurationMock: vi.fn(() => ({})),
  monitorConnectionMock: vi.fn(),
  detectNATTypeMock: vi.fn(),
}));

vi.mock('@/lib/transport/private-webrtc', () => ({
  getPrivateTransport: vi.fn(() => ({
    getRTCConfiguration: mocks.getRTCConfigurationMock,
    monitorConnection: mocks.monitorConnectionMock,
    filterCandidate: vi.fn(() => true),
    getStats: vi.fn(() => ({})),
  })),
}));

vi.mock('@/lib/network/nat-detection', () => ({
  detectNATType: mocks.detectNATTypeMock,
  getConnectionStrategy: vi.fn(() => ({
    strategy: 'direct',
    directTimeout: 15000,
    useTURN: false,
    prioritizeRelay: false,
    reason: 'test',
  })),
  getOptimizedICEConfig: vi.fn(() => ({ iceServers: [] })),
}));

vi.mock('@/lib/monitoring/metrics', () => ({
  recordWebRTCConnection: vi.fn(),
  recordError: vi.fn(),
  activeConnections: { dec: vi.fn() },
  turnRelayUsage: { labels: vi.fn(() => ({ inc: vi.fn() })) },
}));

import { DataChannelManager } from '@/lib/webrtc/data-channel';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('DataChannelManager NAT ordering', () => {
  let callOrder: string[] = [];

  class MockRTCDataChannel {
    binaryType: BinaryType = 'arraybuffer';
    bufferedAmount = 0;
    bufferedAmountLowThreshold = 0;
    readyState: RTCDataChannelState = 'open';
    ordered = false;
    maxRetransmits = 0;
    maxPacketLifeTime: number | null = null;
    onopen: ((this: RTCDataChannel, ev: Event) => void) | null = null;
    onclose: ((this: RTCDataChannel, ev: Event) => void) | null = null;
    onerror: ((this: RTCDataChannel, ev: Event) => void) | null = null;
    onmessage: ((this: RTCDataChannel, ev: MessageEvent<string | ArrayBuffer>) => void) | null = null;
    onbufferedamountlow: ((this: RTCDataChannel, ev: Event) => void) | null = null;

    send = vi.fn();
    close = vi.fn();
  }

  class MockRTCPeerConnection {
    localDescription: RTCSessionDescriptionInit | null = null;
    connectionState: RTCPeerConnectionState = 'new';
    iceConnectionState: RTCIceConnectionState = 'new';
    iceGatheringState: RTCIceGatheringState = 'complete';

    onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => void) | null = null;
    onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null = null;
    onicegatheringstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null = null;
    oniceconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null = null;
    ondatachannel: ((this: RTCPeerConnection, ev: RTCDataChannelEvent) => void) | null = null;

    constructor(_config: RTCConfiguration) {
      callOrder.push('rtc');
    }

    createDataChannel(): RTCDataChannel {
      return new MockRTCDataChannel() as unknown as RTCDataChannel;
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
      return { type: 'offer', sdp: 'mock-offer' };
    }

    async createAnswer(): Promise<RTCSessionDescriptionInit> {
      return { type: 'answer', sdp: 'mock-answer' };
    }

    async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
      this.localDescription = description;
    }

    async setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
      // noop
    }

    async addIceCandidate(_candidate: RTCIceCandidateInit): Promise<void> {
      // noop
    }

    async getStats(): Promise<Map<string, RTCStats>> {
      return new Map();
    }

    addEventListener(): void {
      // noop
    }

    removeEventListener(): void {
      // noop
    }

    close(): void {
      // noop
    }
  }

  beforeEach(() => {
    callOrder = [];
    mocks.detectNATTypeMock.mockReset();
    mocks.getRTCConfigurationMock.mockClear();
    mocks.monitorConnectionMock.mockClear();
    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection as unknown as typeof RTCPeerConnection);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('waits for NAT detection before creating an offer connection', async () => {
    const natDeferred = createDeferred<{
      type: 'FULL_CONE';
      confidence: number;
      detectionTime: number;
      candidateCount: number;
      srflxCount: number;
      relayCount: number;
      hostCount: number;
    }>();

    mocks.detectNATTypeMock.mockImplementation(() => {
      callOrder.push('nat');
      return natDeferred.promise;
    });

    const manager = new DataChannelManager({
      enableNATDetection: true,
      statsInterval: 60000,
      connectionTimeout: 2000,
    });

    const pending = manager.createConnection('peer-1', 'Peer 1', 'socket-1');

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callOrder).toEqual(['nat']);

    natDeferred.resolve({
      type: 'FULL_CONE',
      confidence: 0.95,
      detectionTime: 10,
      candidateCount: 3,
      srflxCount: 2,
      relayCount: 0,
      hostCount: 1,
    });

    const result = await pending;
    expect(result.offer.type).toBe('offer');
    expect(callOrder).toEqual(['nat', 'rtc']);
    manager.destroy();
  });

  it('waits for NAT detection before accepting and answering a connection', async () => {
    const natDeferred = createDeferred<{
      type: 'PORT_RESTRICTED';
      confidence: number;
      detectionTime: number;
      candidateCount: number;
      srflxCount: number;
      relayCount: number;
      hostCount: number;
    }>();

    mocks.detectNATTypeMock.mockImplementation(() => {
      callOrder.push('nat');
      return natDeferred.promise;
    });

    const manager = new DataChannelManager({
      enableNATDetection: true,
      statsInterval: 60000,
      connectionTimeout: 2000,
    });

    const pending = manager.acceptConnection(
      'peer-2',
      'Peer 2',
      'socket-2',
      { type: 'offer', sdp: 'remote-offer' }
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callOrder).toEqual(['nat']);

    natDeferred.resolve({
      type: 'PORT_RESTRICTED',
      confidence: 0.82,
      detectionTime: 12,
      candidateCount: 4,
      srflxCount: 2,
      relayCount: 1,
      hostCount: 1,
    });

    const result = await pending;
    expect(result.answer.type).toBe('answer');
    expect(callOrder).toEqual(['nat', 'rtc']);
    manager.destroy();
  });
});
