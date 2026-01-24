'use client';

/**
 * Triple Ratchet Protocol
 * 
 * Combines Double Ratchet (classical DH) with Sparse PQ Ratchet (ML-KEM)
 * for hybrid security against both classical and quantum attackers.
 * 
 * Based on Signal's Triple Ratchet specification:
 * https://signal.org/docs/specifications/doubleratchet/#the-triple-ratchet
 * 
 * Key Properties:
 * - Forward secrecy (from Double Ratchet)
 * - Post-compromise security (from both ratchets)
 * - Post-quantum security (from Sparse PQ Ratchet)
 */

import { pqCrypto, HybridKeyPair, HybridPublicKey, HybridCiphertext, SessionKeys } from './pqc-crypto';
import { SparsePQRatchet } from './sparse-pq-ratchet';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { x25519 } from '@noble/curves/ed25519.js';

// ============================================================================
// Constants
// ============================================================================

const TRIPLE_RATCHET_INFO = new TextEncoder().encode('tallow-triple-ratchet-v1');
const CHAIN_KEY_INFO = new TextEncoder().encode('tallow-tr-chain-v1');
const MESSAGE_KEY_INFO = new TextEncoder().encode('tallow-tr-message-v1');
const MAX_SKIP = 1000;

// ============================================================================
// Types
// ============================================================================

export interface DoubleRatchetState {
    /** Root key for DH ratchet */
    rootKey: Uint8Array;
    /** Send chain key */
    sendChainKey: Uint8Array;
    /** Receive chain key */
    receiveChainKey: Uint8Array;
    /** Our current DH keypair */
    ourDHKeyPair: {
        publicKey: Uint8Array;
        privateKey: Uint8Array;
    };
    /** Peer's current DH public key */
    peerDHPublicKey: Uint8Array | null;
    /** Send message number */
    sendMessageNumber: number;
    /** Receive message number */
    receiveMessageNumber: number;
    /** Previous chain length */
    previousChainLength: number;
}

export interface TripleRatchetState {
    /** Double Ratchet state (classical DH) */
    dr: DoubleRatchetState;
    /** Sparse PQ Ratchet state */
    pqr: SparsePQRatchet;
    /** Combined hybrid root key */
    hybridRootKey: Uint8Array;
    /** Skipped message keys for out-of-order handling */
    skippedKeys: Map<string, Uint8Array>;
    /** Session identifier */
    sessionId: string;
    /** Whether we're the initiator */
    isInitiator: boolean;
}

export interface TripleRatchetMessage {
    /** Double Ratchet DH public key */
    dhPublicKey: Uint8Array;
    /** Previous chain length */
    previousChainLength: number;
    /** Message number */
    messageNumber: number;
    /** PQ epoch */
    pqEpoch: number;
    /** Optional PQ KEM ciphertext for epoch advancement */
    pqKemCiphertext?: HybridCiphertext;
    /** Encrypted payload */
    ciphertext: Uint8Array;
    /** Nonce for AES-GCM */
    nonce: Uint8Array;
}

// ============================================================================
// Triple Ratchet Implementation
// ============================================================================

export class TripleRatchet {
    private state: TripleRatchetState;

    private constructor(state: TripleRatchetState) {
        this.state = state;
    }

    /**
     * Initialize a Triple Ratchet session
     */
    static async initialize(
        sharedSecret: Uint8Array,
        isInitiator: boolean,
        sessionId: string,
        peerDHPublicKey?: Uint8Array,
        peerPQPublicKey?: HybridPublicKey
    ): Promise<TripleRatchet> {
        // Initialize Sparse PQ Ratchet
        const pqr = await SparsePQRatchet.initialize(sharedSecret, isInitiator, peerPQPublicKey);

        // Generate DH keypair
        const dhPrivateKey = pqCrypto.randomBytes(32);
        const dhPublicKey = x25519.getPublicKey(dhPrivateKey);

        // Derive initial keys
        const hybridRootKey = hkdf(sha256, sharedSecret, undefined, TRIPLE_RATCHET_INFO, 32);
        const chainKeys = TripleRatchet.deriveChainKeys(hybridRootKey, isInitiator);

        const dr: DoubleRatchetState = {
            rootKey: hybridRootKey,
            sendChainKey: chainKeys.sendChainKey,
            receiveChainKey: chainKeys.receiveChainKey,
            ourDHKeyPair: {
                publicKey: dhPublicKey,
                privateKey: dhPrivateKey,
            },
            peerDHPublicKey: peerDHPublicKey || null,
            sendMessageNumber: 0,
            receiveMessageNumber: 0,
            previousChainLength: 0,
        };

        const state: TripleRatchetState = {
            dr,
            pqr,
            hybridRootKey,
            skippedKeys: new Map(),
            sessionId,
            isInitiator,
        };

        return new TripleRatchet(state);
    }

    /**
     * Get our public keys for sharing
     */
    getPublicKeys(): { dhPublicKey: Uint8Array; pqPublicKey: HybridPublicKey } {
        return {
            dhPublicKey: this.state.dr.ourDHKeyPair.publicKey,
            pqPublicKey: this.state.pqr.getPublicKey(),
        };
    }

    /**
     * Set peer's public keys
     */
    setPeerPublicKeys(dhPublicKey: Uint8Array, pqPublicKey: HybridPublicKey): void {
        this.state.dr.peerDHPublicKey = dhPublicKey;
        this.state.pqr.setPeerPublicKey(pqPublicKey);
    }

    /**
     * Encrypt a message
     */
    async encrypt(plaintext: Uint8Array): Promise<TripleRatchetMessage> {
        // Get PQ ratchet contribution
        const pqResult = await this.state.pqr.prepareSend();

        // Perform DH ratchet step if we have peer's key
        if (this.state.dr.peerDHPublicKey) {
            await this.dhRatchetSend();
        }

        // Derive message key by combining DH and PQ contributions
        const dhMessageKey = this.deriveMessageKey(this.state.dr.sendChainKey, this.state.dr.sendMessageNumber);
        const combinedKey = this.combineKeys(dhMessageKey, pqResult.messageKey);

        // Encrypt with AES-256-GCM
        const encrypted = await pqCrypto.encrypt(plaintext, combinedKey);

        // Prepare message
        const message: TripleRatchetMessage = {
            dhPublicKey: this.state.dr.ourDHKeyPair.publicKey,
            previousChainLength: this.state.dr.previousChainLength,
            messageNumber: this.state.dr.sendMessageNumber,
            pqEpoch: pqResult.epoch,
            pqKemCiphertext: pqResult.kemCiphertext,
            ciphertext: encrypted.ciphertext,
            nonce: encrypted.nonce,
        };

        // Advance send chain
        this.state.dr.sendChainKey = this.ratchetChainKey(this.state.dr.sendChainKey);
        this.state.dr.sendMessageNumber++;

        // Secure delete
        this.secureDelete(dhMessageKey);
        this.secureDelete(combinedKey);

        return message;
    }

    /**
     * Decrypt a message
     */
    async decrypt(message: TripleRatchetMessage): Promise<Uint8Array> {
        // Check for skipped message key
        const skipKey = this.getSkipKey(message.dhPublicKey, message.messageNumber);
        const skippedMessageKey = this.state.skippedKeys.get(skipKey);

        if (skippedMessageKey) {
            this.state.skippedKeys.delete(skipKey);
            const pqMessageKey = await this.state.pqr.processReceive(
                message.pqEpoch,
                message.messageNumber,
                message.pqKemCiphertext
            );
            const combinedKey = this.combineKeys(skippedMessageKey, pqMessageKey);
            const decrypted = await pqCrypto.decrypt(
                { ciphertext: message.ciphertext, nonce: message.nonce },
                combinedKey
            );
            this.secureDelete(skippedMessageKey);
            this.secureDelete(combinedKey);
            return decrypted;
        }

        // Handle DH ratchet step
        if (!this.arraysEqual(message.dhPublicKey, this.state.dr.peerDHPublicKey || new Uint8Array(0))) {
            await this.skipMessageKeys(message.previousChainLength);
            await this.dhRatchetReceive(message.dhPublicKey);
        }

        // Skip to message number
        await this.skipMessageKeys(message.messageNumber);

        // Get PQ contribution
        const pqMessageKey = await this.state.pqr.processReceive(
            message.pqEpoch,
            message.messageNumber,
            message.pqKemCiphertext
        );

        // Derive message key
        const dhMessageKey = this.deriveMessageKey(
            this.state.dr.receiveChainKey,
            this.state.dr.receiveMessageNumber
        );
        const combinedKey = this.combineKeys(dhMessageKey, pqMessageKey);

        // Decrypt
        const decrypted = await pqCrypto.decrypt(
            { ciphertext: message.ciphertext, nonce: message.nonce },
            combinedKey
        );

        // Advance receive chain
        this.state.dr.receiveChainKey = this.ratchetChainKey(this.state.dr.receiveChainKey);
        this.state.dr.receiveMessageNumber++;

        // Secure delete
        this.secureDelete(dhMessageKey);
        this.secureDelete(combinedKey);

        return decrypted;
    }

    // ==========================================================================
    // DH Ratchet Helpers
    // ==========================================================================

    private async dhRatchetSend(): Promise<void> {
        // Store previous chain length
        this.state.dr.previousChainLength = this.state.dr.sendMessageNumber;

        // Generate new DH keypair
        const newPrivateKey = pqCrypto.randomBytes(32);
        const newPublicKey = x25519.getPublicKey(newPrivateKey);

        // Compute DH output
        const dhOutput = x25519.getSharedSecret(newPrivateKey, this.state.dr.peerDHPublicKey!);

        // Update root and chain keys
        const { rootKey, chainKey } = this.kdfRootKey(this.state.dr.rootKey, dhOutput);

        // Secure delete old keys
        this.secureDelete(this.state.dr.ourDHKeyPair.privateKey);
        this.secureDelete(this.state.dr.rootKey);
        this.secureDelete(this.state.dr.sendChainKey);

        // Update state
        this.state.dr.rootKey = rootKey;
        this.state.dr.sendChainKey = chainKey;
        this.state.dr.ourDHKeyPair = { publicKey: newPublicKey, privateKey: newPrivateKey };
        this.state.dr.sendMessageNumber = 0;

        // Update hybrid root key by combining with PQ epoch secret
        await this.updateHybridRootKey();
    }

    private async dhRatchetReceive(peerPublicKey: Uint8Array): Promise<void> {
        // Compute DH output with peer's new key
        const dhOutput = x25519.getSharedSecret(
            this.state.dr.ourDHKeyPair.privateKey,
            peerPublicKey
        );

        // Update root and receive chain
        const { rootKey, chainKey } = this.kdfRootKey(this.state.dr.rootKey, dhOutput);

        this.secureDelete(this.state.dr.rootKey);
        this.secureDelete(this.state.dr.receiveChainKey);

        this.state.dr.rootKey = rootKey;
        this.state.dr.receiveChainKey = chainKey;
        this.state.dr.peerDHPublicKey = peerPublicKey;
        this.state.dr.receiveMessageNumber = 0;

        // Update hybrid root key
        await this.updateHybridRootKey();
    }

    private async skipMessageKeys(until: number): Promise<void> {
        while (
            this.state.dr.receiveMessageNumber < until &&
            this.state.skippedKeys.size < MAX_SKIP
        ) {
            const messageKey = this.deriveMessageKey(
                this.state.dr.receiveChainKey,
                this.state.dr.receiveMessageNumber
            );
            const skipKey = this.getSkipKey(
                this.state.dr.peerDHPublicKey!,
                this.state.dr.receiveMessageNumber
            );
            this.state.skippedKeys.set(skipKey, messageKey);
            this.state.dr.receiveChainKey = this.ratchetChainKey(this.state.dr.receiveChainKey);
            this.state.dr.receiveMessageNumber++;
        }
    }

    // ==========================================================================
    // Key Derivation Helpers
    // ==========================================================================

    private async updateHybridRootKey(): Promise<void> {
        // Combine DH root key with PQ epoch info
        const pqInfo = this.state.pqr.getEpochInfo();
        const info = new TextEncoder().encode(`hybrid-${pqInfo.epoch}`);
        this.state.hybridRootKey = hkdf(sha256, this.state.dr.rootKey, undefined, info, 32);
    }

    private kdfRootKey(rootKey: Uint8Array, dhOutput: Uint8Array): { rootKey: Uint8Array; chainKey: Uint8Array } {
        const combined = new Uint8Array(rootKey.length + dhOutput.length);
        combined.set(rootKey, 0);
        combined.set(dhOutput, rootKey.length);

        const output = hkdf(sha256, combined, undefined, CHAIN_KEY_INFO, 64);
        return {
            rootKey: output.slice(0, 32),
            chainKey: output.slice(32, 64),
        };
    }

    private deriveMessageKey(chainKey: Uint8Array, messageNumber: number): Uint8Array {
        const info = new TextEncoder().encode(`msg-${messageNumber}`);
        return hkdf(sha256, chainKey, undefined, MESSAGE_KEY_INFO, 32);
    }

    private ratchetChainKey(chainKey: Uint8Array): Uint8Array {
        return hkdf(sha256, chainKey, undefined, CHAIN_KEY_INFO, 32);
    }

    private combineKeys(dhKey: Uint8Array, pqKey: Uint8Array): Uint8Array {
        const combined = new Uint8Array(dhKey.length + pqKey.length);
        combined.set(dhKey, 0);
        combined.set(pqKey, dhKey.length);
        return hkdf(sha256, combined, undefined, MESSAGE_KEY_INFO, 32);
    }

    private static deriveChainKeys(rootKey: Uint8Array, isInitiator: boolean): {
        sendChainKey: Uint8Array;
        receiveChainKey: Uint8Array;
    } {
        const sendInfo = new TextEncoder().encode('send-chain');
        const recvInfo = new TextEncoder().encode('recv-chain');

        const sendKey = hkdf(sha256, rootKey, undefined, sendInfo, 32);
        const recvKey = hkdf(sha256, rootKey, undefined, recvInfo, 32);

        return isInitiator
            ? { sendChainKey: sendKey, receiveChainKey: recvKey }
            : { sendChainKey: recvKey, receiveChainKey: sendKey };
    }

    // ==========================================================================
    // Utility Helpers
    // ==========================================================================

    private getSkipKey(publicKey: Uint8Array, messageNumber: number): string {
        const hash = sha256(publicKey);
        return `${Array.from(hash.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}-${messageNumber}`;
    }

    private arraysEqual(a: Uint8Array | null, b: Uint8Array): boolean {
        if (!a || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

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
     * Get session info for debugging
     */
    getSessionInfo(): {
        sessionId: string;
        drMessageNumber: number;
        pqEpoch: number;
        skippedKeys: number;
    } {
        const pqInfo = this.state.pqr.getEpochInfo();
        return {
            sessionId: this.state.sessionId,
            drMessageNumber: this.state.dr.sendMessageNumber,
            pqEpoch: pqInfo.epoch,
            skippedKeys: this.state.skippedKeys.size,
        };
    }

    /**
     * Destroy session and wipe all keys
     */
    destroy(): void {
        this.secureDelete(this.state.dr.rootKey);
        this.secureDelete(this.state.dr.sendChainKey);
        this.secureDelete(this.state.dr.receiveChainKey);
        this.secureDelete(this.state.dr.ourDHKeyPair.privateKey);
        this.secureDelete(this.state.hybridRootKey);
        this.state.pqr.destroy();
        this.state.skippedKeys.forEach((key) => this.secureDelete(key));
        this.state.skippedKeys.clear();
    }
}

// ============================================================================
// Export
// ============================================================================

export default TripleRatchet;
