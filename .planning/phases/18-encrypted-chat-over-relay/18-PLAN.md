# Phase 18: Encrypted Chat Over Relay -- Plan

## Goal

Deliver end-to-end encrypted real-time text chat between two peers over the existing relay infrastructure, reusing the KEM handshake for session key establishment and AES-256-GCM for per-message encryption.

## Wave Structure

### Wave 1: Wire Protocol Extension (no external dependencies within this wave)

#### Task 1.1: Add Chat Message Variants to Wire Protocol

- **Files to modify:**
  - `crates/tallow-protocol/src/wire/messages.rs`

- **What to do:**
  1. Add four new variants to the `Message` enum, placed after the existing `HandshakeFailed` variant:
     ```rust
     /// Encrypted chat text message
     ChatText {
         /// Unique message ID for read receipts (random 16 bytes)
         message_id: [u8; 16],
         /// Monotonic sequence number for ordering
         sequence: u64,
         /// AES-256-GCM encrypted plaintext
         ciphertext: Vec<u8>,
         /// 12-byte nonce used for encryption
         nonce: [u8; 12],
     },
     /// Typing indicator (reserved for future use)
     TypingIndicator {
         /// true = started typing, false = stopped typing
         typing: bool,
     },
     /// Read receipt acknowledging messages (reserved for future use)
     ReadReceipt {
         /// Message IDs confirmed as read
         message_ids: Vec<[u8; 16]>,
     },
     /// Graceful chat session termination
     ChatEnd,
     ```
  2. Add these four variants to the `test_message_roundtrip_all_variants` test to ensure postcard serialization round-trips. Add test instances:
     ```rust
     Message::ChatText {
         message_id: [0xAA; 16],
         sequence: 1,
         ciphertext: vec![0xDE, 0xAD],
         nonce: [0xBB; 12],
     },
     Message::TypingIndicator { typing: true },
     Message::ReadReceipt {
         message_ids: vec![[0xCC; 16], [0xDD; 16]],
     },
     Message::ChatEnd,
     ```

- **Verification:**
  - `cargo test -p tallow-protocol test_message_roundtrip_all_variants` passes
  - `cargo test -p tallow-protocol test_message_compact_encoding` still passes
  - `cargo clippy -p tallow-protocol -- -D warnings` clean

**IMPORTANT WARNING:** Adding variants to a postcard enum changes the discriminant mapping for any variants that come after. Since postcard uses integer discriminants based on declaration order, the new variants MUST be appended at the very end of the enum (after `HandshakeFailed`) to avoid breaking existing message parsing. Verify that the existing `test_message_roundtrip_all_variants` test still passes without any changes to the existing variant test data.

#### Task 1.2: Expand ChatArgs in CLI

- **Files to modify:**
  - `crates/tallow/src/cli.rs`

- **What to do:**
  1. Replace the existing `ChatArgs` struct with expanded fields matching the pattern used by `SendArgs` and `ReceiveArgs`:
     ```rust
     #[derive(Args)]
     pub struct ChatArgs {
         /// Code phrase to join an existing chat room
         pub code: Option<String>,

         /// Use a custom code phrase
         #[arg(short = 'c', long = "code")]
         pub custom_code: Option<String>,

         /// Number of words in generated code phrase (default: 4)
         #[arg(long)]
         pub words: Option<usize>,

         /// Relay server address (also reads TALLOW_RELAY env var)
         #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
         pub relay: String,

         /// Relay password (also reads TALLOW_RELAY_PASS env var)
         #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
         pub relay_pass: Option<String>,

         /// SOCKS5 proxy address (also reads TALLOW_PROXY env var)
         #[arg(long, env = "TALLOW_PROXY")]
         pub proxy: Option<String>,

         /// Route through Tor (shortcut for --proxy socks5://127.0.0.1:9050)
         #[arg(long)]
         pub tor: bool,

         /// Display verification string after key exchange for MITM detection
         #[arg(long)]
         pub verify: bool,

         /// Display QR code for the join command
         #[arg(long)]
         pub qr: bool,

         /// Do not copy join command to clipboard
         #[arg(long)]
         pub no_clipboard: bool,
     }
     ```
  2. Remove the old `peer` and `room` fields.

- **Verification:**
  - `cargo build -p tallow` compiles
  - `cargo run -p tallow -- chat --help` shows all new flags
  - `cargo clippy -p tallow -- -D warnings` clean

#### Task 1.3: Update main.rs Dispatch to Pass `json` Flag

- **Files to modify:**
  - `crates/tallow/src/main.rs`

- **What to do:**
  1. Change line 45 from:
     ```rust
     cli::Commands::Chat(args) => commands::chat::execute(args).await,
     ```
     to:
     ```rust
     cli::Commands::Chat(args) => commands::chat::execute(args, json_output).await,
     ```

- **Verification:**
  - `cargo build -p tallow` compiles

---

### Wave 2: Chat Encryption Module + Chat Command Core (depends on Wave 1)

#### Task 2.1: Create Chat Encryption Helpers in tallow-protocol

- **Files to create:**
  - `crates/tallow-protocol/src/chat/encrypt.rs`
- **Files to modify:**
  - `crates/tallow-protocol/src/chat/mod.rs`

- **What to do:**
  1. Create `crates/tallow-protocol/src/chat/encrypt.rs` with the following contents:
     - A `const MAX_CHAT_MESSAGE_SIZE: usize = 64 * 1024` (64 KB plaintext limit).
     - A `const CHAT_AAD: &[u8] = b"tallow-chat-v1"` for domain separation.
     - A `ChatCryptoError` enum using `thiserror`:
       - `MessageTooLarge { size: usize, max: usize }` -- plaintext exceeds limit
       - `EncryptionFailed(String)` -- AES-GCM encryption error
       - `DecryptionFailed(String)` -- AES-GCM decryption error
       - `InvalidUtf8(String)` -- decrypted bytes are not valid UTF-8
     - `pub fn encrypt_chat_text(plaintext: &str, session_key: &[u8; 32], nonce_counter: &mut u64) -> Result<(Vec<u8>, [u8; 12]), ChatCryptoError>`:
       - Validates `plaintext.len() <= MAX_CHAT_MESSAGE_SIZE`.
       - Builds a 12-byte nonce: `[0u8; 4] || nonce_counter.to_be_bytes()`.
       - Increments `*nonce_counter += 2` (even/odd split for sender/receiver).
       - Calls `tallow_crypto::symmetric::aes_encrypt(session_key, &nonce, plaintext.as_bytes(), CHAT_AAD)`.
       - Returns `(ciphertext, nonce)`.
     - `pub fn decrypt_chat_text(ciphertext: &[u8], nonce: &[u8; 12], session_key: &[u8; 32]) -> Result<String, ChatCryptoError>`:
       - Calls `tallow_crypto::symmetric::aes_decrypt(session_key, nonce, ciphertext, CHAT_AAD)`.
       - Converts to `String::from_utf8(plaintext)`.
       - Calls `tallow_protocol::transfer::sanitize::sanitize_display(&text)` on the result.
       - Returns the sanitized string.
  2. Add `pub mod encrypt;` to `crates/tallow-protocol/src/chat/mod.rs`.
  3. Add `pub use encrypt::{encrypt_chat_text, decrypt_chat_text, ChatCryptoError, MAX_CHAT_MESSAGE_SIZE};` to the mod.rs re-exports.

- **Tests to write (in encrypt.rs `#[cfg(test)]` module):**
  - `test_encrypt_decrypt_roundtrip` -- encrypt a message, decrypt it, verify plaintext matches.
  - `test_nonce_counter_increments_by_two` -- verify counter advances by 2 per call.
  - `test_wrong_key_fails` -- decrypt with different key returns error.
  - `test_wrong_nonce_fails` -- decrypt with different nonce returns error.
  - `test_message_too_large` -- plaintext exceeding 64 KB returns `MessageTooLarge`.
  - `test_empty_message` -- empty string encrypts and decrypts successfully.
  - `test_unicode_message` -- UTF-8 content with emoji/CJK round-trips correctly.
  - `test_ansi_sanitized` -- decrypted text with ANSI escapes is stripped by `sanitize_display`.

- **Verification:**
  - `cargo test -p tallow-protocol encrypt` -- all tests pass
  - `cargo clippy -p tallow-protocol -- -D warnings` clean

#### Task 2.2: Implement the Chat Command (Full Rewrite of commands/chat.rs)

- **Files to modify:**
  - `crates/tallow/src/commands/chat.rs`

- **What to do:**
  1. Replace the entire stub with a full implementation. The structure follows `send.rs` for connection setup + handshake, then diverges into a chat loop. Major sections:

  **a) Function signature:**
  ```rust
  pub async fn execute(args: ChatArgs, json: bool) -> io::Result<()>
  ```

  **b) Proxy config (copy pattern from send.rs):**
  - Call `crate::commands::proxy::build_proxy_config(args.tor, &args.proxy, json).await?`
  - Log proxy/Tor usage using `output::color::info`.

  **c) Code phrase generation (initiator) or acceptance (joiner):**
  - If `args.code` is `Some(code)` -- this peer is the joiner (responder role). Use the code phrase provided.
  - If `args.code` is `None` -- this peer is the initiator (sender role). Generate a code phrase using `tallow_protocol::room::code::generate_code_phrase(args.words.unwrap_or(DEFAULT_WORD_COUNT))`, or use `args.custom_code` if provided.
  - Display the code phrase and "On the other end, run: tallow chat <code>".
  - Handle QR, clipboard copy (same as send.rs pattern).
  - Derive room ID: `tallow_protocol::room::code::derive_room_id(&code_phrase)`.

  **d) Relay connection (copy pattern from send.rs/receive.rs):**
  - Hash relay password if provided.
  - Establish connection via proxy-aware or direct path (same as send.rs).
  - Wait for peer.
  - Display "Peer connected!".

  **e) KEM handshake:**
  - Determine role: if `args.code.is_some()` then use `ReceiverHandshake` (joiner = responder); otherwise use `SenderHandshake` (initiator = sender).
  - Run the full 4-step handshake (copy exact pattern from send.rs for sender role, receive.rs for receiver role).
  - Display "Secure session established".
  - Optionally display verification string if `args.verify` is set.

  **f) Determine nonce parity:**
  - Initiator (sender role in handshake) uses even nonces: `nonce_counter = 0`.
  - Joiner (receiver role in handshake) uses odd nonces: `nonce_counter = 1`.

  **g) Chat loop using `tokio::select!`:**
  ```rust
  let mut stdin_lines = tokio::io::BufReader::new(tokio::io::stdin()).lines();
  let mut sequence: u64 = 0;
  let session_key_bytes = *session_key.as_bytes();
  let mut nonce_counter: u64 = if is_initiator { 0 } else { 1 };

  output::color::info("Chat session started. Type /quit to exit.");

  loop {
      tokio::select! {
          line = stdin_lines.next_line() => {
              match line? {
                  Some(text) if text.trim() == "/quit" => {
                      // Send ChatEnd to peer
                      let end_msg = Message::ChatEnd;
                      encode_and_send(&end_msg, &mut codec, &mut encode_buf, &mut channel).await?;
                      output::color::info("Chat ended.");
                      break;
                  }
                  Some(text) if text.trim().is_empty() => {
                      continue; // Skip empty lines
                  }
                  Some(text) => {
                      // Validate message size
                      if text.len() > tallow_protocol::chat::MAX_CHAT_MESSAGE_SIZE {
                          output::color::warning(&format!(
                              "Message too large ({} bytes, max {}). Not sent.",
                              text.len(), tallow_protocol::chat::MAX_CHAT_MESSAGE_SIZE
                          ));
                          continue;
                      }

                      // Encrypt
                      let (ciphertext, nonce) = tallow_protocol::chat::encrypt_chat_text(
                          &text, &session_key_bytes, &mut nonce_counter,
                      ).map_err(|e| io::Error::other(format!("Encrypt: {}", e)))?;

                      let message_id: [u8; 16] = rand::random();
                      let msg = Message::ChatText {
                          message_id,
                          sequence,
                          ciphertext,
                          nonce,
                      };
                      sequence += 1;

                      encode_and_send(&msg, &mut codec, &mut encode_buf, &mut channel).await?;

                      // Display locally (use output::color for "You:" prefix)
                      // Do NOT use println! -- use the output color module
                      output::color::info(&format!("You: {}", text));
                  }
                  None => {
                      // EOF on stdin
                      let end_msg = Message::ChatEnd;
                      encode_and_send(&end_msg, &mut codec, &mut encode_buf, &mut channel).await?;
                      break;
                  }
              }
          }
          n = channel.receive_message(&mut recv_buf) => {
              let n = n.map_err(|e| io::Error::other(format!("recv: {}", e)))?;
              let mut decode_buf = BytesMut::from(&recv_buf[..n]);
              let msg = codec.decode_msg(&mut decode_buf)
                  .map_err(|e| io::Error::other(format!("decode: {}", e)))?;

              match msg {
                  Some(Message::ChatText { ciphertext, nonce, .. }) => {
                      match tallow_protocol::chat::decrypt_chat_text(
                          &ciphertext, &nonce, &session_key_bytes,
                      ) {
                          Ok(text) => {
                              // Use a distinct style for peer messages
                              output::color::success(&format!("Peer: {}", text));
                          }
                          Err(e) => {
                              output::color::warning(&format!("Failed to decrypt message: {}", e));
                          }
                      }
                  }
                  Some(Message::ChatEnd) => {
                      output::color::info("Peer ended the chat.");
                      break;
                  }
                  Some(Message::PeerDeparted) => {
                      output::color::info("Peer disconnected.");
                      break;
                  }
                  Some(Message::Ping) => {
                      // Respond to keepalive
                      let pong = Message::Pong;
                      encode_and_send(&pong, &mut codec, &mut encode_buf, &mut channel).await?;
                  }
                  other => {
                      tracing::debug!("Ignoring unexpected message in chat: {:?}", other);
                  }
              }
          }
      }
  }

  channel.close().await;
  ```

  **h) Helper function `encode_and_send`** (defined as a local async fn or inline helper):
  ```rust
  async fn encode_and_send(
      msg: &Message,
      codec: &mut TallowCodec,
      encode_buf: &mut BytesMut,
      channel: &mut ConnectionResult,
  ) -> io::Result<()> {
      encode_buf.clear();
      codec.encode_msg(msg, encode_buf)
          .map_err(|e| io::Error::other(format!("encode: {}", e)))?;
      channel.send_message(encode_buf)
          .await
          .map_err(|e| io::Error::other(format!("send: {}", e)))?;
      Ok(())
  }
  ```

  **i) JSON output mode:** When `json` is true:
  - Emit `{"event": "code_generated", "code": "..."}` after generating code.
  - Emit `{"event": "peer_connected"}` after connection.
  - Emit `{"event": "session_established"}` after handshake.
  - Emit `{"event": "chat_message", "direction": "sent", "text": "..."}` for sent messages.
  - Emit `{"event": "chat_message", "direction": "received", "text": "..."}` for received messages.
  - Emit `{"event": "chat_ended"}` on exit.

  **j) Required imports:**
  ```rust
  use crate::cli::ChatArgs;
  use crate::output;
  use bytes::BytesMut;
  use std::io;
  use tokio::io::AsyncBufReadExt;
  use tallow_net::transport::PeerChannel;
  use tallow_protocol::wire::{codec::TallowCodec, Message};
  ```

- **Verification:**
  - `cargo build -p tallow` compiles cleanly.
  - `cargo clippy -p tallow -- -D warnings` clean.
  - Manual test: `cargo run -p tallow -- chat` generates a code phrase and waits for peer.
  - No `println!` in non-JSON code paths (use `output::color::*` helpers).
  - No `.unwrap()` calls.

---

### Wave 3: Tests + History Persistence (depends on Wave 2)

#### Task 3.1: Unit Tests for Chat Command Helpers

- **Files to modify:**
  - `crates/tallow-protocol/src/chat/encrypt.rs` (tests already added in Task 2.1, verify completeness)

- **What to do:**
  1. Verify all tests from Task 2.1 pass.
  2. Add a property test (proptest) for encrypt/decrypt round-trip with arbitrary Unicode strings:
     ```rust
     #[cfg(test)]
     mod proptests {
         use super::*;
         use proptest::prelude::*;

         proptest! {
             #[test]
             fn roundtrip_arbitrary_text(text in "\\PC{1,1000}") {
                 let key = [42u8; 32];
                 let mut counter = 0u64;
                 let (ct, nonce) = encrypt_chat_text(&text, &key, &mut counter).unwrap();
                 let decrypted = decrypt_chat_text(&ct, &nonce, &key).unwrap();
                 // sanitize_display may strip some control chars, so compare sanitized versions
                 let expected = crate::transfer::sanitize::sanitize_display(&text);
                 prop_assert_eq!(decrypted, expected);
             }
         }
     }
     ```
  3. Add a test verifying nonce collision prevention (sender even, receiver odd):
     ```rust
     #[test]
     fn test_nonce_parity_prevents_collision() {
         let key = [99u8; 32];
         let mut sender_counter = 0u64; // even
         let mut receiver_counter = 1u64; // odd

         let (_, nonce_s1) = encrypt_chat_text("hello", &key, &mut sender_counter).unwrap();
         let (_, nonce_r1) = encrypt_chat_text("hi", &key, &mut receiver_counter).unwrap();
         let (_, nonce_s2) = encrypt_chat_text("world", &key, &mut sender_counter).unwrap();
         let (_, nonce_r2) = encrypt_chat_text("there", &key, &mut receiver_counter).unwrap();

         // No nonce should equal any other
         assert_ne!(nonce_s1, nonce_r1);
         assert_ne!(nonce_s1, nonce_s2);
         assert_ne!(nonce_r1, nonce_r2);
         assert_ne!(nonce_s2, nonce_r2);
     }
     ```

- **Verification:**
  - `cargo test -p tallow-protocol chat` -- all pass
  - `cargo test -p tallow-protocol encrypt` -- all pass

#### Task 3.2: Wire Protocol Serialization Tests for Chat Variants

- **Files to modify:**
  - `crates/tallow-protocol/src/wire/messages.rs`

- **What to do:**
  1. Add a dedicated test function `test_chat_message_roundtrips`:
     ```rust
     #[test]
     fn test_chat_message_roundtrips() {
         let messages = vec![
             Message::ChatText {
                 message_id: [0xAA; 16],
                 sequence: 0,
                 ciphertext: vec![0xDE, 0xAD, 0xBE, 0xEF],
                 nonce: [0xBB; 12],
             },
             Message::ChatText {
                 message_id: [0xFF; 16],
                 sequence: u64::MAX,
                 ciphertext: vec![],
                 nonce: [0x00; 12],
             },
             Message::TypingIndicator { typing: true },
             Message::TypingIndicator { typing: false },
             Message::ReadReceipt {
                 message_ids: vec![],
             },
             Message::ReadReceipt {
                 message_ids: vec![[0x11; 16], [0x22; 16], [0x33; 16]],
             },
             Message::ChatEnd,
         ];

         for msg in &messages {
             let bytes = postcard::to_stdvec(msg).expect("encode");
             let decoded: Message = postcard::from_bytes(&bytes).expect("decode");
             assert_eq!(&decoded, msg);
         }
     }
     ```
  2. Verify `test_message_compact_encoding` for `ChatEnd` (should be very small, like Ping).

- **Verification:**
  - `cargo test -p tallow-protocol test_chat_message` -- passes
  - `cargo test -p tallow-protocol test_message_roundtrip` -- passes (existing variants unbroken)

#### Task 3.3: Chat History Persistence (Optional -- Low Priority)

- **Files to create:**
  - `crates/tallow-store/src/history/chat.rs`
- **Files to modify:**
  - `crates/tallow-store/src/history/mod.rs`

- **What to do:**
  1. Create `crates/tallow-store/src/history/chat.rs` with:
     ```rust
     use serde::{Deserialize, Serialize};
     use std::io;
     use std::path::PathBuf;

     /// A stored chat session record
     #[derive(Debug, Clone, Serialize, Deserialize)]
     pub struct ChatHistoryEntry {
         /// Session identifier (hex-encoded random bytes)
         pub session_id: String,
         /// Messages exchanged in this session
         pub messages: Vec<StoredChatMessage>,
         /// Unix timestamp when chat started
         pub started_at: u64,
         /// Unix timestamp when chat ended
         pub ended_at: u64,
     }

     /// A single stored chat message
     #[derive(Debug, Clone, Serialize, Deserialize)]
     pub struct StoredChatMessage {
         /// "local" or "peer"
         pub sender: String,
         /// Plaintext message content
         pub text: String,
         /// Unix timestamp
         pub timestamp: u64,
     }

     /// Chat history log
     pub struct ChatLog {
         path: PathBuf,
         entries: Vec<ChatHistoryEntry>,
     }
     ```
  2. Implement `ChatLog::open()`, `ChatLog::append()`, `ChatLog::entries()` following the exact same pattern as `TransferLog` in `crates/tallow-store/src/history/log.rs`.
  3. Add `pub mod chat;` to `crates/tallow-store/src/history/mod.rs`.
  4. In the chat command (Task 2.2), after the chat loop ends, log the session to `ChatLog`.

- **Verification:**
  - `cargo test -p tallow-store history` -- passes
  - `cargo clippy -p tallow-store -- -D warnings` clean

---

### Wave 4: Integration Verification + Polish (depends on Wave 3)

#### Task 4.1: Full Build and Lint Verification

- **Files:** None (verification only).

- **What to do:**
  1. Run `cargo build --workspace` -- must compile with zero errors.
  2. Run `cargo clippy --workspace -- -D warnings` -- must be clean.
  3. Run `cargo fmt --check` -- must pass.
  4. Run `cargo test --workspace` -- all existing tests plus new tests must pass. Pay particular attention to:
     - `cargo test -p tallow-protocol` (wire protocol, chat encryption)
     - `cargo test -p tallow-store` (chat history)
     - `cargo test -p tallow` (binary crate compiles)
  5. Verify no `println!` added outside JSON output paths (use `output::color::*` helpers).
  6. Verify no `.unwrap()` outside `#[cfg(test)]` blocks.
  7. Verify `#![forbid(unsafe_code)]` is not violated.

- **Verification:**
  - All five commands above exit 0.

#### Task 4.2: Manual End-to-End Smoke Test

- **Files:** None (testing only).

- **What to do:**
  1. Open two terminals.
  2. In terminal 1: `cargo run -p tallow -- chat` -- note the generated code phrase.
  3. In terminal 2: `cargo run -p tallow -- chat <code-phrase>`.
  4. Verify both terminals show "Peer connected!" and "Secure session established".
  5. Type a message in terminal 1 -- verify it appears in terminal 2 as "Peer: <message>".
  6. Type a message in terminal 2 -- verify it appears in terminal 1 as "Peer: <message>".
  7. Type `/quit` in terminal 1 -- verify terminal 2 shows "Peer ended the chat." and exits.
  8. Repeat with `--verify` flag to confirm safety numbers display.
  9. Test with `--json` flag and verify JSON events are emitted.
  10. Test Ctrl+C handling -- verify the other peer gets disconnected notification.

- **Verification:**
  - All steps complete without error.
  - No panic, no hang, no garbled output.

---

## Key Design Decisions

These decisions are locked by the Phase 18 research (`18-RESEARCH.md`):

1. **AES-256-GCM with KEM session key, NOT TripleRatchet for v1.** The TripleRatchet adds per-message key stepping complexity. Chat sessions are ephemeral -- the KEM-derived session key with counter nonces provides sufficient security. The existing `ChatSession` struct with its TripleRatchet integration remains untouched for future use but is NOT wired into this phase.

2. **Counter-based nonces with even/odd split.** Initiator uses even counters (0, 2, 4, ...), joiner uses odd counters (1, 3, 5, ...). This prevents nonce collision without coordination, following the TLS 1.3 / QUIC pattern.

3. **Line-by-line terminal chat, NOT TUI.** Full TUI chat (using the existing `ChatView`/`ChatInput` widgets) is deferred to a future phase. This phase uses `tokio::io::BufReader::new(tokio::io::stdin()).lines()` with `tokio::select!` for concurrent stdin + network reads.

4. **Four new `Message` variants: `ChatText`, `TypingIndicator`, `ReadReceipt`, `ChatEnd`.** Only `ChatText` and `ChatEnd` are actively used in v1. `TypingIndicator` and `ReadReceipt` are defined in the wire protocol for forward compatibility but not wired into the chat loop.

5. **Relay requires zero changes.** The relay forwards arbitrary bytes between paired peers in a room. Chat messages use the same room join + KEM handshake pipeline as file transfers.

6. **Chat rooms are exclusive.** One code phrase maps to one room. Running `tallow chat <code>` and `tallow send <code>` with the same code concurrently is undefined behavior (no session type negotiation in v1). This is documented as a known limitation.

7. **Domain separation via AAD.** Chat messages use `b"tallow-chat-v1"` as the AES-256-GCM additional authenticated data, distinct from file transfer chunk AAD. This prevents cross-protocol decryption.

8. **64 KB message size limit.** Chat plaintext is capped at 64 KB to prevent resource exhaustion. This is enforced before encryption.

9. **ANSI sanitization on all received text.** `sanitize_display()` is called on every decrypted chat message to prevent terminal injection attacks.

10. **Handshake role determined by CLI args.** `tallow chat` (no code) = initiator = SenderHandshake. `tallow chat <code>` = joiner = ReceiverHandshake. This is symmetric from the user's perspective -- either peer can start.

---

## Verification

### Automated
- `cargo build --workspace` -- zero errors
- `cargo test --workspace` -- all tests pass (existing + new)
- `cargo clippy --workspace -- -D warnings` -- clean
- `cargo fmt --check` -- clean

### Unit Tests Added
- Chat encryption round-trip (encrypt/decrypt)
- Nonce counter increment behavior
- Wrong key/nonce decryption failure
- Message size limit enforcement
- Unicode message round-trip
- ANSI sanitization on decrypted text
- Nonce parity collision prevention
- Wire protocol serialization round-trip for all four new variants
- Property test: arbitrary Unicode text encrypt/decrypt round-trip

### Manual Smoke Test
- Two-terminal chat session over relay (or localhost relay)
- Bidirectional message exchange
- `/quit` graceful termination
- Peer disconnect detection
- `--verify` flag displays safety numbers
- `--json` flag emits structured events
- `--tor` / `--proxy` flags accepted (functionality depends on proxy availability)

### Security Checklist
- [ ] No nonce reuse: even/odd counter split verified by test
- [ ] AAD domain separation: `b"tallow-chat-v1"` distinct from file transfer
- [ ] Input sanitization: `sanitize_display()` on all received text
- [ ] Message size cap: 64 KB enforced before encryption
- [ ] Session key zeroized on drop: `SessionKey` implements `Drop` with `Zeroize`
- [ ] No `.unwrap()` outside tests
- [ ] No `println!` outside JSON paths
- [ ] No `unsafe` blocks added
- [ ] `#![forbid(unsafe_code)]` maintained in tallow binary crate
