---
description: Run comprehensive security audit pipeline on the Tallow codebase. Checks dependencies, code quality, unsafe usage, crypto patterns, and key material handling.
---

Execute the Tallow security audit pipeline:

1. Run the rust-security-audit skill's full pipeline:
   - `cargo audit` for CVE scanning
   - `cargo deny check` for license/advisory/source verification
   - `cargo clippy --all-targets -- -D warnings` for static analysis

2. Manual crypto checks:
   - Search crates/tallow-crypto/ for non-constant-time comparisons (`==` on secrets)
   - Verify all key types derive Zeroize
   - Check AES-GCM nonce management for uniqueness guarantees
   - Verify HKDF info strings include domain separators
   - Confirm both ML-KEM and X25519 shared secrets feed into the combiner

3. Information leakage check:
   - Grep error messages for potential secret content
   - Verify Debug impls on sensitive types use SecretBox (prints [REDACTED])
   - Check that tracing/logging never includes key material

4. Unsafe audit:
   - Find all unsafe blocks
   - Verify each has a // SAFETY: comment
   - Assess whether the unsafe is truly necessary

Present a structured security report with CRITICAL/HIGH/MEDIUM/LOW/INFO findings.
