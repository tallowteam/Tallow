'use client';

/**
 * Ephemeral Key Management Module
 * 
 * Implements secure key rotation with Double Ratchet protocol
 * for forward secrecy and post-compromise security.
 * 
 * SECURITY IMPACT: 10 | PRIVACY IMPACT: 8
 * PRIORITY: CRITICAL
 */

import { pqCrypto, HybridKeyPair, HybridPublicKey } from './pqc-crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SessionKeyPair {
    id: string;
    keyPair: HybridKeyPair;
    createdAt: number;
    expiresAt: number;
    messageCount: number;
}

export interface RatchetState {
    rootKey: Uint8Array;
    sendChainKey: Uint8Array;
    receiveChainKey: Uint8Array;
    sendMessageNumber: number;
    receiveMessageNumber: number;
    previousChainLength: number;
    dhRatchetKeyPair: HybridKeyPair;
    peerPublicKey: HybridPublicKey | null;
}

export interface MessageKey {
    key: Uint8Array;
    index: number;
}

export interface SkippedMessageKey {
    publicKeyHash: string;
    messageNumber: number;
    messageKey: Uint8Array;
}

// ============================================================================
// Constants
// ============================================================================

const KEY_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes default
const MAX_MESSAGES_PER_KEY = 100; // Force ratchet after 100 messages
const MAX_SKIP = 1000; // Maximum skipped messages to store
const CHAIN_KEY_INFO = new TextEncoder().encode('tallow-chain-key-v1');
const MESSAGE_KEY_INFO = new TextEncoder().encode('tallow-message-key-v1');
const ROOT_KEY_INFO = new TextEncoder().encode('tallow-root-key-v1');

// ============================================================================
// Ephemeral Key Manager
// ============================================================================

export class EphemeralKeyManager {
    private static instance: EphemeralKeyManager;
    private activeKeys: Map<string, SessionKeyPair> = new Map();
    private deletionTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private ratchetStates: Map<string, RatchetState> = new Map();
    private skippedKeys: SkippedMessageKey[] = [];

    private constructor() {
        // Cleanup expired keys periodically
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanupExpiredKeys(), 60000);
        }
    }

    static getInstance(): EphemeralKeyManager {
        if (!EphemeralKeyManager.instance) {
            EphemeralKeyManager.instance = new EphemeralKeyManager();
        }
        return EphemeralKeyManager.instance;
    }

    // ==========================================================================
    // Per-Session Key Generation
    // ==========================================================================

    /**
     * Generate new session keys with automatic expiration
     */
    async generateSessionKeys(lifetimeMs: number = KEY_LIFETIME_MS): Promise<SessionKeyPair> {
        const keyPair = await pqCrypto.generateHybridKeypair();
        const id = this.generateKeyId();
        const now = Date.now();

        const sessionKey: SessionKeyPair = {
            id,
            keyPair,
            createdAt: now,
            expiresAt: now + lifetimeMs,
            messageCount: 0,
        };

        this.activeKeys.set(id, sessionKey);
        this.scheduleKeyDeletion(id, lifetimeMs);

        return sessionKey;
    }

    /**
     * Get a session key by ID
     */
    getSessionKey(id: string): SessionKeyPair | null {
        const key = this.activeKeys.get(id);
        if (!key) {return null;}

        // Check expiration
        if (Date.now() > key.expiresAt) {
            this.deleteKey(id);
            return null;
        }

        return key;
    }

    /**
     * Increment message count and check if ratchet needed
     */
    incrementMessageCount(id: string): boolean {
        const key = this.activeKeys.get(id);
        if (!key) {return true;} // Force ratchet if key not found

        key.messageCount++;
        return key.messageCount >= MAX_MESSAGES_PER_KEY;
    }

    // ==========================================================================
    // Automatic Key Deletion
    // ==========================================================================

    /**
     * Schedule automatic deletion of a key
     */
    scheduleKeyDeletion(keyId: string, delay: number): void {
        // Clear existing timer if any
        const existingTimer = this.deletionTimers.get(keyId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            this.deleteKey(keyId);
        }, delay);

        this.deletionTimers.set(keyId, timer);
    }

    /**
     * Delete a key and securely wipe memory
     */
    deleteKey(keyId: string): boolean {
        const key = this.activeKeys.get(keyId);
        if (!key) {return false;}

        // Securely wipe key material
        this.secureDelete(key.keyPair.kyber.secretKey);
        this.secureDelete(key.keyPair.kyber.publicKey);
        this.secureDelete(key.keyPair.x25519.privateKey);
        this.secureDelete(key.keyPair.x25519.publicKey);

        // Remove from storage
        this.activeKeys.delete(keyId);

        // Cancel deletion timer
        const timer = this.deletionTimers.get(keyId);
        if (timer) {
            clearTimeout(timer);
            this.deletionTimers.delete(keyId);
        }

        return true;
    }

    /**
     * Cleanup all expired keys
     */
    private cleanupExpiredKeys(): void {
        const now = Date.now();
        const entries = Array.from(this.activeKeys.entries());
        for (const [id, key] of entries) {
            if (now > key.expiresAt) {
                this.deleteKey(id);
            }
        }
    }

    // ==========================================================================
    // Double Ratchet Implementation
    // ==========================================================================

    /**
     * Initialize a new ratchet state for a session
     */
    async initializeRatchet(
        sessionId: string,
        sharedSecret: Uint8Array,
        isInitiator: boolean,
        peerPublicKey?: HybridPublicKey
    ): Promise<RatchetState> {
        addBreadcrumb('Initializing double ratchet', 'key-management', {
            sessionId: sessionId.slice(0, 8) + '...',
            isInitiator,
            hasPeerPublicKey: !!peerPublicKey,
        });

        const dhKeyPair = await pqCrypto.generateHybridKeypair();

        // Derive initial root key from shared secret
        const rootKey = this.kdfRootKey(sharedSecret, new Uint8Array(32));

        // Split into chain keys
        const { sendChainKey, receiveChainKey } = this.deriveChainKeys(
            rootKey,
            isInitiator
        );

        const state: RatchetState = {
            rootKey,
            sendChainKey,
            receiveChainKey,
            sendMessageNumber: 0,
            receiveMessageNumber: 0,
            previousChainLength: 0,
            dhRatchetKeyPair: dhKeyPair,
            peerPublicKey: peerPublicKey || null,
        };

        this.ratchetStates.set(sessionId, state);
        return state;
    }

    /**
     * Perform a DH ratchet step when receiving a new public key
     */
    async dhRatchetStep(
        sessionId: string,
        peerPublicKey: HybridPublicKey
    ): Promise<void> {
        const state = this.ratchetStates.get(sessionId);
        if (!state) {
            const error = new Error('Ratchet state not found for session');
            captureException(error, {
                tags: { module: 'key-management', operation: 'dhRatchetStep' },
                extra: {
                    sessionId: sessionId.slice(0, 8) + '...',
                    activeRatchetSessions: this.ratchetStates.size,
                }
            });
            throw error;
        }

        // Store old state
        state.previousChainLength = state.sendMessageNumber;

        // Compute new shared secret with peer's new key
        const dhResult = await pqCrypto.encapsulate(peerPublicKey);

        // Update receive chain
        state.rootKey = this.kdfRootKey(state.rootKey, dhResult.sharedSecret);
        state.receiveChainKey = this.kdfChainKey(state.rootKey, 'receive');
        state.receiveMessageNumber = 0;
        state.peerPublicKey = peerPublicKey;

        // Generate new DH keypair for sending
        const newKeyPair = await pqCrypto.generateHybridKeypair();

        // Securely delete old key
        this.secureDelete(state.dhRatchetKeyPair.kyber.secretKey);
        this.secureDelete(state.dhRatchetKeyPair.x25519.privateKey);

        state.dhRatchetKeyPair = newKeyPair;

        // Update send chain with new key
        const sendDhResult = await pqCrypto.encapsulate(peerPublicKey);
        state.rootKey = this.kdfRootKey(state.rootKey, sendDhResult.sharedSecret);
        state.sendChainKey = this.kdfChainKey(state.rootKey, 'send');
        state.sendMessageNumber = 0;
    }

    /**
     * Get the next message key for sending
     */
    getNextSendKey(sessionId: string): MessageKey {
        const state = this.ratchetStates.get(sessionId);
        if (!state) {
            const error = new Error('Ratchet state not found');
            captureException(error, {
                tags: { module: 'key-management', operation: 'getNextSendKey' },
                extra: {
                    sessionId: sessionId.slice(0, 8) + '...',
                    activeRatchetSessions: this.ratchetStates.size,
                }
            });
            throw error;
        }

        const messageKey = this.kdfMessageKey(state.sendChainKey);
        state.sendChainKey = this.ratchetChainKey(state.sendChainKey);
        const index = state.sendMessageNumber;
        state.sendMessageNumber++;

        return { key: messageKey, index };
    }

    /**
     * Get the message key for receiving (handles out-of-order messages)
     */
    getReceiveKey(sessionId: string, messageNumber: number): MessageKey | null {
        const state = this.ratchetStates.get(sessionId);
        if (!state) {return null;}

        // Check if it's a skipped message
        const skipped = this.trySkippedMessageKey(
            state.peerPublicKey,
            messageNumber
        );
        if (skipped) {
            return { key: skipped, index: messageNumber };
        }

        // Skip ahead if needed
        if (messageNumber > state.receiveMessageNumber) {
            this.skipMessageKeys(sessionId, messageNumber);
        }

        if (messageNumber !== state.receiveMessageNumber) {
            return null; // Message already processed or invalid
        }

        const messageKey = this.kdfMessageKey(state.receiveChainKey);
        state.receiveChainKey = this.ratchetChainKey(state.receiveChainKey);
        state.receiveMessageNumber++;

        return { key: messageKey, index: messageNumber };
    }

    /**
     * Get the current DH public key for sending
     */
    getCurrentPublicKey(sessionId: string): HybridPublicKey | null {
        const state = this.ratchetStates.get(sessionId);
        if (!state) {return null;}
        return pqCrypto.getPublicKey(state.dhRatchetKeyPair);
    }

    /**
     * Skip message keys (for out-of-order messages)
     */
    private skipMessageKeys(sessionId: string, until: number): void {
        const state = this.ratchetStates.get(sessionId);
        if (!state) {return;}

        while (state.receiveMessageNumber < until &&
            this.skippedKeys.length < MAX_SKIP) {
            const key = this.kdfMessageKey(state.receiveChainKey);
            this.storeSkippedMessageKey(
                state.peerPublicKey,
                state.receiveMessageNumber,
                key
            );
            state.receiveChainKey = this.ratchetChainKey(state.receiveChainKey);
            state.receiveMessageNumber++;
        }
    }

    /**
     * Store a skipped message key for later retrieval
     */
    private storeSkippedMessageKey(
        publicKey: HybridPublicKey | null,
        messageNumber: number,
        key: Uint8Array
    ): void {
        if (!publicKey) {return;}

        const hash = this.hashPublicKey(publicKey);
        this.skippedKeys.push({
            publicKeyHash: hash,
            messageNumber,
            messageKey: key,
        });

        // Limit stored skipped keys
        while (this.skippedKeys.length > MAX_SKIP) {
            const old = this.skippedKeys.shift();
            if (old) {this.secureDelete(old.messageKey);}
        }
    }

    /**
     * Try to retrieve a skipped message key
     */
    private trySkippedMessageKey(
        publicKey: HybridPublicKey | null,
        messageNumber: number
    ): Uint8Array | null {
        if (!publicKey) {return null;}

        const hash = this.hashPublicKey(publicKey);
        const index = this.skippedKeys.findIndex(
            k => k.publicKeyHash === hash && k.messageNumber === messageNumber
        );

        if (index === -1) {return null;}

        const skipped = this.skippedKeys.splice(index, 1)[0];
        if (!skipped) {return null;}
        return skipped.messageKey;
    }

    // ==========================================================================
    // Key Ratcheting Helpers (Symmetric Ratchet)
    // ==========================================================================

    /**
     * Ratchet a chain key forward (KDF chain)
     */
    ratchetKeys(currentKey: Uint8Array): Uint8Array {
        return this.ratchetChainKey(currentKey);
    }

    private ratchetChainKey(chainKey: Uint8Array): Uint8Array {
        return hkdf(sha256, chainKey, undefined, CHAIN_KEY_INFO, 32);
    }

    /**
     * Derive message key from chain key
     */
    private kdfMessageKey(chainKey: Uint8Array): Uint8Array {
        return hkdf(sha256, chainKey, undefined, MESSAGE_KEY_INFO, 32);
    }

    /**
     * Derive root key from shared secret
     */
    private kdfRootKey(currentRoot: Uint8Array, dhOutput: Uint8Array): Uint8Array {
        const ikm = new Uint8Array(currentRoot.length + dhOutput.length);
        ikm.set(currentRoot, 0);
        ikm.set(dhOutput, currentRoot.length);
        return hkdf(sha256, ikm, undefined, ROOT_KEY_INFO, 32);
    }

    /**
     * Derive chain keys from root key
     */
    private kdfChainKey(rootKey: Uint8Array, direction: 'send' | 'receive'): Uint8Array {
        const info = new TextEncoder().encode(`tallow-${direction}-chain-v1`);
        return hkdf(sha256, rootKey, undefined, info, 32);
    }

    /**
     * Derive initial chain keys
     */
    private deriveChainKeys(
        rootKey: Uint8Array,
        isInitiator: boolean
    ): { sendChainKey: Uint8Array; receiveChainKey: Uint8Array } {
        const chainA = this.kdfChainKey(rootKey, 'send');
        const chainB = this.kdfChainKey(rootKey, 'receive');

        // Initiator and responder use opposite chains
        return isInitiator
            ? { sendChainKey: chainA, receiveChainKey: chainB }
            : { sendChainKey: chainB, receiveChainKey: chainA };
    }

    // ==========================================================================
    // Secure Memory Wiping
    // ==========================================================================

    /**
     * Securely wipe key material from memory
     * 
     * Note: JavaScript doesn't guarantee memory clearing, but this helps:
     * 1. Overwrites with random data
     * 2. Overwrites with zeros
     * 3. Marks for garbage collection
     */
    secureDelete(key: Uint8Array): void {
        if (!key || key.length === 0) {return;}

        try {
            // Pass 1: Overwrite with random data
            const randomBytes = crypto.getRandomValues(new Uint8Array(key.length));
            for (let i = 0; i < key.length; i++) {
                const byte = randomBytes[i];
                if (byte !== undefined) {
                    key[i] = byte;
                }
            }

            // Pass 2: Overwrite with zeros
            for (let i = 0; i < key.length; i++) {
                key[i] = 0;
            }

            // Pass 3: Overwrite with 0xFF
            for (let i = 0; i < key.length; i++) {
                key[i] = 0xFF;
            }

            // Final pass: Zero again
            key.fill(0);
        } catch {
            // Best effort - at least zero the buffer
            try {
                key.fill(0);
            } catch {
                // Array may be immutable or already collected
            }
        }
    }

    /**
     * Securely wipe all keys and state for a session
     */
    destroySession(sessionId: string): void {
        // Delete all session keys
        const entries = Array.from(this.activeKeys.entries());
        for (const [id] of entries) {
            if (id.startsWith(sessionId)) {
                this.deleteKey(id);
            }
        }

        // Wipe ratchet state
        const state = this.ratchetStates.get(sessionId);
        if (state) {
            this.secureDelete(state.rootKey);
            this.secureDelete(state.sendChainKey);
            this.secureDelete(state.receiveChainKey);
            this.secureDelete(state.dhRatchetKeyPair.kyber.secretKey);
            this.secureDelete(state.dhRatchetKeyPair.x25519.privateKey);
            this.ratchetStates.delete(sessionId);
        }
    }

    /**
     * Destroy all keys and state (logout/cleanup)
     */
    destroyAll(): void {
        addBreadcrumb('Destroying all cryptographic keys', 'key-management', {
            activeKeys: this.activeKeys.size,
            ratchetSessions: this.ratchetStates.size,
            skippedKeys: this.skippedKeys.length,
        });

        // Delete all session keys
        const keyIds = Array.from(this.activeKeys.keys());
        for (const id of keyIds) {
            this.deleteKey(id);
        }

        // Wipe all ratchet states
        const sessionIds = Array.from(this.ratchetStates.keys());
        for (const sessionId of sessionIds) {
            this.destroySession(sessionId);
        }

        // Clear skipped keys
        for (const skipped of this.skippedKeys) {
            this.secureDelete(skipped.messageKey);
        }
        this.skippedKeys = [];
    }

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    private generateKeyId(): string {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private hashPublicKey(publicKey: HybridPublicKey): string {
        const serialized = pqCrypto.serializePublicKey(publicKey);
        const hash = sha256(serialized);
        return Array.from(hash.slice(0, 8))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Get statistics for debugging/monitoring
     */
    getStats(): {
        activeKeys: number;
        ratchetSessions: number;
        skippedKeys: number;
    } {
        return {
            activeKeys: this.activeKeys.size,
            ratchetSessions: this.ratchetStates.size,
            skippedKeys: this.skippedKeys.length,
        };
    }
}

// Export singleton instance
export const keyManager = EphemeralKeyManager.getInstance();

// Export for testing
export default EphemeralKeyManager;
