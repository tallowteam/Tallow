'use client';

/**
 * Signed Prekeys
 * 
 * Enables asynchronous messaging by pre-publishing signed keys.
 * Based on Signal's X3DH/PQXDH prekey system.
 * 
 * This allows sending to offline recipients:
 * 1. Bob publishes signed prekeys to a server
 * 2. Alice fetches Bob's prekeys and establishes session
 * 3. Alice sends encrypted message even though Bob is offline
 * 4. Bob decrypts when back online
 */

import { pqCrypto, HybridKeyPair, HybridPublicKey } from './pqc-crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Constants
// ============================================================================

const PREKEY_SIGNATURE_INFO = new TextEncoder().encode('tallow-prekey-sig-v1');
const PREKEY_ROTATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ONE_TIME_PREKEYS = 100;

// ============================================================================
// Types
// ============================================================================

export interface IdentityKeyPair {
    /** Ed25519 public key for signing */
    publicKey: Uint8Array;
    /** Ed25519 private key for signing */
    privateKey: Uint8Array;
}

export interface SignedPrekey {
    /** Unique prekey ID */
    keyId: number;
    /** The hybrid public key */
    publicKey: HybridPublicKey;
    /** Ed25519 signature over the public key */
    signature: Uint8Array;
    /** Creation timestamp */
    createdAt: number;
}

export interface SignedPrekeyPair {
    /** Public portion (can be uploaded to server) */
    public: SignedPrekey;
    /** Private keypair (keep secret) */
    private: HybridKeyPair;
}

export interface OneTimePrekey {
    /** Unique prekey ID */
    keyId: number;
    /** The hybrid public key */
    publicKey: HybridPublicKey;
}

export interface OneTimePrekeyPair {
    /** Public portion */
    public: OneTimePrekey;
    /** Private keypair */
    private: HybridKeyPair;
}

export interface PreKeyBundle {
    /** User's identity public key */
    identityKey: Uint8Array;
    /** Signed prekey */
    signedPrekey: SignedPrekey;
    /** Optional one-time prekey (for forward secrecy) */
    oneTimePrekey?: OneTimePrekey;
}

export interface PrekeyStore {
    /** Current signed prekey */
    signedPrekey: SignedPrekeyPair;
    /** Previous signed prekey (for transition period) */
    previousSignedPrekey?: SignedPrekeyPair;
    /** Pool of one-time prekeys */
    oneTimePrekeys: OneTimePrekeyPair[];
    /** Next prekey ID */
    nextKeyId: number;
}

// ============================================================================
// Identity Key Management
// ============================================================================

/**
 * Generate a new identity keypair
 * This is a long-term key that identifies the user
 */
export function generateIdentityKeyPair(): IdentityKeyPair {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return { publicKey, privateKey };
}

/**
 * Get identity public key fingerprint for display
 */
export function getIdentityFingerprint(publicKey: Uint8Array): string {
    const hash = sha256(publicKey);
    // Format as 8 groups of 4 hex chars for easy comparison
    const hex = Array.from(hash.slice(0, 16))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return hex.match(/.{4}/g)!.join(' ').toUpperCase();
}

// ============================================================================
// Signed Prekey Management
// ============================================================================

/**
 * Generate a new signed prekey
 */
export async function generateSignedPrekey(
    identityKey: IdentityKeyPair,
    keyId: number
): Promise<SignedPrekeyPair> {
    // Generate hybrid keypair
    const keyPair = await pqCrypto.generateHybridKeypair();
    const publicKey = pqCrypto.getPublicKey(keyPair);

    // Serialize public key for signing
    const serializedPublicKey = pqCrypto.serializePublicKey(publicKey);

    // Sign with identity key
    const signature = ed25519.sign(serializedPublicKey, identityKey.privateKey);

    const signedPrekey: SignedPrekey = {
        keyId,
        publicKey,
        signature,
        createdAt: Date.now(),
    };

    return {
        public: signedPrekey,
        private: keyPair,
    };
}

/**
 * Verify a signed prekey
 */
export function verifySignedPrekey(
    signedPrekey: SignedPrekey,
    identityPublicKey: Uint8Array
): boolean {
    const serializedPublicKey = pqCrypto.serializePublicKey(signedPrekey.publicKey);
    return ed25519.verify(signedPrekey.signature, serializedPublicKey, identityPublicKey);
}

/**
 * Check if signed prekey needs rotation
 */
export function shouldRotateSignedPrekey(signedPrekey: SignedPrekey): boolean {
    const age = Date.now() - signedPrekey.createdAt;
    return age > PREKEY_ROTATION_INTERVAL_MS;
}

// ============================================================================
// One-Time Prekey Management
// ============================================================================

/**
 * Generate a batch of one-time prekeys
 */
export async function generateOneTimePrekeys(
    startKeyId: number,
    count: number
): Promise<OneTimePrekeyPair[]> {
    const prekeys: OneTimePrekeyPair[] = [];

    for (let i = 0; i < count; i++) {
        const keyPair = await pqCrypto.generateHybridKeypair();
        const publicKey = pqCrypto.getPublicKey(keyPair);

        prekeys.push({
            public: {
                keyId: startKeyId + i,
                publicKey,
            },
            private: keyPair,
        });
    }

    return prekeys;
}

/**
 * Use and remove a one-time prekey
 */
export function consumeOneTimePrekey(
    store: PrekeyStore,
    keyId: number
): HybridKeyPair | null {
    const index = store.oneTimePrekeys.findIndex(pk => pk.public.keyId === keyId);
    if (index === -1) return null;

    const [prekey] = store.oneTimePrekeys.splice(index, 1);
    return prekey.private;
}

// ============================================================================
// Prekey Store Management
// ============================================================================

/**
 * Initialize a new prekey store
 */
export async function initializePrekeyStore(
    identityKey: IdentityKeyPair
): Promise<PrekeyStore> {
    // Generate initial signed prekey
    const signedPrekey = await generateSignedPrekey(identityKey, 1);

    // Generate initial batch of one-time prekeys
    const oneTimePrekeys = await generateOneTimePrekeys(1, MAX_ONE_TIME_PREKEYS);

    return {
        signedPrekey,
        oneTimePrekeys,
        nextKeyId: MAX_ONE_TIME_PREKEYS + 2, // +1 for signed prekey, +1 for next
    };
}

/**
 * Rotate signed prekey if needed
 */
export async function rotateSignedPrekeyIfNeeded(
    store: PrekeyStore,
    identityKey: IdentityKeyPair
): Promise<boolean> {
    if (!shouldRotateSignedPrekey(store.signedPrekey.public)) {
        return false;
    }

    // Keep previous for transition
    store.previousSignedPrekey = store.signedPrekey;

    // Generate new signed prekey
    store.signedPrekey = await generateSignedPrekey(identityKey, store.nextKeyId++);

    return true;
}

/**
 * Replenish one-time prekeys if running low
 */
export async function replenishOneTimePrekeysIfNeeded(
    store: PrekeyStore,
    threshold: number = 20
): Promise<number> {
    if (store.oneTimePrekeys.length >= threshold) {
        return 0;
    }

    const needed = MAX_ONE_TIME_PREKEYS - store.oneTimePrekeys.length;
    const newPrekeys = await generateOneTimePrekeys(store.nextKeyId, needed);
    store.nextKeyId += needed;
    store.oneTimePrekeys.push(...newPrekeys);

    return needed;
}

/**
 * Get prekey bundle for publishing to server
 */
export function getPublicPrekeyBundle(
    identityPublicKey: Uint8Array,
    store: PrekeyStore
): PreKeyBundle {
    // Get the oldest one-time prekey (if available)
    const oneTimePrekey = store.oneTimePrekeys.length > 0
        ? store.oneTimePrekeys[0].public
        : undefined;

    return {
        identityKey: identityPublicKey,
        signedPrekey: store.signedPrekey.public,
        oneTimePrekey,
    };
}

// ============================================================================
// Session Establishment
// ============================================================================

/**
 * Establish session as initiator (Alice) using peer's prekey bundle
 */
export async function establishSessionAsInitiator(
    ourIdentityKey: IdentityKeyPair,
    peerBundle: PreKeyBundle
): Promise<{
    sharedSecret: Uint8Array;
    ephemeralPublicKey: HybridPublicKey;
    usedOneTimePrekey: boolean;
}> {
    // Verify signed prekey
    if (!verifySignedPrekey(peerBundle.signedPrekey, peerBundle.identityKey)) {
        throw new Error('Invalid signed prekey signature');
    }

    // Encapsulate to signed prekey
    const signedResult = await pqCrypto.encapsulate(peerBundle.signedPrekey.publicKey);

    // Optionally encapsulate to one-time prekey for additional forward secrecy
    let oneTimeSecret: Uint8Array | null = null;
    if (peerBundle.oneTimePrekey) {
        const otResult = await pqCrypto.encapsulate(peerBundle.oneTimePrekey.publicKey);
        oneTimeSecret = otResult.sharedSecret;
    }

    // Combine secrets
    const combinedLength = signedResult.sharedSecret.length + (oneTimeSecret?.length || 0);
    const combined = new Uint8Array(combinedLength);
    combined.set(signedResult.sharedSecret, 0);
    if (oneTimeSecret) {
        combined.set(oneTimeSecret, signedResult.sharedSecret.length);
    }

    // Generate our ephemeral keypair for Double Ratchet
    const ephemeralKeyPair = await pqCrypto.generateHybridKeypair();

    return {
        sharedSecret: sha256(combined),
        ephemeralPublicKey: pqCrypto.getPublicKey(ephemeralKeyPair),
        usedOneTimePrekey: !!peerBundle.oneTimePrekey,
    };
}

/**
 * Establish session as responder (Bob) using stored prekeys
 */
export async function establishSessionAsResponder(
    store: PrekeyStore,
    signedPrekeyId: number,
    oneTimePrekeyId?: number
): Promise<{
    signedPrekey: HybridKeyPair;
    oneTimePrekey?: HybridKeyPair;
}> {
    // Find signed prekey
    let signedPrekey: HybridKeyPair;
    if (store.signedPrekey.public.keyId === signedPrekeyId) {
        signedPrekey = store.signedPrekey.private;
    } else if (store.previousSignedPrekey?.public.keyId === signedPrekeyId) {
        signedPrekey = store.previousSignedPrekey.private;
    } else {
        throw new Error('Signed prekey not found');
    }

    // Find and consume one-time prekey if specified
    let oneTimePrekey: HybridKeyPair | undefined;
    if (oneTimePrekeyId !== undefined) {
        const otpk = consumeOneTimePrekey(store, oneTimePrekeyId);
        if (!otpk) {
            secureLog.warn('One-time prekey not found, continuing without it');
        } else {
            oneTimePrekey = otpk;
        }
    }

    return { signedPrekey, oneTimePrekey };
}

// ============================================================================
// Secure Deletion
// ============================================================================

/**
 * Securely delete a prekey pair
 */
export function secureDeletePrekeyPair(keyPair: HybridKeyPair): void {
    secureWipe(keyPair.kyber.secretKey);
    secureWipe(keyPair.x25519.privateKey);
}

function secureWipe(data: Uint8Array): void {
    if (!data) return;
    try {
        const random = crypto.getRandomValues(new Uint8Array(data.length));
        for (let i = 0; i < data.length; i++) {
            data[i] = random[i];
        }
        data.fill(0);
    } catch {
        data.fill(0);
    }
}

// ============================================================================
// Export
// ============================================================================

export default {
    generateIdentityKeyPair,
    getIdentityFingerprint,
    generateSignedPrekey,
    verifySignedPrekey,
    generateOneTimePrekeys,
    initializePrekeyStore,
    rotateSignedPrekeyIfNeeded,
    replenishOneTimePrekeysIfNeeded,
    getPublicPrekeyBundle,
    establishSessionAsInitiator,
    establishSessionAsResponder,
};
