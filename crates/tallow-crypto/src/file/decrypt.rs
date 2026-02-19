//! File decryption

use crate::error::{CryptoError, Result};
use crate::file::encrypt::EncryptedChunk;
use crate::hash::blake3;
use crate::mem::constant_time;
use crate::symmetric::{aes_decrypt, CipherSuite};

/// File decryptor
pub struct FileDecryptor {
    key: [u8; 32],
    cipher: CipherSuite,
}

impl FileDecryptor {
    /// Create a new file decryptor
    pub fn new(key: [u8; 32], cipher: CipherSuite) -> Self {
        Self { key, cipher }
    }

    /// Decrypt a chunk
    pub fn decrypt_chunk(&self, encrypted_chunk: &EncryptedChunk) -> Result<Vec<u8>> {
        decrypt_chunk(&self.key, encrypted_chunk)
    }
}

/// Decrypt a single file chunk
///
/// # Arguments
///
/// * `key` - Decryption key
/// * `encrypted_chunk` - The encrypted chunk
///
/// # Returns
///
/// Decrypted chunk data
pub fn decrypt_chunk(key: &[u8; 32], encrypted_chunk: &EncryptedChunk) -> Result<Vec<u8>> {
    // Verify hash using constant-time comparison
    let actual_hash = blake3::hash(&encrypted_chunk.ciphertext);
    if !constant_time::ct_eq(&actual_hash, &encrypted_chunk.hash) {
        return Err(CryptoError::HashMismatch {
            expected: format!("{:02x?}", encrypted_chunk.hash),
            actual: format!("{:02x?}", actual_hash),
        });
    }

    // Derive chunk-specific key
    let mut kdf_input = Vec::new();
    kdf_input.extend_from_slice(key);
    kdf_input.extend_from_slice(&encrypted_chunk.index.to_le_bytes());
    let chunk_key = blake3::derive_key("chunk_encryption", &kdf_input);

    // Derive nonce from chunk index
    let mut nonce = [0u8; 12];
    nonce[..8].copy_from_slice(&encrypted_chunk.index.to_le_bytes());

    // Decrypt
    let plaintext = aes_decrypt(
        &chunk_key,
        &nonce,
        &encrypted_chunk.ciphertext,
        &encrypted_chunk.index.to_le_bytes(),
    )?;

    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::file::encrypt::encrypt_chunk;

    #[test]
    fn test_decrypt_chunk() {
        let key = [0u8; 32];
        let data = b"chunk data here";
        let index = 0;

        let encrypted = encrypt_chunk(&key, data, index).unwrap();
        let decrypted = decrypt_chunk(&key, &encrypted).unwrap();

        assert_eq!(data, decrypted.as_slice());
    }

    #[test]
    fn test_decrypt_tampered_chunk() {
        let key = [0u8; 32];
        let data = b"chunk data here";
        let index = 0;

        let mut encrypted = encrypt_chunk(&key, data, index).unwrap();
        encrypted.hash[0] ^= 1; // Tamper with hash

        let result = decrypt_chunk(&key, &encrypted);
        assert!(result.is_err());
    }
}
