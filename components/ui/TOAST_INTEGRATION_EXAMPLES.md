# Toast Integration Examples for Tallow

Common use cases for integrating the toast notification system into Tallow's file transfer application.

## File Transfer Scenarios

### 1. File Upload Progress

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useState } from 'react';

export function FileUploader() {
  const { success, error, addToast, removeToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);

    // Show uploading toast
    const uploadToastId = addToast({
      variant: 'info',
      title: 'Uploading',
      message: `Uploading ${file.name}...`,
      duration: Infinity
    });

    try {
      await uploadFile(file);

      // Remove uploading toast
      removeToast(uploadToastId);

      // Show success
      success(`${file.name} uploaded successfully!`, {
        title: 'Upload Complete',
        duration: 5000
      });
    } catch (err) {
      // Remove uploading toast
      removeToast(uploadToastId);

      // Show error with retry option
      addToast({
        variant: 'error',
        title: 'Upload Failed',
        message: `Failed to upload ${file.name}`,
        action: {
          label: 'Retry',
          onClick: () => handleUpload(file)
        },
        duration: 7000
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

### 2. Peer Connection Status

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useEffect } from 'react';

export function ConnectionMonitor() {
  const { info, success, warning, error } = useToast();

  useEffect(() => {
    // Connection events
    const handleConnecting = () => {
      info('Connecting to peer...', {
        title: 'Connection',
        duration: 3000
      });
    };

    const handleConnected = (peerId: string) => {
      success(`Connected to ${peerId}`, {
        title: 'Connected',
        duration: 4000
      });
    };

    const handleDisconnected = () => {
      warning('Connection lost. Attempting to reconnect...', {
        title: 'Disconnected',
        duration: 5000
      });
    };

    const handleError = (err: Error) => {
      error('Failed to establish connection', {
        title: 'Connection Error',
        duration: 7000
      });
    };

    // Subscribe to connection events
    // (Replace with your actual connection manager)
    connectionManager.on('connecting', handleConnecting);
    connectionManager.on('connected', handleConnected);
    connectionManager.on('disconnected', handleDisconnected);
    connectionManager.on('error', handleError);

    return () => {
      connectionManager.off('connecting', handleConnecting);
      connectionManager.off('connected', handleConnected);
      connectionManager.off('disconnected', handleDisconnected);
      connectionManager.off('error', handleError);
    };
  }, [info, success, warning, error]);

  return null;
}
```

### 3. Transfer Complete with Action

```tsx
'use client';

import { useToast } from '@/components/ui';

export function TransferComplete({ fileName, fileUrl }: Props) {
  const { addToast } = useToast();

  const notifyComplete = () => {
    addToast({
      variant: 'success',
      title: 'Transfer Complete',
      message: `${fileName} is ready`,
      action: {
        label: 'Open File',
        onClick: () => {
          window.open(fileUrl, '_blank');
        }
      },
      duration: 8000
    });
  };

  return <button onClick={notifyComplete}>Complete Transfer</button>;
}
```

### 4. Encryption Status

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useEffect } from 'react';

export function EncryptionStatus() {
  const { success, warning } = useToast();

  useEffect(() => {
    // Notify about encryption status
    const checkEncryption = () => {
      if (isQuantumSafeEnabled()) {
        success('Quantum-safe encryption active', {
          title: 'Enhanced Security',
          duration: 5000
        });
      } else {
        warning('Using standard encryption', {
          title: 'Security Notice',
          duration: 6000
        });
      }
    };

    checkEncryption();
  }, [success, warning]);

  return null;
}
```

### 5. Storage Warnings

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useEffect } from 'react';

export function StorageMonitor() {
  const { warning, error, addToast } = useToast();

  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

        if (percentUsed > 90) {
          error('Storage almost full! Please free up space.', {
            title: 'Critical Storage',
            duration: Infinity
          });
        } else if (percentUsed > 75) {
          addToast({
            variant: 'warning',
            title: 'Storage Warning',
            message: 'Storage is getting low',
            action: {
              label: 'Manage',
              onClick: () => {
                // Navigate to storage management
                window.location.href = '/settings/storage';
              }
            },
            duration: 8000
          });
        }
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [warning, error, addToast]);

  return null;
}
```

### 6. Network Status

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useEffect } from 'react';

export function NetworkStatus() {
  const { warning, success, addToast } = useToast();

  useEffect(() => {
    let offlineToastId: string | null = null;

    const handleOnline = () => {
      if (offlineToastId) {
        removeToast(offlineToastId);
        offlineToastId = null;
      }

      success('Connection restored', {
        title: 'Back Online',
        duration: 4000
      });
    };

    const handleOffline = () => {
      offlineToastId = addToast({
        variant: 'warning',
        title: 'No Connection',
        message: 'You are currently offline. Transfers paused.',
        duration: Infinity
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [warning, success, addToast]);

  return null;
}
```

### 7. Clipboard Operations

```tsx
'use client';

import { useToast } from '@/components/ui';

export function ShareButton({ shareUrl }: Props) {
  const { success, error } = useToast();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      success('Link copied to clipboard', {
        title: 'Copied',
        duration: 3000
      });
    } catch (err) {
      error('Failed to copy link', {
        title: 'Clipboard Error',
        duration: 5000
      });
    }
  };

  return <button onClick={handleShare}>Share Link</button>;
}
```

### 8. Multiple File Transfer

```tsx
'use client';

import { useToast } from '@/components/ui';

export function BulkTransfer({ files }: Props) {
  const { success, error, info, addToast } = useToast();

  const handleBulkTransfer = async () => {
    let successCount = 0;
    let failCount = 0;

    // Show starting toast
    info(`Starting transfer of ${files.length} files...`, {
      title: 'Bulk Transfer',
      duration: 3000
    });

    for (const file of files) {
      try {
        await transferFile(file);
        successCount++;

        // Show individual success (brief)
        success(`${file.name} transferred`, {
          duration: 2000
        });
      } catch (err) {
        failCount++;
      }
    }

    // Show summary
    if (failCount === 0) {
      success(`All ${successCount} files transferred successfully!`, {
        title: 'Transfer Complete',
        duration: 6000
      });
    } else if (successCount > 0) {
      addToast({
        variant: 'warning',
        title: 'Transfer Completed with Errors',
        message: `${successCount} succeeded, ${failCount} failed`,
        action: {
          label: 'View Details',
          onClick: () => {
            // Show detailed report
          }
        },
        duration: 8000
      });
    } else {
      error('All file transfers failed', {
        title: 'Transfer Failed',
        duration: 7000
      });
    }
  };

  return <button onClick={handleBulkTransfer}>Transfer All</button>;
}
```

### 9. Session Timeout Warning

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useEffect } from 'react';

export function SessionManager() {
  const { addToast, warning } = useToast();

  useEffect(() => {
    const sessionDuration = 30 * 60 * 1000; // 30 minutes
    const warningTime = 25 * 60 * 1000; // Warn at 25 minutes

    const warningTimer = setTimeout(() => {
      addToast({
        variant: 'warning',
        title: 'Session Expiring',
        message: 'Your session will expire in 5 minutes',
        action: {
          label: 'Stay Active',
          onClick: () => {
            // Refresh session
            refreshSession();
            warning('Session extended', { duration: 3000 });
          }
        },
        duration: 10000
      });
    }, warningTime);

    return () => clearTimeout(warningTimer);
  }, [addToast, warning]);

  return null;
}
```

### 10. Form Validation

```tsx
'use client';

import { useToast } from '@/components/ui';
import { useState } from 'react';

export function TransferForm() {
  const { success, error, warning } = useToast();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!validateForm(formData)) {
      warning('Please fill in all required fields', {
        title: 'Validation Error',
        duration: 5000
      });
      return;
    }

    try {
      await submitTransfer(formData);
      success('Transfer initiated successfully!', {
        title: 'Success',
        duration: 5000
      });
    } catch (err) {
      error('Failed to initiate transfer', {
        title: 'Error',
        duration: 7000
      });
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Integration with App Layout

Add ToastProvider to your root layout:

```tsx
// app/layout.tsx
import { ToastProvider } from '@/components/ui';

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <ToastProvider
          position="bottom-right"
          maxToasts={5}
        >
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

## Best Practices for Tallow

1. **Transfer Status**: Use `info` for in-progress, `success` for complete
2. **Errors**: Use `error` variant with longer duration (7s+)
3. **Security**: Use `success` for encryption confirmations
4. **Network**: Use `warning` for connectivity issues
5. **Actions**: Include "Retry" for failed operations
6. **Persistent**: Use `Infinity` duration for critical errors only
7. **Bulk Operations**: Show summary toast after completion
8. **Clipboard**: Brief success toast (3s) for copy operations
9. **Validation**: Use `warning` for form validation errors
10. **Session**: Use action buttons for session management

## Testing Toasts in Development

```tsx
// Add to any page for testing
'use client';

import { useToast } from '@/components/ui';

export function ToastTester() {
  const { success, error, warning, info } = useToast();

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 9999 }}>
      <button onClick={() => success('Test success')}>Success</button>
      <button onClick={() => error('Test error')}>Error</button>
      <button onClick={() => warning('Test warning')}>Warning</button>
      <button onClick={() => info('Test info')}>Info</button>
    </div>
  );
}
```

## Performance Tips

1. **Debounce rapid toasts**: Avoid showing too many toasts too quickly
2. **Use toast IDs**: Store IDs for toasts you might need to remove
3. **Limit maxToasts**: Keep it reasonable (3-5) to avoid UI clutter
4. **Set appropriate durations**: 3-7s for most, longer for errors
5. **Clean up on unmount**: Use `clearAll()` when navigating away

## Accessibility Considerations

1. **Don't interrupt transfers**: Toasts are non-blocking
2. **Provide visual + text feedback**: Icons + messages
3. **Keyboard accessible**: All actions keyboard navigable
4. **Screen reader friendly**: Proper ARIA labels
5. **Color contrast**: All variants pass WCAG AA
6. **Reduced motion**: Respects user preferences

This integration guide provides real-world examples for incorporating the toast system throughout the Tallow application!
