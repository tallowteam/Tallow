//! Key rotation records with signed transitions

use crate::error::{CryptoError, Result};
use crate::sig::{Ed25519Signer, HybridSigner};
use serde::{Deserialize, Serialize};

/// Record of a key rotation event
#[derive(Clone, Serialize, Deserialize)]
pub struct KeyRotationRecord {
    pub old_key_id: [u8; 32],
    pub new_key_id: [u8; 32],
    pub timestamp: u64,
    #[serde(with = "serde_sig64")]
    pub signature: [u8; 64],
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

impl KeyRotationRecord {
    /// Create a new rotation record
    pub fn new(
        old_identity: &Ed25519Signer,
        new_identity: &Ed25519Signer,
    ) -> Result<Self> {
        let old_key_id = old_identity.verifying_key_bytes();
        let new_key_id = new_identity.verifying_key_bytes();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| CryptoError::KeyGeneration(format!("system clock error: {}", e)))?
            .as_secs();

        let mut message = Vec::new();
        message.extend_from_slice(&old_key_id);
        message.extend_from_slice(&new_key_id);
        message.extend_from_slice(&timestamp.to_le_bytes());

        let signature = old_identity.sign(&message);

        Ok(Self {
            old_key_id,
            new_key_id,
            timestamp,
            signature,
        })
    }

    /// Verify the rotation record signature
    pub fn verify(&self) -> crate::error::Result<()> {
        let mut message = Vec::new();
        message.extend_from_slice(&self.old_key_id);
        message.extend_from_slice(&self.new_key_id);
        message.extend_from_slice(&self.timestamp.to_le_bytes());

        crate::sig::ed25519::verify(&self.old_key_id, &message, &self.signature)
    }
}
