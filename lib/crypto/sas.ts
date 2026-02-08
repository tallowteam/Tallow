/**
 * Short Authentication String (SAS) Generation
 * Agent 012 — SAS-VERIFIER
 *
 * Generates human-readable verification codes from shared secrets
 * to detect man-in-the-middle attacks during key exchange.
 *
 * Two display modes:
 * - Emoji: 6 emojis from a set of 64 (36-bit entropy)
 * - Words: 4 words from a curated 256-word list
 *
 * Both peers derive identical SAS from the shared secret.
 * Users compare visually or verbally through a side channel.
 */

// ============================================================================
// EMOJI SET — 64 visually distinct, culturally neutral emojis
// ============================================================================

export const SAS_EMOJI_SET: readonly string[] = [
  // Animals (16)
  '\u{1F981}', // lion
  '\u{1F985}', // eagle
  '\u{1F433}', // whale
  '\u{1F40E}', // horse
  '\u{1F40D}', // snake
  '\u{1F988}', // shark
  '\u{1F993}', // zebra
  '\u{1F43C}', // panda
  '\u{1F428}', // koala
  '\u{1F9A6}', // otter
  '\u{1F426}', // bird
  '\u{1F42A}', // camel
  '\u{1F98B}', // butterfly
  '\u{1F422}', // turtle
  '\u{1F419}', // octopus
  '\u{1F989}', // owl

  // Nature (16)
  '\u{1F30A}', // wave
  '\u{26A1}',  // lightning
  '\u{1F341}', // maple leaf
  '\u{1F332}', // evergreen
  '\u{1F319}', // crescent moon
  '\u{2B50}',  // star
  '\u{1F308}', // rainbow
  '\u{2744}',  // snowflake
  '\u{1F30B}', // volcano
  '\u{1F48E}', // gem
  '\u{1F33B}', // sunflower
  '\u{1F335}', // cactus
  '\u{1F340}', // four-leaf clover
  '\u{1F30D}', // earth
  '\u{2600}',  // sun
  '\u{1F525}', // fire

  // Objects (16)
  '\u{1F451}', // crown
  '\u{1F3F9}', // bow and arrow
  '\u{1F5E1}', // dagger
  '\u{1F30E}', // globe
  '\u{2699}',  // gear
  '\u{1F4A1}', // light bulb
  '\u{1F512}', // lock
  '\u{1F511}', // key
  '\u{1F3AF}', // bullseye
  '\u{1F52D}', // telescope
  '\u{2697}',  // alembic
  '\u{1F3B5}', // musical note
  '\u{1F6E1}', // shield
  '\u{2693}',  // anchor
  '\u{1F52E}', // crystal ball
  '\u{1F680}', // rocket

  // Symbols (16)
  '\u{2764}',  // heart
  '\u{267B}',  // recycle
  '\u{262F}',  // yin yang
  '\u{269B}',  // atom
  '\u{2660}',  // spade
  '\u{2666}',  // diamond
  '\u{2663}',  // club
  '\u{1F4AB}', // dizzy (spiral)
  '\u{1F300}', // cyclone
  '\u{1F3B2}', // die
  '\u{1F3B0}', // slot machine
  '\u{269C}',  // fleur-de-lis
  '\u{1F549}', // om
  '\u{2728}',  // sparkles
  '\u{1FA90}', // ringed planet
  '\u{1F4A0}', // diamond shape
] as const;

// ============================================================================
// WORD LIST — 256 phonetically distinct, easy-to-pronounce words
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
  'RELIC', 'SIGMA', 'TEMPO', 'UMBRA', 'VERSE', 'WRATH', 'YIELD', 'ZEPHYR',
  'ANVIL', 'BRISK', 'CRYPT', 'DELVE', 'EDICT', 'FLORA', 'GRAIL', 'HAVEN',
  'IGLOO', 'JOLLY', 'KYOTO', 'LYRIC', 'MIRTH', 'NADIR', 'OMEGA', 'PIVOT',
  'QUAKE', 'ROGUE', 'STALK', 'TRAIL', 'USHER', 'VIGOR', 'WALTZ', 'AXIOM',
  'BADGE', 'CHUNK', 'DITTO', 'EXILE', 'FUNGI', 'GUSTO', 'HUSKY', 'IRONY',
  'JAZZY', 'KUDOS', 'LILAC', 'METRO', 'NUTMEG','ONION', 'PLAID', 'QUIRK',
  'RASPY', 'SLEEK', 'TULIP', 'UDDER', 'VINYL', 'WHISK', 'XEROX', 'YACHT',
  'ALPHA', 'BRAVO', 'CHIME', 'DODGE', 'ELFIN', 'FLOCK', 'GHOST', 'HASTE',
  'IONIC', 'JUMBO', 'KINKY', 'LLAMA', 'MOOSE', 'NINJA', 'OXIDE', 'PLUMB',
  'QUILT', 'REALM', 'SONIC', 'TOPAZ', 'ULTRA', 'VIVID', 'WALKY', 'YACHT',
  'ARGON', 'BLEND', 'CRISP', 'DWARF', 'EVOKE', 'FIZZY', 'GLEAM', 'HOVER',
  'IVORY', 'JUICE', 'KNELT', 'LEMON', 'MODEM', 'NYLON', 'OPTED', 'PRAWN',
  'QUOTA', 'ROVER', 'STEEP', 'THYME', 'UPPER', 'VALVE', 'WHEAT', 'YOUTH',
  'ABORT', 'BONUS', 'CACHE', 'DENSE', 'ESSAY', 'FOCAL', 'GRAPE', 'HIPPO',
  'INFER', 'JELLY', 'KAYAK', 'LOGIC', 'MANGO', 'NOVEL', 'ORBIT', 'PLANK',
  'QUEUE', 'RELAY', 'SKULL', 'TIDAL', 'UNITE', 'VALOR', 'WOVEN', 'ZIPPY',
] as const;

// ============================================================================
// SAS TYPES
// ============================================================================

export type SASDisplayMode = 'emoji' | 'words';

export interface SASCode {
  /** Emoji string (6 emojis concatenated) */
  emoji: string;
  /** Individual emoji array */
  emojis: string[];
  /** Word phrase (4 words hyphenated) */
  words: string;
  /** Individual word array */
  wordList: string[];
  /** Raw bytes used to derive the SAS */
  rawBytes: Uint8Array;
  /** Entropy in bits */
  entropyBits: number;
}

// ============================================================================
// SAS GENERATION
// ============================================================================

/**
 * Generate a Short Authentication String from a shared secret.
 *
 * Both peers call this with the same shared secret and session context.
 * The result is deterministic — both peers get identical SAS codes.
 *
 * @param sharedSecret - The shared secret from key exchange
 * @param context - Domain separation context (e.g., session ID)
 * @returns SAS code with both emoji and word representations
 */
export async function generateSASCode(
  sharedSecret: Uint8Array,
  context: string = 'tallow-v3-sas'
): Promise<SASCode> {
  // Derive SAS material using HKDF-like construction with SHA-256
  // (we use SubtleCrypto for broad compatibility)
  const encoder = new TextEncoder();
  const contextBytes = encoder.encode(context);

  // Concatenate: sharedSecret || context
  const ikm = new Uint8Array(sharedSecret.length + contextBytes.length);
  ikm.set(sharedSecret, 0);
  ikm.set(contextBytes, sharedSecret.length);

  // Hash to derive SAS bytes
  const hashBuffer = await crypto.subtle.digest('SHA-256', ikm);
  const hashBytes = new Uint8Array(hashBuffer);

  // Take first 6 bytes for emoji SAS (6 × 6 bits = 36 bits entropy)
  const emojiBytes = hashBytes.slice(0, 6);
  const emojis: string[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = (emojiBytes[i] ?? 0) % SAS_EMOJI_SET.length; // mod 64
    emojis.push(SAS_EMOJI_SET[idx]!);
  }

  // Take next 4 bytes for word SAS (4 × 8 bits = 32 bits entropy)
  const wordBytes = hashBytes.slice(6, 10);
  const wordList: string[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = (wordBytes[i] ?? 0) % SAS_WORD_LIST.length; // mod 256
    wordList.push(SAS_WORD_LIST[idx]!);
  }

  return {
    emoji: emojis.join(''),
    emojis,
    words: wordList.join('-'),
    wordList,
    rawBytes: hashBytes.slice(0, 10),
    entropyBits: 36, // 6 emojis × log2(64) = 36 bits
  };
}

/**
 * Verify that two SAS codes match.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifySASMatch(a: SASCode, b: SASCode): boolean {
  if (a.rawBytes.length !== b.rawBytes.length) {return false;}
  let result = 0;
  for (let i = 0; i < a.rawBytes.length; i++) {
    result |= (a.rawBytes[i] ?? 0) ^ (b.rawBytes[i] ?? 0);
  }
  return result === 0;
}

/**
 * Encode SAS as a QR code-compatible string.
 * Format: "tallow-sas:v1:<base64url-encoded-raw-bytes>"
 */
export function sasToQRPayload(sas: SASCode): string {
  const b64 = btoa(String.fromCharCode(...sas.rawBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `tallow-sas:v1:${b64}`;
}

/**
 * Parse a QR code payload back to raw bytes for verification.
 */
export function qrPayloadToRawBytes(payload: string): Uint8Array | null {
  const prefix = 'tallow-sas:v1:';
  if (!payload.startsWith(prefix)) {return null;}
  const b64 = payload.slice(prefix.length).replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}
