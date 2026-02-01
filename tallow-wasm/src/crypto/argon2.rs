//! Argon2id password hashing
//!
//! Memory-hard password hashing for deriving encryption keys from passwords

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2, ParamsBuilder, Version,
};
use wasm_bindgen::prelude::*;

use super::{CryptoError, CryptoResult};

/// Argon2 configuration
#[wasm_bindgen]
#[derive(Clone)]
pub struct Argon2Config {
    /// Memory cost in KiB
    m_cost: u32,
    /// Time cost (iterations)
    t_cost: u32,
    /// Parallelism factor
    p_cost: u32,
    /// Output length in bytes
    output_len: usize,
}

#[wasm_bindgen]
impl Argon2Config {
    /// Create default configuration (recommended for most use cases)
    ///
    /// - Memory: 64 MiB
    /// - Iterations: 3
    /// - Parallelism: 4
    /// - Output: 32 bytes
    #[wasm_bindgen(constructor)]
    pub fn new() -> Argon2Config {
        Argon2Config {
            m_cost: 65536, // 64 MiB
            t_cost: 3,
            p_cost: 4,
            output_len: 32,
        }
    }

    /// Create low memory configuration (for constrained environments)
    ///
    /// - Memory: 16 MiB
    /// - Iterations: 2
    /// - Parallelism: 2
    pub fn low_memory() -> Argon2Config {
        Argon2Config {
            m_cost: 16384, // 16 MiB
            t_cost: 2,
            p_cost: 2,
            output_len: 32,
        }
    }

    /// Create high security configuration (slower but more secure)
    ///
    /// - Memory: 256 MiB
    /// - Iterations: 5
    /// - Parallelism: 8
    pub fn high_security() -> Argon2Config {
        Argon2Config {
            m_cost: 262144, // 256 MiB
            t_cost: 5,
            p_cost: 8,
            output_len: 32,
        }
    }

    /// Set memory cost in KiB
    pub fn with_memory_cost(mut self, m_cost: u32) -> Argon2Config {
        self.m_cost = m_cost;
        self
    }

    /// Set time cost (iterations)
    pub fn with_time_cost(mut self, t_cost: u32) -> Argon2Config {
        self.t_cost = t_cost;
        self
    }

    /// Set parallelism factor
    pub fn with_parallelism(mut self, p_cost: u32) -> Argon2Config {
        self.p_cost = p_cost;
        self
    }

    /// Set output length in bytes
    pub fn with_output_len(mut self, output_len: usize) -> Argon2Config {
        self.output_len = output_len;
        self
    }
}

impl Default for Argon2Config {
    fn default() -> Self {
        Self::new()
    }
}

/// Hash a password with Argon2id
///
/// Returns a PHC string that includes the salt and hash
///
/// # Example
/// ```js
/// const hash = argon2_hash_password("my-password");
/// // Returns: $argon2id$v=19$m=65536,t=3,p=4$...
/// ```
#[wasm_bindgen]
pub fn argon2_hash_password(password: &str) -> Result<String, JsValue> {
    argon2_hash_password_with_config(password, &Argon2Config::new())
}

/// Hash a password with custom configuration
#[wasm_bindgen]
pub fn argon2_hash_password_with_config(
    password: &str,
    config: &Argon2Config,
) -> Result<String, JsValue> {
    // Generate random salt
    let salt = SaltString::generate(&mut OsRng);

    // Build parameters
    let params = ParamsBuilder::new()
        .m_cost(config.m_cost)
        .t_cost(config.t_cost)
        .p_cost(config.p_cost)
        .output_len(config.output_len)
        .build()
        .map_err(|e| CryptoError::KeyGenerationFailed(e.to_string()))?;

    // Create Argon2 instance
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params);

    // Hash password
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    Ok(password_hash.to_string())
}

/// Verify a password against a hash
///
/// Returns true if the password matches the hash
#[wasm_bindgen]
pub fn argon2_verify_password(password: &str, hash: &str) -> Result<bool, JsValue> {
    // Parse hash
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| CryptoError::InvalidInput(format!("Invalid hash: {}", e)))?;

    // Verify password
    let argon2 = Argon2::default();

    match argon2.verify_password(password.as_bytes(), &parsed_hash) {
        Ok(()) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Derive a key from a password using Argon2id
///
/// This is different from hashing - it always returns the same key for the same password and salt
///
/// # Arguments
/// * `password` - Password to derive key from
/// * `salt` - Salt (should be at least 16 bytes)
/// * `output_length` - Desired key length in bytes
///
/// # Returns
/// Derived key
#[wasm_bindgen]
pub fn argon2_derive_key(
    password: &str,
    salt: &[u8],
    output_length: usize,
) -> Result<Vec<u8>, JsValue> {
    argon2_derive_key_with_config(password, salt, output_length, &Argon2Config::new())
}

/// Derive a key with custom configuration
#[wasm_bindgen]
pub fn argon2_derive_key_with_config(
    password: &str,
    salt: &[u8],
    output_length: usize,
    config: &Argon2Config,
) -> Result<Vec<u8>, JsValue> {
    if salt.len() < 16 {
        return Err(CryptoError::InvalidInput("Salt must be at least 16 bytes".to_string()).into());
    }

    // Build parameters
    let params = ParamsBuilder::new()
        .m_cost(config.m_cost)
        .t_cost(config.t_cost)
        .p_cost(config.p_cost)
        .output_len(output_length)
        .build()
        .map_err(|e| CryptoError::KeyGenerationFailed(e.to_string()))?;

    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params);

    let mut output = vec![0u8; output_length];

    argon2
        .hash_password_into(password.as_bytes(), salt, &mut output)
        .map_err(|e| CryptoError::KeyGenerationFailed(e.to_string()))?;

    Ok(output)
}

/// Generate a random salt for Argon2
///
/// Returns 16 bytes of random data suitable for use as a salt
#[wasm_bindgen]
pub fn argon2_generate_salt() -> Vec<u8> {
    use rand::Rng;
    let mut salt = [0u8; 16];
    rand::thread_rng().fill(&mut salt);
    salt.to_vec()
}

/// Get recommended Argon2 parameters as JSON
#[wasm_bindgen]
pub fn argon2_recommended_params() -> JsValue {
    let params = serde_json::json!({
        "default": {
            "m_cost": 65536,
            "t_cost": 3,
            "p_cost": 4,
            "memory_mb": 64,
        },
        "low_memory": {
            "m_cost": 16384,
            "t_cost": 2,
            "p_cost": 2,
            "memory_mb": 16,
        },
        "high_security": {
            "m_cost": 262144,
            "t_cost": 5,
            "p_cost": 8,
            "memory_mb": 256,
        },
    });

    serde_wasm_bindgen::to_value(&params).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_argon2_hash_verify() {
        let password = "my-secure-password";
        let hash = argon2_hash_password(password).unwrap();

        assert!(argon2_verify_password(password, &hash).unwrap());
        assert!(!argon2_verify_password("wrong-password", &hash).unwrap());
    }

    #[test]
    fn test_argon2_derive_key() {
        let password = "password";
        let salt = argon2_generate_salt();

        let key1 = argon2_derive_key(password, &salt, 32).unwrap();
        let key2 = argon2_derive_key(password, &salt, 32).unwrap();

        // Same password and salt should produce same key
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);

        // Different salt should produce different key
        let other_salt = argon2_generate_salt();
        let key3 = argon2_derive_key(password, &other_salt, 32).unwrap();
        assert_ne!(key1, key3);
    }

    #[test]
    fn test_argon2_configs() {
        let password = "test";
        let salt = argon2_generate_salt();

        let default_key = argon2_derive_key(password, &salt, 32).unwrap();

        let low_mem_config = Argon2Config::low_memory();
        let low_mem_key =
            argon2_derive_key_with_config(password, &salt, 32, &low_mem_config).unwrap();

        // Different configs should produce different keys
        assert_ne!(default_key, low_mem_key);
    }

    #[test]
    fn test_custom_config() {
        let config = Argon2Config::new()
            .with_memory_cost(32768)
            .with_time_cost(2)
            .with_parallelism(2);

        let password = "test";
        let hash = argon2_hash_password_with_config(password, &config).unwrap();

        assert!(argon2_verify_password(password, &hash).unwrap());
    }
}
