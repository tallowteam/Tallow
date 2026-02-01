# Metadata Stripping - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

function MyComponent() {
  const { processFile } = useMetadataStripper();

  const handleFile = async (file: File) => {
    const cleanFile = await processFile(file);
    // Use cleanFile - all metadata removed!
  };
}
```

## 📋 Cheat Sheet

### Single File
```typescript
const { processFile, isProcessing } = useMetadataStripper();
const clean = await processFile(file, recipientId?);
```

### Multiple Files
```typescript
const { processFiles, progress } = useMetadataStripper();
const cleanFiles = await processFiles([file1, file2, file3]);
// progress.current / progress.total
```

### Check Metadata
```typescript
const { checkMetadata } = useMetadataStripper();
const metadata = await checkMetadata(file);
// metadata.hasGPS, metadata.hasDeviceInfo, etc.
```

### Direct API
```typescript
import { stripMetadata, extractMetadata } from '@/lib/privacy/metadata-stripper';

const metadata = await extractMetadata(file);
const result = await stripMetadata(file);
const cleanFile = result.strippedFile;
```

## 🎯 Common Patterns

### Before Transfer
```typescript
const cleanFile = await processFile(file, recipientId);
await sendFile(cleanFile, recipientId);
```

### With Error Handling
```typescript
try {
  const result = await stripMetadata(file);
  if (result.success) {
    return result.strippedFile;
  }
} catch (error) {
  console.error('Stripping failed:', error);
}
return file; // Return original on error
```

### With Settings Check
```typescript
import { shouldStripMetadata } from '@/lib/privacy/privacy-settings';

if (await shouldStripMetadata(file.type, recipientId)) {
  file = await processFile(file);
}
```

### Batch with Progress
```typescript
const results = await stripMetadataBatch(files, (current, total) => {
  console.log(`Processing ${current} of ${total}`);
});
```

## ⚙️ Settings

### Get Settings
```typescript
import { getPrivacySettings } from '@/lib/privacy/privacy-settings';
const settings = await getPrivacySettings();
```

### Update Settings
```typescript
import { updatePrivacySettings } from '@/lib/privacy/privacy-settings';

await updatePrivacySettings({
  stripMetadataEnabled: true,
  stripMetadataByDefault: true,
  showMetadataWarnings: true,
});
```

### Trusted Contacts
```typescript
import { addTrustedContact, isTrustedContact } from '@/lib/privacy/privacy-settings';

await addTrustedContact('friend-id-123');
const trusted = await isTrustedContact('friend-id-123');
```

## 🎨 UI Components

### Demo Component
```typescript
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
<MetadataStrippingDemo />
```

### Metadata Viewer
```typescript
import { MetadataViewer } from '@/components/privacy/metadata-viewer';

<MetadataViewer
  file={file}
  isOpen={true}
  onClose={() => {}}
  onStripConfirm={() => stripFile()}
/>
```

## ✅ Supported Formats

| Format | Status | Notes |
|--------|--------|-------|
| JPEG   | ✅     | Full support |
| PNG    | ✅     | Full support |
| WebP   | ✅     | Full support |
| HEIC   | ✅     | Canvas fallback |
| MP4    | ✅     | Full support |
| MOV    | ✅     | Full support |

Check support:
```typescript
import { supportsMetadataStripping } from '@/lib/privacy/metadata-stripper';
const supported = supportsMetadataStripping(file.type);
```

## 🔍 What Gets Removed

### GPS Data ✓
- Latitude, Longitude, Altitude
- GPS Timestamps
- Location boxes (MP4)

### Device Info ✓
- Camera Make/Model
- Software Version
- Lens Model

### Timestamps ✓
- Date Taken
- Date Digitized
- Create/Modify Dates

### Author Info ✓
- Artist/Author
- Copyright
- Comments

## 🛡️ What's Preserved

- ✅ Image content (pixels)
- ✅ Dimensions
- ✅ Color space
- ✅ Orientation (optional)
- ✅ Quality

## 📊 Metadata Info Object

```typescript
interface MetadataInfo {
  // Flags
  hasSensitiveData: boolean;
  hasGPS: boolean;
  hasDeviceInfo: boolean;
  hasTimestamps: boolean;
  hasAuthorInfo: boolean;

  // GPS
  gpsLatitude?: string;
  gpsLongitude?: string;
  gpsAltitude?: string;

  // Device
  make?: string;
  model?: string;
  software?: string;

  // Timestamps
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;

  // Author
  artist?: string;
  copyright?: string;
}
```

## 🎯 Strip Result Object

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

## 🔧 Utility Functions

### Get Summary
```typescript
import { getMetadataSummary } from '@/lib/privacy/metadata-stripper';
const summary = getMetadataSummary(metadata);
// ["GPS location data", "Camera/device information"]
```

### Check Type Support
```typescript
import { METADATA_SUPPORTED_TYPES } from '@/lib/privacy/metadata-stripper';
const isImage = METADATA_SUPPORTED_TYPES.images.includes(file.type);
const isVideo = METADATA_SUPPORTED_TYPES.videos.includes(file.type);
```

## 🧪 Testing

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { stripMetadata } from '@/lib/privacy/metadata-stripper';

describe('My Test', () => {
  it('should strip metadata', async () => {
    const file = new File([data], 'test.jpg', { type: 'image/jpeg' });
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();
  });
});
```

## ⚠️ Error Handling

### Common Errors
```typescript
// Unsupported file type
result.error === 'File type not supported for metadata stripping'

// Invalid file
result.error === 'Not a valid JPEG file'
result.error === 'File too small to be a valid PNG'
```

### Graceful Degradation
```typescript
const result = await stripMetadata(file);
const fileToSend = result.success ? result.strippedFile! : file;
```

## 🔐 Security Best Practices

1. **Always strip for public transfers**
   ```typescript
   if (!isTrustedContact(recipientId)) {
     file = await processFile(file);
   }
   ```

2. **Validate after stripping**
   ```typescript
   const cleaned = result.strippedFile;
   const check = await extractMetadata(cleaned);
   assert(!check.hasSensitiveData);
   ```

3. **Log stripping events**
   ```typescript
   logger.info('Metadata stripped', {
     file: file.name,
     bytesRemoved: result.bytesRemoved,
   });
   ```

## 📱 React Hook API

```typescript
interface UseMetadataStripperResult {
  // State
  isProcessing: boolean;
  progress: { current: number; total: number } | null;

  // Functions
  processFile(file: File, recipientId?: string): Promise<File>;
  processFiles(files: File[], recipientId?: string): Promise<File[]>;
  checkMetadata(file: File): Promise<MetadataInfo | null>;
  shouldProcess(fileType: string, recipientId?: string): Promise<boolean>;
}
```

## 🎨 Toast Notifications

```typescript
// Auto-triggered by useMetadataStripper
toast.warning('Sensitive metadata detected');
toast.success('Metadata removed', { description: 'Removed 42 KB' });
toast.error('Failed to process file');
```

## 📚 Related Files

### Core
- `lib/privacy/metadata-stripper.ts` - Main implementation
- `lib/privacy/privacy-settings.ts` - Settings management
- `lib/hooks/use-metadata-stripper.ts` - React hook

### UI
- `components/demos/metadata-stripping-demo.tsx` - Demo component
- `components/privacy/metadata-viewer.tsx` - Viewer dialog

### Tests
- `tests/unit/metadata-stripper.test.ts` - 35 tests

### Docs
- `METADATA_STRIPPING_VERIFICATION.md` - Full verification report
- `METADATA_STRIPPING_USAGE.md` - Detailed usage guide
- `METADATA_STRIPPING_SUMMARY.md` - Implementation summary

## 🚦 Status Indicators

```typescript
// Check if processing
if (isProcessing) {
  return <Spinner />;
}

// Show progress
if (progress) {
  const percent = (progress.current / progress.total) * 100;
  return <ProgressBar value={percent} />;
}
```

## 🎯 One-Liners

```typescript
// Strip and send
await sendFile(await processFile(file), recipientId);

// Check if supported
if (supportsMetadataStripping(file.type)) { /* ... */ }

// Get summary
const risks = getMetadataSummary(await extractMetadata(file));

// Is trusted?
const skip = await isTrustedContact(recipientId);
```

## 💡 Pro Tips

1. **Batch processing is faster** than individual files
2. **Always check** `result.success` before using `result.strippedFile`
3. **Use progress callbacks** for better UX
4. **Show metadata viewer** before first send to educate users
5. **Log stripping events** for security audit

## 🔗 Quick Links

- Tests: `npm run test:unit -- tests/unit/metadata-stripper.test.ts`
- Type check: `npm run type-check`
- Demo: Import `MetadataStrippingDemo` component

---

**Need Help?** Check the detailed guides:
- 📖 Usage Guide: `METADATA_STRIPPING_USAGE.md`
- ✅ Verification: `METADATA_STRIPPING_VERIFICATION.md`
- 📋 Summary: `METADATA_STRIPPING_SUMMARY.md`
