# Phase 1 Plan: Security Hardening

**Goal:** The crypto layer provides the security it advertises — FIPS-compliant PQ algorithms, correct Argon2id parameters, working PAKE, key material pinned in RAM, no panics on bad input.

**Requirements:** SECFIX-01 through SECFIX-15
**Estimated Plans:** 5 execution waves

---

## Plan 1: Build Configuration & Safety Gates

**Scope:** SECFIX-09, SECFIX-10
**Files Modified:** 6 files
**Risk:** Low — config changes and compile-time annotations only

### Tasks

1. **Add `overflow-checks = true` to release profile** (SECFIX-09)
   - File: `Cargo.toml` (workspace root)
   - Add `overflow-checks = true` under `[profile.release]`

2. **Add `#![forbid(unsafe_code)]` to all library crates** (SECFIX-10)
   - `crates/tallow-net/src/lib.rs` — add `#![forbid(unsafe_code)]`
   - `crates/tallow-protocol/src/lib.rs` — add `#![forbid(unsafe_code)]`
   - `crates/tallow-store/src/lib.rs` — add `#![forbid(unsafe_code)]`
   - `crates/tallow-tui/src/lib.rs` — add `#![forbid(unsafe_code)]`
   - `crates/tallow-relay/src/main.rs` — add `#![forbid(unsafe_code)]`
   - NOTE: `tallow-crypto` already has it; `tallow` (binary) excluded (needs unsafe for sandbox in Phase 6)

3. **Verify `cargo clippy --workspace -- -D warnings` passes**

### Success Criteria
- `overflow-checks = true` present in `[profile.release]`
- All 6 library crates have `#![forbid(unsafe_code)]`
- `cargo clippy --workspace -- -D warnings` passes

### Commit
`security: add overflow-checks and forbid(unsafe_code) across workspace (SECFIX-09, SECFIX-10)`

---

## Plan 2: PQ Library Migration

**Scope:** SECFIX-01, SECFIX-02, SECFIX-03, SECFIX-12 (partial — unwraps in migrated code)
**Files Modified:** ~15 files
**Risk:** High — changes core crypto primitives and all downstream consumers

### Tasks

1. **Update `tallow-crypto/Cargo.toml` dependencies**
   - Remove: `pqcrypto-kyber`, `pqcrypto-traits`, `pqcrypto-dilithium`, `pqcrypto-sphincsplus`
   - Add: `ml-kem = "0.2"` (FIPS 203), `ml-dsa = "0.2"` (FIPS 204), `slh-dsa = "0.2"` (FIPS 205)
   - Add: `signature = "2"` (for Signer/Verifier traits used by ml-dsa and slh-dsa)
   - Note: Check latest stable versions at build time; use `0.2` series if available, fall back to latest stable

2. **Rewrite `kem/mlkem.rs`** (SECFIX-01)
   - Replace `pqcrypto_kyber::kyber1024` with `ml_kem::MlKem1024`
   - New API: `MlKem1024::generate_keypair()` → `(DecapsulationKey, EncapsulationKey)`
   - `ek.encapsulate(&mut rng)` → `(Ciphertext, SharedKey)`
   - `dk.decapsulate(&ct)` → `SharedKey`
   - Wrap `DecapsulationKey` (secret key) — store via seed-based serialization (64 bytes)
   - `SharedSecret` stays `[u8; 32]`
   - Update `PublicKey::from_bytes()`, `SecretKey::from_bytes()` for new sizes
   - All methods return `Result` (SECFIX-12)

3. **Update `kem/hybrid.rs`**
   - Update `HybridKem::keygen()`, `encapsulate()`, `decapsulate()` for new mlkem types
   - Update serialization (these are the types that cross crate boundaries)

4. **Rewrite `sig/mldsa.rs`** (SECFIX-02, SECFIX-12)
   - Replace `pqcrypto_dilithium::dilithium5` with `ml_dsa::MlDsa87`
   - New API: `MlDsa87::key_gen(&mut rng)` → `KeyPair`
   - `signing_key.sign(msg)` → `Signature` (via `signature::Signer` trait)
   - `verifying_key.verify(msg, &sig)` → `Result<()>` (via `signature::Verifier` trait)
   - Change `sign(&self, message: &[u8]) -> Vec<u8>` to `sign(&self, message: &[u8]) -> Result<Vec<u8>>`
   - Store keys via encoded byte arrays

5. **Rewrite `sig/slhdsa.rs`** (SECFIX-03, SECFIX-12)
   - Replace `pqcrypto_sphincsplus::sphincssha2256fsimple` with `slh_dsa::Sha2_256f`
   - New API: `SigningKey::<Sha2_256f>::new(&mut rng)` → key generation
   - `sk.sign(msg)` or `sk.sign_with_rng(&mut rng, msg)` → `Signature`
   - `vk.verify(msg, &sig)` → `Result<()>`
   - Change `sign()` to return `Result<Vec<u8>>`

6. **Update `sig/hybrid.rs`**
   - `HybridSigner::sign()` now returns `Result<HybridSignature>` (both inner signs return Result)
   - Update `verify()` for new ML-DSA verify API

7. **Update `sig/file_signing.rs`**
   - `sign_chunk()` — handle `Result` from signer
   - May need to change return type to `Result<ChunkSignature>`

8. **Update `keys/identity.rs`**
   - Fix `bincode::serialize(&pk).unwrap()` → proper error handling
   - Update for new hybrid signature types

9. **Update `ratchet/sparse_pq.rs`**
   - Uses `mlkem::MlKem::keygen()` — update for new `ml_kem::MlKem1024` API

10. **Update `error.rs`**
    - Remove `From<bincode::Error>` if bincode removed from non-test paths
    - Add error variants for new crate error types if needed

11. **Add NIST KAT vector tests**
    - Add test using known-answer test vectors for ML-KEM-1024
    - Verify encapsulation/decapsulation against FIPS 203 test vectors

### Success Criteria
- `cargo test -p tallow-crypto` passes with all existing tests updated
- ML-KEM-1024 keygen, encapsulate, decapsulate work with new crate
- ML-DSA-87 keygen, sign, verify work with new crate
- SLH-DSA keygen, sign, verify work with new crate
- No `pqcrypto-*` crates in dependency tree
- All `.unwrap()` in migrated files replaced with `Result`

### Commit
`security: migrate PQ crypto to FIPS-compliant ml-kem/ml-dsa/slh-dsa (SECFIX-01, SECFIX-02, SECFIX-03)`

---

## Plan 3: Argon2, Constant-Time, Unwraps, EFF Wordlist

**Scope:** SECFIX-04, SECFIX-05, SECFIX-12 (remaining), SECFIX-13
**Files Modified:** ~10 files
**Risk:** Medium — parameter changes affect test timing; API signature changes propagate

### Tasks

1. **Fix Argon2id parameters** (SECFIX-04)
   - File: `kdf/argon2.rs`
   - `hash_password()`: Replace `Argon2::default()` with `Argon2::new(Algorithm::Argon2id, Version::V0x13, Params::new(262144, 3, 4, None).unwrap())`
   - `verify_password()`: No change needed (reads params from PHC string)
   - `derive_key()`: Change `Params::new(19456, 2, 1, ...)` to `Params::new(262144, 3, 4, ...)`
   - Add `#[cfg(test)]` helper with reduced params for test speed

2. **Fix constant-time comparisons** (SECFIX-05)
   - File: `file/decrypt.rs:39` — `actual_hash != encrypted_chunk.hash` → `!crate::mem::constant_time::ct_eq(&actual_hash, &encrypted_chunk.hash)`
   - File: `sig/file_signing.rs:83` — `actual_hash != sig.chunk_hash` → `!crate::mem::constant_time::ct_eq(&actual_hash, &sig.chunk_hash)`
   - File: `hash/merkle.rs:147` — `proof.leaf_hash != *leaf` → `!crate::mem::constant_time::ct_eq(&proof.leaf_hash, leaf)`
   - File: `hash/merkle.rs:169` — `&current_hash == root` → `crate::mem::constant_time::ct_eq(&current_hash, root)`

3. **Remove remaining `.unwrap()` in non-test crypto code** (SECFIX-12)
   - `keys/storage.rs:23,39` — `key.try_into().unwrap()` → `key.try_into().map_err(|_| CryptoError::InvalidKey(...))?`
   - `keys/identity.rs:23` — `bincode::serialize(&pk).unwrap()` → handle error
   - `keys/prekeys.rs:74,79,96` — bincode serialization unwraps → handle errors
   - `keys/rotation.rs:47` — `SystemTime` unwrap → use `.expect()` with justification or handle
   - `hash/merkle.rs:75` — `self.nodes.last().unwrap()` → use `.expect("tree built with nodes")` (invariant guaranteed by build logic)
   - `pake/cpace.rs:36` — length-checked `try_into().unwrap()` → keep as `.expect("length validated")` or explicit copy

4. **Embed full EFF Diceware wordlist** (SECFIX-13)
   - Create `kdf/eff_wordlist.rs` with `pub const EFF_WORDLIST: &[&str; 7776] = &[...]`
   - Download from EFF canonical source, extract words only
   - Update `kdf/password.rs` `generate_diceware()` to use `EFF_WORDLIST`
   - Update `kdf/mod.rs` to include new module

5. **Run verification**
   - `grep -r "\.unwrap()" crates/tallow-crypto/src/ --include="*.rs"` — verify only in `#[cfg(test)]` or with documented `.expect()`
   - `grep -r " == \| != " crates/tallow-crypto/src/ --include="*.rs"` — verify no `[u8]` comparisons in non-test code

### Success Criteria
- Argon2id uses 256MiB/3iter/4parallel in production code
- Zero `!=`/`==` on byte types in non-test crypto code
- Zero `.unwrap()` in non-test crypto code (except documented `.expect()`)
- `generate_diceware(6)` produces 6-word phrases from 7776-word list
- All existing tests pass (with reduced Argon2 params in test cfg)

### Commit
`security: fix Argon2 params, constant-time comparisons, unwrap removal, EFF wordlist (SECFIX-04, SECFIX-05, SECFIX-12, SECFIX-13)`

---

## Plan 4: SecretBox Wrapping & Memory Locking

**Scope:** SECFIX-08, SECFIX-11
**Files Modified:** ~12 files
**Risk:** High — pervasive refactor touching all key types

### Tasks

1. **Wrap key material in SecretBox/SecretVec** (SECFIX-08)
   - `kem/mlkem.rs`: `SecretKey` inner bytes → `SecretVec<u8>` or appropriate wrapper for ml-kem DecapsulationKey
   - `kem/hybrid.rs`: `SecretKey` struct fields — wrap ML-KEM secret key
   - `sig/mldsa.rs`: `secret_key: Vec<u8>` → `SecretVec<u8>`, access via `.expose_secret()`
   - `sig/slhdsa.rs`: `secret_key: Vec<u8>` → `SecretVec<u8>`, access via `.expose_secret()`
   - `sig/ed25519.rs`: Wrap `SigningKey` access (ed25519-dalek already handles zeroing internally)
   - `ratchet/double.rs`: `root_key`, `send_chain_key`, `recv_chain_key` — wrap in `SecretBox<[u8; 32]>`
   - `ratchet/sparse_pq.rs`: `current_secret` → `SecretBox<[u8; 32]>`
   - `keys/storage.rs`: key arrays → wrapped
   - Update all `.expose_secret()` call sites
   - Update Serialize/Deserialize impls to handle SecretBox

2. **Implement real `mlock`** (SECFIX-11)
   - Add `[target.'cfg(unix)'.dependencies] libc = "0.2"` to `tallow-crypto/Cargo.toml`
   - `mem/wipe.rs` `lock_memory()`: implement using `libc::mlock(ptr as *const _, len)`
   - Add `unlock_memory()` using `libc::munlock()`
   - Add `#[allow(unsafe_code)]` on the specific functions with `// SAFETY:` comments
   - Windows: add `VirtualLock` behind `#[cfg(windows)]` using `windows-sys` or leave as logging no-op for v1
   - The `prevent_core_dumps()` already uses unsafe libc — this is consistent

3. **Add `libc` as explicit dependency**
   - `tallow-crypto/Cargo.toml`: `[target.'cfg(unix)'.dependencies] libc = "0.2"`

### Success Criteria
- All secret key types use `SecretVec` or `SecretBox`
- `Debug` format on key types prints `[REDACTED]`, not key bytes
- `lock_memory()` actually calls `mlock` on Unix
- `cargo test -p tallow-crypto` passes

### Commit
`security: wrap keys in SecretBox, implement mlock for memory pinning (SECFIX-08, SECFIX-11)`

---

## Plan 5: PAKE & Ratchet Fixes

**Scope:** SECFIX-06, SECFIX-07, SECFIX-14, SECFIX-15
**Files Modified:** ~5 files
**Risk:** Medium — protocol-level changes, need careful testing

### Tasks

1. **Remove OPAQUE stub** (SECFIX-06)
   - Delete `pake/opaque.rs`
   - Remove `opaque-ke` from `tallow-crypto/Cargo.toml`
   - Update `pake/mod.rs` to remove opaque module
   - Verify no other code references `OpaqueClient`/`OpaqueServer`

2. **Implement real CPace over Ristretto255** (SECFIX-07)
   - Rewrite `pake/cpace.rs` with proper CPace protocol:
     ```
     // Generator derivation: hash code phrase to Ristretto point
     let generator = RistrettoPoint::hash_from_bytes::<sha2::Sha512>(
         &domain_separate("cpace-generator", code_phrase, channel_binding)
     );
     // Each party: scalar * generator → public message
     let scalar = Scalar::random(&mut OsRng);
     let public = scalar * generator;
     // Exchange publics, compute shared secret
     let shared = scalar * their_public;
     // Derive session key via HKDF with transcript
     ```
   - `CpaceInitiator::new(code_phrase, session_id)` — generates scalar, computes public
   - `CpaceInitiator::public_message()` → compressed Ristretto point (32 bytes)
   - `CpaceInitiator::finish(their_public)` → `Result<[u8; 32]>` session key
   - `CpaceResponder` — same interface, different role label in transcript
   - Add domain separation: `"tallow-cpace-v1"` prefix
   - Add channel binding: include both public messages in HKDF info
   - Test: same password → same session key; different password → different key; tampered public → error

3. **Add Double Ratchet skipped-message-keys cache** (SECFIX-14)
   - `ratchet/double.rs`:
     - Add `skipped_keys: HashMap<(Vec<u8>, u64), [u8; 32]>` field (DH public key + message number → message key)
     - Add `MAX_SKIP: usize = 1000` constant
     - `decrypt_message()`: if counter in header > recv_counter, derive and cache intermediate keys
     - On DH ratchet step: no skipped keys from old key (they've been cached)
     - Implement `Zeroize` for skipped keys HashMap entries
     - Add `try_skipped_key()` method — check cache first before advancing chain
   - Test: encrypt messages 0,1,2,3; decrypt in order 0,2,1,3 — all succeed
   - Test: skip > MAX_SKIP messages → error (prevent memory exhaustion)

4. **Fix Triple Ratchet PQ secret mixing** (SECFIX-15)
   - `ratchet/double.rs`: add `mix_pq_secret(&mut self, pq_secret: &[u8; 32])`
     - `self.root_key = HKDF(salt=root_key, ikm=pq_secret, info="pq_rekey")`
     - Derive new chain keys from updated root
   - `ratchet/triple.rs`: update `step()` to call `double_ratchet.mix_pq_secret()` when PQ rekey occurs
   - Test: after PQ rekey, the session key is different from before rekey

### Success Criteria
- OPAQUE module removed, `opaque-ke` not in dependency tree
- CPace with same password produces matching session keys
- CPace with different passwords produces different keys (and Err)
- Out-of-order message decryption works (up to MAX_SKIP gap)
- PQ secret is mixed into root key after sparse ratchet rekey
- `cargo test -p tallow-crypto` passes with all new tests

### Commit
`security: real CPace PAKE, Double Ratchet OOO support, Triple Ratchet PQ mixing (SECFIX-06, SECFIX-07, SECFIX-14, SECFIX-15)`

---

## Verification (after all plans complete)

Run the Phase 1 success criteria from ROADMAP.md:

1. `cargo test -p tallow-crypto` passes and ML-KEM-1024 operations succeed against NIST KAT vectors
2. `grep -r " == \| != " crates/tallow-crypto/src/` finds zero matches on `[u8]` types outside `#[cfg(test)]`
3. CPace PAKE: different passwords → `Err`, same password → matching session key
4. Argon2id with `Params::new(262144, 3, 4, None)` completes; `Argon2::default()` absent from non-test code
5. Zero `.unwrap()` in non-test crypto code; `cargo clippy -p tallow-crypto` passes with zero warnings

---

## Execution Order

```
Plan 1 (config gates) ──→ Plan 2 (PQ migration) ──→ Plan 3 (argon2/ct/unwrap/wordlist) ──→ Plan 4 (SecretBox/mlock) ──→ Plan 5 (PAKE/ratchets)
```

Plans 1→2 are strictly sequential (PQ migration depends on build config).
Plans 3 and 5 have no mutual dependency but both depend on Plan 2.
Plan 4 depends on Plan 2 (wraps the new key types).
Plan 3 before Plan 4 preferred (unwrap removal makes SecretBox wrapping cleaner).

---
*Created: 2026-02-19*
*Phase: 1 of 6 — Security Hardening*
*Requirements: SECFIX-01 through SECFIX-15*
