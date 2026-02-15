/**
 * AGENT 006 - PQC-KEYSMITH / AGENT 007 - RATCHET-MASTER
 *
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
 * - CKA: Continuous Key Agreement -- ongoing key refresh
 *
 * CONFIGURABLE PARAMETERS:
 * The ratchet interval (message threshold and max epoch age) can be
 * negotiated between peers during session setup. Both sides must agree
 * on the same parameters for the protocol to function correctly.
 *
 * Defaults:
 *   messageThreshold = 100 messages per epoch
 *   maxEpochAgeMs    = 300000 ms (5 minutes)
 *
 * All KDF operations use BLAKE3 derive_key with domain separation.
 */

import { pqCrypto, HybridKeyPair, HybridPublicKey, HybridCiphertext } from './pqc-crypto';
import { deriveKey as deriveBlake3Key } from './blake3';
import secureLog from '../utils/secure-logger';
import { zeroMemory } from './secure-buffer';

// ============================================================================
// Constants & Defaults
// ============================================================================

/** Default: advance epoch every N messages */
export const SPARSE_PQ_RATCHET_MESSAGE_THRESHOLD = 100;

/** Default: force epoch advance after this many milliseconds */
export const SPARSE_PQ_RATCHET_MAX_EPOCH_AGE_MS = 5 * 60 * 1000; // 5 minutes

/** Minimum allowed message threshold (security floor) */
export const SPARSE_PQ_MIN_MESSAGE_THRESHOLD = 10;

/** Maximum allowed message threshold (latency ceiling) */
export const SPARSE_PQ_MAX_MESSAGE_THRESHOLD = 10_000;

/** Minimum allowed epoch age in milliseconds (30 seconds) */
export const SPARSE_PQ_MIN_EPOCH_AGE_MS = 30 * 1000;

/** Maximum allowed epoch age in milliseconds (1 hour) */
export const SPARSE_PQ_MAX_EPOCH_AGE_MS = 60 * 60 * 1000;

// BLAKE3 derive_key domain separation contexts
const SCKA_COMBINE_DOMAIN = 'tallow-scka-combine-v1';
const SCKA_EPOCH_DOMAIN = 'tallow-scka-epoch-key-v1';
const SCKA_MESSAGE_KEY_DOMAIN = 'tallow-scka-msg-key-v1';

// ============================================================================
// Configurable Ratchet Parameters
// ============================================================================

/**
 * Configurable parameters for the sparse PQ ratchet.
 *
 * Both peers MUST agree on the same parameters during session negotiation.
 * Use `negotiateRatchetConfig()` to select the stricter (lower) values
 * when two peers propose different configurations.
 */
export interface SparsePQRatchetConfig {
  /** Number of messages before triggering an epoch advance */
  messageThreshold: number;
  /** Maximum epoch age in milliseconds before forcing an advance */
  maxEpochAgeMs: number;
}

/**
 * Default ratchet configuration.
 * Used when no explicit configuration is provided.
 */
export const DEFAULT_RATCHET_CONFIG: Readonly<SparsePQRatchetConfig> = {
  messageThreshold: SPARSE_PQ_RATCHET_MESSAGE_THRESHOLD,
  maxEpochAgeMs: SPARSE_PQ_RATCHET_MAX_EPOCH_AGE_MS,
};

/**
 * Validate a ratchet configuration against security bounds.
 *
 * Rejects configurations that are too aggressive (risk of excessive
 * PQ operations) or too lax (risk of epoch key exposure).
 *
 * @throws Error if any parameter is outside allowed bounds
 */
export function validateRatchetConfig(config: SparsePQRatchetConfig): void {
  if (!Number.isInteger(config.messageThreshold)) {
    throw new Error('messageThreshold must be an integer');
  }
  if (config.messageThreshold < SPARSE_PQ_MIN_MESSAGE_THRESHOLD) {
    throw new Error(
      `messageThreshold (${config.messageThreshold}) below minimum (${SPARSE_PQ_MIN_MESSAGE_THRESHOLD})`
    );
  }
  if (config.messageThreshold > SPARSE_PQ_MAX_MESSAGE_THRESHOLD) {
    throw new Error(
      `messageThreshold (${config.messageThreshold}) above maximum (${SPARSE_PQ_MAX_MESSAGE_THRESHOLD})`
    );
  }
  if (!Number.isInteger(config.maxEpochAgeMs)) {
    throw new Error('maxEpochAgeMs must be an integer');
  }
  if (config.maxEpochAgeMs < SPARSE_PQ_MIN_EPOCH_AGE_MS) {
    throw new Error(
      `maxEpochAgeMs (${config.maxEpochAgeMs}) below minimum (${SPARSE_PQ_MIN_EPOCH_AGE_MS})`
    );
  }
  if (config.maxEpochAgeMs > SPARSE_PQ_MAX_EPOCH_AGE_MS) {
    throw new Error(
      `maxEpochAgeMs (${config.maxEpochAgeMs}) above maximum (${SPARSE_PQ_MAX_EPOCH_AGE_MS})`
    );
  }
}

/**
 * Negotiate ratchet configuration between two peers.
 *
 * Security policy: always select the STRICTER (lower) value for each parameter.
 * This ensures that the more security-conservative peer's preferences are respected.
 *
 * Both the result and the inputs are validated against security bounds.
 *
 * @param ours  - Our proposed configuration
 * @param theirs - Peer's proposed configuration
 * @returns The negotiated configuration (min of each parameter)
 */
export function negotiateRatchetConfig(
  ours: SparsePQRatchetConfig,
  theirs: SparsePQRatchetConfig
): SparsePQRatchetConfig {
  validateRatchetConfig(ours);
  validateRatchetConfig(theirs);

  const negotiated: SparsePQRatchetConfig = {
    messageThreshold: Math.min(ours.messageThreshold, theirs.messageThreshold),
    maxEpochAgeMs: Math.min(ours.maxEpochAgeMs, theirs.maxEpochAgeMs),
  };

  // The negotiated result is always within bounds since both inputs are validated
  // and we take the minimum, but validate anyway for defense-in-depth
  validateRatchetConfig(negotiated);

  secureLog.log(
    '[SparsePQRatchet] Negotiated config:',
    `messageThreshold=${negotiated.messageThreshold},`,
    `maxEpochAgeMs=${negotiated.maxEpochAgeMs}`
  );

  return negotiated;
}

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
    private readonly config: Readonly<SparsePQRatchetConfig>;

    private constructor(state: SCKAState, config: SparsePQRatchetConfig) {
        this.state = state;
        this.config = Object.freeze({ ...config });
    }

    /**
     * Initialize a new Sparse PQ Ratchet
     *
     * @param initialSecret  - Shared secret from the initial key exchange
     * @param isInitiator    - Whether this party initiated the connection
     * @param peerPublicKey  - Peer's hybrid public key (if known)
     * @param config         - Ratchet parameters (defaults to DEFAULT_RATCHET_CONFIG)
     */
    static async initialize(
        initialSecret: Uint8Array,
        isInitiator: boolean,
        peerPublicKey?: HybridPublicKey,
        config?: SparsePQRatchetConfig
    ): Promise<SparsePQRatchet> {
        const resolvedConfig = config ?? { ...DEFAULT_RATCHET_CONFIG };
        validateRatchetConfig(resolvedConfig);

        const ourKeyPair = await pqCrypto.generateHybridKeypair();

        // Derive initial epoch secret using BLAKE3 derive_key
        const epochSecret = deriveBlake3Key(SCKA_EPOCH_DOMAIN, initialSecret);

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

        return new SparsePQRatchet(state, resolvedConfig);
    }

    /**
     * Get the current ratchet configuration
     */
    getConfig(): Readonly<SparsePQRatchetConfig> {
        return this.config;
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
     * Check if epoch should advance based on the configured thresholds.
     *
     * An epoch advance is triggered when EITHER:
     *   - Message count reaches the configured messageThreshold, OR
     *   - Epoch age exceeds the configured maxEpochAgeMs
     */
    shouldAdvanceEpoch(): boolean {
        const messageThresholdReached = this.state.messageCount >= this.config.messageThreshold;
        const epochTooOld = (Date.now() - this.state.epochCreatedAt) > this.config.maxEpochAgeMs;
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
            ...(kemCiphertext ? { kemCiphertext } : {}),
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

        // Securely delete old keys and shared secret
        this.secureDelete(this.state.ourKeyPair.kyber.secretKey);
        this.secureDelete(this.state.ourKeyPair.x25519.privateKey);
        this.secureDelete(this.state.epochSecret);
        this.secureDelete(sharedSecret);

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
        if (!this.state.pendingOutboundKEM) {return;}

        const { epoch, secret } = this.state.pendingOutboundKEM;

        // Combine with current epoch secret
        const newEpochSecret = this.combineSecrets(this.state.epochSecret, secret);

        // Generate new keypair
        const newKeyPair = await pqCrypto.generateHybridKeypair();

        // Securely delete old keys and pending secret
        this.secureDelete(this.state.ourKeyPair.kyber.secretKey);
        this.secureDelete(this.state.ourKeyPair.x25519.privateKey);
        this.secureDelete(this.state.epochSecret);
        this.secureDelete(secret);

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
     * Derive a message key for a specific message number.
     *
     * Uses BLAKE3 derive_key with a context that encodes both
     * the epoch and message number for domain isolation.
     */
    private deriveMessageKey(messageNumber: number): Uint8Array {
        // Build IKM: epochSecret || epoch (4 bytes BE) || messageNumber (4 bytes BE)
        const ikm = new Uint8Array(this.state.epochSecret.length + 8);
        ikm.set(this.state.epochSecret, 0);
        const view = new DataView(ikm.buffer);
        view.setUint32(this.state.epochSecret.length, this.state.epoch, false);
        view.setUint32(this.state.epochSecret.length + 4, messageNumber, false);

        const result = deriveBlake3Key(SCKA_MESSAGE_KEY_DOMAIN, ikm);
        zeroMemory(ikm);
        return result;
    }

    /**
     * Combine two secrets using BLAKE3 derive_key with domain separation.
     */
    private combineSecrets(secret1: Uint8Array, secret2: Uint8Array): Uint8Array {
        const combined = new Uint8Array(secret1.length + secret2.length);
        combined.set(secret1, 0);
        combined.set(secret2, secret1.length);
        const result = deriveBlake3Key(SCKA_COMBINE_DOMAIN, combined);

        // Secure cleanup of intermediate data
        zeroMemory(combined);

        return result;
    }

    /**
     * Securely wipe key material using the centralized double-overwrite pattern.
     * Delegates to zeroMemory() from secure-buffer module.
     */
    private secureDelete(data: Uint8Array): void {
        if (!data) {return;}
        zeroMemory(data);
    }

    /**
     * Get serialized state for persistence (excluding secrets)
     */
    getStateForPersistence(): {
        epoch: number;
        messageCount: number;
        isInitiator: boolean;
        config: SparsePQRatchetConfig;
    } {
        return {
            epoch: this.state.epoch,
            messageCount: this.state.messageCount,
            isInitiator: this.state.isInitiator,
            config: { ...this.config },
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
