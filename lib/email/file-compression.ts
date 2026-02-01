/**
 * File Compression Utilities
 * Handles zipping multiple files for email transfer
 * JSZip is lazy-loaded to reduce initial bundle size (~25KB)
 */

import { createHash } from 'crypto';

export interface CompressedFile {
  buffer: Buffer;
  filename: string;
  originalSize: number;
  compressedSize: number;
  checksum: string;
  compressionRatio: number;
}

export function calculateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function compressFiles(
  files: Array<{ filename: string; content: Buffer | string; size: number }>
): Promise<CompressedFile> {
  // Lazy-load JSZip to reduce initial bundle size (~25KB)
   
  const JSZip = (await import('jszip') as unknown as { default: new () => import('jszip') }).default;
  const zip = new JSZip();
  let totalOriginalSize = 0;

  for (const file of files) {
    const content = typeof file.content === 'string'
      ? Buffer.from(file.content, 'base64')
      : file.content;

    zip.file(file.filename, content);
    totalOriginalSize += file.size;
  }

  const compressedBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const compressedSize = compressedBuffer.length;
  const checksum = calculateChecksum(compressedBuffer);
  const compressionRatio = totalOriginalSize > 0
    ? (1 - compressedSize / totalOriginalSize) * 100
    : 0;

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = 'files-' + timestamp + '.zip';

  return {
    buffer: compressedBuffer,
    filename,
    originalSize: totalOriginalSize,
    compressedSize,
    checksum,
    compressionRatio,
  };
}

export function shouldCompress(
  files: Array<{ filename: string; size: number }>,
  _totalSize: number
): boolean {
  if (files.length <= 1) {return false;}

  const compressedExtensions = [
    '.zip', '.gz', '.7z', '.rar', '.tar.gz',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.mp4', '.avi', '.mov', '.mkv',
    '.mp3', '.aac', '.ogg', '.flac',
    '.pdf', '.docx', '.xlsx', '.pptx',
  ];

  const allCompressed = files.every(file =>
    compressedExtensions.some(ext =>
      file.filename.toLowerCase().endsWith(ext)
    )
  );

  return !allCompressed;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {return bytes + ' B';}
  if (bytes < 1024 * 1024) {return (bytes / 1024).toFixed(1) + ' KB';}
  if (bytes < 1024 * 1024 * 1024) {return (bytes / (1024 * 1024)).toFixed(1) + ' MB';}
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export function estimateCompressionRatio(
  files: Array<{ filename: string; size: number }>
): number {
  let estimatedRatio = 0;

  for (const file of files) {
    const ext = file.filename.toLowerCase().split('.').pop() || '';

    if (['txt', 'html', 'css', 'js', 'json', 'xml', 'svg'].includes(ext)) {
      estimatedRatio += 0.7;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'pdf'].includes(ext)) {
      estimatedRatio += 0.05;
    } else {
      estimatedRatio += 0.3;
    }
  }

  return files.length > 0 ? (estimatedRatio / files.length) * 100 : 0;
}

export default {
  compressFiles,
  calculateChecksum,
  shouldCompress,
  formatFileSize,
  estimateCompressionRatio,
};
