# Duplicate File Handling & Quick Actions Guide

This guide explains how to use the duplicate file handling system and quick actions on received files in Tallow.

## Features

### 1. Duplicate File Detection
- Automatically detects when receiving a file with the same name as a previously received file
- Tracks received files in session storage (cleared on browser close)
- Provides three resolution options: Rename, Overwrite, or Skip

### 2. Quick Actions on Received Files
- **Open**: Re-download or view the file
- **Share**: Use Web Share API to share the file
- **Delete**: Remove from transfer history with confirmation

## Components

### DuplicateFileDialog

Shows a modal dialog when a duplicate file is detected.

```tsx
import { DuplicateFileDialog } from '@/components/transfer';

<DuplicateFileDialog
  open={isDialogOpen}
  onClose={closeDialog}
  onConfirm={(action, applyToAll) => {
    // Handle user's choice
    // action: 'rename' | 'overwrite' | 'skip'
    // applyToAll: boolean - apply to all duplicates this session
  }}
  fileName="example.pdf"
  suggestedName="example (2).pdf"
/>
```

### FileActions

Action buttons for completed received transfers.

```tsx
import { FileActions } from '@/components/transfer';

<FileActions
  transfer={transfer}
  onOpen={(transfer) => {
    // Handle opening/downloading the file
  }}
  onShare={(transfer) => {
    // Handle sharing (optional - uses Web Share API by default)
  }}
  onDelete={(transfer) => {
    // Handle deleting from history
  }}
  mobileMenu={false} // Set to true for mobile three-dot menu
/>
```

## Hooks

### useDuplicateFileHandler

Complete hook for managing duplicate file dialogs.

```tsx
import { useDuplicateFileHandler } from '@/lib/hooks/use-duplicate-file-handler';
import { DuplicateFileDialog } from '@/components/transfer';

function FileReceiver() {
  const {
    showDialog,
    isDialogOpen,
    currentFileName,
    suggestedName,
    handleChoice,
    closeDialog,
  } = useDuplicateFileHandler();

  const handleFileReceived = async (fileName: string) => {
    const result = await showDialog(fileName);

    if (result.action === 'skip') {
      console.log('User chose to skip this file');
      return;
    }

    const finalName = result.newName || fileName;
    console.log(`Saving file as: ${finalName}`);
    // Save the file with finalName
  };

  return (
    <>
      <button onClick={() => handleFileReceived('example.pdf')}>
        Receive File
      </button>

      <DuplicateFileDialog
        open={isDialogOpen}
        onClose={closeDialog}
        onConfirm={handleChoice}
        fileName={currentFileName || ''}
        suggestedName={suggestedName || undefined}
      />
    </>
  );
}
```

### useAutoDuplicateHandler

Simplified hook for automatic rename without showing a dialog.

```tsx
import { useAutoDuplicateHandler } from '@/lib/hooks/use-duplicate-file-handler';

function AutoFileReceiver() {
  const { processFile } = useAutoDuplicateHandler();

  const handleFileReceived = async (fileName: string) => {
    // Automatically renames duplicates without user interaction
    const finalName = await processFile(fileName);
    console.log(`Saving file as: ${finalName}`);
    // Save the file with finalName
  };

  return (
    <button onClick={() => handleFileReceived('example.pdf')}>
      Auto-Receive File
    </button>
  );
}
```

## Utility Functions

### Direct API Usage

```tsx
import {
  handleDuplicateFile,
  isFileReceived,
  markFileAsReceived,
  getNextAvailableFileName,
  clearReceivedFiles,
  resetDuplicatePreference,
} from '@/lib/utils/duplicate-file-handler';

// Check if a file has been received before
if (isFileReceived('example.pdf')) {
  console.log('File already received');
}

// Get next available name
const newName = getNextAvailableFileName('example.pdf');
// Returns: "example (2).pdf" or "example (3).pdf" etc.

// Handle duplicate programmatically
const result = await handleDuplicateFile({
  fileName: 'example.pdf',
  applyToAll: false,
  preselectedAction: 'rename', // Optional: skip dialog
});

// Mark a file as received
markFileAsReceived('example.pdf');

// Clear all received files (e.g., on logout)
clearReceivedFiles();

// Reset session preference for duplicate handling
resetDuplicatePreference();
```

## Integration with Transfer History

The `TransferHistory` component automatically includes quick actions on received files:

```tsx
import { TransferHistory } from '@/components/transfer';

function TransferPage() {
  return (
    <div>
      <h1>Transfer History</h1>
      <TransferHistory />
      {/* FileActions are automatically included */}
    </div>
  );
}
```

## Responsive Behavior

### Desktop
- Actions appear on hover as inline buttons
- Three action buttons: Open, Share, Delete

### Mobile
- Three-dot menu button always visible
- Tapping opens a dropdown menu with all actions
- Menu has a backdrop for easy dismissal

## Styling

All components use CSS Modules with design tokens from `globals.css`:

- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- `--bg-surface`, `--bg-elevated`, `--bg-hover`
- `--border-default`, `--border-strong`
- `--accent`, `--accent-hover`
- `--error`, `--error-subtle`
- `--space-*` for spacing
- `--radius-*` for border radius
- `--transition-fast` for animations

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation supported
- Focus indicators visible
- Screen reader friendly
- Confirmation dialogs for destructive actions

## Session Storage

Duplicate file tracking uses session storage:

- **Key**: `tallow_received_files`
- **Format**: JSON array of file names
- **Lifetime**: Cleared when browser session ends
- **Preference Key**: `tallow_duplicate_preference`
- **Preference Format**: `'rename' | 'overwrite' | 'skip'`

## Best Practices

1. **Always show confirmation for delete actions**
   ```tsx
   // ✅ Good - uses confirmation dialog
   <FileActions onDelete={handleDelete} />

   // ❌ Bad - deletes immediately
   onClick={() => deleteFile(transfer.id)}
   ```

2. **Handle the "Apply to All" preference**
   ```tsx
   const handleChoice = (action, applyToAll) => {
     if (applyToAll) {
       // Store preference for session
       // All subsequent duplicates will use this action
     }
   };
   ```

3. **Clear session data on logout**
   ```tsx
   import { clearReceivedFiles } from '@/lib/utils/duplicate-file-handler';

   const handleLogout = () => {
     clearReceivedFiles();
     // ... other logout logic
   };
   ```

4. **Use toast notifications for feedback**
   ```tsx
   const toast = useToast();

   const handleOpen = (transfer) => {
     toast.success(`Opening ${transfer.files[0].name}...`);
     // ... open logic
   };
   ```

## Example: Complete Integration

```tsx
'use client';

import { useState } from 'react';
import {
  TransferHistory,
  DuplicateFileDialog
} from '@/components/transfer';
import { useDuplicateFileHandler } from '@/lib/hooks/use-duplicate-file-handler';
import { useToast } from '@/components/ui/ToastProvider';

export default function TransferPage() {
  const toast = useToast();
  const {
    showDialog,
    isDialogOpen,
    currentFileName,
    suggestedName,
    handleChoice,
    closeDialog,
  } = useDuplicateFileHandler();

  // Simulate receiving a file
  const handleReceiveFile = async (fileName: string) => {
    // Check for duplicates and get user's choice
    const result = await showDialog(fileName);

    if (result.action === 'skip') {
      toast.info(`Skipped ${fileName}`);
      return;
    }

    const finalName = result.newName || fileName;

    // Save the file (implementation specific)
    saveFile(finalName);

    toast.success(
      result.action === 'rename'
        ? `Saved as ${finalName}`
        : `Saved ${fileName}`
    );
  };

  return (
    <div>
      <h1>File Transfers</h1>

      {/* Transfer history with built-in quick actions */}
      <TransferHistory />

      {/* Duplicate file dialog */}
      <DuplicateFileDialog
        open={isDialogOpen}
        onClose={closeDialog}
        onConfirm={handleChoice}
        fileName={currentFileName || ''}
        suggestedName={suggestedName || undefined}
      />

      {/* Test button */}
      <button onClick={() => handleReceiveFile('test.pdf')}>
        Simulate File Receipt
      </button>
    </div>
  );
}
```

## Troubleshooting

### Actions not appearing on hover
- Check that the transfer status is `'completed'`
- Verify the transfer direction is `'receive'`
- Ensure CSS modules are imported correctly

### Duplicate dialog not showing
- Verify the file has been received before
- Check session storage for `tallow_received_files` key
- Ensure the hook is properly initialized

### Share button not working
- Check browser support for Web Share API
- Use `canShare` from `useWebShare()` to conditionally show
- Provide fallback for unsupported browsers

### Session preference persisting
- Use `resetDuplicatePreference()` to clear
- Session storage is cleared on browser close
- Manual clear via DevTools > Application > Session Storage
