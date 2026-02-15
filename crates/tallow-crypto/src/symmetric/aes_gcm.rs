//! AES-256-GCM encryption

use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};

use crate::error::{CryptoError, Result};

/// Encrypt data using AES-256-GCM
///
/// # Arguments
///
/// * `key` - 32-byte encryption key
/// * `nonce` - 12-byte nonce (must be unique per message)
/// * `plaintext` - Data to encrypt
/// * `aad` - Additional authenticated data (can be empty)
///
/// # Returns
///
/// Ciphertext with authentication tag appended
pub fn encrypt(key: &[u8; 32], nonce: &[u8; 12], plaintext: &[u8], aad: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(nonce);

    let payload = Payload {
        msg: plaintext,
        aad,
    };

    cipher
        .encrypt(nonce, payload)
        .map_err(|e| CryptoError::Encryption(format!("AES-GCM encryption failed: {}", e)))
}

/// Decrypt data using AES-256-GCM
///
/// # Arguments
///
/// * `key` - 32-byte encryption key
/// * `nonce` - 12-byte nonce (must match encryption nonce)
/// * `ciphertext` - Data to decrypt (includes authentication tag)
/// * `aad` - Additional authenticated data (must match encryption AAD)
///
/// # Returns
///
/// Decrypted plaintext if authentication succeeds
pub fn decrypt(key: &[u8; 32], nonce: &[u8; 12], ciphertext: &[u8], aad: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(nonce);

    let payload = Payload {
        msg: ciphertext,
        aad,
    };

    cipher
        .decrypt(nonce, payload)
        .map_err(|e| CryptoError::Decryption(format!("AES-GCM decryption failed: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aes_gcm_roundtrip() {
        let key = [0u8; 32];
        let nonce = [1u8; 12];
        let plaintext = b"hello world";
        let aad = b"metadata";

        let ciphertext = encrypt(&key, &nonce, plaintext, aad).unwrap();
        let decrypted = decrypt(&key, &nonce, &ciphertext, aad).unwrap();

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_aes_gcm_wrong_key() {
        let key1 = [0u8; 32];
        let key2 = [1u8; 32];
        let nonce = [1u8; 12];
        let plaintext = b"secret";

        let ciphertext = encrypt(&key1, &nonce, plaintext, &[]).unwrap();
        let result = decrypt(&key2, &nonce, &ciphertext, &[]);

        assert!(result.is_err());
    }

    #[test]
    fn test_aes_gcm_wrong_aad() {
        let key = [0u8; 32];
        let nonce = [1u8; 12];
        let plaintext = b"secret";
        let aad1 = b"metadata1";
        let aad2 = b"metadata2";

        let ciphertext = encrypt(&key, &nonce, plaintext, aad1).unwrap();
        let result = decrypt(&key, &nonce, &ciphertext, aad2);

        assert!(result.is_err());
    }
}
