# Transfer Rooms Integration Example

Complete example of integrating transfer rooms into the Tallow app.

## Step 1: Add Room Selector to Main App

```typescript
// app/app/page.tsx
'use client';

import { useState } from 'react';
import { RoomSelector } from '@/components/app/RoomSelector';
import { TransferRoom } from '@/components/app/TransferRoom';
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';

export default function AppPage() {
  const [deviceName, setDeviceName] = useState('My Device');
  const { isInRoom, room } = useTransferRoom(deviceName);

  return (
    <div className="container mx-auto px-4 py-8">
      {!isInRoom ? (
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Secure File Sharing</h1>
          <RoomSelector deviceName={deviceName} />
        </div>
      ) : (
        <TransferRoom deviceName={deviceName} />
      )}
    </div>
  );
}
```

## Step 2: Integrate with Existing P2P System

```typescript
// components/app/TransferRoomWithP2P.tsx
'use client';

import { useEffect, useRef } from 'react';
import { TransferRoom } from './TransferRoom';
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';
import { RoomP2PIntegration } from '@/lib/rooms/room-p2p-integration';
import { toast } from 'sonner';

export function TransferRoomWithP2P({ deviceName }: { deviceName: string }) {
  const {
    room,
    isInRoom,
    members,
  } = useTransferRoom(deviceName);

  const p2pIntegration = useRef<RoomP2PIntegration | null>(null);

  // Initialize P2P integration when room is joined
  useEffect(() => {
    if (isInRoom && !p2pIntegration.current) {
      const roomManager = new TransferRoomManager(
        getDeviceId(),
        deviceName
      );

      p2pIntegration.current = new RoomP2PIntegration(roomManager);

      // Handle received files
      p2pIntegration.current.onFileReceived(({ blob, name, senderId }) => {
        const member = members.find(m => m.id === senderId);
        toast.success(
          `Received "${name}" from ${member?.deviceName || 'unknown'}`
        );

        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    return () => {
      p2pIntegration.current?.destroy();
      p2pIntegration.current = null;
    };
  }, [isInRoom, deviceName, members]);

  const handleSendFiles = async (files: File[]) => {
    if (!p2pIntegration.current) return;

    for (const file of files) {
      await p2pIntegration.current.broadcastFile(file, (memberId, progress) => {
        console.log(`Progress to ${memberId}: ${progress}%`);
      });
    }

    toast.success(`Sent ${files.length} file(s) to all members`);
  };

  return (
    <TransferRoom
      deviceName={deviceName}
      onSendFiles={handleSendFiles}
    />
  );
}
```

## Step 3: Add Room Navigation

```typescript
// app/app/layout.tsx
import { AppHeader } from '@/components/app/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        // ... existing props
        showRoomButton={true}
        onCreateRoom={() => {
          // Navigate to room creation
        }}
      />
      <main>{children}</main>
    </div>
  );
}
```

## Step 4: Add Room State Persistence

```typescript
// lib/storage/room-storage.ts
import secureStorage from './secure-storage';

const ROOM_HISTORY_KEY = 'tallow_room_history';

interface RoomHistoryEntry {
  code: string;
  name: string;
  joinedAt: string;
  lastActive: string;
}

export async function saveRoomToHistory(
  code: string,
  name: string
): Promise<void> {
  try {
    const historyJson = await secureStorage.getItem(ROOM_HISTORY_KEY);
    const history: RoomHistoryEntry[] = historyJson
      ? JSON.parse(historyJson)
      : [];

    const existingIndex = history.findIndex(r => r.code === code);

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex].lastActive = new Date().toISOString();
    } else {
      // Add new entry
      history.unshift({
        code,
        name,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      // Keep only last 10 rooms
      if (history.length > 10) {
        history.splice(10);
      }
    }

    await secureStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save room to history:', error);
  }
}

export async function getRoomHistory(): Promise<RoomHistoryEntry[]> {
  try {
    const historyJson = await secureStorage.getItem(ROOM_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to get room history:', error);
    return [];
  }
}
```

## Step 5: Add Recent Rooms Component

```typescript
// components/app/RecentRooms.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { getRoomHistory } from '@/lib/storage/room-storage';
import { formatDistance } from 'date-fns';

interface RecentRoomsProps {
  onRoomSelect: (code: string) => void;
}

export function RecentRooms({ onRoomSelect }: RecentRoomsProps) {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    getRoomHistory().then(setRooms);
  }, []);

  if (rooms.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Rooms
      </h3>
      <ul className="space-y-2">
        {rooms.map((room) => (
          <li key={room.code}>
            <button
              onClick={() => onRoomSelect(room.code)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
            >
              <div>
                <p className="font-medium text-sm">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(new Date(room.lastActive), new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {room.code}
                </code>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

## Step 6: Add QR Code Sharing

```typescript
// components/app/RoomQRCode.tsx
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

interface RoomQRCodeProps {
  roomUrl: string;
  roomCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomQRCode({
  roomUrl,
  roomCode,
  open,
  onOpenChange,
}: RoomQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (open && roomUrl) {
      QRCode.toDataURL(roomUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).then(setQrDataUrl);
    }
  }, [open, roomUrl]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `tallow-room-${roomCode}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tallow room',
          text: `Scan this QR code to join room ${roomCode}`,
          url: roomUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Room</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {qrDataUrl && (
            <div className="flex justify-center p-4 bg-white rounded">
              <img src={qrDataUrl} alt="Room QR Code" className="w-full max-w-xs" />
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Room Code</p>
            <code className="text-2xl font-mono font-bold tracking-wider">
              {roomCode}
            </code>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {navigator.share && (
              <Button onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Step 7: Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 8: Start the Services

```bash
# Terminal 1: Start signaling server
npm run signaling-server

# Terminal 2: Start Next.js app
npm run dev
```

## Complete Flow

1. User opens app at `/app`
2. Sees `RoomSelector` with "Create Room" and "Join Room" options
3. Clicks "Create Room"
4. Fills out `CreateRoomDialog` with room settings
5. Room is created, URL is generated
6. User shares URL or QR code with friends
7. Friends open URL, automatically prompted to join
8. P2P connections established between all members
9. Files can be shared with all members via drag-drop or file picker
10. Real-time presence updates show who's online
11. When done, users can leave or owner can close room

## Testing Locally

### Test with Multiple Devices

1. Start the app on your computer
2. Create a room
3. Note the room code (e.g., ABC12345)
4. On mobile device, navigate to your computer's local IP:
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Visit: `http://192.168.1.X:3000/room/ABC12345`
5. Join room with the code
6. Test file sharing between devices

### Test with Multiple Browser Windows

1. Open two browser windows side-by-side
2. Create room in Window 1
3. Copy room URL
4. Paste in Window 2
5. Verify both windows show each other in members list
6. Send file from Window 1
7. Verify Window 2 receives it

## Production Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  signaling:
    build:
      context: .
      dockerfile: Dockerfile.signaling
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - ALLOWED_ORIGINS=https://yourdomain.com

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SIGNALING_URL=https://signaling.yourdomain.com
      - NEXT_PUBLIC_APP_URL=https://yourdomain.com
    depends_on:
      - signaling
```

### Redis for Room Persistence

```typescript
// lib/rooms/redis-room-storage.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function saveRoom(code: string, room: any): Promise<void> {
  const ttl = room.expiresAt
    ? Math.floor((new Date(room.expiresAt).getTime() - Date.now()) / 1000)
    : null;

  await redis.set(`room:${code}`, JSON.stringify(room), 'EX', ttl || 86400);
}

export async function getRoom(code: string): Promise<any> {
  const data = await redis.get(`room:${code}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteRoom(code: string): Promise<void> {
  await redis.del(`room:${code}`);
}
```

## Troubleshooting

### Room Not Found

- Check signaling server is running
- Verify room code is correct
- Check room hasn't expired

### Can't Join Room

- Verify password is correct
- Check room isn't full
- Ensure signaling connection is active

### Files Not Transferring

- Check WebRTC connection status
- Verify firewall isn't blocking P2P
- Check TURN server configuration

### Member Not Showing Online

- Check Socket.IO connection
- Verify presence updates are being sent
- Check for network issues

## Performance Optimization

### Lazy Loading

```typescript
// Only load room components when needed
const TransferRoom = dynamic(() => import('@/components/app/TransferRoom'), {
  loading: () => <LoadingSpinner />,
});
```

### Connection Pooling

```typescript
// Reuse WebRTC connections
const connectionPool = new Map<string, RTCPeerConnection>();

function getOrCreateConnection(memberId: string): RTCPeerConnection {
  if (!connectionPool.has(memberId)) {
    connectionPool.set(memberId, createPeerConnection());
  }
  return connectionPool.get(memberId)!;
}
```

### Bandwidth Throttling

```typescript
// Limit upload speed per member
pqcManager.setBandwidthLimit(1024 * 1024); // 1 MB/s
```

This completes the comprehensive integration guide for Transfer Rooms!
