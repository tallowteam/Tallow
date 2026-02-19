# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Snake case for all Rust source files: `aes_gcm.rs`, `secure_buf.rs`, `constant_time.rs`
- Module entry points named `mod.rs`: `crates/tallow-crypto/src/kem/mod.rs`
- Error types in dedicated `error.rs` per crate: `crates/tallow-crypto/src/error.rs`
- One public API type or function group per file (e.g., `encrypt.rs` for file encryption, `decrypt.rs` for decryption)

**Types and Structs:**
- PascalCase for all types: `HybridKem`, `SecureBuf`, `NonceGenerator`, `DoubleRatchet`
- Newtype wrappers for key material: `PublicKey(Vec<u8>)`, `SecretKey(Vec<u8>)`, `SharedSecret(pub [u8; 32])`
- Enum variants in PascalCase: `CryptoError::KeyGeneration`, `CipherSuite::Aes256Gcm`

**Functions:**
- Snake case for all functions: `encrypt_chunk`, `derive_key`, `ct_eq`, `keyed_hash`
- Constructor pattern named `new` or `generate` (for key material): `SecureBuf::new()`, `X25519KeyPair::generate()`
- Factory methods on unit structs: `MlKem::keygen()`, `HybridKem::encapsulate()`
- Conversion methods named `from_bytes` / `as_bytes`: `PublicKey::from_bytes()`, `SecretKey::as_bytes()`

**Constants:**
- SCREAMING_SNAKE_CASE for all constants: `DOMAIN_FILE_ENC`, `DOMAIN_HYBRID_COMBINE`
- Domain separator constants defined in `crates/tallow-crypto/src/hash/domain.rs` with versioning: `"tallow.file.encryption.v1"`

**Variables:**
- Snake case: `chunk_key`, `mlkem_ss`, `ephemeral_kp`

## Crate Structure

**Module declaration pattern in `lib.rs`:**
```rust
// All submodules declared public
pub mod error;
pub mod kem;
pub mod symmetric;

// Re-export commonly used types at crate root
pub use error::{CryptoError, Result};
pub use symmetric::CipherSuite;
```

**Submodule `mod.rs` pattern:**
```rust
// Declare implementation sub-modules
pub mod hybrid;
pub mod mlkem;
pub mod negotiation;
pub mod x25519;

// Re-export the primary public API
pub use hybrid::HybridKem;
pub use mlkem::MlKem;
```

**Per-crate `Result` alias:**
```rust
// Every crate defines its own Result alias
pub type Result<T> = std::result::Result<T, CryptoError>;
```

## Error Handling

**Library crates use `thiserror`:** `tallow-crypto`, `tallow-net`, `tallow-store`, `tallow-protocol`, `tallow-relay`, `tallow-tui`

**Binary crate uses `anyhow`:** `tallow/src/main.rs` — also uses `color-eyre`

**thiserror enum pattern (tallow-crypto):**
```rust
#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum CryptoError {
    #[error("Key generation failed: {0}")]
    KeyGeneration(String),

    #[error("Hash mismatch: expected {expected}, got {actual}")]
    HashMismatch { expected: String, actual: String },
}
```

**Deviation — tallow-net and tallow-store use manual `Display` impl** instead of `thiserror`:
```rust
// crates/tallow-net/src/error.rs — manual Display, no thiserror
impl fmt::Display for NetworkError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self { ... }
    }
}
impl std::error::Error for NetworkError {}
```

**Error conversion via `From`:** All error enums implement `From<std::io::Error>`.

**Error propagation via `?`:** Standard `?` operator used throughout. Errors wrapped with `.map_err()` when converting between error types:
```rust
hk.expand(info, &mut okm)
    .map_err(|e| CryptoError::KeyGeneration(format!("HKDF expansion failed: {}", e)))?;
```

**No `.unwrap()` outside tests:** `.unwrap()` is permitted only inside `#[cfg(test)]` modules. One non-test `.unwrap()` exists at `crates/tallow-crypto/src/hash/merkle.rs:75` on `self.nodes.last()` (flagged as a concern).

## Doc Comments

**Rule:** All public items get `///` doc comments (enforced by `#![warn(missing_docs)]` in `tallow-crypto`).

**Pattern for functions:**
```rust
/// Derive key material using HKDF-SHA256
///
/// # Arguments
///
/// * `salt` - Optional salt value (use empty slice for no salt)
/// * `ikm` - Input key material
/// * `info` - Application-specific context information
/// * `len` - Length of output key material in bytes
///
/// # Returns
///
/// Derived key material of the requested length
///
/// # Example
///
/// ```ignore
/// let derived = derive(b"salt", b"input_key_material", b"app_context", 32)?;
/// ```
pub fn derive(salt: &[u8], ikm: &[u8], info: &[u8], len: usize) -> Result<Vec<u8>> {
```

**Pattern for unsafe blocks:**
```rust
// SAFETY: setrlimit is safe to call with valid parameters
// We're setting RLIMIT_CORE to 0 to disable core dumps
unsafe {
    libc::setrlimit(...)
}
```

**Module-level docs:** Every file opens with `//!` inner doc comment:
```rust
//! BLAKE3 hash function implementations
```

**Security-sensitive functions use `# Security` section:**
```rust
/// Expose the secret value as a reference
///
/// # Security
///
/// The caller must ensure they don't leak or copy the secret value.
pub fn expose_secret(&self) -> &T {
```

## Security Patterns

**`#![forbid(unsafe_code)]`:** Applied only to `crates/tallow-crypto/src/lib.rs`. Other crates (tallow-net, tallow-store, etc.) do not yet declare this attribute. Exception pathway for platform-specific code: `crates/tallow-crypto/src/mem/wipe.rs` uses `#[cfg(unix)]` block with `unsafe` guarded by `// SAFETY:` comment.

**Zeroize on sensitive types:**
```rust
// Derive macro approach (preferred)
#[derive(Clone, Zeroize, Serialize, Deserialize)]
#[zeroize(drop)]
pub struct SecretKey(Vec<u8>);

// Manual impl for types containing non-Zeroize fields
impl Zeroize for NonceGenerator {
    fn zeroize(&mut self) {
        self.counter.zeroize();
        self.seed.zeroize();
    }
}
```

**`SecureBuf<T>` wrapper:** Defined at `crates/tallow-crypto/src/mem/secure_buf.rs`. Used for sensitive byte buffers. Implements `ZeroizeOnDrop`. `Debug` impl prints `"SecureBuf<REDACTED>"`.

**Constant-time comparisons:** Use `subtle::ConstantTimeEq` via helpers in `crates/tallow-crypto/src/mem/constant_time.rs`:
```rust
// Always use ct_eq for secret comparisons — never == on key material
use crate::mem::constant_time::ct_eq;
assert!(ct_eq(tag_a, tag_b));
```

**Domain separation:** All BLAKE3 KDF calls use domain constants from `crates/tallow-crypto/src/hash/domain.rs`. Pattern: `"tallow.<purpose>.v<N>"`:
```rust
let chunk_key = blake3::derive_key(domain::DOMAIN_HYBRID_COMBINE, &combined_input);
```

**Nonce management:** Counter-based nonces via `NonceGenerator` in `crates/tallow-crypto/src/symmetric/nonce.rs`. Direction bit (send/receive) encoded in nonce to prevent cross-direction reuse. `#[cfg(test)]` gated `reset()` method prevents test-only nonce reset from reaching production.

**`Debug` impl redaction:** Types containing secrets override `Debug` to hide values:
```rust
impl std::fmt::Debug for NonceGenerator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NonceGenerator")
            .field("seed", &"<REDACTED>")
```

**Key material parameter types:** Crypto functions accept `&[u8; N]` fixed-size slices (not `Vec<u8>`) for key and nonce parameters, return `Vec<u8>` for variable-length output:
```rust
pub fn encrypt(key: &[u8; 32], nonce: &[u8; 12], plaintext: &[u8], aad: &[u8]) -> Result<Vec<u8>>
```

## Logging

**Framework:** `tracing` crate (workspace dependency). Structured logging via `tracing::{info, warn, error, debug, trace}`.

**Rule:** No `println!` in library or production code. The main binary (`tallow/`) currently violates this in stub command implementations — all `println!` calls in `crates/tallow/src/commands/` are stubs that must be replaced with `tracing::` calls before those commands are implemented.

**Level mapping:** Verbosity flag (`-v`, `-vv`, `-vvv`) maps: 0 → warn, 1 → info, 2 → debug, 3+ → trace.

## Import Organization

**Order (observed pattern):**
1. Standard library (`use std::...`)
2. Crypto/security crates (`use zeroize::...`, `use subtle::...`)
3. Third-party crates (`use serde::...`, `use rand::...`)
4. Crate-local imports (`use crate::error::...`, `use crate::hash::...`)
5. Module imports with `super::*` inside `#[cfg(test)]`

**Feature-gated imports:**
```rust
#[cfg(feature = "aegis")]
pub mod aegis;

#[cfg(feature = "aegis")]
pub use self::aegis::{decrypt as aegis_decrypt, encrypt as aegis_encrypt};
```

## Function Design

**Prefer `&[u8]` inputs, return owned types:**
```rust
// Input: borrowed slices
pub fn hash(data: &[u8]) -> [u8; 32]
// Output: owned Vec<u8> for variable-length, arrays for fixed-length
pub fn derive(..., len: usize) -> Result<Vec<u8>>
```

**Unit struct as namespace for operations:**
```rust
pub struct HybridKem;
impl HybridKem {
    pub fn keygen() -> (PublicKey, SecretKey) { ... }
    pub fn encapsulate(pk: &PublicKey) -> Result<(Ciphertext, SharedSecret)> { ... }
    pub fn decapsulate(sk: &SecretKey, ct: &Ciphertext) -> Result<SharedSecret> { ... }
}
```

**Private helpers in same file:**
```rust
fn combine_secrets(mlkem_ss: &[u8; 32], x25519_ss: &[u8; 32]) -> Result<[u8; 32]> { ... }
```

## CLI Patterns

**clap derive API:** `#[derive(Parser)]`, `#[derive(Subcommand)]`, `#[derive(Args)]`. All in `crates/tallow/src/cli.rs`.

**Subcommand handler pattern:**
```rust
// Each command lives in crates/tallow/src/commands/<name>.rs
pub async fn execute(args: SendArgs) -> io::Result<()> { ... }
```

**Feature flags:** Major optional features (`tui`, `quic`, `aegis`, `onion`) are gated in `crates/tallow/Cargo.toml`.

## Platform-Specific Code

**`#[cfg(target_os = "...")]` blocks** for OS sandbox implementations in `crates/tallow/src/sandbox.rs`. Platform-specific functions have a top-level dispatcher using `#[cfg]` on individual `fn` bodies — not `#[cfg_attr]`.

---

*Convention analysis: 2026-02-19*
