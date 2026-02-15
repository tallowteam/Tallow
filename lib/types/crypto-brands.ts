/**
 * Branded key-material types to prevent key-class mixups.
 *
 * These brands are intentionally lightweight wrappers around Uint8Array
 * and are used at security boundaries where key roles differ.
 */

declare const keyMaterialBrand: unique symbol;

type KeyBrand<TName extends string> = {
  readonly [keyMaterialBrand]: TName;
};

export type PublicKey = Uint8Array & KeyBrand<'PublicKey'>;
export type PrivateKey = Uint8Array & KeyBrand<'PrivateKey'>;
export type SharedSecret = Uint8Array & KeyBrand<'SharedSecret'>;

export function asPublicKey(value: Uint8Array): PublicKey {
  return value as PublicKey;
}

export function asPrivateKey(value: Uint8Array): PrivateKey {
  return value as PrivateKey;
}

export function asSharedSecret(value: Uint8Array): SharedSecret {
  return value as SharedSecret;
}
