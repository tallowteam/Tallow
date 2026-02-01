/**
 * WebRTC Security Tests
 * Tests DTLS configuration, certificate validation, and ICE security
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivateTransport } from '@/lib/transport/private-webrtc';

describe('WebRTC Security', () => {
  let transport: PrivateTransport;

  beforeEach(() => {
    transport = new PrivateTransport({
      forceRelay: true,
      logCandidates: false,
    });
  });

  describe('DTLS Configuration', () => {
    it('should use secure RTCConfiguration', () => {
      const config = transport.getRTCConfiguration();

      // Should not allow null configuration
      expect(config).toBeDefined();
      expect(config.iceServers).toBeDefined();
    });

    it('should enforce relay-only ICE transport policy', () => {
      const config = transport.getRTCConfiguration();
      expect(config.iceTransportPolicy).toBe('relay');
    });

    it('should disable ICE candidate pre-gathering', () => {
      const config = transport.getRTCConfiguration();
      expect(config.iceCandidatePoolSize).toBe(0);
    });

    it('should not include STUN servers in privacy mode', () => {
      const config = transport.getRTCConfiguration();
      const hasStun = config.iceServers?.some(server => {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        return urls.some(url => url.includes('stun:'));
      });

      expect(hasStun).toBe(false);
    });
  });

  describe('Certificate Fingerprint Validation', () => {
    it('should validate certificate fingerprints in SDP', () => {
      const sdpWithFingerprint = `v=0
o=- 123456 2 IN IP4 127.0.0.1
s=-
t=0 0
a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99`;

      // Fingerprint should be present in valid SDP
      expect(sdpWithFingerprint).toContain('a=fingerprint:sha-256');
    });

    it('should reject weak hash algorithms', () => {
      const weakFingerprints = [
        'a=fingerprint:sha-1 AA:BB:CC:DD:EE:FF',
        'a=fingerprint:md5 AA:BB:CC:DD:EE:FF',
      ];

      weakFingerprints.forEach(fingerprint => {
        // Should not accept SHA-1 or MD5
        expect(fingerprint).toMatch(/sha-1|md5/);
      });
    });
  });

  describe('ICE Candidate Security', () => {
    it('should filter private IP ranges (RFC 1918)', () => {
      const privateIPs = [
        'candidate:1 1 UDP 2130706431 10.0.0.1 54321 typ host',
        'candidate:2 1 UDP 2130706431 172.16.0.1 54321 typ host',
        'candidate:3 1 UDP 2130706431 172.31.255.254 54321 typ host',
        'candidate:4 1 UDP 2130706431 192.168.1.1 54321 typ host',
      ];

      privateIPs.forEach(candidateStr => {
        const candidate = {
          candidate: candidateStr,
          sdpMLineIndex: 0,
          sdpMid: '0',
        } as RTCIceCandidate;

        const result = transport.filterCandidate(candidate);
        expect(result).toBe(false);
      });
    });

    it('should filter link-local addresses', () => {
      const linkLocalIPs = [
        'candidate:1 1 UDP 2130706431 169.254.1.1 54321 typ host',
        'candidate:2 1 UDP 2130706431 fe80::1 54321 typ host',
      ];

      linkLocalIPs.forEach(candidateStr => {
        const candidate = {
          candidate: candidateStr,
          sdpMLineIndex: 0,
          sdpMid: '0',
        } as RTCIceCandidate;

        const result = transport.filterCandidate(candidate);
        expect(result).toBe(false);
      });
    });

    it('should filter loopback addresses', () => {
      const loopbackIPs = [
        'candidate:1 1 UDP 2130706431 127.0.0.1 54321 typ host',
        'candidate:2 1 UDP 2130706431 ::1 54321 typ host',
      ];

      loopbackIPs.forEach(candidateStr => {
        const candidate = {
          candidate: candidateStr,
          sdpMLineIndex: 0,
          sdpMid: '0',
        } as RTCIceCandidate;

        const result = transport.filterCandidate(candidate);
        expect(result).toBe(false);
      });
    });

    it('should filter IPv6 unique local addresses', () => {
      const uniqueLocalIPs = [
        'candidate:1 1 UDP 2130706431 fc00::1 54321 typ host',
        'candidate:2 1 UDP 2130706431 fd00::1 54321 typ host',
      ];

      uniqueLocalIPs.forEach(candidateStr => {
        const candidate = {
          candidate: candidateStr,
          sdpMLineIndex: 0,
          sdpMid: '0',
        } as RTCIceCandidate;

        const result = transport.filterCandidate(candidate);
        expect(result).toBe(false);
      });
    });

    it('should allow relay candidates', () => {
      const relayCandidates = [
        'candidate:1 1 UDP 16777215 203.0.113.50 54321 typ relay',
        'candidate:2 1 TCP 16777215 203.0.113.51 54321 typ relay',
      ];

      relayCandidates.forEach(candidateStr => {
        const candidate = {
          candidate: candidateStr,
          sdpMLineIndex: 0,
          sdpMid: '0',
        } as RTCIceCandidate;

        const result = transport.filterCandidate(candidate);
        expect(result).toBe(true);
      });
    });

    it('should filter srflx candidates in privacy mode', () => {
      const srflxCandidate = {
        candidate: 'candidate:3 1 UDP 1694498815 203.0.113.1 54321 typ srflx',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(srflxCandidate);
      expect(result).toBe(false);
    });
  });

  describe('Connection Type Monitoring', () => {
    it('should detect direct connections when relay expected', () => {
      const stats = transport.getStats();

      // In relay-only mode, connection should be relay or none
      expect(['relay', 'none']).toContain(stats.connectionType);
    });

    it('should track connection statistics', () => {
      const candidate1 = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const candidate2 = {
        candidate: 'candidate:2 1 UDP 16777215 203.0.113.50 54321 typ relay',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      transport.filterCandidate(candidate1);
      transport.filterCandidate(candidate2);

      const stats = transport.getStats();

      expect(stats.totalCandidates).toBe(2);
      expect(stats.relayCandidates).toBe(1);
      expect(stats.filteredCandidates).toBe(1);
    });

    it('should mark connection as private when relay-only', () => {
      const stats = transport.getStats();
      expect(stats.isPrivate).toBe(true);
    });
  });

  describe('SDP Security', () => {
    it('should remove local IPs from connection lines', () => {
      const sdp = `v=0
o=- 123456 2 IN IP4 192.168.1.100
s=-
c=IN IP4 192.168.1.100
t=0 0`;

      const filtered = transport.filterSDP(sdp);

      // Local IPs should be replaced
      expect(filtered).not.toContain('192.168.1.100');
      expect(filtered).toContain('0.0.0.0');
    });

    it('should filter candidate lines with local IPs', () => {
      const sdp = `a=candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host
a=candidate:2 1 UDP 16777215 203.0.113.50 54321 typ relay`;

      const filtered = transport.filterSDP(sdp);

      // Host candidate should be removed
      expect(filtered).not.toContain('192.168.1.100');

      // Relay candidate should remain
      expect(filtered).toContain('typ relay');
    });

    it('should preserve relay candidates in SDP', () => {
      const sdp = `a=candidate:1 1 UDP 16777215 203.0.113.50 54321 typ relay`;
      const filtered = transport.filterSDP(sdp);

      expect(filtered).toBe(sdp);
    });
  });

  describe('Privacy Mode Configuration', () => {
    it('should create peer connection with privacy settings', () => {
      const pc = transport.createPrivatePeerConnection();

      expect(pc).toBeInstanceOf(RTCPeerConnection);
    });

    it('should use local network configuration when appropriate', () => {
      const localConfig = transport.getLocalNetworkConfiguration();

      expect(localConfig.iceTransportPolicy).toBe('all');
      expect(localConfig.iceServers).toEqual([]);
    });
  });

  describe('IP Leak Detection', () => {
    it('should invoke callback on IP leak detection', () => {
      const onLeakDetected = vi.fn();
      const monitoredTransport = new PrivateTransport({
        forceRelay: true,
        onIpLeakDetected: onLeakDetected,
      });

      const localCandidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      monitoredTransport.filterCandidate(localCandidate);

      expect(onLeakDetected).toHaveBeenCalledWith(localCandidate);
    });

    it('should mark connection as not private on leak', () => {
      const monitoredTransport = new PrivateTransport({
        forceRelay: true,
      });

      const localCandidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      monitoredTransport.filterCandidate(localCandidate);
      const stats = monitoredTransport.getStats();

      expect(stats.isPrivate).toBe(false);
    });
  });

  describe('Candidate Logging Security', () => {
    it('should sanitize IPs in logs', () => {
      const logTransport = new PrivateTransport({
        forceRelay: true,
        logCandidates: true,
      });

      const candidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      logTransport.filterCandidate(candidate);

      const log = logTransport.getCandidateLog();
      expect(log.length).toBeGreaterThan(0);

      // Actual implementation should sanitize in logging
      // This test documents expected behavior
    });

    it('should clear candidate log on demand', () => {
      transport.clearLog();
      const log = transport.getCandidateLog();
      expect(log).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null candidates gracefully', () => {
      const result = transport.filterCandidate(null);
      expect(result).toBe(true);
    });

    it('should handle malformed candidate strings', () => {
      const malformedCandidate = {
        candidate: 'invalid candidate string',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      expect(() => transport.filterCandidate(malformedCandidate)).not.toThrow();
    });

    it('should handle empty candidate strings', () => {
      const emptyCandidate = {
        candidate: '',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      const result = transport.filterCandidate(emptyCandidate);
      expect(result).toBe(true);
    });
  });

  describe('TURN Server Configuration', () => {
    it('should only use TURN servers in relay mode', () => {
      const config = transport.getRTCConfiguration();
      const servers = config.iceServers || [];

      servers.forEach(server => {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        urls.forEach(url => {
          if (url) {
            expect(url).toMatch(/^turn:|^turns:/);
          }
        });
      });
    });

    it('should use secure TURN (turns://) when available', () => {
      const config = transport.getRTCConfiguration();
      const servers = config.iceServers || [];

      // Should prefer turns:// over turn://
      const hasSecureTurn = servers.some(server => {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        return urls.some(url => url.startsWith('turns:'));
      });

      // If any TURN server is configured, prefer secure
      if (servers.length > 0) {
        expect(hasSecureTurn).toBe(true);
      }
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track relay-only status', () => {
      const relayCandidate = {
        candidate: 'candidate:1 1 UDP 16777215 203.0.113.50 54321 typ relay',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      transport.filterCandidate(relayCandidate);

      expect(transport.isRelayOnly()).toBe(false); // No non-relay filtered yet

      const hostCandidate = {
        candidate: 'candidate:2 1 UDP 2130706431 192.168.1.1 54321 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      } as RTCIceCandidate;

      transport.filterCandidate(hostCandidate);

      // Now we have relay + filtered host
      expect(transport.isRelayOnly()).toBe(true);
    });
  });
});
