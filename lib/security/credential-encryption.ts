'use client';

/**
 * Credential Encryption Service
 * Encrypts sensitive credentials (TURN server, API keys, etc.) before storage
 *
 * SECURITY: Prevents credential exposure from localStorage inspection
 */

import secureStorage from '../storage/secure-storage';
import { memoryWiper } from './memory-wiper';

/**
 * Encrypted credential structure
 */
export interface EncryptedCredential {
  encrypted: true;
  version: number;
  timestamp: number;
}

/**
 * TURN server credentials (plaintext)
 */
export interface TurnCredentials {
  urls: string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

/**
 * Encrypted TURN credentials
 */
export interface EncryptedTurnCredentials extends EncryptedCredential {
  type: 'turn';
  urls: string[];  // URLs can remain unencrypted (not sensitive)
  encryptedUsername?: string;
  encryptedCredential?: string;
  credentialType?: 'password' | 'oauth';
}

/**
 * Generic encrypted field
 */
export interface EncryptedField extends EncryptedCredential {
  type: 'generic';
  encryptedValue: string;
}

/**
 * Credential Encryption Service
 */
export class CredentialEncryption {
  private static readonly VERSION = 1;

  /**
   * Encrypt a string value
   */
  private static async encryptValue(value: string): Promise<string> {
    if (!value) {return '';}

    // Use secure storage's encryption (AES-256-GCM)
    const key = `__temp_cred_${Date.now()}`;
    await secureStorage.setItem(key, value);
    const encryptedValue = localStorage.getItem(key);
    localStorage.removeItem(key);

    return encryptedValue || '';
  }

  /**
   * Decrypt a string value
   */
  private static async decryptValue(encrypted: string): Promise<string> {
    if (!encrypted) {return '';}

    // Use secure storage's decryption
    const key = `__temp_decrypt_${Date.now()}`;
    localStorage.setItem(key, encrypted);
    const decrypted = await secureStorage.getItem(key);
    localStorage.removeItem(key);

    return decrypted || '';
  }

  /**
   * Encrypt TURN server credentials
   */
  static async encryptTurnCredentials(
    credentials: TurnCredentials
  ): Promise<EncryptedTurnCredentials> {
    const result: EncryptedTurnCredentials = {
      encrypted: true,
      version: this.VERSION,
      timestamp: Date.now(),
      type: 'turn',
      urls: credentials.urls, // URLs are not sensitive
      ...(credentials.credentialType ? { credentialType: credentials.credentialType } : {}),
    };

    // Encrypt username if present
    if (credentials.username) {
      result.encryptedUsername = await this.encryptValue(credentials.username);
    }

    // Encrypt credential (password/token) if present
    if (credentials.credential) {
      result.encryptedCredential = await this.encryptValue(
        credentials.credential
      );
    }

    return result;
  }

  /**
   * Decrypt TURN server credentials
   */
  static async decryptTurnCredentials(
    encrypted: EncryptedTurnCredentials
  ): Promise<TurnCredentials> {
    if (!encrypted.encrypted) {
      throw new Error('Invalid encrypted credentials');
    }

    const result: TurnCredentials = {
      urls: encrypted.urls,
      ...(encrypted.credentialType ? { credentialType: encrypted.credentialType } : {}),
    };

    // Decrypt username if present
    if (encrypted.encryptedUsername) {
      result.username = await this.decryptValue(encrypted.encryptedUsername);
    }

    // Decrypt credential if present
    if (encrypted.encryptedCredential) {
      result.credential = await this.decryptValue(
        encrypted.encryptedCredential
      );
    }

    return result;
  }

  /**
   * Check if credentials are encrypted
   */
  static isEncrypted(
    credentials: TurnCredentials | EncryptedTurnCredentials
  ): credentials is EncryptedTurnCredentials {
    return !!credentials && 'encrypted' in credentials && credentials.encrypted === true;
  }

  /**
   * Encrypt a generic credential field
   */
  static async encryptField(value: string): Promise<EncryptedField> {
    const encryptedValue = await this.encryptValue(value);

    return {
      encrypted: true,
      version: this.VERSION,
      timestamp: Date.now(),
      type: 'generic',
      encryptedValue,
    };
  }

  /**
   * Decrypt a generic credential field
   */
  static async decryptField(encrypted: EncryptedField): Promise<string> {
    if (!encrypted.encrypted) {
      throw new Error('Invalid encrypted field');
    }

    return await this.decryptValue(encrypted.encryptedValue);
  }

  /**
   * Securely store credentials with encryption
   */
  static async storeCredential(
    key: string,
    value: string | TurnCredentials
  ): Promise<void> {
    let toStore: string;

    if (typeof value === 'string') {
      // Encrypt simple string
      const encrypted = await this.encryptField(value);
      toStore = JSON.stringify(encrypted);
    } else {
      // Encrypt TURN credentials
      const encrypted = await this.encryptTurnCredentials(value);
      toStore = JSON.stringify(encrypted);
    }

    await secureStorage.setItem(key, toStore);
  }

  /**
   * Retrieve and decrypt credentials
   */
  static async retrieveCredential<T = string>(key: string): Promise<T | null> {
    const stored = await secureStorage.getItem(key);
    if (!stored) {return null;}

    try {
      const parsed = JSON.parse(stored);

      if (!parsed.encrypted) {
        // Legacy unencrypted data - return as-is and migrate
        await this.storeCredential(key, parsed);
        return parsed as T;
      }

      if (parsed.type === 'turn') {
        const decrypted = await this.decryptTurnCredentials(parsed);
        return decrypted as T;
      }

      if (parsed.type === 'generic') {
        const decrypted = await this.decryptField(parsed);
        return decrypted as T;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Rotate credentials (re-encrypt with new key)
   * Useful when secure storage master key is rotated
   */
  static async rotateCredential(key: string): Promise<void> {
    const value = await this.retrieveCredential(key);
    if (value === null) {return;}

    await this.storeCredential(key, value);
  }

  /**
   * Migrate plaintext credentials to encrypted
   */
  static async migrateCredentials(
    credentials: TurnCredentials[]
  ): Promise<EncryptedTurnCredentials[]> {
    const encrypted: EncryptedTurnCredentials[] = [];

    for (const cred of credentials) {
      // Skip if already encrypted
      if (this.isEncrypted(cred)) {
        encrypted.push(cred);
        continue;
      }

      // Encrypt plaintext credentials
      const encryptedCred = await this.encryptTurnCredentials(cred);
      encrypted.push(encryptedCred);

      // Wipe plaintext from memory
      if (cred.username) {
        memoryWiper.wipeString(cred.username);
      }
      if (cred.credential) {
        memoryWiper.wipeString(cred.credential);
      }
    }

    return encrypted;
  }

  /**
   * Batch decrypt credentials
   */
  static async decryptCredentials(
    encrypted: EncryptedTurnCredentials[]
  ): Promise<TurnCredentials[]> {
    const decrypted: TurnCredentials[] = [];

    for (const cred of encrypted) {
      if (!this.isEncrypted(cred)) {
        // Already plaintext
        decrypted.push(cred as unknown as TurnCredentials);
        continue;
      }

      const decryptedCred = await this.decryptTurnCredentials(cred);
      decrypted.push(decryptedCred);
    }

    return decrypted;
  }

  /**
   * Check credential expiry
   * Returns true if credential is older than maxAge
   */
  static isExpired(
    credential: EncryptedCredential,
    maxAgeMs: number
  ): boolean {
    const age = Date.now() - credential.timestamp;
    return age > maxAgeMs;
  }

  /**
   * Clean up old credentials
   */
  static async cleanupExpiredCredentials(
    credentials: EncryptedTurnCredentials[],
    maxAgeMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days
  ): Promise<EncryptedTurnCredentials[]> {
    return credentials.filter((cred) => !this.isExpired(cred, maxAgeMs));
  }
}

/**
 * Helper functions for credential management
 */

/**
 * Encrypt and store TURN server configuration
 */
export async function storeTurnCredentials(
  key: string,
  credentials: TurnCredentials[]
): Promise<void> {
  const encrypted = await CredentialEncryption.migrateCredentials(credentials);
  await secureStorage.setItem(key, JSON.stringify(encrypted));
}

/**
 * Retrieve and decrypt TURN server configuration
 */
export async function retrieveTurnCredentials(
  key: string
): Promise<TurnCredentials[]> {
  const stored = await secureStorage.getItem(key);
  if (!stored) {return [];}

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {return [];}

    return await CredentialEncryption.decryptCredentials(parsed);
  } catch {
    return [];
  }
}

/**
 * Rotate all stored credentials
 */
export async function rotateAllCredentials(keys: string[]): Promise<void> {
  for (const key of keys) {
    await CredentialEncryption.rotateCredential(key);
  }
}

/**
 * Export the service
 */
export default CredentialEncryption;
