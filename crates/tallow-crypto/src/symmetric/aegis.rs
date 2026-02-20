//! AEGIS-256 encryption (experimental)

#[cfg(feature = "aegis")]
use aegis::aegis256::{Aegis256, Nonce, Tag};

use crate::error::{CryptoError, Result};

/// Encrypt data using AEGIS-256
///
/// # Arguments
///
/// * `key` - 32-byte encryption key
/// * `nonce` - 32-byte nonce (must be unique per message)
/// * `plaintext` - Data to encrypt
/// * `aad` - Additional authenticated data (can be empty)
///
/// # Returns
///
/// Ciphertext with authentication tag appended
#[cfg(feature = "aegis")]
pub fn encrypt(key: &[u8; 32], nonce: &[u8; 32], plaintext: &[u8], aad: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aegis256::new(key.into());
    let nonce = Nonce::from(*nonce);

    let mut ciphertext = vec![0u8; plaintext.len()];
    let tag = cipher
        .encrypt(&nonce, aad, plaintext, &mut ciphertext)
        .map_err(|e| CryptoError::Encryption(format!("AEGIS-256 encryption failed: {:?}", e)))?;

    // Append tag to ciphertext
    ciphertext.extend_from_slice(tag.as_ref());
    Ok(ciphertext)
}

/// Decrypt data using AEGIS-256
///
/// # Arguments
///
/// * `key` - 32-byte encryption key
/// * `nonce` - 32-byte nonce (must match encryption nonce)
/// * `ciphertext` - Data to decrypt (includes authentication tag)
/// * `aad` - Additional authenticated data (must match encryption AAD)
///
/// # Returns
///
/// Decrypted plaintext if authentication succeeds
#[cfg(feature = "aegis")]
pub fn decrypt(key: &[u8; 32], nonce: &[u8; 32], ciphertext: &[u8], aad: &[u8]) -> Result<Vec<u8>> {
    if ciphertext.len() < 32 {
        return Err(CryptoError::Decryption(
            "Ciphertext too short for AEGIS-256".to_string(),
        ));
    }

    let cipher = Aegis256::new(key.into());
    let nonce = Nonce::from(*nonce);

    // Split ciphertext and tag
    let tag_start = ciphertext.len() - 32;
    let ct = &ciphertext[..tag_start];
    let tag_bytes: [u8; 32] = ciphertext[tag_start..]
        .try_into()
        .map_err(|_| CryptoError::Decryption("Invalid tag length".to_string()))?;
    let tag = Tag::from(tag_bytes);

    let mut plaintext = vec![0u8; ct.len()];
    cipher
        .decrypt(&nonce, aad, ct, &tag, &mut plaintext)
        .map_err(|e| CryptoError::Decryption(format!("AEGIS-256 decryption failed: {:?}", e)))?;

    Ok(plaintext)
}

// Stub implementations when feature is disabled
#[cfg(not(feature = "aegis"))]
pub fn encrypt(
    _key: &[u8; 32],
    _nonce: &[u8; 32],
    _plaintext: &[u8],
    _aad: &[u8],
) -> Result<Vec<u8>> {
    Err(CryptoError::Unsupported(
        "AEGIS-256 not enabled (requires 'aegis' feature)".to_string(),
    ))
}

#[cfg(not(feature = "aegis"))]
pub fn decrypt(
    _key: &[u8; 32],
    _nonce: &[u8; 32],
    _ciphertext: &[u8],
    _aad: &[u8],
) -> Result<Vec<u8>> {
    Err(CryptoError::Unsupported(
        "AEGIS-256 not enabled (requires 'aegis' feature)".to_string(),
    ))
}

#[cfg(all(test, feature = "aegis"))]
mod tests {
    use super::*;

    #[test]
    fn test_aegis_roundtrip() {
        let key = [0u8; 32];
        let nonce = [1u8; 32];
        let plaintext = b"hello world";
        let aad = b"metadata";

        let ciphertext = encrypt(&key, &nonce, plaintext, aad).unwrap();
        let decrypted = decrypt(&key, &nonce, &ciphertext, aad).unwrap();

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_aegis_wrong_key() {
        let key1 = [0u8; 32];
        let key2 = [1u8; 32];
        let nonce = [1u8; 32];
        let plaintext = b"secret";

        let ciphertext = encrypt(&key1, &nonce, plaintext, &[]).unwrap();
        let result = decrypt(&key2, &nonce, &ciphertext, &[]);

        assert!(result.is_err());
    }
}
