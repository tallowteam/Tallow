/**
 * mDNS Server
 *
 * Handles mDNS/Bonjour/Zeroconf service advertisement and discovery.
 * Uses multicast-dns for low-level mDNS operations and bonjour-service
 * for higher-level service management.
 */
import { EventEmitter } from 'events';
import { type RegisteredDevice, type TallowPlatform } from './service-registry.js';
/** mDNS service type for Tallow */
export declare const SERVICE_TYPE = "tallow";
/** mDNS protocol */
export declare const SERVICE_PROTOCOL = "tcp";
/** Full service type string */
export declare const FULL_SERVICE_TYPE = "_tallow._tcp";
/** Default transfer port */
export declare const TRANSFER_PORT = 53317;
/** Protocol version */
export declare const PROTOCOL_VERSION = "1.0.0";
/** Query interval for continuous discovery */
export declare const QUERY_INTERVAL = 10000;
/**
 * Device advertisement options
 */
export interface AdvertiseOptions {
    /** Device ID */
    deviceId: string;
    /** Device name */
    deviceName: string;
    /** Platform type */
    platform: TallowPlatform;
    /** Capabilities array */
    capabilities: string[];
    /** Public key fingerprint */
    fingerprint: string;
    /** Transfer port (default: 53317) */
    port?: number;
}
/**
 * mDNS server events
 */
export interface MDNSServerEvents {
    'device-found': (device: RegisteredDevice) => void;
    'device-lost': (deviceId: string) => void;
    'device-updated': (device: RegisteredDevice) => void;
    'error': (error: Error) => void;
    'started': () => void;
    'stopped': () => void;
}
/**
 * mDNS server for service discovery and advertisement
 */
export declare class MDNSServer extends EventEmitter {
    private bonjour;
    private browser;
    private service;
    private registry;
    private isRunning;
    private isDiscovering;
    private isAdvertising;
    private queryTimer;
    private currentAdvertisement;
    constructor();
    /**
     * Start the mDNS server
     */
    start(): void;
    /**
     * Stop the mDNS server
     */
    stop(): void;
    /**
     * Check if server is running
     */
    getIsRunning(): boolean;
    /**
     * Start discovering mDNS services
     */
    startDiscovery(platformFilter?: TallowPlatform[]): void;
    /**
     * Stop discovering mDNS services
     */
    stopDiscovery(): void;
    /**
     * Check if currently discovering
     */
    getIsDiscovering(): boolean;
    /**
     * Manually trigger a discovery update
     */
    refreshDiscovery(): void;
    /**
     * Start advertising this device
     */
    startAdvertising(options: AdvertiseOptions): void;
    /**
     * Update advertisement TXT record
     */
    updateAdvertisement(updates: Partial<AdvertiseOptions>): void;
    /**
     * Stop advertising this device
     */
    stopAdvertising(): void;
    /**
     * Check if currently advertising
     */
    getIsAdvertising(): boolean;
    /**
     * Get current advertisement
     */
    getCurrentAdvertisement(): AdvertiseOptions | null;
    /**
     * Get all discovered devices
     */
    getDevices(): RegisteredDevice[];
    /**
     * Get device by ID
     */
    getDevice(deviceId: string): RegisteredDevice | undefined;
    /**
     * Get device count
     */
    getDeviceCount(): number;
    /**
     * Get local IP addresses
     */
    getLocalAddresses(): string[];
    /**
     * Get primary local IP address
     */
    getPrimaryAddress(): string;
    /**
     * Handle service found
     */
    private handleServiceFound;
    /**
     * Handle service lost
     */
    private handleServiceLost;
    /**
     * Parse TXT record from mDNS service
     */
    private parseTxtRecord;
}
/**
 * Generate a unique device ID
 */
export declare function generateDeviceId(): string;
/**
 * Get default device name based on hostname
 */
export declare function getDefaultDeviceName(): string;
/**
 * Detect current platform
 */
export declare function detectPlatform(): TallowPlatform;
/**
 * Get the singleton mDNS server
 */
export declare function getMDNSServer(): MDNSServer;
export default MDNSServer;
//# sourceMappingURL=mdns-server.d.ts.map