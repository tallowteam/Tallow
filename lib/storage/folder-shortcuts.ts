/**
 * Folder Shortcuts Module
 *
 * Manages quick access to common folders for file selection.
 * Since web browsers can't access filesystem paths directly,
 * this stores folder names and metadata in localStorage.
 */

const STORAGE_KEY = 'tallow_recent_folders';
const MAX_RECENT_FOLDERS = 5;

export interface FolderShortcut {
  id: string;
  name: string;
  type: FolderType;
  timestamp: number;
  isRecent?: boolean;
}

export type FolderType =
  | 'documents'
  | 'downloads'
  | 'pictures'
  | 'videos'
  | 'desktop'
  | 'recent'
  | 'custom';

/**
 * Predefined folder categories
 */
const PREDEFINED_FOLDERS: FolderShortcut[] = [
  {
    id: 'documents',
    name: 'Documents',
    type: 'documents',
    timestamp: 0,
  },
  {
    id: 'downloads',
    name: 'Downloads',
    type: 'downloads',
    timestamp: 0,
  },
  {
    id: 'pictures',
    name: 'Pictures',
    type: 'pictures',
    timestamp: 0,
  },
  {
    id: 'videos',
    name: 'Videos',
    type: 'videos',
    timestamp: 0,
  },
  {
    id: 'desktop',
    name: 'Desktop',
    type: 'desktop',
    timestamp: 0,
  },
];

/**
 * Get all quick access folders (recent + predefined)
 */
export function getQuickAccessFolders(): FolderShortcut[] {
  const recentFolders = getRecentFolders();

  // Combine recent and predefined, with recent first
  return [...recentFolders, ...PREDEFINED_FOLDERS];
}

/**
 * Get recently opened folders from localStorage
 */
function getRecentFolders(): FolderShortcut[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as FolderShortcut[];

    // Validate and mark as recent
    return parsed
      .filter(isValidFolderShortcut)
      .map(folder => ({ ...folder, isRecent: true }))
      .slice(0, MAX_RECENT_FOLDERS);
  } catch (error) {
    console.error('[FolderShortcuts] Failed to load recent folders:', error);
    return [];
  }
}

/**
 * Add a folder to recent folders
 * Deduplicates by name and maintains max limit
 */
export function addRecentFolder(name: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!name || name.trim() === '') {
    return;
  }

  try {
    const recent = getRecentFolders();

    // Remove existing entry with same name (case-insensitive)
    const filtered = recent.filter(
      folder => folder.name.toLowerCase() !== name.toLowerCase()
    );

    // Add new entry at the beginning
    const newFolder: FolderShortcut = {
      id: `recent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      type: 'recent',
      timestamp: Date.now(),
      isRecent: true,
    };

    const updated = [newFolder, ...filtered].slice(0, MAX_RECENT_FOLDERS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[FolderShortcuts] Failed to add recent folder:', error);
  }
}

/**
 * Remove a folder from quick access (only works for recent folders)
 */
export function removeFolder(id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const recent = getRecentFolders();
    const filtered = recent.filter(folder => folder.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[FolderShortcuts] Failed to remove folder:', error);
  }
}

/**
 * Clear all recent folders
 */
export function clearRecent(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[FolderShortcuts] Failed to clear recent folders:', error);
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'showDirectoryPicker' in window;
}

/**
 * Validate folder shortcut structure
 */
function isValidFolderShortcut(obj: unknown): obj is FolderShortcut {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const folder = obj as Record<string, unknown>;

  return (
    typeof folder.id === 'string' &&
    typeof folder.name === 'string' &&
    typeof folder.type === 'string' &&
    typeof folder.timestamp === 'number'
  );
}
