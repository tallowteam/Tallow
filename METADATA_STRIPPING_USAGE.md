# Metadata Stripping - Usage Guide

## Quick Start

### Basic Usage in Components

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

function FileUpload() {
  const { processFile, isProcessing } = useMetadataStripper();

  const handleFileSelect = async (file: File) => {
    // Automatically strips metadata if enabled in settings
    const cleanFile = await processFile(file);

    // Use cleanFile for transfer
    await sendFile(cleanFile);
  };

  return (
    <input
      type="file"
      onChange={(e) => handleFileSelect(e.target.files?.[0])}
      disabled={isProcessing}
    />
  );
}
```

### Batch Processing

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

function MultiFileUpload() {
  const { processFiles, progress, isProcessing } = useMetadataStripper();

  const handleFilesSelect = async (files: FileList) => {
    const cleanFiles = await processFiles(Array.from(files));

    // Use clean files for transfer
    await sendMultipleFiles(cleanFiles);
  };

  return (
    <div>
      <input type="file" multiple onChange={(e) => handleFilesSelect(e.target.files)} />
      {isProcessing && progress && (
        <div>Processing {progress.current} of {progress.total} files...</div>
      )}
    </div>
  );
}
```

### Manual Stripping with Direct API

```typescript
import { stripMetadata, extractMetadata } from '@/lib/privacy/metadata-stripper';

// Check metadata first
const metadata = await extractMetadata(file);

if (metadata.hasSensitiveData) {
  console.log('Found sensitive data:', metadata);

  // Strip metadata
  const result = await stripMetadata(file);

  if (result.success && result.strippedFile) {
    console.log(`Removed ${result.bytesRemoved} bytes of metadata`);
    return result.strippedFile;
  }
}

return file; // No sensitive data, use original
```

### Check Metadata Without Stripping

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { MetadataViewer } from '@/components/privacy/metadata-viewer';
import { useState } from 'react';

function FilePreview() {
  const { checkMetadata } = useMetadataStripper();
  const [showViewer, setShowViewer] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleInspect = async (file: File) => {
    setCurrentFile(file);
    setShowViewer(true);
  };

  return (
    <>
      <button onClick={() => handleInspect(myFile)}>
        Inspect Metadata
      </button>

      <MetadataViewer
        file={currentFile}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onStripConfirm={async () => {
          // User confirmed - strip and continue
          const result = await stripMetadata(currentFile!);
          // Handle stripped file...
        }}
      />
    </>
  );
}
```

## Privacy Settings Management

### Get Current Settings

```typescript
import { getPrivacySettings } from '@/lib/privacy/privacy-settings';

const settings = await getPrivacySettings();

console.log('Strip metadata enabled:', settings.stripMetadataEnabled);
console.log('Strip by default:', settings.stripMetadataByDefault);
console.log('Trusted contacts:', settings.trustedContacts);
```

### Update Settings

```typescript
import { updatePrivacySettings } from '@/lib/privacy/privacy-settings';

// Enable metadata stripping
await updatePrivacySettings({
  stripMetadataEnabled: true,
  stripMetadataByDefault: true,
  preserveOrientation: true,
  showMetadataWarnings: true,
});
```

### Manage Trusted Contacts

```typescript
import {
  addTrustedContact,
  removeTrustedContact,
  isTrustedContact
} from '@/lib/privacy/privacy-settings';

// Add trusted contact (skip metadata stripping for this friend)
await addTrustedContact('friend-id-123');

// Check if contact is trusted
const isTrusted = await isTrustedContact('friend-id-123');

// Remove from trusted list
await removeTrustedContact('friend-id-123');
```

### Conditional Stripping Based on Recipient

```typescript
import { shouldStripMetadata } from '@/lib/privacy/privacy-settings';
import { stripMetadata } from '@/lib/privacy/metadata-stripper';

async function prepareFileForTransfer(file: File, recipientId: string) {
  // Check if we should strip metadata for this recipient
  if (await shouldStripMetadata(file.type, recipientId)) {
    const result = await stripMetadata(file);
    return result.success ? result.strippedFile! : file;
  }

  return file; // Trusted contact, send original
}
```

## Integration with File Transfer

### Before Sending Files

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';

function FileTransferComponent() {
  const { processFile } = useMetadataStripper();
  const { sendFile } = useFileTransfer();

  const handleSend = async (file: File, recipientId: string) => {
    // Step 1: Strip metadata
    const cleanFile = await processFile(file, recipientId);

    // Step 2: Encrypt and send
    await sendFile(cleanFile, recipientId);
  };

  return (
    <button onClick={() => handleSend(selectedFile, recipient)}>
      Send Securely
    </button>
  );
}
```

## UI Components

### Show Demo

```typescript
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';

function PrivacyPage() {
  return (
    <div>
      <h1>Privacy Features</h1>
      <MetadataStrippingDemo />
    </div>
  );
}
```

### Settings Panel

```typescript
import { useState, useEffect } from 'react';
import { getPrivacySettings, updatePrivacySettings } from '@/lib/privacy/privacy-settings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function PrivacySettings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const current = await getPrivacySettings();
    setSettings(current);
  };

  const toggleSetting = async (key: string, value: boolean) => {
    await updatePrivacySettings({ [key]: value });
    loadSettings();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Strip Metadata</Label>
        <Switch
          checked={settings?.stripMetadataEnabled}
          onCheckedChange={(v) => toggleSetting('stripMetadataEnabled', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Show Warnings</Label>
        <Switch
          checked={settings?.showMetadataWarnings}
          onCheckedChange={(v) => toggleSetting('showMetadataWarnings', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Strip from Images</Label>
        <Switch
          checked={settings?.stripFromImages}
          onCheckedChange={(v) => toggleSetting('stripFromImages', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Strip from Videos</Label>
        <Switch
          checked={settings?.stripFromVideos}
          onCheckedChange={(v) => toggleSetting('stripFromVideos', v)}
        />
      </div>
    </div>
  );
}
```

## Advanced Usage

### Custom Metadata Extraction

```typescript
import { extractMetadata, getMetadataSummary } from '@/lib/privacy/metadata-stripper';

async function analyzeFile(file: File) {
  const metadata = await extractMetadata(file);

  // Get human-readable summary
  const summary = getMetadataSummary(metadata);

  // Detailed analysis
  if (metadata.hasGPS) {
    console.log('Location:', metadata.gpsLatitude, metadata.gpsLongitude);
  }

  if (metadata.hasDeviceInfo) {
    console.log('Device:', metadata.make, metadata.model);
  }

  if (metadata.hasTimestamps) {
    console.log('Date taken:', metadata.dateTimeOriginal);
  }

  return {
    hasSensitiveData: metadata.hasSensitiveData,
    summary,
    details: metadata,
  };
}
```

### Type-Specific Processing

```typescript
import {
  stripMetadata,
  supportsMetadataStripping,
  METADATA_SUPPORTED_TYPES
} from '@/lib/privacy/metadata-stripper';

async function processFileByType(file: File) {
  if (!supportsMetadataStripping(file.type)) {
    console.log('Metadata stripping not supported for:', file.type);
    return file;
  }

  // Check file type category
  if (METADATA_SUPPORTED_TYPES.images.includes(file.type as any)) {
    console.log('Processing image file...');
  } else if (METADATA_SUPPORTED_TYPES.videos.includes(file.type as any)) {
    console.log('Processing video file...');
  }

  const result = await stripMetadata(file);
  return result.strippedFile || file;
}
```

### Error Handling

```typescript
import { stripMetadata } from '@/lib/privacy/metadata-stripper';
import { toast } from 'sonner';

async function safeStripMetadata(file: File) {
  try {
    const result = await stripMetadata(file);

    if (!result.success) {
      toast.error('Failed to strip metadata', {
        description: result.error || 'Unknown error',
      });
      return file; // Return original on failure
    }

    if (result.bytesRemoved && result.bytesRemoved > 0) {
      toast.success('Metadata removed', {
        description: `Removed ${result.bytesRemoved} bytes`,
      });
    }

    return result.strippedFile!;
  } catch (error) {
    console.error('Metadata stripping error:', error);
    toast.error('Error processing file');
    return file;
  }
}
```

## Performance Optimization

### Lazy Loading for Large Files

```typescript
import { stripMetadata } from '@/lib/privacy/metadata-stripper';

async function optimizedProcessing(files: File[]) {
  // Process small files first
  const sorted = files.sort((a, b) => a.size - b.size);

  const results = [];
  for (const file of sorted) {
    const result = await stripMetadata(file);
    results.push(result.strippedFile || file);

    // Give UI time to update
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return results;
}
```

### Progress Tracking

```typescript
import { stripMetadataBatch } from '@/lib/privacy/metadata-stripper';

async function processWithProgress(files: File[], onUpdate: (percent: number) => void) {
  const results = await stripMetadataBatch(files, (current, total) => {
    const percent = Math.round((current / total) * 100);
    onUpdate(percent);
  });

  return results.map(r => r.strippedFile || r.originalFile);
}
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { stripMetadata, supportsMetadataStripping } from '@/lib/privacy/metadata-stripper';

describe('Metadata Stripping', () => {
  it('should support JPEG files', () => {
    expect(supportsMetadataStripping('image/jpeg')).toBe(true);
  });

  it('should strip metadata from valid JPEG', async () => {
    const file = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' });
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();
  });
});
```

## Security Best Practices

1. **Always strip metadata for public transfers**
   ```typescript
   const isPublic = !recipientId || !isTrustedContact(recipientId);
   if (isPublic) {
     file = await processFile(file);
   }
   ```

2. **Show warnings for sensitive data**
   ```typescript
   const metadata = await extractMetadata(file);
   if (metadata.hasSensitiveData) {
     showWarningDialog(metadata);
   }
   ```

3. **Log stripping events**
   ```typescript
   if (result.success && result.bytesRemoved) {
     logger.info('Metadata stripped', {
       filename: file.name,
       bytesRemoved: result.bytesRemoved,
       hadGPS: result.metadata?.hasGPS,
     });
   }
   ```

4. **Validate after stripping**
   ```typescript
   const stripped = result.strippedFile;
   const recheck = await extractMetadata(stripped);

   if (recheck.hasSensitiveData) {
     throw new Error('Metadata stripping incomplete');
   }
   ```

## Troubleshooting

### File Not Processing
```typescript
// Check if file type is supported
if (!supportsMetadataStripping(file.type)) {
  console.log('Unsupported file type:', file.type);
}

// Check file size
if (file.size > 100 * 1024 * 1024) { // 100MB
  console.warn('File is very large, processing may be slow');
}
```

### Settings Not Persisting
```typescript
// Verify secure storage is initialized
import { getSecureStorage } from '@/lib/storage/secure-storage';

const storage = await getSecureStorage();
const saved = await storage.getItem('privacy_settings');
console.log('Saved settings:', saved);
```

### Toast Notifications Not Showing
```typescript
// Ensure Toaster component is in layout
import { Toaster } from 'sonner';

// In your layout.tsx
<Toaster />
```

---

For more examples, see:
- `components/demos/metadata-stripping-demo.tsx` - Full interactive demo
- `components/privacy/metadata-viewer.tsx` - Metadata inspection UI
- `tests/unit/metadata-stripper.test.ts` - Comprehensive test examples
