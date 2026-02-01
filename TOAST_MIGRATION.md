# Toast Migration Guide

Quick reference for migrating from basic Sonner toasts to the enhanced toast system.

## Import Changes

### Before:
```tsx
import { toast } from 'sonner';
```

### After:
```tsx
import { toast } from '@/lib/utils/toast';
```

## Basic Replacements

### Success Toasts
```tsx
// Before
toast.success('Settings saved');

// After - Same API!
toast.success('Settings saved');

// Enhanced - With description
toast.success('Settings saved', {
  description: 'Your changes have been applied'
});
```

### Error Toasts
```tsx
// Before
toast.error('Connection failed');

// After - Now persistent by default!
toast.error('Connection failed');

// With retry action
toast.error('Connection failed', {
  action: {
    label: 'Retry',
    onClick: () => retry()
  }
});
```

### Info Toasts
```tsx
// Before
toast.info('Connecting...');

// After - Same!
toast.info('Connecting...');
```

### Loading Toasts
```tsx
// Before
const id = toast.loading('Processing...');
toast.dismiss(id);

// After - Same!
const id = toast.loading('Processing...');
toast.dismiss(id);
```

## Specialized Replacements

### File Operations

#### File Upload
```tsx
// Before
toast.success(`Added ${files.length} file${files.length !== 1 ? 's' : ''}`);

// After - Cleaner!
toast.fileUploaded(
  files.length === 1 ? files[0].name : `${files.length} files`,
  files.length
);
```

#### File Download
```tsx
// Before
toast.success(`Received: ${filename}`);

// After
toast.fileDownloaded(filename);
```

#### File Copy
```tsx
// Before
toast.success('Code copied!');

// After
toast.copiedToClipboard(code);
```

#### File Delete (with Undo!)
```tsx
// Before
toast.success(`Deleted ${filename}`);

// After - With undo functionality!
toast.fileDeleted(filename, () => {
  restoreFile(backup);
});
```

### Connection Events

#### Connected
```tsx
// Before
toast.success(`Connected to ${device.name}`);

// After
toast.connected(device.name);
```

#### Disconnected
```tsx
// Before
toast.info('Connection closed');

// After
toast.disconnected(device?.name);
```

#### Connection Error
```tsx
// Before
toast.error('Connection timed out. The peer may be unreachable.');

// After - Now persistent with better UX!
toast.connectionError('Timeout - peer unreachable');
```

### Transfer Events

#### Transfer Started
```tsx
// Before
toast.info(`Receiving encrypted file (${formatFileSize(size)})...`);

// After
toast.transferStarted(filename);
```

#### Transfer Complete
```tsx
// Before
toast.success(`Received: ${filename}`, {
  description: 'Click to download',
  action: { label: 'Download', onClick: () => download() }
});

// After - Cleaner!
toast.transferComplete(filename, () => download());
```

#### Transfer Failed
```tsx
// Before
toast.error('Transfer failed');

// After
toast.transferFailed(error.message);
```

### Settings

#### Settings Saved
```tsx
// Before
toast.success('Settings saved');

// After
toast.settingsSaved();
```

#### Settings Reset
```tsx
// Before
toast.success('Transfer history cleared');

// After - With undo!
toast.withUndo('Transfer history cleared', () => {
  restoreHistory(backup);
});
```

### Security

#### Encryption Status
```tsx
// Before
toast.success('PQC encryption active. Ready to transfer.');

// After
toast.encryptionEnabled();
```

#### Security Warnings
```tsx
// Before
toast.warning('Verification required');

// After - Longer duration for security warnings
toast.securityWarning('Peer verification required before sending files');
```

## File: app/app/page.tsx

### Connection Timeout
```tsx
// Line ~210
// Before
toast.error('Connection timed out. The peer may be unreachable.');

// After
toast.connectionError('Timeout - peer unreachable');
```

### Clipboard Received
```tsx
// Line ~229
// Before
toast.success('Clipboard received', {
  description: clipboardData.slice(0, 50),
  action: { label: 'Copy', onClick: () => { /* ... */ } }
});

// After
toast.copiedToClipboard(clipboardData);
```

### Connection Established
```tsx
// Lines ~257, 289
// Before
toast.success('Connected! Establishing encrypted session...');
toast.success('PQC encryption active. Ready to transfer.');

// After
toast.connected(peerId);
toast.encryptionEnabled();
```

### File Received
```tsx
// Line ~323
// Before
toast.success(`Received: ${filename}`, {
  description: 'Click to download',
  action: { label: 'Download', onClick: () => downloadFile(...) }
});

// After
toast.transferComplete(filename, () => downloadFile(...));
```

### Connection Events
```tsx
// Lines ~372, 376
// Before
toast.info('Connection closed');
toast.error('Connection error');

// After
toast.disconnected();
toast.connectionError('Connection error');
```

### Code Generated
```tsx
// Line ~512
// Before
toast.success('New code generated');

// After
toast.success('New code generated'); // Keep as-is, works fine!
```

### Files Added
```tsx
// Line ~531
// Before
toast.success(`Added ${files.length} file${files.length !== 1 ? 's' : ''}`);

// After
toast.fileUploaded(
  files.length === 1 ? files[0].name : `${files.length} files`,
  files.length
);
```

### Device Selection
```tsx
// Lines ~561, 567, 599, 606, 610
// Before
toast.info(`Selected ${device.name}`);
toast.info(`Connecting to ${device.name}...`);
toast.error('Failed to connect');
toast.info(`${device.isFavorite ? 'Removed from' : 'Added to'} favorites`);
toast.info('Scanning for devices...');

// After - Keep as-is or enhance:
toast.info(`Selected ${device.name}`);
toast.info(`Connecting to ${device.name}...`);
toast.connectionError('Failed to connect');
toast.success(`${device.isFavorite ? 'Removed from' : 'Added to'} favorites`);
toast.info('Scanning for devices...');
```

### Transfer Complete
```tsx
// Lines ~1049, 1079
// Before
toast.success(`Sent: ${fileData.name}`);
toast.success('All files sent with PQC encryption!');

// After
toast.transferComplete(fileData.name);
toast.success('All files sent with PQC encryption!');
```

### Transfer Failed
```tsx
// Line ~1089
// Before
toast.error('Transfer failed');

// After
toast.transferFailed(error?.message || 'Unknown error');
```

### Clipboard Shared
```tsx
// Lines ~1099, 1118
// Before
toast.error('Clipboard is empty');
toast.success('Clipboard shared!');

// After
toast.error('Clipboard is empty');
toast.copiedToClipboard();
```

## File: app/app/settings/page.tsx

### Settings Saved
```tsx
// Line ~220
// Before
toast.success('Settings saved');

// After
toast.settingsSaved();
```

### Clear History
```tsx
// Lines ~226, 233
// Before
toast.success('Transfer history cleared');
toast.success('Clipboard history cleared');

// After - With undo!
const historyBackup = getTransferHistory();
toast.withUndo('Transfer history cleared', () => {
  restoreHistory(historyBackup);
});

const clipboardBackup = getClipboardHistory();
toast.withUndo('Clipboard history cleared', () => {
  restoreClipboard(clipboardBackup);
});
```

### Friend Code Copied
```tsx
// Line ~240
// Before
toast.success('Friend code copied!');

// After
toast.copiedToClipboard(friendCode);
```

### Friend Removed
```tsx
// Line ~248
// Before
toast.success(`Removed ${friendName}`);

// After - With undo!
toast.fileDeleted(friendName, () => {
  restoreFriend(friend);
});
// Or custom:
toast.withUndo(`Removed ${friendName}`, () => {
  restoreFriend(friend);
});
```

### Settings Changes
```tsx
// Lines ~256, 265, 273, 280
// Before
toast.success(requirePasscode ? 'Passcode now required for this friend' : 'Passcode no longer required');
toast.success(`Save location set to "${name}"`);
toast.success('Save location reset to Downloads');
toast.success('All friends removed');

// After
toast.success(requirePasscode ? 'Passcode required' : 'Passcode removed');
toast.success(`Save location: ${name}`);
toast.settingsReset();
toast.withUndo('All friends removed', () => restoreFriends(backup));
```

### Privacy Settings
```tsx
// Lines ~593, 627, 693
// Before
toast.success(v ? 'Traffic Obfuscation enabled' : 'Traffic Obfuscation disabled');
toast.success(v ? 'Onion Routing enabled' : 'Onion Routing disabled');
toast.success(v ? 'Relay-only mode enabled' : 'Direct connections enabled');

// After
toast.success(v ? 'Traffic obfuscation enabled' : 'Traffic obfuscation disabled');
toast.success(v ? 'Onion routing enabled' : 'Onion routing disabled');
toast.success(v ? 'Relay-only mode enabled' : 'Direct connections enabled');
```

## Advanced Patterns

### Promise-based Operations
```tsx
// Before
const loadingId = toast.loading('Uploading...');
try {
  await upload();
  toast.dismiss(loadingId);
  toast.success('Upload complete!');
} catch (error) {
  toast.dismiss(loadingId);
  toast.error('Upload failed');
}

// After - Much cleaner!
toast.promise(upload(), {
  loading: 'Uploading...',
  success: 'Upload complete!',
  error: 'Upload failed'
});
```

### Chained Operations
```tsx
// Before
toast.success('File deleted');

// After - With undo chain
let isDeleted = true;
toast.withUndo('File deleted', () => {
  if (isDeleted) {
    restoreFile();
    isDeleted = false;
  }
});
```

## Best Practices

1. **Use specialized helpers** when available:
   ```tsx
   // Good
   toast.fileDownloaded(filename);

   // Less good
   toast.success(`Downloaded ${filename}`);
   ```

2. **Add undo to destructive actions**:
   ```tsx
   // Good
   toast.fileDeleted(name, () => restore());

   // Bad
   toast.success('Deleted');
   ```

3. **Provide context in errors**:
   ```tsx
   // Good
   toast.connectionError('Timeout - peer unreachable');

   // Less good
   toast.error('Error');
   ```

4. **Use actions for next steps**:
   ```tsx
   // Good
   toast.transferComplete(filename, () => download());

   // Less good
   toast.success('Transfer complete');
   ```

## Testing Your Changes

1. Visit `/ui-demo` to test all variants
2. Check existing flows still work
3. Test undo functionality
4. Verify persistent errors
5. Check mobile responsiveness

## Rollback

If needed, you can always use the original Sonner:

```tsx
import { sonnerToast } from '@/lib/utils/toast';
sonnerToast.success('Works like original');
```
