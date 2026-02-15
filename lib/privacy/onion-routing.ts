/**
 * AGENT 015 - ONION-WEAVER
 *
 * Privacy mode onion routing layer with real layered encryption.
 *
 * Architecture:
 * - Each hop in the circuit gets an ephemeral X25519 key exchange
 * - HKDF-SHA256 derives a 32-byte AES-256-GCM session key per hop
 * - The sender wraps the payload in N layers (one per hop), encrypted
 *   from the innermost (exit) outward (entry)
 * - Each relay peels exactly one layer and forwards the cell to the next hop
 * - The final hop decrypts the innermost layer to recover the plaintext
 * - All cells are fixed-size (CELL_SIZE_BYTES) to prevent traffic analysis
 *
 * Rules:
 * - Privacy mode = 3 hops minimum
 * - Circuit rotation every 10 minutes
 * - Each hop peels one layer of encryption
 * - No relay sees both source and destination
 * - E2E encryption runs underneath (the exit relay never sees cleartext)
 *
 * SECURITY IMPACT: 9 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { gcm } from '@noble/ciphers/aes.js';

// ============================================================================
// Constants
// ============================================================================

/** Minimum number of relay hops in privacy mode */
export const MIN_HOPS = 3;

/** Maximum number of relay hops */
export const MAX_HOPS = 3;

/** Circuit rotation interval in milliseconds (10 minutes) */
export const CIRCUIT_ROTATION_MS = 10 * 60 * 1000;

/** Maximum circuit age before forced rotation */
export const MAX_CIRCUIT_AGE_MS = CIRCUIT_ROTATION_MS;

/** Fixed cell size in bytes to prevent traffic analysis by packet size */
export const CELL_SIZE_BYTES = 512;

/** AES-256-GCM nonce length */
const NONCE_BYTES = 12;

/** AES-256-GCM auth tag length */
const TAG_BYTES = 16;

/** X25519 public key length */
const X25519_PUBLIC_KEY_BYTES = 32;

/** Derived session key length */
const SESSION_KEY_BYTES = 32;

/**
 * Overhead per onion layer:
 *   32 bytes ephemeral public key
 * + 12 bytes nonce
 * + 16 bytes auth tag
 * +  2 bytes next-hop address length prefix
 * = 62 bytes + next-hop address bytes
 *
 * We reserve a fixed 128 bytes per layer for headers so the cell
 * math is deterministic regardless of address length.
 */
// Layer header size (128 bytes) is documented for protocol reference

/** HKDF info for onion layer key derivation */
const HKDF_INFO_LAYER = new TextEncoder().encode('tallow-onion-layer-v1');

// HKDF info for relay handshake key derivation: 'tallow-onion-handshake-v1'

/** Cell command bytes */
export const CELL_CMD = {
  /** Relay data cell carrying onion-encrypted payload */
  RELAY_DATA: 0x01,
  /** Circuit creation handshake (client -> relay) */
  CREATE: 0x02,
  /** Circuit creation response (relay -> client) */
  CREATED: 0x03,
  /** Extend circuit through this relay to next hop */
  EXTEND: 0x04,
  /** Extension result from downstream relay */
  EXTENDED: 0x05,
  /** Tear down the circuit */
  DESTROY: 0x06,
  /** Padding / keep-alive */
  PADDING: 0x00,
} as const;

export type CellCommand = (typeof CELL_CMD)[keyof typeof CELL_CMD];

// ============================================================================
// Types
// ============================================================================

export interface RelayNode {
  /** Unique node identifier */
  id: string;
  /** Long-term X25519 public key for this relay (32 bytes) */
  publicKey: Uint8Array;
  /** Hex-encoded representation of publicKey for serialization */
  publicKeyHex: string;
  /** Relay WebSocket endpoint address */
  address: string;
  /** Whether the node is currently reachable */
  available: boolean;
}

export interface HopKeys {
  /** Ephemeral X25519 private key (sender side, zeroed after use) */
  ephemeralPrivate: Uint8Array;
  /** Ephemeral X25519 public key (sent to relay in CREATE/EXTEND) */
  ephemeralPublic: Uint8Array;
  /** Derived AES-256-GCM session key for this hop */
  sessionKey: Uint8Array;
}

export interface OnionCircuit {
  /** Circuit identifier (128-bit, hex-encoded) */
  circuitId: string;
  /** Ordered list of relay nodes (entry -> middle -> exit) */
  hops: RelayNode[];
  /** Per-hop encryption keys, same order as hops */
  hopKeys: HopKeys[];
  /** When this circuit was created */
  createdAt: number;
  /** When this circuit expires (createdAt + CIRCUIT_ROTATION_MS) */
  expiresAt: number;
  /** Whether this circuit has been torn down */
  tornDown: boolean;
}

/**
 * A fixed-size cell for transmission over the onion network.
 * Every cell is exactly CELL_SIZE_BYTES regardless of payload length.
 */
export interface OnionCell {
  /** Circuit ID for multiplexing (16 bytes, hex-encoded 32 chars) */
  circuitId: string;
  /** Cell command byte */
  command: CellCommand;
  /** Cell body (padded to fill CELL_SIZE_BYTES) */
  body: Uint8Array;
}

export interface OnionLayer {
  /** Encrypted payload for this hop */
  payload: Uint8Array;
  /** Next hop address (encrypted, only visible to current hop after decryption) */
  nextHop: string;
}

export interface OnionWeaverConfig {
  /** Whether onion routing is enabled (privacy mode) */
  enabled: boolean;
  /** Number of hops (must be >= MIN_HOPS, <= MAX_HOPS) */
  hopCount: number;
  /** Circuit rotation interval in ms */
  rotationMs: number;
}

// ============================================================================
// Defaults
// ============================================================================

export const ONION_WEAVER_DEFAULTS: OnionWeaverConfig = {
  enabled: false,
  hopCount: MIN_HOPS,
  rotationMs: CIRCUIT_ROTATION_MS,
};

// ============================================================================
// Utility Functions
// ============================================================================

/** Convert Uint8Array to hex string */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert hex string to Uint8Array */
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Generate cryptographically secure random bytes */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** Securely zero a Uint8Array in place */
function secureZero(arr: Uint8Array): void {
  // Overwrite with random first to defeat optimization
  crypto.getRandomValues(arr);
  arr.fill(0);
}

// ============================================================================
// Key Exchange & Derivation
// ============================================================================

/**
 * Perform X25519 Diffie-Hellman key exchange and derive an AES-256-GCM
 * session key via HKDF-SHA256.
 *
 * @param relayPublicKey  The relay's long-term X25519 public key (32 bytes)
 * @returns HopKeys containing the ephemeral keypair and derived session key
 */
export function negotiateHopKeys(relayPublicKey: Uint8Array): HopKeys {
  if (relayPublicKey.length !== X25519_PUBLIC_KEY_BYTES) {
    throw new Error(
      `ONION-WEAVER: relay public key must be ${X25519_PUBLIC_KEY_BYTES} bytes, ` +
        `got ${relayPublicKey.length}`,
    );
  }

  // Generate ephemeral X25519 keypair
  const ephemeralPrivate = x25519.utils.randomSecretKey();
  const ephemeralPublic = x25519.getPublicKey(ephemeralPrivate);

  // Compute shared secret: ECDH(ephemeral_private, relay_public)
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivate, relayPublicKey);

  // Derive session key via HKDF-SHA256
  // salt = ephemeralPublic || relayPublicKey (binds key to both parties)
  const salt = new Uint8Array(X25519_PUBLIC_KEY_BYTES * 2);
  salt.set(ephemeralPublic, 0);
  salt.set(relayPublicKey, X25519_PUBLIC_KEY_BYTES);

  const sessionKey = hkdf(sha256, sharedSecret, salt, HKDF_INFO_LAYER, SESSION_KEY_BYTES);

  // Zero the raw shared secret immediately
  secureZero(sharedSecret);

  return {
    ephemeralPrivate,
    ephemeralPublic,
    sessionKey,
  };
}

/**
 * Relay-side: derive the same session key from the client's ephemeral
 * public key and our own private key.
 *
 * @param clientEphemeralPublic  The client's ephemeral X25519 public key
 * @param relayPrivateKey        The relay's long-term X25519 private key
 * @param relayPublicKey         The relay's long-term X25519 public key
 * @returns The derived AES-256-GCM session key (32 bytes)
 */
export function deriveRelaySessionKey(
  clientEphemeralPublic: Uint8Array,
  relayPrivateKey: Uint8Array,
  relayPublicKey: Uint8Array,
): Uint8Array {
  const sharedSecret = x25519.getSharedSecret(relayPrivateKey, clientEphemeralPublic);

  const salt = new Uint8Array(X25519_PUBLIC_KEY_BYTES * 2);
  salt.set(clientEphemeralPublic, 0);
  salt.set(relayPublicKey, X25519_PUBLIC_KEY_BYTES);

  const sessionKey = hkdf(sha256, sharedSecret, salt, HKDF_INFO_LAYER, SESSION_KEY_BYTES);

  secureZero(sharedSecret);
  return sessionKey;
}

// ============================================================================
// AES-256-GCM Layer Encryption
// ============================================================================

/**
 * Encrypt a single onion layer with AES-256-GCM.
 *
 * Output format: [12-byte nonce][ciphertext][16-byte tag]
 *
 * @param plaintext   The data to encrypt
 * @param sessionKey  The 32-byte AES-256-GCM key for this hop
 * @returns Encrypted bytes: nonce || ciphertext || tag
 */
export function encryptLayer(plaintext: Uint8Array, sessionKey: Uint8Array): Uint8Array {
  if (sessionKey.length !== SESSION_KEY_BYTES) {
    throw new Error(`ONION-WEAVER: session key must be ${SESSION_KEY_BYTES} bytes`);
  }

  const nonce = randomBytes(NONCE_BYTES);
  const cipher = gcm(sessionKey, nonce);
  const sealed = cipher.encrypt(plaintext);

  // sealed = ciphertext || tag (noble/ciphers gcm appends tag)
  const output = new Uint8Array(NONCE_BYTES + sealed.length);
  output.set(nonce, 0);
  output.set(sealed, NONCE_BYTES);

  return output;
}

/**
 * Decrypt a single onion layer with AES-256-GCM.
 *
 * @param encrypted   The encrypted data: nonce || ciphertext || tag
 * @param sessionKey  The 32-byte AES-256-GCM key for this hop
 * @returns Decrypted plaintext
 * @throws If authentication fails
 */
export function decryptLayer(encrypted: Uint8Array, sessionKey: Uint8Array): Uint8Array {
  if (sessionKey.length !== SESSION_KEY_BYTES) {
    throw new Error(`ONION-WEAVER: session key must be ${SESSION_KEY_BYTES} bytes`);
  }

  if (encrypted.length < NONCE_BYTES + TAG_BYTES) {
    throw new Error('ONION-WEAVER: encrypted data too short');
  }

  const nonce = encrypted.slice(0, NONCE_BYTES);
  const sealed = encrypted.slice(NONCE_BYTES);

  const cipher = gcm(sessionKey, nonce);
  try {
    return cipher.decrypt(sealed);
  } catch {
    throw new Error('ONION-WEAVER: layer decryption failed - authentication error');
  }
}

// ============================================================================
// Onion Wrapping (Multi-Layer Encryption)
// ============================================================================

/**
 * Inner structure placed inside each onion layer.
 *
 * Binary format:
 *   [1 byte]  flags (0x01 = has next hop, 0x00 = final destination)
 *   [2 bytes] next-hop address length (big-endian)
 *   [N bytes] next-hop address (UTF-8)
 *   [4 bytes] payload length (big-endian)
 *   [M bytes] payload (the inner onion or the actual data)
 */

/** Encode a layer payload with routing info and inner data */
function encodeLayerPayload(nextHop: string, innerData: Uint8Array): Uint8Array {
  const addressBytes = new TextEncoder().encode(nextHop);
  // 1 (flags) + 2 (addr len) + addr + 4 (payload len) + payload
  const total = 1 + 2 + addressBytes.length + 4 + innerData.length;
  const result = new Uint8Array(total);
  const view = new DataView(result.buffer);

  let offset = 0;
  // flags: 0x01 = has next hop
  result[offset++] = nextHop.length > 0 ? 0x01 : 0x00;
  // address length
  view.setUint16(offset, addressBytes.length, false);
  offset += 2;
  // address
  result.set(addressBytes, offset);
  offset += addressBytes.length;
  // payload length
  view.setUint32(offset, innerData.length, false);
  offset += 4;
  // payload
  result.set(innerData, offset);

  return result;
}

/** Decode a layer payload to extract routing info and inner data */
function decodeLayerPayload(data: Uint8Array): { nextHop: string; innerData: Uint8Array } {
  if (data.length < 7) {
    throw new Error('ONION-WEAVER: layer payload too short to decode');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  const flags = data[offset++]!;
  const addrLen = view.getUint16(offset, false);
  offset += 2;

  if (data.length < offset + addrLen + 4) {
    throw new Error('ONION-WEAVER: layer payload truncated at address');
  }

  const nextHop =
    flags === 0x01
      ? new TextDecoder().decode(data.slice(offset, offset + addrLen))
      : '';
  offset += addrLen;

  const payloadLen = view.getUint32(offset, false);
  offset += 4;

  if (data.length < offset + payloadLen) {
    throw new Error('ONION-WEAVER: layer payload truncated at inner data');
  }

  const innerData = data.slice(offset, offset + payloadLen);
  return { nextHop, innerData };
}

/**
 * Wrap a payload in N layers of onion encryption.
 *
 * The wrapping proceeds from the innermost layer (exit relay) outward
 * (entry relay). Each layer encrypts:
 *   - The next-hop address (where this relay should forward the cell)
 *   - The already-encrypted inner layers (or the original payload for the exit)
 *
 * The result can be sent to hops[0] (the entry relay), which decrypts
 * one layer to find the address of hops[1] and the remaining encrypted
 * data to forward, and so on.
 *
 * @param payload       The original plaintext data to deliver to the destination
 * @param circuit       The circuit with established hop keys
 * @param destination   The final destination address (after the exit relay)
 * @returns The fully wrapped onion-encrypted data
 */
export function wrapOnion(
  payload: Uint8Array,
  circuit: OnionCircuit,
  destination: string,
): Uint8Array {
  if (circuit.hops.length === 0 || circuit.hopKeys.length === 0) {
    throw new Error('ONION-WEAVER: circuit has no hops');
  }
  if (circuit.hops.length !== circuit.hopKeys.length) {
    throw new Error('ONION-WEAVER: hops/keys length mismatch');
  }

  let currentData = payload;

  // Build the list of "next hops" for each relay:
  // hop[i] forwards to hop[i+1].address, except the last hop forwards to `destination`
  const nextHops: string[] = [];
  for (let i = 0; i < circuit.hops.length; i++) {
    if (i === circuit.hops.length - 1) {
      // Exit relay forwards to the final destination
      nextHops.push(destination);
    } else {
      nextHops.push(circuit.hops[i + 1]!.address);
    }
  }

  // Wrap from inside out: last hop first, then second-to-last, etc.
  for (let i = circuit.hops.length - 1; i >= 0; i--) {
    const hopKey = circuit.hopKeys[i]!;
    const nextHop = nextHops[i]!;

    // Encode routing info + inner data
    const layerPayload = encodeLayerPayload(nextHop, currentData);

    // Encrypt with this hop's session key
    currentData = encryptLayer(layerPayload, hopKey.sessionKey);
  }

  return currentData;
}

/**
 * Unwrap (peel) one layer of onion encryption.
 *
 * This is the operation a relay performs: decrypt the outer layer using
 * its session key to reveal the next-hop address and the still-encrypted
 * inner data to forward.
 *
 * @param data        The encrypted cell body received by this relay
 * @param sessionKey  This relay's session key for the circuit
 * @returns The next hop address and the inner (still encrypted) data
 */
export function unwrapOnionLayer(
  data: Uint8Array,
  sessionKey: Uint8Array,
): { nextHop: string; innerData: Uint8Array } {
  const decrypted = decryptLayer(data, sessionKey);
  return decodeLayerPayload(decrypted);
}

// ============================================================================
// Fixed-Size Cell Construction
// ============================================================================

/**
 * Build a fixed-size onion cell for transmission.
 *
 * Cell format (CELL_SIZE_BYTES total):
 *   [32 bytes] circuit ID (hex-encoded, ASCII)
 *   [ 1 byte ] command
 *   [ 2 bytes] payload length (big-endian)
 *   [N bytes ] payload
 *   [P bytes ] random padding to fill CELL_SIZE_BYTES
 *
 * Fixed header = 32 + 1 + 2 = 35 bytes
 * Max payload = CELL_SIZE_BYTES - 35 = 477 bytes
 */
const CELL_HEADER_BYTES = 35;
const MAX_CELL_PAYLOAD = CELL_SIZE_BYTES - CELL_HEADER_BYTES;

export function buildCell(
  circuitId: string,
  command: CellCommand,
  payload: Uint8Array,
): Uint8Array {
  if (payload.length > MAX_CELL_PAYLOAD) {
    throw new Error(
      `ONION-WEAVER: cell payload too large: ${payload.length} > ${MAX_CELL_PAYLOAD}`,
    );
  }

  const cell = new Uint8Array(CELL_SIZE_BYTES);
  const view = new DataView(cell.buffer);

  // Circuit ID (32 hex chars = 16 bytes circuit ID, NUL-padded)
  const circuitIdAscii = new TextEncoder().encode(circuitId.padEnd(32, '\0').slice(0, 32));
  cell.set(circuitIdAscii, 0);

  // Command byte
  cell[32] = command;

  // Payload length
  view.setUint16(33, payload.length, false);

  // Payload
  cell.set(payload, CELL_HEADER_BYTES);

  // Fill remaining bytes with random padding
  const paddingStart = CELL_HEADER_BYTES + payload.length;
  if (paddingStart < CELL_SIZE_BYTES) {
    const padding = randomBytes(CELL_SIZE_BYTES - paddingStart);
    cell.set(padding, paddingStart);
  }

  return cell;
}

/**
 * Parse a fixed-size cell.
 *
 * @param cell  The raw cell bytes (must be exactly CELL_SIZE_BYTES)
 * @returns Parsed cell components
 */
export function parseCell(cell: Uint8Array): OnionCell {
  if (cell.length !== CELL_SIZE_BYTES) {
    throw new Error(
      `ONION-WEAVER: cell must be exactly ${CELL_SIZE_BYTES} bytes, got ${cell.length}`,
    );
  }

  const view = new DataView(cell.buffer, cell.byteOffset, cell.byteLength);

  // Circuit ID
  const circuitIdBytes = cell.slice(0, 32);
  const circuitId = new TextDecoder().decode(circuitIdBytes).replace(/\0+$/, '');

  // Command
  const command = cell[32] as CellCommand;

  // Payload length
  const payloadLen = view.getUint16(33, false);

  // Extract payload (discard padding)
  const body = cell.slice(CELL_HEADER_BYTES, CELL_HEADER_BYTES + payloadLen);

  return { circuitId, command, body };
}

/**
 * Build a padding cell (for traffic analysis resistance).
 * Indistinguishable from real cells when encrypted.
 */
export function buildPaddingCell(circuitId: string): Uint8Array {
  return buildCell(circuitId, CELL_CMD.PADDING, randomBytes(0));
}

// ============================================================================
// Circuit Management
// ============================================================================

/**
 * Build a new onion circuit with at least MIN_HOPS relays.
 *
 * This performs:
 * 1. Relay selection from available relays using CSPRNG shuffling
 * 2. Ephemeral X25519 key negotiation with each selected relay
 * 3. Circuit ID generation
 *
 * @param availableRelays  Pool of available relay nodes
 * @param hopCount         Number of hops (default: MIN_HOPS, must be >= MIN_HOPS)
 * @returns The constructed circuit with established keys
 * @throws If insufficient relays or hopCount < MIN_HOPS
 */
export function buildCircuit(
  availableRelays: RelayNode[],
  hopCount: number = MIN_HOPS,
): OnionCircuit {
  if (hopCount < MIN_HOPS) {
    throw new Error(
      `ONION-WEAVER: minHops must be >= ${MIN_HOPS}. Got: ${hopCount}`,
    );
  }
  if (hopCount > MAX_HOPS) {
    throw new Error(
      `ONION-WEAVER: hopCount must be <= ${MAX_HOPS}. Got: ${hopCount}`,
    );
  }

  const reachable = availableRelays.filter((r) => r.available);
  if (reachable.length < hopCount) {
    throw new Error(
      `ONION-WEAVER: need >= ${hopCount} available relays, got ${reachable.length}`,
    );
  }

  // Fisher-Yates shuffle with CSPRNG
  const shuffled = [...reachable];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = random[0]! % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  const hops = shuffled.slice(0, hopCount);

  // Negotiate keys with each hop
  const hopKeys: HopKeys[] = hops.map((hop) => negotiateHopKeys(hop.publicKey));

  // Generate 128-bit circuit ID
  const idBytes = randomBytes(16);
  const circuitId = toHex(idBytes);

  const now = Date.now();
  return {
    circuitId,
    hops,
    hopKeys,
    createdAt: now,
    expiresAt: now + CIRCUIT_ROTATION_MS,
    tornDown: false,
  };
}

/**
 * Check if a circuit needs rotation (expired or torn down).
 */
export function circuitNeedsRotation(circuit: OnionCircuit): boolean {
  return circuit.tornDown || Date.now() >= circuit.expiresAt;
}

/**
 * Tear down a circuit: mark as unusable and securely destroy all key material.
 *
 * @param circuit  The circuit to tear down
 * @returns A copy of the circuit marked as torn down (keys are zeroed in place)
 */
export function teardownCircuit(circuit: OnionCircuit): OnionCircuit {
  // Securely zero all key material
  for (const hopKey of circuit.hopKeys) {
    secureZero(hopKey.ephemeralPrivate);
    secureZero(hopKey.sessionKey);
    // ephemeralPublic is not secret but zero it anyway for hygiene
    secureZero(hopKey.ephemeralPublic);
  }

  return { ...circuit, tornDown: true, hopKeys: [] };
}

/**
 * Validate config meets ONION-WEAVER policy.
 */
export function enforceOnionWeaverPolicy(config: OnionWeaverConfig): void {
  if (config.enabled) {
    if (config.hopCount < MIN_HOPS) {
      throw new Error(
        `ONION-WEAVER: minHops must be >= ${MIN_HOPS}. Got: ${config.hopCount}`,
      );
    }
    if (config.rotationMs > CIRCUIT_ROTATION_MS) {
      throw new Error(
        `ONION-WEAVER: rotation interval must be <= ${CIRCUIT_ROTATION_MS}ms. ` +
          `Got: ${config.rotationMs}ms`,
      );
    }
  }
}

// ============================================================================
// Relay Handshake Protocol
// ============================================================================

/**
 * Build a CREATE cell to establish a circuit with the entry relay.
 *
 * The cell body contains our ephemeral public key so the relay can
 * compute the same shared secret via X25519.
 *
 * @param circuit  The circuit being established
 * @returns A fixed-size CREATE cell to send to the entry relay
 */
export function buildCreateCell(circuit: OnionCircuit): Uint8Array {
  const entryHopKeys = circuit.hopKeys[0];
  if (!entryHopKeys) {
    throw new Error('ONION-WEAVER: circuit has no entry hop keys');
  }

  return buildCell(circuit.circuitId, CELL_CMD.CREATE, entryHopKeys.ephemeralPublic);
}

/**
 * Build an EXTEND cell to extend the circuit through an existing relay
 * to the next hop.
 *
 * The EXTEND payload is encrypted under the existing hop's session key.
 * When relay[i] decrypts it, it sees:
 *   - The address of relay[i+1] to connect to
 *   - The ephemeral public key to send to relay[i+1] in a CREATE
 *
 * @param circuit   The circuit being extended
 * @param hopIndex  The index of the NEW hop being added (1 for middle, 2 for exit)
 * @returns A fixed-size EXTEND cell
 */
export function buildExtendCell(circuit: OnionCircuit, hopIndex: number): Uint8Array {
  if (hopIndex < 1 || hopIndex >= circuit.hops.length) {
    throw new Error(`ONION-WEAVER: invalid hop index for EXTEND: ${hopIndex}`);
  }

  const targetHop = circuit.hops[hopIndex]!;
  const targetHopKeys = circuit.hopKeys[hopIndex]!;

  // Encode the extension payload: nextHopAddress + ephemeral public key
  const addressBytes = new TextEncoder().encode(targetHop.address);
  const extendPayload = new Uint8Array(
    2 + addressBytes.length + X25519_PUBLIC_KEY_BYTES,
  );
  const view = new DataView(extendPayload.buffer);
  view.setUint16(0, addressBytes.length, false);
  extendPayload.set(addressBytes, 2);
  extendPayload.set(targetHopKeys.ephemeralPublic, 2 + addressBytes.length);

  // Encrypt the extend payload under all preceding hops' keys (inside-out)
  // For hop index 1: encrypt under hop[0]'s key
  // For hop index 2: encrypt under hop[1]'s key, then hop[0]'s key
  let encrypted = extendPayload;
  for (let i = hopIndex - 1; i >= 0; i--) {
    encrypted = encryptLayer(encrypted, circuit.hopKeys[i]!.sessionKey);
  }

  return buildCell(circuit.circuitId, CELL_CMD.EXTEND, encrypted);
}

/**
 * Build a DESTROY cell to tear down a circuit.
 *
 * @param circuitId  The circuit to destroy
 * @returns A fixed-size DESTROY cell
 */
export function buildDestroyCell(circuitId: string): Uint8Array {
  return buildCell(circuitId, CELL_CMD.DESTROY, new Uint8Array(0));
}

/**
 * Build a RELAY_DATA cell containing onion-encrypted payload.
 *
 * For payloads larger than MAX_CELL_PAYLOAD, the caller must chunk
 * the wrapped onion data into multiple cells.
 *
 * @param circuitId  The circuit ID
 * @param data       The onion-encrypted data (already wrapped)
 * @returns An array of fixed-size RELAY_DATA cells
 */
export function buildRelayDataCells(
  circuitId: string,
  data: Uint8Array,
): Uint8Array[] {
  const cells: Uint8Array[] = [];

  for (let offset = 0; offset < data.length; offset += MAX_CELL_PAYLOAD) {
    const chunk = data.slice(offset, offset + MAX_CELL_PAYLOAD);
    cells.push(buildCell(circuitId, CELL_CMD.RELAY_DATA, chunk));
  }

  // If data is empty, send one empty relay cell
  if (cells.length === 0) {
    cells.push(buildCell(circuitId, CELL_CMD.RELAY_DATA, new Uint8Array(0)));
  }

  return cells;
}

// ============================================================================
// Relay-Side Operations
// ============================================================================

/**
 * Relay-side: handle a CREATE cell to establish a circuit.
 *
 * Extracts the client's ephemeral public key and derives the shared
 * session key.
 *
 * @param cell            The parsed CREATE cell
 * @param relayPrivateKey The relay's long-term X25519 private key
 * @param relayPublicKey  The relay's long-term X25519 public key
 * @returns The derived session key for this circuit
 */
export function handleCreateCell(
  cell: OnionCell,
  relayPrivateKey: Uint8Array,
  relayPublicKey: Uint8Array,
): Uint8Array {
  if (cell.command !== CELL_CMD.CREATE) {
    throw new Error('ONION-WEAVER: expected CREATE cell');
  }

  if (cell.body.length !== X25519_PUBLIC_KEY_BYTES) {
    throw new Error(
      `ONION-WEAVER: CREATE cell body must be ${X25519_PUBLIC_KEY_BYTES} bytes, ` +
        `got ${cell.body.length}`,
    );
  }

  const clientEphemeralPublic = cell.body;
  return deriveRelaySessionKey(clientEphemeralPublic, relayPrivateKey, relayPublicKey);
}

/**
 * Relay-side: process a RELAY_DATA cell by peeling one encryption layer.
 *
 * @param cell        The parsed RELAY_DATA cell
 * @param sessionKey  The session key for this circuit on this relay
 * @returns The next hop address and inner data to forward
 */
export function relayProcessDataCell(
  cell: OnionCell,
  sessionKey: Uint8Array,
): { nextHop: string; innerData: Uint8Array } {
  if (cell.command !== CELL_CMD.RELAY_DATA) {
    throw new Error('ONION-WEAVER: expected RELAY_DATA cell');
  }

  return unwrapOnionLayer(cell.body, sessionKey);
}

// ============================================================================
// Circuit Manager (Stateful)
// ============================================================================

/**
 * Manages multiple active circuits with automatic rotation.
 *
 * This is the primary interface for the onion routing subsystem.
 * It handles circuit lifecycle, key management, and rotation.
 */
export class OnionCircuitManager {
  private circuits: Map<string, OnionCircuit> = new Map();
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private config: OnionWeaverConfig;

  constructor(config: OnionWeaverConfig = ONION_WEAVER_DEFAULTS) {
    this.config = { ...config };
  }

  /**
   * Start automatic circuit rotation.
   * Checks every 60 seconds for circuits needing rotation.
   */
  startRotation(): void {
    if (this.rotationTimer) return;

    this.rotationTimer = setInterval(() => {
      for (const [id, circuit] of this.circuits) {
        if (circuitNeedsRotation(circuit)) {
          this.destroyCircuit(id);
        }
      }
    }, 60_000);
  }

  /** Stop automatic circuit rotation */
  stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  /**
   * Create a new circuit from the available relay pool.
   *
   * @param availableRelays  Pool of available relay nodes
   * @returns The new circuit
   */
  createCircuit(availableRelays: RelayNode[]): OnionCircuit {
    const circuit = buildCircuit(availableRelays, this.config.hopCount);
    this.circuits.set(circuit.circuitId, circuit);
    return circuit;
  }

  /**
   * Get a circuit by ID, or null if not found / expired.
   */
  getCircuit(circuitId: string): OnionCircuit | null {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) return null;

    if (circuitNeedsRotation(circuit)) {
      this.destroyCircuit(circuitId);
      return null;
    }

    return circuit;
  }

  /**
   * Destroy a circuit and securely wipe its keys.
   */
  destroyCircuit(circuitId: string): void {
    const circuit = this.circuits.get(circuitId);
    if (circuit) {
      teardownCircuit(circuit);
      this.circuits.delete(circuitId);
    }
  }

  /**
   * Destroy all circuits.
   */
  destroyAll(): void {
    for (const id of [...this.circuits.keys()]) {
      this.destroyCircuit(id);
    }
  }

  /**
   * Get the number of active circuits.
   */
  get activeCount(): number {
    return this.circuits.size;
  }

  /**
   * Get all active circuit IDs.
   */
  getActiveCircuitIds(): string[] {
    return [...this.circuits.keys()];
  }

  /**
   * Update configuration. Enforces ONION-WEAVER policy.
   */
  updateConfig(config: Partial<OnionWeaverConfig>): void {
    const merged = { ...this.config, ...config };
    enforceOnionWeaverPolicy(merged);
    this.config = merged;
  }

  /** Get current config */
  getConfig(): Readonly<OnionWeaverConfig> {
    return { ...this.config };
  }

  /**
   * Cleanup: destroy all circuits and stop rotation.
   */
  cleanup(): void {
    this.stopRotation();
    this.destroyAll();
  }
}

// ============================================================================
// Convenience: Relay Node Factory
// ============================================================================

/**
 * Create a RelayNode from its public key (hex) and address.
 * Useful for constructing relay directory entries.
 */
export function createRelayNode(
  id: string,
  publicKeyHex: string,
  address: string,
  available: boolean = true,
): RelayNode {
  return {
    id,
    publicKey: fromHex(publicKeyHex),
    publicKeyHex,
    address,
    available,
  };
}

/**
 * Generate a relay keypair for testing or relay bootstrap.
 *
 * @returns { privateKey, publicKey, publicKeyHex }
 */
export function generateRelayKeypair(): {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyHex: string;
} {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKey,
    publicKey,
    publicKeyHex: toHex(publicKey),
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  MIN_HOPS,
  MAX_HOPS,
  CIRCUIT_ROTATION_MS,
  CELL_SIZE_BYTES,
  CELL_CMD,
  ONION_WEAVER_DEFAULTS,
  buildCircuit,
  circuitNeedsRotation,
  teardownCircuit,
  enforceOnionWeaverPolicy,
  negotiateHopKeys,
  deriveRelaySessionKey,
  encryptLayer,
  decryptLayer,
  wrapOnion,
  unwrapOnionLayer,
  buildCell,
  parseCell,
  buildPaddingCell,
  buildCreateCell,
  buildExtendCell,
  buildDestroyCell,
  buildRelayDataCells,
  handleCreateCell,
  relayProcessDataCell,
  createRelayNode,
  generateRelayKeypair,
  OnionCircuitManager,
};
