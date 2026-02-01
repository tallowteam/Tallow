'use client';

/**
 * Group Discovery Manager
 * Bridges device discovery with group transfer system
 * Handles device selection, capability checking, and connection orchestration
 */

import { getLocalDiscovery, DiscoveredDevice, DeviceCapabilities } from './local-discovery';
import { getDeviceId } from '@/lib/auth/user-identity';
import {
    addRecentTransferPartner,
    getRecentTransferPartners,
    updateTransferStats,
} from '@/lib/storage/my-devices';
import secureLog from '@/lib/utils/secure-logger';

export interface GroupDiscoveryOptions {
    minDevices?: number;
    maxDevices?: number;
    requirePQC?: boolean;
    preferRecentPartners?: boolean;
    connectionTimeout?: number;
}

export interface DiscoveredDeviceWithChannel extends DiscoveredDevice {
    dataChannel?: RTCDataChannel;
    peerConnection?: RTCPeerConnection;
}

export interface GroupDiscoveryResult {
    devices: DiscoveredDeviceWithChannel[];
    successCount: number;
    failedCount: number;
    totalAttempts: number;
    duration: number;
}

/**
 * Manager for discovering and connecting to multiple devices for group transfers
 */
export class GroupDiscoveryManager {
    private discovery = getLocalDiscovery();
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private myDeviceId: string;

    constructor() {
        this.myDeviceId = getDeviceId();
    }

    /**
     * Discover devices suitable for group transfer
     */
    async discoverGroupTransferDevices(
        options: GroupDiscoveryOptions = {}
    ): Promise<DiscoveredDevice[]> {
        const {
            minDevices = 1,
            maxDevices = 10,
            requirePQC = false,
            preferRecentPartners = true,
        } = options;

        secureLog.log('[GroupDiscovery] Starting device discovery for group transfer');

        // Ensure discovery is running
        if (!this.discovery.getDevices().length) {
            this.discovery.start();
            // Wait a bit for initial discovery
            await this.waitForDiscovery(3000);
        }

        // Get all group-transfer capable devices
        let devices = this.discovery.getGroupTransferCapableDevices();

        // Filter by PQC requirement
        if (requirePQC) {
            devices = devices.filter(d => d.capabilities?.supportsPQC === true);
        }

        // Sort by priority if preferred
        if (preferRecentPartners) {
            devices = await this.sortByRecentPartners(devices);
        } else {
            // Use standard prioritization
            devices = this.sortByPriority(devices);
        }

        // Apply device limits
        devices = devices.slice(0, Math.min(maxDevices, devices.length));

        if (devices.length < minDevices) {
            secureLog.warn(
                `[GroupDiscovery] Found ${devices.length} devices, minimum required: ${minDevices}`
            );
        }

        secureLog.log(`[GroupDiscovery] Discovered ${devices.length} suitable devices`);
        return devices;
    }

    /**
     * Connect to multiple devices in parallel
     */
    async connectToDevices(
        devices: DiscoveredDevice[],
        options: { timeout?: number } = {}
    ): Promise<GroupDiscoveryResult> {
        const { timeout = 30000 } = options;
        const startTime = Date.now();

        secureLog.log(`[GroupDiscovery] Connecting to ${devices.length} devices`);

        const results: DiscoveredDeviceWithChannel[] = [];
        let successCount = 0;
        let failedCount = 0;

        // Create peer connections in parallel
        const connectionPromises = devices.map(async (device) => {
            try {
                const result = await this.connectToDevice(device, timeout);
                if (result.success && result.dataChannel && result.peerConnection) {
                    successCount++;
                    results.push({
                        ...device,
                        dataChannel: result.dataChannel,
                        peerConnection: result.peerConnection,
                    });

                    // Track recent partner
                    await addRecentTransferPartner(this.myDeviceId, device.id).catch(() => {});

                    secureLog.log(`[GroupDiscovery] Connected to device: ${device.name}`);
                } else {
                    failedCount++;
                    secureLog.warn(`[GroupDiscovery] Failed to connect to: ${device.name}`);
                }
                return result;
            } catch (error) {
                failedCount++;
                secureLog.error(`[GroupDiscovery] Error connecting to ${device.name}:`, error);
                return { success: false, error: (error as Error).message };
            }
        });

        // Wait for all connection attempts
        await Promise.allSettled(connectionPromises);

        const duration = Date.now() - startTime;

        const result: GroupDiscoveryResult = {
            devices: results,
            successCount,
            failedCount,
            totalAttempts: devices.length,
            duration,
        };

        secureLog.log(
            `[GroupDiscovery] Connection complete: ${successCount} succeeded, ${failedCount} failed in ${duration}ms`
        );

        return result;
    }

    /**
     * Connect to a single device using proper signaling flow
     */
    private async connectToDevice(
        device: DiscoveredDevice,
        timeout: number
    ): Promise<{
        success: boolean;
        dataChannel?: RTCDataChannel;
        peerConnection?: RTCPeerConnection;
        error?: string;
    }> {
        try {
            const { getSignalingClient } = await import('../signaling/socket-signaling');
            const signalingClient = getSignalingClient();

            // Ensure signaling is connected
            if (!signalingClient.isConnected) {
                await signalingClient.connect();
            }

            // Validate device has socket ID
            if (!device.socketId) {
                throw new Error('Device has no socket ID for signaling');
            }

            // Create peer connection with proper config
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            });

            // Create data channel
            const dataChannel = peerConnection.createDataChannel('group-transfer', {
                ordered: true,
                maxRetransmits: 3,
            });

            // Track connection state
            let isConnected = false;
            let connectionError: Error | null = null;

            // Set up connection promise with proper signaling flow
            const connectionPromise = new Promise<boolean>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    connectionError = new Error('Connection timeout');
                    reject(connectionError);
                }, timeout);

                // Handle ICE candidates - relay through signaling
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        signalingClient.sendIceCandidate(device.socketId!, event.candidate);
                    }
                };

                // Monitor connection state
                peerConnection.oniceconnectionstatechange = () => {
                    const state = peerConnection.iceConnectionState;
                    secureLog.log(`[GroupDiscovery] ICE state for ${device.name}: ${state}`);

                    if (state === 'connected' || state === 'completed') {
                        if (!isConnected) {
                            isConnected = true;
                            clearTimeout(timeoutId);
                            resolve(true);
                        }
                    } else if (state === 'failed' || state === 'closed') {
                        clearTimeout(timeoutId);
                        connectionError = new Error(`Connection ${state}`);
                        reject(connectionError);
                    }
                };

                // Handle data channel events
                dataChannel.onopen = () => {
                    secureLog.log(`[GroupDiscovery] Data channel opened for: ${device.name}`);
                };

                dataChannel.onerror = (error) => {
                    clearTimeout(timeoutId);
                    connectionError = error as unknown as Error;
                    reject(connectionError);
                };

                // Listen for answer from peer
                const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
                    if (data.from === device.socketId) {
                        try {
                            await peerConnection.setRemoteDescription(data.answer);
                            secureLog.log(`[GroupDiscovery] Set remote description for: ${device.name}`);
                        } catch (error) {
                            secureLog.error(`[GroupDiscovery] Error setting remote description:`, error);
                            connectionError = error as Error;
                            reject(connectionError);
                        }
                    }
                };

                // Listen for ICE candidates from peer
                const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
                    if (data.from === device.socketId) {
                        try {
                            await peerConnection.addIceCandidate(data.candidate);
                        } catch (error) {
                            secureLog.error(`[GroupDiscovery] Error adding ICE candidate:`, error);
                        }
                    }
                };

                // Register event handlers (with type-safe wrappers)
                const answerWrapper = (data: unknown) => handleAnswer(data as { answer: RTCSessionDescriptionInit; from: string });
                const iceCandidateWrapper = (data: unknown) => handleIceCandidate(data as { candidate: RTCIceCandidateInit; from: string });

                signalingClient.on('answer', answerWrapper);
                signalingClient.on('ice-candidate', iceCandidateWrapper);

                // Cleanup handlers on completion
                const cleanup = () => {
                    signalingClient.emit('off', { event: 'answer', handler: answerWrapper });
                    signalingClient.emit('off', { event: 'ice-candidate', handler: iceCandidateWrapper });
                };

                Promise.race([
                    connectionPromise,
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout))
                ]).finally(cleanup);
            });

            // Create and send offer via signaling server
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Send offer through signaling
            signalingClient.sendOffer(device.socketId, offer);
            secureLog.log(`[GroupDiscovery] Sent offer to: ${device.name}`);

            // Wait for connection to be established
            await connectionPromise;

            // Store connections
            this.peerConnections.set(device.id, peerConnection);
            this.dataChannels.set(device.id, dataChannel);

            // Update connection quality based on initial state
            this.updateConnectionQuality(device.id, 'good');

            return {
                success: true,
                dataChannel,
                peerConnection,
            };
        } catch (error) {
            secureLog.error(`[GroupDiscovery] Connection failed for ${device.name}:`, error);
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Get devices with established data channels
     */
    getConnectedDevices(): DiscoveredDeviceWithChannel[] {
        const devices: DiscoveredDeviceWithChannel[] = [];

        this.dataChannels.forEach((dataChannel, deviceId) => {
            const device = this.discovery.getDevice(deviceId);
            if (device && dataChannel.readyState === 'open') {
                const deviceData: DiscoveredDeviceWithChannel = {
                    ...device,
                    dataChannel,
                };
                const peerConnection = this.peerConnections.get(deviceId);
                if (peerConnection !== undefined) {
                    deviceData.peerConnection = peerConnection;
                }
                devices.push(deviceData);
            }
        });

        return devices;
    }

    /**
     * Update device connection quality
     */
    private updateConnectionQuality(
        deviceId: string,
        quality: 'excellent' | 'good' | 'fair' | 'poor'
    ): void {
        this.discovery.updateConnectionQuality(deviceId, quality);
    }

    /**
     * Mark transfer complete for device
     */
    async markTransferComplete(deviceId: string, success: boolean, bytesSent: number = 0): Promise<void> {
        this.discovery.markTransferComplete(deviceId);
        await updateTransferStats(this.myDeviceId, success, bytesSent, 0).catch(() => {});
    }

    /**
     * Close connection to specific device
     */
    closeDeviceConnection(deviceId: string): void {
        const dataChannel = this.dataChannels.get(deviceId);
        if (dataChannel) {
            dataChannel.close();
            this.dataChannels.delete(deviceId);
        }

        const peerConnection = this.peerConnections.get(deviceId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(deviceId);
        }

        secureLog.log(`[GroupDiscovery] Closed connection to device: ${deviceId}`);
    }

    /**
     * Close all connections
     */
    closeAllConnections(): void {
        this.dataChannels.forEach((_, deviceId) => {
            this.closeDeviceConnection(deviceId);
        });

        secureLog.log('[GroupDiscovery] Closed all connections');
    }

    /**
     * Wait for device discovery
     */
    private waitForDiscovery(timeout: number): Promise<void> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const devices = this.discovery.getDevices();
                if (devices.length > 0 || Date.now() - startTime >= timeout) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 200);
        });
    }

    /**
     * Sort devices by priority
     */
    private sortByPriority(devices: DiscoveredDevice[]): DiscoveredDevice[] {
        return devices.sort((a, b) => {
            // Priority 1: Connection quality
            const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
            const aQuality = a.connectionQuality ? qualityOrder[a.connectionQuality] : 999;
            const bQuality = b.connectionQuality ? qualityOrder[b.connectionQuality] : 999;
            if (aQuality !== bQuality) {return aQuality - bQuality;}

            // Priority 2: Recent transfers
            if (a.lastTransferTime && !b.lastTransferTime) {return -1;}
            if (!a.lastTransferTime && b.lastTransferTime) {return 1;}
            if (a.lastTransferTime && b.lastTransferTime) {
                const timeDiff = b.lastTransferTime.getTime() - a.lastTransferTime.getTime();
                if (timeDiff !== 0) {return timeDiff;}
            }

            // Priority 3: Most recently seen
            return b.lastSeen.getTime() - a.lastSeen.getTime();
        });
    }

    /**
     * Sort devices by recent transfer partners
     */
    private async sortByRecentPartners(devices: DiscoveredDevice[]): Promise<DiscoveredDevice[]> {
        try {
            const recentPartners = await getRecentTransferPartners(this.myDeviceId);
            const partnerSet = new Set(recentPartners);

            return devices.sort((a, b) => {
                const aIsRecent = partnerSet.has(a.id);
                const bIsRecent = partnerSet.has(b.id);

                if (aIsRecent && !bIsRecent) {return -1;}
                if (!aIsRecent && bIsRecent) {return 1;}

                // If both or neither are recent, use standard priority
                return this.sortByPriority([a, b])[0] === a ? -1 : 1;
            });
        } catch (error) {
            secureLog.error('[GroupDiscovery] Error sorting by recent partners:', error);
            return this.sortByPriority(devices);
        }
    }

    /**
     * Check device capabilities
     */
    checkDeviceCapabilities(deviceId: string): DeviceCapabilities | undefined {
        return this.discovery.getDeviceCapabilities(deviceId);
    }

    /**
     * Validate devices for group transfer
     */
    validateDevicesForGroupTransfer(devices: DiscoveredDevice[]): {
        valid: DiscoveredDevice[];
        invalid: Array<{ device: DiscoveredDevice; reason: string }>;
    } {
        const valid: DiscoveredDevice[] = [];
        const invalid: Array<{ device: DiscoveredDevice; reason: string }> = [];

        devices.forEach((device) => {
            // Check if online
            if (!device.isOnline) {
                invalid.push({ device, reason: 'Device is offline' });
                return;
            }

            // Check if has socket ID
            if (!device.socketId) {
                invalid.push({ device, reason: 'No socket connection' });
                return;
            }

            // Check capabilities
            if (!device.capabilities?.supportsGroupTransfer) {
                invalid.push({ device, reason: 'Device does not support group transfers' });
                return;
            }

            valid.push(device);
        });

        return { valid, invalid };
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.closeAllConnections();
        this.peerConnections.clear();
        this.dataChannels.clear();
    }
}

// Singleton instance
let groupDiscoveryManager: GroupDiscoveryManager | null = null;

export function getGroupDiscoveryManager(): GroupDiscoveryManager {
    if (!groupDiscoveryManager) {
        groupDiscoveryManager = new GroupDiscoveryManager();
    }
    return groupDiscoveryManager;
}

export default { getGroupDiscoveryManager, GroupDiscoveryManager };
