# Phase 18: Encrypted Chat Over Relay - Research

**Researched:** 2026-02-20
**Domain:** Encrypted real-time messaging over relay infrastructure
**Confidence:** HIGH

## Summary

Phase 18 adds real-time E2E encrypted text chat between peers using the existing relay room infrastructure. The codebase already has substantial scaffolding for chat: a `ChatSession` struct in `tallow-protocol/src/chat/session.rs` with mpsc channel-based message I/O and TripleRatchet encryption, a `ChatMessage` type with send/receive/encrypt/decrypt support, and TUI widgets (`ChatView`, `ChatInput`, `MessageBubble`) with scrolling, cursor management, and delivery status indicators. The CLI already has a `tallow chat` command defined (with `ChatArgs`) though its implementation is a placeholder that prints "Chat is planned for Tallow v2."

The primary work is **wiring**, not building from scratch. The relay server already forwards arbitrary bytes between paired peers in a room -- it does not care whether those bytes are file transfer chunks or chat messages. The KEM handshake infrastructure (`SenderHandshake`/`ReceiverHandshake`) establishes a session key that can be reused for chat encryption. The wire protocol `Message` enum needs new chat-specific variants (`ChatText`, `TypingIndicator`, `ReadReceipt`), and the chat command needs a real implementation that connects to the relay, performs the handshake, and runs an interactive message loop.

**Primary recommendation:** Add 3-4 new `Message` variants for chat, wire the existing `ChatSession` into the relay connection pipeline (same room join + KEM handshake as file transfer), implement the `tallow chat` command as a line-by-line terminal chat (not full TUI -- save TUI chat panel for a future phase), and persist chat history to the encrypted KV store.

## Standard Stack

### Core (Already in Workspace)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tallow-protocol::chat` | workspace | ChatMessage, ChatSession types | Already exists, has TripleRatchet encryption built in |
| `tallow-protocol::wire` | workspace | Message enum for wire protocol | Postcard-serialized, length-prefixed framing works for chat |
| `tallow-protocol::kex` | workspace | SenderHandshake/ReceiverHandshake | KEM + CPace handshake for session key establishment |
| `tallow-crypto::ratchet` | workspace | TripleRatchet (Double + Sparse PQ) | Already wired into ChatSession.enable_encryption() |
| `tallow-net::relay` | workspace | RelayClient for QUIC connections | Same relay connection used for file transfers |
| `tokio` | 1.x | Async runtime | Already the project runtime |
| `crossterm` | 0.28+ | Terminal raw mode, key events | Already a dependency via tallow-tui |
| `chrono` | 0.4 | Timestamp formatting | Already used in chat_view.rs for HH:MM display |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tallow-store::persistence` | workspace | EncryptedKv for chat history | Persist chat messages encrypted at rest |
| `tallow-protocol::transfer::sanitize` | workspace | sanitize_display() | Sanitize all incoming chat text (already called in ChatSession.receive()) |
| `indicatif` | 0.17 | Spinner while waiting for peer | Show "Waiting for peer..." spinner |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TripleRatchet (per-message keys) | Session key AES-256-GCM directly | TripleRatchet provides forward secrecy per message but adds complexity. For an ephemeral chat session, direct AES-GCM with the KEM-derived key is simpler and sufficient. **Recommendation: Use AES-256-GCM directly for v1 chat, not TripleRatchet.** Rationale: chat sessions are ephemeral (no state persisted between sessions), the session key is already derived from a full KEM handshake with forward secrecy, and the TripleRatchet adds step() calls that create sync complexity for bidirectional real-time messaging. |
| Full TUI chat panel | Line-by-line terminal chat | Full TUI requires integrating ChatView/ChatInput widgets into the TUI render pipeline. Line-by-line (like IRC/croc) is simpler, works everywhere, and gets chat shipped faster. **Recommendation: Line-by-line for Phase 18; TUI chat panel in a future phase.** |
| Custom message ordering | Simple sequence numbers | Chat messages are point-to-point (2 peers only), so out-of-order delivery is extremely unlikely over a single QUIC stream. **Recommendation: Sequence numbers for detection, but no reordering buffer.** |

## Architecture Patterns

### Recommended Module Changes

```
crates/tallow-protocol/src/
  wire/messages.rs        # ADD: ChatText, TypingIndicator, ReadReceipt, ChatEnd variants
  chat/message.rs         # MODIFY: Add message_id as [u8; 16], add sequence_num field
  chat/session.rs         # MODIFY: Use AES-256-GCM with session key instead of TripleRatchet
  chat/history.rs         # NEW: Chat history persistence (encrypted KV)

crates/tallow/src/
  commands/chat.rs        # REWRITE: Full chat command implementation
  cli.rs                  # MODIFY: Expand ChatArgs with relay/proxy/verify flags
```

### Pattern 1: Reuse Relay Room + KEM Handshake Pipeline

**What:** Chat uses the exact same connection flow as file transfer -- generate code phrase, derive room ID, connect to relay, join room, perform KEM handshake, then switch to chat message loop instead of file transfer loop.

**When to use:** Always. The relay is content-agnostic.

**Example:**
```rust
// Chat command reuses the same connection setup as send.rs
let code_phrase = generate_or_use_code(&args);
let room_id = derive_room_id(&code_phrase);

// Connect to relay (same as send.rs)
let mut relay = RelayClient::new(relay_addr);
relay.connect(&room_id, pw_ref).await?;
if !relay.peer_present() {
    relay.wait_for_peer().await?;
}

// KEM handshake (same as send.rs)
let mut handshake = SenderHandshake::new(&code_phrase, &room_id);
// ... 4-step handshake ...
let session_key = handshake_result;

// NOW: instead of file transfer loop, run chat message loop
run_chat_loop(&mut channel, &session_key, &mut codec).await?;
```

### Pattern 2: Bidirectional Message Loop with tokio::select!

**What:** Chat requires simultaneous reading from stdin (user typing) AND from the network (peer messages). Use `tokio::select!` with two async branches.

**When to use:** The core chat loop.

**Example:**
```rust
async fn run_chat_loop(
    channel: &mut ConnectionResult,
    session_key: &[u8; 32],
    codec: &mut TallowCodec,
) -> io::Result<()> {
    let mut stdin_lines = BufReader::new(tokio::io::stdin()).lines();
    let mut recv_buf = vec![0u8; 256 * 1024];
    let mut nonce_counter: u64 = 0;

    loop {
        tokio::select! {
            // User typed a line
            line = stdin_lines.next_line() => {
                match line? {
                    Some(text) if text == "/quit" => break,
                    Some(text) => {
                        let encrypted = encrypt_chat_message(
                            &text, session_key, &mut nonce_counter
                        )?;
                        send_chat_message(channel, codec, &encrypted).await?;
                        println!("You: {}", text);
                    }
                    None => break, // EOF
                }
            }
            // Peer sent a message
            n = channel.receive_message(&mut recv_buf) => {
                let n = n.map_err(|e| io::Error::other(format!("recv: {}", e)))?;
                let msg = decode_chat_message(codec, &recv_buf[..n])?;
                let plaintext = decrypt_chat_message(&msg, session_key)?;
                let safe = sanitize_display(&plaintext);
                println!("Peer: {}", safe);
            }
        }
    }
    Ok(())
}
```

### Pattern 3: Chat-Specific Wire Messages

**What:** Add new `Message` variants for chat rather than overloading file transfer messages. This keeps the protocol clean and allows the relay to remain content-agnostic (it forwards all messages identically).

**When to use:** Wire protocol extension.

**Example:**
```rust
// New variants to add to Message enum
/// Encrypted chat text message
ChatText {
    /// Message ID (random 16 bytes, for read receipts)
    message_id: [u8; 16],
    /// Sequence number (for ordering)
    sequence: u64,
    /// AES-256-GCM encrypted message text
    ciphertext: Vec<u8>,
    /// AES-256-GCM nonce (12 bytes)
    nonce: [u8; 12],
},
/// Typing indicator
TypingIndicator {
    /// true = started typing, false = stopped
    typing: bool,
},
/// Read receipt
ReadReceipt {
    /// Message IDs that have been read
    message_ids: Vec<[u8; 16]>,
},
/// End chat session gracefully
ChatEnd,
```

### Pattern 4: AES-256-GCM Per-Message Encryption with Counter Nonces

**What:** Each chat message is encrypted with AES-256-GCM using the KEM-derived session key and a counter-based nonce. The counter is split: sender uses even nonces, receiver uses odd nonces. This prevents nonce collision without coordination.

**When to use:** All chat message encryption.

**Example:**
```rust
fn encrypt_chat_message(
    plaintext: &str,
    session_key: &[u8; 32],
    nonce_counter: &mut u64,
) -> Result<(Vec<u8>, [u8; 12])> {
    // Counter-based nonce: 4 bytes zero || 8 bytes counter
    let mut nonce = [0u8; 12];
    nonce[4..].copy_from_slice(&nonce_counter.to_be_bytes());
    *nonce_counter += 2; // Skip by 2 (even for sender, odd for receiver)

    let ciphertext = tallow_crypto::symmetric::aes_encrypt(
        session_key,
        &nonce,
        plaintext.as_bytes(),
        b"tallow-chat-v1", // AAD for domain separation
    )?;

    Ok((ciphertext, nonce))
}
```

### Anti-Patterns to Avoid

- **Don't build a message queue/broker:** The relay is already a simple forwarder. Chat messages flow directly peer-to-peer through the relay. No need for store-and-forward, message persistence on the relay, or delivery guarantees beyond the QUIC stream.
- **Don't use the TripleRatchet for v1 chat:** It adds per-message key stepping complexity. The KEM-derived session key with counter nonces is sufficient for ephemeral chat sessions. TripleRatchet is better suited for persistent messaging apps where sessions span days/weeks.
- **Don't build a full TUI chat mode in this phase:** Line-by-line terminal chat (like IRC or croc's messaging) is simpler, testable, and delivers value faster. The TUI ChatView/ChatInput widgets exist but wiring them into the TUI render pipeline is a separate effort.
- **Don't add group chat:** The relay room is limited to 2 peers (MAX_PARTICIPANTS = 2). Multi-party chat would require room architecture changes. Keep it 1:1 for now.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Message encryption | Custom encrypt/decrypt | `tallow_crypto::symmetric::aes_encrypt/aes_decrypt` | Already tested, handles AEAD correctly |
| Key exchange | New handshake protocol | `SenderHandshake`/`ReceiverHandshake` from `tallow_protocol::kex` | Full KEM + CPace handshake already implemented and tested |
| Relay connection | Custom transport | `RelayClient` from `tallow_net::relay` | Room join, peer waiting, QUIC transport all working |
| Wire framing | Custom codec | `TallowCodec` from `tallow_protocol::wire::codec` | Postcard + length-prefix framing already working |
| Input sanitization | Custom ANSI stripping | `sanitize_display()` from `tallow_protocol::transfer::sanitize` | Already called in ChatSession.receive(), handles 20+ attack vectors |
| Nonce management | Random nonces | Counter-based nonces (same pattern as file transfer chunks) | Guaranteed unique, no birthday bound risk |
| Chat message IDs | UUID library | `rand::random::<[u8; 16]>()` | Already used throughout codebase for transfer_id |

**Key insight:** ~80% of the infrastructure needed for chat already exists. The relay forwards arbitrary bytes between paired peers. The KEM handshake establishes a session key. AES-256-GCM encrypts data. The wire codec frames messages. The work is connecting these pieces with chat-specific message types and a chat loop in the CLI command.

## Common Pitfalls

### Pitfall 1: Nonce Reuse Between Sender and Receiver

**What goes wrong:** Both peers start their nonce counter at 0 and encrypt with the same session key, causing AES-256-GCM nonce reuse (catastrophic: reveals plaintext XOR).

**Why it happens:** The session key is symmetric -- both sides hold the same key. If both use counter=0 for their first message, the same (key, nonce) pair encrypts two different plaintexts.

**How to avoid:** Split the nonce space. The session initiator (sender role from handshake) uses even counters (0, 2, 4, ...) and the responder uses odd counters (1, 3, 5, ...). This is the same pattern used in TLS and QUIC.

**Warning signs:** Test where both peers send simultaneously and check nonce values are never equal.

### Pitfall 2: Blocking stdin Read Starves Network Reads

**What goes wrong:** Using synchronous `stdin().read_line()` blocks the async runtime, preventing incoming messages from being processed until the user presses Enter.

**Why it happens:** Standard library stdin is blocking. In a tokio context, this blocks the entire executor thread.

**How to avoid:** Use `tokio::io::BufReader::new(tokio::io::stdin()).lines()` for async line reading, combined with `tokio::select!` for concurrent stdin + network reads. Alternatively, use crossterm's event stream for key-by-key input (needed for typing indicators).

**Warning signs:** Messages from the peer only appear after the local user presses Enter.

### Pitfall 3: Forgetting ANSI Sanitization on Received Messages

**What goes wrong:** A malicious peer sends chat messages containing ANSI escape sequences that manipulate the receiver's terminal (cursor movement, color changes, screen clearing, command injection via OSC sequences).

**Why it happens:** Directly printing received text to the terminal without sanitization.

**How to avoid:** `ChatSession.receive()` already calls `sanitize_display()` on the decrypted text. Ensure all paths that display peer text go through this sanitization. In the CLI chat command, never print raw network data.

**Warning signs:** Property tests with ANSI sequences in message text that verify they are stripped.

### Pitfall 4: Race Condition Between Chat and File Transfer on Same Room

**What goes wrong:** A user starts `tallow chat` and `tallow send` with the same code phrase, and the chat peer receives file transfer messages (or vice versa).

**Why it happens:** Both use the same relay room mechanism. The relay doesn't distinguish message types.

**How to avoid:** Add a session type field to the handshake or use the first message after handshake to declare intent (chat vs transfer). Alternatively, accept that one code phrase = one session type, and document this clearly. The handshake protocol already uses `protocol_version: 2` -- could add a `session_type` field.

**Warning signs:** Test that running `tallow chat <code>` against `tallow send <code>` produces a clean error.

### Pitfall 5: No Graceful Shutdown Signal

**What goes wrong:** One peer closes their terminal (Ctrl+C, kill), and the other peer's chat loop hangs waiting for the next message forever.

**Why it happens:** The QUIC stream read blocks indefinitely when the peer disconnects. Without a timeout or disconnect detection, the remaining peer is stuck.

**How to avoid:** 1) Detect stream closure (receive returns error or 0 bytes). 2) Send `ChatEnd` message before disconnecting (graceful). 3) Add a read timeout (e.g., 60s idle detection). 4) The relay sends `PeerDeparted` when one peer drops -- detect this and exit the chat loop.

**Warning signs:** Test where one peer exits and verify the other peer gets a "Peer disconnected" message within a few seconds.

### Pitfall 6: Message Size Limits

**What goes wrong:** A user pastes a 50MB text blob into chat, overwhelming the relay and peer.

**Why it happens:** No size limit on chat message text.

**How to avoid:** Cap chat messages at a reasonable size (e.g., 64 KB). Reject oversized messages before encryption. The relay already has a 16 MB max message size check, but chat messages should be much smaller.

**Warning signs:** Test with messages at and beyond the limit.

## Code Examples

### Wire Protocol Message Extension

```rust
// Add to Message enum in crates/tallow-protocol/src/wire/messages.rs
/// Encrypted chat text message
ChatText {
    /// Unique message ID for read receipts
    message_id: [u8; 16],
    /// Monotonic sequence number for ordering
    sequence: u64,
    /// AES-256-GCM encrypted plaintext
    ciphertext: Vec<u8>,
    /// 12-byte nonce used for encryption
    nonce: [u8; 12],
},
/// Typing indicator (sent periodically while user types)
TypingIndicator {
    /// true = started typing, false = stopped typing
    typing: bool,
},
/// Read receipt acknowledging messages
ReadReceipt {
    /// Message IDs confirmed as read
    message_ids: Vec<[u8; 16]>,
},
/// Graceful chat session termination
ChatEnd,
```

### Chat Command CLI Args (Expand Existing ChatArgs)

```rust
// Modify ChatArgs in crates/tallow/src/cli.rs
#[derive(Args)]
pub struct ChatArgs {
    /// Code phrase to join or create a chat room
    pub code: Option<String>,

    /// Use a custom code phrase
    #[arg(short = 'c', long = "code")]
    pub custom_code: Option<String>,

    /// Number of words in generated code phrase (default: 4)
    #[arg(long)]
    pub words: Option<usize>,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433", env = "TALLOW_RELAY")]
    pub relay: String,

    /// Relay password
    #[arg(long = "relay-pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pub relay_pass: Option<String>,

    /// SOCKS5 proxy address
    #[arg(long, env = "TALLOW_PROXY")]
    pub proxy: Option<String>,

    /// Route through Tor
    #[arg(long)]
    pub tor: bool,

    /// Display verification string after key exchange
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

### Chat Message Encryption/Decryption

```rust
/// Maximum chat message size (64 KB plaintext)
const MAX_CHAT_MESSAGE_SIZE: usize = 64 * 1024;

/// Chat message AAD for domain separation
const CHAT_AAD: &[u8] = b"tallow-chat-v1";

/// Encrypt a chat message with AES-256-GCM
fn encrypt_chat_text(
    plaintext: &str,
    session_key: &[u8; 32],
    nonce_counter: &mut u64,
) -> Result<(Vec<u8>, [u8; 12])> {
    if plaintext.len() > MAX_CHAT_MESSAGE_SIZE {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("Message too large ({} bytes, max {})", plaintext.len(), MAX_CHAT_MESSAGE_SIZE),
        ));
    }

    let mut nonce = [0u8; 12];
    nonce[4..].copy_from_slice(&nonce_counter.to_be_bytes());
    *nonce_counter += 2; // Even/odd split

    let ciphertext = tallow_crypto::symmetric::aes_encrypt(
        session_key,
        &nonce,
        plaintext.as_bytes(),
        CHAT_AAD,
    ).map_err(|e| io::Error::other(format!("Encrypt failed: {}", e)))?;

    Ok((ciphertext, nonce))
}

/// Decrypt a chat message
fn decrypt_chat_text(
    ciphertext: &[u8],
    nonce: &[u8; 12],
    session_key: &[u8; 32],
) -> Result<String> {
    let plaintext = tallow_crypto::symmetric::aes_decrypt(
        session_key,
        nonce,
        ciphertext,
        CHAT_AAD,
    ).map_err(|e| io::Error::other(format!("Decrypt failed: {}", e)))?;

    let text = String::from_utf8(plaintext)
        .map_err(|e| io::Error::other(format!("Invalid UTF-8: {}", e)))?;

    // Sanitize to strip ANSI escapes and control characters
    Ok(tallow_protocol::transfer::sanitize::sanitize_display(&text))
}
```

### Chat History Persistence

```rust
// In crates/tallow-store/src/persistence/paths.rs
/// Path to chat history file
pub fn chat_history_file() -> PathBuf {
    data_dir().join("chat_history.json")
}

// Chat history entry (similar to TransferEntry)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatHistoryEntry {
    pub session_id: String,
    pub peer_fingerprint: String,
    pub messages: Vec<StoredChatMessage>,
    pub started_at: u64,
    pub ended_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredChatMessage {
    pub sender: String, // "local" or peer fingerprint
    pub text: String,   // plaintext (encrypted at rest via EncryptedKv)
    pub timestamp: u64,
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Code-phrase-derived keys | ML-KEM-1024 + X25519 hybrid KEM | Phase 11 | Session keys have PQ forward secrecy |
| TripleRatchet for all messaging | Direct AES-256-GCM for ephemeral sessions | Current recommendation | Simpler for short-lived chat sessions; TripleRatchet still available for persistent messaging |
| Plaintext chat history | Encrypted at-rest via EncryptedKv | Available now | Chat messages protected when stored locally |

**Existing infrastructure summary:**

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| ChatMessage struct | `tallow-protocol/src/chat/message.rs` | Exists, needs modification | Has id, sender, text, timestamp, encrypted fields. Needs message_id as `[u8; 16]` and sequence number |
| ChatSession struct | `tallow-protocol/src/chat/session.rs` | Exists, needs simplification | Has TripleRatchet encryption, mpsc channels. Simplify to use direct AES-256-GCM |
| ChatArgs CLI | `tallow/src/cli.rs` | Exists, needs expansion | Has peer and room fields only. Needs relay, proxy, verify, qr flags |
| Chat command | `tallow/src/commands/chat.rs` | Stub only | Prints "planned for v2". Full rewrite needed |
| ChatView widget | `tallow-tui/src/widgets/chat_view.rs` | Exists, complete | Scrollable message display with alignment, status, timestamps |
| ChatInput widget | `tallow-tui/src/widgets/chat_input.rs` | Exists, complete | Multi-line input with cursor, unicode support |
| MessageBubble widget | `tallow-tui/src/widgets/message_bubble.rs` | Exists, complete | Styled bubbles for sent/received messages |
| Wire Message enum | `tallow-protocol/src/wire/messages.rs` | Needs new variants | Currently has file transfer + handshake messages only |
| Relay server | `tallow-relay/src/server.rs` | Works, no changes needed | Already forwards arbitrary bytes between paired peers |
| sanitize_display | `tallow-protocol/src/transfer/sanitize.rs` | Works, already used | Already called in ChatSession.receive() |

## Open Questions

1. **Should chat share a room with file transfer or be exclusive?**
   - What we know: Both use the same room mechanism. The relay is content-agnostic.
   - What's unclear: Whether a user might want to chat AND send files in the same session.
   - Recommendation: For v1, make chat exclusive (one room = one purpose). Add a "session type" byte after the handshake to disambiguate. Future work: allow chat + file transfer in the same session by multiplexing message types.

2. **Should typing indicators use raw mode or cooked line mode?**
   - What we know: Line-by-line mode (stdin readline) is simpler but can't detect mid-line typing. Raw mode (crossterm events) enables typing indicators but is more complex.
   - What's unclear: How much users value typing indicators in a CLI tool.
   - Recommendation: Use cooked line mode for v1 (simpler, reliable). Typing indicators can be added later when TUI chat panel is built.

3. **How should chat history be persisted?**
   - What we know: `EncryptedKv` exists for encrypted at-rest storage. `TransferLog` uses JSON files.
   - What's unclear: Whether to use EncryptedKv (per-message overhead) or a dedicated JSON file (simpler but less granular encryption).
   - Recommendation: Use a simple JSON file at `~/.local/share/tallow/chat_history.json` with the entire file encrypted via the identity passphrase (consistent with how identity.enc works). Keep it simple.

4. **Should the chat command be `tallow chat` (create) + `tallow chat <code>` (join) or two separate subcommands?**
   - What we know: `tallow send` creates a room, `tallow receive <code>` joins it. The existing ChatArgs has an optional `code` field.
   - Recommendation: `tallow chat` creates a room and shows the code. `tallow chat <code>` joins an existing room. Same pattern as send/receive but symmetric (either peer can start).

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** (direct file reads):
  - `tallow-protocol/src/chat/session.rs` -- ChatSession with TripleRatchet encryption, mpsc channels
  - `tallow-protocol/src/chat/message.rs` -- ChatMessage struct
  - `tallow-protocol/src/wire/messages.rs` -- Full Message enum (27+ variants)
  - `tallow-protocol/src/kex.rs` -- SenderHandshake/ReceiverHandshake with KEM + CPace
  - `tallow/src/commands/send.rs` -- Complete send pipeline (connection + handshake + data loop)
  - `tallow/src/commands/chat.rs` -- Stub implementation ("planned for v2")
  - `tallow/src/cli.rs` -- ChatArgs definition
  - `tallow-relay/src/server.rs` -- Relay forwards arbitrary bytes, content-agnostic
  - `tallow-relay/src/room.rs` -- Room management, 2-peer limit
  - `tallow-tui/src/widgets/chat_view.rs` -- ChatView widget with scrolling
  - `tallow-tui/src/widgets/chat_input.rs` -- ChatInput widget with cursor
  - `tallow-tui/src/widgets/message_bubble.rs` -- MessageBubble widget
  - `tallow-store/src/persistence/encrypted_kv.rs` -- EncryptedKv store
  - `tallow-store/src/history/log.rs` -- TransferLog persistence pattern
  - `tallow-crypto/src/ratchet/triple.rs` -- TripleRatchet implementation

### Secondary (MEDIUM confidence)
- AES-256-GCM nonce splitting pattern (even/odd) is standard practice from TLS 1.3 and QUIC (RFC 9001)
- Relay-based E2E chat architecture is well-established (Signal, Matrix, Wire all use untrusted relays)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already exist in the workspace, no new dependencies needed
- Architecture: HIGH - Pattern directly mirrors the existing send.rs pipeline, just with a different message loop
- Pitfalls: HIGH - Derived from direct codebase analysis and known AES-GCM/relay constraints
- Wire protocol: HIGH - Existing Message enum is straightforward to extend with postcard

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- stable codebase, no external dependency changes expected)
