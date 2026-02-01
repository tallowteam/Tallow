"use strict";
/**
 * mDNS Server
 *
 * Handles mDNS/Bonjour/Zeroconf service advertisement and discovery.
 * Uses multicast-dns for low-level mDNS operations and bonjour-service
 * for higher-level service management.
 */
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MDNSServer = exports.QUERY_INTERVAL = exports.PROTOCOL_VERSION = exports.TRANSFER_PORT = exports.FULL_SERVICE_TYPE = exports.SERVICE_PROTOCOL = exports.SERVICE_TYPE = void 0;
exports.generateDeviceId = generateDeviceId;
exports.getDefaultDeviceName = getDefaultDeviceName;
exports.detectPlatform = detectPlatform;
exports.getMDNSServer = getMDNSServer;
const bonjour_service_1 = __importDefault(require("bonjour-service"));
const events_1 = require("events");
const os_1 = __importDefault(require("os"));
const uuid_1 = require("uuid");
const service_registry_js_1 = require("./service-registry.js");
// ============================================================================
// Constants
// ============================================================================
/** mDNS service type for Tallow */
exports.SERVICE_TYPE = 'tallow';
/** mDNS protocol */
exports.SERVICE_PROTOCOL = 'tcp';
/** Full service type string */
exports.FULL_SERVICE_TYPE = `_${exports.SERVICE_TYPE}._${exports.SERVICE_PROTOCOL}`;
/** Default transfer port */
exports.TRANSFER_PORT = 53317;
/** Protocol version */
exports.PROTOCOL_VERSION = '1.0.0';
/** Query interval for continuous discovery */
exports.QUERY_INTERVAL = 10000; // 10 seconds
// ============================================================================
// mDNS Server Class
// ============================================================================
/**
 * mDNS server for service discovery and advertisement
 */
class MDNSServer extends events_1.EventEmitter {
    bonjour = null;
    browser = null;
    service = null;
    registry;
    isRunning = false;
    isDiscovering = false;
    isAdvertising = false;
    queryTimer = null;
    currentAdvertisement = null;
    constructor() {
        super();
        this.registry = (0, service_registry_js_1.getServiceRegistry)();
        // Forward registry events
        this.registry.on('device-found', (device) => this.emit('device-found', device));
        this.registry.on('device-lost', (deviceId) => this.emit('device-lost', deviceId));
        this.registry.on('device-updated', (device) => this.emit('device-updated', device));
    }
    // ============================================================================
    // Lifecycle
    // ============================================================================
    /**
     * Start the mDNS server
     */
    start() {
        if (this.isRunning) {
            return;
        }
        try {
            this.bonjour = new bonjour_service_1.default();
            this.registry.start();
            this.isRunning = true;
            console.log('[mDNS] Server started');
            this.emit('started');
        }
        catch (error) {
            console.error('[mDNS] Failed to start server:', error);
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Stop the mDNS server
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.stopDiscovery();
        this.stopAdvertising();
        if (this.bonjour) {
            this.bonjour.destroy();
            this.bonjour = null;
        }
        this.registry.stop();
        this.isRunning = false;
        console.log('[mDNS] Server stopped');
        this.emit('stopped');
    }
    /**
     * Check if server is running
     */
    getIsRunning() {
        return this.isRunning;
    }
    // ============================================================================
    // Discovery
    // ============================================================================
    /**
     * Start discovering mDNS services
     */
    startDiscovery(platformFilter) {
        if (!this.isRunning || !this.bonjour) {
            console.error('[mDNS] Cannot start discovery: server not running');
            return;
        }
        if (this.isDiscovering) {
            return;
        }
        this.isDiscovering = true;
        console.log('[mDNS] Starting discovery');
        // Create browser for Tallow services
        this.browser = this.bonjour.find({ type: exports.SERVICE_TYPE });
        // Handle service found
        this.browser.on('up', (service) => {
            this.handleServiceFound(service, platformFilter);
        });
        // Handle service lost
        this.browser.on('down', (service) => {
            this.handleServiceLost(service);
        });
        // Start periodic re-query to keep discovery fresh
        this.queryTimer = setInterval(() => {
            if (this.browser) {
                this.browser.update();
            }
        }, exports.QUERY_INTERVAL);
    }
    /**
     * Stop discovering mDNS services
     */
    stopDiscovery() {
        if (!this.isDiscovering) {
            return;
        }
        if (this.queryTimer) {
            clearInterval(this.queryTimer);
            this.queryTimer = null;
        }
        if (this.browser) {
            this.browser.stop();
            this.browser = null;
        }
        this.isDiscovering = false;
        console.log('[mDNS] Stopped discovery');
    }
    /**
     * Check if currently discovering
     */
    getIsDiscovering() {
        return this.isDiscovering;
    }
    /**
     * Manually trigger a discovery update
     */
    refreshDiscovery() {
        if (this.browser) {
            this.browser.update();
        }
    }
    // ============================================================================
    // Advertising
    // ============================================================================
    /**
     * Start advertising this device
     */
    startAdvertising(options) {
        if (!this.isRunning || !this.bonjour) {
            console.error('[mDNS] Cannot advertise: server not running');
            return;
        }
        // Stop existing advertisement
        this.stopAdvertising();
        const port = options.port || exports.TRANSFER_PORT;
        this.currentAdvertisement = options;
        // Build TXT record
        const txt = {
            version: exports.PROTOCOL_VERSION,
            deviceId: options.deviceId,
            deviceName: options.deviceName,
            platform: options.platform,
            capabilities: options.capabilities.join(','),
            fingerprint: options.fingerprint,
            timestamp: Date.now().toString(),
        };
        // Build service name
        const serviceName = `${options.deviceName}-${options.deviceId.slice(-4)}`;
        try {
            // Publish service
            this.service = this.bonjour.publish({
                name: serviceName,
                type: exports.SERVICE_TYPE,
                port: port,
                txt: txt,
            });
            this.isAdvertising = true;
            console.log(`[mDNS] Advertising: ${serviceName} on port ${port}`);
        }
        catch (error) {
            console.error('[mDNS] Failed to advertise:', error);
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Update advertisement TXT record
     */
    updateAdvertisement(updates) {
        if (!this.currentAdvertisement || !this.service) {
            return;
        }
        // Merge updates
        this.currentAdvertisement = { ...this.currentAdvertisement, ...updates };
        // Re-publish with updated info
        this.stopAdvertising();
        this.startAdvertising(this.currentAdvertisement);
    }
    /**
     * Stop advertising this device
     */
    stopAdvertising() {
        if (!this.isAdvertising) {
            return;
        }
        if (this.service) {
            this.service.stop?.();
            this.service = null;
        }
        this.isAdvertising = false;
        console.log('[mDNS] Stopped advertising');
    }
    /**
     * Check if currently advertising
     */
    getIsAdvertising() {
        return this.isAdvertising;
    }
    /**
     * Get current advertisement
     */
    getCurrentAdvertisement() {
        return this.currentAdvertisement;
    }
    // ============================================================================
    // Device Access
    // ============================================================================
    /**
     * Get all discovered devices
     */
    getDevices() {
        return this.registry.getAllDevices();
    }
    /**
     * Get device by ID
     */
    getDevice(deviceId) {
        return this.registry.getDevice(deviceId);
    }
    /**
     * Get device count
     */
    getDeviceCount() {
        return this.registry.getDeviceCount();
    }
    // ============================================================================
    // Network Info
    // ============================================================================
    /**
     * Get local IP addresses
     */
    getLocalAddresses() {
        const addresses = [];
        const interfaces = os_1.default.networkInterfaces();
        for (const name in interfaces) {
            const iface = interfaces[name];
            if (!iface)
                {continue;}
            for (const addr of iface) {
                // Skip internal and IPv6 link-local
                if (addr.internal)
                    {continue;}
                if (addr.family === 'IPv6' && addr.address.startsWith('fe80'))
                    {continue;}
                addresses.push(addr.address);
            }
        }
        return addresses;
    }
    /**
     * Get primary local IP address
     */
    getPrimaryAddress() {
        const addresses = this.getLocalAddresses();
        // Prefer IPv4
        const ipv4 = addresses.find((addr) => !addr.includes(':'));
        if (ipv4)
            {return ipv4;}
        // Fall back to first address
        return addresses[0] || '127.0.0.1';
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Handle service found
     */
    handleServiceFound(service, platformFilter) {
        try {
            // Parse TXT record
            const txt = this.parseTxtRecord(service.txt);
            const deviceId = txt['deviceId'];
            if (!deviceId) {
                console.warn('[mDNS] Service missing deviceId:', service.name);
                return;
            }
            // Filter by platform if specified
            if (platformFilter && platformFilter.length > 0) {
                const platform = txt['platform'];
                if (!platformFilter.includes(platform)) {
                    return;
                }
            }
            // Get IP address
            const ip = service.addresses?.[0] || service.referer?.address;
            if (!ip) {
                console.warn('[mDNS] Service has no address:', service.name);
                return;
            }
            // Register device
            this.registry.registerDevice(txt, ip, service.port, 'mdns');
        }
        catch (error) {
            console.error('[mDNS] Error handling service:', error);
        }
    }
    /**
     * Handle service lost
     */
    handleServiceLost(service) {
        try {
            const txt = this.parseTxtRecord(service.txt);
            const deviceId = txt['deviceId'];
            if (deviceId) {
                this.registry.markOffline(deviceId);
            }
        }
        catch (error) {
            console.error('[mDNS] Error handling service lost:', error);
        }
    }
    /**
     * Parse TXT record from mDNS service
     */
    parseTxtRecord(txt) {
        const result = {};
        if (!txt) {
            return result;
        }
        if (Array.isArray(txt)) {
            // Array format: ['key=value', 'key=value']
            for (const item of txt) {
                const [key, ...valueParts] = item.split('=');
                if (key) {
                    result[key] = valueParts.join('=');
                }
            }
        }
        else if (typeof txt === 'object') {
            // Object format: { key: value }
            for (const [key, value] of Object.entries(txt)) {
                result[key] = String(value);
            }
        }
        return result;
    }
}
exports.MDNSServer = MDNSServer;
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Generate a unique device ID
 */
function generateDeviceId() {
    return (0, uuid_1.v4)().replace(/-/g, '').slice(0, 12).toUpperCase();
}
/**
 * Get default device name based on hostname
 */
function getDefaultDeviceName() {
    const hostname = os_1.default.hostname();
    return hostname.split('.')[0] || 'Tallow-Device';
}
/**
 * Detect current platform
 */
function detectPlatform() {
    const platform = os_1.default.platform();
    switch (platform) {
        case 'darwin':
            return 'macos';
        case 'win32':
            return 'windows';
        case 'linux':
            return 'linux';
        default:
            return 'linux';
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let mdnsServerInstance = null;
/**
 * Get the singleton mDNS server
 */
function getMDNSServer() {
    if (!mdnsServerInstance) {
        mdnsServerInstance = new MDNSServer();
    }
    return mdnsServerInstance;
}
exports.default = MDNSServer;
//# sourceMappingURL=mdns-server.js.map