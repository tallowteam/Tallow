'use client';

/**
 * Lazy-Loaded File Encryption Service
 * Code-splits file encryption module with PQC dependencies
 */

import type { EncryptedFile } from './file-encryption-pqc';
import { secureLog } from '../utils/secure-logger';

let fileEncryptionPromise: Promise<typeof import('./file-encryption-pqc')> | null = null;
let fileEncryptionModule: typeof import('./file-encryption-pqc') | null = null;

/**
 * Load file encryption module (lazy-loaded)
 */
async function loadFileEncryption(): Promise<typeof import('./file-encryption-pqc')> {
  if (fileEncryptionModule) {return fileEncryptionModule;}

  if (!fileEncryptionPromise) {
    fileEncryptionPromise = import(
      /* webpackChunkName: "file-encryption-pqc" */
      /* webpackPreload: true */
      './file-encryption-pqc'
    );
  }

  fileEncryptionModule = await fileEncryptionPromise;
  return fileEncryptionModule;
}

/**
 * Lazy-loaded File Encryption Service
 */
export class LazyFileEncryptionService {
  private static instance: LazyFileEncryptionService;
  private module: typeof import('./file-encryption-pqc') | null = null;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): LazyFileEncryptionService {
    if (!LazyFileEncryptionService.instance) {
      LazyFileEncryptionService.instance = new LazyFileEncryptionService();
    }
    return LazyFileEncryptionService.instance;
  }

  /**
   * Ensure module is loaded
   */
  private async ensureLoaded(): Promise<typeof import('./file-encryption-pqc')> {
    if (this.module) {return this.module;}

    if (!this.loadingPromise) {
      this.loadingPromise = (async () => {
        this.module = await loadFileEncryption();
      })();
    }

    await this.loadingPromise;
    return this.module!;
  }

  /**
   * Preload module in the background
   */
  async preload(): Promise<void> {
    await this.ensureLoaded();
  }

  /**
   * Check if module is already loaded
   */
  isLoaded(): boolean {
    return this.module !== null;
  }

  // ==========================================================================
  // Lazy-loaded Encryption Methods
  // ==========================================================================

  async encryptFile(
    file: File,
    encryptionKey: Uint8Array
  ): Promise<EncryptedFile> {
    const module = await this.ensureLoaded();
    return module.encryptFile(file, encryptionKey);
  }

  async decryptFile(
    encryptedFile: EncryptedFile,
    decryptionKey: Uint8Array
  ): Promise<Blob> {
    const module = await this.ensureLoaded();
    return module.decryptFile(encryptedFile, decryptionKey);
  }

  async decryptFileName(
    encryptedFile: EncryptedFile,
    decryptionKey: Uint8Array
  ): Promise<string> {
    const module = await this.ensureLoaded();
    return module.decryptFileName(encryptedFile, decryptionKey);
  }

  async encryptWithPassword(file: File, password: string): Promise<EncryptedFile> {
    const module = await this.ensureLoaded();
    return module.encryptFileWithPassword(file, password);
  }

  async decryptWithPassword(encryptedFile: EncryptedFile, password: string): Promise<Blob> {
    const module = await this.ensureLoaded();
    return module.decryptFileWithPassword(encryptedFile, password);
  }
}

/**
 * Singleton instance (lazy-loaded)
 */
const lazyFileEncryptionService = LazyFileEncryptionService.getInstance();

/**
 * Export for use in transfer manager (matches fileEncryption API)
 */
export const lazyFileEncryption = {
  encrypt: async (file: File, key: Uint8Array) =>
    lazyFileEncryptionService.encryptFile(file, key),
  decrypt: async (encryptedFile: EncryptedFile, key: Uint8Array) =>
    lazyFileEncryptionService.decryptFile(encryptedFile, key),
  encryptWithPassword: async (file: File, password: string) =>
    lazyFileEncryptionService.encryptWithPassword(file, password),
  decryptWithPassword: async (encryptedFile: EncryptedFile, password: string) =>
    lazyFileEncryptionService.decryptWithPassword(encryptedFile, password),
};

/**
 * Preload helper
 */
export function preloadFileEncryption(): void {
  lazyFileEncryptionService.preload().catch(err => {
    secureLog.error('Failed to preload file encryption:', err);
  });
}

// Re-export types for convenience
export type {
  EncryptedFile,
  EncryptedChunk,
  EncryptedFileMetadata,
} from './file-encryption-pqc';
