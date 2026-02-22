# Contributing to Tallow

Thank you for your interest in contributing to Tallow! This guide will help you get started.

## Development Setup

### Prerequisites

- **Rust**: stable toolchain (1.80+) via [rustup](https://rustup.rs)
- **Git**: for version control
- **C compiler**: required by some crypto dependencies (MSVC on Windows, gcc/clang on Unix)

### Building

```bash
cargo build --workspace
```

### Running Tests

```bash
# All tests
cargo test --workspace

# Single crate
cargo test -p tallow-crypto

# Single test (fastest iteration)
cargo test test_name
```

### Linting

```bash
cargo clippy --workspace -- -D warnings
cargo fmt --check
```

## Code Style

### Rust Conventions

- `Result<T, E>` everywhere. No `.unwrap()` outside `#[cfg(test)]`.
- `thiserror` for library error types. `anyhow` only in the main binary.
- `#![forbid(unsafe_code)]` in all crates except where explicitly required.
- All `unsafe` blocks require a `// SAFETY:` comment.
- No `println!` — use `tracing::{info, warn, error, debug, trace}`.
- All public items get `///` doc comments.

### Security Rules

These are non-negotiable:

- **Never** commit secrets, keys, `.env` files, or credentials
- **Never** use `unsafe` without a documented SAFETY justification
- **Never** use non-constant-time comparisons on secrets (use `subtle` crate)
- **Never** reuse AES-GCM nonces under the same key
- All key material must be zeroized on drop via `zeroize` crate
- All crypto errors must not leak timing information or secret data

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add new feature
fix: fix a bug
security: security-related change
refactor: code restructuring
docs: documentation only
test: test additions/changes
chore: maintenance tasks
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full crate dependency graph.

```
crates/
  tallow-crypto/    - All cryptographic operations (ZERO I/O)
  tallow-net/       - Transport, NAT traversal, relay client
  tallow-protocol/  - Wire protocol, file transfer
  tallow-store/     - Config, identity, trust, contacts
  tallow-relay/     - Self-hostable relay server
  tallow-tui/       - Terminal UI engine
  tallow/           - Main binary: CLI commands, sandbox
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `feat/your-feature` or `fix/your-bug`
3. Make your changes with tests
4. Ensure `cargo test --workspace`, `cargo clippy`, and `cargo fmt --check` all pass
5. Submit a pull request

### PR Checklist

- [ ] Tests pass (`cargo test --workspace`)
- [ ] Clippy clean (`cargo clippy --workspace -- -D warnings`)
- [ ] Formatted (`cargo fmt --check`)
- [ ] No new `.unwrap()` outside tests
- [ ] Security-sensitive changes reviewed for timing leaks and memory safety
- [ ] Public APIs have doc comments

## Reporting Issues

- **Bugs**: Use the [bug report template](https://github.com/tallowteam/Tallow/issues/new?template=bug_report.md)
- **Features**: Use the [feature request template](https://github.com/tallowteam/Tallow/issues/new?template=feature_request.md)
- **Security**: See [SECURITY.md](SECURITY.md) — do NOT open public issues

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0](LICENSE).
