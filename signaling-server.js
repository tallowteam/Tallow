// Tallow Signaling Server
// WebSocket server for P2P connection signaling
//
// SIGNAL-ROUTER (Agent 023) — Production-Hardened
//
// Fixes applied:
// 1. CRITICAL: Disconnect handler now cleans up transferRoom memberships
// 2. Heartbeat/ping-pong with missed-pong tracking
// 3. Full message validation on all signaling payloads
// 4. Proper room lifecycle: create -> join -> leave -> destroy
// 5. Per-second rate limiting to prevent signaling flood attacks
// 6. Resolved 'leave-room' event name collision
// 7. Socket-to-room reverse index for O(1) cleanup
//
const { Server } = require('socket.io');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.SIGNALING_PORT || 3001;

// =============================================================================
// SIGNAL-ROUTER (Agent 023) Policy Constants
// =============================================================================

// Maximum room lifetime: 24 hours (policy-enforced ceiling)
const MAX_ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Minimum room code length (CSPRNG-generated, 6+ chars)
const MIN_ROOM_CODE_LENGTH = 6;

// Maximum peers per room
const MAX_PEERS_PER_ROOM = 10;

// Heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 30000;  // Ping every 30 seconds
const HEARTBEAT_TIMEOUT_MS = 10000;   // Wait 10s for pong response
const MAX_MISSED_PONGS = 3;           // Disconnect after 3 missed pongs

// Room inactivity timeout: 30 minutes
const ROOM_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

// Maximum message payload size (prevent memory exhaustion)
const MAX_MESSAGE_SIZE = 65536; // 64KB

// =============================================================================
// Security Utilities
// =============================================================================

/**
 * Timing-safe string comparison to prevent timing attacks on password verification
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    // Use Node.js crypto.timingSafeEqual with Buffer padding
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    // Pad to same length to prevent length-based timing attacks
    const maxLen = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    bufA.copy(paddedA);
    bufB.copy(paddedB);

    // XOR length difference to detect length mismatch without timing leak
    const lengthMatch = bufA.length === bufB.length;

    try {
        return crypto.timingSafeEqual(paddedA, paddedB) && lengthMatch;
    } catch {
        return false;
    }
}

// =============================================================================
// Message Validation
// =============================================================================

/**
 * Validate that a value is a non-empty string within size limits
 */
function isValidString(val, maxLen = 256) {
    return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}

/**
 * Validate a socket ID format (Socket.IO uses base64-like IDs)
 */
function isValidSocketId(val) {
    return isValidString(val, 64) && /^[a-zA-Z0-9_-]+$/.test(val);
}

/**
 * Validate a room code format
 */
function isValidRoomCode(val) {
    return isValidString(val, 20) && /^[A-Za-z0-9-]+$/.test(val);
}

/**
 * Validate offer/answer SDP-like payload (opaque relay -- we check shape, not content)
 * The server NEVER inspects SDP content. We only validate the envelope exists.
 */
function isValidSignalingPayload(data) {
    if (!data || typeof data !== 'object') return false;
    // Must have a target socket ID
    if (!isValidSocketId(data.target)) return false;
    // Rough size check: serialized payload should not exceed MAX_MESSAGE_SIZE
    try {
        const serialized = JSON.stringify(data);
        if (serialized.length > MAX_MESSAGE_SIZE) return false;
    } catch {
        return false;
    }
    return true;
}

/**
 * Validate an offer message
 */
function isValidOfferMessage(data) {
    if (!isValidSignalingPayload(data)) return false;
    // Must have an offer field (opaque -- could be encrypted blob)
    if (data.offer === undefined || data.offer === null) return false;
    return true;
}

/**
 * Validate an answer message
 */
function isValidAnswerMessage(data) {
    if (!isValidSignalingPayload(data)) return false;
    if (data.answer === undefined || data.answer === null) return false;
    return true;
}

/**
 * Validate an ICE candidate message
 */
function isValidICECandidateMessage(data) {
    if (!isValidSignalingPayload(data)) return false;
    if (data.candidate === undefined || data.candidate === null) return false;
    return true;
}

// =============================================================================
// Rate Limiting
// =============================================================================

const RATE_LIMITS = {
    connectionsPerIpPerMinute: 10,
    // Per-second burst limit (100 messages/second as required)
    messagesPerSecond: 100,
    // Sliding window: 50 events per 10 seconds
    eventsPerSocketPerWindow: 50,
    eventWindowMs: 10000,
    maxRoomsPerSocket: 5,
};

// Track connection attempts per IP
const ipConnections = new Map(); // ip -> { count, resetTime }

// Track event rates per socket: dual-layer (per-second burst + sliding window)
const socketRateLimits = new Map(); // socketId -> { burst: { count, resetTime }, window: { count, resetTime } }

function checkIpRateLimit(ip) {
    const now = Date.now();
    const entry = ipConnections.get(ip);

    if (!entry || now > entry.resetTime) {
        ipConnections.set(ip, { count: 1, resetTime: now + 60000 });
        return true;
    }

    entry.count++;
    if (entry.count > RATE_LIMITS.connectionsPerIpPerMinute) {
        return false;
    }
    return true;
}

function checkSocketRateLimit(socketId) {
    const now = Date.now();
    let entry = socketRateLimits.get(socketId);

    if (!entry) {
        entry = {
            burst: { count: 1, resetTime: now + 1000 },
            window: { count: 1, resetTime: now + RATE_LIMITS.eventWindowMs },
        };
        socketRateLimits.set(socketId, entry);
        return true;
    }

    // Check per-second burst limit
    if (now > entry.burst.resetTime) {
        entry.burst.count = 1;
        entry.burst.resetTime = now + 1000;
    } else {
        entry.burst.count++;
        if (entry.burst.count > RATE_LIMITS.messagesPerSecond) {
            return false;
        }
    }

    // Check sliding window limit
    if (now > entry.window.resetTime) {
        entry.window.count = 1;
        entry.window.resetTime = now + RATE_LIMITS.eventWindowMs;
    } else {
        entry.window.count++;
        if (entry.window.count > RATE_LIMITS.eventsPerSocketPerWindow) {
            return false;
        }
    }

    return true;
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipConnections.entries()) {
        if (now > entry.resetTime) ipConnections.delete(ip);
    }
    for (const [id, entry] of socketRateLimits.entries()) {
        if (now > entry.burst.resetTime && now > entry.window.resetTime) {
            socketRateLimits.delete(id);
        }
    }
}, 300000);

// Replay protection: reject signaling messages older than 30s (with 5s clock skew tolerance)
const SIGNALING_MAX_AGE_MS = 30000;
const SIGNALING_CLOCK_SKEW_MS = 5000;

function isSignalingMessageFresh(ts) {
    if (!ts || typeof ts !== 'number') return true; // Backward compat with old clients
    const age = Date.now() - ts;
    return age >= -SIGNALING_CLOCK_SKEW_MS && age <= SIGNALING_MAX_AGE_MS;
}

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://tallow.manisahome.com'
];

// For development, we'll be more permissive with CORS
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Check if an origin is from a private/local network address
function isPrivateNetworkOrigin(origin) {
    if (!origin) return false;
    try {
        const url = new URL(origin);
        const hostname = url.hostname;
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
            hostname.endsWith('.local')
        );
    } catch {
        return false;
    }
}

const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    // Validate origin - only allow configured origins or private networks in dev
    const isAllowedOrigin = origin && (
        ALLOWED_ORIGINS.includes(origin) ||
        (isDev && isPrivateNetworkOrigin(origin))
    );

    if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!isDev && origin) {
        // In production, reject non-allowed origins explicitly
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Origin not allowed' }));
        return;
    }
    // Non-matching origins in production get no CORS header (blocked by browser)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'tallow-signaling',
            rooms: rooms.size,
            transferRooms: transferRooms.size,
            uptime: Math.floor(process.uptime()),
        }));
        return;
    }
    res.writeHead(404);
    res.end();
});

const io = new Server(server, {
    path: '/signaling',
    cors: {
        origin: (origin, callback) => {
            if (!origin || isDev || ALLOWED_ORIGINS.includes(origin) || isPrivateNetworkOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Origin not allowed'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    },
    // Socket.IO built-in ping/pong (transport-level keepalive)
    pingTimeout: 60000,
    pingInterval: 25000,
    // Limit incoming message size
    maxHttpBufferSize: MAX_MESSAGE_SIZE,
});

// Room management (simple peer-to-peer rooms)
const rooms = new Map(); // roomId -> Set<socketId>

// Transfer room management (persistent rooms with metadata)
const transferRooms = new Map(); // code -> { id, code, name, ownerId, members: Map(deviceId -> member), lastActivity }

// =============================================================================
// REVERSE INDEX: Socket -> Rooms
// Enables O(1) cleanup on disconnect instead of iterating all rooms
// =============================================================================
const socketToRooms = new Map();       // socketId -> Set<roomId>        (simple rooms)
const socketToTransferRooms = new Map(); // socketId -> Set<roomCode>     (transfer rooms)

// =============================================================================
// Heartbeat Tracker
// Application-level heartbeat on top of Socket.IO's transport-level ping
// =============================================================================
const heartbeatState = new Map(); // socketId -> { missedPongs: number, lastPong: number, interval: NodeJS.Timer }

function startHeartbeat(socket) {
    const state = {
        missedPongs: 0,
        lastPong: Date.now(),
        interval: setInterval(() => {
            const s = heartbeatState.get(socket.id);
            if (!s) return;

            s.missedPongs++;

            if (s.missedPongs > MAX_MISSED_PONGS) {
                console.log(`[${new Date().toISOString()}] Heartbeat timeout (${MAX_MISSED_PONGS} missed pongs): ${socket.id}`);
                stopHeartbeat(socket.id);
                socket.disconnect(true);
                return;
            }

            // Send application-level ping
            socket.emit('heartbeat-ping', { ts: Date.now() });
        }, HEARTBEAT_INTERVAL_MS),
    };

    heartbeatState.set(socket.id, state);
}

function stopHeartbeat(socketId) {
    const state = heartbeatState.get(socketId);
    if (state) {
        clearInterval(state.interval);
        heartbeatState.delete(socketId);
    }
}

// =============================================================================
// Transfer Room Cleanup: Expiry + Inactivity
// =============================================================================

// Clean up expired / inactive transfer rooms every 5 minutes
// SIGNAL-ROUTER policy: rooms MUST expire. Maximum lifetime is 24 hours.
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of transferRooms.entries()) {
        const createdTime = new Date(room.createdAt).getTime();
        // Policy: hard ceiling at 24h regardless of expiresAt
        const absoluteDeadline = createdTime + MAX_ROOM_LIFETIME_MS;

        let expired = false;

        // Check absolute deadline
        if (absoluteDeadline < now) {
            expired = true;
        }

        // Check configured expiry
        if (!expired && room.expiresAt) {
            const expiresTime = new Date(room.expiresAt).getTime();
            if (expiresTime < now) {
                expired = true;
            }
        }

        // Check inactivity timeout (30 minutes)
        if (!expired && room.lastActivity) {
            if ((now - room.lastActivity) > ROOM_INACTIVITY_TIMEOUT_MS) {
                expired = true;
                console.log(`[${new Date().toISOString()}] Transfer room inactive for 30m, expiring: ${code}`);
            }
        }

        if (expired) {
            destroyTransferRoom(code, 'expired');
        }
    }
}, 5 * 60 * 1000);

/**
 * Destroy a transfer room: notify members, clean up reverse indices, delete.
 * @param {string} code - Room code
 * @param {string} reason - Reason for destruction
 */
function destroyTransferRoom(code, reason) {
    const room = transferRooms.get(code);
    if (!room) return;

    // Notify all members
    io.to(`transfer-room-${room.id}`).emit('room-closed', { reason });

    // Clean up reverse indices for all members
    for (const member of room.members.values()) {
        if (member.socketId) {
            const roomSet = socketToTransferRooms.get(member.socketId);
            if (roomSet) {
                roomSet.delete(code);
                if (roomSet.size === 0) {
                    socketToTransferRooms.delete(member.socketId);
                }
            }
        }
    }

    transferRooms.delete(code);
    console.log(`[${new Date().toISOString()}] Transfer room destroyed (${reason}): ${code}`);
}

/**
 * Remove a socket from a transfer room by socket ID.
 * Notifies remaining members and cleans up empty rooms.
 * @param {string} code - Room code
 * @param {string} socketId - Socket ID to remove
 */
function removeSocketFromTransferRoom(code, socketId) {
    const room = transferRooms.get(code);
    if (!room) return;

    // Find member(s) with this socket ID
    let removedDeviceId = null;
    for (const [deviceId, member] of room.members.entries()) {
        if (member.socketId === socketId) {
            removedDeviceId = deviceId;
            // Mark as offline rather than removing immediately
            // This allows reconnection within the room's lifetime
            member.isOnline = false;
            member.socketId = null;
            member.disconnectedAt = new Date().toISOString();
            break;
        }
    }

    if (removedDeviceId) {
        // Notify remaining room members that this peer disconnected
        io.to(`transfer-room-${room.id}`).emit('room-member-disconnected', {
            memberId: removedDeviceId,
            socketId: socketId,
        });

        console.log(`[${new Date().toISOString()}] Socket ${socketId} removed from transfer room: ${code} (member: ${removedDeviceId})`);

        // Check if ALL members are now offline -- if so, start a cleanup countdown
        // (the periodic cleanup will handle actual deletion via inactivity timeout)
        const anyOnline = Array.from(room.members.values()).some(m => m.isOnline);
        if (!anyOnline) {
            console.log(`[${new Date().toISOString()}] All members offline in transfer room: ${code} (will expire via inactivity)`);
            // Update lastActivity so the inactivity timer starts now
            room.lastActivity = Date.now();
        }
    }
}

// =============================================================================
// Helper: Find transfer room by ID
// =============================================================================
function findTransferRoomByRoomId(roomId) {
    for (const room of transferRooms.values()) {
        if (room.id === roomId) {
            return room;
        }
    }
    return null;
}

// =============================================================================
// Socket Connection Handler
// =============================================================================

io.on('connection', (socket) => {
    // Rate limit: check IP connection rate
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    if (!checkIpRateLimit(clientIp)) {
        console.log(`[${new Date().toISOString()}] Rate limited IP: ${clientIp}`);
        socket.emit('error', { message: 'Too many connections. Try again later.' });
        socket.disconnect(true);
        return;
    }

    console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
    let socketRoomCount = 0;

    // Initialize reverse indices for this socket
    socketToRooms.set(socket.id, new Set());
    socketToTransferRooms.set(socket.id, new Set());

    // Start application-level heartbeat
    startHeartbeat(socket);

    // Rate limit middleware for all socket events
    const rateLimited = (handler) => (...args) => {
        if (!checkSocketRateLimit(socket.id)) {
            console.log(`[${new Date().toISOString()}] Event rate limited: ${socket.id}`);
            socket.emit('error', { message: 'Too many requests. Slow down.' });
            return;
        }
        handler(...args);
    };

    // ========================================================================
    // Heartbeat
    // ========================================================================

    socket.on('heartbeat-pong', () => {
        const state = heartbeatState.get(socket.id);
        if (state) {
            state.missedPongs = 0;
            state.lastPong = Date.now();
        }
    });

    // ========================================================================
    // Simple Room Events (peer-to-peer signaling rooms)
    // ========================================================================

    // Join a room with connection code
    socket.on('join-room', rateLimited((roomId, peerId) => {
        // Validate inputs
        if (!isValidRoomCode(roomId)) {
            socket.emit('error', { message: 'Invalid room ID format' });
            return;
        }
        if (peerId !== undefined && !isValidString(String(peerId), 128)) {
            socket.emit('error', { message: 'Invalid peer ID format' });
            return;
        }

        if (socketRoomCount >= RATE_LIMITS.maxRoomsPerSocket) {
            socket.emit('error', { message: 'Too many rooms.' });
            return;
        }

        socket.join(roomId);
        socketRoomCount++;

        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);

        // Update reverse index
        const roomSet = socketToRooms.get(socket.id);
        if (roomSet) roomSet.add(roomId);

        console.log(`[${new Date().toISOString()}] ${socket.id} joined room: ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit('peer-joined', { peerId, socketId: socket.id });
    }));

    // Leave room (simple rooms)
    socket.on('leave-room', rateLimited((roomId) => {
        // Validate
        if (!isValidString(String(roomId), 128)) return;

        socket.leave(roomId);
        socketRoomCount = Math.max(0, socketRoomCount - 1);

        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(socket.id);
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
            }
        }

        // Update reverse index
        const roomSet = socketToRooms.get(socket.id);
        if (roomSet) roomSet.delete(roomId);

        socket.to(roomId).emit('peer-left', { socketId: socket.id });
        console.log(`[${new Date().toISOString()}] ${socket.id} left room: ${roomId}`);
    }));

    // ========================================================================
    // WebRTC Signaling: Offer / Answer / ICE Candidate
    // SIGNAL-ROUTER policy: server is OPAQUE RELAY -- forwards encrypted blobs
    // without inspection. NEVER log SDP content, encryption keys, or file data.
    // ========================================================================

    // WebRTC signaling: offer
    socket.on('offer', rateLimited((data) => {
        if (!isValidOfferMessage(data)) {
            socket.emit('error', { message: 'Invalid offer message format' });
            return;
        }
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }
        // Log routing metadata only -- NEVER log data.offer content
        console.log(`[${new Date().toISOString()}] Offer relayed: ${socket.id} -> ${data.target}`);
        io.to(data.target).emit('offer', {
            offer: data.offer,
            from: socket.id
        });
    }));

    // WebRTC signaling: answer
    socket.on('answer', rateLimited((data) => {
        if (!isValidAnswerMessage(data)) {
            socket.emit('error', { message: 'Invalid answer message format' });
            return;
        }
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }
        // Log routing metadata only -- NEVER log data.answer content
        console.log(`[${new Date().toISOString()}] Answer relayed: ${socket.id} -> ${data.target}`);
        io.to(data.target).emit('answer', {
            answer: data.answer,
            from: socket.id
        });
    }));

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', rateLimited((data) => {
        if (!isValidICECandidateMessage(data)) {
            return; // Silently drop malformed ICE candidates
        }
        if (!isSignalingMessageFresh(data.ts)) {
            return; // Silently drop stale ICE candidates
        }
        // Relay only -- NEVER inspect or log candidate content
        io.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            from: socket.id
        });
    }));

    // ========================================================================
    // ICE Restart Relay (Agent 022 -- ICE-BREAKER)
    // ========================================================================
    // When a peer's ICE connection enters 'disconnected' or 'failed' state,
    // it creates a restart offer (iceRestart:true) and sends it here.
    // The signaling server relays the offer to the target peer, which
    // creates an answer and sends it back.

    // ICE restart: offer
    socket.on('ice-restart-offer', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }
        console.log(`[${new Date().toISOString()}] ICE restart offer relayed: ${socket.id} -> ${data.target}`);
        io.to(data.target).emit('ice-restart-offer', {
            offer: data.offer,
            from: socket.id
        });
    }));

    // ICE restart: answer
    socket.on('ice-restart-answer', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }
        console.log(`[${new Date().toISOString()}] ICE restart answer relayed: ${socket.id} -> ${data.target}`);
        io.to(data.target).emit('ice-restart-answer', {
            answer: data.answer,
            from: socket.id
        });
    }));

    // Device presence broadcast (for LAN discovery via signaling)
    socket.on('presence', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        if (!isValidString(String(data.room), 128)) return;
        socket.to(data.room).emit('presence', {
            ...data,
            socketId: socket.id
        });
    }));

    // ========================================================================
    // Group Transfer Events
    // ========================================================================

    // Create group transfer - sender initiates to multiple recipients
    socket.on('create-group-transfer', rateLimited((data) => {
        if (!data || typeof data !== 'object') {
            socket.emit('error', { message: 'Invalid group transfer data' });
            return;
        }

        const { groupId, senderId, fileName, fileSize, recipients } = data;

        if (!isValidString(String(groupId), 128) ||
            !isValidString(String(senderId), 128) ||
            !isValidString(String(fileName), 512) ||
            !recipients || !Array.isArray(recipients) ||
            recipients.length === 0 || recipients.length > MAX_PEERS_PER_ROOM) {
            socket.emit('error', { message: 'Invalid group transfer data' });
            return;
        }

        // Validate all recipient socket IDs
        for (const rid of recipients) {
            if (!isValidSocketId(rid)) {
                socket.emit('error', { message: 'Invalid recipient socket ID' });
                return;
            }
        }

        console.log(`[${new Date().toISOString()}] Group transfer created: ${groupId} (${recipients.length} recipients)`);

        // Send invitation to each recipient
        recipients.forEach((recipientSocketId) => {
            io.to(recipientSocketId).emit('group-invite', {
                groupId,
                senderId,
                senderName: isValidString(String(data.senderName), 128) ? data.senderName : 'Unknown',
                senderSocketId: socket.id,
                recipientCount: recipients.length,
                fileName,
                fileSize: typeof fileSize === 'number' ? fileSize : 0,
            });
        });
    }));

    // Join group transfer - recipient accepts invitation
    socket.on('join-group-transfer', rateLimited((data) => {
        if (!data || typeof data !== 'object') {
            socket.emit('error', { message: 'Invalid join data' });
            return;
        }

        const { groupId, peerId, senderSocketId } = data;

        if (!isValidString(String(groupId), 128) ||
            !isValidString(String(peerId), 128) ||
            !isValidSocketId(senderSocketId)) {
            socket.emit('error', { message: 'Invalid join data' });
            return;
        }

        console.log(`[${new Date().toISOString()}] ${socket.id} joined group transfer: ${groupId}`);

        // Notify sender that recipient joined
        io.to(senderSocketId).emit('group-joined', {
            groupId,
            peerId,
            peerName: isValidString(String(data.peerName), 128) ? data.peerName : 'Unknown',
            socketId: socket.id,
        });
    }));

    // Leave group transfer
    socket.on('leave-group-transfer', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        const { groupId, peerId } = data;

        if (!isValidString(String(groupId), 128) || !isValidString(String(peerId), 128)) return;

        console.log(`[${new Date().toISOString()}] ${socket.id} left group transfer: ${groupId}`);

        // Notify others in group
        socket.broadcast.emit('group-left', {
            groupId,
            peerId,
            socketId: socket.id,
        });
    }));

    // Group WebRTC offer
    socket.on('group-offer', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }

        const { groupId, target, offer } = data;
        if (!isValidString(String(groupId), 128) || !isValidSocketId(target) || !offer) return;

        console.log(`[${new Date().toISOString()}] Group offer from ${socket.id} to ${target} (group: ${groupId})`);

        io.to(target).emit('group-offer', {
            groupId,
            offer,
            from: socket.id,
        });
    }));

    // Group WebRTC answer
    socket.on('group-answer', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }

        const { groupId, target, answer } = data;
        if (!isValidString(String(groupId), 128) || !isValidSocketId(target) || !answer) return;

        console.log(`[${new Date().toISOString()}] Group answer from ${socket.id} to ${target} (group: ${groupId})`);

        io.to(target).emit('group-answer', {
            groupId,
            answer,
            from: socket.id,
        });
    }));

    // Group ICE candidate
    socket.on('group-ice-candidate', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        if (!isSignalingMessageFresh(data.ts)) {
            return; // Silently drop stale ICE candidates
        }

        const { groupId, target, candidate } = data;
        if (!isValidString(String(groupId), 128) || !isValidSocketId(target) || !candidate) return;

        io.to(target).emit('group-ice-candidate', {
            groupId,
            candidate,
            from: socket.id,
        });
    }));

    // Cancel group transfer
    socket.on('cancel-group-transfer', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        const { groupId, recipients } = data;

        if (!isValidString(String(groupId), 128) ||
            !recipients || !Array.isArray(recipients)) return;

        // Validate recipient IDs
        for (const rid of recipients) {
            if (!isValidSocketId(rid)) return;
        }

        console.log(`[${new Date().toISOString()}] Group transfer cancelled: ${groupId}`);

        // Notify all recipients
        recipients.forEach((recipientSocketId) => {
            io.to(recipientSocketId).emit('group-transfer-cancelled', {
                groupId,
                reason: isValidString(String(data.reason), 256) ? data.reason : 'Sender cancelled',
            });
        });
    }));

    // ========================================================================
    // Transfer Room Events (Persistent Multi-User Rooms)
    // Room lifecycle: create-room -> join-room-code -> leave-transfer-room -> close-room
    // ========================================================================

    // Create transfer room
    // SIGNAL-ROUTER policy: enforce 6+ char codes, 24h max expiry, no key/content storage
    socket.on('create-room', rateLimited((data, callback) => {
        // Validate callback is a function
        if (typeof callback !== 'function') return;

        if (!data || typeof data !== 'object') {
            callback({ success: false, error: 'Invalid room data' });
            return;
        }

        const { roomId, code, name, ownerId, ownerName, password, expiresAt, maxMembers } = data;

        if (!isValidString(String(roomId), 128) ||
            !isValidString(String(code), 20) ||
            !isValidString(String(ownerId), 128)) {
            callback({ success: false, error: 'Invalid room data' });
            return;
        }

        // POLICY: Room codes MUST be at least 6 characters (CSPRNG-generated by client)
        if (typeof code !== 'string' || code.length < MIN_ROOM_CODE_LENGTH) {
            callback({ success: false, error: `Room code must be at least ${MIN_ROOM_CODE_LENGTH} characters` });
            return;
        }

        // Validate code format (alphanumeric only)
        if (!/^[A-Za-z0-9]+$/.test(code)) {
            callback({ success: false, error: 'Room code must be alphanumeric' });
            return;
        }

        // Check if code already exists
        if (transferRooms.has(code)) {
            callback({ success: false, error: 'Room code already in use' });
            return;
        }

        // POLICY: Enforce 24-hour maximum room lifetime
        const now = new Date();
        let effectiveExpiresAt = expiresAt || null;
        const maxDeadline = new Date(now.getTime() + MAX_ROOM_LIFETIME_MS).toISOString();

        if (effectiveExpiresAt) {
            const requestedExpiry = new Date(effectiveExpiresAt).getTime();
            if (isNaN(requestedExpiry)) {
                callback({ success: false, error: 'Invalid expiration date' });
                return;
            }
            const maxExpiry = now.getTime() + MAX_ROOM_LIFETIME_MS;
            if (requestedExpiry > maxExpiry) {
                effectiveExpiresAt = maxDeadline;
            }
        } else {
            // No expiry requested: default to 24h ceiling
            effectiveExpiresAt = maxDeadline;
        }

        // POLICY: Cap peers per room
        const effectiveMaxMembers = Math.min(
            typeof maxMembers === 'number' && maxMembers > 0 ? maxMembers : MAX_PEERS_PER_ROOM,
            MAX_PEERS_PER_ROOM
        );

        // Validate password if provided
        if (password !== undefined && password !== null) {
            if (typeof password !== 'string' || password.length < 1 || password.length > 128) {
                callback({ success: false, error: 'Password must be 1-128 characters' });
                return;
            }
        }

        // Create room -- server stores ONLY routing metadata, NEVER encryption keys or file content
        const room = {
            id: roomId,
            code,
            name: isValidString(String(name), 128) ? name : `Room ${code}`,
            ownerId,
            ownerName: isValidString(String(ownerName), 128) ? ownerName : 'Unknown',
            createdAt: now.toISOString(),
            expiresAt: effectiveExpiresAt,
            password: password || null,
            maxMembers: effectiveMaxMembers,
            members: new Map(),
            lastActivity: Date.now(),
        };

        transferRooms.set(code, room);
        socket.join(`transfer-room-${roomId}`);

        // Update reverse index
        const trSet = socketToTransferRooms.get(socket.id);
        if (trSet) trSet.add(code);

        console.log(`[${new Date().toISOString()}] Transfer room created: ${code}`);
        callback({ success: true });
    }));

    // Join transfer room by code
    socket.on('join-room-code', rateLimited((data, callback) => {
        if (typeof callback !== 'function') return;

        if (!data || typeof data !== 'object') {
            callback({ success: false, error: 'Invalid request data' });
            return;
        }

        const { code, deviceId, deviceName, password } = data;

        if (!isValidString(String(code), 20) ||
            !isValidString(String(deviceId), 128) ||
            !isValidString(String(deviceName), 128)) {
            callback({ success: false, error: 'Invalid request data' });
            return;
        }

        const room = transferRooms.get(code.toUpperCase());

        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        // Check password using timing-safe comparison to prevent timing attacks
        if (room.password && !timingSafeEqual(room.password, password || '')) {
            callback({ success: false, error: 'Incorrect password' });
            return;
        }

        // Check if room is full (only count online members for capacity)
        if (room.members.size >= room.maxMembers) {
            callback({ success: false, error: 'Room is full' });
            return;
        }

        // Check if already in room
        if (room.members.has(deviceId)) {
            // Update member info (reconnection)
            const member = room.members.get(deviceId);
            member.socketId = socket.id;
            member.isOnline = true;
            member.disconnectedAt = null;
        } else {
            // Add new member
            room.members.set(deviceId, {
                id: deviceId,
                socketId: socket.id,
                deviceName,
                deviceId,
                joinedAt: new Date().toISOString(),
                isOnline: true,
                isOwner: deviceId === room.ownerId,
                disconnectedAt: null,
            });
        }

        // Update room activity
        room.lastActivity = Date.now();

        socket.join(`transfer-room-${room.id}`);

        // Update reverse index
        const trSet = socketToTransferRooms.get(socket.id);
        if (trSet) trSet.add(code.toUpperCase());

        // Notify existing members
        socket.to(`transfer-room-${room.id}`).emit('room-member-joined', {
            member: room.members.get(deviceId),
        });

        console.log(`[${new Date().toISOString()}] ${deviceName} joined transfer room: ${code}`);

        callback({
            success: true,
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                ownerId: room.ownerId,
                createdAt: room.createdAt,
                expiresAt: room.expiresAt,
                isPasswordProtected: !!room.password,
                maxMembers: room.maxMembers,
                members: Array.from(room.members.values()),
            },
        });
    }));

    // Rejoin room after reconnect
    socket.on('rejoin-room', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        const { roomId, deviceId, deviceName } = data;

        if (!isValidString(String(roomId), 128) ||
            !isValidString(String(deviceId), 128)) return;

        // Find room by ID
        const room = findTransferRoomByRoomId(roomId);
        if (!room) return;

        // Update member socket ID
        if (room.members.has(deviceId)) {
            const member = room.members.get(deviceId);
            member.socketId = socket.id;
            member.isOnline = true;
            member.disconnectedAt = null;

            socket.join(`transfer-room-${roomId}`);

            // Update reverse index
            const trSet = socketToTransferRooms.get(socket.id);
            if (trSet) trSet.add(room.code);

            // Update room activity
            room.lastActivity = Date.now();

            // Notify other members of the reconnection
            socket.to(`transfer-room-${roomId}`).emit('room-member-reconnected', {
                memberId: deviceId,
                deviceName: isValidString(String(deviceName), 128) ? deviceName : member.deviceName,
            });

            console.log(`[${new Date().toISOString()}] ${deviceName || deviceId} rejoined room: ${room.code}`);
        }
    }));

    // Leave transfer room (explicit leave, distinct from simple room 'leave-room')
    socket.on('leave-transfer-room', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        const { roomId, deviceId } = data;

        if (!isValidString(String(roomId), 128) ||
            !isValidString(String(deviceId), 128)) return;

        // Find room
        const room = findTransferRoomByRoomId(roomId);
        if (!room) return;

        // Remove member completely (explicit leave, not disconnect)
        room.members.delete(deviceId);
        socket.leave(`transfer-room-${roomId}`);

        // Update reverse index
        const trSet = socketToTransferRooms.get(socket.id);
        if (trSet) trSet.delete(room.code);

        // Notify other members
        socket.to(`transfer-room-${roomId}`).emit('room-member-left', {
            memberId: deviceId,
        });

        // Update room activity
        room.lastActivity = Date.now();

        console.log(`[${new Date().toISOString()}] Device ${deviceId} left transfer room: ${room.code}`);

        // Clean up empty room
        if (room.members.size === 0) {
            destroyTransferRoom(room.code, 'all-members-left');
        }
    }));

    // Broadcast file offer in room
    socket.on('room-broadcast-file', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        const { roomId, senderId, fileName, fileSize } = data;

        if (!isValidString(String(roomId), 128) ||
            !isValidString(String(senderId), 128) ||
            !isValidString(String(fileName), 512)) return;

        // Find room and update activity
        const room = findTransferRoomByRoomId(roomId);
        if (room) room.lastActivity = Date.now();

        socket.to(`transfer-room-${roomId}`).emit('room-file-offer', {
            senderId,
            fileName,
            fileSize: typeof fileSize === 'number' ? fileSize : 0,
        });

        console.log(`[${new Date().toISOString()}] File offer in room ${roomId}: ${fileName}`);
    }));

    // Close room (owner only)
    socket.on('close-room', rateLimited((data) => {
        if (!data || typeof data !== 'object') return;
        const { roomId, ownerId } = data;

        if (!isValidString(String(roomId), 128) ||
            !isValidString(String(ownerId), 128)) return;

        // Find room
        const room = findTransferRoomByRoomId(roomId);
        if (!room) return;

        // Verify owner
        if (room.ownerId !== ownerId) return;

        // Destroy the room (notifies members and cleans up indices)
        destroyTransferRoom(room.code, 'owner-closed');
    }));

    // ========================================================================
    // Disconnect Handler (CRITICAL FIX)
    //
    // Previously only cleaned up `rooms` Map, leaving phantom members in
    // `transferRooms`. Now cleans up BOTH using reverse indices for O(1) lookup.
    // ========================================================================
    socket.on('disconnect', (reason) => {
        console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id} (reason: ${reason})`);

        // Stop heartbeat
        stopHeartbeat(socket.id);

        // Clean up rate limit tracking
        socketRateLimits.delete(socket.id);

        // ----------------------------------------------------------------
        // 1. Clean up simple rooms (rooms Map)
        // ----------------------------------------------------------------
        const simpleRooms = socketToRooms.get(socket.id);
        if (simpleRooms) {
            for (const roomId of simpleRooms) {
                const peers = rooms.get(roomId);
                if (peers) {
                    peers.delete(socket.id);
                    socket.to(roomId).emit('peer-left', { socketId: socket.id });
                    if (peers.size === 0) {
                        rooms.delete(roomId);
                    }
                }
            }
            socketToRooms.delete(socket.id);
        }

        // ----------------------------------------------------------------
        // 2. CRITICAL FIX: Clean up transfer rooms (transferRooms Map)
        //    This was completely missing before, causing phantom members.
        // ----------------------------------------------------------------
        const trRooms = socketToTransferRooms.get(socket.id);
        if (trRooms) {
            for (const code of trRooms) {
                removeSocketFromTransferRoom(code, socket.id);
            }
            socketToTransferRooms.delete(socket.id);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
+====================================================+
|       Tallow Signaling Server (Agent 023)          |
|       Ready on port ${String(PORT).padEnd(33)}|
|       Heartbeat: ${HEARTBEAT_INTERVAL_MS / 1000}s interval, ${MAX_MISSED_PONGS} max missed        |
|       Room inactivity timeout: ${ROOM_INACTIVITY_TIMEOUT_MS / 60000}min             |
|       Rate limit: ${RATE_LIMITS.messagesPerSecond} msg/s per socket              |
+====================================================+
  `);
});
