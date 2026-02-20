# Tallow

Secure file transfer CLI/TUI built in Rust. End-to-end encrypted transfers via untrusted relay servers, with optional Tor anonymity layer (SOCKS5 proxy). Post-quantum cryptography ensures forward secrecy against future quantum attacks.

## Purpose
Enable encrypted file transfers between two parties where the relay never sees plaintext. Post-quantum cryptography ensures forward secrecy against future quantum attacks.

## Stack
- **Language**: Rust (stable toolchain, 2021 edition)
- **Crypto**: ML-KEM-1024 (FIPS 203) + X25519 (RFC 7748) hybrid KEM, AES-256-GCM (96-bit nonce), HKDF-SHA256 (RFC 5869)
- **Signatures**: Ed25519 + ML-DSA-87 hybrid (NEVER Ed25519 alone for identity)
- **Hashing**: BLAKE3 primary, SHA3-256 only where NIST compliance required
- **Passwords**: Argon2id (3 iter, 256MB, 4 parallel)
- **Async runtime**: tokio (multi-thread)
- **CLI framework**: clap v4 (derive API)
- **TUI**: Ratatui + Crossterm (immediate-mode, sub-ms frames)
- **CLI output**: owo-colors (zero-alloc, no_std, NO_COLOR), indicatif progress bars
- **Logging**: tracing crate with structured output
- **License**: AGPL-3.0

## Workspace Structure (7 Crates)
```
crates/
  tallow-crypto/    — All cryptographic operations (ZERO I/O, pure functions)
  tallow-net/       — Transport, NAT traversal, discovery, relay client, privacy
  tallow-protocol/  — Wire protocol, file transfer, compression, rooms, chat
  tallow-store/     — Config, identity, trust, contacts, encrypted storage
  tallow-relay/     — Self-hostable relay server binary
  tallow-tui/       — Ratatui TUI engine, panels, overlays, widgets
  tallow/           — Main binary: CLI commands, output, sandbox, runtime
```

## Key Crates
- `ml-kem` or `fips203` — ML-KEM-1024 post-quantum KEM
- `x25519-dalek` — X25519 Diffie-Hellman
- `aes-gcm` — AES-256-GCM authenticated encryption (RustCrypto)
- `hkdf` + `sha2` — HKDF-SHA256 key derivation
- `zeroize` + `secrecy` — Secure memory wiping, SecretBox wrappers
- `subtle` — Constant-time operations
- `tokio` — Async runtime
- `clap` — CLI argument parsing
- `ratatui` + `crossterm` — TUI rendering
- `indicatif` — Progress bars
- `owo-colors` — Terminal colors
- `tracing` + `tracing-subscriber` — Structured logging
- `thiserror` — Typed error enums
- `anyhow` — Top-level error handling (binary crate only)
- `proptest` — Property-based testing
- `blake3` — BLAKE3 hashing
- `quinn` — QUIC transport
- `clearscreen` — Screen buffer wiping
- `landlock` + `seccompiler` — OS sandbox (Linux)
- `nix` — mlock, prctl

## Commands
- `cargo build --workspace` — Build all crates
- `cargo test --workspace` — All tests
- `cargo test -p tallow-crypto` — Crypto tests only
- `cargo test <name>` — Single test (prefer this for speed)
- `cargo clippy --workspace -- -D warnings` — Lint (warnings = errors)
- `cargo fmt --check` — Format verification
- `cargo audit` — CVE scan via RustSec advisory database
- `cargo deny check` — License + advisory + duplicate checks
- `cargo bench -p tallow-crypto` — Crypto benchmarks
- `cargo fuzz run <target>` — Fuzz testing (requires nightly)

## Module Architecture
- `crates/tallow-crypto/` — All cryptographic operations. ZERO I/O dependencies. Pure functions.
  - `kem/` — Hybrid ML-KEM-1024 + X25519 key encapsulation
  - `symmetric/` — AES-256-GCM, ChaCha20-Poly1305, AEGIS-256, nonce management
  - `kdf/` — HKDF-SHA256, Argon2id, password derivation
  - `hash/` — BLAKE3, SHA3, Merkle trees, domain separation
  - `sig/` — Ed25519 + ML-DSA-87 hybrid signatures
  - `keys/` — Ephemeral, identity, prekeys, rotation, storage
  - `mem/` — Secure memory, zeroize, constant-time ops
  - `pake/` — CPace, OPAQUE password-authenticated key exchange
  - `ratchet/` — Double, triple, sparse PQ ratchets
  - `file/` — File encrypt/decrypt
- `crates/tallow-net/` — Network operations. Knows nothing about files.
  - `transport/` — QUIC (quinn), TCP+TLS, bandwidth, negotiation
  - `nat/` — STUN, TURN, UPnP, hole-punching, detection
  - `discovery/` — mDNS, DNS-SD
  - `relay/` — Relay client, directory
  - `signaling/` — Signaling protocol
  - `privacy/` — DoH, SOCKS5 proxy, traffic analysis resistance
- `crates/tallow-protocol/` — Wire protocol and transfer orchestration.
  - `wire/` — Codec, messages, versioning
  - `transfer/` — Chunking, send, receive, resume, progress, state machine
  - `compression/` — zstd, lz4, brotli, lzma, adaptive pipeline
  - `room/` — Room codes, manager, roles
  - `chat/` — Chat messages, sessions
  - `metadata/` — Filename encryption, EXIF stripping
- `crates/tallow-store/` — Persistent state and configuration.
  - `config/` — TOML config, XDG paths, defaults, schema
  - `identity/` — Keypairs, fingerprints
  - `trust/` — TOFU, trust levels
  - `contacts/` — Contact database, groups
  - `persistence/` — Encrypted key-value store, paths
  - `history/` — Transfer history log
- `crates/tallow-relay/` — Self-hostable relay server.
- `crates/tallow-tui/` — Terminal UI engine.
- `crates/tallow/` — Main binary: CLI commands, output formatting, sandbox, runtime.
- See @docs/architecture.md for full design
- See @docs/protocol-spec.md for wire format
- See @docs/threat-model.md for trust boundaries

## Code Rules
- `Result<T, E>` everywhere. No `.unwrap()` outside `#[cfg(test)]`.
- `thiserror` for library errors with per-module error enums. `anyhow` only in `crates/tallow/src/main.rs`.
- `#![forbid(unsafe_code)]` in all crates except where explicitly required (e.g., `mem/wipe.rs`).
- All `unsafe` blocks require `// SAFETY:` comment explaining the invariant being upheld.
- All key material types must derive/impl `Zeroize` and be wrapped in `secrecy::SecretBox` where possible.
- Use `subtle::ConstantTimeEq` for all secret-dependent comparisons — never `==` on key material.
- Prefer `&[u8]` inputs over `Vec<u8>` for crypto functions. Return owned types.
- No `println!` — use `tracing::{info, warn, error, debug, trace}`.
- All public items get `///` doc comments.
- Integer overflow checks enabled in release builds (see `Cargo.toml` `[profile.release]`).

## Security Rules — NON-NEGOTIABLE
- NEVER commit secrets, keys, .env files, or credentials
- NEVER use `unsafe` without documented SAFETY justification
- NEVER skip `cargo audit` + `cargo deny` before releases
- NEVER downgrade crypto algorithms without documented rationale in docs/crypto-decisions.md
- NEVER use non-constant-time comparisons on secrets (use `subtle` crate)
- NEVER return decrypted plaintext before verifying the AES-GCM authentication tag
- NEVER reuse AES-GCM nonces under the same key
- ALL key material must be zeroized on drop via `zeroize` crate
- ALL crypto errors must not leak timing information or secret data in messages
- Screen wiped on exit/panic via clearscreen
- Core dumps disabled via `prctl(PR_SET_DUMPABLE, 0)`
- Secrets pinned in RAM via `mlock` (never swap)

## Git Workflow
- Feature branches off `main`: `feat/`, `fix/`, `security/`, `refactor/`
- Conventional commits: `feat:`, `fix:`, `security:`, `refactor:`, `docs:`, `test:`, `chore:`
- No direct commits to `main`
- Squash merge to main

## Testing
- Unit tests: `#[cfg(test)]` module in same file as implementation
- Integration tests: `tests/` directory
- Property tests: `proptest` for crypto round-trip invariants
- Fuzz targets: `fuzz/` directory for protocol parsing and crypto inputs
- Prefer `cargo test <specific_test>` over full suite for speed

## Design Principles
- Security-maximalist defaults with layered protections
- Minimal budget — security from disciplined engineering, not expensive tooling
- Favor simplicity over unnecessary complexity (single-relay + Tor over custom onion routing)
- Defense-in-depth: security at every layer
- Be honest about complexity vs value tradeoffs — if it's not worth building, say so
- See @docs/crypto-decisions.md for algorithm selection rationale

## 60-Agent Intelligence Hierarchy
All agent files: `.claude/agents/`
- **CIPHER (Agent 02)** has VETO POWER on all cryptographic code
- **SECURITY-AUDITOR (Agent 49)** has VETO POWER on releases
- See individual agent files for full prompts and responsibilities
