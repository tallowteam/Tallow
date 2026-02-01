'use client';

/**
 * Folder Transfer Integration
 * Integrates folder transfers with PQC transfer manager
 */

import { PQCTransferManager } from './pqc-transfer-manager';
import {
  FolderStructure,
  FolderFile,
  compressFolder,
  decompressFolder,
} from './folder-transfer';
import secureLog from '../utils/secure-logger';

export interface FolderTransferOptions {
  compress?: boolean;
  onFolderProgress?: (filesTransferred: number, totalFiles: number, currentFile: string) => void;
  onCompressionProgress?: (progress: number) => void;
}

export interface FolderTransferState {
  folderName: string;
  totalFiles: number;
  transferredFiles: number;
  currentFile: string;
  totalSize: number;
  transferredSize: number;
  isCompressed: boolean;
}

/**
 * Send folder through PQC transfer manager
 */
export async function sendFolder(
  transferManager: PQCTransferManager,
  folderStructure: FolderStructure,
  options: FolderTransferOptions = {}
): Promise<void> {
  const { compress = false, onFolderProgress, onCompressionProgress } = options;

  let filesToTransfer: File[];
  const isCompressed = compress;

  // Compress if requested
  if (compress) {
    secureLog.log(`[FolderTransfer] Compressing folder: ${folderStructure.name}`);

    const compressedBlob = await compressFolder(
      folderStructure,
      (progress, _file) => {
        onCompressionProgress?.(progress);
      }
    );

    // Create a single file from the compressed blob
    const zipFile = new File([compressedBlob], `${folderStructure.name}.zip`, {
      type: 'application/zip',
      lastModified: Date.now(),
    });

    filesToTransfer = [zipFile];
  } else {
    // Transfer files individually with relative paths
    filesToTransfer = folderStructure.files.map((f) => f.file);
  }

  // Track progress
  let transferredFiles = 0;

  // Set up progress callback
  const originalProgressCallback = transferManager['onProgressCallback'];
  transferManager.onProgress((progress) => {
    // Call original callback
    if (originalProgressCallback) {
      originalProgressCallback(progress);
    }

    // Calculate folder-level progress
    const currentFileIndex = Math.floor(
      (progress / 100) * filesToTransfer.length
    );

    if (currentFileIndex !== transferredFiles && currentFileIndex < filesToTransfer.length) {
      transferredFiles = currentFileIndex;
      const currentFile = isCompressed
        ? `${folderStructure.name}.zip`
        : folderStructure.files[currentFileIndex]?.relativePath || '';

      onFolderProgress?.(
        transferredFiles,
        isCompressed ? 1 : folderStructure.fileCount,
        currentFile
      );
    }
  });

  // Transfer each file
  for (let i = 0; i < filesToTransfer.length; i++) {
    const file = filesToTransfer[i];
    if (!file) {continue;}

    const folderFile = isCompressed ? null : folderStructure.files[i];
    const relativePath = folderFile?.relativePath;

    secureLog.log(
      `[FolderTransfer] Sending file ${i + 1}/${filesToTransfer.length}: ${
        relativePath || file.name
      }`
    );

    await transferManager.sendFile(file, relativePath);

    transferredFiles = i + 1;
    onFolderProgress?.(
      transferredFiles,
      filesToTransfer.length,
      relativePath || file.name
    );
  }

  secureLog.log(`[FolderTransfer] Folder transfer complete: ${folderStructure.name}`);
}

/**
 * Receive folder through PQC transfer manager
 */
export class FolderReceiver {
  private receivedFiles: Map<string, { blob: Blob; filename: string; relativePath?: string }> =
    new Map();
  private expectedFiles: number = 0;
  private isCompressed: boolean = false;
  private folderName: string = 'received-folder';
  private onProgressCallback?: (state: FolderTransferState) => void;
  private onCompleteCallback?: (folder: FolderStructure) => void;

  constructor(
    private transferManager: PQCTransferManager,
    options: {
      onProgress?: (state: FolderTransferState) => void;
      onComplete?: (folder: FolderStructure) => void;
    } = {}
  ) {
    if (options.onProgress) {
      this.onProgressCallback = options.onProgress;
    }
    if (options.onComplete) {
      this.onCompleteCallback = options.onComplete;
    }

    // Set up file reception handler
    this.transferManager.onComplete(this.handleFileReceived.bind(this));
  }

  /**
   * Start receiving folder
   */
  startReceiving(folderName: string, fileCount: number, isCompressed: boolean = false): void {
    this.folderName = folderName;
    this.expectedFiles = fileCount;
    this.isCompressed = isCompressed;
    this.receivedFiles.clear();

    secureLog.log(
      `[FolderReceiver] Started receiving folder: ${folderName} (${fileCount} files, compressed: ${isCompressed})`
    );
  }

  /**
   * Handle received file
   */
  private async handleFileReceived(
    blob: Blob,
    filename: string,
    relativePath?: string
  ): Promise<void> {
    const fileId = relativePath || filename;
    this.receivedFiles.set(fileId, {
      blob,
      filename,
      ...(relativePath ? { relativePath } : {}),
    });

    secureLog.log(
      `[FolderReceiver] Received file ${this.receivedFiles.size}/${this.expectedFiles}: ${fileId}`
    );

    // Update progress
    this.updateProgress();

    // Check if all files received
    if (this.receivedFiles.size >= this.expectedFiles) {
      await this.completeReception();
    }
  }

  /**
   * Update progress
   */
  private updateProgress(): void {
    if (!this.onProgressCallback) {return;}

    const transferredFiles = this.receivedFiles.size;
    const totalSize = Array.from(this.receivedFiles.values()).reduce(
      (sum, file) => sum + file.blob.size,
      0
    );

    const lastFile = Array.from(this.receivedFiles.values()).pop();

    this.onProgressCallback({
      folderName: this.folderName,
      totalFiles: this.expectedFiles,
      transferredFiles,
      currentFile: lastFile?.relativePath || lastFile?.filename || '',
      totalSize,
      transferredSize: totalSize,
      isCompressed: this.isCompressed,
    });
  }

  /**
   * Complete folder reception
   */
  private async completeReception(): Promise<void> {
    secureLog.log(`[FolderReceiver] All files received, reconstructing folder`);

    let folderStructure: FolderStructure;

    if (this.isCompressed) {
      // Decompress the received zip file
      const zipFile = Array.from(this.receivedFiles.values())[0];
      if (!zipFile) {
        throw new Error('No compressed file received');
      }
      folderStructure = await decompressFolder(zipFile.blob);
    } else {
      // Reconstruct folder structure from individual files
      const files: FolderFile[] = [];
      let totalSize = 0;

      for (const [_fileId, fileData] of this.receivedFiles.entries()) {
        const file = new File([fileData.blob], fileData.filename, {
          type: fileData.blob.type,
          lastModified: Date.now(),
        });

        files.push({
          name: fileData.filename,
          relativePath: fileData.relativePath || fileData.filename,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          file,
        });

        totalSize += file.size;
      }

      folderStructure = {
        name: this.folderName,
        path: this.folderName,
        files,
        totalSize,
        fileCount: files.length,
        isCompressed: false,
      };
    }

    secureLog.log(
      `[FolderReceiver] Folder reconstruction complete: ${folderStructure.fileCount} files`
    );

    this.onCompleteCallback?.(folderStructure);
  }

  /**
   * Reset receiver
   */
  reset(): void {
    this.receivedFiles.clear();
    this.expectedFiles = 0;
    this.isCompressed = false;
    this.folderName = 'received-folder';
  }

  /**
   * Get current state
   */
  getState(): {
    receivedFiles: number;
    expectedFiles: number;
    isComplete: boolean;
  } {
    return {
      receivedFiles: this.receivedFiles.size,
      expectedFiles: this.expectedFiles,
      isComplete: this.receivedFiles.size >= this.expectedFiles && this.expectedFiles > 0,
    };
  }
}

/**
 * Batch file transfer with pause/resume support
 */
export class BatchFileTransfer {
  private files: { file: File; relativePath?: string }[] = [];
  private currentIndex: number = 0;
  private isPaused: boolean = false;
  private isComplete: boolean = false;
  private onProgressCallback?: (current: number, total: number, file: string) => void;
  private onCompleteCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(
    private transferManager: PQCTransferManager,
    files: { file: File; relativePath?: string }[],
    options: {
      onProgress?: (current: number, total: number, file: string) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    this.files = files;
    if (options.onProgress) {
      this.onProgressCallback = options.onProgress;
    }
    if (options.onComplete) {
      this.onCompleteCallback = options.onComplete;
    }
    if (options.onError) {
      this.onErrorCallback = options.onError;
    }
  }

  /**
   * Start transfer
   */
  async start(): Promise<void> {
    this.isPaused = false;
    this.isComplete = false;

    for (let i = this.currentIndex; i < this.files.length; i++) {
      if (this.isPaused) {
        this.currentIndex = i;
        return;
      }

      const fileData = this.files[i];
      if (!fileData) {continue;}

      const { file, relativePath } = fileData;

      try {
        await this.transferManager.sendFile(file, relativePath);

        this.currentIndex = i + 1;
        this.onProgressCallback?.(
          this.currentIndex,
          this.files.length,
          relativePath || file.name
        );
      } catch (error) {
        this.onErrorCallback?.(error as Error);
        throw error;
      }
    }

    this.isComplete = true;
    this.onCompleteCallback?.();
  }

  /**
   * Pause transfer
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume transfer
   */
  async resume(): Promise<void> {
    if (!this.isPaused) {return;}
    await this.start();
  }

  /**
   * Get progress
   */
  getProgress(): {
    current: number;
    total: number;
    percentage: number;
    isPaused: boolean;
    isComplete: boolean;
  } {
    return {
      current: this.currentIndex,
      total: this.files.length,
      percentage: this.files.length > 0 ? (this.currentIndex / this.files.length) * 100 : 0,
      isPaused: this.isPaused,
      isComplete: this.isComplete,
    };
  }
}
