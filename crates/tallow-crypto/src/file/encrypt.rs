//! File encryption

use crate::error::Result;
use crate::hash::blake3;
use crate::symmetric::{aes_encrypt, CipherSuite};
use serde::{Deserialize, Serialize};

/// Encrypted file chunk
#[derive(Clone, Serialize, Deserialize)]
pub struct EncryptedChunk {
    /// Zero-based sequential position of this chunk within the file
    pub index: u64,
    /// AES-256-GCM encrypted chunk data including authentication tag
    pub ciphertext: Vec<u8>,
    /// BLAKE3 hash of the ciphertext for integrity verification
    pub hash: [u8; 32],
}

/// File encryptor
pub struct FileEncryptor {
    key: [u8; 32],
    /// Reserved for cipher suite negotiation (currently AES-256-GCM only)
    #[allow(dead_code)]
    cipher: CipherSuite,
}

impl FileEncryptor {
    /// Create a new file encryptor
    pub fn new(key: [u8; 32], cipher: CipherSuite) -> Self {
        Self { key, cipher }
    }

    /// Encrypt a chunk
    pub fn encrypt_chunk(&self, chunk_data: &[u8], chunk_index: u64) -> Result<EncryptedChunk> {
        encrypt_chunk(&self.key, chunk_data, chunk_index)
    }
}

/// Encrypt a single file chunk
///
/// # Arguments
///
/// * `key` - Encryption key
/// * `chunk_data` - Chunk data to encrypt
/// * `chunk_index` - Index of this chunk
///
/// # Returns
///
/// Encrypted chunk with metadata
pub fn encrypt_chunk(
    key: &[u8; 32],
    chunk_data: &[u8],
    chunk_index: u64,
) -> Result<EncryptedChunk> {
    // Derive chunk-specific key
    let mut kdf_input = Vec::new();
    kdf_input.extend_from_slice(key);
    kdf_input.extend_from_slice(&chunk_index.to_le_bytes());
    let chunk_key = blake3::derive_key("chunk_encryption", &kdf_input);

    // Derive nonce from chunk index
    let mut nonce = [0u8; 12];
    nonce[..8].copy_from_slice(&chunk_index.to_le_bytes());

    // Encrypt
    let ciphertext = aes_encrypt(&chunk_key, &nonce, chunk_data, &chunk_index.to_le_bytes())?;

    // Hash for integrity
    let hash = blake3::hash(&ciphertext);

    Ok(EncryptedChunk {
        index: chunk_index,
        ciphertext,
        hash,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_chunk() {
        let key = [0u8; 32];
        let data = b"chunk data here";
        let index = 0;

        let encrypted = encrypt_chunk(&key, data, index).unwrap();
        assert_eq!(encrypted.index, index);
        assert!(!encrypted.ciphertext.is_empty());
    }
}
