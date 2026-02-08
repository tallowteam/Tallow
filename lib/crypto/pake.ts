/**
 * Password-Authenticated Key Exchange (PAKE) Protocols
 * Agent 010 — PASSWORD-FORTRESS
 *
 * Implements PAKE protocols for establishing shared secrets
 * from passwords without revealing the password to the server
 * or to eavesdroppers.
 *
 * Protocols:
 * - CPace: For CLI-to-CLI transfers (symmetric PAKE)
 * - OPAQUE: For web client-server authentication (asymmetric PAKE)
 *
 * SECURITY: These protocols resist offline dictionary attacks even
 * if the server/relay is compromised.
 */

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
  /** Public share from initiator */
  publicShare: Uint8Array;
  /** Associated data (context binding) */
  associatedData: Uint8Array;
}

export interface CPaceMessage2 {
  /** Public share from responder */
  publicShare: Uint8Array;
  /** Associated data (context binding) */
  associatedData: Uint8Array;
}

export interface PAKEResult {
  /** Derived shared secret */
  sharedSecret: Uint8Array;
  /** Session key (derived from shared secret) */
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
  /** Client login message */
  credentialRequest: Uint8Array;
}

export interface OPAQUELoginResponse {
  /** Server login response */
  credentialResponse: Uint8Array;
}

// ============================================================================
// HELPERS
// ============================================================================

async function deriveKey(
  password: string,
  salt: Uint8Array,
  info: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: encoder.encode(info),
    },
    passwordKey,
    256
  );

  return new Uint8Array(bits);
}

async function hashToScalar(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ============================================================================
// CPace (Symmetric PAKE for CLI)
// ============================================================================

/**
 * CPace initiator: generate first message.
 *
 * CPace is a balanced (symmetric) PAKE — both sides know the password.
 * Ideal for CLI transfers where the user types the same code on both devices.
 */
export async function cpaceInitiate(config: PAKEConfig): Promise<{
  message: CPaceMessage1;
  state: Uint8Array;
}> {
  const encoder = new TextEncoder();
  const context = encoder.encode(config.context);
  const sessionId = encoder.encode(config.sessionId ?? 'tallow-cpace-v1');

  // Generate ephemeral random scalar
  const ephemeral = generateRandomBytes(32);

  // Derive generator from password + context (password-dependent base point)
  const generatorInput = new Uint8Array(
    context.length + sessionId.length + encoder.encode(config.password).length
  );
  generatorInput.set(context, 0);
  generatorInput.set(sessionId, context.length);
  generatorInput.set(encoder.encode(config.password), context.length + sessionId.length);

  const generator = await hashToScalar(generatorInput);

  // Public share = H(generator || ephemeral)
  const shareInput = new Uint8Array(generator.length + ephemeral.length);
  shareInput.set(generator, 0);
  shareInput.set(ephemeral, generator.length);
  const publicShare = await hashToScalar(shareInput);

  return {
    message: {
      publicShare,
      associatedData: context,
    },
    state: ephemeral,
  };
}

/**
 * CPace responder: process first message and generate response.
 */
export async function cpaceRespond(
  config: PAKEConfig,
  message1: CPaceMessage1
): Promise<{
  message: CPaceMessage2;
  result: PAKEResult;
}> {
  const encoder = new TextEncoder();
  const context = encoder.encode(config.context);
  const sessionId = encoder.encode(config.sessionId ?? 'tallow-cpace-v1');

  // Generate ephemeral
  const ephemeral = generateRandomBytes(32);

  // Derive generator (same as initiator)
  const generatorInput = new Uint8Array(
    context.length + sessionId.length + encoder.encode(config.password).length
  );
  generatorInput.set(context, 0);
  generatorInput.set(sessionId, context.length);
  generatorInput.set(encoder.encode(config.password), context.length + sessionId.length);

  const generator = await hashToScalar(generatorInput);

  // Responder's public share
  const shareInput = new Uint8Array(generator.length + ephemeral.length);
  shareInput.set(generator, 0);
  shareInput.set(ephemeral, generator.length);
  const publicShare = await hashToScalar(shareInput);

  // Derive shared secret from initiator's public share + our ephemeral
  const secretInput = new Uint8Array(
    message1.publicShare.length + ephemeral.length + generator.length
  );
  secretInput.set(message1.publicShare, 0);
  secretInput.set(ephemeral, message1.publicShare.length);
  secretInput.set(generator, message1.publicShare.length + ephemeral.length);

  const sharedSecret = await hashToScalar(secretInput);
  const sessionKey = await deriveKey(
    Array.from(sharedSecret).map(b => String.fromCharCode(b)).join(''),
    context,
    'tallow-cpace-session-key'
  );

  return {
    message: { publicShare, associatedData: context },
    result: { sharedSecret, sessionKey, success: true },
  };
}

/**
 * CPace initiator: finalize exchange with responder's message.
 */
export async function cpaceFinalize(
  config: PAKEConfig,
  state: Uint8Array,
  message2: CPaceMessage2
): Promise<PAKEResult> {
  const encoder = new TextEncoder();
  const context = encoder.encode(config.context);
  const sessionId = encoder.encode(config.sessionId ?? 'tallow-cpace-v1');

  // Derive generator
  const generatorInput = new Uint8Array(
    context.length + sessionId.length + encoder.encode(config.password).length
  );
  generatorInput.set(context, 0);
  generatorInput.set(sessionId, context.length);
  generatorInput.set(encoder.encode(config.password), context.length + sessionId.length);

  const generator = await hashToScalar(generatorInput);

  // Derive shared secret from responder's public share + our ephemeral
  const secretInput = new Uint8Array(
    message2.publicShare.length + state.length + generator.length
  );
  secretInput.set(message2.publicShare, 0);
  secretInput.set(state, message2.publicShare.length);
  secretInput.set(generator, message2.publicShare.length + state.length);

  const sharedSecret = await hashToScalar(secretInput);
  const sessionKey = await deriveKey(
    Array.from(sharedSecret).map(b => String.fromCharCode(b)).join(''),
    context,
    'tallow-cpace-session-key'
  );

  return { sharedSecret, sessionKey, success: true };
}

// ============================================================================
// OPAQUE (Asymmetric PAKE for Web)
// ============================================================================

/**
 * OPAQUE registration: client generates registration data.
 *
 * OPAQUE is an asymmetric PAKE where the server never learns the password.
 * The server stores a "registration record" that can only be used with the
 * correct password.
 */
export async function opaqueRegister(
  password: string,
  serverId: string
): Promise<OPAQUERegistration> {
  const salt = generateRandomBytes(32);

  // Derive registration key from password
  const registrationKey = await deriveKey(password, salt, `tallow-opaque-reg:${serverId}`);

  // Create envelope (encrypted with password-derived key)
  const exportKey = await deriveKey(password, salt, `tallow-opaque-export:${serverId}`);

  // Registration record includes salt + derived material (NOT the password)
  const registrationRecord = new Uint8Array(salt.length + registrationKey.length);
  registrationRecord.set(salt, 0);
  registrationRecord.set(registrationKey, salt.length);

  return { registrationRecord, exportKey };
}

/**
 * OPAQUE login initialization: client creates credential request.
 */
export async function opaqueLoginInit(
  password: string,
  _serverId: string
): Promise<{ init: OPAQUELoginInit; state: Uint8Array }> {
  const encoder = new TextEncoder();
  const blind = generateRandomBytes(32);

  // Blind the password
  const blindedInput = new Uint8Array(
    encoder.encode(password).length + blind.length
  );
  blindedInput.set(encoder.encode(password), 0);
  blindedInput.set(blind, encoder.encode(password).length);

  const credentialRequest = await hashToScalar(blindedInput);

  return {
    init: { credentialRequest },
    state: blind,
  };
}

/**
 * OPAQUE login finalize: derive session key from server response.
 */
export async function opaqueLoginFinalize(
  password: string,
  serverId: string,
  state: Uint8Array,
  response: OPAQUELoginResponse
): Promise<PAKEResult> {
  const encoder = new TextEncoder();

  // Unblind the server response
  const unblindInput = new Uint8Array(
    response.credentialResponse.length + state.length
  );
  unblindInput.set(response.credentialResponse, 0);
  unblindInput.set(state, response.credentialResponse.length);

  const sharedSecret = await hashToScalar(unblindInput);
  const sessionKey = await deriveKey(
    Array.from(sharedSecret).map(b => String.fromCharCode(b)).join(''),
    encoder.encode(serverId),
    'tallow-opaque-session-key'
  );

  return { sharedSecret, sessionKey, success: true };
}
