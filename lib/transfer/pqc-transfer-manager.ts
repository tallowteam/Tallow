'use client';

/**
 * Post-Quantum Transfer Manager
 * Handles secure file transfers with hybrid PQC key exchange
 */

import {
  lazyPQCrypto,
  HybridKeyPair,
  HybridPublicKey,
  SessionKeys,
} from '../crypto/pqc-crypto-lazy';
import { lazyFileEncryption, EncryptedFile, EncryptedChunk } from '../crypto/file-encryption-pqc-lazy';
import { TrafficObfuscator } from '../transport/obfuscation';
import {
  getOnionRoutingManager,
  OnionRoutingManager
} from '../transport/onion-routing-integration';
import secureLog from '../utils/secure-logger';
import {
  KeyRotationManager,
  type RotatingSessionKeys,
} from '../security/key-rotation';
import { memoryWiper, type ChunkData } from '../security/memory-wiper';
import { recordPQCOperation, recordTransfer, recordError } from '../monitoring/metrics';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

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
  keyRotation?: KeyRotationManager;
  rotatingKeys?: RotatingSessionKeys;
}

export type TransferMessage =
  | { type: 'public-key'; payload: { key: number[] } }
  | { type: 'key-exchange'; payload: { ciphertext: number[] } }
  | { type: 'key-rotation'; payload: { generation: number; sessionIdHex: string } }
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
const MAX_CHUNK_SIZE = 256 * 1024; // 256KB max chunk size (allows some obfuscation overhead)
const ACK_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

/**
 * Validate transfer message structure
 */
function isValidTransferMessage(data: unknown): data is TransferMessage {
  if (!data || typeof data !== 'object') {return false;}
  const msg = data as Record<string, unknown>;
  if (typeof msg['type'] !== 'string') {return false;}
  if (!msg['payload'] || typeof msg['payload'] !== 'object') {return false;}

  switch (msg['type']) {
    case 'public-key': {
      const p = msg['payload'] as Record<string, unknown>;
      return Array.isArray(p['key']);
    }
    case 'key-exchange': {
      const p = msg['payload'] as Record<string, unknown>;
      return Array.isArray(p['ciphertext']);
    }
    case 'key-rotation': {
      const p = msg['payload'] as Record<string, unknown>;
      return typeof p['generation'] === 'number' &&
        typeof p['sessionIdHex'] === 'string';
    }
    case 'file-metadata': {
      const p = msg['payload'] as Record<string, unknown>;
      return typeof p['originalSize'] === 'number' &&
        typeof p['mimeCategory'] === 'string' &&
        typeof p['totalChunks'] === 'number' &&
        Array.isArray(p['fileHash']);
    }
    case 'chunk': {
      const p = msg['payload'] as Record<string, unknown>;
      return typeof p['index'] === 'number' &&
        Array.isArray(p['data']) &&
        p['data'].length <= MAX_CHUNK_SIZE && // Validate chunk size
        Array.isArray(p['nonce']) &&
        p['nonce'].length === 12 && // AES-GCM nonce is always 12 bytes
        Array.isArray(p['hash']) &&
        p['hash'].length === 32; // SHA-256 hash is always 32 bytes
    }
    case 'ack': {
      const p = msg['payload'] as Record<string, unknown>;
      return typeof p['index'] === 'number';
    }
    case 'error': {
      const p = msg['payload'] as Record<string, unknown>;
      return typeof p['error'] === 'string';
    }
    case 'complete': {
      const p = msg['payload'] as Record<string, unknown>;
      return typeof p['success'] === 'boolean';
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
  private obfuscator: TrafficObfuscator | null = null;
  private obfuscationEnabled: boolean = false;
  private onionManager: OnionRoutingManager | null = null;
  private onionRoutingEnabled: boolean = false;

  // Receiving state
  private receivedChunks: Map<number, EncryptedChunk> = new Map();
  private fileMetadata: FileMetadataPayload | null = null;
  private pendingAcks: Map<number, () => void> = new Map();

  /**
   * Initialize session
   */
  async initializeSession(mode: TransferMode): Promise<PQCTransferSession> {
    addBreadcrumb('Initializing PQC session', 'pqc-transfer', { mode });

    // Generate keypair with metrics
    const keygenStart = performance.now();
    const ownKeys = await lazyPQCrypto.generateHybridKeypair();
    const keygenDuration = (performance.now() - keygenStart) / 1000;
    recordPQCOperation('keygen', 'kyber768', keygenDuration * 1000);

    this.session = {
      sessionId: this.generateSessionId(),
      mode,
      status: 'pending',
      ownKeys,
    };

    // Initialize traffic obfuscation if enabled in settings
    if (typeof window !== 'undefined') {
      try {
        const advancedPrivacyMode = localStorage.getItem('tallow_advanced_privacy_mode');
        if (advancedPrivacyMode === 'true') {
          this.obfuscationEnabled = true;
          this.obfuscator = new TrafficObfuscator();
          secureLog.log('[PQC] Traffic obfuscation enabled');
        }
      } catch (e) {
        secureLog.error('[PQC] Failed to check obfuscation settings:', e);
      }

      // Initialize onion routing if enabled
      try {
        const onionRoutingMode = localStorage.getItem('tallow_onion_routing_mode');
        if (onionRoutingMode === 'multi-hop' || onionRoutingMode === 'single-hop') {
          this.onionRoutingEnabled = true;
          this.onionManager = getOnionRoutingManager();
          await this.onionManager.initialize();
          this.onionManager.updateConfig({ mode: onionRoutingMode as 'single-hop' | 'multi-hop' });
          secureLog.log('[PQC] Onion routing enabled:', onionRoutingMode);
        }
      } catch (e) {
        secureLog.error('[PQC] Failed to initialize onion routing:', e);
      }
    }

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
      case 'key-rotation':
        await this.handlePeerKeyRotation(message.payload);
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

    const peerPublicKey = await lazyPQCrypto.deserializePublicKey(serializedKey);
    this.session.peerPublicKey = peerPublicKey;
    this.session.status = 'negotiating';
    secureLog.log('[PQC] Received peer public key');

    // CRITICAL FIX: Deterministic role selection to prevent race condition
    // Use lexicographic comparison of serialized public keys to decide who encapsulates
    const ownPublicKeySerialized = lazyPQCrypto.serializeKeypairPublic(this.session.ownKeys);
    const shouldEncapsulate = this.shouldBeInitiator(ownPublicKeySerialized, serializedKey);

    if (shouldEncapsulate) {
      // This peer is the initiator - perform encapsulation with metrics
      const encapsStart = performance.now();
      const { ciphertext, sharedSecret } = await lazyPQCrypto.encapsulate(peerPublicKey);
      const encapsDuration = (performance.now() - encapsStart) / 1000;
      recordPQCOperation('encaps', 'kyber768', encapsDuration * 1000);

      this.session.sharedSecret = sharedSecret;

      const serializedCiphertext = await lazyPQCrypto.serializeCiphertext(ciphertext);
      this.sendMessage({
        type: 'key-exchange',
        payload: { ciphertext: Array.from(serializedCiphertext) },
      });

      // Derive session keys
      await this.deriveSessionKeys();
      this.session.status = 'transferring';
      secureLog.log('[PQC] Key exchange complete (initiator)');
      this.onSessionReadyCallback?.();
    } else {
      // This peer is the responder - wait for ciphertext in handleKeyExchangeCiphertext
      secureLog.log('[PQC] Waiting for ciphertext from initiator (responder role)');
    }
  }

  /**
   * Deterministic role selection based on public key comparison
   * Prevents race condition where both peers encapsulate
   */
  private shouldBeInitiator(ownKey: Uint8Array, peerKey: Uint8Array): boolean {
    // Byte-by-byte lexicographic comparison
    for (let i = 0; i < Math.min(ownKey.length, peerKey.length); i++) {
      const ownByte = ownKey[i];
      const peerByte = peerKey[i];
      if (ownByte !== undefined && peerByte !== undefined) {
        if (ownByte < peerByte) {return true;}
        if (ownByte > peerByte) {return false;}
      }
    }

    // Length-based tie-break
    if (ownKey.length !== peerKey.length) {
      return ownKey.length < peerKey.length;
    }

    // Keys are identical (should NEVER happen with good RNG)
    // Use session mode as final tie-break to prevent deadlock
    secureLog.warn('[PQC] Identical public keys detected - this should never happen with proper RNG!');

    // Send mode always initiates in case of collision
    return this.session?.mode === 'send';
  }

  /**
   * Get serialized public key for sharing
   */
  getPublicKey(): Uint8Array {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    return lazyPQCrypto.serializeKeypairPublic(this.session.ownKeys);
  }

  /**
   * Set peer's public key and establish shared secret
   */
  async setPeerPublicKey(serializedKey: Uint8Array): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    // Deserialize with validation (bounds-checked in pqc-crypto)
    const peerPublicKey = await lazyPQCrypto.deserializePublicKey(serializedKey);
    this.session.peerPublicKey = peerPublicKey;
    this.session.status = 'negotiating';

    // Perform key exchange based on mode
    if (this.session.mode === 'send') {
      // Sender: encapsulate using the HybridPublicKey
      const { ciphertext, sharedSecret } = await lazyPQCrypto.encapsulate(peerPublicKey);
      this.session.sharedSecret = sharedSecret;

      // Send ciphertext to receiver (verify channel is open first)
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
        throw new Error('Data channel not ready for key exchange');
      }

      const serializedCiphertext = await lazyPQCrypto.serializeCiphertext(ciphertext);
      this.sendMessage({
        type: 'key-exchange',
        payload: {
          ciphertext: Array.from(serializedCiphertext),
        },
      });

      // Derive session keys
      await this.deriveSessionKeys();
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

    const ciphertext = await lazyPQCrypto.deserializeCiphertext(serializedCiphertext);

    // Decapsulate to get shared secret with metrics
    const decapsStart = performance.now();
    this.session.sharedSecret = await lazyPQCrypto.decapsulate(ciphertext, this.session.ownKeys);
    const decapsDuration = (performance.now() - decapsStart) / 1000;
    recordPQCOperation('decaps', 'kyber768', decapsDuration * 1000);

    // Derive session keys
    await this.deriveSessionKeys();

    // Session is now ready
    this.session.status = 'transferring';
    secureLog.log('Key exchange complete, ready to receive');
  }

  /**
   * Derive encryption and auth keys from shared secret
   * ENHANCED: Initialize key rotation for forward secrecy
   */
  private async deriveSessionKeys(): Promise<void> {
    if (!this.session || !this.session.sharedSecret) {
      throw new Error('Cannot derive keys without shared secret');
    }

    // Clear key exchange timeout on success
    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }

    const keys = await lazyPQCrypto.deriveSessionKeys(this.session.sharedSecret);
    this.session.sessionKeys = keys;

    // Initialize key rotation manager for forward secrecy
    // Read rotation interval from settings
    let rotationIntervalMs = 5 * 60 * 1000; // Default: 5 minutes
    if (typeof window !== 'undefined') {
      try {
        const savedInterval = localStorage.getItem('tallow_key_rotation_interval');
        if (savedInterval) {
          const parsed = parseInt(savedInterval, 10);
          if (parsed > 0) {
            rotationIntervalMs = parsed;
            secureLog.log(`[PQC] Using key rotation interval: ${parsed}ms`);
          }
        }
      } catch (e) {
        secureLog.error('[PQC] Failed to read key rotation settings:', e);
      }
    }

    this.session.keyRotation = new KeyRotationManager({
      rotationIntervalMs,
      maxGenerations: 100,
      enableAutoRotation: true,
    });

    // Initialize with base shared secret
    this.session.rotatingKeys = this.session.keyRotation.initialize(
      this.session.sharedSecret
    );

    // Listen for rotation events to notify peer
    this.session.keyRotation.onRotation((rotatedKeys) => {
      this.handleLocalKeyRotation(rotatedKeys);
    });

    // Log session ID (not the keys!)
    const sessionIdHex = Array.from(keys.sessionId)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    secureLog.log('Session established:', sessionIdHex.slice(0, 8) + '...');
    secureLog.log('Key rotation enabled: 5-minute intervals');

    // Trigger verification callback with the shared secret
    if (this.onVerificationReadyCallback && this.session.sharedSecret) {
      this.onVerificationReadyCallback(this.session.sharedSecret);
    }
  }

  /**
   * Handle local key rotation event
   * Notify peer of rotation to maintain sync
   */
  private handleLocalKeyRotation(_keys: RotatingSessionKeys): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    const state = this.session?.keyRotation?.exportState();
    if (!state) {return;}

    // Notify peer of rotation
    this.sendMessage({
      type: 'key-rotation',
      payload: {
        generation: state.generation,
        sessionIdHex: state.sessionIdHex,
      },
    });

    secureLog.log(
      `Key rotation: generation ${state.generation} (${state.sessionIdHex.slice(0, 8)}...)`
    );
  }

  /**
   * Handle peer key rotation notification
   * Sync our keys to match peer's generation
   */
  private async handlePeerKeyRotation(payload: {
    generation: number;
    sessionIdHex: string;
  }): Promise<void> {
    if (!this.session?.keyRotation) {
      secureLog.error('Received key rotation without initialized manager');
      return;
    }

    try {
      // Sync to peer's generation
      this.session.rotatingKeys = this.session.keyRotation.syncToGeneration(
        payload.generation
      );

      // Verify we're in sync
      const inSync = this.session.keyRotation.verifyState({
        generation: payload.generation,
        sessionIdHex: payload.sessionIdHex,
      });

      if (!inSync) {
        secureLog.error('Key rotation sync failed - session ID mismatch');
        this.onErrorCallback?.(
          new Error('Key rotation synchronization failed')
        );
      } else {
        secureLog.log(
          `Synced to peer key rotation: generation ${payload.generation}`
        );
      }
    } catch (error) {
      secureLog.error('Failed to sync key rotation:', error);

      // Report key rotation sync failure to Sentry
      captureException(error as Error, {
        tags: { module: 'pqc-transfer-manager', operation: 'handlePeerKeyRotation' },
        extra: {
          peerGeneration: payload.generation,
          sessionId: this.session?.sessionId,
        }
      });

      this.onErrorCallback?.(error as Error);
    }
  }

  /**
   * Get current encryption key (uses rotating keys if available)
   */
  private getCurrentEncryptionKey(): Uint8Array {
    if (this.session?.rotatingKeys) {
      return this.session.rotatingKeys.encryptionKey;
    }
    if (this.session?.sessionKeys) {
      return this.session.sessionKeys.encryptionKey;
    }
    throw new Error('No encryption key available');
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
    const transferStartTime = performance.now();

    try {
      // Use current rotating encryption key
      const encryptionKey = this.getCurrentEncryptionKey();

      // Encrypt file
      const encrypted = await lazyFileEncryption.encrypt(file, encryptionKey);

      // Encrypt relative path if provided (for folder transfers)
      let encryptedPath: string | undefined;
      let pathNonce: number[] | undefined;
      if (relativePath) {
        const pathBytes = new TextEncoder().encode(relativePath);
        const encPathData = await lazyPQCrypto.encrypt(pathBytes, this.session.sessionKeys.encryptionKey);
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
        if (!chunk) {continue;}

        // Apply traffic obfuscation if enabled
        let chunkData = chunk.data;
        if (this.obfuscationEnabled && this.obfuscator) {
          // Add random padding to chunk
          chunkData = this.obfuscator.padData(chunk.data);
          secureLog.log(`[PQC] Obfuscated chunk ${i}: ${chunk.data.length}B -> ${chunkData.length}B`);
        }

        // Route through onion if enabled (after obfuscation, before sending)
        if (this.onionRoutingEnabled && this.onionManager) {
          try {
            const chunkBuffer = chunkData.buffer.slice(
              chunkData.byteOffset,
              chunkData.byteOffset + chunkData.byteLength
            );
            await this.onionManager.routeThroughOnion(
              `${this.session.sessionId}-chunk-${i}`,
              chunkBuffer,
              this.dataChannel?.label || 'peer'
            );
            secureLog.log(`[PQC] Routed chunk ${i} through onion network`);
          } catch (e) {
            secureLog.warn('[PQC] Onion routing failed, sending direct:', e);
          }
        }

        // Apply bandwidth throttling if configured
        if (this.bandwidthLimit > 0) {
          const chunkSize = chunkData.length;
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
            data: Array.from(chunkData),
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

      // Record successful PQC transfer metrics
      const transferDuration = (performance.now() - transferStartTime) / 1000;
      recordTransfer('success', 'p2p', file.size, transferDuration, file.type || 'unknown');
    } catch (error) {
      this.session.status = 'failed';

      // Record failed transfer metrics
      recordTransfer('failed', 'p2p', file.size, 0, file.type || 'unknown');
      recordError('transfer', 'error');

      // Report to Sentry for error tracking
      captureException(error as Error, {
        tags: { module: 'pqc-transfer-manager', operation: 'sendFile' },
        extra: {
          sessionId: this.session.sessionId,
          fileSize: file.size,
          hasRelativePath: !!relativePath,
        }
      });

      this.sendMessage({
        type: 'error',
        payload: { error: 'Transfer failed' },
      });
      this.onErrorCallback?.(error as Error);
      throw error;
    }
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

    // SECURITY FIX: Validate chunk size to prevent buffer overflow attacks
    if (!Array.isArray(chunkData.data) || chunkData.data.length > MAX_CHUNK_SIZE) {
      secureLog.error(`Invalid chunk size: ${chunkData.data?.length || 0} (max: ${MAX_CHUNK_SIZE})`);
      this.sendMessage({
        type: 'error',
        payload: { error: 'Invalid chunk size' }
      });
      return;
    }

    // Validate nonce and hash sizes
    if (!Array.isArray(chunkData.nonce) || chunkData.nonce.length !== 12) {
      secureLog.error('Invalid nonce size:', chunkData.nonce?.length);
      return;
    }
    if (!Array.isArray(chunkData.hash) || chunkData.hash.length !== 32) {
      secureLog.error('Invalid hash size:', chunkData.hash?.length);
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

      // Use current rotating encryption key
      const encryptionKey = this.getCurrentEncryptionKey();

      // Decrypt file
      const decrypted = await lazyFileEncryption.decrypt(
        encryptedFile,
        encryptionKey
      );

      // Decrypt the filename
      let filename = 'file.bin';
      if (encryptedFile.metadata.encryptedName) {
        const { decryptFileName } = await import('../crypto/file-encryption-pqc');
        filename = await decryptFileName(encryptedFile, encryptionKey);
      }

      // Decrypt the relative path if present (folder transfers)
      let relativePath: string | undefined;
      if (this.fileMetadata?.encryptedPath && this.fileMetadata.pathNonce) {
        try {
          const pathCiphertext = new Uint8Array(
            atob(this.fileMetadata.encryptedPath).split('').map(c => c.charCodeAt(0))
          );
          const decryptedPath = await lazyPQCrypto.decrypt(
            { ciphertext: pathCiphertext, nonce: new Uint8Array(this.fileMetadata.pathNonce) },
            encryptionKey
          );
          relativePath = new TextDecoder().decode(decryptedPath);
        } catch {
          // Path decryption failed, ignore - file will be saved flat
        }
      }

      addBreadcrumb('PQC file receive completed', 'pqc-transfer', {
        filename,
        hasRelativePath: !!relativePath,
        totalChunks: this.fileMetadata.totalChunks,
      });

      this.session.status = 'completed';

      // Record successful receive metrics (receiver side)
      recordTransfer('success', 'p2p', this.fileMetadata.originalSize, 0, this.fileMetadata.mimeCategory || 'unknown');

      this.onCompleteCallback?.(decrypted, filename, relativePath);
    } catch (error) {
      this.session.status = 'failed';

      // Record failed receive metrics
      recordTransfer('failed', 'p2p', this.fileMetadata?.originalSize || 0, 0, this.fileMetadata?.mimeCategory || 'unknown');
      recordError('crypto', 'error');

      // Report decryption/reception failure to Sentry
      captureException(error as Error, {
        tags: { module: 'pqc-transfer-manager', operation: 'completeReceive' },
        extra: {
          sessionId: this.session.sessionId,
          totalChunks: this.fileMetadata?.totalChunks,
          receivedChunks: this.receivedChunks.size,
        }
      });

      this.onErrorCallback?.(error as Error);
    }
  }

  /**
   * Send message over data channel
   */
  protected sendMessage(message: TransferMessage): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    this.dataChannel.send(JSON.stringify(message));
  }

  /**
   * Wait for acknowledgment with timeout (iterative to avoid stack overflow)
   * Rejects on timeout to prevent silent data loss
   */
  private async waitForAck(chunkIndex: number): Promise<void> {
    // Use iterative approach instead of recursion to prevent stack overflow
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.pendingAcks.delete(chunkIndex);
            reject(new Error(`ACK timeout for chunk ${chunkIndex}`));
          }, ACK_TIMEOUT);

          this.pendingAcks.set(chunkIndex, () => {
            clearTimeout(timeout);
            this.pendingAcks.delete(chunkIndex);
            resolve();
          });
        });
        // ACK received successfully
        return;
      } catch (_error) {
        if (attempt === MAX_RETRIES) {
          // Final attempt failed
          throw new Error(`ACK timeout for chunk ${chunkIndex} after ${MAX_RETRIES} retries`);
        }
        // Log retry and continue loop
        secureLog.log(`ACK timeout for chunk ${chunkIndex}, retry ${attempt + 1}/${MAX_RETRIES}`);
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return Array.from(lazyPQCrypto.randomBytes(16))
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
   * ENHANCED: Secure memory wiping for all sensitive data
   */
  destroy(): void {
    // Clear key exchange timeout
    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }

    // Destroy key rotation manager (wipes rotating keys)
    if (this.session?.keyRotation) {
      this.session.keyRotation.destroy();
      delete this.session.keyRotation;
    }

    // Securely wipe sensitive session data
    if (this.session?.sharedSecret) {
      memoryWiper.wipeBuffer(this.session.sharedSecret);
    }

    if (this.session?.sessionKeys) {
      memoryWiper.wipeBuffer(this.session.sessionKeys.encryptionKey);
      memoryWiper.wipeBuffer(this.session.sessionKeys.authKey);
      memoryWiper.wipeBuffer(this.session.sessionKeys.sessionId);
    }

    // Wipe Kyber and X25519 private keys
    if (this.session?.ownKeys) {
      memoryWiper.wipeBuffer(this.session.ownKeys.kyber.secretKey);
      memoryWiper.wipeBuffer(this.session.ownKeys.x25519.privateKey);
    }

    // Wipe received chunks
    for (const chunk of this.receivedChunks.values()) {
      memoryWiper.wipeChunk(chunk as unknown as ChunkData);
    }

    // Cleanup onion routing
    if (this.onionManager) {
      this.onionManager.closeTransferCircuit(this.session?.sessionId || '');
      this.onionManager = null;
    }

    this.session = null;
    this.dataChannel = null;
    this.receivedChunks.clear();
    this.fileMetadata = null;
    this.pendingAcks.clear();

    secureLog.log('Session destroyed and memory wiped');
  }
}
