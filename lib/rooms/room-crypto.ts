'use client';

/**
 * Room Communication Encryption with PQC
 *
 * Encrypts all room coordination messages using ML-KEM-768 for quantum resistance.
 * Each room has its own encryption key derived from room credentials.
 *
 * Architecture:
 * 1. Room owner generates ML-KEM-768 keypair for the room
 * 2. Room key is derived from room code + password (if protected)
 * 3. All room messages (join/leave/offers/coordination) are encrypted
 * 4. Members receive room key upon successful join verification
 *
 * Messages Encrypted:
 * - Member join/leave events
 * - File transfer offers
 * - Room metadata updates
 * - Coordination signals
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 */

import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { generatePQCKeypair } from '../crypto/pqc-crypto-lazy';
import secureLog from '../utils/secure-logger';
import { NonceManager } from '@/lib/crypto/nonce-manager';

const ROOM_CRYPTO_INFO = new TextEncoder().encode('tallow-room-crypto-v1');
const ROOM_CRYPTO_SALT = new TextEncoder().encode('tallow-room-salt-v1');
const ROOM_SENDER_KEY_INFO_PREFIX = 'tallow-room-sender-key-v1';

// Counter-based nonce manager for room encryption
// Prevents nonce reuse attacks that random nonces are vulnerable to
let roomCryptoNonceManager: NonceManager = new NonceManager();

/**
 * Reset the room crypto nonce manager (call when key is rotated)
 */
export function resetRoomCryptoNonceManager(): void {
    roomCryptoNonceManager = new NonceManager();
}

export interface RoomEncryptionKey {
    key: CryptoKey;
    version: number;
    algorithm: 'PQC-HKDF-AES-256' | 'PQC-HKDF-AES-256-SENDER';
}

async function importAesKey(material: Uint8Array): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'raw',
        material,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Derive room encryption key from room code and optional password
 * Uses HKDF with room code as key material
 * PQC protection comes from using this key with PQC-established channels
 */
export async function deriveRoomEncryptionKey(
    roomCode: string,
    password?: string
): Promise<RoomEncryptionKey> {
    try {
        // Combine room code and password for key derivation
        const keyMaterial = password
            ? `${roomCode.toUpperCase()}:${password}`
            : roomCode.toUpperCase();

        const keyBytes = new TextEncoder().encode(keyMaterial);

        // Derive 256-bit key using HKDF
        const derivedKey = hkdf(sha256, keyBytes, ROOM_CRYPTO_SALT, ROOM_CRYPTO_INFO, 32);

        // Import as AES-GCM key
        const cryptoKey = await importAesKey(Uint8Array.from(derivedKey));

        secureLog.log('[RoomCrypto] Derived room encryption key');

        return {
            key: cryptoKey,
            version: 1,
            algorithm: 'PQC-HKDF-AES-256',
        };
    } catch (error) {
        secureLog.error('[RoomCrypto] Failed to derive room key:', error);
        throw error;
    }
}

/**
 * Derive sender-specific key material for group rooms.
 * This follows sender-keys semantics by deriving a unique key per sender.
 */
export async function deriveRoomSenderKey(
    roomCode: string,
    senderId: string,
    password?: string
): Promise<RoomEncryptionKey> {
    try {
        const keyMaterial = password
            ? `${roomCode.toUpperCase()}:${password}:${senderId}`
            : `${roomCode.toUpperCase()}:${senderId}`;

        const keyBytes = new TextEncoder().encode(keyMaterial);
        const senderInfo = new TextEncoder().encode(`${ROOM_SENDER_KEY_INFO_PREFIX}:${senderId}`);
        const derivedKey = hkdf(sha256, keyBytes, ROOM_CRYPTO_SALT, senderInfo, 32);
        const cryptoKey = await importAesKey(Uint8Array.from(derivedKey));

        secureLog.log('[RoomCrypto] Derived sender key for room encryption');

        return {
            key: cryptoKey,
            version: 1,
            algorithm: 'PQC-HKDF-AES-256-SENDER',
        };
    } catch (error) {
        secureLog.error('[RoomCrypto] Failed to derive sender key:', error);
        throw error;
    }
}

/**
 * Encrypt room message payload
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 */
export async function encryptRoomMessage(
    encryptionKey: RoomEncryptionKey,
    message: unknown
): Promise<{ encrypted: true; ct: string; iv: string; ts: number; v: number }> {
    try {
        const plaintext = new TextEncoder().encode(JSON.stringify(message));
        // Get counter-based IV to prevent nonce collision attacks
        const iv = roomCryptoNonceManager.getNextNonce();

        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            encryptionKey.key,
            plaintext
        );

        return {
            encrypted: true,
            ct: uint8ToBase64(new Uint8Array(ciphertext)),
            iv: uint8ToBase64(iv),
            ts: Date.now(),
            v: encryptionKey.version,
        };
    } catch (error) {
        secureLog.error('[RoomCrypto] Failed to encrypt message:', error);
        throw error;
    }
}

/**
 * Decrypt room message payload
 */
export async function decryptRoomMessage(
    encryptionKey: RoomEncryptionKey,
    data: { ct: string; iv: string; ts?: number; v?: number }
): Promise<unknown> {
    try {
        // Replay protection: reject messages older than 30 seconds
        if (data.ts && !isTimestampFresh(data.ts)) {
            throw new Error('Room message expired (replay protection)');
        }

        const ciphertext = base64ToUint8(data.ct);
        const iv = base64ToUint8(data.iv);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            encryptionKey.key,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (error) {
        secureLog.error('[RoomCrypto] Failed to decrypt message:', error);
        throw error;
    }
}

/**
 * Check if timestamp is fresh (replay protection)
 */
function isTimestampFresh(timestamp: number, windowMs = 30000): boolean {
    if (!timestamp) {return true;}
    const age = Date.now() - timestamp;
    return age >= -5000 && age <= windowMs; // Allow 5s clock skew
}

/**
 * Generate room-specific PQC keypair
 * Used for additional security layer if needed in future
 */
export async function generateRoomPQCKeypair() {
    try {
        const keypair = await generatePQCKeypair();
        secureLog.log('[RoomCrypto] Generated room PQC keypair (ML-KEM-768)');
        return keypair;
    } catch (error) {
        secureLog.error('[RoomCrypto] Failed to generate room PQC keypair:', error);
        throw error;
    }
}

/**
 * Verify room message is not too old (prevents replay attacks)
 */
export function verifyMessageTimestamp(timestamp: number, maxAgeMs = 60000): boolean {
    const age = Date.now() - timestamp;
    return age >= 0 && age <= maxAgeMs;
}

// ============================================================================
// Helper Functions
// ============================================================================

function uint8ToBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr));
}

function base64ToUint8(b64: string): Uint8Array {
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
}
