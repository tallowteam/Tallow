'use client';

/**
 * Lazy-Loaded PQC Crypto Service
 * Code-splits heavy post-quantum cryptography libraries
 *
 * This wrapper lazy-loads the PQC crypto module only when needed,
 * reducing initial bundle size by ~500KB+
 */

import type {
  PQCryptoService,
  HybridKeyPair,
  HybridCiphertext,
  HybridPublicKey,
  SessionKeys,
  EncryptedData
} from './pqc-crypto';
import { secureLog } from '../utils/secure-logger';

let pqcCryptoPromise: Promise<typeof import('./pqc-crypto')> | null = null;
let pqcCryptoModule: typeof import('./pqc-crypto') | null = null;

/**
 * Load PQC crypto module (lazy-loaded)
 */
async function loadPQCCrypto(): Promise<typeof import('./pqc-crypto')> {
  if (pqcCryptoModule) {return pqcCryptoModule;}

  if (!pqcCryptoPromise) {
    pqcCryptoPromise = import(
      /* webpackChunkName: "pqc-crypto" */
      /* webpackPreload: true */
      './pqc-crypto'
    );
  }

  pqcCryptoModule = await pqcCryptoPromise;
  return pqcCryptoModule;
}

/**
 * Lazy-loaded PQC Crypto Service Wrapper
 * Provides same interface as PQCryptoService but loads modules on-demand
 */
export class LazyPQCryptoService {
  private static instance: LazyPQCryptoService;
  private pqcService: PQCryptoService | null = null;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): LazyPQCryptoService {
    if (!LazyPQCryptoService.instance) {
      LazyPQCryptoService.instance = new LazyPQCryptoService();
    }
    return LazyPQCryptoService.instance;
  }

  /**
   * Ensure PQC crypto is loaded
   */
  private async ensureLoaded(): Promise<PQCryptoService> {
    if (this.pqcService) {return this.pqcService;}

    if (!this.loadingPromise) {
      this.loadingPromise = (async () => {
        const module = await loadPQCCrypto();
        this.pqcService = module.pqCrypto;
      })();
    }

    await this.loadingPromise;
    return this.pqcService!;
  }

  /**
   * Preload PQC crypto modules in the background
   * Call this early to start loading before user initiates transfer
   */
  async preload(): Promise<void> {
    await this.ensureLoaded();
  }

  /**
   * Check if PQC crypto is already loaded
   */
  isLoaded(): boolean {
    return this.pqcService !== null;
  }

  // ==========================================================================
  // Lazy-loaded PQC Crypto Methods
  // ==========================================================================

  async generateHybridKeypair(): Promise<HybridKeyPair> {
    const service = await this.ensureLoaded();
    return service.generateHybridKeypair();
  }

  async encapsulate(peerPublicKey: HybridPublicKey): Promise<{
    ciphertext: HybridCiphertext;
    sharedSecret: Uint8Array;
  }> {
    const service = await this.ensureLoaded();
    return service.encapsulate(peerPublicKey);
  }

  async decapsulate(
    ciphertext: HybridCiphertext,
    ownKeyPair: HybridKeyPair
  ): Promise<Uint8Array> {
    const service = await this.ensureLoaded();
    return service.decapsulate(ciphertext, ownKeyPair);
  }

  async deriveSessionKeys(sharedSecret: Uint8Array): Promise<SessionKeys> {
    const service = await this.ensureLoaded();
    return service.deriveSessionKeys(sharedSecret);
  }

  async encrypt(
    plaintext: Uint8Array,
    key: Uint8Array
  ): Promise<EncryptedData> {
    const service = await this.ensureLoaded();
    return service.encrypt(plaintext, key);
  }

  async decrypt(
    encrypted: EncryptedData,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<Uint8Array> {
    const service = await this.ensureLoaded();
    return service.decrypt(encrypted, key, associatedData);
  }

  async serializePublicKey(publicKey: HybridPublicKey): Promise<Uint8Array> {
    const service = await this.ensureLoaded();
    return service.serializePublicKey(publicKey);
  }

  async deserializePublicKey(serialized: Uint8Array): Promise<HybridPublicKey> {
    const service = await this.ensureLoaded();
    return service.deserializePublicKey(serialized);
  }

  async serializeCiphertext(ciphertext: HybridCiphertext): Promise<Uint8Array> {
    const service = await this.ensureLoaded();
    return service.serializeCiphertext(ciphertext);
  }

  async deserializeCiphertext(serialized: Uint8Array): Promise<HybridCiphertext> {
    const service = await this.ensureLoaded();
    return service.deserializeCiphertext(serialized);
  }

  serializeKeypairPublic(keyPair: HybridKeyPair): Uint8Array {
    // This method is synchronous in the original
    if (!this.pqcService) {
      throw new Error('PQC crypto not loaded. Call preload() or use generateHybridKeypair() first.');
    }
    // Validate keyPair structure to prevent null/undefined crashes
    if (!keyPair?.kyber?.publicKey || !keyPair?.x25519?.publicKey) {
      throw new Error('Invalid keypair structure: missing required public keys');
    }
    return this.pqcService.serializeKeypairPublic(keyPair);
  }

  randomBytes(length: number): Uint8Array {
    // This method is synchronous in the original
    if (!this.pqcService) {
      throw new Error('PQC crypto not loaded. Call preload() or use generateHybridKeypair() first.');
    }
    // Validate length parameter
    if (!Number.isInteger(length) || length <= 0 || length > 1024 * 1024) {
      throw new Error(`Invalid length: ${length}. Must be positive integer <= 1MB`);
    }
    return this.pqcService.randomBytes(length);
  }

  hash(data: Uint8Array): Uint8Array {
    // This method is synchronous in the original
    if (!this.pqcService) {
      throw new Error('PQC crypto not loaded. Call preload() or use generateHybridKeypair() first.');
    }
    // Validate data parameter
    if (!(data instanceof Uint8Array) || data.length === 0) {
      throw new Error('Invalid data: must be non-empty Uint8Array');
    }
    return this.pqcService.hash(data);
  }
}

/**
 * Singleton instance (lazy-loaded)
 */
export const lazyPQCrypto = LazyPQCryptoService.getInstance();

/**
 * Preload helper - call this when user hovers over transfer button
 * or navigates to the app page to start loading PQC libraries early
 */
export function preloadPQCCrypto(): void {
  lazyPQCrypto.preload().catch(err => {
    secureLog.error('Failed to preload PQC crypto:', err);
  });
}

// Re-export types for convenience
export type {
  HybridKeyPair,
  HybridCiphertext,
  HybridPublicKey,
  SessionKeys,
  EncryptedData,
} from './pqc-crypto';

// ============================================================================
// Convenience Wrapper Functions
// ============================================================================

/**
 * Generate PQC keypair (convenience wrapper)
 */
export async function generatePQCKeypair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  const keypair = await lazyPQCrypto.generateHybridKeypair();
  const publicKeySerialized = await lazyPQCrypto.serializePublicKey({
    kyberPublicKey: keypair.kyber.publicKey,
    x25519PublicKey: keypair.x25519.publicKey,
  });

  // For secret key, we need to serialize it manually since there's no built-in serializer
  // Concatenate Kyber secret (2400 bytes) + X25519 private (32 bytes)
  const secretKey = new Uint8Array(keypair.kyber.secretKey.length + keypair.x25519.privateKey.length);
  secretKey.set(keypair.kyber.secretKey, 0);
  secretKey.set(keypair.x25519.privateKey, keypair.kyber.secretKey.length);

  return {
    publicKey: publicKeySerialized,
    secretKey: secretKey,
  };
}

/**
 * Encapsulate secret using public key (convenience wrapper)
 */
export async function encapsulateSecret(
  publicKey: Uint8Array
): Promise<{ sharedSecret: Uint8Array; ciphertext: Uint8Array }> {
  const publicKeyObj = await lazyPQCrypto.deserializePublicKey(publicKey);

  const { sharedSecret, ciphertext } = await lazyPQCrypto.encapsulate(publicKeyObj);

  const ciphertextSerialized = await lazyPQCrypto.serializeCiphertext(ciphertext);

  return {
    sharedSecret,
    ciphertext: ciphertextSerialized,
  };
}

/**
 * Decapsulate secret using ciphertext and secret key (convenience wrapper)
 */
export async function decapsulateSecret(
  ciphertext: Uint8Array,
  secretKey: Uint8Array
): Promise<Uint8Array> {
  // Deserialize secret key (Kyber secret: 2400 bytes + X25519 private: 32 bytes)
  const kyberSecretLength = 2400;
  const kyberSecret = secretKey.slice(0, kyberSecretLength);
  const x25519Private = secretKey.slice(kyberSecretLength);

  const ciphertextObj = await lazyPQCrypto.deserializeCiphertext(ciphertext);

  // We need to reconstruct the full keypair for decapsulation
  // Since we don't have the public keys, we'll need to generate dummy ones or store them
  // For now, let's use the service's decapsulate method directly with reconstructed keypair
  const dummyPublicKey = new Uint8Array(1184); // Kyber public key size
  const dummyX25519Public = new Uint8Array(32);

  const ownKeyPair: HybridKeyPair = {
    kyber: {
      publicKey: dummyPublicKey,
      secretKey: kyberSecret,
    },
    x25519: {
      publicKey: dummyX25519Public,
      privateKey: x25519Private,
    },
  };

  return await lazyPQCrypto.decapsulate(ciphertextObj, ownKeyPair);
}
