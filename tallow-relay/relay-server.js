 
/**
 * TALLOW Relay Server
 *
 * A standalone relay node for the TALLOW onion routing network.
 * This server can act as an entry, middle, or exit relay for anonymous transfers.
 *
 * Protocol:
 * - Accepts PQC-encrypted WebSocket connections from clients
 * - Peels one encryption layer and forwards to next hop
 * - Maintains circuit state for bidirectional communication
 *
 * Usage:
 *   node relay-server.js [--port PORT] [--role ROLE] [--region REGION]
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const { ml_kem768 } = require('@noble/post-quantum/ml-kem');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    port: parseInt(process.env.RELAY_PORT || process.argv[2]?.replace('--port=', '') || '8443'),
    role: process.env.RELAY_ROLE || process.argv.find(a => a.startsWith('--role='))?.split('=')[1] || 'any',
    region: process.env.RELAY_REGION || process.argv.find(a => a.startsWith('--region='))?.split('=')[1] || 'unknown',
    directoryUrl: process.env.RELAY_DIRECTORY_URL || 'https://relay-directory.tallow.network/v1',
    healthCheckInterval: 30000, // 30 seconds
    circuitTimeout: 10 * 60 * 1000, // 10 minutes
    maxCircuitsPerClient: 5,
    maxPayloadSize: 64 * 1024, // 64KB
    maxMessageSize: 1024 * 1024, // 1MB max message size
};

// ============================================================================
// Rate Limiting
// ============================================================================

// Simple rate limiter
const rateLimiter = new Map(); // ip -> { count, resetTime }
const RATE_LIMIT = 10; // max circuits per IP per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimiter.get(ip);
    if (!entry || now > entry.resetTime) {
        rateLimiter.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) {
        return false;
    }
    entry.count++;
    return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimiter) {
        if (now > entry.resetTime) {rateLimiter.delete(ip);}
    }
}, 300000);

// Message types
const MSG_TYPE = {
    HELLO: 0x01,
    HELLO_RESPONSE: 0x02,
    CREATE_CIRCUIT: 0x10,
    CIRCUIT_CREATED: 0x11,
    EXTEND_CIRCUIT: 0x12,
    CIRCUIT_EXTENDED: 0x13,
    DESTROY_CIRCUIT: 0x14,
    RELAY_DATA: 0x20,
    RELAY_ACK: 0x21,
    HEARTBEAT: 0x30,
    HEARTBEAT_ACK: 0x31,
    ERROR: 0xFF,
};

// ============================================================================
// Relay State
// ============================================================================

class RelayState {
    constructor() {
        // Our relay's keypair
        this.keyPair = null;
        this.publicKeyBase64 = null;
        this.relayId = null;

        // Active circuits: circuitId -> CircuitInfo
        this.circuits = new Map();

        // Client connections: ws -> ClientInfo
        this.clients = new Map();

        // Next hop connections: relayId -> WebSocket
        this.nextHopConnections = new Map();

        // Stats
        this.stats = {
            circuitsCreated: 0,
            circuitsActive: 0,
            bytesForwarded: 0,
            messagesRelayed: 0,
            errors: 0,
        };
    }

    async initialize() {
        // Generate ML-KEM-768 keypair
        const keyPair = ml_kem768.keygen();
        this.keyPair = {
            publicKey: keyPair.publicKey,
            secretKey: keyPair.secretKey,
        };
        this.publicKeyBase64 = Buffer.from(this.keyPair.publicKey).toString('base64');

        // Generate relay ID from public key hash
        const hash = crypto.createHash('sha256').update(this.keyPair.publicKey).digest();
        this.relayId = `relay-${hash.slice(0, 8).toString('hex')}`;

        console.log(`[Relay] Initialized with ID: ${this.relayId}`);
        console.log(`[Relay] Public key: ${this.publicKeyBase64.slice(0, 32)}...`);
    }

    addCircuit(circuitId, clientWs, sessionKey, nextHop = null) {
        this.circuits.set(circuitId, {
            id: circuitId,
            clientWs,
            sessionKey,
            nextHop,
            nextHopWs: null,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            bytesForwarded: 0,
        });
        this.stats.circuitsCreated++;
        this.stats.circuitsActive++;
    }

    removeCircuit(circuitId) {
        const circuit = this.circuits.get(circuitId);
        if (circuit) {
            // Close next hop connection if exists
            if (circuit.nextHopWs && circuit.nextHopWs.readyState === WebSocket.OPEN) {
                circuit.nextHopWs.close();
            }
            this.circuits.delete(circuitId);
            this.stats.circuitsActive--;
        }
    }
}

const state = new RelayState();

// ============================================================================
// Cryptographic Functions
// ============================================================================

function decapsulate(ciphertext) {
    try {
        const sharedSecret = ml_kem768.decapsulate(ciphertext, state.keyPair.secretKey);
        return sharedSecret;
    } catch (error) {
        console.error('[Relay] Decapsulation failed:', error.message);
        return null;
    }
}

function deriveSessionKey(sharedSecret) {
    // HKDF-like key derivation
    const info = Buffer.from('tallow-relay-session-v1');
    const salt = Buffer.alloc(32);
    const prk = crypto.createHmac('sha256', salt).update(sharedSecret).digest();
    const okm = crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest();
    return okm;
}

function encryptMessage(data, key) {
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([nonce, encrypted, tag]);
}

function decryptMessage(data, key) {
    try {
        const nonce = data.slice(0, 12);
        const tag = data.slice(-16);
        const ciphertext = data.slice(12, -16);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (error) {
        console.error('[Relay] Decryption failed:', error.message);
        return null;
    }
}

// ============================================================================
// Message Handling
// ============================================================================

function parseMessage(data) {
    if (data.length < 6) {return null;}

    const type = data[0];
    const requestId = data.readUInt32BE(1);
    const circuitIdLen = data[5];
    const circuitId = circuitIdLen > 0 ? data.slice(6, 6 + circuitIdLen).toString() : null;

    const payloadOffset = 6 + circuitIdLen;
    const payloadLen = data.readUInt32BE(payloadOffset);
    const payload = data.slice(payloadOffset + 4, payloadOffset + 4 + payloadLen);

    return { type, requestId, circuitId, payload };
}

function buildMessage(type, requestId, payload, circuitId = null) {
    const circuitIdBuf = circuitId ? Buffer.from(circuitId) : Buffer.alloc(0);
    const totalSize = 1 + 4 + 1 + circuitIdBuf.length + 4 + payload.length;

    const message = Buffer.alloc(totalSize);
    let offset = 0;

    message[offset++] = type;
    message.writeUInt32BE(requestId, offset);
    offset += 4;
    message[offset++] = circuitIdBuf.length;
    circuitIdBuf.copy(message, offset);
    offset += circuitIdBuf.length;
    message.writeUInt32BE(payload.length, offset);
    offset += 4;
    payload.copy(message, offset);

    return message;
}

function sendError(ws, requestId, errorMessage, circuitId = null) {
    const payload = Buffer.from(errorMessage);
    const message = buildMessage(MSG_TYPE.ERROR, requestId, payload, circuitId);
    ws.send(message);
}

// ============================================================================
// Protocol Handlers
// ============================================================================

async function handleHello(ws, clientInfo, message) {
    const version = message.payload[0];
    if (version !== 1) {
        sendError(ws, message.requestId, 'Unsupported protocol version');
        return;
    }

    // Parse client's public key (skip version byte)
    const clientPublicKey = message.payload.slice(1);

    // Encapsulate shared secret using client's public key
    // Note: Client sends hybrid key, we just use the Kyber part (first 1184 bytes)
    const kyberPublicKey = clientPublicKey.slice(0, 1184);

    try {
        const { ciphertext, sharedSecret } = ml_kem768.encapsulate(kyberPublicKey);

        // Derive session key
        const sessionKey = deriveSessionKey(sharedSecret);
        clientInfo.sessionKey = sessionKey;
        clientInfo.authenticated = true;

        // Build response: version + ciphertext
        const response = Buffer.alloc(1 + ciphertext.length);
        response[0] = 1; // Protocol version
        Buffer.from(ciphertext).copy(response, 1);

        const responseMsg = buildMessage(MSG_TYPE.HELLO_RESPONSE, message.requestId, response);
        ws.send(responseMsg);

        console.log(`[Relay] Client authenticated: ${clientInfo.id}`);
    } catch (error) {
        console.error('[Relay] HELLO failed:', error.message);
        sendError(ws, message.requestId, 'Handshake failed');
    }
}

async function handleCreateCircuit(ws, clientInfo, message) {
    if (!clientInfo.authenticated) {
        sendError(ws, message.requestId, 'Not authenticated', message.circuitId);
        return;
    }

    // Apply rate limiting
    const clientIP = clientInfo.ip || 'unknown';
    if (!checkRateLimit(clientIP)) {
        sendError(ws, message.requestId, 'Rate limit exceeded. Try again later.', message.circuitId);
        console.warn(`[Relay] Rate limit exceeded for ${clientIP}`);
        return;
    }

    if (clientInfo.circuitCount >= CONFIG.maxCircuitsPerClient) {
        sendError(ws, message.requestId, 'Too many circuits', message.circuitId);
        return;
    }

    // Parse the ciphertext from payload
    const ciphertext = message.payload;

    // Decapsulate to get shared secret
    const sharedSecret = decapsulate(ciphertext);
    if (!sharedSecret) {
        sendError(ws, message.requestId, 'Decapsulation failed', message.circuitId);
        return;
    }

    // Derive circuit-specific session key
    const circuitId = message.circuitId || crypto.randomBytes(16).toString('hex');
    const circuitKey = crypto.createHmac('sha256', sharedSecret)
        .update(`tallow-circuit-${circuitId}`)
        .digest();

    // Add circuit
    state.addCircuit(circuitId, ws, circuitKey);
    clientInfo.circuitCount++;

    // Send success response
    const response = Buffer.from([0x01]); // Success
    const responseMsg = buildMessage(MSG_TYPE.CIRCUIT_CREATED, message.requestId, response, circuitId);

    if (clientInfo.sessionKey) {
        ws.send(encryptMessage(responseMsg, clientInfo.sessionKey));
    } else {
        ws.send(responseMsg);
    }

    console.log(`[Relay] Circuit created: ${circuitId}`);
}

async function handleExtendCircuit(ws, clientInfo, message) {
    const circuit = state.circuits.get(message.circuitId);
    if (!circuit) {
        sendError(ws, message.requestId, 'Circuit not found', message.circuitId);
        return;
    }

    // Decrypt payload with circuit key
    const decrypted = decryptMessage(message.payload, circuit.sessionKey);
    if (!decrypted) {
        sendError(ws, message.requestId, 'Decryption failed', message.circuitId);
        return;
    }

    // Parse next hop address (null-terminated string followed by ciphertext for next relay)
    const nullIndex = decrypted.indexOf(0);
    const nextHopAddress = decrypted.slice(0, nullIndex).toString();
    const _nextCiphertext = decrypted.slice(nullIndex + 1);

    console.log(`[Relay] Extending circuit ${message.circuitId} to ${nextHopAddress}`);

    try {
        // Connect to next hop relay
        const nextHopWs = new WebSocket(nextHopAddress);

        nextHopWs.on('open', async () => {
            // Forward the ciphertext to establish circuit with next relay
            // For simplicity, we'll just store the connection
            circuit.nextHop = nextHopAddress;
            circuit.nextHopWs = nextHopWs;

            // Send success response
            const response = Buffer.from([0x01]); // Success
            const encrypted = encryptMessage(response, circuit.sessionKey);
            const responseMsg = buildMessage(MSG_TYPE.CIRCUIT_EXTENDED, message.requestId, encrypted, message.circuitId);

            if (clientInfo.sessionKey) {
                ws.send(encryptMessage(responseMsg, clientInfo.sessionKey));
            } else {
                ws.send(responseMsg);
            }

            console.log(`[Relay] Circuit ${message.circuitId} extended to ${nextHopAddress}`);
        });

        nextHopWs.on('error', (error) => {
            console.error(`[Relay] Failed to connect to ${nextHopAddress}:`, error.message);
            sendError(ws, message.requestId, 'Failed to extend circuit', message.circuitId);
        });

        nextHopWs.on('message', (data) => {
            // Forward response back to client
            const forwarded = encryptMessage(Buffer.from(data), circuit.sessionKey);
            ws.send(forwarded);
            circuit.bytesForwarded += data.length;
            state.stats.bytesForwarded += data.length;
        });

    } catch (error) {
        console.error(`[Relay] Extend failed:`, error.message);
        sendError(ws, message.requestId, 'Extension failed', message.circuitId);
    }
}

async function handleRelayData(ws, clientInfo, message) {
    const circuit = state.circuits.get(message.circuitId);
    if (!circuit) {
        return; // Silently drop data for unknown circuits
    }

    circuit.lastActivity = Date.now();

    // Validate payload size
    if (message.payload.length > CONFIG.maxMessageSize) {
        console.warn(`[Relay] Relay data too large: ${message.payload.length} bytes`);
        return;
    }

    // Decrypt one layer
    const decrypted = decryptMessage(message.payload, circuit.sessionKey);
    if (!decrypted) {
        return; // Silently drop malformed data
    }

    // If we have a next hop, forward the decrypted data
    if (circuit.nextHopWs && circuit.nextHopWs.readyState === WebSocket.OPEN) {
        circuit.nextHopWs.send(decrypted);
        circuit.bytesForwarded += decrypted.length;
        state.stats.bytesForwarded += decrypted.length;
        state.stats.messagesRelayed++;
    } else {
        // We're the exit node - deliver to destination
        // In a full implementation, this would forward to the actual peer
        console.log(`[Relay] Exit node: delivering ${decrypted.length} bytes`);
    }
}

async function handleDestroyCircuit(ws, clientInfo, message) {
    const circuit = state.circuits.get(message.circuitId);
    if (circuit) {
        state.removeCircuit(message.circuitId);
        clientInfo.circuitCount--;
        console.log(`[Relay] Circuit destroyed: ${message.circuitId}`);
    }
}

async function handleHeartbeat(ws, clientInfo, message) {
    const responseMsg = buildMessage(MSG_TYPE.HEARTBEAT_ACK, message.requestId, Buffer.alloc(0));
    if (clientInfo.sessionKey) {
        ws.send(encryptMessage(responseMsg, clientInfo.sessionKey));
    } else {
        ws.send(responseMsg);
    }
}

// ============================================================================
// WebSocket Server
// ============================================================================

const server = http.createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            relayId: state.relayId,
            role: CONFIG.role,
            region: CONFIG.region,
            stats: state.stats,
        }));
        return;
    }

    // Relay info endpoint
    if (req.url === '/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            id: state.relayId,
            publicKey: state.publicKeyBase64,
            role: CONFIG.role,
            region: CONFIG.region,
            endpoint: `wss://${req.headers.host}`,
        }));
        return;
    }

    res.writeHead(404);
    res.end();
});

const wss = new WebSocket.Server({ server, path: '/relay' });

wss.on('connection', (ws, req) => {
    const clientId = `client-${crypto.randomBytes(4).toString('hex')}`;
    const clientIP = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const clientInfo = {
        id: clientId,
        ws,
        ip: clientIP,
        sessionKey: null,
        authenticated: false,
        circuitCount: 0,
        connectedAt: Date.now(),
    };
    state.clients.set(ws, clientInfo);

    console.log(`[Relay] Client connected: ${clientId} from ${clientIP}`);

    ws.on('message', async (data) => {
        try {
            let messageData = Buffer.from(data);

            // Check message size limit
            if (messageData.length > CONFIG.maxMessageSize) {
                console.warn(`[Relay] Message too large from ${clientId}: ${messageData.length} bytes`);
                sendError(ws, 0, 'Message too large');
                return;
            }

            // If authenticated, decrypt first
            if (clientInfo.sessionKey) {
                messageData = decryptMessage(messageData, clientInfo.sessionKey);
                if (!messageData) {
                    console.error(`[Relay] Failed to decrypt message from ${clientId}`);
                    return;
                }
            }

            const message = parseMessage(messageData);
            if (!message) {
                console.error(`[Relay] Invalid message from ${clientId}`);
                return;
            }

            switch (message.type) {
                case MSG_TYPE.HELLO:
                    await handleHello(ws, clientInfo, message);
                    break;
                case MSG_TYPE.CREATE_CIRCUIT:
                    await handleCreateCircuit(ws, clientInfo, message);
                    break;
                case MSG_TYPE.EXTEND_CIRCUIT:
                    await handleExtendCircuit(ws, clientInfo, message);
                    break;
                case MSG_TYPE.RELAY_DATA:
                    await handleRelayData(ws, clientInfo, message);
                    break;
                case MSG_TYPE.DESTROY_CIRCUIT:
                    await handleDestroyCircuit(ws, clientInfo, message);
                    break;
                case MSG_TYPE.HEARTBEAT:
                    await handleHeartbeat(ws, clientInfo, message);
                    break;
                default:
                    console.warn(`[Relay] Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error(`[Relay] Error handling message:`, error);
            state.stats.errors++;
        }
    });

    ws.on('close', () => {
        // Clean up client's circuits
        for (const [circuitId, circuit] of state.circuits) {
            if (circuit.clientWs === ws) {
                state.removeCircuit(circuitId);
            }
        }
        state.clients.delete(ws);
        console.log(`[Relay] Client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
        console.error(`[Relay] WebSocket error for ${clientId}:`, error.message);
    });
});

// ============================================================================
// Circuit Cleanup
// ============================================================================

setInterval(() => {
    const now = Date.now();
    for (const [circuitId, circuit] of state.circuits) {
        if (now - circuit.lastActivity > CONFIG.circuitTimeout) {
            console.log(`[Relay] Circuit timed out: ${circuitId}`);
            state.removeCircuit(circuitId);
        }
    }
}, 60000); // Check every minute

// ============================================================================
// Startup
// ============================================================================

async function start() {
    await state.initialize();

    server.listen(CONFIG.port, '0.0.0.0', () => {
        console.log(`
╔══════════════════════════════════════════════════╗
║       TALLOW Relay Server                        ║
║       Ready on port ${CONFIG.port.toString().padEnd(27)}║
║       Role: ${CONFIG.role.padEnd(35)}║
║       Region: ${CONFIG.region.padEnd(33)}║
╚══════════════════════════════════════════════════╝
        `);
    });
}

start().catch(error => {
    console.error('[Relay] Failed to start:', error);
    process.exit(1);
});
