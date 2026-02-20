---
description: Security-focused code review of recent changes
---

Review the most recent code changes with security focus:

1. Run `git diff HEAD~1` (or `git diff main` if on a feature branch)
2. For each changed file, check:
   - New unsafe blocks → verify SAFETY comment
   - New error types → verify no secret leakage in messages
   - Crypto code changes → invoke the crypto-review skill's checklist
   - New dependencies → check with cargo audit
   - New public APIs → verify doc comments exist
3. Run `cargo clippy --workspace -- -D warnings`
4. Run `cargo test --workspace` for affected modules
5. Summarize findings with actionable recommendations
