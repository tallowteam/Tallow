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
cargo audit
cargo audit --json
```

**What to look for**:
- Any RUSTSEC advisory = immediate attention
- Yanked crate versions = upgrade immediately
- Unmaintained crates = assess risk and plan migration

### Step 2: License and Advisory Deep Check
```bash
cargo deny check
cargo deny check advisories
cargo deny check licenses
cargo deny check bans
cargo deny check sources
```

**What to look for**:
- Copyleft licenses in dependency tree that conflict with project licensing
- Duplicate crate versions (attack surface multiplication)
- Crates downloaded from non-crates.io sources

### Step 3: Static Analysis
```bash
cargo clippy --all-targets -- -D warnings
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
grep -rn "unsafe" crates/ --include="*.rs"
grep -rn "unsafe" crates/ --include="*.rs" | grep -v "// SAFETY:"
```

**For each unsafe block, verify**:
1. A `// SAFETY:` comment exists directly above explaining the invariant
2. The invariant is actually upheld by the surrounding code
3. The unsafe is truly necessary — could safe Rust achieve the same?
4. No undefined behavior can occur under any input

### Step 5: Cryptographic Safety Checks
```bash
grep -rn "struct.*Key\|struct.*Secret\|struct.*Nonce" crates/ --include="*.rs"
grep -rn "== \|!= " crates/tallow-crypto/ --include="*.rs" | grep -v "test" | grep -v "SAFETY"
grep -rn "\.unwrap()\|\.expect(" crates/tallow-crypto/ --include="*.rs" | grep -v "#\[cfg(test)\]"
grep -rn "Nonce\|nonce" crates/tallow-crypto/ --include="*.rs"
```

### Step 6: Information Leakage Check
```bash
grep -rn "format!\|println!\|eprintln!\|tracing::" crates/ --include="*.rs" | grep -i "key\|secret\|password\|token"
grep -rn "#\[derive.*Debug" crates/tallow-crypto/ --include="*.rs"
```

### Step 7: Integer Overflow Protection
Verify `Cargo.toml` has overflow checks in release:
```toml
[profile.release]
overflow-checks = true
```

## Output Format

| Priority | Category | Description |
|----------|----------|-------------|
| **CRITICAL** | Must fix before any release | Active CVEs, unsafe without justification, secret leakage |
| **HIGH** | Fix before v1.0 | Missing zeroize, non-constant-time comparisons, unwrap in crypto |
| **MEDIUM** | Fix soon | Clippy warnings, unmaintained deps, missing overflow checks |
| **LOW** | Track | Style issues, documentation gaps |
| **INFO** | Note | Observations, recommendations for future improvement |

For each finding: file path, line number, issue description, specific fix recommendation.
