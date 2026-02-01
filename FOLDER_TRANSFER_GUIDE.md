# Folder Transfer Guide

Complete guide for implementing and using folder transfer functionality in Tallow.

## Overview

The folder transfer system provides:

- **Full directory structure preservation** - Maintains nested folder hierarchy
- **Compression support** - Optional ZIP compression for faster transfers
- **Progress tracking** - File-by-file progress with speed and ETA
- **System file filtering** - Automatically excludes .DS_Store, Thumbs.db, etc.
- **Pause/resume** - Control over folder transfers
- **Download as ZIP** - Receiver can download folder as a single ZIP file

## Architecture

```
lib/transfer/
├── folder-transfer.ts              # Core folder utilities
├── folder-transfer-integration.ts  # PQC transfer manager integration
└── pqc-transfer-manager.ts        # Updated with relative path support

components/transfer/
├── FolderSelector.tsx              # Folder selection UI
├── FolderTree.tsx                  # Folder structure display
├── FolderProgress.tsx              # Transfer progress display
└── FolderDownload.tsx              # Download received folders
```

## Quick Start

### 1. Basic Folder Selection

```tsx
import { FolderSelector } from '@/components/transfer/FolderSelector';
import { FolderStructure } from '@/lib/transfer/folder-transfer';

function MyComponent() {
  const handleFolderSelected = (folder: FolderStructure, compressed?: Blob) => {
    console.log(`Selected folder: ${folder.name}`);
    console.log(`Files: ${folder.fileCount}, Size: ${folder.totalSize}`);

    if (compressed) {
      console.log('Folder is compressed');
    }
  };

  return (
    <FolderSelector
      onFolderSelected={handleFolderSelected}
      allowCompression={true}
      maxSize={4 * 1024 * 1024 * 1024} // 4GB max
    />
  );
}
```

### 2. Display Folder Structure

```tsx
import { FolderTree } from '@/components/transfer/FolderTree';
import { FolderStructure } from '@/lib/transfer/folder-transfer';

function FolderView({ folder }: { folder: FolderStructure }) {
  return (
    <FolderTree
      folderStructure={folder}
      showStats={true}
      maxHeight={400}
    />
  );
}
```

### 3. Send Folder via PQC Transfer

```tsx
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import { sendFolder } from '@/lib/transfer/folder-transfer-integration';
import { FolderStructure } from '@/lib/transfer/folder-transfer';

async function sendFolderTransfer(
  transferManager: PQCTransferManager,
  folder: FolderStructure
) {
  await sendFolder(transferManager, folder, {
    compress: true, // Enable compression
    onFolderProgress: (transferred, total, currentFile) => {
      console.log(`${transferred}/${total} files - ${currentFile}`);
    },
    onCompressionProgress: (progress) => {
      console.log(`Compression: ${progress}%`);
    },
  });
}
```

### 4. Receive Folder

```tsx
import { FolderReceiver } from '@/lib/transfer/folder-transfer-integration';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';

function setupFolderReceiver(transferManager: PQCTransferManager) {
  const receiver = new FolderReceiver(transferManager, {
    onProgress: (state) => {
      console.log(`Receiving: ${state.transferredFiles}/${state.totalFiles}`);
      console.log(`Current: ${state.currentFile}`);
    },
    onComplete: (folder) => {
      console.log(`Received folder: ${folder.name}`);
      // Display folder or download as ZIP
    },
  });

  // Start receiving when transfer begins
  receiver.startReceiving('ProjectFolder', 50, false);

  return receiver;
}
```

### 5. Download Received Folder

```tsx
import { FolderDownload } from '@/components/transfer/FolderDownload';
import { FolderStructure } from '@/lib/transfer/folder-transfer';

function DownloadFolder({ folder }: { folder: FolderStructure }) {
  return (
    <FolderDownload
      folderStructure={folder}
      autoDownload={false}
      onDownloadComplete={() => {
        console.log('Download complete!');
      }}
    />
  );
}
```

## Advanced Features

### Compression

Folders can be compressed before transfer to reduce size and transfer time:

```tsx
import { compressFolder, decompressFolder } from '@/lib/transfer/folder-transfer';

// Compress folder
const zipBlob = await compressFolder(folderStructure, (progress, file) => {
  console.log(`${progress}% - ${file}`);
});

// Decompress folder
const folder = await decompressFolder(zipBlob, (progress, file) => {
  console.log(`${progress}% - ${file}`);
});
```

### File Filtering

Filter files by extension before transfer:

```tsx
import { filterFilesByExtension } from '@/lib/transfer/folder-transfer';

// Only include images
const imagesOnly = filterFilesByExtension(folderStructure, ['jpg', 'png', 'gif', 'webp']);

// Only include code files
const codeOnly = filterFilesByExtension(folderStructure, ['js', 'ts', 'tsx', 'py', 'java']);
```

### Folder Statistics

Get detailed statistics about a folder:

```tsx
import { getFolderStats } from '@/lib/transfer/folder-transfer';

const stats = getFolderStats(folderStructure);

console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total folders: ${stats.totalFolders}`);
console.log(`Total size: ${stats.totalSize}`);
console.log(`Depth: ${stats.depth} levels`);
console.log(`File types:`, stats.fileTypes); // { js: 10, png: 5, ... }
console.log(`Largest file:`, stats.largestFile?.name);
```

### Batch Transfer with Pause/Resume

```tsx
import { BatchFileTransfer } from '@/lib/transfer/folder-transfer-integration';

const files = folderStructure.files.map(f => ({
  file: f.file,
  relativePath: f.relativePath,
}));

const batchTransfer = new BatchFileTransfer(transferManager, files, {
  onProgress: (current, total, file) => {
    console.log(`${current}/${total} - ${file}`);
  },
  onComplete: () => {
    console.log('All files transferred!');
  },
  onError: (error) => {
    console.error('Transfer error:', error);
  },
});

// Start transfer
await batchTransfer.start();

// Pause transfer
batchTransfer.pause();

// Resume transfer
await batchTransfer.resume();

// Get progress
const progress = batchTransfer.getProgress();
console.log(`${progress.percentage}% complete`);
```

## Common Use Cases

### 1. Photo Album Transfer

```tsx
// Select photo folder
<FolderSelector
  onFolderSelected={(folder) => {
    // Filter to only images
    const photos = filterFilesByExtension(folder, [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'
    ]);

    // Send compressed
    sendFolder(transferManager, photos, { compress: true });
  }}
  allowCompression={true}
/>
```

### 2. Code Project Transfer

```tsx
// Select project folder
<FolderSelector
  onFolderSelected={(folder) => {
    // Filter to only code files
    const codeFiles = filterFilesByExtension(folder, [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs',
      'html', 'css', 'json', 'md'
    ]);

    // Send compressed (code compresses very well)
    sendFolder(transferManager, codeFiles, { compress: true });
  }}
  allowCompression={true}
/>
```

### 3. Document Folder Transfer

```tsx
<FolderSelector
  onFolderSelected={(folder) => {
    // Filter to documents
    const docs = filterFilesByExtension(folder, [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'
    ]);

    // Estimate compression
    const { estimatedSize, estimatedRatio } = estimateCompressionRatio(docs);
    console.log(`Estimated compressed size: ${formatFileSize(estimatedSize)}`);
    console.log(`Compression ratio: ${(estimatedRatio * 100).toFixed(1)}%`);

    sendFolder(transferManager, docs, { compress: true });
  }}
/>
```

## UI Components

### FolderSelector

Allows users to select folders with drag-and-drop support.

**Props:**
- `onFolderSelected`: Callback when folder is selected
- `disabled`: Disable selection
- `maxSize`: Maximum folder size in bytes
- `allowCompression`: Enable compression option

### FolderTree

Displays folder structure with expand/collapse.

**Props:**
- `folderStructure`: Folder data to display
- `showStats`: Show folder statistics
- `maxHeight`: Maximum height of tree view
- `className`: Additional CSS classes

### FolderProgress

Shows transfer progress for folders.

**Props:**
- `folderName`: Name of folder being transferred
- `totalFiles`: Total number of files
- `transferredFiles`: Number of files transferred
- `currentFile`: Currently transferring file
- `totalSize`: Total size in bytes
- `transferredSize`: Transferred size in bytes
- `speed`: Transfer speed in bytes/second
- `eta`: Estimated time remaining in seconds
- `status`: Transfer status
- `isCompressed`: Whether folder is compressed
- `onPause`, `onResume`, `onCancel`: Control callbacks

### FolderDownload

Handles downloading received folders as ZIP.

**Props:**
- `folderStructure`: Folder to download
- `autoDownload`: Auto-download on mount
- `onDownloadComplete`: Callback when download completes
- `className`: Additional CSS classes

## System Files

The following system files are automatically excluded:

- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `desktop.ini` (Windows)
- `.localized` (macOS)
- `$RECYCLE.BIN` (Windows)
- `System Volume Information` (Windows)
- `.Spotlight-V100` (macOS)
- `.Trashes` (macOS)
- `.fseventsd` (macOS)
- `.TemporaryItems` (macOS)
- `__MACOSX` (macOS zip artifacts)

## Limitations

- **Maximum folder size**: 4GB (can be configured)
- **Maximum file count**: Unlimited, but large counts may impact UI performance
- **Nested depth**: Unlimited
- **Compression**: Uses fflate library, level 6 compression

## Performance Tips

1. **Use compression for text files**: Code, documents, and text compress 60-70%
2. **Skip compression for media**: Images and videos are already compressed
3. **Filter unnecessary files**: Use extension filters to exclude build artifacts
4. **Monitor memory**: Large folders may consume significant memory during compression
5. **Batch transfers**: Use BatchFileTransfer for pause/resume support

## Security

- All files are encrypted using PQC hybrid encryption
- File paths are encrypted during transfer
- No plaintext filenames or paths are transmitted
- Compression happens before encryption
- System files are excluded to prevent metadata leakage

## Troubleshooting

### "Folder exceeds maximum size"

Reduce folder size or increase `maxSize` parameter:

```tsx
<FolderSelector maxSize={10 * 1024 * 1024 * 1024} /> // 10GB
```

### "Compression taking too long"

Disable compression or filter files:

```tsx
<FolderSelector allowCompression={false} />
```

Or use file extension filter in advanced options.

### "Transfer stalled"

Use pause/resume functionality:

```tsx
const batchTransfer = new BatchFileTransfer(transferManager, files);
await batchTransfer.start();

// If stalled
batchTransfer.pause();
await batchTransfer.resume();
```

## API Reference

See source files for complete API documentation:

- `lib/transfer/folder-transfer.ts` - Core utilities
- `lib/transfer/folder-transfer-integration.ts` - PQC integration
- `components/transfer/FolderSelector.tsx` - Selection UI
- `components/transfer/FolderTree.tsx` - Tree display
- `components/transfer/FolderProgress.tsx` - Progress UI
- `components/transfer/FolderDownload.tsx` - Download handler

## Examples

Complete examples available in:
- `examples/folder-transfer-example.tsx` - Full implementation example
- `tests/unit/transfer/folder-transfer.test.ts` - Unit tests

## Support

For issues or questions:
1. Check this guide and API documentation
2. Review example implementations
3. Check unit tests for usage patterns
