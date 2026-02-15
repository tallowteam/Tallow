//! SLH-DSA (SPHINCS+) signature scheme

use crate::error::{CryptoError, Result};
use pqcrypto_sphincsplus::sphincssha2256fsimple;
use pqcrypto_traits::sign::{PublicKey as _, SecretKey as _, SignedMessage as _};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// SLH-DSA signer (SPHINCS+)
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct SlhDsaSigner {
    public_key: Vec<u8>,
    secret_key: Vec<u8>,
}

impl SlhDsaSigner {
    /// Generate a new SLH-DSA keypair
    pub fn keygen() -> Self {
        let (pk, sk) = sphincssha2256fsimple::keypair();
        Self {
            public_key: pk.as_bytes().to_vec(),
            secret_key: sk.as_bytes().to_vec(),
        }
    }

    /// Sign a message
    pub fn sign(&self, message: &[u8]) -> Vec<u8> {
        let sk = sphincssha2256fsimple::SecretKey::from_bytes(&self.secret_key).unwrap();
        let signed_msg = sphincssha2256fsimple::sign(message, &sk);
        signed_msg.as_bytes().to_vec()
    }

    /// Get the public key bytes
    pub fn public_key_bytes(&self) -> &[u8] {
        &self.public_key
    }
}

/// Verify an SLH-DSA signature
pub fn verify(public_key: &[u8], signed_message: &[u8]) -> Result<Vec<u8>> {
    let pk = sphincssha2256fsimple::PublicKey::from_bytes(public_key)
        .map_err(|_| CryptoError::Verification("Invalid public key".to_string()))?;

    let signed = sphincssha2256fsimple::SignedMessage::from_bytes(signed_message)
        .map_err(|_| CryptoError::Verification("Invalid signed message".to_string()))?;

    sphincssha2256fsimple::open(&signed, &pk)
        .map(|m| m.to_vec())
        .map_err(|_| CryptoError::Verification("Signature verification failed".to_string()))
}
