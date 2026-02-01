# Context API Migration Guide

This guide helps migrate existing settings and notification code to the new SettingsContext and NotificationsContext.

## Table of Contents

- [Overview](#overview)
- [Settings Migration](#settings-migration)
- [Notifications Migration](#notifications-migration)
- [Usage Examples](#usage-examples)
- [Breaking Changes](#breaking-changes)
- [Testing](#testing)

## Overview

The new Context APIs provide centralized state management for:

- **SettingsContext**: App settings, theme, language, privacy, notifications, and accessibility
- **NotificationsContext**: Toast notifications, banners, notification history, and grouping

### Benefits

- Centralized state management
- Type-safe settings and notifications
- Automatic persistence to secure storage
- Built-in validation
- Notification grouping and prioritization
- Accessibility support
- Better testability

## Settings Migration

### Before (Old Pattern)

```typescript
// Scattered settings management
import { useState } from 'react';

function MyComponent() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  // Manual localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
}
```

### After (New Pattern)

```typescript
import { useSettings } from '@/lib/context';

function MyComponent() {
  const { settings, setTheme, setLanguage } = useSettings();

  // Settings automatically persisted to secure storage
  const handleThemeChange = async (newTheme) => {
    await setTheme(newTheme);
  };
}
```

### Privacy Settings Migration

**Before:**

```typescript
import { getPrivacySettings, updatePrivacySettings } from '@/lib/privacy/privacy-settings';

async function enableMetadataStripping() {
  const settings = await getPrivacySettings();
  await updatePrivacySettings({
    ...settings,
    stripMetadataEnabled: true
  });
}
```

**After:**

```typescript
import { useSettings } from '@/lib/context';

function PrivacyPanel() {
  const { settings, updatePrivacySettings } = useSettings();

  const handleToggle = async () => {
    await updatePrivacySettings({
      stripMetadataEnabled: !settings.privacy.stripMetadataEnabled
    });
  };
}
```

### Trusted Contacts Migration

**Before:**

```typescript
import { addTrustedContact, isTrustedContact } from '@/lib/privacy/privacy-settings';

const trusted = await isTrustedContact('contact-id');
if (!trusted) {
  await addTrustedContact('contact-id');
}
```

**After:**

```typescript
import { useSettings } from '@/lib/context';

function ContactManager() {
  const { isTrustedContact, addTrustedContact } = useSettings();

  const handleTrust = async (contactId: string) => {
    if (!isTrustedContact(contactId)) {
      await addTrustedContact(contactId);
    }
  };
}
```

## Notifications Migration

### Before (Old Pattern)

```typescript
import { toast } from '@/lib/utils/toast';

function MyComponent() {
  const handleSuccess = () => {
    toast.success('Operation completed');
  };
}
```

### After (New Pattern)

```typescript
import { useNotifications } from '@/lib/context';

function MyComponent() {
  const { success, error, notifyWithUndo } = useNotifications();

  const handleSuccess = () => {
    success('Operation completed', {
      description: 'Additional details',
      action: {
        label: 'View',
        onClick: () => console.log('View clicked')
      }
    });
  };

  const handleDelete = () => {
    notifyWithUndo('File deleted', () => {
      // Undo logic
      console.log('Restoring file...');
    });
  };
}
```

### Banner Notifications

**New Feature:**

```typescript
import { useNotifications } from '@/lib/context';

function App() {
  const { showBanner, dismissBanner, banners } = useNotifications();

  // Show persistent banner
  const bannerId = showBanner('Important system announcement', {
    type: 'warning',
    priority: 'high',
    action: {
      label: 'Learn More',
      onClick: () => console.log('Learn more clicked')
    }
  });

  // Dismiss later
  const handleDismiss = () => {
    dismissBanner(bannerId);
  };

  return (
    <div>
      {banners.map(banner => (
        <Banner key={banner.id} {...banner} />
      ))}
    </div>
  );
}
```

### Notification Grouping

**New Feature:**

```typescript
import { useNotifications } from '@/lib/context';

function FileUploader() {
  const { notify, groups, toggleGroup } = useNotifications();

  // Group related notifications
  const handleUpload = (files: File[]) => {
    files.forEach((file, index) => {
      notify(`Uploading ${file.name}`, {
        groupId: 'file-uploads',
        type: 'loading'
      });
    });
  };

  return (
    <div>
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

### Notification History

**New Feature:**

```typescript
import { useNotifications } from '@/lib/context';

function NotificationCenter() {
  const { getNotificationHistory, clearHistory } = useNotifications();

  const history = getNotificationHistory();

  return (
    <div>
      <h2>Notification History</h2>
      {history.map(notification => (
        <div key={notification.id}>
          <span>{notification.message}</span>
          <time>{notification.timestamp.toLocaleString()}</time>
        </div>
      ))}
      <button onClick={clearHistory}>Clear All</button>
    </div>
  );
}
```

## Usage Examples

### Complete Settings Example

```typescript
import { useSettings } from '@/lib/context';

function SettingsPanel() {
  const {
    settings,
    updateSettings,
    updatePrivacySettings,
    updateNotificationSettings,
    updateAccessibilitySettings,
    resetToDefaults,
    isLoading,
    isSaving
  } = useSettings();

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h2>Theme</h2>
      <select
        value={settings.theme}
        onChange={(e) => updateSettings({ theme: e.target.value })}
        disabled={isSaving}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="high-contrast">High Contrast</option>
        <option value="system">System</option>
      </select>

      <h2>Privacy</h2>
      <label>
        <input
          type="checkbox"
          checked={settings.privacy.stripMetadataEnabled}
          onChange={(e) => updatePrivacySettings({
            stripMetadataEnabled: e.target.checked
          })}
        />
        Strip metadata from files
      </label>

      <h2>Accessibility</h2>
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

      <button onClick={() => resetToDefaults('privacy')}>
        Reset Privacy Settings
      </button>
    </div>
  );
}
```

### Complete Notifications Example

```typescript
import { useNotifications } from '@/lib/context';

function FileTransfer() {
  const {
    success,
    error,
    loading,
    dismiss,
    notifyWithUndo,
    promise
  } = useNotifications();

  const handleTransfer = async (file: File) => {
    // Loading notification
    const loadingId = loading(`Uploading ${file.name}...`);

    try {
      await uploadFile(file);
      dismiss(loadingId);
      success(`${file.name} uploaded successfully`);
    } catch (err) {
      dismiss(loadingId);
      error(`Failed to upload ${file.name}`, {
        action: {
          label: 'Retry',
          onClick: () => handleTransfer(file)
        }
      });
    }
  };

  const handleDelete = (file: File) => {
    const backup = { ...file };
    deleteFile(file);

    notifyWithUndo(`Deleted ${file.name}`, () => {
      restoreFile(backup);
    });
  };

  // Promise-based notifications
  const handleUploadWithPromise = (file: File) => {
    promise(
      uploadFile(file),
      {
        loading: `Uploading ${file.name}...`,
        success: `${file.name} uploaded`,
        error: 'Upload failed'
      }
    );
  };
}
```

### App Provider Setup

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

## Breaking Changes

### Settings

1. **Theme values**: Added `high-contrast` option
   ```typescript
   // Before: 'light' | 'dark' | 'system'
   // After: 'light' | 'dark' | 'high-contrast' | 'system'
   ```

2. **Privacy settings**: Now nested under `settings.privacy`
   ```typescript
   // Before: getPrivacySettings()
   // After: useSettings().settings.privacy
   ```

3. **Storage**: Settings now use secure storage by default
   ```typescript
   // Before: localStorage.getItem('theme')
   // After: Automatically managed by SettingsContext
   ```

### Notifications

1. **Toast import**: Use context hook instead of utility
   ```typescript
   // Before: import { toast } from '@/lib/utils/toast'
   // After: import { useNotifications } from '@/lib/context'
   ```

2. **Error persistence**: Errors persist by default
   ```typescript
   // Before: toast.error(msg) // Auto-dismisses
   // After: error(msg) // Persists until manually dismissed
   // To auto-dismiss: error(msg, { persistent: false })
   ```

## Testing

### Testing Components with Settings

```typescript
import { renderHook } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/lib/context';

describe('MyComponent', () => {
  const wrapper = ({ children }) => (
    <SettingsProvider>{children}</SettingsProvider>
  );

  it('should use settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(result.current.settings.theme).toBe('system');
  });
});
```

### Testing Components with Notifications

```typescript
import { renderHook } from '@testing-library/react';
import { NotificationsProvider, useNotifications } from '@/lib/context';

describe('MyComponent', () => {
  const wrapper = ({ children }) => (
    <NotificationsProvider>{children}</NotificationsProvider>
  );

  it('should show notification', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.success('Test message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Test message');
  });
});
```

### Testing with Both Contexts

```typescript
import { AppProvider } from '@/lib/context';

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

describe('MyComponent', () => {
  it('should use both contexts', () => {
    const { result } = renderHook(
      () => ({
        settings: useSettings(),
        notifications: useNotifications()
      }),
      { wrapper }
    );

    // Test both contexts
  });
});
```

## Migration Checklist

- [ ] Wrap app with `<AppProvider>`
- [ ] Replace direct localStorage access with `useSettings()`
- [ ] Replace `toast` imports with `useNotifications()`
- [ ] Update theme values to include `high-contrast`
- [ ] Migrate privacy settings access
- [ ] Update error notifications to handle persistence
- [ ] Add notification grouping where applicable
- [ ] Update tests to use context providers
- [ ] Remove old settings management code
- [ ] Update documentation

## Support

For questions or issues:
1. Check existing context implementations in `lib/context/`
2. Review test files for usage examples
3. See TypeScript types for available options
