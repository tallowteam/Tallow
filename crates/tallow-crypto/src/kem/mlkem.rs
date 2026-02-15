//! ML-KEM (Kyber) implementation

use crate::error::{CryptoError, Result};
use crate::mem::SecureBuf;
use pqcrypto_kyber::kyber1024;
use pqcrypto_traits::kem::{Ciphertext as _, PublicKey as _, SecretKey as _, SharedSecret as _};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// ML-KEM-1024 public key
#[derive(Clone, Serialize, Deserialize)]
pub struct PublicKey(Vec<u8>);

/// ML-KEM-1024 secret key
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct SecretKey(Vec<u8>);

/// ML-KEM-1024 ciphertext
#[derive(Clone, Serialize, Deserialize)]
pub struct Ciphertext(Vec<u8>);

/// ML-KEM-1024 shared secret
#[derive(Clone, Zeroize)]
#[zeroize(drop)]
pub struct SharedSecret(pub [u8; 32]);

impl PublicKey {
    /// Get the raw bytes of the public key
    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }

    /// Create a public key from raw bytes
    pub fn from_bytes(bytes: Vec<u8>) -> Result<Self> {
        if bytes.len() != kyber1024::public_key_bytes() {
            return Err(CryptoError::InvalidKey(format!(
                "Invalid public key length: expected {}, got {}",
                kyber1024::public_key_bytes(),
                bytes.len()
            )));
        }
        Ok(Self(bytes))
    }
}

impl SecretKey {
    /// Get the raw bytes of the secret key
    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }

    /// Create a secret key from raw bytes
    pub fn from_bytes(bytes: Vec<u8>) -> Result<Self> {
        if bytes.len() != kyber1024::secret_key_bytes() {
            return Err(CryptoError::InvalidKey(format!(
                "Invalid secret key length: expected {}, got {}",
                kyber1024::secret_key_bytes(),
                bytes.len()
            )));
        }
        Ok(Self(bytes))
    }
}

impl Ciphertext {
    /// Get the raw bytes of the ciphertext
    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }

    /// Create a ciphertext from raw bytes
    pub fn from_bytes(bytes: Vec<u8>) -> Result<Self> {
        if bytes.len() != kyber1024::ciphertext_bytes() {
            return Err(CryptoError::InvalidKey(format!(
                "Invalid ciphertext length: expected {}, got {}",
                kyber1024::ciphertext_bytes(),
                bytes.len()
            )));
        }
        Ok(Self(bytes))
    }
}

/// ML-KEM-1024 operations
pub struct MlKem;

impl MlKem {
    /// Generate a new ML-KEM-1024 keypair
    ///
    /// # Returns
    ///
    /// A tuple of (public_key, secret_key)
    pub fn keygen() -> (PublicKey, SecretKey) {
        let (pk, sk) = kyber1024::keypair();
        (
            PublicKey(pk.as_bytes().to_vec()),
            SecretKey(sk.as_bytes().to_vec()),
        )
    }

    /// Encapsulate a shared secret to a public key
    ///
    /// # Arguments
    ///
    /// * `pk` - The recipient's public key
    ///
    /// # Returns
    ///
    /// A tuple of (ciphertext, shared_secret)
    pub fn encapsulate(pk: &PublicKey) -> Result<(Ciphertext, SharedSecret)> {
        let pk_obj = kyber1024::PublicKey::from_bytes(&pk.0)
            .map_err(|e| CryptoError::Encryption(format!("Invalid public key: {:?}", e)))?;

        let (ss, ct) = kyber1024::encapsulate(&pk_obj);

        let ss_bytes = ss.as_bytes();
        let mut shared_secret = [0u8; 32];
        shared_secret.copy_from_slice(&ss_bytes[..32]);

        Ok((
            Ciphertext(ct.as_bytes().to_vec()),
            SharedSecret(shared_secret),
        ))
    }

    /// Decapsulate a shared secret from a ciphertext
    ///
    /// # Arguments
    ///
    /// * `sk` - The recipient's secret key
    /// * `ct` - The ciphertext
    ///
    /// # Returns
    ///
    /// The shared secret
    pub fn decapsulate(sk: &SecretKey, ct: &Ciphertext) -> Result<SharedSecret> {
        let sk_obj = kyber1024::SecretKey::from_bytes(&sk.0)
            .map_err(|e| CryptoError::Decryption(format!("Invalid secret key: {:?}", e)))?;

        let ct_obj = kyber1024::Ciphertext::from_bytes(&ct.0)
            .map_err(|e| CryptoError::Decryption(format!("Invalid ciphertext: {:?}", e)))?;

        let ss = kyber1024::decapsulate(&ct_obj, &sk_obj);

        let ss_bytes = ss.as_bytes();
        let mut shared_secret = [0u8; 32];
        shared_secret.copy_from_slice(&ss_bytes[..32]);

        Ok(SharedSecret(shared_secret))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mlkem_roundtrip() {
        let (pk, sk) = MlKem::keygen();
        let (ct, ss1) = MlKem::encapsulate(&pk).unwrap();
        let ss2 = MlKem::decapsulate(&sk, &ct).unwrap();

        assert_eq!(ss1.0, ss2.0);
    }

    #[test]
    fn test_mlkem_serialization() {
        let (pk, sk) = MlKem::keygen();

        let pk_bytes = pk.as_bytes().to_vec();
        let sk_bytes = sk.as_bytes().to_vec();

        let pk2 = PublicKey::from_bytes(pk_bytes).unwrap();
        let sk2 = SecretKey::from_bytes(sk_bytes).unwrap();

        let (ct, ss1) = MlKem::encapsulate(&pk2).unwrap();
        let ss2 = MlKem::decapsulate(&sk2, &ct).unwrap();

        assert_eq!(ss1.0, ss2.0);
    }
}
