//! Encrypted keyring storage

use crate::error::{CryptoError, Result};
use crate::kdf::argon2;
use crate::symmetric::{chacha_decrypt, chacha_encrypt};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Encrypted keyring
#[derive(Clone, Serialize, Deserialize)]
pub struct EncryptedKeyring {
    /// Random salt used as input to Argon2id key derivation
    pub salt: [u8; 16],
    /// ChaCha20-Poly1305 nonce used during encryption
    pub nonce: [u8; 12],
    /// ChaCha20-Poly1305 encrypted key material including authentication tag
    pub ciphertext: Vec<u8>,
}

/// Encrypt a keyring with a passphrase
pub fn encrypt_keyring(passphrase: &str, keys: &[u8]) -> Result<EncryptedKeyring> {
    let salt = rand::random();
    let nonce = rand::random();

    // Derive encryption key from passphrase
    let mut key = argon2::derive_key(passphrase.as_bytes(), &salt, 32)?;
    let key_array: [u8; 32] = key
        .as_slice()
        .try_into()
        .map_err(|_| CryptoError::InvalidKey("Argon2 derived key is not 32 bytes".to_string()))?;
    key.zeroize(); // Zeroize the Vec before it's freed

    // Encrypt keys
    let ciphertext = chacha_encrypt(&key_array, &nonce, keys, &[])?;

    Ok(EncryptedKeyring {
        salt,
        nonce,
        ciphertext,
    })
}

/// Decrypt a keyring with a passphrase
pub fn decrypt_keyring(passphrase: &str, keyring: &EncryptedKeyring) -> Result<Vec<u8>> {
    // Derive decryption key from passphrase
    let mut key = argon2::derive_key(passphrase.as_bytes(), &keyring.salt, 32)?;
    let key_array: [u8; 32] = key
        .as_slice()
        .try_into()
        .map_err(|_| CryptoError::InvalidKey("Argon2 derived key is not 32 bytes".to_string()))?;
    key.zeroize(); // Zeroize the Vec before it's freed

    // Decrypt keys
    chacha_decrypt(&key_array, &keyring.nonce, &keyring.ciphertext, &[])
}
