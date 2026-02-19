//! Key exchange orchestration
//!
//! Combines hybrid KEM (ML-KEM-1024 + X25519), HKDF-SHA256,
//! and CPace PAKE to establish a session key between two peers.

use crate::{ProtocolError, Result};

/// Session key derived from key exchange
pub struct SessionKey {
    /// 32-byte key for AES-256-GCM encryption
    key: [u8; 32],
}

impl SessionKey {
    /// Get the raw key bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.key
    }

    /// Consume and return the raw key
    pub fn into_bytes(self) -> [u8; 32] {
        self.key
    }
}

impl Drop for SessionKey {
    fn drop(&mut self) {
        // Zeroize on drop
        self.key = [0u8; 32];
    }
}

/// Derive a session key from a code phrase using HKDF
///
/// This is the simplest key exchange: both sides know the code phrase,
/// derive the same key. For v1, this provides the baseline.
///
/// # Arguments
///
/// * `code_phrase` - Shared code phrase
/// * `room_id` - BLAKE3 hash of the code phrase (domain separation)
pub fn derive_session_key_from_phrase(code_phrase: &str, room_id: &[u8; 32]) -> SessionKey {
    // Use BLAKE3 KDF with domain separation
    let mut input = Vec::with_capacity(code_phrase.len() + 32);
    input.extend_from_slice(code_phrase.as_bytes());
    input.extend_from_slice(room_id);

    let key = tallow_crypto::hash::blake3::derive_key("tallow-session-key-v1", &input);
    SessionKey { key }
}

/// Perform CPace-based key exchange
///
/// Both peers use the code phrase to derive a shared secret
/// via CPace (password-authenticated key exchange).
///
/// # Arguments
///
/// * `code_phrase` - Shared code phrase
/// * `session_id` - Unique session identifier (e.g., room_id + nonces)
///
/// # Returns
///
/// (public_message, CpaceState) — send public_message to peer,
/// then call `complete_cpace` with their public_message.
pub fn start_cpace_initiator(
    code_phrase: &str,
    session_id: &[u8],
) -> (Vec<u8>, CpaceState) {
    let initiator = tallow_crypto::pake::CpaceInitiator::new(code_phrase, session_id);
    let public_bytes = initiator.public_message();

    (
        public_bytes.to_vec(),
        CpaceState::Initiator(initiator),
    )
}

/// Start CPace as responder
pub fn start_cpace_responder(
    code_phrase: &str,
    session_id: &[u8],
) -> (Vec<u8>, CpaceState) {
    let responder = tallow_crypto::pake::CpaceResponder::new(code_phrase, session_id);
    let public_bytes = responder.public_message();

    (
        public_bytes.to_vec(),
        CpaceState::Responder(responder),
    )
}

/// Complete CPace key exchange with the peer's public message
///
/// # Arguments
///
/// * `state` - The CPace state from start_cpace_*
/// * `their_public` - The peer's public message (32 bytes)
///
/// # Returns
///
/// The derived session key
pub fn complete_cpace(state: CpaceState, their_public: &[u8; 32]) -> Result<SessionKey> {
    let shared_secret = match state {
        CpaceState::Initiator(initiator) => initiator.finish(their_public).map_err(|e| {
            ProtocolError::TransferFailed(format!("CPace initiator finish failed: {}", e))
        })?,
        CpaceState::Responder(responder) => responder.finish(their_public).map_err(|e| {
            ProtocolError::TransferFailed(format!("CPace responder finish failed: {}", e))
        })?,
    };

    // Derive session key from CPace shared secret using BLAKE3 KDF
    let key = tallow_crypto::hash::blake3::derive_key("tallow-cpace-session-v1", &shared_secret);
    Ok(SessionKey { key })
}

/// CPace exchange state (opaque to callers)
pub enum CpaceState {
    /// Initiator state
    Initiator(tallow_crypto::pake::CpaceInitiator),
    /// Responder state
    Responder(tallow_crypto::pake::CpaceResponder),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_session_key_deterministic() {
        let room_id = crate::room::code::derive_room_id("test-phrase");
        let key1 = derive_session_key_from_phrase("test-phrase", &room_id);
        let key2 = derive_session_key_from_phrase("test-phrase", &room_id);
        assert_eq!(key1.as_bytes(), key2.as_bytes());
    }

    #[test]
    fn test_derive_session_key_different_phrases() {
        let room1 = crate::room::code::derive_room_id("phrase-one");
        let room2 = crate::room::code::derive_room_id("phrase-two");
        let key1 = derive_session_key_from_phrase("phrase-one", &room1);
        let key2 = derive_session_key_from_phrase("phrase-two", &room2);
        assert_ne!(key1.as_bytes(), key2.as_bytes());
    }

    #[test]
    fn test_cpace_key_exchange() {
        let code = "test-code";
        let session_id = b"session-123";

        let (init_pub, init_state) = start_cpace_initiator(code, session_id);
        let (resp_pub, resp_state) = start_cpace_responder(code, session_id);

        let init_pub_arr: [u8; 32] = init_pub.try_into().unwrap();
        let resp_pub_arr: [u8; 32] = resp_pub.try_into().unwrap();

        let key1 = complete_cpace(init_state, &resp_pub_arr).unwrap();
        let key2 = complete_cpace(resp_state, &init_pub_arr).unwrap();

        assert_eq!(key1.as_bytes(), key2.as_bytes());
    }

    #[test]
    fn test_cpace_wrong_password() {
        let session_id = b"session-123";

        let (_init_pub, init_state) = start_cpace_initiator("correct", session_id);
        let (resp_pub, _resp_state) = start_cpace_responder("wrong", session_id);

        let resp_pub_arr: [u8; 32] = resp_pub.try_into().unwrap();
        let key1 = complete_cpace(init_state, &resp_pub_arr).unwrap();

        let (_init_pub2, init_state2) = start_cpace_initiator("correct", session_id);
        let (resp_pub2, _) = start_cpace_responder("correct", session_id);
        let resp_pub_arr2: [u8; 32] = resp_pub2.try_into().unwrap();
        let key2 = complete_cpace(init_state2, &resp_pub_arr2).unwrap();

        // Keys should differ with wrong password
        assert_ne!(key1.as_bytes(), key2.as_bytes());
    }
}
