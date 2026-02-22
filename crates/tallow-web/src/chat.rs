//! Wasm-bindgen chat session with stateful counter management
//!
//! Provides a `ChatSession` struct that manages encryption/decryption
//! with proper nonce counter tracking. Uses the same nonce construction
//! as the CLI: `[0u8; 4] || counter.to_be_bytes()`, AAD `b"tallow-chat-v1"`,
//! counter increments by 2 (even for sender, odd for receiver).

use wasm_bindgen::prelude::*;
use zeroize::Zeroize;

/// Domain separation AAD for chat messages (must match CLI exactly)
const CHAT_AAD: &[u8] = b"tallow-chat-v1";

/// Maximum chat message size (64 KB, matching CLI)
const MAX_CHAT_MESSAGE_SIZE: usize = 64 * 1024;

/// Stateful chat session managing encryption counters.
///
/// The session tracks separate send and receive counters.
/// Send counter starts at 0 (even), receive counter starts at 1 (odd).
/// Both increment by 2 after each use, preventing nonce collision.
#[wasm_bindgen]
pub struct ChatSession {
    /// 32-byte AES-256-GCM session key
    session_key: [u8; 32],
    /// Next nonce counter for outgoing messages (even: 0, 2, 4, ...)
    send_counter: u64,
    /// Next nonce counter for incoming messages (odd: 1, 3, 5, ...)
    recv_counter: u64,
}

#[wasm_bindgen]
impl ChatSession {
    /// Create a new chat session with the given 32-byte session key.
    ///
    /// Send counter starts at 0 (even), receive counter at 1 (odd).
    #[wasm_bindgen(constructor)]
    pub fn new(session_key: &[u8]) -> Result<ChatSession, JsValue> {
        let key: [u8; 32] = session_key
            .try_into()
            .map_err(|_| JsValue::from_str("session key must be exactly 32 bytes"))?;

        Ok(ChatSession {
            session_key: key,
            send_counter: 0,
            recv_counter: 1,
        })
    }

    /// Encrypt a chat message text.
    ///
    /// Uses nonce `[0u8; 4] || send_counter.to_be_bytes()` and AAD
    /// `b"tallow-chat-v1"`. Increments send counter by 2 after encryption.
    ///
    /// Returns the AES-256-GCM ciphertext with appended authentication tag.
    #[wasm_bindgen(js_name = "encryptMessage")]
    pub fn encrypt_message(&mut self, text: &str) -> Result<Vec<u8>, JsValue> {
        if text.len() > MAX_CHAT_MESSAGE_SIZE {
            return Err(JsValue::from_str(&format!(
                "message too large ({} bytes, max {})",
                text.len(),
                MAX_CHAT_MESSAGE_SIZE
            )));
        }

        let nonce = build_nonce(self.send_counter);

        let ciphertext = tallow_crypto::symmetric::aes_encrypt(
            &self.session_key,
            &nonce,
            text.as_bytes(),
            CHAT_AAD,
        )
        .map_err(|e| JsValue::from_str(&format!("chat encrypt failed: {}", e)))?;

        self.send_counter = self
            .send_counter
            .checked_add(2)
            .ok_or_else(|| JsValue::from_str("send counter overflow — session must be rotated"))?;

        Ok(ciphertext)
    }

    /// Decrypt a received chat message.
    ///
    /// The nonce is reconstructed from the receive counter:
    /// `[0u8; 4] || recv_counter.to_be_bytes()`. Increments receive counter
    /// by 2 after decryption.
    ///
    /// Returns the decrypted UTF-8 plaintext.
    #[wasm_bindgen(js_name = "decryptMessage")]
    pub fn decrypt_message(&mut self, ciphertext: &[u8]) -> Result<String, JsValue> {
        let nonce = build_nonce(self.recv_counter);

        let plaintext_bytes = tallow_crypto::symmetric::aes_decrypt(
            &self.session_key,
            &nonce,
            ciphertext,
            CHAT_AAD,
        )
        .map_err(|e| JsValue::from_str(&format!("chat decrypt failed: {}", e)))?;

        self.recv_counter = self
            .recv_counter
            .checked_add(2)
            .ok_or_else(|| JsValue::from_str("recv counter overflow — session must be rotated"))?;

        let text = String::from_utf8(plaintext_bytes)
            .map_err(|e| JsValue::from_str(&format!("invalid UTF-8 in decrypted message: {}", e)))?;

        // Sanitize peer-sourced text before returning to JS (defense-in-depth)
        Ok(tallow_protocol::transfer::sanitize::sanitize_display(&text))
    }

    /// Decrypt a chat message using an explicit nonce (for interop with CLI
    /// messages that carry their nonce in the ChatText message).
    ///
    /// Does NOT auto-increment the receive counter. Use this when the nonce
    /// is provided by the wire message.
    #[wasm_bindgen(js_name = "decryptMessageWithNonce")]
    pub fn decrypt_message_with_nonce(
        &self,
        ciphertext: &[u8],
        nonce: &[u8],
    ) -> Result<String, JsValue> {
        let nonce_arr: [u8; 12] = nonce
            .try_into()
            .map_err(|_| JsValue::from_str("nonce must be exactly 12 bytes"))?;

        let plaintext_bytes = tallow_crypto::symmetric::aes_decrypt(
            &self.session_key,
            &nonce_arr,
            ciphertext,
            CHAT_AAD,
        )
        .map_err(|e| JsValue::from_str(&format!("chat decrypt failed: {}", e)))?;

        let text = String::from_utf8(plaintext_bytes)
            .map_err(|e| JsValue::from_str(&format!("invalid UTF-8 in decrypted message: {}", e)))?;

        // Sanitize peer-sourced text before returning to JS (defense-in-depth)
        Ok(tallow_protocol::transfer::sanitize::sanitize_display(&text))
    }

    /// Encode a ChatText wire message from encrypted data.
    ///
    /// * `message_id` - 16-byte unique message ID
    /// * `sequence`   - Monotonic sequence number
    /// * `ciphertext` - AES-256-GCM encrypted chat text
    /// * `nonce`      - 12-byte nonce used for encryption
    #[wasm_bindgen(js_name = "prepareChatText")]
    pub fn prepare_chat_text(
        &self,
        message_id: &[u8],
        sequence: u64,
        ciphertext: &[u8],
        nonce: &[u8],
    ) -> Result<Vec<u8>, JsValue> {
        // Delegate to codec's encodeChatText
        crate::codec::encode_chat_text(message_id, sequence, ciphertext, nonce)
    }

    /// Encode a TypingIndicator wire message.
    #[wasm_bindgen(js_name = "prepareTypingIndicator")]
    pub fn prepare_typing_indicator(&self, typing: bool) -> Result<Vec<u8>, JsValue> {
        crate::codec::encode_typing_indicator(typing)
    }

    /// Get the current send counter value.
    #[wasm_bindgen(js_name = "sendCounter")]
    pub fn send_counter(&self) -> u64 {
        self.send_counter
    }

    /// Get the current receive counter value.
    #[wasm_bindgen(js_name = "receiveCounter")]
    pub fn receive_counter(&self) -> u64 {
        self.recv_counter
    }

    /// Build a 12-byte nonce from the current send counter.
    ///
    /// Useful for building the nonce to include in a ChatText message.
    #[wasm_bindgen(js_name = "currentSendNonce")]
    pub fn current_send_nonce(&self) -> Vec<u8> {
        build_nonce(self.send_counter).to_vec()
    }
}

/// Zeroize session key on drop to prevent key material from lingering in memory.
impl Drop for ChatSession {
    fn drop(&mut self) {
        self.session_key.zeroize();
    }
}

/// Build a 12-byte AES-GCM nonce from a counter value.
///
/// Format: `[0u8; 4] || counter.to_be_bytes()`
/// This MUST match the CLI implementation exactly.
fn build_nonce(counter: u64) -> [u8; 12] {
    let mut nonce = [0u8; 12];
    nonce[4..12].copy_from_slice(&counter.to_be_bytes());
    nonce
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_key() -> [u8; 32] {
        [42u8; 32]
    }

    #[test]
    fn test_nonce_construction() {
        let nonce = build_nonce(0);
        assert_eq!(&nonce, &[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        let nonce = build_nonce(1);
        assert_eq!(&nonce, &[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

        let nonce = build_nonce(256);
        assert_eq!(&nonce, &[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = test_key();
        // Simulate sender (even counter) and receiver (odd counter)
        // Sender encrypts with counter 0, receiver decrypts with explicit nonce
        let nonce = build_nonce(0);
        let ciphertext = tallow_crypto::symmetric::aes_encrypt(
            &key,
            &nonce,
            b"hello world",
            CHAT_AAD,
        )
        .unwrap();

        let plaintext = tallow_crypto::symmetric::aes_decrypt(
            &key,
            &nonce,
            &ciphertext,
            CHAT_AAD,
        )
        .unwrap();

        assert_eq!(&plaintext, b"hello world");
    }

    #[test]
    fn test_counter_increments() {
        let key = test_key();
        let mut session = ChatSession {
            session_key: key,
            send_counter: 0,
            recv_counter: 1,
        };

        assert_eq!(session.send_counter(), 0);
        session.encrypt_message("hello").unwrap();
        assert_eq!(session.send_counter(), 2);
        session.encrypt_message("world").unwrap();
        assert_eq!(session.send_counter(), 4);
    }

    #[test]
    fn test_message_too_large() {
        let key = test_key();
        let mut session = ChatSession {
            session_key: key,
            send_counter: 0,
            recv_counter: 1,
        };

        let big = "x".repeat(MAX_CHAT_MESSAGE_SIZE + 1);
        let result = session.encrypt_message(&big);
        assert!(result.is_err());
    }
}
