# Phase 1 Context: Security Hardening

**Phase Goal:** The crypto layer provides the security it advertises — FIPS-compliant PQ algorithms, correct Argon2id parameters, working PAKE, key material pinned in RAM, no panics on bad input.

**Requirements:** SECFIX-01 through SECFIX-15

## Implementation Decisions

### 1. PQ Library Migration Strategy (SECFIX-01, SECFIX-02, SECFIX-03)

**Decision:** Replace all three pqcrypto-* crates with their FIPS-compliant pure-Rust equivalents in a single coordinated migration.

- **ML-KEM-1024**: `pqcrypto-kyber` → `ml-kem` crate (FIPS 203). Use `ml_kem::MlKem1024` with `EncapsulationKey`/`DecapsulationKey` API. The `ml-kem` crate uses `hybrid-array` for fixed-size types — key sizes are compile-time constants, not runtime checks.
- **ML-DSA-87**: `pqcrypto-dilithium` → `ml-dsa` crate (FIPS 204). Use `ml_dsa::MlDsa87` with `SigningKey`/`VerifyingKey` API. The `sign()` method returns `Result<Signature>` (not `Vec<u8>`), which naturally fixes SECFIX-12 for this module.
- **SLH-DSA**: `pqcrypto-sphincsplus` → `slh-dsa` crate (FIPS 205). Use `slh_dsa::SlhDsaSha2_256f` with same signing/verifying pattern.

**Rationale:** The pqcrypto-* crates are C FFI wrappers (unsafe internals) using pre-FIPS algorithm names. The pure-Rust crates are FIPS-certified, `no_std`-compatible, and use the standardized algorithm names. All three must migrate together because the hybrid KEM and hybrid signature types compose them.

**API impact:** Public key/secret key/ciphertext sizes change between pqcrypto-kyber and ml-kem. Any serialized key material is incompatible — this is acceptable because no production keys exist yet (the project hasn't shipped). The `from_bytes()` validation patterns remain similar but use different error types.

**Test strategy:** Add NIST Known Answer Test (KAT) vectors for ML-KEM-1024 to validate the new implementation against the FIPS 203 standard. These are available from the NIST ACVP test vectors.

### 2. CPace Implementation Approach (SECFIX-06, SECFIX-07)

**Decision:** Implement real CPace over Ristretto255 using `curve25519-dalek`. Remove OPAQUE stub entirely (deferred to v2 per roadmap decision).

**CPace protocol steps:**
1. Both parties hash the code phrase + channel binding info (server identity, session ID) to a Ristretto group element using `RistrettoPoint::hash_from_bytes::<sha2::Sha512>(...)` — this is the "generator" step
2. Each party generates a random scalar, multiplies by the hashed generator → public message
3. Exchange public messages, compute DH shared secret
4. Derive session key from shared secret via HKDF with transcript hash

**Why Ristretto255:** The `curve25519-dalek` crate is already a dependency (v4). Ristretto provides a prime-order group with a safe `hash_from_bytes` function (Elligator2-based). No additional crate needed.

**Why not a `cpace` crate:** No mature, well-audited `cpace` crate exists on crates.io. The protocol is simple enough (4 steps) to implement correctly over Ristretto using existing primitives.

**OPAQUE disposition:** The `opaque.rs` stub returns dummy bytes and is a catastrophic silent failure. Remove it entirely. The `opaque-ke` dependency is removed from Cargo.toml. If OPAQUE is needed for v2 (server-side password storage), it can be re-added then. For v1, all authentication is via code phrase → CPace.

### 3. Argon2id Parameter Fix (SECFIX-04)

**Decision:** Replace all `Argon2::default()` with explicit OWASP-recommended parameters:
- Memory: 262144 KiB (256 MiB)
- Iterations: 3
- Parallelism: 4
- Output length: caller-specified (32 bytes for keys, None for password hashing)

**Where applied:**
- `hash_password()` — create `Argon2::new(Algorithm::Argon2id, Version::V0x13, params)` with explicit params
- `verify_password()` — no change needed (reads params from PHC string)
- `derive_key()` — change `Params::new(19456, 2, 1, ...)` to `Params::new(262144, 3, 4, ...)`

**Test impact:** Argon2 with 256 MiB will be slow in tests (~1-2 seconds per hash). Add `#[cfg(test)]` helper with reduced params (16 MiB, 1 iter, 1 parallel) for unit tests that only verify correctness, not security. Integration tests use production params.

### 4. Constant-Time Comparison Audit (SECFIX-05)

**Decision:** Systematic grep for `==` and `!=` on `[u8]` types in non-test crypto code, replace all with `subtle::ConstantTimeEq`.

**Known locations (from CONCERNS.md):**
- `file/decrypt.rs:39` — `actual_hash != encrypted_chunk.hash`
- `sig/file_signing.rs:83` — `actual_hash != sig.chunk_hash`
- `hash/merkle.rs:147,169` — hash comparisons in Merkle proof verification

**Pattern:** Use the existing `crate::mem::constant_time::ct_eq()` helper where possible. For `[u8; 32]` arrays, use `.ct_eq()` directly from the `ConstantTimeEq` trait.

**Verification:** After fix, run `grep -r " == \| != " crates/tallow-crypto/src/` and confirm zero matches on `[u8]` types outside `#[cfg(test)]`.

### 5. SecretBox Wrapping Strategy (SECFIX-08)

**Decision:** Wrap all key material inner bytes in `secrecy::SecretVec<u8>` (for variable-length keys) or `secrecy::SecretBox<[u8; N]>` (for fixed-length keys). Access via `.expose_secret()`.

**Affected types (minimum set):**
- `kem/mlkem.rs`: `SecretKey(Vec<u8>)` → `SecretKey(SecretVec<u8>)`
- `kem/hybrid.rs`: `SecretKey` struct fields
- `sig/mldsa.rs`: `secret_key: Vec<u8>` → `secret_key: SecretVec<u8>`
- `sig/slhdsa.rs`: `secret_key: Vec<u8>` → `secret_key: SecretVec<u8>`
- `ratchet/double.rs`: chain keys `[u8; 32]` → wrapped in SecretBox
- `ratchet/sparse_pq.rs`: `current_secret: [u8; 32]` → wrapped

**Serde handling:** `SecretVec` does not implement `Serialize`/`Deserialize` by default. Use the `secrecy` crate's `serde` feature (already enabled: `secrecy = "0.10"` in workspace). Where custom serialization is needed, expose bytes only during serialization via `.expose_secret()`.

**Debug safety:** `SecretBox`/`SecretVec` print `[REDACTED]` on `Debug` format, preventing accidental key leakage in logs.

### 6. Overflow Checks and Unsafe Code Prohibition (SECFIX-09, SECFIX-10)

**Decision:**
- Add `overflow-checks = true` to `[profile.release]` in workspace `Cargo.toml`
- Add `#![forbid(unsafe_code)]` to all library crate `lib.rs` files that don't already have it

**Crates needing `forbid(unsafe_code)`:**
- `tallow-net/src/lib.rs`
- `tallow-protocol/src/lib.rs`
- `tallow-store/src/lib.rs`
- `tallow-tui/src/lib.rs`
- `tallow-relay/src/main.rs`

**Exception:** `tallow-crypto/src/mem/wipe.rs` already uses `unsafe` for `libc::setrlimit`. This file gets `#[allow(unsafe_code)]` at the function level with a `// SAFETY:` comment. The crate-level `#![forbid(unsafe_code)]` in `lib.rs` stays — the module-level allow overrides it for that specific block.

**Note:** The `tallow` binary crate (`crates/tallow/src/main.rs`) does NOT get `forbid(unsafe_code)` because `sandbox.rs` will need it for Landlock/seccomp in Phase 6.

### 7. Memory Locking Implementation (SECFIX-11)

**Decision:** Implement real `mlock` for Unix platforms using `libc::mlock`. Windows uses `VirtualLock` via `windows-sys`.

**Implementation approach:**
- Add `libc = "0.2"` as `[target.'cfg(unix)'.dependencies]` in `tallow-crypto/Cargo.toml`
- Implement `lock_memory(ptr, len)` using `libc::mlock(ptr as *const _, len)`
- The function already exists with the right signature — replace the no-op body
- `unlock_memory(ptr, len)` using `libc::munlock` — called in Drop impls
- `#[allow(unsafe_code)]` on the function with `// SAFETY:` comment

**Platform behavior:**
- Unix: Real mlock. May fail if `RLIMIT_MEMLOCK` is too low — return `Result` (already does)
- Windows: `VirtualLock` — add behind `#[cfg(windows)]` using `windows-sys`
- Other: No-op with warning log (existing behavior, now explicit)

### 8. Unwrap Removal (SECFIX-12)

**Decision:** Replace all `.unwrap()` in non-test `tallow-crypto` code with `Result` returns.

**Known locations:**
- `sig/mldsa.rs:29` — `SecretKey::from_bytes().unwrap()` → return `Result<Vec<u8>>`
- `sig/slhdsa.rs:29` — same pattern
- `keys/storage.rs:23,39` — `try_into().unwrap()` → return `CryptoError::InvalidKey`
- `pake/cpace.rs:36` — `try_into().unwrap()` on length-checked input → use `.expect("length validated on line 32")` or explicit array copy

**Signature changes:**
- `MlDsaSigner::sign(&self, message: &[u8]) -> Vec<u8>` → `sign(&self, message: &[u8]) -> Result<Vec<u8>>`
- `SlhDsaSigner::sign(&self, message: &[u8]) -> Vec<u8>` → `sign(&self, message: &[u8]) -> Result<Vec<u8>>`

These are breaking API changes. All callers (in `sig/hybrid.rs` and tests) must be updated.

### 9. EFF Diceware Wordlist (SECFIX-13)

**Decision:** Embed the full EFF large wordlist (7776 words) as a compile-time constant in a separate file.

**Implementation:**
- Create `crates/tallow-crypto/src/kdf/eff_wordlist.rs` containing `pub const EFF_WORDLIST: &[&str; 7776] = &[...]`
- Source: EFF's large wordlist from https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
- Include via `include!()` macro or just a const array
- Update `generate_diceware()` to use `EFF_WORDLIST` instead of the 100-word stub
- 6-word phrases now provide ~77 bits of entropy (log2(7776^6) = 77.5)

**Why not build.rs:** A const array is simpler, has zero build-time cost, and the wordlist never changes. The 7776-word list is ~50KB of source — acceptable.

### 10. Double Ratchet Out-of-Order Fix (SECFIX-14)

**Decision:** Add a skipped-message-keys cache to the Double Ratchet per the Signal specification.

**Implementation:**
- Add `skipped_keys: HashMap<(Vec<u8>, u64), [u8; 32]>` to `DoubleRatchet` struct — keyed by (DH ratchet public key, message number)
- On decrypt: if message counter > current recv_counter, derive and cache all intermediate keys up to the message counter
- Cap at `MAX_SKIP = 1000` entries to prevent memory exhaustion from malicious counter jumps
- On DH ratchet step: migrate any remaining skipped keys for the old DH key
- Prune oldest entries when cap is reached

**Why 1000 max skip:** Signal uses 1000. It balances usability (handles realistic reordering on UDP/QUIC with up to 1000 packets in flight) vs memory safety (at most 32KB of cached keys per ratchet).

**Zeroize concern:** Skipped keys in the HashMap must be zeroized when removed or when the ratchet is dropped. Implement `Drop` to iterate and zeroize all cached keys.

### 11. Triple Ratchet PQ Secret Mixing (SECFIX-15)

**Decision:** Add a `mix_pq_secret()` method to `DoubleRatchet` that incorporates the PQ shared secret into the root key via HKDF.

**Implementation:**
- New method: `DoubleRatchet::mix_pq_secret(&mut self, pq_secret: &[u8; 32])`
- Uses HKDF-BLAKE3: `new_root = HKDF-Expand(salt=root_key, ikm=pq_secret, info="pq_rekey")`
- Derives new send and receive chain keys from the updated root key
- Called from `TripleRatchet::step()` when `sparse_pq_ratchet.step()` returns `Some(pk)`

**The flow:**
1. `TripleRatchet::step()` calls `sparse_pq_ratchet.step()`
2. If rekey occurred, get `pq_secret = sparse_pq_ratchet.current_secret()`
3. Call `double_ratchet.mix_pq_secret(pq_secret)`
4. This mixes the ML-KEM shared secret into the root key chain

## Ordering and Dependencies

The 15 requirements have the following implementation order (based on dependencies):

1. **SECFIX-09** (overflow-checks) — 1 line change, zero risk, enables safer arithmetic for everything after
2. **SECFIX-10** (forbid unsafe_code) — quick changes to 5 lib.rs files
3. **SECFIX-01, SECFIX-02, SECFIX-03** (PQ library migration) — must happen together, changes key sizes
4. **SECFIX-04** (Argon2id params) — independent, no external deps
5. **SECFIX-05** (constant-time comparisons) — independent, uses existing helper
6. **SECFIX-12** (unwrap removal) — partially coupled with PQ migration (new APIs return Result)
7. **SECFIX-08** (SecretBox wrapping) — depends on PQ migration (wraps new key types)
8. **SECFIX-11** (mlock) — depends on SecretBox (locks the right memory)
9. **SECFIX-06, SECFIX-07** (CPace/OPAQUE) — depends on nothing in crypto, but large change
10. **SECFIX-13** (EFF wordlist) — independent
11. **SECFIX-14** (Double Ratchet OOO) — depends on nothing
12. **SECFIX-15** (Triple Ratchet PQ mixing) — depends on SECFIX-14 (modifies same ratchet code)

## Deferred Ideas

- OPAQUE PAKE implementation → v2 (per roadmap decision, CPace covers v1)
- Hardware Security Module (HSM) integration for key storage → out of scope
- FIPS 140-3 module certification → out of scope (we use FIPS-compliant algorithms, not a certified module)

## Risk Notes

- **256 MiB Argon2 in CI**: Tests using production Argon2 params will be slow. Use cfg(test) reduced params for unit tests.
- **PQ library API differences**: The `ml-kem` crate uses `hybrid-array` and RustCrypto traits, which differ significantly from `pqcrypto_kyber`. This is the highest-effort change in Phase 1.
- **SecretBox + Serde**: Wrapping keys in SecretBox requires custom Serialize/Deserialize impls since SecretBox intentionally hides its contents from Debug/Display. The `secrecy` crate's serde feature helps but may need manual impls for some types.
- **Windows mlock**: `VirtualLock` has a working set size limit. May silently fail on large key sets. This is acceptable — it's defense-in-depth, not the primary protection.

---
*Created: 2026-02-19 (auto-generated for Phase 1 Security Hardening)*
