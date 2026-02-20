# Secret Memory Management for Tallow

## Key Types Must Have
- `Zeroize + ZeroizeOnDrop` derived on ALL key material types
- `secrecy::SecretBox` wrapper for key storage
- `subtle::ConstantTimeEq` for all secret comparisons
- `mlock` to pin secrets in RAM (prevent swap to disk)
- `prctl(PR_SET_DUMPABLE, 0)` to prevent core dumps (Linux)

## Stack Secrets
- `#[inline(never)]` on functions handling secrets (prevent inlining into caller's frame)
- `black_box()` barriers to prevent compiler from optimizing away zeroize calls
- Explicit `zeroize()` calls on stack variables holding secrets

## Common Pitfalls
- `String::from()` copying passphrases into non-zeroizing memory
- `Vec<u8>` intermediate buffers holding plaintext before encryption
- `Debug` derive on types containing secrets (use `secrecy::DebugSecret`)
- `Clone` on key types creating untracked copies
- `mem::forget` preventing Drop (and therefore ZeroizeOnDrop)

## Verification
- Unit tests that check memory after zeroize
- `cargo-valgrind` to detect uninitialized reads
- MSAN in CI for every crypto test
