'use client';

/**
 * Folder Transfer Utilities
 * Handles folder structure preservation, compression, and reconstruction
 */

import { zip, unzip, AsyncZippable } from 'fflate';
import secureLog from '../utils/secure-logger';

export interface FolderStructure {
  name: string;
  path: string;
  files: FolderFile[];
  totalSize: number;
  fileCount: number;
  isCompressed: boolean;
}

export interface FolderFile {
  name: string;
  relativePath: string;
  size: number;
  type: string;
  lastModified: number;
  file: File;
}

export interface FolderTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  children?: FolderTreeNode[];
  file?: File;
}

// System files to exclude from folder transfers
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

// No size limit - unlimited file/folder transfer
const MAX_FOLDER_SIZE = Number.MAX_SAFE_INTEGER;

/**
 * Check if a file is a system file that should be excluded
 */
function isSystemFile(filename: string): boolean {
  return SYSTEM_FILES.some(
    (systemFile) =>
      filename === systemFile ||
      filename.startsWith(systemFile + '/') ||
      filename.includes('/' + systemFile + '/')
  );
}

/**
 * Extract folder name from webkitRelativePath
 */
export function extractFolderName(files: File[]): string {
  if (files.length === 0) {return 'folder';}

  const firstFile = files[0] as File & { webkitRelativePath?: string };
  if (!firstFile.webkitRelativePath) {return 'folder';}

  const parts = firstFile.webkitRelativePath.split('/');
  return parts[0] || 'folder';
}

/**
 * Build folder structure from FileList
 */
export function buildFolderStructure(
  files: FileList | File[],
  options: {
    excludeSystemFiles?: boolean;
    maxSize?: number;
    fileFilter?: (file: File) => boolean;
  } = {}
): FolderStructure {
  const {
    excludeSystemFiles = true,
    maxSize = MAX_FOLDER_SIZE,
    fileFilter,
  } = options;

  const fileArray = Array.from(files);
  const folderFiles: FolderFile[] = [];
  let totalSize = 0;

  for (const file of fileArray) {
    const webkitFile = file as File & { webkitRelativePath?: string };
    const relativePath = webkitFile.webkitRelativePath || file.name;

    // Check if it's a system file
    if (excludeSystemFiles && isSystemFile(relativePath)) {
      secureLog.log(`[FolderTransfer] Skipping system file: ${relativePath}`);
      continue;
    }

    // Apply custom filter if provided
    if (fileFilter && !fileFilter(file)) {
      continue;
    }

    // Check size limit
    if (totalSize + file.size > maxSize) {
      throw new Error(
        `Folder exceeds maximum size of ${(maxSize / (1024 * 1024 * 1024)).toFixed(1)}GB`
      );
    }

    folderFiles.push({
      name: file.name,
      relativePath,
      size: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified,
      file,
    });

    totalSize += file.size;
  }

  const folderName = extractFolderName(fileArray);

  return {
    name: folderName,
    path: folderName,
    files: folderFiles,
    totalSize,
    fileCount: folderFiles.length,
    isCompressed: false,
  };
}

/**
 * Build a tree structure for UI display
 */
export function buildFolderTree(folderStructure: FolderStructure): FolderTreeNode {
  const root: FolderTreeNode = {
    name: folderStructure.name,
    path: folderStructure.path,
    type: 'folder',
    size: folderStructure.totalSize,
    children: [],
  };

  const pathMap = new Map<string, FolderTreeNode>();
  pathMap.set('', root);

  for (const file of folderStructure.files) {
    const pathParts = file.relativePath.split('/');
    let currentPath = '';

    // Create folder nodes for each part of the path
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!part) {continue;}

      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!pathMap.has(currentPath)) {
        const folderNode: FolderTreeNode = {
          name: part,
          path: currentPath,
          type: 'folder',
          size: 0,
          children: [],
        };

        const parent = pathMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(folderNode);
        }

        pathMap.set(currentPath, folderNode);
      }
    }

    // Add file node
    const fileNode: FolderTreeNode = {
      name: file.name,
      path: file.relativePath,
      type: 'file',
      size: file.size,
      file: file.file,
    };

    const parentPath = pathParts.slice(0, -1).join('/');
    const parent = pathMap.get(parentPath);
    if (parent && parent.children) {
      parent.children.push(fileNode);
    }

    // Update parent folder sizes
    let currentParent = parent;
    let currentParentPath = parentPath;
    while (currentParent) {
      currentParent.size += file.size;
      const parts = currentParentPath.split('/');
      parts.pop();
      currentParentPath = parts.join('/');
      currentParent = pathMap.get(currentParentPath);
    }
  }

  return root;
}

/**
 * Compress folder to zip file
 */
export async function compressFolder(
  folderStructure: FolderStructure,
  onProgress?: (progress: number, file: string) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const zipData: AsyncZippable = {};
    let processedFiles = 0;

    // Prepare files for compression
    const prepareFiles = async () => {
      for (const folderFile of folderStructure.files) {
        try {
          const buffer = await folderFile.file.arrayBuffer();
          zipData[folderFile.relativePath] = new Uint8Array(buffer);

          processedFiles++;
          if (onProgress) {
            const progress = (processedFiles / folderStructure.fileCount) * 50; // First 50% for reading
            onProgress(progress, folderFile.relativePath);
          }
        } catch (error) {
          reject(new Error(`Failed to read file ${folderFile.name}: ${error}`));
          return;
        }
      }

      // Compress
      zip(zipData, { level: 6 }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        if (onProgress) {
          onProgress(100, 'Compression complete');
        }

        resolve(new Blob([data], { type: 'application/zip' }));
      });
    };

    prepareFiles();
  });
}

/**
 * Decompress zip file to folder structure
 */
export async function decompressFolder(
  zipBlob: Blob,
  onProgress?: (progress: number, file: string) => void
): Promise<FolderStructure> {
  const buffer = await zipBlob.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  return new Promise((resolve, reject) => {
    unzip(uint8Array, (err, unzipped) => {
      if (err) {
        reject(err);
        return;
      }

      const files: FolderFile[] = [];
      let totalSize = 0;
      const entries = Object.entries(unzipped);
      let processedEntries = 0;

      for (const [relativePath, data] of entries) {
        // Skip directories (they end with /)
        if (relativePath.endsWith('/')) {
          processedEntries++;
          continue;
        }

        const pathParts = relativePath.split('/');
        const name = pathParts[pathParts.length - 1];
        if (!name) {continue;}

        const blob = new Blob([data]);
        const file = new File([blob], name, {
          type: getMimeType(name),
          lastModified: Date.now(),
        });

        files.push({
          name,
          relativePath,
          size: data.length,
          type: file.type,
          lastModified: Date.now(),
          file,
        });

        totalSize += data.length;
        processedEntries++;

        if (onProgress) {
          const progress = (processedEntries / entries.length) * 100;
          onProgress(progress, relativePath);
        }
      }

      const folderName = extractFolderName(files.map((f) => f.file));

      resolve({
        name: folderName,
        path: folderName,
        files,
        totalSize,
        fileCount: files.length,
        isCompressed: false,
      });
    });
  });
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    json: 'application/json',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Download folder as zip
 */
export async function downloadFolderAsZip(
  folderStructure: FolderStructure,
  filename?: string,
  onProgress?: (progress: number, file: string) => void
): Promise<void> {
  const zipBlob = await compressFolder(folderStructure, onProgress);
  const url = URL.createObjectURL(zipBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${folderStructure.name}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Filter files by extension
 */
export function filterFilesByExtension(
  folderStructure: FolderStructure,
  extensions: string[]
): FolderStructure {
  const normalizedExtensions = extensions.map((ext) =>
    ext.toLowerCase().replace(/^\./, '')
  );

  const filteredFiles = folderStructure.files.filter((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext && normalizedExtensions.includes(ext);
  });

  const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);

  return {
    ...folderStructure,
    files: filteredFiles,
    totalSize,
    fileCount: filteredFiles.length,
  };
}

/**
 * Calculate compression stats
 */
export function estimateCompressionRatio(folderStructure: FolderStructure): {
  estimatedSize: number;
  estimatedRatio: number;
} {
  // Estimate based on file types
  let estimatedSize = 0;

  for (const file of folderStructure.files) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let ratio = 0.7; // Default 30% compression

    // Already compressed formats
    if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'zip', 'rar', '7z'].includes(ext || '')) {
      ratio = 0.95; // 5% compression
    }
    // Highly compressible formats
    else if (['txt', 'json', 'xml', 'html', 'css', 'js', 'svg'].includes(ext || '')) {
      ratio = 0.3; // 70% compression
    }
    // Medium compressibility
    else if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) {
      ratio = 0.6; // 40% compression
    }

    estimatedSize += file.size * ratio;
  }

  return {
    estimatedSize: Math.ceil(estimatedSize),
    estimatedRatio: folderStructure.totalSize > 0 ? estimatedSize / folderStructure.totalSize : 1,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get folder statistics
 */
export function getFolderStats(folderStructure: FolderStructure): {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  largestFile: FolderFile | null;
  depth: number;
} {
  const fileTypes: Record<string, number> = {};
  let largestFile: FolderFile | null = null;
  let maxDepth = 0;

  for (const file of folderStructure.files) {
    // Count file types
    const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;

    // Track largest file
    if (!largestFile || file.size > largestFile.size) {
      largestFile = file;
    }

    // Calculate depth
    const depth = file.relativePath.split('/').length;
    if (depth > maxDepth) {
      maxDepth = depth;
    }
  }

  const folders = new Set(
    folderStructure.files
      .map((f) => f.relativePath.split('/').slice(0, -1).join('/'))
      .filter((p) => p !== '')
  );

  return {
    totalFiles: folderStructure.fileCount,
    totalFolders: folders.size,
    totalSize: folderStructure.totalSize,
    fileTypes,
    largestFile,
    depth: maxDepth,
  };
}
