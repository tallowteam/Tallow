# Technology Stack

**Project:** Tallow — Secure P2P File Transfer CLI/TUI
**Researched:** 2026-02-19
**Mode:** Ecosystem — Stack dimension
**Milestone context:** Brownfield 7-crate workspace. tallow-crypto ~85% done. tallow-net, tallow-protocol, tallow-relay, tallow-store are mostly stubs.

---

## Current State vs Target State

Before recommendations, here is the ground truth on what the codebase currently declares vs what is actually implemented:

| Area | Cargo.toml declares | Cargo.lock has | Implementation status |
|------|--------------------|-----------------|-----------------------|
| PQ KEM | `fips203 = "0.4"` | `pqcrypto-kyber 0.8.1` (stale) | `mlkem.rs` still calls `pqcrypto_kyber` API — needs rewrite |
| PQ Signatures | `fips204 = "0.4"`, `fips205 = "0.4"` | `pqcrypto-dilithium 0.5.0`, `pqcrypto-sphincsplus 0.7` (stale) | `mldsa.rs` and `slhdsa.rs` already use `fips204`/`fips205` API — correct, lock is stale |
| Wire serialization | `bincode = "1.3"` | `bincode 1.3.3` | `todo!()` stubs in codec |
| QUIC transport | `quinn = "0.11"` | `quinn 0.11.9` | `todo!()` stub in `quic.rs` |
| TCP+TLS transport | `rustls = "0.23"` | both 0.21.12 and 0.23.36 (conflict!) | `todo!()` stub in `tcp_tls.rs` |
| Encrypted storage | (no embedded DB) | none | `HashMap` in-memory stub |
| Relay server | `dashmap = "6"` | `dashmap 6.1.0` | `todo!()` stub in `server.rs` |
| Wire protocol | `bincode`, `serde_json` | both present | `todo!()` stubs in codec |

---

## Recommended Stack

### Layer 1: Post-Quantum Cryptography (CRITICAL — migration required)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `fips203` | 0.4 | ML-KEM-1024 (FIPS 203) — PQ KEM | HIGH |
| `fips204` | 0.4 | ML-DSA-87 (FIPS 204) — PQ signatures | HIGH (already used in mldsa.rs) |
| `fips205` | 0.4 | SLH-DSA-SHA2-256f (FIPS 205) — backup signatures | HIGH (already used in slhdsa.rs) |

**Why `fips203` over `pqcrypto-kyber`:**
- `pqcrypto-kyber` wraps C reference implementations via FFI. It requires a C compiler, complicates cross-compilation, and has `unsafe` throughout. It also predates the final FIPS 203 standard — Kyber underwent minor spec changes before standardization.
- `fips203` is pure Rust, `#![forbid(unsafe_code)]`-compatible, implements the final FIPS 203 standard (not draft Kyber), and is maintained by the Rust cryptography community.
- The Cargo.toml has already been updated to declare `fips203 = "0.4"`. The task is to rewrite `crates/tallow-crypto/src/kem/mlkem.rs` to call the `fips203` API instead of `pqcrypto_kyber`. Then run `cargo update` to purge the pqcrypto dependencies from Cargo.lock.

**Migration path for `mlkem.rs`:**
```rust
// OLD (pqcrypto-kyber)
use pqcrypto_kyber::kyber1024;

// NEW (fips203)
use fips203::ml_kem_1024;
use fips203::traits::{Decapsulate, Encapsulate, KeyGen, SerDes};
```

The `fips203` API mirrors `fips204`/`fips205` — use `KG::try_keygen()`, `try_encaps()`, `try_decaps()`, `into_bytes()`, `try_from_bytes()`. The existing `mldsa.rs` implementation is the correct pattern to follow.

**Why NOT `ml-kem` crate (RustCrypto):**
The RustCrypto `ml-kem` crate (separate from `fips203`) is also pure Rust and FIPS 203 compliant. However, the codebase has already chosen `fips203/204/205` as a consistent family with identical API patterns. Mixing `ml-kem` for KEM with `fips204` for signatures would introduce API inconsistency. Stick with the fips2xx family. MEDIUM confidence (cannot verify latest ml-kem version via web search, but the fips203 choice is coherent).

---

### Layer 2: Wire Protocol Serialization (UPGRADE NEEDED)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `postcard` | ~1.0 | Primary wire serialization | HIGH |
| `serde` | 1 (current) | Derive macros — keep | HIGH |
| `bincode` | 1.3 (current, keep for storage only) | Internal persistence format | MEDIUM |

**Why `postcard` over `bincode` for the wire protocol:**

`bincode 1.x` was the original Tallow choice, but it has a critical problem for wire protocols: it does not handle schema evolution. Binary format is locked to struct layout. Adding a field is a breaking protocol change with no migration path. Additionally, `bincode` has known issues with length-prefixed encoding being dependent on platform endianness in some configurations.

`postcard` is the embedded/no_std Rust community's standard wire format. It is:
- Compact: varint encoding for integers (smaller than bincode for most protocol messages)
- `no_std` compatible: minimal allocation
- Schema stable: can add optional trailing fields without breaking older decoders (via `postcard`'s `experimental-derive` or manual handling)
- Actively maintained by James Munns (Ferrous Systems), used by Embassy, Dioxus, and several embedded projects
- Serde-compatible: existing `#[derive(Serialize, Deserialize)]` on `Message` enum works as-is

The `protocol-spec.md` already specifies postcard as the serialization format ("Serialization: postcard"). The codebase has not implemented it yet — this is the right time to add it.

**What to keep `bincode` for:** Internal encrypted KV store only. Persistence format does not need cross-peer compatibility. Bincode is fine for single-machine persistent storage where both writer and reader share the same binary.

**Action:** Add `postcard = { version = "1", features = ["use-std"] }` to `tallow-protocol/Cargo.toml` and `tallow-net/Cargo.toml`. Remove `bincode` from protocol-level encoding.

---

### Layer 3: QUIC Transport

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `quinn` | 0.11 (0.11.9 in lock) | QUIC transport layer | HIGH |
| `rustls` | 0.23 (pin to this) | TLS 1.3 for QUIC | HIGH |
| `rcgen` | 0.13 (0.13.2 in lock) | Self-signed cert generation for relay | HIGH |

**Why Quinn 0.11 is correct:**
Quinn 0.11 is the current stable release as of 2025. It uses rustls 0.23 internally (which aligns with the codebase's stated dependency). Quinn provides:
- Full QUIC v1 (RFC 9000) implementation
- Multiplexed bidirectional streams — ideal for concurrent file chunks + signaling on one connection
- 0-RTT resumption — useful for repeated connections to the same relay
- Built-in flow control and backpressure

**Critical: Resolve the rustls version conflict.** The Cargo.lock currently contains both `rustls 0.21.12` and `rustls 0.23.36`. This is a red flag indicating a transitive dependency pulling in 0.21. Identify it:
```bash
cargo tree -i rustls | grep "0.21"
```
The 0.21 version is likely from `tokio-rustls 0.24.x` being pulled in transitively. The `tallow-net/Cargo.toml` declares `tokio-rustls = "0.26"` which uses rustls 0.23 — but check if any other dep still pulls 0.21. Unify to 0.23 only.

**Quinn usage pattern for Tallow:**
- Relay server: `Endpoint::server()` with `rcgen`-generated self-signed certificate
- Client: `Endpoint::client()` with certificate pinning to the relay's fingerprint
- Use QUIC bidirectional streams (`open_bi()`) for the signaling + file transfer multiplexing
- Use unidirectional streams for file chunks (no ack needed at QUIC layer — application-level ack in protocol)

**Why NOT raw TCP+TLS as primary:**
TCP+TLS is the fallback, not the primary transport. QUIC gives built-in stream multiplexing (no head-of-line blocking between chunks), better NAT traversal (UDP), and faster connection establishment. Keep TCP+TLS as a fallback for firewalled environments where UDP is blocked.

---

### Layer 4: Relay Server Architecture

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `quinn` | 0.11 | QUIC server endpoint | HIGH |
| `dashmap` | 6.1.0 (current) | Concurrent room/peer registry | HIGH |
| `tokio` | 1 (1.49.0 in lock) | Async runtime | HIGH |
| `rcgen` | 0.13 | Self-signed TLS cert for relay | HIGH |
| `rustls` | 0.23 | TLS 1.3 | HIGH |

**Relay server design (store-and-forward is WRONG for Tallow):**
The relay must be a pass-through only. It must never buffer plaintext. The correct design:
1. Peer A connects and announces room code (BLAKE3 hash of phrase)
2. Peer B connects with same room code
3. Relay matches them, then acts as a bidirectional pipe: bytes from A's QUIC stream are forwarded to B's QUIC stream
4. Relay sees only ciphertext. Zero logging of content.

`dashmap` is the right choice for the in-memory peer/room registry. It is a concurrent `HashMap` with fine-grained sharding — no `Mutex<HashMap>` contention. Already in the lock file at 6.1.0.

**Why NOT axum/hyper/tonic for relay:**
The relay does not need HTTP semantics. It is a raw QUIC forwarder with a lightweight signaling protocol on top. Adding axum would bring in unnecessary HTTP overhead. Quinn directly is the correct choice. If an HTTP admin API is added later, axum can be added as an optional feature.

**Oracle Cloud Free Tier constraint:**
1 OCPU + 1 GB RAM (Ampere A1 shape or AMD E2.1.Micro). The relay must be extremely low-memory. `dashmap` + Quinn without axum achieves this. Avoid any crate that brings in large transitive deps (e.g., no `diesel`, no `sqlx`, no `redis`).

---

### Layer 5: Encrypted Storage

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `sled` | 0.34 | Embedded persistent KV store | MEDIUM |
| OR `redb` | 2.x | Embedded persistent KV store (alternative) | MEDIUM |
| `aes-gcm` | 0.10 (current) | Encrypt values before writing to DB | HIGH |
| `argon2` | 0.5 (current) | Derive storage key from passphrase | HIGH |

**The core storage problem:**
`tallow-store`'s `EncryptedKv` is currently a `HashMap` stub that does not persist. It needs a real on-disk KV store where all values are encrypted with AES-256-GCM before writing (using the storage key derived via Argon2id from the user's passphrase).

**`sled` vs `redb` analysis:**

`sled 0.34` is the established choice. Pure Rust, no C deps, good performance for the Tallow use case (contacts, config, transfer history — small dataset, infrequent writes). However, sled's development has slowed considerably. The author announced sled 1.0 has been in progress for years, and 0.34 has open bugs.

`redb 2.x` is the modern alternative: pure Rust, ACID transactions, actively maintained (January 2025 2.x release), simpler API than sled. `redb` is a better long-term choice but has less community visibility than sled.

**Recommendation: Use `redb`** for `tallow-store`. It is more actively maintained, has a cleaner API, and the Tallow data model (small tables: contacts, config, history, trust) maps cleanly to redb's table abstraction. MEDIUM confidence because neither was verified against current crate state via web search.

**Encryption layer:**
Do NOT use sled's/redb's built-in encryption (sled has none; redb has none at time of research). Instead, encrypt all values in `tallow-store` using AES-256-GCM with a key derived from the user's master passphrase via Argon2id. This keeps `tallow-crypto` as the single source of cryptographic operations and avoids trusting the DB's encryption.

Pattern:
```rust
fn write_encrypted(db: &redb::Database, key: &str, plaintext: &[u8], master_key: &[u8; 32]) {
    let nonce = generate_nonce(); // counter-based
    let ciphertext = aes_gcm_encrypt(master_key, &nonce, plaintext)?;
    // store (nonce || ciphertext) in redb
}
```

---

### Layer 6: Async Runtime and Codec

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `tokio` | 1 (1.49.0) | Async runtime | HIGH |
| `tokio-util` | 0.7 (current) | `Framed` codec adapter | HIGH |
| `bytes` | 1 (current) | Zero-copy buffer management | HIGH |
| `futures` | 0.3 (current) | Stream/sink combinators | HIGH |

**Why tokio-util `Framed` for the codec:**
`tokio_util::codec::Framed` wraps a transport (TCP stream or QUIC stream bytes) with a length-delimiting codec. The `TallowCodec` in `tallow-protocol/src/wire/codec.rs` should implement `tokio_util::codec::Encoder<Message>` and `Decoder`. This gives automatic backpressure, buffering, and framing for free.

The framing format:
```
[4 bytes: message length as u32 LE][N bytes: postcard-serialized Message]
```

This is simple, efficient, and sufficient. The `LengthDelimitedCodec` from `tokio-util` can handle the framing; only the serialization (postcard encode/decode) needs custom code.

---

### Layer 7: TUI

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `ratatui` | 0.29.0 (current) | TUI framework | HIGH |
| `crossterm` | 0.28 (current, note: 0.29 also in lock — conflict) | Terminal backend | HIGH |

**Crossterm version conflict:** Cargo.lock has both `crossterm 0.28.1` and `crossterm 0.29.0`. Ratatui 0.29 uses crossterm 0.28. The 0.29 crossterm is being pulled in by something else. Pin crossterm to 0.28 in the workspace Cargo.toml to resolve.

**Ratatui 0.29 is current and correct.** The immediate-mode model is appropriate for Tallow's use case: progress bars, transfer status, live logging, and interactive prompts. No changes recommended here.

---

### Layer 8: CLI and UX

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `clap` | 4 (4.5.58 in lock) | CLI argument parsing | HIGH |
| `dialoguer` | 0.11 (current) | Interactive prompts, password entry | HIGH |
| `indicatif` | 0.17 (0.17.11 in lock) | Progress bars | HIGH |
| `owo-colors` | 4 (4.2.3 in lock) | Terminal colors with NO_COLOR support | HIGH |
| `qrcode` | 0.14 (current) | QR code for room code sharing | MEDIUM |

All CLI/UX choices are sound. No changes recommended.

---

### Layer 9: Sandbox and OS Security

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| `landlock` | (not yet in Cargo.toml) | Linux Landlock LSM filesystem restriction | MEDIUM |
| `seccompiler` | (not yet in Cargo.toml) | Linux seccomp-bpf syscall filtering | MEDIUM |
| `nix` | (not yet in Cargo.toml) | mlock, prctl | MEDIUM |
| `region` | 3 (current) | Cross-platform mlock (fallback) | MEDIUM |

The sandbox (`crates/tallow/src/sandbox.rs` — listed as a new untracked file) needs these crates. `landlock` and `seccompiler` are Linux-only; gate them with `#[cfg(target_os = "linux")]`. On Windows/macOS, `region` provides mlock. MEDIUM confidence because these are platform-specific and capabilities need verification.

---

## What NOT to Use

| Category | Avoid | Use Instead | Rationale |
|----------|-------|-------------|-----------|
| PQ KEM | `pqcrypto-kyber` | `fips203` | C FFI, pre-standard spec, unsafe, harder cross-compile |
| PQ Sigs | `pqcrypto-dilithium`, `pqcrypto-sphincsplus` | `fips204`, `fips205` | Same reasons as kyber |
| Wire serialization | `bincode` (for wire protocol) | `postcard` | No schema evolution, endianness issues |
| Wire serialization | `serde_json` (for wire protocol) | `postcard` | 5-10x larger than binary, not suitable for 64KB chunk framing |
| Relay server HTTP | `axum`, `hyper` | raw `quinn` | Unnecessary overhead for a pure forwarder |
| Storage | `sqlite` via `rusqlite` | `redb` | C dep, harder cross-compile, more overhead than needed |
| Storage | `sled 0.34` long-term | `redb` | Stalled development |
| Storage encryption | Database-level encryption | Application-level AES-GCM | Keeps crypto in tallow-crypto, avoids trusting DB |
| PQ hybrid | `oqs` / `liboqs` | `fips203` family | Massive C dep, complex build, no benefit over pure Rust |
| Onion routing | Custom onion routing | SOCKS5 proxy to Tor | Not worth the complexity (per CLAUDE.md design principles) |
| Error handling in libs | `anyhow` | `thiserror` | anyhow is for binary crates only (main.rs) |
| Nonce generation | random nonces | counter-based nonces | Birthday bound risk at scale; counter guarantees uniqueness |

---

## Version Pinning Recommendations

Add to workspace `Cargo.toml` to resolve conflicts:

```toml
[workspace.dependencies]
# Pin to resolve dual-version conflict
rustls = { version = "0.23", features = [] }
crossterm = "0.28"

# Add postcard for wire protocol
postcard = { version = "1", features = ["use-std"] }

# Add redb for encrypted storage
redb = "2"
```

---

## Critical Actions (Ordered by Priority)

1. **Rewrite `mlkem.rs`** — Replace `pqcrypto_kyber` API calls with `fips203` API (FIPS 203 compliance, pure Rust, consistent with mldsa.rs pattern). Run `cargo update` after to purge old pqcrypto deps from Cargo.lock.

2. **Resolve rustls dual-version** — Identify which dep pulls in rustls 0.21, force-upgrade or patch. This will cause link errors if both end up linked.

3. **Add `postcard` to protocol crate** — Implement `TallowCodec::encode/decode` using postcard + tokio-util `LengthDelimitedCodec` wrapper.

4. **Implement QUIC transport** — `quic.rs` needs the full Quinn endpoint setup: TLS config, certificate pinning, connection handling, stream management.

5. **Add `redb` to store crate** — Implement `EncryptedKv` with redb as the backing store, AES-256-GCM encryption on all values, Argon2id key derivation.

6. **Implement relay server** — Quinn `Endpoint::server()`, dashmap peer registry, room matching, bidirectional stream forwarding. Zero plaintext logging.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| fips203/204/205 migration | HIGH | Cargo.toml already declares them; mldsa.rs shows correct API pattern; mlkem.rs needs updating |
| quinn 0.11 for QUIC | HIGH | Confirmed in Cargo.lock; stable API; no reason to upgrade yet |
| postcard for wire | HIGH | Matches protocol-spec.md; well-established in Rust embedded ecosystem |
| redb for storage | MEDIUM | Cannot verify latest redb version/status via web search; known to be actively maintained as of training cutoff |
| sled deprecation risk | MEDIUM | Based on training data; community discussions about slowdown are well-known but cannot verify current status |
| landlock/seccomp versions | MEDIUM | Platform-specific; need testing on Linux target |
| rustls conflict resolution | HIGH | Dual version confirmed in Cargo.lock; resolution path is standard |

---

## Sources

- `E:/Tallow/Cargo.lock` — Definitive locked dependency versions (verified directly)
- `E:/Tallow/crates/*/Cargo.toml` — Declared dependencies (verified directly)
- `E:/Tallow/crates/tallow-crypto/src/kem/mlkem.rs` — Confirmed pqcrypto API still in use
- `E:/Tallow/crates/tallow-crypto/src/sig/mldsa.rs` — Confirmed fips204 API pattern (correct reference)
- `E:/Tallow/crates/tallow-crypto/src/sig/slhdsa.rs` — Confirmed fips205 API pattern (correct reference)
- `E:/Tallow/docs/protocol-spec.md` — Specifies postcard as wire serialization format
- `E:/Tallow/CLAUDE.md` — Stack constraints, design principles, security rules
- Cargo.lock version cross-reference: tokio 1.49.0, quinn 0.11.9, clap 4.5.58, ratatui 0.29.0, blake3 1.8.3, argon2 0.5.3, dashmap 6.1.0, rcgen 0.13.2
