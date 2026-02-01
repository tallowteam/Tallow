# Folder Transfer Quick Start

Get up and running with folder transfers in 5 minutes.

## Installation

The folder transfer feature is already integrated. Just install dependencies:

```bash
npm install
```

## Basic Usage

### 1. Select a Folder

```tsx
import { FolderSelector } from '@/components/transfer/FolderSelector';

function MyComponent() {
  return (
    <FolderSelector
      onFolderSelected={(folder, compressed) => {
        console.log(`Selected: ${folder.name}`);
        console.log(`Files: ${folder.fileCount}`);
        console.log(`Size: ${folder.totalSize} bytes`);
      }}
      allowCompression={true}
    />
  );
}
```

### 2. Display Folder Structure

```tsx
import { FolderTree } from '@/components/transfer/FolderTree';

function MyComponent({ folder }) {
  return (
    <FolderTree
      folderStructure={folder}
      showStats={true}
    />
  );
}
```

### 3. Send Folder

```tsx
import { sendFolder } from '@/lib/transfer/folder-transfer-integration';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';

async function sendMyFolder(folder) {
  const transferManager = new PQCTransferManager();
  await transferManager.initializeSession('send');

  await sendFolder(transferManager, folder, {
    compress: true,
    onFolderProgress: (current, total, file) => {
      console.log(`Progress: ${current}/${total}`);
      console.log(`Current file: ${file}`);
    }
  });

  console.log('Folder sent!');
}
```

### 4. Receive Folder

```tsx
import { FolderReceiver } from '@/lib/transfer/folder-transfer-integration';

function setupReceiver(transferManager) {
  const receiver = new FolderReceiver(transferManager, {
    onProgress: (state) => {
      console.log(`Received: ${state.transferredFiles}/${state.totalFiles}`);
    },
    onComplete: (folder) => {
      console.log(`Got folder: ${folder.name}`);
      // Display or download folder
    }
  });

  return receiver;
}
```

### 5. Download as ZIP

```tsx
import { FolderDownload } from '@/components/transfer/FolderDownload';

function MyComponent({ receivedFolder }) {
  return (
    <FolderDownload
      folderStructure={receivedFolder}
      onDownloadComplete={() => {
        console.log('Downloaded!');
      }}
    />
  );
}
```

## Common Patterns

### Filter Files Before Sending

```tsx
import { filterFilesByExtension } from '@/lib/transfer/folder-transfer';

// Only send images
const images = filterFilesByExtension(folder, ['jpg', 'png', 'gif']);
await sendFolder(transferManager, images);

// Only send code
const code = filterFilesByExtension(folder, ['js', 'ts', 'py']);
await sendFolder(transferManager, code, { compress: true });
```

### Get Folder Info

```tsx
import { getFolderStats, formatFileSize } from '@/lib/transfer/folder-transfer';

const stats = getFolderStats(folder);

console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total folders: ${stats.totalFolders}`);
console.log(`Total size: ${formatFileSize(stats.totalSize)}`);
console.log(`File types:`, stats.fileTypes);
console.log(`Largest file:`, stats.largestFile?.name);
```

### Compress Before Transfer

```tsx
import { compressFolder } from '@/lib/transfer/folder-transfer';

const zipBlob = await compressFolder(folder, (progress, file) => {
  console.log(`Compressing: ${progress}%`);
});

console.log(`Original: ${folder.totalSize} bytes`);
console.log(`Compressed: ${zipBlob.size} bytes`);
console.log(`Saved: ${((1 - zipBlob.size / folder.totalSize) * 100).toFixed(1)}%`);
```

### Show Progress

```tsx
import { FolderProgress } from '@/components/transfer/FolderProgress';

function MyTransfer({ folder }) {
  const [progress, setProgress] = useState({ transferred: 0, total: folder.fileCount });

  return (
    <FolderProgress
      folderName={folder.name}
      totalFiles={progress.total}
      transferredFiles={progress.transferred}
      totalSize={folder.totalSize}
      transferredSize={calculateTransferred()}
      status="transferring"
    />
  );
}
```

## Complete Example

```tsx
'use client';

import { useState } from 'react';
import { FolderSelector } from '@/components/transfer/FolderSelector';
import { FolderTree } from '@/components/transfer/FolderTree';
import { FolderProgress } from '@/components/transfer/FolderProgress';
import { sendFolder } from '@/lib/transfer/folder-transfer-integration';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import { Button } from '@/components/ui/button';

export function SimpleFolderTransfer() {
  const [folder, setFolder] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [transferManager] = useState(() => new PQCTransferManager());

  const handleSend = async () => {
    if (!folder) return;

    setTransferring(true);
    await transferManager.initializeSession('send');

    await sendFolder(transferManager, folder, {
      compress: true,
      onFolderProgress: (current, total, file) => {
        setProgress({ current, total, file });
      }
    });

    setTransferring(false);
    alert('Folder sent!');
  };

  return (
    <div className="space-y-4">
      <FolderSelector
        onFolderSelected={(folder) => setFolder(folder)}
        allowCompression={true}
      />

      {folder && (
        <>
          <FolderTree folderStructure={folder} showStats={true} />

          <Button onClick={handleSend} disabled={transferring}>
            {transferring ? 'Sending...' : 'Send Folder'}
          </Button>
        </>
      )}

      {transferring && (
        <FolderProgress
          folderName={folder.name}
          totalFiles={progress.total}
          transferredFiles={progress.current}
          currentFile={progress.file}
          totalSize={folder.totalSize}
          transferredSize={0}
          status="transferring"
        />
      )}
    </div>
  );
}
```

## Recipes

### Photo Album

```tsx
const photos = filterFilesByExtension(folder, ['jpg', 'jpeg', 'png', 'heic', 'raw']);
await sendFolder(transferManager, photos, {
  compress: false // Images don't compress well
});
```

### Code Project

```tsx
const code = filterFilesByExtension(folder, [
  'js', 'jsx', 'ts', 'tsx',
  'py', 'java', 'cpp', 'c',
  'html', 'css', 'json', 'md'
]);

await sendFolder(transferManager, code, {
  compress: true // Code compresses 60-70%
});
```

### Documents

```tsx
const docs = filterFilesByExtension(folder, [
  'pdf', 'doc', 'docx',
  'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'md'
]);

await sendFolder(transferManager, docs, {
  compress: true // Documents compress 40-60%
});
```

## Tips

1. **Use compression for text files** - Code and documents compress 60-70%
2. **Skip compression for media** - Images and videos are already compressed
3. **Filter unnecessary files** - Use extension filters to reduce size
4. **Show progress** - Large folders take time, keep users informed
5. **Handle errors** - Network issues can interrupt transfers

## Troubleshooting

### Folder too large

```tsx
<FolderSelector
  maxSize={10 * 1024 * 1024 * 1024} // Increase to 10GB
/>
```

### Compression too slow

```tsx
<FolderSelector
  allowCompression={false} // Disable compression
/>
```

Or use file filters to reduce folder size.

### Transfer failed

Add error handling:

```tsx
try {
  await sendFolder(transferManager, folder, { compress: true });
} catch (error) {
  console.error('Transfer failed:', error);
  alert('Transfer failed. Please try again.');
}
```

## Next Steps

1. Read [FOLDER_TRANSFER_GUIDE.md](./FOLDER_TRANSFER_GUIDE.md) for detailed usage
2. Check [FOLDER_TRANSFER_API.md](./FOLDER_TRANSFER_API.md) for API reference
3. See [examples/](./examples/) for complete implementations
4. Run tests: `npm run test:unit -- tests/unit/transfer/folder-transfer.test.ts`

## Need Help?

- Check the [API Reference](./FOLDER_TRANSFER_API.md)
- See [Examples](./examples/)
- Read [Troubleshooting Guide](./FOLDER_TRANSFER_GUIDE.md#troubleshooting)
- Review [Unit Tests](./tests/unit/transfer/folder-transfer.test.ts)

Happy transferring!
