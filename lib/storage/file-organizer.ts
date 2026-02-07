/**
 * File Organizer - Auto-organize received files
 * Provides multiple organization strategies for transfer history
 */

import type { TransferRecord } from './transfer-history';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FileCategory =
  | 'images'
  | 'videos'
  | 'documents'
  | 'audio'
  | 'archives'
  | 'code'
  | 'other';

export type DateCategory =
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'this-month'
  | 'older';

export interface OrganizedByType {
  category: FileCategory;
  label: string;
  icon: string;
  transfers: TransferRecord[];
  fileCount: number;
  totalSize: number;
}

export interface OrganizedBySender {
  senderId: string;
  senderName: string;
  transfers: TransferRecord[];
  fileCount: number;
  totalSize: number;
}

export interface OrganizedByDate {
  category: DateCategory;
  label: string;
  transfers: TransferRecord[];
  fileCount: number;
  totalSize: number;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<FileCategory, { count: number; size: number }>;
}

// ============================================================================
// FILE TYPE MAPPINGS
// ============================================================================

const FILE_TYPE_CATEGORIES: Record<FileCategory, string[]> = {
  images: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
    '.ico',
    '.tiff',
    '.tif',
    '.heic',
    '.heif',
  ],
  videos: [
    '.mp4',
    '.webm',
    '.mov',
    '.avi',
    '.mkv',
    '.flv',
    '.wmv',
    '.m4v',
    '.mpg',
    '.mpeg',
    '.3gp',
  ],
  documents: [
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.md',
    '.rtf',
    '.odt',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.csv',
    '.json',
    '.xml',
  ],
  audio: [
    '.mp3',
    '.wav',
    '.aac',
    '.flac',
    '.ogg',
    '.m4a',
    '.wma',
    '.opus',
    '.ape',
  ],
  archives: [
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
    '.bz2',
    '.xz',
    '.iso',
    '.dmg',
  ],
  code: [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.rs',
    '.go',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.php',
    '.rb',
    '.swift',
    '.kt',
    '.scala',
    '.r',
    '.sh',
    '.bash',
    '.sql',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.vue',
    '.svelte',
  ],
  other: [],
};

const CATEGORY_LABELS: Record<FileCategory, string> = {
  images: 'Images',
  videos: 'Videos',
  documents: 'Documents',
  audio: 'Audio',
  archives: 'Archives',
  code: 'Code',
  other: 'Other',
};

const CATEGORY_ICONS: Record<FileCategory, string> = {
  images: '🖼️',
  videos: '🎬',
  documents: '📄',
  audio: '🎵',
  archives: '📦',
  code: '💻',
  other: '📎',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get file category based on extension
 */
function getFileCategory(fileName: string): FileCategory {
  const extension = ('.' + fileName.split('.').pop()?.toLowerCase()) || '';

  for (const [category, extensions] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (extensions.includes(extension)) {
      return category as FileCategory;
    }
  }

  return 'other';
}

/**
 * Get date category for a given timestamp
 */
function getDateCategory(date: Date): DateCategory {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const transferDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (transferDate.getTime() === today.getTime()) {
    return 'today';
  } else if (transferDate.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else if (transferDate >= weekAgo) {
    return 'this-week';
  } else if (transferDate >= monthAgo) {
    return 'this-month';
  } else {
    return 'older';
  }
}

/**
 * Get label for date category
 */
function getDateLabel(category: DateCategory): string {
  const labels: Record<DateCategory, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    'this-week': 'This Week',
    'this-month': 'This Month',
    older: 'Older',
  };
  return labels[category];
}

/**
 * Count total files in transfer
 */
function countFiles(transfer: TransferRecord): number {
  return transfer.files.length;
}

/**
 * Get total size of transfer
 */
function getTotalSize(transfer: TransferRecord): number {
  return transfer.totalSize;
}

// ============================================================================
// ORGANIZATION FUNCTIONS
// ============================================================================

/**
 * Organize transfers by file type
 */
export function organizeByType(
  transfers: TransferRecord[]
): OrganizedByType[] {
  // Filter received transfers only
  const received = transfers.filter((t) => t.direction === 'receive');

  // Group by category
  const groups = new Map<FileCategory, TransferRecord[]>();

  for (const transfer of received) {
    // Determine primary category for this transfer
    const categories = transfer.files.map((f) => getFileCategory(f.name));
    const primaryCategory =
      categories[0] || 'other'; // Use first file's category

    if (!groups.has(primaryCategory)) {
      groups.set(primaryCategory, []);
    }
    groups.get(primaryCategory)!.push(transfer);
  }

  // Convert to array format
  const result: OrganizedByType[] = [];

  // Add all categories in order, even if empty
  const categoryOrder: FileCategory[] = [
    'images',
    'videos',
    'documents',
    'audio',
    'archives',
    'code',
    'other',
  ];

  for (const category of categoryOrder) {
    const categoryTransfers = groups.get(category) || [];
    const fileCount = categoryTransfers.reduce(
      (sum, t) => sum + countFiles(t),
      0
    );
    const totalSize = categoryTransfers.reduce(
      (sum, t) => sum + getTotalSize(t),
      0
    );

    result.push({
      category,
      label: CATEGORY_LABELS[category],
      icon: CATEGORY_ICONS[category],
      transfers: categoryTransfers,
      fileCount,
      totalSize,
    });
  }

  return result.filter((r) => r.transfers.length > 0); // Only show non-empty
}

/**
 * Organize transfers by sender
 */
export function organizeBySender(
  transfers: TransferRecord[]
): OrganizedBySender[] {
  // Filter received transfers only
  const received = transfers.filter((t) => t.direction === 'receive');

  // Group by sender
  const groups = new Map<string, TransferRecord[]>();

  for (const transfer of received) {
    const senderId = transfer.peerId;
    if (!groups.has(senderId)) {
      groups.set(senderId, []);
    }
    groups.get(senderId)!.push(transfer);
  }

  // Convert to array format
  const result: OrganizedBySender[] = [];

  for (const [senderId, senderTransfers] of groups.entries()) {
    const senderName = senderTransfers[0]?.peerName || 'Unknown';
    const fileCount = senderTransfers.reduce(
      (sum, t) => sum + countFiles(t),
      0
    );
    const totalSize = senderTransfers.reduce(
      (sum, t) => sum + getTotalSize(t),
      0
    );

    result.push({
      senderId,
      senderName,
      transfers: senderTransfers,
      fileCount,
      totalSize,
    });
  }

  // Sort by most recent first
  result.sort((a, b) => {
    const aLatest = Math.max(...a.transfers.map((t) => t.completedAt.getTime()));
    const bLatest = Math.max(...b.transfers.map((t) => t.completedAt.getTime()));
    return bLatest - aLatest;
  });

  return result;
}

/**
 * Organize transfers by date
 */
export function organizeByDate(
  transfers: TransferRecord[]
): OrganizedByDate[] {
  // Filter received transfers only
  const received = transfers.filter((t) => t.direction === 'receive');

  // Group by date category
  const groups = new Map<DateCategory, TransferRecord[]>();

  for (const transfer of received) {
    const category = getDateCategory(transfer.completedAt);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(transfer);
  }

  // Convert to array format
  const result: OrganizedByDate[] = [];

  const dateOrder: DateCategory[] = [
    'today',
    'yesterday',
    'this-week',
    'this-month',
    'older',
  ];

  for (const category of dateOrder) {
    const categoryTransfers = groups.get(category) || [];
    if (categoryTransfers.length === 0) {continue;}

    const fileCount = categoryTransfers.reduce(
      (sum, t) => sum + countFiles(t),
      0
    );
    const totalSize = categoryTransfers.reduce(
      (sum, t) => sum + getTotalSize(t),
      0
    );

    result.push({
      category,
      label: getDateLabel(category),
      transfers: categoryTransfers,
      fileCount,
      totalSize,
    });
  }

  return result;
}

/**
 * Get file statistics
 */
export function getStats(transfers: TransferRecord[]): FileStats {
  // Filter received transfers only
  const received = transfers.filter((t) => t.direction === 'receive');

  const byType: Record<FileCategory, { count: number; size: number }> = {
    images: { count: 0, size: 0 },
    videos: { count: 0, size: 0 },
    documents: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
    archives: { count: 0, size: 0 },
    code: { count: 0, size: 0 },
    other: { count: 0, size: 0 },
  };

  let totalFiles = 0;
  let totalSize = 0;

  for (const transfer of received) {
    totalFiles += countFiles(transfer);
    totalSize += getTotalSize(transfer);

    for (const file of transfer.files) {
      const category = getFileCategory(file.name);
      byType[category].count += 1;
      byType[category].size += file.size;
    }
  }

  return {
    totalFiles,
    totalSize,
    byType,
  };
}

export default {
  organizeByType,
  organizeBySender,
  organizeByDate,
  getStats,
};
