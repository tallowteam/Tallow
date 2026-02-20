//! Pre-keys for asynchronous key agreement

use crate::error::{CryptoError, Result};
use crate::kem::hybrid::{HybridKem, PublicKey};
use crate::sig::Ed25519Signer;
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Signed pre-key
#[derive(Clone, Serialize, Deserialize)]
pub struct SignedPreKey {
    /// Unique identifier for this pre-key
    pub id: u32,
    /// Hybrid public key used for key agreement
    pub public_key: PublicKey,
    #[serde(with = "serde_sig64")]
    /// Ed25519 signature over the pre-key id, public key, and timestamp
    pub signature: [u8; 64],
    /// Unix timestamp (seconds) when this pre-key was generated
    pub timestamp: u64,
}

// Custom serde for [u8; 64] signature
mod serde_sig64 {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S>(bytes: &[u8; 64], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        bytes.as_slice().serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<[u8; 64], D::Error>
    where
        D: Deserializer<'de>,
    {
        let vec = Vec::<u8>::deserialize(deserializer)?;
        vec.try_into()
            .map_err(|_| serde::de::Error::custom("Expected 64 bytes"))
    }
}

/// One-time pre-key
#[derive(Clone, Serialize, Deserialize)]
pub struct OneTimePreKey {
    /// Unique identifier for this one-time pre-key
    pub id: u32,
    /// Hybrid public key used for a single key agreement exchange
    pub public_key: PublicKey,
}

impl Zeroize for OneTimePreKey {
    fn zeroize(&mut self) {
        self.id.zeroize();
        // PublicKey doesn't need zeroization (it's public)
    }
}

impl Drop for OneTimePreKey {
    fn drop(&mut self) {
        self.zeroize();
    }
}

/// Pre-key bundle for key agreement
#[derive(Clone, Serialize, Deserialize)]
pub struct PreKeyBundle {
    /// Serialized identity public key of the bundle owner
    pub identity_key: Vec<u8>,
    /// Medium-term signed pre-key for initiating key agreement
    pub signed_prekey: SignedPreKey,
    /// Optional one-time pre-key for forward secrecy; absent when exhausted
    pub onetime_prekey: Option<OneTimePreKey>,
}

impl SignedPreKey {
    /// Generate a new signed pre-key
    pub fn generate(id: u32, identity: &Ed25519Signer) -> Result<Self> {
        let (pk, _sk) = HybridKem::keygen()?;
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| CryptoError::KeyGeneration(format!("system clock error: {}", e)))?
            .as_secs();

        let pk_bytes = bincode::serialize(&pk)
            .map_err(|e| CryptoError::Serialization(format!("Failed to serialize pre-key: {}", e)))?;

        let mut message = Vec::new();
        message.extend_from_slice(&id.to_le_bytes());
        message.extend_from_slice(&pk_bytes);
        message.extend_from_slice(&timestamp.to_le_bytes());

        let signature = identity.sign(&message);

        Ok(Self {
            id,
            public_key: pk,
            signature,
            timestamp,
        })
    }

    /// Verify the signature on this pre-key
    pub fn verify(&self, identity_key: &[u8; 32]) -> Result<()> {
        let pk_bytes = bincode::serialize(&self.public_key)
            .map_err(|e| CryptoError::Serialization(format!("Failed to serialize pre-key for verification: {}", e)))?;

        let mut message = Vec::new();
        message.extend_from_slice(&self.id.to_le_bytes());
        message.extend_from_slice(&pk_bytes);
        message.extend_from_slice(&self.timestamp.to_le_bytes());

        crate::sig::ed25519::verify(identity_key, &message, &self.signature)
    }
}

impl OneTimePreKey {
    /// Generate a new one-time pre-key
    pub fn generate(id: u32) -> Result<Self> {
        let (pk, _sk) = HybridKem::keygen()?;
        Ok(Self { id, public_key: pk })
    }
}
