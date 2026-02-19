# Codebase Concerns

**Analysis Date:** 2026-02-19

---

## CRITICAL: Wrong PQ Crypto Libraries

**Wrong crates for ML-KEM and ML-DSA:**
- Issue: `CLAUDE.md` specifies `ml-kem` or `fips203` for ML-KEM-1024, and `ml-dsa` for signatures. The codebase uses the legacy `pqcrypto-kyber`, `pqcrypto-dilithium`, and `pqcrypto-sphincsplus` crates instead.
- Files:
  - `crates/tallow-crypto/Cargo.toml` lines 15-20
  - `crates/tallow-crypto/src/kem/mlkem.rs` (imports `pqcrypto_kyber::kyber1024`)
  - `crates/tallow-crypto/src/sig/mldsa.rs` (imports `pqcrypto_dilithium::dilithium5`)
  - `crates/tallow-crypto/src/sig/slhdsa.rs` (imports `pqcrypto_sphincsplus::sphincssha2256fsimple`)
- Impact: `pqcrypto-kyber` is a C-wrapper crate (unsafe internals) that is NOT the FIPS 203 certified `ml-kem` crate. Algorithm names differ (`kyber1024` vs `MlKem1024`). Future FIPS compliance requires migration.
- Fix approach: Replace with `ml-kem = "0.3"` (FIPS 203), `ml-dsa` (FIPS 204), and `slh-dsa` (FIPS 205). API is pure Rust with a different interface; all three files must be rewritten.

---

## CRITICAL: Argon2 Parameters Do Not Match Spec

**Memory cost 19 MiB vs required 256 MiB; iterations 2 vs required 3; parallelism 1 vs required 4:**
- Issue: `CLAUDE.md` specifies Argon2id with 3 iterations, 256 MB memory, 4 parallel lanes. The `derive_key` function uses 19456 KiB (~19 MiB), 2 iterations, and 1 thread. The `hash_password` and `verify_password` functions use `Argon2::default()` which is ~19 MiB, 2 iterations, 1 thread.
- Files:
  - `crates/tallow-crypto/src/kdf/argon2.rs` lines 27, 59, 83-88
- Impact: Password-derived keys (keyring encryption) are 13x weaker than the documented security target. Offline brute-force is significantly faster than advertised. This is a security regression from the documented spec.
- Fix approach: Replace `Argon2::default()` with explicit `Params::new(262144, 3, 4, Some(output_len))` (262144 KiB = 256 MiB). Update both `hash_password` and `derive_key`.

---

## CRITICAL: Non-Constant-Time Hash Comparison on Ciphertext

**`!=` operator used on `[u8; 32]` hash values in security-critical paths:**
- Issue: `decrypt_chunk` and `verify_chunk` use `!=` for hash comparison on `[u8; 32]` values. The `MerkleTree::verify` function uses `== root` on a hash result. These are timing-observable comparisons.
- Files:
  - `crates/tallow-crypto/src/file/decrypt.rs` line 39: `if actual_hash != encrypted_chunk.hash`
  - `crates/tallow-crypto/src/sig/file_signing.rs` line 83: `if actual_hash != sig.chunk_hash`
  - `crates/tallow-crypto/src/hash/merkle.rs` line 147: `if proof.leaf_hash != *leaf`, line 169: `&current_hash == root`
- Impact: Timing side-channel leaks which hash bytes differ, enabling chosen-ciphertext attacks or forgery assistance in adversarial network conditions. Violates the documented security rule "NEVER use non-constant-time comparisons on secrets."
- Fix approach: Use `subtle::ConstantTimeEq` — replace `actual_hash != sig.chunk_hash` with `!actual_hash.ct_eq(&sig.chunk_hash).into()` etc. The `ct_eq` helper in `crates/tallow-crypto/src/mem/constant_time.rs` already wraps this.

---

## CRITICAL: OPAQUE PAKE Is a Non-Functional Stub

**`OpaqueClient` and `OpaqueServer` return hardcoded dummy bytes:**
- Issue: The OPAQUE implementation returns fixed dummy bytes (`vec![1, 2, 3]`, `[0u8; 32]`). This is labeled "simplified stub" in comments. The `opaque-ke` crate is listed in `Cargo.toml` but not used.
- Files:
  - `crates/tallow-crypto/src/pake/opaque.rs` lines 15-55
- Impact: Any flow that relies on OPAQUE for password-authenticated key exchange silently succeeds with a zero session key, creating a catastrophic security failure that is indistinguishable from success at the API level.
- Fix approach: Implement using the `opaque-ke = "3"` crate already in `Cargo.toml`. Priority: HIGH — this is a silent security failure, not a panic.

---

## HIGH: `overflow-checks` Missing from Release Profile

**Integer overflow is silently wrapping in release builds:**
- Issue: `CLAUDE.md` states "Integer overflow checks enabled in release builds (see `Cargo.toml` `[profile.release]`)". The workspace `Cargo.toml` `[profile.release]` section does NOT include `overflow-checks = true`.
- Files:
  - `E:/Tallow/Cargo.toml` lines 53-58
- Impact: Counter arithmetic in `NonceGenerator` (`counter.wrapping_add(1)`) is explicitly safe, but other arithmetic in crypto/protocol code (chunk indexing, chunk counts, offset calculations) could silently overflow in release mode, leading to nonce reuse or out-of-bounds data being processed.
- Fix approach: Add `overflow-checks = true` to `[profile.release]` in `Cargo.toml`.

---

## HIGH: `#![forbid(unsafe_code)]` Only in `tallow-crypto`

**Five other library crates lack the unsafe code prohibition:**
- Issue: Only `crates/tallow-crypto/src/lib.rs` declares `#![forbid(unsafe_code)]`. The crates `tallow-net`, `tallow-protocol`, `tallow-store`, `tallow-tui`, and `tallow-relay` have no such annotation, leaving them open to unsafe code introduction without review gates.
- Files:
  - `crates/tallow-net/src/lib.rs` (no forbid)
  - `crates/tallow-protocol/src/lib.rs` (no forbid)
  - `crates/tallow-store/src/lib.rs` (no forbid)
  - `crates/tallow-tui/src/lib.rs` (no forbid)
  - `crates/tallow-relay/src/main.rs` (no forbid)
- Impact: Future contributors could introduce `unsafe` blocks without them being rejected at compile time.
- Fix approach: Add `#![forbid(unsafe_code)]` to the lib.rs/main.rs of each crate. Exception: `crates/tallow/src/sandbox.rs` may need `allow(unsafe_code)` locally for Linux sandbox code, but the module-level exemption pattern is already documented there.

---

## HIGH: `mlock` Is a No-Op — Key Material Is Not Memory-Pinned

**`lock_memory` silently returns `Ok(())` without pinning pages:**
- Issue: `crates/tallow-crypto/src/mem/wipe.rs` `lock_memory()` is explicitly a no-op with the comment "For now, we'll make this a no-op to maintain forbid(unsafe_code)". The security requirement (keys pinned in RAM via `mlock`) is unmet.
- Files:
  - `crates/tallow-crypto/src/mem/wipe.rs` lines 53-58
- Impact: Session keys, identity keys, and shared secrets can be swapped to disk by the OS, violating the stated security guarantee. On memory-constrained systems or after hibernation, key material may persist on disk.
- Fix approach: Add `libc` as a Unix dependency behind `#[cfg(unix)]`, add a `#[cfg(unix)]` module to `wipe.rs` with an `allow(unsafe_code)` exemption, and implement `mlock`/`munlock` calls. Alternatively use the `memsec` or `region` crate (already in `tallow/Cargo.toml`).

---

## HIGH: Sandbox (Landlock + Seccomp) Is Not Implemented

**Linux OS sandbox functions return `Ok(())` without applying any restrictions:**
- Issue: `apply_landlock` and `apply_seccomp` in `crates/tallow/src/sandbox.rs` contain commented-out code and return `Ok(())`. `apply_openbsd_sandbox` and `apply_macos_sandbox` are also empty. The sandbox is structurally wired but does nothing.
- Files:
  - `crates/tallow/src/sandbox.rs` lines 82-154
- Impact: Defense-in-depth layer (OS process isolation) is completely absent. The `landlock` and `seccompiler` crates are not even in `Cargo.toml`; they are referenced in comments only.
- Fix approach: Add `landlock = "0.4"` and `seccompiler = "0.4"` to `crates/tallow/Cargo.toml` (Linux only via `target.'cfg(target_os = "linux")'.dependencies`). Implement the commented-out ruleset code. Mark as a Phase: this is security-critical but large in scope.

---

## HIGH: Screen Wipe Is a `todo!()` — Panic Handler Incomplete

**`wipe_screen()` panics at runtime; panic handler is an empty closure:**
- Issue: `crates/tallow-tui/src/security.rs` `wipe_screen()` calls `todo!("Implement screen wiping")`. The `install_panic_handler` installs a hook that does nothing.
- Files:
  - `crates/tallow-tui/src/security.rs` lines 4-13
- Impact: Sensitive data (file names, transfer status, keys shown in debug views) is not cleared from the terminal on exit or crash. This is a documented security requirement ("Screen wiped on exit/panic via clearscreen").
- Fix approach: Use the `clearscreen` crate (referenced in `CLAUDE.md`). Add `clearscreen = "2"` to `crates/tallow-tui/Cargo.toml`. Implement `wipe_screen()` as `clearscreen::clear().ok();`. Implement `install_panic_handler` to call `wipe_screen()` before the panic message is displayed.

---

## HIGH: `secrecy::SecretBox` Not Used for Any Key Material

**Key types use raw `Vec<u8>` or `[u8; N]` with only `Zeroize`, without `SecretBox` wrapping:**
- Issue: `CLAUDE.md` requires "All key material types must derive/impl `Zeroize` and be wrapped in `secrecy::SecretBox` where possible." The `secrecy` crate is in workspace dependencies but is not imported anywhere in the codebase (`grep` finds zero uses of `SecretBox` or `secrecy::Secret`).
- Files:
  - `crates/tallow-crypto/src/kem/mlkem.rs` — `SecretKey(Vec<u8>)` not wrapped
  - `crates/tallow-crypto/src/kem/hybrid.rs` — `SecretKey` fields not wrapped
  - `crates/tallow-crypto/src/sig/mldsa.rs` — `secret_key: Vec<u8>` not wrapped
  - `crates/tallow-crypto/src/sig/slhdsa.rs` — `secret_key: Vec<u8>` not wrapped
  - `crates/tallow-crypto/src/ratchet/double.rs` — chain keys as `[u8; 32]` not wrapped
- Impact: Without `SecretBox`, the Rust compiler may optimize or clone key material into non-zeroed locations. `SecretBox` prevents `Debug` formatting from leaking keys and enforces explicit `.expose_secret()` call sites that are auditable.
- Fix approach: Wrap inner key bytes in `secrecy::SecretBox<Box<[u8]>>` or `secrecy::SecretVec<u8>`. This is a significant refactor across `tallow-crypto`.

---

## HIGH: Serialization Mismatch — Protocol Spec Requires `postcard`, Code Uses `bincode`

**Wire format uses `bincode` but `protocol-spec.md` specifies `postcard`:**
- Issue: `docs/protocol-spec.md` states "Serialization: postcard (Serde-compatible, compact binary)". The workspace `Cargo.toml` includes `bincode = "1.3"` and `postcard` is not in any `Cargo.toml`. All key serialization in `tallow-crypto` uses `bincode::serialize`/`bincode::deserialize`.
- Files:
  - `crates/tallow-crypto/src/keys/identity.rs` lines 40, 45
  - `crates/tallow-crypto/src/keys/prekeys.rs` lines 79, 96
  - `crates/tallow-crypto/src/kem/hybrid.rs` (test code)
- Impact: When the wire codec is implemented, it will use a different serialization format than key material serialization, creating potential wire incompatibility. `bincode` v1 has different field ordering than `postcard`.
- Fix approach: Decide on one format. If `postcard` is the wire protocol format, migrate to `postcard = "1"` in workspace. If `bincode` is retained for internal key storage, document the distinction explicitly.

---

## HIGH: `unwrap()` on Secret Key Deserialization in Non-Test Code

**`MlDsaSigner::sign` and `SlhDsaSigner::sign` use `.unwrap()` on secret key bytes:**
- Issue: `crates/tallow-crypto/src/sig/mldsa.rs` line 29 calls `dilithium5::SecretKey::from_bytes(&self.secret_key).unwrap()`. Similarly in `slhdsa.rs` line 29. If the stored secret key bytes are ever corrupted or truncated, this panics rather than returning an error.
- Files:
  - `crates/tallow-crypto/src/sig/mldsa.rs` line 29
  - `crates/tallow-crypto/src/sig/slhdsa.rs` line 29
  - `crates/tallow-crypto/src/keys/storage.rs` lines 23, 39 (`key.try_into().unwrap()` on potentially external input)
  - `crates/tallow-crypto/src/pake/cpace.rs` line 36 (`try_into().unwrap()` on peer-provided data)
- Impact: A malformed remote message or corrupted keystore causes a process panic rather than graceful error handling. `unwrap()` on peer-provided data (`cpace.rs` line 36) is especially dangerous.
- Fix approach: Change `sign(&self, message: &[u8]) -> Vec<u8>` to `sign(&self, message: &[u8]) -> Result<Vec<u8>>`. Return `CryptoError::InvalidKey` instead of panicking. For `cpace.rs`, the length check on line 32 makes the `try_into().unwrap()` technically safe, but use `.expect("length already validated")` or convert to infallible via explicit array copy.

---

## MEDIUM: Entire Transfer Pipeline Is Unimplemented

**`send`, `receive`, `resume`, `chunking`, `manifest signing` are all `todo!()`:**
- Issue: The actual file transfer pipeline — the core product feature — has no implementation. All critical operations are stubs.
- Files (all contain `todo!()` as their entire body):
  - `crates/tallow-protocol/src/transfer/send.rs` — send pipeline
  - `crates/tallow-protocol/src/transfer/receive.rs` — receive pipeline
  - `crates/tallow-protocol/src/transfer/resume.rs` — checkpoint save/restore
  - `crates/tallow-protocol/src/transfer/chunking.rs` — adaptive chunk sizing
  - `crates/tallow-protocol/src/transfer/manifest.rs` — manifest sign/verify
  - `crates/tallow-protocol/src/wire/codec.rs` — message encode/decode
  - `crates/tallow-net/src/transport/quic.rs` — QUIC connect/send/receive
  - `crates/tallow-net/src/transport/tcp_tls.rs` — TCP+TLS connect/send/receive
  - `crates/tallow-net/src/relay/client.rs` — relay connection and forwarding
  - `crates/tallow-relay/src/server.rs` — relay server
  - `crates/tallow-relay/src/auth.rs` — client authentication
  - `crates/tallow-relay/src/signaling.rs` — signaling handler
- Impact: The application cannot send or receive files. All CLI commands (`send`, `receive`, `chat`, `config`, `identity`, `tui`) call `todo!()` and will panic at runtime.
- Fix approach: Implement in priority order: (1) wire codec + transport (QUIC), (2) relay server, (3) send/receive pipeline.

---

## MEDIUM: CLI Commands Call `todo!()` at Runtime

**Six primary commands panic immediately when invoked:**
- Issue: `execute()` in send, receive, chat, config, identity, and tui commands call `todo!()`. Additionally, `Sync`, `Watch`, `Stream`, and `Relay` commands are routed to `send::execute` or `receive::execute` which also `todo!()`.
- Files:
  - `crates/tallow/src/commands/send.rs` line 9
  - `crates/tallow/src/commands/receive.rs` line 9
  - `crates/tallow/src/commands/chat.rs` line 9
  - `crates/tallow/src/commands/config_cmd.rs` line 9
  - `crates/tallow/src/commands/identity.rs` line 23
  - `crates/tallow/src/commands/tui_cmd.rs` line 9
  - `crates/tallow/src/main.rs` lines 28-32 (Sync, Watch, Stream, Relay all route to stub send/receive)
- Impact: Any user invocation of these commands will produce an unhandled `todo!` panic with no graceful error message.
- Fix approach: Replace `todo!()` with `Err(anyhow::anyhow!("Not yet implemented"))` as an interim measure to at least fail gracefully while implementation proceeds.

---

## MEDIUM: TUI Main Loop and All Panels Are `todo!()`

**TUI cannot start; `TuiApp::run()` and all panel/overlay renderers call `todo!()`:**
- Issue: The TUI widget code (settings, devices, chat, etc.) is fully written, but the integration layer is entirely stub.
- Files:
  - `crates/tallow-tui/src/lib.rs` line 33 — `TuiApp::run()`
  - `crates/tallow-tui/src/render.rs` line 10 — `render()`
  - `crates/tallow-tui/src/event.rs` line 35 — event polling
  - `crates/tallow-tui/src/panels/devices.rs` line 15
  - `crates/tallow-tui/src/panels/status.rs` line 15
  - `crates/tallow-tui/src/panels/transfers.rs` line 15
  - `crates/tallow-tui/src/panels/hotkey_bar.rs` line 15
  - `crates/tallow-tui/src/overlays/help.rs` line 15
- Impact: `tallow tui` command panics at launch. The TUI widget library is built but has no entry point.
- Fix approach: Implement `render()` with a basic Ratatui terminal setup loop, connect `EventHandler` to crossterm's `event-stream`, then wire panels. The widget implementations themselves appear complete.

---

## MEDIUM: NAT Traversal Completely Unimplemented

**All NAT/STUN/TURN/UPnP/hole-punching methods call `todo!()`:**
- Issue: The entire NAT traversal stack is skeleton code.
- Files:
  - `crates/tallow-net/src/nat/detection.rs` line 22
  - `crates/tallow-net/src/nat/hole_punch.rs` line 8
  - `crates/tallow-net/src/nat/stun.rs` line 21
  - `crates/tallow-net/src/nat/turn.rs` lines 29, 34
  - `crates/tallow-net/src/nat/upnp.rs` lines 8, 13
- Impact: Peers behind NAT cannot establish direct connections. The relay fallback path also `todo!()`s. This means no actual transfer is possible for the vast majority of real-world network topologies.
- Fix approach: Implement STUN first (simplest, RFC 5389), then UPnP (igd-next crate is already in Cargo.toml), then hole-punching.

---

## MEDIUM: Privacy Layer (DoH, SOCKS5, Traffic Shaping) Is Unimplemented

**Tor integration, DoH resolver, and traffic analysis resistance all call `todo!()`:**
- Issue: Three key privacy features are stubs.
- Files:
  - `crates/tallow-net/src/privacy/socks5.rs` line 36 — SOCKS5 proxy connect
  - `crates/tallow-net/src/privacy/doh.rs` line 21 — DNS-over-HTTPS resolution
  - `crates/tallow-net/src/privacy/traffic_analysis.rs` line 18 — constant-rate shaping
- Impact: The Tor anonymity layer described in `CLAUDE.md` and `docs/threat-model.md` is non-functional. All DNS is plaintext. Traffic timing analysis is unmitigated.
- Fix approach: SOCKS5 via `tokio-socks` crate (already in Cargo.toml). DoH via `hickory-resolver` (already in Cargo.toml with `dns-over-https-rustls` feature). Traffic shaping requires a token-bucket rate limiter.

---

## MEDIUM: Logging Initialization Uses `eprintln!` Instead of `tracing`

**`init_logging()` does not initialize `tracing-subscriber`; it just prints a message:**
- Issue: `crates/tallow/src/logging.rs` uses `eprintln!` to report the log level instead of actually configuring `tracing-subscriber`. No structured logging is active at runtime.
- Files:
  - `crates/tallow/src/logging.rs` lines 14-16
- Impact: All `tracing::info!`, `tracing::warn!`, `tracing::error!` calls throughout the codebase produce no output. Debugging and operational visibility are absent.
- Fix approach: Initialize `tracing_subscriber::fmt()` with `.with_env_filter(level)` in `init_logging()`.

---

## MEDIUM: Discovery (mDNS, DNS-SD) Is Unimplemented

**Local peer discovery returns `todo!()` for start and stop:**
- Issue: mDNS discovery cannot find local peers.
- Files:
  - `crates/tallow-net/src/discovery/mdns.rs` lines 37, 42
- Impact: Local network discovery (same LAN, no relay needed) is completely absent. The `mdns-sd` crate is in Cargo.toml but unused.
- Fix approach: Use the `mdns-sd` crate (already declared) to broadcast a `_tallow._udp` service type.

---

## MEDIUM: Config Load/Save, Identity Keypair, and Encrypted KV Store Are All Stubs

**Persistent state layer cannot load or save anything:**
- Issue: The store crate has data structures defined but all I/O operations call `todo!()`.
- Files:
  - `crates/tallow-store/src/config/loader.rs` lines 9, 14 — load/save config
  - `crates/tallow-store/src/identity/keypair.rs` lines 20, 25, 30 — generate/export/import keypair
  - `crates/tallow-store/src/persistence/encrypted_kv.rs` lines 23, 28, 33 — get/set/delete
- Impact: Identity keys are never persisted. Config changes are lost on exit. The encrypted keystore does not function.
- Fix approach: Config loading with `toml` crate (already in relay's Cargo.toml). Encrypted KV with `sled` or flat-file + AES-GCM using the existing `tallow-crypto` functions.

---

## MEDIUM: Double Ratchet Lacks Out-of-Order Message Support

**`decrypt_message` advances the chain key unconditionally; skipped messages are irrecoverable:**
- Issue: The Double Ratchet implementation in `crates/tallow-crypto/src/ratchet/double.rs` increments `recv_counter` and advances `recv_chain_key` on every decrypt. Standard Signal Protocol ratchets maintain a skipped-message-keys cache to handle out-of-order delivery.
- Files:
  - `crates/tallow-crypto/src/ratchet/double.rs` lines 56-73
- Impact: Any out-of-order message delivery (expected on UDP/QUIC) permanently breaks decryption for subsequent messages. This is a protocol correctness bug, not just a missing feature.
- Fix approach: Implement a `skipped_message_keys: HashMap<(DhPublicKey, u64), [u8; 32]>` cache per Signal spec. Cap at 1000 skipped keys max to prevent memory exhaustion.

---

## MEDIUM: Triple Ratchet PQ Integration Is Incomplete

**`TripleRatchet::step()` retrieves PQ secret but does not mix it into the double ratchet:**
- Issue: `crates/tallow-crypto/src/ratchet/triple.rs` lines 37-42 call `self.sparse_pq_ratchet.step()` and retrieve `_pq_secret` but include the comment "In real implementation, would mix this into the double ratchet". The PQ re-keying is silently discarded.
- Files:
  - `crates/tallow-crypto/src/ratchet/triple.rs` lines 36-42
- Impact: ML-KEM-based forward secrecy re-keying produces new keys but they are never applied, making the "triple ratchet" feature functionally equivalent to a plain double ratchet. Post-quantum protection via ratchet re-keying does not work.
- Fix approach: After PQ rekey, call `self.double_ratchet.ratchet_step_with_pq_secret(&pq_secret)` (a new method to implement) that mixes the PQ shared secret into the root key via HKDF.

---

## MEDIUM: `CPace` Is a Simplified Stub (Not the Real Protocol)

**CPace uses raw DH + BLAKE3 instead of the actual CPace group-based PAKE:**
- Issue: `crates/tallow-crypto/src/pake/cpace.rs` implements "CPace" as a bare X25519 DH exchange with the code phrase appended as a salt. This is not the actual CPace protocol (RFC draft), which requires the code phrase to be hashed into a group element, preventing offline dictionary attacks if one party is compromised.
- Files:
  - `crates/tallow-crypto/src/pake/cpace.rs` lines 30-47
- Impact: The current implementation leaks information about the code phrase through the public message (X25519 public key is unblinded by the code phrase). An attacker observing two protocol runs can mount an offline dictionary attack on the code phrase.
- Fix approach: Use the `cpace` crate or implement proper CPace with `hash_to_curve` from the `p256` or `ristretto255` crate.

---

## LOW: `TuiApp::default()` Uses `.unwrap()` in Library Code

**`Default` impl panics if terminal initialization fails:**
- Issue: `crates/tallow-tui/src/lib.rs` line 39: `Self::new().unwrap()`. A library crate's `Default` impl should not panic.
- Files:
  - `crates/tallow-tui/src/lib.rs` line 39
- Fix approach: Remove the `Default` implementation or change it to return a sensible pre-initialized state that does not require I/O.

---

## LOW: `benchmark` Command Outputs Hardcoded Fake Numbers

**Benchmark results are placeholder strings, not real measurements:**
- Issue: `crates/tallow/src/commands/benchmark.rs` prints "Crypto ops/sec: 10000", "Network throughput: 100 MB/s" as static strings using `println!`.
- Files:
  - `crates/tallow/src/commands/benchmark.rs` lines 8-13
- Impact: Users running `tallow benchmark` receive fabricated data. These are `println!` calls that violate the no-`println!` rule.
- Fix approach: Either remove the command until real benchmarks are wired, or return `Err(anyhow::anyhow!("Benchmarks not yet implemented"))`.

---

## LOW: `libc` Used in `tallow-crypto` Without Being a Declared Dependency

**`wipe.rs` calls `libc::setrlimit` but `libc` is not in `tallow-crypto/Cargo.toml`:**
- Issue: `crates/tallow-crypto/src/mem/wipe.rs` uses `libc::rlimit`, `libc::setrlimit`, `libc::RLIMIT_CORE` behind `#[cfg(unix)]`, but `libc` does not appear in `crates/tallow-crypto/Cargo.toml`.
- Files:
  - `crates/tallow-crypto/src/mem/wipe.rs` lines 14-29
  - `crates/tallow-crypto/Cargo.toml` (libc absent)
- Impact: This code may compile on some platforms due to transitive dependencies but is not guaranteed. Adding `libc` explicitly as a unix-only dependency is required.
- Fix approach: Add `[target.'cfg(unix)'.dependencies] libc = "0.2"` to `crates/tallow-crypto/Cargo.toml`. Note: this will conflict with `#![forbid(unsafe_code)]` — the `libc` call in `wipe.rs` uses an `unsafe` block, so either exempt `wipe.rs` with `#[allow(unsafe_code)]` or move this to the `tallow` crate.

---

## LOW: `generate_diceware` Uses a 100-Word List Instead of EFF's 7776 Words

**Code phrase entropy is dramatically lower than expected for the room code generator:**
- Issue: `crates/tallow-crypto/src/kdf/password.rs` `generate_diceware()` draws from a ~100-word list with the comment "In production, include all 7776 EFF words". With 100 words, 6-word phrases have ~39 bits of entropy. With 7776 words, they have ~77 bits.
- Files:
  - `crates/tallow-crypto/src/kdf/password.rs` lines 79-95
- Impact: Room codes generated by this function are far weaker than the EFF Diceware standard suggests. For a security tool, using the 100-word stub in any user-facing capacity is a security concern.
- Fix approach: Embed the full EFF large wordlist (7776 words) as a `const &[&str]` in the source file or a `build.rs`-generated include.

---

## Test Coverage Gaps

**Core crypto implementations have no fuzz targets; PAKE, ratchets have no property tests:**
- What's not tested:
  - `crates/tallow-crypto/src/pake/` — no property tests for CPace or OPAQUE correctness
  - `crates/tallow-crypto/src/ratchet/` — no tests for out-of-order messages, ratchet advancement, PQ mixing
  - `crates/tallow-protocol/src/wire/` — no tests (codec is unimplemented)
  - No fuzz targets exist anywhere in the workspace (`fuzz/` directory absent)
  - `crates/tallow-relay/` — no integration tests; the server is a stub
- Files: All files in `crates/tallow-crypto/src/pake/`, `crates/tallow-crypto/src/ratchet/`
- Risk: Undetected regressions in crypto correctness. Protocol parsing vulnerabilities would go unfuzzed.
- Priority: High — `proptest` is already in dev-dependencies for `tallow-crypto`.

---

*Concerns audit: 2026-02-19*
