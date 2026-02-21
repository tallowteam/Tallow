# Phase 11: Real KEM Key Exchange -- Execution Plan

## Overview

Replace code-phrase-derived session keys (`derive_session_key_with_salt`) with a proper
PAKE-then-KEM handshake. After this phase, every transfer performs:

1. CPace mutual authentication (proving both peers know the code phrase)
2. ML-KEM-1024 + X25519 hybrid key encapsulation (256-bit ephemeral session key)
3. Key confirmation (BLAKE3 keyed MAC with constant-time verification)

The code phrase authenticates the KEM; the KEM provides the actual key material.
Session keys have full 256-bit entropy regardless of code phrase strength.

---

## Wave 1: Protocol Layer Changes

All changes in `tallow-protocol` and `tallow-crypto`. No CLI changes yet.
These tasks can execute in parallel (except where noted).

### Task 1.1: Add Domain Separation Constants

**File**: `E:\Tallow\crates\tallow-crypto\src\hash\domain.rs`

**Changes**: Append four new domain constants after the existing `DOMAIN_SAS`:

```rust
/// Domain separator for handshake transcript hashing
pub const DOMAIN_HANDSHAKE_TRANSCRIPT: &str = "tallow.handshake.transcript.v1";

/// Domain separator for session key derivation from KEM + PAKE
pub const DOMAIN_SESSION_KEY_KEM_PAKE: &str = "tallow.session_key.kem_pake.v3";

/// Domain separator for sender key confirmation tag
pub const DOMAIN_KEY_CONFIRM_SENDER: &str = "tallow.key_confirm.sender.v1";

/// Domain separator for receiver key confirmation tag
pub const DOMAIN_KEY_CONFIRM_RECEIVER: &str = "tallow.key_confirm.receiver.v1";
```

**Dependencies**: None
**Verification**: `cargo test -p tallow-crypto` (existing tests still pass)

---

### Task 1.2: Add Handshake Message Variants

**File**: `E:\Tallow\crates\tallow-protocol\src\wire\messages.rs`

**Changes**: Add five new variants to the `Message` enum, placed after `Pong`:

```rust
/// Handshake initiation (sender -> receiver)
///
/// Carries CPace initiator public message, KEM capability negotiation,
/// and a random nonce for session ID binding.
HandshakeInit {
    /// Protocol version for this handshake (2 = KEM handshake)
    protocol_version: u32,
    /// Serialized KemCapabilities (supported algorithms)
    kem_capabilities: Vec<u8>,
    /// CPace initiator public message (Ristretto255 point, 32 bytes)
    cpace_public: [u8; 32],
    /// Random nonce for session ID binding (16 bytes)
    nonce: [u8; 16],
},

/// Handshake response (receiver -> sender)
///
/// Carries CPace responder public message, selected KEM algorithm,
/// the receiver's ephemeral hybrid KEM public key, and a random nonce.
HandshakeResponse {
    /// Selected KEM algorithm discriminant
    selected_kem: u8,
    /// CPace responder public message (32 bytes)
    cpace_public: [u8; 32],
    /// Serialized hybrid KEM public key
    kem_public_key: Vec<u8>,
    /// Random nonce for session ID binding (16 bytes)
    nonce: [u8; 16],
},

/// KEM encapsulation + sender key confirmation (sender -> receiver)
HandshakeKem {
    /// Serialized hybrid KEM ciphertext
    kem_ciphertext: Vec<u8>,
    /// Sender's key confirmation tag (BLAKE3 keyed MAC, 32 bytes)
    confirmation: [u8; 32],
},

/// Handshake completion with receiver key confirmation (receiver -> sender)
HandshakeComplete {
    /// Receiver's key confirmation tag (BLAKE3 keyed MAC, 32 bytes)
    confirmation: [u8; 32],
},

/// Handshake failure (either direction)
///
/// The reason string MUST NOT distinguish PAKE failure from KEM failure
/// to avoid oracle attacks.
HandshakeFailed {
    /// Generic failure reason
    reason: String,
},
```

Also update the `test_message_roundtrip_all_variants` test to include round-trip
coverage for all five new variants. Add them to the `messages` vec with representative
data (e.g., `HandshakeInit { protocol_version: 2, kem_capabilities: vec![0,1,2], cpace_public: [0xAA; 32], nonce: [0xBB; 16] }`).

**Dependencies**: None
**Verification**: `cargo test -p tallow-protocol -- test_message_roundtrip_all_variants`

---

### Task 1.3: Add Protocol Error Variants for Handshake

**File**: `E:\Tallow\crates\tallow-protocol\src\error.rs`

**Changes**: Add two new variants to `ProtocolError`:

```rust
/// Handshake failed (generic -- MUST NOT leak whether PAKE or KEM caused it)
HandshakeFailed(String),

/// Key confirmation mismatch
KeyConfirmationFailed,
```

Update the `Display` impl:
- `HandshakeFailed(msg)` -> `"Handshake failed: {msg}"`
- `KeyConfirmationFailed` -> `"Handshake failed: key confirmation mismatch"`

**Dependencies**: None
**Verification**: `cargo test -p tallow-protocol` (compile check)

---

### Task 1.4: Bump Protocol Version

**File**: `E:\Tallow\crates\tallow-protocol\src\wire\version.rs`

**Changes**:
- Change `PROTOCOL_VERSION` from `1` to `2`
- Keep `MIN_PROTOCOL_VERSION` at `1` (for backward compatibility detection -- old
  clients will send version 1, new clients will reject with a clear error)
- Update `version_request()` to include both versions: `vec![1, 2]`
- Update tests to reflect the new version

**Dependencies**: None
**Verification**: `cargo test -p tallow-protocol -- version`

---

### Task 1.5: Build Handshake State Machine in kex.rs

**File**: `E:\Tallow\crates\tallow-protocol\src\kex.rs`

This is the largest task. Rewrite `kex.rs` to add the handshake orchestrators while
keeping the old `derive_session_key_from_phrase` and `derive_session_key_with_salt`
functions (marked `#[deprecated]`).

**New types and functions to add**:

#### 1. `HandshakeTranscript` (private helper)

An append-only byte buffer that accumulates all handshake messages for binding.

```rust
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
        buffer.extend_from_slice(
            tallow_crypto::hash::domain::DOMAIN_HANDSHAKE_TRANSCRIPT.as_bytes()
        );
        Self { buffer }
    }

    fn append(&mut self, data: &[u8]) {
        // Length-prefix each field to prevent ambiguity
        self.buffer.extend_from_slice(&(data.len() as u32).to_le_bytes());
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
```

#### 2. `SessionKey::from_bytes(key: [u8; 32]) -> Self`

Add a constructor to the existing `SessionKey`:

```rust
/// Create a session key from raw bytes
///
/// # Security
///
/// The caller is responsible for ensuring the bytes come from a
/// cryptographically secure key derivation process.
pub fn from_bytes(key: [u8; 32]) -> Self {
    Self { key }
}
```

#### 3. `SenderHandshake` struct

```rust
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
```

Methods:

- `pub fn new(code_phrase: &str, room_id: &[u8; 32]) -> Self`
  - Generate 16-byte random nonce via `rand::random()`
  - Initialize empty transcript

- `pub fn init(&mut self) -> Result<Message>`
  - Build session_id = `room_id || nonce` (partial -- receiver nonce added later)
  - Create `CpaceInitiator::new(code_phrase, &session_id_partial)`
  - Get CPace public message (32 bytes)
  - Serialize `KemCapabilities::all()` via postcard
  - Append cpace_public and nonce to transcript
  - Return `Message::HandshakeInit { protocol_version: 2, kem_capabilities, cpace_public, nonce }`
  - Store `CpaceState::Initiator(initiator)` in `self.cpace_state`

- `pub fn process_response(&mut self, selected_kem: u8, cpace_public: &[u8; 32], kem_public_key: &[u8], nonce: &[u8; 16]) -> Result<(Message, SessionKey)>`
  - Take cpace_state, complete CPace with responder's public -> `pake_secret: [u8; 32]`
  - Build full session_id = `room_id || self.nonce || nonce` (for future CPace binding -- note: CPace was already initialized with partial session_id, this is for transcript only)
  - Append responder's cpace_public, nonce, and kem_public_key to transcript
  - Deserialize `hybrid::PublicKey` from `kem_public_key` via postcard
  - Call `HybridKem::encapsulate(&pk)` -> `(ciphertext, kem_shared_secret)`
  - Serialize ciphertext via postcard
  - Append serialized ciphertext to transcript
  - Compute `transcript_hash = BLAKE3(transcript)`
  - Build IKM = `kem_shared_secret.expose_secret() || pake_secret` (64 bytes)
  - Derive session key: `HKDF-SHA256(salt=transcript_hash, ikm=ikm, info=DOMAIN_SESSION_KEY_KEM_PAKE, len=32)`
  - Compute sender confirmation: `BLAKE3_keyed(session_key, DOMAIN_KEY_CONFIRM_SENDER || transcript_hash)`
  - Zeroize `pake_secret` and `ikm`
  - Store `session_key_bytes` and `transcript_hash` for later verification
  - Return `(Message::HandshakeKem { kem_ciphertext, confirmation }, SessionKey::from_bytes(key))`

- `pub fn verify_receiver_confirmation(&self, their_confirmation: &[u8; 32]) -> Result<()>`
  - Compute expected: `BLAKE3_keyed(session_key_bytes, DOMAIN_KEY_CONFIRM_RECEIVER || transcript_hash)`
  - Compare with `subtle::ConstantTimeEq`
  - On mismatch: return `Err(ProtocolError::KeyConfirmationFailed)`

- `impl Drop for SenderHandshake` -- zeroize `code_phrase` bytes, `nonce`, `session_key_bytes`, `transcript_hash`

#### 4. `ReceiverHandshake` struct

```rust
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
```

Methods:

- `pub fn new(code_phrase: &str, room_id: &[u8; 32]) -> Self`
  - Generate 16-byte random nonce

- `pub fn process_init(&mut self, protocol_version: u32, kem_capabilities: &[u8], cpace_public: &[u8; 32], sender_nonce: &[u8; 16]) -> Result<Message>`
  - Validate `protocol_version >= 2` (else return `ProtocolError::VersionMismatch`)
  - Build session_id = `room_id || sender_nonce` (matching what initiator used)
  - Create `CpaceResponder::new(code_phrase, &session_id)`
  - Get CPace responder public message
  - Complete CPace with initiator's `cpace_public` -> `pake_secret`
  - Store `pake_secret`
  - Append initiator's cpace_public and sender_nonce to transcript (same order as sender)
  - Append responder's cpace_public and self.nonce to transcript
  - Deserialize `KemCapabilities` from `kem_capabilities`, negotiate with `KemCapabilities::all()` -> selected algorithm
  - Generate ephemeral KEM keypair: `HybridKem::keygen()` -> `(pk, sk)`
  - Store `sk` in `self.kem_secret_key`
  - Serialize `pk` via postcard
  - Append serialized pk to transcript
  - Return `Message::HandshakeResponse { selected_kem, cpace_public, kem_public_key, nonce: self.nonce }`

- `pub fn process_kem(&mut self, kem_ciphertext: &[u8], sender_confirmation: &[u8; 32]) -> Result<(Message, SessionKey)>`
  - Take `kem_secret_key`, deserialize ciphertext from postcard
  - Call `HybridKem::decapsulate(&sk, &ct)` -> `kem_shared_secret`
  - Append `kem_ciphertext` to transcript (raw bytes, same as sender serialized them)
  - Compute `transcript_hash = BLAKE3(transcript)`
  - Take `pake_secret`
  - Build IKM = `kem_shared_secret.expose_secret() || pake_secret` (64 bytes)
  - Derive session key: `HKDF-SHA256(salt=transcript_hash, ikm=ikm, info=DOMAIN_SESSION_KEY_KEM_PAKE, len=32)`
  - Verify sender's confirmation tag:
    - Expected = `BLAKE3_keyed(session_key, DOMAIN_KEY_CONFIRM_SENDER || transcript_hash)`
    - Compare with `subtle::ConstantTimeEq`
    - On mismatch: return `Err(ProtocolError::KeyConfirmationFailed)` (generic error, no oracle)
  - Compute receiver confirmation: `BLAKE3_keyed(session_key, DOMAIN_KEY_CONFIRM_RECEIVER || transcript_hash)`
  - Zeroize `pake_secret` and `ikm`
  - Return `(Message::HandshakeComplete { confirmation }, SessionKey::from_bytes(key))`

- `impl Drop for ReceiverHandshake` -- zeroize `code_phrase` bytes, `nonce`, `pake_secret`

#### 5. Deprecate old functions

Add `#[deprecated(since = "2.0.0", note = "Use SenderHandshake/ReceiverHandshake for KEM-based key exchange")]`
to both `derive_session_key_from_phrase` and `derive_session_key_with_salt`. Do NOT
remove them yet (backward compat for one release cycle).

#### 6. Keep existing CPace helpers and tests

The `start_cpace_initiator`, `start_cpace_responder`, `complete_cpace`, and `CpaceState`
are still used internally. Keep them but make them `pub(crate)` instead of `pub` since
the handshake structs encapsulate them.

#### 7. Update existing tests, add new tests

Keep all existing kex tests (they test deprecated functions but should still pass with
`#[allow(deprecated)]`).

Add new tests:

- `test_kem_handshake_roundtrip`: Full 4-message handshake between SenderHandshake and
  ReceiverHandshake with same code phrase -> both derive identical session keys
- `test_kem_handshake_wrong_password`: Different code phrases -> key confirmation fails
  with `KeyConfirmationFailed` (not a silent wrong key)
- `test_kem_handshake_ephemeral_keys`: Two consecutive handshakes with the same code phrase
  produce different session keys (proving ephemeral KEM)
- `test_kem_handshake_transcript_binding`: Tamper with a transcript field (e.g., flip a
  byte in the serialized KEM public key after receiver sends it) -> verification fails

**Dependencies**: Tasks 1.1, 1.2, 1.3
**Verification**: `cargo test -p tallow-protocol -- kex`

---

### Task 1.6: Export New Types from tallow-protocol

**File**: `E:\Tallow\crates\tallow-protocol\src\kex.rs` (already modified in 1.5)

Ensure these are `pub`:
- `SenderHandshake`
- `ReceiverHandshake`
- `SessionKey` (already pub)
- `SessionKey::from_bytes`

**File**: `E:\Tallow\crates\tallow-protocol\src\lib.rs`

No changes needed -- `kex` module is already `pub mod kex`.

**Dependencies**: Task 1.5
**Verification**: `cargo build --workspace`

---

## Wave 2: Integration

Wire the handshake into all CLI commands that derive session keys. Each command
follows the same pattern: after `PeerArrived` / peer connection, run the 4-message
handshake before `FileOffer`.

### Task 2.1: Integrate Handshake into send.rs

**File**: `E:\Tallow\crates\tallow\src\commands\send.rs`

**Changes**:

1. Remove the early `derive_session_key_with_salt` call (line ~205-206). The session key
   is now derived during the handshake, after the peer connects.

2. After the "Peer connected!" output (line ~372), insert the handshake sequence:

```rust
// --- KEM Handshake (replaces code-phrase-derived key) ---
let mut handshake = tallow_protocol::kex::SenderHandshake::new(&code_phrase, &room_id);

// Step 1: Send HandshakeInit
let init_msg = handshake.init()
    .map_err(|e| io::Error::other(format!("Handshake init failed: {}", e)))?;
encode_buf.clear();
codec.encode_msg(&init_msg, &mut encode_buf)
    .map_err(|e| io::Error::other(format!("Encode HandshakeInit: {}", e)))?;
relay.forward(&encode_buf).await
    .map_err(|e| io::Error::other(format!("Send HandshakeInit: {}", e)))?;

// Step 2: Receive HandshakeResponse
let n = relay.receive(&mut recv_buf).await
    .map_err(|e| io::Error::other(format!("Receive HandshakeResponse: {}", e)))?;
let mut decode_buf = BytesMut::from(&recv_buf[..n]);
let resp_msg = codec.decode_msg(&mut decode_buf)
    .map_err(|e| io::Error::other(format!("Decode HandshakeResponse: {}", e)))?;

let (selected_kem, resp_cpace, resp_kem_pk, resp_nonce) = match resp_msg {
    Some(Message::HandshakeResponse { selected_kem, cpace_public, kem_public_key, nonce }) => {
        (selected_kem, cpace_public, kem_public_key, nonce)
    }
    Some(Message::HandshakeFailed { reason }) => {
        let safe = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
        relay.close().await;
        return Err(io::Error::other(format!("Handshake failed: {}", safe)));
    }
    // Old client detection: if FileOffer arrives instead of HandshakeResponse,
    // the peer is using the old protocol
    Some(Message::FileOffer { .. }) => {
        relay.close().await;
        return Err(io::Error::other(
            "Protocol version mismatch: peer uses old key exchange. \
             Both sides must upgrade to tallow v2.0+"
        ));
    }
    other => {
        relay.close().await;
        return Err(io::Error::other(format!("Expected HandshakeResponse, got: {:?}", other)));
    }
};

// Step 3: Process response -> send HandshakeKem
let (kem_msg, session_key) = handshake.process_response(
    selected_kem, &resp_cpace, &resp_kem_pk, &resp_nonce
).map_err(|e| io::Error::other(format!("Handshake KEM failed: {}", e)))?;

encode_buf.clear();
codec.encode_msg(&kem_msg, &mut encode_buf)
    .map_err(|e| io::Error::other(format!("Encode HandshakeKem: {}", e)))?;
relay.forward(&encode_buf).await
    .map_err(|e| io::Error::other(format!("Send HandshakeKem: {}", e)))?;

// Step 4: Receive HandshakeComplete
let n = relay.receive(&mut recv_buf).await
    .map_err(|e| io::Error::other(format!("Receive HandshakeComplete: {}", e)))?;
let mut decode_buf = BytesMut::from(&recv_buf[..n]);
let complete_msg = codec.decode_msg(&mut decode_buf)
    .map_err(|e| io::Error::other(format!("Decode HandshakeComplete: {}", e)))?;

match complete_msg {
    Some(Message::HandshakeComplete { confirmation }) => {
        handshake.verify_receiver_confirmation(&confirmation)
            .map_err(|e| io::Error::other(format!("Key confirmation failed: {}", e)))?;
    }
    Some(Message::HandshakeFailed { reason }) => {
        let safe = tallow_protocol::transfer::sanitize::sanitize_display(&reason);
        relay.close().await;
        return Err(io::Error::other(format!("Handshake failed: {}", safe)));
    }
    other => {
        relay.close().await;
        return Err(io::Error::other(format!("Expected HandshakeComplete, got: {:?}", other)));
    }
};

if !json {
    output::color::success("Secure session established (KEM handshake complete)");
}
// --- End handshake ---
```

3. Move `transfer_id` generation AFTER the handshake (it is no longer used for key
   derivation). Keep `transfer_id` as a random identifier for the FileOffer, but it
   no longer influences the session key.

4. Move `SendPipeline::new(transfer_id, *session_key.as_bytes())` to after the handshake.

5. Move `recv_buf` allocation to before the handshake (it is currently allocated after
   FileOffer -- line 401). The handshake needs recv_buf.

6. The verification string display (lines 376-382) should use the KEM-derived session
   key, which now comes from the handshake. Move it after the handshake.

**Dependencies**: Tasks 1.2, 1.3, 1.5
**Verification**: `cargo build -p tallow` (compile check; full test requires relay)

---

### Task 2.2: Integrate Handshake into receive.rs

**File**: `E:\Tallow\crates\tallow\src\commands\receive.rs`

**Changes**:

1. After "Peer connected!" output (line ~144), insert the receiver handshake:

```rust
// --- KEM Handshake ---
let mut handshake = tallow_protocol::kex::ReceiverHandshake::new(&code_phrase, &room_id);

// Step 1: Receive HandshakeInit (or detect old protocol)
let n = relay.receive(&mut recv_buf).await
    .map_err(|e| io::Error::other(format!("Receive handshake: {}", e)))?;
let mut decode_buf = BytesMut::from(&recv_buf[..n]);
let init_msg = codec.decode_msg(&mut decode_buf)
    .map_err(|e| io::Error::other(format!("Decode handshake: {}", e)))?;

match init_msg {
    Some(Message::HandshakeInit { protocol_version, kem_capabilities, cpace_public, nonce }) => {
        // Step 2: Process init -> send HandshakeResponse
        let resp = handshake.process_init(
            protocol_version, &kem_capabilities, &cpace_public, &nonce
        ).map_err(|e| {
            // Send failure notification to peer
            io::Error::other(format!("Handshake init processing failed: {}", e))
        })?;

        encode_buf.clear();
        codec.encode_msg(&resp, &mut encode_buf)
            .map_err(|e| io::Error::other(format!("Encode HandshakeResponse: {}", e)))?;
        relay.forward(&encode_buf).await
            .map_err(|e| io::Error::other(format!("Send HandshakeResponse: {}", e)))?;

        // Step 3: Receive HandshakeKem
        let n = relay.receive(&mut recv_buf).await
            .map_err(|e| io::Error::other(format!("Receive HandshakeKem: {}", e)))?;
        let mut decode_buf = BytesMut::from(&recv_buf[..n]);
        let kem_msg = codec.decode_msg(&mut decode_buf)
            .map_err(|e| io::Error::other(format!("Decode HandshakeKem: {}", e)))?;

        match kem_msg {
            Some(Message::HandshakeKem { kem_ciphertext, confirmation }) => {
                let (complete_msg, session_key_result) = handshake.process_kem(
                    &kem_ciphertext, &confirmation
                ).map_err(|e| io::Error::other(format!("Handshake KEM failed: {}", e)))?;

                // Step 4: Send HandshakeComplete
                encode_buf.clear();
                codec.encode_msg(&complete_msg, &mut encode_buf)
                    .map_err(|e| io::Error::other(format!("Encode HandshakeComplete: {}", e)))?;
                relay.forward(&encode_buf).await
                    .map_err(|e| io::Error::other(format!("Send HandshakeComplete: {}", e)))?;

                // session_key_result is now available for use
                session_key = session_key_result;
            }
            other => {
                relay.close().await;
                return Err(io::Error::other(
                    format!("Expected HandshakeKem, got: {:?}", other)
                ));
            }
        }
    }
    // Old protocol detection: sender sent FileOffer directly (no handshake)
    Some(Message::FileOffer { .. }) => {
        relay.close().await;
        return Err(io::Error::other(
            "Protocol version mismatch: peer uses old key exchange. \
             Both sides must upgrade to tallow v2.0+"
        ));
    }
    other => {
        relay.close().await;
        return Err(io::Error::other(
            format!("Expected HandshakeInit, got: {:?}", other)
        ));
    }
}

if !json {
    output::color::success("Secure session established (KEM handshake complete)");
}
// --- End handshake ---
```

2. Remove the `derive_session_key_with_salt` call (lines ~177-178). The `session_key`
   variable is now produced by the handshake above.

3. Declare `let session_key: tallow_protocol::kex::SessionKey;` before the handshake
   block and assign inside the match arm.

4. The `transfer_id` is now obtained from the `FileOffer` message (which comes AFTER
   the handshake). Keep the existing `FileOffer` receive logic after the handshake.

5. The verification display should use the KEM-derived session key. Move it after
   the handshake.

**Dependencies**: Tasks 1.2, 1.3, 1.5
**Verification**: `cargo build -p tallow`

---

### Task 2.3: Integrate Handshake into clip.rs

**File**: `E:\Tallow\crates\tallow\src\commands\clip.rs`

**Changes**: Apply the same handshake pattern to both `execute_send` and `execute_receive`.

**execute_send** (sender side, starting around line ~180):
- Remove `derive_session_key_with_salt` call (line ~153-154)
- After peer connected, insert the SenderHandshake 4-step sequence (same as Task 2.1)
- Move `SendPipeline::new(...)` after handshake

**execute_receive** (receiver side, around line ~414):
- Remove `derive_session_key_with_salt` call (line ~438-439)
- After peer connected, insert the ReceiverHandshake 4-step sequence (same as Task 2.2)
- Move `ReceivePipeline::new(...)` after handshake

**Dependencies**: Tasks 1.2, 1.3, 1.5
**Verification**: `cargo build -p tallow`

---

### Task 2.4: Integrate Handshake into sync.rs

**File**: `E:\Tallow\crates\tallow\src\commands\sync.rs`

**Changes**:
- Remove `derive_session_key_with_salt` call (line ~60-61)
- After "Peer connected!" (line ~138), insert SenderHandshake 4-step sequence
- The sync command acts as sender (initiator), so it uses `SenderHandshake`
- Move `SendPipeline::new(transfer_id, *session_key.as_bytes())` after handshake
- Update `handle_manifest_exchange` to receive the handshake-derived session_key
- The delta_pipeline also uses the handshake-derived session_key

**Dependencies**: Tasks 1.2, 1.3, 1.5
**Verification**: `cargo build -p tallow`

---

### Task 2.5: Integrate Handshake into watch.rs

**File**: `E:\Tallow\crates\tallow\src\commands\watch.rs`

**Changes**:
- After "Peer connected!" (line ~112), insert SenderHandshake 4-step sequence
- The watch command performs ONE handshake at connection time, then reuses the
  session key for all subsequent batches (this is correct -- the KEM provides
  the ephemeral key, each batch still gets a unique transfer_id for its nonce
  counter reset)
- Remove `derive_session_key_with_salt` inside the event loop (line ~156-160)
- Use the handshake-derived session_key for all `SendPipeline::new(...)` calls
  inside the event loop

**Dependencies**: Tasks 1.2, 1.3, 1.5
**Verification**: `cargo build -p tallow`

---

### Task 2.6: Handle Handshake Timeout

**Files**:
- `E:\Tallow\crates\tallow\src\commands\send.rs`
- `E:\Tallow\crates\tallow\src\commands\receive.rs`
- `E:\Tallow\crates\tallow\src\commands\clip.rs`
- `E:\Tallow\crates\tallow\src\commands\sync.rs`
- `E:\Tallow\crates\tallow\src\commands\watch.rs`

**Changes**: Wrap each `relay.receive()` call during the handshake with
`tokio::time::timeout(Duration::from_secs(30), ...)`. If the timeout fires,
send `HandshakeFailed { reason: "handshake timeout" }` and close the relay.

Use a 30-second timeout (generous for high-latency links, but prevents hanging
indefinitely). The 500ms target is for the handshake computation + network, not
for waiting for the peer to respond -- the peer may be slow to start.

**Dependencies**: Tasks 2.1-2.5
**Verification**: `cargo build -p tallow`

---

## Wave 3: Tests + Backward Compatibility

### Task 3.1: Unit Tests for Handshake State Machine

**File**: `E:\Tallow\crates\tallow-protocol\src\kex.rs` (test module)

**New tests** (in addition to those from Task 1.5):

- `test_kem_handshake_message_serialization`: Verify each handshake message
  round-trips through postcard correctly (encode -> decode -> compare)
- `test_sender_handshake_double_init_fails`: Calling `init()` twice panics or
  returns an error (state machine enforces single use)
- `test_receiver_handshake_out_of_order`: Calling `process_kem` before
  `process_init` returns an error
- `test_kem_negotiation_classical_fallback`: When receiver only supports X25519
  and sender supports all, negotiation selects X25519 (currently the HybridKem
  is always used, but the negotiation field is sent -- verify the field is correct)

**Dependencies**: Task 1.5
**Verification**: `cargo test -p tallow-protocol -- kex`

---

### Task 3.2: Backward Compatibility Detection Tests

**File**: `E:\Tallow\crates\tallow-protocol\src\kex.rs` (test module)

**New tests**:

- `test_old_protocol_detection_receiver_gets_file_offer`: Simulate an old sender
  by sending a `FileOffer` message (serialized via postcard) as the first message
  after peer connection. The receiver handshake logic should detect this and
  return an error containing "version mismatch" (not panic, not silent failure).

- `test_old_protocol_detection_sender_gets_file_offer`: Simulate an old receiver
  that sends a `FileOffer` instead of `HandshakeResponse`. The sender handshake
  logic should detect this and return an error.

- `test_version_negotiation_reject_v1_only`: A peer advertising only version 1
  should be rejected by the new protocol.

**Dependencies**: Tasks 1.2, 1.4, 1.5
**Verification**: `cargo test -p tallow-protocol -- old_protocol`

---

### Task 3.3: Workspace Compilation and Clippy

**Changes**: None (verification only)

**Verification**:
1. `cargo build --workspace` -- everything compiles
2. `cargo clippy --workspace -- -D warnings` -- no warnings (deprecated function
   usage in tests should use `#[allow(deprecated)]`)
3. `cargo fmt --check` -- formatting clean
4. `cargo test --workspace` -- all tests pass

**Dependencies**: All previous tasks
**Verification**: Commands above

---

### Task 3.4: Suppress Deprecation Warnings in Existing Code

**Files**: Any file that still calls `derive_session_key_with_salt` or
`derive_session_key_from_phrase` after integration (should be none after Wave 2,
but check). If any tests reference these functions, add `#[allow(deprecated)]`
to the test functions.

**Dependencies**: Tasks 2.1-2.5, 3.3
**Verification**: `cargo clippy --workspace -- -D warnings`

---

## Success Criteria Mapping

| Criterion | Tasks That Satisfy It |
|-----------|----------------------|
| **1. Session keys differ even with same code phrase** | Task 1.5 (`test_kem_handshake_ephemeral_keys`) -- HybridKem generates fresh ephemeral keys per call, so two handshakes with the same code phrase produce different session keys |
| **2. Code phrase used for PAKE authentication, not key derivation; incorrect code phrase gives clear error** | Task 1.5 (`process_kem` verifies sender's confirmation tag, returns `KeyConfirmationFailed`); Tasks 2.1/2.2 surface this as a user-visible error |
| **3. Ephemeral KEM keys generated per-transfer and zeroized** | Task 1.5 (`HybridKem::keygen()` per handshake, `SecretKey` has `#[zeroize(drop)]`, `ReceiverHandshake` Drop impl zeroizes all secret fields) |
| **4. Handshake under 500ms on 100ms RTT** | Research doc shows ~202ms (2 RT + ~2ms compute). No extra round trips added. Task 2.6 adds timeout as safety net. |
| **5. Old-format transfers detected and rejected with version mismatch error** | Tasks 2.1/2.2 (detect `FileOffer` where `HandshakeInit`/`HandshakeResponse` expected); Task 3.2 (tests) |

---

## Key Constraints Checklist

| Constraint | How Satisfied |
|-----------|---------------|
| `#![forbid(unsafe_code)]` | No unsafe code added anywhere. tallow-protocol already has `#![forbid(unsafe_code)]` |
| `thiserror` for errors | New error variants added to existing `ProtocolError` enum (Task 1.3). No `anyhow` in library crates |
| No `.unwrap()` outside tests | All handshake methods return `Result<T>`. No unwrap in non-test code |
| Key material uses `zeroize` | `SecretKey` has `#[zeroize(drop)]`, `HandshakeTranscript` zeroizes buffer on drop, `SenderHandshake`/`ReceiverHandshake` implement Drop with zeroize, intermediate IKM buffers explicitly zeroized |
| `subtle::ConstantTimeEq` for secrets | Key confirmation tags compared with `ct_eq()` (Task 1.5) |
| No `println!` | All user output via `output::color::*` and `tracing::*` |
| `SecretBox` where possible | `SharedSecret` already wraps `[u8; 32]` with zeroize-on-drop. `SessionKey` has zeroize-on-drop. The handshake state holds raw bytes but with explicit Drop impls -- `SecretBox` is not used because the state machine needs mutable access and `SecretBox` doesn't support partial field zeroization |

---

## Files Modified Summary

### tallow-crypto (Wave 1)
- `crates/tallow-crypto/src/hash/domain.rs` -- 4 new constants

### tallow-protocol (Wave 1)
- `crates/tallow-protocol/src/wire/messages.rs` -- 5 new Message variants + test updates
- `crates/tallow-protocol/src/error.rs` -- 2 new error variants
- `crates/tallow-protocol/src/wire/version.rs` -- version bump to 2
- `crates/tallow-protocol/src/kex.rs` -- major rewrite: SenderHandshake, ReceiverHandshake, HandshakeTranscript, SessionKey::from_bytes, deprecate old functions, new tests

### tallow (Wave 2)
- `crates/tallow/src/commands/send.rs` -- handshake integration
- `crates/tallow/src/commands/receive.rs` -- handshake integration
- `crates/tallow/src/commands/clip.rs` -- handshake integration (send + receive)
- `crates/tallow/src/commands/sync.rs` -- handshake integration
- `crates/tallow/src/commands/watch.rs` -- handshake integration

### No files created
All changes are edits to existing files. No new files needed.

### No relay changes
The relay server (`tallow-relay`) is not modified. It forwards opaque bytes.

---

## Execution Order

```
Wave 1 (parallel where possible):
  Task 1.1 (domain constants)     --|
  Task 1.2 (message variants)     --|--> can run in parallel
  Task 1.3 (error variants)       --|
  Task 1.4 (version bump)         --|
  Task 1.5 (handshake state machine) --> depends on 1.1, 1.2, 1.3
  Task 1.6 (export check)            --> depends on 1.5

Wave 2 (parallel, all depend on Wave 1):
  Task 2.1 (send.rs)              --|
  Task 2.2 (receive.rs)           --|--> can run in parallel
  Task 2.3 (clip.rs)              --|
  Task 2.4 (sync.rs)              --|
  Task 2.5 (watch.rs)             --|
  Task 2.6 (timeouts)             --> depends on 2.1-2.5

Wave 3 (sequential):
  Task 3.1 (unit tests)           --> depends on Wave 1
  Task 3.2 (backward compat tests)--> depends on Wave 1
  Task 3.3 (workspace build/lint) --> depends on all
  Task 3.4 (deprecation cleanup)  --> depends on 3.3
```

---

## Risk Notes

1. **Postcard enum discriminants**: Adding 5 variants to the `Message` enum changes
   postcard's integer discriminants for subsequent variants. Since there are no deployed
   clients yet (Phase 11 is pre-release), this is not a wire compatibility concern.
   If there were deployed clients, we would need to pin discriminants with
   `#[serde(rename = "...")]` or use a TLV extension.

2. **CPace session_id construction**: The initiator creates the CPace instance with
   `session_id = room_id || sender_nonce` before knowing the receiver's nonce. The
   receiver uses the same partial session_id. Both nonces are included in the transcript
   for binding. This is secure because the CPace generator is derived from `session_id`,
   and the transcript hash binds both nonces to the final key. However, if we later
   want to include both nonces in the CPace session_id, we would need a third round trip
   (sender sends nonce, receiver responds with nonce, then CPace begins). This is
   intentionally not done to stay within 2 round trips.

3. **Watch mode session key reuse**: In watch mode, one handshake produces one session
   key, but multiple mini-transfers (batches) use it. Each batch has a unique
   `transfer_id` which resets the AES-GCM nonce counter. This is safe because
   `transfer_id` is included in the chunk AAD, preventing cross-batch chunk swapping.
   However, there is no forward secrecy between batches within a watch session. This
   is an acceptable tradeoff documented here.
