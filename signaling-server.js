// Tallow Signaling Server
// WebSocket server for P2P connection signaling
const { Server } = require('socket.io');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.SIGNALING_PORT || 3001;

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
// Rate Limiting
// =============================================================================

const RATE_LIMITS = {
    connectionsPerIpPerMinute: 10,
    eventsPerSocketPerWindow: 50,
    eventWindowMs: 10000, // 10 seconds
    maxRoomsPerSocket: 5,
};

// Track connection attempts per IP
const ipConnections = new Map(); // ip -> { count, resetTime }

// Track event rates per socket
const socketEvents = new Map(); // socketId -> { count, resetTime }

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
    const entry = socketEvents.get(socketId);

    if (!entry || now > entry.resetTime) {
        socketEvents.set(socketId, { count: 1, resetTime: now + RATE_LIMITS.eventWindowMs });
        return true;
    }

    entry.count++;
    if (entry.count > RATE_LIMITS.eventsPerSocketPerWindow) {
        return false;
    }
    return true;
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipConnections.entries()) {
        if (now > entry.resetTime) ipConnections.delete(ip);
    }
    for (const [id, entry] of socketEvents.entries()) {
        if (now > entry.resetTime) socketEvents.delete(id);
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
        res.end(JSON.stringify({ status: 'ok', service: 'tallow-signaling' }));
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
    pingTimeout: 60000,
    pingInterval: 25000
});

// Room management
const rooms = new Map();

// Transfer room management (persistent rooms with metadata)
const transferRooms = new Map(); // code -> { id, code, name, ownerId, members: Map(deviceId -> member) }

// Clean up expired transfer rooms every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of transferRooms.entries()) {
        if (room.expiresAt) {
            const expiresTime = new Date(room.expiresAt).getTime();
            if (expiresTime < now) {
                // Notify all members
                io.to(`transfer-room-${room.id}`).emit('room-closed');
                transferRooms.delete(code);
                console.log(`[${new Date().toISOString()}] Expired transfer room deleted: ${code}`);
            }
        }
    }
}, 5 * 60 * 1000);

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

    // Rate limit middleware for all socket events
    const rateLimited = (handler) => (...args) => {
        if (!checkSocketRateLimit(socket.id)) {
            console.log(`[${new Date().toISOString()}] Event rate limited: ${socket.id}`);
            socket.emit('error', { message: 'Too many requests. Slow down.' });
            return;
        }
        handler(...args);
    };

    // Join a room with connection code
    socket.on('join-room', rateLimited((roomId, peerId) => {
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

        console.log(`[${new Date().toISOString()}] ${socket.id} joined room: ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit('peer-joined', { peerId, socketId: socket.id });
    }));

    // WebRTC signaling: offer
    socket.on('offer', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }
        console.log(`[${new Date().toISOString()}] Offer from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('offer', {
            offer: data.offer,
            from: socket.id
        });
    }));

    // WebRTC signaling: answer
    socket.on('answer', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }
        console.log(`[${new Date().toISOString()}] Answer from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('answer', {
            answer: data.answer,
            from: socket.id
        });
    }));

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            return; // Silently drop stale ICE candidates
        }
        io.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            from: socket.id
        });
    }));

    // Device presence broadcast (for LAN discovery via signaling)
    socket.on('presence', rateLimited((data) => {
        if (!data.room) return;
        socket.to(data.room).emit('presence', {
            ...data,
            socketId: socket.id
        });
    }));

    // Leave room
    socket.on('leave-room', rateLimited((roomId) => {
        socket.leave(roomId);
        socketRoomCount = Math.max(0, socketRoomCount - 1);
        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(socket.id);
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
            }
        }
        socket.to(roomId).emit('peer-left', { socketId: socket.id });
        console.log(`[${new Date().toISOString()}] ${socket.id} left room: ${roomId}`);
    }));

    // ========================================================================
    // Group Transfer Events
    // ========================================================================

    // Create group transfer - sender initiates to multiple recipients
    socket.on('create-group-transfer', rateLimited((data) => {
        const { groupId, senderId, fileName, fileSize, recipients } = data;

        if (!groupId || !senderId || !fileName || !recipients || !Array.isArray(recipients)) {
            socket.emit('error', { message: 'Invalid group transfer data' });
            return;
        }

        console.log(`[${new Date().toISOString()}] Group transfer created: ${groupId} (${recipients.length} recipients)`);

        // Send invitation to each recipient
        recipients.forEach((recipientSocketId) => {
            io.to(recipientSocketId).emit('group-invite', {
                groupId,
                senderId,
                senderName: data.senderName || 'Unknown',
                senderSocketId: socket.id,
                recipientCount: recipients.length,
                fileName,
                fileSize,
            });
        });
    }));

    // Join group transfer - recipient accepts invitation
    socket.on('join-group-transfer', rateLimited((data) => {
        const { groupId, peerId, senderSocketId } = data;

        if (!groupId || !peerId || !senderSocketId) {
            socket.emit('error', { message: 'Invalid join data' });
            return;
        }

        console.log(`[${new Date().toISOString()}] ${socket.id} joined group transfer: ${groupId}`);

        // Notify sender that recipient joined
        io.to(senderSocketId).emit('group-joined', {
            groupId,
            peerId,
            peerName: data.peerName || 'Unknown',
            socketId: socket.id,
        });
    }));

    // Leave group transfer
    socket.on('leave-group-transfer', rateLimited((data) => {
        const { groupId, peerId } = data;

        if (!groupId || !peerId) return;

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
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }

        const { groupId, target, offer } = data;
        if (!groupId || !target || !offer) return;

        console.log(`[${new Date().toISOString()}] Group offer from ${socket.id} to ${target} (group: ${groupId})`);

        io.to(target).emit('group-offer', {
            groupId,
            offer,
            from: socket.id,
        });
    }));

    // Group WebRTC answer
    socket.on('group-answer', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            socket.emit('error', { message: 'Signaling message expired (replay rejected)' });
            return;
        }

        const { groupId, target, answer } = data;
        if (!groupId || !target || !answer) return;

        console.log(`[${new Date().toISOString()}] Group answer from ${socket.id} to ${target} (group: ${groupId})`);

        io.to(target).emit('group-answer', {
            groupId,
            answer,
            from: socket.id,
        });
    }));

    // Group ICE candidate
    socket.on('group-ice-candidate', rateLimited((data) => {
        if (!isSignalingMessageFresh(data.ts)) {
            return; // Silently drop stale ICE candidates
        }

        const { groupId, target, candidate } = data;
        if (!groupId || !target || !candidate) return;

        io.to(target).emit('group-ice-candidate', {
            groupId,
            candidate,
            from: socket.id,
        });
    }));

    // Cancel group transfer
    socket.on('cancel-group-transfer', rateLimited((data) => {
        const { groupId, recipients } = data;

        if (!groupId || !recipients || !Array.isArray(recipients)) return;

        console.log(`[${new Date().toISOString()}] Group transfer cancelled: ${groupId}`);

        // Notify all recipients
        recipients.forEach((recipientSocketId) => {
            io.to(recipientSocketId).emit('group-transfer-cancelled', {
                groupId,
                reason: data.reason || 'Sender cancelled',
            });
        });
    }));

    // ========================================================================
    // Transfer Room Events (Persistent Multi-User Rooms)
    // ========================================================================

    // Create transfer room
    socket.on('create-room', rateLimited((data, callback) => {
        const { roomId, code, name, ownerId, ownerName, password, expiresAt, maxMembers } = data;

        if (!roomId || !code || !ownerId) {
            callback({ success: false, error: 'Invalid room data' });
            return;
        }

        // Check if code already exists
        if (transferRooms.has(code)) {
            callback({ success: false, error: 'Room code already in use' });
            return;
        }

        // Create room
        const room = {
            id: roomId,
            code,
            name: name || `Room ${code}`,
            ownerId,
            ownerName,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt || null,
            password,
            maxMembers: maxMembers || 10,
            members: new Map(),
        };

        transferRooms.set(code, room);
        socket.join(`transfer-room-${roomId}`);

        console.log(`[${new Date().toISOString()}] Transfer room created: ${code}`);
        callback({ success: true });
    }));

    // Join transfer room by code
    socket.on('join-room-code', rateLimited((data, callback) => {
        const { code, deviceId, deviceName, password } = data;

        if (!code || !deviceId || !deviceName) {
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

        // Check if room is full
        if (room.members.size >= room.maxMembers) {
            callback({ success: false, error: 'Room is full' });
            return;
        }

        // Check if already in room
        if (room.members.has(deviceId)) {
            // Update member info
            room.members.get(deviceId).socketId = socket.id;
            room.members.get(deviceId).isOnline = true;
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
            });
        }

        socket.join(`transfer-room-${room.id}`);

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
        const { roomId, deviceId, deviceName } = data;

        // Find room by ID
        let room = null;
        for (const r of transferRooms.values()) {
            if (r.id === roomId) {
                room = r;
                break;
            }
        }

        if (!room) return;

        // Update member socket ID
        if (room.members.has(deviceId)) {
            room.members.get(deviceId).socketId = socket.id;
            room.members.get(deviceId).isOnline = true;
            socket.join(`transfer-room-${roomId}`);
            console.log(`[${new Date().toISOString()}] ${deviceName} rejoined room: ${room.code}`);
        }
    }));

    // Leave transfer room
    socket.on('leave-room', rateLimited((data) => {
        const { roomId, deviceId } = data;

        // Find room
        let room = null;
        for (const r of transferRooms.values()) {
            if (r.id === roomId) {
                room = r;
                break;
            }
        }

        if (!room) return;

        // Remove member
        room.members.delete(deviceId);
        socket.leave(`transfer-room-${roomId}`);

        // Notify other members
        socket.to(`transfer-room-${roomId}`).emit('room-member-left', {
            memberId: deviceId,
        });

        console.log(`[${new Date().toISOString()}] Device ${deviceId} left transfer room: ${room.code}`);

        // Clean up empty room
        if (room.members.size === 0) {
            transferRooms.delete(room.code);
            console.log(`[${new Date().toISOString()}] Empty transfer room deleted: ${room.code}`);
        }
    }));

    // Broadcast file offer in room
    socket.on('room-broadcast-file', rateLimited((data) => {
        const { roomId, senderId, fileName, fileSize } = data;

        socket.to(`transfer-room-${roomId}`).emit('room-file-offer', {
            senderId,
            fileName,
            fileSize,
        });

        console.log(`[${new Date().toISOString()}] File offer in room ${roomId}: ${fileName}`);
    }));

    // Close room (owner only)
    socket.on('close-room', rateLimited((data) => {
        const { roomId, ownerId } = data;

        // Find room
        let room = null;
        for (const r of transferRooms.values()) {
            if (r.id === roomId) {
                room = r;
                break;
            }
        }

        if (!room) return;

        // Verify owner
        if (room.ownerId !== ownerId) return;

        // Notify all members
        io.to(`transfer-room-${roomId}`).emit('room-closed');

        // Delete room
        transferRooms.delete(room.code);

        console.log(`[${new Date().toISOString()}] Transfer room closed by owner: ${room.code}`);
    }));

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);

        // Clean up rate limit tracking
        socketEvents.delete(socket.id);

        // Clean up rooms
        for (const [roomId, peers] of rooms.entries()) {
            if (peers.has(socket.id)) {
                peers.delete(socket.id);
                socket.to(roomId).emit('peer-left', { socketId: socket.id });
                if (peers.size === 0) {
                    rooms.delete(roomId);
                }
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║       Tallow Signaling Server                      ║
║       Ready on port ${PORT}                            ║
╚════════════════════════════════════════════════════╝
  `);
});
