/**
 * Password Security Module
 * Agent 010 -- PASSWORD-FORTRESS
 *
 * Enforces password-based authentication invariants:
 * - Argon2id with RFC 9106 minimum parameters (memory >= 64 MiB, timeCost >= 3, parallelism >= 4)
 * - Salt: 16+ bytes from CSPRNG, unique per password derivation
 * - Output: 32 bytes (256-bit key material for AES-256 key derivation)
 * - Passwords NEVER transmitted in any form -- PAKE protocols only
 * - CPace for CLI (balanced PAKE), OPAQUE for web (asymmetric PAKE)
 *
 * GPU brute-force cost target: >$1M for dictionary attack at 64 MiB memory cost
 */

import {
  ARGON2_DEFAULTS,
  PBKDF2_DEFAULTS,
  deriveKeyArgon2id,
  deriveKeyPBKDF2,
  generateSalt,
  type Argon2Options,
} from './argon2-browser';

// ============================================================================
// PASSWORD-FORTRESS INVARIANTS
// ============================================================================

/**
 * Minimum Argon2id parameters per Agent 010 policy.
 * These values MUST NOT be reduced. They align with RFC 9106 and OWASP 2023.
 */
export const PASSWORD_FORTRESS_ARGON2_MIN = {
  /** Minimum memory in KiB (64 MiB) */
  memory: 65536,
  /** Minimum time cost (iterations/passes) */
  timeCost: 3,
  /** Minimum parallelism (lanes) */
  parallelism: 4,
  /** Minimum salt length in bytes */
  saltLength: 16,
  /** Output length in bytes (256 bits for AES-256) */
  hashLength: 32,
} as const;

/**
 * Minimum PBKDF2 iterations (for fallback only, when WASM unavailable).
 * Per OWASP 2023: 600,000 iterations for SHA-256.
 */
export const PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS = 600000;

/**
 * PAKE protocol assignment per transport context.
 */
export const PAKE_PROTOCOL_ASSIGNMENT = {
  /** CLI transfers use CPace (balanced/symmetric PAKE) */
  cli: 'cpace',
  /** Web authentication uses OPAQUE (asymmetric PAKE) */
  web: 'opaque',
} as const;

export type PAKETransportContext = keyof typeof PAKE_PROTOCOL_ASSIGNMENT;

// ============================================================================
// PARAMETER ENFORCEMENT
// ============================================================================

/**
 * Validate that Argon2id parameters meet PASSWORD-FORTRESS minimums.
 * Throws if any parameter is below the required floor.
 */
export function enforceArgon2Minimums(options?: Argon2Options): void {
  const memory = options?.memory ?? ARGON2_DEFAULTS.memory;
  const timeCost = options?.iterations ?? ARGON2_DEFAULTS.iterations;
  const parallelism = options?.parallelism ?? ARGON2_DEFAULTS.parallelism;
  const hashLength = options?.hashLength ?? ARGON2_DEFAULTS.hashLength;

  if (memory < PASSWORD_FORTRESS_ARGON2_MIN.memory) {
    throw new Error(
      `Argon2id memory must be >= ${PASSWORD_FORTRESS_ARGON2_MIN.memory} KiB (64 MiB). Got: ${memory}`
    );
  }

  if (timeCost < PASSWORD_FORTRESS_ARGON2_MIN.timeCost) {
    throw new Error(
      `Argon2id timeCost must be >= ${PASSWORD_FORTRESS_ARGON2_MIN.timeCost}. Got: ${timeCost}`
    );
  }

  if (parallelism < PASSWORD_FORTRESS_ARGON2_MIN.parallelism) {
    throw new Error(
      `Argon2id parallelism must be >= ${PASSWORD_FORTRESS_ARGON2_MIN.parallelism}. Got: ${parallelism}`
    );
  }

  if (hashLength < PASSWORD_FORTRESS_ARGON2_MIN.hashLength) {
    throw new Error(
      `Argon2id hashLength must be >= ${PASSWORD_FORTRESS_ARGON2_MIN.hashLength}. Got: ${hashLength}`
    );
  }
}

/**
 * Validate that a salt meets PASSWORD-FORTRESS requirements.
 * Throws if salt is too short.
 */
export function enforceSaltMinimum(salt: Uint8Array): void {
  if (salt.length < PASSWORD_FORTRESS_ARGON2_MIN.saltLength) {
    throw new Error(
      `Salt must be >= ${PASSWORD_FORTRESS_ARGON2_MIN.saltLength} bytes (CSPRNG). Got: ${salt.length}`
    );
  }
}

/**
 * Validate that PBKDF2 iterations meet the 600K minimum.
 * Throws if iteration count is below the floor.
 */
export function enforcePBKDF2Minimum(iterations: number): void {
  if (iterations < PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS) {
    throw new Error(
      `PBKDF2 iterations must be >= ${PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS}. Got: ${iterations}`
    );
  }
}

// ============================================================================
// HARDENED KEY DERIVATION
// ============================================================================

/**
 * Derive a key from a password using Argon2id with enforced minimum parameters.
 * This is the PRIMARY key derivation function for PASSWORD-FORTRESS.
 *
 * @param password - The user password (never transmitted)
 * @param salt - Salt from CSPRNG, >= 16 bytes, unique per derivation
 * @param options - Optional overrides (must meet or exceed minimums)
 * @returns 32-byte derived key
 */
export async function derivePasswordKey(
  password: string,
  salt: Uint8Array,
  options?: Argon2Options
): Promise<Uint8Array> {
  enforceSaltMinimum(salt);
  enforceArgon2Minimums(options);
  return deriveKeyArgon2id(password, salt, options);
}

/**
 * Derive a key using PBKDF2 fallback with enforced 600K iteration minimum.
 * Only used when WASM Argon2id is unavailable.
 *
 * @param password - The user password (never transmitted)
 * @param salt - Salt from CSPRNG, >= 16 bytes
 * @param iterations - Must be >= 600,000
 * @returns 32-byte derived key
 */
export async function derivePasswordKeyPBKDF2Fallback(
  password: string,
  salt: Uint8Array,
  iterations?: number
): Promise<Uint8Array> {
  const iterCount = iterations ?? PBKDF2_DEFAULTS.iterations;
  enforceSaltMinimum(salt);
  enforcePBKDF2Minimum(iterCount);
  return deriveKeyPBKDF2(password, salt, { iterations: iterCount });
}

/**
 * Generate a CSPRNG salt of the required minimum length.
 * Defaults to 32 bytes (exceeds the 16-byte minimum).
 */
export function generateFortressSalt(length: number = 32): Uint8Array {
  if (length < PASSWORD_FORTRESS_ARGON2_MIN.saltLength) {
    throw new Error(
      `Salt length must be >= ${PASSWORD_FORTRESS_ARGON2_MIN.saltLength}. Got: ${length}`
    );
  }
  return generateSalt(length);
}

// ============================================================================
// PAKE PROTOCOL RESOLUTION
// ============================================================================

/**
 * Resolve the correct PAKE protocol for a given transport context.
 * CLI -> CPace (balanced), Web -> OPAQUE (asymmetric).
 */
export function resolvePAKEProtocol(context: PAKETransportContext): 'cpace' | 'opaque' {
  return PAKE_PROTOCOL_ASSIGNMENT[context];
}

/**
 * Verify that the correct PAKE protocol is being used for the given context.
 * Throws if the protocol does not match the required assignment.
 */
export function enforcePAKEProtocol(
  context: PAKETransportContext,
  protocol: string
): void {
  const required = PAKE_PROTOCOL_ASSIGNMENT[context];
  if (protocol !== required) {
    throw new Error(
      `Transport context "${context}" requires PAKE protocol "${required}", but got "${protocol}"`
    );
  }
}

// ============================================================================
// DEFAULTS VERIFICATION
// ============================================================================

/**
 * Verify that the project-wide Argon2 defaults meet PASSWORD-FORTRESS minimums.
 * Returns true if all defaults are compliant, false otherwise.
 */
export function verifyArgon2DefaultsCompliant(): boolean {
  return (
    ARGON2_DEFAULTS.memory >= PASSWORD_FORTRESS_ARGON2_MIN.memory &&
    ARGON2_DEFAULTS.iterations >= PASSWORD_FORTRESS_ARGON2_MIN.timeCost &&
    ARGON2_DEFAULTS.parallelism >= PASSWORD_FORTRESS_ARGON2_MIN.parallelism &&
    ARGON2_DEFAULTS.hashLength >= PASSWORD_FORTRESS_ARGON2_MIN.hashLength
  );
}

/**
 * Verify that the project-wide PBKDF2 defaults meet the 600K iteration floor.
 */
export function verifyPBKDF2DefaultsCompliant(): boolean {
  return PBKDF2_DEFAULTS.iterations >= PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS;
}

export default {
  PASSWORD_FORTRESS_ARGON2_MIN,
  PASSWORD_FORTRESS_PBKDF2_MIN_ITERATIONS,
  PAKE_PROTOCOL_ASSIGNMENT,
  enforceArgon2Minimums,
  enforceSaltMinimum,
  enforcePBKDF2Minimum,
  derivePasswordKey,
  derivePasswordKeyPBKDF2Fallback,
  generateFortressSalt,
  resolvePAKEProtocol,
  enforcePAKEProtocol,
  verifyArgon2DefaultsCompliant,
  verifyPBKDF2DefaultsCompliant,
};
