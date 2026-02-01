/**
 * Metadata Stripper - Privacy Protection Module
 *
 * Strips EXIF and metadata from images and videos to protect user privacy.
 * Removes GPS locations, camera info, timestamps, and other identifying data.
 */

import * as ExifReader from 'exifreader';
import { warn, error } from '@/lib/utils/secure-logger';
import { metadataStripped } from '@/lib/monitoring/metrics';

// Supported file types for metadata stripping
export const METADATA_SUPPORTED_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  videos: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
} as const;

export interface MetadataInfo {
  // GPS Data
  gpsLatitude?: string;
  gpsLongitude?: string;
  gpsAltitude?: string;
  gpsTimestamp?: string;

  // Camera/Device Info
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;

  // Timestamps
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;
  createDate?: string;
  modifyDate?: string;

  // Author/Copyright
  artist?: string;
  copyright?: string;
  author?: string;

  // Technical Details
  orientation?: number;
  width?: number;
  height?: number;
  colorSpace?: string;

  // Sensitive flags
  hasSensitiveData: boolean;
  hasGPS: boolean;
  hasDeviceInfo: boolean;
  hasTimestamps: boolean;
  hasAuthorInfo: boolean;
}

export interface StripResult {
  success: boolean;
  originalFile: File;
  strippedFile?: File;
  metadata?: MetadataInfo;
  error?: string;
  bytesRemoved?: number;
}

/**
 * Supported image MIME types
 */
type SupportedImageType = typeof METADATA_SUPPORTED_TYPES.images[number];

/**
 * Supported video MIME types
 */
type SupportedVideoType = typeof METADATA_SUPPORTED_TYPES.videos[number];

/**
 * All supported MIME types
 */
type SupportedMimeType = SupportedImageType | SupportedVideoType;

/**
 * Check if file type supports metadata stripping
 *
 * @param fileType - MIME type to check
 * @returns True if metadata stripping is supported for this file type
 */
export function supportsMetadataStripping(fileType: string): fileType is SupportedMimeType {
  const supportedTypes: readonly string[] = [
    ...METADATA_SUPPORTED_TYPES.images,
    ...METADATA_SUPPORTED_TYPES.videos,
  ];
  return supportedTypes.includes(fileType);
}

/**
 * Extract metadata from file for analysis
 */
export async function extractMetadata(file: File): Promise<MetadataInfo> {
  const metadata: MetadataInfo = {
    hasSensitiveData: false,
    hasGPS: false,
    hasDeviceInfo: false,
    hasTimestamps: false,
    hasAuthorInfo: false,
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    // Extract GPS data
    if (tags.gps) {
      metadata.hasGPS = true;
      metadata.hasSensitiveData = true;

      if (tags.gps.Latitude) {
        metadata.gpsLatitude = String(tags.gps.Latitude);
      }
      if (tags.gps.Longitude) {
        metadata.gpsLongitude = String(tags.gps.Longitude);
      }
      if (tags.gps.Altitude) {
        metadata.gpsAltitude = String(tags.gps.Altitude);
      }
      const gpsDateStamp = (tags.gps as any)['GPSDateStamp'];
      if (gpsDateStamp) {
        metadata.gpsTimestamp = String(gpsDateStamp);
      }
    }

    // Extract device/camera info
    if (tags.exif) {
      if (tags.exif.Make) {
        metadata.make = String(tags.exif.Make.description || tags.exif.Make.value);
        metadata.hasDeviceInfo = true;
        metadata.hasSensitiveData = true;
      }
      if (tags.exif.Model) {
        metadata.model = String(tags.exif.Model.description || tags.exif.Model.value);
        metadata.hasDeviceInfo = true;
        metadata.hasSensitiveData = true;
      }
      if (tags.exif.Software) {
        metadata.software = String(tags.exif.Software.description || tags.exif.Software.value);
        metadata.hasDeviceInfo = true;
        metadata.hasSensitiveData = true;
      }
      if (tags.exif.LensModel) {
        metadata.lensModel = String(tags.exif.LensModel.description || tags.exif.LensModel.value);
        metadata.hasDeviceInfo = true;
      }

      // Extract timestamps
      if (tags.exif.DateTimeOriginal) {
        metadata.dateTimeOriginal = String(tags.exif.DateTimeOriginal.description || tags.exif.DateTimeOriginal.value);
        metadata.hasTimestamps = true;
        metadata.hasSensitiveData = true;
      }
      if (tags.exif.DateTimeDigitized) {
        metadata.dateTimeDigitized = String(tags.exif.DateTimeDigitized.description || tags.exif.DateTimeDigitized.value);
        metadata.hasTimestamps = true;
      }
      const createDate = (tags.exif as any)['CreateDate'];
      if (createDate) {
        metadata.createDate = String(createDate.description || createDate.value);
        metadata.hasTimestamps = true;
      }
      const modifyDate = (tags.exif as any)['ModifyDate'];
      if (modifyDate) {
        metadata.modifyDate = String(modifyDate.description || modifyDate.value);
        metadata.hasTimestamps = true;
      }

      // Technical details (keep these, not sensitive)
      if (tags.exif.Orientation) {
        metadata.orientation = Number(tags.exif.Orientation.value);
      }
    }

    // Extract author/copyright info
    const ifd0 = (tags as any)['ifd0'];
    if (ifd0 || tags.exif) {
      const sourceTags = ifd0 || tags.exif;

      if (sourceTags.Artist) {
        metadata.artist = String(sourceTags.Artist.description || sourceTags.Artist.value);
        metadata.hasAuthorInfo = true;
        metadata.hasSensitiveData = true;
      }
      if (sourceTags.Copyright) {
        metadata.copyright = String(sourceTags.Copyright.description || sourceTags.Copyright.value);
        metadata.hasAuthorInfo = true;
        metadata.hasSensitiveData = true;
      }
      if (sourceTags.Author) {
        metadata.author = String(sourceTags.Author.description || sourceTags.Author.value);
        metadata.hasAuthorInfo = true;
        metadata.hasSensitiveData = true;
      }
    }

    // Extract dimensions
    if (tags.file) {
      if (tags.file['Image Width']) {
        metadata.width = Number(tags.file['Image Width'].value);
      }
      if (tags.file['Image Height']) {
        metadata.height = Number(tags.file['Image Height'].value);
      }
    }

  } catch (err) {
    warn('Failed to extract metadata:', err);
  }

  return metadata;
}

/**
 * Strip metadata from JPEG files
 */
async function stripJpegMetadata(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // Validate minimum size
  if (arrayBuffer.byteLength < 4) {
    throw new Error('File too small to be a valid JPEG');
  }

  // JPEG files start with FFD8
  if (dataView.getUint16(0) !== 0xFFD8) {
    throw new Error('Not a valid JPEG file');
  }

  const segments: ArrayBuffer[] = [];
  let offset = 0;

  // Add JPEG SOI marker (FFD8)
  const soiMarker = new Uint8Array([0xFF, 0xD8]);
  segments.push(soiMarker.buffer);
  offset = 2;

  // Parse JPEG segments
  while (offset < dataView.byteLength - 1) {
    // Ensure we have enough bytes to read marker
    if (offset + 1 >= dataView.byteLength) {
      break;
    }

    const marker = dataView.getUint16(offset);

    // Start of Scan - everything after this is image data
    if (marker === 0xFFDA) {
      // Copy SOS and remaining image data
      const remaining = new Uint8Array(arrayBuffer, offset);
      segments.push(remaining.buffer);
      break;
    }

    offset += 2;

    // Standalone markers (no length field)
    if (marker >= 0xFFD0 && marker <= 0xFFD9) {
      continue;
    }

    // Ensure we have enough bytes to read length
    if (offset + 1 >= dataView.byteLength) {
      break;
    }

    const segmentLength = dataView.getUint16(offset);

    // Validate segment length
    if (segmentLength < 2 || offset + segmentLength > dataView.byteLength) {
      // Invalid segment, skip remaining data
      break;
    }

    // Skip EXIF (APP1), XMP, and other metadata segments
    const shouldSkip = (
      marker === 0xFFE1 || // APP1 (EXIF)
      marker === 0xFFE2 || // APP2 (ICC Profile, FlashPix)
      marker === 0xFFE3 || // APP3
      marker === 0xFFED || // Photoshop
      marker === 0xFFEE    // Adobe
    );

    if (!shouldSkip) {
      // Keep this segment
      const segment = new Uint8Array(arrayBuffer, offset - 2, segmentLength + 2);
      segments.push(segment.buffer);
    }

    offset += segmentLength;
  }

  // Combine all segments
  const totalLength = segments.reduce((sum, seg) => sum + seg.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;

  for (const segment of segments) {
    result.set(new Uint8Array(segment), position);
    position += segment.byteLength;
  }

  // Create new file
  return new File([result], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });
}

/**
 * Strip metadata from PNG files
 */
async function stripPngMetadata(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // Validate minimum size
  if (arrayBuffer.byteLength < 8) {
    throw new Error('File too small to be a valid PNG');
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const fileSignature = new Uint8Array(arrayBuffer, 0, 8);

  if (!pngSignature.every((byte, i) => byte === fileSignature[i])) {
    throw new Error('Not a valid PNG file');
  }

  const chunks: ArrayBuffer[] = [];

  // Add PNG signature
  chunks.push(pngSignature.buffer.slice(0));

  let offset = 8;

  // Parse PNG chunks
  while (offset + 12 <= dataView.byteLength) { // Need at least 12 bytes for a chunk
    const chunkLength = dataView.getUint32(offset);
    const chunkType = String.fromCharCode(
      dataView.getUint8(offset + 4),
      dataView.getUint8(offset + 5),
      dataView.getUint8(offset + 6),
      dataView.getUint8(offset + 7)
    );

    const totalChunkSize = chunkLength + 12; // length(4) + type(4) + data + crc(4)

    // Validate chunk size
    if (offset + totalChunkSize > dataView.byteLength) {
      warn('Invalid PNG chunk size, stopping parse');
      break;
    }

    // Keep critical chunks and safe ancillary chunks
    const shouldKeep = (
      chunkType === 'IHDR' || // Image header
      chunkType === 'PLTE' || // Palette
      chunkType === 'IDAT' || // Image data
      chunkType === 'IEND' || // Image end
      chunkType === 'tRNS' || // Transparency
      chunkType === 'cHRM' || // Chromaticity
      chunkType === 'gAMA' || // Gamma
      chunkType === 'sRGB' || // sRGB
      chunkType === 'pHYs'    // Physical pixel dimensions
    );

    if (shouldKeep) {
      const chunk = new Uint8Array(arrayBuffer, offset, totalChunkSize);
      chunks.push(chunk.buffer.slice(0));
    }

    offset += totalChunkSize;

    // Stop at IEND
    if (chunkType === 'IEND') {
      break;
    }
  }

  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;

  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), position);
    position += chunk.byteLength;
  }

  return new File([result], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });
}

/**
 * Strip metadata from video files (MP4/MOV)
 * Parses MP4 container format and removes metadata boxes
 */
async function stripVideoMetadata(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Parse MP4 boxes and filter out metadata
    const cleanedBoxes = await parseAndCleanMp4Boxes(dataView, 0, arrayBuffer.byteLength);

    // Recalculate total size
    const totalSize = cleanedBoxes.reduce((sum, box) => sum + box.byteLength, 0);
    const result = new Uint8Array(totalSize);

    // Combine cleaned boxes
    let offset = 0;
    for (const box of cleanedBoxes) {
      result.set(new Uint8Array(box), offset);
      offset += box.byteLength;
    }

    return new File([result], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (err) {
    warn('Video metadata stripping failed, returning original file:', err);
    // If parsing fails, return original file rather than breaking transfer
    return file;
  }
}

/**
 * Parse MP4 boxes recursively and remove metadata
 */
async function parseAndCleanMp4Boxes(
  dataView: DataView,
  start: number,
  end: number
): Promise<ArrayBuffer[]> {
  const boxes: ArrayBuffer[] = [];
  let offset = start;

  while (offset < end) {
    // Read box size (4 bytes) and type (4 bytes)
    if (offset + 8 > end) {break;}

    let boxSize = dataView.getUint32(offset);
    const boxType = String.fromCharCode(
      dataView.getUint8(offset + 4),
      dataView.getUint8(offset + 5),
      dataView.getUint8(offset + 6),
      dataView.getUint8(offset + 7)
    );

    // Handle extended size (size = 1 means 64-bit size follows)
    let headerSize = 8;
    if (boxSize === 1) {
      boxSize = Number(dataView.getBigUint64(offset + 8));
      headerSize = 16;
    } else if (boxSize === 0) {
      // Size = 0 means box extends to end of file
      boxSize = end - offset;
    }

    // Validate box size
    if (boxSize < headerSize || offset + boxSize > end) {
      // Invalid box, skip remaining data
      break;
    }

    // Metadata boxes to remove completely
    const metadataBoxes = [
      'udta', // User data
      'meta', // Metadata
      'cprt', // Copyright
      '\xa9cpy', // Copyright (alternative)
      '\xa9ART', // Artist
      '\xa9nam', // Name
      '\xa9alb', // Album
      '\xa9day', // Date
      '\xa9cmt', // Comment
      '\xa9too', // Tool
      '\xa9des', // Description
      '\xa9gen', // Genre
      'loci', // Location information (GPS)
      'xyz ', // XYZ GPS location
      '©xyz', // GPS coordinates
    ];

    if (metadataBoxes.includes(boxType)) {
      // Skip this box entirely
      offset += boxSize;
      continue;
    }

    // Container boxes that may contain metadata - process recursively
    const containerBoxes = ['moov', 'trak', 'mdia', 'minf', 'stbl', 'ilst'];

    if (containerBoxes.includes(boxType)) {
      // Recursively clean child boxes
      const childBoxes = await parseAndCleanMp4Boxes(
        dataView,
        offset + headerSize,
        offset + boxSize
      );

      // Recalculate size with cleaned children
      const childrenSize = childBoxes.reduce((sum, box) => sum + box.byteLength, 0);
      const newBoxSize = headerSize + childrenSize;

      // Create new box with cleaned children
      const newBox = new Uint8Array(newBoxSize);
      const newBoxView = new DataView(newBox.buffer);

      // Write header
      newBoxView.setUint32(0, newBoxSize);
      newBox.set(new TextEncoder().encode(boxType), 4);

      // Copy children
      let childOffset = headerSize;
      for (const childBox of childBoxes) {
        newBox.set(new Uint8Array(childBox), childOffset);
        childOffset += childBox.byteLength;
      }

      boxes.push(newBox.buffer);
    } else {
      // Keep box as-is (video/audio data, essential structures)
      const box = new Uint8Array(dataView.buffer, offset, boxSize);
      boxes.push(box.buffer.slice(0));
    }

    offset += boxSize;
  }

  return boxes;
}

/**
 * Strip metadata from WebP files
 */
async function stripWebPMetadata(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // WebP signature: "RIFF" + size + "WEBP"
  const riff = String.fromCharCode(
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
    dataView.getUint8(3)
  );
  const webp = String.fromCharCode(
    dataView.getUint8(8),
    dataView.getUint8(9),
    dataView.getUint8(10),
    dataView.getUint8(11)
  );

  if (riff !== 'RIFF' || webp !== 'WEBP') {
    throw new Error('Not a valid WebP file');
  }

  const chunks: { fourCC: string; data: Uint8Array }[] = [];
  let offset = 12;

  // Parse WebP chunks
  while (offset < dataView.byteLength) {
    const fourCC = String.fromCharCode(
      dataView.getUint8(offset),
      dataView.getUint8(offset + 1),
      dataView.getUint8(offset + 2),
      dataView.getUint8(offset + 3)
    );

    const chunkSize = dataView.getUint32(offset + 4, true);
    const paddedSize = (chunkSize + 1) & ~1; // Chunks are padded to even bytes

    // Keep image data chunks, skip metadata chunks
    const shouldKeep = (
      fourCC === 'VP8 ' || // Lossy
      fourCC === 'VP8L' || // Lossless
      fourCC === 'VP8X' || // Extended
      fourCC === 'ANIM' || // Animation
      fourCC === 'ANMF' || // Animation frame
      fourCC === 'ALPH' || // Alpha
      fourCC === 'ICCP'    // Color profile (keep for color accuracy)
    );

    if (shouldKeep) {
      const chunkData = new Uint8Array(arrayBuffer, offset, 8 + paddedSize);
      chunks.push({ fourCC, data: chunkData });
    }

    offset += 8 + paddedSize;
  }

  // Rebuild WebP file
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0);
  const result = new Uint8Array(12 + totalSize);

  // RIFF header
  result.set(new TextEncoder().encode('RIFF'), 0);
  new DataView(result.buffer).setUint32(4, 4 + totalSize, true);
  result.set(new TextEncoder().encode('WEBP'), 8);

  // Chunks
  let position = 12;
  for (const chunk of chunks) {
    result.set(chunk.data, position);
    position += chunk.data.byteLength;
  }

  return new File([result], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });
}

/**
 * Main function to strip metadata from a file
 */
export async function stripMetadata(
  file: File,
  _preserveOrientation: boolean = true
): Promise<StripResult> {
  const result: StripResult = {
    success: false,
    originalFile: file,
  };

  try {
    // Check if file type is supported
    if (!supportsMetadataStripping(file.type)) {
      return {
        ...result,
        error: 'File type not supported for metadata stripping',
      };
    }

    // Extract metadata before stripping
    result.metadata = await extractMetadata(file);

    // Strip metadata based on file type
    let strippedFile: File;

    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      strippedFile = await stripJpegMetadata(file);
    } else if (file.type === 'image/png') {
      strippedFile = await stripPngMetadata(file);
    } else if (file.type === 'image/webp') {
      strippedFile = await stripWebPMetadata(file);
    } else if (METADATA_SUPPORTED_TYPES.videos.includes(file.type as any)) {
      strippedFile = await stripVideoMetadata(file);
    } else {
      // Fallback: re-encode through canvas for image types
      strippedFile = await stripViaCanvas(file);
    }

    result.success = true;
    result.strippedFile = strippedFile;
    result.bytesRemoved = file.size - strippedFile.size;

    // Record successful metadata stripping metric
    metadataStripped.labels().inc();

    return result;

  } catch (err) {
    error('Metadata stripping failed:', err);

    // Record failed metadata stripping metric
    metadataStripped.labels().inc();

    return {
      ...result,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Fallback method: strip metadata by re-encoding through canvas
 */
async function stripViaCanvas(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const newFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(newFile);
        },
        file.type,
        0.95 // Quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Batch strip metadata from multiple files
 */
export async function stripMetadataBatch(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<StripResult[]> {
  const results: StripResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      const result = await stripMetadata(file);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }
  }

  return results;
}

/**
 * Get human-readable summary of metadata
 */
export function getMetadataSummary(metadata: MetadataInfo): string[] {
  const summary: string[] = [];

  if (metadata.hasGPS) {
    summary.push('GPS location data');
  }
  if (metadata.hasDeviceInfo) {
    summary.push('Camera/device information');
  }
  if (metadata.hasTimestamps) {
    summary.push('Date and time information');
  }
  if (metadata.hasAuthorInfo) {
    summary.push('Author/copyright data');
  }

  return summary.length > 0 ? summary : ['No sensitive metadata detected'];
}
