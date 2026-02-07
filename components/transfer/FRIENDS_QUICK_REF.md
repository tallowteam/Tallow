# Friends System - Quick Reference

## 1-Minute Setup

```tsx
// 1. Import
import { FriendsList } from '@/components/transfer';

// 2. Use
<FriendsList onSelectFriend={(friend) => console.log(friend)} />

// Done!
```

## Store API

### Import
```typescript
import { useFriendsStore } from '@/lib/stores';
```

### Common Actions
```typescript
const {
  // Data
  friends,
  getOnlineFriends,
  getTrustedFriends,

  // Actions
  addFriend,
  removeFriend,
  generatePairingCode,
  setFriendOnline,
  incrementTransferCount,
} = useFriendsStore();
```

### Quick Examples

**Get online friends count**
```typescript
const onlineCount = useFriendsStore(state => state.getOnlineFriends().length);
```

**Generate pairing code**
```typescript
const session = useFriendsStore(state => state.generatePairingCode());
console.log('Share code:', session.code); // e.g., "123456"
```

**Check if friend is trusted**
```typescript
const isTrusted = useFriendsStore(state =>
  state.getTrustedFriends().some(f => f.id === friendId)
);
```

**Track transfer**
```typescript
useFriendsStore.getState().incrementTransferCount(friendId);
```

## Component Props

```typescript
<FriendsList
  onSelectFriend={(friend) => {}}  // Required callback
  compact={false}                   // Optional: compact mode
  limit={10}                        // Optional: max display
  className="custom"                // Optional: CSS class
/>
```

## Types

```typescript
interface Friend {
  id: string;
  name: string;
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web';
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
```

## Common Patterns

### Auto-accept from trusted friends
```typescript
function handleIncomingTransfer(senderId: string, files: File[]) {
  const trusted = useFriendsStore.getState().getTrustedFriends();
  if (trusted.some(f => f.id === senderId)) {
    acceptTransfer(files);
    useFriendsStore.getState().incrementTransferCount(senderId);
  }
}
```

### Update status from device discovery
```typescript
useEffect(() => {
  devices.forEach(device => {
    const friend = friends.find(f => f.id === device.id);
    if (friend) {
      setFriendOnline(friend.id, device.isOnline);
    }
  });
}, [devices, friends, setFriendOnline]);
```

### Search friends
```typescript
const results = useFriendsStore.getState().searchFriends('alice');
```

### Get recent friends
```typescript
const recent = useFriendsStore.getState().getRecentFriends(5);
```

## Pairing Flow

**Sender (generates code):**
```typescript
const session = generatePairingCode();
// Share session.code with friend
// Code expires in 5 minutes
```

**Receiver (enters code):**
```typescript
// User enters code in UI
// On successful pairing:
addFriend({
  id: remotePeerId,
  name: remotePeerName,
  platform: remotePeerPlatform,
  publicKey: remotePeerPublicKey,
  pairingCode: enteredCode,
  isOnline: true,
  lastSeen: Date.now(),
  isTrusted: false,
  avatar: null,
  addedAt: Date.now(),
  notes: null,
  transferCount: 0,
  lastTransferAt: null,
});
```

## CSS Variables

```css
--color-zinc-900: #18181b    /* Background */
--color-zinc-800: #27272a    /* Hover */
--color-zinc-400: #a1a1aa    /* Text secondary */
--color-zinc-100: #f4f4f5    /* Text primary */
--color-purple:   #5e5ce6    /* Accent */
```

## Styling Override

```tsx
<FriendsList className="my-friends" />
```

```css
/* Override in your CSS */
.my-friends {
  max-width: 600px;
}
```

## Events to Handle

1. **Friend Selected** → Start transfer
2. **Friend Added** → Show notification
3. **Friend Removed** → Clean up connections
4. **Status Changed** → Update UI
5. **Transfer Complete** → Increment count

## Storage

- **Key:** `tallow-friends-store`
- **Data:** Friends array + blocked IDs
- **Size:** ~1-10KB (depending on friend count)
- **Expiry:** None (persists until cleared)

## Security Notes

⚠️ **Current:** Placeholder crypto (dev only)
✅ **Production:** Replace with real key exchange

```typescript
// TODO: Replace in production
import { generateKeyPair } from '@/lib/crypto';

async function generatePublicKey() {
  const { publicKey } = await generateKeyPair();
  return publicKey;
}
```

## Performance Tips

1. **Use selectors** for specific data
   ```typescript
   const online = useFriendsStore(state => state.getOnlineFriends());
   ```

2. **Debounce search**
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce(searchFriends, 300),
     []
   );
   ```

3. **Limit list display**
   ```typescript
   <FriendsList limit={10} />
   ```

## Debugging

```typescript
// Log all friends
console.log(useFriendsStore.getState().friends);

// Log store state
console.log(useFriendsStore.getState());

// Subscribe to changes
useFriendsStore.subscribe(
  state => state.friends,
  friends => console.log('Friends updated:', friends)
);
```

## Testing

```typescript
import { useFriendsStore } from '@/lib/stores/friends-store';

test('adds friend', () => {
  const friend: Friend = { /* ... */ };
  useFriendsStore.getState().addFriend(friend);
  expect(useFriendsStore.getState().friends).toContain(friend);
});
```

## File Locations

```
lib/stores/friends-store.ts
components/transfer/FriendsList.tsx
components/transfer/FriendsList.module.css
```

## Import Paths

```typescript
// Store
import { useFriendsStore, type Friend } from '@/lib/stores';

// Component
import { FriendsList } from '@/components/transfer';

// Direct imports
import { useFriendsStore } from '@/lib/stores/friends-store';
import { FriendsList } from '@/components/transfer/FriendsList';
```

## Common Issues

**Friends not persisting?**
- Check localStorage quota
- Verify safe storage is working
- Check browser console for errors

**Pairing code not generating?**
- Verify Date.now() is working
- Check Math.random() functionality
- Ensure store is initialized

**Online status not updating?**
- Call `setFriendOnline(id, status)` when devices change
- Integrate with device discovery
- Implement polling or WebSocket updates

## Next Steps

1. ✅ Basic integration
2. ⚠️ Connect to device discovery
3. ⚠️ Implement real crypto
4. ⚠️ Add backend sync
5. ⚠️ Write tests

## Help

- 📖 Full docs: `FRIENDS_SYSTEM_README.md`
- 🎨 Visual guide: `FRIENDS_VISUAL_GUIDE.md`
- 💼 Example: `FriendsExample.tsx`
- 📦 Delivery: `FRIENDS_SYSTEM_DELIVERY.md`

---

**Quick Start:** Copy empty state example → Add callback → Done! 🎉
