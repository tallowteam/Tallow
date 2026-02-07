# Scheduled Transfers & Templates - Quick Reference

## Scheduled Transfers

### Basic Usage

```typescript
import { scheduleTransfer, cancelScheduled, getScheduledTransfers } from '@/lib/transfer/scheduled-transfer';

// Schedule a one-time transfer
const id = scheduleTransfer({
  files: [file1, file2],
  deviceId: 'device-123',
  scheduledTime: new Date('2024-12-25 10:00'),
  repeat: 'once',
  autoRetry: true,
  maxRetries: 3,
});

// Cancel it
cancelScheduled(id);

// Get all scheduled
const scheduled = getScheduledTransfers();
```

### Component Usage

```tsx
import ScheduleTransferDialog from '@/components/transfer/ScheduleTransferDialog';

<ScheduleTransferDialog
  files={files}
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onScheduled={(id) => console.log('Scheduled:', id)}
/>
```

## Transfer Templates

### Basic Usage

```typescript
import { createTemplate, applyTemplate, getTemplates } from '@/lib/transfer/transfer-templates';

// Create template
const id = createTemplate('Quick Share', {
  compression: false,
  encryption: 'standard',
  autoAccept: false,
});

// Apply template
const options = applyTemplate(id, files);

// Get all templates
const templates = getTemplates();
```

### Component Usage

```tsx
import TransferTemplates from '@/components/transfer/TransferTemplates';

<TransferTemplates
  onApplyTemplate={(options) => {
    // Use template options
  }}
/>
```

## Complete Example

```tsx
import { useState } from 'react';
import { ScheduleTransferDialog, TransferTemplates, ScheduledTransfersPanel } from '@/components/transfer';

function TransferPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <div>
      <button onClick={() => setShowSchedule(true)}>
        Schedule Transfer
      </button>

      <TransferTemplates onApplyTemplate={(opts) => console.log(opts)} />

      <ScheduledTransfersPanel />

      <ScheduleTransferDialog
        files={files}
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        onScheduled={(id) => console.log('Scheduled:', id)}
      />
    </div>
  );
}
```

## API Quick Reference

### Scheduled Transfers

| Function | Purpose | Returns |
|----------|---------|---------|
| `scheduleTransfer(options)` | Schedule a transfer | `string` (schedule ID) |
| `cancelScheduled(id)` | Cancel scheduled transfer | `boolean` |
| `deleteScheduled(id)` | Delete from history | `boolean` |
| `getScheduledTransfers()` | Get all scheduled | `ScheduledTransfer[]` |
| `onScheduledTransfersChange(fn)` | Subscribe to changes | `() => void` (unsubscribe) |

### Templates

| Function | Purpose | Returns |
|----------|---------|---------|
| `createTemplate(name, options, desc?)` | Create template | `string \| null` |
| `getTemplates()` | Get all templates | `TransferTemplate[]` |
| `applyTemplate(id, files)` | Apply template | `TransferTemplateOptions \| null` |
| `deleteTemplate(id)` | Delete template | `boolean` |
| `duplicateTemplate(id, name?)` | Duplicate template | `string \| null` |
| `onTemplatesChange(fn)` | Subscribe to changes | `() => void` |

## Default Templates

1. **Quick Transfer** - Fast with basic encryption
2. **Secure Transfer** - PQC encryption + compression
3. **Private Transfer** - PQC + onion routing + metadata stripping

## Repeat Options

- `'once'` - One-time transfer
- `'daily'` - Repeats daily
- `'weekly'` - Repeats weekly

## Encryption Types

- `'none'` - No encryption
- `'standard'` - AES-256-GCM
- `'pqc'` - Post-Quantum (ML-KEM-768)

## Storage Keys

- `tallow-scheduled-transfers` - Scheduled transfers
- `tallow-transfer-templates` - Templates

## Component Props

### ScheduleTransferDialog

```typescript
interface Props {
  files: File[];              // Files to schedule
  isOpen: boolean;           // Dialog visibility
  onClose: () => void;       // Close handler
  onScheduled?: (id: string) => void; // Success callback
}
```

### TransferTemplates

```typescript
interface Props {
  onApplyTemplate?: (options: TransferTemplateOptions) => void;
}
```

### ScheduledTransfersPanel

```typescript
// No props required
```

## Common Patterns

### Schedule with Template

```typescript
// 1. Apply template
const templateOptions = applyTemplate('secure-template', files);

// 2. Schedule transfer
const scheduleId = scheduleTransfer({
  files,
  deviceId: 'device-123',
  scheduledTime: new Date('2024-12-25 10:00'),
  repeat: 'daily',
});
```

### Create Custom Template

```typescript
const templateId = createTemplate(
  'My Template',
  {
    compression: true,
    encryption: 'pqc',
    stripMetadata: true,
    enableOnionRouting: false,
  },
  'Custom template for sensitive files'
);
```

### Handle Scheduled Transfer Status

```typescript
import { onScheduledTransfersChange, getScheduledTransfers } from '@/lib/transfer/scheduled-transfer';

const unsubscribe = onScheduledTransfersChange(() => {
  const scheduled = getScheduledTransfers();
  const failed = scheduled.filter(s => s.status === 'failed');

  if (failed.length > 0) {
    console.log('Some transfers failed:', failed);
  }
});

// Clean up
return () => unsubscribe();
```

## File Paths

### TypeScript Modules
- `c:\Users\aamir\Documents\Apps\Tallow\lib\transfer\scheduled-transfer.ts`
- `c:\Users\aamir\Documents\Apps\Tallow\lib\transfer\transfer-templates.ts`

### Components
- `c:\Users\aamir\Documents\Apps\Tallow\components\transfer\ScheduleTransferDialog.tsx`
- `c:\Users\aamir\Documents\Apps\Tallow\components\transfer\TransferTemplates.tsx`
- `c:\Users\aamir\Documents\Apps\Tallow\components\transfer\ScheduledTransfersPanel.tsx`

### Styles
- `ScheduleTransferDialog.module.css`
- `TransferTemplates.module.css`
- `ScheduledTransfersPanel.module.css`

## Tips

1. Always check device availability before scheduling
2. Use templates for recurring transfer scenarios
3. Set reasonable retry limits (3 recommended)
4. Clean up old scheduled transfers periodically
5. Export templates as backup
6. Use descriptive template names
7. Subscribe to changes for real-time updates
8. Handle errors gracefully with try-catch
