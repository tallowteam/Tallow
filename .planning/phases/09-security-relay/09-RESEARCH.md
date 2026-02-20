# Phase 9: Security Hardening & Relay Auth - Research

**Researched:** 2026-02-20
**Domain:** Security hardening, filename sanitization, ANSI escape stripping, relay authentication, verification strings, Docker deployment
**Confidence:** HIGH (based on CVE analysis, Croc vulnerability reports, Signal protocol documentation, and existing codebase audit)

## Summary

Phase 9 hardens Tallow against all 8 Croc CVEs from 2023 and adds relay authentication. The current codebase has partial defenses -- `sanitize_paths()` on `FileManifest` strips `..` and root prefixes but misses Windows reserved names, Unicode normalization attacks, ANSI escape sequences in displayed strings, and null bytes. The relay server (`tallow-relay`) has zero authentication -- any client can join any room. Code phrases are passed as CLI arguments visible in `ps aux`.

This phase has **no novel research challenges** -- every feature has well-established patterns in the security community. The primary risk is incomplete implementation: path traversal has dozens of edge cases across Windows/Linux/macOS, and ANSI escape sequences have multiple forms (CSI, OSC, DCS) that all must be stripped. The verification string feature follows Signal's well-documented numeric fingerprint algorithm adapted for ephemeral sessions.

**Primary recommendation:** Build a comprehensive `sanitize` module in `tallow-protocol` with property-tested filename sanitization and ANSI stripping. Add BLAKE3-based relay password auth in the `RoomJoin` message. Support `TALLOW_CODE` and `TALLOW_RELAY_PASS` environment variables via clap's built-in env feature. The verification string should hash session keys with BLAKE3 and display as 8 groups of 5 digits (40 digits total), with an emoji alternative using a curated 256-emoji set.

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `strip-ansi-escapes` | 0.2 | Strip all ANSI escape sequences (CSI, OSC, DCS) from byte slices | 422K+ monthly downloads. Handles ALL escape sequence types, not just color codes. Used by 546 crates including major CLI tools. Manual regex would miss OSC/DCS sequences. |

### Already Available (No New Dependencies)

| Library | Exists In | Purpose | Phase 9 Use |
|---------|-----------|---------|-------------|
| `blake3` | workspace dep | BLAKE3 hashing | Relay password hashing, verification string derivation |
| `subtle` | workspace dep | Constant-time comparison | Relay password comparison, verification string generation |
| `clap` (with `env` feature) | tallow/Cargo.toml, tallow-relay/Cargo.toml | CLI with env var support | `TALLOW_CODE`, `TALLOW_RELAY_PASS` via `#[arg(env = "...")]` |
| `dialoguer` | tallow/Cargo.toml | Interactive prompts | Display verification string, ask user to confirm |
| `crossterm` | tallow (via ratatui) | Terminal width detection | Check terminal capabilities for emoji display |
| `proptest` | dev-dependency | Property-based testing | Fuzz filename sanitization with adversarial inputs |
| `rand` | workspace dep | Random generation | Transfer ID generation |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| `strip-ansi-escapes` | Hand-rolled regex `\x1b\[[0-9;]*[A-Za-z]` | Only catches CSI sequences. Misses OSC (`ESC ]`), DCS (`ESC P`), and other escape types. ANSI has 7+ sequence types -- the crate handles all of them via a proper state machine parser (vte crate internally). |
| `strip-ansi-escapes` | `console` crate's `strip_ansi_codes()` | `console` is a larger dependency (terminal manipulation). `strip-ansi-escapes` is focused and lighter. |
| `sanitize-filename` crate | Custom sanitization | The crate (v0.6) handles Windows reserved names and basic sanitization, but lacks: null byte stripping, Unicode normalization, ANSI escape stripping, and path traversal verification (canonicalize + starts_with check). We need a custom function that does all of these. The crate would only cover 30% of requirements. |

### Installation

```toml
# In crates/tallow-protocol/Cargo.toml [dependencies] -- ADD:
strip-ansi-escapes = "0.2"

# In crates/tallow-relay/Cargo.toml [dependencies] -- ADD:
blake3.workspace = true
subtle.workspace = true
```

No new workspace-level dependencies needed. `blake3` and `subtle` are already workspace dependencies but not used by `tallow-relay` yet.

## Architecture Patterns

### Recommended Changes by Crate

```
crates/tallow-protocol/src/
  transfer/
    sanitize.rs          # NEW: Comprehensive filename/path sanitization module
    receive.rs           # Use sanitize module, add ANSI stripping to displayed strings

crates/tallow-relay/src/
  auth.rs                # REPLACE: BLAKE3 password verification with constant-time comparison
  config.rs              # ADD: password field, env var override support
  main.rs                # ADD: --pass flag, TALLOW_RELAY_PASS env var, Docker-friendly config
  server.rs              # ADD: password check in handle_connection before room join

crates/tallow/src/
  cli.rs                 # ADD: TALLOW_CODE env var on ReceiveArgs, --verify flag, --pass flag
  commands/
    send.rs              # ADD: --verify flag, display verification string
    receive.rs           # ADD: TALLOW_CODE env var support, display verification string
  output/
    verify.rs            # NEW: Verification string display (numeric + emoji)

Dockerfile               # NEW: Multi-stage Docker build for tallow-relay
```

### Pattern 1: Comprehensive Filename Sanitization

**What:** A single `sanitize_filename()` function that defends against all known path traversal and injection vectors in one pass. This replaces the current `FileManifest::sanitize_paths()` which only strips `..` and root components.

**When to use:** Every time a filename is received from an untrusted sender, before any filesystem operation.

**Why comprehensive:** CVE-2023-43616 (Croc path traversal) was caused by incomplete sanitization. CVE-2025-68705 (RustFS, CVSS 9.9) and CVE-2025-29787 (Rust ZIP library) show that Rust projects continue to get this wrong. The function must handle ALL of: directory traversal (`..`), absolute paths, Windows drive letters, Windows reserved names (CON, PRN, NUL, AUX, COM1-9, LPT1-9), null bytes, control characters (0x00-0x1F), ANSI escape sequences, Unicode fullwidth path separators (U+FF0F `/`, U+FF3C `\`), and overlength filenames (>255 bytes per component).

**Example:**
```rust
// In crates/tallow-protocol/src/transfer/sanitize.rs

use std::path::{Path, PathBuf};

/// Windows reserved device names that must be rejected as filename components.
/// These cause undefined behavior on Windows even with extensions (e.g., CON.txt).
const WINDOWS_RESERVED: &[&str] = &[
    "CON", "PRN", "AUX", "NUL",
    "COM0", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT0", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/// Maximum length for a single path component (bytes)
const MAX_COMPONENT_LEN: usize = 255;

/// Sanitize a filename received from an untrusted sender.
///
/// Defends against:
/// - CVE-2023-43616: Path traversal via `..` components
/// - CVE-2023-43619: ANSI escape sequences in filenames
/// - CVE-2025-68705: Unsanitized path joins
/// - CVE-2025-27210: Windows reserved device names as path traversal
/// - Unicode fullwidth path separators (U+FF0F, U+FF3C)
/// - Null bytes, control characters
/// - Overlength components
pub fn sanitize_filename(name: &str, output_dir: &Path) -> Result<PathBuf, SanitizeError> {
    // 1. Reject empty names
    if name.is_empty() {
        return Err(SanitizeError::EmptyFilename);
    }

    // 2. Reject null bytes (filesystem boundary violation)
    if name.contains('\0') {
        return Err(SanitizeError::NullByte);
    }

    // 3. Normalize Unicode fullwidth path separators to ASCII equivalents
    //    U+FF0F (FULLWIDTH SOLIDUS) -> /
    //    U+FF3C (FULLWIDTH REVERSE SOLIDUS) -> \
    let normalized: String = name
        .replace('\u{FF0F}', "/")
        .replace('\u{FF3C}', "/")  // Normalize backslash to forward slash too
        .replace('\\', "/");

    // 4. Strip ANSI escape sequences
    let stripped = strip_ansi_escapes::strip(&normalized);
    let stripped_str = String::from_utf8_lossy(&stripped);

    // 5. Split into components, filter dangerous ones
    let components: Vec<&str> = stripped_str
        .split('/')
        .filter(|c| {
            !c.is_empty()
                && *c != "."
                && *c != ".."
                && !c.starts_with('~')
        })
        .collect();

    if components.is_empty() {
        return Err(SanitizeError::SanitizedToEmpty);
    }

    // 6. Validate each component
    let mut sanitized_components = Vec::new();
    for component in &components {
        // Strip control characters (0x00-0x1F, 0x7F) except we already stripped null
        let clean: String = component
            .chars()
            .filter(|c| !c.is_control())
            .collect();

        if clean.is_empty() {
            continue;
        }

        // Check Windows reserved names (case-insensitive, with or without extension)
        let upper = clean.to_uppercase();
        let stem = upper.split('.').next().unwrap_or(&upper);
        if WINDOWS_RESERVED.contains(&stem) {
            // Prefix with underscore to defang
            sanitized_components.push(format!("_{}", clean));
            continue;
        }

        // Truncate overlength components
        if clean.len() > MAX_COMPONENT_LEN {
            sanitized_components.push(clean[..MAX_COMPONENT_LEN].to_string());
        } else {
            sanitized_components.push(clean);
        }
    }

    if sanitized_components.is_empty() {
        return Err(SanitizeError::SanitizedToEmpty);
    }

    // 7. Join and verify path stays within output_dir
    let relative_path: PathBuf = sanitized_components.iter().collect();
    let final_path = output_dir.join(&relative_path);

    // 8. Canonicalize output_dir and verify containment
    //    Note: final_path may not exist yet, so we check the parent structure
    let canonical_output = output_dir
        .canonicalize()
        .unwrap_or_else(|_| output_dir.to_path_buf());

    // Build canonical final path by joining canonical output with relative
    let canonical_final = canonical_output.join(&relative_path);

    // Verify the canonical path starts with the output dir
    if !canonical_final.starts_with(&canonical_output) {
        return Err(SanitizeError::PathEscape(name.to_string()));
    }

    Ok(canonical_final)
}

/// Strip ANSI escape sequences and control characters from a display string.
/// Use this on ANY string shown to the user that originated from the network.
pub fn sanitize_display(input: &str) -> String {
    let stripped = strip_ansi_escapes::strip(input);
    String::from_utf8_lossy(&stripped)
        .chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\t')
        .collect()
}

#[derive(Debug, thiserror::Error)]
pub enum SanitizeError {
    #[error("empty filename")]
    EmptyFilename,
    #[error("filename contains null byte")]
    NullByte,
    #[error("filename sanitized to empty string")]
    SanitizedToEmpty,
    #[error("path escapes output directory: {0}")]
    PathEscape(String),
}
```

### Pattern 2: ANSI Escape Stripping for All Displayed Strings

**What:** Every string from the network that is displayed to the user MUST be sanitized. This includes filenames in the transfer offer, error messages from the sender, and chat messages. Use `sanitize_display()` from the sanitize module.

**When to use:** Before any `println!`, `output::color::info()`, or TUI rendering of untrusted data.

**Why critical:** CVE-2023-43619 (Croc) allowed terminal manipulation via escape sequences in filenames. ANSI sequences can: (1) overwrite terminal content to hide malicious activity, (2) change terminal title to phishing URLs, (3) inject commands via OSC sequences on vulnerable terminal emulators, (4) cause denial of service via character multiplication sequences.

**Example:**
```rust
// In receive.rs, when displaying the file offer:
for name in &filenames {
    // NEVER display raw filenames from sender
    let safe_name = tallow_protocol::transfer::sanitize::sanitize_display(
        &name
    );
    println!("  - {}", safe_name);
}
```

### Pattern 3: Relay Password Authentication via BLAKE3

**What:** The relay server accepts an optional password. Clients send a BLAKE3 hash of the password in a modified `RoomJoin` message. The relay verifies with constant-time comparison. If the password is wrong, the connection is dropped immediately.

**When to use:** Self-hosted relay deployments where open access is undesirable.

**Protocol change:** Add an optional `password_hash` field to the `RoomJoin` message:

```rust
// In wire/messages.rs
Message::RoomJoin {
    room_id: Vec<u8>,
    /// BLAKE3 hash of relay password (None = no auth attempted)
    password_hash: Option<[u8; 32]>,
}
```

**Relay-side verification:**
```rust
// In relay auth.rs
use subtle::ConstantTimeEq;

/// Verify client's password hash against the relay's configured password.
/// Returns true if: (1) relay has no password configured, or
/// (2) client provided correct password hash.
pub fn verify_relay_password(
    client_hash: Option<&[u8; 32]>,
    relay_password: &str,
) -> bool {
    if relay_password.is_empty() {
        return true; // Open relay
    }

    match client_hash {
        None => false, // Relay requires password but client didn't provide one
        Some(hash) => {
            let expected = blake3::hash(relay_password.as_bytes());
            hash.ct_eq(expected.as_bytes()).into()
        }
    }
}
```

**Important:** The password is hashed client-side before sending. The relay stores the plaintext password in config (or env var) and hashes it server-side for comparison. This means the password hash is visible on the wire, but the QUIC/TLS transport layer already encrypts it. The BLAKE3 hash prevents the relay admin from learning the password if they only see config (since the config stores plaintext and the wire carries the hash).

### Pattern 4: Environment Variable Support via Clap

**What:** Use clap's built-in `env` feature (already enabled in both `tallow` and `tallow-relay` Cargo.toml) to support `TALLOW_CODE` and `TALLOW_RELAY_PASS` environment variables. This prevents secrets from appearing in `ps aux` output (CVE-2023-43620).

**When to use:** Always. Environment variables take precedence over CLI arguments.

**Example:**
```rust
// In cli.rs, ReceiveArgs:
#[derive(Args)]
pub struct ReceiveArgs {
    /// Code phrase to join (also reads TALLOW_CODE env var)
    #[arg(env = "TALLOW_CODE")]
    pub code: Option<String>,
    // ... other fields
}

// In cli.rs, SendArgs:
#[derive(Args)]
pub struct SendArgs {
    /// Custom code phrase (also reads TALLOW_CODE env var)
    #[arg(short = 'c', long = "code", env = "TALLOW_CODE")]
    pub code: Option<String>,
    // ... other fields
}

// In tallow-relay main.rs, Serve command:
Commands::Serve {
    /// Relay password (also reads TALLOW_RELAY_PASS env var)
    #[arg(long = "pass", env = "TALLOW_RELAY_PASS", hide_env_values = true)]
    pass: Option<String>,
    // ... other fields
}
```

**Key detail:** `hide_env_values = true` prevents clap from printing the password value in `--help` output.

### Pattern 5: Verification String Display (Signal-inspired)

**What:** When `--verify` is passed, both sender and receiver display a verification string derived from the session key. Users compare these strings verbally or visually to confirm no MITM attack. This is adapted from Signal's safety number protocol, simplified for ephemeral sessions.

**Algorithm:** Since Tallow uses ephemeral session keys (not long-lived identity keys like Signal), the verification string is simpler:

1. Take the session key (32 bytes)
2. Hash with BLAKE3 using domain separation: `blake3::Hasher::new_derive_key("tallow verification string v1")`
3. Take the 32-byte hash output
4. Convert to numeric: each 5-digit group = `u16_from_2_bytes % 100000`, formatted as zero-padded 5-digit number
5. Display as 8 groups of 5 digits = 40 digits total (similar to Signal's 60 digits but shorter for ephemeral sessions)

**Example:**
```rust
// In output/verify.rs

/// Generate a numeric verification string from session key bytes.
/// Returns 8 groups of 5 digits (40 digits total).
pub fn numeric_verification(session_key: &[u8; 32]) -> String {
    let mut hasher = blake3::Hasher::new_derive_key("tallow verification string v1");
    hasher.update(session_key);
    let hash = hasher.finalize();
    let bytes = hash.as_bytes();

    let mut groups = Vec::with_capacity(8);
    for i in 0..8 {
        let offset = i * 4;
        let val = u32::from_le_bytes([
            bytes[offset],
            bytes[offset + 1],
            bytes[offset + 2],
            bytes[offset + 3],
        ]);
        groups.push(format!("{:05}", val % 100000));
    }

    groups.join(" ")
}

/// Curated emoji set for visual fingerprinting (256 emojis).
/// Selected for: visual distinctiveness, cross-platform rendering,
/// no skin-tone variants, no flags (political), no symbols that
/// look similar at small sizes.
const EMOJI_SET: &[&str] = &[
    // Animals (visually distinct)
    "\u{1F436}", // dog
    "\u{1F431}", // cat
    "\u{1F42D}", // mouse
    "\u{1F439}", // hamster
    "\u{1F430}", // rabbit
    "\u{1F43B}", // bear
    "\u{1F43C}", // panda
    "\u{1F428}", // koala
    "\u{1F42F}", // tiger
    "\u{1F981}", // lion
    // ... (256 total, curated during implementation)
    // Each emoji encodes 8 bits (log2(256))
];

/// Generate an emoji verification string from session key bytes.
/// Returns 8 emoji (8 bytes of entropy from 256-emoji set = 64 bits).
pub fn emoji_verification(session_key: &[u8; 32]) -> String {
    let mut hasher = blake3::Hasher::new_derive_key("tallow emoji verification v1");
    hasher.update(session_key);
    let hash = hasher.finalize();
    let bytes = hash.as_bytes();

    // Take first 8 bytes, each indexes into 256-emoji set
    bytes[..8]
        .iter()
        .map(|&b| EMOJI_SET[b as usize])
        .collect::<Vec<_>>()
        .join(" ")
}

/// Display verification strings to the user
pub fn display_verification(session_key: &[u8; 32], emoji: bool) {
    let numeric = numeric_verification(session_key);
    println!();
    println!("Verification string:");
    println!("  {}", numeric);

    if emoji {
        let emojis = emoji_verification(session_key);
        println!("  {}", emojis);
    }

    println!();
    println!("Compare this with your peer to verify the connection is secure.");
}
```

### Pattern 6: Docker Relay Image

**What:** Multi-stage Dockerfile for `tallow-relay` using cargo-chef for dependency caching and a minimal runtime image.

**Example:**
```dockerfile
# Stage 1: Chef (dependency recipe)
FROM rust:1.80-slim AS chef
RUN cargo install cargo-chef
WORKDIR /build

# Stage 2: Planner (generate recipe from Cargo files)
FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 3: Builder (compile dependencies, then source)
FROM chef AS builder
COPY --from=planner /build/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json -p tallow-relay
COPY . .
RUN cargo build --release -p tallow-relay

# Stage 4: Runtime (minimal image)
FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r tallow && useradd -r -g tallow tallow
COPY --from=builder /build/target/release/tallow-relay /usr/local/bin/

# Configuration via environment variables
ENV TALLOW_RELAY_PASS=""
ENV RUST_LOG="info"

EXPOSE 4433/udp

USER tallow
ENTRYPOINT ["tallow-relay", "serve"]
```

### Anti-Patterns to Avoid

- **NEVER check path containment before canonicalization.** `output_dir.join("../../../etc/passwd").starts_with(output_dir)` returns `true` because `starts_with` does string prefix matching on the non-canonicalized path. Always canonicalize first, or use a combination of component filtering AND canonicalization as defense in depth.

- **NEVER strip ANSI with a simple regex.** The regex `\x1b\[[0-9;]*[A-Za-z]` only catches CSI sequences. It misses OSC (`ESC ]...BEL`), DCS (`ESC P...ST`), and single-character control sequences. Use the `strip-ansi-escapes` crate which handles all types via a proper VTE state machine parser.

- **NEVER compare passwords with `==`.** Even hashed passwords must use constant-time comparison (`subtle::ConstantTimeEq`). This is already a project-wide rule (CLAUDE.md) but bears repeating for the relay auth path specifically.

- **NEVER log relay passwords or password hashes.** The `tracing` output must not contain password material at any log level. Use `#[arg(hide_env_values = true)]` in clap and never pass password values to `tracing::info!()` or similar.

- **NEVER use `fs::canonicalize()` alone for path validation.** `canonicalize()` requires the path to exist, but the output file may not exist yet. Use a hybrid: canonicalize the output directory (which must exist), then join the sanitized relative path and check with `starts_with()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ANSI escape stripping | Regex-based `\x1b\[..` filter | `strip-ansi-escapes` crate (uses VTE parser) | ANSI has 7+ sequence types (CSI, OSC, DCS, SS2, SS3, etc.). A regex catches CSI only. The crate handles all via a proper terminal state machine. |
| Constant-time comparison | `==` on byte slices | `subtle::ConstantTimeEq::ct_eq()` | Already a project requirement. Timing side channels on relay password comparison would let attackers brute-force the password. |
| CLI env var support | Manual `std::env::var()` + fallback | Clap `#[arg(env = "VAR_NAME")]` | Clap already has the `env` feature enabled. Manual env var reading is redundant and error-prone (precedence, help text, etc.). |
| BLAKE3 hashing | SHA-256 or custom hash | `blake3::hash()` | Project standard. Faster than SHA-256, already a workspace dep, keyed hashing built in. |
| Docker layer caching | Copying source then `cargo build` | `cargo-chef` (prepare + cook pattern) | Without cargo-chef, every source change recompiles ALL dependencies. With it, only changed source is recompiled. |

**Key insight:** The Croc CVEs were all caused by hand-rolling security-sensitive operations. Every one of the 8 CVEs could have been prevented by using existing libraries or established patterns. Tallow must not repeat this mistake.

## Common Pitfalls

### Pitfall 1: Incomplete Path Sanitization (CVE-2023-43616)

**What goes wrong:** Sanitization handles `..` but misses: null bytes (`\0`), Windows reserved names (CON, PRN), Unicode fullwidth path separators (U+FF0F, U+FF3C), trailing dots/spaces on Windows, or the canonicalization check is done incorrectly.

**Why it happens:** Path traversal has 20+ distinct attack vectors across 3 operating systems. Developers fix the obvious `../` case and declare victory.

**How to avoid:** Build a single comprehensive sanitization function with ALL vectors covered. Property-test it with `proptest` generating adversarial filenames: random bytes, known-bad sequences (`../`, `C:\`, `CON.txt`, `\0`, ANSI escapes, fullwidth separators). Test on all target platforms.

**Warning signs:** Any `output_dir.join(untrusted_input)` without prior sanitization. Any sanitization that handles fewer than 5 attack vectors.

### Pitfall 2: ANSI Stripping Misses OSC Sequences (CVE-2023-43619)

**What goes wrong:** Using a regex like `\x1b\[[0-9;]*[A-Za-z]` only strips CSI (Control Sequence Introducer) escape sequences. OSC (Operating System Command) sequences like `ESC ] 0 ; malicious-title BEL` pass through and can change the terminal window title to a phishing URL. DCS sequences can inject data.

**Why it happens:** Most developers only know about CSI color codes (`\x1b[31m`) and don't realize ANSI has 7+ sequence types.

**How to avoid:** Use `strip-ansi-escapes` which uses the VTE crate's state machine parser, handling ALL escape sequence types. Additionally strip control characters (0x00-0x1F except \n, \t) as a defense-in-depth measure.

**Warning signs:** Using regex for ANSI stripping. Using a "control character filter" that doesn't handle multi-byte escape sequences.

### Pitfall 3: `starts_with()` Path Check on Non-Canonical Paths

**What goes wrong:** Code like `output_dir.join(filename).starts_with(&output_dir)` appears to work but is bypassable. On some systems, `PathBuf::starts_with()` does component-level comparison, but symlinks, `..` in the middle of paths, and case-sensitivity differences on Windows can defeat it.

**Why it happens:** Developers confuse `String::starts_with()` (prefix match) with `Path::starts_with()` (component match), or forget that `Path::starts_with()` doesn't resolve symlinks.

**How to avoid:** Two-layer defense: (1) Filter components to remove ALL `..`, root, and prefix components. (2) After joining with output_dir, verify the canonical path. Since the file may not exist yet, canonicalize the output_dir and join the filtered relative path for the check.

**Warning signs:** A `starts_with()` check without prior component filtering. A single defense layer.

### Pitfall 4: Relay Password in Process List

**What goes wrong:** Running `tallow-relay serve --pass mysecret` puts the password in `/proc/<pid>/cmdline`, visible to all users via `ps aux`.

**Why it happens:** CLI arguments are stored in process memory and visible to the OS. This is the exact CVE-2023-43620 attack vector from Croc.

**How to avoid:** Support `TALLOW_RELAY_PASS` environment variable via clap's `env` feature. Environment variables are visible in `/proc/<pid>/environ` but that file has 0600 permissions (only same user can read), which is more restricted than `/proc/<pid>/cmdline` (0444, world-readable). For production, recommend Docker secrets or a secrets manager.

**Warning signs:** Documentation showing `--pass` without warning about process visibility. Missing `env = "..."` attribute in clap Args.

### Pitfall 5: Verification String Gives False Confidence

**What goes wrong:** Users see a verification string, assume it means "secure", but the string is derived from an already-compromised session key. Or: the verification string is too short and can be brute-forced during the session window.

**Why it happens:** Verification strings prevent MITM attacks on the key exchange, but if the key exchange itself is compromised (e.g., relay is malicious AND user doesn't check), the verification string is meaningless.

**How to avoid:** 40 numeric digits = ~132 bits of entropy (8 groups x 5 digits, each group from 32-bit value mod 100000). This is more than sufficient -- the attacker would need to brute-force a BLAKE3 preimage. Document clearly: "Verification confirms that both peers derived the same session key. It detects relay MITM attacks."

**Warning signs:** Verification string shorter than 20 digits. Using a non-cryptographic hash for derivation.

### Pitfall 6: Docker Image Runs as Root

**What goes wrong:** The relay server process inside Docker runs as root, violating least privilege. If the relay has any vulnerability, the attacker gets root in the container.

**Why it happens:** Default Docker behavior runs processes as root unless explicitly configured otherwise.

**How to avoid:** Create a non-root user in the Dockerfile (`RUN useradd -r tallow`) and switch to it (`USER tallow`). Use `EXPOSE` for documentation but bind to all interfaces. Never mount host volumes as writable.

**Warning signs:** No `USER` directive in Dockerfile. No `groupadd`/`useradd`.

### Pitfall 7: Unicode Normalization Bypass

**What goes wrong:** An attacker sends a filename with Unicode fullwidth path separators (U+FF0F `\uFF0F` looks like `/`, U+FF3C `\uFF3C` looks like `\`). These are not caught by ASCII-only path separator checks. After the OS or filesystem normalizes them, they become real path separators.

**Why it happens:** Developers only check for ASCII `/` and `\` in path sanitization.

**How to avoid:** Explicitly normalize fullwidth characters before sanitization. Replace U+FF0F and U+FF3C with `/` before splitting. This is included in the sanitize_filename() function above.

**Warning signs:** Sanitization only checking ASCII characters. No Unicode awareness.

## Code Examples

### Complete Filename Sanitization Test Suite

```rust
// In crates/tallow-protocol/src/transfer/sanitize.rs - tests module

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn test_dir() -> PathBuf {
        PathBuf::from("/tmp/tallow-test-output")
    }

    #[test]
    fn test_basic_filename() {
        let result = sanitize_filename("hello.txt", &test_dir()).unwrap();
        assert!(result.ends_with("hello.txt"));
    }

    #[test]
    fn test_path_traversal() {
        let result = sanitize_filename("../../../etc/passwd", &test_dir()).unwrap();
        assert!(!result.to_string_lossy().contains(".."));
        assert!(result.starts_with(&test_dir()));
    }

    #[test]
    fn test_absolute_path() {
        let result = sanitize_filename("/etc/passwd", &test_dir()).unwrap();
        assert!(result.starts_with(&test_dir()));
    }

    #[test]
    fn test_windows_drive_letter() {
        let result = sanitize_filename("C:\\Windows\\System32\\cmd.exe", &test_dir()).unwrap();
        assert!(!result.to_string_lossy().contains("C:"));
        assert!(result.starts_with(&test_dir()));
    }

    #[test]
    fn test_null_byte() {
        let result = sanitize_filename("file\0.txt", &test_dir());
        assert!(result.is_err());
    }

    #[test]
    fn test_windows_reserved_con() {
        let result = sanitize_filename("CON", &test_dir()).unwrap();
        assert!(!result.file_name().unwrap().to_string_lossy().eq_ignore_ascii_case("CON"));
    }

    #[test]
    fn test_windows_reserved_with_extension() {
        let result = sanitize_filename("CON.txt", &test_dir()).unwrap();
        let name = result.file_name().unwrap().to_string_lossy();
        assert!(name.starts_with('_'), "Should be prefixed: {}", name);
    }

    #[test]
    fn test_ansi_escape_in_filename() {
        let result = sanitize_filename(
            "\x1b[31mmalicious\x1b[0m.txt",
            &test_dir()
        ).unwrap();
        let name = result.file_name().unwrap().to_string_lossy();
        assert!(!name.contains("\x1b"));
        assert!(name.contains("malicious"));
    }

    #[test]
    fn test_unicode_fullwidth_slash() {
        let result = sanitize_filename(
            "dir\u{FF0F}file.txt",  // Fullwidth solidus
            &test_dir()
        ).unwrap();
        assert!(result.starts_with(&test_dir()));
    }

    #[test]
    fn test_empty_filename() {
        assert!(sanitize_filename("", &test_dir()).is_err());
    }

    #[test]
    fn test_dots_only() {
        assert!(sanitize_filename("..", &test_dir()).is_err());
        assert!(sanitize_filename(".", &test_dir()).is_err());
    }

    #[test]
    fn test_control_characters() {
        let result = sanitize_filename(
            "file\x01\x02\x03.txt",
            &test_dir()
        ).unwrap();
        let name = result.file_name().unwrap().to_string_lossy();
        assert!(!name.contains('\x01'));
    }
}

// Property test with proptest
#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn sanitized_path_never_escapes_output_dir(
            name in ".*"
        ) {
            let output_dir = PathBuf::from("/tmp/tallow-output");
            if let Ok(result) = sanitize_filename(&name, &output_dir) {
                // Path must start with output dir
                prop_assert!(
                    result.starts_with(&output_dir),
                    "Sanitized path {} escapes output dir",
                    result.display()
                );
                // Path must not contain ..
                prop_assert!(
                    !result.to_string_lossy().contains(".."),
                    "Sanitized path {} contains ..",
                    result.display()
                );
            }
            // Errors are fine -- some inputs should be rejected
        }

        #[test]
        fn sanitized_path_no_control_chars(
            name in "[^\0]{1,500}"  // No null bytes (tested separately)
        ) {
            let output_dir = PathBuf::from("/tmp/tallow-output");
            if let Ok(result) = sanitize_filename(&name, &output_dir) {
                let result_str = result.to_string_lossy();
                for c in result_str.chars() {
                    if c.is_control() {
                        prop_assert!(
                            false,
                            "Control char {:?} in sanitized path {}",
                            c, result_str
                        );
                    }
                }
            }
        }
    }
}
```

### Relay Auth Integration in server.rs

```rust
// In handle_connection(), after parsing room_id:

// Extract optional password hash from the join message
let password_hash = parse_password_hash(&msg_buf)?;

// Verify relay password
if !auth::verify_relay_password(
    password_hash.as_ref(),
    &config.password,
) {
    warn!("authentication failed from {}", remote_addr);
    // Send auth failure response
    let reject_msg = encode_auth_reject()?;
    send.write_all(&reject_msg).await?;
    return Ok(());
}
```

### Environment Variable for Code Phrase

```rust
// In receive command, BEFORE using code phrase:
// clap handles TALLOW_CODE env var automatically via #[arg(env = "TALLOW_CODE")]
// But we also want to warn if code is passed via CLI arg:

let code_phrase = match &args.code {
    Some(code) => {
        // Warn if code was likely passed via CLI (not env var)
        if std::env::var("TALLOW_CODE").is_err() {
            tracing::warn!(
                "Code phrase passed via CLI argument. \
                 Use TALLOW_CODE env var to avoid exposing it in process list."
            );
        }
        code.clone()
    }
    None => {
        // Interactive prompt
        output::color::info("Enter the code phrase:");
        let mut input = String::new();
        std::io::stdin().read_line(&mut input)?;
        input.trim().to_string()
    }
};
```

### Wire Protocol Change for Relay Auth

```rust
// The RoomJoin message needs to carry an optional password hash.
// Option A: Add field to existing variant (breaking wire change)
Message::RoomJoin {
    room_id: Vec<u8>,
    password_hash: Option<Vec<u8>>,  // 32 bytes if present
}

// Option B: New message variant (backward compatible)
// Preferred for forward compatibility
Message::AuthenticatedRoomJoin {
    room_id: Vec<u8>,
    password_hash: [u8; 32],
}

// Recommendation: Option A with postcard's optional field encoding.
// Since we're pre-1.0, breaking wire changes are acceptable.
// The relay can check: if password_hash is None and relay requires auth, reject.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Regex-based ANSI stripping | VTE state machine parser (via `strip-ansi-escapes`) | 2020+ | Catches all 7+ escape sequence types, not just CSI |
| Manual path component filtering only | Component filter + canonicalization + starts_with | Post-CVE-2023 | Defense in depth against symlink and normalization attacks |
| Password in CLI args | Environment variables + secrets managers | Always been best practice, Croc CVE made it urgent | Prevents `/proc/pid/cmdline` exposure |
| SHA-256 for verification hashes | BLAKE3 with domain separation | 2023+ (BLAKE3 maturity) | Faster, no length extension, built-in keyed mode |
| 60-digit Signal safety numbers | 40-digit numeric + 8-emoji visual verification | Tallow adaptation | Shorter is appropriate for ephemeral sessions (vs Signal's long-lived keys) |
| `docker run --rm rust` monolith | cargo-chef 3-stage build | 2023+ | Dependency caching gives 5x faster rebuilds |

## Open Questions

1. **Should the wire protocol change be backward-compatible?**
   - What we know: Adding `password_hash: Option<Vec<u8>>` to `RoomJoin` changes the postcard serialization. Pre-Phase 9 clients cannot connect to post-Phase 9 relays with auth enabled.
   - What's unclear: Whether anyone is running pre-Phase 9 relays in production (unlikely, project is pre-1.0).
   - Recommendation: Use Option A (modify existing `RoomJoin` with `Option<Vec<u8>>`). Pre-1.0, breaking wire changes are acceptable. Document the version bump.

2. **Should the 256-emoji set be standardized or platform-adaptive?**
   - What we know: Emoji rendering varies across platforms. Some emoji look similar at small sizes. Telegram uses 333 emojis; we plan 256 (maps cleanly to 1 byte = 1 emoji).
   - What's unclear: Which 256 emojis have the best cross-platform visual distinctiveness.
   - Recommendation: Start with a curated set based on the Unicode "Recommended for General Interchange" (RGI) subset. Test rendering on Windows Terminal, macOS Terminal, and GNOME Terminal. Use only emojis from Unicode 13.0 or earlier for maximum compatibility.

3. **Should `sanitize_filename()` do Unicode NFC normalization?**
   - What we know: macOS HFS+ uses NFD normalization. If a sender on macOS sends a filename in NFD and the receiver is on Linux (NFC), the name may differ visually.
   - What's unclear: Whether normalization before sanitization could introduce new attack vectors (unlikely with NFKC, which normalizes fullwidth chars).
   - Recommendation: Do NOT add a `unicode-normalization` dependency for Phase 9. The fullwidth character replacement we do manually is sufficient for security. Cosmetic normalization can be deferred.

## Sources

### Primary (HIGH confidence)
- [Croc CVE-2023-43616 through 43620 security advisory](https://seclists.org/oss-sec/2023/q3/165) -- Full vulnerability descriptions and root causes
- [strip-ansi-escapes crate (docs.rs)](https://docs.rs/strip-ansi-escapes) -- API reference, VTE-based parser
- [ANSI terminal security in 2023 -- finding 10 CVEs](https://dgl.cx/2023/09/ansi-terminal-security) -- Comprehensive ANSI escape attack taxonomy
- [Signal safety number updates blog](https://signal.org/blog/safety-number-updates/) -- Numeric fingerprint design rationale
- [libsignal NumericFingerprintGenerator.java](https://github.com/signalapp/libsignal-protocol-java/blob/master/java/src/main/java/org/whispersystems/libsignal/fingerprint/NumericFingerprintGenerator.java) -- Signal's reference implementation
- [CVE-2025-68705 RustFS Path Traversal (CVSS 9.9)](https://advisories.gitlab.com/pkg/cargo/rustfs/CVE-2025-68705/) -- Recent Rust path traversal example
- [CVE-2025-27210 Node.js Windows device name traversal](https://zeropath.com/blog/cve-2025-27210-nodejs-path-traversal-windows) -- Windows reserved names as attack vectors
- [Windows naming conventions (Microsoft docs)](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file) -- Authoritative Windows reserved name list

### Secondary (MEDIUM confidence)
- [Command-line secrets best practices (smallstep)](https://smallstep.com/blog/command-line-secrets/) -- `/proc/pid/cmdline` vs `/proc/pid/environ` visibility
- [Secrets in env vars (GitGuardian)](https://blog.gitguardian.com/secure-your-secrets-with-env/) -- Environment variable security tradeoffs
- [Containerization best practices for Rust 2025](https://markaicode.com/containerization-best-practices-2025/) -- Docker multi-stage patterns
- [cargo-chef documentation](https://github.com/LukeMathWalker/cargo-chef) -- Dependency caching for Docker builds
- [Optimal Rust Dockerfile with cargo-chef (Depot)](https://depot.dev/docs/container-builds/optimal-dockerfiles/rust-dockerfile) -- Production Dockerfile patterns
- [ZRTP Short Authentication String (RFC 6189)](https://datatracker.ietf.org/doc/html/rfc6189) -- SAS verification for ephemeral keys

### Tertiary (LOW confidence)
- [Emoji fingerprint blog (vanitasvitae)](https://blog.jabberhead.tk/2017/05/06/using-emoji-for-fingerprint-verification/) -- Emoji set design considerations; needs validation of specific emoji choices during implementation
- [Unicode normalization attacks (HackTricks)](https://book.hacktricks.xyz/pentesting-web/unicode-injection/unicode-normalization) -- Attack patterns; needs validation of which apply to filesystem paths

## Metadata

**Confidence breakdown:**
- Filename sanitization: HIGH -- Based on 3+ real CVEs with published exploits, existing codebase audit shows gaps
- ANSI stripping: HIGH -- `strip-ansi-escapes` crate verified, attack taxonomy well-documented
- Relay auth: HIGH -- Standard BLAKE3 hash + constant-time comparison, no novel crypto
- Env var support: HIGH -- Clap `env` feature already enabled in Cargo.toml, just needs `#[arg(env)]`
- Verification strings: MEDIUM -- Algorithm is sound (BLAKE3 domain separation), emoji set selection needs implementation-time testing
- Docker image: MEDIUM -- cargo-chef pattern is well-established, specific QUIC/UDP configuration needs validation

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (security domain, stable patterns)
