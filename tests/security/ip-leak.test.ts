/**
 * IP Leak Prevention Tests
 * Tests WebRTC IP leak prevention mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivateTransport } from '@/lib/transport/private-webrtc';

describe('IP Leak Prevention', () => {
  let transport: PrivateTransport;

  beforeEach(() => {
    transport = new PrivateTransport({
      forceRelay: true,
      logCandidates: false,
    });
  });

  describe('ICE Candidate Filtering', () => {
    it('should filter local IP candidates in relay-only mode', () => {
      const localCandidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(localCandidate);
      expect(result).toBe(false);
    });

    it('should allow relay candidates', () => {
      const relayCandidate = {
        candidate: 'candidate:2 1 UDP 16777215 203.0.113.50 54321 typ relay',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(relayCandidate);
      expect(result).toBe(true);
    });

    it('should filter IPv6 link-local addresses', () => {
      const ipv6LinkLocal = {
        candidate: 'candidate:3 1 UDP 2130706431 fe80::1234:5678:9abc:def0 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(ipv6LinkLocal);
      expect(result).toBe(false);
    });

    it('should filter private IP ranges (10.x.x.x)', () => {
      const privateIP = {
        candidate: 'candidate:4 1 UDP 2130706431 10.0.0.5 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(privateIP);
      expect(result).toBe(false);
    });

    it('should filter private IP ranges (172.16-31.x.x)', () => {
      const privateIP = {
        candidate: 'candidate:5 1 UDP 2130706431 172.16.0.1 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(privateIP);
      expect(result).toBe(false);
    });
  });

  describe('RTCConfiguration', () => {
    it('should enforce relay-only iceTransportPolicy', () => {
      const config = transport.getRTCConfiguration();
      expect(config.iceTransportPolicy).toBe('relay');
    });

    it('should disable ICE candidate pre-gathering', () => {
      const config = transport.getRTCConfiguration();
      expect(config.iceCandidatePoolSize).toBe(0);
    });

    it('should only include TURN servers in relay mode', () => {
      const config = transport.getRTCConfiguration();
      const hasStun = config.iceServers?.some(server =>
        server.urls.toString().includes('stun:')
      );
      expect(hasStun).toBe(false);
    });
  });

  describe('SDP Filtering', () => {
    it('should remove local IPs from SDP', () => {
      const sdp = `v=0
o=- 123456 2 IN IP4 192.168.1.100
s=-
t=0 0
a=candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host`;

      const filtered = transport.filterSDP(sdp);
      expect(filtered).not.toContain('192.168.1.100');
    });

    it('should preserve relay candidates in SDP', () => {
      const sdp = `a=candidate:2 1 UDP 16777215 203.0.113.50 54321 typ relay`;
      const filtered = transport.filterSDP(sdp);
      expect(filtered).toContain('typ relay');
    });
  });

  describe('IP Leak Detection Callback', () => {
    it('should trigger callback when local IP detected', () => {
      const onLeakDetected = vi.fn();
      const transportWithCallback = new PrivateTransport({
        forceRelay: true,
        onIpLeakDetected: onLeakDetected,
      });

      const localCandidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      transportWithCallback.filterCandidate(localCandidate);
      expect(onLeakDetected).toHaveBeenCalledWith(localCandidate);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track filtered candidates', () => {
      const localCandidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      transport.filterCandidate(localCandidate);
      const stats = transport.getStats();

      expect(stats.filteredCandidates).toBeGreaterThan(0);
    });

    it('should track relay candidates', () => {
      const relayCandidate = {
        candidate: 'candidate:2 1 UDP 16777215 203.0.113.50 54321 typ relay',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      transport.filterCandidate(relayCandidate);
      const stats = transport.getStats();

      expect(stats.relayCandidates).toBeGreaterThan(0);
    });
  });
});
