'use client';

/**
 * PQC-Enhanced Signaling Channel Encryption
 *
 * Upgrades signaling to use ML-KEM-768 (Kyber) for quantum-resistant key encapsulation.
 * Maintains backward compatibility with HKDF-only clients.
 *
 * Architecture:
 * 1. Peer A generates ML-KEM-768 keypair
 * 2. Peer A shares public key via connection code or metadata
 * 3. Peer B encapsulates shared secret using Peer A's public key
 * 4. Both derive AES-256-GCM key from PQC shared secret
 * 5. All signaling messages encrypted with derived key
 *
 * Backward Compatibility:
 * - Detects client PQC support via protocol version
 * - Falls back to HKDF-only for legacy clients
 * - Negotiates highest supported security level
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 */

import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { generatePQCKeypair, encapsulateSecret, decapsulateSecret } from '../crypto/pqc-crypto-lazy';
import secureLog from '../utils/secure-logger';
import { NonceManager } from '@/lib/crypto/nonce-manager';

const SIGNALING_INFO = new TextEncoder().encode('tallow-signaling-pqc-v2');
const SIGNALING_SALT = new TextEncoder().encode('tallow-signaling-salt-pqc-v2');
const PROTOCOL_VERSION = 2; // v2 = PQC support

// Counter-based nonce manager for PQC signaling encryption
// Prevents nonce reuse attacks that random nonces are vulnerable to
let pqcSignalingNonceManager: NonceManager = new NonceManager();

/**
 * Reset the PQC signaling nonce manager (call when key is rotated)
 */
export function resetPQCSignalingNonceManager(): void {
    pqcSignalingNonceManager = new NonceManager();
}

export interface PQCSignalingKeyMaterial {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    version: number;
}

export interface PQCSignalingSession {
    key: CryptoKey;
    version: number;
    algorithm: 'PQC-ML-KEM-768' | 'HKDF-AES-256';
}

/**
 * Generate PQC keypair for signaling
 * Peer A calls this to create their signaling keypair
 */
export async function generatePQCSignalingKeypair(): Promise<PQCSignalingKeyMaterial> {
    try {
        const keypair = await generatePQCKeypair();

        secureLog.log('[PQC-Signaling] Generated ML-KEM-768 keypair');

        return {
            publicKey: keypair.publicKey,
            secretKey: keypair.secretKey,
            version: PROTOCOL_VERSION,
        };
    } catch (error) {
        secureLog.error('[PQC-Signaling] Failed to generate keypair:', error);
        throw error;
    }
}

/**
 * Derive signaling key using PQC (Initiator - Peer A)
 * Called by the peer who generated the keypair
 */
export async function derivePQCSignalingKeyAsInitiator(
    keyMaterial: PQCSignalingKeyMaterial,
    encapsulatedSecret: Uint8Array
): Promise<PQCSignalingSession> {
    try {
        // Decapsulate the shared secret
        const sharedSecret = await decapsulateSecret(encapsulatedSecret, keyMaterial.secretKey);

        // Derive AES-256 key from shared secret using HKDF
        const aesKeyBytes = hkdf(sha256, sharedSecret, SIGNALING_SALT, SIGNALING_INFO, 32);

        // Import as CryptoKey
        const key = await crypto.subtle.importKey(
            'raw',
            Uint8Array.from(aesKeyBytes),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );

        secureLog.log('[PQC-Signaling] Derived signaling key (initiator) using ML-KEM-768');

        return {
            key,
            version: PROTOCOL_VERSION,
            algorithm: 'PQC-ML-KEM-768',
        };
    } catch (error) {
        secureLog.error('[PQC-Signaling] Failed to derive key (initiator):', error);
        throw error;
    }
}

/**
 * Derive signaling key using PQC (Responder - Peer B)
 * Called by the peer who receives the public key
 */
export async function derivePQCSignalingKeyAsResponder(
    publicKey: Uint8Array
): Promise<{ session: PQCSignalingSession; encapsulatedSecret: Uint8Array }> {
    try {
        // Encapsulate shared secret using peer's public key
        const { sharedSecret, ciphertext: encapsulatedSecret } = await encapsulateSecret(publicKey);

        // Derive AES-256 key from shared secret using HKDF
        const aesKeyBytes = hkdf(sha256, sharedSecret, SIGNALING_SALT, SIGNALING_INFO, 32);

        // Import as CryptoKey
        const key = await crypto.subtle.importKey(
            'raw',
            Uint8Array.from(aesKeyBytes),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );

        secureLog.log('[PQC-Signaling] Derived signaling key (responder) using ML-KEM-768');

        return {
            session: {
                key,
                version: PROTOCOL_VERSION,
                algorithm: 'PQC-ML-KEM-768',
            },
            encapsulatedSecret,
        };
    } catch (error) {
        secureLog.error('[PQC-Signaling] Failed to derive key (responder):', error);
        throw error;
    }
}

/**
 * Legacy: Derive signaling key using HKDF only (backward compatibility)
 * Used when peer doesn't support PQC or for fallback
 */
export async function deriveLegacySignalingKey(connectionCode: string): Promise<PQCSignalingSession> {
    const codeBytes = new TextEncoder().encode(connectionCode.toLowerCase().trim());
    const keyMaterial = hkdf(sha256, codeBytes, SIGNALING_SALT, SIGNALING_INFO, 32);

    const key = await crypto.subtle.importKey(
        'raw',
        Uint8Array.from(keyMaterial),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    secureLog.log('[PQC-Signaling] Derived signaling key (legacy HKDF)');

    return {
        key,
        version: 1, // Legacy version
        algorithm: 'HKDF-AES-256',
    };
}

/**
 * Encrypt signaling payload with PQC-derived key
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 */
export async function encryptPQCSignalingPayload(
    session: PQCSignalingSession,
    payload: unknown
): Promise<{ encrypted: true; ct: string; iv: string; ts: number; v: number }> {
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    // Get counter-based IV to prevent nonce collision attacks
    const iv = pqcSignalingNonceManager.getNextNonce();

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        session.key,
        plaintext
    );

    return {
        encrypted: true,
        ct: uint8ToBase64(new Uint8Array(ciphertext)),
        iv: uint8ToBase64(iv),
        ts: Date.now(),
        v: session.version, // Protocol version for negotiation
    };
}

/**
 * Decrypt signaling payload with PQC-derived key
 */
export async function decryptPQCSignalingPayload(
    session: PQCSignalingSession,
    data: { ct: string; iv: string; ts?: number; v?: number }
): Promise<unknown> {
    // Replay protection: reject messages older than 30 seconds
    if (data.ts && !isTimestampFresh(data.ts)) {
        throw new Error('Signaling message expired (replay protection)');
    }

    // Version check (optional - for debugging)
    if (data.v && data.v !== session.version) {
        secureLog.warn(`[PQC-Signaling] Version mismatch: got ${data.v}, expected ${session.version}`);
    }

    const ciphertext = base64ToUint8(data.ct);
    const iv = base64ToUint8(data.iv);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        session.key,
        ciphertext
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Negotiate highest supported protocol version
 * Returns version both peers support
 */
export function negotiateProtocolVersion(
    localVersion: number,
    remoteVersion: number
): { version: number; usePQC: boolean } {
    const version = Math.min(localVersion, remoteVersion);
    const usePQC = version >= 2;

    secureLog.log(`[PQC-Signaling] Negotiated protocol v${version} (PQC: ${usePQC})`);

    return { version, usePQC };
}

/**
 * Check if timestamp is fresh (replay protection)
 */
export function isTimestampFresh(timestamp: number, windowMs = 30000): boolean {
    if (!timestamp) {return true;} // Backward compat
    const age = Date.now() - timestamp;
    return age >= -5000 && age <= windowMs; // Allow 5s clock skew
}

/**
 * Serialize public key for transmission
 * Can be embedded in QR code, connection code metadata, or signaling message
 */
export function serializePublicKey(publicKey: Uint8Array): string {
    return uint8ToBase64(publicKey);
}

/**
 * Deserialize public key from transmission
 */
export function deserializePublicKey(serialized: string): Uint8Array {
    return base64ToUint8(serialized);
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
