//! Argon2id password hashing
//!
//! Parameters: 256 MiB memory, 3 iterations, 4 parallel lanes (OWASP recommendation).

use crate::error::{CryptoError, Result};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Algorithm, Argon2, Params, Version,
};
use rand_core::OsRng;

/// Memory cost in KiB (256 MiB = 262144 KiB)
const MEMORY_COST: u32 = 262_144;

/// Number of iterations
const TIME_COST: u32 = 3;

/// Degree of parallelism
const PARALLELISM: u32 = 4;

/// Create an Argon2 instance with production parameters
fn production_argon2(output_len: Option<usize>) -> Result<Argon2<'static>> {
    let params = Params::new(MEMORY_COST, TIME_COST, PARALLELISM, output_len)
        .map_err(|e| CryptoError::KeyGeneration(format!("Invalid Argon2 params: {}", e)))?;

    Ok(Argon2::new(Algorithm::Argon2id, Version::V0x13, params))
}

/// Create an Argon2 instance for testing (fast, reduced parameters)
#[cfg(test)]
fn test_argon2(output_len: Option<usize>) -> Argon2<'static> {
    let params = Params::new(
        16_384, // 16 MiB — fast enough for tests
        1,      // 1 iteration
        1,      // 1 thread
        output_len,
    )
    .expect("test Argon2 params are valid");

    Argon2::new(Algorithm::Argon2id, Version::V0x13, params)
}

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
    let argon2 = production_argon2(None)?;

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

    // Verify uses the parameters embedded in the PHC string
    let argon2 = Argon2::default();

    match argon2.verify_password(password, &parsed_hash) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Derive a key from a password using Argon2id
///
/// Uses production parameters: 256 MiB memory, 3 iterations, 4 parallel lanes.
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
    let argon2 = production_argon2(Some(output_len))?;

    let mut output = vec![0u8; output_len];
    argon2
        .hash_password_into(password, salt, &mut output)
        .map_err(|e| CryptoError::KeyGeneration(format!("Argon2 key derivation failed: {}", e)))?;

    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test-only hash function with reduced Argon2 parameters for speed
    fn test_hash_password(password: &[u8], salt: Option<&SaltString>) -> Result<Vec<u8>> {
        let argon2 = test_argon2(None);

        let salt = match salt {
            Some(s) => s.clone(),
            None => SaltString::generate(&mut OsRng),
        };

        let hash = argon2
            .hash_password(password, &salt)
            .map_err(|e| CryptoError::KeyGeneration(format!("Argon2 hashing failed: {}", e)))?;

        Ok(hash.to_string().into_bytes())
    }

    /// Test-only key derivation with reduced Argon2 parameters
    fn test_derive_key(password: &[u8], salt: &[u8; 16], output_len: usize) -> Result<Vec<u8>> {
        let argon2 = test_argon2(Some(output_len));

        let mut output = vec![0u8; output_len];
        argon2
            .hash_password_into(password, salt, &mut output)
            .map_err(|e| {
                CryptoError::KeyGeneration(format!("Argon2 key derivation failed: {}", e))
            })?;

        Ok(output)
    }

    #[test]
    fn test_hash_and_verify() {
        let password = b"my_secure_password";
        let hash = test_hash_password(password, None).unwrap();

        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password(b"wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_verify_wrong_password() {
        let password = b"correct";
        let hash = test_hash_password(password, None).unwrap();

        assert!(!verify_password(b"incorrect", &hash).unwrap());
    }

    #[test]
    fn test_derive_key_deterministic() {
        let password = b"password";
        let salt = [0u8; 16];

        let key1 = test_derive_key(password, &salt, 32).unwrap();
        let key2 = test_derive_key(password, &salt, 32).unwrap();

        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);
    }

    #[test]
    fn test_derive_key_different_salt() {
        let password = b"password";
        let salt1 = [0u8; 16];
        let salt2 = [1u8; 16];

        let key1 = test_derive_key(password, &salt1, 32).unwrap();
        let key2 = test_derive_key(password, &salt2, 32).unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_production_params_are_valid() {
        // Verify that production params construction succeeds
        let result = production_argon2(Some(32));
        assert!(result.is_ok());
    }
}
