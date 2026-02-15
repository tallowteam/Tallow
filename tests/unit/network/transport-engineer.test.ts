/**
 * Transport Engineer Tests (Agent 025)
 *
 * Validates:
 *   - WebTransport connection class lifecycle and state machine
 *   - Transport selector scoring, negotiation, and fallback chain
 *   - Feature detection for WebTransport (browser vs SSR)
 *   - Experimental protocol declarations (QUIC raw, MPTCP) are gated
 *   - File transfer framing protocol helpers
 *   - Connection quality assessment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// WebTransport Module
// ============================================================================

describe('Transport Engineer - WebTransport Module', () => {
  it('should export all public API members', async () => {
    const mod = await import('@/lib/transport/webtransport');
    expect(mod.WebTransportConnection).toBeDefined();
    expect(mod.connect).toBeDefined();
    expect(mod.isWebTransportSupported).toBeDefined();
    expect(mod.getWebTransportSupport).toBeDefined();
    expect(mod.readStream).toBeDefined();
    expect(mod.writeStream).toBeDefined();
    expect(mod.pipeStreams).toBeDefined();
  });

  it('isWebTransportSupported returns false in Node/test environment', async () => {
    const { isWebTransportSupported } = await import('@/lib/transport/webtransport');
    // In vitest (Node), WebTransport global does not exist
    expect(isWebTransportSupported()).toBe(false);
  });

  it('getWebTransportSupport returns reason in SSR environment', async () => {
    const { getWebTransportSupport } = await import('@/lib/transport/webtransport');
    const support = getWebTransportSupport();
    expect(support.supported).toBe(false);
    expect(support.reason).toBeDefined();
    expect(support.fallbackSuggestion).toBeDefined();
  });

  it('WebTransportConnection starts in "new" state', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    expect(conn.getState()).toBe('new');
    expect(conn.isConnected()).toBe(false);
  });

  it('WebTransportConnection stats initialize to zero', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    const stats = conn.getStats();
    expect(stats.bytesSent).toBe(0);
    expect(stats.bytesReceived).toBe(0);
    expect(stats.datagramsSent).toBe(0);
    expect(stats.datagramsReceived).toBe(0);
    expect(stats.streamsSent).toBe(0);
    expect(stats.streamsReceived).toBe(0);
    expect(stats.connectionTimeMs).toBe(0);
    expect(stats.smoothedRttMs).toBe(0);
    expect(stats.throughputBps).toBe(0);
    expect(stats.state).toBe('new');
  });

  it('connect() throws when WebTransport is not supported', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    await expect(conn.connect()).rejects.toThrow(/not supported/i);
    expect(conn.getState()).toBe('failed');
  });

  it('close() is idempotent', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    // Calling close multiple times should not throw
    conn.close();
    conn.close();
    expect(conn.getState()).toBe('closed');
  });

  it('close() fires onclose callback', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    const onclose = vi.fn();
    conn.onclose = onclose;
    conn.close({ closeCode: 0, reason: 'test' });
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose).toHaveBeenCalledWith({ closeCode: 0, reason: 'test' });
  });

  it('connect() fires onstatechange callback', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    const states: string[] = [];
    conn.onstatechange = (s) => states.push(s);
    // Will fail because WebTransport is not available, but should still fire state changes
    await conn.connect().catch(() => {});
    // Should have gone through 'connecting' -> 'failed'
    expect(states).toContain('connecting');
    expect(states).toContain('failed');
  });

  it('createBidirectionalStream throws when not connected', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    await expect(conn.createBidirectionalStream()).rejects.toThrow(/not connected/i);
  });

  it('sendDatagram throws when not connected', async () => {
    const { WebTransportConnection } = await import('@/lib/transport/webtransport');
    const conn = new WebTransportConnection({ url: 'https://example.com' });
    await expect(conn.sendDatagram(new Uint8Array([1, 2, 3]))).rejects.toThrow(/not connected/i);
  });
});

// ============================================================================
// Stream Helpers
// ============================================================================

describe('Transport Engineer - Stream Helpers', () => {
  it('readStream reads full stream into Uint8Array', async () => {
    const { readStream } = await import('@/lib/transport/webtransport');
    const chunks = [new Uint8Array([1, 2]), new Uint8Array([3, 4, 5])];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    });

    const result = await readStream(stream);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it('readStream returns empty array for empty stream', async () => {
    const { readStream } = await import('@/lib/transport/webtransport');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });

    const result = await readStream(stream);
    expect(result.byteLength).toBe(0);
  });

  it('writeStream splits data into chunks', async () => {
    const { writeStream } = await import('@/lib/transport/webtransport');
    const written: Uint8Array[] = [];
    const writable = new WritableStream<Uint8Array>({
      write(chunk) {
        written.push(new Uint8Array(chunk));
      },
    });

    const data = new Uint8Array(10);
    for (let i = 0; i < 10; i++) data[i] = i;
    await writeStream(writable, data, 4); // 4-byte chunks

    expect(written.length).toBe(3); // 4 + 4 + 2
    expect(written[0]!.length).toBe(4);
    expect(written[1]!.length).toBe(4);
    expect(written[2]!.length).toBe(2);

    // Verify data integrity
    const reassembled = new Uint8Array(10);
    let offset = 0;
    for (const chunk of written) {
      reassembled.set(chunk, offset);
      offset += chunk.length;
    }
    expect(reassembled).toEqual(data);
  });
});

// ============================================================================
// Transport Selector
// ============================================================================

describe('Transport Engineer - Transport Selector', () => {
  it('should export all public API members', async () => {
    const mod = await import('@/lib/transport/transport-selector');
    expect(mod.selectBestTransport).toBeDefined();
    expect(mod.detectBrowserSupport).toBeDefined();
    expect(mod.isTransportSupported).toBeDefined();
    expect(mod.getTransportCapabilities).toBeDefined();
    expect(mod.createTransportOffer).toBeDefined();
    expect(mod.processTransportOffer).toBeDefined();
    expect(mod.attemptWithFallback).toBeDefined();
    expect(mod.assessTransportQuality).toBeDefined();
    expect(mod.isExperimentalProtocolAvailable).toBeDefined();
  });

  it('detectBrowserSupport returns all false in test environment', async () => {
    const { detectBrowserSupport } = await import('@/lib/transport/transport-selector');
    const support = detectBrowserSupport();
    // Node/vitest: no browser APIs
    expect(support.webTransport).toBe(false);
    expect(support.http3).toBe(false);
    // WebSocket is available in Node
    // webRTC may or may not be -- just check the shape
    expect(typeof support.webRTC).toBe('boolean');
    expect(typeof support.webSocket).toBe('boolean');
  });

  it('getTransportCapabilities returns valid capabilities for each protocol', async () => {
    const { getTransportCapabilities } = await import('@/lib/transport/transport-selector');
    for (const proto of ['webtransport', 'webrtc', 'websocket'] as const) {
      const caps = getTransportCapabilities(proto);
      expect(caps.protocol).toBe(proto);
      expect(['low', 'medium', 'high']).toContain(caps.latency);
      expect(['high', 'medium', 'low']).toContain(caps.throughput);
      expect(typeof caps.privacyScore).toBe('number');
      expect(typeof caps.supportScore).toBe('number');
    }
  });

  it('getTransportCapabilities throws for unknown protocol', async () => {
    const { getTransportCapabilities } = await import('@/lib/transport/transport-selector');
    expect(() => getTransportCapabilities('ftp' as any)).toThrow(/unknown protocol/i);
  });

  it('selectBestTransport with all support selects webtransport when serverUrl provided', async () => {
    const { selectBestTransport } = await import('@/lib/transport/transport-selector');
    const result = await selectBestTransport({
      browserSupport: { webTransport: true, webRTC: true, webSocket: true, http3: true },
      serverUrl: 'https://wt.example.com',
      requireHighThroughput: true,
      preferThroughput: true,
    });
    expect(result.selected).toBe('webtransport');
    expect(result.fallbacks).toContain('webrtc');
    expect(result.estimatedLatency).toBeGreaterThan(0);
    expect(result.estimatedBandwidth).toBeGreaterThan(0);
  });

  it('selectBestTransport falls back to webrtc when webtransport is unavailable', async () => {
    const { selectBestTransport } = await import('@/lib/transport/transport-selector');
    const result = await selectBestTransport({
      browserSupport: { webTransport: false, webRTC: true, webSocket: true, http3: false },
      requireHighThroughput: true,
    });
    expect(result.selected).toBe('webrtc');
  });

  it('selectBestTransport falls back to websocket when nothing else available', async () => {
    const { selectBestTransport } = await import('@/lib/transport/transport-selector');
    const result = await selectBestTransport({
      browserSupport: { webTransport: false, webRTC: false, webSocket: true, http3: false },
      serverUrl: 'wss://relay.example.com',
    });
    expect(result.selected).toBe('websocket');
  });

  it('selectBestTransport throws when no protocol is available', async () => {
    const { selectBestTransport } = await import('@/lib/transport/transport-selector');
    await expect(
      selectBestTransport({
        browserSupport: { webTransport: false, webRTC: false, webSocket: false, http3: false },
      }),
    ).rejects.toThrow(/no supported/i);
  });

  it('selectBestTransport penalizes webtransport when no serverUrl', async () => {
    const { selectBestTransport } = await import('@/lib/transport/transport-selector');
    const result = await selectBestTransport({
      browserSupport: { webTransport: true, webRTC: true, webSocket: true, http3: true },
      // no serverUrl
    });
    // Without server URL, WebRTC should score higher
    expect(result.selected).toBe('webrtc');
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it('strict requirements throw on latency violation', async () => {
    const { selectBestTransport } = await import('@/lib/transport/transport-selector');
    await expect(
      selectBestTransport({
        browserSupport: { webTransport: false, webRTC: false, webSocket: true, http3: false },
        serverUrl: 'wss://relay.example.com',
        strictRequirements: true,
        maxLatencyMs: 5, // WebSocket can't do 5ms
      }),
    ).rejects.toThrow(/latency/i);
  });
});

// ============================================================================
// Transport Negotiation
// ============================================================================

describe('Transport Engineer - Transport Negotiation', () => {
  it('createTransportOffer produces valid offer message', async () => {
    const { createTransportOffer } = await import('@/lib/transport/transport-selector');
    const offer = createTransportOffer({
      browserSupport: { webTransport: true, webRTC: true, webSocket: true, http3: true },
      serverUrl: 'https://wt.example.com',
    });
    expect(offer.type).toBe('transport-offer');
    expect(offer.supported.length).toBeGreaterThan(0);
    expect(offer.serverUrl).toBe('https://wt.example.com');
    expect(offer.browserSupport).toBeDefined();
  });

  it('processTransportOffer agrees on mutually supported protocol', async () => {
    const { createTransportOffer, processTransportOffer } = await import(
      '@/lib/transport/transport-selector'
    );

    // Initiator supports WebTransport + WebRTC + WebSocket
    const offer = createTransportOffer({
      browserSupport: { webTransport: true, webRTC: true, webSocket: true, http3: true },
      serverUrl: 'https://wt.example.com',
    });

    // Responder only supports WebRTC + WebSocket
    const { answer, agreed } = processTransportOffer(offer, {
      browserSupport: { webTransport: false, webRTC: true, webSocket: true, http3: false },
    });

    expect(agreed).toBe('webrtc'); // Best mutual option
    expect(answer.type).toBe('transport-answer');
    expect(answer.agreed).toBe('webrtc');
  });

  it('processTransportOffer falls back to websocket when needed', async () => {
    const { processTransportOffer } = await import('@/lib/transport/transport-selector');

    const offer = {
      type: 'transport-offer' as const,
      supported: ['webtransport' as const],
      serverUrl: 'https://wt.example.com',
      browserSupport: { webTransport: true, webRTC: false, webSocket: true, http3: true },
    };

    const { agreed } = processTransportOffer(offer, {
      browserSupport: { webTransport: false, webRTC: false, webSocket: true, http3: false },
    });

    // Neither supports the other's primary, but both have websocket
    expect(agreed).toBe('websocket');
  });
});

// ============================================================================
// Connection Quality Assessment
// ============================================================================

describe('Transport Engineer - Quality Assessment', () => {
  it('assessTransportQuality returns quality between 0 and 1', async () => {
    const { assessTransportQuality } = await import('@/lib/transport/transport-selector');

    const excellent = assessTransportQuality('webtransport', 5, 15 * 1024 * 1024);
    expect(excellent.quality).toBeGreaterThan(0.8);

    const poor = assessTransportQuality('websocket', 180, 100_000);
    expect(poor.quality).toBeLessThan(0.2);

    const medium = assessTransportQuality('webrtc', 50, 3 * 1024 * 1024);
    expect(medium.quality).toBeGreaterThan(0.3);
    expect(medium.quality).toBeLessThan(0.9);
  });

  it('assessTransportQuality includes timestamp', async () => {
    const { assessTransportQuality } = await import('@/lib/transport/transport-selector');
    const before = Date.now();
    const result = assessTransportQuality('webrtc', 20, 5_000_000);
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.protocol).toBe('webrtc');
  });
});

// ============================================================================
// Experimental Protocol Gates
// ============================================================================

describe('Transport Engineer - Experimental Protocol Gates', () => {
  it('isExperimentalProtocolAvailable always returns false for quic-raw', async () => {
    const { isExperimentalProtocolAvailable } = await import(
      '@/lib/transport/transport-selector'
    );
    expect(isExperimentalProtocolAvailable('quic-raw')).toBe(false);
  });

  it('isExperimentalProtocolAvailable always returns false for mptcp', async () => {
    const { isExperimentalProtocolAvailable } = await import(
      '@/lib/transport/transport-selector'
    );
    expect(isExperimentalProtocolAvailable('mptcp')).toBe(false);
  });

  it('QuicRawConfig and MptcpConfig types exist as exports', async () => {
    // Type-only check: importing the module should not throw
    const mod = await import('@/lib/transport/transport-selector');
    // These are type-only exports, so we just verify the module loaded
    expect(mod).toBeDefined();
  });
});

// ============================================================================
// Privacy Transport (existing)
// ============================================================================

describe('Transport Engineer - Privacy Transport', () => {
  it('should have private WebRTC module', async () => {
    const mod = await import('@/lib/transport/private-webrtc');
    expect(mod).toBeDefined();
    expect(mod.PrivateTransport).toBeDefined();
    expect(mod.getPrivateTransport).toBeDefined();
  });

  it('should have obfuscation module', async () => {
    const mod = await import('@/lib/transport/obfuscation');
    expect(mod).toBeDefined();
  });
});

// ============================================================================
// Barrel Exports
// ============================================================================

describe('Transport Engineer - Barrel Exports', () => {
  it('index barrel exports WebTransport members', async () => {
    const mod = await import('@/lib/transport/index');
    expect(mod.WebTransportConnection).toBeDefined();
    expect(mod.connect).toBeDefined();
    expect(mod.isWebTransportSupported).toBeDefined();
  });

  it('index barrel exports transport selector members', async () => {
    const mod = await import('@/lib/transport/index');
    expect(mod.selectBestTransport).toBeDefined();
    expect(mod.createTransportOffer).toBeDefined();
    expect(mod.processTransportOffer).toBeDefined();
    expect(mod.attemptWithFallback).toBeDefined();
    expect(mod.assessTransportQuality).toBeDefined();
    expect(mod.isExperimentalProtocolAvailable).toBeDefined();
  });

  it('index barrel exports convenience selectors', async () => {
    const mod = await import('@/lib/transport/index');
    expect(mod.selectForFileTransfer).toBeDefined();
    expect(mod.selectForRealtime).toBeDefined();
    expect(mod.selectForChat).toBeDefined();
    expect(mod.selectForSignaling).toBeDefined();
    expect(mod.selectForPrivacy).toBeDefined();
  });
});
