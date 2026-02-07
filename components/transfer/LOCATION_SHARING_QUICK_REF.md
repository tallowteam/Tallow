# Location Sharing Quick Reference

## Import

```typescript
// Core utilities
import {
  getCurrentLocation,
  isGeolocationAvailable,
  formatCoordinates,
  getStaticMapUrl,
  getMapsUrl,
  calculateDistance,
  formatDistance,
  getLocationPermissionState,
  getGeolocationErrorMessage,
  type GeolocationResult,
} from '@/lib/geo/location-sharing';

// Components
import LocationShare from '@/components/transfer/LocationShare';
import LocationMessage from '@/components/transfer/LocationMessage';
```

## Basic Usage

### Get Current Location

```typescript
// Simple
const location = await getCurrentLocation();

// With privacy mode
const location = await getCurrentLocation({
  reduceAccuracy: true, // ~1km accuracy
});

// With options
const location = await getCurrentLocation({
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
  reduceAccuracy: false,
});
```

### Check Availability

```typescript
if (isGeolocationAvailable()) {
  // Show location features
}
```

### Format Coordinates

```typescript
formatCoordinates(40.7128, -74.0060);
// "40.7128° N, 74.0060° W"
```

### Get Map URL

```typescript
const mapUrl = getStaticMapUrl(lat, lng);
const mapUrl = getStaticMapUrl(lat, lng, 15, 600, 400);
```

### Calculate Distance

```typescript
const meters = calculateDistance(locationA, locationB);
const formatted = formatDistance(meters); // "2.5km"
```

### Open in Maps

```typescript
const url = getMapsUrl(lat, lng);
window.open(url, '_blank');
```

## Components

### LocationShare Modal

```tsx
const [isOpen, setIsOpen] = useState(false);

<LocationShare
  isOpen={isOpen}
  onShare={(location) => {
    console.log(location);
    setIsOpen(false);
  }}
  onCancel={() => setIsOpen(false)}
/>
```

### LocationMessage Display

```tsx
<LocationMessage
  location={{
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 100,
    timestamp: Date.now(),
  }}
  isSent={true}
/>
```

## Error Handling

```typescript
try {
  const location = await getCurrentLocation();
} catch (error) {
  if (error instanceof GeolocationPositionError) {
    const message = getGeolocationErrorMessage(error);
    alert(message);
  }
}
```

## Permission Check

```typescript
const state = await getLocationPermissionState();

switch (state) {
  case 'granted':
    // Proceed
    break;
  case 'denied':
    // Show settings guide
    break;
  case 'prompt':
    // Will prompt on getCurrentLocation()
    break;
  case 'unsupported':
    // Hide location features
    break;
}
```

## Chat Integration

### Update Message Type

```typescript
interface ChatMessage {
  // ... existing fields
  type: 'text' | 'file' | 'location' | 'system';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
}
```

### Send Location

```typescript
const sendLocation = async (location: GeolocationResult) => {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    type: 'location',
    content: formatCoordinates(location.latitude, location.longitude),
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    },
    // ... other fields
  };

  await chatManager.sendMessage(message);
};
```

### Render Location Message

```tsx
{message.type === 'location' && message.location ? (
  <LocationMessage
    location={message.location}
    isSent={message.senderId === currentUserId}
  />
) : (
  <div>{message.content}</div>
)}
```

## ChatPanel Integration

```tsx
function ChatPanel() {
  const [isLocationShareOpen, setIsLocationShareOpen] = useState(false);
  const { sendLocation } = useChat();

  return (
    <>
      {/* Input area */}
      <div className={styles.inputArea}>
        {/* Location button */}
        <button onClick={() => setIsLocationShareOpen(true)}>
          📍
        </button>

        <input {...inputProps} />
        <button type="submit">Send</button>
      </div>

      {/* Location share modal */}
      <LocationShare
        isOpen={isLocationShareOpen}
        onShare={async (location) => {
          await sendLocation(location);
          setIsLocationShareOpen(false);
        }}
        onCancel={() => setIsLocationShareOpen(false)}
      />
    </>
  );
}
```

## Privacy Mode

```typescript
// Exact location (default)
const location = await getCurrentLocation({
  reduceAccuracy: false,
});
// accuracy: 5-50m

// Approximate location (privacy mode)
const location = await getCurrentLocation({
  reduceAccuracy: true,
});
// accuracy: ~1100m (~1km)
```

## Common Patterns

### With Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

const getLocation = async () => {
  setIsLoading(true);
  try {
    const location = await getCurrentLocation();
    handleLocation(location);
  } catch (error) {
    handleError(error);
  } finally {
    setIsLoading(false);
  }
};
```

### With Toast Notifications

```tsx
import { useToast } from '@/components/ui/ToastProvider';

const { showToast } = useToast();

try {
  const location = await getCurrentLocation();
  showToast('Location acquired', 'success');
} catch (error) {
  const message = getGeolocationErrorMessage(error);
  showToast(message, 'error');
}
```

### Timeout Handling

```typescript
try {
  const location = await getCurrentLocation({
    timeout: 15000, // 15 seconds
  });
} catch (error) {
  if (error.code === GeolocationPositionError.TIMEOUT) {
    showToast('Location timeout. Try again in better conditions.', 'error');
  }
}
```

## CSS Variables

```css
/* Location Share Modal */
--location-overlay-bg: rgba(0, 0, 0, 0.7);
--location-modal-bg: #18181b;
--location-border: rgba(63, 63, 70, 0.4);
--location-primary: #5e5ce6;
--location-text: #fafafa;

/* Location Message */
--location-msg-bg-sent: rgba(94, 92, 230, 0.1);
--location-msg-bg-received: #27272a;
--location-map-height: 160px;
```

## File Structure

```
lib/geo/
  └── location-sharing.ts              # Core utilities

components/transfer/
  ├── LocationShare.tsx                # Share modal
  ├── LocationShare.module.css         # Modal styles
  ├── LocationMessage.tsx              # Message display
  ├── LocationMessage.module.css       # Message styles
  ├── ChatWithLocationExample.tsx      # Example integration
  ├── LOCATION_SHARING_README.md       # Full docs
  └── LOCATION_SHARING_QUICK_REF.md    # This file
```

## API Reference

### GeolocationResult

```typescript
interface GeolocationResult {
  latitude: number;        // Decimal degrees
  longitude: number;       // Decimal degrees
  accuracy: number;        // Meters
  timestamp: number;       // Unix timestamp
}
```

### LocationSharingOptions

```typescript
interface LocationSharingOptions {
  enableHighAccuracy?: boolean;  // Use GPS (default: true)
  timeout?: number;              // Max wait ms (default: 10000)
  maximumAge?: number;           // Accept cached ms (default: 0)
  reduceAccuracy?: boolean;      // Privacy mode (default: false)
}
```

### LocationShareProps

```typescript
interface LocationShareProps {
  isOpen: boolean;
  onShare: (location: GeolocationResult) => void;
  onCancel: () => void;
}
```

### LocationMessageProps

```typescript
interface LocationMessageProps {
  location: GeolocationResult;
  isSent?: boolean;
}
```

## Key Features

✅ Privacy-first (optional ~1km accuracy reduction)
✅ E2E encrypted
✅ Platform-aware maps integration
✅ Static map previews
✅ Permission management
✅ Error recovery
✅ Loading states
✅ WCAG compliant
✅ Responsive design
✅ Dark theme

## Browser Support

- Chrome/Edge 5+
- Firefox 3.5+
- Safari 5+
- iOS Safari 3.2+
- Android Browser 2.1+

## Security

- HTTPS required
- User consent required
- E2E encrypted in transit
- Encrypted at rest (IndexedDB)
- Never sent to servers (P2P only)

## Performance

- Static map images cached
- Lazy loading enabled
- Reasonable timeouts
- Optional accuracy for speed

---

See `LOCATION_SHARING_README.md` for full documentation.
