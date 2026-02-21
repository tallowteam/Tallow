//! Key exchange orchestration
//!
//! Combines hybrid KEM (ML-KEM-1024 + X25519), HKDF-SHA256,
//! and CPace PAKE to establish a session key between two peers.
//!
//! ## Protocol Flow (v2)
//!
//! 1. Sender -> Receiver: `HandshakeInit` (CPace public, KEM capabilities, nonce)
//! 2. Receiver -> Sender: `HandshakeResponse` (CPace public, KEM public key, nonce)
//! 3. Sender -> Receiver: `HandshakeKem` (KEM ciphertext, sender confirmation)
//! 4. Receiver -> Sender: `HandshakeComplete` (receiver confirmation)
//!
//! After step 4, both sides hold an identical 256-bit session key derived from
//! both the CPace PAKE output and the hybrid KEM shared secret.

use crate::wire::Message;
use crate::{ProtocolError, Result};
use subtle::ConstantTimeEq;
use tallow_crypto::hash::domain;

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

    /// Create a session key from raw bytes
    ///
    /// # Security
    ///
    /// The caller is responsible for ensuring the bytes come from a
    /// cryptographically secure key derivation process.
    pub fn from_bytes(key: [u8; 32]) -> Self {
        Self { key }
    }
}

impl Drop for SessionKey {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.key.zeroize();
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
#[deprecated(
    since = "2.0.0",
    note = "Use SenderHandshake/ReceiverHandshake for KEM-based key exchange"
)]
pub fn derive_session_key_from_phrase(code_phrase: &str, room_id: &[u8; 32]) -> SessionKey {
    // Use BLAKE3 KDF with domain separation
    let mut input = Vec::with_capacity(code_phrase.len() + 32);
    input.extend_from_slice(code_phrase.as_bytes());
    input.extend_from_slice(room_id);

    let key = tallow_crypto::hash::blake3::derive_key("tallow-session-key-v1", &input);
    SessionKey { key }
}

/// Derive a unique session key using a per-transfer random salt
///
/// Unlike [`derive_session_key_from_phrase`], this includes the random
/// `transfer_id` in the derivation input, ensuring that reusing the same
/// code phrase produces a **different** session key each time. This
/// prevents catastrophic AES-GCM nonce reuse.
///
/// # Arguments
///
/// * `code_phrase` - Shared code phrase
/// * `room_id` - BLAKE3 hash of the code phrase (domain separation)
/// * `transfer_id` - Random 16-byte per-transfer salt (sent in FileOffer)
#[deprecated(
    since = "2.0.0",
    note = "Use SenderHandshake/ReceiverHandshake for KEM-based key exchange"
)]
pub fn derive_session_key_with_salt(
    code_phrase: &str,
    room_id: &[u8; 32],
    transfer_id: &[u8; 16],
) -> SessionKey {
    let mut input = Vec::with_capacity(code_phrase.len() + 32 + 16);
    input.extend_from_slice(code_phrase.as_bytes());
    input.extend_from_slice(room_id);
    input.extend_from_slice(transfer_id);

    let key = tallow_crypto::hash::blake3::derive_key("tallow-session-key-v2", &input);
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
/// (public_message, CpaceState) -- send public_message to peer,
/// then call `complete_cpace` with their public_message.
#[cfg(test)]
pub(crate) fn start_cpace_initiator(code_phrase: &str, session_id: &[u8]) -> (Vec<u8>, CpaceState) {
    let initiator = tallow_crypto::pake::CpaceInitiator::new(code_phrase, session_id);
    let public_bytes = initiator.public_message();

    (public_bytes.to_vec(), CpaceState::Initiator(initiator))
}

/// Start CPace as responder
#[cfg(test)]
pub(crate) fn start_cpace_responder(code_phrase: &str, session_id: &[u8]) -> (Vec<u8>, CpaceState) {
    let responder = tallow_crypto::pake::CpaceResponder::new(code_phrase, session_id);
    let public_bytes = responder.public_message();

    (public_bytes.to_vec(), CpaceState::Responder(responder))
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
#[cfg(test)]
pub(crate) fn complete_cpace(state: CpaceState, their_public: &[u8; 32]) -> Result<SessionKey> {
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
pub(crate) enum CpaceState {
    /// Initiator state
    Initiator(tallow_crypto::pake::CpaceInitiator),
    /// Responder state (constructed in tests; matched in production error paths)
    #[allow(dead_code)]
    Responder(tallow_crypto::pake::CpaceResponder),
}

// ---------------------------------------------------------------------------
// Handshake Transcript
// ---------------------------------------------------------------------------

/// Append-only transcript of all handshake messages for key binding.
///
/// Both sides must append data in identical order.
struct HandshakeTranscript {
    buffer: Vec<u8>,
}

impl HandshakeTranscript {
    fn new() -> Self {
        let mut buffer = Vec::with_capacity(4096);
        // Start with domain separator
        buffer.extend_from_slice(domain::DOMAIN_HANDSHAKE_TRANSCRIPT.as_bytes());
        Self { buffer }
    }

    fn append(&mut self, data: &[u8]) {
        // Length-prefix each field to prevent ambiguity
        self.buffer
            .extend_from_slice(&(data.len() as u32).to_le_bytes());
        self.buffer.extend_from_slice(data);
    }

    fn hash(&self) -> [u8; 32] {
        tallow_crypto::hash::blake3::hash(&self.buffer)
    }
}

impl Drop for HandshakeTranscript {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.buffer.zeroize();
    }
}

// ---------------------------------------------------------------------------
// Key Confirmation Helpers
// ---------------------------------------------------------------------------

/// Compute a key confirmation tag using BLAKE3 keyed MAC.
///
/// `tag = BLAKE3_keyed(session_key, domain_label || transcript_hash)`
fn compute_confirmation(
    session_key: &[u8; 32],
    domain_label: &str,
    transcript_hash: &[u8; 32],
) -> [u8; 32] {
    let mut data = Vec::with_capacity(domain_label.len() + 32);
    data.extend_from_slice(domain_label.as_bytes());
    data.extend_from_slice(transcript_hash);
    tallow_crypto::hash::blake3::keyed_hash(session_key, &data)
}

/// Derive a session key from KEM + PAKE secrets via HKDF-SHA256.
fn derive_handshake_session_key(
    kem_shared_secret: &[u8; 32],
    pake_secret: &[u8; 32],
    transcript_hash: &[u8; 32],
) -> Result<[u8; 32]> {
    use zeroize::Zeroize;

    // IKM = kem_shared_secret || pake_secret (64 bytes)
    let mut ikm = [0u8; 64];
    ikm[..32].copy_from_slice(kem_shared_secret);
    ikm[32..].copy_from_slice(pake_secret);

    let derived = tallow_crypto::kdf::hkdf::derive(
        transcript_hash,
        &ikm,
        domain::DOMAIN_SESSION_KEY_KEM_PAKE.as_bytes(),
        32,
    )
    .map_err(|e| ProtocolError::HandshakeFailed(format!("HKDF derivation failed: {}", e)))?;

    ikm.zeroize();

    let mut key = [0u8; 32];
    key.copy_from_slice(&derived);
    Ok(key)
}

// ---------------------------------------------------------------------------
// SenderHandshake
// ---------------------------------------------------------------------------

/// Handshake state machine for the sender (CPace initiator, KEM encapsulator).
///
/// All secret fields are zeroized on drop.
pub struct SenderHandshake {
    code_phrase: String,
    room_id: [u8; 32],
    nonce: [u8; 16],
    cpace_state: Option<CpaceState>,
    transcript: HandshakeTranscript,
    /// Cached session key for receiver confirmation verification
    session_key_bytes: Option<[u8; 32]>,
    /// Cached transcript hash for confirmation verification
    transcript_hash: Option<[u8; 32]>,
}

impl SenderHandshake {
    /// Create a new sender handshake state machine.
    ///
    /// # Arguments
    ///
    /// * `code_phrase` - Shared code phrase for PAKE authentication
    /// * `room_id` - BLAKE3 hash of the code phrase
    pub fn new(code_phrase: &str, room_id: &[u8; 32]) -> Self {
        let nonce: [u8; 16] = rand::random();
        Self {
            code_phrase: code_phrase.to_string(),
            room_id: *room_id,
            nonce,
            cpace_state: None,
            transcript: HandshakeTranscript::new(),
            session_key_bytes: None,
            transcript_hash: None,
        }
    }

    /// Generate the HandshakeInit message (step 1).
    ///
    /// Initializes CPace as initiator and returns the init message to send.
    pub fn init(&mut self) -> Result<Message> {
        if self.cpace_state.is_some() {
            return Err(ProtocolError::InvalidStateTransition {
                from: "initialized".to_string(),
                to: "init".to_string(),
            });
        }

        // Build partial session_id = room_id || sender_nonce
        let mut session_id = Vec::with_capacity(48);
        session_id.extend_from_slice(&self.room_id);
        session_id.extend_from_slice(&self.nonce);

        // Create CPace initiator
        let initiator = tallow_crypto::pake::CpaceInitiator::new(&self.code_phrase, &session_id);
        let cpace_public = initiator.public_message();

        // Serialize KEM capabilities
        let kem_capabilities = postcard::to_stdvec(&tallow_crypto::kem::KemCapabilities::all())
            .map_err(|e| {
                ProtocolError::EncodingError(format!("KEM capabilities encoding: {}", e))
            })?;

        // Append to transcript (same order as receiver will)
        self.transcript.append(&cpace_public);
        self.transcript.append(&self.nonce);

        self.cpace_state = Some(CpaceState::Initiator(initiator));

        Ok(Message::HandshakeInit {
            protocol_version: 2,
            kem_capabilities,
            cpace_public,
            nonce: self.nonce,
        })
    }

    /// Process the HandshakeResponse and generate HandshakeKem (steps 2-3).
    ///
    /// Completes CPace, encapsulates to the receiver's KEM public key,
    /// derives the session key, and computes the sender confirmation tag.
    ///
    /// # Arguments
    ///
    /// * `selected_kem` - The selected KEM algorithm discriminant (unused in v2)
    /// * `cpace_public` - The receiver's CPace public message
    /// * `kem_public_key` - Serialized hybrid KEM public key
    /// * `nonce` - The receiver's random nonce
    pub fn process_response(
        &mut self,
        _selected_kem: u8,
        cpace_public: &[u8; 32],
        kem_public_key: &[u8],
        nonce: &[u8; 16],
    ) -> Result<(Message, SessionKey)> {
        // Take CPace state (consumes it -- can't call again)
        let cpace_state =
            self.cpace_state
                .take()
                .ok_or_else(|| ProtocolError::InvalidStateTransition {
                    from: "no cpace state".to_string(),
                    to: "process_response".to_string(),
                })?;

        // Complete CPace with responder's public message -> pake_secret
        let mut pake_secret = match cpace_state {
            CpaceState::Initiator(initiator) => initiator.finish(cpace_public).map_err(|_e| {
                // Generic error -- MUST NOT reveal whether PAKE or KEM caused failure
                ProtocolError::HandshakeFailed("handshake authentication failed".to_string())
            })?,
            CpaceState::Responder(_) => {
                return Err(ProtocolError::InvalidStateTransition {
                    from: "responder".to_string(),
                    to: "process_response (sender)".to_string(),
                });
            }
        };

        // Append receiver's data to transcript (same order as receiver)
        self.transcript.append(cpace_public);
        self.transcript.append(nonce);
        self.transcript.append(kem_public_key);

        // Deserialize the receiver's KEM public key
        let pk: tallow_crypto::kem::hybrid::PublicKey = postcard::from_bytes(kem_public_key)
            .map_err(|e| {
                ProtocolError::HandshakeFailed(format!("handshake authentication failed: {}", e))
            })?;

        // Encapsulate to receiver's KEM public key
        let (ciphertext, kem_shared_secret) = tallow_crypto::kem::HybridKem::encapsulate(&pk)
            .map_err(|_e| {
                ProtocolError::HandshakeFailed("handshake authentication failed".to_string())
            })?;

        // Serialize ciphertext
        let kem_ciphertext = postcard::to_stdvec(&ciphertext)
            .map_err(|e| ProtocolError::EncodingError(format!("KEM ciphertext encoding: {}", e)))?;

        // Append ciphertext to transcript
        self.transcript.append(&kem_ciphertext);

        // Compute transcript hash
        let transcript_hash = self.transcript.hash();

        // Derive session key from KEM + PAKE
        let session_key_bytes = derive_handshake_session_key(
            kem_shared_secret.expose_secret(),
            &pake_secret,
            &transcript_hash,
        )?;

        // Compute sender confirmation tag
        let confirmation = compute_confirmation(
            &session_key_bytes,
            domain::DOMAIN_KEY_CONFIRM_SENDER,
            &transcript_hash,
        );

        // Zeroize intermediate secrets
        use zeroize::Zeroize;
        pake_secret.zeroize();

        // Cache for receiver confirmation verification
        self.session_key_bytes = Some(session_key_bytes);
        self.transcript_hash = Some(transcript_hash);

        Ok((
            Message::HandshakeKem {
                kem_ciphertext,
                confirmation,
            },
            SessionKey::from_bytes(session_key_bytes),
        ))
    }

    /// Verify the receiver's key confirmation tag (step 4).
    ///
    /// Uses constant-time comparison to prevent timing attacks.
    pub fn verify_receiver_confirmation(&self, their_confirmation: &[u8; 32]) -> Result<()> {
        let session_key_bytes = self.session_key_bytes.as_ref().ok_or_else(|| {
            ProtocolError::InvalidStateTransition {
                from: "no session key".to_string(),
                to: "verify_receiver_confirmation".to_string(),
            }
        })?;

        let transcript_hash =
            self.transcript_hash
                .as_ref()
                .ok_or_else(|| ProtocolError::InvalidStateTransition {
                    from: "no transcript hash".to_string(),
                    to: "verify_receiver_confirmation".to_string(),
                })?;

        let expected = compute_confirmation(
            session_key_bytes,
            domain::DOMAIN_KEY_CONFIRM_RECEIVER,
            transcript_hash,
        );

        if their_confirmation.ct_eq(&expected).into() {
            Ok(())
        } else {
            Err(ProtocolError::KeyConfirmationFailed)
        }
    }
}

impl Drop for SenderHandshake {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        // Zeroize secret material
        self.code_phrase.zeroize();
        self.nonce.zeroize();
        if let Some(ref mut key) = self.session_key_bytes {
            key.zeroize();
        }
        if let Some(ref mut hash) = self.transcript_hash {
            hash.zeroize();
        }
    }
}

// ---------------------------------------------------------------------------
// ReceiverHandshake
// ---------------------------------------------------------------------------

/// Handshake state machine for the receiver (CPace responder, KEM decapsulator).
///
/// All secret fields are zeroized on drop.
pub struct ReceiverHandshake {
    code_phrase: String,
    room_id: [u8; 32],
    nonce: [u8; 16],
    kem_secret_key: Option<tallow_crypto::kem::hybrid::SecretKey>,
    pake_secret: Option<[u8; 32]>,
    transcript: HandshakeTranscript,
}

impl ReceiverHandshake {
    /// Create a new receiver handshake state machine.
    ///
    /// # Arguments
    ///
    /// * `code_phrase` - Shared code phrase for PAKE authentication
    /// * `room_id` - BLAKE3 hash of the code phrase
    pub fn new(code_phrase: &str, room_id: &[u8; 32]) -> Self {
        let nonce: [u8; 16] = rand::random();
        Self {
            code_phrase: code_phrase.to_string(),
            room_id: *room_id,
            nonce,
            kem_secret_key: None,
            pake_secret: None,
            transcript: HandshakeTranscript::new(),
        }
    }

    /// Process the HandshakeInit and generate HandshakeResponse (steps 1-2).
    ///
    /// Validates the protocol version, completes CPace as responder,
    /// generates an ephemeral KEM keypair, and returns the response message.
    ///
    /// # Arguments
    ///
    /// * `protocol_version` - The handshake protocol version (must be >= 2)
    /// * `kem_capabilities` - Serialized KEM capabilities from sender
    /// * `cpace_public` - The sender's CPace public message
    /// * `sender_nonce` - The sender's random nonce
    pub fn process_init(
        &mut self,
        protocol_version: u32,
        kem_capabilities: &[u8],
        cpace_public: &[u8; 32],
        sender_nonce: &[u8; 16],
    ) -> Result<Message> {
        if protocol_version < 2 {
            return Err(ProtocolError::VersionMismatch {
                local: 2,
                remote: protocol_version,
            });
        }

        // Build session_id matching what initiator used: room_id || sender_nonce
        let mut session_id = Vec::with_capacity(48);
        session_id.extend_from_slice(&self.room_id);
        session_id.extend_from_slice(sender_nonce);

        // Create CPace responder and complete immediately
        let responder = tallow_crypto::pake::CpaceResponder::new(&self.code_phrase, &session_id);
        let resp_cpace_public = responder.public_message();
        let pake_secret = responder.finish(cpace_public).map_err(|_e| {
            ProtocolError::HandshakeFailed("handshake authentication failed".to_string())
        })?;
        self.pake_secret = Some(pake_secret);

        // Append to transcript (same order as sender)
        self.transcript.append(cpace_public);
        self.transcript.append(sender_nonce);
        self.transcript.append(&resp_cpace_public);
        self.transcript.append(&self.nonce);

        // Negotiate KEM algorithm
        let their_caps: tallow_crypto::kem::KemCapabilities =
            postcard::from_bytes(kem_capabilities).map_err(|e| {
                ProtocolError::HandshakeFailed(format!("KEM capabilities decode failed: {}", e))
            })?;
        let ours = tallow_crypto::kem::KemCapabilities::all();
        let selected = tallow_crypto::kem::negotiate(&ours, &their_caps).ok_or_else(|| {
            ProtocolError::HandshakeFailed("no compatible KEM algorithm".to_string())
        })?;
        let selected_kem = selected as u8;

        // Generate ephemeral KEM keypair
        let (pk, sk) = tallow_crypto::kem::HybridKem::keygen().map_err(|_e| {
            ProtocolError::HandshakeFailed("KEM key generation failed".to_string())
        })?;
        self.kem_secret_key = Some(sk);

        // Serialize public key
        let kem_public_key = postcard::to_stdvec(&pk)
            .map_err(|e| ProtocolError::EncodingError(format!("KEM public key encoding: {}", e)))?;

        // Append serialized pk to transcript
        self.transcript.append(&kem_public_key);

        Ok(Message::HandshakeResponse {
            selected_kem,
            cpace_public: resp_cpace_public,
            kem_public_key,
            nonce: self.nonce,
        })
    }

    /// Process the HandshakeKem and generate HandshakeComplete (step 3-4).
    ///
    /// Decapsulates the KEM ciphertext, derives the session key,
    /// verifies the sender's confirmation tag, and returns the
    /// receiver confirmation and session key.
    ///
    /// # Arguments
    ///
    /// * `kem_ciphertext` - Serialized KEM ciphertext from sender
    /// * `sender_confirmation` - Sender's key confirmation tag
    pub fn process_kem(
        &mut self,
        kem_ciphertext: &[u8],
        sender_confirmation: &[u8; 32],
    ) -> Result<(Message, SessionKey)> {
        // Take KEM secret key (consumes it)
        let sk =
            self.kem_secret_key
                .take()
                .ok_or_else(|| ProtocolError::InvalidStateTransition {
                    from: "no KEM secret key".to_string(),
                    to: "process_kem".to_string(),
                })?;

        // Deserialize ciphertext
        let ct: tallow_crypto::kem::hybrid::Ciphertext = postcard::from_bytes(kem_ciphertext)
            .map_err(|e| {
                ProtocolError::HandshakeFailed(format!("handshake authentication failed: {}", e))
            })?;

        // Decapsulate
        let kem_shared_secret =
            tallow_crypto::kem::HybridKem::decapsulate(&sk, &ct).map_err(|_e| {
                ProtocolError::HandshakeFailed("handshake authentication failed".to_string())
            })?;

        // Append ciphertext to transcript (raw bytes, same as sender serialized them)
        self.transcript.append(kem_ciphertext);

        // Compute transcript hash
        let transcript_hash = self.transcript.hash();

        // Take PAKE secret
        let mut pake_secret =
            self.pake_secret
                .take()
                .ok_or_else(|| ProtocolError::InvalidStateTransition {
                    from: "no PAKE secret".to_string(),
                    to: "process_kem".to_string(),
                })?;

        // Derive session key
        let session_key_bytes = derive_handshake_session_key(
            kem_shared_secret.expose_secret(),
            &pake_secret,
            &transcript_hash,
        )?;

        // Verify sender's confirmation tag (constant-time)
        let expected_sender_confirmation = compute_confirmation(
            &session_key_bytes,
            domain::DOMAIN_KEY_CONFIRM_SENDER,
            &transcript_hash,
        );

        if !bool::from(sender_confirmation.ct_eq(&expected_sender_confirmation)) {
            return Err(ProtocolError::KeyConfirmationFailed);
        }

        // Compute receiver confirmation tag
        let receiver_confirmation = compute_confirmation(
            &session_key_bytes,
            domain::DOMAIN_KEY_CONFIRM_RECEIVER,
            &transcript_hash,
        );

        // Zeroize intermediate secrets
        use zeroize::Zeroize;
        pake_secret.zeroize();

        Ok((
            Message::HandshakeComplete {
                confirmation: receiver_confirmation,
            },
            SessionKey::from_bytes(session_key_bytes),
        ))
    }
}

impl Drop for ReceiverHandshake {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.code_phrase.zeroize();
        self.nonce.zeroize();
        if let Some(ref mut secret) = self.pake_secret {
            secret.zeroize();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[allow(deprecated)]
    fn test_derive_session_key_deterministic() {
        let room_id = crate::room::code::derive_room_id("test-phrase");
        let key1 = derive_session_key_from_phrase("test-phrase", &room_id);
        let key2 = derive_session_key_from_phrase("test-phrase", &room_id);
        assert_eq!(key1.as_bytes(), key2.as_bytes());
    }

    #[test]
    #[allow(deprecated)]
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
    #[allow(deprecated)]
    fn test_derive_session_key_with_salt_unique() {
        let room_id = crate::room::code::derive_room_id("test-phrase");
        let salt1: [u8; 16] = [1u8; 16];
        let salt2: [u8; 16] = [2u8; 16];
        let key1 = derive_session_key_with_salt("test-phrase", &room_id, &salt1);
        let key2 = derive_session_key_with_salt("test-phrase", &room_id, &salt2);
        // Same phrase but different salts must produce different keys
        assert_ne!(key1.as_bytes(), key2.as_bytes());
    }

    #[test]
    #[allow(deprecated)]
    fn test_derive_session_key_with_salt_deterministic() {
        let room_id = crate::room::code::derive_room_id("test-phrase");
        let salt: [u8; 16] = [42u8; 16];
        let key1 = derive_session_key_with_salt("test-phrase", &room_id, &salt);
        let key2 = derive_session_key_with_salt("test-phrase", &room_id, &salt);
        // Same inputs must produce the same key
        assert_eq!(key1.as_bytes(), key2.as_bytes());
    }

    #[test]
    #[allow(deprecated)]
    fn test_derive_session_key_with_salt_differs_from_unsalted() {
        let room_id = crate::room::code::derive_room_id("test-phrase");
        let salt: [u8; 16] = [0u8; 16];
        let unsalted = derive_session_key_from_phrase("test-phrase", &room_id);
        let salted = derive_session_key_with_salt("test-phrase", &room_id, &salt);
        // v1 (unsalted) and v2 (salted) use different domain strings
        assert_ne!(unsalted.as_bytes(), salted.as_bytes());
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

    // -----------------------------------------------------------------------
    // KEM Handshake Tests
    // -----------------------------------------------------------------------

    #[test]
    fn test_kem_handshake_roundtrip() {
        let code = "test-kem-handshake";
        let room_id = crate::room::code::derive_room_id(code);

        let mut sender = SenderHandshake::new(code, &room_id);
        let mut receiver = ReceiverHandshake::new(code, &room_id);

        // Step 1: Sender init
        let init_msg = sender.init().unwrap();
        let (protocol_version, kem_capabilities, cpace_public, sender_nonce) = match init_msg {
            Message::HandshakeInit {
                protocol_version,
                kem_capabilities,
                cpace_public,
                nonce,
            } => (protocol_version, kem_capabilities, cpace_public, nonce),
            _ => panic!("Expected HandshakeInit"),
        };

        // Step 2: Receiver process init -> HandshakeResponse
        let resp_msg = receiver
            .process_init(
                protocol_version,
                &kem_capabilities,
                &cpace_public,
                &sender_nonce,
            )
            .unwrap();

        let (selected_kem, resp_cpace, resp_kem_pk, resp_nonce) = match resp_msg {
            Message::HandshakeResponse {
                selected_kem,
                cpace_public,
                kem_public_key,
                nonce,
            } => (selected_kem, cpace_public, kem_public_key, nonce),
            _ => panic!("Expected HandshakeResponse"),
        };

        // Step 3: Sender process response -> HandshakeKem + session key
        let (kem_msg, sender_key) = sender
            .process_response(selected_kem, &resp_cpace, &resp_kem_pk, &resp_nonce)
            .unwrap();

        let (kem_ciphertext, sender_confirmation) = match kem_msg {
            Message::HandshakeKem {
                kem_ciphertext,
                confirmation,
            } => (kem_ciphertext, confirmation),
            _ => panic!("Expected HandshakeKem"),
        };

        // Step 4: Receiver process KEM -> HandshakeComplete + session key
        let (complete_msg, receiver_key) = receiver
            .process_kem(&kem_ciphertext, &sender_confirmation)
            .unwrap();

        let receiver_confirmation = match complete_msg {
            Message::HandshakeComplete { confirmation } => confirmation,
            _ => panic!("Expected HandshakeComplete"),
        };

        // Sender verifies receiver's confirmation
        sender
            .verify_receiver_confirmation(&receiver_confirmation)
            .unwrap();

        // Both sides must derive the same session key
        assert_eq!(
            sender_key.as_bytes(),
            receiver_key.as_bytes(),
            "Sender and receiver must derive identical session keys"
        );
    }

    #[test]
    fn test_kem_handshake_wrong_password() {
        let room_id = crate::room::code::derive_room_id("code-a");

        let mut sender = SenderHandshake::new("code-a", &room_id);
        let mut receiver = ReceiverHandshake::new("code-b", &room_id);

        // Step 1
        let init_msg = sender.init().unwrap();
        let (pv, caps, cpub, snonce) = match init_msg {
            Message::HandshakeInit {
                protocol_version,
                kem_capabilities,
                cpace_public,
                nonce,
            } => (protocol_version, kem_capabilities, cpace_public, nonce),
            _ => panic!("Expected HandshakeInit"),
        };

        // Step 2
        let resp_msg = receiver.process_init(pv, &caps, &cpub, &snonce).unwrap();
        let (sk, rc, rpk, rn) = match resp_msg {
            Message::HandshakeResponse {
                selected_kem,
                cpace_public,
                kem_public_key,
                nonce,
            } => (selected_kem, cpace_public, kem_public_key, nonce),
            _ => panic!("Expected HandshakeResponse"),
        };

        // Step 3
        let (kem_msg, _sender_key) = sender.process_response(sk, &rc, &rpk, &rn).unwrap();
        let (ct, conf) = match kem_msg {
            Message::HandshakeKem {
                kem_ciphertext,
                confirmation,
            } => (kem_ciphertext, confirmation),
            _ => panic!("Expected HandshakeKem"),
        };

        // Step 4: Receiver should fail key confirmation because passwords differ
        let result = receiver.process_kem(&ct, &conf);
        assert!(
            result.is_err(),
            "Wrong password should cause key confirmation failure"
        );
        match result {
            Err(ProtocolError::KeyConfirmationFailed) => {} // expected
            Err(e) => panic!("Expected KeyConfirmationFailed, got: {}", e),
            Ok(_) => panic!("Expected error"),
        }
    }

    #[test]
    fn test_kem_handshake_ephemeral_keys() {
        let code = "same-code-phrase";
        let room_id = crate::room::code::derive_room_id(code);

        // First handshake
        let key1 = {
            let mut sender = SenderHandshake::new(code, &room_id);
            let mut receiver = ReceiverHandshake::new(code, &room_id);

            let init = sender.init().unwrap();
            let (pv, caps, cpub, sn) = match init {
                Message::HandshakeInit {
                    protocol_version,
                    kem_capabilities,
                    cpace_public,
                    nonce,
                } => (protocol_version, kem_capabilities, cpace_public, nonce),
                _ => panic!("Expected HandshakeInit"),
            };

            let resp = receiver.process_init(pv, &caps, &cpub, &sn).unwrap();
            let (sk, rc, rpk, rn) = match resp {
                Message::HandshakeResponse {
                    selected_kem,
                    cpace_public,
                    kem_public_key,
                    nonce,
                } => (selected_kem, cpace_public, kem_public_key, nonce),
                _ => panic!("Expected HandshakeResponse"),
            };

            let (_kem_msg, sender_key) = sender.process_response(sk, &rc, &rpk, &rn).unwrap();
            *sender_key.as_bytes()
        };

        // Second handshake with same code phrase
        let key2 = {
            let mut sender = SenderHandshake::new(code, &room_id);
            let mut receiver = ReceiverHandshake::new(code, &room_id);

            let init = sender.init().unwrap();
            let (pv, caps, cpub, sn) = match init {
                Message::HandshakeInit {
                    protocol_version,
                    kem_capabilities,
                    cpace_public,
                    nonce,
                } => (protocol_version, kem_capabilities, cpace_public, nonce),
                _ => panic!("Expected HandshakeInit"),
            };

            let resp = receiver.process_init(pv, &caps, &cpub, &sn).unwrap();
            let (sk, rc, rpk, rn) = match resp {
                Message::HandshakeResponse {
                    selected_kem,
                    cpace_public,
                    kem_public_key,
                    nonce,
                } => (selected_kem, cpace_public, kem_public_key, nonce),
                _ => panic!("Expected HandshakeResponse"),
            };

            let (_kem_msg, sender_key) = sender.process_response(sk, &rc, &rpk, &rn).unwrap();
            *sender_key.as_bytes()
        };

        // Ephemeral KEM keys ensure different session keys each time
        assert_ne!(
            key1, key2,
            "Two handshakes with the same code phrase must produce different session keys"
        );
    }

    #[test]
    fn test_kem_handshake_transcript_binding() {
        let code = "transcript-test";
        let room_id = crate::room::code::derive_room_id(code);

        let mut sender = SenderHandshake::new(code, &room_id);
        let mut receiver = ReceiverHandshake::new(code, &room_id);

        // Step 1
        let init = sender.init().unwrap();
        let (pv, caps, cpub, sn) = match init {
            Message::HandshakeInit {
                protocol_version,
                kem_capabilities,
                cpace_public,
                nonce,
            } => (protocol_version, kem_capabilities, cpace_public, nonce),
            _ => panic!("Expected HandshakeInit"),
        };

        // Step 2
        let resp = receiver.process_init(pv, &caps, &cpub, &sn).unwrap();
        let (sk, rc, mut rpk, rn) = match resp {
            Message::HandshakeResponse {
                selected_kem,
                cpace_public,
                kem_public_key,
                nonce,
            } => (selected_kem, cpace_public, kem_public_key, nonce),
            _ => panic!("Expected HandshakeResponse"),
        };

        // Tamper with the KEM public key (flip a byte)
        if !rpk.is_empty() {
            rpk[0] ^= 0xFF;
        }

        // Step 3: Sender processes tampered response
        // This should fail because the deserialized public key is invalid
        // or the KEM encapsulation will produce a different shared secret
        let result = sender.process_response(sk, &rc, &rpk, &rn);

        // The tampered key should cause a failure somewhere in the handshake
        // Either deserialization fails, or (if it doesn't) the receiver's
        // decapsulation will produce a different shared secret, causing
        // key confirmation to fail
        if let Ok((kem_msg, _sender_key)) = result {
            // Sender succeeded (tampered key happened to deserialize),
            // but receiver must fail because it decapsulates with a different key
            let (ct, conf) = match kem_msg {
                Message::HandshakeKem {
                    kem_ciphertext,
                    confirmation,
                } => (kem_ciphertext, confirmation),
                _ => panic!("Expected HandshakeKem"),
            };

            // Receiver should fail because transcript hashes won't match
            let recv_result = receiver.process_kem(&ct, &conf);
            assert!(
                recv_result.is_err(),
                "Tampered transcript should cause verification failure"
            );
        }
        // If sender failed, the tamper was caught early -- also acceptable
    }

    #[test]
    fn test_sender_handshake_double_init_fails() {
        let code = "double-init";
        let room_id = crate::room::code::derive_room_id(code);
        let mut sender = SenderHandshake::new(code, &room_id);

        // First init should succeed
        let _ = sender.init().unwrap();

        // Second init should fail (state machine already consumed)
        let result = sender.init();
        assert!(result.is_err(), "Double init should fail");
    }

    #[test]
    fn test_receiver_handshake_out_of_order() {
        let code = "out-of-order";
        let room_id = crate::room::code::derive_room_id(code);
        let mut receiver = ReceiverHandshake::new(code, &room_id);

        // Calling process_kem before process_init should fail
        let result = receiver.process_kem(&[0u8; 64], &[0u8; 32]);
        assert!(result.is_err(), "Out-of-order call should fail");
    }

    #[test]
    fn test_kem_handshake_message_serialization() {
        // Verify each handshake message roundtrips through postcard
        let init = Message::HandshakeInit {
            protocol_version: 2,
            kem_capabilities: vec![0, 1, 2],
            cpace_public: [0xAA; 32],
            nonce: [0xBB; 16],
        };
        let bytes = postcard::to_stdvec(&init).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(init, decoded);

        let resp = Message::HandshakeResponse {
            selected_kem: 2,
            cpace_public: [0xCC; 32],
            kem_public_key: vec![0xDD; 128],
            nonce: [0xEE; 16],
        };
        let bytes = postcard::to_stdvec(&resp).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(resp, decoded);

        let kem = Message::HandshakeKem {
            kem_ciphertext: vec![0xFF; 256],
            confirmation: [0x11; 32],
        };
        let bytes = postcard::to_stdvec(&kem).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(kem, decoded);

        let complete = Message::HandshakeComplete {
            confirmation: [0x22; 32],
        };
        let bytes = postcard::to_stdvec(&complete).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(complete, decoded);

        let failed = Message::HandshakeFailed {
            reason: "test failure".to_string(),
        };
        let bytes = postcard::to_stdvec(&failed).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(failed, decoded);
    }

    #[test]
    fn test_version_negotiation_reject_v1_only() {
        let room_id = crate::room::code::derive_room_id("v1-test");
        let mut receiver = ReceiverHandshake::new("v1-test", &room_id);

        // A peer advertising version 1 should be rejected
        let result = receiver.process_init(1, &[], &[0u8; 32], &[0u8; 16]);
        assert!(result.is_err(), "Version 1 should be rejected");
        match result {
            Err(ProtocolError::VersionMismatch {
                local: 2,
                remote: 1,
            }) => {}
            Err(e) => panic!("Expected VersionMismatch, got: {}", e),
            Ok(_) => panic!("Expected error"),
        }
    }
}
