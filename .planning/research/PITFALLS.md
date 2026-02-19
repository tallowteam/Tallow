# Domain Pitfalls: Secure File Transfer CLI in Rust

**Domain:** Post-quantum encrypted file transfer CLI/TUI (Rust)
**Researched:** 2026-02-19
**Milestone context:** Brownfield ~45% implementation. Crypto skeleton exists with 4 CRITICAL + 8 HIGH security issues.

---

## Critical Pitfalls

Mistakes that cause rewrites, silent security failures, or irreversible damage to security posture.

---

### Pitfall 1: Using `pqcrypto-kyber` Instead of `ml-kem` (FIPS 203)

**What goes wrong:** The codebase uses `pqcrypto-kyber = "0.8"` (CRYSTALS-Kyber, the NIST round-3 submission) instead of `ml-kem` (the finalized FIPS 203 standard). These are NOT wire-compatible. The internal encoding, hash domain separators, and implicit rejection behavior differ between Kyber and ML-KEM. A peer using any standards-compliant ML-KEM-1024 library will fail to interoperate with Tallow, silently or with decryption errors — not a clean negotiation failure.

**Why it happens:** `pqcrypto-kyber` was available earlier and has an ergonomic API matching the pqcrypto ecosystem. Developers assume Kyber ≈ ML-KEM because NIST based ML-KEM on Kyber. The difference is not obvious at the Rust API level — both produce 32-byte shared secrets and similar key sizes.

**Consequences:**
- Zero interoperability with any other ML-KEM-1024 implementation (liboqs, BoringSSL, AWS-LC, Go's `crypto/mlkem`)
- Cannot claim FIPS 203 compliance — relevant for any enterprise or regulated deployment
- `pqcrypto-kyber` is likely to be unmaintained as the ecosystem converges on ML-KEM
- The `ml-kem` crate (RustCrypto) is a pure-Rust, `#![no_std]`-compatible, formally-verified implementation — it should be the default

**Detection warning signs:**
- `pqcrypto-kyber` in `Cargo.toml` (confirmed present in `crates/tallow-crypto/Cargo.toml` line 16)
- Similarly, `pqcrypto-dilithium` is used for ML-DSA signatures — ML-DSA (FIPS 204) is the standard, not Dilithium
- Any roundtrip test that never tests against an external reference vector will not catch this

**Prevention:**
- Replace `pqcrypto-kyber` with `ml-kem = "0.2"` (RustCrypto crate implementing FIPS 203)
- Replace `pqcrypto-dilithium` with `ml-dsa` (RustCrypto crate implementing FIPS 204)
- Run NIST Known Answer Tests (KATs) against published FIPS 203/204 test vectors before marking as done
- Add a CI step that fails if `pqcrypto-kyber` or `pqcrypto-dilithium` appear in the dependency graph

**Phase:** Fix in Phase 1 (security hardening), before any networking work. Wire format interoperability depends on this.

---

### Pitfall 2: Argon2id Parameters Configured 13x Weaker Than Spec

**What goes wrong:** `derive_key()` in `crates/tallow-crypto/src/kdf/argon2.rs` uses `19456 KiB` (19 MiB) memory and 2 iterations. The CLAUDE.md spec mandates `256 MB memory, 3 iterations, 4 parallel lanes`. The gap is ~13x in memory hardness. Worse: `hash_password()` uses `Argon2::default()`, which uses the `argon2` crate's built-in defaults (19 MiB, 2 iterations, 1 thread) — also far below spec. `verify_password()` re-creates `Argon2::default()` for verification, so existing hashes will always verify against weak parameters — the weak parameters are silently baked into stored credential hashes.

**Why it happens:** The `argon2` crate's `Default` impl uses OWASP minimum parameters, not Tallow's security-maximalist parameters. Developers using `Argon2::default()` for convenience are silently underprovisioning.

**Consequences:**
- Users' PAKE/identity passwords are 13x easier to brute-force
- Hashes stored with weak parameters cannot be re-hashed without user re-authentication — migration is disruptive
- If a password database is compromised before this is fixed, it may be too late

**Detection warning signs:**
- `Argon2::default()` anywhere in production code (not just tests) — confirmed at lines 27 and 60 in `argon2.rs`
- `m_cost` below `262144` (256 MiB) or `t_cost` below `3` in `Params::new()`
- No test asserting parameter values (only tests that verify hashes, not the parameters used)

**Prevention:**
- Create a single `const ARGON2_PARAMS: Params` with `m_cost = 262144, t_cost = 3, p_cost = 4` and use it everywhere
- Eliminate all uses of `Argon2::default()` in non-test code
- Add a test that extracts the parameters from a PHC hash string and asserts exact values
- Mark the `derive_key` function's parameters with `#[cfg(test)]` guards so production always uses the constant

**Phase:** Fix in Phase 1 before any identity/auth storage. Any identity keys or PAKE-protected material stored with weak Argon2 must be invalidated.

---

### Pitfall 3: Silent Security Stub — OPAQUE Returns Dummy Bytes

**What goes wrong:** The OPAQUE PAKE implementation (`crates/tallow-crypto/src/pake/opaque.rs`) is a stub that returns hardcoded bytes (`vec![1, 2, 3]`, `[0u8; 32]`). A caller that uses this for authentication will succeed unconditionally — any password will appear valid. The stub compiles, passes all tests, and type-checks. There is no compiler error or runtime panic indicating it is broken. This is the most dangerous kind of security failure: silent success with zero actual security.

**Why it happens:** Stubs are necessary during scaffolding, but PAKE stubs are uniquely dangerous because authentication always "works" — both happy path and attack path succeed identically. The `opaque-ke = "3"` crate is declared in `Cargo.toml` but not used in `opaque.rs`.

**Consequences:**
- Any code path that relies on OPAQUE for mutual authentication provides zero authentication
- If integrated with room access control, any peer can join any room
- If integrated with identity verification, identity spoofing is trivial
- Unlike most stubs that panic or return an error, this one silently succeeds

**Detection warning signs:**
- Functions returning `Ok(vec![1, 2, 3])` or `Ok([0u8; 32])` with no actual computation (confirmed in `opaque.rs` lines 16-17, 32)
- `opaque-ke` in `Cargo.toml` but not `use`d in `opaque.rs`
- No integration test that verifies a wrong password is rejected
- CPace (`cpace.rs`) is also a partial stub — it does real X25519 DH but does not implement the CPace protocol's password-based generator (the DH happens with a random ephemeral, not the password-derived generator point)

**Prevention:**
- Implement OPAQUE using the `opaque-ke` crate before integrating into any auth flow
- Add a mandatory test: `assert!(login fails with wrong password)` — if this test can pass with a stub, the test is broken
- Treat any function with a hardcoded return on secret-dependent paths as a CI blocker
- CPace requires deriving an ephemeral generator from the password via hash-to-curve — plain X25519 DH without this is just unauthenticated key exchange

**Phase:** Phase 1 or Phase 2 — must be real before any session establishment code integrates it.

---

### Pitfall 4: Non-Constant-Time Comparisons on Shared Secrets in Tests

**What goes wrong:** Tests use `assert_eq!(ss1.0, ss2.0)` to verify shared secrets (confirmed in `mlkem.rs` lines 164, 180 and `hybrid.rs` lines 157, 173). While test assertions are not timing-critical, the `SharedSecret` type derives `PartialEq` implicitly via `assert_eq!`, and if this pattern propagates to production `verify` or session key comparison code, it introduces a timing oracle. The `sig/mldsa.rs` line 29 uses `.unwrap()` in production signing code outside a test block, which panics on invalid secret key bytes.

**Why it happens:** `assert_eq!` is the natural Rust testing tool. Developers do not notice when the comparison leaks from test to production scope. The `subtle` crate is imported but not used in critical comparison sites.

**Consequences:**
- Timing side channels on shared secret comparison allow remote key oracle attacks
- `.unwrap()` in `MlDsaSigner::sign()` means a corrupted key store causes a panic instead of a handled error — in a long-running relay, this crashes the process

**Detection warning signs:**
- `assert_eq!` on types containing key material (`SharedSecret`, `[u8; 32]` secrets)
- `PartialEq` derived on types that should only be compared via `subtle::ConstantTimeEq`
- `.unwrap()` outside `#[cfg(test)]` blocks in `tallow-crypto`

**Prevention:**
- Do not derive `PartialEq` on `SharedSecret` — implement it via `subtle::ConstantTimeEq` or omit it entirely
- Use `ct_eq()` from `crates/tallow-crypto/src/mem/constant_time.rs` for all secret comparisons
- Run `grep -r '\.unwrap()' crates/tallow-crypto/src --include='*.rs'` and fix every hit outside `#[cfg(test)]`
- Add `#![deny(clippy::disallowed_methods)]` for `PartialEq::eq` on secret types

**Phase:** Phase 1.

---

### Pitfall 5: Wire Serialization Format Locked to `bincode` Instead of `postcard`

**What goes wrong:** The CLAUDE.md spec mandates `postcard` for wire serialization. The codebase uses `bincode` (confirmed in `Cargo.toml` for `tallow-crypto`, `tallow-net`, `tallow-protocol`, and `tallow-relay`). `bincode` and `postcard` are not wire-compatible. More critically, `bincode`'s default encoding is not deterministic across versions, and it encodes `#[serde(tag = "type")]` tagged enums using JSON-style string tags — incompatible with `postcard`'s binary-first approach. The `Message` enum in `messages.rs` uses `#[serde(tag = "type")]` which adds a string field to binary output.

**Why it happens:** `bincode` is the most familiar binary serialization crate in Rust. `postcard` is less well-known despite being purpose-built for embedded/wire protocols. The difference is invisible until peers with different libraries try to communicate.

**Consequences:**
- Any serialized messages sent over the wire today will be incompatible with the spec-mandated format
- `bincode` produces larger wire frames than `postcard` for the same data
- `#[serde(tag = "type")]` with `bincode` produces a 4-byte length-prefixed string for every message type — wasted bytes and a protocol parsing landmine
- Migrating after real data is in-flight requires a version bump and dual-format support

**Prevention:**
- Replace `bincode` with `postcard` in all crates — do this before the codec is implemented (`TallowCodec::encode` is still `todo!()`)
- Replace `#[serde(tag = "type")]` with `#[serde(tag)]` (postcard-compat) or a manual enum discriminant
- Wire the `postcard::to_allocvec()` / `postcard::from_bytes()` into the codec
- Add a property test that round-trips all `Message` variants through postcard and asserts byte-for-byte stability

**Phase:** Phase 2 (wire protocol). The codec is currently `todo!()` — fix serialization before implementing it.

---

## Moderate Pitfalls

Mistakes that create significant rework or security debt without being immediately catastrophic.

---

### Pitfall 6: AES-GCM Nonce Management — Counter Scope Must Be Per-Key, Not Per-Chunk

**What goes wrong:** `file/encrypt.rs` derives nonces from chunk indices (`nonce[..8] = chunk_index.to_le_bytes()`). This is correct within a single file transfer. The pitfall is scope: if the same key is reused across multiple file transfers (or if two files share a session key), chunk index 0 of file A and chunk index 0 of file B use the identical nonce under the same key. AES-GCM nonce reuse catastrophically breaks confidentiality — it reveals the XOR of plaintexts and the GHASH key.

**Why it happens:** Counter-based nonces feel safe ("counters are unique"). Developers assume uniqueness within a single file, not across the session. The `NonceGenerator` in `symmetric/nonce.rs` exists but is not wired to the `FileEncryptor`.

**Detection warning signs:**
- `FileEncryptor` taking a bare `[u8; 32]` key with no nonce state — confirmed in `file/encrypt.rs` line 23
- No session nonce counter that persists across chunk boundaries
- The `nonce.rs` `NonceGenerator` exists but is disconnected from `FileEncryptor`

**Prevention:**
- Scope nonces to the session: derive per-transfer keys from the session key via HKDF with the transfer ID as context
- Alternatively, wire `NonceGenerator` into `FileEncryptor` so the counter is globally monotonic for the session
- Never reuse a `[u8; 32]` session key directly as both the encryption key and the KDF key

**Phase:** Phase 2 (transfer pipeline). Must be correct before any real transfer is attempted.

---

### Pitfall 7: Relay Server Has No Resource Bounds — DoS by Room Exhaustion

**What goes wrong:** The relay crate declares `dashmap = "6"` for room state, but the relay logic is unimplemented. When implementing it, the most common mistake is unlimited room creation: any peer can create arbitrarily many rooms, exhausting server memory. The relay must have hard caps on rooms per IP, total rooms, room TTL, and connection count.

**Why it happens:** Resource limits feel like operational concerns, not protocol concerns. They are deferred. When they are finally added, it requires a design change to the room manager API.

**Detection warning signs:**
- Room creation accepts any code without rate-limiting or capacity checks
- No TTL field on room state
- No connection count per peer ID

**Prevention:**
- Design the `RoomManager` with resource caps from day one: `MAX_ROOMS_PER_IP`, `MAX_TOTAL_ROOMS`, `ROOM_TTL_SECONDS`
- Add a cleanup task that sweeps expired rooms every N seconds
- Rate-limit room join/create by source IP using a token bucket in the relay handler
- Relay server must NOT trust peer-provided room sizes or chunk counts without validation

**Phase:** Phase 3 (relay server). Design capacity limits into the data structures, not bolted on later.

---

### Pitfall 8: QUIC TLS Certificate Handling — Self-Signed Certs Without Pinning Are MITM Vulnerable

**What goes wrong:** `tallow-relay/Cargo.toml` includes `rcgen = "0.13"` for generating self-signed TLS certificates. The relay will generate a self-signed cert. Clients connecting to the relay via QUIC (quinn) will need to either: (a) accept any certificate (insecure), (b) pin the relay's certificate fingerprint out-of-band, or (c) use a CA-signed cert. If option (a) is the default, the relay connection has no server authentication — an attacker can run a rogue relay and MITM the signaling plane.

**Why it happens:** Getting QUIC/TLS working in tests is easiest with self-signed certs and `accept_any = true`. This gets committed as "temporary" and becomes permanent.

**Detection warning signs:**
- `rustls::ClientConfig` with a custom `ServerCertVerifier` that returns `Ok` unconditionally
- `dangerous()` in any TLS configuration
- No relay fingerprint in the client config or trust store

**Prevention:**
- Default the relay TLS mode to certificate pinning: the relay fingerprint is included in the relay URL or config
- Implement a `RelayTrustStore` that stores pinned relay certs in the user's config directory
- For discovery (local LAN relay), use TOFU (Trust-On-First-Use) with a visible fingerprint prompt
- Never ship a build where `accept_any` is the default for relay connections

**Phase:** Phase 3 (relay/networking). Decide on cert pinning strategy before wiring up QUIC.

---

### Pitfall 9: Double Ratchet Missing DH Ratchet Header — Out-of-Order Messages Panic

**What goes wrong:** The `DoubleRatchet` in `ratchet/double.rs` stores `recv_counter` as a simple incrementing integer. The `decrypt_message()` function assumes messages arrive in-order. If a message is delayed, retransmitted, or arrives out-of-order, `decrypt_message()` advances `recv_chain_key` permanently — the message key for the skipped counter is lost. Real Double Ratchet implementations must cache skipped message keys and handle out-of-order delivery.

**Why it happens:** The in-order case is dramatically simpler to implement. Out-of-order handling requires a `HashMap<(ratchet_step, message_index), MessageKey>` skipped-key cache, which feels like complexity. But file transfer over QUIC (which provides ordered streams) may hide this for a while, then break when streams are reordered.

**Detection warning signs:**
- `recv_counter: u64` with no skipped message key cache
- `decrypt_message` that always advances the chain key before decrypting

**Prevention:**
- Use QUIC ordered streams for the transfer channel — this eliminates out-of-order delivery for file chunks
- Use a separate unordered/best-effort channel for control messages where the ratchet must handle gaps
- If implementing a full Double Ratchet, add a `skipped_keys: HashMap<u64, [u8; 32]>` with a maximum depth limit (to prevent memory exhaustion from an attacker sending many skipped indices)

**Phase:** Phase 2 (protocol). Decide whether QUIC ordered streams eliminate the need for full skip-handling.

---

### Pitfall 10: Tor SOCKS5 — DNS Leaks Before Proxy Is Established

**What goes wrong:** If any DNS resolution happens before the SOCKS5 connection to Tor is established, the user's resolver sees the hostnames being queried — defeating Tor anonymity. In Rust, resolving relay addresses with the system resolver (`tokio::net::TcpStream::connect(hostname:port)`) triggers system DNS before QUIC/TCP to the proxy. The `Socks5Connector` in `privacy/socks5.rs` does not currently handle hostname-mode SOCKS5 (ATYP = `0x03`).

**Why it happens:** SOCKS5 is often implemented in IP-mode only because it is simpler. Hostname-mode requires passing the domain name through the proxy for remote resolution.

**Detection warning signs:**
- `SocketAddr`-only API in `Socks5Connector::connect()` (confirmed — takes `_target: SocketAddr`)
- System DNS called before proxy is connected anywhere in the net path
- `hickory-resolver` used for relay address resolution without checking if Tor mode is active

**Prevention:**
- Implement SOCKS5 hostname-mode (ATYP `0x03`) so relay domain names resolve through Tor
- When Tor mode is active, disable `hickory-resolver` for relay addresses entirely — use SOCKS5 hostname passthrough
- Add an integration test: in Tor mode, assert no outbound TCP/UDP except to the SOCKS5 proxy address

**Phase:** Phase 4 (Tor/privacy). Must be correct from the first Tor integration — DNS leaks are invisible without a leak test.

---

### Pitfall 11: File Path Traversal in Receive Pipeline

**What goes wrong:** The receive pipeline (`transfer/receive.rs`) is unimplemented but will eventually write files to disk based on filenames from the sender. A malicious sender can set the filename to `../../.bashrc` or `/etc/passwd`. The encrypted filename protection in `metadata/filename.rs` only hides filenames from the relay — the receiver decrypts and uses the original filename.

**Why it happens:** Path traversal is a classic file-writing pitfall. It is especially easy to overlook in a crypto-focused codebase where the threat model emphasizes the relay, not the sender.

**Detection warning signs:**
- `output_dir.join(received_filename)` without sanitization
- No check that the resolved path is still under `output_dir`
- No rejection of absolute paths or paths containing `..` components

**Prevention:**
- After constructing the output path: `assert!(path.starts_with(output_dir))` — return an error if false
- Strip all leading `/` and `..` components from received filenames before joining
- Use `std::path::Component::Normal` filtering: only accept `Normal` components, reject `ParentDir`, `RootDir`, `Prefix`
- Add a fuzz target for the filename sanitization function

**Phase:** Phase 2 (file receive). Must be implemented before any file is written to disk.

---

### Pitfall 12: `mlock` Is a No-Op — Key Material Can Swap to Disk

**What goes wrong:** `lock_memory()` in `mem/wipe.rs` is a no-op: "For now, we'll make this a no-op to maintain forbid(unsafe_code)" (line 54-57). Key material including session keys, secret keys, and Argon2 password hashes are allocated as `Vec<u8>` or `[u8; N]` on the heap. Without `mlock`, the OS can swap these pages to disk. If the system hibernates or the swap partition is later read by an attacker, long-term key material is exposed.

**Why it happens:** `mlock` requires `unsafe` (raw pointer + syscall). The `forbid(unsafe_code)` attribute in `tallow-crypto/lib.rs` prevents it. The workaround is to use a crate that encapsulates the unsafe: `region` is already in `tallow`'s dependencies but not in `tallow-crypto`.

**Detection warning signs:**
- `lock_memory` returning `Ok(())` without any syscall (confirmed)
- No `mlock` or `VirtualLock` in the build
- `secrecy::SecretBox` not used for long-lived key material (`MlDsaSigner.secret_key` is a plain `Vec<u8>`)

**Prevention:**
- Use the `secrecy` crate's `SecretBox<T>` for all long-lived key material — it integrates with `zeroize` and future `mlock` support
- Add `mlock` behind a feature flag (`memory-lock`) using the `region` crate already in `tallow`'s deps
- Apply `mlock` on startup to the process's entire key material region, or use `memfd_secret` on Linux 5.14+
- Consider `memsec` crate as an alternative that wraps `mlock` safely

**Phase:** Phase 1. `secrecy::SecretBox` wrapping should happen before any crypto code is used in production.

---

## Minor Pitfalls

Mistakes that create friction or minor security debt but are not immediately exploitable.

---

### Pitfall 13: `#![forbid(unsafe_code)]` Only on `tallow-crypto` — Other Crates Unprotected

**What goes wrong:** Only `tallow-crypto/src/lib.rs` has `#![forbid(unsafe_code)]`. The other 6 crates have no such declaration. Any unsafe code accidentally introduced into `tallow-net`, `tallow-protocol`, `tallow-store`, `tallow-tui`, or `tallow` will compile silently.

**Prevention:** Add `#![forbid(unsafe_code)]` to every `lib.rs` and `main.rs` in the workspace. Use `#![allow(unsafe_code)]` only on specific files where it is genuinely required (e.g., `mem/wipe.rs`). Add a CI check: `grep -rL 'forbid(unsafe_code)' crates/*/src/lib.rs` must return empty.

**Phase:** Phase 1.

---

### Pitfall 14: `unwrap()` in Production Signing Code

**What goes wrong:** `MlDsaSigner::sign()` at `sig/mldsa.rs:29` calls `.unwrap()` on `SecretKey::from_bytes()`. This is outside `#[cfg(test)]`. If the secret key bytes are ever corrupted (disk error, truncation, format change), signing panics instead of returning an error. In a long-running relay process or a TUI session, this is a crash.

**Prevention:** Replace with `?` propagation. `sign()` should return `Result<Vec<u8>, CryptoError>`. Same fix needed in `sig/slhdsa.rs:29`.

**Phase:** Phase 1.

---

### Pitfall 15: Chunk Hash Is Unauthenticated — Blake3 of Ciphertext, Not AAD-Bound

**What goes wrong:** `file/encrypt.rs` computes `hash = blake3::hash(&ciphertext)` as a plaintext hash of the ciphertext. This hash is not bound to the chunk index, transfer ID, or key context. A relay could swap chunk hashes between transfers or reorder chunks while keeping hashes consistent. The AES-GCM AAD includes `chunk_index` bytes, which does bind chunks to their index — but the outer `EncryptedChunk.hash` field is redundant and misleading if it is used for verification instead of the GCM tag.

**Prevention:** Remove the redundant `hash` field from `EncryptedChunk` and rely solely on the AES-GCM authentication tag, which already covers the `chunk_index` AAD. If a Merkle tree over chunks is desired, use `blake3::keyed_hash` with the session key as the MAC key and include the chunk index and transfer ID in the input.

**Phase:** Phase 2.

---

### Pitfall 16: Codec Is `todo!()` — JSON Serde Tags Will Bloat Binary Messages

**What goes wrong:** `TallowCodec::encode/decode` are `todo!()`. When implemented, if the `Message` enum's `#[serde(tag = "type")]` annotation is kept, postcard (or bincode) will serialize the tag as a variable-length string for every message. This adds 10-20 bytes per message and makes the format harder to parse in non-Rust implementations.

**Prevention:** Replace `#[serde(tag = "type")]` with a simple `repr(u8)` discriminant or a custom serializer. Postcard works best with C-style enums or newtype variants, not internally tagged enums.

**Phase:** Phase 2 (codec implementation).

---

### Pitfall 17: Screen Wipe Is Not Wired to Panic Handler

**What goes wrong:** The CLAUDE.md spec requires screen wiping on exit/panic via `clearscreen`. `clearscreen` is not in any `Cargo.toml`. A panic will dump a Rust backtrace to the terminal and exit without clearing sensitive output (room codes, safety numbers, file names).

**Prevention:** Add `clearscreen` to `tallow/Cargo.toml`. Register a panic hook via `std::panic::set_hook` that calls `clearscreen::clear()` before printing the panic message. Also register a `ctrlc` handler that clears the screen before exiting.

**Phase:** Phase 1 or at TUI integration time.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1: Security hardening | PQ library migration | pqcrypto → ml-kem byte-level incompatibility | Run NIST KAT vectors before closing |
| Phase 1: Security hardening | Argon2 params | `Argon2::default()` is 13x too weak | Const params, no default usage |
| Phase 1: Security hardening | OPAQUE stub | Silent auth success with wrong password | Mandatory negative test before integration |
| Phase 1: Security hardening | mlock / SecretBox | Key material swappable to disk | Wrap all key types in `SecretBox` |
| Phase 2: Transfer pipeline | Nonce scope | Same nonce reused across transfers | Per-transfer key derivation via HKDF |
| Phase 2: Transfer pipeline | File receive | Path traversal via sender filename | Sanitize using `Component::Normal` filter |
| Phase 2: Transfer pipeline | Wire format | bincode vs postcard incompatibility | Switch before codec is implemented |
| Phase 3: Relay server | Resource exhaustion | Unlimited room creation → OOM | Room caps and TTL in initial data model |
| Phase 3: Relay server | TLS cert validation | Self-signed + no pinning → MITM relay | Fingerprint pinning in client config |
| Phase 4: Tor/privacy | DNS leaks | System DNS before SOCKS5 connected | SOCKS5 hostname-mode only in Tor mode |
| Phase 4: Tor/privacy | Traffic analysis | Fixed chunk sizes reveal file sizes | Padding to power-of-two or fixed-block boundaries |

---

## Sources and Confidence

| Claim | Confidence | Basis |
|-------|------------|-------|
| pqcrypto-kyber ≠ ML-KEM FIPS 203 | HIGH | Direct code inspection + well-documented NIST finalization |
| Argon2 params 13x weaker than spec | HIGH | Code inspection — `m_cost = 19456` vs spec `262144` |
| OPAQUE stub returns dummy bytes | HIGH | Direct code inspection of `opaque.rs` |
| bincode vs postcard incompatibility | HIGH | Known Serde ecosystem behavior + code inspection |
| AES-GCM nonce reuse risk across transfers | HIGH | Standard cryptographic property of GCM |
| SOCKS5 hostname-mode for DNS leak prevention | MEDIUM | Standard Tor proxy behavior, SOCKS5 RFC 1928 |
| Relay DoS by room exhaustion | MEDIUM | Common relay implementation pattern, training data |
| QUIC self-signed cert MITM | HIGH | Standard TLS threat model, quinn documentation patterns |
| Double ratchet out-of-order | MEDIUM | Signal protocol specification, training data |
| Path traversal in file receive | HIGH | Classic vulnerability class, Rust-specific path handling |

---

## What Might Have Been Missed

- **Compression oracle attacks:** If compression is applied before encryption (e.g., CRIME/BREACH-style), an attacker controlling part of the plaintext can leak secrets via ciphertext size. The compression pipeline should compress after encryption or use length-hiding padding.
- **Metadata resistance:** `EncryptedChunk.index: u64` is sent in cleartext in the current `Chunk` wire message. A relay can observe transfer progress timing and chunk ordering even without seeing content.
- **QUIC connection migration:** Quinn supports connection migration (IP changes mid-transfer). If the session key is not re-bound to the new network address, a third party could inject into a migrated connection.
- **Concurrent transfer safety:** The ratchet state machine has no lock/mutex. Concurrent encryption/decryption of multiple files on the same session key without synchronization will corrupt the chain key.
