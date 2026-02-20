---
description: Prepare a Tallow release with full security verification
---

Prepare for a Tallow release:

1. **Dependency audit**:
   - `cargo audit` — check for CVEs
   - `cargo deny check` — licenses, advisories, duplicates, sources
   - Review any new dependencies added since last release

2. **Code quality**:
   - `cargo clippy --workspace -- -D warnings`
   - `cargo fmt --check`
   - `cargo test --workspace`

3. **Security verification**:
   - Run /security-check command
   - Verify all unsafe blocks have SAFETY comments
   - Verify all key types derive Zeroize
   - Check for any .unwrap() in non-test code

4. **Documentation**:
   - Verify docs/architecture.md is current
   - Verify docs/threat-model.md is current
   - Check CHANGELOG entries

5. **Build verification**:
   - `cargo build --release --workspace`
   - Verify binary size is reasonable
   - Test on clean environment if possible

6. Produce release readiness report with go/no-go recommendation
