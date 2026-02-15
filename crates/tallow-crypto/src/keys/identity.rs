//! Long-term identity key pairs

use crate::error::{CryptoError, Result};
use crate::sig::{Ed25519Signer, HybridSigner};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Identity key pair (hybrid signature)
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct IdentityKeyPair {
    signer: HybridSigner,
    id: [u8; 32],
}

impl IdentityKeyPair {
    /// Generate a new identity keypair
    pub fn generate() -> Self {
        let signer = HybridSigner::keygen();
        let pk = signer.public_key();

        // Derive identity from public key
        let id = crate::hash::blake3::hash(&bincode::serialize(&pk).unwrap());

        Self { signer, id }
    }

    /// Get the signer
    pub fn signer(&self) -> &HybridSigner {
        &self.signer
    }

    /// Get the identity (fingerprint)
    pub fn id(&self) -> &[u8; 32] {
        &self.id
    }

    /// Serialize to bytes
    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        bincode::serialize(self).map_err(Into::into)
    }

    /// Deserialize from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        bincode::deserialize(bytes).map_err(Into::into)
    }
}
