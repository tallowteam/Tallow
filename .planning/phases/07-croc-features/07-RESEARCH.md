# Phase 7: Croc-Like Features - Research

**Researched:** 2026-02-20
**Domain:** CLI file transfer UX, code-phrase-based transfers, package distribution
**Confidence:** HIGH (features verified against Croc source code and competitor analysis)

## Summary

Croc (schollz/croc) is the dominant open-source CLI file transfer tool with 28k+ GitHub stars. Its success stems from three pillars: zero-friction UX (install binary, run one command), code-phrase simplicity (receiver types one short phrase), and practical features (resume, multiple files, cross-platform). Tallow already has the harder foundations -- post-quantum crypto, QUIC transport, Tor integration -- but lacks the polish that makes Croc *beloved*. Phase 7 bridges that gap.

**What makes Croc viral:** The receive command is just `croc <code>` -- no subcommand, no flags. Installation is one line on every platform. The tool "just works" across OS boundaries. Users can transfer files to non-technical friends by saying "run this one command."

**What users complain about in Croc:** Security vulnerabilities (8 CVEs in 2023 including path traversal, ZIP extraction bypass, terminal escape injection), large file stalls (20GB+ transfers), relay sustainability ($40-50/month for 20TB bandwidth), and no post-quantum protection. These are exactly where Tallow is already stronger.

**Primary recommendation:** Implement Croc's 15 most-loved features while leveraging Tallow's security advantage. Focus on: text/pipe transfer, QR codes, custom codes, shorter default codes, --yes/--overwrite flags, clipboard auto-copy, --exclude patterns, relay password auth, and package manager distribution. Ship the "Croc killer" -- same simplicity, better security.

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `qr2term` | 0.3 | QR code rendering in terminal | Stupidly simple API: `qr2term::print_qr(data)`. Uses `qrcode` 0.14 + `crossterm` 0.28 internally. Croc displays QR codes; this is the Rust equivalent. |
| `arboard` | 3 | Cross-platform clipboard access | **Already in Cargo.toml.** By 1Password. Supports Windows, macOS, X11, Wayland. Croc auto-copies receive command to clipboard. |
| `ignore` | 0.4 | Gitignore-style pattern matching for --exclude | By BurntSushi (ripgrep author). 80M+ downloads. Handles `.gitignore` patterns, glob exclusions, directory walking. Croc has `--exclude` and `--git` flags. |

### Already Available (No New Dependencies)

| Library | Exists In | Purpose | Phase 7 Use |
|---------|-----------|---------|-------------|
| `std::io::IsTerminal` | stdlib (Rust 1.70+) | Detect if stdin is a pipe | Pipe support: `cat file | tallow send` |
| `dialoguer` | tallow/Cargo.toml | Interactive prompts | Receiver confirmation prompt, --yes bypass |
| `qrcode` | tallow/Cargo.toml (0.14) | QR code generation | Used by qr2term internally; already a dependency |
| `clap` | tallow/Cargo.toml (v4) | CLI argument parsing | New flags: --text, --code, --yes, --overwrite, --exclude, --qr |
| `indicatif` | tallow/Cargo.toml | Progress bars | Already used; no changes needed |
| `tokio` | workspace | Async runtime | Stdin reading for pipe support |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| `qr2term` | `qrcode` directly with custom renderer | qr2term wraps qrcode + crossterm rendering in 1 function call; no reason to hand-roll |
| `arboard` | `cli-clipboard` | arboard is already in Cargo.toml, maintained by 1Password, better Wayland support |
| `arboard` | `copypasta` | Alacritty's crate, more window-focused; arboard is already a dep |
| `ignore` | Hand-rolled glob matching | The `ignore` crate handles edge cases in gitignore patterns that take months to get right |

### Installation

```toml
# In crates/tallow/Cargo.toml [dependencies] -- ADD:
qr2term = "0.3"
ignore = "0.4"
# arboard 3 already present
# qrcode 0.14 already present
```

No workspace-level changes needed. All new deps are binary-crate-only.

## Architecture Patterns

### Recommended Changes by Crate

```
crates/tallow/src/
  cli.rs                 # Add new flags to SendArgs, ReceiveArgs, global Cli
  commands/
    send.rs              # Text mode, pipe detection, QR display, clipboard copy, exclude
    receive.rs           # Confirmation prompt, --yes, --overwrite, stdout mode
  output/
    qr.rs                # NEW: QR code display wrapper
    clipboard.rs         # NEW: Clipboard operations wrapper

crates/tallow-protocol/src/
  transfer/
    send.rs              # Text-as-file shim (virtual file from --text or stdin)
    manifest.rs          # Support text-only transfers (no real files)

crates/tallow-relay/src/
  auth.rs                # Password authentication (currently stub)
  config.rs              # Add password field
  main.rs                # Docker-friendly env var config
```

### Pattern 1: Text Transfer as Virtual File

**What:** Croc sends text via `croc send --text "hello"`. Rather than building a parallel text-transfer pipeline, treat text as a virtual in-memory file named `_tallow_text_` and run it through the existing file transfer path.

**When to use:** Text mode (`--text`) and pipe mode (stdin detected).

**Example:**
```rust
// In send.rs
use std::io::IsTerminal;

enum SendSource {
    Files(Vec<PathBuf>),
    Text(String),
    Stdin,
}

fn determine_source(args: &SendArgs) -> io::Result<SendSource> {
    if let Some(ref text) = args.text {
        return Ok(SendSource::Text(text.clone()));
    }
    if !std::io::stdin().is_terminal() && !args.ignore_stdin {
        // stdin is piped: read all input
        let mut buf = Vec::new();
        std::io::stdin().read_to_end(&mut buf)?;
        return Ok(SendSource::Text(String::from_utf8_lossy(&buf).into_owned()));
    }
    Ok(SendSource::Files(args.files.clone()))
}
```

### Pattern 2: Receiver Confirmation Gate

**What:** Croc shows file details and prompts "Accept N files (X MB)? (Y/n)" before any data transfers. With `--yes`, auto-accepts.

**When to use:** Always on receive, unless `--yes` is set.

**Example:**
```rust
// In receive.rs, after processing FileOffer
if !args.yes {
    println!("Incoming transfer from [fingerprint]:");
    for file in &manifest.files {
        println!("  {} ({})", file.path.display(), format_size(file.size));
    }
    let accept = dialoguer::Confirm::new()
        .with_prompt(format!("Accept {} files ({})? ", file_count, format_size(total_size)))
        .default(true)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))?;
    if !accept {
        // Send FileReject
        return Ok(());
    }
}
```

### Pattern 3: Custom Code Phrase with Validation

**What:** Croc allows `--code <phrase>` to set a custom code. The phrase is used directly for PAKE, so security depends on its entropy.

**When to use:** `--code` flag on send command.

**Example:**
```rust
// In send.rs
let code_phrase = if let Some(custom) = &args.code {
    if custom.len() < 4 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Custom code must be at least 4 characters",
        ));
    }
    tracing::warn!("Custom code phrase used -- security depends on phrase entropy");
    custom.clone()
} else {
    tallow_protocol::room::code::generate_code_phrase(args.words.unwrap_or(4))
};
```

### Pattern 4: File Exclusion with ignore crate

**What:** Croc supports `--exclude "node_modules,.venv"` and `--git` (respect .gitignore). The `ignore` crate provides both in one API.

**When to use:** Folder sends with `--exclude` or `--git`.

**Example:**
```rust
use ignore::WalkBuilder;

fn walk_with_exclusions(
    root: &Path,
    exclude: &[String],
    respect_gitignore: bool,
) -> Vec<PathBuf> {
    let mut builder = WalkBuilder::new(root);
    builder.git_ignore(respect_gitignore);
    for pattern in exclude {
        builder.add_custom_ignore_filename(""); // Use override patterns
        let mut overrides = ignore::overrides::OverrideBuilder::new(root);
        overrides.add(&format!("!{}", pattern)).ok();
        if let Ok(ov) = overrides.build() {
            builder.overrides(ov);
        }
    }
    builder.build()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map_or(false, |ft| ft.is_file()))
        .map(|e| e.into_path())
        .collect()
}
```

### Pattern 5: Relay Password Authentication

**What:** Croc relay accepts `--pass PASSWORD` and rejects unauthenticated clients. Environment variable `CROC_PASS` for Docker.

**When to use:** Self-hosted relay deployment.

**Example:**
```rust
// In relay config.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayConfig {
    // ... existing fields ...
    /// Relay password (empty = open relay)
    #[serde(default)]
    pub password: String,
}

// In relay auth.rs
use blake3;

/// Verify client password against relay password
pub fn verify_password(client_hash: &[u8; 32], relay_password: &str) -> bool {
    let expected = blake3::hash(relay_password.as_bytes());
    subtle::ConstantTimeEq::ct_eq(client_hash.as_slice(), expected.as_bytes().as_slice())
        .into()
}
```

### Anti-Patterns to Avoid

- **NEVER pass secrets via command-line arguments in production.** Croc CVE-2023-43620: secrets visible in process list. Use environment variables (`TALLOW_CODE`, `TALLOW_RELAY_PASS`) as the secure path; CLI args only for convenience in single-user systems.

- **NEVER trust filenames from the sender.** Croc CVE-2023-43616: path traversal via `../../.ssh/authorized_keys`. Tallow MUST sanitize all received paths: strip `..`, strip leading `/`, reject control characters, reject ANSI escape sequences.

- **NEVER expand globs on received filenames.** Croc CVE-2023-43618: `*` in filenames causes unexpected glob expansion. Treat all received names as literal strings.

- **NEVER derive room IDs that leak the code phrase.** Croc CVE-2023-43617: room name reveals information about the shared secret. Tallow already uses BLAKE3 hash -- this is correct, do not change.

- **NEVER render untrusted text in terminal without sanitization.** Croc CVE-2023-43619: terminal escape sequences in filenames can manipulate display or execute code. Strip all control characters (0x00-0x1F except \n, \t) and ANSI CSI sequences from any string displayed to the user.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code rendering | Custom unicode block renderer | `qr2term::print_qr()` | One function call. Handles unicode blocks, crossterm colors, terminal width detection. |
| Clipboard access | Platform-specific `#[cfg]` blocks | `arboard::Clipboard` (already dep) | Windows, macOS, X11, Wayland all handled. Wayland edge cases alone take weeks. |
| Gitignore pattern matching | Regex-based glob filter | `ignore` crate's `WalkBuilder` | Gitignore syntax has 20+ edge cases (negation, nested, directory-only). BurntSushi got it right. |
| Pipe detection | `libc::isatty()` or atty crate | `std::io::IsTerminal` (stdlib) | Stable since Rust 1.70. No external dep needed. Handles Windows console detection. |
| Terminal sanitization | Character-by-character filter | `strip_ansi_escapes` crate or simple regex | ANSI sequences are complex (CSI, OSC, etc.). A dedicated strip function prevents escape injection. |
| Filename sanitization | Ad-hoc path cleaning | Dedicated `sanitize_filename()` function | Path traversal is the #1 security bug in file transfer tools. Build once, test thoroughly, use everywhere. |

**Key insight:** Croc's 8 CVEs in 2023 all came from hand-rolling security-sensitive operations (filename handling, archive extraction, terminal output). Use battle-tested libraries and write comprehensive sanitization functions with property tests.

## Common Pitfalls

### Pitfall 1: Code Phrase Too Long for Casual Use

**What goes wrong:** Tallow currently generates 6-word code phrases (~77.5 bits entropy). Croc uses 4 bytes mnemonicoded into "NNNN-word-word-word" format (~32 bits). Users find 6 words tedious to communicate verbally.

**Why it happens:** Security-first mindset overweights entropy for ephemeral session codes that expire in seconds/minutes.

**How to avoid:** Default to 4 words (~51.7 bits from 7776-word EFF list) for casual use. Provide `--words N` flag for paranoid users. 4 words from EFF list is stronger than Croc's 32-bit code and sufficient for ephemeral sessions where the PAKE prevents offline brute-force.

**Warning signs:** Users complaining about typing long phrases, requesting shorter codes in issues.

### Pitfall 2: No Receiver Confirmation = Security Hole

**What goes wrong:** Current Tallow receive auto-accepts all transfers (the comment says "for v1; future: prompt user"). Without confirmation, a malicious sender on the same relay could overwrite files.

**Why it happens:** Deferred feature during v1 development.

**How to avoid:** Make confirmation the DEFAULT. Add `--yes` flag to skip. Show: filename(s), total size, sender fingerprint. This is both a UX and security feature.

**Warning signs:** Files appearing without user consent; users unaware of what they're receiving.

### Pitfall 3: Path Traversal in Received Filenames

**What goes wrong:** Croc CVE-2023-43616. A malicious sender sends a file with path `../../.ssh/authorized_keys`. Without sanitization, the receiver writes outside the output directory.

**Why it happens:** Trusting the sender's manifest paths.

**How to avoid:** Implement strict filename sanitization: (1) reject paths containing `..`, (2) strip leading `/` or `\`, (3) strip Windows drive letters, (4) reject control characters, (5) resolve final path and verify it's within output_dir. Property-test with proptest using adversarial paths.

**Warning signs:** Any `path.join()` on user-controlled input without verification.

### Pitfall 4: Stdin Pipe Hangs Without Proper Detection

**What goes wrong:** If pipe support is added but detection is wrong, the program hangs waiting for stdin when the user meant to send files.

**Why it happens:** Incorrect IsTerminal check, or forgetting `--ignore-stdin` flag for automation.

**How to avoid:** Use `std::io::stdin().is_terminal()` (stable Rust 1.70+). If NOT a terminal and no files specified, read stdin. If IS a terminal and no files specified, error with usage. Provide `--ignore-stdin` flag for edge cases.

**Warning signs:** CI pipelines or scripts hanging; users reporting "tallow hangs doing nothing."

### Pitfall 5: Clipboard Fails Silently on Headless Systems

**What goes wrong:** Clipboard copy crashes or errors on SSH sessions, Docker containers, CI, headless Linux without X11/Wayland.

**Why it happens:** `arboard` requires a display server to access clipboard.

**How to avoid:** Wrap clipboard operations in a try/catch. Log debug message on failure, never error. Provide `--no-clipboard` flag. Detect headless: if no DISPLAY and no WAYLAND_DISPLAY env vars on Linux, skip clipboard silently.

**Warning signs:** Error messages about X11/Wayland on servers.

### Pitfall 6: QR Code Display Breaks in Small Terminals

**What goes wrong:** QR codes need minimum terminal width. In narrow terminals (< 40 cols) or multiplexed terminals, the QR is garbled.

**Why it happens:** QR rendering assumes sufficient terminal width.

**How to avoid:** Check terminal width before rendering QR. If too narrow, print a message suggesting the user widen the terminal. Gate behind `--qr` flag (opt-in, not default) so it never surprises users.

**Warning signs:** Garbled output in tmux panes or small terminal windows.

### Pitfall 7: Relay Password Timing Attack

**What goes wrong:** Using `==` to compare relay passwords leaks information about the password through timing.

**Why it happens:** Default string comparison is not constant-time.

**How to avoid:** Hash passwords with BLAKE3 on both sides, compare hashes with `subtle::ConstantTimeEq`. This is standard Tallow practice (CLAUDE.md requires it) but must be applied to the relay auth path too.

**Warning signs:** Any `==` or `!=` on password/hash bytes outside tests.

## Code Examples

### QR Code Display

```rust
// In crates/tallow/src/output/qr.rs

/// Display a QR code in the terminal for the receive command
pub fn display_qr(data: &str) -> std::io::Result<()> {
    // Check terminal width (QR codes need ~40+ columns)
    let (width, _) = crossterm::terminal::size()
        .unwrap_or((80, 24));
    if width < 40 {
        tracing::debug!("Terminal too narrow ({} cols) for QR code display", width);
        return Ok(());
    }

    qr2term::print_qr(data)
        .map_err(|e| std::io::Error::other(format!("QR generation failed: {}", e)))
}
```

### Clipboard Auto-Copy

```rust
// In crates/tallow/src/output/clipboard.rs
use arboard::Clipboard;

/// Copy text to system clipboard, failing silently on headless systems
pub fn copy_to_clipboard(text: &str) {
    match Clipboard::new() {
        Ok(mut cb) => {
            if let Err(e) = cb.set_text(text.to_string()) {
                tracing::debug!("Clipboard copy failed: {}", e);
            }
        }
        Err(e) => {
            tracing::debug!("Clipboard unavailable: {}", e);
        }
    }
}
```

### Filename Sanitization (CRITICAL)

```rust
// In crates/tallow-protocol/src/transfer/receive.rs or a new sanitize module

/// Sanitize a filename received from an untrusted sender.
/// Prevents path traversal (CVE-2023-43616), control char injection (CVE-2023-43619),
/// and other filesystem attacks.
pub fn sanitize_filename(name: &str, output_dir: &Path) -> Result<PathBuf, TransferError> {
    // 1. Reject empty names
    if name.is_empty() {
        return Err(TransferError::InvalidFilename("empty filename".into()));
    }

    // 2. Replace path separators and strip dangerous components
    let cleaned: String = name
        .replace('\\', "/")
        .split('/')
        .filter(|component| {
            !component.is_empty()
                && *component != "."
                && *component != ".."
                && !component.starts_with("~")
        })
        .collect::<Vec<_>>()
        .join("/");

    // 3. Strip control characters and ANSI escape sequences
    let sanitized: String = cleaned
        .chars()
        .filter(|c| !c.is_control() || *c == '\t')
        .collect();

    // 4. Strip Windows drive letters (C:, D:, etc.)
    let sanitized = if sanitized.len() >= 2
        && sanitized.as_bytes()[0].is_ascii_alphabetic()
        && sanitized.as_bytes()[1] == b':'
    {
        &sanitized[2..]
    } else {
        &sanitized
    };

    // 5. Strip leading slashes
    let sanitized = sanitized.trim_start_matches('/');

    if sanitized.is_empty() {
        return Err(TransferError::InvalidFilename("sanitized to empty".into()));
    }

    // 6. Resolve and verify within output_dir
    let final_path = output_dir.join(sanitized);
    let canonical_output = output_dir.canonicalize().unwrap_or_else(|_| output_dir.to_path_buf());

    // Ensure the resolved path is within output_dir
    if !final_path.starts_with(&canonical_output) {
        return Err(TransferError::InvalidFilename(
            format!("path escapes output directory: {}", name),
        ));
    }

    Ok(final_path)
}
```

### Pipe/Stdin Detection and Reading

```rust
use std::io::{self, IsTerminal, Read};

/// Detect and read from stdin if piped
pub fn read_stdin_if_piped() -> io::Result<Option<Vec<u8>>> {
    if std::io::stdin().is_terminal() {
        return Ok(None); // Interactive terminal, not piped
    }

    let mut buf = Vec::new();
    std::io::stdin().read_to_end(&mut buf)?;

    if buf.is_empty() {
        return Ok(None);
    }

    Ok(Some(buf))
}
```

### Shorter Code Phrases (4-word default)

```rust
// Update crates/tallow-protocol/src/room/code.rs

/// Default number of words in a code phrase
/// 4 words from EFF 7776-word list = ~51.7 bits entropy
/// Sufficient for ephemeral PAKE sessions (no offline brute-force)
pub const DEFAULT_WORD_COUNT: usize = 4;
```

### Overwrite Protection

```rust
/// Check if file exists and handle overwrite policy
fn check_overwrite(path: &Path, overwrite: bool) -> io::Result<bool> {
    if !path.exists() {
        return Ok(true); // File doesn't exist, safe to write
    }

    if overwrite {
        return Ok(true); // --overwrite flag set
    }

    // Prompt user
    let prompt = format!(
        "'{}' already exists. Overwrite?",
        path.file_name().unwrap_or_default().to_string_lossy()
    );
    dialoguer::Confirm::new()
        .with_prompt(prompt)
        .default(false)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))
}
```

## Croc Complete Feature Matrix vs Tallow

| Croc Feature | Croc Flag | Tallow Status | Phase 7 Action |
|---|---|---|---|
| Send files | `croc send <files>` | DONE | -- |
| Send folders | `croc send <folder>` | DONE | -- |
| Receive by code | `croc <code>` | DONE (subcommand) | Consider allowing `tallow <code>` shorthand |
| Resume transfers | automatic | DONE | -- |
| Custom code phrase | `--code` / `-c` | MISSING | **ADD** `--code` flag to send |
| Send text | `--text` / `-t` | MISSING | **ADD** `--text` flag, virtual file path |
| QR code display | `--qr` | MISSING | **ADD** `--qr` flag using qr2term |
| Overwrite files | `--overwrite` | MISSING | **ADD** `--overwrite` flag, default=prompt |
| Auto-accept | `--yes` | MISSING | **ADD** `--yes` flag on receive |
| Pipe from stdin | `cat f \| croc send` | MISSING | **ADD** stdin pipe detection |
| Pipe to stdout | `croc --yes <code> > f` | MISSING | **ADD** stdout pipe mode |
| Exclude patterns | `--exclude` | MISSING | **ADD** `--exclude` with `ignore` crate |
| Respect .gitignore | `--git` | MISSING | **ADD** `--git` flag with `ignore` crate |
| Clipboard copy | automatic | MISSING | **ADD** auto-copy receive command to clipboard |
| No clipboard | `--disable-clipboard` | N/A | **ADD** `--no-clipboard` flag |
| Extended clipboard | `--extended-clipboard` | N/A | DEFER (niche) |
| Quiet mode | `--quiet` | DONE | -- |
| Receiver confirmation | automatic prompt | MISSING | **ADD** default prompt, bypassed by --yes |
| Upload throttle | `--throttleUpload` | MISSING | **ADD** `--throttle` flag |
| Zip before send | `--zip` | N/A | SKIP (Tallow uses streaming compression) |
| No compression | `--no-compress` | DONE (`--compress none`) | -- |
| Ask both sides | `--ask` | MISSING | **ADD** `--ask` for sender-side confirmation |
| Local only | `--local` | PARTIAL (mDNS) | -- |
| No local | `--no-local` | PARTIAL | -- |
| Remember settings | `--remember` | MISSING | DEFER to Phase 8 (config persistence) |
| Custom relay | `--relay` | DONE | -- |
| IPv6 relay | `--relay6` | MISSING | DEFER (QUIC handles dual-stack) |
| Relay password | `--pass` | MISSING | **ADD** relay auth with `--pass` / env var |
| Relay command | `croc relay` | SEPARATE BINARY | -- |
| Multiple transfer ports | `--transfers` | N/A | SKIP (QUIC multiplexes natively) |
| Encryption curve choice | `--curve` | N/A | SKIP (Tallow uses ML-KEM-1024+X25519 always) |
| Hash algorithm choice | `--hash` | N/A | SKIP (Tallow uses BLAKE3 always) |
| Built-in DNS | `--internal-dns` | DONE (DoH) | -- |
| SOCKS5 proxy | `--socks5` | DONE (`--proxy`) | -- |
| Classic/insecure mode | `--classic` | N/A | **NEVER** (Tallow is security-maximalist) |
| Multicast address | `--multicast` | DONE (mDNS) | -- |
| Sender IP broadcast | `--ip` | MISSING | DEFER (privacy concern) |
| Debug mode | `--debug` | DONE (`-v`) | -- |
| Docker relay | Docker image | MISSING | **ADD** Dockerfile for tallow-relay |
| Homebrew | `brew install croc` | MISSING | **ADD** Homebrew formula |
| Scoop | `scoop install croc` | MISSING | **ADD** Scoop manifest |
| Chocolatey | `choco install croc` | MISSING | **ADD** Chocolatey package |
| Winget | `winget install croc` | MISSING | **ADD** Winget manifest |
| Arch/pacman | `pacman -S croc` | MISSING | DEFER (requires AUR maintainer) |
| Nix | `nix-env -i croc` | MISSING | DEFER (requires nixpkgs PR) |
| Curl installer | `curl \| bash` | MISSING | **ADD** install script |
| Termux/Android | `pkg install croc` | MISSING | DEFER (needs ARM cross-compile) |

## Competitor Analysis

### Magic Wormhole (Python)

**Stars:** ~20k. **Language:** Python.

**Unique features Tallow should adopt:**
- Tab completion for code phrases on receive side (wormhole-william feature)
- Verification string display (`--verify`) for comparing session keys

**What Tallow already beats:**
- No resume support in Magic Wormhole
- No multiple file transfer (must zip manually)
- Python dependency hell vs single binary
- No post-quantum crypto

### wormhole-william (Go)

**Stars:** ~3k. **Language:** Go.

**Unique features:**
- Protocol-compatible with Python Magic Wormhole
- Cleaner Go API for embedding

**Lessons for Tallow:**
- Single binary distribution matters enormously for adoption
- Shell completion of code phrases is a delightful UX touch

### Portal (Rust)

**Stars:** ~1k. **Language:** Rust.

**Architecture similarity:**
- Uses SPAKE2 for key negotiation (Tallow uses CPace -- stronger)
- Uses ChaCha20Poly1305 (Tallow uses AES-256-GCM -- HW accelerated)

**Lessons for Tallow:**
- Being Rust is not enough -- Croc (Go) wins on distribution and simplicity
- The differentiator must be both security AND UX

## Croc Security Vulnerabilities (Lessons for Tallow)

Croc had 8 CVEs filed in September 2023 (CVE-2023-43616 through CVE-2023-43621, plus two unnumbered). All are avoidable:

| CVE | Type | Tallow Mitigation |
|-----|------|-------------------|
| CVE-2023-43616 | Path traversal via filenames | `sanitize_filename()` with canonicalization check |
| CVE-2023-43617 | Room name leaks shared secret | BLAKE3 hash already used -- no information leak |
| CVE-2023-43618 | IP addresses sent in cleartext | DoH already implemented; optional Tor |
| CVE-2023-43619 | Malicious files sent to receiver | Receiver confirmation prompt (Phase 7 addition) |
| CVE-2023-43620 | Secret visible in process list | Support `TALLOW_CODE` env var; warn on CLI args |
| Unnumbered | Terminal escape sequences in filenames | Strip control chars from all displayed strings |
| Unnumbered | Glob expansion on received filenames | Treat all filenames as literal; no glob expansion |
| Unnumbered | ZIP extraction bypass overwrite protection | Tallow doesn't use ZIP extraction; streaming chunks |

## Distribution Strategy

### Recommended Order (by impact)

1. **GitHub Releases with cargo-dist** -- Automated cross-platform binaries. Foundation for all other channels.
2. **Homebrew tap** -- macOS/Linux developers are the primary audience. `brew install tallow`
3. **Scoop bucket** -- Windows developers. `scoop install tallow`
4. **Curl installer script** -- Universal fallback. `curl -fsSL https://get.tallow.dev | sh`
5. **Docker image for relay** -- `docker run tallow-relay`
6. **Chocolatey/Winget** -- Broader Windows audience (submit after Scoop proves stability)

### cargo-dist Configuration

```toml
# In Cargo.toml or dist-workspace.toml
[workspace.metadata.dist]
cargo-dist-version = "0.27"
ci = "github"
installers = ["shell", "powershell", "homebrew", "msi"]
targets = [
    "aarch64-apple-darwin",
    "x86_64-apple-darwin",
    "x86_64-unknown-linux-gnu",
    "aarch64-unknown-linux-gnu",
    "x86_64-pc-windows-msvc",
]
install-path = "CARGO_HOME"

[workspace.metadata.dist.github-custom-runners]
aarch64-unknown-linux-gnu = "ubuntu-arm64-latest"
```

### Dockerfile for Relay

```dockerfile
FROM rust:1.80-slim AS builder
WORKDIR /build
COPY . .
RUN cargo build --release -p tallow-relay

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /build/target/release/tallow-relay /usr/local/bin/
EXPOSE 4433/udp
ENV TALLOW_RELAY_PASS=""
ENV TALLOW_RELAY_BIND="0.0.0.0:4433"
ENTRYPOINT ["tallow-relay"]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `atty` crate for terminal detection | `std::io::IsTerminal` (stdlib) | Rust 1.70 (June 2023) | No external dependency needed |
| Hand-rolled installers | `cargo-dist` automated releases | 2023-present | Cross-platform binaries + Homebrew + MSI in one CI step |
| `copypasta` for clipboard | `arboard` by 1Password | 2022-present | Better Wayland support, active maintenance |
| Custom QR renderers | `qr2term` wrapping `qrcode` | Stable since 2020 | One-liner API, handles terminal rendering edge cases |
| `glob` crate for file patterns | `ignore` crate (by BurntSushi) | 2017-present | Handles .gitignore, overrides, hidden files, symlinks |

## Open Questions

1. **Should `tallow <code>` work without the `receive` subcommand?**
   - What we know: Croc uses `croc <code>` (no subcommand). Clap v4 can detect this with default subcommand or positional argument parsing.
   - What's unclear: Whether changing CLI structure breaks existing scripts or confuses help output.
   - Recommendation: Add this as a convenience alias. Detect if first positional arg looks like a code phrase (contains dashes, matches word pattern) and route to receive. Keep `tallow receive` as the canonical form.

2. **How short can code phrases be while remaining secure?**
   - What we know: Croc uses ~32 bits (NNNN-word-word-word). Tallow's EFF 7776-word list gives ~12.9 bits per word. 3 words = ~38.7 bits, 4 words = ~51.7 bits.
   - What's unclear: With PAKE protecting against offline brute-force, the code only needs to survive the session window (seconds to minutes). What entropy is sufficient?
   - Recommendation: Default to 4 words (~51.7 bits). With PAKE and rate-limited relay, this is more than sufficient. Allow `--words 3` for extreme convenience or `--words 6` for paranoid users.

3. **Should text transfers preserve encoding?**
   - What we know: Croc sends text as-is. Pipe mode could receive binary.
   - What's unclear: How to handle non-UTF-8 binary data in --text mode vs pipe mode.
   - Recommendation: `--text` always treats input as UTF-8. Pipe mode preserves raw bytes. On receive, if content is valid UTF-8 and < 1MB, print to terminal; otherwise save to file.

4. **Relay password distribution for Docker deployments?**
   - What we know: Croc uses `CROC_PASS` env var. Docker users set `-e CROC_PASS=secret`.
   - What's unclear: Should relay password be transmitted in the QUIC handshake or after connection?
   - Recommendation: Send BLAKE3 hash of password in the initial `RoomJoin` message. Relay compares with constant-time eq. If mismatch, disconnect immediately.

## Sources

### Primary (HIGH confidence)
- [Croc GitHub README](https://github.com/schollz/croc) -- Full feature list, install methods, flags
- [Croc CLI source code (cli.go)](https://github.com/schollz/croc/blob/main/src/cli/cli.go) -- Every flag definition with defaults
- [Croc security audit (oss-sec)](https://seclists.org/oss-sec/2023/q3/165) -- 8 vulnerabilities with CVEs
- [qr2term docs](https://docs.rs/qr2term/latest/qr2term/) -- API reference, v0.3.3
- [arboard crate (1Password)](https://github.com/1Password/arboard) -- Clipboard API
- [ignore crate docs](https://docs.rs/ignore) -- WalkBuilder, gitignore patterns
- [std::io::IsTerminal](https://doc.rust-lang.org/beta/std/io/trait.IsTerminal.html) -- Stable since Rust 1.70

### Secondary (MEDIUM confidence)
- [Croc design blog post](https://schollz.com/tinker/croc6/) -- Architecture decisions, PAKE motivation
- [Hacker News discussion (2023)](https://news.ycombinator.com/item?id=37619151) -- User opinions, complaints, comparison points
- [cargo-dist documentation](https://axodotdev.github.io/cargo-dist/) -- Automated release infrastructure
- [wormhole-william GitHub](https://github.com/psanford/wormhole-william) -- Competitor features
- [magic-wormhole docs](https://magic-wormhole.readthedocs.io/) -- Competitor CLI design

### Tertiary (LOW confidence)
- Homebrew formula patterns for Rust -- Needs validation during implementation
- Scoop manifest format -- Needs validation during implementation
- Chocolatey/Winget submission process -- Needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All crates verified via official docs, arboard already in project
- Architecture: HIGH -- Patterns derived from Croc source + Tallow codebase analysis
- Pitfalls: HIGH -- 7/8 based on actual Croc CVEs with official vulnerability reports
- Distribution: MEDIUM -- cargo-dist approach verified, package manager submission details need validation

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable domain, slow-moving dependencies)
