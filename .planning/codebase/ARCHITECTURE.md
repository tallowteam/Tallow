# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Layered library crates feeding two binary crates (CLI + relay server), with strict unidirectional dependency enforcement across crate boundaries.

**Key Characteristics:**
- Pure crypto layer (`tallow-crypto`) with zero I/O — all cryptographic operations are pure functions that take `&[u8]` and return owned types
- Network layer (`tallow-net`) knows nothing about files or transfer semantics — operates only on raw byte streams
- Protocol layer (`tallow-protocol`) is the integration hub, connecting crypto and net to implement transfer logic
- Two independent binary crates: `tallow` (user-facing CLI + TUI) and `tallow-relay` (server)
- Feature-gated optional components: TUI (`tui`), QUIC (`quic`), AEGIS cipher (`aegis`), Tor (`onion`)

## Layers

**Cryptographic Primitives (`tallow-crypto`):**
- Purpose: All cryptographic operations — key exchange, encryption, signing, hashing, PAKE, ratcheting, file-level crypto
- Location: `crates/tallow-crypto/src/`
- Contains: Pure functions operating on `&[u8]` inputs; no async, no I/O, no std::fs
- Depends on: No internal crates; only external crypto crates (RustCrypto ecosystem, pqcrypto)
- Used by: `tallow-net`, `tallow-protocol`, `tallow-store`, `tallow-tui`, `tallow`
- Constraint: `#![forbid(unsafe_code)]` except `mem/wipe.rs` which requires `libc::setrlimit`

**Network Transport (`tallow-net`):**
- Purpose: Transport abstractions, NAT traversal, local discovery, relay client, privacy (Tor/DoH/traffic shaping)
- Location: `crates/tallow-net/src/`
- Contains: Async network code, QUIC/TCP-TLS transports, mDNS, STUN/TURN/UPnP, SOCKS5 proxy, DoH resolver
- Depends on: `tallow-crypto` (for TLS, session key usage)
- Used by: `tallow-protocol`, `tallow-tui`, `tallow`
- Constraint: No knowledge of file transfer semantics or file types

**Wire Protocol & Transfer (`tallow-protocol`):**
- Purpose: Wire message codec, file transfer pipeline, room management, compression pipeline, chat, metadata handling
- Location: `crates/tallow-protocol/src/`
- Contains: `Message` enum (wire format), `SendPipeline`/`ReceivePipeline`, `TransferStateMachine`, chunking, resume, compression (zstd/brotli/lz4/lzma), EXIF stripping, filename encryption
- Depends on: `tallow-crypto`, `tallow-net`
- Used by: `tallow-tui`, `tallow`

**Persistent Storage (`tallow-store`):**
- Purpose: Configuration, identity keypair storage, trust database (TOFU), contacts, transfer history, encrypted key-value store
- Location: `crates/tallow-store/src/`
- Contains: TOML config loader, `TallowConfig` schema, `IdentityStore`, `TofuStore`, `EncryptedKv`, XDG path resolution
- Depends on: `tallow-crypto` (for encrypted persistence)
- Used by: `tallow-tui`, `tallow`

**Relay Server (`tallow-relay`):**
- Purpose: Self-hostable pass-through relay — never sees plaintext, only forwards encrypted bytes between peers
- Location: `crates/tallow-relay/src/`
- Contains: `RelayServer`, signaling, rate limiting, auth, config
- Depends on: `tallow-net` (subset — no full dependency chain)
- Used by: nothing (standalone binary)

**Terminal UI (`tallow-tui`):**
- Purpose: Ratatui immediate-mode TUI with panels, overlays, widgets — full dashboard for managing transfers
- Location: `crates/tallow-tui/src/`
- Contains: `TuiApp`, `App` state, `EventHandler`, render loop, panels (status/transfers/devices), overlays (help), 30+ widgets (file browser, chat view, transfer progress, trust badge, etc.)
- Depends on: `tallow-crypto`, `tallow-net`, `tallow-protocol`, `tallow-store`
- Used by: `tallow` (feature-gated via `tui` feature)

**Main CLI Binary (`tallow`):**
- Purpose: CLI argument parsing, command dispatch, output formatting, OS sandbox, runtime initialization
- Location: `crates/tallow/src/`
- Contains: `Cli`/`Commands` (clap derive), command handlers, `output/` (progress bars, prompts, JSON, color), `sandbox.rs` (Landlock/Seccomp/Pledge), `logging.rs`, `runtime.rs`
- Depends on: All library crates (TUI optional)
- Used by: End users

## Data Flow

**File Send:**

1. User invokes `tallow send <file> --room <code>` — parsed by `crates/tallow/src/cli.rs` via clap
2. `commands::send::execute()` in `crates/tallow/src/commands/send.rs` dispatches the operation
3. `tallow-protocol::transfer::SendPipeline` orchestrates: reads file, chunks at 64 KB boundaries via `crates/tallow-protocol/src/transfer/chunking.rs`
4. Each chunk optionally compressed via `crates/tallow-protocol/src/compression/pipeline.rs` (adaptive: zstd/brotli/lz4/lzma)
5. Metadata stripped (EXIF) and filenames encrypted via `crates/tallow-protocol/src/metadata/`
6. `tallow-crypto::kem::HybridKem` performs ML-KEM-1024 + X25519 key exchange; session key derived via `tallow-crypto::kdf::hkdf`
7. Each chunk encrypted with `tallow-crypto::symmetric` (AES-256-GCM default, ChaCha20-Poly1305 fallback); counter-based nonces via `crates/tallow-crypto/src/symmetric/nonce.rs`
8. Encrypted bytes serialized via `tallow-protocol::wire::TallowCodec` (bincode) and sent over `tallow-net::transport::Transport` (QUIC or TCP-TLS)
9. If direct path fails, `tallow-net::relay::client` forwards through relay; NAT traversal via `tallow-net::nat` (STUN/TURN/UPnP/hole-punch)
10. Progress reported back via `tallow-protocol::transfer::TransferProgress` → output layer (`crates/tallow/src/output/progress.rs`)

**File Receive:**

1. `tallow-protocol::transfer::ReceivePipeline` listens for incoming `Message::Chunk` frames
2. Each chunk's AES-GCM authentication tag verified before any data written to disk
3. Chunks re-assembled using chunk index from AAD; final chunk validates total count
4. Decompressed, metadata re-attached, written to download directory
5. Transfer logged in `tallow-store::history`

**Key Exchange:**

1. Both peers connect to relay using room code (`BLAKE3` hash of code phrase) via `crates/tallow-protocol/src/room/code.rs`
2. Handshake message exchanged: `Message::Handshake { version, peer_id }`
3. Hybrid KEM: `tallow-crypto::kem::HybridKem` encapsulates with ML-KEM-1024 + X25519
4. Session key derived with HKDF-SHA256 with domain separation via `crates/tallow-crypto/src/hash/domain.rs`
5. Peer identity verified via `tallow-crypto::sig::HybridSigner` (ML-DSA-87 + Ed25519); trust checked via `tallow-store::trust::TofuStore`
6. Optional PAKE: `tallow-crypto::pake` (CPace or OPAQUE) for password-authenticated sessions

**State Management:**
- Transfer state managed by `tallow-protocol::transfer::TransferStateMachine` (in `crates/tallow-protocol/src/transfer/state_machine.rs`)
- TUI application state in `tallow-tui::app::App` (`crates/tallow-tui/src/app.rs`): mode, focused panel, running flag
- Persistent state (config, identity, contacts, trust, history) in `tallow-store` backed by encrypted key-value store (`crates/tallow-store/src/persistence/encrypted_kv.rs`)

## Key Abstractions

**`Transport` Trait:**
- Purpose: Abstracts over QUIC and TCP-TLS connections
- Location: `crates/tallow-net/src/transport/mod.rs`
- Pattern: Async trait with `connect`, `send`, `receive` methods; implementors are `QuicTransport` (`crates/tallow-net/src/transport/quic.rs`) and `TcpTlsTransport` (`crates/tallow-net/src/transport/tcp_tls.rs`)

**`CipherSuite` Enum:**
- Purpose: Runtime cipher selection (AES-256-GCM vs ChaCha20-Poly1305 vs AEGIS-256)
- Location: `crates/tallow-crypto/src/symmetric/mod.rs`
- Pattern: `Default::default()` calls `select_cipher()` which detects AES-NI hardware support

**`Message` Enum:**
- Purpose: Typed wire protocol messages (handshake, file offer/accept/reject, chunks, ack, chat, room join/leave, ping/pong)
- Location: `crates/tallow-protocol/src/wire/messages.rs`
- Pattern: `serde` tagged enum, serialized with `bincode` via `TallowCodec`

**`TallowConfig` Struct:**
- Purpose: Typed configuration with sub-structs for network, transfer, privacy, UI settings
- Location: `crates/tallow-store/src/config/schema.rs`
- Pattern: TOML-backed, loaded via `crates/tallow-store/src/config/loader.rs`, XDG paths via `crates/tallow-store/src/persistence/paths.rs`

**`TransferStateMachine`:**
- Purpose: Tracks transfer lifecycle state transitions
- Location: `crates/tallow-protocol/src/transfer/state_machine.rs`
- Pattern: Explicit state enum (`TransferState`) with guarded transitions

**`HybridKem` and `HybridSigner`:**
- Purpose: Post-quantum + classical hybrid security — KEM combines ML-KEM-1024 with X25519; signatures combine ML-DSA-87 with Ed25519
- Locations: `crates/tallow-crypto/src/kem/hybrid.rs`, `crates/tallow-crypto/src/sig/hybrid.rs`
- Pattern: Neither classical nor post-quantum alone — both must succeed for operation to proceed

## Entry Points

**`tallow` CLI Binary:**
- Location: `crates/tallow/src/main.rs`
- Triggers: User shell invocation
- Responsibilities: Parse CLI args (clap), initialize logging, dispatch to command handlers in `crates/tallow/src/commands/`, handle top-level error and exit code

**`tallow-relay` Server Binary:**
- Location: `crates/tallow-relay/src/main.rs`
- Triggers: Server operator shell invocation (`tallow-relay serve --addr 0.0.0.0:443`)
- Responsibilities: Start relay server on configured bind address, handle signaling between peers

**`tallow-crypto::init()`:**
- Location: `crates/tallow-crypto/src/lib.rs`
- Triggers: Called once at application startup before any crypto operations
- Responsibilities: Disable core dumps via `mem::wipe::prevent_core_dumps()`

**`sandbox::apply_sandbox()`:**
- Location: `crates/tallow/src/sandbox.rs`
- Triggers: Called after initialization completes (config loaded, keys ready, network started)
- Responsibilities: Apply OS-level restrictions — Landlock + Seccomp on Linux, Pledge + Unveil on OpenBSD, App Sandbox on macOS

**`TuiApp::run()`:**
- Location: `crates/tallow-tui/src/lib.rs`
- Triggers: `tallow tui` command via `commands::tui_cmd::execute()`
- Responsibilities: Ratatui event loop, immediate-mode rendering, panel/overlay management

## Error Handling

**Strategy:** Per-crate typed error enums via `thiserror`; `anyhow` only at the top-level binary boundary

**Patterns:**
- `tallow-crypto`: `CryptoError` enum in `crates/tallow-crypto/src/error.rs` — variants for key gen, encryption, decryption, signing, verification, hash mismatch, PAKE failure, invalid key/nonce, buffer size, unsupported ops; errors never leak timing or secret data
- `tallow-net`: `NetworkError` enum in `crates/tallow-net/src/error.rs` — implements `std::error::Error` manually (not `thiserror`)
- `tallow-protocol`: `ProtocolError` in `crates/tallow-protocol/src/error.rs`
- `tallow-store`: `StoreError` in `crates/tallow-store/src/error.rs`
- `tallow` binary: `anyhow::Result` only in `main.rs`; command handlers use `io::Result<()>` currently
- Sandbox errors: `SandboxError` in `crates/tallow/src/sandbox.rs` — gracefully falls back on unsupported platforms

## Cross-Cutting Concerns

**Logging:** `tracing` crate throughout all crates; `tracing-subscriber` initialized in `crates/tallow/src/logging.rs` with verbosity levels (warn/info/debug/trace); no `println!` in library crates

**Memory Security:** Key material wrapped in `secrecy::SecretBox`; `zeroize::Zeroize` derived on key types; `mlock` via `region` crate in `tallow` binary; core dumps disabled via `libc::setrlimit` in `crates/tallow-crypto/src/mem/wipe.rs`; screen wiped on exit/panic via `tallow-tui::security`

**Constant-Time Operations:** `subtle::ConstantTimeEq` used for all comparisons involving secret data; `crates/tallow-crypto/src/mem/constant_time.rs` provides helpers

**Validation:** Wire version negotiated in `crates/tallow-protocol/src/wire/version.rs`; chunk AAD binds index to prevent reordering; final chunk validates total chunk count

**Authentication:** TOFU model via `tallow-store::trust::TofuStore` (`crates/tallow-store/src/trust/tofu.rs`); trust levels: `Unknown`, `Seen`, and explicit trust tiers; optional PAKE session bootstrap for shared-secret setups

---

*Architecture analysis: 2026-02-19*
