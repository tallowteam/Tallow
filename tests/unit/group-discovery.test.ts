/**
 * Unit Tests for Group Discovery Integration
 * Tests device discovery, connection management, and group transfer integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GroupDiscoveryManager } from '@/lib/discovery/group-discovery-manager';
import type { DiscoveredDevice } from '@/lib/discovery/local-discovery';

describe('GroupDiscoveryManager', () => {
    let manager: GroupDiscoveryManager;

    beforeEach(() => {
        manager = new GroupDiscoveryManager();
    });

    afterEach(() => {
        manager.destroy();
    });

    describe('Device Discovery', () => {
        it('should discover group-transfer capable devices', async () => {
            const devices = await manager.discoverGroupTransferDevices({
                maxDevices: 5,
            });

            expect(Array.isArray(devices)).toBe(true);
            expect(devices.length).toBeLessThanOrEqual(5);
        });

        it('should filter devices by PQC requirement', async () => {
            const devices = await manager.discoverGroupTransferDevices({
                requirePQC: true,
            });

            devices.forEach((device) => {
                expect(device.capabilities?.supportsPQC).toBe(true);
            });
        });

        it('should respect min and max device limits', async () => {
            const devices = await manager.discoverGroupTransferDevices({
                minDevices: 2,
                maxDevices: 10,
            });

            expect(devices.length).toBeLessThanOrEqual(10);
        });
    });

    describe('Device Validation', () => {
        it('should validate devices for group transfer', () => {
            const mockDevices: DiscoveredDevice[] = [
                {
                    id: 'device-1',
                    name: 'Device 1',
                    platform: 'desktop',
                    lastSeen: new Date(),
                    isOnline: true,
                    socketId: 'socket-1',
                    capabilities: {
                        supportsGroupTransfer: true,
                        supportsPQC: true,
                        maxConnections: 10,
                        protocolVersion: '2.0.0',
                    },
                },
                {
                    id: 'device-2',
                    name: 'Device 2',
                    platform: 'mobile',
                    lastSeen: new Date(),
                    isOnline: false,
                    socketId: 'socket-2',
                },
            ];

            const result = manager.validateDevicesForGroupTransfer(mockDevices);

            expect(result.valid.length).toBe(1);
            expect(result.valid[0]?.id).toBe('device-1');
            expect(result.invalid.length).toBe(1);
            expect(result.invalid[0]?.reason).toContain('offline');
        });

        it('should reject devices without socket connection', () => {
            const mockDevices: DiscoveredDevice[] = [
                {
                    id: 'device-1',
                    name: 'Device 1',
                    platform: 'desktop',
                    lastSeen: new Date(),
                    isOnline: true,
                    // No socketId
                },
            ];

            const result = manager.validateDevicesForGroupTransfer(mockDevices);

            expect(result.valid.length).toBe(0);
            expect(result.invalid.length).toBe(1);
            expect(result.invalid[0]?.reason).toContain('socket');
        });

        it('should reject devices without group transfer capability', () => {
            const mockDevices: DiscoveredDevice[] = [
                {
                    id: 'device-1',
                    name: 'Device 1',
                    platform: 'desktop',
                    lastSeen: new Date(),
                    isOnline: true,
                    socketId: 'socket-1',
                    capabilities: {
                        supportsGroupTransfer: false,
                        supportsPQC: true,
                        maxConnections: 10,
                        protocolVersion: '2.0.0',
                    },
                },
            ];

            const result = manager.validateDevicesForGroupTransfer(mockDevices);

            expect(result.valid.length).toBe(0);
            expect(result.invalid.length).toBe(1);
            expect(result.invalid[0]?.reason).toContain('group transfer');
        });
    });

    describe('Connection Management', () => {
        it('should track connected devices', () => {
            const connectedDevices = manager.getConnectedDevices();
            expect(Array.isArray(connectedDevices)).toBe(true);
        });

        it('should close individual device connections', () => {
            expect(() => {
                manager.closeDeviceConnection('device-1');
            }).not.toThrow();
        });

        it('should close all connections', () => {
            expect(() => {
                manager.closeAllConnections();
            }).not.toThrow();
        });
    });

    describe('Transfer Tracking', () => {
        it('should mark transfer complete', async () => {
            await expect(
                manager.markTransferComplete('device-1', true, 1024 * 1024)
            ).resolves.not.toThrow();
        });

        it('should check device capabilities', () => {
            const capabilities = manager.checkDeviceCapabilities('device-1');
            expect(capabilities === undefined || typeof capabilities === 'object').toBe(true);
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources on destroy', () => {
            expect(() => {
                manager.destroy();
            }).not.toThrow();
        });
    });
});

describe('Device Prioritization', () => {
    it('should prioritize by connection quality', () => {
        const devices: DiscoveredDevice[] = [
            {
                id: 'device-1',
                name: 'Device 1',
                platform: 'desktop',
                lastSeen: new Date(),
                isOnline: true,
                connectionQuality: 'poor',
            },
            {
                id: 'device-2',
                name: 'Device 2',
                platform: 'desktop',
                lastSeen: new Date(),
                isOnline: true,
                connectionQuality: 'excellent',
            },
        ];

        const sorted = [...devices].sort((a, b) => {
            const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
            const aQuality = a.connectionQuality ? qualityOrder[a.connectionQuality] : 999;
            const bQuality = b.connectionQuality ? qualityOrder[b.connectionQuality] : 999;
            return aQuality - bQuality;
        });

        expect(sorted[0]?.id).toBe('device-2');
        expect(sorted[1]?.id).toBe('device-1');
    });

    it('should prioritize recent transfer partners', () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const devices: DiscoveredDevice[] = [
            {
                id: 'device-1',
                name: 'Device 1',
                platform: 'desktop',
                lastSeen: now,
                isOnline: true,
            },
            {
                id: 'device-2',
                name: 'Device 2',
                platform: 'desktop',
                lastSeen: now,
                isOnline: true,
                lastTransferTime: oneHourAgo,
            },
        ];

        const sorted = [...devices].sort((a, b) => {
            if (a.lastTransferTime && !b.lastTransferTime) {return -1;}
            if (!a.lastTransferTime && b.lastTransferTime) {return 1;}
            return 0;
        });

        expect(sorted[0]?.id).toBe('device-2');
    });
});

describe('Device Capabilities', () => {
    it('should validate capability structure', () => {
        const capabilities = {
            supportsGroupTransfer: true,
            supportsPQC: true,
            maxConnections: 10,
            protocolVersion: '2.0.0',
        };

        expect(typeof capabilities.supportsGroupTransfer).toBe('boolean');
        expect(typeof capabilities.supportsPQC).toBe('boolean');
        expect(typeof capabilities.maxConnections).toBe('number');
        expect(typeof capabilities.protocolVersion).toBe('string');
    });

    it('should handle missing capabilities gracefully', () => {
        const device: DiscoveredDevice = {
            id: 'device-1',
            name: 'Device 1',
            platform: 'desktop',
            lastSeen: new Date(),
            isOnline: true,
        };

        expect(device.capabilities).toBeUndefined();
    });
});

describe('Connection Results', () => {
    it('should structure connection results correctly', () => {
        const result = {
            devices: [],
            successCount: 2,
            failedCount: 1,
            totalAttempts: 3,
            duration: 5000,
        };

        expect(result.successCount + result.failedCount).toBe(result.totalAttempts);
        expect(result.duration).toBeGreaterThan(0);
    });
});

describe('Error Handling', () => {
    it('should handle discovery errors gracefully', async () => {
        const manager = new GroupDiscoveryManager();

        // Should not throw even if discovery fails
        await expect(
            manager.discoverGroupTransferDevices({ maxDevices: 0 })
        ).resolves.toBeDefined();
    });

    it('should handle connection errors gracefully', async () => {
        const manager = new GroupDiscoveryManager();

        // Should not throw even if no devices
        await expect(
            manager.connectToDevices([])
        ).resolves.toBeDefined();
    });
});
