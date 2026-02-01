/**
 * WebSocket Server
 *
 * Provides WebSocket API for web browsers to access mDNS functionality.
 * Bridges the gap between browsers (which cannot use mDNS directly)
 * and local network discovery.
 */
import { EventEmitter } from 'events';
/** Default WebSocket port */
export declare const DEFAULT_WS_PORT = 53318;
/**
 * WebSocket server for browser clients
 */
export declare class TallowWebSocketServer extends EventEmitter {
    private wss;
    private mdns;
    private clients;
    private pingInterval;
    private port;
    private isRunning;
    constructor(port?: number);
    /**
     * Start the WebSocket server
     */
    start(): Promise<void>;
    /**
     * Stop the WebSocket server
     */
    stop(): Promise<void>;
    /**
     * Check if server is running
     */
    getIsRunning(): boolean;
    /**
     * Get connected client count
     */
    getClientCount(): number;
    /**
     * Handle new client connection
     */
    private handleConnection;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle start discovery
     */
    private handleStartDiscovery;
    /**
     * Handle stop discovery
     */
    private handleStopDiscovery;
    /**
     * Handle advertise
     */
    private handleAdvertise;
    /**
     * Handle stop advertising
     */
    private handleStopAdvertising;
    /**
     * Handle get devices
     */
    private handleGetDevices;
    /**
     * Handle ping
     */
    private handlePing;
    /**
     * Set up mDNS event handlers
     */
    private setupMDNSEvents;
    /**
     * Send message to a single client
     */
    private send;
    /**
     * Broadcast message to all clients
     */
    private broadcast;
    /**
     * Send error to client
     */
    private sendError;
    /**
     * Send status to a single client
     */
    private sendStatus;
    /**
     * Broadcast status to all clients
     */
    private broadcastStatus;
    /**
     * Build status message
     */
    private buildStatusMessage;
    /**
     * Start ping interval for keepalive
     */
    private startPingInterval;
    /**
     * Generate unique client ID
     */
    private generateClientId;
}
/**
 * Get the singleton WebSocket server
 */
export declare function getWebSocketServer(port?: number): TallowWebSocketServer;
export default TallowWebSocketServer;
//# sourceMappingURL=websocket-server.d.ts.map