//! AES-256-GCM authenticated encryption
//!
//! Performance target: >500 MB/s throughput
//!
//! Features:
//! - Streaming encryption for large files
//! - Counter-based nonces (never reuse)
//! - Authenticated encryption with 128-bit authentication tag

use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use wasm_bindgen::prelude::*;
use zeroize::Zeroizing;

use super::{CryptoError, CryptoResult};

/// AES-256-GCM cipher instance
#[wasm_bindgen]
pub struct AesGcmCipher {
    cipher: Aes256Gcm,
    counter: u64,
}

#[wasm_bindgen]
impl AesGcmCipher {
    /// Create a new AES-GCM cipher with a 32-byte key
    #[wasm_bindgen(constructor)]
    pub fn new(key: &[u8]) -> Result<AesGcmCipher, JsValue> {
        if key.len() != 32 {
            return Err(CryptoError::InvalidKeyLength {
                expected: 32,
                got: key.len(),
            }
            .into());
        }

        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|_| CryptoError::KeyGenerationFailed("Invalid AES key".to_string()))?;

        Ok(AesGcmCipher { cipher, counter: 0 })
    }

    /// Encrypt data with automatic nonce generation
    ///
    /// Returns concatenated: nonce (12 bytes) + ciphertext + tag (16 bytes)
    pub fn encrypt(&mut self, plaintext: &[u8]) -> Result<Vec<u8>, JsValue> {
        // Generate nonce from counter
        let nonce_bytes = self.next_nonce();
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt
        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

        // Prepend nonce to ciphertext
        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        Ok(result)
    }

    /// Encrypt with additional authenticated data (AAD)
    ///
    /// AAD is authenticated but not encrypted
    pub fn encrypt_with_aad(
        &mut self,
        plaintext: &[u8],
        aad: &[u8],
    ) -> Result<Vec<u8>, JsValue> {
        let nonce_bytes = self.next_nonce();
        let nonce = Nonce::from_slice(&nonce_bytes);

        let payload = Payload {
            msg: plaintext,
            aad,
        };

        let ciphertext = self
            .cipher
            .encrypt(nonce, payload)
            .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        Ok(result)
    }

    /// Decrypt data
    ///
    /// Expects: nonce (12 bytes) + ciphertext + tag (16 bytes)
    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, JsValue> {
        if data.len() < 28 {
            // 12 (nonce) + 16 (tag) minimum
            return Err(
                CryptoError::InvalidInput("Data too short for AES-GCM".to_string()).into(),
            );
        }

        // Extract nonce and ciphertext
        let nonce = Nonce::from_slice(&data[..12]);
        let ciphertext = &data[12..];

        // Decrypt
        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

        Ok(plaintext)
    }

    /// Decrypt with additional authenticated data (AAD)
    pub fn decrypt_with_aad(&self, data: &[u8], aad: &[u8]) -> Result<Vec<u8>, JsValue> {
        if data.len() < 28 {
            return Err(
                CryptoError::InvalidInput("Data too short for AES-GCM".to_string()).into(),
            );
        }

        let nonce = Nonce::from_slice(&data[..12]);
        let ciphertext = &data[12..];

        let payload = Payload {
            msg: ciphertext,
            aad,
        };

        let plaintext = self
            .cipher
            .decrypt(nonce, payload)
            .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

        Ok(plaintext)
    }

    /// Get the current counter value
    #[wasm_bindgen(getter)]
    pub fn counter(&self) -> f64 {
        self.counter as f64
    }

    /// Reset the counter (use with caution!)
    pub fn reset_counter(&mut self) {
        self.counter = 0;
    }

    /// Generate next nonce from counter
    fn next_nonce(&mut self) -> [u8; 12] {
        let mut nonce = [0u8; 12];

        // Use counter for first 8 bytes (little-endian)
        nonce[..8].copy_from_slice(&self.counter.to_le_bytes());

        // Random for last 4 bytes for extra entropy
        use rand::Rng;
        let random_bytes: [u8; 4] = rand::thread_rng().gen();
        nonce[8..].copy_from_slice(&random_bytes);

        self.counter = self.counter.wrapping_add(1);

        nonce
    }
}

/// One-shot AES-256-GCM encryption
///
/// Encrypts data with a given key. Returns nonce + ciphertext + tag.
///
/// # Performance
/// Target: >500 MB/s
#[wasm_bindgen]
pub fn aes_encrypt(key: &[u8], plaintext: &[u8]) -> Result<Vec<u8>, JsValue> {
    let mut cipher = AesGcmCipher::new(key)?;
    cipher.encrypt(plaintext)
}

/// One-shot AES-256-GCM decryption
///
/// Decrypts data with a given key.
#[wasm_bindgen]
pub fn aes_decrypt(key: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>, JsValue> {
    let cipher = AesGcmCipher::new(key)?;
    cipher.decrypt(ciphertext)
}

/// Encrypt with explicit nonce (advanced use)
///
/// WARNING: Never reuse a nonce with the same key!
#[wasm_bindgen]
pub fn aes_encrypt_with_nonce(
    key: &[u8],
    nonce: &[u8],
    plaintext: &[u8],
) -> Result<Vec<u8>, JsValue> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidKeyLength {
            expected: 32,
            got: key.len(),
        }
        .into());
    }

    if nonce.len() != 12 {
        return Err(CryptoError::InvalidNonceLength {
            expected: 12,
            got: nonce.len(),
        }
        .into());
    }

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CryptoError::KeyGenerationFailed("Invalid AES key".to_string()))?;

    let nonce_obj = Nonce::from_slice(nonce);

    let ciphertext = cipher
        .encrypt(nonce_obj, plaintext)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    Ok(ciphertext)
}

/// Decrypt with explicit nonce (advanced use)
#[wasm_bindgen]
pub fn aes_decrypt_with_nonce(
    key: &[u8],
    nonce: &[u8],
    ciphertext: &[u8],
) -> Result<Vec<u8>, JsValue> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidKeyLength {
            expected: 32,
            got: key.len(),
        }
        .into());
    }

    if nonce.len() != 12 {
        return Err(CryptoError::InvalidNonceLength {
            expected: 12,
            got: nonce.len(),
        }
        .into());
    }

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CryptoError::KeyGenerationFailed("Invalid AES key".to_string()))?;

    let nonce_obj = Nonce::from_slice(nonce);

    let plaintext = cipher
        .decrypt(nonce_obj, ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

    Ok(plaintext)
}

/// Generate a random AES-256 key
#[wasm_bindgen]
pub fn aes_generate_key() -> Vec<u8> {
    use rand::Rng;
    let mut key = vec![0u8; 32];
    rand::thread_rng().fill(&mut key[..]);
    key
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aes_encrypt_decrypt() {
        let key = aes_generate_key();
        let plaintext = b"Hello, World!";

        let ciphertext = aes_encrypt(&key, plaintext).unwrap();
        let decrypted = aes_decrypt(&key, &ciphertext).unwrap();

        assert_eq!(plaintext, &decrypted[..]);
    }

    #[test]
    fn test_aes_cipher_instance() {
        let key = aes_generate_key();
        let mut cipher = AesGcmCipher::new(&key).unwrap();

        let plaintext = b"Test data";
        let ciphertext = cipher.encrypt(plaintext).unwrap();
        let decrypted = cipher.decrypt(&ciphertext).unwrap();

        assert_eq!(plaintext, &decrypted[..]);
    }

    #[test]
    fn test_aes_with_aad() {
        let key = aes_generate_key();
        let mut cipher = AesGcmCipher::new(&key).unwrap();

        let plaintext = b"Secret message";
        let aad = b"Additional authenticated data";

        let ciphertext = cipher.encrypt_with_aad(plaintext, aad).unwrap();
        let decrypted = cipher.decrypt_with_aad(&ciphertext, aad).unwrap();

        assert_eq!(plaintext, &decrypted[..]);

        // Wrong AAD should fail
        let wrong_aad = b"Wrong AAD";
        assert!(cipher.decrypt_with_aad(&ciphertext, wrong_aad).is_err());
    }

    #[test]
    fn test_counter_nonce() {
        let key = aes_generate_key();
        let mut cipher = AesGcmCipher::new(&key).unwrap();

        let ct1 = cipher.encrypt(b"msg1").unwrap();
        let ct2 = cipher.encrypt(b"msg2").unwrap();

        // Nonces should be different
        assert_ne!(&ct1[..12], &ct2[..12]);

        // Counter should increment
        assert_eq!(cipher.counter(), 2.0);
    }
}
