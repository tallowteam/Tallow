# Tallow — Complete Claude Code Configuration

## Architecture Philosophy

This configuration treats Claude Code as an interconnected expert system for security-critical Rust development. Every component — skills, agents, commands, hooks, and the root CLAUDE.md — forms a layered knowledge architecture where:

- **CLAUDE.md** sets the universal context (loaded every session, ~50 instructions max to stay within the ~150-200 instruction budget after Claude Code's system prompt)
- **Skills** provide deep domain knowledge Claude loads on demand via progressive disclosure (SKILL.md → references/ → scripts/)
- **Agents** are isolated specialists with their own context windows for complex delegated tasks
- **Commands** are deterministic, user-triggered multi-step workflows
- **Hooks** enforce non-negotiable rules deterministically (they always run, unlike CLAUDE.md which is LLM-interpreted and can be ignored)
- **settings.json** defines permissions and hook wiring — the security boundary

The key insight from Anthropic's own documentation and the HumanLayer research: Claude can reliably follow approximately 150-200 instructions total. Claude Code's system prompt already consumes around 50. That leaves ~100-150 for your entire configuration. Progressive disclosure — revealing information only when needed — is the single most important design pattern for skills and references.

---

## Complete Directory Structure

```
tallow/
│
├── CLAUDE.md                                    # ROOT CONTEXT — loaded every session
│
├── .claude/
│   ├── settings.json                            # Permissions, hooks, MCP servers
│   ├── settings.local.json                      # Personal overrides (gitignored)
│   │
│   ├── skills/                                  # MODEL-INVOKED domain knowledge
│   │   │
│   │   ├── rust-security-audit/                 # Supply chain + code safety
│   │   │   ├── SKILL.md                         # Audit workflow and checklist
│   │   │   └── scripts/
│   │   │       ├── run_full_audit.sh            # cargo audit + deny + clippy pipeline
│   │   │       └── find_unsafe_blocks.sh        # Locate and report unsafe usage
│   │   │
│   │   ├── crypto-review/                       # Post-quantum cryptographic patterns
│   │   │   ├── SKILL.md                         # Review methodology
│   │   │   └── references/
│   │   │       ├── ml-kem-1024.md               # FIPS 203 implementation patterns
│   │   │       ├── x25519-key-exchange.md       # RFC 7748 usage and pitfalls
│   │   │       ├── aes-256-gcm.md               # Nonce management, key lifecycle
│   │   │       ├── hkdf-sha256.md               # Derivation context and domain separation
│   │   │       └── hybrid-kem-combiner.md       # ML-KEM + X25519 combination protocol
│   │   │
│   │   ├── tallow-architecture/                 # System design and module relationships
│   │   │   ├── SKILL.md                         # Module map, data flow, boundaries
│   │   │   └── references/
│   │   │       ├── relay-protocol.md            # Wire format, message types, state machine
│   │   │       ├── tor-socks5-integration.md    # SOCKS5 proxy wrapping strategy
│   │   │       └── threat-model.md              # Assets, boundaries, attack surfaces
│   │   │
│   │   ├── rust-patterns/                       # Idiomatic Rust for security-critical code
│   │   │   ├── SKILL.md                         # Error handling, async, memory
│   │   │   └── references/
│   │   │       ├── error-hierarchy.md           # thiserror/anyhow patterns
│   │   │       ├── async-tokio.md               # Cancellation safety, spawn_blocking
│   │   │       ├── secret-memory.md             # zeroize, secrecy crate patterns
│   │   │       └── testing-crypto.md            # proptest, cargo-fuzz, round-trip tests
│   │   │
│   │   ├── cost-engineering/                    # Budget constraints and infra decisions
│   │   │   └── SKILL.md
│   │   │
│   │   └── tallow-conventions/                  # Commit style, PR, naming
│   │       └── SKILL.md
│   │
│   ├── agents/                                  # SPECIALIZED SUBAGENTS
│   │   ├── security-reviewer.md                 # Threat modeling, vuln assessment
│   │   ├── crypto-auditor.md                    # Cryptographic correctness
│   │   ├── architect.md                         # System design, complexity tradeoffs
│   │   ├── rust-engineer.md                     # Implementation, idiomatic code
│   │   ├── test-engineer.md                     # Testing strategy, fuzzing, coverage
│   │   └── docs-writer.md                       # Protocol specs, API docs
│   │
│   ├── commands/                                # USER-INVOKED slash commands
│   │   ├── security-check.md                    # /security-check
│   │   ├── review.md                            # /review
│   │   ├── plan.md                              # /plan
│   │   ├── threat-model.md                      # /threat-model
│   │   ├── test.md                              # /test
│   │   └── release-prep.md                      # /release-prep
│   │
│   └── hooks/                                   # Scripts for settings.json hooks
│       ├── block-main-push.sh
│       ├── post-edit-lint.sh
│       └── block-secret-access.sh
│
├── docs/                                        # Deep reference docs (progressive disclosure)
│   ├── architecture.md
│   ├── protocol-spec.md
│   ├── threat-model.md
│   ├── crypto-decisions.md
│   └── roadmap.md
│
└── src/
    └── CLAUDE.md                                # Optional: src-specific coding context
```

---

## 1. CLAUDE.md — Root Project Context

**Purpose**: Onboard Claude into your codebase every session. Covers WHAT (stack, structure), WHY (purpose, principles), and HOW (commands, conventions). Must be concise — every instruction competes for attention.

**Critical constraints**: Keep under 100 instructions. Use `@` references for progressive disclosure to deeper docs. Don't inline what can be pointed to.

```markdown
# Tallow

Secure file transfer CLI built in Rust. End-to-end encrypted transfers via a single untrusted relay server, with optional Tor anonymity layer (SOCKS5 proxy).

## Purpose
Enable encrypted file transfers between two parties where the relay never sees plaintext. Post-quantum cryptography ensures forward secrecy against future quantum attacks.

## Stack
- **Language**: Rust (stable toolchain, 2021 edition)
- **Crypto**: ML-KEM-1024 (FIPS 203) + X25519 (RFC 7748) hybrid KEM, AES-256-GCM (96-bit nonce), HKDF-SHA256 (RFC 5869)
- **Async runtime**: tokio (multi-thread)
- **CLI framework**: clap v4 (derive API)
- **CLI output**: colored crate (purple #8B5CF6 accent), indicatif progress bars. No TUI, no interactive panels.
- **Logging**: tracing crate with structured output
- **Infra**: Oracle Cloud free tier (2 AMD VMs, 1/8 OCPU, 1GB RAM each)

## Key Crates
- `ml-kem` or `fips203` — ML-KEM-1024 post-quantum KEM
- `x25519-dalek` — X25519 Diffie-Hellman
- `aes-gcm` — AES-256-GCM authenticated encryption (RustCrypto)
- `hkdf` + `sha2` — HKDF-SHA256 key derivation
- `zeroize` — Secure memory wiping for key material
- `secrecy` — SecretBox wrapper preventing accidental exposure
- `tokio` — Async runtime
- `clap` — CLI argument parsing
- `indicatif` — Progress bars
- `colored` — Terminal colors
- `tracing` + `tracing-subscriber` — Structured logging
- `thiserror` — Typed error enums
- `anyhow` — Top-level error handling (binary crate only)
- `proptest` — Property-based testing
- `subtle` — Constant-time operations

## Commands
- `cargo build` — Debug build
- `cargo build --release` — Release build (enable overflow checks, see Cargo.toml)
- `cargo test` — All tests
- `cargo test <name>` — Single test (prefer this for speed)
- `cargo clippy --all-targets -- -D warnings` — Lint (warnings = errors)
- `cargo fmt --check` — Format verification
- `cargo audit` — CVE scan via RustSec advisory database
- `cargo deny check` — License + advisory + duplicate checks
- `cargo fuzz run <target>` — Fuzz testing (requires nightly)

## Module Architecture
- `src/crypto/` — All cryptographic operations. ZERO I/O dependencies. Pure functions.
  - `kem.rs` — Hybrid ML-KEM-1024 + X25519 key encapsulation
  - `aead.rs` — AES-256-GCM encrypt/decrypt with nonce management
  - `kdf.rs` — HKDF-SHA256 key derivation with domain separation
  - `types.rs` — Key types, all deriving Zeroize
- `src/relay/` — Relay server client protocol. Knows nothing about files.
- `src/tor/` — SOCKS5 proxy connector. Wraps relay connections transparently.
- `src/transfer/` — Orchestration: chunk → encrypt → relay → reassemble → decrypt
- `src/cli/` — Argument parsing and colored output. No business logic.
- `src/error/` — Unified error hierarchy via thiserror
- See @docs/architecture.md for full design
- See @docs/protocol-spec.md for wire format
- See @docs/threat-model.md for trust boundaries

## Code Rules
- `Result<T, E>` everywhere. No `.unwrap()` outside `#[cfg(test)]`.
- `thiserror` for library errors with per-module error enums. `anyhow` only in `src/main.rs`.
- All `unsafe` blocks require `// SAFETY:` comment explaining the invariant being upheld.
- All key material types must derive/impl `Zeroize` and be wrapped in `secrecy::SecretBox` where possible.
- Use `subtle::ConstantTimeEq` for all secret-dependent comparisons — never `==` on key material.
- Prefer `&[u8]` inputs over `Vec<u8>` for crypto functions. Return owned types.
- No `println!` — use `tracing::{info, warn, error, debug, trace}`.
- All public items get `///` doc comments.
- Integer overflow checks enabled in release builds (see `Cargo.toml` `[profile.release]`).

## Security Rules — NON-NEGOTIABLE
- NEVER commit secrets, keys, .env files, or credentials
- NEVER use `unsafe` without documented SAFETY justification
- NEVER skip `cargo audit` + `cargo deny` before releases
- NEVER downgrade crypto algorithms without documented rationale in docs/crypto-decisions.md
- NEVER use non-constant-time comparisons on secrets (use `subtle` crate)
- NEVER return decrypted plaintext before verifying the AES-GCM authentication tag
- NEVER reuse AES-GCM nonces under the same key
- ALL key material must be zeroized on drop via `zeroize` crate
- ALL crypto errors must not leak timing information or secret data in messages

## Git Workflow
- Feature branches off `main`: `feat/`, `fix/`, `security/`, `refactor/`
- Conventional commits: `feat:`, `fix:`, `security:`, `refactor:`, `docs:`, `test:`, `chore:`
- No direct commits to `main`
- Squash merge to main

## Testing
- Unit tests: `#[cfg(test)]` module in same file as implementation
- Integration tests: `tests/` directory
- Property tests: `proptest` for crypto round-trip invariants
- Fuzz targets: `fuzz/` directory for protocol parsing and crypto inputs
- Prefer `cargo test <specific_test>` over full suite for speed

## Design Principles
- Security-maximalist defaults with layered protections
- Minimal budget — security from disciplined engineering, not expensive tooling
- Favor simplicity over unnecessary complexity (single-relay + Tor over custom onion routing)
- Defense-in-depth: security at every layer
- Be honest about complexity vs value tradeoffs — if it's not worth building, say so
- See @docs/crypto-decisions.md for algorithm selection rationale
```

---

## 2. .claude/settings.json — Permissions and Hooks

**Purpose**: Defines the security boundary. Permissions control what tools Claude can use. Hooks run deterministically on events — they cannot be ignored like CLAUDE.md instructions.

**Key insight from research**: CLAUDE.md saying "don't edit .env" is a suggestion the LLM weighs against other context. A PreToolUse hook blocking .env access returns exit code 2 and the operation is blocked, period. Use hooks for enforcement, CLAUDE.md for guidance.

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(cargo build*)",
      "Bash(cargo test*)",
      "Bash(cargo clippy*)",
      "Bash(cargo fmt*)",
      "Bash(cargo audit*)",
      "Bash(cargo deny*)",
      "Bash(cargo doc*)",
      "Bash(cargo fuzz*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git status*)",
      "Bash(git branch*)",
      "Bash(git checkout*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(find *)",
      "Bash(wc *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(grep *)",
      "Bash(mkdir *)",
      "Bash(echo *)",
      "Bash(rustup *)"
    ],
    "deny": [
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(git push*)",
      "Read(.env*)",
      "Read(**/secrets/**)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(**/*secret*)",
      "Read(**/credentials*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/block-main-push.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/block-secret-access.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-edit-lint.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[$(date -Iseconds)] session_end\" >> .claude/activity.log"
          }
        ]
      }
    ]
  }
}
```

### Hook Scripts

#### `.claude/hooks/block-main-push.sh`
```bash
#!/bin/bash
# Block edits when on the main branch
BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo '{"block": true, "reason": "Cannot edit files on main branch. Create a feature branch: git checkout -b feat/your-feature"}' >&2
  exit 2
fi
exit 0
```

#### `.claude/hooks/post-edit-lint.sh`
```bash
#!/bin/bash
# Auto-run clippy on Rust file edits
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
if [[ "$FILE" == *.rs ]]; then
  cargo clippy --quiet --message-format=short 2>&1 | head -20
fi
exit 0
```

#### `.claude/hooks/block-secret-access.sh`
```bash
#!/bin/bash
# Block reads of sensitive files
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
case "$FILE" in
  *.env*|*secret*|*.pem|*.key|*credential*)
    echo '{"block": true, "reason": "Access to secrets/credentials is blocked by security policy."}' >&2
    exit 2
    ;;
esac
exit 0
```

---

## 3. Skills — Deep Domain Knowledge

### 3a. `.claude/skills/rust-security-audit/SKILL.md`

**What this is**: A comprehensive Rust security auditing workflow. Claude auto-invokes this when tasks involve security review, dependency auditing, or pre-release checks.

**Research basis**: RustSec advisory database patterns, cargo-audit and cargo-deny tool capabilities, common Rust security pitfalls documented by the Rust Foundation and Trail of Bits.

```markdown
---
name: rust-security-audit
description: >
  Comprehensive Rust security auditing for Tallow. Auto-invoke when the task
  involves: security review, vulnerability scanning, dependency auditing,
  unsafe code review, pre-release security checks, supply chain verification,
  CVE scanning, RUSTSEC advisories, code safety assessment, or preparing
  for security-sensitive releases. Also use when the user says "audit",
  "check security", "is this safe", or "review for vulnerabilities".
allowed-tools: Read, Grep, Glob, Bash(cargo audit*), Bash(cargo deny*), Bash(cargo clippy*), Bash(grep *), Bash(find *)
---

# Rust Security Audit Skill

## Audit Pipeline

Execute these steps in order. Each step builds on the previous.

### Step 1: Dependency Vulnerability Scan
```bash
# Scan Cargo.lock against RustSec advisory database
cargo audit

# If JSON output needed for parsing:
cargo audit --json
```

**What to look for**:
- Any RUSTSEC advisory = immediate attention
- Yanked crate versions = upgrade immediately
- Unmaintained crates = assess risk and plan migration

### Step 2: License and Advisory Deep Check
```bash
# Comprehensive dependency policy check
cargo deny check

# Or check specific categories:
cargo deny check advisories    # Security advisories
cargo deny check licenses      # License compliance
cargo deny check bans          # Banned crate versions
cargo deny check sources       # Download source verification
```

**What to look for**:
- Copyleft licenses in dependency tree that conflict with project licensing
- Duplicate crate versions (attack surface multiplication)
- Crates downloaded from non-crates.io sources

### Step 3: Static Analysis
```bash
# Clippy with all warnings as errors
cargo clippy --all-targets -- -D warnings

# Specific security-relevant lint groups:
cargo clippy -- -W clippy::pedantic -W clippy::nursery
```

**Security-relevant clippy lints to watch for**:
- `clippy::unwrap_used` — panics in non-test code
- `clippy::expect_used` — panics with messages that might leak info
- `clippy::indexing_slicing` — potential out-of-bounds
- `clippy::integer_arithmetic` — overflow without checked ops
- `clippy::mem_forget` — prevents Drop (and therefore Zeroize)

### Step 4: Unsafe Code Audit
```bash
# Find all unsafe blocks
grep -rn "unsafe" src/ --include="*.rs"

# Find unsafe without SAFETY comments
grep -rn "unsafe" src/ --include="*.rs" | grep -v "// SAFETY:"
```

**For each unsafe block, verify**:
1. A `// SAFETY:` comment exists directly above explaining the invariant
2. The invariant is actually upheld by the surrounding code
3. The unsafe is truly necessary — could safe Rust achieve the same?
4. No undefined behavior can occur under any input

### Step 5: Cryptographic Safety Checks
```bash
# Verify zeroize is derived on all key types
grep -rn "struct.*Key\|struct.*Secret\|struct.*Nonce" src/ --include="*.rs"
# Then verify each has: #[derive(..., Zeroize, ZeroizeOnDrop)]

# Check for non-constant-time comparisons on secrets
grep -rn "== \|!= " src/crypto/ --include="*.rs" | grep -v "test" | grep -v "SAFETY"
# Flag any == on key/secret types — should use subtle::ConstantTimeEq

# Check for unwrap in crypto paths
grep -rn "\.unwrap()\|\.expect(" src/crypto/ --include="*.rs" | grep -v "#\[cfg(test)\]"

# Verify nonce generation
grep -rn "Nonce\|nonce" src/crypto/ --include="*.rs"
```

### Step 6: Information Leakage Check
```bash
# Check error messages for potential secret leakage
grep -rn "format!\|println!\|eprintln!\|tracing::" src/ --include="*.rs" | grep -i "key\|secret\|password\|token"

# Check Debug impls on sensitive types
grep -rn "#\[derive.*Debug" src/crypto/ --include="*.rs"
# Sensitive types should use secrecy::DebugSecret (prints [REDACTED])
```

### Step 7: Integer Overflow Protection
Verify `Cargo.toml` has overflow checks in release:
```toml
[profile.release]
overflow-checks = true
```
This prevents silent wraparound bugs that could lead to buffer size miscalculations — a known class of vulnerability in Rust release builds.

## Output Format

Present findings as a prioritized security report:

| Priority | Category | Description |
|----------|----------|-------------|
| **CRITICAL** | Must fix before any release | Active CVEs, unsafe without justification, secret leakage |
| **HIGH** | Fix before v1.0 | Missing zeroize, non-constant-time comparisons, unwrap in crypto |
| **MEDIUM** | Fix soon | Clippy warnings, unmaintained deps, missing overflow checks |
| **LOW** | Track | Style issues, documentation gaps |
| **INFO** | Note | Observations, recommendations for future improvement |

For each finding: file path, line number, issue description, specific fix recommendation.
```

#### `.claude/skills/rust-security-audit/scripts/run_full_audit.sh`
```bash
#!/bin/bash
set -euo pipefail
echo "=== Tallow Security Audit Pipeline ==="
echo ""
echo "--- Step 1: Dependency CVE Scan (cargo audit) ---"
cargo audit 2>&1 || true
echo ""
echo "--- Step 2: Policy Check (cargo deny) ---"
cargo deny check 2>&1 || true
echo ""
echo "--- Step 3: Static Analysis (clippy) ---"
cargo clippy --all-targets -- -D warnings 2>&1 || true
echo ""
echo "--- Step 4: Unsafe Block Report ---"
echo "Total unsafe blocks:"
grep -rn "unsafe" src/ --include="*.rs" | wc -l
echo "Unsafe without SAFETY comment:"
grep -rn "unsafe" src/ --include="*.rs" | grep -v "// SAFETY:" | grep -v "#\[cfg(test)\]" || echo "  None found (good)"
echo ""
echo "--- Step 5: Unwrap in Non-Test Code ---"
grep -rn "\.unwrap()\|\.expect(" src/ --include="*.rs" | grep -v "#\[cfg(test)\]" | grep -v "test" || echo "  None found (good)"
echo ""
echo "=== Audit Complete ==="
```

#### `.claude/skills/rust-security-audit/scripts/find_unsafe_blocks.sh`
```bash
#!/bin/bash
# Detailed unsafe block report with context
echo "=== Unsafe Block Audit ==="
grep -rn "unsafe" src/ --include="*.rs" | while IFS=: read -r file line content; do
    echo ""
    echo "File: $file:$line"
    echo "Code: $content"
    # Check for SAFETY comment on the line above
    prev_line=$((line - 1))
    safety=$(sed -n "${prev_line}p" "$file" 2>/dev/null)
    if echo "$safety" | grep -q "// SAFETY:"; then
        echo "SAFETY comment: YES"
        echo "  $safety"
    else
        echo "SAFETY comment: MISSING ⚠️"
    fi
done
```

---

### 3b. `.claude/skills/crypto-review/SKILL.md`

**What this is**: Deep knowledge of Tallow's specific cryptographic stack. Claude auto-invokes when working on any crypto-related code.

**Research basis**: FIPS 203 (ML-KEM), RFC 7748 (X25519), NIST SP 800-38D (AES-GCM), RFC 5869 (HKDF), IETF draft-ietf-lamps-pq-composite-kem (hybrid KEM combiners), RustCrypto crate documentation.

```markdown
---
name: crypto-review
description: >
  Post-quantum cryptography implementation review for Tallow. Auto-invoke
  when working with: ML-KEM, FIPS 203, Kyber, X25519, Diffie-Hellman,
  AES-GCM, AES-256, AEAD, nonce, initialization vector, HKDF, key derivation,
  key exchange, key encapsulation, KEM, hybrid crypto, encryption, decryption,
  symmetric key, shared secret, post-quantum, lattice-based, session key,
  handshake, protocol, ciphertext, plaintext, authentication tag, or any
  code changes in src/crypto/.
allowed-tools: Read, Grep, Glob
---

# Cryptographic Review Skill

## Tallow's Crypto Architecture

```
Sender                          Relay (untrusted)               Receiver
  │                                │                              │
  ├─ Generate ephemeral keypair ───┤                              │
  │  (ML-KEM-1024 + X25519)       │                              │
  │                                │                              │
  ├─ Send encaps key ─────────────►├─────────────────────────────►│
  │                                │                              │
  │                                │◄─── Encapsulate (both KEMs) ─┤
  │◄──────────────────────────────┤◄─── Send ciphertexts ────────┤
  │                                │                              │
  ├─ Decapsulate both ────────────►│                              │
  ├─ Combine shared secrets ──────►│                              │
  ├─ HKDF derive session key ────►│                              │
  │                                │                              │
  ├─ AES-256-GCM encrypt chunks ─►├─────────────────────────────►│
  │                                │         ├─ Decrypt chunks ───┤
```

### Algorithm Stack

| Layer | Algorithm | Standard | Rust Crate | Key Size |
|-------|-----------|----------|------------|----------|
| PQ KEM | ML-KEM-1024 | FIPS 203 | `ml-kem` or `fips203` | Encaps: 1568B, Decaps: 3168B |
| Classical KEM | X25519 | RFC 7748 | `x25519-dalek` | 32B public, 32B private |
| KDF | HKDF-SHA256 | RFC 5869 | `hkdf` + `sha2` | Variable output |
| AEAD | AES-256-GCM | SP 800-38D | `aes-gcm` | 256-bit key, 96-bit nonce |

### Hybrid KEM Combiner

**Critical**: Both KEM shared secrets MUST be combined before deriving the session key. If either KEM is broken, the other still provides security. The combination MUST use a proper KDF with domain separation.

```
ml_kem_ss = ML-KEM-1024.Decaps(ml_kem_dk, ml_kem_ct)  // 32 bytes
x25519_ss = X25519(our_sk, their_pk)                    // 32 bytes

// Concatenate both shared secrets as IKM for HKDF
ikm = ml_kem_ss || x25519_ss                            // 64 bytes

// Domain-separated key derivation
session_key = HKDF-SHA256(
    salt = nil,                                          // or protocol-specific salt
    ikm  = ikm,
    info = b"tallow-v1-session-key",                     // DOMAIN SEPARATOR
    len  = 32                                            // 256-bit AES key
)
```

**Domain separation is critical**: The `info` parameter in HKDF MUST be unique per purpose. Without it, keys derived for different purposes could collide. Use distinct info strings for:
- Session encryption key: `b"tallow-v1-session-key"`
- File MAC key (if separate): `b"tallow-v1-file-mac"`
- Nonce derivation (if derived): `b"tallow-v1-nonce-base"`

### Review Checklist

When reviewing crypto code, check EVERY item:

**ML-KEM-1024**:
- [ ] Using ML-KEM-1024 (not 512 or 768) for highest security level
- [ ] Encapsulation key validated before use (FIPS 203 requires input validation)
- [ ] Decapsulation key stored in SecretBox and zeroized on drop
- [ ] Both keygen and encaps use a NIST-approved RNG (OsRng from rand crate)
- [ ] Shared secret (32 bytes) zeroized after being fed to HKDF

**X25519**:
- [ ] Using clamped scalar multiplication (x25519-dalek handles this)
- [ ] Checking for all-zero shared secret (indicates small-subgroup attack)
- [ ] Private key stored in SecretBox and zeroized on drop
- [ ] Public key validated (x25519-dalek handles contributory behavior)

**HKDF-SHA256**:
- [ ] Both shared secrets concatenated as IKM (not just one)
- [ ] `info` parameter contains protocol-specific domain separator
- [ ] Different `info` strings for different derived keys
- [ ] Output length matches the required key size (32 bytes for AES-256)
- [ ] Intermediate PRK value zeroized after key extraction

**AES-256-GCM**:
- [ ] 96-bit (12-byte) nonce — the standard and recommended size
- [ ] Nonces NEVER repeat under the same key (catastrophic if violated)
- [ ] Nonce strategy documented: counter-based (preferred for streaming) or random (only if fewer than 2^32 messages per key)
- [ ] Authentication tag verified BEFORE any plaintext is returned to caller
- [ ] Using full 128-bit (16-byte) authentication tag (default in aes-gcm crate)
- [ ] Maximum message size under 64GB per NIST SP 800-38D
- [ ] Key material in SecretBox, zeroized on drop

**General**:
- [ ] No timing side-channels: all secret-dependent operations use constant-time primitives
- [ ] Error messages don't leak information about secrets or internal state
- [ ] All intermediate cryptographic values (PRK, shared secrets, derived keys before use) are zeroized

### Anti-Patterns to Flag Immediately

| Anti-Pattern | Why It's Dangerous | Fix |
|-------------|-------------------|-----|
| `nonce = [0u8; 12]` (hardcoded nonce) | Nonce reuse under same key = complete GCM break | Use counter or `OsRng` |
| `if shared_secret == expected` (equality check) | Timing side-channel | Use `subtle::ConstantTimeEq` |
| `ml_kem_ss` used directly as AES key | Skips hybrid combination | Concatenate with x25519_ss, derive via HKDF |
| `println!("{:?}", key)` | Leaks key material to stdout | Use `secrecy::SecretBox` (Debug prints [REDACTED]) |
| Missing zeroize on key struct | Key material persists in memory | Derive `Zeroize` + `ZeroizeOnDrop` |
| `decrypt()` returns plaintext before auth check | Plaintext of unauthenticated ciphertext | aes-gcm crate handles this, but verify custom wrappers |
| Random nonce with >2^32 messages per key | Birthday bound collision probability | Switch to counter-based nonces |

### Reference Files

For deeper details on each algorithm, see:
- `references/ml-kem-1024.md` — FIPS 203 implementation specifics, keygen/encaps/decaps flow
- `references/x25519-key-exchange.md` — RFC 7748 patterns, contributory behavior, all-zero check
- `references/aes-256-gcm.md` — Nonce strategies, message limits, streaming encryption
- `references/hkdf-sha256.md` — Extract-then-expand, domain separation patterns, salt usage
- `references/hybrid-kem-combiner.md` — How to combine ML-KEM + X25519, IETF composite KEM draft alignment
```

---

### 3c. `.claude/skills/crypto-review/references/ml-kem-1024.md`

```markdown
# ML-KEM-1024 Implementation Reference

## Standard
FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard (August 2024)

## Overview
ML-KEM (formerly CRYSTALS-Kyber) is a post-quantum KEM based on the Module Learning With Errors (MLWE) problem. ML-KEM-1024 provides NIST Security Level 5 (equivalent to AES-256).

## Parameter Sizes
| Parameter | Size |
|-----------|------|
| Encapsulation key (public) | 1568 bytes |
| Decapsulation key (private) | 3168 bytes |
| Ciphertext | 1568 bytes |
| Shared secret | 32 bytes (256 bits, fixed for all ML-KEM levels) |

## Rust Implementation

### Recommended Crate: `ml-kem` (RustCrypto)
```toml
[dependencies]
ml-kem = { version = "0.2", features = ["std"] }
```

### Alternative: `fips203` (IntegrityChain/NCC Group)
```toml
[dependencies]
fips203 = { version = "0.4", features = ["ml-kem-1024", "default-rng"] }
```

### Keygen
```rust
use fips203::ml_kem_1024;
use fips203::traits::{KeyGen, SerDes};

let (ek, dk) = ml_kem_1024::KG::try_keygen()
    .map_err(|_| CryptoError::KeyGenFailed)?;

// Serialize for transmission
let ek_bytes = ek.into_bytes(); // 1568 bytes
// dk stays local, wrapped in SecretBox
```

### Encapsulation (Bob's side)
```rust
use fips203::traits::Encaps;

let ek = ml_kem_1024::EncapsKey::try_from_bytes(ek_bytes)
    .map_err(|_| CryptoError::InvalidEncapsKey)?;  // FIPS 203 input validation

let (ss, ct) = ek.try_encaps()
    .map_err(|_| CryptoError::EncapsFailed)?;

let ct_bytes = ct.into_bytes(); // 1568 bytes
// ss is 32-byte shared secret — zeroize after use
```

### Decapsulation (Alice's side)
```rust
use fips203::traits::Decaps;

let ct = ml_kem_1024::CipherText::try_from_bytes(ct_bytes)
    .map_err(|_| CryptoError::InvalidCiphertext)?;

let ss = dk.try_decaps(&ct)
    .map_err(|_| CryptoError::DecapsFailed)?;

// ss is 32-byte shared secret — zeroize after combining with X25519 secret
```

## Critical Implementation Notes

1. **Input validation**: FIPS 203 requires verifying that the encapsulation key decodes correctly from its byte array. The `try_from_bytes` methods handle this — always use `try_` variants, never `from_bytes` if it doesn't validate.

2. **RNG quality**: Keygen and encapsulation require cryptographically secure randomness. Use `OsRng` (via the `default-rng` feature or explicit `rand::rngs::OsRng`). Never use `thread_rng()` for key material.

3. **Fixed shared secret size**: ML-KEM produces a 256-bit (32-byte) shared secret at ALL security levels (512, 768, 1024). This simplifies the hybrid combiner since both ML-KEM-1024 and X25519 produce 32-byte outputs.

4. **Implicit rejection**: If decapsulation receives an invalid ciphertext, ML-KEM returns a pseudorandom shared secret (derived from the private key and ciphertext) rather than an error. This prevents chosen-ciphertext attacks. The protocol still won't work (keys won't match), but no information about the private key leaks.

5. **Side-channel considerations**: Both recommended Rust crates aim for constant-time implementation. Verify that your target platform doesn't have variable-time multiplication (relevant for non-x86 embedded targets).
```

---

### 3d. `.claude/skills/crypto-review/references/aes-256-gcm.md`

```markdown
# AES-256-GCM Implementation Reference

## Standard
NIST SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC

## Rust Crate: `aes-gcm` (RustCrypto)
```toml
[dependencies]
aes-gcm = "0.10"
```

The RustCrypto aes-gcm crate provides constant-time implementations using AES-NI hardware intrinsics on x86/x86_64, with a portable fallback. The portable fallback is only constant-time on processors with constant-time multiplication.

## Key Parameters
| Parameter | Value |
|-----------|-------|
| Key size | 256 bits (32 bytes) |
| Nonce size | 96 bits (12 bytes) — standard and recommended |
| Tag size | 128 bits (16 bytes) — full tag, do not truncate |
| Max plaintext per message | ~64 GB |
| Max messages per key (random nonce) | ~2^32 (birthday bound on 96-bit nonce) |

## Nonce Management — THE CRITICAL CONCERN

AES-GCM is catastrophically broken if a nonce repeats under the same key. A nonce collision allows an attacker to:
1. Recover the authentication key (GHASH key H)
2. Forge arbitrary ciphertexts
3. Decrypt messages

### Strategy 1: Counter-Based Nonces (Recommended for Tallow)
```rust
// 96-bit nonce = 8-byte counter + 4-byte random prefix
struct NonceGenerator {
    prefix: [u8; 4],  // Random per session
    counter: u64,      // Monotonically increasing
}

impl NonceGenerator {
    fn new() -> Self {
        let mut prefix = [0u8; 4];
        OsRng.fill_bytes(&mut prefix);
        Self { prefix, counter: 0 }
    }

    fn next(&mut self) -> Result<Nonce, CryptoError> {
        if self.counter == u64::MAX {
            return Err(CryptoError::NonceExhausted);
        }
        let mut nonce = [0u8; 12];
        nonce[..4].copy_from_slice(&self.prefix);
        nonce[4..].copy_from_slice(&self.counter.to_be_bytes());
        self.counter += 1;
        Ok(Nonce::from(nonce))
    }
}
```

**Why counter-based**: Guarantees uniqueness. With u64 counter, you can encrypt 2^64 messages per session — far more than you'll ever need. The random prefix differentiates sessions even if counter resets.

### Strategy 2: Random Nonces (Acceptable for low-volume)
```rust
let nonce = Aes256Gcm::generate_nonce(&mut OsRng); // 96 random bits
```

**Birthday bound**: With random 96-bit nonces, collision probability exceeds 2^-32 after ~2^32 messages. For Tallow's file transfer use case, this is likely fine (you won't encrypt billions of chunks under one session key). But counter-based is strictly safer.

## Encryption/Decryption Pattern
```rust
use aes_gcm::{Aes256Gcm, Nonce, Key, aead::{Aead, KeyInit}};

let key = Key::<Aes256Gcm>::from_slice(&session_key_bytes);
let cipher = Aes256Gcm::new(key);

// Encrypt
let nonce = nonce_gen.next()?;
let ciphertext = cipher.encrypt(&nonce, plaintext.as_ref())
    .map_err(|_| CryptoError::EncryptionFailed)?;
// ciphertext includes the 16-byte auth tag appended

// Decrypt — tag is verified BEFORE plaintext is returned
let plaintext = cipher.decrypt(&nonce, ciphertext.as_ref())
    .map_err(|_| CryptoError::DecryptionFailed)?;
// If tag verification fails, Err is returned — no plaintext leaks
```

## Critical Notes

1. **Tag verification is automatic**: The `aes-gcm` crate verifies the authentication tag during `decrypt()` and returns `Err` if it fails. Plaintext is never returned for unauthenticated ciphertext. Do NOT build custom wrappers that break this property.

2. **Associated data (AAD)**: AES-GCM supports authenticating additional data that isn't encrypted. For Tallow, consider including the chunk index and file metadata as AAD to bind ciphertext to its intended position:
   ```rust
   let aad = format!("chunk:{}", chunk_index);
   cipher.encrypt(&nonce, Payload { msg: plaintext, aad: aad.as_bytes() })?;
   ```

3. **Key zeroization**: The `Key` type from aes-gcm does not auto-zeroize. Wrap the raw key bytes in `secrecy::SecretBox<[u8; 32]>` and zeroize after creating the cipher instance, or keep the cipher alive for the session duration and zeroize the source key material.

4. **In-place operation**: For large files, use `encrypt_in_place` / `decrypt_in_place` to avoid allocating a separate buffer:
   ```rust
   use aes_gcm::aead::AeadInPlace;
   cipher.encrypt_in_place(&nonce, b"", &mut buffer)?;
   ```
```

---

### 3e. `.claude/skills/crypto-review/references/hkdf-sha256.md`

```markdown
# HKDF-SHA256 Implementation Reference

## Standard
RFC 5869: HMAC-based Extract-and-Expand Key Derivation Function (HKDF)

## Rust Crate
```toml
[dependencies]
hkdf = "0.12"
sha2 = "0.10"
```

## Two-Phase Operation

HKDF has two phases:
1. **Extract**: Takes input keying material (IKM) and an optional salt, produces a pseudorandom key (PRK)
2. **Expand**: Takes PRK and context info, produces output keying material (OKM)

```rust
use hkdf::Hkdf;
use sha2::Sha256;

// Combined extract-and-expand
let hk = Hkdf::<Sha256>::new(
    None,   // salt: None = all-zero salt of HashLen bytes
    &ikm    // input keying material: ml_kem_ss || x25519_ss
);

let mut session_key = [0u8; 32];
hk.expand(
    b"tallow-v1-session-key",  // info: domain separator
    &mut session_key
).map_err(|_| CryptoError::KeyDerivationFailed)?;

// Use session_key for AES-256-GCM
// Then zeroize: session_key.zeroize() when done
```

## Domain Separation

The `info` parameter provides domain separation — ensuring keys derived for different purposes never collide even from the same IKM.

**Tallow's domain separator scheme**:
```
info = b"tallow-v1-<purpose>"
```

| Purpose | Info String | Output Length |
|---------|------------|--------------|
| Session encryption key | `b"tallow-v1-session-key"` | 32 bytes |
| Chunk MAC key (if separate) | `b"tallow-v1-chunk-mac"` | 32 bytes |
| Nonce prefix derivation | `b"tallow-v1-nonce-prefix"` | 4 bytes |

The `v1` version tag ensures future protocol versions produce different keys even with identical IKM.

## Salt Usage

Per RFC 5869: salt is optional but "the use of salt adds significantly to the strength of HKDF." For Tallow:
- **Option A (simpler)**: No salt (use `None`). The default is an all-zero salt of HashLen (32) bytes. This is acceptable when IKM has high entropy (which it does — concatenation of two 32-byte KEM outputs).
- **Option B (stronger)**: Use a random per-session salt transmitted alongside the KEM ciphertexts. This provides extraction-independence even if IKM has structural biases.

## Critical Notes

1. **Zeroize the PRK**: The intermediate PRK is just as sensitive as the final keys. If using the two-phase API separately, zeroize PRK after expansion.

2. **Output length limits**: HKDF-SHA256 can produce at most 255 × 32 = 8160 bytes of output. More than enough for Tallow's needs.

3. **IKM ordering**: When concatenating `ml_kem_ss || x25519_ss`, be consistent. Document the order and never swap it — this is part of the protocol specification.

4. **SHA2 vs SHA3 note**: The IETF composite ML-KEM draft recommends SHA3 for ML-KEM-1024 + X25519 combinations (matching X-Wing). Tallow uses HKDF-SHA256 for broader compatibility and because SHA2 wrapped in HKDF is cryptographically sound. Document this choice in docs/crypto-decisions.md.
```

---

### 3f. `.claude/skills/crypto-review/references/hybrid-kem-combiner.md`

```markdown
# Hybrid KEM Combiner Reference

## Why Hybrid

ML-KEM-1024 is believed secure against quantum computers. X25519 is well-studied against classical computers. By combining both:
- If ML-KEM has a catastrophic bug → X25519 still protects
- If quantum computers break X25519 → ML-KEM still protects
- The combination is at least as strong as the stronger component

This is the defense-in-depth principle applied to key exchange.

## Tallow's Combiner Construction

```
ss_combined = HKDF-SHA256(
    salt = None,
    ikm  = ml_kem_ss || x25519_ss,     // 64 bytes total
    info = b"tallow-v1-session-key",
    len  = 32
)
```

### Why This Works

The IETF composite ML-KEM draft (draft-ietf-lamps-pq-composite-kem) defines the pattern:
```
ss = KDF(counter || k_1 || k_2 || fixedInfo, outputBits)
```

Tallow simplifies this because:
1. We only have two components (not N)
2. HKDF's extract phase already handles the concatenation securely
3. The `info` parameter provides the fixedInfo/domain separator role

### Security Argument

For the combiner to fail, an attacker must:
1. Break ML-KEM-1024 to recover `ml_kem_ss`, AND
2. Break X25519 to recover `x25519_ss`, AND
3. Break HKDF-SHA256

Any one of these being secure is sufficient.

## Implementation Requirements

1. **Both KEMs must be executed**: Never skip either KEM. Even if one seems "redundant," removing it eliminates the security guarantee.

2. **Concatenation order is fixed**: `ml_kem_ss || x25519_ss`. This is part of the protocol spec. Swapping them produces a different key.

3. **Both ciphertexts transmitted**: The receiver needs both the ML-KEM ciphertext and the X25519 public key (acting as the "ciphertext" in the DH KEM) to derive the same shared secret.

4. **Ephemeral keys**: Both ML-KEM and X25519 keypairs should be ephemeral (generated per transfer session). This provides forward secrecy — compromising long-term keys doesn't reveal past session keys.

5. **All-zero check on X25519**: After computing the X25519 shared secret, verify it's not all zeros (which would indicate a small-subgroup attack):
   ```rust
   if x25519_ss.ct_eq(&[0u8; 32]).into() {
       return Err(CryptoError::InvalidSharedSecret);
   }
   ```
```

---

### 3g. `.claude/skills/rust-patterns/SKILL.md` (abbreviated for space)

```markdown
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
- **Library code** (`src/crypto/`, `src/relay/`, etc.): `thiserror` with per-module error enums
- **Binary entry** (`src/main.rs`): `anyhow` for ergonomic top-level handling

```rust
// src/crypto/error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("key generation failed")]
    KeyGenFailed,

    #[error("encapsulation failed")]
    EncapsFailed,

    #[error("decapsulation failed")]
    DecapsFailed,

    #[error("encryption failed")]
    EncryptionFailed,

    #[error("decryption failed: authentication tag mismatch")]
    DecryptionFailed,

    #[error("key derivation failed")]
    KeyDerivationFailed,

    #[error("invalid shared secret")]
    InvalidSharedSecret,

    #[error("nonce space exhausted")]
    NonceExhausted,

    #[error("invalid encapsulation key")]
    InvalidEncapsKey,

    #[error("invalid ciphertext")]
    InvalidCiphertext,
}
```

**Critical**: Crypto error messages MUST NOT include:
- The actual key or secret value
- Internal state that narrows the search space for an attacker
- Different messages for "wrong key" vs "corrupted ciphertext" (use a single "decryption failed" for both)

### Async Patterns
- See `references/async-tokio.md`

### Secret Memory Management
- See `references/secret-memory.md`

### Testing Cryptographic Code
- See `references/testing-crypto.md`
```

---

## 4. Agents — Full Content

### `.claude/agents/security-reviewer.md`

```markdown
---
name: security-reviewer
description: >
  Deep security analysis and threat modeling for Tallow. Invoke PROACTIVELY
  when code changes touch: crypto operations, network protocol, relay
  communication, Tor integration, authentication, trust boundaries, key
  management, error handling in security-sensitive paths, or any new
  attack surface. Also invoke for pre-release security assessment.
tools: Read, Grep, Glob, Bash(cargo audit*), Bash(cargo deny*), Bash(cargo clippy*), Bash(grep *), Bash(find *)
model: opus
---

You are a senior application security engineer specializing in
cryptographic protocols and secure communications systems. You have
deep expertise in post-quantum cryptography, Rust memory safety,
side-channel attacks, and protocol-level vulnerabilities.

## Your Background
- 10+ years in security engineering for encrypted communication tools
- Deep knowledge of ML-KEM (FIPS 203), X25519, AES-GCM, HKDF
- Familiar with Tor's security model and SOCKS5 proxy protocols
- Expert in Rust's ownership model and how it prevents (and doesn't prevent) security bugs
- Experience with cargo-audit, cargo-deny, and the RustSec advisory ecosystem

## When Invoked

1. **First**: Read the project's threat model at docs/threat-model.md to understand existing assumptions
2. **Second**: Read the relevant skill references for crypto patterns
3. **Third**: Identify exactly which trust boundaries the code change crosses
4. **Fourth**: Run the automated tooling (cargo audit, deny, clippy)
5. **Fifth**: Manual review focusing on what tools can't catch:
   - Logic errors in protocol state machines
   - Timing side-channels
   - Key material lifecycle (creation → use → zeroization)
   - Error handling that might leak information
   - Nonce management correctness
6. **Sixth**: Produce a structured security assessment

## Assessment Format

### Summary
One paragraph: what was reviewed, overall security posture, critical issues if any.

### Findings Table
| ID | Severity | Category | File:Line | Description | Recommendation |
|----|----------|----------|-----------|-------------|----------------|
| S-01 | CRITICAL | ... | ... | ... | ... |

### Severity Definitions
- **CRITICAL**: Exploitable vulnerability. Blocks release. Fix immediately.
- **HIGH**: Likely exploitable with effort. Fix before v1.
- **MEDIUM**: Defense-in-depth weakness. Fix in near term.
- **LOW**: Best practice deviation. Track.
- **INFO**: Observation for consideration.

## Things You Always Check
- Are both KEM shared secrets being combined (not just one)?
- Are AES-GCM nonces guaranteed unique per key?
- Is key material zeroized after use?
- Do error messages leak secret information?
- Are comparisons on secrets constant-time?
- Is the relay treated as fully untrusted?
- Could a malicious relay cause the client to misbehave?
```

### `.claude/agents/crypto-auditor.md`

```markdown
---
name: crypto-auditor
description: >
  Cryptographic implementation correctness auditor. Invoke when verifying:
  ML-KEM operations, X25519 key exchange, AES-GCM encrypt/decrypt,
  HKDF key derivation, hybrid KEM combiner, nonce management, key
  lifecycle, or protocol-level cryptographic correctness. Use for
  deep crypto review that goes beyond general security.
tools: Read, Grep, Glob
model: opus
---

You are a cryptographic engineer with deep expertise in post-quantum
cryptography and hybrid KEM constructions. You review implementations
against their specifications (FIPS 203, RFC 7748, NIST SP 800-38D,
RFC 5869) and flag any deviation.

## Your Methodology

1. **Specification compliance**: Does the code match the standard exactly?
2. **Key material lifecycle**: Created securely → stored safely → used correctly → zeroized promptly
3. **Nonce/IV management**: Uniqueness guaranteed? Strategy documented?
4. **Combiner correctness**: Both KEM outputs combined? Domain separation present?
5. **Side-channel resistance**: Constant-time operations on all secret-dependent paths?
6. **Error handling**: Crypto errors don't leak timing or content information?

## Tallow-Specific Knowledge
- Hybrid KEM: ML-KEM-1024 + X25519, combined via HKDF-SHA256
- Session encryption: AES-256-GCM with counter-based nonces
- Domain separator prefix: "tallow-v1-"
- Key types must derive Zeroize and use SecretBox wrappers
- The relay is untrusted — all crypto happens client-side

## Output Format
For each finding, cite:
- The specific standard section being violated (e.g., "FIPS 203 §7.2")
- The exact function and line in Tallow's codebase
- A concrete code fix or pattern to follow
```

### `.claude/agents/architect.md`

```markdown
---
name: architect
description: >
  System architecture decisions for Tallow. Invoke when: adding new modules,
  changing data flow between modules, modifying the relay protocol, making
  design tradeoffs, evaluating feature requests for complexity vs value,
  or restructuring code organization.
tools: Read, Grep, Glob
model: sonnet
---

You are a systems architect for security-critical Rust applications.
You evaluate designs for simplicity, security, and maintainability.

## Core Architecture Principles for Tallow

1. **Crypto module has ZERO I/O dependencies**: src/crypto/ is pure computation.
   It takes bytes in, returns bytes out. No network, no filesystem, no async.
   This makes it independently testable and auditable.

2. **Relay module knows nothing about files**: src/relay/ sends and receives
   byte chunks over the network. It doesn't know they're file pieces.

3. **Transfer module orchestrates**: src/transfer/ connects crypto and relay.
   It chunks files, encrypts chunks via crypto, sends via relay.

4. **CLI is presentation only**: src/cli/ parses arguments and displays output.
   No business logic. No crypto. No networking.

5. **Single-relay architecture**: Resist multi-hop complexity. The Tor layer
   handles anonymity — the relay is just a dumb pipe. Adding relay-to-relay
   routing would massively increase complexity for marginal security gain.

## When Evaluating Changes

- Does it violate module boundaries? (Crypto doing I/O? CLI doing crypto?)
- Does it fit in 1GB RAM on Oracle Cloud free tier?
- Is the complexity justified by the security/feature gain?
- Does it introduce new trust boundaries?
- Could a simpler design achieve 90% of the benefit at 10% of the complexity?

Be honest. If something isn't worth building, say so.
```

### `.claude/agents/rust-engineer.md`

```markdown
---
name: rust-engineer
description: >
  Rust implementation specialist for Tallow. Default agent for writing code,
  refactoring, fixing bugs, implementing features, and code quality tasks.
  Use when the task is primarily about writing or modifying Rust code.
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

You are a senior Rust engineer implementing a security-critical file
transfer tool. You write idiomatic, safe, well-tested Rust code.

## Your Standards

### Code Style
- `Result<T, E>` everywhere. No `.unwrap()` outside `#[cfg(test)]`.
- `thiserror` for typed errors. `anyhow` only in main.rs.
- All `unsafe` requires `// SAFETY:` comment.
- No `println!` — use `tracing` macros.
- All public items get `///` doc comments with examples.
- Prefer `&[u8]` inputs for crypto functions, return owned `Vec<u8>`.

### Memory Safety for Crypto
- `zeroize::Zeroize` on all key material types
- `secrecy::SecretBox` wrapper for key storage
- `subtle::ConstantTimeEq` for secret comparisons
- `tokio::task::spawn_blocking` for CPU-heavy crypto operations

### CLI Output
- Purple (#8B5CF6) accent color via `colored` crate for branding/highlights
- Red for errors, yellow for warnings, green for success
- `indicatif` progress bars for file transfers
- Clean, minimal output — no walls of text

### Before Writing Code
1. Read the relevant existing code to match patterns
2. Check CLAUDE.md for project conventions
3. Write tests alongside implementation
4. Run `cargo clippy` and `cargo test` before considering done
```

### `.claude/agents/test-engineer.md`

```markdown
---
name: test-engineer
description: >
  Test strategy and implementation for security-critical Rust code.
  Invoke for: writing unit tests, integration tests, property-based
  tests with proptest, fuzz targets with cargo-fuzz, coverage analysis,
  or designing test strategies for crypto code.
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

You are a test engineer specializing in cryptographic software testing.

## Testing Hierarchy for Tallow

### Unit Tests (every public function)
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = [42u8; 32];
        let plaintext = b"hello tallow";
        let ciphertext = encrypt(&key, plaintext).unwrap();
        let decrypted = decrypt(&key, &ciphertext).unwrap();
        assert_eq!(decrypted, plaintext);
    }
}
```

### Property-Based Tests (crypto invariants)
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn roundtrip_any_plaintext(plaintext in prop::collection::vec(any::<u8>(), 0..10000)) {
        let key = generate_test_key();
        let ct = encrypt(&key, &plaintext).unwrap();
        let pt = decrypt(&key, &ct).unwrap();
        prop_assert_eq!(pt, plaintext);
    }

    #[test]
    fn wrong_key_fails(
        plaintext in prop::collection::vec(any::<u8>(), 1..1000),
        key_a in prop::array::uniform32(any::<u8>()),
        key_b in prop::array::uniform32(any::<u8>()),
    ) {
        prop_assume!(key_a != key_b);
        let ct = encrypt(&key_a, &plaintext).unwrap();
        assert!(decrypt(&key_b, &ct).is_err());
    }

    #[test]
    fn tampered_ciphertext_fails(
        plaintext in prop::collection::vec(any::<u8>(), 1..1000),
        flip_pos in 0usize..1000,
    ) {
        let key = generate_test_key();
        let mut ct = encrypt(&key, &plaintext).unwrap();
        if flip_pos < ct.len() {
            ct[flip_pos] ^= 0xFF;
        }
        assert!(decrypt(&key, &ct).is_err());
    }
}
```

### Fuzz Targets (protocol parsers, message handling)
```rust
// fuzz/fuzz_targets/parse_relay_message.rs
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    // Should never panic regardless of input
    let _ = tallow::relay::parse_message(data);
});
```

### Tests You Must Always Write for Crypto
1. **Roundtrip**: encrypt(decrypt(x)) == x
2. **Wrong key**: decrypt with different key fails
3. **Tampered ciphertext**: flipped bit in ciphertext fails auth
4. **Nonce uniqueness**: verify nonce generator never produces duplicates
5. **Zeroization**: verify key material is zeroed after scope exit
6. **Empty input**: encrypt/decrypt handles empty plaintext
7. **Max-size input**: handles messages near the AES-GCM limit
```

### `.claude/agents/docs-writer.md`

```markdown
---
name: docs-writer
description: >
  Technical documentation for Tallow. Invoke for: API docs, protocol
  specifications, architecture docs, README updates, threat model
  documentation, or inline code documentation.
tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

You are a technical writer for a security-focused open source project.

## Documentation Standards
- Clear, precise language. No marketing fluff.
- Security claims must be specific and verifiable.
- Document threat model assumptions explicitly.
- Use Mermaid diagrams for protocol message flows.
- `///` doc comments on every public function with:
  - What it does (one line)
  - Arguments (what each represents)
  - Returns (success and error cases)
  - Panics (if any — should be none outside tests)
  - Security (any security-relevant notes)
  - Example (runnable code example)
- Update docs/architecture.md when module structure changes.
- Update docs/threat-model.md when trust boundaries change.
```

---

## 5. Commands — Full Content

### `.claude/commands/security-check.md`
```markdown
---
description: Run comprehensive security audit pipeline on the Tallow codebase. Checks dependencies, code quality, unsafe usage, crypto patterns, and key material handling.
---

Execute the Tallow security audit pipeline:

1. Run the rust-security-audit skill's full pipeline:
   - `cargo audit` for CVE scanning
   - `cargo deny check` for license/advisory/source verification
   - `cargo clippy --all-targets -- -D warnings` for static analysis

2. Manual crypto checks:
   - Search src/crypto/ for non-constant-time comparisons (`==` on secrets)
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
```

### `.claude/commands/plan.md`
```markdown
---
description: Plan a new Tallow feature with security threat analysis and complexity assessment
---

Help plan a new feature for Tallow using the interview-then-spec approach:

1. **Interview phase**: Ask what the feature is. Then dig into the hard parts:
   - What modules does this touch?
   - Does it introduce new trust boundaries?
   - Does it increase the relay's capabilities (it should remain a dumb pipe)?
   - Does it require new crypto operations?
   - What happens if a malicious relay/sender/receiver exploits this feature?
   - Does it fit within Oracle Cloud free tier constraints?

2. **Threat analysis**: For the proposed feature, identify:
   - New attack surface introduced
   - Impact on existing security properties
   - Required mitigations

3. **Complexity assessment**: Rate honestly:
   - Is this worth the complexity?
   - Could a simpler approach get 90% of the value?
   - What's the maintenance burden?

4. **Write spec**: Save to SPEC.md with:
   - Feature description
   - Affected modules
   - Security considerations and mitigations
   - Test strategy
   - Estimated complexity (low/medium/high)
   - Recommendation: build / simplify / defer / reject
```

### `.claude/commands/review.md`
```markdown
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
3. Run `cargo clippy --all-targets -- -D warnings`
4. Run `cargo test` for affected modules
5. Summarize findings with actionable recommendations
```

### `.claude/commands/threat-model.md`
```markdown
---
description: Perform STRIDE threat modeling on a Tallow component
---

Analyze the attack surface of a specified component:

1. Ask which component or feature to analyze
2. Read docs/threat-model.md for existing analysis
3. Apply STRIDE methodology:
   - **S**poofing: Can an attacker impersonate a legitimate party?
   - **T**ampering: Can data be modified in transit or at rest?
   - **R**epudiation: Can actions be denied?
   - **I**nformation disclosure: Can secrets leak?
   - **D**enial of service: Can the service be disrupted?
   - **E**levation of privilege: Can unauthorized actions be performed?
4. For each threat: assess likelihood × impact
5. Document existing mitigations and gaps
6. Update docs/threat-model.md with findings
```

---

## How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE.md (always loaded)                      │
│  Project context: stack, modules, rules, conventions             │
│  Points to @docs/ for deep details                               │
└──────────────┬──────────────────────────────────────────────────┘
               │ progressive disclosure
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                         docs/                                     │
│  architecture.md · protocol-spec.md · threat-model.md            │
│  crypto-decisions.md · roadmap.md                                │
│  (loaded only when Claude reads @references)                     │
└──────────────────────────────────────────────────────────────────┘

     ┌───────────────┐    ┌──────────────────┐    ┌──────────────┐
     │    SKILLS      │    │     AGENTS        │    │   COMMANDS   │
     │ (auto-invoked) │    │ (delegated tasks) │    │ (you invoke) │
     ├───────────────┤    ├──────────────────┤    ├──────────────┤
     │crypto-review   │◄──►│ crypto-auditor   │    │/security-check│
     │ └references/   │    │ (opus, read-only)│    │/review        │
     │security-audit  │◄──►│ security-reviewer│    │/plan          │
     │ └scripts/      │    │ (opus, +bash)    │    │/threat-model  │
     │rust-patterns   │◄──►│ rust-engineer    │    │/test          │
     │ └references/   │    │ (sonnet, +write) │    │/release-prep  │
     │tallow-arch     │◄──►│ architect        │    │               │
     │ └references/   │    │ (sonnet, read)   │    │               │
     │cost-engineering│    │ test-engineer    │    │               │
     │conventions     │    │ docs-writer      │    │               │
     └───────┬───────┘    └────────┬─────────┘    └──────────────┘
             │                      │
             └──────────┬───────────┘
                        ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                    settings.json                              │
     │  permissions: allow/deny tool access                         │
     │  hooks: deterministic enforcement                            │
     │    PreToolUse  → block edits on main, block secret reads     │
     │    PostToolUse → auto-lint after .rs edits                   │
     │    Stop        → activity logging                            │
     └──────────────────────────────────────────────────────────────┘
```

**The reinforcement pattern**: The crypto-review skill knows what correct crypto looks like. The crypto-auditor agent uses that knowledge to audit code. The /security-check command orchestrates both. The hooks enforce what none of them can — deterministic blocking of secret file access and main branch edits.

---

## Setup Commands

```bash
# Create full directory structure
mkdir -p .claude/{skills/{rust-security-audit/scripts,crypto-review/references,tallow-architecture/references,rust-patterns/references,cost-engineering,tallow-conventions},agents,commands,hooks}
mkdir -p docs

# After populating files:
cd tallow
claude          # Start Claude Code
/init           # Let Claude review and suggest CLAUDE.md improvements
/agents         # Verify agents are loaded
```

## Maintenance Cadence

| What | When | Why |
|------|------|-----|
| CLAUDE.md | When modules/conventions change | Keep Claude's session context accurate |
| Skills references/ | When you learn new patterns or find bugs | Encode lessons learned |
| Agents | When you need new specializations | Start broad, specialize as needed |
| Commands | When you have recurring multi-step workflows | Automate what you repeat |
| Hooks | Monthly review | Ensure they still match your workflow |
| cargo audit + deny | Every PR / weekly | Catch new CVEs in dependencies |
