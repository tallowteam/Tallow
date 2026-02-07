# Sender Folder Configuration System

Comprehensive file organization system that automatically creates and manages custom folders per sender.

## Overview

The Sender Folder Configuration system allows Tallow to automatically organize received files into sender-specific folders. Users can customize folder names, set default naming templates, and enable/disable automatic folder creation for new senders.

## Features

### Core Functionality
- **Auto-create folders** for new senders based on configurable templates
- **Custom folder names** per sender with conflict resolution
- **Folder naming templates**: sender name, sender + date, or custom patterns
- **Persistent storage** using localStorage
- **Conflict resolution** - automatic numbering for duplicate folder names
- **Search and filter** sender list
- **Bulk operations** - clear all folder assignments
- **Statistics tracking** - auto-created vs manually set folders

### Folder Naming Templates

1. **Sender Name** (default)
   - Format: `John_Doe`
   - Simple, clean folder names

2. **Sender Name + Date**
   - Format: `John_Doe_2026-02-06`
   - Includes current date for organization

3. **Custom Template**
   - Variables: `{sender_name}`, `{date}`, `{year}`, `{month}`
   - Example: `Received_{sender_name}_{year}`

### Conflict Resolution

When a folder name already exists, the system automatically appends a counter:
- First instance: `John_Doe`
- Second instance: `John_Doe (2)`
- Third instance: `John_Doe (3)`

## File Structure

```
lib/storage/
  └── sender-folders.ts          # Core manager class and logic

components/transfer/
  ├── SenderFolderConfig.tsx     # UI component
  ├── SenderFolderConfig.module.css
  ├── SenderFolderConfig.example.tsx
  └── SENDER_FOLDERS_README.md   # This file

lib/hooks/
  └── use-sender-folders.ts      # React hooks for state management
```

## Usage

### Basic Setup

```tsx
import SenderFolderConfig from '@/components/transfer/SenderFolderConfig';

function SettingsPage() {
  return (
    <div>
      <h1>File Organization</h1>
      <SenderFolderConfig />
    </div>
  );
}
```

### Using the Manager Directly

```typescript
import { getSenderFolderManager } from '@/lib/storage/sender-folders';

const manager = getSenderFolderManager();

// Get or create folder when receiving file
function handleIncomingFile(senderId: string, senderName: string, file: File) {
  const folder = manager.getOrCreateFolder(senderId, senderName);
  const savePath = `${folder}/${file.name}`;

  // Save file to the determined path
  saveFile(savePath, file);
}
```

### Using React Hooks

```tsx
import { useSenderFolders } from '@/lib/hooks/use-sender-folders';

function FileReceiver() {
  const { getOrCreateFolder, configs, stats } = useSenderFolders();

  const handleFileReceive = (senderId: string, senderName: string, file: File) => {
    const folder = getOrCreateFolder(senderId, senderName);
    console.log(`Saving to: ${folder}/${file.name}`);
  };

  return (
    <div>
      <p>Total configured folders: {stats.totalFolders}</p>
      {/* ... */}
    </div>
  );
}
```

### Single Sender Hook

```tsx
import { useSenderFolder } from '@/lib/hooks/use-sender-folders';

function SenderSettings({ senderId, senderName }) {
  const { folder, updateFolder, getOrCreate } = useSenderFolder(senderId, senderName);

  return (
    <div>
      <p>Current folder: {folder || 'Not set'}</p>
      <button onClick={() => updateFolder('Custom_Folder')}>
        Set Custom Folder
      </button>
      <button onClick={getOrCreate}>
        Get or Create Folder
      </button>
    </div>
  );
}
```

## API Reference

### SenderFolderManager

Main class for managing sender folder configurations.

#### Methods

##### `setSenderFolder(senderId: string, senderName: string, folderName: string): void`
Set or update custom folder for a specific sender.
- Automatically sanitizes folder name
- Resolves conflicts with existing folders
- Persists to localStorage

##### `getSenderFolder(senderId: string): string | null`
Get the assigned folder for a sender.
- Returns `null` if no folder is assigned

##### `getOrCreateFolder(senderId: string, senderName: string): string`
Get existing folder or create a new one.
- Uses existing assignment if available
- Auto-creates if `autoCreateForNewSenders` is enabled
- Falls back to "Downloads" if auto-create is disabled

##### `getDefaultFolder(senderName: string): string`
Generate default folder name based on template.
- Uses current folder naming template
- Applies sanitization
- Does not persist until first use

##### `getAllSenderFolders(): Map<string, string>`
Get all sender-to-folder mappings.
- Returns Map of senderId → folderName

##### `getAllConfigs(): SenderFolderConfig[]`
Get all folder configurations with full details.
- Includes metadata like creation time, auto-create status

##### `removeSenderFolder(senderId: string): void`
Remove folder assignment for a sender.
- Next file will use default behavior

##### `clearAllFolders(): void`
Remove all folder assignments.
- Resets to clean state

##### `getAutoCreateSetting(): boolean`
Get current auto-create setting.

##### `setAutoCreateSetting(enabled: boolean): void`
Enable or disable auto-create for new senders.

##### `getFolderTemplate(): 'sender_name' | 'sender_name_date' | 'custom'`
Get current folder naming template.

##### `setFolderTemplate(template, customTemplate?): void`
Set folder naming template.

##### `hasSenderFolder(senderId: string): boolean`
Check if sender has a custom folder assigned.

##### `getStats()`
Get statistics about folder configurations.

Returns:
```typescript
{
  totalFolders: number;
  autoCreated: number;
  manuallySet: number;
  recentlyUpdated: number;
}
```

### React Hook: useSenderFolders

Hook providing reactive state management for sender folders.

```typescript
const {
  configs,              // All folder configurations
  autoCreate,          // Auto-create setting
  template,            // Current template
  customTemplate,      // Custom template string
  stats,               // Statistics
  setSenderFolder,     // Set folder for sender
  getSenderFolder,     // Get folder for sender
  getOrCreateFolder,   // Get or create folder
  removeSenderFolder,  // Remove folder assignment
  clearAllFolders,     // Clear all assignments
  setAutoCreate,       // Set auto-create setting
  setTemplate,         // Set template
  hasSenderFolder,     // Check if sender has folder
  refresh,             // Refresh state
} = useSenderFolders();
```

### React Hook: useSenderFolder

Hook for managing a single sender's folder.

```typescript
const {
  folder,        // Current folder name (or null)
  updateFolder,  // Update folder name
  removeFolder,  // Remove folder assignment
  getOrCreate,   // Get or create folder
} = useSenderFolder(senderId, senderName);
```

## Integration Examples

### 1. File Transfer Manager Integration

```typescript
// In your file transfer handler
import { getSenderFolderManager } from '@/lib/storage/sender-folders';

class FileTransferManager {
  private folderManager = getSenderFolderManager();

  async receiveFile(transfer: Transfer) {
    const { senderId, senderName, file } = transfer;

    // Get target folder
    const folder = this.folderManager.getOrCreateFolder(senderId, senderName);

    // Construct save path
    const savePath = `${folder}/${file.name}`;

    // Save file
    await this.saveFile(savePath, file);

    console.log(`File saved to: ${savePath}`);
  }
}
```

### 2. Settings Page Integration

```tsx
import SenderFolderConfig from '@/components/transfer/SenderFolderConfig';

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <section>
        <h2>File Organization</h2>
        <SenderFolderConfig />
      </section>
    </div>
  );
}
```

### 3. Transfer History Integration

```tsx
import { useSenderFolder } from '@/lib/hooks/use-sender-folders';

function TransferHistoryItem({ transfer }) {
  const { folder } = useSenderFolder(transfer.senderId, transfer.senderName);

  return (
    <div>
      <h3>{transfer.fileName}</h3>
      <p>From: {transfer.senderName}</p>
      <p>Saved to: {folder || 'Downloads'}</p>
    </div>
  );
}
```

### 4. Inline Folder Editor

```tsx
import { useSenderFolder } from '@/lib/hooks/use-sender-folders';

function SenderFolderEditor({ senderId, senderName }) {
  const { folder, updateFolder } = useSenderFolder(senderId, senderName);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(folder || '');

  const handleSave = () => {
    updateFolder(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div>
      <span>📁 {folder || 'No folder set'}</span>
      <button onClick={() => setEditing(true)}>Edit</button>
    </div>
  );
}
```

## Storage Format

Data is stored in localStorage under the key `tallow-sender-folders`:

```json
{
  "autoCreateForNewSenders": true,
  "defaultFolderTemplate": "sender_name",
  "customTemplate": "",
  "folders": {
    "sender_123": {
      "senderId": "sender_123",
      "senderName": "John Doe",
      "folderName": "John_Doe",
      "autoCreate": true,
      "createdAt": 1707234567890,
      "lastUpdated": 1707234567890
    }
  }
}
```

## Styling & Theming

The component uses CSS Modules with design tokens:

### CSS Variables Used
- `--bg-base` - Background color
- `--bg-surface` - Surface background
- `--text-primary` - Primary text color
- `--primary-500` (#5E5CE6) - Accent color

### Customization

```tsx
<SenderFolderConfig className="custom-class" />
```

Custom CSS:
```css
.custom-class {
  max-width: 800px;
  margin: 0 auto;
}
```

## Advanced Features

### Export/Import Settings

```typescript
const manager = getSenderFolderManager();

// Export
const settingsJson = manager.exportSettings();
localStorage.setItem('backup', settingsJson);

// Import
const backup = localStorage.getItem('backup');
if (backup) {
  manager.importSettings(backup);
}
```

### Update Sender Name

```typescript
// If sender name changes, update all references
manager.updateSenderName('sender_123', 'Jane Doe');
```

### Custom Template Variables

Available template variables:
- `{sender_name}` - Sanitized sender name
- `{date}` - Current date (YYYY-MM-DD)
- `{year}` - Current year
- `{month}` - Current month (01-12)

Example:
```typescript
manager.setFolderTemplate('custom', 'Received/{year}/{month}/{sender_name}');
// Result: Received/2026/02/John_Doe
```

## Best Practices

1. **Initialize Early**: Call `getSenderFolderManager()` once at app startup
2. **Use Hooks in Components**: Prefer `useSenderFolders()` over direct manager access
3. **Handle Conflicts**: The system auto-resolves, but inform users
4. **Validate Names**: Folder names are auto-sanitized, but validate user input
5. **Backup Settings**: Consider periodic exports for user data safety

## Testing

```typescript
import { getSenderFolderManager } from '@/lib/storage/sender-folders';

describe('SenderFolderManager', () => {
  it('should create folder for new sender', () => {
    const manager = getSenderFolderManager();
    const folder = manager.getOrCreateFolder('test_123', 'Test User');
    expect(folder).toBe('Test_User');
  });

  it('should resolve conflicts', () => {
    const manager = getSenderFolderManager();
    manager.setSenderFolder('sender_1', 'John', 'MyFolder');
    manager.setSenderFolder('sender_2', 'Jane', 'MyFolder');

    const folder1 = manager.getSenderFolder('sender_1');
    const folder2 = manager.getSenderFolder('sender_2');

    expect(folder1).toBe('MyFolder');
    expect(folder2).toBe('MyFolder (2)');
  });
});
```

## Performance Considerations

- **localStorage Limits**: ~5-10MB total storage
- **Max Folders**: Tested with 1000+ configurations
- **Sanitization**: Minimal performance impact
- **React Renders**: Hooks use proper memoization

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser with localStorage support

## Troubleshooting

### Folder Not Created
- Check if auto-create is enabled
- Verify sender ID is valid
- Check browser localStorage quota

### Duplicate Folders
- System auto-resolves by appending (2), (3), etc.
- If needed, manually rename via UI

### Lost Settings
- Caused by browser data clearing
- Implement export/import backup strategy

## Future Enhancements

- [ ] IndexedDB storage for larger datasets
- [ ] Folder hierarchy support (nested folders)
- [ ] Import/export UI in component
- [ ] Folder usage statistics
- [ ] Folder migration tools
- [ ] Cloud sync for folder configurations

## License

MIT - Part of the Tallow project

## Support

For issues or questions, see the main Tallow documentation or open an issue on GitHub.
