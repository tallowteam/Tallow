'use client';

/**
 * Encryption Module
 * Provides end-to-end encryption using Web Crypto API
 */

// Encryption algorithm configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );
}

/**
 * Generate a key pair for key exchange (ECDH)
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Export a public key to JWK format for transmission
 */
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
    return await crypto.subtle.exportKey('jwk', key);
}

/**
 * Import a public key from JWK format
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        []
    );
}

/**
 * Derive a shared encryption key from ECDH key pair
 */
export async function deriveSharedKey(
    privateKey: CryptoKey,
    publicKey: CryptoKey
): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey,
        },
        privateKey,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Export a symmetric key to raw format
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey('raw', key);
}

/**
 * Import a symmetric key from raw format
 */
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data with AES-GCM
 */
export async function encrypt(
    data: ArrayBuffer,
    key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array<ArrayBuffer> }> {
    const iv = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(iv);

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv: iv as Uint8Array<ArrayBuffer>,
        },
        key,
        data
    );

    return { ciphertext, iv: iv as Uint8Array<ArrayBuffer> };
}

/**
 * Decrypt data with AES-GCM
 */
export async function decrypt(
    ciphertext: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array<ArrayBuffer>
): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
        {
            name: ALGORITHM,
            iv: iv,
        },
        key,
        ciphertext
    );
}

/**
 * Encrypt a file in chunks
 */
export async function encryptFile(
    file: File,
    key: CryptoKey,
    chunkSize: number = 64 * 1024,
    onProgress?: (progress: number) => void
): Promise<{ encryptedChunks: ArrayBuffer[]; ivs: Uint8Array<ArrayBuffer>[] }> {
    const encryptedChunks: ArrayBuffer[] = [];
    const ivs: Uint8Array<ArrayBuffer>[] = [];
    const totalChunks = Math.ceil(file.size / chunkSize);
    let processedChunks = 0;

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const data = await chunk.arrayBuffer();

        const { ciphertext, iv } = await encrypt(data, key);
        encryptedChunks.push(ciphertext);
        ivs.push(iv);

        processedChunks++;
        onProgress?.((processedChunks / totalChunks) * 100);
    }

    return { encryptedChunks, ivs };
}

/**
 * Decrypt file chunks
 */
export async function decryptChunks(
    chunks: ArrayBuffer[],
    ivs: Uint8Array<ArrayBuffer>[],
    key: CryptoKey,
    onProgress?: (progress: number) => void
): Promise<ArrayBuffer[]> {
    const decryptedChunks: ArrayBuffer[] = [];
    const totalChunks = chunks.length;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
        const decrypted = await decrypt(chunks[i], key, ivs[i]);
        decryptedChunks.push(decrypted);

        processedChunks++;
        onProgress?.((processedChunks / totalChunks) * 100);
    }

    return decryptedChunks;
}

/**
 * Hash data using SHA-256
 */
export async function hash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a file for integrity verification
 */
export async function hashFile(
    file: File,
    chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<string> {
    // For small files, hash directly
    if (file.size <= chunkSize) {
        const data = await file.arrayBuffer();
        return hash(data);
    }

    // For large files, we need to use incremental hashing
    // Since Web Crypto API doesn't support streaming, we'll hash chunks and combine
    const hashes: string[] = [];

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const data = await chunk.arrayBuffer();
        const chunkHash = await hash(data);
        hashes.push(chunkHash);
    }

    // Combine chunk hashes
    const encoder = new TextEncoder();
    const encodedHashes = encoder.encode(hashes.join(''));
    const combinedHash = await hash(encodedHashes.buffer.slice(0) as ArrayBuffer);
    return combinedHash;
}

/**
 * Generate a secure password/PIN
 */
export function generateSecureCode(length: number = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(byte => chars[byte % chars.length])
        .join('');
}

/**
 * Derive a key from a password
 */
export async function deriveKeyFromPassword(
    password: string,
    salt?: Uint8Array<ArrayBuffer>
): Promise<{ key: CryptoKey; salt: Uint8Array<ArrayBuffer> }> {
    // Generate salt if not provided
    let saltBuffer: Uint8Array<ArrayBuffer>;
    if (!salt) {
        saltBuffer = new Uint8Array(16) as Uint8Array<ArrayBuffer>;
        crypto.getRandomValues(saltBuffer);
    } else {
        saltBuffer = salt;
    }

    // Import password as key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive the actual encryption key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );

    return { key, salt: saltBuffer };
}

export default {
    generateKey,
    generateKeyPair,
    exportPublicKey,
    importPublicKey,
    deriveSharedKey,
    encrypt,
    decrypt,
    encryptFile,
    decryptChunks,
    hash,
    hashFile,
    generateSecureCode,
    deriveKeyFromPassword,
};
