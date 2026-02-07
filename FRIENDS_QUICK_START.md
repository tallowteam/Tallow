# Friends System - Quick Start Guide

## For Users

### Adding a Friend

**Method 1: Share Your Code**
1. Go to Transfer page → Friends tab
2. Click "Add Friend" button
3. Your 8-character code appears (e.g., `A3K7P2M9`)
4. Share this code with your friend (or show QR code)
5. Code expires in 5 minutes - generate new if needed

**Method 2: Enter Friend's Code**
1. Get your friend's 8-character code
2. Click "Add Friend" → "Enter Code" tab
3. Type the code (XXXXXXXX format)
4. Enter your friend's name
5. Click "Add Friend"

### Sending Files to Friends

1. Drop files in the drop zone
2. Go to Friends tab
3. Online friends show green dot
4. Click friend card or "Quick Send" button
5. Transfer starts automatically

### Managing Friends

- **Favorite**: Click ⭐ icon (enables auto-accept)
- **Remove**: Click × → confirm
- **Status**: Green = online, gray = offline with last seen time

## For Developers

### Integration Points

**Transfer Page:**
```typescript
import { FriendsList } from '@/components/transfer/FriendsList';
import { useFriendsStore, type Friend } from '@/lib/stores/friends-store';

// In component:
const { friends, setFriendOnline } = useFriendsStore();

<FriendsList
  selectedFiles={selectedFiles}
  onSelectFriend={handleFriendSelect}
/>
```

**Friend Transfer Handler:**
```typescript
const handleFriendSelect = async (friend: Friend) => {
  // Convert to device
  const device = {
    id: friend.id,
    name: friend.name,
    platform: friend.platform,
    // ...
  };

  // Connect and transfer
  await orchestrator.connectToDevice(device);
  await orchestrator.sendFiles(queue);

  // Update stats
  incrementTransferCount(friend.id);
};
```

### Store Actions

```typescript
// Add friend
const friend = addFriendByCode('A3K7P2M9', 'Alice', 'macos');

// Generate pairing code
const session = generatePairingCode();
console.log(session.code); // '3KL9P7M2'

// Update friend status
setFriendOnline(friendId, true);
updateFriendLastSeen(friendId);
incrementTransferCount(friendId);

// Manage favorites
toggleFavorite(friendId);

// Remove friend
removeFriend(friendId);
```

### Device-Friend Matching

```typescript
useEffect(() => {
  friends.forEach((friend) => {
    const device = devices.find(d =>
      // Match by public key in production
      d.name.includes(friend.name)
    );

    if (device) {
      setFriendOnline(friend.id, device.isOnline);
    }
  });
}, [devices, friends]);
```

## Component Props

### FriendsList

```typescript
interface FriendsListProps {
  onSelectFriend?: (friend: Friend) => void;
  selectedFiles?: File[];      // Enable Quick Send
  compact?: boolean;            // Compact mode
  limit?: number;               // Max friends to show
  className?: string;           // Custom CSS class
}
```

## State Shape

### Friend

```typescript
interface Friend {
  id: string;
  name: string;
  platform: Platform;
  publicKey: string;
  pairingCode: string;
  isOnline: boolean;
  lastSeen: number;
  isTrusted: boolean;           // Favorite status
  avatar: string | null;
  addedAt: number;
  notes: string | null;
  transferCount: number;
  lastTransferAt: number | null;
}
```

### Pairing Session

```typescript
interface PairingSession {
  id: string;
  code: string;                 // 8-char alphanumeric
  publicKey: string;
  createdAt: number;
  expiresAt: number;            // +5 minutes
  isActive: boolean;
}
```

## Files Modified

```
✓ lib/stores/friends-store.ts          - Enhanced pairing codes
✓ components/transfer/FriendsList.tsx  - Full featured component
✓ components/transfer/FriendsList.module.css - Complete styling
✓ app/transfer/page.tsx                - Integrated Friends tab
```

## API Endpoints (Production)

```typescript
// Generate pairing code
POST /api/friends/pairing-code
Response: { code: string, expiresAt: number }

// Validate and pair
POST /api/friends/pair
Body: { code: string, name: string, platform: string }
Response: { friend: Friend }

// Get friend status
GET /api/friends/:id/status
Response: { isOnline: boolean, lastSeen: number }

// Remove friend
DELETE /api/friends/:id
Response: { success: boolean }
```

## Security Notes

**Current (Demo):**
- Pairing codes use crypto.getRandomValues()
- 5-minute expiration
- 62^8 combinations (~218 trillion)

**Production Required:**
- Public key infrastructure
- Signed identity verification
- Secure code exchange (HTTPS)
- Rate limiting on validation
- Code revocation support

## Testing

```bash
# Unit tests
npm run test lib/stores/friends-store.test.ts

# Component tests
npm run test components/transfer/FriendsList.test.tsx

# E2E tests
npm run test:e2e friends-system.spec.ts
```

## Troubleshooting

**Friend not showing as online:**
- Check device discovery is running
- Verify friend's device is on same network
- Check name/platform matching logic

**Can't add friend:**
- Verify code is 8 characters
- Check code hasn't expired (5 min)
- Ensure name field is filled

**Quick Send not working:**
- Verify files are selected
- Check friend is online
- Ensure network connection

## Next Steps

1. Implement backend pairing validation
2. Add public key infrastructure
3. Support QR code scanning
4. Add friend groups
5. Implement friend search
6. Add friend sync across devices

## Resources

- [Friends Store Documentation](./lib/stores/friends-store.ts)
- [FriendsList Component](./components/transfer/FriendsList.tsx)
- [Transfer Page Integration](./app/transfer/page.tsx)
- [Complete Integration Guide](./FRIENDS_SYSTEM_INTEGRATION_COMPLETE.md)
