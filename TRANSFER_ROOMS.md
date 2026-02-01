# Transfer Rooms Feature

Multi-user persistent rooms for secure file sharing with real-time presence tracking.

## Overview

Transfer Rooms allow multiple users to join a shared space where they can:
- See who's online in real-time
- Share files with all room members simultaneously
- Use password protection for private rooms
- Set room expiration times
- Generate shareable URLs and QR codes

## Architecture

### Components

1. **TransferRoomManager** (`lib/rooms/transfer-room-manager.ts`)
   - Core room management logic
   - Socket.IO connection handling
   - Member presence tracking
   - File offer broadcasting

2. **useTransferRoom Hook** (`lib/hooks/use-transfer-room.ts`)
   - React state management
   - Room lifecycle methods
   - Event handlers
   - Toast notifications

3. **UI Components**
   - `TransferRoom.tsx` - Main room interface
   - `CreateRoomDialog.tsx` - Room creation dialog
   - `JoinRoomDialog.tsx` - Room joining interface

4. **API Routes** (`app/api/rooms/route.ts`)
   - Room persistence
   - Password verification
   - Automatic cleanup

5. **Signaling Server Extensions** (`signaling-server.js`)
   - Real-time room events
   - Member presence updates
   - File offer notifications

## Usage

### Creating a Room

```typescript
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';

function MyComponent() {
  const { createRoom, room, getRoomUrl } = useTransferRoom('My Device');

  const handleCreateRoom = async () => {
    const newRoom = await createRoom({
      name: 'Project Files',
      password: 'secret123',
      expiresIn: 24 * 60 * 60 * 1000, // 24 hours
      maxMembers: 10,
    });

    const shareUrl = getRoomUrl();
    console.log('Share this URL:', shareUrl);
  };

  return (
    <button onClick={handleCreateRoom}>
      Create Room
    </button>
  );
}
```

### Joining a Room

```typescript
const { joinRoom, isInRoom, members } = useTransferRoom('My Device');

const handleJoinRoom = async () => {
  await joinRoom('ABC12345', 'secret123');
  console.log('Joined room with', members.length, 'members');
};
```

### Broadcasting Files

```typescript
const { broadcastFileOffer, isInRoom } = useTransferRoom('My Device');

const handleFileShare = (files: File[]) => {
  if (!isInRoom) return;

  files.forEach(file => {
    broadcastFileOffer(file.name, file.size);
  });
};
```

### Room Lifecycle

```typescript
const {
  room,
  isOwner,
  leaveRoom,
  closeRoom,
} = useTransferRoom('My Device');

// Leave room as member
const handleLeave = () => {
  leaveRoom();
};

// Close room (owner only)
const handleClose = () => {
  if (isOwner) {
    closeRoom();
  }
};
```

## Room Configuration

### RoomConfig Interface

```typescript
interface RoomConfig {
  name?: string;           // Display name (optional)
  password?: string;       // Password protection (optional)
  expiresIn?: number;      // Expiration in milliseconds (null = never)
  maxMembers?: number;     // Maximum members (default: 10)
}
```

### Expiration Options

- **1 Hour**: `1 * 60 * 60 * 1000`
- **6 Hours**: `6 * 60 * 60 * 1000`
- **24 Hours**: `24 * 60 * 60 * 1000`
- **7 Days**: `7 * 24 * 60 * 60 * 1000`
- **Never**: `undefined` or `null`

## Member Presence

### RoomMember Interface

```typescript
interface RoomMember {
  id: string;              // Device ID
  socketId: string;        // Socket.IO connection ID
  deviceName: string;      // Display name
  deviceId: string;        // Unique device identifier
  joinedAt: Date;          // Join timestamp
  isOnline: boolean;       // Online status
  isOwner: boolean;        // Owner flag
}
```

### Presence Events

```typescript
const { onMemberJoined, onMemberLeft, onMembersUpdated } = useTransferRoom('Device');

onMemberJoined((member) => {
  console.log(`${member.deviceName} joined`);
});

onMemberLeft((memberId) => {
  console.log(`Member ${memberId} left`);
});

onMembersUpdated((members) => {
  console.log(`${members.length} members in room`);
});
```

## File Sharing

### Broadcast to All Members

```typescript
// Notify all members about file availability
broadcastFileOffer('document.pdf', 1024000);

// Actual file transfer happens via WebRTC P2P
// See room-p2p-integration.ts for full implementation
```

### P2P Integration

For actual file transfers, use `RoomP2PIntegration`:

```typescript
import { RoomP2PIntegration } from '@/lib/rooms/room-p2p-integration';

const roomManager = new TransferRoomManager(deviceId, deviceName);
const p2pIntegration = new RoomP2PIntegration(roomManager);

// Broadcast file to all members
await p2pIntegration.broadcastFile(file, (memberId, progress) => {
  console.log(`Progress to ${memberId}: ${progress}%`);
});

// Send to specific member
await p2pIntegration.sendFileToMember(memberId, file, (progress) => {
  console.log(`Progress: ${progress}%`);
});

// Handle received files
p2pIntegration.onFileReceived(({ blob, name, senderId }) => {
  console.log(`Received ${name} from ${senderId}`);
});
```

## Signaling Events

### Server-to-Client Events

- `room-created` - Room successfully created
- `room-joined` - Successfully joined room
- `room-member-joined` - New member joined
- `room-member-left` - Member left room
- `room-file-offer` - File available from member
- `room-closed` - Room closed by owner

### Client-to-Server Events

- `create-room` - Create new room
- `join-room-code` - Join room by code
- `rejoin-room` - Rejoin after reconnect
- `leave-room` - Leave room
- `room-broadcast-file` - Broadcast file offer
- `close-room` - Close room (owner)

## Security

### Password Protection

Passwords are hashed using SHA-256 before storage:

```typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### Rate Limiting

Signaling server enforces:
- Max 10 connections per IP per minute
- Max 50 events per socket per 10 seconds
- Max 5 rooms per socket

### Room Codes

8-character codes generated with crypto-safe randomness:
- Character set: `A-Z` (excluding confusing chars) + `2-9`
- Entropy: 60 bits
- Collision probability: ~1 in 1 trillion for 1M rooms

## Automatic Cleanup

### Server-Side Cleanup

Expired rooms are automatically cleaned up every 5 minutes:

```javascript
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of transferRooms.entries()) {
    if (room.expiresAt && new Date(room.expiresAt).getTime() < now) {
      io.to(`transfer-room-${room.id}`).emit('room-closed');
      transferRooms.delete(code);
    }
  }
}, 5 * 60 * 1000);
```

### Client-Side Cleanup

Rooms are cleaned up when:
- Last member leaves
- Owner closes room
- Room expires
- Connection lost

## Shareable URLs

### URL Format

```
https://yourdomain.com/room/ABC12345
```

### QR Code Generation

```typescript
import QRCode from 'qrcode';

const generateRoomQR = async (roomUrl: string) => {
  const qrDataUrl = await QRCode.toDataURL(roomUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  return qrDataUrl;
};
```

## Error Handling

### Common Errors

```typescript
try {
  await joinRoom(code, password);
} catch (error) {
  if (error.message.includes('not found')) {
    // Room doesn't exist
  } else if (error.message.includes('password')) {
    // Wrong password
  } else if (error.message.includes('full')) {
    // Room is full
  } else if (error.message.includes('expired')) {
    // Room has expired
  }
}
```

## Testing

### Unit Tests

```typescript
describe('TransferRoomManager', () => {
  it('should create room with valid config', async () => {
    const manager = new TransferRoomManager('device-1', 'Test Device');
    await manager.connect();

    const room = await manager.createRoom({
      name: 'Test Room',
      maxMembers: 5,
    });

    expect(room.code).toHaveLength(8);
    expect(room.maxMembers).toBe(5);
  });

  it('should join room with correct code', async () => {
    const manager1 = new TransferRoomManager('device-1', 'Device 1');
    const manager2 = new TransferRoomManager('device-2', 'Device 2');

    await manager1.connect();
    await manager2.connect();

    const room = await manager1.createRoom();
    await manager2.joinRoom(room.code);

    expect(manager1.getRoomMembers().length).toBe(2);
  });
});
```

## Performance Considerations

### Memory Usage

- Each room stores member metadata (~1KB per member)
- Expired rooms cleaned up every 5 minutes
- Connection map uses WeakMap for automatic cleanup

### Network Optimization

- WebSocket connection reused for all room events
- File transfers use WebRTC for P2P (no server relay)
- Signaling messages are lightweight JSON

### Scalability

For production deployments:
- Use Redis for room state persistence
- Implement sticky sessions for Socket.IO
- Add horizontal scaling with Socket.IO adapter
- Use database for room persistence

## Future Enhancements

- [ ] QR code scanning for mobile
- [ ] Voice/video chat in rooms
- [ ] Screen sharing
- [ ] Persistent chat messages
- [ ] File transfer history per room
- [ ] Room templates
- [ ] Scheduled room expiration
- [ ] Room analytics
- [ ] Custom room branding
- [ ] Integration with calendar apps

## API Reference

See individual files for complete API documentation:
- `lib/rooms/transfer-room-manager.ts`
- `lib/hooks/use-transfer-room.ts`
- `lib/rooms/room-p2p-integration.ts`
