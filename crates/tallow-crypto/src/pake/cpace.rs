//! CPace PAKE (Password-Authenticated Key Exchange) over Ristretto255
//!
//! Implements the CPace protocol using Ristretto255 from curve25519-dalek.
//! The code phrase is hashed to a group generator, preventing offline
//! dictionary attacks if one party is compromised.

use crate::error::{CryptoError, Result};
use crate::hash::blake3;
use curve25519_dalek::ristretto::{CompressedRistretto, RistrettoPoint};
use curve25519_dalek::scalar::Scalar;
use rand_core::OsRng;

/// Domain separator for CPace generator derivation
const CPACE_DOMAIN: &str = "tallow-cpace-v1";

/// CPace initiator
#[derive(Clone)]
pub struct CpaceInitiator {
    scalar: Scalar,
    /// Generator point derived from code phrase (retained for key confirmation)
    #[allow(dead_code)]
    generator: RistrettoPoint,
    public: CompressedRistretto,
    /// Hash of code phrase (retained for key confirmation)
    #[allow(dead_code)]
    code_phrase_hash: [u8; 32],
}

impl Drop for CpaceInitiator {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.scalar.zeroize();
        self.code_phrase_hash.zeroize();
    }
}

/// CPace responder (same protocol, different role label)
pub struct CpaceResponder {
    scalar: Scalar,
    /// Generator point derived from code phrase (retained for key confirmation)
    #[allow(dead_code)]
    generator: RistrettoPoint,
    public: CompressedRistretto,
    /// Hash of code phrase (retained for key confirmation)
    #[allow(dead_code)]
    code_phrase_hash: [u8; 32],
}

impl Drop for CpaceResponder {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.scalar.zeroize();
        self.code_phrase_hash.zeroize();
    }
}

/// Derive the CPace generator from a code phrase and session context
///
/// Uses BLAKE3 to hash the code phrase with domain separation,
/// then maps to a Ristretto point using hash-to-group.
fn derive_generator(code_phrase: &str, session_id: &[u8]) -> RistrettoPoint {
    // Build the generator input with domain separation
    let mut input = Vec::new();
    input.extend_from_slice(CPACE_DOMAIN.as_bytes());
    input.push(0x00); // separator
    input.extend_from_slice(code_phrase.as_bytes());
    input.push(0x00); // separator
    input.extend_from_slice(session_id);

    // Hash to 64 bytes for Ristretto point derivation
    let h1 = blake3::hash(&input);
    input.push(0x01); // counter for second hash
    let h2 = blake3::hash(&input);

    let mut wide = [0u8; 64];
    wide[..32].copy_from_slice(&h1);
    wide[32..].copy_from_slice(&h2);

    // Map to Ristretto point (uniform, no cofactor issues)
    RistrettoPoint::from_uniform_bytes(&wide)
}

impl CpaceInitiator {
    /// Start CPace protocol with a code phrase
    ///
    /// # Arguments
    ///
    /// * `code_phrase` - The shared code phrase (passphrase)
    /// * `session_id` - Unique session identifier for channel binding
    pub fn new(code_phrase: &str, session_id: &[u8]) -> Self {
        let generator = derive_generator(code_phrase, session_id);
        let scalar = Scalar::random(&mut OsRng);
        let public = (scalar * generator).compress();
        let code_phrase_hash = blake3::hash(code_phrase.as_bytes());

        Self {
            scalar,
            generator,
            public,
            code_phrase_hash,
        }
    }

    /// Get the public message to send to the responder (32 bytes)
    pub fn public_message(&self) -> [u8; 32] {
        self.public.to_bytes()
    }

    /// Finish the protocol with the responder's public message
    ///
    /// Computes the shared secret and derives a session key via HKDF.
    ///
    /// # Arguments
    ///
    /// * `their_public` - The responder's 32-byte public message
    ///
    /// # Returns
    ///
    /// A 32-byte session key, or error if the public key is invalid
    pub fn finish(&self, their_public: &[u8]) -> Result<[u8; 32]> {
        if their_public.len() != 32 {
            return Err(CryptoError::InvalidKey(
                "CPace public message must be 32 bytes".to_string(),
            ));
        }

        let their_bytes: [u8; 32] = their_public.try_into().map_err(|_| {
            CryptoError::InvalidKey("CPace public message must be 32 bytes".to_string())
        })?;

        let their_point = CompressedRistretto(their_bytes)
            .decompress()
            .ok_or_else(|| {
                CryptoError::PakeFailure("Invalid Ristretto point from peer".to_string())
            })?;

        // Compute shared secret: scalar * their_public
        let shared_point = self.scalar * their_point;
        let shared_bytes = shared_point.compress().to_bytes();

        // Derive session key with transcript binding
        let mut transcript = Vec::new();
        transcript.extend_from_slice(CPACE_DOMAIN.as_bytes());
        transcript.extend_from_slice(&self.public.to_bytes());
        transcript.extend_from_slice(their_public);
        transcript.extend_from_slice(&shared_bytes);

        Ok(blake3::derive_key("cpace-session-key", &transcript))
    }
}

impl CpaceResponder {
    /// Start CPace protocol as responder
    ///
    /// # Arguments
    ///
    /// * `code_phrase` - The shared code phrase (passphrase)
    /// * `session_id` - Unique session identifier for channel binding
    pub fn new(code_phrase: &str, session_id: &[u8]) -> Self {
        let generator = derive_generator(code_phrase, session_id);
        let scalar = Scalar::random(&mut OsRng);
        let public = (scalar * generator).compress();
        let code_phrase_hash = blake3::hash(code_phrase.as_bytes());

        Self {
            scalar,
            generator,
            public,
            code_phrase_hash,
        }
    }

    /// Get the public message to send to the initiator (32 bytes)
    pub fn public_message(&self) -> [u8; 32] {
        self.public.to_bytes()
    }

    /// Finish the protocol with the initiator's public message
    ///
    /// # Arguments
    ///
    /// * `their_public` - The initiator's 32-byte public message
    ///
    /// # Returns
    ///
    /// A 32-byte session key, or error if the public key is invalid
    pub fn finish(&self, their_public: &[u8]) -> Result<[u8; 32]> {
        if their_public.len() != 32 {
            return Err(CryptoError::InvalidKey(
                "CPace public message must be 32 bytes".to_string(),
            ));
        }

        let their_bytes: [u8; 32] = their_public.try_into().map_err(|_| {
            CryptoError::InvalidKey("CPace public message must be 32 bytes".to_string())
        })?;

        let their_point = CompressedRistretto(their_bytes)
            .decompress()
            .ok_or_else(|| {
                CryptoError::PakeFailure("Invalid Ristretto point from peer".to_string())
            })?;

        // Compute shared secret: scalar * their_public
        let shared_point = self.scalar * their_point;
        let shared_bytes = shared_point.compress().to_bytes();

        // Derive session key with transcript binding
        // Note: transcript ordering must match — initiator's public first
        let mut transcript = Vec::new();
        transcript.extend_from_slice(CPACE_DOMAIN.as_bytes());
        transcript.extend_from_slice(their_public); // initiator's public
        transcript.extend_from_slice(&self.public.to_bytes()); // responder's public
        transcript.extend_from_slice(&shared_bytes);

        Ok(blake3::derive_key("cpace-session-key", &transcript))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpace_same_password_derives_same_key() {
        let session_id = b"test-session-123";
        let code_phrase = "correct horse battery staple";

        let initiator = CpaceInitiator::new(code_phrase, session_id);
        let responder = CpaceResponder::new(code_phrase, session_id);

        let init_msg = initiator.public_message();
        let resp_msg = responder.public_message();

        let key_a = initiator.finish(&resp_msg).unwrap();
        let key_b = responder.finish(&init_msg).unwrap();

        assert_eq!(key_a, key_b, "Same password should derive same session key");
    }

    #[test]
    fn test_cpace_different_password_derives_different_key() {
        let session_id = b"test-session-123";

        let initiator = CpaceInitiator::new("password-one", session_id);
        let responder = CpaceResponder::new("password-two", session_id);

        let init_msg = initiator.public_message();
        let resp_msg = responder.public_message();

        let key_a = initiator.finish(&resp_msg).unwrap();
        let key_b = responder.finish(&init_msg).unwrap();

        assert_ne!(
            key_a, key_b,
            "Different passwords should derive different session keys"
        );
    }

    #[test]
    fn test_cpace_invalid_public_length() {
        let initiator = CpaceInitiator::new("password", b"session");
        let result = initiator.finish(&[0u8; 16]);
        assert!(result.is_err());
    }

    #[test]
    fn test_cpace_different_session_ids_derive_different_keys() {
        let code_phrase = "same-password";

        let init_a = CpaceInitiator::new(code_phrase, b"session-1");
        let resp_a = CpaceResponder::new(code_phrase, b"session-1");

        let init_b = CpaceInitiator::new(code_phrase, b"session-2");
        let resp_b = CpaceResponder::new(code_phrase, b"session-2");

        let key_a = init_a.finish(&resp_a.public_message()).unwrap();
        let key_b = init_b.finish(&resp_b.public_message()).unwrap();

        assert_ne!(
            key_a, key_b,
            "Different session IDs should derive different keys"
        );
    }
}
