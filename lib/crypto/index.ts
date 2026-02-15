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

// Symmetric Cipher Selection + Sentinel
export {
  CIPHER_SELECTION_PRIORITY,
  CIPHER_NONCE_SIZES,
  CIPHER_TAG_SIZES,
  CIPHER_KEY_SIZES,
  isCipherAllowedInFips,
  selectSymmetricCipher,
  getSupportedCiphers,
  negotiateCipher,
  isValidCipherAlgorithm,
  type SymmetricCipherAlgorithm,
  type CipherSelectionOptions,
} from './cipher-selection';

export {
  SymmetricNonceCounter,
  SymmetricSentinel,
  symmetricSentinel,
  buildDirectionalNonce,
  type SymmetricEncryptedChunk,
  type NonceDirection,
  type EncryptChunkOptions,
  type DecryptChunkOptions,
  SYMMETRIC_NONCE_BYTES,
  AEGIS_NONCE_BYTES,
  SYMMETRIC_AUTH_TAG_BYTES,
  SYMMETRIC_DIRECTION_SENDER,
  SYMMETRIC_DIRECTION_RECEIVER,
} from './symmetric';

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

// AGENT 011 - SIGNATURE-AUTHORITY: Unified Signatures
export {
  signatures,
  generateEd25519KeyPair,
  ed25519Sign,
  ed25519Verify,
  generateMLDSAKeyPair,
  mldsaSign,
  mldsaVerify,
  generateSLHDSAKeyPair,
  slhdsaSign,
  slhdsaVerify,
  generateHybridKeyPair,
  hybridSign,
  hybridVerify,
  signData,
  signDataHybrid,
  verifyData,
  constantTimeEqual,
  computeFingerprint,
  computeHybridFingerprint,
  selectAlgorithm,
  SIGNATURE_ALGORITHM_ED25519,
  SIGNATURE_ALGORITHM_ML_DSA_65,
  SIGNATURE_ALGORITHM_SLH_DSA,
  SIGNATURE_ALGORITHM_HYBRID,
  ED25519_SIGNATURE_SIZE,
  ED25519_PUBLIC_KEY_SIZE,
  ED25519_PRIVATE_KEY_SIZE,
  ML_DSA_65_SIGNATURE_SIZE,
  ML_DSA_65_PUBLIC_KEY_SIZE,
  ML_DSA_65_SECRET_KEY_SIZE,
  SLH_DSA_SIGNATURE_SIZE,
  SLH_DSA_PUBLIC_KEY_SIZE,
  SLH_DSA_SECRET_KEY_SIZE,
  type Ed25519KeyPair,
  type MLDSAKeyPair,
  type SLHDSAKeyPair as SignatureSLHDSAKeyPair,
  type HybridKeyPair as SignatureHybridKeyPair,
  type UnifiedSignature,
  type HybridSignature,
  type SignatureAlgorithm,
  type Ed25519PublicKey,
  type Ed25519PrivateKey,
  type MLDSAPublicKey,
  type MLDSASecretKey,
  type SLHDSAPublicKey,
  type SLHDSASecretKey,
} from './signatures';

// AGENT 011 - SIGNATURE-AUTHORITY: Prekey Bundles
export {
  prekeys,
  generatePrekeyIdentity,
  generateSignedPrekey as generateSignedPrekeyRecord,
  verifySignedPrekeyEd25519,
  verifySignedPrekeyMLDSA,
  verifySignedPrekeyHybrid,
  verifySignedPrekeySLHDSA,
  signPrekeyWithSLHDSA,
  shouldRotatePrekey,
  rotateSignedPrekey,
  generateOneTimePrekeys as generateOneTimePrekeyRecords,
  consumeOneTimePrekey,
  replenishOneTimePrekeys,
  issueRevocationCertificate,
  verifyRevocationCertificate,
  isKeyRevoked,
  buildPrekeyBundle,
  verifyPrekeyBundle,
  initializePrekeyStoreState,
  PREKEY_ROTATION_INTERVAL_MS,
  MAX_ONE_TIME_PREKEYS,
  ONE_TIME_PREKEY_REPLENISH_THRESHOLD,
  type PrekeyIdentity,
  type SignedPrekeyRecord,
  type OneTimePrekeyRecord,
  type RevocationCertificate,
  type PrekeyBundle as PrekeyBundleV2,
  type PrekeyStoreState,
  type RevocationReason,
} from './prekeys';

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

// AGENT 017 - MEMORY-WARDEN: Secure buffer management and key zeroing
export {
  SecureBuffer,
  zeroMemory,
  zeroMemoryAll,
  destroyAllKeys,
  getSecureBufferStats,
  createSecureBuffer,
  encryptForStorage,
  decryptFromStorage,
  deriveStorageKey,
} from './secure-buffer';

// PQC Preloading
export {
  preloadAllPQC,
  preloadOnHover,
  preloadOnMount,
  isPQCReady,
  getPreloadStatus,
  type PreloadStatus,
} from './preload-pqc';

// HASH-ORACLE: Hashing facade + domain separation registry
export {
  hash as hashOracleHash,
  hashHex as hashOracleHex,
  keyedHash as hashOracleKeyedHash,
  constantTimeEqual as hashOracleConstantTimeEqual,
  deriveKey as hashOracleDeriveKey,
  createHasher as hashOracleCreateHasher,
  hashChunkToHex,
  verifyChunkHash,
  DOMAIN_HYBRID_KEX,
  DOMAIN_ROOT_KEY,
  DOMAIN_CHAIN_KEY,
  DOMAIN_MESSAGE_KEY,
  DOMAIN_NONCE_SEED,
  DOMAIN_STORAGE_KEY,
  DOMAIN_SEPARATION_REGISTRY,
  type DomainSeparationContext,
} from './hashing';

// HASH-ORACLE: Merkle tree integrity verification
export {
  buildMerkleTree,
  buildMerkleTreeFromHashes,
  generateProof,
  verifyProof,
  verifyChunk,
  hashChunk,
  createFileIntegrityManifest,
  verifyFileIntegrity,
  type MerkleNode,
  type MerkleTree,
  type MerkleProof,
  type ChunkIntegrity,
  type FileIntegrityManifest,
} from './integrity';
