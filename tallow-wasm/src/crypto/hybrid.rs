//! Hybrid ML-KEM + X25519 key exchange
//!
//! Combines post-quantum ML-KEM-768 with classic X25519 for maximum security.
//! If either algorithm is broken, the other provides security.

use hkdf::Hkdf;
use sha2::Sha256;
use wasm_bindgen::prelude::*;
use zeroize::Zeroizing;

use super::{mlkem, x25519, CryptoError, CryptoResult};

/// Hybrid session key derived from both ML-KEM and X25519
#[wasm_bindgen]
pub struct HybridSession {
    session_key: Zeroizing<Vec<u8>>,
    mlkem_public: Vec<u8>,
    x25519_public: Vec<u8>,
}

#[wasm_bindgen]
impl HybridSession {
    /// Get the derived session key (32 bytes)
    #[wasm_bindgen(getter)]
    pub fn session_key(&self) -> Vec<u8> {
        self.session_key.to_vec()
    }

    /// Get ML-KEM public key
    #[wasm_bindgen(getter)]
    pub fn mlkem_public(&self) -> Vec<u8> {
        self.mlkem_public.clone()
    }

    /// Get X25519 public key
    #[wasm_bindgen(getter)]
    pub fn x25519_public(&self) -> Vec<u8> {
        self.x25519_public.clone()
    }
}

/// Generate a hybrid keypair (ML-KEM + X25519)
#[wasm_bindgen]
pub struct HybridKeyPair {
    mlkem_kp: mlkem::MlKemKeyPair,
    x25519_kp: x25519::X25519KeyPair,
}

#[wasm_bindgen]
impl HybridKeyPair {
    /// Get ML-KEM public key
    #[wasm_bindgen(getter)]
    pub fn mlkem_public_key(&self) -> Vec<u8> {
        self.mlkem_kp.public_key()
    }

    /// Get ML-KEM secret key
    #[wasm_bindgen(getter)]
    pub fn mlkem_secret_key(&self) -> Vec<u8> {
        self.mlkem_kp.secret_key()
    }

    /// Get X25519 public key
    #[wasm_bindgen(getter)]
    pub fn x25519_public_key(&self) -> Vec<u8> {
        self.x25519_kp.public_key()
    }

    /// Get X25519 secret key
    #[wasm_bindgen(getter)]
    pub fn x25519_secret_key(&self) -> Vec<u8> {
        self.x25519_kp.secret_key()
    }
}

/// Generate a hybrid keypair
///
/// Creates both ML-KEM-768 and X25519 keypairs for hybrid key exchange
#[wasm_bindgen]
pub fn hybrid_keypair() -> HybridKeyPair {
    let mlkem_kp = mlkem::mlkem_keypair();
    let x25519_kp = x25519::x25519_keypair();

    HybridKeyPair {
        mlkem_kp,
        x25519_kp,
    }
}

/// Initiator: Encapsulate and derive session key
///
/// # Arguments
/// * `mlkem_public` - Responder's ML-KEM public key
/// * `x25519_public` - Responder's X25519 public key
/// * `context` - Optional context string for key derivation
///
/// # Returns
/// Object with:
/// - `sessionKey`: 32-byte derived key
/// - `mlkemCiphertext`: ML-KEM ciphertext to send
/// - `x25519Public`: Our ephemeral X25519 public key to send
#[wasm_bindgen]
pub fn hybrid_encapsulate(
    mlkem_public: &[u8],
    x25519_public: &[u8],
    context: Option<String>,
) -> Result<JsValue, JsValue> {
    // ML-KEM encapsulation
    let mlkem_result = mlkem::mlkem_encapsulate(mlkem_public)?;
    let mlkem_obj = js_sys::Object::from(mlkem_result);

    let mlkem_ciphertext = js_sys::Reflect::get(&mlkem_obj, &"ciphertext".into())
        .unwrap()
        .dyn_into::<js_sys::Uint8Array>()
        .unwrap()
        .to_vec();

    let mlkem_shared = js_sys::Reflect::get(&mlkem_obj, &"sharedSecret".into())
        .unwrap()
        .dyn_into::<js_sys::Uint8Array>()
        .unwrap()
        .to_vec();

    // X25519 key exchange
    let x25519_kp = x25519::x25519_ephemeral_keypair();
    let x25519_shared = x25519::x25519_exchange(&x25519_kp.secret_key(), x25519_public)
        .map_err(|e| CryptoError::EncryptionFailed(format!("{:?}", e)))?;

    // Derive session key using HKDF
    let session_key = derive_hybrid_key(&mlkem_shared, &x25519_shared, context.as_deref())?;

    // Build result object
    let result = js_sys::Object::new();

    js_sys::Reflect::set(
        &result,
        &"sessionKey".into(),
        &js_sys::Uint8Array::from(&session_key[..]),
    )
    .unwrap();

    js_sys::Reflect::set(
        &result,
        &"mlkemCiphertext".into(),
        &js_sys::Uint8Array::from(&mlkem_ciphertext[..]),
    )
    .unwrap();

    js_sys::Reflect::set(
        &result,
        &"x25519Public".into(),
        &js_sys::Uint8Array::from(&x25519_kp.public_key()[..]),
    )
    .unwrap();

    Ok(result.into())
}

/// Responder: Decapsulate and derive session key
///
/// # Arguments
/// * `mlkem_secret` - Our ML-KEM secret key
/// * `mlkem_ciphertext` - Received ML-KEM ciphertext
/// * `x25519_secret` - Our X25519 secret key
/// * `x25519_public` - Received X25519 public key
/// * `context` - Optional context string (must match encapsulate)
///
/// # Returns
/// 32-byte session key
#[wasm_bindgen]
pub fn hybrid_decapsulate(
    mlkem_secret: &[u8],
    mlkem_ciphertext: &[u8],
    x25519_secret: &[u8],
    x25519_public: &[u8],
    context: Option<String>,
) -> Result<Vec<u8>, JsValue> {
    // ML-KEM decapsulation
    let mlkem_shared = mlkem::mlkem_decapsulate(mlkem_secret, mlkem_ciphertext)?;

    // X25519 key exchange
    let x25519_shared = x25519::x25519_exchange(x25519_secret, x25519_public)
        .map_err(|e| CryptoError::DecryptionFailed(format!("{:?}", e)))?;

    // Derive session key using HKDF
    let session_key = derive_hybrid_key(&mlkem_shared, &x25519_shared, context.as_deref())
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(session_key)
}

/// Derive hybrid session key from both shared secrets
///
/// Uses HKDF-SHA256 to combine the ML-KEM and X25519 shared secrets
fn derive_hybrid_key(
    mlkem_shared: &[u8],
    x25519_shared: &[u8],
    context: Option<&str>,
) -> CryptoResult<Vec<u8>> {
    // Concatenate both shared secrets as input key material (IKM)
    let mut ikm = Vec::with_capacity(mlkem_shared.len() + x25519_shared.len());
    ikm.extend_from_slice(mlkem_shared);
    ikm.extend_from_slice(x25519_shared);

    // Use context as salt if provided
    let salt = context.unwrap_or("tallow-hybrid-kex-v1");

    // HKDF extract and expand
    let hkdf = Hkdf::<Sha256>::new(Some(salt.as_bytes()), &ikm);

    let info = b"tallow-session-key";
    let mut okm = [0u8; 32]; // Output key material: 32 bytes

    hkdf.expand(info, &mut okm)
        .map_err(|_| CryptoError::KeyGenerationFailed("HKDF expansion failed".to_string()))?;

    Ok(okm.to_vec())
}

/// Create a hybrid session from a derived key
///
/// Useful when you already have the session key and want to create a session object
#[wasm_bindgen]
pub fn hybrid_session_from_key(
    session_key: &[u8],
    mlkem_public: &[u8],
    x25519_public: &[u8],
) -> Result<HybridSession, JsValue> {
    if session_key.len() != 32 {
        return Err(CryptoError::InvalidKeyLength {
            expected: 32,
            got: session_key.len(),
        }
        .into());
    }

    Ok(HybridSession {
        session_key: Zeroizing::new(session_key.to_vec()),
        mlkem_public: mlkem_public.to_vec(),
        x25519_public: x25519_public.to_vec(),
    })
}

/// Get hybrid key exchange constants
#[wasm_bindgen]
pub fn hybrid_constants() -> JsValue {
    let constants = serde_json::json!({
        "sessionKeyBytes": 32,
        "mlkem": {
            "publicKeyBytes": 1184,
            "secretKeyBytes": 2400,
            "ciphertextBytes": 1088,
            "sharedSecretBytes": 32,
        },
        "x25519": {
            "publicKeyBytes": 32,
            "secretKeyBytes": 32,
            "sharedSecretBytes": 32,
        },
    });

    serde_wasm_bindgen::to_value(&constants).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hybrid_keypair() {
        let kp = hybrid_keypair();
        assert_eq!(kp.mlkem_public_key().len(), 1184);
        assert_eq!(kp.x25519_public_key().len(), 32);
    }

    #[test]
    fn test_hybrid_exchange() {
        // Responder generates keypair
        let responder = hybrid_keypair();

        // Initiator encapsulates
        let encap_result = hybrid_encapsulate(
            &responder.mlkem_public_key(),
            &responder.x25519_public_key(),
            Some("test-context".to_string()),
        )
        .unwrap();

        let encap_obj = js_sys::Object::from(encap_result);

        let session_key_1 = js_sys::Reflect::get(&encap_obj, &"sessionKey".into())
            .unwrap()
            .dyn_into::<js_sys::Uint8Array>()
            .unwrap()
            .to_vec();

        let mlkem_ct = js_sys::Reflect::get(&encap_obj, &"mlkemCiphertext".into())
            .unwrap()
            .dyn_into::<js_sys::Uint8Array>()
            .unwrap()
            .to_vec();

        let x25519_pub = js_sys::Reflect::get(&encap_obj, &"x25519Public".into())
            .unwrap()
            .dyn_into::<js_sys::Uint8Array>()
            .unwrap()
            .to_vec();

        // Responder decapsulates
        let session_key_2 = hybrid_decapsulate(
            &responder.mlkem_secret_key(),
            &mlkem_ct,
            &responder.x25519_secret_key(),
            &x25519_pub,
            Some("test-context".to_string()),
        )
        .unwrap();

        // Both should derive the same session key
        assert_eq!(session_key_1, session_key_2);
        assert_eq!(session_key_1.len(), 32);
    }

    #[test]
    fn test_derive_hybrid_key() {
        let mlkem_shared = vec![0u8; 32];
        let x25519_shared = vec![1u8; 32];

        let key1 = derive_hybrid_key(&mlkem_shared, &x25519_shared, Some("context")).unwrap();
        let key2 = derive_hybrid_key(&mlkem_shared, &x25519_shared, Some("context")).unwrap();

        // Same inputs should produce same key
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);

        // Different context should produce different key
        let key3 = derive_hybrid_key(&mlkem_shared, &x25519_shared, Some("other")).unwrap();
        assert_ne!(key1, key3);
    }
}
