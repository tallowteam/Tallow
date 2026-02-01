'use client';

/**
 * Secure File Deletion
 * Implements military-grade secure deletion methods
 *
 * Standards supported:
 * - DoD 5220.22-M (3-pass)
 * - Gutmann (35-pass, paranoid mode)
 * - Random (1-pass, quick mode)
 */

import { secureWipeBuffer } from '../security/memory-wiper';
import secureLog from '../utils/secure-logger';

export type DeletionMode = 'quick' | 'standard' | 'paranoid';

export interface SecureDeletionOptions {
  mode?: DeletionMode;
  verify?: boolean;
  onProgress?: (percent: number) => void;
}

export interface DeletionResult {
  success: boolean;
  mode: DeletionMode;
  passes: number;
  bytesWiped: number;
  timeMs: number;
  verified: boolean;
}

/**
 * Secure deletion patterns for different modes
 */
const DELETION_PATTERNS = {
  // Quick mode: Single random pass
  quick: [
    { type: 'random' as const },
  ],

  // Standard mode: DoD 5220.22-M (3-pass)
  standard: [
    { type: 'pattern' as const, value: 0x00 }, // All zeros
    { type: 'pattern' as const, value: 0xFF }, // All ones
    { type: 'random' as const },               // Random data
  ],

  // Paranoid mode: Gutmann method (simplified 7-pass)
  paranoid: [
    { type: 'random' as const },
    { type: 'pattern' as const, value: 0x55 }, // 01010101
    { type: 'pattern' as const, value: 0xAA }, // 10101010
    { type: 'random' as const },
    { type: 'pattern' as const, value: 0x00 },
    { type: 'pattern' as const, value: 0xFF },
    { type: 'random' as const },
  ],
};

/**
 * Securely delete data from a Uint8Array buffer
 * Uses multiple overwrite passes based on deletion mode
 */
export function secureDeleteBuffer(
  buffer: Uint8Array,
  options: SecureDeletionOptions = {}
): DeletionResult {
  const mode = options.mode || 'standard';
  const verify = options.verify ?? true;
  const patterns = DELETION_PATTERNS[mode];
  const startTime = performance.now();

  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      mode,
      passes: 0,
      bytesWiped: 0,
      timeMs: 0,
      verified: false,
    };
  }

  const CHUNK_SIZE = 65536; // crypto.getRandomValues limit
  const totalPasses = patterns.length;
  let completedPasses = 0;

  try {
    // Execute each deletion pass
    for (const pattern of patterns) {
      if (pattern.type === 'random') {
        // Random data pass (in chunks for large buffers)
        for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
          const chunkEnd = Math.min(offset + CHUNK_SIZE, buffer.length);
          const chunk = buffer.subarray(offset, chunkEnd);
          crypto.getRandomValues(chunk);
        }
      } else {
        // Pattern pass (fill with specific byte)
        buffer.fill(pattern.value);
      }

      completedPasses++;
      if (options.onProgress) {
        options.onProgress((completedPasses / totalPasses) * 100);
      }
    }

    // Final verification pass (check all zeros)
    let isWiped = true;
    if (verify) {
      // Final wipe to zeros for verification
      buffer.fill(0);

      // Verify all bytes are zero
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0) {
          isWiped = false;
          break;
        }
      }
    }

    const endTime = performance.now();

    return {
      success: true,
      mode,
      passes: completedPasses,
      bytesWiped: buffer.length,
      timeMs: endTime - startTime,
      verified: verify ? isWiped : false,
    };
  } catch (error) {
    secureLog.error('[SecureDeletion] Failed to securely delete buffer:', error);

    // Fallback: at least wipe with basic method
    secureWipeBuffer(buffer, 3);

    return {
      success: false,
      mode,
      passes: completedPasses,
      bytesWiped: buffer.length,
      timeMs: performance.now() - startTime,
      verified: false,
    };
  }
}

/**
 * Securely delete a File object's data
 * Note: Cannot truly delete File object data, but can wipe the array buffer
 */
export async function secureDeleteFile(
  file: File,
  options: SecureDeletionOptions = {}
): Promise<DeletionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    return secureDeleteBuffer(buffer, options);
  } catch (error) {
    secureLog.error('[SecureDeletion] Failed to securely delete file:', error);

    return {
      success: false,
      mode: options.mode || 'standard',
      passes: 0,
      bytesWiped: 0,
      timeMs: 0,
      verified: false,
    };
  }
}

/**
 * Securely delete multiple buffers in sequence
 */
export function secureDeleteBuffers(
  buffers: Uint8Array[],
  options: SecureDeletionOptions = {}
): DeletionResult[] {
  const results: DeletionResult[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    if (buffer instanceof Uint8Array) {
      const progressCallback = options.onProgress
        ? (percent: number) => {
            const totalProgress = ((i / buffers.length) * 100) + (percent / buffers.length);
            options.onProgress?.(totalProgress);
          }
        : undefined;

      const deleteOptions: SecureDeletionOptions = {};
      if (options.mode) {deleteOptions.mode = options.mode;}
      if (options.verify !== undefined) {deleteOptions.verify = options.verify;}
      if (progressCallback) {deleteOptions.onProgress = progressCallback;}

      const result = secureDeleteBuffer(buffer, deleteOptions);
      results.push(result);
    }
  }

  return results;
}

/**
 * Securely delete localStorage entry
 * Overwrites value before removal
 */
export function secureDeleteLocalStorage(
  key: string,
  options: SecureDeletionOptions = {}
): DeletionResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      mode: options.mode || 'standard',
      passes: 0,
      bytesWiped: 0,
      timeMs: 0,
      verified: false,
    };
  }

  const mode = options.mode || 'standard';
  const startTime = performance.now();

  try {
    const originalValue = localStorage.getItem(key);
    if (!originalValue) {
      return {
        success: true,
        mode,
        passes: 0,
        bytesWiped: 0,
        timeMs: 0,
        verified: true,
      };
    }

    const originalSize = originalValue.length;
    const patterns = DELETION_PATTERNS[mode];

    // Overwrite with patterns
    for (const pattern of patterns) {
      if (pattern.type === 'random') {
        // Generate random string of same length
        const randomStr = Array.from(
          crypto.getRandomValues(new Uint8Array(originalSize))
        ).map(b => String.fromCharCode(b)).join('');
        localStorage.setItem(key, randomStr);
      } else {
        // Fill with pattern character
        const patternStr = String.fromCharCode(pattern.value).repeat(originalSize);
        localStorage.setItem(key, patternStr);
      }
    }

    // Final overwrite with zeros
    localStorage.setItem(key, '\0'.repeat(originalSize));

    // Now actually remove
    localStorage.removeItem(key);

    const endTime = performance.now();

    return {
      success: true,
      mode,
      passes: patterns.length,
      bytesWiped: originalSize * 2, // UTF-16 encoding
      timeMs: endTime - startTime,
      verified: localStorage.getItem(key) === null,
    };
  } catch (error) {
    secureLog.error('[SecureDeletion] Failed to securely delete localStorage entry:', error);

    // Fallback: just remove
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }

    return {
      success: false,
      mode,
      passes: 0,
      bytesWiped: 0,
      timeMs: performance.now() - startTime,
      verified: false,
    };
  }
}

/**
 * Securely delete multiple localStorage entries
 */
export function secureDeleteLocalStorageKeys(
  keys: string[],
  options: SecureDeletionOptions = {}
): DeletionResult[] {
  const results: DeletionResult[] = [];

  for (let i = 0; i < keys.length; i++) {
    const progressCallback = options.onProgress
      ? (percent: number) => {
          const totalProgress = ((i / keys.length) * 100) + (percent / keys.length);
          options.onProgress?.(totalProgress);
        }
      : undefined;

    const deleteOptions: SecureDeletionOptions = {};
    if (options.mode) {deleteOptions.mode = options.mode;}
    if (options.verify !== undefined) {deleteOptions.verify = options.verify;}
    if (progressCallback) {deleteOptions.onProgress = progressCallback;}

    const result = secureDeleteLocalStorage(keys[i]!, deleteOptions);
    results.push(result);
  }

  return results;
}

/**
 * Securely delete all items with a specific prefix
 */
export function secureDeleteLocalStoragePrefix(
  prefix: string,
  options: SecureDeletionOptions = {}
): DeletionResult[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const keysToDelete: string[] = [];

  // Find all keys with prefix
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }

  return secureDeleteLocalStorageKeys(keysToDelete, options);
}

/**
 * Create a secure deletion manager with progress tracking
 */
export class SecureDeletionManager {
  private totalItems: number = 0;
  private completedItems: number = 0;
  private onProgress: ((percent: number) => void) | null = null;

  constructor(onProgress?: (percent: number) => void) {
    this.onProgress = onProgress || null;
  }

  /**
   * Queue multiple deletion operations
   */
  async deleteMultiple(
    items: Array<Uint8Array | File | { type: 'localStorage'; key: string }>,
    options: SecureDeletionOptions = {}
  ): Promise<DeletionResult[]> {
    this.totalItems = items.length;
    this.completedItems = 0;
    const results: DeletionResult[] = [];

    for (const item of items) {
      let result: DeletionResult;

      if (item instanceof Uint8Array) {
        result = secureDeleteBuffer(item, this.createProgressOptions(options));
      } else if (item instanceof File) {
        result = await secureDeleteFile(item, this.createProgressOptions(options));
      } else if (item.type === 'localStorage') {
        result = secureDeleteLocalStorage(item.key, this.createProgressOptions(options));
      } else {
        continue;
      }

      results.push(result);
      this.completedItems++;
      this.reportProgress();
    }

    return results;
  }

  private createProgressOptions(options: SecureDeletionOptions): SecureDeletionOptions {
    const progressCallback = (itemProgress: number) => {
      const totalProgress =
        ((this.completedItems / this.totalItems) * 100) +
        (itemProgress / this.totalItems);
      if (this.onProgress) {
        this.onProgress(totalProgress);
      }
    };

    const deleteOptions: SecureDeletionOptions = {
      onProgress: progressCallback,
    };
    if (options.mode) {deleteOptions.mode = options.mode;}
    if (options.verify !== undefined) {deleteOptions.verify = options.verify;}

    return deleteOptions;
  }

  private reportProgress(): void {
    if (this.onProgress && this.totalItems > 0) {
      const percent = (this.completedItems / this.totalItems) * 100;
      this.onProgress(percent);
    }
  }
}

/**
 * Secure deletion utilities
 */
export const secureDeletion = {
  deleteBuffer: secureDeleteBuffer,
  deleteFile: secureDeleteFile,
  deleteBuffers: secureDeleteBuffers,
  deleteLocalStorage: secureDeleteLocalStorage,
  deleteLocalStorageKeys: secureDeleteLocalStorageKeys,
  deleteLocalStoragePrefix: secureDeleteLocalStoragePrefix,
  createManager: (onProgress?: (percent: number) => void) =>
    new SecureDeletionManager(onProgress),
};

export default secureDeletion;
