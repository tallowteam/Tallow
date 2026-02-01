/**
 * Password Protection for Email File Transfers
 * Uses AES-256-GCM for encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import type { PasswordProtectedDownload } from './types';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Derive encryption key from password using scrypt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH);
}

/**
 * Encrypt file data with password
 */
export function encryptWithPassword(
  data: Buffer,
  password: string
): PasswordProtectedDownload {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from password
  const key = deriveKey(password, salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  return {
    transferId: randomBytes(16).toString('hex'),
    encryptedData: encrypted.toString('base64'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt file data with password
 */
export function decryptWithPassword(
  protectedDownload: PasswordProtectedDownload,
  password: string
): Buffer {
  try {
    // Parse hex strings
    const salt = Buffer.from(protectedDownload.salt, 'hex');
    const iv = Buffer.from(protectedDownload.iv, 'hex');
    const authTag = Buffer.from(protectedDownload.authTag, 'hex');
    const encryptedData = Buffer.from(protectedDownload.encryptedData, 'base64');

    // Derive key
    const key = deriveKey(password, salt);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decrypted;
  } catch (_error) {
    throw new Error('Invalid password or corrupted data');
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
} {
  const issues: string[] = [];

  // Minimum length
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }

  // Check complexity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let strengthScore = 0;
  if (hasUppercase) {strengthScore++;}
  if (hasLowercase) {strengthScore++;}
  if (hasNumbers) {strengthScore++;}
  if (hasSpecial) {strengthScore++;}
  if (password.length >= 12) {strengthScore++;}

  let strength: 'weak' | 'medium' | 'strong';
  if (strengthScore < 2) {
    strength = 'weak';
    issues.push('Use a mix of uppercase, lowercase, numbers, and special characters');
  } else if (strengthScore < 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('This is a commonly used password');
    strength = 'weak';
  }

  return {
    valid: issues.length === 0,
    strength,
    issues,
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytesBuffer = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    const byte = randomBytesBuffer[i];
    if (byte !== undefined) {
      password += charset[byte % charset.length];
    }
  }

  // Ensure password has required character types
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecial) {
    // Regenerate if missing required types
    return generateSecurePassword(length);
  }

  return password;
}

/**
 * Hash password for storage (not for encryption!)
 * Used for verifying password attempts
 */
export function hashPasswordForStorage(password: string): {
  hash: string;
  salt: string;
} {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, 64); // Longer hash for storage

  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex'),
  };
}

/**
 * Verify password against stored hash
 */
export function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): boolean {
  const salt = Buffer.from(storedSalt, 'hex');
  const hash = scryptSync(password, salt, 64);

  return hash.toString('hex') === storedHash;
}

export default {
  encryptWithPassword,
  decryptWithPassword,
  validatePasswordStrength,
  generateSecurePassword,
  hashPasswordForStorage,
  verifyPassword,
};
