/**
 * Delta Sync Integration Example
 *
 * Demonstrates how to integrate delta synchronization with the existing
 * PQC Transfer Manager and WebRTC data channels.
 *
 * This is an example implementation showing the integration pattern.
 * Adapt to your specific needs.
 */

import { PQCTransferManager } from './pqc-transfer-manager';
import { DeltaSyncManager } from './delta-sync-manager';
import type { FileSignatures, FilePatch } from './delta-sync';

// ============================================================================
// MESSAGE PROTOCOL
// ============================================================================

interface DeltaSyncMessage {
  type: 'delta-check' | 'delta-signatures' | 'delta-patch' | 'delta-complete' | 'delta-fallback';
  fileId: string;
  fileName: string;
  fileSize: number;
  payload: any;
}

// ============================================================================
// ENHANCED TRANSFER MANAGER
// ============================================================================

export class DeltaEnabledTransferManager extends PQCTransferManager {
  private deltaManager: DeltaSyncManager;
  private pendingDeltaRequests: Map<string, (sigs: FileSignatures) => void> = new Map();

  constructor() {
    super();
    this.deltaManager = new DeltaSyncManager({
      maxCacheSize: 100,
      cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
      autoCleanup: true,
    });
  }

  /**
   * Send file with optional delta sync
   * Falls back to full transfer if delta sync not beneficial
   */
  async sendFileWithDelta(
    file: File,
    fileId: string,
    relativePath?: string
  ): Promise<void> {
    try {
      // Step 1: Request peer signatures to check if they have the file
      const peerSignatures = await this.requestPeerSignatures(fileId, file.name, file.size);

      if (!peerSignatures) {
        // Peer doesn't have file, send full file
        console.log('[Delta] Peer does not have file, sending full file');
        return await this.sendFile(file, relativePath);
      }

      // Step 2: Perform delta sync
      console.log('[Delta] Computing delta...');
      const result = await this.deltaManager.syncFile(fileId, file, peerSignatures);

      if (!result.success) {
        console.error('[Delta] Delta sync failed:', result.error);
        return await this.sendFile(file, relativePath);
      }

      // Step 3: Check if delta sync is worth it
      const MIN_SAVINGS_PERCENT = 25;
      if (result.savings.savingsPercent < MIN_SAVINGS_PERCENT) {
        console.log(
          `[Delta] Savings too low (${result.savings.savingsPercent.toFixed(1)}%), sending full file`
        );
        return await this.sendFile(file, relativePath);
      }

      // Step 4: Send patch
      console.log(
        `[Delta] Sending patch (${result.savings.savingsPercent.toFixed(1)}% savings, ${result.savings.efficiency})`
      );

      if (result.patch) {
        await this.sendDeltaPatch(fileId, file.name, file.size, result.patch);
      }

      console.log('[Delta] Delta sync complete');
    } catch (error) {
      console.error('[Delta] Error during delta sync:', error);
      // Fallback to full file transfer
      return await this.sendFile(file, relativePath);
    }
  }

  /**
   * Request signatures from peer
   * Returns null if peer doesn't have the file
   */
  private async requestPeerSignatures(
    fileId: string,
    fileName: string,
    fileSize: number
  ): Promise<FileSignatures | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingDeltaRequests.delete(fileId);
        resolve(null);
      }, 5000); // 5 second timeout

      this.pendingDeltaRequests.set(fileId, (signatures) => {
        clearTimeout(timeout);
        this.pendingDeltaRequests.delete(fileId);
        resolve(signatures);
      });

      // Send delta check message
      const message: DeltaSyncMessage = {
        type: 'delta-check',
        fileId,
        fileName,
        fileSize,
        payload: null,
      };

      this.sendDeltaMessage(message);
    });
  }

  /**
   * Send delta patch to peer
   */
  private async sendDeltaPatch(
    fileId: string,
    fileName: string,
    fileSize: number,
    patch: FilePatch
  ): Promise<void> {
    const { metadata, blocks } = this.deltaManager.exportPatch(patch);

    // Send metadata first
    const message: DeltaSyncMessage = {
      type: 'delta-patch',
      fileId,
      fileName,
      fileSize,
      payload: {
        metadata,
        blockCount: blocks.length,
      },
    };

    this.sendDeltaMessage(message);

    // Send blocks (could be chunked for large patches)
    for (let i = 0; i < blocks.length; i++) {
      // In a real implementation, you'd send these through the data channel
      // This is a simplified example
      await this.sendDeltaBlock(fileId, i, blocks[i]);
    }

    // Send completion message
    const completeMessage: DeltaSyncMessage = {
      type: 'delta-complete',
      fileId,
      fileName,
      fileSize,
      payload: null,
    };

    this.sendDeltaMessage(completeMessage);
  }

  /**
   * Handle incoming delta sync messages
   */
  async handleDeltaMessage(message: DeltaSyncMessage): Promise<void> {
    switch (message.type) {
      case 'delta-check':
        await this.handleDeltaCheck(message);
        break;

      case 'delta-signatures':
        await this.handleDeltaSignatures(message);
        break;

      case 'delta-patch':
        await this.handleDeltaPatch(message);
        break;

      case 'delta-complete':
        await this.handleDeltaComplete(message);
        break;

      case 'delta-fallback':
        await this.handleDeltaFallback(message);
        break;
    }
  }

  /**
   * Handle delta check request from peer
   */
  private async handleDeltaCheck(message: DeltaSyncMessage): Promise<void> {
    const { fileId, fileName, fileSize } = message;

    // Check if we have this file
    const hasFile = await this.checkLocalFile(fileId, fileName);

    if (!hasFile) {
      // Don't have file, request full transfer
      const fallbackMessage: DeltaSyncMessage = {
        type: 'delta-fallback',
        fileId,
        fileName,
        fileSize,
        payload: null,
      };
      this.sendDeltaMessage(fallbackMessage);
      return;
    }

    // Get local file
    const localFile = await this.getLocalFile(fileId, fileName);
    if (!localFile) {
      const fallbackMessage: DeltaSyncMessage = {
        type: 'delta-fallback',
        fileId,
        fileName,
        fileSize,
        payload: null,
      };
      this.sendDeltaMessage(fallbackMessage);
      return;
    }

    // Compute signatures
    console.log('[Delta] Computing signatures for local file');
    const signatures = await this.deltaManager.initDeltaSync(fileId, localFile);
    const signaturesJson = this.deltaManager.exportSignatures(fileId);

    // Send signatures to peer
    const sigMessage: DeltaSyncMessage = {
      type: 'delta-signatures',
      fileId,
      fileName,
      fileSize,
      payload: signaturesJson,
    };

    this.sendDeltaMessage(sigMessage);
  }

  /**
   * Handle received signatures from peer
   */
  private async handleDeltaSignatures(message: DeltaSyncMessage): Promise<void> {
    const { fileId, payload } = message;

    const callback = this.pendingDeltaRequests.get(fileId);
    if (callback) {
      const signatures = this.deltaManager.importSignatures(payload);
      callback(signatures);
    }
  }

  /**
   * Handle incoming patch
   */
  private async handleDeltaPatch(message: DeltaSyncMessage): Promise<void> {
    const { fileId, fileName, payload } = message;
    const { metadata, blockCount } = payload;

    console.log(`[Delta] Receiving patch with ${blockCount} blocks`);

    // Store metadata for when blocks arrive
    // In a real implementation, you'd collect blocks and apply when complete
    // This is simplified
  }

  /**
   * Handle delta completion
   */
  private async handleDeltaComplete(message: DeltaSyncMessage): Promise<void> {
    const { fileId, fileName } = message;

    console.log(`[Delta] Patch complete for ${fileName}`);

    // In a real implementation, you'd:
    // 1. Collect all received blocks
    // 2. Import the patch
    // 3. Apply to local file
    // 4. Notify user
  }

  /**
   * Handle fallback to full transfer
   */
  private async handleDeltaFallback(message: DeltaSyncMessage): Promise<void> {
    console.log('[Delta] Peer requested full file transfer');
    // Proceed with normal file transfer
  }

  // ========================================================================
  // HELPER METHODS (IMPLEMENT BASED ON YOUR STORAGE)
  // ========================================================================

  /**
   * Check if local file exists
   * Implement based on your storage system
   */
  private async checkLocalFile(fileId: string, fileName: string): Promise<boolean> {
    // Example implementation - replace with your actual logic
    // Could check IndexedDB, localStorage, or in-memory cache
    return false;
  }

  /**
   * Get local file
   * Implement based on your storage system
   */
  private async getLocalFile(fileId: string, fileName: string): Promise<File | null> {
    // Example implementation - replace with your actual logic
    return null;
  }

  /**
   * Send delta message through data channel
   */
  private sendDeltaMessage(message: DeltaSyncMessage): void {
    // Use the parent class's message sending mechanism
    // This is a simplified example
    const json = JSON.stringify(message);
    // this.sendMessage({ type: 'delta-sync', payload: json });
    console.log('[Delta] Sending message:', message.type);
  }

  /**
   * Send delta block through data channel
   */
  private async sendDeltaBlock(fileId: string, index: number, block: ArrayBuffer): Promise<void> {
    // Send block data
    // In a real implementation, you'd send this through the RTCDataChannel
    console.log(`[Delta] Sending block ${index} (${block.byteLength} bytes)`);
  }

  /**
   * Cleanup on destroy
   */
  override destroy(): void {
    this.deltaManager.destroy();
    super.destroy();
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export async function exampleUsage() {
  const manager = new DeltaEnabledTransferManager();

  // Establish connection...
  // await manager.establishConnection();

  // Send file with delta sync
  const file = new File(['Updated content'], 'document.txt');
  const fileId = 'unique-file-id';

  await manager.sendFileWithDelta(file, fileId);

  // Cleanup
  manager.destroy();
}

// ============================================================================
// DECISION HELPER
// ============================================================================

/**
 * Helper function to decide whether to use delta sync
 */
export function shouldUseDeltaSync(
  fileSize: number,
  fileType: string,
  hasRemoteVersion: boolean
): boolean {
  // Don't use delta sync if no remote version
  if (!hasRemoteVersion) {
    return false;
  }

  // Don't use for very small files (overhead not worth it)
  if (fileSize < 10 * 1024) {
    // < 10KB
    return false;
  }

  // Don't use for compressed files (changes affect whole file)
  const compressedExtensions = ['.zip', '.gz', '.7z', '.rar', '.tar'];
  if (compressedExtensions.some(ext => fileType.endsWith(ext))) {
    return false;
  }

  // Don't use for encrypted files (encryption changes all bytes)
  const encryptedExtensions = ['.enc', '.gpg', '.aes'];
  if (encryptedExtensions.some(ext => fileType.endsWith(ext))) {
    return false;
  }

  // Good candidates for delta sync
  const goodCandidates = [
    '.txt', '.md', '.log', '.csv', '.json', '.xml', '.html',
    '.js', '.ts', '.py', '.java', '.go', '.rs', '.c', '.cpp',
    '.sql', '.yaml', '.yml', '.toml', '.ini', '.conf',
  ];

  if (goodCandidates.some(ext => fileType.endsWith(ext))) {
    return true;
  }

  // Default: try delta sync for larger files
  return fileSize > 100 * 1024; // > 100KB
}
