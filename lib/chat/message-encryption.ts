'use client';

/**
 * Message Encryption
 * End-to-end encryption for chat messages using PQC (ML-KEM-768 + X25519)
 * Each message is encrypted independently with the session key
 */

import { lazyPQCrypto, SessionKeys, EncryptedData } from '../crypto/pqc-crypto-lazy';
import secureLog from '../utils/secure-logger';

export class MessageEncryption {
  private sessionKeys: SessionKeys | null = null;
  private messageCounter = 0;

  /**
   * Initialize with session keys from key exchange
   */
  async initialize(sessionKeys: SessionKeys): Promise<void> {
    this.sessionKeys = sessionKeys;
    secureLog.log('[MessageEncryption] Initialized with session keys');
  }

  /**
   * Encrypt a message
   */
  async encryptMessage(plaintext: Uint8Array): Promise<EncryptedData> {
    if (!this.sessionKeys) {
      throw new Error('MessageEncryption not initialized');
    }

    try {
      // Use the session encryption key from PQC key exchange
      const encrypted = await lazyPQCrypto.encrypt(
        plaintext,
        this.sessionKeys.encryptionKey
      );

      this.messageCounter++;
      return encrypted;
    } catch (error) {
      secureLog.error('[MessageEncryption] Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(encrypted: EncryptedData): Promise<Uint8Array> {
    if (!this.sessionKeys) {
      throw new Error('MessageEncryption not initialized');
    }

    try {
      // Decrypt using the session encryption key
      const plaintext = await lazyPQCrypto.decrypt(
        encrypted,
        this.sessionKeys.encryptionKey
      );

      return plaintext;
    } catch (error) {
      secureLog.error('[MessageEncryption] Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Get encryption stats
   */
  getStats(): { messagesEncrypted: number } {
    return {
      messagesEncrypted: this.messageCounter,
    };
  }

  /**
   * Destroy encryption keys
   */
  destroy(): void {
    if (this.sessionKeys) {
      // Keys will be wiped by the transfer manager
      this.sessionKeys = null;
    }
    this.messageCounter = 0;
  }
}
