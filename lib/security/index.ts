/**
 * Security Module - Centralized Export
 * Advanced security hardening features for Tallow
 */

// Import for local use
import { memoryWiper } from './memory-wiper';
import { timingSafe } from './timing-safe';
import { CredentialEncryption } from './credential-encryption';
import { createKeyRotationManager } from './key-rotation';

// Memory wiping utilities
export {
  secureWipeBuffer,
  secureWipeString,
  secureWipeBuffers,
  secureWipeObject,
  secureWipeChunk,
  compareAndWipe,
  createAutoWipeCleanup,
  SecureWrapper,
  createSecureWrapper,
  memoryWiper,
  type ChunkData,
} from './memory-wiper';

// Timing-safe comparison utilities
export {
  timingSafeEqual,
  timingSafeStringCompare,
  timingSafeHMACVerify,
  timingSafeTokenCompare,
  timingSafeHashCompare,
  timingSafePrefixCheck,
  timingSafeIndexCheck,
  timingSafeCompare,
  createTimingSafeValidator,
  timingSafeAuthCheck,
  timingSafeTokenLookup,
  timingSafeDelay,
  timingSafeOperation,
  timingSafe,
} from './timing-safe';

// Key rotation with forward secrecy
export {
  KeyRotationManager,
  createKeyRotationManager,
  type RotatingSessionKeys,
  type KeyRotationConfig,
} from './key-rotation';

// Credential encryption
export {
  CredentialEncryption,
  storeTurnCredentials,
  retrieveTurnCredentials,
  rotateAllCredentials,
  type EncryptedCredential,
  type TurnCredentials,
  type EncryptedTurnCredentials,
  type EncryptedField,
} from './credential-encryption';

/**
 * Convenience object with all security utilities
 */
export const security = {
  // Memory management
  memory: memoryWiper,

  // Timing-safe operations
  timing: timingSafe,

  // Key rotation
  keyRotation: {
    create: createKeyRotationManager,
  },

  // Credential encryption
  credentials: CredentialEncryption,
};

export default security;
