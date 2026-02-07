'use client';

/**
 * Cryptography Module - Central Export Hub
 * Comprehensive encryption and security utilities for peer-to-peer transfers
 *
 * @module crypto
 */

// Post-Quantum Cryptography
export {
  PQCryptoService,
  type KyberKeyPair,
  type X25519KeyPair,
  type HybridKeyPair,
  type HybridCiphertext,
  type HybridPublicKey,
  type EncryptedData,
  type SessionKeys,
} from './pqc-crypto';

// Key Management
export {
  EphemeralKeyManager,
  keyManager,
  type SessionKeyPair,
  type RatchetState,
  type MessageKey,
  type SkippedMessageKey,
} from './key-management';

// File Encryption - Post-Quantum
export {
  encryptFile,
  decryptFile,
  decryptFileName,
  encryptFileWithPassword,
  decryptFileWithPassword,
  encryptFileStream,
  fileEncryption,
  type EncryptedFile,
  type EncryptedFileMetadata,
  type EncryptedChunk,
} from './file-encryption-pqc';

// File Encryption - Password-Protected
export {
  encryptFileWithPasswordLayer,
  decryptPasswordProtectedFile,
  encryptFilePasswordOnly,
  decryptFilePasswordOnly,
  isPasswordProtected,
  type PasswordProtectionMetadata,
  type PasswordProtectedFile,
} from './password-file-encryption';

// ChaCha20-Poly1305 Encryption
export {
  ChaCha20Service,
  chaCha20Service,
  chaCha20Encrypt,
  chaCha20Decrypt,
  generateChaCha20Key,
  type ChaCha20EncryptedData,
} from './chacha20-poly1305';

// Nonce Management
export {
  NonceManager,
  getNonceManager,
  resetNonceManager,
  resetAllNonceManagers,
  createScopedNonceManager,
} from './nonce-manager';

// Digital Signatures
export {
  getOrGenerateSigningKey,
  signFile,
  verifyFileSignature,
  getPublicKeyFingerprint,
  clearSigningKey,
  type SigningKeyPair,
  type FileSignature,
} from './digital-signatures';

// Peer Authentication
export {
  generateSAS,
  verifySAS,
  generateNumericSAS,
  isPeerVerified,
  createVerificationSession,
  type VerificationSession,
  type VerificationStatus,
  type SASResult,
} from './peer-authentication';

// Post-Quantum Signatures
export {
  pqSignatures,
  generatePQSignatureKeyPair,
  signMessage,
  type PQSignatureKeyPair,
  type PQSignature,
  type SignedMessage,
} from './pq-signatures';

// Lazy-loaded PQC (for code splitting)
export {
  LazyPQCryptoService,
  lazyPQCrypto,
  preloadPQCCrypto as preloadLazyPQC,
  generatePQCKeypair,
  encapsulateSecret,
  decapsulateSecret,
} from './pqc-crypto-lazy';

// Argon2 Password Hashing
export {
  deriveKeyFromPassword,
  deriveKeyArgon2id,
  deriveKeyPBKDF2,
  calculatePasswordStrength,
  generateSalt,
  isArgon2Available,
  type Argon2Options,
  type PBKDF2Options,
  type DeriveKeyOptions,
  ARGON2_DEFAULTS,
  PBKDF2_DEFAULTS,
  type KDFAlgorithm,
} from './argon2-browser';

// SLH-DSA Signatures (NIST standardized)
export {
  slhDsa,
  generateKeyPair as generateSLHDSAKeyPair,
  sign as signWithSLHDSA,
  verify as verifyWithSLHDSA,
  type SLHDSAKeyPair,
  type SLHDSASignature,
  type SLHDSASignedMessage,
} from './slh-dsa';

// SHA-3 Hashing
export {
  sha3_256,
  createSha3_256,
  sha3Hex,
  shake128,
  shake256,
  bytesToHex as sha3BytesToHex,
  hexToBytes as sha3HexToBytes,
  type Sha3Context,
  type Sha3Stream,
  type ShakeStream,
} from './sha3';

// BLAKE3 Hashing
export {
  hash as blake3Hash,
  blake3Hex,
  deriveKey as blake3DeriveKey,
  keyedHash as blake3KeyedHash,
  createHasher as blake3CreateHasher,
  constantTimeEqual as blake3ConstantTimeEqual,
  Blake3Service,
  blake3,
  type Blake3Hasher,
} from './blake3';

// AEGIS-256 Authenticated Encryption
export {
  Aegis256Service,
  aegis256Service,
  aegis256Encrypt,
  aegis256Decrypt,
  generateAegis256Key,
  type Aegis256EncryptedData,
} from './aegis256';

// Triple Ratchet Algorithm (for forward secrecy)
export {
  TripleRatchet,
  type DoubleRatchetState,
  type TripleRatchetState,
  type TripleRatchetMessage,
} from './triple-ratchet';

// Sparse PQ Ratchet (post-quantum forward secrecy)
export {
  SparsePQRatchet,
  type SCKAState,
  type SCKAMessage,
  type EpochAdvanceResult,
} from './sparse-pq-ratchet';

// Signed Pre-keys
export {
  generateIdentityKeyPair,
  generateSignedPrekey,
  verifySignedPrekey,
  generateOneTimePrekeys,
  initializePrekeyStore,
  getPublicPrekeyBundle,
  establishSessionAsInitiator,
  establishSessionAsResponder,
  type IdentityKeyPair,
  type SignedPrekey,
  type SignedPrekeyPair,
  type OneTimePrekey,
  type PreKeyBundle,
  type PrekeyStore,
} from './signed-prekeys';

// Crypto Loader (manages WASM initialization)
export {
  loadPQCCrypto,
  loadFileEncryption,
  loadDigitalSignatures,
  preloadCrypto,
  getCryptoModule,
  cryptoLoaders,
  type CryptoLoader,
} from './crypto-loader';

// Crypto Worker Client
export {
  cryptoWorker,
} from './crypto-worker-client';

// PQC Preloading
export {
  preloadAllPQC,
  preloadOnHover,
  preloadOnMount,
  isPQCReady,
  getPreloadStatus,
  type PreloadStatus,
} from './preload-pqc';
