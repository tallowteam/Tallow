---
description: Run targeted test suite with security verification
---

Run the Tallow test suite:

1. Determine scope from context (specific crate or full workspace)
2. Run targeted tests:
   - `cargo test -p <crate>` for specific crate
   - `cargo test --workspace` for full suite
3. If crypto code changed, verify:
   - Roundtrip tests pass (encrypt → decrypt == original)
   - Wrong-key tests fail correctly
   - Tampered-ciphertext tests fail correctly
   - Nonce uniqueness tests pass
4. Run `cargo clippy --workspace -- -D warnings`
5. Report any failures with file:line and suggested fixes
