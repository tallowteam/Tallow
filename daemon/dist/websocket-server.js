"use strict";
/**
 * WebSocket Server
 *
 * Provides WebSocket API for web browsers to access mDNS functionality.
 * Bridges the gap between browsers (which cannot use mDNS directly)
 * and local network discovery.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TallowWebSocketServer = exports.DEFAULT_WS_PORT = void 0;
exports.getWebSocketServer = getWebSocketServer;
const ws_1 = require("ws");
const events_1 = require("events");
const mdns_server_js_1 = require("./mdns-server.js");
// ============================================================================
// Constants
// ============================================================================
/** Default WebSocket port */
exports.DEFAULT_WS_PORT = 53318;
/** Ping interval for client keepalive */
const PING_INTERVAL = 30000; // 30 seconds
// ============================================================================
// WebSocket Server Class
// ============================================================================
/**
 * WebSocket server for browser clients
 */
class TallowWebSocketServer extends events_1.EventEmitter {
    wss = null;
    mdns;
    clients = new Map();
    pingInterval = null;
    port;
    isRunning = false;
    constructor(port = exports.DEFAULT_WS_PORT) {
        super();
        this.port = port;
        this.mdns = (0, mdns_server_js_1.getMDNSServer)();
    }
    // ============================================================================
    // Lifecycle
    // ============================================================================
    /**
     * Start the WebSocket server
     */
    start() {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                resolve();
                return;
            }
            try {
                // Create WebSocket server
                this.wss = new ws_1.WebSocketServer({
                    port: this.port,
                    clientTracking: true,
                });
                this.wss.on('listening', () => {
                    console.log(`[WebSocket] Server listening on port ${this.port}`);
                    this.isRunning = true;
                    this.setupMDNSEvents();
                    this.startPingInterval();
                    resolve();
                });
                this.wss.on('connection', (ws) => {
                    this.handleConnection(ws);
                });
                this.wss.on('error', (error) => {
                    console.error('[WebSocket] Server error:', error);
                    this.emit('error', error);
                    if (!this.isRunning) {
                        reject(error);
                    }
                });
            }
            catch (error) {
                console.error('[WebSocket] Failed to start server:', error);
                reject(error);
            }
        });
    }
    /**
     * Stop the WebSocket server
     */
    stop() {
        return new Promise((resolve) => {
            if (!this.isRunning) {
                resolve();
                return;
            }
            // Stop ping interval
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
            // Close all client connections
            this.clients.forEach((client) => {
                client.close(1000, 'Server shutting down');
            });
            this.clients.clear();
            // Close server
            if (this.wss) {
                this.wss.close(() => {
                    console.log('[WebSocket] Server stopped');
                    this.isRunning = false;
                    resolve();
                });
            }
            else {
                this.isRunning = false;
                resolve();
            }
        });
    }
    /**
     * Check if server is running
     */
    getIsRunning() {
        return this.isRunning;
    }
    /**
     * Get connected client count
     */
    getClientCount() {
        return this.clients.size;
    }
    // ============================================================================
    // Connection Handling
    // ============================================================================
    /**
     * Handle new client connection
     */
    handleConnection(ws) {
        // Initialize client
        ws.isAlive = true;
        ws.clientId = this.generateClientId();
        // Store client
        this.clients.set(ws.clientId, ws);
        console.log(`[WebSocket] Client connected: ${ws.clientId}`);
        // Handle pong (keepalive response)
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        // Handle messages
        ws.on('message', (data) => {
            this.handleMessage(ws, data.toString());
        });
        // Handle close
        ws.on('close', () => {
            console.log(`[WebSocket] Client disconnected: ${ws.clientId}`);
            this.clients.delete(ws.clientId);
        });
        // Handle error
        ws.on('error', (error) => {
            console.error(`[WebSocket] Client error (${ws.clientId}):`, error);
        });
        // Send initial status
        this.sendStatus(ws);
    }
    /**
     * Handle incoming message
     */
    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'start-discovery':
                    this.handleStartDiscovery(ws, message.platformFilter);
                    break;
                case 'stop-discovery':
                    this.handleStopDiscovery();
                    break;
                case 'advertise':
                    this.handleAdvertise(message.device);
                    break;
                case 'stop-advertising':
                    this.handleStopAdvertising();
                    break;
                case 'get-devices':
                    this.handleGetDevices(ws);
                    break;
                case 'ping':
                    this.handlePing(ws, message.timestamp);
                    break;
                default:
                    this.sendError(ws, `Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
            this.sendError(ws, 'Invalid message format');
        }
    }
    // ============================================================================
    // Message Handlers
    // ============================================================================
    /**
     * Handle start discovery
     */
    handleStartDiscovery(ws, platformFilter) {
        ws.platformFilter = platformFilter;
        // Start mDNS discovery if not already running
        if (!this.mdns.getIsDiscovering()) {
            this.mdns.startDiscovery(platformFilter);
        }
        // Send current devices to this client
        this.handleGetDevices(ws);
        this.sendStatus(ws);
    }
    /**
     * Handle stop discovery
     */
    handleStopDiscovery() {
        // Only stop if no clients need discovery
        const anyClientDiscovering = Array.from(this.clients.values()).some((c) => c.platformFilter !== undefined);
        if (!anyClientDiscovering) {
            this.mdns.stopDiscovery();
        }
        this.broadcastStatus();
    }
    /**
     * Handle advertise
     */
    handleAdvertise(device) {
        const options = {
            deviceId: device.id,
            deviceName: device.name,
            platform: device.platform,
            capabilities: device.capabilities,
            fingerprint: device.fingerprint,
        };
        this.mdns.startAdvertising(options);
        this.broadcastStatus();
    }
    /**
     * Handle stop advertising
     */
    handleStopAdvertising() {
        this.mdns.stopAdvertising();
        this.broadcastStatus();
    }
    /**
     * Handle get devices
     */
    handleGetDevices(ws) {
        let devices = this.mdns.getDevices();
        // Apply platform filter if set
        if (ws.platformFilter && ws.platformFilter.length > 0) {
            const filterSet = new Set(ws.platformFilter);
            devices = devices.filter((d) => filterSet.has(d.platform));
        }
        this.send(ws, {
            type: 'device-list',
            devices,
        });
    }
    /**
     * Handle ping
     */
    handlePing(ws, timestamp) {
        this.send(ws, {
            type: 'pong',
            timestamp,
            serverTime: Date.now(),
        });
    }
    // ============================================================================
    // mDNS Event Handling
    // ============================================================================
    /**
     * Set up mDNS event handlers
     */
    setupMDNSEvents() {
        this.mdns.on('device-found', (device) => {
            this.broadcast({
                type: 'device-found',
                device,
            });
        });
        this.mdns.on('device-lost', (deviceId) => {
            this.broadcast({
                type: 'device-lost',
                deviceId,
            });
        });
        this.mdns.on('device-updated', (device) => {
            this.broadcast({
                type: 'device-updated',
                device,
            });
        });
    }
    // ============================================================================
    // Message Sending
    // ============================================================================
    /**
     * Send message to a single client
     */
    send(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    /**
     * Broadcast message to all clients
     */
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                // Apply platform filter for device messages
                if ((message.type === 'device-found' || message.type === 'device-updated') &&
                    client.platformFilter &&
                    client.platformFilter.length > 0) {
                    const filterSet = new Set(client.platformFilter);
                    if (!filterSet.has(message.device.platform)) {
                        return; // Skip this client
                    }
                }
                client.send(data);
            }
        });
    }
    /**
     * Send error to client
     */
    sendError(ws, message, code) {
        this.send(ws, {
            type: 'error',
            message,
            code,
        });
    }
    /**
     * Send status to a single client
     */
    sendStatus(ws) {
        this.send(ws, this.buildStatusMessage());
    }
    /**
     * Broadcast status to all clients
     */
    broadcastStatus() {
        this.broadcast(this.buildStatusMessage());
    }
    /**
     * Build status message
     */
    buildStatusMessage() {
        const isDiscovering = this.mdns.getIsDiscovering();
        const isAdvertising = this.mdns.getIsAdvertising();
        let status = 'idle';
        if (isDiscovering && isAdvertising) {
            status = 'discovering';
        }
        else if (isDiscovering) {
            status = 'discovering';
        }
        else if (isAdvertising) {
            status = 'advertising';
        }
        return {
            type: 'status',
            status,
            isDiscovering,
            isAdvertising,
            deviceCount: this.mdns.getDeviceCount(),
        };
    }
    // ============================================================================
    // Keepalive
    // ============================================================================
    /**
     * Start ping interval for keepalive
     */
    startPingInterval() {
        this.pingInterval = setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (!client.isAlive) {
                    console.log(`[WebSocket] Client timed out: ${clientId}`);
                    client.terminate();
                    this.clients.delete(clientId);
                    return;
                }
                client.isAlive = false;
                client.ping();
            });
        }, PING_INTERVAL);
    }
    // ============================================================================
    // Utility
    // ============================================================================
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
exports.TallowWebSocketServer = TallowWebSocketServer;
// ============================================================================
// Singleton Instance
// ============================================================================
let wsServerInstance = null;
/**
 * Get the singleton WebSocket server
 */
function getWebSocketServer(port) {
    if (!wsServerInstance) {
        wsServerInstance = new TallowWebSocketServer(port);
    }
    return wsServerInstance;
}
exports.default = TallowWebSocketServer;
//# sourceMappingURL=websocket-server.js.map