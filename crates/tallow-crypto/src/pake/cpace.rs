//! CPace protocol for code-phrase authentication

use crate::error::{CryptoError, Result};
use crate::hash::blake3;
use crate::kem::x25519::{X25519KeyPair, SharedSecret};
use serde::{Deserialize, Serialize};

/// CPace initiator (simplified stub)
#[derive(Clone, Serialize, Deserialize)]
pub struct CpaceInitiator {
    ephemeral: X25519KeyPair,
    code_phrase: Vec<u8>,
}

impl CpaceInitiator {
    /// Start CPace protocol with a code phrase
    pub fn new(code_phrase: &str) -> Self {
        let ephemeral = X25519KeyPair::generate();
        Self {
            ephemeral,
            code_phrase: code_phrase.as_bytes().to_vec(),
        }
    }

    /// Get the public message to send
    pub fn public_message(&self) -> Vec<u8> {
        self.ephemeral.public_bytes().to_vec()
    }

    /// Finish protocol and derive shared secret
    pub fn finish(&self, their_public: &[u8]) -> Result<[u8; 32]> {
        if their_public.len() != 32 {
            return Err(CryptoError::InvalidKey("Invalid public key length".to_string()));
        }

        let their_pk: [u8; 32] = their_public.try_into().unwrap();
        let their_key = x25519_dalek::PublicKey::from(their_pk);

        let dh = self.ephemeral.diffie_hellman(&their_key);

        // Derive final key from DH + code phrase
        let mut input = Vec::new();
        input.extend_from_slice(&dh.0);
        input.extend_from_slice(&self.code_phrase);

        Ok(blake3::hash(&input))
    }
}

/// CPace responder (simplified stub)
pub type CpaceResponder = CpaceInitiator;
