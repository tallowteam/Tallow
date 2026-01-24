'use client';

/**
 * Post-Quantum Transfer Manager
 * Handles secure file transfers with hybrid PQC key exchange
 */

import {
  pqCrypto,
  HybridKeyPair,
  HybridCiphertext,
  HybridPublicKey,
  SessionKeys,
} from '../crypto/pqc-crypto';
import { fileEncryption, EncryptedFile, EncryptedChunk } from '../crypto/file-encryption-pqc';
import secureLog from '../utils/secure-logger';

export type TransferMode = 'send' | 'receive';
export type TransferStatus = 'pending' | 'negotiating' | 'transferring' | 'completed' | 'failed';

export interface PQCTransferSession {
  sessionId: string;
  mode: TransferMode;
  status: TransferStatus;
  ownKeys: HybridKeyPair;
  peerPublicKey?: HybridPublicKey;
  sharedSecret?: Uint8Array;
  sessionKeys?: SessionKeys;
}

export type TransferMessage =
  | { type: 'public-key'; payload: { key: number[] } }
  | { type: 'key-exchange'; payload: { ciphertext: number[] } }
  | { type: 'file-metadata'; payload: FileMetadataPayload }
  | { type: 'chunk'; payload: ChunkPayload }
  | { type: 'ack'; payload: { index: number } }
  | { type: 'error'; payload: { error: string } }
  | { type: 'complete'; payload: { success: boolean } };

interface FileMetadataPayload {
  originalName: string;
  originalSize: number;
  mimeCategory: string;
  totalChunks: number;
  fileHash: number[];
  encryptedName?: string;
  nameNonce?: number[];
  encryptedPath?: string;
  pathNonce?: number[];
}

interface ChunkPayload {
  index: number;
  data: number[];
  nonce: number[];
  hash: number[];
}

const MAX_CHUNK_INDEX = 100000; // Max chunks for a 4GB file at 64KB/chunk
const ACK_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

/**
 * Validate transfer message structure
 */
function isValidTransferMessage(data: unknown): data is TransferMessage {
  if (!data || typeof data !== 'object') return false;
  const msg = data as Record<string, unknown>;
  if (typeof msg.type !== 'string') return false;
  if (!msg.payload || typeof msg.payload !== 'object') return false;

  switch (msg.type) {
    case 'public-key': {
      const p = msg.payload as Record<string, unknown>;
      return Array.isArray(p.key);
    }
    case 'key-exchange': {
      const p = msg.payload as Record<string, unknown>;
      return Array.isArray(p.ciphertext);
    }
    case 'file-metadata': {
      const p = msg.payload as Record<string, unknown>;
      return typeof p.originalSize === 'number' &&
        typeof p.mimeCategory === 'string' &&
        typeof p.totalChunks === 'number' &&
        Array.isArray(p.fileHash);
    }
    case 'chunk': {
      const p = msg.payload as Record<string, unknown>;
      return typeof p.index === 'number' &&
        Array.isArray(p.data) &&
        Array.isArray(p.nonce) &&
        Array.isArray(p.hash);
    }
    case 'ack': {
      const p = msg.payload as Record<string, unknown>;
      return typeof p.index === 'number';
    }
    case 'error': {
      const p = msg.payload as Record<string, unknown>;
      return typeof p.error === 'string';
    }
    case 'complete': {
      const p = msg.payload as Record<string, unknown>;
      return typeof p.success === 'boolean';
    }
    default:
      return false;
  }
}

/**
 * PQC Transfer Manager
 */
export class PQCTransferManager {
  private session: PQCTransferSession | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onProgressCallback?: (progress: number) => void;
  private onCompleteCallback?: (blob: Blob, filename: string, relativePath?: string) => void;
  private onErrorCallback?: (error: Error) => void;
  private onSessionReadyCallback?: () => void;
  private onFileIncomingCallback?: (metadata: { size: number; mimeCategory: string; totalChunks: number }) => void;
  private onVerificationReadyCallback?: (sharedSecret: Uint8Array) => void;
  private keyExchangeTimeout: ReturnType<typeof setTimeout> | null = null;
  private bandwidthLimit: number = 0; // bytes per second, 0 = unlimited
  private lastChunkTime: number = 0;

  // Receiving state
  private receivedChunks: Map<number, EncryptedChunk> = new Map();
  private fileMetadata: FileMetadataPayload | null = null;
  private pendingAcks: Map<number, () => void> = new Map();

  /**
   * Initialize session
   */
  async initializeSession(mode: TransferMode): Promise<PQCTransferSession> {
    // Generate keypair
    const ownKeys = await pqCrypto.generateHybridKeypair();

    this.session = {
      sessionId: this.generateSessionId(),
      mode,
      status: 'pending',
      ownKeys,
    };

    return this.session;
  }

  /**
   * Set data channel for communication (without taking over onmessage)
   */
  setDataChannel(dataChannel: RTCDataChannel): void {
    this.dataChannel = dataChannel;
  }

  /**
   * Start key exchange by sending our public key to the peer
   */
  startKeyExchange(): void {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open');
    }

    const publicKey = this.getPublicKey();
    this.sendMessage({
      type: 'public-key',
      payload: { key: Array.from(publicKey) },
    });
    secureLog.log('[PQC] Sent public key to peer');

    // Start key exchange timeout
    this.keyExchangeTimeout = setTimeout(() => {
      if (this.session?.status === 'pending' || this.session?.status === 'negotiating') {
        this.session.status = 'failed';
        this.onErrorCallback?.(new Error('Key exchange timeout - peer did not respond'));
      }
    }, 30000);
  }

  /**
   * Handle an incoming message from the data channel.
   * Returns true if the message was a PQC transfer message and was handled.
   * Returns false if the message is not a PQC protocol message (e.g., clipboard).
   */
  async handleIncomingMessage(data: string): Promise<boolean> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return false;
    }

    if (!isValidTransferMessage(parsed)) {
      return false;
    }

    const message = parsed;

    switch (message.type) {
      case 'public-key':
        await this.handlePeerPublicKey(new Uint8Array(message.payload.key));
        break;
      case 'key-exchange':
        await this.handleKeyExchangeCiphertext(new Uint8Array(message.payload.ciphertext));
        this.onSessionReadyCallback?.();
        break;
      case 'file-metadata':
        this.handleFileMetadata(message.payload);
        this.onFileIncomingCallback?.({
          size: message.payload.originalSize,
          mimeCategory: message.payload.mimeCategory,
          totalChunks: message.payload.totalChunks,
        });
        break;
      case 'chunk':
        await this.handleChunk(message.payload);
        break;
      case 'ack':
        this.handleAck(message.payload.index);
        break;
      case 'complete':
        secureLog.log('[PQC] Transfer complete signal received');
        break;
      case 'error':
        this.onErrorCallback?.(new Error(message.payload.error));
        break;
    }

    return true;
  }

  /**
   * Handle received peer public key - perform key exchange
   */
  private async handlePeerPublicKey(serializedKey: Uint8Array): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    const peerPublicKey = pqCrypto.deserializePublicKey(serializedKey);
    this.session.peerPublicKey = peerPublicKey;
    this.session.status = 'negotiating';
    secureLog.log('[PQC] Received peer public key');

    // The first device to receive a public key performs encapsulation
    // and sends back the ciphertext
    const { ciphertext, sharedSecret } = await pqCrypto.encapsulate(peerPublicKey);
    this.session.sharedSecret = sharedSecret;

    const serializedCiphertext = pqCrypto.serializeCiphertext(ciphertext);
    this.sendMessage({
      type: 'key-exchange',
      payload: { ciphertext: Array.from(serializedCiphertext) },
    });

    // Derive session keys
    this.deriveSessionKeys();
    this.session.status = 'transferring';
    secureLog.log('[PQC] Key exchange complete (initiator)');
    this.onSessionReadyCallback?.();
  }

  /**
   * Get serialized public key for sharing
   */
  getPublicKey(): Uint8Array {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    return pqCrypto.serializeKeypairPublic(this.session.ownKeys);
  }

  /**
   * Set peer's public key and establish shared secret
   */
  async setPeerPublicKey(serializedKey: Uint8Array): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    // Deserialize with validation (bounds-checked in pqc-crypto)
    const peerPublicKey = pqCrypto.deserializePublicKey(serializedKey);
    this.session.peerPublicKey = peerPublicKey;
    this.session.status = 'negotiating';

    // Perform key exchange based on mode
    if (this.session.mode === 'send') {
      // Sender: encapsulate using the HybridPublicKey
      const { ciphertext, sharedSecret } = await pqCrypto.encapsulate(peerPublicKey);
      this.session.sharedSecret = sharedSecret;

      // Send ciphertext to receiver (verify channel is open first)
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
        throw new Error('Data channel not ready for key exchange');
      }

      const serializedCiphertext = pqCrypto.serializeCiphertext(ciphertext);
      this.sendMessage({
        type: 'key-exchange',
        payload: {
          ciphertext: Array.from(serializedCiphertext),
        },
      });

      // Derive session keys
      this.deriveSessionKeys();
      this.session.status = 'transferring';
    }
    // For receive mode, we'll handle it when we get the ciphertext
  }

  /**
   * Handle incoming key exchange ciphertext (the device that sent its public key)
   */
  async handleKeyExchangeCiphertext(serializedCiphertext: Uint8Array): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized for key exchange');
    }

    const ciphertext = pqCrypto.deserializeCiphertext(serializedCiphertext);

    // Decapsulate to get shared secret
    this.session.sharedSecret = await pqCrypto.decapsulate(ciphertext, this.session.ownKeys);

    // Derive session keys
    this.deriveSessionKeys();

    // Session is now ready
    this.session.status = 'transferring';
    secureLog.log('Key exchange complete, ready to receive');
  }

  /**
   * Derive encryption and auth keys from shared secret
   */
  private deriveSessionKeys(): void {
    if (!this.session || !this.session.sharedSecret) {
      throw new Error('Cannot derive keys without shared secret');
    }

    // Clear key exchange timeout on success
    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }

    const keys = pqCrypto.deriveSessionKeys(this.session.sharedSecret);
    this.session.sessionKeys = keys;

    // Log session ID (not the keys!)
    const sessionIdHex = Array.from(keys.sessionId)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    secureLog.log('Session established:', sessionIdHex.slice(0, 8) + '...');

    // Trigger verification callback with the shared secret
    if (this.onVerificationReadyCallback && this.session.sharedSecret) {
      this.onVerificationReadyCallback(this.session.sharedSecret);
    }
  }

  /**
   * Send file
   */
  async sendFile(file: File, relativePath?: string): Promise<void> {
    if (!this.session || !this.session.sessionKeys) {
      throw new Error('Session not ready for transfer');
    }

    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open');
    }

    this.session.status = 'transferring';

    try {
      // Encrypt file
      const encrypted = await fileEncryption.encrypt(file, this.session.sessionKeys.encryptionKey);

      // Encrypt relative path if provided (for folder transfers)
      let encryptedPath: string | undefined;
      let pathNonce: number[] | undefined;
      if (relativePath) {
        const pathBytes = new TextEncoder().encode(relativePath);
        const { pqCrypto } = await import('../crypto/pqc-crypto');
        const encPathData = await pqCrypto.encrypt(pathBytes, this.session.sessionKeys.encryptionKey);
        encryptedPath = btoa(String.fromCharCode(...encPathData.ciphertext));
        pathNonce = Array.from(encPathData.nonce);
      }

      // Send metadata (filename is already encrypted in the EncryptedFile, don't leak it)
      this.sendMessage({
        type: 'file-metadata',
        payload: {
          originalName: '', // Never send plaintext filename
          originalSize: encrypted.metadata.originalSize,
          mimeCategory: encrypted.metadata.mimeCategory,
          totalChunks: encrypted.metadata.totalChunks,
          fileHash: Array.from(encrypted.metadata.fileHash),
          encryptedName: encrypted.metadata.encryptedName,
          nameNonce: Array.from(encrypted.metadata.nameNonce),
          encryptedPath,
          pathNonce,
        } as FileMetadataPayload,
      });

      // Send chunks with progress updates
      for (let i = 0; i < encrypted.chunks.length; i++) {
        const chunk = encrypted.chunks[i];

        // Apply bandwidth throttling if configured
        if (this.bandwidthLimit > 0) {
          const chunkSize = chunk.data.length;
          const minInterval = (chunkSize / this.bandwidthLimit) * 1000; // ms
          const elapsed = Date.now() - this.lastChunkTime;
          if (elapsed < minInterval) {
            await new Promise(r => setTimeout(r, minInterval - elapsed));
          }
        }
        this.lastChunkTime = Date.now();

        // Send chunk
        this.sendMessage({
          type: 'chunk',
          payload: {
            index: chunk.index,
            data: Array.from(chunk.data),
            nonce: Array.from(chunk.nonce),
            hash: Array.from(chunk.hash),
          } as ChunkPayload,
        });

        // Update progress
        const progress = ((i + 1) / encrypted.chunks.length) * 100;
        this.onProgressCallback?.(progress);

        // Wait for acknowledgment (rejects on timeout)
        await this.waitForAck(chunk.index);
      }

      // Send completion message
      this.sendMessage({
        type: 'complete',
        payload: { success: true },
      });

      this.session.status = 'completed';
    } catch (error) {
      this.session.status = 'failed';
      this.sendMessage({
        type: 'error',
        payload: { error: 'Transfer failed' },
      });
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }

  /**
   * Setup data channel handlers
   */
  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onmessage = async (event) => {
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data as string);
        } catch {
          secureLog.error('Invalid JSON message received');
          return;
        }

        // Validate message structure
        if (!isValidTransferMessage(parsed)) {
          secureLog.error('Invalid message structure received');
          return;
        }

        const message = parsed;

        switch (message.type) {
          case 'key-exchange':
            await this.handleKeyExchangeCiphertext(new Uint8Array(message.payload.ciphertext));
            break;

          case 'file-metadata':
            this.handleFileMetadata(message.payload);
            break;

          case 'chunk':
            await this.handleChunk(message.payload);
            break;

          case 'ack':
            this.handleAck(message.payload.index);
            break;

          case 'complete':
            secureLog.log('Transfer complete signal received');
            break;

          case 'error':
            this.onErrorCallback?.(new Error(message.payload.error));
            break;
        }
      } catch (error) {
        secureLog.error('Error handling message:', error);
        this.onErrorCallback?.(error as Error);
      }
    };
  }

  /**
   * Handle file metadata (receiver)
   */
  private handleFileMetadata(metadata: FileMetadataPayload): void {
    // Validate metadata
    if (metadata.totalChunks <= 0 || metadata.totalChunks > MAX_CHUNK_INDEX) {
      throw new Error(`Invalid chunk count: ${metadata.totalChunks}`);
    }
    if (metadata.originalSize <= 0 || metadata.originalSize > 4 * 1024 * 1024 * 1024) {
      throw new Error(`Invalid file size: ${metadata.originalSize}`);
    }

    this.fileMetadata = metadata;
    this.receivedChunks.clear();
    secureLog.log('Receiving file:', `(${metadata.totalChunks} chunks, ${metadata.originalSize} bytes)`);
  }

  /**
   * Handle incoming chunk (receiver)
   */
  private async handleChunk(chunkData: ChunkPayload): Promise<void> {
    if (!this.session || !this.session.sessionKeys) {
      throw new Error('Session not ready');
    }

    if (!this.fileMetadata) {
      throw new Error('File metadata not received yet');
    }

    // Validate chunk index
    if (chunkData.index < 0 || chunkData.index >= this.fileMetadata.totalChunks) {
      secureLog.error('Invalid chunk index:', chunkData.index);
      return;
    }

    // Reject duplicate chunks
    if (this.receivedChunks.has(chunkData.index)) {
      secureLog.log('Duplicate chunk ignored:', chunkData.index);
      // Still send ACK for idempotency
      this.sendMessage({ type: 'ack', payload: { index: chunkData.index } });
      return;
    }

    const chunk: EncryptedChunk = {
      index: chunkData.index,
      data: new Uint8Array(chunkData.data),
      nonce: new Uint8Array(chunkData.nonce),
      hash: new Uint8Array(chunkData.hash),
    };

    // Store chunk
    this.receivedChunks.set(chunk.index, chunk);

    // Send acknowledgment
    this.sendMessage({
      type: 'ack',
      payload: { index: chunk.index },
    });

    // Update progress
    if (this.fileMetadata) {
      const progress = (this.receivedChunks.size / this.fileMetadata.totalChunks) * 100;
      this.onProgressCallback?.(progress);

      // Check if all chunks received
      if (this.receivedChunks.size === this.fileMetadata.totalChunks) {
        await this.completeReceive();
      }
    }
  }

  /**
   * Handle acknowledgment from receiver
   */
  private handleAck(chunkIndex: number): void {
    const resolver = this.pendingAcks.get(chunkIndex);
    if (resolver) {
      resolver();
      this.pendingAcks.delete(chunkIndex);
    }
  }

  /**
   * Complete file reception
   */
  private async completeReceive(): Promise<void> {
    if (!this.session || !this.session.sessionKeys || !this.fileMetadata) {
      throw new Error('Invalid state for completing receive');
    }

    try {
      // Reconstruct encrypted file with proper chunk ordering
      const chunks: EncryptedChunk[] = [];
      for (let i = 0; i < this.fileMetadata.totalChunks; i++) {
        const chunk = this.receivedChunks.get(i);
        if (!chunk) {
          throw new Error(`Missing chunk ${i}`);
        }
        chunks.push(chunk);
      }

      const encryptedFile: EncryptedFile = {
        metadata: {
          encryptedName: this.fileMetadata.encryptedName || '',
          nameNonce: this.fileMetadata.nameNonce
            ? new Uint8Array(this.fileMetadata.nameNonce)
            : new Uint8Array(0),
          originalName: '', // Never trust plaintext name from peer
          originalSize: this.fileMetadata.originalSize,
          mimeCategory: this.fileMetadata.mimeCategory,
          totalChunks: this.fileMetadata.totalChunks,
          fileHash: new Uint8Array(this.fileMetadata.fileHash),
          encryptedAt: Date.now(),
        },
        chunks,
      };

      // Decrypt file
      const decrypted = await fileEncryption.decrypt(
        encryptedFile,
        this.session.sessionKeys.encryptionKey
      );

      // Decrypt the filename
      let filename = 'file.bin';
      if (encryptedFile.metadata.encryptedName) {
        const { decryptFileName } = await import('../crypto/file-encryption-pqc');
        filename = await decryptFileName(encryptedFile, this.session.sessionKeys.encryptionKey);
      }

      // Decrypt the relative path if present (folder transfers)
      let relativePath: string | undefined;
      if (this.fileMetadata?.encryptedPath && this.fileMetadata.pathNonce) {
        try {
          const { pqCrypto } = await import('../crypto/pqc-crypto');
          const pathCiphertext = new Uint8Array(
            atob(this.fileMetadata.encryptedPath).split('').map(c => c.charCodeAt(0))
          );
          const decryptedPath = await pqCrypto.decrypt(
            { ciphertext: pathCiphertext, nonce: new Uint8Array(this.fileMetadata.pathNonce) },
            this.session.sessionKeys.encryptionKey
          );
          relativePath = new TextDecoder().decode(decryptedPath);
        } catch {
          // Path decryption failed, ignore - file will be saved flat
        }
      }

      this.session.status = 'completed';
      this.onCompleteCallback?.(decrypted, filename, relativePath);
    } catch (error) {
      this.session.status = 'failed';
      this.onErrorCallback?.(error as Error);
    }
  }

  /**
   * Send message over data channel
   */
  private sendMessage(message: TransferMessage): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    this.dataChannel.send(JSON.stringify(message));
  }

  /**
   * Wait for acknowledgment with timeout
   * Rejects on timeout to prevent silent data loss
   */
  private async waitForAck(chunkIndex: number, retries = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(chunkIndex);
        if (retries < MAX_RETRIES) {
          // Retry: resolve and let the caller retry
          secureLog.log(`ACK timeout for chunk ${chunkIndex}, retry ${retries + 1}/${MAX_RETRIES}`);
          resolve(this.waitForAck(chunkIndex, retries + 1));
        } else {
          reject(new Error(`ACK timeout for chunk ${chunkIndex} after ${MAX_RETRIES} retries`));
        }
      }, ACK_TIMEOUT);

      this.pendingAcks.set(chunkIndex, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return Array.from(pqCrypto.randomBytes(16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Event handlers
   */
  onProgress(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }

  onComplete(callback: (blob: Blob, filename: string, relativePath?: string) => void): void {
    this.onCompleteCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Set bandwidth limit in bytes per second (0 = unlimited)
   */
  setBandwidthLimit(bytesPerSecond: number): void {
    this.bandwidthLimit = Math.max(0, bytesPerSecond);
  }

  onSessionReady(callback: () => void): void {
    this.onSessionReadyCallback = callback;
  }

  onFileIncoming(callback: (metadata: { size: number; mimeCategory: string; totalChunks: number }) => void): void {
    this.onFileIncomingCallback = callback;
  }

  onVerificationReady(callback: (sharedSecret: Uint8Array) => void): void {
    this.onVerificationReadyCallback = callback;
  }

  /**
   * Get session info
   */
  getSessionInfo(): PQCTransferSession | null {
    return this.session;
  }

  /**
   * Get shared secret for SAS verification
   * Returns null if key exchange hasn't completed yet
   */
  getSharedSecret(): Uint8Array | null {
    return this.session?.sharedSecret || null;
  }

  /**
   * Check if session is ready for transfer
   */
  isReady(): boolean {
    return !!(this.session && this.session.sessionKeys && this.session.status === 'transferring');
  }

  /**
   * Destroy session and clean up sensitive data
   */
  destroy(): void {
    // Clear key exchange timeout
    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }
    // Zero out sensitive data
    if (this.session?.sharedSecret) {
      this.session.sharedSecret.fill(0);
    }
    if (this.session?.sessionKeys) {
      this.session.sessionKeys.encryptionKey.fill(0);
      this.session.sessionKeys.authKey.fill(0);
    }
    this.session = null;
    this.dataChannel = null;
    this.receivedChunks.clear();
    this.fileMetadata = null;
    this.pendingAcks.clear();
  }
}
