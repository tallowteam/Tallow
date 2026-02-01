/**
 * Service Registry
 *
 * Tracks discovered mDNS services and manages device state.
 * Handles device lifecycle (found, updated, lost) with TTL-based expiration.
 */
import { EventEmitter } from 'events';
/**
 * Platform types
 */
export type TallowPlatform = 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux';
/**
 * Parsed capabilities
 */
export interface ParsedCapabilities {
    supportsPQC: boolean;
    supportsChat: boolean;
    supportsFolder: boolean;
    supportsResume: boolean;
    supportsScreen: boolean;
    supportsGroupTransfer: boolean;
}
/**
 * Registered device
 */
export interface RegisteredDevice {
    /** Unique device identifier */
    id: string;
    /** User-friendly device name */
    name: string;
    /** Operating system/platform */
    platform: TallowPlatform;
    /** IP address (IPv4 or IPv6) */
    ip: string;
    /** Transfer port */
    port: number;
    /** Protocol version */
    version: string;
    /** Raw capabilities string */
    capabilities: string;
    /** Parsed capabilities */
    parsedCapabilities: ParsedCapabilities;
    /** Public key fingerprint */
    fingerprint: string;
    /** Discovery timestamp */
    discoveredAt: number;
    /** Last seen timestamp */
    lastSeen: number;
    /** Whether device is currently online */
    isOnline: boolean;
    /** Discovery source */
    source: 'mdns' | 'signaling' | 'manual';
    /** TTL timer */
    ttlTimer?: NodeJS.Timeout;
}
/**
 * TXT record from mDNS
 */
export interface TxtRecord {
    version?: string;
    deviceId?: string;
    deviceName?: string;
    platform?: string;
    capabilities?: string;
    fingerprint?: string;
    timestamp?: string;
}
/**
 * Registry events
 */
export interface RegistryEvents {
    'device-found': (device: RegisteredDevice) => void;
    'device-lost': (deviceId: string) => void;
    'device-updated': (device: RegisteredDevice) => void;
}
/**
 * Registry for discovered mDNS services
 */
export declare class ServiceRegistry extends EventEmitter {
    private devices;
    private cleanupTimer;
    private ttl;
    constructor(ttl?: number);
    /**
     * Start the registry
     */
    start(): void;
    /**
     * Stop the registry
     */
    stop(): void;
    /**
     * Register or update a device
     */
    registerDevice(txtRecord: TxtRecord, ip: string, port: number, source?: 'mdns' | 'signaling' | 'manual'): RegisteredDevice | null;
    /**
     * Refresh a device's TTL (heartbeat)
     */
    refreshDevice(deviceId: string): boolean;
    /**
     * Mark a device as offline
     */
    markOffline(deviceId: string): void;
    /**
     * Remove a device
     */
    removeDevice(deviceId: string): boolean;
    /**
     * Get a device by ID
     */
    getDevice(deviceId: string): RegisteredDevice | undefined;
    /**
     * Get all devices
     */
    getAllDevices(): RegisteredDevice[];
    /**
     * Get all devices (including offline)
     */
    getAllDevicesIncludingOffline(): RegisteredDevice[];
    /**
     * Get device count
     */
    getDeviceCount(): number;
    /**
     * Check if device exists
     */
    hasDevice(deviceId: string): boolean;
    /**
     * Filter devices by platform
     */
    getDevicesByPlatform(platforms: TallowPlatform[]): RegisteredDevice[];
    /**
     * Filter devices by capability
     */
    getDevicesWithCapability(capability: keyof ParsedCapabilities): RegisteredDevice[];
    /**
     * Validate TXT record
     */
    private isValidTxtRecord;
    /**
     * Validate and normalize platform
     */
    private validatePlatform;
    /**
     * Parse capabilities string
     */
    private parseCapabilities;
    /**
     * Remove internal properties from device
     */
    private sanitizeDevice;
    /**
     * Cleanup expired devices
     */
    private cleanupExpired;
}
/**
 * Get the singleton service registry
 */
export declare function getServiceRegistry(): ServiceRegistry;
export default ServiceRegistry;
//# sourceMappingURL=service-registry.d.ts.map