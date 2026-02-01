"use strict";
/**
 * Service Registry
 *
 * Tracks discovered mDNS services and manages device state.
 * Handles device lifecycle (found, updated, lost) with TTL-based expiration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
exports.getServiceRegistry = getServiceRegistry;
const events_1 = require("events");
// ============================================================================
// Constants
// ============================================================================
/** Default TTL for devices in milliseconds */
const DEFAULT_TTL = 120000; // 2 minutes
/** Cleanup interval for expired devices */
const CLEANUP_INTERVAL = 30000; // 30 seconds
// ============================================================================
// Service Registry Class
// ============================================================================
/**
 * Registry for discovered mDNS services
 */
class ServiceRegistry extends events_1.EventEmitter {
    devices = new Map();
    cleanupTimer = null;
    ttl;
    constructor(ttl = DEFAULT_TTL) {
        super();
        this.ttl = ttl;
    }
    /**
     * Start the registry
     */
    start() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, CLEANUP_INTERVAL);
    }
    /**
     * Stop the registry
     */
    stop() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        // Clear all TTL timers
        this.devices.forEach((device) => {
            if (device.ttlTimer) {
                clearTimeout(device.ttlTimer);
            }
        });
        this.devices.clear();
    }
    /**
     * Register or update a device
     */
    registerDevice(txtRecord, ip, port, source = 'mdns') {
        // Validate TXT record
        if (!this.isValidTxtRecord(txtRecord)) {
            console.warn('[Registry] Invalid TXT record:', txtRecord);
            return null;
        }
        const deviceId = txtRecord.deviceId;
        const now = Date.now();
        const existing = this.devices.get(deviceId);
        // Parse capabilities
        const parsedCapabilities = this.parseCapabilities(txtRecord.capabilities || '');
        // Create or update device
        const device = {
            id: deviceId,
            name: txtRecord.deviceName || `Device-${deviceId.slice(-4)}`,
            platform: this.validatePlatform(txtRecord.platform),
            ip,
            port,
            version: txtRecord.version || '1.0.0',
            capabilities: txtRecord.capabilities || '',
            parsedCapabilities,
            fingerprint: txtRecord.fingerprint || '',
            discoveredAt: existing?.discoveredAt || now,
            lastSeen: now,
            isOnline: true,
            source,
        };
        // Clear existing TTL timer
        if (existing?.ttlTimer) {
            clearTimeout(existing.ttlTimer);
        }
        // Set new TTL timer
        device.ttlTimer = setTimeout(() => {
            this.markOffline(deviceId);
        }, this.ttl);
        // Store device
        this.devices.set(deviceId, device);
        // Emit appropriate event
        if (existing) {
            this.emit('device-updated', this.sanitizeDevice(device));
        }
        else {
            this.emit('device-found', this.sanitizeDevice(device));
        }
        return device;
    }
    /**
     * Refresh a device's TTL (heartbeat)
     */
    refreshDevice(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            return false;
        }
        device.lastSeen = Date.now();
        device.isOnline = true;
        // Reset TTL timer
        if (device.ttlTimer) {
            clearTimeout(device.ttlTimer);
        }
        device.ttlTimer = setTimeout(() => {
            this.markOffline(deviceId);
        }, this.ttl);
        return true;
    }
    /**
     * Mark a device as offline
     */
    markOffline(deviceId) {
        const device = this.devices.get(deviceId);
        if (device) {
            device.isOnline = false;
            if (device.ttlTimer) {
                clearTimeout(device.ttlTimer);
                device.ttlTimer = undefined;
            }
            this.emit('device-lost', deviceId);
        }
    }
    /**
     * Remove a device
     */
    removeDevice(deviceId) {
        const device = this.devices.get(deviceId);
        if (device) {
            if (device.ttlTimer) {
                clearTimeout(device.ttlTimer);
            }
            this.devices.delete(deviceId);
            this.emit('device-lost', deviceId);
            return true;
        }
        return false;
    }
    /**
     * Get a device by ID
     */
    getDevice(deviceId) {
        const device = this.devices.get(deviceId);
        return device ? this.sanitizeDevice(device) : undefined;
    }
    /**
     * Get all devices
     */
    getAllDevices() {
        return Array.from(this.devices.values())
            .filter((d) => d.isOnline)
            .map((d) => this.sanitizeDevice(d));
    }
    /**
     * Get all devices (including offline)
     */
    getAllDevicesIncludingOffline() {
        return Array.from(this.devices.values()).map((d) => this.sanitizeDevice(d));
    }
    /**
     * Get device count
     */
    getDeviceCount() {
        return Array.from(this.devices.values()).filter((d) => d.isOnline).length;
    }
    /**
     * Check if device exists
     */
    hasDevice(deviceId) {
        return this.devices.has(deviceId);
    }
    /**
     * Filter devices by platform
     */
    getDevicesByPlatform(platforms) {
        const platformSet = new Set(platforms);
        return this.getAllDevices().filter((d) => platformSet.has(d.platform));
    }
    /**
     * Filter devices by capability
     */
    getDevicesWithCapability(capability) {
        return this.getAllDevices().filter((d) => d.parsedCapabilities[capability]);
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Validate TXT record
     */
    isValidTxtRecord(record) {
        return (typeof record.deviceId === 'string' &&
            record.deviceId.length > 0);
    }
    /**
     * Validate and normalize platform
     */
    validatePlatform(platform) {
        const valid = ['web', 'ios', 'android', 'macos', 'windows', 'linux'];
        if (platform && valid.includes(platform)) {
            return platform;
        }
        return 'web';
    }
    /**
     * Parse capabilities string
     */
    parseCapabilities(capString) {
        const caps = capString.toLowerCase().split(',').map((c) => c.trim());
        return {
            supportsPQC: caps.includes('pqc'),
            supportsChat: caps.includes('chat'),
            supportsFolder: caps.includes('folder'),
            supportsResume: caps.includes('resume'),
            supportsScreen: caps.includes('screen'),
            supportsGroupTransfer: caps.includes('group'),
        };
    }
    /**
     * Remove internal properties from device
     */
    sanitizeDevice(device) {
        const { ttlTimer: _ttl, ...sanitized } = device;
        return sanitized;
    }
    /**
     * Cleanup expired devices
     */
    cleanupExpired() {
        const now = Date.now();
        const expiredThreshold = now - this.ttl * 2; // Double TTL for full removal
        this.devices.forEach((device, deviceId) => {
            if (!device.isOnline && device.lastSeen < expiredThreshold) {
                this.devices.delete(deviceId);
            }
        });
    }
}
exports.ServiceRegistry = ServiceRegistry;
// ============================================================================
// Singleton Instance
// ============================================================================
let registryInstance = null;
/**
 * Get the singleton service registry
 */
function getServiceRegistry() {
    if (!registryInstance) {
        registryInstance = new ServiceRegistry();
    }
    return registryInstance;
}
exports.default = ServiceRegistry;
//# sourceMappingURL=service-registry.js.map