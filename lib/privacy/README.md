# Privacy Module - Quick Reference

## Installation

```bash
npm install exifreader piexifjs
```

## Basic Usage

### Strip Metadata from a File

```typescript
import { stripMetadata } from '@/lib/privacy';

const result = await stripMetadata(file);

if (result.success && result.strippedFile) {
  // Use the stripped file
  console.log('Original size:', result.originalFile.size);
  console.log('New size:', result.strippedFile.size);
  console.log('Bytes removed:', result.bytesRemoved);
} else {
  console.error('Stripping failed:', result.error);
  // Use original file
}
```

### Check Metadata Without Stripping

```typescript
import { extractMetadata, getMetadataSummary } from '@/lib/privacy';

const metadata = await extractMetadata(file);

if (metadata.hasSensitiveData) {
  const summary = getMetadataSummary(metadata);
  console.log('Sensitive data found:', summary);

  // Check specific types
  if (metadata.hasGPS) {
    console.log('GPS:', metadata.gpsLatitude, metadata.gpsLongitude);
  }
  if (metadata.hasDeviceInfo) {
    console.log('Camera:', metadata.make, metadata.model);
  }
}
```

### React Hook

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

function FileUploader() {
  const {
    processFile,
    processFiles,
    checkMetadata,
    isProcessing,
    progress,
  } = useMetadataStripper();

  const handleFile = async (file: File) => {
    // Process single file
    const processed = await processFile(file, recipientId);
    // 'processed' has metadata stripped if necessary
  };

  const handleMultipleFiles = async (files: File[]) => {
    // Process multiple files with progress
    const processed = await processFiles(files, recipientId);
  };

  return (
    <div>
      {isProcessing && progress && (
        <p>Processing {progress.current} of {progress.total}</p>
      )}
    </div>
  );
}
```

### Privacy Settings

```typescript
import {
  getPrivacySettings,
  updatePrivacySettings,
  addTrustedContact,
  shouldStripMetadata,
} from '@/lib/privacy';

// Get current settings
const settings = await getPrivacySettings();

// Update settings
await updatePrivacySettings({
  stripMetadataEnabled: true,
  stripMetadataByDefault: true,
  showMetadataWarnings: true,
});

// Add trusted contact
await addTrustedContact('friend-id-123');

// Check if should strip
const shouldStrip = await shouldStripMetadata('image/jpeg', 'recipient-id');
```

## Components

### Metadata Viewer

```typescript
import { MetadataViewer } from '@/components/privacy';

function MyComponent() {
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <>
      <button onClick={() => {
        setSelectedFile(file);
        setShowViewer(true);
      }}>
        View Metadata
      </button>

      <MetadataViewer
        file={selectedFile}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onStripConfirm={() => {
          // Handle strip confirmation
        }}
        showStripButton={true}
      />
    </>
  );
}
```

### Privacy Settings Panel

```typescript
import { PrivacySettingsPanel } from '@/components/privacy';

function SettingsPage() {
  return (
    <div>
      <h1>Privacy Settings</h1>
      <PrivacySettingsPanel />
    </div>
  );
}
```

### Enhanced File Selector

```typescript
import { FileSelectorWithPrivacy } from '@/components/transfer/file-selector-with-privacy';

function TransferPage() {
  const [files, setFiles] = useState<FileWithData[]>([]);

  return (
    <FileSelectorWithPrivacy
      onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
      selectedFiles={files}
      onRemoveFile={(id) => setFiles(files.filter(f => f.id !== id))}
      onClearAll={() => setFiles([])}
      recipientId="recipient-id"
    />
  );
}
```

## API Reference

### stripMetadata(file, preserveOrientation?)

Strip metadata from a file.

**Parameters:**
- `file: File` - The file to process
- `preserveOrientation?: boolean` - Keep orientation data (default: true)

**Returns:** `Promise<StripResult>`

```typescript
interface StripResult {
  success: boolean;
  originalFile: File;
  strippedFile?: File;
  metadata?: MetadataInfo;
  error?: string;
  bytesRemoved?: number;
}
```

### extractMetadata(file)

Extract metadata from a file without stripping.

**Parameters:**
- `file: File` - The file to analyze

**Returns:** `Promise<MetadataInfo>`

```typescript
interface MetadataInfo {
  // GPS Data
  gpsLatitude?: string;
  gpsLongitude?: string;
  gpsAltitude?: string;

  // Device Info
  make?: string;
  model?: string;
  software?: string;

  // Timestamps
  dateTimeOriginal?: string;
  createDate?: string;

  // Author
  artist?: string;
  copyright?: string;

  // Flags
  hasSensitiveData: boolean;
  hasGPS: boolean;
  hasDeviceInfo: boolean;
  hasTimestamps: boolean;
  hasAuthorInfo: boolean;
}
```

### supportsMetadataStripping(fileType)

Check if a file type supports metadata stripping.

**Parameters:**
- `fileType: string` - MIME type (e.g., 'image/jpeg')

**Returns:** `boolean`

### stripMetadataBatch(files, onProgress?)

Strip metadata from multiple files.

**Parameters:**
- `files: File[]` - Array of files to process
- `onProgress?: (current: number, total: number) => void` - Progress callback

**Returns:** `Promise<StripResult[]>`

### getMetadataSummary(metadata)

Get human-readable summary of metadata.

**Parameters:**
- `metadata: MetadataInfo` - Metadata to summarize

**Returns:** `string[]` - Array of summary strings

## Supported File Types

### Images (Full Support)
- JPEG/JPG - Complete EXIF removal
- PNG - Chunk-based stripping
- WebP - RIFF container parsing
- HEIC/HEIF - Detection only

### Videos (Detection Only)
- MP4 - Metadata detection
- MOV - Metadata detection
- M4V - Metadata detection

**Note:** Full video metadata stripping requires server-side processing or ffmpeg.wasm

## What Gets Removed

- ✓ GPS coordinates and location names
- ✓ Camera make, model, and serial number
- ✓ Lens information
- ✓ Software and editing tool signatures
- ✓ Creation and modification timestamps
- ✓ Author, artist, and copyright data
- ✓ Device identifiers
- ✓ Editing history

## What's Preserved

- ✓ Image quality (no re-encoding)
- ✓ Color profiles (ICC)
- ✓ Image dimensions
- ✓ File format
- ✓ Orientation (optional)

## Privacy Settings

```typescript
interface PrivacySettings {
  // Global toggle
  stripMetadataEnabled: boolean;

  // Default behavior
  stripMetadataByDefault: boolean;

  // Technical options
  preserveOrientation: boolean;

  // UI preferences
  showMetadataWarnings: boolean;

  // Trusted contacts
  trustedContacts: string[];

  // File type filters
  stripFromImages: boolean;
  stripFromVideos: boolean;

  // Notifications
  notifyOnSensitiveData: boolean;
  requireConfirmationBeforeStrip: boolean;
}
```

## Error Handling

```typescript
try {
  const result = await stripMetadata(file);

  if (result.success) {
    // Use stripped file
    uploadFile(result.strippedFile);
  } else {
    // Handle error
    console.error('Stripping failed:', result.error);
    // Fallback to original file
    uploadFile(result.originalFile);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

## Best Practices

### 1. Always Check Support

```typescript
if (supportsMetadataStripping(file.type)) {
  await stripMetadata(file);
} else {
  // Handle unsupported type
}
```

### 2. Show Progress for Multiple Files

```typescript
await stripMetadataBatch(files, (current, total) => {
  setProgress((current / total) * 100);
});
```

### 3. Provide User Choice

```typescript
const metadata = await extractMetadata(file);

if (metadata.hasSensitiveData) {
  const userChoice = await showConfirmation();

  if (userChoice === 'strip') {
    await stripMetadata(file);
  }
}
```

### 4. Handle Trusted Contacts

```typescript
const shouldStrip = await shouldStripMetadata(file.type, recipientId);

if (shouldStrip) {
  await stripMetadata(file);
} else {
  // Skip for trusted contacts
}
```

## Performance Tips

1. **Process in background:** Use Web Workers for large files
2. **Show progress:** Keep users informed during batch processing
3. **Cache results:** Don't re-process the same file
4. **Limit concurrency:** Process 3-5 files at a time
5. **Use streaming:** For very large files, consider chunked processing

## Security Considerations

1. **Client-side only:** All processing happens in the browser
2. **No data transmission:** Metadata never sent to servers
3. **Original preserved:** Original file never modified
4. **Secure storage:** Settings encrypted at rest
5. **No logging:** No metadata logs kept

## Troubleshooting

### File Size Didn't Change
- File may have minimal metadata
- Video stripping not fully implemented
- Check if file type is supported

### Image Rotated Incorrectly
- Enable `preserveOrientation` setting
- Some apps ignore EXIF orientation
- Re-process with orientation preserved

### Processing Failed
- File may be corrupted
- Unsupported file format
- Browser memory limitations
- Try with smaller file

## Examples

See `/METADATA_STRIPPING.md` for comprehensive examples and usage patterns.

## Testing

```typescript
import { stripMetadata } from '@/lib/privacy';
import { describe, it, expect } from 'vitest';

describe('Metadata Stripping', () => {
  it('should strip JPEG metadata', async () => {
    const file = new File([jpegData], 'test.jpg', { type: 'image/jpeg' });
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();
    expect(result.bytesRemoved).toBeGreaterThan(0);
  });
});
```

## Support

- Documentation: `/METADATA_STRIPPING.md`
- Implementation: `/IMPLEMENTATION_SUMMARY_METADATA.md`
- Tests: `/tests/unit/privacy/`
- Source: `/lib/privacy/`
