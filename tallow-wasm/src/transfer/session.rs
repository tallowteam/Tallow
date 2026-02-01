//! Encrypted transfer session management
//!
//! Combines hybrid key exchange with streaming encryption

use crate::crypto::{aes_gcm::AesGcmCipher, hybrid, CryptoError};
use wasm_bindgen::prelude::*;
use zeroize::Zeroizing;

/// Transfer session with encryption
#[wasm_bindgen]
pub struct TransferSession {
    cipher: AesGcmCipher,
    session_id: String,
    chunk_count: usize,
    encrypted_count: usize,
}

#[wasm_bindgen]
impl TransferSession {
    /// Create a new transfer session from a session key
    #[wasm_bindgen(constructor)]
    pub fn new(session_key: &[u8], session_id: String) -> Result<TransferSession, JsValue> {
        let cipher = AesGcmCipher::new(session_key)?;

        Ok(TransferSession {
            cipher,
            session_id,
            chunk_count: 0,
            encrypted_count: 0,
        })
    }

    /// Create session from hybrid key exchange (initiator side)
    #[wasm_bindgen]
    pub fn from_hybrid_encapsulate(
        mlkem_public: &[u8],
        x25519_public: &[u8],
        session_id: String,
    ) -> Result<JsValue, JsValue> {
        let result = hybrid::hybrid_encapsulate(mlkem_public, x25519_public, Some(session_id.clone()))?;

        let result_obj = js_sys::Object::from(result);

        let session_key = js_sys::Reflect::get(&result_obj, &"sessionKey".into())
            .unwrap()
            .dyn_into::<js_sys::Uint8Array>()
            .unwrap()
            .to_vec();

        let cipher = AesGcmCipher::new(&session_key)?;

        let session = TransferSession {
            cipher,
            session_id: session_id.clone(),
            chunk_count: 0,
            encrypted_count: 0,
        };

        // Return both session and key exchange material
        let response = js_sys::Object::new();

        js_sys::Reflect::set(
            &response,
            &"session".into(),
            &JsValue::from(session),
        )
        .unwrap();

        js_sys::Reflect::set(
            &response,
            &"mlkemCiphertext".into(),
            &js_sys::Reflect::get(&result_obj, &"mlkemCiphertext".into()).unwrap(),
        )
        .unwrap();

        js_sys::Reflect::set(
            &response,
            &"x25519Public".into(),
            &js_sys::Reflect::get(&result_obj, &"x25519Public".into()).unwrap(),
        )
        .unwrap();

        Ok(response.into())
    }

    /// Create session from hybrid key exchange (responder side)
    #[wasm_bindgen]
    pub fn from_hybrid_decapsulate(
        mlkem_secret: &[u8],
        mlkem_ciphertext: &[u8],
        x25519_secret: &[u8],
        x25519_public: &[u8],
        session_id: String,
    ) -> Result<TransferSession, JsValue> {
        let session_key = hybrid::hybrid_decapsulate(
            mlkem_secret,
            mlkem_ciphertext,
            x25519_secret,
            x25519_public,
            Some(session_id.clone()),
        )?;

        let cipher = AesGcmCipher::new(&session_key)?;

        Ok(TransferSession {
            cipher,
            session_id,
            chunk_count: 0,
            encrypted_count: 0,
        })
    }

    /// Encrypt a file chunk
    ///
    /// Returns encrypted chunk with nonce prepended
    pub fn encrypt_chunk(&mut self, chunk: &[u8]) -> Result<Vec<u8>, JsValue> {
        let encrypted = self.cipher.encrypt(chunk)?;
        self.encrypted_count += 1;
        Ok(encrypted)
    }

    /// Encrypt chunk with metadata as AAD
    pub fn encrypt_chunk_with_metadata(
        &mut self,
        chunk: &[u8],
        chunk_index: usize,
    ) -> Result<Vec<u8>, JsValue> {
        // Create metadata
        let metadata = format!("{}:{}:{}", self.session_id, chunk_index, chunk.len());

        let encrypted = self.cipher.encrypt_with_aad(chunk, metadata.as_bytes())?;
        self.encrypted_count += 1;

        Ok(encrypted)
    }

    /// Decrypt a file chunk
    pub fn decrypt_chunk(&self, encrypted_chunk: &[u8]) -> Result<Vec<u8>, JsValue> {
        self.cipher.decrypt(encrypted_chunk)
    }

    /// Decrypt chunk with metadata verification
    pub fn decrypt_chunk_with_metadata(
        &self,
        encrypted_chunk: &[u8],
        chunk_index: usize,
        expected_length: usize,
    ) -> Result<Vec<u8>, JsValue> {
        let metadata = format!("{}:{}:{}", self.session_id, chunk_index, expected_length);

        let decrypted = self.cipher.decrypt_with_aad(encrypted_chunk, metadata.as_bytes())?;

        // Verify length matches
        if decrypted.len() != expected_length {
            return Err(JsValue::from_str("Chunk length mismatch"));
        }

        Ok(decrypted)
    }

    /// Get session ID
    #[wasm_bindgen(getter)]
    pub fn session_id(&self) -> String {
        self.session_id.clone()
    }

    /// Get number of chunks encrypted
    #[wasm_bindgen(getter)]
    pub fn encrypted_count(&self) -> usize {
        self.encrypted_count
    }

    /// Set total chunk count (for progress tracking)
    pub fn set_chunk_count(&mut self, count: usize) {
        self.chunk_count = count;
    }

    /// Get encryption progress (0.0 - 1.0)
    #[wasm_bindgen(getter)]
    pub fn progress(&self) -> f64 {
        if self.chunk_count == 0 {
            return 0.0;
        }
        (self.encrypted_count as f64) / (self.chunk_count as f64)
    }

    /// Get session statistics
    pub fn stats(&self) -> JsValue {
        let stats = serde_json::json!({
            "sessionId": self.session_id,
            "totalChunks": self.chunk_count,
            "encryptedCount": self.encrypted_count,
            "progress": self.progress(),
            "counter": self.cipher.counter(),
        });

        serde_wasm_bindgen::to_value(&stats).unwrap()
    }
}

/// Encrypt multiple chunks in a session
#[wasm_bindgen]
pub fn encrypt_chunks_batch(
    session_key: &[u8],
    chunks: Vec<js_sys::Uint8Array>,
) -> Result<Vec<js_sys::Uint8Array>, JsValue> {
    let mut cipher = AesGcmCipher::new(session_key)?;
    let mut encrypted_chunks = Vec::new();

    for chunk_js in chunks {
        let chunk = chunk_js.to_vec();
        let encrypted = cipher.encrypt(&chunk)?;
        encrypted_chunks.push(js_sys::Uint8Array::from(&encrypted[..]));
    }

    Ok(encrypted_chunks)
}

/// Decrypt multiple chunks in a session
#[wasm_bindgen]
pub fn decrypt_chunks_batch(
    session_key: &[u8],
    encrypted_chunks: Vec<js_sys::Uint8Array>,
) -> Result<Vec<js_sys::Uint8Array>, JsValue> {
    let cipher = AesGcmCipher::new(session_key)?;
    let mut decrypted_chunks = Vec::new();

    for encrypted_js in encrypted_chunks {
        let encrypted = encrypted_js.to_vec();
        let decrypted = cipher.decrypt(&encrypted)?;
        decrypted_chunks.push(js_sys::Uint8Array::from(&decrypted[..]));
    }

    Ok(decrypted_chunks)
}

/// Create a transfer session with automatic key generation
#[wasm_bindgen]
pub fn create_auto_session(session_id: String) -> Result<JsValue, JsValue> {
    use crate::crypto::aes_gcm::aes_generate_key;

    let session_key = aes_generate_key();
    let session = TransferSession::new(&session_key, session_id)?;

    let response = js_sys::Object::new();

    js_sys::Reflect::set(
        &response,
        &"session".into(),
        &JsValue::from(session),
    )
    .unwrap();

    js_sys::Reflect::set(
        &response,
        &"sessionKey".into(),
        &js_sys::Uint8Array::from(&session_key[..]),
    )
    .unwrap();

    Ok(response.into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::aes_gcm::aes_generate_key;

    #[test]
    fn test_transfer_session() {
        let key = aes_generate_key();
        let mut session = TransferSession::new(&key, "test-session".to_string()).unwrap();

        let chunk = b"test data";
        let encrypted = session.encrypt_chunk(chunk).unwrap();
        let decrypted = session.decrypt_chunk(&encrypted).unwrap();

        assert_eq!(chunk, &decrypted[..]);
        assert_eq!(session.encrypted_count(), 1);
    }

    #[test]
    fn test_session_with_metadata() {
        let key = aes_generate_key();
        let mut session = TransferSession::new(&key, "test-session".to_string()).unwrap();

        let chunk = b"test chunk data";
        let encrypted = session.encrypt_chunk_with_metadata(chunk, 0).unwrap();
        let decrypted = session.decrypt_chunk_with_metadata(&encrypted, 0, chunk.len()).unwrap();

        assert_eq!(chunk, &decrypted[..]);

        // Wrong index should fail
        assert!(session
            .decrypt_chunk_with_metadata(&encrypted, 1, chunk.len())
            .is_err());

        // Wrong length should fail
        assert!(session
            .decrypt_chunk_with_metadata(&encrypted, 0, chunk.len() + 1)
            .is_err());
    }

    #[test]
    fn test_batch_operations() {
        let key = aes_generate_key();

        let chunk1 = vec![1u8; 100];
        let chunk2 = vec![2u8; 100];

        let chunks = vec![
            js_sys::Uint8Array::from(&chunk1[..]),
            js_sys::Uint8Array::from(&chunk2[..]),
        ];

        let encrypted = encrypt_chunks_batch(&key, chunks).unwrap();
        assert_eq!(encrypted.len(), 2);

        let decrypted = decrypt_chunks_batch(&key, encrypted).unwrap();
        assert_eq!(decrypted.len(), 2);

        assert_eq!(decrypted[0].to_vec(), chunk1);
        assert_eq!(decrypted[1].to_vec(), chunk2);
    }

    #[test]
    fn test_session_progress() {
        let key = aes_generate_key();
        let mut session = TransferSession::new(&key, "test".to_string()).unwrap();

        session.set_chunk_count(10);
        assert_eq!(session.progress(), 0.0);

        session.encrypt_chunk(b"test").unwrap();
        assert_eq!(session.progress(), 0.1);

        for _ in 0..9 {
            session.encrypt_chunk(b"test").unwrap();
        }

        assert_eq!(session.progress(), 1.0);
    }
}
