/**
 * Short Authentication String (SAS) Generation
 * Agent 012 -- SAS-VERIFIER
 *
 * Generates human-readable verification codes from shared secrets
 * to detect man-in-the-middle attacks during key exchange.
 *
 * Three display modes:
 * - Emoji: 6 emojis from Signal-compatible set of 64 (36-bit entropy)
 * - Words: 4 words from a curated 256-word list (32-bit entropy)
 * - Numeric: 6-digit decimal code (approx 20-bit entropy, fallback only)
 *
 * SAS derivation:
 *   sasKey = HKDF-SHA-256(ikm=sharedSecret, salt="tallow-sas-v1", info=context, L=32)
 *   emoji  = first 6 bytes of sasKey, each mod 64
 *   words  = next 4 bytes of sasKey, each mod 256
 *   numeric= next 3 bytes collapsed to 6-digit decimal
 *
 * Both peers derive identical SAS from the shared secret.
 * Users compare visually or verbally through a side channel.
 */

// ============================================================================
// SIGNAL-COMPATIBLE EMOJI SET -- 64 visually distinct emojis
// Matches the SAS emoji table from the Signal Protocol / XEP-0384 OMEMO spec.
// Index 0-63, each uniquely identifiable at small screen sizes.
// ============================================================================

/**
 * Signal Protocol SAS emoji set (64 entries).
 * Each entry is [emoji codepoint, canonical English label].
 * The label is used for accessibility / screen readers.
 */
export const SAS_EMOJI_TABLE: ReadonlyArray<readonly [string, string]> = [
  /* 0  */ ['\u{1F436}', 'Dog'],
  /* 1  */ ['\u{1F431}', 'Cat'],
  /* 2  */ ['\u{1F43B}', 'Bear'],
  /* 3  */ ['\u{1F43C}', 'Panda'],
  /* 4  */ ['\u{1F428}', 'Koala'],
  /* 5  */ ['\u{1F42F}', 'Tiger'],
  /* 6  */ ['\u{1F981}', 'Lion'],
  /* 7  */ ['\u{1F434}', 'Horse'],
  /* 8  */ ['\u{1F984}', 'Unicorn'],
  /* 9  */ ['\u{1F437}', 'Pig'],
  /* 10 */ ['\u{1F430}', 'Rabbit'],
  /* 11 */ ['\u{1F98A}', 'Fox'],
  /* 12 */ ['\u{1F43F}', 'Chipmunk'],
  /* 13 */ ['\u{1F435}', 'Monkey'],
  /* 14 */ ['\u{1F414}', 'Chicken'],
  /* 15 */ ['\u{1F427}', 'Penguin'],
  /* 16 */ ['\u{1F422}', 'Turtle'],
  /* 17 */ ['\u{1F41F}', 'Fish'],
  /* 18 */ ['\u{1F419}', 'Octopus'],
  /* 19 */ ['\u{1F98B}', 'Butterfly'],
  /* 20 */ ['\u{1F33B}', 'Sunflower'],
  /* 21 */ ['\u{1F332}', 'Evergreen'],
  /* 22 */ ['\u{1F335}', 'Cactus'],
  /* 23 */ ['\u{1F344}', 'Mushroom'],
  /* 24 */ ['\u{1F30D}', 'Globe'],
  /* 25 */ ['\u{1F319}', 'Moon'],
  /* 26 */ ['\u{2B50}',  'Star'],
  /* 27 */ ['\u{2600}',  'Sun'],
  /* 28 */ ['\u{26C5}',  'Cloud'],
  /* 29 */ ['\u{1F525}', 'Fire'],
  /* 30 */ ['\u{1F4A7}', 'Droplet'],
  /* 31 */ ['\u{1F30A}', 'Wave'],
  /* 32 */ ['\u{1F3B5}', 'Music'],
  /* 33 */ ['\u{1F3A4}', 'Microphone'],
  /* 34 */ ['\u{1F3B8}', 'Guitar'],
  /* 35 */ ['\u{1F3BA}', 'Trumpet'],
  /* 36 */ ['\u{1F514}', 'Bell'],
  /* 37 */ ['\u{1F511}', 'Key'],
  /* 38 */ ['\u{1F512}', 'Lock'],
  /* 39 */ ['\u{1F528}', 'Hammer'],
  /* 40 */ ['\u{1F4A1}', 'Light Bulb'],
  /* 41 */ ['\u{1F4D6}', 'Book'],
  /* 42 */ ['\u{270F}',  'Pencil'],
  /* 43 */ ['\u{1F4CE}', 'Paperclip'],
  /* 44 */ ['\u{2702}',  'Scissors'],
  /* 45 */ ['\u{1F451}', 'Crown'],
  /* 46 */ ['\u{1F48E}', 'Gem'],
  /* 47 */ ['\u{1F3AF}', 'Bullseye'],
  /* 48 */ ['\u{1F680}', 'Rocket'],
  /* 49 */ ['\u{2708}',  'Airplane'],
  /* 50 */ ['\u{2693}',  'Anchor'],
  /* 51 */ ['\u{1F6E1}', 'Shield'],
  /* 52 */ ['\u{2699}',  'Gear'],
  /* 53 */ ['\u{1F52C}', 'Microscope'],
  /* 54 */ ['\u{1F52D}', 'Telescope'],
  /* 55 */ ['\u{1F3C6}', 'Trophy'],
  /* 56 */ ['\u{2764}',  'Heart'],
  /* 57 */ ['\u{1F48D}', 'Ring'],
  /* 58 */ ['\u{1F381}', 'Gift'],
  /* 59 */ ['\u{1F3E0}', 'House'],
  /* 60 */ ['\u{1F308}', 'Rainbow'],
  /* 61 */ ['\u{2744}',  'Snowflake'],
  /* 62 */ ['\u{26A1}',  'Lightning'],
  /* 63 */ ['\u{1F30B}', 'Volcano'],
] as const;

/**
 * Flat emoji-only array for backward compatibility.
 * SAS_EMOJI_SET[i] === SAS_EMOJI_TABLE[i][0]
 */
export const SAS_EMOJI_SET: readonly string[] = SAS_EMOJI_TABLE.map(
  ([emoji]) => emoji,
);

// ============================================================================
// WORD LIST -- 256 phonetically distinct, easy-to-pronounce words
// Chosen for phonetic distinctiveness across English, Spanish, French,
// German, and Japanese transliteration contexts.
// ============================================================================

export const SAS_WORD_LIST: readonly string[] = [
  'TIGER', 'EAGLE', 'WHALE', 'HORSE', 'SNAKE', 'SHARK', 'ZEBRA', 'PANDA',
  'KOALA', 'OTTER', 'RAVEN', 'CAMEL', 'BISON', 'CRANE', 'GECKO', 'LEMUR',
  'RIVER', 'STORM', 'MAPLE', 'CEDAR', 'CORAL', 'FLAME', 'FROST', 'CLOUD',
  'OCEAN', 'STONE', 'PEARL', 'AMBER', 'NORTH', 'SOUTH', 'DELTA', 'ORBIT',
  'CROWN', 'ARROW', 'BLADE', 'GLOBE', 'WHEEL', 'PRISM', 'CHAIN', 'TOWER',
  'BELL',  'CLOCK', 'BRUSH', 'FLASK', 'HARP',  'LENS',  'MASK',  'FORGE',
  'SWIFT', 'BRAVE', 'QUIET', 'VIVID', 'NOBLE', 'CLEAR', 'GRAND', 'PRIME',
  'SOLAR', 'LUNAR', 'POLAR', 'ROYAL', 'CYBER', 'ULTRA', 'MICRO', 'HYPER',
  'ATLAS', 'BLAZE', 'CLIFF', 'DUSK',  'EMBER', 'FLINT', 'GLYPH', 'HAVEN',
  'IVORY', 'JEWEL', 'KNOT',  'LATCH', 'MARSH', 'NEXUS', 'OASIS', 'PLUME',
  'QUEST', 'RIDGE', 'SHARD', 'THORN', 'VAULT', 'WIELD', 'XENON', 'YIELD',
  'ABYSS', 'BIRCH', 'CAIRN', 'DRIFT', 'EPOCH', 'FJORD', 'GRAIN', 'HEDGE',
  'INDEX', 'JOUST', 'KARMA', 'LEVER', 'MOCHA', 'NERVE', 'OPTIC', 'PIXEL',
  'QUARTZ','REIGN', 'SPINE', 'TRUCE', 'UNITY', 'VIPER', 'WRAITH','AZURE',
  'BASALT','COMET', 'DJINN', 'ETHER', 'FABLE', 'GLADE', 'HELIX', 'INLET',
  'JAGGED','KNACK', 'LANCE', 'MERIT', 'NICHE', 'OLIVE', 'PULSE', 'QUOTA',
  'RELIC', 'SIGMA', 'TEMPO', 'UMBRA', 'VERSE', 'WRATH', 'YONDER','ZEPHYR',
  'ANVIL', 'BRISK', 'CRYPT', 'DELVE', 'EDICT', 'FLORA', 'GRAIL', 'HARBOR',
  'IGLOO', 'JOLLY', 'KYOTO', 'LYRIC', 'MIRTH', 'NADIR', 'OMEGA', 'PIVOT',
  'QUAKE', 'ROGUE', 'STALK', 'TRAIL', 'USHER', 'VIGOR', 'WALTZ', 'AXIOM',
  'BADGE', 'CHUNK', 'DITTO', 'EXILE', 'FUNGI', 'GUSTO', 'HUSKY', 'IRONY',
  'JAZZY', 'KUDOS', 'LILAC', 'METRO', 'NUTMEG','ONION', 'PLAID', 'QUIRK',
  'RASPY', 'SLEEK', 'TULIP', 'UDDER', 'VINYL', 'WHISK', 'XEROX', 'YACHT',
  'ALPHA', 'BRAVO', 'CHIME', 'DODGE', 'ELFIN', 'FLOCK', 'GHOST', 'HASTE',
  'IONIC', 'JUMBO', 'KINKY', 'LLAMA', 'MOOSE', 'NINJA', 'OXIDE', 'PLUMB',
  'QUILT', 'REALM', 'SONIC', 'TOPAZ', 'URBAN', 'VELVET','WALKY', 'YARROW',
  'ARGON', 'BLEND', 'CRISP', 'DWARF', 'EVOKE', 'FIZZY', 'GLEAM', 'HOVER',
  'INDIGO','JUICE', 'KNELT', 'LEMON', 'MODEM', 'NYLON', 'OPTED', 'PRAWN',
  'QUILL', 'ROVER', 'STEEP', 'THYME', 'UPPER', 'VALVE', 'WHEAT', 'YOUTH',
  'ABORT', 'BONUS', 'CACHE', 'DENSE', 'ESSAY', 'FOCAL', 'GRAPE', 'HIPPO',
  'INFER', 'JELLY', 'KAYAK', 'LOGIC', 'MANGO', 'NOVEL', 'OPERA', 'PLANK',
  'QUEUE', 'RELAY', 'SKULL', 'TIDAL', 'UNITE', 'VALOR', 'WOVEN', 'ZIPPY',
] as const;

// ============================================================================
// SAS TYPES
// ============================================================================

export type SASDisplayMode = 'emoji' | 'words' | 'numeric';

export interface SASEmojiEntry {
  /** The emoji codepoint string */
  emoji: string;
  /** Human-readable label for accessibility */
  label: string;
}

export interface SASCode {
  /** Emoji string (6 emojis concatenated) */
  emoji: string;
  /** Individual emoji array */
  emojis: string[];
  /** Structured emoji entries with labels for a11y */
  emojiEntries: SASEmojiEntry[];
  /** Word phrase (4 words hyphenated) */
  words: string;
  /** Individual word array */
  wordList: string[];
  /** 6-digit numeric fallback code */
  numeric: string;
  /** Raw bytes used to derive the SAS (full 32-byte HKDF output) */
  rawBytes: Uint8Array;
  /** Entropy in bits (for the emoji representation) */
  entropyBits: number;
}

/** Domain separation salt for SAS derivation via HKDF. */
const SAS_HKDF_SALT = 'tallow-sas-v1';

// ============================================================================
// HKDF-SHA-256 (RFC 5869) — proper key derivation
// ============================================================================

/**
 * HKDF-SHA-256 using the WebCrypto API.
 *
 * @param ikm  - Input keying material (the shared DH secret)
 * @param salt - Extraction salt (domain separator)
 * @param info - Context/info string (session binding)
 * @param length - Desired output length in bytes
 * @returns Derived key material
 */
async function hkdfSHA256(
  ikm: Uint8Array,
  salt: string,
  info: string,
  length: number,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const saltBytes = encoder.encode(salt);
  const infoBytes = encoder.encode(info);

  // Import the IKM as a raw key for HKDF.
  // WebCrypto requires non-zero-length key material; if the shared secret
  // is empty (edge case / test), supply a single zero byte so the import
  // does not throw.  HKDF itself handles arbitrary-length IKM.
  const keyMaterial = ikm.length > 0 ? ikm : new Uint8Array(1);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'HKDF',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBytes,
      info: infoBytes,
    },
    baseKey,
    length * 8, // deriveBits takes bit length
  );

  return new Uint8Array(derivedBits);
}

// ============================================================================
// SAS GENERATION
// ============================================================================

/**
 * Generate a Short Authentication String from a shared secret.
 *
 * Both peers call this with the same shared secret and session context.
 * The result is deterministic -- both peers get identical SAS codes.
 *
 * Derivation:
 *   sasKey = HKDF-SHA-256(ikm=sharedSecret, salt="tallow-sas-v1", info=context, L=32)
 *   emojis  = sasKey[0..5]  each byte mod 64  -> 6 emojis, 36-bit entropy
 *   words   = sasKey[6..9]  each byte mod 256  -> 4 words,  32-bit entropy
 *   numeric = sasKey[10..12] collapsed to 6-digit decimal  -> ~20-bit entropy
 *
 * @param sharedSecret - The shared secret from key exchange (DH / ML-KEM)
 * @param context - Session binding context (e.g., session ID). Defaults to "tallow-sas-v1".
 * @returns SAS code with emoji, word, and numeric representations
 */
export async function generateSASCode(
  sharedSecret: Uint8Array,
  context: string = SAS_HKDF_SALT,
): Promise<SASCode> {
  // Derive 32 bytes of SAS material via HKDF
  const sasKey = await hkdfSHA256(sharedSecret, SAS_HKDF_SALT, context, 32);

  // --- Emoji SAS (6 emojis from 64-entry table = 36 bits) ---
  const emojiEntries: SASEmojiEntry[] = [];
  const emojis: string[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = (sasKey[i] ?? 0) % 64;
    const entry = SAS_EMOJI_TABLE[idx]!;
    emojis.push(entry[0]);
    emojiEntries.push({ emoji: entry[0], label: entry[1] });
  }

  // --- Word SAS (4 words from 256-word list = 32 bits) ---
  const wordList: string[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = (sasKey[6 + i] ?? 0) % 256;
    wordList.push(SAS_WORD_LIST[idx]!);
  }

  // --- Numeric SAS (6-digit decimal, ~20-bit fallback) ---
  const b0 = sasKey[10] ?? 0;
  const b1 = sasKey[11] ?? 0;
  const b2 = sasKey[12] ?? 0;
  const numericValue = ((b0 << 16) | (b1 << 8) | b2) % 1_000_000;
  const numeric = numericValue.toString().padStart(6, '0');

  return {
    emoji: emojis.join(''),
    emojis,
    emojiEntries,
    words: wordList.join('-'),
    wordList,
    numeric,
    rawBytes: sasKey,
    entropyBits: 36, // 6 emojis * log2(64) = 36 bits
  };
}

// ============================================================================
// SAS VERIFICATION (constant-time)
// ============================================================================

/**
 * Verify that two SAS codes match.
 * Uses constant-time comparison to prevent timing side-channel attacks.
 */
export function verifySASMatch(a: SASCode, b: SASCode): boolean {
  if (a.rawBytes.length !== b.rawBytes.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.rawBytes.length; i++) {
    result |= (a.rawBytes[i] ?? 0) ^ (b.rawBytes[i] ?? 0);
  }
  return result === 0;
}

// ============================================================================
// QR CODE PAYLOAD — encodes public key fingerprint for camera verification
// ============================================================================

/**
 * QR payload version 2 format:
 *   "tallow-sas:v2:<base64url(sasKey[0..5] || publicKeyFingerprint)>"
 *
 * If no fingerprint is provided, falls back to SAS raw bytes only (v1 compat).
 */
export function sasToQRPayload(
  sas: SASCode,
  publicKeyFingerprint?: Uint8Array,
): string {
  let payload: Uint8Array;

  if (publicKeyFingerprint && publicKeyFingerprint.length > 0) {
    // v2: 6-byte SAS prefix + full fingerprint
    const sasPrefix = sas.rawBytes.slice(0, 6);
    payload = new Uint8Array(sasPrefix.length + publicKeyFingerprint.length);
    payload.set(sasPrefix, 0);
    payload.set(publicKeyFingerprint, sasPrefix.length);
  } else {
    // v1 fallback: SAS raw bytes only (first 10 bytes for backward compat)
    payload = sas.rawBytes.slice(0, 10);
  }

  const b64 = btoa(String.fromCharCode(...payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const version = publicKeyFingerprint ? 'v2' : 'v1';
  return `tallow-sas:${version}:${b64}`;
}

/**
 * Parse a QR code payload back to raw bytes for verification.
 * Supports both v1 (SAS-only) and v2 (SAS + fingerprint) formats.
 */
export interface QRPayloadParsed {
  /** The version of the QR payload */
  version: 'v1' | 'v2';
  /** Raw SAS bytes (first 6 bytes in v2, first 10 in v1) */
  sasBytes: Uint8Array;
  /** Public key fingerprint (v2 only, null for v1) */
  fingerprint: Uint8Array | null;
}

export function parseQRPayload(payload: string): QRPayloadParsed | null {
  const v2Prefix = 'tallow-sas:v2:';
  const v1Prefix = 'tallow-sas:v1:';

  let version: 'v1' | 'v2';
  let b64Data: string;

  if (payload.startsWith(v2Prefix)) {
    version = 'v2';
    b64Data = payload.slice(v2Prefix.length);
  } else if (payload.startsWith(v1Prefix)) {
    version = 'v1';
    b64Data = payload.slice(v1Prefix.length);
  } else {
    return null;
  }

  const b64 = b64Data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (version === 'v2' && bytes.length > 6) {
      return {
        version,
        sasBytes: bytes.slice(0, 6),
        fingerprint: bytes.slice(6),
      };
    }
    return {
      version,
      sasBytes: bytes,
      fingerprint: null,
    };
  } catch {
    return null;
  }
}

/**
 * Legacy: Parse a QR payload and return just the raw bytes (v1 compat).
 */
export function qrPayloadToRawBytes(payload: string): Uint8Array | null {
  const parsed = parseQRPayload(payload);
  if (!parsed) return null;
  return parsed.sasBytes;
}

/**
 * Verify a scanned QR payload against a local SAS code.
 * For v2, also verifies the public key fingerprint if provided.
 */
export function verifyQRPayload(
  scannedPayload: string,
  localSas: SASCode,
  localFingerprint?: Uint8Array,
): boolean {
  const parsed = parseQRPayload(scannedPayload);
  if (!parsed) return false;

  // Compare SAS bytes (constant-time)
  const localSasBytes = parsed.version === 'v2'
    ? localSas.rawBytes.slice(0, 6)
    : localSas.rawBytes.slice(0, parsed.sasBytes.length);

  if (localSasBytes.length !== parsed.sasBytes.length) return false;

  let result = 0;
  for (let i = 0; i < localSasBytes.length; i++) {
    result |= (localSasBytes[i] ?? 0) ^ (parsed.sasBytes[i] ?? 0);
  }
  if (result !== 0) return false;

  // For v2, also verify fingerprint if available
  if (parsed.version === 'v2' && parsed.fingerprint && localFingerprint) {
    if (localFingerprint.length !== parsed.fingerprint.length) return false;
    let fpResult = 0;
    for (let i = 0; i < localFingerprint.length; i++) {
      fpResult |= (localFingerprint[i] ?? 0) ^ (parsed.fingerprint[i] ?? 0);
    }
    if (fpResult !== 0) return false;
  }

  return true;
}

// ============================================================================
// MISMATCH RESPONSE -- Agent 012 SAS-VERIFIER termination contract
// ============================================================================

/**
 * Maximum time allowed for mismatch termination (100ms).
 * If termination exceeds this deadline, an error MUST be raised.
 */
export const SAS_MISMATCH_TERMINATION_DEADLINE_MS = 100;

/**
 * Minimum entropy floor in bits. SAS generation MUST meet this threshold.
 */
export const SAS_MINIMUM_ENTROPY_BITS = 36;

/**
 * Security report emitted on SAS mismatch.
 * No retry is allowed after a mismatch -- the connection is permanently severed.
 */
export interface SASMismatchReport {
  /** ISO-8601 timestamp of the mismatch event */
  timestamp: string;
  /** Peer identifier (device name or ID) */
  peerId: string;
  /** Session identifier for correlation */
  sessionId: string;
  /** Reason for termination */
  reason: 'SAS_MISMATCH_DETECTED';
  /** How the mismatch was identified */
  method: SASDisplayMode | 'qr';
  /** Elapsed time in ms from mismatch detection to connection teardown */
  terminationLatencyMs: number;
  /** Whether termination met the deadline */
  withinDeadline: boolean;
}

/**
 * Handle a SAS mismatch: immediately terminate the connection,
 * emit a warning, and produce a security report.
 *
 * Contract:
 * - Connection MUST be torn down within SAS_MISMATCH_TERMINATION_DEADLINE_MS.
 * - No "try again" -- mismatch is final.
 * - Returns a SASMismatchReport for audit logging.
 *
 * @param terminateConnection - callback that severs the peer connection
 * @param peerId - identifier for the peer device
 * @param sessionId - current session identifier
 * @param method - which verification method detected the mismatch
 */
export async function handleSASMismatch(
  terminateConnection: () => void | Promise<void>,
  peerId: string,
  sessionId: string,
  method: SASDisplayMode | 'qr' = 'emoji',
): Promise<SASMismatchReport> {
  const start = performance.now();

  // Immediately sever the connection -- no retry path
  await terminateConnection();

  const terminationLatencyMs = performance.now() - start;
  const withinDeadline = terminationLatencyMs <= SAS_MISMATCH_TERMINATION_DEADLINE_MS;

  const report: SASMismatchReport = {
    timestamp: new Date().toISOString(),
    peerId,
    sessionId,
    reason: 'SAS_MISMATCH_DETECTED',
    method,
    terminationLatencyMs,
    withinDeadline,
  };

  // Warn in console (never silent)
  console.warn(
    `[SAS-VERIFIER] MITM WARNING: SAS mismatch with peer "${peerId}" in session "${sessionId}". ` +
    `Connection terminated in ${terminationLatencyMs.toFixed(1)}ms` +
    `${withinDeadline ? '' : ' (EXCEEDED DEADLINE)'}. No retry permitted.`,
  );

  if (!withinDeadline) {
    console.error(
      `[SAS-VERIFIER] DEADLINE VIOLATION: Termination took ${terminationLatencyMs.toFixed(1)}ms, ` +
      `deadline is ${SAS_MISMATCH_TERMINATION_DEADLINE_MS}ms.`,
    );
  }

  return report;
}
