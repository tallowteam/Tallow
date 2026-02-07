# Room System Implementation

Complete room-based P2P transfer system for cross-network internet connections via room codes.

## Overview

The room system enables secure peer-to-peer file transfers across different networks using:
- **Room codes**: 8-character CSPRNG-generated codes (e.g., "ABC12345")
- **Signaling server**: Socket.IO server for WebRTC signaling
- **E2E encryption**: Room-level encryption using HKDF-derived AES-256 keys
- **PQC-ready**: Built on top of post-quantum crypto infrastructure

## Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│   Device A      │                    │   Device B      │
│  (Room Host)    │                    │  (Room Member)  │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  1. Create Room (ABC12345)           │
         │────────────────────────────────────► │
         │                                      │ 2. Join Room
         │                                      │    with code
         │  ◄────────────────────────────────── │
         │                                      │
         │  3. WebRTC Signaling via Room        │
         │  ◄──────────────────────────────────►│
         │                                      │
         │  4. Direct P2P Connection            │
         │  ════════════════════════════════════│
         │     (Encrypted File Transfer)        │
         └──────────────────────────────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │  Signaling Server    │
            │  (Socket.IO)         │
            │  - Room management   │
            │  - Member tracking   │
            │  - Offer/Answer relay│
            └──────────────────────┘
```

## Components

### 1. Room Store (`lib/stores/room-store.ts`)

Zustand store managing room state:

```typescript
interface RoomStoreState {
  // Connection
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'joining' | 'in-room' | 'error'
  connectionError: string | null
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | null

  // Room
  currentRoom: TransferRoom | null
  roomCode: string | null
  isHost: boolean

  // Members
  members: RoomMember[]
  memberCount: number
}
```

**Selectors:**
- `selectIsInRoom` - Check if user is in a room
- `selectMembers` - Get all room members
- `selectOnlineMembers` - Get online members only
- `selectHostMember` - Get room host

### 2. Room Connection Hook (`lib/hooks/use-room-connection.ts`)

React hook for room operations:

```typescript
const {
  // State
  isConnected,
  isInRoom,
  currentRoom,
  roomCode,
  isHost,
  members,
  memberCount,

  // Actions
  connect,        // Connect to signaling server
  createRoom,     // Create new room (returns code)
  joinRoom,       // Join existing room by code
  leaveRoom,      // Leave current room
  disconnect,     // Disconnect from signaling

  // Utility
  getRoomUrl,
  isRoomEncrypted,
} = useRoomConnection({
  autoConnect: false,
  expiresIn: 60 * 60 * 1000, // 1 hour
  maxMembers: 10,
  onMemberJoined: (member) => {},
  onMemberLeft: (memberId) => {},
  onRoomClosed: () => {},
  onError: (error) => {},
});
```

### 3. Transfer Room Manager (`lib/rooms/transfer-room-manager.ts`)

Core room management class:

```typescript
class TransferRoomManager {
  // Connection
  async connect(): Promise<void>
  disconnect(): void
  isConnected(): boolean

  // Room operations
  async createRoom(config?: RoomConfig): Promise<TransferRoom>
  async joinRoom(code: string, password?: string): Promise<TransferRoom>
  leaveRoom(): void
  closeRoom(): void  // Host only

  // Communication
  async broadcastFileOffer(fileName: string, fileSize: number): Promise<void>

  // Members
  getRoomMembers(): RoomMember[]
  isOwner(): boolean

  // Encryption
  isRoomEncrypted(): boolean
  getRoomEncryptionStatus(): { encrypted: boolean; algorithm: string | null }
}
```

### 4. Room Security (`lib/rooms/room-security.ts`)

Security features:

- **Code Generation**: `generateSecureRoomCode(length)` - CSPRNG-based
- **Code Validation**: `validateRoomCode(code)` - Pattern checking
- **Password Hashing**: `hashRoomPassword(password)` - Argon2id/PBKDF2
- **Rate Limiting**: Prevent brute-force attacks
- **Timing Protection**: Anti-enumeration delays

### 5. UI Component (`components/transfer/RoomCodeConnect.tsx`)

React component for room UI:

**States:**
- Join mode: Enter room code input
- Create mode: Display generated code
- In-room: Show members and connection status

**Features:**
- Real-time member list
- Connection quality indicator
- Copy-to-clipboard for room codes
- Error handling with user-friendly messages
- Loading states during operations

## Room Code Format

**Pattern:** `ABCDEFGH` (8 characters)
- Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Excludes ambiguous: `I, O, 0, 1, L`
- CSPRNG: `crypto.getRandomValues()`
- Validation: Minimum 6 chars, maximum 16 chars

**Example codes:**
- `ABC12345`
- `XYZ98765`
- `QWERTY42`

## Security Features

### 1. Room Encryption

```typescript
// Derived from room code + optional password
const key = await deriveRoomEncryptionKey(roomCode, password);

// HKDF-based key derivation
// Input: room code + password (if any)
// Output: 256-bit AES-GCM key

// Encrypted message format
{
  encrypted: true,
  ct: "base64_ciphertext",
  iv: "base64_nonce",
  ts: timestamp,
  v: version
}
```

### 2. Password Protection

```typescript
// Hash with Argon2id (preferred) or PBKDF2 fallback
const hash = await hashRoomPassword(password);
// Format: "version:salt:hash"

// Verification
const valid = await verifyRoomPassword(password, hash);
```

### 3. Rate Limiting

- **Room creation**: 5 attempts per minute
- **Room join**: 10 attempts per minute
- **Password attempts**: 3 failures → exponential backoff
- **Backoff delays**: 1s, 2s, 5s, 10s, 30s, 60s

### 4. Anti-Enumeration

```typescript
// Add random timing jitter to prevent timing attacks
await addTimingJitter(100, 500); // 100-500ms delay

// Constant-time string comparison
const match = constantTimeCompare(inputCode, storedCode);
```

## Room Lifecycle

### Creating a Room

```typescript
// 1. Connect to signaling server
await roomManager.connect();

// 2. Create room
const room = await roomManager.createRoom({
  password: 'optional-password',
  expiresIn: 60 * 60 * 1000, // 1 hour
  maxMembers: 10,
});

// 3. Share room code
console.log('Room code:', room.code);

// 4. Wait for members
roomManager.onMemberJoined((member) => {
  console.log('Member joined:', member.deviceName);
});
```

### Joining a Room

```typescript
// 1. Connect to signaling server
await roomManager.connect();

// 2. Join room by code
const room = await roomManager.joinRoom('ABC12345', 'optional-password');

// 3. Connected to room
console.log('Joined room:', room.name);
console.log('Members:', room.members.size);
```

### Leaving a Room

```typescript
// Leave current room
roomManager.leaveRoom();

// Or close room (host only)
if (roomManager.isOwner()) {
  roomManager.closeRoom();
}
```

## Integration with Transfer System

### File Offers

```typescript
// Host broadcasts file offer
await roomManager.broadcastFileOffer(
  'document.pdf',
  1024 * 1024 // 1MB
);

// Members receive offer
roomManager.onFileOffer((offer) => {
  console.log('File offer:', offer.fileName, offer.fileSize);
  // Initiate WebRTC connection for transfer
});
```

### WebRTC Signaling

```typescript
// Exchange offers/answers via room
roomManager.on('webrtc-offer', async (data) => {
  const answer = await createAnswer(data.offer);
  roomManager.emit('webrtc-answer', { answer });
});

// Exchange ICE candidates
roomManager.on('ice-candidate', (candidate) => {
  peerConnection.addIceCandidate(candidate);
});
```

## Relay Fallback

When direct P2P fails, use relay servers:

```typescript
// 1. Build onion circuit
const circuit = await relayClient.buildCircuit(
  [entryRelay, middleRelay, exitRelay],
  destinationPeerId
);

// 2. Send data through circuit
await relayClient.sendThroughCircuit(circuit, encryptedData);

// 3. Data is forwarded through multiple hops
// Entry -> Middle -> Exit -> Destination
```

## Environment Configuration

```env
# Signaling server URL
NEXT_PUBLIC_SIGNALING_URL=wss://signaling.yourdomain.com

# Optional: Custom relay directory
RELAY_DIRECTORY_URL=https://relay-directory.yourdomain.com/v1
```

## Testing

### Manual Testing

1. **Create Room:**
   - Go to transfer page
   - Switch to "Internet" tab
   - Click "Create a Room"
   - Copy generated code

2. **Join Room:**
   - On another device/browser
   - Go to transfer page
   - Switch to "Internet" tab
   - Enter room code
   - Click "Join"

3. **Verify:**
   - Both devices show in members list
   - Connection quality indicator shows "Connected"
   - Room code matches

### Integration Testing

```typescript
// Test room creation
const room = await manager.createRoom();
expect(room.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
expect(room.ownerId).toBe(deviceId);

// Test room joining
const joinedRoom = await manager.joinRoom(room.code);
expect(joinedRoom.code).toBe(room.code);
expect(joinedRoom.members.size).toBe(2);

// Test member tracking
manager.onMemberJoined((member) => {
  expect(member.isOnline).toBe(true);
  expect(member.deviceId).toBeDefined();
});
```

## Error Handling

### Common Errors

```typescript
// Connection errors
try {
  await manager.connect();
} catch (error) {
  if (error.message.includes('timeout')) {
    // Retry connection
  } else if (error.message.includes('signaling server')) {
    // Show fallback options
  }
}

// Room errors
try {
  await manager.joinRoom(code, password);
} catch (error) {
  if (error.message.includes('not found')) {
    // Invalid room code
  } else if (error.message.includes('password')) {
    // Incorrect password
  } else if (error.message.includes('full')) {
    // Room at max capacity
  } else if (error.message.includes('expired')) {
    // Room has expired
  }
}
```

### Error Display

```typescript
// Component shows user-friendly errors
{error && (
  <div className={styles.errorBanner}>
    <WarningIcon />
    <span>{error}</span>
  </div>
)}
```

## Performance Optimizations

### Connection Pooling

- Reuse signaling connection across rooms
- Lazy-load Socket.IO client (~35KB)
- Auto-reconnect with exponential backoff

### State Management

- Zustand for minimal re-renders
- Selectors for computed values
- Optimistic updates for UI responsiveness

### Memory Management

- Cleanup on unmount
- Secure key wiping after use
- Event listener cleanup

## Future Enhancements

1. **QR Code Sharing**
   ```typescript
   const qrCode = generateRoomQRCode(room.code);
   ```

2. **Room Persistence**
   ```typescript
   const room = await createRoom({ persistent: true });
   // Room survives host disconnect
   ```

3. **Room Templates**
   ```typescript
   const room = await createRoom({ template: 'team-collab' });
   // Pre-configured settings
   ```

4. **End-to-End Verified Rooms**
   ```typescript
   const room = await createRoom({ requireVerification: true });
   // QR code or phrase verification
   ```

## File Locations

```
lib/
  stores/
    room-store.ts                      # Zustand store for room state
  hooks/
    use-room-connection.ts             # React hook for room operations
  rooms/
    transfer-room-manager.ts           # Core room management
    room-security.ts                   # Security utilities
    room-crypto.ts                     # Encryption/decryption
    room-p2p-integration.ts            # WebRTC integration
  relay/
    relay-client.ts                    # Relay/onion routing client
    relay-directory.ts                 # Relay node discovery
  signaling/
    socket-signaling.ts                # Socket.IO signaling client

components/
  transfer/
    RoomCodeConnect.tsx                # Room UI component
    RoomCodeConnect.module.css         # Component styles

app/
  transfer/
    page.tsx                           # Transfer page (uses rooms)
```

## Summary

The room system provides a complete solution for cross-network P2P transfers with:

✅ **Easy sharing** - Simple 8-character codes
✅ **Secure** - E2E encryption, PQC-ready, rate limiting
✅ **Real-time** - Live member tracking, instant updates
✅ **Resilient** - Auto-reconnect, relay fallback
✅ **Production-ready** - Error handling, TypeScript strict mode, comprehensive testing

Users can now share files across the internet by simply sharing a room code, without needing to be on the same network!
