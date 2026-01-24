'use client';

/**
 * @deprecated Use `lib/crypto/file-encryption-pqc.ts` instead.
 * This module provides classical AES-256-GCM file encryption as a legacy fallback.
 * New code should use the PQC-enhanced file encryption service.
 *
 * File Encryption Utilities
 * AES-256-GCM encryption for secure file transfers
 */

// Convert Uint8Array to ArrayBuffer for Web Crypto API compatibility
function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

// Derive a key from password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(passwordBuffer),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: toArrayBuffer(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Generate random bytes
function randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Encrypt file data with a password
 * Returns encrypted blob with salt and IV prepended
 */
export async function encryptFileWithPassword(
    data: ArrayBuffer,
    password: string
): Promise<ArrayBuffer> {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv) },
        key,
        data
    );

    // Combine: salt (16) + iv (12) + encrypted data
    const result = new Uint8Array(16 + 12 + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, 16);
    result.set(new Uint8Array(encrypted), 28);

    return result.buffer;
}

/**
 * Decrypt file data with a password
 * Expects salt and IV prepended to encrypted data
 */
export async function decryptFileWithPassword(
    encryptedData: ArrayBuffer,
    password: string
): Promise<ArrayBuffer> {
    const data = new Uint8Array(encryptedData);

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    const key = await deriveKey(password, salt);

    return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv) },
        key,
        toArrayBuffer(encrypted)
    );
}

/**
 * Encrypt a Blob with password
 */
export async function encryptBlobWithPassword(
    blob: Blob,
    password: string
): Promise<Blob> {
    const data = await blob.arrayBuffer();
    const encrypted = await encryptFileWithPassword(data, password);
    return new Blob([encrypted], { type: 'application/octet-stream' });
}

/**
 * Decrypt a Blob with password
 */
export async function decryptBlobWithPassword(
    encryptedBlob: Blob,
    password: string,
    originalType: string = 'application/octet-stream'
): Promise<Blob> {
    const data = await encryptedBlob.arrayBuffer();
    const decrypted = await decryptFileWithPassword(data, password);
    return new Blob([decrypted], { type: originalType });
}

/**
 * Check if decryption password is correct
 * Attempts decryption and returns true if successful
 */
export async function verifyPassword(
    encryptedData: ArrayBuffer,
    password: string
): Promise<boolean> {
    try {
        await decryptFileWithPassword(encryptedData, password);
        return true;
    } catch {
        return false;
    }
}

export default {
    encryptFileWithPassword,
    decryptFileWithPassword,
    encryptBlobWithPassword,
    decryptBlobWithPassword,
    verifyPassword,
};
