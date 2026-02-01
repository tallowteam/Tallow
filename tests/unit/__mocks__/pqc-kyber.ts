/**
 * Mock for pqc-kyber WASM module
 * Provides deterministic test doubles for Kyber KEM operations.
 * The real module requires a browser WASM runtime.
 */
import { webcrypto } from 'crypto';
import { createHash } from 'crypto';

const KYBER_PK_LEN = 1184;
const KYBER_SK_LEN = 2400;
const KYBER_CT_LEN = 1088;
const KYBER_SS_LEN = 32;

// Map secret keys to their corresponding public keys
const secretToPub = new Map<string, Uint8Array>();
// Map ciphertext+pubkey hash to shared secret
const ctToSecret = new Map<string, Uint8Array>();

function hash(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export function keypair() {
  const pubkey = new Uint8Array(KYBER_PK_LEN);
  const secret = new Uint8Array(KYBER_SK_LEN);
  webcrypto.getRandomValues(pubkey);
  webcrypto.getRandomValues(secret);

  // Store the relationship: secret -> public
  secretToPub.set(hash(secret), pubkey);

  return { pubkey, secret };
}

export function encapsulate(publicKey: Uint8Array) {
  if (!publicKey || publicKey.length !== KYBER_PK_LEN) {
    throw new Error(`Invalid Kyber public key length: ${publicKey?.length}`);
  }

  const ciphertext = new Uint8Array(KYBER_CT_LEN);
  webcrypto.getRandomValues(ciphertext);

  // Generate a random shared secret
  const sharedSecret = new Uint8Array(KYBER_SS_LEN);
  webcrypto.getRandomValues(sharedSecret);

  // Store: hash(ciphertext) + hash(publicKey) -> sharedSecret
  // This allows decapsulate to recover it if they have the matching secret key
  const lookupKey = hash(ciphertext) + ':' + hash(publicKey);
  ctToSecret.set(lookupKey, sharedSecret);

  return { ciphertext, sharedSecret };
}

export function decapsulate(ciphertext: Uint8Array, secretKey: Uint8Array) {
  if (!ciphertext || ciphertext.length !== KYBER_CT_LEN) {
    return null;
  }

  // Find the public key that corresponds to this secret key
  const pubkey = secretToPub.get(hash(secretKey));
  if (!pubkey) {
    return null; // Unknown secret key = decapsulation failure
  }

  // Look up the shared secret using ciphertext + matching public key
  const lookupKey = hash(ciphertext) + ':' + hash(pubkey);
  const sharedSecret = ctToSecret.get(lookupKey);

  if (!sharedSecret) {
    return null; // Ciphertext wasn't encapsulated for this public key
  }

  return sharedSecret;
}
