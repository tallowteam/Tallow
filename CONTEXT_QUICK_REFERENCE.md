# Context API Quick Reference

Quick reference guide for using the Context APIs in Tallow.

## Setup

```typescript
// app/layout.tsx
import { AppProvider } from '@/lib/context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

## Imports

```typescript
// Import hooks
import {
  useSettings,
  useNotifications,
  useDevices,
  useTransfers,
} from '@/lib/context';

// Import types
import type {
  AppSettings,
  ThemeMode,
  Notification,
  NotificationType,
} from '@/lib/context';

// Import helpers
import {
  fileNotifications,
  transferNotifications,
  formatFileSize,
} from '@/lib/context';
```

## SettingsContext Cheat Sheet

```typescript
const {
  // State
  settings,              // AppSettings object
  isLoading,            // boolean
  isSaving,             // boolean
  lastSaved,            // Date | null

  // Updates
  updateSettings,       // (updates: Partial<AppSettings>) => Promise<void>
  setTheme,            // (theme: ThemeMode) => Promise<void>
  setLanguage,         // (lang: LanguageCode) => Promise<void>

  // Privacy
  updatePrivacySettings,      // (updates: Partial<PrivacySettings>) => Promise<void>
  addTrustedContact,          // (contactId: string) => Promise<void>
  removeTrustedContact,       // (contactId: string) => Promise<void>
  isTrustedContact,           // (contactId: string) => boolean

  // Notifications
  updateNotificationSettings, // (updates: Partial<NotificationPreferences>) => Promise<void>

  // Accessibility
  updateAccessibilitySettings,// (updates: Partial<AccessibilitySettings>) => Promise<void>

  // Reset
  resetSettings,              // () => Promise<void>
  resetToDefaults,           // (category?: string) => Promise<void>

  // Validation
  validateSettings,          // (settings: Partial<AppSettings>) => boolean
} = useSettings();
```

### Settings Structure

```typescript
settings = {
  theme: 'light' | 'dark' | 'high-contrast' | 'system',
  language: 'en' | 'es' | 'fr' | ...,
  deviceName: string,

  privacy: {
    stripMetadataEnabled: boolean,
    stripMetadataByDefault: boolean,
    preserveOrientation: boolean,
    showMetadataWarnings: boolean,
    trustedContacts: string[],
    stripFromImages: boolean,
    stripFromVideos: boolean,
    relayModeEnabled: boolean,
    useOnionRouting: boolean,
  },

  notifications: {
    enableDesktopNotifications: boolean,
    notifyOnTransferComplete: boolean,
    notifyOnTransferRequest: boolean,
    enableSound: boolean,
    soundVolume: number, // 0-100
    groupSimilarNotifications: boolean,
  },

  accessibility: {
    reducedMotion: boolean,
    disableAnimations: boolean,
    enableVoiceCommands: boolean,
    enableScreenReader: boolean,
    highContrast: boolean,
    largeText: boolean,
    enableKeyboardShortcuts: boolean,
  },
}
```

## NotificationsContext Cheat Sheet

```typescript
const {
  // State
  notifications,        // Notification[]
  groups,              // NotificationGroup[]
  banners,             // Notification[]
  queue,               // Notification[]

  // Show notifications
  notify,              // (msg: string, opts?: ToastOptions) => string
  success,             // (msg: string, opts?) => string
  error,               // (msg: string, opts?) => string
  warning,             // (msg: string, opts?) => string
  info,                // (msg: string, opts?) => string
  loading,             // (msg: string, opts?) => string

  // Advanced
  notifyWithUndo,      // (msg: string, onUndo: () => void, opts?) => string
  promise,             // (promise, { loading, success, error }) => Promise

  // Banners
  showBanner,          // (msg: string, opts?) => string
  dismissBanner,       // (id: string) => void
  dismissAllBanners,   // () => void

  // Dismiss
  dismiss,             // (id: string) => void
  dismissAll,          // () => void
  dismissGroup,        // (groupId: string) => void

  // Groups
  toggleGroup,         // (groupId: string) => void
  collapseAllGroups,   // () => void
  expandAllGroups,     // () => void

  // History
  getNotificationHistory, // () => Notification[]
  clearHistory,          // () => void

  // Settings
  setMaxNotifications,      // (max: number) => void
  setMaxConcurrentToasts,   // (max: number) => void
  setEnableGrouping,        // (enabled: boolean) => void
  setMaxGroupSize,          // (max: number) => void
} = useNotifications();
```

### Notification Options

```typescript
interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading',
  priority?: 'low' | 'medium' | 'high' | 'critical',
  duration?: number,
  persistent?: boolean,
  description?: string,
  groupId?: string,
  action?: {
    label: string,
    onClick: () => void,
    icon?: ReactNode,
  },
}
```

## Common Patterns

### Update Theme

```typescript
const { setTheme } = useSettings();
await setTheme('dark');
```

### Show Notification

```typescript
const { success, error } = useNotifications();

// Simple
success('File uploaded');

// With action
error('Upload failed', {
  action: {
    label: 'Retry',
    onClick: () => retry(),
  },
});
```

### Notification with Undo

```typescript
const { notifyWithUndo } = useNotifications();

const handleDelete = (file) => {
  const backup = { ...file };
  deleteFile(file);

  notifyWithUndo('File deleted', () => {
    restoreFile(backup);
  });
};
```

### Group Notifications

```typescript
const { notify } = useNotifications();

files.forEach(file => {
  notify(`Uploading ${file.name}`, {
    groupId: 'batch-upload',
    type: 'loading',
  });
});
```

### Privacy Settings

```typescript
const { updatePrivacySettings, addTrustedContact } = useSettings();

// Toggle metadata stripping
await updatePrivacySettings({
  stripMetadataEnabled: true,
});

// Add trusted contact
await addTrustedContact('friend-id');
```

### Accessibility

```typescript
const { updateAccessibilitySettings } = useSettings();

await updateAccessibilitySettings({
  reducedMotion: true,
  highContrast: true,
});
```

### Promise-based Notifications

```typescript
const { promise } = useNotifications();

promise(
  uploadFile(file),
  {
    loading: 'Uploading...',
    success: 'Upload complete',
    error: 'Upload failed',
  }
);
```

## Using Helpers

```typescript
import {
  useNotifications,
  fileNotifications,
  transferNotifications,
  formatFileSize,
} from '@/lib/context';

const { success, notify } = useNotifications();

// File uploaded
success(fileNotifications.uploaded('file.txt', 3).message);

// Transfer started
const { message, groupId } = transferNotifications.started('photo.jpg');
notify(message, { groupId });

// Format file size
const size = formatFileSize(1024000); // "1000 KB"
```

## DevicesContext Cheat Sheet

```typescript
const {
  // State
  currentDevice,       // Device | null
  discoveredDevices,   // DiscoveredDevice[]
  connectedPeer,       // string | null
  connectedPeerName,   // string | null
  isConnecting,        // boolean
  isConnected,         // boolean
  connectionCode,      // string
  connectionType,      // 'p2p' | 'relay'

  // Actions
  initializeCurrentDevice,   // (name?: string, platform?: string) => void
  setConnectedPeer,         // (peerId: string | null, peerName?: string) => void
  disconnectPeer,           // () => void
  addDiscoveredDevice,      // (device: DiscoveredDevice) => void
  setConnectionCode,        // (code: string) => void
} = useDevices();
```

## TransfersContext Cheat Sheet

```typescript
const {
  // State
  transfers,           // Transfer[]
  queue,              // File[]
  uploadProgress,     // number (0-100)
  downloadProgress,   // number (0-100)
  isTransferring,     // boolean
  isReceiving,        // boolean
  receivedFiles,      // ReceivedFile[]

  // Actions
  addTransfer,        // (transfer: Transfer) => void
  updateTransfer,     // (id: string, updates: Partial<Transfer>) => void
  setUploadProgress,  // (progress: number) => void
  addReceivedFile,    // (file: ReceivedFile) => void
  clearTransfers,     // () => void
} = useTransfers();
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { AppProvider } from '@/lib/context';

const wrapper = ({ children }) => (
  <AppProvider>{children}</AppProvider>
);

it('should use settings', async () => {
  const { result } = renderHook(() => useSettings(), { wrapper });

  await act(async () => {
    await result.current.setTheme('dark');
  });

  expect(result.current.settings.theme).toBe('dark');
});
```

## TypeScript Types

```typescript
// Settings
import type {
  AppSettings,
  PrivacySettings,
  NotificationPreferences,
  AccessibilitySettings,
  ThemeMode,
  LanguageCode,
} from '@/lib/context';

// Notifications
import type {
  Notification,
  NotificationGroup,
  NotificationType,
  NotificationPriority,
  ToastOptions,
} from '@/lib/context';

// Devices
import type {
  Device,
  DiscoveredDevice,
} from '@/lib/context';

// Transfers
import type {
  Transfer,
  ReceivedFile,
} from '@/lib/context';
```

## Best Practices

1. ✅ Always use `AppProvider` at root
2. ✅ Use typed hooks from `@/lib/context`
3. ✅ Check `isLoading` before rendering
4. ✅ Use notification helpers for consistency
5. ✅ Group related notifications
6. ✅ Set appropriate priority levels
7. ✅ Handle errors with persistent notifications
8. ✅ Provide undo for destructive actions
9. ✅ Validate settings before critical operations
10. ✅ Test with context providers

## Common Mistakes

❌ Using contexts without `AppProvider`
❌ Not checking `isLoading` state
❌ Creating too many ungrouped notifications
❌ Not setting priority for critical notifications
❌ Forgetting to dismiss loading notifications
❌ Not providing undo for destructive actions
❌ Hardcoding notification messages
❌ Not using notification helpers
❌ Updating settings without validation
❌ Not handling errors in settings updates

## Resources

- **Full Documentation**: [lib/context/README.md](./lib/context/README.md)
- **Migration Guide**: [CONTEXT_API_MIGRATION.md](./CONTEXT_API_MIGRATION.md)
- **Implementation Summary**: [CONTEXT_IMPLEMENTATION_SUMMARY.md](./CONTEXT_IMPLEMENTATION_SUMMARY.md)
- **Examples**: [lib/context/examples/](./lib/context/examples/)
- **Tests**: [tests/unit/contexts/](./tests/unit/contexts/)
