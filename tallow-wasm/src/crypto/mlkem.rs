//! ML-KEM-768 (Kyber768) post-quantum key encapsulation mechanism
//!
//! Performance target: <10ms for key generation

use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext, PublicKey, SecretKey, SharedSecret};
use wasm_bindgen::prelude::*;
use zeroize::Zeroizing;

use super::{CryptoError, CryptoResult};

/// ML-KEM-768 key pair
#[wasm_bindgen]
pub struct MlKemKeyPair {
    public_key: Vec<u8>,
    secret_key: Zeroizing<Vec<u8>>,
}

#[wasm_bindgen]
impl MlKemKeyPair {
    /// Get the public key
    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> Vec<u8> {
        self.public_key.clone()
    }

    /// Get the secret key
    #[wasm_bindgen(getter)]
    pub fn secret_key(&self) -> Vec<u8> {
        self.secret_key.to_vec()
    }
}

/// Generate an ML-KEM-768 keypair
///
/// Returns a keypair with:
/// - Public key: 1184 bytes
/// - Secret key: 2400 bytes
///
/// # Performance
/// Target: <10ms
#[wasm_bindgen]
pub fn mlkem_keypair() -> MlKemKeyPair {
    let (pk, sk) = kyber768::keypair();

    MlKemKeyPair {
        public_key: pk.as_bytes().to_vec(),
        secret_key: Zeroizing::new(sk.as_bytes().to_vec()),
    }
}

/// Encapsulate a shared secret using a public key
///
/// Returns an object with:
/// - ciphertext: 1088 bytes
/// - shared_secret: 32 bytes
///
/// # Performance
/// Target: <5ms
#[wasm_bindgen]
pub fn mlkem_encapsulate(public_key: &[u8]) -> Result<JsValue, JsValue> {
    // Validate public key length
    if public_key.len() != kyber768::public_key_bytes() {
        return Err(CryptoError::InvalidKeyLength {
            expected: kyber768::public_key_bytes(),
            got: public_key.len(),
        }
        .into());
    }

    // Parse public key
    let pk = kyber768::PublicKey::from_bytes(public_key)
        .map_err(|_| CryptoError::InvalidInput("Invalid public key".to_string()))?;

    // Encapsulate
    let (ss, ct) = kyber768::encapsulate(&pk);

    // Return as JS object
    let result = js_sys::Object::new();

    js_sys::Reflect::set(
        &result,
        &"ciphertext".into(),
        &js_sys::Uint8Array::from(ct.as_bytes()),
    )
    .unwrap();

    js_sys::Reflect::set(
        &result,
        &"sharedSecret".into(),
        &js_sys::Uint8Array::from(ss.as_bytes()),
    )
    .unwrap();

    Ok(result.into())
}

/// Decapsulate a shared secret using a secret key and ciphertext
///
/// Returns the shared secret (32 bytes)
///
/// # Performance
/// Target: <5ms
#[wasm_bindgen]
pub fn mlkem_decapsulate(secret_key: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>, JsValue> {
    // Validate lengths
    if secret_key.len() != kyber768::secret_key_bytes() {
        return Err(CryptoError::InvalidKeyLength {
            expected: kyber768::secret_key_bytes(),
            got: secret_key.len(),
        }
        .into());
    }

    if ciphertext.len() != kyber768::ciphertext_bytes() {
        return Err(CryptoError::InvalidInput(format!(
            "Invalid ciphertext length: expected {}, got {}",
            kyber768::ciphertext_bytes(),
            ciphertext.len()
        ))
        .into());
    }

    // Parse secret key and ciphertext
    let sk = kyber768::SecretKey::from_bytes(secret_key)
        .map_err(|_| CryptoError::InvalidInput("Invalid secret key".to_string()))?;

    let ct = kyber768::Ciphertext::from_bytes(ciphertext)
        .map_err(|_| CryptoError::InvalidInput("Invalid ciphertext".to_string()))?;

    // Decapsulate
    let ss = kyber768::decapsulate(&ct, &sk);

    Ok(ss.as_bytes().to_vec())
}

/// Get ML-KEM-768 constants
#[wasm_bindgen]
pub fn mlkem_constants() -> JsValue {
    let constants = serde_json::json!({
        "publicKeyBytes": kyber768::public_key_bytes(),
        "secretKeyBytes": kyber768::secret_key_bytes(),
        "ciphertextBytes": kyber768::ciphertext_bytes(),
        "sharedSecretBytes": kyber768::shared_secret_bytes(),
    });

    serde_wasm_bindgen::to_value(&constants).unwrap()
}

/// Rust-only helper to generate shared secret between two parties
pub(crate) fn mlkem_exchange() -> CryptoResult<(Vec<u8>, Vec<u8>, Vec<u8>)> {
    // Alice generates keypair
    let (pk_alice, sk_alice) = kyber768::keypair();

    // Bob encapsulates with Alice's public key
    let (ss_bob, ct) = kyber768::encapsulate(&pk_alice);

    // Alice decapsulates Bob's ciphertext
    let ss_alice = kyber768::decapsulate(&ct, &sk_alice);

    // Verify shared secrets match
    if ss_alice.as_bytes() != ss_bob.as_bytes() {
        return Err(CryptoError::EncryptionFailed(
            "Shared secrets do not match".to_string(),
        ));
    }

    Ok((
        pk_alice.as_bytes().to_vec(),
        ct.as_bytes().to_vec(),
        ss_alice.as_bytes().to_vec(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mlkem_keypair() {
        let kp = mlkem_keypair();
        assert_eq!(kp.public_key().len(), kyber768::public_key_bytes());
        assert_eq!(kp.secret_key().len(), kyber768::secret_key_bytes());
    }

    #[test]
    fn test_mlkem_encap_decap() {
        let kp = mlkem_keypair();
        let encap_result = mlkem_encapsulate(&kp.public_key()).unwrap();

        let obj = js_sys::Object::from(encap_result);
        let ct = js_sys::Reflect::get(&obj, &"ciphertext".into())
            .unwrap()
            .dyn_into::<js_sys::Uint8Array>()
            .unwrap()
            .to_vec();

        let ss1 = js_sys::Reflect::get(&obj, &"sharedSecret".into())
            .unwrap()
            .dyn_into::<js_sys::Uint8Array>()
            .unwrap()
            .to_vec();

        let ss2 = mlkem_decapsulate(&kp.secret_key(), &ct).unwrap();

        assert_eq!(ss1, ss2);
    }

    #[test]
    fn test_mlkem_exchange() {
        let result = mlkem_exchange();
        assert!(result.is_ok());

        let (pk, ct, ss) = result.unwrap();
        assert_eq!(pk.len(), kyber768::public_key_bytes());
        assert_eq!(ct.len(), kyber768::ciphertext_bytes());
        assert_eq!(ss.len(), kyber768::shared_secret_bytes());
    }
}
