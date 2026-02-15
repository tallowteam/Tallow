//! Argon2id password hashing

use crate::error::{CryptoError, Result};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;

/// Hash a password using Argon2id
///
/// # Arguments
///
/// * `password` - The password to hash
/// * `salt` - Optional salt (if None, a random salt is generated)
///
/// # Returns
///
/// PHC-encoded password hash string
///
/// # Example
///
/// ```ignore
/// let hash = hash_password(b"my_password", None)?;
/// ```
pub fn hash_password(password: &[u8], salt: Option<&SaltString>) -> Result<Vec<u8>> {
    let argon2 = Argon2::default();

    let salt = match salt {
        Some(s) => s.clone(),
        None => SaltString::generate(&mut OsRng),
    };

    let hash = argon2
        .hash_password(password, &salt)
        .map_err(|e| CryptoError::KeyGeneration(format!("Argon2 hashing failed: {}", e)))?;

    Ok(hash.to_string().into_bytes())
}

/// Verify a password against an Argon2 hash
///
/// # Arguments
///
/// * `password` - The password to verify
/// * `hash` - The PHC-encoded hash to verify against
///
/// # Returns
///
/// `Ok(true)` if the password matches, `Ok(false)` if it doesn't,
/// or `Err` if the hash is malformed
pub fn verify_password(password: &[u8], hash: &[u8]) -> Result<bool> {
    let hash_str = std::str::from_utf8(hash)
        .map_err(|e| CryptoError::InvalidKey(format!("Invalid hash encoding: {}", e)))?;

    let parsed_hash = PasswordHash::new(hash_str)
        .map_err(|e| CryptoError::InvalidKey(format!("Invalid hash format: {}", e)))?;

    let argon2 = Argon2::default();

    match argon2.verify_password(password, &parsed_hash) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Derive a key from a password using Argon2id
///
/// This is similar to hash_password but returns raw bytes instead of a PHC string.
///
/// # Arguments
///
/// * `password` - The password to derive from
/// * `salt` - 16-byte salt
/// * `output_len` - Desired output length in bytes
///
/// # Returns
///
/// Derived key material
pub fn derive_key(password: &[u8], salt: &[u8; 16], output_len: usize) -> Result<Vec<u8>> {
    use argon2::{Algorithm, Params, Version};

    let params = Params::new(
        19456,  // 19 MiB memory cost
        2,      // 2 iterations
        1,      // 1 thread
        Some(output_len),
    )
    .map_err(|e| CryptoError::KeyGeneration(format!("Invalid Argon2 params: {}", e)))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut output = vec![0u8; output_len];
    argon2
        .hash_password_into(password, salt, &mut output)
        .map_err(|e| CryptoError::KeyGeneration(format!("Argon2 key derivation failed: {}", e)))?;

    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify() {
        let password = b"my_secure_password";
        let hash = hash_password(password, None).unwrap();

        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password(b"wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_verify_wrong_password() {
        let password = b"correct";
        let hash = hash_password(password, None).unwrap();

        assert!(!verify_password(b"incorrect", &hash).unwrap());
    }

    #[test]
    fn test_derive_key() {
        let password = b"password";
        let salt = [0u8; 16];

        let key1 = derive_key(password, &salt, 32).unwrap();
        let key2 = derive_key(password, &salt, 32).unwrap();

        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);
    }

    #[test]
    fn test_derive_key_different_salt() {
        let password = b"password";
        let salt1 = [0u8; 16];
        let salt2 = [1u8; 16];

        let key1 = derive_key(password, &salt1, 32).unwrap();
        let key2 = derive_key(password, &salt2, 32).unwrap();

        assert_ne!(key1, key2);
    }
}
