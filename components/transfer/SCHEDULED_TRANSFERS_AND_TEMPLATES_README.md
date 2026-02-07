# Scheduled Transfers & Transfer Templates

Complete implementation of scheduled transfers and reusable transfer templates for the Tallow file transfer application.

## Overview

This implementation provides two powerful features:

1. **Scheduled Transfers** - Schedule file transfers to execute automatically at specific times with optional repeat functionality
2. **Transfer Templates** - Save and reuse transfer configurations for common scenarios

## Architecture

### Plain TypeScript Modules (No React Hooks)

Both features are implemented as plain TypeScript modules that use `.getState()` for store access, ensuring they work outside React components:

- `lib/transfer/scheduled-transfer.ts` - Scheduled transfer logic
- `lib/transfer/transfer-templates.ts` - Template management logic

### React Components

- `ScheduleTransferDialog.tsx` - Modal dialog for scheduling transfers
- `TransferTemplates.tsx` - Template management UI
- `ScheduledTransfersPanel.tsx` - View and manage scheduled transfers

## Features

### Scheduled Transfers

#### Core Functionality

- **Schedule transfers** for future execution with specific date/time
- **Repeat options**: Once, Daily, or Weekly
- **Auto-retry** when target device is unavailable (configurable, up to 3 retries)
- **Device availability checking** before execution
- **Persistent storage** using localStorage
- **Automatic rescheduling** on app restart

#### Usage Example

```typescript
import { scheduleTransfer } from '@/lib/transfer/scheduled-transfer';

// Schedule a one-time transfer
const scheduleId = scheduleTransfer({
  files: [file1, file2],
  deviceId: 'device-123',
  scheduledTime: new Date('2024-12-25 10:00'),
  repeat: 'once',
  autoRetry: true,
  maxRetries: 3,
});

// Schedule a daily transfer
scheduleTransfer({
  files: [dailyReport],
  deviceId: 'backup-device',
  scheduledTime: new Date('2024-12-20 18:00'),
  repeat: 'daily',
});

// Cancel a scheduled transfer
cancelScheduled(scheduleId);

// Get all scheduled transfers
const scheduled = getScheduledTransfers();
```

#### API Reference

##### `scheduleTransfer(options: ScheduledTransferOptions): string`

Schedules a new transfer and returns the schedule ID.

**Options:**
- `files: File[]` - Files to transfer
- `deviceId: string` - Target device ID
- `scheduledTime: Date` - When to execute
- `repeat?: 'once' | 'daily' | 'weekly'` - Repeat frequency (default: 'once')
- `autoRetry?: boolean` - Retry if device unavailable (default: true)
- `maxRetries?: number` - Maximum retry attempts (default: 3)

##### `cancelScheduled(scheduleId: string): boolean`

Cancels a scheduled transfer.

##### `getScheduledTransfers(): ScheduledTransfer[]`

Returns all scheduled transfers (active and completed).

##### `deleteScheduled(scheduleId: string): boolean`

Permanently removes a scheduled transfer from history.

##### `onScheduledTransfersChange(listener: () => void): () => void`

Subscribe to changes. Returns unsubscribe function.

### Transfer Templates

#### Core Functionality

- **Create templates** with custom configurations
- **Apply templates** to transfers
- **Edit and update** templates
- **Duplicate templates** for variations
- **Default templates** included (Quick, Secure, Private)
- **Usage tracking** (use count, last used)
- **Import/Export** templates as JSON
- **Persistent storage** using localStorage

#### Default Templates

1. **Quick Transfer**
   - Standard encryption
   - No compression
   - Fast and simple

2. **Secure Transfer**
   - Post-Quantum Cryptography (PQC)
   - Compression enabled
   - Metadata stripping

3. **Private Transfer**
   - PQC encryption
   - Onion routing
   - Metadata stripping
   - Maximum privacy

#### Usage Example

```typescript
import {
  createTemplate,
  getTemplates,
  applyTemplate,
  deleteTemplate,
} from '@/lib/transfer/transfer-templates';

// Create a custom template
const templateId = createTemplate(
  'Quick Share',
  {
    compression: false,
    encryption: 'standard',
    autoAccept: false,
    stripMetadata: false,
  },
  'Fast transfer with basic security'
);

// Apply template to a transfer
const files = [file1, file2];
const options = applyTemplate(templateId, files);
// Use options to configure the transfer...

// Get all templates
const templates = getTemplates();

// Delete a template
deleteTemplate(templateId);

// Export templates to JSON
const json = exportTemplates();

// Import templates from JSON
const count = importTemplates(json);
```

#### API Reference

##### `createTemplate(name: string, options: TransferTemplateOptions, description?: string): string | null`

Creates a new template and returns the template ID.

**Options:**
- `deviceId?: string` - Default target device
- `compression?: boolean` - Enable compression
- `encryption?: 'pqc' | 'standard' | 'none'` - Encryption type
- `maxSize?: number` - Maximum file size (bytes)
- `autoAccept?: boolean` - Auto-accept transfers
- `stripMetadata?: boolean` - Strip file metadata
- `enableOnionRouting?: boolean` - Enable onion routing

##### `getTemplates(): TransferTemplate[]`

Returns all templates.

##### `applyTemplate(templateId: string, files: File[]): TransferTemplateOptions | null`

Applies template settings and updates usage statistics.

##### `deleteTemplate(templateId: string): boolean`

Deletes a custom template (default templates cannot be deleted).

##### `duplicateTemplate(templateId: string, newName?: string): string | null`

Creates a copy of an existing template.

##### `onTemplatesChange(listener: () => void): () => void`

Subscribe to template changes.

## React Components

### ScheduleTransferDialog

Modal dialog for scheduling transfers.

```tsx
import ScheduleTransferDialog from '@/components/transfer/ScheduleTransferDialog';

function MyComponent() {
  const [files, setFiles] = useState<File[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <>
      <button onClick={() => setShowSchedule(true)}>
        Schedule Transfer
      </button>

      <ScheduleTransferDialog
        files={files}
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        onScheduled={(scheduleId) => {
          console.log('Transfer scheduled:', scheduleId);
        }}
      />
    </>
  );
}
```

**Props:**
- `files: File[]` - Files to schedule
- `isOpen: boolean` - Dialog visibility
- `onClose: () => void` - Close handler
- `onScheduled?: (scheduleId: string) => void` - Success callback

### TransferTemplates

Template management UI.

```tsx
import TransferTemplates from '@/components/transfer/TransferTemplates';

function TemplatesPage() {
  const handleApplyTemplate = (options: TransferTemplateOptions) => {
    // Apply template settings to current transfer
    console.log('Applying template:', options);
  };

  return (
    <TransferTemplates onApplyTemplate={handleApplyTemplate} />
  );
}
```

**Props:**
- `onApplyTemplate?: (options: TransferTemplateOptions) => void` - Template application callback

### ScheduledTransfersPanel

View and manage scheduled transfers.

```tsx
import ScheduledTransfersPanel from '@/components/transfer/ScheduledTransfersPanel';

function TransfersPage() {
  return (
    <div>
      <h1>My Transfers</h1>
      <ScheduledTransfersPanel />
    </div>
  );
}
```

## Complete Integration Example

Here's a complete example showing how to integrate all features:

```tsx
'use client';

import { useState } from 'react';
import {
  FileDropZone,
  ScheduleTransferDialog,
  TransferTemplates,
  ScheduledTransfersPanel,
} from '@/components/transfer';
import { applyTemplate } from '@/lib/transfer/transfer-templates';
import type { TransferTemplateOptions } from '@/lib/transfer/transfer-templates';

export default function TransferPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<TransferTemplateOptions | null>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleScheduleClick = () => {
    if (files.length === 0) {
      alert('Please select files first');
      return;
    }
    setShowScheduleDialog(true);
  };

  const handleApplyTemplate = (options: TransferTemplateOptions) => {
    setTemplateOptions(options);
    console.log('Template applied:', options);
    // Apply options to your transfer configuration...
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>File Transfer</h1>

      {/* File Selection */}
      <FileDropZone onFilesSelected={handleFilesSelected} />

      {/* Action Buttons */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button onClick={handleScheduleClick} disabled={files.length === 0}>
          Schedule Transfer
        </button>
        <button onClick={() => {/* instant transfer */}}>
          Send Now
        </button>
      </div>

      {/* Transfer Templates */}
      <div style={{ marginTop: '2rem' }}>
        <TransferTemplates onApplyTemplate={handleApplyTemplate} />
      </div>

      {/* Scheduled Transfers Panel */}
      <div style={{ marginTop: '2rem' }}>
        <ScheduledTransfersPanel />
      </div>

      {/* Schedule Dialog */}
      <ScheduleTransferDialog
        files={files}
        isOpen={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        onScheduled={(scheduleId) => {
          console.log('Transfer scheduled:', scheduleId);
          setShowScheduleDialog(false);
          setFiles([]);
        }}
      />
    </div>
  );
}
```

## Storage & Persistence

### localStorage Keys

- `tallow-scheduled-transfers` - Scheduled transfers data
- `tallow-transfer-templates` - Template configurations

### Data Structures

#### ScheduledTransfer
```typescript
interface ScheduledTransfer {
  id: string;
  files: FileInfo[];
  deviceId: string;
  scheduledTime: number;
  repeat: 'once' | 'daily' | 'weekly';
  autoRetry: boolean;
  maxRetries: number;
  retryCount: number;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  lastAttempt: number | null;
  nextRun: number | null;
  error: string | null;
}
```

#### TransferTemplate
```typescript
interface TransferTemplate {
  id: string;
  name: string;
  description?: string;
  options: TransferTemplateOptions;
  createdAt: number;
  lastUsed: number | null;
  useCount: number;
}
```

## Error Handling

### Scheduled Transfers

- **Device Unavailable**: Automatic retry with exponential backoff (5 minutes delay)
- **Transfer Fails**: Error stored in `scheduled.error` field
- **Missed Schedule**: One-time transfers marked as failed; recurring transfers calculate next run

### Templates

- **Duplicate Names**: Template creation fails with error message
- **Invalid Data**: Returns `null` on failure
- **Missing Templates**: Returns `null` when template not found

## Best Practices

### Scheduled Transfers

1. **Always check device availability** before showing schedule dialog
2. **Set reasonable retry limits** to avoid excessive retry attempts
3. **Clean up old scheduled transfers** periodically
4. **Notify users** when scheduled transfers complete or fail
5. **Handle timezone differences** when scheduling across devices

### Templates

1. **Provide clear template names** that describe their purpose
2. **Use descriptions** to explain when to use each template
3. **Track usage statistics** to identify popular templates
4. **Backup templates** using export functionality
5. **Validate options** before applying templates

## Styling

Both components use CSS Modules with a dark theme and purple accent color matching the Tallow design system:

- **Primary Color**: `#8b5cf6` (Purple)
- **Secondary Color**: `#6366f1` (Indigo)
- **Background**: `#1a1a2e` (Dark blue-gray)
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)

### Customization

To customize styling, modify the corresponding `.module.css` files:
- `ScheduleTransferDialog.module.css`
- `TransferTemplates.module.css`
- `ScheduledTransfersPanel.module.css`

## Testing

### Unit Tests

Test scheduled transfer logic:

```typescript
import { scheduleTransfer, getScheduledTransfers, cancelScheduled } from '@/lib/transfer/scheduled-transfer';

describe('Scheduled Transfers', () => {
  it('should schedule a transfer', () => {
    const id = scheduleTransfer({
      files: [mockFile],
      deviceId: 'device-1',
      scheduledTime: new Date(Date.now() + 60000),
      repeat: 'once',
    });

    const scheduled = getScheduledTransfers();
    expect(scheduled.find(s => s.id === id)).toBeTruthy();
  });

  it('should cancel a scheduled transfer', () => {
    const id = scheduleTransfer({
      files: [mockFile],
      deviceId: 'device-1',
      scheduledTime: new Date(Date.now() + 60000),
    });

    const cancelled = cancelScheduled(id);
    expect(cancelled).toBe(true);
  });
});
```

### Integration Tests

Test template application:

```typescript
import { createTemplate, applyTemplate } from '@/lib/transfer/transfer-templates';

describe('Transfer Templates', () => {
  it('should create and apply a template', () => {
    const id = createTemplate('Test', { compression: true });
    const options = applyTemplate(id, [mockFile]);

    expect(options).toBeTruthy();
    expect(options?.compression).toBe(true);
  });
});
```

## Performance Considerations

### Scheduled Transfers

- **Timer Management**: Uses single timeout per scheduled transfer
- **Cleanup**: Old completed transfers automatically removed after 30 days
- **Memory**: Keeps only essential data in memory
- **Persistence**: Saves to localStorage only on changes

### Templates

- **Lazy Loading**: Templates loaded once on mount
- **Efficient Updates**: Only affected templates re-rendered
- **Minimal Storage**: Only custom templates exported/imported
- **Fast Access**: Templates stored in memory after initial load

## Browser Compatibility

- **localStorage**: Required (fallback to memory if unavailable)
- **Date/Time Picker**: Uses native HTML5 `datetime-local` input
- **Timers**: Standard `setTimeout`/`setInterval`
- **ES6+**: Requires modern browser with ES6 support

## Future Enhancements

Potential improvements:

1. **Cloud Sync**: Sync scheduled transfers across devices
2. **Notifications**: Browser/system notifications for scheduled transfers
3. **Calendar View**: Visual calendar for scheduled transfers
4. **Template Sharing**: Share templates between users
5. **Smart Scheduling**: AI-powered optimal transfer times
6. **Batch Operations**: Schedule multiple transfers at once
7. **Transfer History**: Detailed analytics for templates and schedules
8. **Conflict Resolution**: Handle overlapping scheduled transfers

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in source files
3. Examine example implementations
4. Test with mock data first

## License

Part of the Tallow project. See project LICENSE for details.
