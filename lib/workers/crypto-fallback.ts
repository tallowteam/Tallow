/**
 * Crypto Fallback Implementation
 * Main thread fallback for crypto operations when workers are unavailable
 */

/**
 * Generate random bytes
 */
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * AES-256-GCM Encryption (Main Thread)
 */
export async function encrypt(
  data: ArrayBuffer,
  key: Uint8Array,
  providedNonce?: Uint8Array
): Promise<{ ciphertext: ArrayBuffer; nonce: ArrayBuffer }> {
  // SECURITY: Nonce MUST be provided
  if (!providedNonce) {
    throw new Error(
      'SECURITY ERROR: Counter-based nonce must be provided. ' +
      'Use NonceManager to generate counter-based nonces.'
    );
  }

  const nonceArray = new Uint8Array(providedNonce);

  if (nonceArray.length !== 12) {
    throw new Error(`Invalid nonce length: ${nonceArray.length}. Must be 12 bytes for AES-GCM.`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonceArray,
      tagLength: 128,
    },
    cryptoKey,
    data
  );

  return {
    ciphertext,
    nonce: nonceArray.buffer as ArrayBuffer,
  };
}

/**
 * AES-256-GCM Decryption (Main Thread)
 */
export async function decrypt(
  ciphertext: ArrayBuffer,
  key: Uint8Array,
  nonce: Uint8Array
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    cryptoKey,
    ciphertext
  );
}

/**
 * SHA-256 Hash (Main Thread)
 */
export async function hash(data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', data);
}

/**
 * Derive key from password (Main Thread)
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt.buffer,
      iterations: 600000,
    },
    passwordKey,
    256
  );
}
