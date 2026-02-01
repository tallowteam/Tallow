'use client';

/**
 * Download Location Manager
 *
 * Uses the File System Access API to let users choose a download directory.
 * Falls back to browser default download if the API is unavailable.
 * Stores the directory handle in IndexedDB for persistence across sessions.
 */

// File System Access API type declarations (not yet in standard TypeScript lib)
declare global {
    interface Window {
        showDirectoryPicker(options?: {
            mode?: 'read' | 'readwrite';
            startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
        }): Promise<FileSystemDirectoryHandle>;
    }

    interface FileSystemDirectoryHandle {
        queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
        requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    }
}

const DB_NAME = 'tallow_fs';
const DB_VERSION = 1;
const STORE_NAME = 'directory_handles';
const HANDLE_KEY = 'download_directory';

// ============================================================================
// IndexedDB Helpers
// ============================================================================

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

async function removeStoredHandle(): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        // Ignore errors on removal
    }
}

// ============================================================================
// File System Access API
// ============================================================================

/**
 * Check if the File System Access API is available
 */
export function isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Prompt user to choose a download directory
 * Returns the directory name if successful, null if cancelled
 */
export async function chooseDownloadDirectory(): Promise<string | null> {
    if (!isFileSystemAccessSupported()) {
        return null;
    }

    try {
        const handle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads',
        });
        await storeHandle(handle);
        return handle.name;
    } catch (err) {
        // User cancelled the picker
        if (err instanceof DOMException && err.name === 'AbortError') {
            return null;
        }
        throw err;
    }
}

/**
 * Get the name of the currently configured download directory
 * Returns null if no directory is configured or permission was revoked
 */
export async function getDownloadDirectoryName(): Promise<string | null> {
    if (!isFileSystemAccessSupported()) {
        return null;
    }

    const handle = await getStoredHandle();
    if (!handle) {return null;}

    // Verify we still have permission
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
        return handle.name;
    }

    return handle.name;
}

/**
 * Reset to default Downloads behavior (browser-managed)
 */
export async function resetDownloadDirectory(): Promise<void> {
    await removeStoredHandle();
}

/**
 * Save a file to the configured directory
 * Supports relative paths for folder transfers (creates subdirectories as needed)
 * Returns true if saved to custom directory, false if fallback was used
 */
export async function saveFileToDirectory(blob: Blob, filename: string, relativePath?: string): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    const handle = await getStoredHandle();
    if (!handle) {return false;}

    try {
        // Request permission if needed
        let permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            permission = await handle.requestPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                return false;
            }
        }

        // Navigate to subdirectory if relative path provided
        let targetDir = handle;
        if (relativePath) {
            const parts = relativePath.split('/');
            // Remove the filename from path parts (last element)
            const dirParts = parts.slice(0, -1);
            for (const part of dirParts) {
                if (part && part !== '.' && part !== '..') {
                    targetDir = await targetDir.getDirectoryHandle(part, { create: true });
                }
            }
        }

        // Create file in the target directory (avoid overwriting by appending number)
        const safeName = await getUniqueFilename(targetDir, filename);
        const fileHandle = await targetDir.getFileHandle(safeName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
    } catch {
        // Permission denied or directory no longer accessible
        return false;
    }
}

/**
 * Generate a unique filename to avoid overwrites
 */
async function getUniqueFilename(
    dirHandle: FileSystemDirectoryHandle,
    filename: string
): Promise<string> {
    const lastDot = filename.lastIndexOf('.');
    const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;
    const ext = lastDot > 0 ? filename.slice(lastDot) : '';

    let candidate = filename;
    let counter = 1;

    while (true) {
        try {
            await dirHandle.getFileHandle(candidate);
            // File exists, try next number
            candidate = `${name} (${counter})${ext}`;
            counter++;
        } catch {
            // File doesn't exist, use this name
            return candidate;
        }
    }
}
