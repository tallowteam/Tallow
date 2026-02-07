/**
 * Duplicate File Handler
 *
 * Manages duplicate file detection and resolution when receiving files
 * with the same name as previously received files.
 *
 * @module duplicate-file-handler
 */

'use client';

import { secureLog } from './secure-logger';

// ============================================================================
// TYPES
// ============================================================================

export type DuplicateAction = 'rename' | 'overwrite' | 'skip';

export interface DuplicateFileResult {
  /** Action to take for the duplicate file */
  action: DuplicateAction;
  /** New filename if action is 'rename' */
  newName?: string;
}

export interface DuplicateFileOptions {
  /** Original filename */
  fileName: string;
  /** Whether to apply the action to all subsequent duplicates */
  applyToAll?: boolean;
  /** Pre-selected action (skips dialog) */
  preselectedAction?: DuplicateAction;
}

// ============================================================================
// SESSION STORAGE
// ============================================================================

const STORAGE_KEY = 'tallow_received_files';
const SESSION_PREFERENCE_KEY = 'tallow_duplicate_preference';

/**
 * Get list of received file names from session storage
 */
function getReceivedFiles(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Set();
    }
    return new Set(JSON.parse(stored));
  } catch (error) {
    secureLog.error('Failed to load received files from session storage:', error);
    return new Set();
  }
}

/**
 * Save received file name to session storage
 */
function saveReceivedFile(fileName: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const files = getReceivedFiles();
    files.add(fileName);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...files]));
  } catch (error) {
    secureLog.error('Failed to save received file to session storage:', error);
  }
}

/**
 * Check if a file name has been received before
 */
export function isFileReceived(fileName: string): boolean {
  const files = getReceivedFiles();
  return files.has(fileName);
}

/**
 * Mark a file as received
 */
export function markFileAsReceived(fileName: string): void {
  saveReceivedFile(fileName);
}

/**
 * Clear all received files from session storage
 */
export function clearReceivedFiles(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_PREFERENCE_KEY);
  } catch (error) {
    secureLog.error('Failed to clear received files from session storage:', error);
  }
}

/**
 * Get session-wide duplicate preference
 */
function getSessionPreference(): DuplicateAction | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const pref = sessionStorage.getItem(SESSION_PREFERENCE_KEY);
    return pref as DuplicateAction | null;
  } catch (error) {
    secureLog.error('Failed to get session preference:', error);
    return null;
  }
}

/**
 * Set session-wide duplicate preference
 */
function setSessionPreference(action: DuplicateAction): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(SESSION_PREFERENCE_KEY, action);
  } catch (error) {
    secureLog.error('Failed to set session preference:', error);
  }
}

// ============================================================================
// FILE NAME UTILITIES
// ============================================================================

/**
 * Generate a new filename with a numbered suffix
 * e.g., "file.txt" -> "file (2).txt"
 */
function generateRenamedFileName(fileName: string): string {
  const files = getReceivedFiles();

  // Extract file extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  // Find the next available number
  let counter = 2;
  let newName = `${baseName} (${counter})${extension}`;

  while (files.has(newName)) {
    counter++;
    newName = `${baseName} (${counter})${extension}`;
  }

  return newName;
}

/**
 * Parse a filename to extract base name and counter
 * e.g., "file (2).txt" -> { baseName: "file", counter: 2, extension: ".txt" }
 */
function parseFileName(fileName: string): {
  baseName: string;
  counter: number;
  extension: string;
} {
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  // Match pattern like "filename (2)"
  const counterMatch = nameWithoutExt.match(/^(.*?)\s*\((\d+)\)$/);

  if (counterMatch) {
    return {
      baseName: counterMatch[1],
      counter: parseInt(counterMatch[2], 10),
      extension,
    };
  }

  return {
    baseName: nameWithoutExt,
    counter: 1,
    extension,
  };
}

// ============================================================================
// DUPLICATE HANDLING
// ============================================================================

/**
 * Handle duplicate file detection and resolution
 *
 * This function checks if a file has been received before and returns
 * the appropriate action to take. If applyToAll is true, the action
 * will be remembered for the session.
 *
 * @param options - Duplicate file options
 * @returns Promise resolving to the action and optional new name
 */
export async function handleDuplicateFile(
  options: DuplicateFileOptions
): Promise<DuplicateFileResult> {
  const { fileName, applyToAll = false, preselectedAction } = options;

  // Check if file has been received before
  if (!isFileReceived(fileName)) {
    // New file - mark as received and return
    markFileAsReceived(fileName);
    return { action: 'overwrite' }; // "overwrite" means accept/save the file
  }

  // Check if there's a session-wide preference
  const sessionPref = getSessionPreference();
  if (sessionPref) {
    const action = sessionPref;

    if (action === 'rename') {
      const newName = generateRenamedFileName(fileName);
      markFileAsReceived(newName);
      return { action, newName };
    }

    if (action === 'overwrite') {
      // Overwrite existing file
      return { action };
    }

    // Skip the file
    return { action: 'skip' };
  }

  // If preselected action is provided, use it
  if (preselectedAction) {
    if (applyToAll) {
      setSessionPreference(preselectedAction);
    }

    if (preselectedAction === 'rename') {
      const newName = generateRenamedFileName(fileName);
      markFileAsReceived(newName);
      return { action: preselectedAction, newName };
    }

    return { action: preselectedAction };
  }

  // No preference set - default to rename
  const newName = generateRenamedFileName(fileName);
  markFileAsReceived(newName);
  return { action: 'rename', newName };
}

/**
 * Get the next available filename for a duplicate
 */
export function getNextAvailableFileName(fileName: string): string {
  if (!isFileReceived(fileName)) {
    return fileName;
  }

  return generateRenamedFileName(fileName);
}

/**
 * Reset session-wide duplicate preference
 */
export function resetDuplicatePreference(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(SESSION_PREFERENCE_KEY);
  } catch (error) {
    secureLog.error('Failed to reset duplicate preference:', error);
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Handle multiple duplicate files at once
 */
export async function handleDuplicateFiles(
  fileNames: string[],
  action: DuplicateAction,
  applyToAll: boolean = true
): Promise<Map<string, DuplicateFileResult>> {
  const results = new Map<string, DuplicateFileResult>();

  if (applyToAll) {
    setSessionPreference(action);
  }

  for (const fileName of fileNames) {
    const result = await handleDuplicateFile({
      fileName,
      applyToAll,
      preselectedAction: action,
    });
    results.set(fileName, result);
  }

  return results;
}

/**
 * Export received files list (for debugging/testing)
 */
export function getReceivedFilesList(): string[] {
  const files = getReceivedFiles();
  return [...files];
}
