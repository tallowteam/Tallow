# Context API Implementation Guide

Step-by-step guide to implement and use the new Context APIs in your Tallow components.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Using Settings in Components](#using-settings-in-components)
3. [Using Notifications in Components](#using-notifications-in-components)
4. [Combining Multiple Contexts](#combining-multiple-contexts)
5. [Real-World Examples](#real-world-examples)
6. [Troubleshooting](#troubleshooting)

## Initial Setup

### Step 1: Verify AppProvider

Check that your root layout includes the `AppProvider`:

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

### Step 2: Verify Dependencies

Ensure you have the required packages:

```bash
npm install sonner
# or
yarn add sonner
```

### Step 3: Import Contexts

In your component, import the hooks you need:

```typescript
import { useSettings, useNotifications } from '@/lib/context';
```

## Using Settings in Components

### Example 1: Theme Selector

```typescript
'use client';

import { useSettings } from '@/lib/context';

export function ThemeSelector() {
  const { settings, setTheme, isLoading, isSaving } = useSettings();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <select
      value={settings.theme}
      onChange={(e) => setTheme(e.target.value as any)}
      disabled={isSaving}
      className="px-3 py-2 border rounded-md"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="high-contrast">High Contrast</option>
      <option value="system">System</option>
    </select>
  );
}
```

### Example 2: Privacy Toggle

```typescript
'use client';

import { useSettings, useNotifications } from '@/lib/context';

export function PrivacyToggle() {
  const { settings, updatePrivacySettings, isSaving } = useSettings();
  const { warning } = useNotifications();

  const handleToggle = async (enabled: boolean) => {
    await updatePrivacySettings({
      stripMetadataEnabled: enabled,
    });

    if (enabled) {
      warning('Metadata will be stripped from files', {
        description: 'Add contacts to trusted list to skip stripping',
      });
    }
  };

  return (
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={settings.privacy.stripMetadataEnabled}
        onChange={(e) => handleToggle(e.target.checked)}
        disabled={isSaving}
      />
      <span>Strip metadata from files</span>
    </label>
  );
}
```

### Example 3: Accessibility Settings

```typescript
'use client';

import { useSettings } from '@/lib/context';

export function AccessibilityPanel() {
  const {
    settings,
    updateAccessibilitySettings,
    isLoading,
    isSaving,
  } = useSettings();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Accessibility</h2>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={settings.accessibility.reducedMotion}
          onChange={(e) => updateAccessibilitySettings({
            reducedMotion: e.target.checked,
          })}
          disabled={isSaving}
        />
        <span>Reduced motion</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={settings.accessibility.highContrast}
          onChange={(e) => updateAccessibilitySettings({
            highContrast: e.target.checked,
          })}
          disabled={isSaving}
        />
        <span>High contrast</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={settings.accessibility.enableVoiceCommands}
          onChange={(e) => updateAccessibilitySettings({
            enableVoiceCommands: e.target.checked,
          })}
          disabled={isSaving}
        />
        <span>Voice commands</span>
      </label>
    </div>
  );
}
```

## Using Notifications in Components

### Example 1: Simple Notifications

```typescript
'use client';

import { useNotifications } from '@/lib/context';

export function FileUploader() {
  const { success, error, loading, dismiss } = useNotifications();

  const handleUpload = async (file: File) => {
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
          onClick: () => handleUpload(file),
        },
      });
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }}
    />
  );
}
```

### Example 2: Undo Functionality

```typescript
'use client';

import { useNotifications } from '@/lib/context';
import { useState } from 'react';

export function FileList() {
  const { notifyWithUndo } = useNotifications();
  const [files, setFiles] = useState<File[]>([]);

  const handleDelete = (file: File, index: number) => {
    const deletedFile = file;
    const deletedIndex = index;

    // Remove file
    setFiles(prev => prev.filter((_, i) => i !== index));

    // Show undo notification
    notifyWithUndo(`Deleted ${file.name}`, () => {
      // Restore file
      setFiles(prev => {
        const updated = [...prev];
        updated.splice(deletedIndex, 0, deletedFile);
        return updated;
      });
    });
  };

  return (
    <ul>
      {files.map((file, index) => (
        <li key={index}>
          {file.name}
          <button onClick={() => handleDelete(file, index)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Example 3: Grouped Notifications

```typescript
'use client';

import { useNotifications } from '@/lib/context';

export function BatchUploader() {
  const { notify, groups, toggleGroup } = useNotifications();

  const handleBatchUpload = async (files: File[]) => {
    const groupId = 'batch-upload';

    // Show notifications for each file
    files.forEach(file => {
      notify(`Uploading ${file.name}`, {
        groupId,
        type: 'loading',
      });
    });

    // Upload files
    for (const file of files) {
      await uploadFile(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleBatchUpload(files);
        }}
      />

      {/* Show notification groups */}
      {groups.map(group => (
        <div key={group.id}>
          <button onClick={() => toggleGroup(group.id)}>
            {group.baseMessage} ({group.count})
          </button>
          {!group.collapsed && (
            <ul>
              {group.notifications.map(n => (
                <li key={n.id}>{n.message}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Banner Notifications

```typescript
'use client';

import { useNotifications } from '@/lib/context';
import { useEffect } from 'react';

export function UpdateBanner() {
  const { showBanner, dismissBanner, banners } = useNotifications();

  useEffect(() => {
    // Check for updates
    checkForUpdates().then(updateAvailable => {
      if (updateAvailable) {
        showBanner('System update available', {
          type: 'info',
          priority: 'high',
          action: {
            label: 'Update Now',
            onClick: () => startUpdate(),
          },
        });
      }
    });
  }, []);

  return (
    <div>
      {banners.map(banner => (
        <div
          key={banner.id}
          className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative"
        >
          <span className="block sm:inline">{banner.message}</span>
          <button
            onClick={() => dismissBanner(banner.id)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-6 w-6 fill-current">...</svg>
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Combining Multiple Contexts

### Example 1: Settings-Aware Notifications

```typescript
'use client';

import { useSettings, useNotifications } from '@/lib/context';

export function FileHandler() {
  const { settings } = useSettings();
  const { warning, success } = useNotifications();

  const handleFile = async (file: File) => {
    // Check privacy settings
    if (settings.privacy.showMetadataWarnings && hasMetadata(file)) {
      warning('File contains metadata', {
        description: 'Location and camera info detected',
        action: {
          label: 'Strip',
          onClick: () => stripMetadata(file),
        },
      });
    }

    // Check notification settings
    if (settings.notifications.notifyOnTransferComplete) {
      await uploadFile(file);
      success('File uploaded');
    }
  };
}
```

### Example 2: Transfer with Notifications

```typescript
'use client';

import {
  useTransfers,
  useNotifications,
  useSettings,
  transferNotifications,
} from '@/lib/context';

export function FileTransfer() {
  const { addTransfer, setUploadProgress } = useTransfers();
  const { notify, success, error } = useNotifications();
  const { settings } = useSettings();

  const handleTransfer = async (file: File, peer: Device) => {
    // Check metadata stripping
    let processedFile = file;
    if (settings.privacy.stripMetadataEnabled) {
      processedFile = await stripMetadata(file);
    }

    // Create transfer
    const transfer = createTransfer(processedFile, peer);
    addTransfer(transfer);

    // Show start notification
    const { message, groupId } = transferNotifications.started(file.name);
    notify(message, { groupId, type: 'loading' });

    try {
      // Upload with progress
      await uploadFile(processedFile, (progress) => {
        setUploadProgress(progress);
      });

      success(transferNotifications.complete(file.name).message);
    } catch (err) {
      error(transferNotifications.failed(err.message).message);
    }
  };
}
```

## Real-World Examples

### Example 1: Complete Settings Panel

See [lib/context/examples/settings-with-notifications.tsx](./lib/context/examples/settings-with-notifications.tsx) for a complete implementation.

### Example 2: File Upload with All Features

```typescript
'use client';

import {
  useSettings,
  useNotifications,
  useTransfers,
  fileNotifications,
  formatFileSize,
} from '@/lib/context';

export function AdvancedFileUpload() {
  const { settings } = useSettings();
  const { notify, success, error, notifyWithUndo } = useNotifications();
  const { addToQueue, setUploadProgress } = useTransfers();

  const handleUpload = async (files: File[]) => {
    // Add to queue
    addToQueue(files);

    // Group notifications
    const groupId = `upload-${Date.now()}`;

    for (const file of files) {
      // Check metadata
      if (settings.privacy.stripMetadataEnabled && hasMetadata(file)) {
        if (settings.privacy.showMetadataWarnings) {
          notify('Stripping metadata...', {
            groupId,
            description: file.name,
          });
        }
        file = await stripMetadata(file);
      }

      // Upload notification
      const loadingId = notify(
        `Uploading ${file.name} (${formatFileSize(file.size)})`,
        { groupId, type: 'loading' }
      );

      try {
        await uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        success(fileNotifications.uploaded(file.name).message);
      } catch (err) {
        error(`Failed to upload ${file.name}`, {
          action: {
            label: 'Retry',
            onClick: () => handleUpload([file]),
          },
        });
      }
    }
  };

  return (
    <input
      type="file"
      multiple
      onChange={(e) => {
        const files = Array.from(e.target.files || []);
        handleUpload(files);
      }}
    />
  );
}
```

## Troubleshooting

### Issue: "useSettings must be used within SettingsProvider"

**Solution**: Ensure your component is wrapped with `AppProvider`:

```typescript
// ❌ Wrong
export default function MyComponent() {
  const { settings } = useSettings(); // Error!
}

// ✅ Correct - in app/layout.tsx
<AppProvider>
  <MyComponent />
</AppProvider>
```

### Issue: Settings not persisting

**Solution**: Check secure storage is available:

```typescript
// Verify HTTPS or localhost
console.log(window.crypto?.subtle); // Should not be null
```

### Issue: Notifications not showing

**Solution**: Check Sonner Toaster is rendered:

```typescript
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider>
          {children}
          <Toaster position="top-right" />
        </AppProvider>
      </body>
    </html>
  );
}
```

### Issue: Settings not loading on mount

**Solution**: Check for loading state:

```typescript
const { settings, isLoading } = useSettings();

if (isLoading) {
  return <div>Loading settings...</div>;
}

// Use settings here
```

### Issue: Too many notifications

**Solution**: Use notification grouping:

```typescript
// Instead of individual notifications
files.forEach(file => {
  notify(`Uploading ${file.name}`); // Spam!
});

// Use grouping
files.forEach(file => {
  notify(`Uploading ${file.name}`, {
    groupId: 'file-uploads', // Grouped!
  });
});
```

### Issue: Notifications dismissed too quickly

**Solution**: Increase duration or make persistent:

```typescript
// Short duration (default: 4000ms)
success('Done');

// Longer duration
success('Done', { duration: 10000 });

// Persistent (manual dismiss only)
success('Done', { persistent: true });
```

## Next Steps

1. **Implement in Components**
   - Start with simple settings like theme
   - Add notifications to user actions
   - Gradually migrate existing code

2. **Test Integration**
   - Test settings persistence
   - Test notification flows
   - Test error handling

3. **Optimize**
   - Use notification grouping
   - Set appropriate priorities
   - Add undo for destructive actions

4. **Document**
   - Document custom patterns
   - Share best practices with team
   - Update component documentation

## Resources

- **Quick Reference**: [CONTEXT_QUICK_REFERENCE.md](./CONTEXT_QUICK_REFERENCE.md)
- **Migration Guide**: [CONTEXT_API_MIGRATION.md](./CONTEXT_API_MIGRATION.md)
- **Full Documentation**: [lib/context/README.md](./lib/context/README.md)
- **Examples**: [lib/context/examples/](./lib/context/examples/)
