# Context API Documentation

Centralized state management using React Context API for the Tallow application.

## Overview

The Context API provides four main contexts for managing application state:

1. **DevicesContext** - Device and connection management
2. **TransfersContext** - File transfer state
3. **SettingsContext** - App settings, theme, privacy, notifications, accessibility
4. **NotificationsContext** - Toast notifications, banners, notification history

All contexts follow the same pattern for consistency and maintainability.

## Quick Start

### Setup

Wrap your app with the `AppProvider` in your root layout:

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

### Usage

Import and use hooks in any component:

```typescript
import { useSettings, useNotifications, useDevices, useTransfers } from '@/lib/context';

function MyComponent() {
  const { settings, setTheme } = useSettings();
  const { success, error } = useNotifications();
  const { connectedPeer } = useDevices();
  const { transfers } = useTransfers();

  // Use the state and actions...
}
```

## Context Details

### DevicesContext

Manages device information and peer connections.

**State:**
- `currentDevice` - Current device info
- `discoveredDevices` - Devices on local network
- `connectedPeer` - Currently connected peer
- `isConnecting` / `isConnected` - Connection state
- `connectionCode` - Code for manual connection
- `connectionType` - 'p2p' or 'relay'

**Actions:**
- `initializeCurrentDevice(name, platform)` - Initialize device
- `addDiscoveredDevice(device)` - Add discovered device
- `setConnectedPeer(peerId, peerName)` - Set connected peer
- `disconnectPeer()` - Disconnect current peer

**Example:**

```typescript
import { useDevices } from '@/lib/context';

function ConnectionPanel() {
  const {
    connectedPeer,
    connectedPeerName,
    isConnected,
    setConnectedPeer,
    disconnectPeer
  } = useDevices();

  if (isConnected) {
    return (
      <div>
        Connected to {connectedPeerName}
        <button onClick={disconnectPeer}>Disconnect</button>
      </div>
    );
  }

  return <div>Not connected</div>;
}
```

### TransfersContext

Manages file transfer state and progress.

**State:**
- `transfers` - Array of active transfers
- `queue` - Files queued for transfer
- `uploadProgress` / `downloadProgress` - Progress (0-100)
- `isTransferring` / `isReceiving` - Transfer state
- `currentFileName` - Name of current file
- `receivedFiles` - Files received from peers

**Actions:**
- `addTransfer(transfer)` - Add new transfer
- `updateTransfer(id, updates)` - Update transfer
- `setUploadProgress(progress)` - Update upload progress
- `addReceivedFile(file)` - Add received file
- `clearTransfers()` - Clear all transfers

**Example:**

```typescript
import { useTransfers } from '@/lib/context';

function TransferList() {
  const {
    transfers,
    uploadProgress,
    isTransferring,
    addTransfer
  } = useTransfers();

  const handleSendFile = (file: File, peer: Device) => {
    const transfer: Transfer = {
      id: generateId(),
      files: [{ id: generateId(), name: file.name, size: file.size, type: file.type }],
      from: currentDevice,
      to: peer,
      status: 'pending',
      progress: 0,
      direction: 'send',
      totalSize: file.size,
      transferredSize: 0
    };
    addTransfer(transfer);
  };

  return (
    <div>
      {transfers.map(transfer => (
        <TransferItem key={transfer.id} transfer={transfer} />
      ))}
    </div>
  );
}
```

### SettingsContext

Manages application settings with automatic persistence to secure storage.

**State:**
- `settings` - All app settings
  - `theme` - Theme mode (light/dark/high-contrast/system)
  - `language` - Language code
  - `privacy` - Privacy settings (metadata stripping, relay mode)
  - `notifications` - Notification preferences
  - `accessibility` - Accessibility settings (reduced motion, voice commands)
  - `deviceName` - Device name
  - `autoAcceptFromFriends` - Auto-accept transfers from friends
  - `enableTelemetry` - Telemetry preference
- `isLoading` - Loading state
- `isSaving` - Saving state
- `lastSaved` - Last save timestamp

**Actions:**
- `updateSettings(updates)` - Update any settings
- `updatePrivacySettings(updates)` - Update privacy settings
- `updateNotificationSettings(updates)` - Update notification settings
- `updateAccessibilitySettings(updates)` - Update accessibility settings
- `setTheme(theme)` - Set theme
- `setLanguage(language)` - Set language
- `resetSettings()` - Reset all settings
- `resetToDefaults(category)` - Reset specific category
- `addTrustedContact(contactId)` - Add trusted contact
- `removeTrustedContact(contactId)` - Remove trusted contact
- `isTrustedContact(contactId)` - Check if contact is trusted
- `validateSettings(settings)` - Validate settings

**Example:**

```typescript
import { useSettings } from '@/lib/context';

function SettingsPanel() {
  const {
    settings,
    setTheme,
    updatePrivacySettings,
    updateAccessibilitySettings,
    isLoading,
    isSaving
  } = useSettings();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Theme */}
      <select
        value={settings.theme}
        onChange={(e) => setTheme(e.target.value)}
        disabled={isSaving}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="high-contrast">High Contrast</option>
        <option value="system">System</option>
      </select>

      {/* Privacy */}
      <label>
        <input
          type="checkbox"
          checked={settings.privacy.stripMetadataEnabled}
          onChange={(e) => updatePrivacySettings({
            stripMetadataEnabled: e.target.checked
          })}
        />
        Strip metadata
      </label>

      {/* Accessibility */}
      <label>
        <input
          type="checkbox"
          checked={settings.accessibility.reducedMotion}
          onChange={(e) => updateAccessibilitySettings({
            reducedMotion: e.target.checked
          })}
        />
        Reduced motion
      </label>
    </div>
  );
}
```

### NotificationsContext

Manages toast notifications, banners, and notification history with grouping support.

**State:**
- `notifications` - Notification history
- `groups` - Notification groups
- `banners` - Alert banners
- `queue` - Queued notifications
- `maxNotifications` - Max history size
- `maxConcurrentToasts` - Max concurrent toasts
- `enableGrouping` - Enable notification grouping
- `maxGroupSize` - Max notifications per group

**Actions:**
- `notify(message, options)` - Show notification
- `success(message, options)` - Success notification
- `error(message, options)` - Error notification (persists by default)
- `warning(message, options)` - Warning notification
- `info(message, options)` - Info notification
- `loading(message, options)` - Loading notification
- `notifyWithUndo(message, onUndo, options)` - Notification with undo
- `showBanner(message, options)` - Show banner
- `dismissBanner(id)` - Dismiss banner
- `dismissAllBanners()` - Dismiss all banners
- `dismiss(id)` - Dismiss notification
- `dismissAll()` - Dismiss all notifications
- `dismissGroup(groupId)` - Dismiss notification group
- `getNotificationHistory()` - Get notification history
- `clearHistory()` - Clear history
- `toggleGroup(groupId)` - Toggle group collapse
- `collapseAllGroups()` - Collapse all groups
- `expandAllGroups()` - Expand all groups
- `promise(promise, messages)` - Promise-based notification

**Example:**

```typescript
import { useNotifications } from '@/lib/context';

function FileUploader() {
  const {
    success,
    error,
    loading,
    dismiss,
    notifyWithUndo,
    showBanner,
    groups,
    toggleGroup
  } = useNotifications();

  const handleUpload = async (file: File) => {
    const loadingId = loading(`Uploading ${file.name}...`);

    try {
      await uploadFile(file);
      dismiss(loadingId);
      success(`${file.name} uploaded`, {
        description: 'File is now available',
        action: {
          label: 'View',
          onClick: () => viewFile(file)
        }
      });
    } catch (err) {
      dismiss(loadingId);
      error(`Failed to upload ${file.name}`, {
        action: {
          label: 'Retry',
          onClick: () => handleUpload(file)
        }
      });
    }
  };

  const handleBatchUpload = (files: File[]) => {
    files.forEach(file => {
      notify(`Uploading ${file.name}`, {
        groupId: 'batch-upload',
        type: 'loading'
      });
      uploadFile(file);
    });
  };

  const handleDelete = (file: File) => {
    const backup = { ...file };
    deleteFile(file);

    notifyWithUndo(`Deleted ${file.name}`, () => {
      restoreFile(backup);
    });
  };

  const handleSystemUpdate = () => {
    showBanner('System update available', {
      type: 'info',
      priority: 'high',
      action: {
        label: 'Update Now',
        onClick: () => startUpdate()
      }
    });
  };

  return (
    <div>
      {/* Upload UI */}
      {groups.map(group => (
        <NotificationGroup
          key={group.id}
          group={group}
          onToggle={() => toggleGroup(group.id)}
        />
      ))}
    </div>
  );
}
```

## Advanced Usage

### Combining Multiple Contexts

```typescript
import { useSettings, useNotifications, useDevices, useTransfers } from '@/lib/context';

function Dashboard() {
  const { settings } = useSettings();
  const { success } = useNotifications();
  const { connectedPeer } = useDevices();
  const { transfers } = useTransfers();

  // Use multiple contexts together
  const handleTransferComplete = () => {
    if (settings.notifications.notifyOnTransferComplete) {
      success('Transfer completed', {
        description: `Received from ${connectedPeer}`,
      });
    }
  };
}
```

### Conditional Notifications

```typescript
import { useSettings, useNotifications } from '@/lib/context';

function FileHandler() {
  const { settings } = useSettings();
  const { warning } = useNotifications();

  const handleFile = (file: File) => {
    if (settings.privacy.showMetadataWarnings && hasMetadata(file)) {
      warning('File contains metadata', {
        description: 'Consider stripping metadata before sending',
        action: {
          label: 'Strip',
          onClick: () => stripMetadata(file)
        }
      });
    }
  };
}
```

### Priority Notifications

```typescript
import { useNotifications } from '@/lib/context';

function SecurityMonitor() {
  const { notify } = useNotifications();

  const handleSecurityEvent = (event: SecurityEvent) => {
    notify(event.message, {
      type: 'error',
      priority: 'critical', // Shows even if max concurrent reached
      persistent: true,
      action: {
        label: 'Review',
        onClick: () => reviewEvent(event)
      }
    });
  };
}
```

## TypeScript Types

All contexts export comprehensive TypeScript types:

```typescript
// Settings types
import type {
  AppSettings,
  PrivacySettings,
  NotificationPreferences,
  AccessibilitySettings,
  ThemeMode,
  LanguageCode,
} from '@/lib/context';

// Notification types
import type {
  Notification,
  NotificationGroup,
  NotificationType,
  NotificationPriority,
  NotificationAction,
  ToastOptions,
} from '@/lib/context';

// Device types
import type {
  DeviceState,
  DiscoveredDevice,
} from '@/lib/context';

// Transfer types
import type {
  TransferState,
  ReceivedFile,
} from '@/lib/context';
```

## Testing

### Unit Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/lib/context';

describe('Settings', () => {
  const wrapper = ({ children }) => (
    <SettingsProvider>{children}</SettingsProvider>
  );

  it('should update theme', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(async () => {
      await result.current.setTheme('dark');
    });

    expect(result.current.settings.theme).toBe('dark');
  });
});
```

### Integration Testing

```typescript
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@/lib/context';

function TestComponent() {
  const { settings } = useSettings();
  return <div>{settings.theme}</div>;
}

describe('Integration', () => {
  it('should provide all contexts', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByText('system')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Always use AppProvider**: Wrap your app with `<AppProvider>` in the root layout
2. **Use typed hooks**: Import typed hooks from `@/lib/context`
3. **Handle loading states**: Check `isLoading` before rendering settings-dependent UI
4. **Validate settings**: Use `validateSettings()` before critical operations
5. **Group notifications**: Use `groupId` for related notifications
6. **Set priorities**: Use appropriate priority levels for notifications
7. **Test with providers**: Always wrap tests with context providers
8. **Persist critical settings**: Use `updateSettings()` to auto-persist to secure storage
9. **Handle errors gracefully**: Error notifications persist by default
10. **Clean up**: Dismiss notifications and clear history when appropriate

## Performance Considerations

- Settings are loaded once on mount and cached
- Settings persist automatically to secure storage
- Notifications are limited by `maxConcurrentToasts`
- History is limited by `maxNotifications`
- Grouping reduces notification spam
- All hooks use `useCallback` for stable references

## Security

- Settings persist to **secure storage** (AES-256-GCM encrypted)
- Privacy settings control metadata stripping
- Trusted contacts list for privacy exceptions
- No sensitive data in notification history
- Secure storage migration handled automatically

## Migration

See [CONTEXT_API_MIGRATION.md](../../CONTEXT_API_MIGRATION.md) for detailed migration guide from old patterns.

## Architecture

Provider hierarchy (outer to inner):
1. `SettingsProvider` - Foundation for other contexts
2. `NotificationsProvider` - Notification system
3. `DevicesProvider` - Device management
4. `TransfersProvider` - Transfer management

This hierarchy ensures settings are available before other contexts initialize.

## API Reference

See source files for complete API:
- [settings-context.tsx](./settings-context.tsx)
- [notifications-context.tsx](./notifications-context.tsx)
- [devices-context.tsx](./devices-context.tsx)
- [transfers-context.tsx](./transfers-context.tsx)

## Contributing

When adding new contexts:
1. Follow the established pattern
2. Export types and hooks from `index.ts`
3. Add to `AppProvider` in correct order
4. Write comprehensive tests
5. Update this documentation
6. Add migration guide if breaking changes
