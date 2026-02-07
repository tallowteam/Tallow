# Friends/Contacts System Documentation

## Overview

The Friends/Contacts system provides a simplified way for users to pair devices and establish trusted connections. Once paired, friends can send files without entering pairing codes every time.

## Architecture

### Store: `lib/stores/friends-store.ts`

Zustand-based state management with localStorage persistence.

#### Key Features
- Persistent friend storage
- Pairing code generation (6-digit codes)
- Online/offline status tracking
- Trusted friend designation
- Transfer statistics
- Block list management
- Automatic cleanup of expired requests

#### Core Types

```typescript
interface Friend {
  id: string;
  name: string;
  platform: Platform;
  publicKey: string;
  pairingCode: string;
  isOnline: boolean;
  lastSeen: number;
  isTrusted: boolean;
  avatar: string | null;
  addedAt: number;
  notes: string | null;
  transferCount: number;
  lastTransferAt: number | null;
}

interface PairingSession {
  id: string;
  code: string;               // 6-digit code
  publicKey: string;
  createdAt: number;
  expiresAt: number;          // 5 minutes expiry
  isActive: boolean;
}
```

#### Store Actions

**Friend Management**
- `addFriend(friend: Friend)` - Add a new friend
- `updateFriend(id, updates)` - Update friend properties
- `removeFriend(id)` - Remove a friend
- `clearFriends()` - Clear all friends

**Status Management**
- `setFriendOnline(id, isOnline)` - Update online status
- `setFriendTrusted(id, isTrusted)` - Mark as trusted
- `updateFriendLastSeen(id)` - Update last seen timestamp
- `incrementTransferCount(id)` - Track successful transfers

**Pairing**
- `generatePairingCode()` - Generate new 6-digit code
- `cancelPairingSession()` - Cancel current session
- `validatePairingCode(code)` - Validate entered code

**Selectors**
- `getOnlineFriends()` - Get all online friends
- `getTrustedFriends()` - Get trusted friends
- `getRecentFriends(limit)` - Get friends by recent transfers
- `searchFriends(query)` - Search by name/platform/notes

### Component: `components/transfer/FriendsList.tsx`

React component for managing friends list UI.

#### Props

```typescript
interface FriendsListProps {
  onSelectFriend?: (friend: Friend) => void;
  compact?: boolean;
  limit?: number;
  className?: string;
}
```

#### Features

1. **Empty State**
   - Displays when no friends exist
   - Quick actions to add friends
   - User-friendly onboarding

2. **Friends List View**
   - Card-based layout
   - Online/offline indicators (green dot)
   - Platform icons
   - Last seen timestamps
   - Trusted badges
   - Transfer counts

3. **Add Friend Modal**
   - Generates 6-digit pairing code
   - Shows expiration countdown (5 minutes)
   - Allows code regeneration
   - Displays instructions

4. **Enter Code Modal**
   - Input for friend's 6-digit code
   - Real-time validation
   - Error handling
   - Auto-formats input

5. **Remove Friend Confirmation**
   - Uses ConfirmDialog component
   - Prevents accidental deletions
   - Clear warning message

## Usage Examples

### Basic Usage

```tsx
import { FriendsList } from '@/components/transfer';

export function TransferPage() {
  const handleSelectFriend = (friend: Friend) => {
    console.log('Selected friend:', friend);
    // Initiate transfer to friend
  };

  return (
    <div>
      <FriendsList onSelectFriend={handleSelectFriend} />
    </div>
  );
}
```

### Compact Mode with Limit

```tsx
<FriendsList
  compact
  limit={5}
  onSelectFriend={handleSelectFriend}
/>
```

### Using the Store Directly

```tsx
'use client';

import { useFriendsStore } from '@/lib/stores';
import { useEffect } from 'react';

export function FriendStatus() {
  const { friends, getOnlineFriends, setFriendOnline } = useFriendsStore();

  useEffect(() => {
    // Update friend status when device comes online
    const handleDeviceOnline = (deviceId: string) => {
      setFriendOnline(deviceId, true);
    };

    // Subscribe to device events
    // ...
  }, [setFriendOnline]);

  const onlineFriends = getOnlineFriends();

  return (
    <div>
      {onlineFriends.length} friends online
    </div>
  );
}
```

### Pairing Workflow

```tsx
'use client';

import { useFriendsStore } from '@/lib/stores';
import { Button } from '@/components/ui';

export function PairingExample() {
  const {
    generatePairingCode,
    currentPairingSession,
    addFriend
  } = useFriendsStore();

  const handleGenerateCode = () => {
    const session = generatePairingCode();
    console.log('Share this code:', session.code);
  };

  const handleAcceptPairing = (remotePeerData: any) => {
    // When remote peer connects with code
    const newFriend: Friend = {
      id: remotePeerData.id,
      name: remotePeerData.name,
      platform: remotePeerData.platform,
      publicKey: remotePeerData.publicKey,
      pairingCode: currentPairingSession!.code,
      isOnline: true,
      lastSeen: Date.now(),
      isTrusted: false,
      avatar: null,
      addedAt: Date.now(),
      notes: null,
      transferCount: 0,
      lastTransferAt: null,
    };

    addFriend(newFriend);
  };

  return (
    <div>
      <Button onClick={handleGenerateCode}>
        Generate Pairing Code
      </Button>
      {currentPairingSession && (
        <div>Code: {currentPairingSession.code}</div>
      )}
    </div>
  );
}
```

## Integration with Transfer System

### Auto-Accept from Trusted Friends

```tsx
import { useFriendsStore } from '@/lib/stores';

export function TransferManager() {
  const { getTrustedFriends, incrementTransferCount } = useFriendsStore();

  const handleIncomingTransfer = (senderId: string, files: File[]) => {
    const trustedFriends = getTrustedFriends();
    const isTrustedSender = trustedFriends.some(f => f.id === senderId);

    if (isTrustedSender) {
      // Auto-accept transfer
      acceptTransfer(files);
      incrementTransferCount(senderId);
    } else {
      // Show confirmation dialog
      showTransferConfirmation(senderId, files);
    }
  };
}
```

### Friend-Based Device Discovery

```tsx
import { useFriendsStore } from '@/lib/stores';
import { useDeviceStore } from '@/lib/stores';

export function DiscoveryWithFriends() {
  const { friends, setFriendOnline } = useFriendsStore();
  const { devices } = useDeviceStore();

  useEffect(() => {
    // Match discovered devices with friends
    devices.forEach(device => {
      const friend = friends.find(f => f.id === device.id);
      if (friend && friend.isOnline !== device.isOnline) {
        setFriendOnline(friend.id, device.isOnline);
      }
    });
  }, [devices, friends, setFriendOnline]);
}
```

## Styling

The component uses CSS Modules with dark theme and purple accent color (#5E5CE6).

### CSS Variables Used

```css
--color-zinc-900: #18181b (backgrounds)
--color-zinc-800: #27272a (hover states)
--color-zinc-700: #3f3f46 (borders)
--color-zinc-400: #a1a1aa (secondary text)
--color-zinc-100: #f4f4f5 (primary text)
--color-purple: #5e5ce6 (accent)
```

### Customization

Override styles by passing a className:

```tsx
<FriendsList className="my-custom-friends-list" />
```

Or modify the CSS Module directly:

```css
/* Custom styles */
.friendCard {
  border-radius: 1rem;
  padding: 1.5rem;
}
```

## Security Considerations

### Current Implementation
- Simple public key generation (placeholder)
- 6-digit pairing codes
- 5-minute session expiration
- Block list support

### Production Recommendations

1. **Replace Public Key Generation**
   ```typescript
   // Use actual crypto library
   import { generateKeyPair } from '@/lib/crypto';

   async function generatePublicKey(): Promise<string> {
     const { publicKey } = await generateKeyPair();
     return publicKey;
   }
   ```

2. **Secure Pairing Flow**
   - Use WebRTC for key exchange
   - Implement mutual authentication
   - Verify public keys via signaling server
   - Add optional PIN protection

3. **Friend Verification**
   - Display key fingerprints
   - Allow manual verification
   - Show security indicators
   - Warn on key changes

4. **Storage Encryption**
   ```typescript
   // Encrypt friend data before storage
   const encryptedFriends = await encrypt(friends, masterKey);
   localStorage.setItem('friends', encryptedFriends);
   ```

## Performance

### Optimizations Implemented
- Selector-based re-render prevention
- Debounced search
- Lazy pairing session cleanup
- Efficient array operations
- CSS animations for smooth UX

### Monitoring

```typescript
import { useFriendsStore } from '@/lib/stores';

// Track store performance
const unsubscribe = useFriendsStore.subscribe(
  (state) => state.friends,
  (friends) => {
    console.log('Friends updated:', friends.length);
  }
);
```

## Testing

### Unit Test Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFriendsStore } from '@/lib/stores/friends-store';

describe('Friends Store', () => {
  it('should add friend', () => {
    const { result } = renderHook(() => useFriendsStore());

    const friend: Friend = {
      id: 'test-1',
      name: 'Test Friend',
      platform: 'web',
      // ... other properties
    };

    act(() => {
      result.current.addFriend(friend);
    });

    expect(result.current.friends).toHaveLength(1);
    expect(result.current.friends[0].name).toBe('Test Friend');
  });

  it('should generate pairing code', () => {
    const { result } = renderHook(() => useFriendsStore());

    act(() => {
      result.current.generatePairingCode();
    });

    expect(result.current.currentPairingSession).toBeDefined();
    expect(result.current.currentPairingSession?.code).toMatch(/^\d{6}$/);
  });
});
```

### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendsList } from './FriendsList';

describe('FriendsList', () => {
  it('should show empty state when no friends', () => {
    render(<FriendsList />);
    expect(screen.getByText('No friends yet')).toBeInTheDocument();
  });

  it('should open add friend modal', () => {
    render(<FriendsList />);

    const addButton = screen.getByText('Generate Pairing Code');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Friend')).toBeInTheDocument();
  });
});
```

## Roadmap

### Phase 1 (Current)
- ✅ Basic friend management
- ✅ Pairing code system
- ✅ Online/offline tracking
- ✅ UI component

### Phase 2 (Next)
- [ ] Real crypto key generation
- [ ] WebRTC-based pairing
- [ ] Friend verification flow
- [ ] Import/export friends

### Phase 3 (Future)
- [ ] Friend groups
- [ ] Custom nicknames
- [ ] Friend notes/tags
- [ ] Transfer history per friend
- [ ] Friend analytics

## Support

For issues or questions:
1. Check existing documentation
2. Review code comments
3. Search for similar patterns in device-store.ts
4. Test with provided examples

## File Locations

```
lib/stores/
  ├── friends-store.ts          # Zustand store
  └── index.ts                   # Export barrel (updated)

components/transfer/
  ├── FriendsList.tsx            # React component
  ├── FriendsList.module.css     # Component styles
  └── index.ts                   # Export barrel (updated)
```

## Quick Start Checklist

- [x] Store created with persistence
- [x] Component with empty state
- [x] Add friend via pairing code
- [x] Enter friend's code
- [x] Remove friend confirmation
- [x] Online/offline indicators
- [x] Trusted friend badges
- [x] Dark theme styling
- [x] Responsive design
- [x] Accessibility support
- [x] Store exports updated
- [x] Component exports updated

## Next Steps

1. **Integrate with Transfer Flow**
   - Add friend selection to transfer page
   - Implement auto-accept for trusted friends
   - Track transfers per friend

2. **Add Friend Discovery**
   - Match discovered devices with friends
   - Update online status in real-time
   - Show friend indicators in device list

3. **Enhance Security**
   - Implement real key exchange
   - Add verification flow
   - Enable end-to-end encryption

4. **Add Tests**
   - Unit tests for store
   - Component tests
   - Integration tests
   - E2E tests

Enjoy the friends system! 🎉
