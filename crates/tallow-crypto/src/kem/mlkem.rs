//! ML-KEM-1024 (FIPS 203) key encapsulation mechanism

use crate::error::{CryptoError, Result};
use fips203::ml_kem_1024;
use fips203::traits::{Decaps, Encaps, KeyGen, SerDes};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

/// ML-KEM-1024 encapsulation key (public key) byte length
pub const EK_LEN: usize = 1568;

/// ML-KEM-1024 decapsulation key (secret key) byte length
pub const DK_LEN: usize = 3168;

/// ML-KEM-1024 ciphertext byte length
pub const CT_LEN: usize = 1568;

/// ML-KEM-1024 shared secret byte length
pub const SS_LEN: usize = 32;

/// ML-KEM-1024 public key (encapsulation key)
#[derive(Clone, Serialize, Deserialize)]
pub struct PublicKey(Vec<u8>);

/// ML-KEM-1024 secret key (decapsulation key)
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
        if bytes.len() != EK_LEN {
            return Err(CryptoError::InvalidKey(format!(
                "Invalid ML-KEM-1024 public key length: expected {}, got {}",
                EK_LEN,
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
        if bytes.len() != DK_LEN {
            return Err(CryptoError::InvalidKey(format!(
                "Invalid ML-KEM-1024 secret key length: expected {}, got {}",
                DK_LEN,
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
        if bytes.len() != CT_LEN {
            return Err(CryptoError::InvalidKey(format!(
                "Invalid ML-KEM-1024 ciphertext length: expected {}, got {}",
                CT_LEN,
                bytes.len()
            )));
        }
        Ok(Self(bytes))
    }
}

/// ML-KEM-1024 operations (FIPS 203)
pub struct MlKem;

impl MlKem {
    /// Generate a new ML-KEM-1024 keypair
    ///
    /// # Returns
    ///
    /// A tuple of (public_key, secret_key), or an error if the system RNG fails
    pub fn keygen() -> Result<(PublicKey, SecretKey)> {
        let (ek, dk) = ml_kem_1024::KG::try_keygen()
            .map_err(|_| CryptoError::KeyGeneration("ML-KEM-1024 keygen failed: OS RNG unavailable".to_string()))?;

        let ek_bytes = ek.into_bytes().to_vec();
        let dk_bytes = dk.into_bytes().to_vec();

        Ok((PublicKey(ek_bytes), SecretKey(dk_bytes)))
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
        let ek_bytes: [u8; EK_LEN] = pk.0.as_slice().try_into().map_err(|_| {
            CryptoError::InvalidKey("Invalid encapsulation key length".to_string())
        })?;

        let ek = ml_kem_1024::EncapsKey::try_from_bytes(ek_bytes)
            .map_err(|_| CryptoError::Encryption("Invalid ML-KEM-1024 public key".to_string()))?;

        let (ss, ct) = ek.try_encaps().map_err(|_| {
            CryptoError::Encryption("ML-KEM-1024 encapsulation failed".to_string())
        })?;

        let ss_bytes = ss.into_bytes();
        let ct_bytes = ct.into_bytes().to_vec();

        Ok((Ciphertext(ct_bytes), SharedSecret(ss_bytes)))
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
        let dk_bytes: [u8; DK_LEN] = sk.0.as_slice().try_into().map_err(|_| {
            CryptoError::InvalidKey("Invalid decapsulation key length".to_string())
        })?;

        let dk = ml_kem_1024::DecapsKey::try_from_bytes(dk_bytes)
            .map_err(|_| CryptoError::Decryption("Invalid ML-KEM-1024 secret key".to_string()))?;

        let ct_bytes: [u8; CT_LEN] = ct.0.as_slice().try_into().map_err(|_| {
            CryptoError::InvalidKey("Invalid ciphertext length".to_string())
        })?;

        let ct_obj = ml_kem_1024::CipherText::try_from_bytes(ct_bytes)
            .map_err(|_| CryptoError::Decryption("Invalid ML-KEM-1024 ciphertext".to_string()))?;

        let ss = dk.try_decaps(&ct_obj).map_err(|_| {
            CryptoError::Decryption("ML-KEM-1024 decapsulation failed".to_string())
        })?;

        Ok(SharedSecret(ss.into_bytes()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mlkem_roundtrip() {
        let (pk, sk) = MlKem::keygen().unwrap();
        let (ct, ss1) = MlKem::encapsulate(&pk).unwrap();
        let ss2 = MlKem::decapsulate(&sk, &ct).unwrap();

        assert_eq!(ss1.0, ss2.0);
    }

    #[test]
    fn test_mlkem_serialization() {
        let (pk, sk) = MlKem::keygen().unwrap();

        let pk_bytes = pk.as_bytes().to_vec();
        let sk_bytes = sk.as_bytes().to_vec();

        let pk2 = PublicKey::from_bytes(pk_bytes).unwrap();
        let sk2 = SecretKey::from_bytes(sk_bytes).unwrap();

        let (ct, ss1) = MlKem::encapsulate(&pk2).unwrap();
        let ss2 = MlKem::decapsulate(&sk2, &ct).unwrap();

        assert_eq!(ss1.0, ss2.0);
    }

    #[test]
    fn test_mlkem_key_sizes() {
        let (pk, sk) = MlKem::keygen().unwrap();
        assert_eq!(pk.as_bytes().len(), EK_LEN);
        assert_eq!(sk.as_bytes().len(), DK_LEN);
    }

    #[test]
    fn test_mlkem_invalid_key_length() {
        assert!(PublicKey::from_bytes(vec![0u8; 32]).is_err());
        assert!(SecretKey::from_bytes(vec![0u8; 32]).is_err());
        assert!(Ciphertext::from_bytes(vec![0u8; 32]).is_err());
    }
}
