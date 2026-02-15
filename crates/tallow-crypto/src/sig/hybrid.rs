//! Hybrid signature combining ML-DSA and Ed25519

use crate::error::{CryptoError, Result};
use crate::sig::{ed25519, mldsa};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// Hybrid signature (ML-DSA + Ed25519)
#[derive(Clone, Serialize, Deserialize)]
pub struct HybridSignature {
    pub mldsa: Vec<u8>,
    #[serde(with = "serde_arrays")]
    pub ed25519: [u8; 64],
}

// Custom serde for [u8; 64]
mod serde_arrays {
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

/// Hybrid signer
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct HybridSigner {
    mldsa: mldsa::MlDsaSigner,
    ed25519: ed25519::Ed25519Signer,
}

impl HybridSigner {
    /// Generate a new hybrid keypair
    pub fn keygen() -> Self {
        Self {
            mldsa: mldsa::MlDsaSigner::keygen(),
            ed25519: ed25519::Ed25519Signer::keygen(),
        }
    }

    /// Sign a message with both algorithms
    pub fn sign(&self, message: &[u8]) -> HybridSignature {
        HybridSignature {
            mldsa: self.mldsa.sign(message),
            ed25519: self.ed25519.sign(message),
        }
    }

    /// Get the hybrid public key
    pub fn public_key(&self) -> HybridPublicKey {
        HybridPublicKey {
            mldsa: self.mldsa.public_key_bytes().to_vec(),
            ed25519: self.ed25519.verifying_key_bytes(),
        }
    }
}

/// Hybrid public key
#[derive(Clone, Serialize, Deserialize)]
pub struct HybridPublicKey {
    pub mldsa: Vec<u8>,
    pub ed25519: [u8; 32],
}

/// Verify a hybrid signature
///
/// Both signatures must be valid for verification to succeed.
pub fn verify(public_key: &HybridPublicKey, message: &[u8], signature: &HybridSignature) -> Result<()> {
    // Verify ML-DSA signature
    mldsa::verify(&public_key.mldsa, &signature.mldsa)?;

    // Verify Ed25519 signature
    ed25519::verify(&public_key.ed25519, message, &signature.ed25519)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hybrid_sign_verify() {
        let signer = HybridSigner::keygen();
        let message = b"test message";

        let signature = signer.sign(message);
        let public_key = signer.public_key();

        let result = verify(&public_key, message, &signature);
        assert!(result.is_ok());
    }
}
