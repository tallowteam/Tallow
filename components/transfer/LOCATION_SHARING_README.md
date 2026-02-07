# Location Sharing for Chat Messages

Privacy-first location sharing implementation for Tallow's encrypted chat system.

## Features

- **Privacy Controls**: Optional ~1km accuracy reduction for approximate location sharing
- **End-to-End Encrypted**: Location data encrypted with session keys like all chat messages
- **Platform-Aware**: Opens Google Maps (Android/web) or Apple Maps (iOS) based on platform
- **Static Map Previews**: OpenStreetMap tiles for location visualization
- **Permission Management**: Graceful handling of browser permission states
- **Error Recovery**: User-friendly error messages and retry mechanisms

## Architecture

```
lib/geo/location-sharing.ts          # Core geolocation utilities
components/transfer/
  ├── LocationShare.tsx              # Location sharing modal UI
  ├── LocationShare.module.css       # Location share styles
  ├── LocationMessage.tsx            # Display location in chat
  ├── LocationMessage.module.css     # Location message styles
  └── ChatWithLocationExample.tsx    # Integration example
```

## Core Library (`lib/geo/location-sharing.ts`)

### Functions

#### `isGeolocationAvailable(): boolean`
Check if browser supports geolocation.

```typescript
if (isGeolocationAvailable()) {
  // Proceed with location features
}
```

#### `getCurrentLocation(options?): Promise<GeolocationResult>`
Get current device location.

```typescript
const location = await getCurrentLocation({
  enableHighAccuracy: true,
  timeout: 15000,
  reduceAccuracy: true, // Privacy mode: ~1km accuracy
});

console.log(location);
// {
//   latitude: 40.7128,
//   longitude: -74.0060,
//   accuracy: 1100,
//   timestamp: 1234567890
// }
```

**Options:**
- `enableHighAccuracy`: Use GPS for higher accuracy (default: true)
- `timeout`: Max time in ms to get location (default: 10000)
- `maximumAge`: Accept cached position within ms (default: 0)
- `reduceAccuracy`: Privacy mode - reduce to ~1km (default: false)

**Throws:** `GeolocationPositionError` if permission denied, unavailable, or timeout

#### `formatCoordinates(lat, lng): string`
Format coordinates as human-readable string.

```typescript
formatCoordinates(40.7128, -74.0060);
// "40.7128° N, 74.0060° W"
```

#### `getStaticMapUrl(lat, lng, zoom?, width?, height?): string`
Generate OpenStreetMap static tile URL for previews.

```typescript
const mapUrl = getStaticMapUrl(40.7128, -74.0060, 14, 300, 200);
// Returns URL to 300x200 map image at zoom level 14
```

#### `calculateDistance(a, b): number`
Calculate distance between two locations using Haversine formula.

```typescript
const distance = calculateDistance(locationA, locationB);
console.log(`Distance: ${distance}m`);
```

#### `formatDistance(meters): number`
Format distance for display (auto-converts km).

```typescript
formatDistance(500);    // "500m"
formatDistance(2500);   // "2.5km"
```

#### `getMapsUrl(lat, lng): string`
Get platform-specific maps URL.

```typescript
const url = getMapsUrl(40.7128, -74.0060);
// iOS: maps://maps.apple.com/?q=40.7128,-74.0060
// Android/Web: https://www.google.com/maps/search/?api=1&query=40.7128,-74.0060
```

#### `getLocationPermissionState(): Promise<PermissionState>`
Check current permission state.

```typescript
const state = await getLocationPermissionState();
// 'granted' | 'denied' | 'prompt' | 'unsupported'
```

#### `getGeolocationErrorMessage(error): string`
Convert GeolocationPositionError to user-friendly message.

```typescript
try {
  await getCurrentLocation();
} catch (error) {
  const message = getGeolocationErrorMessage(error);
  console.error(message);
}
```

## Components

### `LocationShare`
Modal for requesting and previewing location before sharing.

**Props:**
```typescript
interface LocationShareProps {
  onShare: (location: GeolocationResult) => void;
  onCancel: () => void;
  isOpen: boolean;
}
```

**Usage:**
```tsx
import LocationShare from '@/components/transfer/LocationShare';

function ChatPanel() {
  const [isLocationShareOpen, setIsLocationShareOpen] = useState(false);

  const handleShare = (location: GeolocationResult) => {
    // Send location via chat
    chatManager.sendLocationMessage(location);
    setIsLocationShareOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsLocationShareOpen(true)}>
        Share Location
      </button>

      <LocationShare
        isOpen={isLocationShareOpen}
        onShare={handleShare}
        onCancel={() => setIsLocationShareOpen(false)}
      />
    </>
  );
}
```

**States:**
1. **Initial**: Privacy toggle and "Get Location" button
2. **Loading**: Spinner while acquiring GPS fix
3. **Preview**: Map preview with coordinates and share/cancel buttons
4. **Error**: Error message with retry option

### `LocationMessage`
Display shared location in chat message bubbles.

**Props:**
```typescript
interface LocationMessageProps {
  location: GeolocationResult;
  isSent?: boolean; // Styling for sent vs received
}
```

**Usage:**
```tsx
import LocationMessage from '@/components/transfer/LocationMessage';

function ChatMessage({ message }) {
  if (message.type === 'location' && message.location) {
    return (
      <LocationMessage
        location={message.location}
        isSent={message.senderId === currentUserId}
      />
    );
  }

  return <div>{message.content}</div>;
}
```

**Features:**
- Static map preview (280x160px)
- Formatted coordinates
- Accuracy badge
- "Open in Maps" button

## Integration Guide

### 1. Update ChatMessage Type

Add location support to `lib/chat/chat-manager.ts`:

```typescript
export type MessageType = 'text' | 'file' | 'location' | 'emoji' | 'system';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: Date;

  // Add location field
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
}
```

### 2. Add sendLocationMessage to ChatManager

In `lib/chat/chat-manager.ts`:

```typescript
import { GeolocationResult, formatCoordinates } from '@/lib/geo/location-sharing';

export class ChatManager {
  // ... existing code

  async sendLocationMessage(location: GeolocationResult): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content: `Shared location: ${formatCoordinates(location.latitude, location.longitude)}`,
      type: 'location',
      status: 'sending',
      timestamp: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      },
    };

    // Save to IndexedDB
    await this.storage.saveMessage(message);

    // Emit event
    this.emitEvent({ type: 'message', message });

    // Encrypt and send via DataChannel
    const payload = JSON.stringify({
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp.toISOString(),
      location: message.location,
    });

    const encrypted = await this.encryption.encryptMessage(payload);
    const hmac = await this.signMessage(encrypted.ciphertext, encrypted.nonce);

    this.sendProtocolMessage({
      type: 'chat-message',
      payload: {
        encrypted: Array.from(encrypted.ciphertext),
        nonce: Array.from(encrypted.nonce),
        messageId: message.id,
        hmac,
        sequence: this.outgoingSequence++,
      },
    });

    // Update status to sent
    message.status = 'sent';
    await this.storage.updateMessageStatus(message.id, 'sent');
    this.emitEvent({ type: 'status-update', messageId: message.id, status: 'sent' });

    return message;
  }
}
```

### 3. Update useChat Hook

In `lib/hooks/use-chat.ts`:

```typescript
import { GeolocationResult } from '@/lib/geo/location-sharing';

export interface UseChatReturn {
  // ... existing properties
  sendLocation: (location: GeolocationResult) => Promise<ChatMessage>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  // ... existing code

  const sendLocation = useCallback(
    async (location: GeolocationResult): Promise<ChatMessage> => {
      if (!chatManagerRef.current) {
        throw new Error('Chat not initialized');
      }
      return chatManagerRef.current.sendLocationMessage(location);
    },
    []
  );

  return {
    // ... existing properties
    sendLocation,
  };
}
```

### 4. Update ChatPanel Component

In `components/transfer/ChatPanel.tsx`:

```tsx
import { useState } from 'react';
import LocationShare from './LocationShare';
import LocationMessage from './LocationMessage';
import type { GeolocationResult } from '@/lib/geo/location-sharing';

export default function ChatPanel(props: ChatPanelProps) {
  const [isLocationShareOpen, setIsLocationShareOpen] = useState(false);

  const { sendLocation } = useChat({
    // ... existing options
  });

  const handleShareLocation = async (location: GeolocationResult) => {
    try {
      await sendLocation(location);
      setIsLocationShareOpen(false);
    } catch (error) {
      console.error('[ChatPanel] Failed to send location:', error);
    }
  };

  return (
    <div className={styles.chatPanel}>
      {/* ... existing header and messages */}

      {/* Message rendering - update to support location */}
      {msgs.map((message) => (
        <div key={message.id} className={styles.messageWrapper}>
          {message.type === 'location' && message.location ? (
            <LocationMessage
              location={message.location}
              isSent={message.senderId === userId}
            />
          ) : (
            <div className={styles.messageBubble}>
              <div className={styles.messageContent}>
                {message.content}
              </div>
              {/* ... time and status */}
            </div>
          )}
        </div>
      ))}

      {/* Input Area - add location button */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <button
          type="button"
          className={styles.locationButton}
          onClick={() => setIsLocationShareOpen(true)}
          disabled={!isInitialized}
          aria-label="Share location"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>

        <input {...inputProps} />

        <button type="submit" {...sendButtonProps}>
          <svg>{/* send icon */}</svg>
        </button>
      </form>

      {/* Location Share Modal */}
      <LocationShare
        isOpen={isLocationShareOpen}
        onShare={handleShareLocation}
        onCancel={() => setIsLocationShareOpen(false)}
      />
    </div>
  );
}
```

### 5. Add Location Button Styles

In `components/transfer/ChatPanel.module.css`:

```css
.inputArea {
  display: flex;
  gap: 12px;
  /* ... existing styles */
}

.locationButton {
  background: transparent;
  border: 1px solid rgba(63, 63, 70, 0.4);
  border-radius: 10px;
  color: #a1a1aa;
  width: 44px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.locationButton:hover:not(:disabled) {
  background: rgba(63, 63, 70, 0.4);
  border-color: #5e5ce6;
  color: #8b89ff;
}

.locationButton:active:not(:disabled) {
  transform: scale(0.95);
}

.locationButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Privacy Considerations

### Accuracy Reduction
When "Share approximate location" is enabled:
- Coordinates rounded to 0.01 degrees (~1.1km at equator)
- Accuracy reported as 1100m
- Prevents exact address identification

### Permission Handling
1. Check permission state before requesting
2. Show appropriate error if denied
3. Guide user to browser settings if needed

### Data Storage
- Location data encrypted with session keys
- Stored in IndexedDB like all messages
- Auto-deleted with chat history

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Geolocation API | ✅ | ✅ | ✅ | ✅ |
| Permissions API | ✅ | ✅ | ⚠️ Partial | ✅ |
| Static Maps | ✅ | ✅ | ✅ | ✅ |

**Note:** Safari has limited Permissions API support. Fallback to direct geolocation call.

## Error Handling

### Common Errors

1. **Permission Denied**
   - User declined location access
   - Show settings guidance

2. **Position Unavailable**
   - GPS/network unavailable
   - Suggest retrying in better conditions

3. **Timeout**
   - Location acquisition took too long
   - Increase timeout or retry

4. **Not Supported**
   - Browser doesn't support geolocation
   - Hide location features

### Example Error Handler

```typescript
try {
  const location = await getCurrentLocation();
  handleShareLocation(location);
} catch (error) {
  if (error instanceof GeolocationPositionError) {
    const message = getGeolocationErrorMessage(error);
    showToast(message, 'error');
  }
}
```

## Performance Optimization

### Static Maps
- OpenStreetMap tiles cached by browser
- Lazy loading with `loading="lazy"` attribute
- Reasonable image sizes (280x160px)

### Geolocation
- Set reasonable timeout (15 seconds)
- Use `maximumAge` for acceptable cached positions
- `enableHighAccuracy: false` for faster results (when privacy mode enabled)

## Testing

### Manual Testing Checklist

- [ ] Location permission prompt appears
- [ ] Privacy toggle works correctly
- [ ] Map preview loads successfully
- [ ] Coordinates formatted properly
- [ ] "Open in Maps" opens correct app/site
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works on desktop browsers
- [ ] Error states display correctly
- [ ] Loading states show properly
- [ ] Sent vs received styling differs
- [ ] E2E encryption working
- [ ] Messages persist in IndexedDB

### Browser DevTools Testing

Enable sensor simulation in Chrome DevTools:
1. Open DevTools → More tools → Sensors
2. Set custom location coordinates
3. Test location sharing flow

## Security Notes

1. **HTTPS Required**: Geolocation API requires secure context
2. **User Consent**: Always explicit user action to share
3. **Encryption**: Location data encrypted in transit and storage
4. **No Server**: Location never sent to Tallow servers (P2P only)
5. **Temporary**: Deleted with chat session unless explicitly saved

## Future Enhancements

- [ ] Live location sharing (continuous updates)
- [ ] Custom map markers
- [ ] Distance calculation between users
- [ ] Location history timeline
- [ ] Nearby points of interest
- [ ] Offline map tiles caching
- [ ] Custom map styles
- [ ] Location-based notifications

## Related Files

- `lib/geo/location-sharing.ts` - Core utilities
- `components/transfer/LocationShare.tsx` - Share modal
- `components/transfer/LocationMessage.tsx` - Message display
- `components/transfer/ChatPanel.tsx` - Chat integration
- `lib/chat/chat-manager.ts` - Message handling
- `lib/hooks/use-chat.ts` - React hook

## Support

For issues or questions about location sharing:
1. Check browser console for errors
2. Verify HTTPS connection
3. Check browser permissions
4. Review integration guide
5. Test with example component

---

Built with privacy-first principles for Tallow's encrypted file transfer system.
