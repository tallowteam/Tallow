//! Wasm-bindgen wrappers for tallow-crypto operations
//!
//! Exposes hybrid KEM, AES-256-GCM, BLAKE3, and HKDF to JavaScript.
//! All functions call the same Rust code as the CLI binary -- identical
//! cryptographic code paths ensure browser and native produce matching output.

use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Hybrid KEM (ML-KEM-1024 + X25519)
// ---------------------------------------------------------------------------

/// Hybrid post-quantum keypair (ML-KEM-1024 + X25519).
///
/// Generate with `WasmKeyPair::generate()`, then use `encapsulate()` and
/// `decapsulate()` for key exchange with a peer.
#[wasm_bindgen]
pub struct WasmKeyPair {
    public: tallow_crypto::kem::hybrid::PublicKey,
    secret: tallow_crypto::kem::hybrid::SecretKey,
}

#[wasm_bindgen]
impl WasmKeyPair {
    /// Generate a new ephemeral hybrid ML-KEM-1024 + X25519 keypair.
    #[wasm_bindgen]
    pub fn generate() -> Result<WasmKeyPair, JsValue> {
        let (public, secret) = tallow_crypto::kem::HybridKem::keygen()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(WasmKeyPair { public, secret })
    }

    /// Serialized public key bytes (bincode-encoded hybrid PublicKey).
    ///
    /// Send these to the peer so they can encapsulate a shared secret to you.
    #[wasm_bindgen(js_name = "publicKeyBytes")]
    pub fn public_key_bytes(&self) -> Result<Vec<u8>, JsValue> {
        bincode::serialize(&self.public)
            .map_err(|e| JsValue::from_str(&format!("serialize public key: {}", e)))
    }

    /// Decapsulate a shared secret from a hybrid ciphertext.
    ///
    /// `ciphertext` must be the bincode-encoded `Ciphertext` from the peer's
    /// `encapsulate()` call.
    ///
    /// Returns the 32-byte shared secret.
    #[wasm_bindgen]
    pub fn decapsulate(&self, ciphertext: &[u8]) -> Result<Vec<u8>, JsValue> {
        let ct: tallow_crypto::kem::hybrid::Ciphertext = bincode::deserialize(ciphertext)
            .map_err(|e| JsValue::from_str(&format!("deserialize ciphertext: {}", e)))?;
        let ss = tallow_crypto::kem::HybridKem::decapsulate(&self.secret, &ct)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(ss.expose_secret().to_vec())
    }
}

/// Result of a KEM encapsulation: ciphertext + shared secret.
#[wasm_bindgen]
pub struct WasmEncapsulated {
    ct_bytes: Vec<u8>,
    ss_bytes: Vec<u8>,
}

#[wasm_bindgen]
impl WasmEncapsulated {
    /// The ciphertext to send to the keypair owner for decapsulation.
    #[wasm_bindgen]
    pub fn ciphertext(&self) -> Vec<u8> {
        self.ct_bytes.clone()
    }

    /// The 32-byte shared secret (identical to what decapsulate returns).
    #[wasm_bindgen(js_name = "sharedSecret")]
    pub fn shared_secret(&self) -> Vec<u8> {
        self.ss_bytes.clone()
    }
}

/// Encapsulate a shared secret to a peer's hybrid public key.
///
/// `public_key` must be bincode-encoded bytes from `WasmKeyPair::publicKeyBytes()`.
///
/// Returns a `WasmEncapsulated` containing the ciphertext (send to peer)
/// and the shared secret (keep locally).
#[wasm_bindgen(js_name = "kemEncapsulate")]
pub fn kem_encapsulate(public_key: &[u8]) -> Result<WasmEncapsulated, JsValue> {
    let pk: tallow_crypto::kem::hybrid::PublicKey = bincode::deserialize(public_key)
        .map_err(|e| JsValue::from_str(&format!("deserialize public key: {}", e)))?;
    let (ct, ss) = tallow_crypto::kem::HybridKem::encapsulate(&pk)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let ct_bytes = bincode::serialize(&ct)
        .map_err(|e| JsValue::from_str(&format!("serialize ciphertext: {}", e)))?;
    Ok(WasmEncapsulated {
        ct_bytes,
        ss_bytes: ss.expose_secret().to_vec(),
    })
}

// ---------------------------------------------------------------------------
// AES-256-GCM Symmetric Encryption
// ---------------------------------------------------------------------------

/// Encrypt a data chunk with AES-256-GCM.
///
/// Builds a 12-byte counter-based nonce from `nonce_counter`:
/// `[0u8; 4] || counter.to_be_bytes()`.
///
/// Returns ciphertext with appended authentication tag.
#[wasm_bindgen(js_name = "encryptChunk")]
pub fn encrypt_chunk(
    key: &[u8],
    nonce_counter: u64,
    aad: &[u8],
    plaintext: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let key: &[u8; 32] = key
        .try_into()
        .map_err(|_| JsValue::from_str("key must be exactly 32 bytes"))?;

    let mut nonce = [0u8; 12];
    nonce[4..12].copy_from_slice(&nonce_counter.to_be_bytes());

    tallow_crypto::symmetric::aes_encrypt(key, &nonce, plaintext, aad)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Decrypt a data chunk with AES-256-GCM.
///
/// Uses the same counter-based nonce as `encryptChunk`.
///
/// Returns plaintext if authentication succeeds.
#[wasm_bindgen(js_name = "decryptChunk")]
pub fn decrypt_chunk(
    key: &[u8],
    nonce_counter: u64,
    aad: &[u8],
    ciphertext: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let key: &[u8; 32] = key
        .try_into()
        .map_err(|_| JsValue::from_str("key must be exactly 32 bytes"))?;

    let mut nonce = [0u8; 12];
    nonce[4..12].copy_from_slice(&nonce_counter.to_be_bytes());

    tallow_crypto::symmetric::aes_decrypt(key, &nonce, ciphertext, aad)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// ---------------------------------------------------------------------------
// BLAKE3 Hashing
// ---------------------------------------------------------------------------

/// Compute a 32-byte BLAKE3 hash of the input data.
#[wasm_bindgen(js_name = "blake3Hash")]
pub fn blake3_hash(data: &[u8]) -> Vec<u8> {
    tallow_crypto::hash::blake3::hash(data).to_vec()
}

/// Derive a room ID from a code phrase using BLAKE3.
///
/// This MUST produce the same output as the CLI's `derive_room_id` so that
/// browser and native clients join the same relay room.
#[wasm_bindgen(js_name = "blake3DeriveRoomId")]
pub fn blake3_derive_room_id(code_phrase: &str) -> Vec<u8> {
    // Matches tallow_protocol::room::code::derive_room_id exactly:
    //   blake3::hash(code_phrase.as_bytes()).into()
    tallow_crypto::hash::blake3::hash(code_phrase.as_bytes()).to_vec()
}

// ---------------------------------------------------------------------------
// HKDF-SHA256 Key Derivation
// ---------------------------------------------------------------------------

/// Derive key material using HKDF-SHA256.
///
/// * `ikm`        - Input key material
/// * `salt`       - Salt value (can be empty)
/// * `info`       - Application-specific context
/// * `output_len` - Desired output length in bytes
#[wasm_bindgen(js_name = "hkdfDerive")]
pub fn hkdf_derive(
    ikm: &[u8],
    salt: &[u8],
    info: &[u8],
    output_len: u32,
) -> Result<Vec<u8>, JsValue> {
    tallow_crypto::kdf::hkdf::derive(salt, ikm, info, output_len as usize)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// ---------------------------------------------------------------------------
// Chat Message Encryption
// ---------------------------------------------------------------------------

/// Encrypt a chat message with AES-256-GCM.
///
/// Uses nonce format `[0u8; 4] || counter.to_be_bytes()` and
/// AAD `b"tallow-chat-v1"`. Counter should increment by 2 between calls
/// (even for sender, odd for receiver) to prevent nonce collision.
///
/// Returns ciphertext with authentication tag.
#[wasm_bindgen(js_name = "encryptChatMessage")]
pub fn encrypt_chat_message(
    key: &[u8],
    counter: u64,
    plaintext: &str,
) -> Result<Vec<u8>, JsValue> {
    let key: &[u8; 32] = key
        .try_into()
        .map_err(|_| JsValue::from_str("key must be exactly 32 bytes"))?;

    let mut nonce = [0u8; 12];
    nonce[4..12].copy_from_slice(&counter.to_be_bytes());

    let aad = b"tallow-chat-v1";

    tallow_crypto::symmetric::aes_encrypt(key, &nonce, plaintext.as_bytes(), aad)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Decrypt a chat message with AES-256-GCM.
///
/// Uses the same nonce and AAD format as `encryptChatMessage`.
///
/// Returns the decrypted UTF-8 string.
#[wasm_bindgen(js_name = "decryptChatMessage")]
pub fn decrypt_chat_message(
    key: &[u8],
    counter: u64,
    ciphertext: &[u8],
) -> Result<String, JsValue> {
    let key: &[u8; 32] = key
        .try_into()
        .map_err(|_| JsValue::from_str("key must be exactly 32 bytes"))?;

    let mut nonce = [0u8; 12];
    nonce[4..12].copy_from_slice(&counter.to_be_bytes());

    let aad = b"tallow-chat-v1";

    let plaintext = tallow_crypto::symmetric::aes_decrypt(key, &nonce, ciphertext, aad)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    String::from_utf8(plaintext)
        .map_err(|e| JsValue::from_str(&format!("invalid UTF-8 in decrypted message: {}", e)))
}
