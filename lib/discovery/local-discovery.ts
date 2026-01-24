'use client';

/**
 * Device Discovery via Signaling Server
 * Discovers other Tallow devices on the same network by joining
 * a common discovery room on the signaling server.
 */

import { getDeviceId } from '@/lib/auth/user-identity';
import { io, Socket } from 'socket.io-client';
import secureLog from '@/lib/utils/secure-logger';

export interface DiscoveredDevice {
    id: string;
    name: string;
    platform: string;
    lastSeen: Date;
    isOnline: boolean;
    socketId?: string;
}

const DISCOVERY_ROOM = 'tallow-discovery';
const HEARTBEAT_INTERVAL = 3000; // 3 seconds
const OFFLINE_TIMEOUT = 10000; // 10 seconds
const PRESENCE_DEBOUNCE = 500; // 500ms debounce for presence broadcasts

function getSignalingUrl(): string {
    if (typeof window === 'undefined') return '';
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_URL;
    if (envUrl) return envUrl;
    if (window.location.hostname.includes('manisahome.com')) {
        return 'wss://signaling.manisahome.com';
    }
    return '';
}

type DeviceCallback = (devices: DiscoveredDevice[]) => void;

export interface LocalSignalingEvents {
    onOffer?: (data: { offer: RTCSessionDescriptionInit; from: string }) => void;
    onAnswer?: (data: { answer: RTCSessionDescriptionInit; from: string }) => void;
    onIceCandidate?: (data: { candidate: RTCIceCandidateInit; from: string }) => void;
}

interface PresenceData {
    deviceId: string; // Now a hashed ID (not the real device ID)
    timestamp: number;
    socketId?: string;
    // name and platform no longer sent over discovery (privacy)
    name?: string;
    platform?: string;
}

class LocalDiscovery {
    private devices: Map<string, DiscoveredDevice> = new Map();
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;
    private presenceDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private listeners: Set<DeviceCallback> = new Set();
    private signalingEvents: LocalSignalingEvents = {};
    private myDeviceId: string = '';
    private myHashedId: string = '';
    private socket: Socket | null = null;
    private started = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.myDeviceId = getDeviceId();
        }
    }

    /**
     * Hash a device ID for privacy-preserving presence broadcasts.
     * Uses SHA-256 truncated to 16 hex chars.
     */
    private async hashDeviceId(deviceId: string): Promise<string> {
        const data = new TextEncoder().encode(`tallow-discovery-${deviceId}`);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const bytes = new Uint8Array(hash);
        return Array.from(bytes.slice(0, 8))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Start discovery
    start(): void {
        if (typeof window === 'undefined') return;
        if (this.started) return;
        this.started = true;

        const url = getSignalingUrl();
        if (!url) {
            this.started = false;
            return;
        }

        this.socket = io(url, {
            path: '/signaling',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 5000,
            timeout: 10000,
            autoConnect: false,
        });

        // Set up event handlers before connecting
        this.setupSocketHandlers();

        // Connect
        this.socket.connect();
    }

    private setupSocketHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', async () => {
            secureLog.log('[Discovery] Connected to signaling server');
            // Compute hashed ID for privacy-preserving presence
            if (!this.myHashedId) {
                this.myHashedId = await this.hashDeviceId(this.myDeviceId);
            }
            // Join the discovery room
            this.socket!.emit('join-room', DISCOVERY_ROOM, this.myHashedId);
            // Also join a room with our own device ID so others can reach us directly
            this.socket!.emit('join-room', `device-${this.myDeviceId}`, this.myHashedId);
            // Send initial presence
            this.sendPresence();
        });

        this.socket.on('disconnect', (reason) => {
            secureLog.log('[Discovery] Disconnected:', reason);
            this.devices.clear();
            this.notifyListeners();
        });

        this.socket.on('connect_error', (error) => {
            secureLog.debug('[Discovery] Connection error:', error.message);
        });

        // When a new peer joins the discovery room, send our presence (debounced)
        this.socket.on('peer-joined', () => {
            this.debouncedSendPresence();
        });

        // When a peer leaves, remove them
        this.socket.on('peer-left', (data: { socketId: string }) => {
            if (data && typeof data.socketId === 'string') {
                this.removeBySocketId(data.socketId);
            }
        });

        // Listen for presence broadcasts from other devices
        this.socket.on('presence', (data: unknown) => {
            if (this.isValidPresence(data)) {
                this.handlePresence(data);
            }
        });

        // Listen for WebRTC signaling from local devices
        this.socket.on('offer', (data: { offer: RTCSessionDescriptionInit; from: string }) => {
            if (data && data.offer && typeof data.from === 'string') {
                this.signalingEvents.onOffer?.(data);
            }
        });

        this.socket.on('answer', (data: { answer: RTCSessionDescriptionInit; from: string }) => {
            if (data && data.answer && typeof data.from === 'string') {
                this.signalingEvents.onAnswer?.(data);
            }
        });

        this.socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit; from: string }) => {
            if (data && data.candidate && typeof data.from === 'string') {
                this.signalingEvents.onIceCandidate?.(data);
            }
        });

        // Start heartbeat
        this.heartbeatTimer = setInterval(() => {
            this.sendPresence();
        }, HEARTBEAT_INTERVAL);

        // Start cleanup of offline devices
        this.cleanupTimer = setInterval(() => {
            this.cleanupOfflineDevices();
        }, OFFLINE_TIMEOUT / 2);
    }

    // Stop discovery and clean up all resources
    stop(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        if (this.presenceDebounceTimer) {
            clearTimeout(this.presenceDebounceTimer);
            this.presenceDebounceTimer = null;
        }
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.devices.clear();
        this.started = false;
    }

    // Refresh discovery without tearing down the socket connection
    refresh(): void {
        if (!this.socket?.connected) {
            // Not connected, do a full restart
            this.stop();
            this.start();
            return;
        }

        // Clear stale devices and re-broadcast presence to trigger responses
        this.devices.clear();
        this.notifyListeners();
        this.sendPresence();
    }

    /**
     * Validate incoming presence data
     */
    private isValidPresence(data: unknown): data is PresenceData {
        if (!data || typeof data !== 'object') return false;
        const d = data as Record<string, unknown>;
        return (
            typeof d.deviceId === 'string' && d.deviceId.length > 0 &&
            typeof d.timestamp === 'number'
        );
    }

    /**
     * Debounced presence send to prevent thundering herd
     */
    private debouncedSendPresence(): void {
        if (this.presenceDebounceTimer) {
            clearTimeout(this.presenceDebounceTimer);
        }
        this.presenceDebounceTimer = setTimeout(() => {
            this.sendPresence();
            this.presenceDebounceTimer = null;
        }, PRESENCE_DEBOUNCE);
    }

    // Send presence to the discovery room (privacy-preserving: no name/platform)
    private sendPresence(): void {
        if (!this.socket?.connected || !this.myHashedId) return;

        this.socket.emit('presence', {
            room: DISCOVERY_ROOM,
            deviceId: this.myHashedId,
            timestamp: Date.now(),
        });
    }

    // Handle incoming presence from another device
    private handlePresence(data: PresenceData): void {
        if (data.deviceId === this.myHashedId) return;

        // Reject stale presence (older than 30 seconds)
        if (Date.now() - data.timestamp > 30000) return;

        const device: DiscoveredDevice = {
            id: data.deviceId,
            name: 'Nearby Device',
            platform: 'unknown',
            lastSeen: new Date(),
            isOnline: true,
            socketId: data.socketId,
        };

        this.devices.set(device.id, device);
        this.notifyListeners();
    }

    /**
     * Update a discovered device with real info after WebRTC connects.
     * Called from the data channel message handler.
     */
    updateDeviceInfo(deviceId: string, name: string, platform: string): void {
        const device = this.devices.get(deviceId);
        if (device) {
            device.name = name;
            device.platform = platform;
            this.notifyListeners();
        }
    }

    /**
     * Get our real device name and platform for sharing over data channel
     */
    getMyDeviceInfo(): { name: string; platform: string; deviceId: string } {
        return {
            name: this.getDeviceName(),
            platform: this.getPlatform(),
            deviceId: this.myDeviceId,
        };
    }

    // Remove device by socket ID (when peer leaves)
    private removeBySocketId(socketId: string): void {
        for (const [id, device] of this.devices.entries()) {
            if (device.socketId === socketId) {
                this.devices.delete(id);
                this.notifyListeners();
                return;
            }
        }
    }

    // Clean up offline devices
    private cleanupOfflineDevices(): void {
        const now = Date.now();
        let changed = false;

        this.devices.forEach((device, id) => {
            const age = now - device.lastSeen.getTime();
            if (age > OFFLINE_TIMEOUT) {
                this.devices.delete(id);
                changed = true;
            }
        });

        if (changed) {
            this.notifyListeners();
        }
    }

    // Get a readable device name
    private getDeviceName(): string {
        const platform = this.getPlatform();
        const idSuffix = this.myDeviceId.slice(-4);
        return `${platform.charAt(0).toUpperCase() + platform.slice(1)}-${idSuffix}`;
    }

    // Get platform info (privacy-preserving)
    private getPlatform(): string {
        if (typeof navigator === 'undefined') return 'unknown';

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

        if (isTouchDevice && window.innerWidth < 768) {
            return 'mobile';
        }

        if (isStandalone || window.matchMedia('(display-mode: standalone)').matches) {
            return 'app';
        }

        return 'desktop';
    }

    // Set signaling event handlers for local P2P connections
    setSignalingEvents(events: LocalSignalingEvents): void {
        this.signalingEvents = events;
    }

    // Send WebRTC offer to a discovered device's socket
    sendOffer(targetSocketId: string, offer: RTCSessionDescriptionInit): void {
        if (!this.socket?.connected) return;
        this.socket.emit('offer', { target: targetSocketId, offer, ts: Date.now() });
    }

    // Send WebRTC answer to a device
    sendAnswer(targetSocketId: string, answer: RTCSessionDescriptionInit): void {
        if (!this.socket?.connected) return;
        this.socket.emit('answer', { target: targetSocketId, answer, ts: Date.now() });
    }

    // Send ICE candidate to a device
    sendIceCandidate(targetSocketId: string, candidate: RTCIceCandidateInit): void {
        if (!this.socket?.connected) return;
        this.socket.emit('ice-candidate', { target: targetSocketId, candidate, ts: Date.now() });
    }

    // Get the socket ID of a discovered device
    getDeviceSocketId(deviceId: string): string | undefined {
        return this.devices.get(deviceId)?.socketId;
    }

    // Subscribe to device updates
    onDevicesChanged(callback: DeviceCallback): () => void {
        this.listeners.add(callback);
        callback(this.getDevices());
        return () => this.listeners.delete(callback);
    }

    // Notify all listeners
    private notifyListeners(): void {
        const devices = this.getDevices();
        this.listeners.forEach(cb => cb(devices));
    }

    // Get all discovered devices
    getDevices(): DiscoveredDevice[] {
        return Array.from(this.devices.values()).sort((a, b) =>
            b.lastSeen.getTime() - a.lastSeen.getTime()
        );
    }

    // Get device by ID
    getDevice(id: string): DiscoveredDevice | undefined {
        return this.devices.get(id);
    }
}

// Singleton instance
let discovery: LocalDiscovery | null = null;

export function getLocalDiscovery(): LocalDiscovery {
    if (!discovery) {
        discovery = new LocalDiscovery();
    }
    return discovery;
}

export default { getLocalDiscovery };
