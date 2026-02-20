---
name: tallow-conventions
description: >
  Commit style, PR conventions, naming, and workflow for Tallow. Auto-invoke
  when creating commits, PRs, naming modules, or following project conventions.
allowed-tools: Read, Grep, Glob
---

# Tallow Conventions

## Commit Style
Conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `security:` — Security-related change
- `refactor:` — Code restructuring
- `docs:` — Documentation only
- `test:` — Adding/updating tests
- `chore:` — Maintenance (deps, CI, etc.)

## Branch Naming
Feature branches off `main`:
- `feat/description`
- `fix/description`
- `security/description`
- `refactor/description`

## PR Conventions
- No direct commits to `main`
- Squash merge to main
- Security review required for any changes touching `crates/tallow-crypto/`
- All PRs must pass CI (clippy, tests, fmt)

## Naming Conventions
- Crate names: `tallow-<domain>` (e.g., tallow-crypto, tallow-net)
- Module files: `snake_case.rs`
- Types: `PascalCase`
- Functions: `snake_case`
- Constants: `SCREAMING_SNAKE_CASE`
- Error types: `<Crate>Error` (e.g., `CryptoError`, `NetError`)

## File Organization
- One module per file (no multi-thousand-line files)
- `mod.rs` for re-exports only
- `error.rs` at crate root for crate-level error types
- `lib.rs` for public API surface
