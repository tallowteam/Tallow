'use client';

/**
 * Password-Protected File Encryption
 * Integrates password-based encryption with existing PQC encryption (layered encryption)
 *
 * SECURITY UPGRADE: Now uses Argon2id for key derivation (PHC winner)
 * - Memory-hard: Resistant to GPU/ASIC attacks
 * - Maintains backward compatibility with PBKDF2-encrypted files
 * - Version byte enables seamless migration
 */

import { pqCrypto } from './pqc-crypto';
import {
  deriveKeyFromPassword,
  generateSalt,
  getCurrentKDFAlgorithm,
  KDF_ALGORITHM,
  type KDFAlgorithm,
  ARGON2_DEFAULTS,
} from './argon2-browser';
import { encryptFile, decryptFile, EncryptedFile } from './file-encryption-pqc';
import { secureWipeBuffer } from '@/lib/security/memory-wiper';

export interface PasswordProtectionMetadata {
  salt: Uint8Array;
  hint?: string;
  // Version/algorithm info for backward compatibility
  kdfAlgorithm: KDFAlgorithm;
  // KDF-specific parameters
  iterations?: number;      // For PBKDF2
  memory?: number;          // For Argon2id (in KiB)
  timeCost?: number;        // For Argon2id
  parallelism?: number;     // For Argon2id
}

export interface PasswordProtectedFile extends EncryptedFile {
  passwordProtection?: PasswordProtectionMetadata;
}

// Legacy interface for backward compatibility
interface LegacyPasswordProtection {
  salt: Uint8Array;
  hint?: string;
  iterations: number;
}

/**
 * Detect KDF algorithm from legacy password protection metadata
 */
function detectLegacyKDFAlgorithm(protection: LegacyPasswordProtection): KDFAlgorithm {
  // Legacy files used PBKDF2
  if (protection.iterations === 100000) {
    return KDF_ALGORITHM.PBKDF2_V1;
  }
  return KDF_ALGORITHM.PBKDF2_V2;
}

/**
 * Derive key using the appropriate algorithm based on metadata
 */
async function deriveKeyWithMetadata(
  password: string,
  protection: PasswordProtectionMetadata | LegacyPasswordProtection
): Promise<Uint8Array> {
  // Check if this is new format with kdfAlgorithm
  if ('kdfAlgorithm' in protection) {
    const meta = protection as PasswordProtectionMetadata;

    switch (meta.kdfAlgorithm) {
      case KDF_ALGORITHM.ARGON2ID_V1:
        return deriveKeyFromPassword(password, meta.salt, {
          algorithm: KDF_ALGORITHM.ARGON2ID_V1,
          memory: meta.memory ?? ARGON2_DEFAULTS.memory,
          iterations: meta.timeCost ?? ARGON2_DEFAULTS.iterations,
          parallelism: meta.parallelism ?? ARGON2_DEFAULTS.parallelism,
        });

      case KDF_ALGORITHM.PBKDF2_V1:
        return deriveKeyFromPassword(password, meta.salt, {
          algorithm: KDF_ALGORITHM.PBKDF2_V1,
          iterations: meta.iterations ?? 100000,
        });

      case KDF_ALGORITHM.PBKDF2_V2:
      default:
        return deriveKeyFromPassword(password, meta.salt, {
          algorithm: KDF_ALGORITHM.PBKDF2_V2,
          iterations: meta.iterations ?? 600000,
        });
    }
  }

  // Legacy format without kdfAlgorithm
  const legacy = protection as LegacyPasswordProtection;
  const algorithm = detectLegacyKDFAlgorithm(legacy);

  return deriveKeyFromPassword(password, legacy.salt, {
    algorithm,
    iterations: legacy.iterations,
  });
}

/**
 * Create password protection metadata for new encryption
 */
async function createPasswordProtectionMetadata(
  salt: Uint8Array,
  hint?: string
): Promise<PasswordProtectionMetadata> {
  const kdfAlgorithm = await getCurrentKDFAlgorithm();

  if (kdfAlgorithm === KDF_ALGORITHM.ARGON2ID_V1) {
    return {
      salt,
      ...(hint ? { hint } : {}),
      kdfAlgorithm,
      memory: ARGON2_DEFAULTS.memory,
      timeCost: ARGON2_DEFAULTS.iterations,
      parallelism: ARGON2_DEFAULTS.parallelism,
    };
  }

  // PBKDF2 fallback
  return {
    salt,
    ...(hint ? { hint } : {}),
    kdfAlgorithm,
    iterations: 600000,
  };
}

/**
 * Encrypt file with both session key and password (layered encryption)
 * First layer: Session key encryption (PQC)
 * Second layer: Password encryption
 *
 * Uses Argon2id for key derivation when available
 */
export async function encryptFileWithPasswordLayer(
  file: File,
  sessionKey: Uint8Array,
  password: string,
  hint?: string
): Promise<PasswordProtectedFile> {
  let passwordKey: Uint8Array | null = null;

  try {
    // First layer: PQC session key encryption
    const sessionEncrypted = await encryptFile(file, sessionKey);

    // Generate salt for password derivation
    const salt = generateSalt();

    // Create metadata with current KDF algorithm
    const passwordProtection = await createPasswordProtectionMetadata(salt, hint);

    // Derive password key using Argon2id (or PBKDF2 fallback)
    passwordKey = await deriveKeyWithMetadata(password, passwordProtection);

    // Second layer: Re-encrypt each chunk with password key
    const passwordEncryptedChunks = await Promise.all(
      sessionEncrypted.chunks.map(async (chunk) => {
        const encrypted = await pqCrypto.encrypt(chunk.data, passwordKey!);
        return {
          ...chunk,
          data: encrypted.ciphertext,
          nonce: encrypted.nonce,
        };
      })
    );

    return {
      ...sessionEncrypted,
      chunks: passwordEncryptedChunks,
      passwordProtection,
    };
  } finally {
    // SECURITY: Always wipe key from memory
    if (passwordKey) {
      secureWipeBuffer(passwordKey);
    }
  }
}

/**
 * Decrypt password-protected file
 * Removes password layer first, then session key layer
 *
 * Automatically detects PBKDF2 vs Argon2id based on metadata
 */
export async function decryptPasswordProtectedFile(
  encryptedFile: PasswordProtectedFile,
  sessionKey: Uint8Array,
  password: string
): Promise<Blob> {
  if (!encryptedFile.passwordProtection) {
    // No password protection, just decrypt normally
    return decryptFile(encryptedFile, sessionKey);
  }

  let passwordKey: Uint8Array | null = null;

  try {
    // Derive password key using appropriate algorithm
    passwordKey = await deriveKeyWithMetadata(password, encryptedFile.passwordProtection);

    // First layer: Decrypt password protection
    const sessionEncryptedChunks = await Promise.all(
      encryptedFile.chunks.map(async (chunk) => {
        const decrypted = await pqCrypto.decrypt(
          {
            ciphertext: chunk.data,
            nonce: chunk.nonce,
          },
          passwordKey!
        );
        return {
          ...chunk,
          data: decrypted,
        };
      })
    );

    const sessionEncrypted: EncryptedFile = {
      ...encryptedFile,
      chunks: sessionEncryptedChunks,
    };

    // Second layer: Decrypt with session key
    return decryptFile(sessionEncrypted, sessionKey);
  } finally {
    // SECURITY: Always wipe key from memory
    if (passwordKey) {
      secureWipeBuffer(passwordKey);
    }
  }
}

/**
 * Encrypt file with password only (no session key)
 * Used for local storage or when PQC not needed
 *
 * Uses Argon2id for key derivation when available
 */
export async function encryptFilePasswordOnly(
  file: File,
  password: string,
  hint?: string
): Promise<PasswordProtectedFile> {
  let passwordKey: Uint8Array | null = null;

  try {
    // Generate salt
    const salt = generateSalt();

    // Create metadata with current KDF algorithm
    const passwordProtection = await createPasswordProtectionMetadata(salt, hint);

    // Derive key from password using Argon2id (or PBKDF2 fallback)
    passwordKey = await deriveKeyWithMetadata(password, passwordProtection);

    // Encrypt file with password key
    const encrypted = await encryptFile(file, passwordKey);

    return {
      ...encrypted,
      passwordProtection,
    };
  } finally {
    // SECURITY: Always wipe key from memory
    if (passwordKey) {
      secureWipeBuffer(passwordKey);
    }
  }
}

/**
 * Decrypt file encrypted with password only
 *
 * Automatically detects PBKDF2 vs Argon2id based on metadata
 */
export async function decryptFilePasswordOnly(
  encryptedFile: PasswordProtectedFile,
  password: string
): Promise<Blob> {
  if (!encryptedFile.passwordProtection) {
    throw new Error('File is not password protected');
  }

  let passwordKey: Uint8Array | null = null;

  try {
    // Derive key from password using appropriate algorithm
    passwordKey = await deriveKeyWithMetadata(password, encryptedFile.passwordProtection);

    // Decrypt file
    return decryptFile(encryptedFile, passwordKey);
  } finally {
    // SECURITY: Always wipe key from memory
    if (passwordKey) {
      secureWipeBuffer(passwordKey);
    }
  }
}

/**
 * Check if file is password protected
 */
export function isPasswordProtected(file: PasswordProtectedFile): boolean {
  return !!file.passwordProtection;
}

/**
 * Get password hint from encrypted file
 */
export function getPasswordHint(file: PasswordProtectedFile): string | undefined {
  return file.passwordProtection?.hint;
}

/**
 * Get the KDF algorithm used for a password-protected file
 */
export function getKDFAlgorithm(file: PasswordProtectedFile): KDFAlgorithm | undefined {
  if (!file.passwordProtection) {
    return undefined;
  }

  if ('kdfAlgorithm' in file.passwordProtection) {
    return file.passwordProtection.kdfAlgorithm;
  }

  // Legacy format
  return detectLegacyKDFAlgorithm(file.passwordProtection as LegacyPasswordProtection);
}

/**
 * Check if file uses Argon2id for key derivation
 */
export function usesArgon2id(file: PasswordProtectedFile): boolean {
  const algorithm = getKDFAlgorithm(file);
  return algorithm === KDF_ALGORITHM.ARGON2ID_V1;
}

/**
 * Re-encrypt file with upgraded KDF (migrate from PBKDF2 to Argon2id)
 * This is a security upgrade operation
 */
export async function upgradeToArgon2id(
  encryptedFile: PasswordProtectedFile,
  sessionKey: Uint8Array | null,
  currentPassword: string,
  newPassword?: string
): Promise<PasswordProtectedFile> {
  // First decrypt the file
  let decryptedBlob: Blob;

  if (sessionKey) {
    decryptedBlob = await decryptPasswordProtectedFile(encryptedFile, sessionKey, currentPassword);
  } else {
    decryptedBlob = await decryptFilePasswordOnly(encryptedFile, currentPassword);
  }

  // Convert blob to file
  const file = new File([decryptedBlob], 'upgraded-file', {
    type: encryptedFile.metadata?.mimeCategory || 'application/octet-stream',
  });

  // Re-encrypt with new password (or same password) using Argon2id
  const passwordToUse = newPassword ?? currentPassword;

  if (sessionKey) {
    return encryptFileWithPasswordLayer(
      file,
      sessionKey,
      passwordToUse,
      encryptedFile.passwordProtection?.hint
    );
  }

  return encryptFilePasswordOnly(
    file,
    passwordToUse,
    encryptedFile.passwordProtection?.hint
  );
}

export default {
  encryptFileWithPasswordLayer,
  decryptPasswordProtectedFile,
  encryptFilePasswordOnly,
  decryptFilePasswordOnly,
  isPasswordProtected,
  getPasswordHint,
  getKDFAlgorithm,
  usesArgon2id,
  upgradeToArgon2id,
};
