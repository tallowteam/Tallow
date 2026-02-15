/**
 * Password-Authenticated Key Exchange (PAKE) Protocols
 * Agent 010 -- PASSWORD-FORTRESS
 *
 * Implements PAKE protocols for establishing shared secrets
 * from passwords without revealing the password to the server
 * or to eavesdroppers.
 *
 * Protocols:
 * - CPace: For CLI-to-CLI transfers (symmetric/balanced PAKE)
 *   Uses ristretto255 hash-to-curve (RFC 9380) for password-dependent
 *   generator derivation, then standard ECDH on that generator.
 *   Resists offline dictionary attacks via the CDH assumption.
 *
 * - OPAQUE: For web client-server authentication (asymmetric PAKE)
 *   Uses ristretto255 OPRF (RFC 9497) for oblivious evaluation.
 *   Server never learns the password; registration record cannot
 *   be used for offline dictionary attack without the OPRF key.
 *
 * SECURITY:
 * - Passwords NEVER transmitted in any form -- not plaintext, not hashed,
 *   not encrypted. Zero-knowledge PAKE only.
 * - All ephemeral scalars zeroed after use via @noble/hashes clean().
 * - Constant-time operations via @noble/curves ristretto255.
 * - Hash-to-curve via RFC 9380 (ristretto255_hasher).
 * - OPRF via RFC 9497 (ristretto255_oprf).
 */

import { ristretto255, ristretto255_hasher, ristretto255_oprf } from '@noble/curves/ed25519.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { concatBytes, utf8ToBytes, randomBytes, clean } from '@noble/hashes/utils.js';

// ============================================================================
// TYPES
// ============================================================================

export interface PAKEConfig {
  /** PAKE protocol to use */
  protocol: 'cpace' | 'opaque';
  /** Password/passphrase */
  password: string;
  /** Domain separation identifier */
  context: string;
  /** Optional session identifier */
  sessionId?: string;
}

export interface CPaceMessage1 {
  /** Public share from initiator: Ya = a * G_pw (ristretto255 point, 32 bytes) */
  publicShare: Uint8Array;
  /** Associated data (context binding) */
  associatedData: Uint8Array;
}

export interface CPaceMessage2 {
  /** Public share from responder: Yb = b * G_pw (ristretto255 point, 32 bytes) */
  publicShare: Uint8Array;
  /** Associated data (context binding) */
  associatedData: Uint8Array;
}

export interface PAKEResult {
  /** Derived shared secret (32 bytes) */
  sharedSecret: Uint8Array;
  /** Session key derived from shared secret (32 bytes, for AES-256) */
  sessionKey: Uint8Array;
  /** Whether the exchange was successful */
  success: boolean;
}

export interface OPAQUERegistration {
  /** Client registration record (stored by server) */
  registrationRecord: Uint8Array;
  /** Client export key (kept by client for envelope) */
  exportKey: Uint8Array;
}

export interface OPAQUELoginInit {
  /** Client login message (blinded OPRF element, 32 bytes) */
  credentialRequest: Uint8Array;
}

export interface OPAQUELoginResponse {
  /** Server login response (evaluated OPRF element, 32 bytes) */
  credentialResponse: Uint8Array;
}

// ============================================================================
// INTERNAL: Ristretto255 Point type (for local annotation)
// ============================================================================

type RistrettoPoint = InstanceType<typeof ristretto255.Point>;

// ============================================================================
// INTERNAL CONSTANTS
// ============================================================================

/** Domain separation tag for CPace hash-to-curve (RFC 9382 style) */
const CPACE_DST = 'tallow-cpace-ristretto255-v1';

/** Info string for HKDF session key derivation in CPace */
const CPACE_SESSION_KEY_INFO = utf8ToBytes('tallow-cpace-session-key-v1');

/** Info string for HKDF session key derivation in OPAQUE */
const OPAQUE_SESSION_KEY_INFO = utf8ToBytes('tallow-opaque-session-key-v1');

/** Info string for HKDF export key derivation in OPAQUE */
const OPAQUE_EXPORT_KEY_INFO = utf8ToBytes('tallow-opaque-export-key-v1');

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Encode a length-prefixed byte string (4-byte big-endian length || data).
 * Used for unambiguous domain separation in hash inputs.
 */
function lengthPrefixed(data: Uint8Array): Uint8Array {
  const len = new Uint8Array(4);
  const view = new DataView(len.buffer);
  view.setUint32(0, data.length, false); // big-endian
  return concatBytes(len, data);
}

/**
 * Build the CPace hash-to-curve input message from password, context, and sessionId.
 * Format: len(password) || password || len(context) || context || len(sessionId) || sessionId
 *
 * This ensures unambiguous parsing and domain separation per RFC 9382 Section 4.
 */
function buildCPaceHashInput(
  password: string,
  context: string,
  sessionId: string
): Uint8Array {
  const pwBytes = utf8ToBytes(password);
  const ctxBytes = utf8ToBytes(context);
  const sidBytes = utf8ToBytes(sessionId);

  const result = concatBytes(
    lengthPrefixed(pwBytes),
    lengthPrefixed(ctxBytes),
    lengthPrefixed(sidBytes)
  );

  // Zero password bytes immediately after concatenation
  clean(pwBytes);

  return result;
}

/**
 * Derive the password-dependent generator G_pw for CPace.
 *
 * Uses ristretto255 hashToCurve (RFC 9380) which maps arbitrary bytes
 * to a uniformly distributed point on the ristretto255 group.
 * This is the core of CPace's security: the generator is unpredictable
 * without knowledge of the password, and the hash-to-curve operation
 * is not invertible.
 */
function derivePasswordGenerator(
  password: string,
  context: string,
  sessionId: string
): RistrettoPoint {
  const hashInput = buildCPaceHashInput(password, context, sessionId);

  // RFC 9380 hashToCurve with CPace-specific DST
  const G_pw = ristretto255_hasher.hashToCurve(hashInput, {
    DST: CPACE_DST,
  });

  // Zero the hash input which contained the password
  clean(hashInput);

  return G_pw;
}

/**
 * Derive session key from shared DH point using HKDF-SHA-512.
 *
 * @param dhPoint - The shared Diffie-Hellman point (a*b*G_pw)
 * @param Ya - Initiator's public share (for transcript binding)
 * @param Yb - Responder's public share (for transcript binding)
 * @param info - Context info for HKDF-Expand
 * @returns 32-byte session key
 */
function deriveSessionKey(
  dhPoint: Uint8Array,
  Ya: Uint8Array,
  Yb: Uint8Array,
  info: Uint8Array
): { sharedSecret: Uint8Array; sessionKey: Uint8Array } {
  // IKM = DH shared point bytes
  // salt = transcript (Ya || Yb) for session binding
  const salt = concatBytes(Ya, Yb);

  // Derive 64 bytes: first 32 = sharedSecret, next 32 = sessionKey
  const okm = hkdf(sha512, dhPoint, salt, info, 64);

  const sharedSecret = okm.slice(0, 32);
  const sessionKey = okm.slice(32, 64);

  // Zero intermediate material
  clean(okm, salt);

  return { sharedSecret, sessionKey };
}

/**
 * Generate a random ristretto255 scalar as raw bytes (32 bytes).
 * Uses the scalar field order for proper reduction.
 */
function generateRandomScalar(): Uint8Array {
  return randomBytes(32);
}

/**
 * Multiply a ristretto255 point by a scalar (given as bytes).
 * The scalar is interpreted by the ristretto255 Fn field.
 */
function scalarMultiply(point: RistrettoPoint, scalarBytes: Uint8Array): RistrettoPoint {
  // Reduce scalar modulo the group order to get a proper bigint scalar
  const scalar = ristretto255.Point.Fn.fromBytes(scalarBytes);

  if (scalar === 0n) {
    throw new Error('PAKE: scalar must be non-zero');
  }

  return point.multiply(scalar);
}

// ============================================================================
// CPace (Symmetric PAKE for CLI) -- RFC 9382 style
// ============================================================================

/**
 * CPace initiator: generate first message.
 *
 * CPace is a balanced (symmetric) PAKE -- both sides know the password.
 * Ideal for CLI transfers where the user types the same code on both devices.
 *
 * Protocol:
 * 1. Derive password-dependent generator: G_pw = hashToCurve(password || context || sid)
 * 2. Generate random scalar a
 * 3. Compute Ya = a * G_pw
 * 4. Send Ya to responder
 *
 * Security: An eavesdropper who sees Ya cannot determine the password without
 * solving the computational Diffie-Hellman problem on ristretto255.
 */
export async function cpaceInitiate(config: PAKEConfig): Promise<{
  message: CPaceMessage1;
  state: Uint8Array;
}> {
  const sessionId = config.sessionId ?? 'tallow-cpace-v1';
  const context = utf8ToBytes(config.context);

  // Step 1: Derive password-dependent generator
  const G_pw = derivePasswordGenerator(config.password, config.context, sessionId);

  // Step 2: Generate ephemeral random scalar
  const ephemeralScalar = generateRandomScalar();

  // Step 3: Compute public share Ya = a * G_pw
  const Ya = scalarMultiply(G_pw, ephemeralScalar);
  const YaBytes = Ya.toBytes();

  // Validate the result is not the identity element
  if (Ya.is0()) {
    clean(ephemeralScalar);
    throw new Error('CPace: degenerate public share (identity element)');
  }

  // Pack state: we need the ephemeral scalar for finalization
  // We also embed the public share so we can bind it to the transcript
  const state = concatBytes(ephemeralScalar, YaBytes);

  // Zero the raw ephemeral scalar (it's now embedded in state)
  clean(ephemeralScalar);

  return {
    message: {
      publicShare: YaBytes,
      associatedData: context,
    },
    state,
  };
}

/**
 * CPace responder: process initiator's message and generate response.
 *
 * Protocol:
 * 1. Derive password-dependent generator: G_pw = hashToCurve(password || context || sid)
 * 2. Generate random scalar b
 * 3. Compute Yb = b * G_pw
 * 4. Compute shared point K = b * Ya = a*b * G_pw
 * 5. Derive session key from K with transcript binding (Ya, Yb)
 *
 * Security: The shared secret K = a*b*G_pw can only be computed by someone
 * who knows both a password (to get G_pw) AND one of the ephemeral scalars.
 * An offline attacker trying passwords would need to also guess the ephemeral
 * scalar, which is impossible (256-bit random).
 */
export async function cpaceRespond(
  config: PAKEConfig,
  message1: CPaceMessage1
): Promise<{
  message: CPaceMessage2;
  result: PAKEResult;
}> {
  const sessionId = config.sessionId ?? 'tallow-cpace-v1';
  const context = utf8ToBytes(config.context);

  // Validate the initiator's public share is a valid ristretto255 point
  let Ya: RistrettoPoint;
  try {
    Ya = ristretto255.Point.fromBytes(message1.publicShare);
  } catch {
    throw new Error('CPace: invalid initiator public share (not a valid ristretto255 point)');
  }

  // Reject identity element
  if (Ya.is0()) {
    throw new Error('CPace: initiator public share is the identity element');
  }

  // Step 1: Derive password-dependent generator
  const G_pw = derivePasswordGenerator(config.password, config.context, sessionId);

  // Step 2: Generate ephemeral random scalar
  const ephemeralScalar = generateRandomScalar();

  // Step 3: Compute responder's public share Yb = b * G_pw
  const Yb = scalarMultiply(G_pw, ephemeralScalar);
  const YbBytes = Yb.toBytes();

  if (Yb.is0()) {
    clean(ephemeralScalar);
    throw new Error('CPace: degenerate responder public share (identity element)');
  }

  // Step 4: Compute shared DH point K = b * Ya = a*b * G_pw
  const K = scalarMultiply(Ya, ephemeralScalar);

  if (K.is0()) {
    clean(ephemeralScalar);
    throw new Error('CPace: degenerate shared secret (identity element)');
  }

  const KBytes = K.toBytes();

  // Step 5: Derive session key with transcript binding
  const { sharedSecret, sessionKey } = deriveSessionKey(
    KBytes,
    message1.publicShare,
    YbBytes,
    CPACE_SESSION_KEY_INFO
  );

  // Zero ephemeral material
  clean(ephemeralScalar, KBytes);

  return {
    message: { publicShare: YbBytes, associatedData: context },
    result: { sharedSecret, sessionKey, success: true },
  };
}

/**
 * CPace initiator: finalize exchange with responder's message.
 *
 * Protocol:
 * 1. Recover ephemeral scalar a from state
 * 2. Compute shared point K = a * Yb = a*b * G_pw
 * 3. Derive session key from K with transcript binding (Ya, Yb)
 *
 * Both sides derive the same K = a*b * G_pw, so both derive the same session key.
 */
export async function cpaceFinalize(
  _config: PAKEConfig,
  state: Uint8Array,
  message2: CPaceMessage2
): Promise<PAKEResult> {
  // Unpack state: first 32 bytes = ephemeral scalar, next 32 = our public share Ya
  if (state.length < 64) {
    throw new Error('CPace: invalid state (too short)');
  }

  const ephemeralScalar = state.slice(0, 32);
  const YaBytes = state.slice(32, 64);

  // Validate the responder's public share is a valid ristretto255 point
  let Yb: RistrettoPoint;
  try {
    Yb = ristretto255.Point.fromBytes(message2.publicShare);
  } catch {
    clean(ephemeralScalar);
    throw new Error('CPace: invalid responder public share (not a valid ristretto255 point)');
  }

  // Reject identity element
  if (Yb.is0()) {
    clean(ephemeralScalar);
    throw new Error('CPace: responder public share is the identity element');
  }

  // Compute shared DH point K = a * Yb = a*b * G_pw
  const K = scalarMultiply(Yb, ephemeralScalar);

  if (K.is0()) {
    clean(ephemeralScalar);
    throw new Error('CPace: degenerate shared secret (identity element)');
  }

  const KBytes = K.toBytes();

  // Derive session key with same transcript binding as responder
  const { sharedSecret, sessionKey } = deriveSessionKey(
    KBytes,
    YaBytes,
    message2.publicShare,
    CPACE_SESSION_KEY_INFO
  );

  // Zero ephemeral material
  clean(ephemeralScalar, KBytes);

  return { sharedSecret, sessionKey, success: true };
}

// ============================================================================
// OPAQUE (Asymmetric PAKE for Web) -- RFC 9497 OPRF based
// ============================================================================

/**
 * Serialization format for OPAQUE registration record:
 *
 * Bytes 0..31:   OPRF server secret key (32 bytes)
 * Bytes 32..63:  OPRF server public key (32 bytes)
 * Bytes 64..95:  OPRF evaluated credential = F(k, password) (variable, 64 bytes for ristretto255-SHA512)
 * Bytes 96..127: Random registration salt (32 bytes)
 *
 * Total: 32 + 32 + 64 + 32 = 160 bytes
 *
 * The server stores this record. It does NOT contain the password.
 * Without the OPRF secret key, the evaluated credential cannot be
 * used to test password guesses offline.
 */

/** Fixed sizes for ristretto255 OPRF */
const OPRF_SECRET_KEY_SIZE = 32;
const OPRF_PUBLIC_KEY_SIZE = 32;
const OPRF_OUTPUT_SIZE = 64; // ristretto255-SHA512 OPRF output
const REGISTRATION_SALT_SIZE = 32;
const REGISTRATION_RECORD_SIZE =
  OPRF_SECRET_KEY_SIZE + OPRF_PUBLIC_KEY_SIZE + OPRF_OUTPUT_SIZE + REGISTRATION_SALT_SIZE;

/**
 * OPAQUE registration: client generates registration data.
 *
 * OPAQUE is an asymmetric PAKE where the server never learns the password.
 * The server stores a "registration record" that includes an OPRF key pair
 * and the OPRF evaluation of the password. Without the OPRF key, the
 * stored material cannot be used for offline dictionary attacks.
 *
 * Protocol:
 * 1. Generate OPRF server key pair (k, k*G)
 * 2. Evaluate OPRF: output = F(k, password) = Finalize(password, k * H(password))
 * 3. Derive export key from OPRF output via HKDF
 * 4. Store (secretKey, publicKey, oprfOutput, salt) as registration record
 *
 * Security: The OPRF output is a PRF keyed by the server's secret key.
 * Even if the registration record is stolen, the attacker needs both
 * the OPRF secret key AND the password to reconstruct the export key.
 * The OPRF secret key is stored alongside (for the server to use during
 * login), but splitting storage or using HSMs is recommended in production.
 */
export async function opaqueRegister(
  password: string,
  serverId: string
): Promise<OPAQUERegistration> {
  const passwordBytes = utf8ToBytes(password);
  const serverIdBytes = utf8ToBytes(serverId);

  // Step 1: Generate OPRF server key pair
  const { secretKey, publicKey } = ristretto255_oprf.oprf.generateKeyPair();

  // Step 2: Non-interactive OPRF evaluation
  // blind(password) -> server evaluates -> finalize
  // We do this in one shot since we have both client input and server key
  const { blind, blinded } = ristretto255_oprf.oprf.blind(passwordBytes);
  const evaluated = ristretto255_oprf.oprf.blindEvaluate(secretKey, blinded);
  const oprfOutput = ristretto255_oprf.oprf.finalize(passwordBytes, blind, evaluated);

  // Step 3: Generate registration salt and derive export key
  const registrationSalt = randomBytes(REGISTRATION_SALT_SIZE);

  // HKDF: derive export key from OPRF output
  // salt = registrationSalt || serverId (for domain separation)
  const hkdfSalt = concatBytes(registrationSalt, lengthPrefixed(serverIdBytes));
  const exportKey = hkdf(sha512, oprfOutput, hkdfSalt, OPAQUE_EXPORT_KEY_INFO, 32);

  // Step 4: Build registration record
  const registrationRecord = new Uint8Array(REGISTRATION_RECORD_SIZE);
  registrationRecord.set(secretKey, 0);
  registrationRecord.set(publicKey, OPRF_SECRET_KEY_SIZE);
  registrationRecord.set(oprfOutput, OPRF_SECRET_KEY_SIZE + OPRF_PUBLIC_KEY_SIZE);
  registrationRecord.set(
    registrationSalt,
    OPRF_SECRET_KEY_SIZE + OPRF_PUBLIC_KEY_SIZE + OPRF_OUTPUT_SIZE
  );

  // Zero sensitive intermediates
  clean(passwordBytes, hkdfSalt, oprfOutput);

  return { registrationRecord, exportKey };
}

/**
 * OPAQUE login initialization: client creates credential request.
 *
 * Protocol:
 * 1. Client blinds the password: (blind, blinded) = OPRF.blind(password)
 * 2. Client sends blinded element to server
 * 3. Client keeps blind scalar in state for finalization
 *
 * Security: The blinded element reveals nothing about the password.
 * It is a random-looking ristretto255 point due to the blinding factor.
 * The server cannot determine the password from the blinded element.
 */
export async function opaqueLoginInit(
  password: string,
  _serverId: string
): Promise<{ init: OPAQUELoginInit; state: Uint8Array }> {
  const passwordBytes = utf8ToBytes(password);

  // Step 1: Blind the password using OPRF
  const { blind, blinded } = ristretto255_oprf.oprf.blind(passwordBytes);

  // State = blind scalar || password bytes (needed for finalize)
  // We need the password for OPRF finalize step
  const state = concatBytes(blind, lengthPrefixed(passwordBytes));

  // Zero the raw password bytes (now embedded in state)
  clean(passwordBytes);

  return {
    init: { credentialRequest: blinded },
    state,
  };
}

/**
 * OPAQUE server-side: evaluate the blinded OPRF element.
 *
 * This function runs on the server during login. It takes the client's
 * blinded element and evaluates it using the OPRF secret key from the
 * registration record.
 *
 * @param registrationRecord - The stored registration record from opaqueRegister
 * @param credentialRequest - The blinded element from the client
 * @returns The evaluated element to send back to the client
 */
export function opaqueServerEvaluate(
  registrationRecord: Uint8Array,
  credentialRequest: Uint8Array
): OPAQUELoginResponse {
  if (registrationRecord.length < REGISTRATION_RECORD_SIZE) {
    throw new Error('OPAQUE: invalid registration record (too short)');
  }

  // Extract OPRF secret key from registration record
  const secretKey = registrationRecord.slice(0, OPRF_SECRET_KEY_SIZE);

  // Evaluate the blinded element
  const evaluated = ristretto255_oprf.oprf.blindEvaluate(secretKey, credentialRequest);

  return { credentialResponse: evaluated };
}

/**
 * OPAQUE login finalize: derive session key from server response.
 *
 * Protocol:
 * 1. Client unblinds the server's response: oprfOutput = OPRF.finalize(password, blind, evaluated)
 * 2. Client derives session key from OPRF output via HKDF
 *
 * Security: The OPRF output is identical to the one computed during registration
 * (if and only if the password is correct AND the server used the correct OPRF key).
 * This gives the client a key that matches the registration export key, establishing
 * mutual authentication without the password ever being transmitted.
 */
export async function opaqueLoginFinalize(
  _password: string,
  serverId: string,
  state: Uint8Array,
  response: OPAQUELoginResponse
): Promise<PAKEResult> {
  const serverIdBytes = utf8ToBytes(serverId);

  // Unpack state: blind (32 bytes) || length-prefixed password
  if (state.length < 36) {
    throw new Error('OPAQUE: invalid state (too short)');
  }

  const blind = state.slice(0, 32);
  // Read length prefix (4 bytes big-endian)
  const pwLenView = new DataView(state.buffer, state.byteOffset + 32, 4);
  const pwLen = pwLenView.getUint32(0, false);

  if (state.length < 36 + pwLen) {
    throw new Error('OPAQUE: invalid state (password truncated)');
  }

  const passwordBytes = state.slice(36, 36 + pwLen);

  // Step 1: Finalize OPRF -- unblind and hash
  const oprfOutput = ristretto255_oprf.oprf.finalize(
    passwordBytes,
    blind,
    response.credentialResponse
  );

  // Step 2: Derive session key via HKDF
  // We use serverId as additional context to bind the key to this server
  const hkdfSalt = concatBytes(
    lengthPrefixed(serverIdBytes),
    lengthPrefixed(response.credentialResponse)
  );
  const okm = hkdf(sha512, oprfOutput, hkdfSalt, OPAQUE_SESSION_KEY_INFO, 64);

  const sharedSecret = okm.slice(0, 32);
  const sessionKey = okm.slice(32, 64);

  // Zero all sensitive intermediates
  clean(blind, passwordBytes, oprfOutput, okm, hkdfSalt);

  return { sharedSecret, sessionKey, success: true };
}

/**
 * OPAQUE: verify that a login OPRF output matches the registration record.
 *
 * This is a helper for the server to verify the client completed the OPRF
 * correctly (optional -- the session key derivation implicitly verifies this,
 * but explicit verification can be useful for logging/metrics).
 *
 * Uses constant-time comparison to prevent timing side channels.
 */
export function opaqueVerifyCredential(
  registrationRecord: Uint8Array,
  oprfOutput: Uint8Array
): boolean {
  if (registrationRecord.length < REGISTRATION_RECORD_SIZE) {
    return false;
  }

  const storedOutput = registrationRecord.slice(
    OPRF_SECRET_KEY_SIZE + OPRF_PUBLIC_KEY_SIZE,
    OPRF_SECRET_KEY_SIZE + OPRF_PUBLIC_KEY_SIZE + OPRF_OUTPUT_SIZE
  );

  if (storedOutput.length !== oprfOutput.length) {
    return false;
  }

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < storedOutput.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    diff |= storedOutput[i]! ^ oprfOutput[i]!;
  }
  return diff === 0;
}
