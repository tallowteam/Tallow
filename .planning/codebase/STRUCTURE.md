# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
E:/Tallow/
├── Cargo.toml                  # Workspace manifest: 7 members, shared deps, release profiles
├── CLAUDE.md                   # Project instructions and code rules for AI agents
├── docs/
│   ├── architecture.md         # High-level crate dependency diagram and data flow
│   ├── protocol-spec.md        # Wire format specification (v1 draft)
│   ├── threat-model.md         # Adversary profiles and STRIDE analysis
│   └── crypto-decisions.md     # Algorithm selection rationale (ADR-style)
├── .cargo/                     # Cargo configuration (e.g., target overrides)
├── .claude/
│   ├── agents/                 # 60-agent intelligence hierarchy definitions
│   ├── commands/               # Custom Claude commands
│   ├── hooks/                  # Claude hook scripts
│   └── skills/                 # Skill reference documents (crypto-review, rust-patterns, etc.)
├── .planning/
│   └── codebase/               # GSD codebase analysis documents (this directory)
├── .github/
│   └── workflows/
│       ├── ci.yml              # Continuous integration pipeline
│       └── release.yml         # Release automation
└── crates/
    ├── tallow-crypto/          # Cryptographic primitives — ZERO I/O
    ├── tallow-net/             # Network transport — knows nothing about files
    ├── tallow-protocol/        # Wire protocol and transfer orchestration
    ├── tallow-store/           # Persistent state and configuration
    ├── tallow-relay/           # Self-hostable relay server binary
    ├── tallow-tui/             # Ratatui TUI engine
    └── tallow/                 # Main CLI binary
```

## Directory Purposes

**`crates/tallow-crypto/`:**
- Purpose: All cryptographic operations — no I/O, no async (except dev-dependencies), pure functions
- Key files:
  - `src/lib.rs` — Public API, module declarations, `init()` function
  - `src/error.rs` — `CryptoError` enum, `Result<T>` alias
  - `src/kem/` — `hybrid.rs` (ML-KEM-1024 + X25519), `mlkem.rs`, `x25519.rs`, `negotiation.rs`, `mod.rs` (exports `HybridKem`, `KemAlgorithm`)
  - `src/symmetric/` — `aes_gcm.rs`, `chacha20.rs`, `nonce.rs`, `negotiation.rs` (AES-NI detection), `mod.rs` (exports `CipherSuite`)
  - `src/kdf/` — `hkdf.rs`, `argon2.rs`, `password.rs`
  - `src/hash/` — `blake3.rs`, `sha3.rs`, `merkle.rs`, `domain.rs` (domain separation constants)
  - `src/sig/` — `hybrid.rs` (ML-DSA-87 + Ed25519), `mldsa.rs`, `ed25519.rs`, `slhdsa.rs`, `file_signing.rs` (chunk signatures)
  - `src/keys/` — `ephemeral.rs`, `identity.rs`, `prekeys.rs`, `rotation.rs`, `storage.rs`
  - `src/mem/` — `wipe.rs` (core dump prevention, mlock), `secure_buf.rs`, `constant_time.rs`
  - `src/pake/` — `cpace.rs`, `opaque.rs`
  - `src/ratchet/` — `double.rs`, `triple.rs`, `sparse_pq.rs`
  - `src/file/` — `encrypt.rs`, `decrypt.rs` (file-level crypto)
  - `benches/crypto_benchmarks.rs` — Criterion benchmarks

**`crates/tallow-net/`:**
- Purpose: Network transport, NAT traversal, local discovery, relay client, privacy layer
- Key files:
  - `src/lib.rs` — Exports `NetworkError`, `Transport` trait
  - `src/error.rs` — `NetworkError` enum
  - `src/transport/` — `quic.rs` (Quinn-based), `tcp_tls.rs`, `negotiation.rs`, `bandwidth.rs`, `mod.rs` (defines `Transport` async trait)
  - `src/nat/` — `stun.rs`, `turn.rs`, `upnp.rs`, `hole_punch.rs`, `detection.rs`
  - `src/discovery/` — `mdns.rs`, `dns_sd.rs`
  - `src/relay/` — `client.rs`, `directory.rs`
  - `src/signaling/` — `client.rs`, `protocol.rs`
  - `src/privacy/` — `socks5.rs` (Tor SOCKS5 proxy), `doh.rs` (DNS-over-HTTPS via hickory), `traffic_analysis.rs` (traffic shaping)

**`crates/tallow-protocol/`:**
- Purpose: Wire codec, transfer pipeline, room management, compression, chat, metadata
- Key files:
  - `src/wire/` — `codec.rs` (`TallowCodec`), `messages.rs` (`Message` enum — all wire message types), `version.rs` (`PROTOCOL_VERSION`, `negotiate_version`)
  - `src/transfer/` — `send.rs` (`SendPipeline`), `receive.rs` (`ReceivePipeline`), `chunking.rs` (64 KB chunks), `state_machine.rs` (`TransferState`, `TransferStateMachine`), `manifest.rs` (`FileManifest`), `resume.rs`, `progress.rs` (`TransferProgress`)
  - `src/compression/` — `zstd.rs`, `brotli.rs`, `lz4.rs`, `lzma.rs`, `pipeline.rs` (adaptive selection), `analysis.rs` (content analysis for compression choice)
  - `src/room/` — `code.rs` (BLAKE3 room code derivation), `manager.rs`, `roles.rs`
  - `src/chat/` — `message.rs`, `session.rs`
  - `src/metadata/` — `filename.rs` (filename encryption), `stripper.rs` (EXIF/metadata stripping via img-parts/kamadak-exif)

**`crates/tallow-store/`:**
- Purpose: Configuration persistence, identity management, trust/contacts database, transfer history
- Key files:
  - `src/config/` — `schema.rs` (`TallowConfig`, `NetworkConfig`, `TransferConfig`, `PrivacyConfig`, `UiConfig`), `loader.rs`, `defaults.rs`
  - `src/identity/` — `keypair.rs` (`IdentityStore`), `fingerprint.rs`
  - `src/trust/` — `tofu.rs` (`TofuStore` — TOFU first-contact recording and key-change detection), `levels.rs` (`TrustLevel` enum)
  - `src/contacts/` — `database.rs`, `groups.rs`
  - `src/persistence/` — `encrypted_kv.rs` (encrypted key-value store for secrets), `paths.rs` (XDG dirs: `~/.config/tallow`, `~/.local/share/tallow`, `~/.cache/tallow`)
  - `src/history/` — `log.rs`

**`crates/tallow-relay/`:**
- Purpose: Standalone relay server binary — pass-through only, never decrypts
- Key files:
  - `src/main.rs` — CLI (`tallow-relay serve --addr --config`), stub implementation
  - `src/server.rs` — `RelayServer` struct
  - `src/config.rs` — `RelayConfig`
  - `src/signaling.rs` — Peer signaling logic
  - `src/rate_limit.rs` — Connection rate limiting
  - `src/auth.rs` — Optional relay auth

**`crates/tallow-tui/`:**
- Purpose: Ratatui immediate-mode TUI — full interactive dashboard
- Key files:
  - `src/lib.rs` — `TuiApp` public entry point, `run()` method
  - `src/app.rs` — `App` state struct (`TuiMode`, `FocusedPanel`, `running`)
  - `src/event.rs` — `EventHandler` for crossterm events
  - `src/render.rs` — Render loop
  - `src/modes.rs` — TUI modes (Dashboard, etc.)
  - `src/theme.rs` — Theme definitions
  - `src/security.rs` — Screen wipe on panic/exit
  - `src/panels/` — `status.rs`, `transfers.rs`, `devices.rs`, `hotkey_bar.rs`
  - `src/overlays/` — `help.rs`
  - `src/widgets/` — 30+ widgets: `file_browser.rs`, `file_preview.rs`, `file_selector.rs`, `chat_view.rs`, `chat_input.rs`, `transfer_progress.rs`, `transfer_gauge.rs`, `transfer_summary.rs`, `device_list.rs`, `device_card.rs`, `bandwidth_chart.rs`, `speed_indicator.rs`, `network_quality.rs`, `trust_badge.rs`, `settings_view.rs`, `setting_widget.rs`, `settings_actions.rs`, `message_bubble.rs`, `sparkline.rs`, `spinner.rs`, `keybindings.rs`, `keybind_help.rs`, `vim_mode.rs`, `emacs_mode.rs`, `accessibility.rs`, `screen_reader.rs`, `high_contrast.rs`, `color_system.rs`, `gradients.rs`, `effects.rs`, `transitions.rs`, `theme_definitions.rs`

**`crates/tallow/`:**
- Purpose: Main CLI binary — argument parsing, command dispatch, output formatting, OS sandbox, runtime
- Key files:
  - `src/main.rs` — `#[tokio::main]`, parses `Cli`, dispatches all commands
  - `src/cli.rs` — Full clap derive CLI: `Commands` enum with all subcommands; arg structs (`SendArgs`, `ReceiveArgs`, `ChatArgs`, `TuiArgs`, `IdentityArgs`, `ConfigArgs`, `ContactsArgs`, `TrustArgs`, `BenchmarkArgs`, `CompletionsArgs`)
  - `src/commands/` — One file per subcommand: `send.rs`, `receive.rs`, `chat.rs`, `identity.rs`, `config_cmd.rs`, `doctor.rs`, `benchmark.rs`, `tui_cmd.rs`, `completions.rs`, `version.rs`
  - `src/output/` — `progress.rs` (`TransferProgressBar` via indicatif), `prompts.rs` (dialoguer), `json.rs`, `color.rs` (owo-colors)
  - `src/sandbox.rs` — `SandboxConfig`, `apply_sandbox()` — Linux: Landlock + Seccomp; OpenBSD: Pledge + Unveil; macOS: App Sandbox; graceful no-op elsewhere
  - `src/logging.rs` — `init_logging(verbosity)` sets tracing level
  - `src/runtime.rs` — `build_runtime()` constructs multi-thread tokio runtime
  - `src/exit_codes.rs` — `SUCCESS`/`ERROR` exit code constants

## Key File Locations

**Entry Points:**
- `crates/tallow/src/main.rs` — CLI binary entry point
- `crates/tallow-relay/src/main.rs` — Relay server entry point
- `crates/tallow-crypto/src/lib.rs` — Crypto library public API
- `crates/tallow-net/src/lib.rs` — Network library public API
- `crates/tallow-protocol/src/lib.rs` — Protocol library public API
- `crates/tallow-store/src/lib.rs` — Store library public API
- `crates/tallow-tui/src/lib.rs` — TUI library public API

**Configuration:**
- `Cargo.toml` — Workspace manifest with shared dependency versions
- `crates/tallow-store/src/config/schema.rs` — Typed config schema
- `crates/tallow-store/src/persistence/paths.rs` — XDG runtime paths
- `docs/crypto-decisions.md` — Algorithm selection ADRs

**Core Cryptographic Logic:**
- `crates/tallow-crypto/src/kem/hybrid.rs` — ML-KEM-1024 + X25519 hybrid key exchange
- `crates/tallow-crypto/src/sig/hybrid.rs` — ML-DSA-87 + Ed25519 hybrid signatures
- `crates/tallow-crypto/src/symmetric/mod.rs` — Cipher suite selection (`CipherSuite`)
- `crates/tallow-crypto/src/symmetric/nonce.rs` — Counter-based nonce generation
- `crates/tallow-crypto/src/mem/wipe.rs` — Core dump prevention, memory lock

**Wire Protocol:**
- `crates/tallow-protocol/src/wire/messages.rs` — `Message` enum (all message types)
- `crates/tallow-protocol/src/wire/codec.rs` — `TallowCodec` (bincode serialization)
- `crates/tallow-protocol/src/transfer/state_machine.rs` — `TransferStateMachine`

**Security:**
- `crates/tallow/src/sandbox.rs` — OS-level process sandboxing
- `crates/tallow-store/src/trust/tofu.rs` — TOFU trust model
- `crates/tallow-crypto/src/mem/constant_time.rs` — Constant-time comparison helpers

**Testing:**
- `crates/tallow-crypto/benches/crypto_benchmarks.rs` — Criterion benchmarks
- Per-crate `#[cfg(test)]` modules within implementation files (see TESTING.md)

## Naming Conventions

**Crates:**
- Prefix `tallow-` for library crates: `tallow-crypto`, `tallow-net`, `tallow-protocol`, `tallow-store`, `tallow-tui`, `tallow-relay`
- Binary crate uses bare name: `tallow`

**Files:**
- `snake_case.rs` for all source files
- `mod.rs` for module entry points that re-export submodule items
- `error.rs` for per-crate error type definitions (every library crate has one)
- `lib.rs` for library crate root

**Modules:**
- One concept per module: `kem/hybrid.rs` contains only hybrid KEM, `symmetric/nonce.rs` contains only nonce logic
- Module `mod.rs` re-exports the public API for consumers of that module

**Types:**
- `PascalCase` structs and enums: `HybridKem`, `CipherSuite`, `TransferStateMachine`, `TofuStore`
- `snake_case` functions: `prevent_core_dumps`, `apply_sandbox`, `init_logging`
- Error types named `<Crate>Error`: `CryptoError`, `NetworkError`, `ProtocolError`, `StoreError`
- Result aliases: `pub type Result<T> = std::result::Result<T, <CrateError>>;` in each crate's `error.rs`

## Where to Add New Code

**New Cryptographic Primitive:**
- Implementation: `crates/tallow-crypto/src/<category>/<name>.rs`
- Module declaration: Add `pub mod <name>;` in `crates/tallow-crypto/src/<category>/mod.rs`
- Re-export: Add `pub use` in `crates/tallow-crypto/src/<category>/mod.rs`
- Tests: `#[cfg(test)]` block in the same file
- Document algorithm rationale: `docs/crypto-decisions.md`
- Constraint: Zero I/O — no `tokio`, no `std::fs`

**New Network Feature:**
- Implementation: `crates/tallow-net/src/<category>/<name>.rs`
- Constraint: Must not import `tallow-protocol` or know about file transfer semantics

**New Wire Message Type:**
- Add variant to `Message` enum in `crates/tallow-protocol/src/wire/messages.rs`
- Update `TallowCodec` in `crates/tallow-protocol/src/wire/codec.rs` if needed
- Update version negotiation in `crates/tallow-protocol/src/wire/version.rs`

**New CLI Subcommand:**
- Add `Args` struct and `Commands` variant in `crates/tallow/src/cli.rs`
- Add handler file: `crates/tallow/src/commands/<cmd>.rs`
- Add dispatch arm in `crates/tallow/src/main.rs`
- Integration tests: `crates/tallow/tests/` using `assert_cmd`

**New TUI Widget:**
- Implementation: `crates/tallow-tui/src/widgets/<name>.rs`
- Register in `crates/tallow-tui/src/widgets/mod.rs`

**New TUI Panel:**
- Implementation: `crates/tallow-tui/src/panels/<name>.rs`
- Register in `crates/tallow-tui/src/panels/mod.rs`

**New Config Field:**
- Add field to appropriate sub-struct in `crates/tallow-store/src/config/schema.rs`
- Add default in `crates/tallow-store/src/config/defaults.rs`

**Utilities:**
- Crypto helpers: `crates/tallow-crypto/src/mem/` (memory) or `crates/tallow-crypto/src/hash/domain.rs` (domain separation)
- Output helpers: `crates/tallow/src/output/` (progress, prompts, JSON, color)

## Special Directories

**`docs/`:**
- Purpose: Architecture decisions, protocol spec, threat model, crypto rationale
- Generated: No
- Committed: Yes — part of the canonical project specification

**`docs/planning/_codebase/`:**
- Purpose: Legacy/alternate planning document location (empty)
- Generated: Potentially
- Committed: Yes (currently)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents consumed by plan-phase and execute-phase agents
- Generated: Yes (by map-codebase agents)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code configuration — 60-agent hierarchy, skills, commands, hooks
- Generated: No (hand-authored agent definitions)
- Committed: Yes

**`target/`:**
- Purpose: Cargo build artifacts
- Generated: Yes
- Committed: No (gitignored)

**`crates/tallow-crypto/benches/`:**
- Purpose: Criterion benchmark harness for crypto operations
- Contains: `crypto_benchmarks.rs`
- Run with: `cargo bench -p tallow-crypto`

## Crate Dependency Graph

```
tallow (binary)
  -> tallow-tui [optional, feature="tui"]
       -> tallow-crypto
       -> tallow-net
       -> tallow-protocol
       -> tallow-store
  -> tallow-protocol
       -> tallow-crypto
       -> tallow-net
            -> tallow-crypto
  -> tallow-store
       -> tallow-crypto
  -> tallow-crypto
  -> tallow-net [feature="quic" propagates tallow-net/quic]

tallow-relay (binary)
  -> [currently standalone, intended to use tallow-net subset]
```

All library crates (`tallow-crypto`, `tallow-net`, `tallow-protocol`, `tallow-store`, `tallow-tui`) publish no binaries — they are linked into the `tallow` or `tallow-relay` binary at build time.

---

*Structure analysis: 2026-02-19*
