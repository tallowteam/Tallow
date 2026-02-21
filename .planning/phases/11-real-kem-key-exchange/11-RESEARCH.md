# Phase 11 Research: Real KEM Key Exchange

## Standard Stack

### Existing Primitives in tallow-crypto (Ready to Wire)

| Primitive | Module | API Status | Notes |
|-----------|--------|------------|-------|
| ML-KEM-1024 | `kem::mlkem::MlKem` | Complete | `keygen()`, `encapsulate()`, `decapsulate()` via fips203 v0.4 |
| X25519 | `kem::x25519::X25519KeyPair` | Complete | `generate()`, `diffie_hellman()`, low-order point rejection |
| Hybrid KEM | `kem::hybrid::HybridKem` | Complete | `keygen()`, `encapsulate()`, `decapsulate()` with BLAKE3 combiner |
| CPace PAKE | `pake::cpace` | Complete | `CpaceInitiator`, `CpaceResponder` over Ristretto255 |
| HKDF-SHA256 | `kdf::hkdf::derive()` | Complete | Salt, IKM, info, variable-length output |
| BLAKE3 KDF | `hash::blake3::derive_key()` | Complete | Context-string domain separation |
| KEM Negotiation | `kem::negotiation` | Complete | `KemCapabilities` + `negotiate()` for algorithm selection |

### External Standards Referenced

- **FIPS 203** (ML-KEM-1024): NIST post-quantum KEM standard, implemented via `fips203` crate v0.4
- **RFC 7748** (X25519): Elliptic curve Diffie-Hellman
- **X-Wing** (draft-connolly-cfrg-xwing-kem-09): IETF draft for general-purpose hybrid PQ/T KEM combining ML-KEM-768 + X25519. Tallow uses ML-KEM-1024 (not 768) for Security Level 5, so X-Wing is informational, not directly applicable, but its combiner design (SHA3-256 with label + both shared secrets + X25519 ephemeral pubkey) is a useful reference
- **CPace** (draft-irtf-cfrg-cpace): Balanced PAKE over Ristretto255, already implemented
- **CPaceOQUAKE** (draft-vos-cfrg-pqpake-00): Hybrid post-quantum PAKE combining CPace with a KEM-based construction. This is the closest standardized protocol to what Tallow needs -- a PAKE that authenticates a KEM exchange
- **IETF TLS 1.3 hybrid** (draft-ietf-tls-ecdhe-mlkem-04): Standard pattern for concatenating classical + PQ KEM components
- **IETF SSH hybrid** (draft-ietf-sshm-mlkem-hybrid-kex-09): SSH pattern where client sends ML-KEM encaps key, server returns ciphertext, both combine shared secrets

### Crate Versions (Current in Cargo.toml)

- `fips203 = "0.4"` -- ML-KEM-1024 (FIPS 203 final)
- `x25519-dalek` -- X25519 ECDH
- `curve25519-dalek` -- Ristretto255 for CPace
- `hkdf` + `sha2` -- HKDF-SHA256
- `blake3` -- BLAKE3 hashing/KDF
- `zeroize` -- Secure memory wiping
- `postcard` -- Wire serialization (already handles serde for all types)

No new crate dependencies are required for Phase 11.

## Architecture Patterns

### Pattern 1: PAKE-then-KEM (Recommended)

The handshake runs in two logical phases over the relay:

1. **CPace authentication phase** (1 round trip): Both peers prove knowledge of the code phrase. This produces a PAKE shared secret used solely for key confirmation -- not for encrypting data.
2. **Hybrid KEM phase** (1 round trip): The receiver generates an ephemeral ML-KEM-1024 + X25519 keypair, sends the public key. The sender encapsulates to that public key, sends back the ciphertext. Both sides derive the KEM shared secret.
3. **Key combination**: The final session key is derived by combining the PAKE output and the KEM output via HKDF-SHA256, binding the full handshake transcript.

This is the CPaceOQUAKE pattern: PAKE provides authentication (mutual proof of code phrase knowledge), KEM provides the actual key material with forward secrecy.

**Why not KEM-then-PAKE**: The PAKE must run first because it establishes that both peers know the code phrase before any KEM material is exchanged. If KEM runs first, an attacker in the relay position could substitute their own KEM public key (classic MITM) and the PAKE would run over an attacker-controlled channel.

**Why not PAKE-only**: The existing code-phrase-derived key approach is essentially PAKE-only. The problem is that code phrases have limited entropy (typically 40-60 bits for 4-word phrases). While CPace prevents offline dictionary attacks, the session key's strength is bounded by the code phrase entropy. Adding KEM means the session key has full 256-bit security from the ephemeral KEM, with the PAKE providing authentication only.

### Pattern 2: Handshake State Machine

The handshake should be a state machine in `tallow-protocol` (not in the CLI binary), with states:

```
Idle -> AwaitingPake -> AwaitingKem -> Established -> Failed
```

Both sender and receiver use the same state machine with role-specific transitions:

- **Sender (Initiator)**: Idle -> send CPace initiator msg -> AwaitingPake -> receive CPace responder msg + send KEM encapsulation -> AwaitingKem -> receive key confirmation -> Established
- **Receiver (Responder)**: Idle -> receive CPace initiator msg + send CPace responder msg -> AwaitingPake -> receive KEM ciphertext + send key confirmation -> Established

### Pattern 3: Message-Oriented Handshake

The handshake uses the existing `Message` enum with new variants, sent through the relay using the existing `TallowCodec`. The relay sees only opaque messages -- it does not need to understand handshake semantics.

### Pattern 4: Transcript Binding

All handshake messages are hashed into a running transcript. The final key derivation includes this transcript hash, binding the session key to the exact sequence of messages exchanged. This prevents downgrade attacks and ensures both sides agree on what happened.

## Don't Hand-Roll

1. **Do NOT invent a new KEM combiner**. The `HybridKem::combine_secrets()` already uses BLAKE3 with domain separation (`DOMAIN_HYBRID_COMBINE`). This is correct and should be reused. The X-Wing combiner uses SHA3-256 but that's specific to ML-KEM-768; Tallow's BLAKE3 combiner for ML-KEM-1024 is appropriate per the project's crypto-decisions.md.

2. **Do NOT skip the PAKE phase**. Without PAKE authentication, an active attacker at the relay can trivially MITM the KEM exchange (substitute their own public key). The code phrase MUST authenticate the KEM.

3. **Do NOT derive the session key from the PAKE output alone**. This is the current bug -- `derive_session_key_with_salt()` uses only the code phrase. The PAKE shared secret has at most as much entropy as the code phrase. The KEM shared secret has 256-bit entropy.

4. **Do NOT use the CPace shared secret directly as an encryption key**. CPace output should be used only for key confirmation (proving both sides have the same password) and as input to the final KDF alongside the KEM shared secret.

5. **Do NOT reuse the hybrid KEM keypair across transfers**. Each transfer MUST generate fresh ephemeral keys. The `HybridKem::keygen()` function already uses `OsRng`, so calling it per-transfer is correct.

6. **Do NOT add a version negotiation round trip**. Use the existing `VersionRequest`/`VersionResponse` exchange (which currently is not used in the transfer pipeline) or embed version info in the first handshake message. The success criterion says "under 500ms on 100ms RTT" which means at most 2 round trips total.

7. **Do NOT change the relay server**. The relay is a dumb pipe -- it forwards bytes between paired peers. The handshake is entirely client-side. The relay binary does not need modification for Phase 11.

## Common Pitfalls

### 1. Transcript Ordering (Critical)

CPace has an initiator/responder asymmetry in its transcript: the initiator's public message is always listed first. If both sides compute the transcript in different orders, they derive different keys and the handshake silently fails. The existing CPace implementation already handles this correctly (see `cpace.rs` lines 142-145 vs 209-212), but the outer handshake transcript must also maintain consistent ordering.

**Mitigation**: Define the transcript as: `transcript = domain || pake_initiator_msg || pake_responder_msg || kem_public_key || kem_ciphertext || kem_confirmation`. Both sides compute this in the same order, identified by role (sender = initiator, receiver = responder).

### 2. ML-KEM-1024 Key Sizes

ML-KEM-1024 public keys are 1568 bytes, ciphertexts are 1568 bytes. Combined with X25519 (32 bytes each), a full handshake exchanges approximately 3200 bytes of key material. This fits within the existing 16 MiB message limit and even within typical MTU sizes when sent as a single `Message` variant via the relay.

### 3. Postcard Serialization of Large Byte Arrays

ML-KEM keys are serialized as `Vec<u8>` in the existing code (see `mlkem.rs` lines 22-23, 27-28, 32-33). Postcard handles `Vec<u8>` correctly with varint length prefix. The hybrid `PublicKey` and `Ciphertext` structs already derive `Serialize`/`Deserialize` and round-trip correctly in tests. No issues expected.

### 4. Zeroization of Ephemeral Keys

The `SecretKey` types already `#[derive(Zeroize)]` with `#[zeroize(drop)]`. However, the handshake state machine will hold these keys temporarily. The state machine struct MUST also implement `Drop` with zeroization, or wrap the keys in `SecretBox`.

**Specific items to zeroize**:
- Ephemeral `hybrid::SecretKey` (after decapsulation)
- CPace `Scalar` (already zeroized in `CpaceInitiator`/`CpaceResponder` Drop impls)
- Intermediate shared secrets before final KDF
- The PAKE shared secret after use in key confirmation
- The final 32-byte session key buffer when the transfer completes (already handled by `SessionKey::drop()`)

### 5. Key Confirmation MAC

After KEM completes, both sides must exchange a key confirmation message to prove they derived the same key WITHOUT revealing the key. The standard approach is:

```
confirmation_tag = BLAKE3_keyed_hash(session_key, "tallow-key-confirm" || role || transcript_hash)
```

Each side sends their tag and verifies the other's. If the tags don't match, the handshake fails (wrong code phrase, MITM, or bug). This MUST use constant-time comparison (`subtle::ConstantTimeEq`).

### 6. Backward Compatibility Detection

The success criteria require that old-format transfers (code-phrase-derived keys) are detected and rejected with a version mismatch error. Since old clients send `FileOffer` immediately after `PeerArrived`, while new clients send `HandshakeInit`, the receiver can detect the protocol by inspecting the first message after peer connection. If it's a `FileOffer`, reject with version error. If it's `HandshakeInit`, proceed with KEM handshake.

### 7. CPace Session ID Must Be Unique Per Connection

The CPace `session_id` must include entropy from both peers (not just the room ID, which is deterministic from the code phrase). Use: `session_id = room_id || sender_nonce || receiver_nonce` where each peer contributes a random nonce in the first handshake message.

### 8. Timing Attacks on PAKE Failure

When CPace authentication fails (wrong code phrase), the key confirmation step will fail. The error message MUST NOT distinguish between "wrong code phrase" and "KEM failure" to avoid oracle attacks. Use a generic "handshake failed" error.

## Code Examples

### Example 1: New Message Variants for Handshake

```rust
// In wire/messages.rs, add to Message enum:

/// Handshake initiation (sender -> receiver)
HandshakeInit {
    /// Protocol version for this handshake
    protocol_version: u32,
    /// KEM capabilities (supported algorithms)
    kem_capabilities: Vec<u8>, // serialized KemCapabilities
    /// CPace initiator public message (32 bytes, Ristretto255 point)
    cpace_public: [u8; 32],
    /// Random nonce for session ID binding (16 bytes)
    nonce: [u8; 16],
},

/// Handshake response (receiver -> sender)
HandshakeResponse {
    /// Selected KEM algorithm
    selected_kem: u8, // KemAlgorithm discriminant
    /// CPace responder public message (32 bytes)
    cpace_public: [u8; 32],
    /// Hybrid KEM public key (serialized)
    kem_public_key: Vec<u8>,
    /// Random nonce for session ID binding (16 bytes)
    nonce: [u8; 16],
},

/// KEM encapsulation (sender -> receiver)
HandshakeKem {
    /// Hybrid KEM ciphertext (serialized)
    kem_ciphertext: Vec<u8>,
    /// Key confirmation tag from sender (32 bytes)
    confirmation: [u8; 32],
},

/// Handshake completion (receiver -> sender)
HandshakeComplete {
    /// Key confirmation tag from receiver (32 bytes)
    confirmation: [u8; 32],
},

/// Handshake failure
HandshakeFailed {
    /// Generic reason (MUST NOT leak whether PAKE or KEM failed)
    reason: String,
},
```

### Example 2: Handshake Orchestrator (tallow-protocol/src/kex.rs)

```rust
/// Handshake state for the sender (initiator)
pub struct SenderHandshake {
    code_phrase: String,
    room_id: [u8; 32],
    nonce: [u8; 16],
    cpace_state: Option<CpaceState>,
    pake_secret: Option<[u8; 32]>,
    transcript: Vec<u8>,
}

impl SenderHandshake {
    pub fn new(code_phrase: &str, room_id: &[u8; 32]) -> Self {
        let nonce: [u8; 16] = rand::random();
        Self {
            code_phrase: code_phrase.to_string(),
            room_id: *room_id,
            nonce,
            cpace_state: None,
            pake_secret: None,
            transcript: Vec::new(),
        }
    }

    /// Step 1: Generate HandshakeInit message
    pub fn init(&mut self) -> Message {
        // Build session ID with our nonce (receiver's nonce added in step 2)
        let session_id_partial = self.build_partial_session_id();
        let (cpace_pub, cpace_state) =
            start_cpace_initiator(&self.code_phrase, &session_id_partial);

        let cpace_pub_arr: [u8; 32] = cpace_pub.try_into().expect("CPace public is 32 bytes");
        self.cpace_state = Some(cpace_state);

        // Add to transcript
        self.transcript.extend_from_slice(&cpace_pub_arr);
        self.transcript.extend_from_slice(&self.nonce);

        let capabilities = tallow_crypto::kem::KemCapabilities::all();
        let kem_caps_bytes = postcard::to_stdvec(&capabilities)
            .expect("KemCapabilities serialization");

        Message::HandshakeInit {
            protocol_version: 2,
            kem_capabilities: kem_caps_bytes,
            cpace_public: cpace_pub_arr,
            nonce: self.nonce,
        }
    }

    /// Step 2: Process HandshakeResponse, produce HandshakeKem
    pub fn process_response(
        &mut self,
        response: &HandshakeResponseData,
    ) -> Result<(Message, SessionKey)> {
        // Complete CPace
        let cpace_state = self.cpace_state.take()
            .ok_or(ProtocolError::InvalidMessage("no CPace state".into()))?;
        let pake_secret = complete_cpace(cpace_state, &response.cpace_public)?;

        // Add response to transcript
        self.transcript.extend_from_slice(&response.cpace_public);
        self.transcript.extend_from_slice(&response.nonce);
        self.transcript.extend_from_slice(&response.kem_public_key);

        // Deserialize and encapsulate to the receiver's KEM public key
        let kem_pk: tallow_crypto::kem::hybrid::PublicKey =
            postcard::from_bytes(&response.kem_public_key)
                .map_err(|e| ProtocolError::DecodingError(e.to_string()))?;

        let (kem_ct, kem_ss) = tallow_crypto::kem::HybridKem::encapsulate(&kem_pk)
            .map_err(|e| ProtocolError::TransferFailed(e.to_string()))?;

        let kem_ct_bytes = postcard::to_stdvec(&kem_ct)
            .map_err(|e| ProtocolError::EncodingError(e.to_string()))?;

        // Add ciphertext to transcript
        self.transcript.extend_from_slice(&kem_ct_bytes);

        // Derive session key: HKDF(salt=transcript_hash, ikm=kem_ss||pake_ss, info=domain)
        let transcript_hash = tallow_crypto::hash::blake3::hash(&self.transcript);
        let mut ikm = Vec::with_capacity(64);
        ikm.extend_from_slice(kem_ss.expose_secret());
        ikm.extend_from_slice(pake_secret.as_bytes());

        let session_key_bytes = tallow_crypto::kdf::hkdf::derive(
            &transcript_hash,
            &ikm,
            b"tallow-session-key-v3-kem",
            32,
        ).map_err(|e| ProtocolError::TransferFailed(e.to_string()))?;

        // Compute sender's key confirmation tag
        let mut confirm_input = Vec::new();
        confirm_input.extend_from_slice(b"sender");
        confirm_input.extend_from_slice(&transcript_hash);
        let key_arr: [u8; 32] = session_key_bytes[..32].try_into().unwrap();
        let confirmation = tallow_crypto::hash::blake3::keyed_hash(&key_arr, &confirm_input);

        let msg = Message::HandshakeKem {
            kem_ciphertext: kem_ct_bytes,
            confirmation,
        };

        let session_key = SessionKey::from_bytes(key_arr);
        Ok((msg, session_key))
    }
}
```

### Example 3: Receiver-Side Handshake

```rust
/// Handshake state for the receiver (responder)
pub struct ReceiverHandshake {
    code_phrase: String,
    room_id: [u8; 32],
    nonce: [u8; 16],
    kem_secret_key: Option<tallow_crypto::kem::hybrid::SecretKey>,
    pake_secret: Option<[u8; 32]>,
    transcript: Vec<u8>,
}

impl ReceiverHandshake {
    /// Step 1: Process HandshakeInit, produce HandshakeResponse
    pub fn process_init(
        &mut self,
        init: &HandshakeInitData,
    ) -> Result<Message> {
        // Build full session ID with both nonces
        let session_id = self.build_session_id(&init.nonce, &self.nonce);

        // Start CPace as responder
        let (cpace_pub, cpace_state) =
            start_cpace_responder(&self.code_phrase, &session_id);

        // Complete CPace immediately (we have their public)
        let pake_secret = complete_cpace(cpace_state, &init.cpace_public)?;
        self.pake_secret = Some(*pake_secret.as_bytes());

        // Add to transcript (same order as sender)
        self.transcript.extend_from_slice(&init.cpace_public);
        self.transcript.extend_from_slice(&init.nonce);

        let cpace_pub_arr: [u8; 32] = cpace_pub.try_into().unwrap();

        // Generate ephemeral KEM keypair
        let (kem_pk, kem_sk) = tallow_crypto::kem::HybridKem::keygen()
            .map_err(|e| ProtocolError::TransferFailed(e.to_string()))?;
        self.kem_secret_key = Some(kem_sk);

        let kem_pk_bytes = postcard::to_stdvec(&kem_pk)
            .map_err(|e| ProtocolError::EncodingError(e.to_string()))?;

        // Add to transcript
        self.transcript.extend_from_slice(&cpace_pub_arr);
        self.transcript.extend_from_slice(&self.nonce);
        self.transcript.extend_from_slice(&kem_pk_bytes);

        // Negotiate KEM algorithm
        let their_caps: tallow_crypto::kem::KemCapabilities =
            postcard::from_bytes(&init.kem_capabilities)
                .map_err(|e| ProtocolError::DecodingError(e.to_string()))?;
        let our_caps = tallow_crypto::kem::KemCapabilities::all();
        let selected = tallow_crypto::kem::negotiate(&our_caps, &their_caps)
            .ok_or(ProtocolError::TransferFailed("No common KEM algorithm".into()))?;

        Ok(Message::HandshakeResponse {
            selected_kem: selected as u8,
            cpace_public: cpace_pub_arr,
            kem_public_key: kem_pk_bytes,
            nonce: self.nonce,
        })
    }

    /// Step 2: Process HandshakeKem, produce HandshakeComplete + SessionKey
    pub fn process_kem(
        &mut self,
        kem_msg: &HandshakeKemData,
    ) -> Result<(Message, SessionKey)> {
        // Decapsulate
        let kem_sk = self.kem_secret_key.take()
            .ok_or(ProtocolError::InvalidMessage("no KEM secret key".into()))?;
        let kem_ct: tallow_crypto::kem::hybrid::Ciphertext =
            postcard::from_bytes(&kem_msg.kem_ciphertext)
                .map_err(|e| ProtocolError::DecodingError(e.to_string()))?;

        let kem_ss = tallow_crypto::kem::HybridKem::decapsulate(&kem_sk, &kem_ct)
            .map_err(|e| ProtocolError::TransferFailed(e.to_string()))?;

        // Add ciphertext to transcript (same position as sender)
        self.transcript.extend_from_slice(&kem_msg.kem_ciphertext);

        // Derive session key (identical to sender's derivation)
        let transcript_hash = tallow_crypto::hash::blake3::hash(&self.transcript);
        let pake_secret = self.pake_secret.take()
            .ok_or(ProtocolError::InvalidMessage("no PAKE secret".into()))?;

        let mut ikm = Vec::with_capacity(64);
        ikm.extend_from_slice(kem_ss.expose_secret());
        ikm.extend_from_slice(&pake_secret);

        let session_key_bytes = tallow_crypto::kdf::hkdf::derive(
            &transcript_hash,
            &ikm,
            b"tallow-session-key-v3-kem",
            32,
        ).map_err(|e| ProtocolError::TransferFailed(e.to_string()))?;

        let key_arr: [u8; 32] = session_key_bytes[..32].try_into().unwrap();

        // Verify sender's key confirmation
        let mut sender_confirm_input = Vec::new();
        sender_confirm_input.extend_from_slice(b"sender");
        sender_confirm_input.extend_from_slice(&transcript_hash);
        let expected_sender_tag = tallow_crypto::hash::blake3::keyed_hash(
            &key_arr, &sender_confirm_input
        );

        // Constant-time comparison
        use subtle::ConstantTimeEq;
        if expected_sender_tag.ct_eq(&kem_msg.confirmation).unwrap_u8() != 1 {
            return Err(ProtocolError::TransferFailed(
                "Handshake failed: key confirmation mismatch".into()
            ));
        }

        // Compute receiver's key confirmation
        let mut recv_confirm_input = Vec::new();
        recv_confirm_input.extend_from_slice(b"receiver");
        recv_confirm_input.extend_from_slice(&transcript_hash);
        let recv_confirmation = tallow_crypto::hash::blake3::keyed_hash(
            &key_arr, &recv_confirm_input
        );

        let msg = Message::HandshakeComplete {
            confirmation: recv_confirmation,
        };

        let session_key = SessionKey::from_bytes(key_arr);
        Ok((msg, session_key))
    }
}
```

### Example 4: Integration in send.rs (Replacing Code-Phrase Key Derivation)

```rust
// In send.rs execute(), after peer connected and before FileOffer:

// --- NEW: Perform KEM handshake ---
let mut handshake = tallow_protocol::kex::SenderHandshake::new(&code_phrase, &room_id);

// Step 1: Send HandshakeInit
let init_msg = handshake.init();
encode_buf.clear();
codec.encode_msg(&init_msg, &mut encode_buf)?;
relay.forward(&encode_buf).await?;

// Step 2: Receive HandshakeResponse
let n = relay.receive(&mut recv_buf).await?;
let mut decode_buf = BytesMut::from(&recv_buf[..n]);
let response = codec.decode_msg(&mut decode_buf)?;
let response_data = match response {
    Some(Message::HandshakeResponse { .. }) => { /* extract fields */ },
    Some(Message::HandshakeFailed { reason }) => {
        return Err(io::Error::other(format!("Handshake failed: {}", reason)));
    }
    // Old client detection: if we get FileOffer, it's an old protocol
    Some(Message::FileOffer { .. }) => {
        return Err(io::Error::other(
            "Protocol version mismatch: peer uses old key exchange. \
             Both sides must upgrade to tallow v2.0+"
        ));
    }
    other => return Err(io::Error::other(format!("Unexpected: {:?}", other))),
};

// Step 3: Process response + send KEM ciphertext
let (kem_msg, session_key) = handshake.process_response(&response_data)?;
encode_buf.clear();
codec.encode_msg(&kem_msg, &mut encode_buf)?;
relay.forward(&encode_buf).await?;

// Step 4: Receive HandshakeComplete (receiver's key confirmation)
let n = relay.receive(&mut recv_buf).await?;
let mut decode_buf = BytesMut::from(&recv_buf[..n]);
let complete = codec.decode_msg(&mut decode_buf)?;
match complete {
    Some(Message::HandshakeComplete { confirmation }) => {
        handshake.verify_receiver_confirmation(&confirmation)?;
    }
    _ => return Err(io::Error::other("Handshake completion failed")),
};

// session_key is now derived from KEM, authenticated by PAKE
// --- END handshake ---

// Rest of transfer uses session_key (remove old derive_session_key_with_salt call)
```

### Example 5: Domain Separation Constants to Add

```rust
// In hash/domain.rs, add:

/// Domain separator for handshake transcript hashing
pub const DOMAIN_HANDSHAKE_TRANSCRIPT: &str = "tallow.handshake.transcript.v1";

/// Domain separator for session key derivation from KEM + PAKE
pub const DOMAIN_SESSION_KEY_V3: &str = "tallow.session_key.kem_pake.v3";

/// Domain separator for sender key confirmation
pub const DOMAIN_KEY_CONFIRM_SENDER: &str = "tallow.key_confirm.sender.v1";

/// Domain separator for receiver key confirmation
pub const DOMAIN_KEY_CONFIRM_RECEIVER: &str = "tallow.key_confirm.receiver.v1";
```

## Gap Analysis

### What Exists (Complete and Tested)

1. **HybridKem**: Full keygen/encapsulate/decapsulate with BLAKE3 combiner, serde support, zeroize on drop. Tests pass including serialization round-trip.
2. **CPace PAKE**: CpaceInitiator/CpaceResponder with Ristretto255, transcript-bound key derivation, zeroize on drop. Tests verify same-password-same-key and different-password-different-key.
3. **KEM Negotiation**: `KemCapabilities` struct and `negotiate()` function for algorithm selection.
4. **Wire Codec**: `TallowCodec` with postcard serialization, 4-byte length prefix framing, 16 MiB max message size.
5. **Version Negotiation**: `VersionRequest`/`VersionResponse`/`VersionReject` messages and `process_version_request()` logic.
6. **SessionKey**: Zeroize-on-drop wrapper with `as_bytes()`/`into_bytes()`.
7. **HKDF-SHA256**: `derive()` and `derive_multiple()` functions.
8. **Domain Constants**: Comprehensive set including `DOMAIN_HYBRID_COMBINE`, `DOMAIN_KEY_CONFIRM`, `DOMAIN_KEM`.

### What's Missing (Must Build)

| Gap | Location | Effort | Description |
|-----|----------|--------|-------------|
| **Handshake Message variants** | `wire/messages.rs` | Small | Add `HandshakeInit`, `HandshakeResponse`, `HandshakeKem`, `HandshakeComplete`, `HandshakeFailed` to `Message` enum |
| **Sender handshake orchestrator** | `kex.rs` | Medium | `SenderHandshake` state machine: init() -> process_response() -> verify_completion() |
| **Receiver handshake orchestrator** | `kex.rs` | Medium | `ReceiverHandshake` state machine: process_init() -> process_kem() |
| **Key confirmation logic** | `kex.rs` | Small | BLAKE3 keyed-hash MAC with role + transcript binding, constant-time verification |
| **Transcript builder** | `kex.rs` (new) | Small | Append-only byte buffer that hashes all handshake messages for binding |
| **SessionKey::from_bytes()** | `kex.rs` | Trivial | Constructor for `SessionKey` from raw `[u8; 32]` (currently only derivation constructors exist) |
| **Domain constants** | `hash/domain.rs` | Trivial | 4 new domain separation strings |
| **send.rs handshake integration** | `commands/send.rs` | Medium | Replace `derive_session_key_with_salt()` call with handshake sequence |
| **receive.rs handshake integration** | `commands/receive.rs` | Medium | Replace `derive_session_key_with_salt()` call with handshake sequence |
| **sync.rs handshake integration** | `commands/sync.rs` | Small | Same pattern as send/receive |
| **watch.rs handshake integration** | `commands/watch.rs` | Small | Same pattern as send/receive |
| **Old protocol detection** | `commands/receive.rs` | Small | If first message after PeerArrived is `FileOffer` instead of `HandshakeInit`, return version mismatch error |
| **Protocol version bump** | `wire/version.rs` | Trivial | `PROTOCOL_VERSION = 2`, `MIN_PROTOCOL_VERSION = 2` (or keep 1 as min and handle both) |
| **ProtocolError variants** | `error.rs` | Trivial | Add `HandshakeFailed(String)`, `KeyConfirmationFailed` |
| **Handshake timeout** | `kex.rs` or CLI | Small | Abort handshake if any step takes >10 seconds |
| **Zeroize on handshake state** | `kex.rs` | Small | Implement `Drop` for `SenderHandshake`/`ReceiverHandshake` that zeroizes all secret fields |

### What Can Be Removed After Phase 11

- `derive_session_key_from_phrase()` -- no longer used (was v1 approach)
- `derive_session_key_with_salt()` -- no longer used (was v2 approach, still code-phrase-derived)
- These should be kept but marked `#[deprecated]` for one release cycle, then removed

### What Does NOT Change

- **Relay server** (`tallow-relay`): No modifications needed. The relay forwards opaque bytes.
- **Transfer pipeline** (`SendPipeline`/`ReceivePipeline`): These take a `session_key: [u8; 32]` and don't care how it was derived.
- **Chunk encryption** (`tallow-crypto::symmetric`): AES-256-GCM with counter nonces is unchanged.
- **Room management**: Room joining, code phrase generation, room ID derivation all stay the same.

## Handshake Protocol Design

### Full Protocol Flow (4 Messages, 2 Round Trips)

```
Sender (Initiator)                              Receiver (Responder)
      |                                                |
      |  --- [1] HandshakeInit ----------------------> |
      |      protocol_version: 2                       |
      |      kem_capabilities: [Hybrid, MlKem, X25519] |
      |      cpace_public: Ya (32 bytes)               |
      |      nonce_s: (16 bytes random)                |
      |                                                |
      |                              [generates KEM keypair]
      |                              [starts CPace responder]
      |                                                |
      |  <-- [2] HandshakeResponse ------------------- |
      |      selected_kem: Hybrid                      |
      |      cpace_public: Yb (32 bytes)               |
      |      kem_public_key: pk_hybrid (serialized)    |
      |      nonce_r: (16 bytes random)                |
      |                                                |
      | [completes CPace -> pake_ss]                   |
      | [encapsulates to pk_hybrid -> kem_ct, kem_ss]  |
      | [derives session_key from pake_ss + kem_ss]    |
      | [computes sender confirmation tag]             |
      |                                                |
      |  --- [3] HandshakeKem -----------------------> |
      |      kem_ciphertext: ct_hybrid (serialized)    |
      |      confirmation: tag_sender (32 bytes)       |
      |                                                |
      |                    [decapsulates ct -> kem_ss]  |
      |                    [derives session_key]        |
      |                    [verifies sender tag (CT)]   |
      |                    [computes receiver tag]      |
      |                                                |
      |  <-- [4] HandshakeComplete ------------------- |
      |      confirmation: tag_receiver (32 bytes)     |
      |                                                |
      | [verifies receiver tag (CT)]                   |
      |                                                |
      | ========= SESSION ESTABLISHED ================ |
      |                                                |
      |  --- FileOffer ------------------------------> |
      |  <-- FileAccept ------------------------------ |
      |  --- Chunk(0) --------------------------------> |
      |  ... (normal transfer flow)                    |
```

### Session Key Derivation (Both Sides Identical)

```
session_id   = room_id || nonce_s || nonce_r
transcript   = "tallow.handshake.v1" || Ya || nonce_s || Yb || nonce_r || pk_hybrid || ct_hybrid
trans_hash   = BLAKE3(transcript)
ikm          = kem_shared_secret || pake_shared_secret   (64 bytes)
salt         = trans_hash                                 (32 bytes)
info         = "tallow.session_key.kem_pake.v3"
session_key  = HKDF-SHA256(salt, ikm, info, 32)
```

### Key Confirmation

```
sender_tag   = BLAKE3_keyed(session_key, "tallow.key_confirm.sender.v1" || trans_hash)
receiver_tag = BLAKE3_keyed(session_key, "tallow.key_confirm.receiver.v1" || trans_hash)
```

Verification uses `subtle::ConstantTimeEq`. On mismatch, send `HandshakeFailed` with generic message.

### Why 2 Round Trips (Not 1)

A 1-RTT handshake would require the sender to send both the CPace message and KEM encapsulation in a single flight. But the sender cannot encapsulate without the receiver's KEM public key. Therefore:
- RT 1: Exchange CPace messages + receiver sends KEM public key
- RT 2: Sender sends KEM ciphertext + key confirmation; receiver sends key confirmation

At 100ms RTT, this is 200ms for the handshake, well under the 500ms target.

### Why Not 1.5 Round Trips

We could theoretically merge message [4] (HandshakeComplete) into the first data message (FileOffer). However, this creates a layering violation -- the handshake module would need to know about file transfer semantics. Keeping them separate is cleaner and the extra half-RTT (50ms on 100ms link) is negligible.

## Performance Considerations

### Handshake Latency Budget (Target: <500ms at 100ms RTT)

| Operation | Time (est.) | Notes |
|-----------|-------------|-------|
| ML-KEM-1024 keygen | ~1ms | CPU-bound, single-threaded |
| ML-KEM-1024 encapsulate | ~0.5ms | CPU-bound |
| ML-KEM-1024 decapsulate | ~0.5ms | CPU-bound |
| X25519 keygen + DH | ~0.1ms | Very fast |
| CPace (scalar mult x2) | ~0.2ms | Ristretto255 |
| HKDF-SHA256 derivation | ~0.01ms | Negligible |
| BLAKE3 hashing | ~0.01ms | Negligible |
| Network RT 1 | ~100ms | Sender -> relay -> receiver -> relay -> sender |
| Network RT 2 | ~100ms | Same path |
| **Total** | ~202ms | Well under 500ms budget |

### Wire Size Budget

| Message | Size (bytes) | Notes |
|---------|-------------|-------|
| HandshakeInit | ~80 | 32 (CPace) + 16 (nonce) + ~30 (capabilities) + overhead |
| HandshakeResponse | ~1,660 | 32 (CPace) + 1,568+32 (hybrid PK) + 16 (nonce) + overhead |
| HandshakeKem | ~1,640 | 1,568+32 (hybrid CT) + 32 (confirmation) + overhead |
| HandshakeComplete | ~36 | 32 (confirmation) + overhead |
| **Total** | ~3,416 | All messages fit in standard QUIC frames |

### Comparison to Current Approach

| Metric | Current (v2 code-phrase) | New (KEM handshake) |
|--------|-------------------------|---------------------|
| Session key entropy | Limited by code phrase (~40-60 bits) | 256 bits (from KEM) |
| Forward secrecy | None (same phrase = same key) | Per-transfer ephemeral keys |
| Authentication | Implicit (both know phrase) | Explicit (CPace + key confirmation) |
| Wrong code detection | Silent decryption failure | Explicit handshake failure |
| MITM resistance | None (relay could substitute keys) | Full (PAKE authenticates KEM) |
| Extra latency | 0 | ~200ms (2 RT) |
| Extra bandwidth | 0 | ~3.4 KB (one-time) |

### Impact on Transfer Resume

Transfer resume currently relies on `transfer_id` being the same across reconnections. With KEM, each reconnection generates a new session key. Resume must re-derive the session key via a new handshake, then use the resume checkpoint to determine which chunks to skip. The encrypted chunk data from the previous session cannot be reused because the session key changed. Two options:

1. **Re-encrypt from checkpoint**: Resume re-reads the file from the checkpoint offset, encrypts with the new session key. This is the simplest approach and maintains forward secrecy.
2. **Store session key in checkpoint**: The checkpoint could store the session key so resumed transfers use the same key. This sacrifices forward secrecy for the resumed session and adds complexity to secure storage.

**Recommendation**: Option 1 (re-encrypt). Forward secrecy is more important than avoiding re-encryption overhead, and re-reading from disk is fast.

### Memory Usage

The handshake state holds:
- ML-KEM-1024 secret key: 3,168 bytes (receiver only, ephemeral)
- ML-KEM-1024 public key: 1,568 bytes (receiver only, sent to sender)
- CPace state: ~128 bytes (Scalar + RistrettoPoint)
- Transcript buffer: ~3,500 bytes
- Total: ~8.5 KB peak, freed after handshake completes

This is negligible compared to the 64 KB chunk buffers used during transfer.
