---
name: rust-patterns
description: >
  Idiomatic Rust patterns for security-critical Tallow code. Auto-invoke when
  writing new Rust code, refactoring, handling errors, working with async/tokio,
  managing memory for cryptographic secrets, or implementing tests. Triggers on:
  Rust, implementation, refactor, async, tokio, error, Result, Option, lifetime,
  borrow, ownership, test, proptest, fuzz, benchmark, performance.
allowed-tools: Read, Grep, Glob
---

# Rust Patterns for Tallow

## Error Handling

Tallow uses a two-tier error strategy:
- **Library crates** (`tallow-crypto`, `tallow-net`, etc.): `thiserror` with per-crate error enums
- **Binary entry** (`crates/tallow/src/main.rs`): `anyhow` for ergonomic top-level handling

**Critical**: Crypto error messages MUST NOT include:
- The actual key or secret value
- Internal state that narrows the search space for an attacker
- Different messages for "wrong key" vs "corrupted ciphertext" (use a single "decryption failed" for both)

## Async Patterns
- See `references/async-tokio.md`

## Secret Memory Management
- See `references/secret-memory.md`

## Testing Cryptographic Code
- See `references/testing-crypto.md`

## Reference Files
- `references/error-hierarchy.md` — thiserror/anyhow patterns
- `references/async-tokio.md` — Cancellation safety, spawn_blocking
- `references/secret-memory.md` — zeroize, secrecy crate patterns
- `references/testing-crypto.md` — proptest, cargo-fuzz, round-trip tests
