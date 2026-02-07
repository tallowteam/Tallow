# URL State Quick Reference

## Supported URL Parameters

### Room Code (`?room=`)

Auto-join a transfer room by room code.

**Format**: `/transfer?room=<ROOM_CODE>`

**Example**: `/transfer?room=ABC123`

**Behavior**:
- Automatically switches to "Internet" tab
- Auto-joins the specified room on page load
- Updates URL when room is created or joined
- Room codes are case-insensitive (converted to uppercase)

### View Mode (`?view=`)

Set the transfer list view mode.

**Format**: `/transfer?view=<grid|list>`

**Examples**:
- `/transfer?view=grid` (default, can be omitted)
- `/transfer?view=list`

**Behavior**:
- Initializes page with specified view mode
- Updates URL when view mode changes
- Defaults to 'grid' if not specified

### Combined Parameters

Multiple parameters can be used together.

**Format**: `/transfer?room=<CODE>&view=<MODE>`

**Example**: `/transfer?room=XYZ789&view=list`

**Behavior**:
- All parameters are applied independently
- Order doesn't matter
- Parameters are preserved across state changes

## Developer API

### Reading URL Parameters

```typescript
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const roomCode = searchParams.get('room');
const viewMode = searchParams.get('view');
```

### Updating URL Parameters

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Update single parameter
const params = new URLSearchParams(window.location.search);
params.set('room', 'ABC123');
router.push(`/transfer?${params.toString()}`, { scroll: false });

// Remove parameter
params.delete('room');
router.push(`/transfer?${params.toString()}`, { scroll: false });
```

### Auto-Join Room Example

```typescript
// In a component
const searchParams = useSearchParams();
const initialRoomCode = searchParams.get('room');

// Pass to RoomCodeConnect
<RoomCodeConnect
  initialRoomCode={initialRoomCode || undefined}
  onConnect={handleConnect}
/>
```

## Component Integration

### Transfer Page

**Location**: `app/transfer/page.tsx`

**Key Features**:
- Reads URL parameters on mount
- Updates URL when state changes
- Passes room code to RoomCodeConnect
- Handles view mode changes

### RoomCodeConnect

**Location**: `components/transfer/RoomCodeConnect.tsx`

**Key Features**:
- Accepts `initialRoomCode` prop
- Auto-joins room if initialRoomCode is provided
- Notifies parent via `onConnect` callback
- Handles auto-join errors gracefully

## Common Patterns

### Pattern 1: Share Room Link

```typescript
// When room is created
const shareableLink = `${window.location.origin}/transfer?room=${roomCode}`;

// Copy to clipboard
await navigator.clipboard.writeText(shareableLink);
```

### Pattern 2: Preserve State on Navigation

```typescript
// Always preserve existing parameters
const params = new URLSearchParams(window.location.search);
params.set('room', newRoomCode);

// Use { scroll: false } to prevent page jump
router.push(`/transfer?${params.toString()}`, { scroll: false });
```

### Pattern 3: Default Values

```typescript
// Use defaults for optional parameters
const viewMode = searchParams.get('view') || 'grid';
const roomCode = searchParams.get('room') || null;
```

## Turbopack Best Practices

### Avoid Infinite Loops

```typescript
// BAD - causes infinite loop
useEffect(() => {
  const { roomCode } = useRoomStore.getState();
  // ...
}, [useRoomStore]);

// GOOD - use selector outside effect
const roomCode = useRoomStore((state) => state.roomCode);
useEffect(() => {
  if (roomCode) {
    // ...
  }
}, [roomCode]);
```

### Wrapper Functions

```typescript
// Use wrapper functions for complex logic
useEffect(() => {
  const updateUrl = () => {
    if (roomCode) {
      // URL update logic
    }
  };

  updateUrl();
}, [roomCode]);
```

## Error Handling

### Invalid Room Code

```typescript
// RoomCodeConnect handles invalid codes
try {
  await joinRoom(roomCode);
} catch (err) {
  toast.error(`Failed to join room: ${err.message}`);
}
```

### Missing Parameters

```typescript
// Always provide fallbacks
const roomCode = searchParams.get('room') || undefined;

// Or use optional chaining
if (roomCode) {
  // Handle room code
}
```

## Testing Examples

### Test Auto-Join

```typescript
// Visit with room code
window.location.href = '/transfer?room=TEST123';

// Verify:
// 1. Internet tab is active
// 2. Room join is initiated
// 3. URL is updated
```

### Test View Mode

```typescript
// Visit with view mode
window.location.href = '/transfer?view=list';

// Verify:
// 1. View mode is set to list
// 2. URL is preserved
```

### Test Combined

```typescript
// Visit with both parameters
window.location.href = '/transfer?room=ABC123&view=list';

// Verify:
// 1. Room auto-join initiated
// 2. View mode is list
// 3. Both parameters preserved
```

## TypeScript Types

```typescript
// View mode type
type ViewMode = 'grid' | 'list';

// Share mode type
type ShareMode = 'nearby' | 'internet' | 'friends';

// RoomCodeConnect props
interface RoomCodeConnectProps {
  selectedFiles: File[];
  onConnect?: (roomCode: string) => void;
  initialRoomCode?: string;
}
```

## Debugging

### Console Logs

Look for these log messages:

```
[Transfer] Auto-joining room from URL: ABC123
[RoomCodeConnect] Auto-joining room from URL: ABC123
[Transfer] Updated URL with room code: ABC123
```

### URL Verification

Check current URL in browser:
```typescript
console.log('Current URL:', window.location.href);
console.log('Search params:', window.location.search);
```

### State Verification

Check state in React DevTools:
```typescript
// Transfer page state
- roomFromUrl
- viewFromUrl
- shareMode
- viewMode

// RoomCodeConnect state
- initialRoomCode
- isInRoom
- activeRoomCode
```

## Performance Tips

1. **Use { scroll: false }**: Prevents page jump on URL update
2. **Debounce rapid updates**: Avoid multiple URL updates in quick succession
3. **Use useRef for flags**: Prevent duplicate auto-join attempts
4. **Memoize callbacks**: Use useCallback for handlers

## Security Notes

- Room codes are public (designed to be shared)
- No sensitive data in URL parameters
- Server-side validation always required
- Auto-join respects all security checks

---

**Quick Links**:
- Full Documentation: [URL_STATE_IMPLEMENTATION.md](./URL_STATE_IMPLEMENTATION.md)
- Transfer Page: [app/transfer/page.tsx](./app/transfer/page.tsx)
- RoomCodeConnect: [components/transfer/RoomCodeConnect.tsx](./components/transfer/RoomCodeConnect.tsx)
