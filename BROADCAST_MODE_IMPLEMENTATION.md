# Broadcast Mode Implementation

## Overview
Broadcast mode enables sending files to ALL discovered devices simultaneously with a single click. This feature wraps the existing `GroupTransferManager` to provide a streamlined broadcast experience.

## Architecture

### 1. Broadcast Transfer Module (`lib/transfer/broadcast-transfer.ts`)
A plain TypeScript module (NOT a hook) that provides broadcast functionality.

**Key Features:**
- Uses `useDeviceStore.getState()` for non-reactive device access (avoids Turbopack infinite loops)
- Wraps `GroupTransferManager` for multi-device transfers
- Filters devices (excludes self by default)
- Provides broadcast status tracking
- Independent progress monitoring per recipient

**Core Functions:**
```typescript
// Create broadcast instance
const broadcast = createBroadcastTransfer(options);

// Start broadcast
const result = await broadcast.start(file);

// Get status
const status = broadcast.getStatus();

// Stop broadcast
broadcast.stop();

// Cleanup
broadcast.destroy();
```

**Convenience Functions:**
```typescript
// One-off broadcast
const result = await broadcastFile(file, options);

// Check device count
const count = getBroadcastDeviceCount();

// Check availability (2+ devices required)
const available = isBroadcastAvailable();
```

### 2. UI Component Updates (`components/transfer/DeviceDiscovery.tsx`)

**Added Features:**
- "Send to All" button appears when 2+ devices are available
- Button shows device count: "Send to All (3 devices)"
- Disabled state during broadcast with "Broadcasting..." text
- Optional `onBroadcastStart` callback for parent notification
- Broadcast icon with visual feedback

**Props Interface:**
```typescript
interface DeviceDiscoveryProps {
  selectedFiles: File[];
  onDeviceSelect: (device: Device) => void;
  onBroadcastStart?: () => void; // NEW: Broadcast notification
}
```

**State Management:**
```typescript
const [isBroadcasting, setIsBroadcasting] = useState(false);
const broadcastableDevices = onlineDevices.filter((d) => d.id !== 'this-device');
const canBroadcast = broadcastableDevices.length >= 2 && selectedFiles.length > 0;
```

### 3. Styling (`components/transfer/DeviceDiscovery.module.css`)

**New Styles:**
- `.broadcastContainer` - Wrapper with purple gradient background
- `.broadcastButton` - Gradient button with glow effects
- `.broadcastHint` - Helper text below button
- `.statusActions` - Action button container
- `@keyframes broadcast-pulse` - Pulsing glow animation
- Reduced motion support

**Design Tokens:**
- Purple accent: `#5E5CE6` to `#7B79FF`
- Dark theme with glassmorphism
- Smooth transitions (0.3s cubic-bezier)
- Accessibility-first (focus states, ARIA labels)

## Usage Example

### Basic Implementation
```tsx
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';

function TransferPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDeviceSelect = (device: Device) => {
    // Handle single device selection
    console.log('Selected device:', device);
  };

  const handleBroadcastStart = () => {
    // Optional: Show toast, update UI, etc.
    console.log('Broadcast started');
  };

  return (
    <DeviceDiscovery
      selectedFiles={selectedFiles}
      onDeviceSelect={handleDeviceSelect}
      onBroadcastStart={handleBroadcastStart}
    />
  );
}
```

### Advanced Custom Implementation
```tsx
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';

async function handleCustomBroadcast(file: File) {
  const broadcast = createBroadcastTransfer({
    // Bandwidth limit per recipient (bytes/sec)
    bandwidthLimitPerRecipient: 1024 * 1024 * 10, // 10 MB/s

    // Exclude specific devices
    excludeDeviceIds: ['device-id-to-skip'],

    // Include self (default: false)
    includeSelf: false,

    // Progress callbacks
    onRecipientProgress: (recipientId, progress, speed) => {
      console.log(`${recipientId}: ${progress}% at ${speed} bytes/sec`);
    },

    onRecipientComplete: (recipientId) => {
      console.log(`${recipientId}: Complete!`);
    },

    onRecipientError: (recipientId, error) => {
      console.error(`${recipientId}: Failed`, error);
    },

    onOverallProgress: (progress) => {
      console.log(`Overall: ${progress}%`);
    },

    onComplete: (result) => {
      console.log('Broadcast complete:', result);
      // result.successfulRecipients
      // result.failedRecipients
      // result.totalTime
    },
  });

  try {
    const result = await broadcast.start(file);
    console.log('Success:', result);
  } catch (error) {
    console.error('Broadcast failed:', error);
  } finally {
    broadcast.destroy();
  }
}
```

## Security Considerations

### Input Validation
- All recipient data validated with Zod schema
- Maximum 10 recipients enforced
- File size validation (no empty files)
- Device ID sanitization

### Encryption
- Each recipient gets independent PQC encryption
- ML-KEM-768 + X25519 hybrid key exchange
- ChaCha20-Poly1305 for data encryption
- No key reuse across recipients

### Privacy
- Self-device excluded by default
- Optional device filtering
- Secure logging (no sensitive data)
- Memory cleanup on completion

## Performance

### Optimizations
- Parallel transfers to all recipients
- Independent WebRTC data channels
- Bandwidth management per recipient
- Event-based progress (no polling)
- Efficient state updates

### Resource Management
- Maximum 10 concurrent recipients
- Configurable bandwidth limits
- Automatic cleanup on completion
- Memory-safe device filtering

## Error Handling

### Graceful Degradation
- Individual recipient failures don't stop broadcast
- Partial success tracking (some succeed, some fail)
- Detailed error reporting per recipient
- Automatic cleanup on errors

### Status Reporting
```typescript
interface BroadcastTransferResult {
  broadcastId: string;
  fileName: string;
  totalRecipients: number;
  successfulRecipients: string[];
  failedRecipients: Array<{ id: string; error: AppError }>;
  totalTime: number;
  totalDevicesDiscovered: number;
  devicesIncluded: number;
  devicesExcluded: number;
}
```

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML buttons
- ARIA labels: `aria-label="Send to all 3 devices"`
- Keyboard navigation support
- Focus indicators (2px solid outline)
- Screen reader announcements
- Reduced motion support

### Visual Feedback
- Button disabled during broadcast
- Loading spinner icon
- Progress indication
- Success/error states
- Color contrast > 4.5:1

## Testing Checklist

### Unit Tests
- [ ] Device filtering logic
- [ ] Broadcast availability check
- [ ] Error handling
- [ ] State management
- [ ] Cleanup on destroy

### Integration Tests
- [ ] Multi-device transfers
- [ ] Partial failure handling
- [ ] Progress callbacks
- [ ] Bandwidth limiting
- [ ] Memory cleanup

### E2E Tests
- [ ] UI button appearance (2+ devices)
- [ ] Broadcast initiation
- [ ] Progress indication
- [ ] Success notification
- [ ] Error recovery

### Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management
- [ ] Color contrast
- [ ] Reduced motion

## File Locations

### Implementation Files
```
lib/transfer/broadcast-transfer.ts          (New - 350 lines)
components/transfer/DeviceDiscovery.tsx     (Modified)
components/transfer/DeviceDiscovery.module.css (Modified)
```

### Dependencies
```
lib/transfer/group-transfer-manager.ts      (Existing)
lib/stores/device-store.ts                  (Existing)
lib/utils/uuid.ts                           (Existing)
lib/utils/secure-logger.ts                  (Existing)
lib/types.ts                                (Existing)
```

## Critical Implementation Notes

### NEVER Use Hook Subscriptions in Plain Functions
```typescript
// ❌ WRONG - Causes Turbopack infinite loop
const devices = useDeviceStore();

// ✅ CORRECT - Use getState() for non-reactive access
const state = useDeviceStore.getState();
const devices = state.devices;
```

### Always Cleanup Resources
```typescript
try {
  const result = await broadcast.start(file);
} finally {
  broadcast.destroy(); // CRITICAL: Always cleanup
}
```

### Validate Input Before Use
```typescript
// Input validation prevents XSS, DoS, memory exhaustion
const validated = RecipientInfoSchema.parse(recipient);
```

## Future Enhancements

### Potential Features
1. **Priority Broadcasting** - Send to high-priority devices first
2. **Resume Support** - Resume failed transfers
3. **Scheduled Broadcasts** - Queue broadcasts for later
4. **Broadcast Groups** - Save device groups for quick broadcast
5. **Analytics** - Track broadcast success rates
6. **Smart Retry** - Auto-retry failed recipients
7. **Speed Throttling** - Auto-adjust based on network conditions
8. **Broadcast History** - Track past broadcasts

### API Extensions
```typescript
// Batch broadcast multiple files
await broadcast.startBatch(files);

// Priority broadcasting
await broadcast.startWithPriority(file, priorityDeviceIds);

// Resume failed recipients
await broadcast.retryFailed();

// Schedule broadcast
await broadcast.schedule(file, delayMs);
```

## Changelog

### v1.0.0 (2026-02-06)
- Initial broadcast mode implementation
- Broadcast transfer module
- UI integration in DeviceDiscovery
- CSS styling with purple accent
- Accessibility support
- Security validation
- Performance optimizations

## License
Part of Tallow project. See main LICENSE file.

## Contributors
- Claude Opus 4.6 (Implementation)
- Aamir (Product Owner)
