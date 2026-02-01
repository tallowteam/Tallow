# WebSocket Signaling API

This document describes the WebSocket-based signaling protocol used for establishing P2P connections between Tallow clients.

## Overview

The signaling server facilitates peer discovery and WebRTC connection establishment. It does not relay file data - all transfers happen directly peer-to-peer.

## Connection

### Endpoint

```
Production: wss://tallow.manisahome.com/signaling
Development: ws://localhost:3001
```

### Connection Example

```javascript
import { io } from 'socket.io-client';

const socket = io('wss://tallow.manisahome.com', {
  path: '/signaling',
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

## Authentication

The signaling server uses implicit authentication:
- Each client has a unique device ID (generated on first use)
- Room ownership is verified by owner ID
- No username/password required

## Events

### Client → Server

#### `join-room`

Join a transfer room.

```typescript
interface JoinRoomPayload {
  roomCode: string;      // Room code (4-8 alphanumeric)
  peerId: string;        // Unique peer identifier
  peerName?: string;     // Display name (optional)
  password?: string;     // Room password (if required)
}

socket.emit('join-room', {
  roomCode: 'ABCD1234',
  peerId: 'peer-uuid-123',
  peerName: 'John',
});
```

**Response Events:**
- `room-joined` - Successfully joined
- `room-error` - Error (invalid code, wrong password, room full)

#### `leave-room`

Leave the current room.

```typescript
interface LeaveRoomPayload {
  roomCode: string;
  peerId: string;
}

socket.emit('leave-room', {
  roomCode: 'ABCD1234',
  peerId: 'peer-uuid-123',
});
```

#### `signal`

Send WebRTC signaling data to a peer.

```typescript
interface SignalPayload {
  roomCode: string;
  targetPeerId: string;  // Recipient peer ID
  senderId: string;      // Sender peer ID
  signal: RTCSignalData; // WebRTC offer/answer/ICE candidate
  timestamp: number;     // Message timestamp for replay protection
}

socket.emit('signal', {
  roomCode: 'ABCD1234',
  targetPeerId: 'peer-uuid-456',
  senderId: 'peer-uuid-123',
  signal: {
    type: 'offer',
    sdp: '...',
  },
  timestamp: Date.now(),
});
```

#### `create-room`

Create a new transfer room.

```typescript
interface CreateRoomPayload {
  roomCode: string;
  ownerId: string;
  ownerName: string;
  password?: string;     // Optional password
  maxMembers?: number;   // Default: 10
  expiresAt?: number;    // Unix timestamp (max 7 days)
}

socket.emit('create-room', {
  roomCode: 'NEWROOM1',
  ownerId: 'owner-uuid',
  ownerName: 'Alice',
  maxMembers: 5,
});
```

#### `delete-room`

Delete a room (owner only).

```typescript
socket.emit('delete-room', {
  roomCode: 'ABCD1234',
  ownerId: 'owner-uuid',
});
```

### Server → Client

#### `room-joined`

Successfully joined a room.

```typescript
interface RoomJoinedPayload {
  roomCode: string;
  peers: PeerInfo[];     // Existing peers in room
  isOwner: boolean;
  roomInfo: RoomInfo;
}

interface PeerInfo {
  peerId: string;
  peerName?: string;
  joinedAt: number;
}

socket.on('room-joined', (data) => {
  console.log(`Joined room ${data.roomCode}`);
  console.log(`${data.peers.length} other peers in room`);
});
```

#### `peer-joined`

A new peer joined the room.

```typescript
socket.on('peer-joined', (data: PeerInfo) => {
  console.log(`${data.peerName || data.peerId} joined`);
});
```

#### `peer-left`

A peer left the room.

```typescript
socket.on('peer-left', (data: { peerId: string }) => {
  console.log(`Peer ${data.peerId} left`);
});
```

#### `signal`

Received signaling data from another peer.

```typescript
socket.on('signal', (data: SignalPayload) => {
  // Process WebRTC signal
  if (data.signal.type === 'offer') {
    // Create answer
  } else if (data.signal.type === 'answer') {
    // Set remote description
  } else if (data.signal.candidate) {
    // Add ICE candidate
  }
});
```

#### `room-error`

Error related to room operations.

```typescript
interface RoomErrorPayload {
  code: string;
  message: string;
}

socket.on('room-error', (error) => {
  switch (error.code) {
    case 'ROOM_NOT_FOUND':
      // Room doesn't exist
      break;
    case 'ROOM_FULL':
      // Max members reached
      break;
    case 'INVALID_PASSWORD':
      // Wrong password
      break;
    case 'ROOM_EXPIRED':
      // Room has expired
      break;
    case 'NOT_AUTHORIZED':
      // Not allowed to perform action
      break;
  }
});
```

#### `room-deleted`

The room was deleted by the owner.

```typescript
socket.on('room-deleted', (data: { roomCode: string }) => {
  console.log(`Room ${data.roomCode} was deleted`);
});
```

## Rate Limiting

The signaling server implements rate limiting to prevent abuse:

| Limit | Value | Window |
|-------|-------|--------|
| Connections per IP | 10 | 1 minute |
| Events per socket | 50 | 10 seconds |
| Rooms per socket | 5 | - |

Exceeding limits results in disconnection.

## Security

### Replay Protection

Messages older than 30 seconds are rejected:

```typescript
const MAX_MESSAGE_AGE = 30000; // 30 seconds

// Server-side validation
if (Date.now() - payload.timestamp > MAX_MESSAGE_AGE) {
  return socket.emit('room-error', {
    code: 'MESSAGE_EXPIRED',
    message: 'Message timestamp too old',
  });
}
```

### Private Network Detection

The server detects if peers are on the same local network to optimize ICE candidates:

```typescript
socket.on('network-info', (info) => {
  if (info.sameNetwork) {
    // Prefer local ICE candidates
  }
});
```

## Connection States

```
DISCONNECTED → CONNECTING → CONNECTED → AUTHENTICATED → IN_ROOM
                   ↓              ↓            ↓           ↓
              (timeout)    (auth fail)   (rate limit)  (kicked)
                   ↓              ↓            ↓           ↓
              DISCONNECTED ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

## Error Codes

| Code | Description |
|------|-------------|
| `ROOM_NOT_FOUND` | Room code doesn't exist |
| `ROOM_FULL` | Room has reached max members |
| `ROOM_EXPIRED` | Room has expired |
| `INVALID_PASSWORD` | Incorrect room password |
| `NOT_AUTHORIZED` | No permission for action |
| `RATE_LIMITED` | Too many requests |
| `MESSAGE_EXPIRED` | Message timestamp too old |
| `INVALID_SIGNAL` | Malformed signal data |
| `PEER_NOT_FOUND` | Target peer not in room |

## Health Check

The signaling server exposes a health endpoint:

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "tallow-signaling"
}
```

## Example: Complete Flow

```typescript
import { io } from 'socket.io-client';

// 1. Connect to signaling server
const socket = io('wss://tallow.manisahome.com', {
  path: '/signaling',
});

// 2. Handle connection
socket.on('connect', () => {
  console.log('Connected to signaling server');

  // 3. Join room
  socket.emit('join-room', {
    roomCode: 'ABCD1234',
    peerId: myPeerId,
    peerName: 'Alice',
  });
});

// 4. Handle room joined
socket.on('room-joined', (data) => {
  console.log('Joined room with peers:', data.peers);

  // 5. Initiate connection to existing peers
  for (const peer of data.peers) {
    createPeerConnection(peer.peerId);
    sendOffer(peer.peerId);
  }
});

// 6. Handle new peer
socket.on('peer-joined', (peer) => {
  // Wait for them to send offer
  console.log('New peer joined:', peer.peerName);
});

// 7. Handle signals
socket.on('signal', (data) => {
  handleSignal(data.senderId, data.signal);
});

// 8. Send signals
function sendSignal(targetPeerId, signal) {
  socket.emit('signal', {
    roomCode: 'ABCD1234',
    targetPeerId,
    senderId: myPeerId,
    signal,
    timestamp: Date.now(),
  });
}

// 9. Leave room
function leaveRoom() {
  socket.emit('leave-room', {
    roomCode: 'ABCD1234',
    peerId: myPeerId,
  });
}
```

## Browser Support

The signaling client works in all modern browsers:

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 78+ |
| Safari | 14+ |
| Edge | 80+ |

## Troubleshooting

### Connection Issues

1. Check WebSocket support
2. Verify URL and path
3. Check firewall/proxy settings
4. Ensure CORS is configured

### Signaling Failures

1. Verify room code is correct
2. Check rate limiting
3. Ensure timestamps are synchronized
4. Verify peer IDs are unique

### ICE Candidate Issues

1. Check TURN server configuration
2. Verify network connectivity
3. Try different transport methods
