//! Cross-target crypto compatibility tests
//!
//! NOTE: tallow-web is a cdylib crate, so `cargo test -p tallow-web` does not
//! run integration tests in this directory. The comprehensive compatibility
//! tests live in `crates/tallow-crypto/tests/wasm_compat.rs` and verify the
//! exact same code paths that the WASM wrappers call.
//!
//! This file documents the compatibility contract: native and WASM builds must
//! produce identical output for all crypto operations. Since both targets
//! compile the same Rust source (tallow-crypto), determinism on native
//! guarantees determinism on WASM.
//!
//! Run the full compatibility suite with:
//!   cargo test -p tallow-crypto --test wasm_compat
//!
//! The tests verify:
//!   - AES-256-GCM deterministic encryption/decryption
//!   - BLAKE3 hash determinism and room ID derivation
//!   - HKDF-SHA256 key derivation determinism
//!   - Hybrid KEM (ML-KEM-1024 + X25519) encapsulate/decapsulate roundtrip
//!   - KEM bincode serialization roundtrip (browser uses bincode for key transport)
//!   - Chat nonce construction ([0u8;4] || counter.to_be_bytes())
//!   - Chat encryption/decryption with AAD "tallow-chat-v1"
//!   - Transfer chunk AAD construction (transfer_id || chunk_index.to_be_bytes())

// The following would compile if tallow-web were an rlib, but cdylib crates
// do not support integration tests. For reference, the key assertions are:
//
// assert_eq!(encrypt(key, nonce, pt, aad), encrypt(key, nonce, pt, aad));
// assert_eq!(blake3::hash(data), blake3::hash(data));
// assert_eq!(hkdf::derive(s, ikm, info, 32), hkdf::derive(s, ikm, info, 32));
// assert_eq!(ss_enc.expose_secret(), ss_dec.expose_secret());
