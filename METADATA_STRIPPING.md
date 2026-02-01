# Metadata Stripping - Privacy Protection

## Overview

Tallow automatically removes sensitive metadata from images and videos before transfer to protect your privacy. This feature is enabled by default but can be customized in settings.

## What Gets Removed

### GPS Location Data
- Latitude and longitude coordinates
- Altitude information
- GPS timestamps
- Location names

### Camera & Device Information
- Camera make and model
- Lens information
- Software and editing tools used
- Device serial numbers

### Timestamps
- Date and time photo was taken
- Creation and modification dates
- Digitization timestamps

### Author & Copyright
- Artist/author names
- Copyright notices
- Ownership information
- Editing history

## Supported File Types

### Images
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF

### Videos
- MP4
- MOV (QuickTime)
- M4V

## How It Works

### 1. Automatic Detection
When you select files for transfer, Tallow automatically:
- Scans each file for metadata
- Identifies sensitive information
- Flags files containing location data, camera info, or timestamps

### 2. Privacy Warnings
If sensitive metadata is detected:
- Warning notification appears
- Shows what type of data was found
- Gives you option to view detailed metadata
- Allows you to choose whether to strip or keep metadata

### 3. Metadata Stripping
The stripping process:
- Removes all EXIF data segments
- Preserves image quality (no re-encoding)
- Optionally keeps orientation data
- Creates smaller file (metadata removed)

### 4. Verification
After stripping:
- Success notification shows what was removed
- File size reduction displayed
- Badge indicates metadata has been stripped

## Features

### Privacy Settings Panel
Configure metadata stripping behavior:
- Enable/disable automatic stripping
- Set default behavior
- Configure file type preferences
- Manage trusted contacts

### Metadata Viewer
View detailed metadata before stripping:
- See all embedded information
- Identify sensitive data
- Compare before/after
- Make informed decisions

### Trusted Contacts
Skip metadata stripping for specific contacts:
- Mark friends as trusted
- Preserve metadata for known recipients
- Per-contact privacy settings

### Batch Processing
Handle multiple files efficiently:
- Process entire folders
- Progress indication
- Skip non-supported files
- Summary of changes

## Usage

### Basic Usage

```typescript
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

function MyComponent() {
  const { processFile } = useMetadataStripper();

  const handleFileUpload = async (file: File) => {
    const processedFile = await processFile(file);
    // Use processedFile for transfer
  };
}
```

### Manual Stripping

```typescript
import { stripMetadata } from '@/lib/privacy/metadata-stripper';

const result = await stripMetadata(file);
if (result.success) {
  console.log('Metadata removed:', result.metadata);
  console.log('Bytes saved:', result.bytesRemoved);
  // Use result.strippedFile
}
```

### Check Metadata Without Stripping

```typescript
import { extractMetadata } from '@/lib/privacy/metadata-stripper';

const metadata = await extractMetadata(file);
if (metadata.hasSensitiveData) {
  console.log('GPS:', metadata.hasGPS);
  console.log('Device info:', metadata.hasDeviceInfo);
  console.log('Timestamps:', metadata.hasTimestamps);
}
```

## Settings

### Enable/Disable
Global toggle for metadata stripping feature:
- **Enabled (default)**: Automatically scan and strip metadata
- **Disabled**: Send files without processing

### Strip by Default
Automatic behavior for detected metadata:
- **On (default)**: Strip without asking
- **Off**: Ask before stripping

### Preserve Orientation
Keep image orientation data:
- **On (default)**: Preserve EXIF orientation
- **Off**: Remove all EXIF data

### Show Warnings
Display alerts for sensitive data:
- **On (default)**: Show notification when detected
- **Off**: Strip silently

### File Type Preferences
Choose which file types to process:
- **Images**: JPEG, PNG, WebP, HEIC
- **Videos**: MP4, MOV (requires advanced processing)

### Privacy Notifications
Control notification behavior:
- **Alert on sensitive data**: Show warning when GPS/timestamps found
- **Require confirmation**: Ask before stripping

## Privacy Guarantees

### What We Remove
- ✓ GPS coordinates
- ✓ Device identifiers
- ✓ Personal timestamps
- ✓ Author information
- ✓ Software signatures

### What We Preserve
- ✓ Image quality (no degradation)
- ✓ Color profiles (for accurate colors)
- ✓ Image dimensions
- ✓ File format
- ✓ Orientation (optional)

### Security
- All processing happens locally in your browser
- No data sent to servers
- Original files never modified
- Stripped files used for transfer
- No metadata logs kept

## Technical Details

### JPEG Processing
- Parses JPEG segment structure
- Removes APP1 (EXIF) markers
- Removes APP2 (ICC, FlashPix) when appropriate
- Removes Photoshop and Adobe segments
- Preserves JFIF and image data segments

### PNG Processing
- Parses PNG chunk structure
- Keeps critical chunks (IHDR, PLTE, IDAT, IEND)
- Removes metadata chunks (tEXt, iTXt, zTXt)
- Keeps essential chunks (tRNS, gAMA, sRGB)
- Rebuilds PNG with clean structure

### WebP Processing
- Parses RIFF/WebP container
- Removes EXIF and XMP chunks
- Preserves VP8/VP8L image data
- Keeps ICCP for color accuracy
- Maintains animation data if present

### Video Processing
Note: Video metadata stripping in the browser is limited. For complete video metadata removal, consider:
- Server-side processing with ffmpeg
- Desktop applications
- Or accept that some video metadata may remain

## Best Practices

### When to Strip Metadata
✓ Sharing photos with strangers
✓ Posting to public platforms
✓ Transferring to untrusted devices
✓ Selling items online with photos
✓ Protecting your location

### When to Preserve Metadata
✓ Sharing with trusted friends/family
✓ Photo backups and archival
✓ Professional photography workflows
✓ Legal/evidence documentation
✓ Travel photo organization

### Recommendations
1. Keep metadata stripping enabled by default
2. Review warnings before sending
3. Use metadata viewer for transparency
4. Add close contacts to trusted list
5. Preserve orientation for correct display

## Troubleshooting

### File Size Didn't Change
- Some files have minimal metadata
- Video stripping may not work in browser
- Already-processed files have no metadata

### Image Rotated Incorrectly
- Enable "Preserve orientation" setting
- Some apps don't respect orientation
- Re-upload with orientation preserved

### Processing Failed
- File may be corrupted
- Unsupported file format
- Browser limitations for large files
- Try again or use original file

### Video Metadata Still Present
- Browser can't process all video metadata
- Use desktop tools for complete removal
- Consider server-side processing

## API Reference

### stripMetadata(file, preserveOrientation)
Strip metadata from a single file.

**Parameters:**
- `file: File` - The file to process
- `preserveOrientation: boolean` - Keep orientation data (default: true)

**Returns:** `Promise<StripResult>`

### extractMetadata(file)
Extract metadata without stripping.

**Parameters:**
- `file: File` - The file to analyze

**Returns:** `Promise<MetadataInfo>`

### supportsMetadataStripping(fileType)
Check if file type is supported.

**Parameters:**
- `fileType: string` - MIME type of file

**Returns:** `boolean`

### stripMetadataBatch(files, onProgress)
Strip metadata from multiple files.

**Parameters:**
- `files: File[]` - Array of files to process
- `onProgress: (current, total) => void` - Progress callback

**Returns:** `Promise<StripResult[]>`

## Privacy Impact

### Before Implementation
- Photos reveal exact location
- Device ownership traceable
- Timeline of activities exposed
- Privacy at risk

### After Implementation
- Location data removed
- Device info stripped
- Timestamps cleaned
- Privacy protected

## Future Enhancements

### Planned Features
- [ ] Advanced video metadata removal (ffmpeg.wasm)
- [ ] Batch export with metadata report
- [ ] Metadata comparison tool
- [ ] Cloud storage integration
- [ ] PDF metadata stripping
- [ ] Audio file metadata removal

### Under Consideration
- Machine learning for sensitive data detection
- Automatic face/license plate blurring
- Geofence-based auto-stripping
- Per-file metadata policies
- Metadata restoration for trusted transfers

## Support

For issues or questions:
1. Check settings configuration
2. Review this documentation
3. Test with sample files
4. Report bugs with file details

## License

This feature is part of Tallow and follows the same license terms.
