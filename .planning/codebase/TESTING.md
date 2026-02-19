# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

**Runner:** Cargo built-in test harness (no separate test runner)

**Assertion Library:** Standard `assert!`, `assert_eq!`, `assert_ne!`

**Benchmark Framework:** Criterion 0.5 (with HTML reports)
- Config: `crates/tallow-crypto/benches/crypto_benchmarks.rs`
- Registered in `crates/tallow-crypto/Cargo.toml` as `[[bench]]` with `harness = false`

**Property Testing:** `proptest` 1.x is a `dev-dependency` in `tallow-crypto`. No proptest tests exist yet in the codebase — it is listed in `Cargo.toml` but not invoked in any source file.

**Integration Test Framework:** `assert_cmd` 2 + `predicates` 3 in `tallow` dev-dependencies. No integration tests written yet.

**Run Commands:**
```bash
cargo test --workspace          # All tests across all crates
cargo test -p tallow-crypto     # Crypto crate tests only
cargo test <test_name>          # Single test (preferred for speed)
cargo bench -p tallow-crypto    # Crypto benchmarks (criterion)
```

## Test File Organization

**Location:** Co-located with implementation. Every `.rs` file containing public functions includes a `#[cfg(test)]` module at the bottom of the same file.

**Naming pattern:** `#[cfg(test)] mod tests { ... }` — always named `tests`.

**Structure:**
```
crates/tallow-crypto/src/
  hash/
    blake3.rs        # implementation + #[cfg(test)] mod tests at bottom
    merkle.rs        # implementation + #[cfg(test)] mod tests at bottom
  symmetric/
    aes_gcm.rs       # implementation + #[cfg(test)] mod tests at bottom
    chacha20.rs      # implementation + #[cfg(test)] mod tests at bottom
    nonce.rs         # implementation + #[cfg(test)] mod tests at bottom
  kem/
    hybrid.rs        # implementation + #[cfg(test)] mod tests at bottom
    mlkem.rs         # implementation + #[cfg(test)] mod tests at bottom
  ...

crates/tallow-crypto/benches/
  crypto_benchmarks.rs   # Criterion benchmark harness

crates/tallow/src/
  sandbox.rs         # implementation + #[cfg(test)] mod tests at bottom
```

**No separate `tests/` integration test directories** exist in any crate at this time.

## Test Structure

**Standard module pattern:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_<function>_<scenario>() {
        // Arrange
        let key = [0u8; 32];
        let plaintext = b"hello world";

        // Act
        let result = encrypt(&key, &nonce, plaintext, &[]).unwrap();

        // Assert
        assert_eq!(plaintext, decrypted.as_slice());
    }
}
```

**Test naming convention:** `test_<subject>_<scenario>` in snake case:
- `test_hybrid_roundtrip`
- `test_aes_gcm_wrong_key`
- `test_nonce_direction_encoding`
- `test_merkle_proof_invalid_leaf`

**`.unwrap()` in tests:** Permitted and standard. Tests use `.unwrap()` on `Result` returns rather than `?` or `assert!(result.is_ok())`.

## Crypto Test Patterns

**Round-trip tests (most critical pattern):** Every encrypt/sign operation is tested against its inverse. This is the primary test pattern for all crypto code.

```rust
// AES-GCM round-trip: crates/tallow-crypto/src/symmetric/aes_gcm.rs
#[test]
fn test_aes_gcm_roundtrip() {
    let key = [0u8; 32];
    let nonce = [1u8; 12];
    let plaintext = b"hello world";
    let aad = b"metadata";

    let ciphertext = encrypt(&key, &nonce, plaintext, aad).unwrap();
    let decrypted = decrypt(&key, &nonce, &ciphertext, aad).unwrap();

    assert_eq!(plaintext, decrypted.as_slice());
}

// Hybrid KEM round-trip: crates/tallow-crypto/src/kem/hybrid.rs
#[test]
fn test_hybrid_roundtrip() {
    let (pk, sk) = HybridKem::keygen();
    let (ct, ss1) = HybridKem::encapsulate(&pk).unwrap();
    let ss2 = HybridKem::decapsulate(&sk, &ct).unwrap();
    assert_eq!(ss1.0, ss2.0);
}
```

**Wrong-key / tamper tests:** Each AEAD scheme has tests confirming decryption fails with wrong key, wrong nonce, or wrong AAD:

```rust
// crates/tallow-crypto/src/symmetric/aes_gcm.rs
#[test]
fn test_aes_gcm_wrong_key() {
    let ciphertext = encrypt(&key1, &nonce, plaintext, &[]).unwrap();
    let result = decrypt(&key2, &nonce, &ciphertext, &[]);
    assert!(result.is_err());
}

#[test]
fn test_aes_gcm_wrong_aad() {
    let ciphertext = encrypt(&key, &nonce, plaintext, aad1).unwrap();
    let result = decrypt(&key, &nonce, &ciphertext, aad2);
    assert!(result.is_err());
}
```

**Tamper detection tests:** File decryption tests verify hash mismatch errors:
```rust
// crates/tallow-crypto/src/file/decrypt.rs
#[test]
fn test_decrypt_tampered_chunk() {
    let mut encrypted = encrypt_chunk(&key, data, index).unwrap();
    encrypted.hash[0] ^= 1; // Tamper with hash
    let result = decrypt_chunk(&key, &encrypted);
    assert!(result.is_err());
}
```

**Serialization round-trips:** Key types that implement `Serialize`/`Deserialize` are tested for serialize → deserialize → still-operable:
```rust
// crates/tallow-crypto/src/kem/hybrid.rs
#[test]
fn test_hybrid_serialization() {
    let (pk, sk) = HybridKem::keygen();
    let pk_serialized = bincode::serialize(&pk).unwrap();
    let sk_serialized = bincode::serialize(&sk).unwrap();
    let pk2: PublicKey = bincode::deserialize(&pk_serialized).unwrap();
    let sk2: SecretKey = bincode::deserialize(&sk_serialized).unwrap();
    // Verify deserialized keys still produce correct results
    let (ct, ss1) = HybridKem::encapsulate(&pk2).unwrap();
    let ss2 = HybridKem::decapsulate(&sk2, &ct).unwrap();
    assert_eq!(ss1.0, ss2.0);
}
```

**KDF determinism tests:** Derive functions tested for same-input → same-output and different-input → different-output:
```rust
// crates/tallow-crypto/src/kdf/hkdf.rs
#[test]
fn test_hkdf_derive() {
    let key1 = derive(salt, ikm, info, 32).unwrap();
    let key2 = derive(salt, ikm, info, 32).unwrap();
    assert_eq!(key1, key2);  // Deterministic
}

#[test]
fn test_hkdf_different_info() {
    let key1 = derive(salt, ikm, b"context1", 32).unwrap();
    let key2 = derive(salt, ikm, b"context2", 32).unwrap();
    assert_ne!(key1, key2);  // Domain-separated
}
```

**Nonce uniqueness tests:**
```rust
// crates/tallow-crypto/src/symmetric/nonce.rs
#[test]
fn test_nonce_generation() {
    let mut gen = NonceGenerator::new(Direction::Send).unwrap();
    let nonce1 = gen.next();
    let nonce2 = gen.next();
    assert_ne!(nonce1, nonce2);
}

#[test]
fn test_nonce_direction_encoding() {
    let mut send_gen = NonceGenerator::from_seed(seed, Direction::Send);
    let mut recv_gen = NonceGenerator::from_seed(seed, Direction::Receive);
    let send_nonce = send_gen.next();
    let recv_nonce = recv_gen.next();
    assert_ne!(send_nonce[8], recv_nonce[8]); // Direction bit differs
}
```

**Password/Argon2 tests:**
```rust
// crates/tallow-crypto/src/kdf/argon2.rs
#[test]
fn test_hash_and_verify() {
    let hash = hash_password(password, None).unwrap();
    assert!(verify_password(password, &hash).unwrap());
    assert!(!verify_password(b"wrong_password", &hash).unwrap());
}
```

## Benchmarks

**Framework:** Criterion 0.5, file at `crates/tallow-crypto/benches/crypto_benchmarks.rs`.

**Benchmark groups:** Each benchmark covers throughput across sizes (1KB, 64KB, 1MB):
```rust
fn bench_aes_gcm(c: &mut Criterion) {
    let mut group = c.benchmark_group("symmetric/aes-gcm");
    for size in [1024, 65536, 1048576] {
        let data = vec![0u8; size];
        group.throughput(Throughput::Bytes(size as u64));
        group.bench_with_input(format!("{} bytes", size), &data, |b, data| {
            b.iter(|| aes_encrypt(black_box(&key), &nonce, black_box(data), &[]));
        });
    }
    group.finish();
}
```

**Registered benchmarks:**
- `bench_blake3` — throughput for 1KB/64KB/1MB
- `bench_aes_gcm` — throughput for 1KB/64KB/1MB
- `bench_chacha20` — throughput for 1KB/64KB/1MB
- `bench_mlkem` — keygen, encapsulate, decapsulate latency
- `bench_x25519` — keygen, DH latency
- `bench_file_encryption` — chunk sizes 64KB/256KB/1MB

## Test-Only Utilities

**`#[cfg(test)]` gated methods** on production types (used to expose reset/inspection for tests without shipping that access in production):

```rust
// crates/tallow-crypto/src/symmetric/nonce.rs
/// Reset the counter (dangerous - only use for testing)
#[cfg(test)]
pub fn reset(&mut self) {
    self.counter = 0;
}
```

## Coverage

**Requirements:** No enforced coverage threshold. No `cargo-tarpaulin` or `cargo-llvm-cov` configured.

**View Coverage:**
```bash
cargo llvm-cov --workspace   # if cargo-llvm-cov is installed
```

## Test Types

**Unit Tests:** Co-located in implementation files. Primary test type. 257 `#[test]` functions across the workspace. Heavily concentrated in `tallow-crypto`.

**Integration Tests:** `assert_cmd` + `predicates` are in `tallow` dev-dependencies but no `tests/` directory exists yet. No CLI integration tests written.

**Property Tests:** `proptest` is in `tallow-crypto` dev-dependencies but no `proptest!` macros are currently written. Intent is for crypto round-trip property testing.

**Fuzz Targets:** A `fuzz/` directory for protocol parsing and crypto inputs is mentioned in `CLAUDE.md` but does not exist in the repository yet.

**E2E Tests:** Not present. No test infrastructure for full send/receive flows.

## What Is and Is Not Tested

**Well tested (unit tests present):**
- All AEAD encrypt/decrypt operations: `crates/tallow-crypto/src/symmetric/aes_gcm.rs`, `chacha20.rs`
- ML-KEM keygen/encapsulate/decapsulate: `crates/tallow-crypto/src/kem/mlkem.rs`
- Hybrid KEM roundtrip and serialization: `crates/tallow-crypto/src/kem/hybrid.rs`
- HKDF-SHA256 derivation: `crates/tallow-crypto/src/kdf/hkdf.rs`
- Argon2id hash/verify/derive: `crates/tallow-crypto/src/kdf/argon2.rs`
- BLAKE3 hash/keyed-hash/derive-key: `crates/tallow-crypto/src/hash/blake3.rs`
- Merkle tree build/prove/verify: `crates/tallow-crypto/src/hash/merkle.rs`
- NonceGenerator uniqueness and direction encoding: `crates/tallow-crypto/src/symmetric/nonce.rs`
- Ed25519 sign/verify/serialization: `crates/tallow-crypto/src/sig/ed25519.rs`
- SecureBuf zeroize wrapper: `crates/tallow-crypto/src/mem/secure_buf.rs`
- Constant-time equality and selection: `crates/tallow-crypto/src/mem/constant_time.rs`
- Sandbox config defaults: `crates/tallow/src/sandbox.rs`

**Not yet tested (gaps):**
- File chunk encrypt/decrypt cross-module (only single-file tests exist)
- Double ratchet state evolution (`crates/tallow-crypto/src/ratchet/double.rs` has no test module)
- Triple ratchet (`crates/tallow-crypto/src/ratchet/triple.rs`)
- CPace/OPAQUE PAKE protocols (`crates/tallow-crypto/src/pake/`)
- Network transport layer (`crates/tallow-net/`)
- Store persistence layer (`crates/tallow-store/`)
- CLI command execution (`crates/tallow/src/commands/`)
- TUI render logic (`crates/tallow-tui/`)

---

*Testing analysis: 2026-02-19*
