# Room System - Quick Start Guide

Quick reference for using the room system in Tallow.

## Basic Usage

### In a React Component

```typescript
import { useRoomConnection } from '@/lib/hooks/use-room-connection';

function MyComponent() {
  const {
    isInRoom,
    roomCode,
    members,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useRoomConnection();

  const handleCreate = async () => {
    const code = await createRoom();
    console.log('Room created:', code);
    // Share code with other users
  };

  const handleJoin = async (code: string) => {
    await joinRoom(code);
    console.log('Joined room');
  };

  return (
    <div>
      {isInRoom ? (
        <div>
          <p>Room Code: {roomCode}</p>
          <p>Members: {members.length}</p>
          <button onClick={leaveRoom}>Leave</button>
        </div>
      ) : (
        <button onClick={handleCreate}>Create Room</button>
      )}
    </div>
  );
}
```

### Direct API Usage

```typescript
import { TransferRoomManager } from '@/lib/rooms/transfer-room-manager';

const manager = new TransferRoomManager(deviceId, deviceName);

// Connect
await manager.connect();

// Create room
const room = await manager.createRoom({
  password: 'optional',
  expiresIn: 60 * 60 * 1000, // 1 hour
  maxMembers: 10,
});

// Join room
const room = await manager.joinRoom('ABC12345', 'password');

// Leave room
manager.leaveRoom();

// Disconnect
manager.disconnect();
```

## Room Store Access

### Using Selectors

```typescript
import { useRoomStore, selectIsInRoom, selectMembers } from '@/lib/stores/room-store';

function MyComponent() {
  const isInRoom = useRoomStore(selectIsInRoom);
  const members = useRoomStore(selectMembers);

  // Or get everything
  const { currentRoom, roomCode, isHost } = useRoomStore();
}
```

### Available Selectors

```typescript
selectConnectionStatus      // Current connection state
selectIsConnected          // Boolean: connected to signaling
selectIsInRoom             // Boolean: in an active room
selectConnectionError      // Error message or null
selectConnectionQuality    // 'excellent' | 'good' | 'fair' | 'poor' | null

selectCurrentRoom          // Full room object
selectRoomCode            // Current room code
selectIsHost              // Boolean: user is room host
selectMembers             // Array of all members
selectMemberCount         // Number of members
selectOnlineMembers       // Array of online members
selectHostMember          // Host member object
```

## Security Features

### Generate Secure Room Code

```typescript
import { generateSecureRoomCode } from '@/lib/rooms/room-security';

const code = generateSecureRoomCode(8); // "ABC12345"
```

### Validate Room Code

```typescript
import { validateRoomCode } from '@/lib/rooms/room-security';

const validation = validateRoomCode('ABC123');
if (!validation.valid) {
  console.error(validation.reason);
  console.log('Suggestions:', validation.suggestions);
}
```

### Hash Password

```typescript
import { hashRoomPassword, verifyRoomPassword } from '@/lib/rooms/room-security';

// Hash
const hash = await hashRoomPassword('my-password');
// Format: "1:salt_hex:hash_hex" (Argon2id)

// Verify
const isValid = await verifyRoomPassword('my-password', hash);
```

## Event Handlers

### Hook Options

```typescript
useRoomConnection({
  autoConnect: false,
  expiresIn: 60 * 60 * 1000,
  maxMembers: 10,

  onMemberJoined: (member) => {
    console.log('New member:', member.deviceName);
  },

  onMemberLeft: (memberId) => {
    console.log('Member left:', memberId);
  },

  onRoomClosed: () => {
    console.log('Room closed by host');
  },

  onConnectionReady: () => {
    console.log('Connected to signaling server');
  },

  onError: (error) => {
    console.error('Room error:', error.message);
  },
});
```

### Manager Event Handlers

```typescript
manager.onConnectionReady(() => {
  console.log('Connected');
});

manager.onMemberJoined((member) => {
  console.log('Member joined:', member);
});

manager.onMemberLeft((memberId) => {
  console.log('Member left:', memberId);
});

manager.onMembersUpdated((members) => {
  console.log('Members updated:', members);
});

manager.onRoomClosed(() => {
  console.log('Room closed');
});

manager.onFileOffer((offer) => {
  console.log('File offer:', offer.fileName, offer.fileSize);
});
```

## Room Configuration

### Create Room Options

```typescript
interface RoomConfig {
  name?: string;           // Room name (default: "Room {code}")
  password?: string;       // Optional password protection
  expiresIn?: number;      // Expiration time in ms (null = never)
  maxMembers?: number;     // Maximum members (default: 10)
}

const room = await manager.createRoom({
  name: 'Team Project',
  password: 'secret123',
  expiresIn: 2 * 60 * 60 * 1000, // 2 hours
  maxMembers: 5,
});
```

## Member Information

### Room Member Object

```typescript
interface RoomMember {
  id: string;              // Unique member ID
  socketId: string;        // Socket.IO ID
  deviceName: string;      // Display name
  deviceId: string;        // Device identifier
  joinedAt: Date;          // Join timestamp
  isOnline: boolean;       // Online status
  isOwner: boolean;        // Host/owner flag
}
```

### Get Members

```typescript
// Get all members
const members = manager.getRoomMembers();

// Check if user is owner
const isOwner = manager.isOwner();

// From store
const members = useRoomStore(selectMembers);
const onlineMembers = useRoomStore(selectOnlineMembers);
const host = useRoomStore(selectHostMember);
```

## Error Handling

### Common Errors

```typescript
try {
  await manager.joinRoom(code, password);
} catch (error) {
  if (error.message.includes('not found')) {
    // Room doesn't exist or expired
  } else if (error.message.includes('password')) {
    // Incorrect password
  } else if (error.message.includes('full')) {
    // Room at max capacity
  } else if (error.message.includes('timeout')) {
    // Connection timeout
  }
}
```

### Error States in Store

```typescript
const { connectionError } = useRoomStore();

if (connectionError) {
  // Display error to user
  return <ErrorBanner message={connectionError} />;
}
```

## Connection States

```typescript
type RoomConnectionStatus =
  | 'disconnected'    // Not connected to signaling
  | 'connecting'      // Connecting to signaling
  | 'connected'       // Connected, not in room
  | 'joining'         // Joining a room
  | 'in-room'        // In an active room
  | 'error';         // Error state

const { connectionStatus } = useRoomStore();

switch (connectionStatus) {
  case 'disconnected':
    return <ConnectButton />;
  case 'connecting':
    return <LoadingSpinner />;
  case 'in-room':
    return <RoomView />;
  case 'error':
    return <ErrorView />;
}
```

## Room Encryption

### Check Encryption Status

```typescript
// Using manager
const isEncrypted = manager.isRoomEncrypted();
const status = manager.getRoomEncryptionStatus();
console.log(status.encrypted, status.algorithm);

// Using hook
const { isRoomEncrypted } = useRoomConnection();
const encrypted = isRoomEncrypted();
```

### Encryption Algorithm

- **Algorithm**: HKDF + AES-256-GCM
- **Key Derivation**: Room code + optional password
- **Message Format**: `{ encrypted: true, ct: "...", iv: "...", ts: number }`

## Utilities

### Get Room URL

```typescript
const url = manager.getRoomUrl();
// Returns: "https://yourdomain.com/room/ABC12345"

// Or from hook
const { getRoomUrl } = useRoomConnection();
const url = getRoomUrl();
```

### Connection Quality

```typescript
const { connectionQuality } = useRoomStore();

// Values: 'excellent' | 'good' | 'fair' | 'poor' | null

<ConnectionIndicator quality={connectionQuality} />
```

## TypeScript Types

### Import Types

```typescript
import type {
  RoomConnectionStatus,
  RoomStoreState,
} from '@/lib/stores/room-store';

import type {
  RoomMember,
  TransferRoom,
  RoomConfig,
} from '@/lib/rooms/transfer-room-manager';
```

## Environment Variables

```env
# Signaling server URL (required for internet P2P)
NEXT_PUBLIC_SIGNALING_URL=wss://signaling.yourdomain.com

# Optional: Custom relay directory
RELAY_DIRECTORY_URL=https://relay-directory.yourdomain.com/v1
```

## Testing

### Mock Room Manager

```typescript
// For testing
const mockManager = {
  connect: jest.fn().mockResolvedValue(undefined),
  createRoom: jest.fn().mockResolvedValue({ code: 'TEST1234' }),
  joinRoom: jest.fn().mockResolvedValue({ code: 'TEST1234' }),
  leaveRoom: jest.fn(),
  disconnect: jest.fn(),
};
```

### Test Store State

```typescript
import { useRoomStore } from '@/lib/stores/room-store';

// Set initial state
useRoomStore.setState({
  connectionStatus: 'in-room',
  roomCode: 'TEST1234',
  members: [mockMember],
});

// Test component
const { getByText } = render(<MyComponent />);
expect(getByText('TEST1234')).toBeInTheDocument();
```

## Common Patterns

### Auto-Connect on Mount

```typescript
const { connect, isConnected } = useRoomConnection({ autoConnect: true });

// Or manually
useEffect(() => {
  if (!isConnected) {
    connect();
  }
}, [isConnected, connect]);
```

### Cleanup on Unmount

```typescript
useEffect(() => {
  // Connect
  connect();

  // Cleanup
  return () => {
    leaveRoom();
    disconnect();
  };
}, []);
```

### Loading States

```typescript
const [isCreating, setIsCreating] = useState(false);

const handleCreate = async () => {
  setIsCreating(true);
  try {
    const code = await createRoom();
    // Success
  } catch (error) {
    // Error
  } finally {
    setIsCreating(false);
  }
};

<button disabled={isCreating}>
  {isCreating ? 'Creating...' : 'Create Room'}
</button>
```

### Conditional Rendering

```typescript
const { isInRoom, isHost, members } = useRoomConnection();

return (
  <div>
    {isInRoom && (
      <>
        <RoomCode code={roomCode} />
        <MembersList members={members} />
        {isHost && <HostControls />}
      </>
    )}
  </div>
);
```

## Pro Tips

1. **Always handle errors** - Network issues are common
2. **Show loading states** - Operations can take 1-2 seconds
3. **Cleanup on unmount** - Prevent memory leaks
4. **Use selectors** - Better performance with Zustand
5. **Validate input** - Check room codes before joining
6. **Display member count** - Show users who's connected
7. **Add connection quality indicator** - User feedback is important
8. **Support reconnection** - Auto-reconnect on disconnect
9. **Clear error messages** - Help users understand issues
10. **Test with real network conditions** - Simulate slow connections

## Troubleshooting

### Not Connecting

```typescript
// Check signaling URL
console.log(process.env.NEXT_PUBLIC_SIGNALING_URL);

// Try manual connect
await manager.connect();
```

### Room Not Found

```typescript
// Validate code format
const validation = validateRoomCode(code);
if (!validation.valid) {
  console.error(validation.reason);
}

// Check if room expired
// Rooms expire based on expiresIn config
```

### Members Not Showing

```typescript
// Check if in room
if (!isInRoom) {
  console.error('Not in room yet');
}

// Listen for member updates
manager.onMembersUpdated((members) => {
  console.log('Current members:', members);
});
```

### Password Issues

```typescript
// Ensure password is correct
await joinRoom(code, password);

// Hash matches server-side hash
const hash = await hashRoomPassword(password);
```

## Summary

The room system provides a simple, secure way to enable cross-network P2P transfers:

1. **Create room** → Get code
2. **Share code** → Other users join
3. **Transfer files** → Encrypted P2P

All with TypeScript strict mode, comprehensive error handling, and production-ready security!
