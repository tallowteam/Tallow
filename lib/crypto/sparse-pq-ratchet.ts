'use client';

/**
 * Sparse Post-Quantum Ratchet
 * 
 * Implements Signal's Sparse Continuous Key Agreement (SCKA) protocol
 * for bandwidth-efficient post-quantum security.
 * 
 * Based on Signal's ML-KEM Braid specification:
 * https://signal.org/docs/specifications/mlkembraid/
 * 
 * Key Concepts:
 * - Epochs: Time periods where the same PQ secret is used
 * - Sparse: PQ exchanges happen periodically, not every message
 * - CKA: Continuous Key Agreement - ongoing key refresh
 */

import { pqCrypto, HybridKeyPair, HybridPublicKey, HybridCiphertext } from './pqc-crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Constants
// ============================================================================

const EPOCH_MESSAGE_THRESHOLD = 10; // Advance epoch every N messages
const MAX_EPOCH_AGE_MS = 5 * 60 * 1000; // Force epoch advance after 5 minutes
const SCKA_INFO = new TextEncoder().encode('tallow-scka-v1');
const EPOCH_KEY_INFO = new TextEncoder().encode('tallow-epoch-key-v1');

// ============================================================================
// Types
// ============================================================================

export interface SCKAState {
    /** Current epoch number */
    epoch: number;
    /** Epoch root secret derived from PQ exchange */
    epochSecret: Uint8Array;
    /** Our current PQ keypair for this epoch */
    ourKeyPair: HybridKeyPair;
    /** Peer's current PQ public key */
    peerPublicKey: HybridPublicKey | null;
    /** Pending outbound KEM (waiting for peer to receive) */
    pendingOutboundKEM: {
        epoch: number;
        ciphertext: HybridCiphertext;
        secret: Uint8Array;
    } | null;
    /** Pending inbound KEM (received, not yet processed) */
    pendingInboundKEM: {
        epoch: number;
        ciphertext: HybridCiphertext;
    } | null;
    /** Message count in current epoch */
    messageCount: number;
    /** Epoch creation timestamp */
    epochCreatedAt: number;
    /** Whether we initiated the connection */
    isInitiator: boolean;
}

export interface SCKAMessage {
    /** Epoch this message belongs to */
    epoch: number;
    /** Optional KEM ciphertext for epoch advancement */
    kemCiphertext?: Uint8Array;
    /** Message number within epoch */
    messageNumber: number;
}

export interface EpochAdvanceResult {
    /** New epoch secret */
    epochSecret: Uint8Array;
    /** New epoch number */
    epoch: number;
    /** KEM ciphertext to send (if we're advancing) */
    kemCiphertext?: HybridCiphertext;
}

// ============================================================================
// Sparse CKA Protocol
// ============================================================================

export class SparsePQRatchet {
    private state: SCKAState;

    private constructor(state: SCKAState) {
        this.state = state;
    }

    /**
     * Initialize a new Sparse PQ Ratchet
     */
    static async initialize(
        initialSecret: Uint8Array,
        isInitiator: boolean,
        peerPublicKey?: HybridPublicKey
    ): Promise<SparsePQRatchet> {
        const ourKeyPair = await pqCrypto.generateHybridKeypair();

        // Derive initial epoch secret
        const epochSecret = hkdf(sha256, initialSecret, undefined, EPOCH_KEY_INFO, 32);

        const state: SCKAState = {
            epoch: 0,
            epochSecret,
            ourKeyPair,
            peerPublicKey: peerPublicKey || null,
            pendingOutboundKEM: null,
            pendingInboundKEM: null,
            messageCount: 0,
            epochCreatedAt: Date.now(),
            isInitiator,
        };

        return new SparsePQRatchet(state);
    }

    /**
     * Get current epoch info
     */
    getEpochInfo(): { epoch: number; messageCount: number; epochAge: number } {
        return {
            epoch: this.state.epoch,
            messageCount: this.state.messageCount,
            epochAge: Date.now() - this.state.epochCreatedAt,
        };
    }

    /**
     * Get our public key for sharing with peer
     */
    getPublicKey(): HybridPublicKey {
        return pqCrypto.getPublicKey(this.state.ourKeyPair);
    }

    /**
     * Set peer's public key (received during handshake)
     */
    setPeerPublicKey(publicKey: HybridPublicKey): void {
        this.state.peerPublicKey = publicKey;
    }

    /**
     * Check if epoch should advance
     */
    shouldAdvanceEpoch(): boolean {
        const messageThresholdReached = this.state.messageCount >= EPOCH_MESSAGE_THRESHOLD;
        const epochTooOld = (Date.now() - this.state.epochCreatedAt) > MAX_EPOCH_AGE_MS;
        return messageThresholdReached || epochTooOld;
    }

    /**
     * Prepare a message key for sending
     * Returns the message key and optionally a KEM ciphertext for epoch advancement
     */
    async prepareSend(): Promise<{
        messageKey: Uint8Array;
        epoch: number;
        messageNumber: number;
        kemCiphertext?: HybridCiphertext;
    }> {
        let kemCiphertext: HybridCiphertext | undefined;

        // Check if we should advance epoch
        if (this.shouldAdvanceEpoch() && this.state.peerPublicKey) {
            // Initiator advances even epochs, responder advances odd epochs
            const shouldWeAdvance = this.state.isInitiator
                ? (this.state.epoch % 2 === 0)
                : (this.state.epoch % 2 === 1);

            if (shouldWeAdvance && !this.state.pendingOutboundKEM) {
                // Generate new epoch via KEM
                const result = await pqCrypto.encapsulate(this.state.peerPublicKey);
                kemCiphertext = result.ciphertext;

                // Store pending outbound KEM
                this.state.pendingOutboundKEM = {
                    epoch: this.state.epoch + 1,
                    ciphertext: result.ciphertext,
                    secret: result.sharedSecret,
                };
            }
        }

        // Derive message key from current epoch secret
        const messageKey = this.deriveMessageKey(this.state.messageCount);
        const messageNumber = this.state.messageCount;

        this.state.messageCount++;

        return {
            messageKey,
            epoch: this.state.epoch,
            messageNumber,
            kemCiphertext,
        };
    }

    /**
     * Process a received message
     * Returns the message key for decryption
     */
    async processReceive(
        epoch: number,
        messageNumber: number,
        kemCiphertext?: HybridCiphertext
    ): Promise<Uint8Array> {
        // Handle epoch advancement via received KEM
        if (kemCiphertext && epoch > this.state.epoch) {
            await this.advanceEpochFromKEM(kemCiphertext, epoch);
        }

        // If message is from a future epoch we haven't advanced to, store it
        if (epoch > this.state.epoch) {
            this.state.pendingInboundKEM = { epoch, ciphertext: kemCiphertext! };
            throw new Error(`Message from future epoch ${epoch}, current is ${this.state.epoch}`);
        }

        // Derive message key
        return this.deriveMessageKey(messageNumber);
    }

    /**
     * Advance epoch using received KEM ciphertext
     */
    private async advanceEpochFromKEM(
        ciphertext: HybridCiphertext,
        targetEpoch: number
    ): Promise<void> {
        // Decapsulate to get shared secret
        const sharedSecret = await pqCrypto.decapsulate(ciphertext, this.state.ourKeyPair);

        // Combine with current epoch secret for new epoch secret
        const newEpochSecret = this.combineSecrets(this.state.epochSecret, sharedSecret);

        // Generate new keypair for next epoch
        const newKeyPair = await pqCrypto.generateHybridKeypair();

        // Securely delete old keys
        this.secureDelete(this.state.ourKeyPair.kyber.secretKey);
        this.secureDelete(this.state.ourKeyPair.x25519.privateKey);
        this.secureDelete(this.state.epochSecret);

        // Update state
        this.state.epoch = targetEpoch;
        this.state.epochSecret = newEpochSecret;
        this.state.ourKeyPair = newKeyPair;
        this.state.messageCount = 0;
        this.state.epochCreatedAt = Date.now();
        this.state.pendingOutboundKEM = null;

        secureLog.log('[SparsePQRatchet] Advanced to epoch', targetEpoch);
    }

    /**
     * Confirm our outbound KEM was received and processed
     */
    async confirmEpochAdvance(): Promise<void> {
        if (!this.state.pendingOutboundKEM) return;

        const { epoch, secret } = this.state.pendingOutboundKEM;

        // Combine with current epoch secret
        const newEpochSecret = this.combineSecrets(this.state.epochSecret, secret);

        // Generate new keypair
        const newKeyPair = await pqCrypto.generateHybridKeypair();

        // Securely delete old keys
        this.secureDelete(this.state.ourKeyPair.kyber.secretKey);
        this.secureDelete(this.state.ourKeyPair.x25519.privateKey);
        this.secureDelete(this.state.epochSecret);

        // Update state
        this.state.epoch = epoch;
        this.state.epochSecret = newEpochSecret;
        this.state.ourKeyPair = newKeyPair;
        this.state.messageCount = 0;
        this.state.epochCreatedAt = Date.now();
        this.state.pendingOutboundKEM = null;

        secureLog.log('[SparsePQRatchet] Confirmed epoch advance to', epoch);
    }

    /**
     * Derive a message key for a specific message number
     */
    private deriveMessageKey(messageNumber: number): Uint8Array {
        const info = new TextEncoder().encode(`tallow-msg-${this.state.epoch}-${messageNumber}`);
        return hkdf(sha256, this.state.epochSecret, undefined, info, 32);
    }

    /**
     * Combine two secrets using HKDF
     */
    private combineSecrets(secret1: Uint8Array, secret2: Uint8Array): Uint8Array {
        const combined = new Uint8Array(secret1.length + secret2.length);
        combined.set(secret1, 0);
        combined.set(secret2, secret1.length);
        return hkdf(sha256, combined, undefined, SCKA_INFO, 32);
    }

    /**
     * Securely wipe key material
     */
    private secureDelete(data: Uint8Array): void {
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

    /**
     * Get serialized state for persistence (excluding secrets)
     */
    getStateForPersistence(): {
        epoch: number;
        messageCount: number;
        isInitiator: boolean;
    } {
        return {
            epoch: this.state.epoch,
            messageCount: this.state.messageCount,
            isInitiator: this.state.isInitiator,
        };
    }

    /**
     * Destroy all state securely
     */
    destroy(): void {
        this.secureDelete(this.state.epochSecret);
        this.secureDelete(this.state.ourKeyPair.kyber.secretKey);
        this.secureDelete(this.state.ourKeyPair.x25519.privateKey);
        if (this.state.pendingOutboundKEM) {
            this.secureDelete(this.state.pendingOutboundKEM.secret);
        }
    }
}

// ============================================================================
// Export
// ============================================================================

export default SparsePQRatchet;
