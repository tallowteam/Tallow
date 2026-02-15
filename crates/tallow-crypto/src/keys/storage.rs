//! Encrypted keyring storage

use crate::error::{CryptoError, Result};
use crate::kdf::argon2;
use crate::symmetric::{chacha_decrypt, chacha_encrypt};
use serde::{Deserialize, Serialize};

/// Encrypted keyring
#[derive(Clone, Serialize, Deserialize)]
pub struct EncryptedKeyring {
    pub salt: [u8; 16],
    pub nonce: [u8; 12],
    pub ciphertext: Vec<u8>,
}

/// Encrypt a keyring with a passphrase
pub fn encrypt_keyring(passphrase: &str, keys: &[u8]) -> Result<EncryptedKeyring> {
    let salt = rand::random();
    let nonce = rand::random();

    // Derive encryption key from passphrase
    let key = argon2::derive_key(passphrase.as_bytes(), &salt, 32)?;
    let key_array: [u8; 32] = key.try_into().unwrap();

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
    let key = argon2::derive_key(passphrase.as_bytes(), &keyring.salt, 32)?;
    let key_array: [u8; 32] = key.try_into().unwrap();

    // Decrypt keys
    chacha_decrypt(&key_array, &keyring.nonce, &keyring.ciphertext, &[])
}
