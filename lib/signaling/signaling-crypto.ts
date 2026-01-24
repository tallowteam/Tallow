'use client';

/**
 * Signaling Channel Encryption
 * Encrypts WebRTC signaling payloads using a key derived from the connection code.
 * Both peers know the code, so both can derive the same key.
 * The signaling server only sees encrypted blobs.
 */

import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

const SIGNALING_INFO = new TextEncoder().encode('tallow-signaling-v1');
const SIGNALING_SALT = new TextEncoder().encode('tallow-signaling-salt-v1');

/**
 * Derive an AES-256-GCM key from a connection code using HKDF.
 */
export async function deriveSignalingKey(connectionCode: string): Promise<CryptoKey> {
    const codeBytes = new TextEncoder().encode(connectionCode.toLowerCase().trim());
    const keyMaterial = hkdf(sha256, codeBytes, SIGNALING_SALT, SIGNALING_INFO, 32);

    // Copy to a fresh ArrayBuffer (noble/hashes returns Uint8Array<ArrayBufferLike>)
    const keyBytes = Uint8Array.from(keyMaterial);
    return await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a signaling payload (JSON-serializable object)
 */
export async function encryptSignalingPayload(
    key: CryptoKey,
    payload: unknown
): Promise<{ encrypted: true; ct: string; iv: string; ts: number }> {
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
    );

    return {
        encrypted: true,
        ct: uint8ToBase64(new Uint8Array(ciphertext)),
        iv: uint8ToBase64(iv),
        ts: Date.now(),
    };
}

/**
 * Decrypt a signaling payload
 */
export async function decryptSignalingPayload(
    key: CryptoKey,
    data: { ct: string; iv: string; ts?: number }
): Promise<unknown> {
    // Replay protection: reject messages older than 30 seconds
    if (data.ts && !isTimestampFresh(data.ts)) {
        throw new Error('Signaling message expired (replay protection)');
    }

    const ciphertext = base64ToUint8(data.ct);
    const iv = base64ToUint8(data.iv);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Check if a timestamp is within the acceptable replay window
 */
export function isTimestampFresh(timestamp: number, windowMs = 30000): boolean {
    if (!timestamp) return true; // Backward compat with old clients
    const age = Date.now() - timestamp;
    return age >= -5000 && age <= windowMs; // Allow 5s clock skew
}

// Helpers
function uint8ToBase64(arr: Uint8Array<ArrayBuffer>): string {
    return btoa(String.fromCharCode(...arr));
}

function base64ToUint8(b64: string): Uint8Array<ArrayBuffer> {
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
}
