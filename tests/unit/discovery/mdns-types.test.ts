/**
 * Tests for mDNS type definitions and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseCapabilities,
  serializeCapabilities,
  createDeviceFromRecord,
  isValidTxtRecord,
  isValidClientMessage,
  isValidDaemonMessage,
  MDNS_SERVICE_TYPE,
  TRANSFER_PORT,
  DAEMON_WS_PORT,
  PROTOCOL_VERSION,
  type MDNSTxtRecord,
  type TallowCapability,
  type TallowPlatform,
  type WSClientMessage,
  type WSDaemonMessage,
} from '@/lib/discovery/mdns-types';

describe('mDNS Types', () => {
  describe('Constants', () => {
    it('should have correct service type', () => {
      expect(MDNS_SERVICE_TYPE).toBe('_tallow._tcp.local');
    });

    it('should have correct ports', () => {
      expect(TRANSFER_PORT).toBe(53317);
      expect(DAEMON_WS_PORT).toBe(53318);
    });

    it('should have protocol version', () => {
      expect(PROTOCOL_VERSION).toBe('1.0.0');
    });
  });

  describe('parseCapabilities', () => {
    it('should parse all capabilities correctly', () => {
      const caps = parseCapabilities('pqc,chat,folder,resume,screen,group');

      expect(caps.supportsPQC).toBe(true);
      expect(caps.supportsChat).toBe(true);
      expect(caps.supportsFolder).toBe(true);
      expect(caps.supportsResume).toBe(true);
      expect(caps.supportsScreen).toBe(true);
      expect(caps.supportsGroupTransfer).toBe(true);
    });

    it('should handle partial capabilities', () => {
      const caps = parseCapabilities('pqc,folder');

      expect(caps.supportsPQC).toBe(true);
      expect(caps.supportsChat).toBe(false);
      expect(caps.supportsFolder).toBe(true);
      expect(caps.supportsResume).toBe(false);
      expect(caps.supportsScreen).toBe(false);
      expect(caps.supportsGroupTransfer).toBe(false);
    });

    it('should handle empty string', () => {
      const caps = parseCapabilities('');

      expect(caps.supportsPQC).toBe(false);
      expect(caps.supportsChat).toBe(false);
      expect(caps.supportsFolder).toBe(false);
    });

    it('should handle case insensitivity', () => {
      const caps = parseCapabilities('PQC,CHAT,Folder');

      expect(caps.supportsPQC).toBe(true);
      expect(caps.supportsChat).toBe(true);
      expect(caps.supportsFolder).toBe(true);
    });

    it('should handle whitespace', () => {
      const caps = parseCapabilities('pqc , chat , folder');

      expect(caps.supportsPQC).toBe(true);
      expect(caps.supportsChat).toBe(true);
      expect(caps.supportsFolder).toBe(true);
    });
  });

  describe('serializeCapabilities', () => {
    it('should serialize capabilities to string', () => {
      const caps: TallowCapability[] = ['pqc', 'chat', 'folder'];
      const result = serializeCapabilities(caps);

      expect(result).toBe('pqc,chat,folder');
    });

    it('should handle empty array', () => {
      const caps: TallowCapability[] = [];
      const result = serializeCapabilities(caps);

      expect(result).toBe('');
    });

    it('should handle single capability', () => {
      const caps: TallowCapability[] = ['pqc'];
      const result = serializeCapabilities(caps);

      expect(result).toBe('pqc');
    });
  });

  describe('createDeviceFromRecord', () => {
    it('should create device from valid TXT record', () => {
      const txtRecord: MDNSTxtRecord = {
        version: '1.0.0',
        deviceId: 'TEST123',
        deviceName: 'Test Device',
        platform: 'macos',
        capabilities: 'pqc,chat',
        fingerprint: 'abc123',
      };

      const device = createDeviceFromRecord(txtRecord, '192.168.1.100', 53317);

      expect(device.id).toBe('TEST123');
      expect(device.name).toBe('Test Device');
      expect(device.platform).toBe('macos');
      expect(device.ip).toBe('192.168.1.100');
      expect(device.port).toBe(53317);
      expect(device.version).toBe('1.0.0');
      expect(device.capabilities).toBe('pqc,chat');
      expect(device.fingerprint).toBe('abc123');
      expect(device.isOnline).toBe(true);
      expect(device.source).toBe('mdns');
      expect(device.parsedCapabilities.supportsPQC).toBe(true);
      expect(device.parsedCapabilities.supportsChat).toBe(true);
    });

    it('should set correct source', () => {
      const txtRecord: MDNSTxtRecord = {
        version: '1.0.0',
        deviceId: 'TEST123',
        deviceName: 'Test',
        platform: 'web',
        capabilities: '',
        fingerprint: '',
      };

      const mdnsDevice = createDeviceFromRecord(txtRecord, '127.0.0.1', 53317, 'mdns');
      const signalingDevice = createDeviceFromRecord(txtRecord, '127.0.0.1', 53317, 'signaling');
      const manualDevice = createDeviceFromRecord(txtRecord, '127.0.0.1', 53317, 'manual');

      expect(mdnsDevice.source).toBe('mdns');
      expect(signalingDevice.source).toBe('signaling');
      expect(manualDevice.source).toBe('manual');
    });
  });

  describe('isValidTxtRecord', () => {
    it('should validate complete TXT record', () => {
      const record: MDNSTxtRecord = {
        version: '1.0.0',
        deviceId: 'TEST123',
        deviceName: 'Test Device',
        platform: 'macos',
        capabilities: 'pqc',
        fingerprint: 'abc123',
      };

      expect(isValidTxtRecord(record)).toBe(true);
    });

    it('should reject missing deviceId', () => {
      const record: Partial<MDNSTxtRecord> = {
        version: '1.0.0',
        deviceName: 'Test Device',
        platform: 'macos',
        capabilities: 'pqc',
        fingerprint: 'abc123',
      };

      expect(isValidTxtRecord(record)).toBe(false);
    });

    it('should reject invalid platform', () => {
      const record = {
        version: '1.0.0',
        deviceId: 'TEST123',
        deviceName: 'Test Device',
        platform: 'invalid' as TallowPlatform,
        capabilities: 'pqc',
        fingerprint: 'abc123',
      };

      expect(isValidTxtRecord(record)).toBe(false);
    });

    it('should accept all valid platforms', () => {
      const platforms: TallowPlatform[] = ['web', 'ios', 'android', 'macos', 'windows', 'linux'];

      platforms.forEach((platform) => {
        const record: MDNSTxtRecord = {
          version: '1.0.0',
          deviceId: 'TEST123',
          deviceName: 'Test',
          platform,
          capabilities: '',
          fingerprint: '',
        };

        expect(isValidTxtRecord(record)).toBe(true);
      });
    });
  });

  describe('isValidClientMessage', () => {
    it('should validate start-discovery message', () => {
      const msg: WSClientMessage = { type: 'start-discovery' };
      expect(isValidClientMessage(msg)).toBe(true);
    });

    it('should validate stop-discovery message', () => {
      const msg: WSClientMessage = { type: 'stop-discovery' };
      expect(isValidClientMessage(msg)).toBe(true);
    });

    it('should validate advertise message', () => {
      const msg: WSClientMessage = {
        type: 'advertise',
        device: {
          id: 'TEST123',
          name: 'Test',
          platform: 'web',
          capabilities: ['pqc'],
          fingerprint: 'abc',
        },
      };
      expect(isValidClientMessage(msg)).toBe(true);
    });

    it('should validate stop-advertising message', () => {
      const msg: WSClientMessage = { type: 'stop-advertising' };
      expect(isValidClientMessage(msg)).toBe(true);
    });

    it('should validate get-devices message', () => {
      const msg: WSClientMessage = { type: 'get-devices' };
      expect(isValidClientMessage(msg)).toBe(true);
    });

    it('should validate ping message', () => {
      const msg: WSClientMessage = { type: 'ping', timestamp: Date.now() };
      expect(isValidClientMessage(msg)).toBe(true);
    });

    it('should reject invalid message type', () => {
      const msg = { type: 'invalid-type' };
      expect(isValidClientMessage(msg)).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidClientMessage(null)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(isValidClientMessage('string')).toBe(false);
      expect(isValidClientMessage(123)).toBe(false);
    });
  });

  describe('isValidDaemonMessage', () => {
    it('should validate device-found message', () => {
      const msg: WSDaemonMessage = {
        type: 'device-found',
        device: {
          id: 'TEST123',
          name: 'Test',
          platform: 'web',
          ip: '127.0.0.1',
          port: 53317,
          version: '1.0.0',
          capabilities: 'pqc',
          parsedCapabilities: {
            supportsPQC: true,
            supportsChat: false,
            supportsFolder: false,
            supportsResume: false,
            supportsScreen: false,
            supportsGroupTransfer: false,
          },
          fingerprint: 'abc',
          discoveredAt: Date.now(),
          lastSeen: Date.now(),
          isOnline: true,
          source: 'mdns',
        },
      };
      expect(isValidDaemonMessage(msg)).toBe(true);
    });

    it('should validate device-lost message', () => {
      const msg: WSDaemonMessage = { type: 'device-lost', deviceId: 'TEST123' };
      expect(isValidDaemonMessage(msg)).toBe(true);
    });

    it('should validate error message', () => {
      const msg: WSDaemonMessage = { type: 'error', message: 'Something went wrong' };
      expect(isValidDaemonMessage(msg)).toBe(true);
    });

    it('should validate status message', () => {
      const msg: WSDaemonMessage = {
        type: 'status',
        status: 'discovering',
        isDiscovering: true,
        isAdvertising: false,
        deviceCount: 2,
      };
      expect(isValidDaemonMessage(msg)).toBe(true);
    });

    it('should validate pong message', () => {
      const msg: WSDaemonMessage = {
        type: 'pong',
        timestamp: Date.now(),
        serverTime: Date.now(),
      };
      expect(isValidDaemonMessage(msg)).toBe(true);
    });

    it('should reject invalid message type', () => {
      const msg = { type: 'invalid-type' };
      expect(isValidDaemonMessage(msg)).toBe(false);
    });
  });
});
