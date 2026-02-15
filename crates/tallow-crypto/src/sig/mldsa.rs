//! ML-DSA (Dilithium) signature scheme

use crate::error::{CryptoError, Result};
use pqcrypto_dilithium::dilithium5;
use pqcrypto_traits::sign::{PublicKey as _, SecretKey as _, SignedMessage as _};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// ML-DSA-87 signer (Dilithium5)
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct MlDsaSigner {
    public_key: Vec<u8>,
    secret_key: Vec<u8>,
}

impl MlDsaSigner {
    /// Generate a new ML-DSA-87 keypair
    pub fn keygen() -> Self {
        let (pk, sk) = dilithium5::keypair();
        Self {
            public_key: pk.as_bytes().to_vec(),
            secret_key: sk.as_bytes().to_vec(),
        }
    }

    /// Sign a message
    pub fn sign(&self, message: &[u8]) -> Vec<u8> {
        let sk = dilithium5::SecretKey::from_bytes(&self.secret_key).unwrap();
        let signed_msg = dilithium5::sign(message, &sk);
        signed_msg.as_bytes().to_vec()
    }

    /// Get the public key bytes
    pub fn public_key_bytes(&self) -> &[u8] {
        &self.public_key
    }
}

/// Verify an ML-DSA signature
pub fn verify(public_key: &[u8], signed_message: &[u8]) -> Result<Vec<u8>> {
    let pk = dilithium5::PublicKey::from_bytes(public_key)
        .map_err(|_| CryptoError::Verification("Invalid public key".to_string()))?;

    let signed = dilithium5::SignedMessage::from_bytes(signed_message)
        .map_err(|_| CryptoError::Verification("Invalid signed message".to_string()))?;

    dilithium5::open(&signed, &pk)
        .map(|m| m.to_vec())
        .map_err(|_| CryptoError::Verification("Signature verification failed".to_string()))
}
