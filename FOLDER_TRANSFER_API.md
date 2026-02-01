# Folder Transfer API Reference

Quick reference for all folder transfer functions and components.

## Core Functions

### `buildFolderStructure(files, options)`

Build folder structure from FileList or File array.

```typescript
function buildFolderStructure(
  files: FileList | File[],
  options?: {
    excludeSystemFiles?: boolean; // Default: true
    maxSize?: number; // Default: 4GB
    fileFilter?: (file: File) => boolean;
  }
): FolderStructure;
```

**Example:**
```typescript
const files = fileInput.files;
const folder = buildFolderStructure(files, {
  excludeSystemFiles: true,
  maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  fileFilter: (file) => file.name.endsWith('.jpg')
});
```

### `buildFolderTree(folderStructure)`

Build tree structure for UI display.

```typescript
function buildFolderTree(folderStructure: FolderStructure): FolderTreeNode;
```

### `compressFolder(folderStructure, onProgress?)`

Compress folder to ZIP format.

```typescript
function compressFolder(
  folderStructure: FolderStructure,
  onProgress?: (progress: number, file: string) => void
): Promise<Blob>;
```

**Example:**
```typescript
const zipBlob = await compressFolder(folder, (progress, file) => {
  console.log(`${progress}% - ${file}`);
});
```

### `decompressFolder(zipBlob, onProgress?)`

Decompress ZIP to folder structure.

```typescript
function decompressFolder(
  zipBlob: Blob,
  onProgress?: (progress: number, file: string) => void
): Promise<FolderStructure>;
```

### `downloadFolderAsZip(folderStructure, filename?, onProgress?)`

Download folder as ZIP file.

```typescript
function downloadFolderAsZip(
  folderStructure: FolderStructure,
  filename?: string,
  onProgress?: (progress: number, file: string) => void
): Promise<void>;
```

**Example:**
```typescript
await downloadFolderAsZip(folder, 'my-folder.zip', (progress) => {
  console.log(`${progress}% complete`);
});
```

### `filterFilesByExtension(folderStructure, extensions)`

Filter files by extension.

```typescript
function filterFilesByExtension(
  folderStructure: FolderStructure,
  extensions: string[]
): FolderStructure;
```

**Example:**
```typescript
// Get only images
const images = filterFilesByExtension(folder, ['jpg', 'png', 'gif']);

// Get only code files
const code = filterFilesByExtension(folder, ['js', 'ts', 'py']);
```

### `getFolderStats(folderStructure)`

Get detailed folder statistics.

```typescript
function getFolderStats(folderStructure: FolderStructure): {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  largestFile: FolderFile | null;
  depth: number;
};
```

### `estimateCompressionRatio(folderStructure)`

Estimate compression ratio.

```typescript
function estimateCompressionRatio(folderStructure: FolderStructure): {
  estimatedSize: number;
  estimatedRatio: number;
};
```

### `formatFileSize(bytes)`

Format bytes as human-readable size.

```typescript
function formatFileSize(bytes: number): string;
```

**Example:**
```typescript
formatFileSize(1536) // "1.5 KB"
formatFileSize(1048576) // "1 MB"
```

## Integration Functions

### `sendFolder(transferManager, folderStructure, options)`

Send folder through PQC transfer manager.

```typescript
async function sendFolder(
  transferManager: PQCTransferManager,
  folderStructure: FolderStructure,
  options?: {
    compress?: boolean;
    onFolderProgress?: (transferred: number, total: number, file: string) => void;
    onCompressionProgress?: (progress: number) => void;
  }
): Promise<void>;
```

**Example:**
```typescript
await sendFolder(transferManager, folder, {
  compress: true,
  onFolderProgress: (current, total, file) => {
    console.log(`${current}/${total} - ${file}`);
  },
  onCompressionProgress: (progress) => {
    console.log(`Compressing: ${progress}%`);
  }
});
```

### `FolderReceiver` Class

Receive folders through PQC transfer manager.

```typescript
class FolderReceiver {
  constructor(
    transferManager: PQCTransferManager,
    options?: {
      onProgress?: (state: FolderTransferState) => void;
      onComplete?: (folder: FolderStructure) => void;
    }
  );

  startReceiving(folderName: string, fileCount: number, isCompressed?: boolean): void;
  reset(): void;
  getState(): { receivedFiles: number; expectedFiles: number; isComplete: boolean };
}
```

**Example:**
```typescript
const receiver = new FolderReceiver(transferManager, {
  onProgress: (state) => {
    console.log(`${state.transferredFiles}/${state.totalFiles}`);
  },
  onComplete: (folder) => {
    console.log(`Received: ${folder.name}`);
  }
});

receiver.startReceiving('MyFolder', 50, false);
```

### `BatchFileTransfer` Class

Transfer files with pause/resume support.

```typescript
class BatchFileTransfer {
  constructor(
    transferManager: PQCTransferManager,
    files: { file: File; relativePath?: string }[],
    options?: {
      onProgress?: (current: number, total: number, file: string) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  );

  async start(): Promise<void>;
  pause(): void;
  async resume(): Promise<void>;
  getProgress(): {
    current: number;
    total: number;
    percentage: number;
    isPaused: boolean;
    isComplete: boolean;
  };
}
```

**Example:**
```typescript
const batch = new BatchFileTransfer(transferManager, files, {
  onProgress: (current, total) => console.log(`${current}/${total}`)
});

await batch.start();
batch.pause();
await batch.resume();
```

## React Components

### `<FolderSelector>`

Folder selection with drag-and-drop.

```typescript
interface FolderSelectorProps {
  onFolderSelected: (folder: FolderStructure, compressed?: Blob) => void;
  disabled?: boolean;
  maxSize?: number;
  allowCompression?: boolean;
}
```

**Example:**
```tsx
<FolderSelector
  onFolderSelected={(folder, compressed) => {
    console.log(`Selected: ${folder.name}`);
  }}
  allowCompression={true}
  maxSize={4 * 1024 * 1024 * 1024}
/>
```

### `<FolderTree>`

Display folder structure.

```typescript
interface FolderTreeProps {
  folderStructure: FolderStructure;
  showStats?: boolean;
  maxHeight?: number | string;
  className?: string;
}
```

**Example:**
```tsx
<FolderTree
  folderStructure={folder}
  showStats={true}
  maxHeight={500}
/>
```

### `<FolderProgress>`

Display transfer progress.

```typescript
interface FolderProgressProps {
  folderName: string;
  totalFiles: number;
  transferredFiles: number;
  currentFile?: string;
  totalSize: number;
  transferredSize: number;
  speed?: number; // bytes/second
  eta?: number; // seconds
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'failed';
  isCompressed?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  className?: string;
}
```

**Example:**
```tsx
<FolderProgress
  folderName="MyProject"
  totalFiles={100}
  transferredFiles={50}
  currentFile="src/index.ts"
  totalSize={10485760}
  transferredSize={5242880}
  speed={1048576}
  eta={5}
  status="transferring"
  onPause={() => console.log('Paused')}
  onCancel={() => console.log('Cancelled')}
/>
```

### `<FolderDownload>`

Download received folders.

```typescript
interface FolderDownloadProps {
  folderStructure: FolderStructure;
  autoDownload?: boolean;
  onDownloadComplete?: () => void;
  className?: string;
}
```

**Example:**
```tsx
<FolderDownload
  folderStructure={receivedFolder}
  autoDownload={false}
  onDownloadComplete={() => console.log('Downloaded')}
/>
```

## Type Definitions

### `FolderStructure`

```typescript
interface FolderStructure {
  name: string;
  path: string;
  files: FolderFile[];
  totalSize: number;
  fileCount: number;
  isCompressed: boolean;
}
```

### `FolderFile`

```typescript
interface FolderFile {
  name: string;
  relativePath: string;
  size: number;
  type: string;
  lastModified: number;
  file: File;
}
```

### `FolderTreeNode`

```typescript
interface FolderTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  children?: FolderTreeNode[];
  file?: File;
}
```

### `FolderTransferState`

```typescript
interface FolderTransferState {
  folderName: string;
  totalFiles: number;
  transferredFiles: number;
  currentFile: string;
  totalSize: number;
  transferredSize: number;
  isCompressed: boolean;
}
```

## Constants

```typescript
// System files excluded by default
const SYSTEM_FILES = [
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '.localized',
  '$RECYCLE.BIN',
  'System Volume Information',
  '.Spotlight-V100',
  '.Trashes',
  '.fseventsd',
  '.TemporaryItems',
  '__MACOSX',
];

// Maximum folder size
const MAX_FOLDER_SIZE = 4 * 1024 * 1024 * 1024; // 4GB
```

## Common Patterns

### Send compressed folder

```typescript
const folder = buildFolderStructure(files);
const compressed = await compressFolder(folder);

await sendFolder(transferManager, folder, { compress: true });
```

### Filter and send

```typescript
const folder = buildFolderStructure(files);
const images = filterFilesByExtension(folder, ['jpg', 'png', 'gif']);

await sendFolder(transferManager, images);
```

### Receive and download

```typescript
const receiver = new FolderReceiver(transferManager, {
  onComplete: async (folder) => {
    await downloadFolderAsZip(folder);
  }
});
```

### Progress tracking

```typescript
await sendFolder(transferManager, folder, {
  onFolderProgress: (current, total, file) => {
    const progress = (current / total) * 100;
    updateUI(progress, file);
  }
});
```

## Error Handling

```typescript
try {
  const folder = buildFolderStructure(files, {
    maxSize: 1024 * 1024 * 1024 // 1GB
  });

  await sendFolder(transferManager, folder, { compress: true });
} catch (error) {
  if (error.message.includes('exceeds maximum size')) {
    console.error('Folder too large');
  } else if (error.message.includes('compression failed')) {
    console.error('Compression error');
  } else {
    console.error('Transfer error:', error);
  }
}
```

## Best Practices

1. **Always use compression for text-heavy folders** (code, documents)
2. **Skip compression for media folders** (images, videos)
3. **Set appropriate max size limits** to prevent memory issues
4. **Use file filters** to exclude unnecessary files
5. **Provide progress feedback** for large transfers
6. **Handle errors gracefully** with user-friendly messages
7. **Clean up resources** with `destroy()` or `reset()`

## Performance Tips

- Use `filterFilesByExtension` to reduce transfer size
- Enable compression for text files (60-70% reduction)
- Disable compression for already-compressed files
- Monitor memory usage for large folders
- Use `BatchFileTransfer` for pause/resume capability

## Security Notes

- All files are encrypted with PQC hybrid encryption
- File paths are encrypted during transfer
- No plaintext filenames transmitted
- System files automatically excluded
- Compression happens before encryption
