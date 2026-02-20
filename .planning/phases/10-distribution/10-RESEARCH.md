# Phase 10: Distribution & Polish - Research

**Researched:** 2026-02-20
**Domain:** Release automation, package manager distribution, CLI UX polish
**Confidence:** HIGH

## Summary

Phase 10 makes Tallow installable everywhere and polishes the output formatting. The project already has a solid foundation: a working `release.yml` GitHub Actions workflow that cross-compiles for 5 targets and creates GitHub Releases, a functioning `tallow completions <shell>` command using `clap_complete`, indicatif progress bars with speed/ETA/bytes formatting, and owo-colors output helpers. The work divides into two clean halves: (1) distribution infrastructure that wraps the existing release workflow, and (2) UX polish that improves the already-working output layer.

The key decision for distribution is whether to adopt cargo-dist or keep the existing custom `release.yml`. The existing workflow is well-structured and already handles the hard parts (cross-compilation, checksums, multi-platform packaging). cargo-dist would replace it with an opinionated, auto-generated workflow but adds complexity for a workspace with two separate binary crates (`tallow` and `tallow-relay`). Since the release workflow already works, the recommendation is to **keep the custom workflow and layer package manager manifests on top** rather than migrating to cargo-dist. This avoids a yak-shave and the custom workflow already handles the two-binary problem cleanly.

For package managers, the high-impact channels are Homebrew (macOS/Linux developers), Scoop (Windows developers), and a curl installer script. Chocolatey and Winget are lower priority because their submission/moderation processes are heavyweight and the user base overlaps with Scoop. For UX polish, indicatif already provides `HumanBytes`, `HumanDuration`, and template variables for speed/ETA -- Tallow's progress bar template already uses `{bytes}`, `{total_bytes}`, `{bytes_per_sec}`, and `{eta}`. The remaining polish work is applying human-readable formatting to the non-progress-bar output (file size in offer messages, transfer summaries) and improving colored output consistency.

**Primary recommendation:** Layer Homebrew tap + Scoop bucket + curl installer on top of the existing release workflow. Polish output with indicatif's built-in formatters. Do NOT migrate to cargo-dist -- the existing workflow works and handles the two-binary workspace correctly.

## Standard Stack

### Core (Already Available -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `indicatif` | 0.17 | Progress bars, `HumanBytes`, `HumanDuration`, `HumanCount` | Already in Cargo.toml. Provides human-readable formatting for bytes, durations, counts. Template engine handles speed/ETA in progress bars. |
| `clap_complete` | 4 | Shell completion generation (bash, zsh, fish, PowerShell) | Already in Cargo.toml. The `tallow completions <shell>` command already works correctly. |
| `clap_mangen` | 0.2 | Man page generation from clap command tree | Already in Cargo.toml. Can generate man pages at build time or via subcommand. |
| `owo-colors` | 4 | Colored terminal output with NO_COLOR support | Already in Cargo.toml. Zero-alloc, no_std compatible, respects NO_COLOR convention. |
| `clap` | 4 | CLI framework (derive API) | Already in Cargo.toml. Provides version info, help formatting, argument parsing. |

### Supporting (No New Dependencies Needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crossterm` | (via ratatui) | Terminal size detection for QR code width check | Already a transitive dep. Use `crossterm::terminal::size()` for terminal width queries. |
| `serde_json` | 1 | JSON output formatting for `--json` mode | Already in workspace. Used in send/receive for structured JSON events. |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Keep custom release.yml | cargo-dist | Custom workflow already works for 5 targets + 2 binaries. cargo-dist would require migration, generates opaque YAML, and has workspace complexity with two binary crates. Not worth the migration cost. |
| `indicatif::HumanBytes` | `humansize` crate | indicatif is already a dependency and provides the same formatting. Adding humansize would be redundant. |
| `indicatif::HumanBytes` | `bytesize` crate | Same reason -- indicatif already provides this. |
| Manual Homebrew formula | cargo-dist homebrew installer | cargo-dist generates formulas automatically but couples you to the cargo-dist release workflow. A manual formula is trivial (30 lines of Ruby) and more flexible. |

## Architecture Patterns

### Recommended Project Structure

```
.github/
  workflows/
    ci.yml                    # EXISTING - no changes needed
    release.yml               # EXISTING - enhance with completions/manpage generation
homebrew/
  Formula/
    tallow.rb                 # Homebrew formula (pre-built binaries from GitHub Releases)
scoop/
  tallow.json                 # Scoop manifest (pre-built Windows binaries)
scripts/
  install.sh                  # Curl installer script for Unix
crates/tallow/src/
  output/
    format.rs                 # NEW: human-readable formatting helpers
    color.rs                  # EXISTING: enhance with additional styled output
    progress.rs               # EXISTING: already has speed/ETA/bytes
  commands/
    completions.rs            # EXISTING: already works, verify output
```

### Pattern 1: Human-Readable File Size Formatting

**What:** Use indicatif's `HumanBytes` wrapper to format all byte counts shown to users outside of progress bars.

**When to use:** Any user-facing output that shows file sizes -- transfer summaries, file offers, completion messages.

**Example:**
```rust
use indicatif::HumanBytes;

// In send.rs -- transfer prepared message
println!(
    "Prepared {} file(s), {} in {} chunks",
    file_count,
    HumanBytes(total_size),  // "1.43 MiB" instead of "1500000"
    total_chunks,
);

// In receive.rs -- incoming transfer display
println!("Incoming transfer:");
println!(
    "  {} file(s), {} in {} chunks",
    file_count,
    HumanBytes(total_size),
    total_chunks,
);
for (name, size) in filenames.iter().zip(file_sizes.iter()) {
    println!("  - {} ({})", name, HumanBytes(*size));
}

// In transfer complete message
output::color::success(&format!(
    "Transfer complete: {} file(s), {}",
    written_files.len(),
    HumanBytes(total_size),
));
```

### Pattern 2: Enhanced Transfer Speed Display

**What:** The existing progress bar template already includes `{bytes_per_sec}` and `{eta}`. These work correctly with indicatif. The pattern here is ensuring they display in all transfer modes (not just during chunk transfer).

**When to use:** Already applied in `TransferProgressBar::new()`.

**Example:**
```rust
// EXISTING -- already correct in output/progress.rs
ProgressStyle::default_bar()
    .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({bytes_per_sec}, {eta})")
    // Output: ">> [00:03] [========>                       ] 15.2 MiB/128.0 MiB (5.07 MiB/s, 22s)"
```

### Pattern 3: Multiple File Summary Before Transfer

**What:** Show "3 files (12.5 MB total)" summary with per-file sizes before starting a transfer.

**When to use:** Both sender (after prepare) and receiver (after file offer).

**Example:**
```rust
use indicatif::HumanBytes;

/// Format a file transfer summary for display
fn format_transfer_summary(files: &[(String, u64)]) -> String {
    let total: u64 = files.iter().map(|(_, s)| s).sum();
    if files.len() == 1 {
        format!("{} ({})", files[0].0, HumanBytes(files[0].1))
    } else {
        format!("{} files ({} total)", files.len(), HumanBytes(total))
    }
}

/// Display detailed file listing with sizes
fn display_file_listing(files: &[(String, u64)]) {
    let total: u64 = files.iter().map(|(_, s)| s).sum();
    println!("  {} file(s), {} total:", files.len(), HumanBytes(total));
    for (name, size) in files {
        println!("    {} ({})", name, HumanBytes(*size));
    }
}
```

### Pattern 4: Homebrew Formula (Pre-built Binaries)

**What:** A Homebrew formula that downloads pre-built binaries from GitHub Releases, selecting the correct archive for the user's platform/architecture.

**When to use:** After the release workflow produces tagged GitHub Releases with archives.

**Example:**
```ruby
# homebrew/Formula/tallow.rb
class Tallow < Formula
  desc "The most secure peer-to-peer file transfer CLI tool"
  homepage "https://github.com/tallowteam/tallow"
  version "0.1.0"
  license "AGPL-3.0-or-later"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_SHA256"
    else
      url "https://github.com/tallowteam/tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_SHA256"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tallowteam/tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_SHA256"
    else
      url "https://github.com/tallowteam/tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_SHA256"
    end
  end

  def install
    bin.install "tallow"
    bin.install "tallow-relay"

    # Install shell completions
    generate_completions_from_executable(bin/"tallow", "completions")

    # Install man pages if present
    man1.install Dir["*.1"] if Dir["*.1"].any?
  end

  test do
    assert_match "tallow #{version}", shell_output("#{bin}/tallow version")
  end
end
```

### Pattern 5: Scoop Manifest

**What:** A JSON manifest for the Scoop package manager (Windows) that downloads the pre-built Windows binary from GitHub Releases.

**When to use:** After release workflow produces Windows zip archive.

**Example:**
```json
{
    "version": "0.1.0",
    "description": "The most secure peer-to-peer file transfer CLI tool",
    "homepage": "https://github.com/tallowteam/tallow",
    "license": "AGPL-3.0-or-later",
    "architecture": {
        "64bit": {
            "url": "https://github.com/tallowteam/tallow/releases/download/v0.1.0/tallow-v0.1.0-x86_64-pc-windows-msvc.zip",
            "hash": "PLACEHOLDER_SHA256"
        }
    },
    "bin": ["tallow.exe", "tallow-relay.exe"],
    "checkver": {
        "github": "https://github.com/tallowteam/tallow"
    },
    "autoupdate": {
        "architecture": {
            "64bit": {
                "url": "https://github.com/tallowteam/tallow/releases/download/v$version/tallow-v$version-x86_64-pc-windows-msvc.zip"
            }
        }
    }
}
```

### Pattern 6: Curl Installer Script

**What:** A shell script that detects OS/arch, downloads the correct binary from GitHub Releases, and installs to `/usr/local/bin` or `~/.local/bin`.

**When to use:** For users who don't have a package manager or want a quick install.

**Example:**
```bash
#!/bin/sh
# install.sh -- Install tallow
set -eu

REPO="tallowteam/tallow"
INSTALL_DIR="${TALLOW_INSTALL_DIR:-/usr/local/bin}"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
    linux)  PLATFORM="unknown-linux-gnu" ;;
    darwin) PLATFORM="apple-darwin" ;;
    *)      echo "Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
    x86_64|amd64) ARCH="x86_64" ;;
    aarch64|arm64) ARCH="aarch64" ;;
    *)      echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Get latest version from GitHub API
VERSION=$(curl -sSf "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"v?([^"]+)".*/\1/')

FILENAME="tallow-v${VERSION}-${ARCH}-${PLATFORM}.tar.gz"
URL="https://github.com/$REPO/releases/download/v${VERSION}/${FILENAME}"

echo "Installing tallow v${VERSION} for ${ARCH}-${PLATFORM}..."

# Download and extract
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

curl -sSfL "$URL" -o "$TMPDIR/$FILENAME"
tar xzf "$TMPDIR/$FILENAME" -C "$TMPDIR"

# Install
if [ -w "$INSTALL_DIR" ]; then
    cp "$TMPDIR/tallow" "$INSTALL_DIR/"
    cp "$TMPDIR/tallow-relay" "$INSTALL_DIR/" 2>/dev/null || true
else
    sudo cp "$TMPDIR/tallow" "$INSTALL_DIR/"
    sudo cp "$TMPDIR/tallow-relay" "$INSTALL_DIR/" 2>/dev/null || true
fi

echo "tallow v${VERSION} installed to $INSTALL_DIR"
echo "Run 'tallow --help' to get started"
```

### Pattern 7: Enhanced Colored Output

**What:** Improve the existing `color.rs` module with additional semantic output helpers for transfer-specific messages.

**When to use:** All user-facing CLI output.

**Example:**
```rust
use indicatif::HumanBytes;
use owo_colors::OwoColorize;

/// Print a transfer summary line (file count + total size)
pub fn transfer_summary(file_count: usize, total_bytes: u64) {
    if color_enabled() {
        println!(
            "{} {} ({} total)",
            ">>".cyan().bold(),
            format!("{} file(s)", file_count).bold(),
            HumanBytes(total_bytes),
        );
    } else {
        println!(
            ">> {} file(s) ({} total)",
            file_count,
            HumanBytes(total_bytes),
        );
    }
}

/// Print a file listing entry with size
pub fn file_entry(name: &str, size: u64) {
    if color_enabled() {
        println!("   {} {}", name.dimmed(), format!("({})", HumanBytes(size)).dimmed());
    } else {
        println!("   {} ({})", name, HumanBytes(size));
    }
}

/// Print transfer completion with speed summary
pub fn transfer_complete(total_bytes: u64, duration: std::time::Duration) {
    let speed = if duration.as_secs_f64() > 0.0 {
        total_bytes as f64 / duration.as_secs_f64()
    } else {
        0.0
    };
    if color_enabled() {
        println!(
            "{} Transfer complete: {} at {}/s",
            "OK:".green().bold(),
            HumanBytes(total_bytes),
            HumanBytes(speed as u64),
        );
    } else {
        println!(
            "OK: Transfer complete: {} at {}/s",
            HumanBytes(total_bytes),
            HumanBytes(speed as u64),
        );
    }
}
```

### Pattern 8: Shell Completion Wiring in Release Workflow

**What:** Generate shell completion scripts during the release build and include them in the release archives.

**When to use:** During release packaging in GitHub Actions.

**Example (addition to release.yml):**
```yaml
- name: Generate shell completions
  if: matrix.archive == 'tar.gz'
  run: |
    mkdir -p dist/completions
    ./target/${{ matrix.target }}/release/tallow completions bash > dist/completions/tallow.bash
    ./target/${{ matrix.target }}/release/tallow completions zsh > dist/completions/_tallow
    ./target/${{ matrix.target }}/release/tallow completions fish > dist/completions/tallow.fish

- name: Generate shell completions (Windows)
  if: matrix.archive == 'zip'
  shell: pwsh
  run: |
    New-Item -ItemType Directory -Force -Path dist/completions
    & ./target/${{ matrix.target }}/release/tallow.exe completions powershell > dist/completions/_tallow.ps1
```

### Anti-Patterns to Avoid

- **DO NOT migrate to cargo-dist when a working release.yml exists.** cargo-dist generates opaque, auto-maintained CI YAML that's harder to debug. The existing workflow handles two binary crates cleanly and is easy to understand.

- **DO NOT add new crate dependencies for formatting.** indicatif already provides `HumanBytes`, `HumanDuration`, `HumanCount`, and `DecimalBytes`. Adding `humansize`, `bytesize`, or `human-repr` is redundant.

- **DO NOT submit to Chocolatey/Winget as a first step.** Both require moderation queues (Chocolatey: weeks of review; Winget: automated + manual review). Start with Scoop (self-hosted bucket, instant availability) and submit to Chocolatey/Winget after the tool is stable with multiple releases.

- **DO NOT generate completions at build time in build.rs.** The `tallow completions <shell>` subcommand already works at runtime. Generate during CI release packaging instead -- this avoids build complexity and ensures completions match the actual binary.

- **DO NOT hardcode version numbers in package manifests.** Use template variables or autoupdate mechanisms (Scoop's `checkver` + `autoupdate`, Homebrew's version interpolation) so manifests update with releases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Human-readable byte formatting | Custom `format_size()` function | `indicatif::HumanBytes` | Already a dependency. Handles B/KiB/MiB/GiB/TiB/PiB. Uses binary (IEC) units. |
| Human-readable duration | Custom duration formatter | `indicatif::HumanDuration` | Already a dependency. Formats `Duration` as "3s", "2m 5s", etc. |
| Shell completion scripts | Custom completion scripts per shell | `clap_complete::generate()` via `tallow completions <shell>` | Already implemented and working. Generates correct completions for bash, zsh, fish, PowerShell from the clap command tree. |
| Man page generation | Hand-written roff files | `clap_mangen` (already a dependency) | Generates man pages directly from the clap `Command` structure. Already in Cargo.toml. |
| Homebrew formula CI | Manual SHA256 computation + formula editing per release | `checkver`/`autoupdate` pattern or CI step | Compute checksums in release CI and update formula automatically. |
| Cross-platform release builds | Docker-based cross compilation | GitHub Actions matrix with native runners + `cross` for ARM Linux | The existing release.yml already does this correctly. |
| Windows installer (MSI) | WiX manual setup | Defer entirely | MSI installers are complex. Scoop and the zip download cover Windows users. Not worth the effort for v0.1. |

**Key insight:** The project already has 90% of the infrastructure for this phase. The progress bar already shows speed and ETA. Shell completions already work. The release workflow already builds for 5 targets. This phase is about connecting existing pieces and adding the distribution layer.

## Common Pitfalls

### Pitfall 1: SHA256 Checksums Drift Between Release and Formula

**What goes wrong:** The Homebrew formula and Scoop manifest contain SHA256 hashes of release archives. If the release workflow changes archive contents (even whitespace or metadata), hashes change and installs fail.

**Why it happens:** Release archives are non-reproducible by default. File ordering, timestamps, and compression parameters can vary between builds.

**How to avoid:** Generate checksums in the release workflow (already done -- `sha256sum`) and use a CI step or script that updates formula/manifest hashes automatically after a release. Alternatively, use a release-triggered workflow that reads the `.sha256` files and updates the tap repo.

**Warning signs:** `brew install` or `scoop install` failing with hash mismatch errors.

### Pitfall 2: Cross-Compilation Failures for ARM Linux

**What goes wrong:** The release workflow builds for `aarch64-unknown-linux-gnu` using `gcc-aarch64-linux-gnu` on x86_64 Ubuntu. OpenSSL and other C dependencies can fail to cross-compile.

**Why it happens:** Tallow uses `quinn` (QUIC) which depends on `rustls`, which is pure Rust. However, other transitive dependencies may link to C libraries. The `ring` crate (used by rustls) does native compilation with C and assembly.

**How to avoid:** The existing workflow already installs `gcc-aarch64-linux-gnu`. Test cross-compilation locally with `cross` tool before relying on CI. If `ring` fails on ARM cross-compile, the `houseabsolute/actions-rust-cross` GitHub Action provides a Docker-based alternative.

**Warning signs:** CI failures only on the `aarch64-unknown-linux-gnu` target with linker errors.

### Pitfall 3: Homebrew Formula Fails on macOS Due to Missing Dependencies

**What goes wrong:** If the formula downloads a pre-built binary that was compiled on Ubuntu (dynamically linked to glibc), it won't run on macOS.

**Why it happens:** Mixing up platform-specific URLs in the formula's `on_macos` / `on_linux` blocks.

**How to avoid:** Use the formula pattern with explicit `on_macos { if Hardware::CPU.arm? ... else ... }` and `on_linux { if Hardware::CPU.arm? ... else ... }` blocks. Each block points to the correct target triple archive. Test on both platforms.

**Warning signs:** "cannot execute binary file" or dynamic library not found errors after `brew install`.

### Pitfall 4: Scoop Autoupdate Regex Mismatch

**What goes wrong:** Scoop's `checkver` mechanism uses regex to extract version numbers from GitHub releases. If the tag format changes (e.g., from `v0.1.0` to `0.1.0`), autoupdate breaks.

**Why it happens:** Inconsistent tag naming conventions.

**How to avoid:** Lock tag format to `v{MAJOR}.{MINOR}.{PATCH}` (the existing release.yml already triggers on `v*` tags). Use `"checkver": { "github": "https://github.com/tallowteam/tallow" }` which matches the standard `\/releases\/tag\/(?:v|V)?([\d.]+)` pattern.

**Warning signs:** Scoop reporting the package is outdated even after a new release.

### Pitfall 5: Curl Installer Script Fails on Minimal Systems

**What goes wrong:** The install script assumes `curl`, `tar`, `grep`, `sed`, and `mktemp` are available. Alpine Linux (Docker) uses BusyBox with different flags. macOS has BSD versions of tools.

**Why it happens:** Assuming GNU coreutils everywhere.

**How to avoid:** Use POSIX-compliant shell constructs. Avoid GNU-specific flags (`--strip-components` varies). Test on Ubuntu, Alpine, macOS, and FreeBSD. Provide clear error messages when required tools are missing.

**Warning signs:** Installer failing in Docker containers or CI environments.

### Pitfall 6: `HumanBytes` Uses Binary Units (KiB, MiB) Not Decimal (KB, MB)

**What goes wrong:** `indicatif::HumanBytes` formats using IEC binary units (1 KiB = 1024 bytes), not SI decimal units (1 KB = 1000 bytes). Users familiar with macOS Finder or Windows Explorer (which use decimal) may be confused.

**Why it happens:** indicatif follows the IEC standard for binary prefixes.

**How to avoid:** This is actually correct for a developer tool -- most CLI tools use binary units. If decimal is needed, use `indicatif::DecimalBytes` instead. Document the choice. Stay consistent throughout the entire CLI (don't mix KiB in one place and KB in another).

**Warning signs:** User reports that file sizes don't match what their OS shows.

### Pitfall 7: Release Workflow Doesn't Generate Completions for All Shells

**What goes wrong:** Completions are generated by running the built binary, but cross-compiled ARM binaries can't run on x86_64 CI runners.

**Why it happens:** Shell completions require executing the binary to generate them. Cross-compiled binaries for a different architecture can't be executed natively.

**How to avoid:** Generate completions from the native platform build (x86_64-unknown-linux-gnu or x86_64-apple-darwin) and include the same completions in all archives. Shell completions are platform-independent -- the same bash/zsh/fish/powershell scripts work everywhere.

**Warning signs:** Missing completion files in ARM Linux or ARM macOS archives.

## Code Examples

### Human-Readable Formatting Module

```rust
// crates/tallow/src/output/format.rs

use indicatif::{HumanBytes, HumanDuration};
use std::time::Duration;

/// Format bytes for human-readable display (IEC binary units)
/// Examples: "15 B", "1.46 KiB", "1.43 MiB", "1.40 GiB"
pub fn format_bytes(bytes: u64) -> String {
    format!("{}", HumanBytes(bytes))
}

/// Format duration for human-readable display
/// Examples: "3s", "2m 5s", "1h 30m"
pub fn format_duration(duration: Duration) -> String {
    format!("{}", HumanDuration(duration))
}

/// Format transfer speed (bytes per second)
pub fn format_speed(bytes: u64, duration: Duration) -> String {
    let secs = duration.as_secs_f64();
    if secs <= 0.0 {
        return "-- B/s".to_string();
    }
    let bps = bytes as f64 / secs;
    format!("{}/s", HumanBytes(bps as u64))
}

/// Format a file listing for display before transfer
pub fn format_file_listing(files: &[(String, u64)]) -> String {
    let total: u64 = files.iter().map(|(_, s)| s).sum();
    let mut out = String::new();
    if files.len() == 1 {
        out.push_str(&format!("  {} ({})\n", files[0].0, HumanBytes(files[0].1)));
    } else {
        out.push_str(&format!(
            "  {} file(s), {} total:\n",
            files.len(),
            HumanBytes(total)
        ));
        for (name, size) in files {
            out.push_str(&format!("    {} ({})\n", name, HumanBytes(*size)));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(1024), "1.00 KiB");
        assert_eq!(format_bytes(1_048_576), "1.00 MiB");
        assert_eq!(format_bytes(1_258_291), "1.20 MiB");
    }

    #[test]
    fn test_format_speed() {
        let dur = Duration::from_secs(2);
        let result = format_speed(10_485_760, dur);
        assert!(result.contains("MiB/s"));
    }
}
```

### Enhanced Send Command Output

```rust
// In send.rs, replace raw byte count with human-readable format
use crate::output::format;
use indicatif::HumanBytes;

// BEFORE (current):
// println!("Prepared {} file(s), {} bytes in {} chunks", file_count, total_size, total_chunks);

// AFTER:
if json {
    println!(
        "{}",
        serde_json::json!({
            "event": "transfer_prepared",
            "total_files": file_count,
            "total_bytes": total_size,  // Keep raw bytes in JSON
            "total_chunks": total_chunks,
        })
    );
} else {
    output::color::info(&format!(
        "Prepared {} file(s), {} in {} chunks",
        file_count,
        HumanBytes(total_size),
        total_chunks,
    ));
}

// Transfer complete:
// BEFORE: "Transfer complete: {} bytes in {} chunks"
// AFTER:
output::color::success(&format!(
    "Transfer complete: {} in {} chunks",
    HumanBytes(total_size),
    total_chunks,
));
```

### Enhanced Receive Command Output

```rust
// In receive.rs, replace raw byte display with human-readable
use indicatif::HumanBytes;

// BEFORE:
// println!("  {} file(s), {} bytes in {} chunks", file_count, total_size, total_chunks);

// AFTER:
println!("Incoming transfer:");
println!(
    "  {} file(s), {} in {} chunks",
    file_count,
    HumanBytes(total_size),
    total_chunks,
);
// Per-file sizes (requires manifest to expose per-file sizes):
for file_info in &manifest.files {
    println!(
        "  - {} ({})",
        file_info.path.display(),
        HumanBytes(file_info.size),
    );
}

// Transfer complete:
output::color::success(&format!(
    "Transfer complete: {} file(s), {}",
    written_files.len(),
    HumanBytes(total_size),
));
```

### Release Workflow Enhancement (Completions + Man Pages)

```yaml
# Addition to .github/workflows/release.yml build job
# Add after "Build relay binary" step, only for native (non-cross) builds

- name: Generate shell completions and man pages
  if: matrix.target == 'x86_64-unknown-linux-gnu'
  run: |
    mkdir -p dist/completions dist/man
    ./target/${{ matrix.target }}/release/tallow completions bash > dist/completions/tallow.bash
    ./target/${{ matrix.target }}/release/tallow completions zsh > dist/completions/_tallow
    ./target/${{ matrix.target }}/release/tallow completions fish > dist/completions/tallow.fish
    ./target/${{ matrix.target }}/release/tallow completions powershell > dist/completions/_tallow.ps1

# Upload completions as a separate artifact
- name: Upload completions
  if: matrix.target == 'x86_64-unknown-linux-gnu'
  uses: actions/upload-artifact@v4
  with:
    name: tallow-completions
    path: dist/completions/
```

### Homebrew Tap Repository Setup

```bash
# Create the tap repository (one-time setup)
# Repository name MUST be homebrew-tap for `brew tap tallowteam/tap` to work

# 1. Create repo: github.com/tallowteam/homebrew-tap
# 2. Add Formula/tallow.rb (see Pattern 4 above)
# 3. Users install with:
#    brew tap tallowteam/tap
#    brew install tallow
# Or directly:
#    brew install tallowteam/tap/tallow
```

### Scoop Bucket Repository Setup

```bash
# Create the bucket repository (one-time setup)
# Repository name should be scoop-tallow or scoop-bucket

# 1. Create repo: github.com/tallowteam/scoop-tallow
# 2. Add tallow.json (see Pattern 5 above)
# 3. Users install with:
#    scoop bucket add tallow https://github.com/tallowteam/scoop-tallow
#    scoop install tallow
```

### Smart Error Messages (Context-Aware Guidance)

```rust
// In a new module or enhanced error handling
use owo_colors::OwoColorize;

/// Provide context-aware error guidance for common failures
pub fn diagnose_error(err: &std::io::Error) -> Option<String> {
    let msg = err.to_string();

    if msg.contains("Connection refused") || msg.contains("connection refused") {
        return Some(
            "The relay server may be down or unreachable. Try:\n  \
             1. Check your internet connection\n  \
             2. Try a different relay: tallow send --relay <address> <file>\n  \
             3. Run 'tallow doctor' to diagnose".to_string()
        );
    }

    if msg.contains("Address already in use") {
        return Some(
            "Another instance of tallow or tallow-relay may be running.\n  \
             Check with: lsof -i :4433 (Unix) or netstat -an | findstr 4433 (Windows)".to_string()
        );
    }

    if msg.contains("Permission denied") || msg.contains("permission denied") {
        return Some(
            "Permission denied. Try:\n  \
             1. Check file/directory permissions\n  \
             2. Specify a different output directory: tallow receive -o ~/Downloads <code>".to_string()
        );
    }

    if msg.contains("No such file or directory") {
        return Some(
            "File or directory not found. Verify the path exists and is spelled correctly.".to_string()
        );
    }

    if msg.contains("timed out") || msg.contains("Timed out") {
        return Some(
            "Connection timed out. The peer may not be connected yet, or the relay may be slow.\n  \
             Try again, or check 'tallow doctor' for connectivity issues.".to_string()
        );
    }

    None
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `humansize` crate for byte formatting | `indicatif::HumanBytes` (built-in) | indicatif 0.17+ | No extra dependency for human-readable bytes |
| Custom release workflows per project | cargo-dist for standardized releases | 2023-present | Simpler setup, but less flexible for multi-binary workspaces |
| Build from source in Homebrew formula | Pre-built binary formulas with platform detection | Standard practice | Faster install (no Rust toolchain needed), reliable builds |
| `atty` crate for terminal detection | `std::io::IsTerminal` (stdlib) | Rust 1.70 (June 2023) | No external dep; handles Windows console |
| Separate installer scripts per platform | cargo-dist shell/powershell installers | 2023-present | Standardized, but Tallow's custom script is fine too |

**Deprecated/outdated:**
- `humansize` crate: Still works but unnecessary when indicatif is already a dependency
- `atty` crate: Superseded by `std::io::IsTerminal` in Rust 1.70+
- `clap_generate`: Renamed to `clap_complete` in clap v4

## Open Questions

1. **Should the Homebrew formula build from source or use pre-built binaries?**
   - What we know: Pre-built binaries install faster and don't require Rust toolchain. Building from source is more "Homebrew native" and allows bottles.
   - What's unclear: Whether the release workflow's binaries are reproducible enough for Homebrew's expectations. Whether post-quantum crypto crate compilation issues arise.
   - Recommendation: Use pre-built binaries from GitHub Releases. This is simpler, faster to install, and avoids ML-KEM compilation complexity on user machines. Many Rust projects (bat, fd, ripgrep) are in homebrew-core building from source, but a custom tap with pre-built binaries is fine for a v0.1 project.

2. **Should both `tallow` and `tallow-relay` be in the same package or separate?**
   - What we know: The release workflow builds both binaries. Most users only need `tallow`. Relay operators need `tallow-relay`.
   - What's unclear: Whether package managers handle optional binaries well.
   - Recommendation: Ship both in the same package for now. The relay binary is small (same codebase, different entry point). Separation can happen later if relay gets its own version cadence.

3. **When should Chocolatey and Winget submissions happen?**
   - What we know: Both require moderation review. Chocolatey takes weeks for new packages. Winget has automated validation + manual review.
   - What's unclear: Whether the project is stable enough for submission review processes.
   - Recommendation: Defer to after v0.2.0 or later. Start with Scoop (self-hosted, instant). Submit to Chocolatey/Winget after 2-3 successful releases establish stability. Document the submission process now for future execution.

4. **Should the release workflow include MUSL (fully static) Linux builds?**
   - What we know: MUSL binaries are fully static and run on any Linux (including Alpine Docker). The current workflow builds against glibc.
   - What's unclear: Whether `ring` (rustls dependency) compiles cleanly with MUSL. MUSL builds can be slower at runtime due to memory allocator differences.
   - Recommendation: Add `x86_64-unknown-linux-musl` as an additional target in a follow-up. Not critical for v0.1 since glibc covers Ubuntu/Debian/Fedora/Arch.

## Sources

### Primary (HIGH confidence)
- [indicatif::HumanBytes docs](https://docs.rs/indicatif/latest/indicatif/struct.HumanBytes.html) -- Formatting API verified
- [indicatif::HumanDuration docs](https://docs.rs/indicatif/latest/indicatif/struct.HumanDuration.html) -- Duration formatting verified
- [clap_complete docs](https://docs.rs/clap_complete/latest/clap_complete/) -- Shell completion generation API
- [Scoop App Manifests wiki](https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests) -- JSON manifest format specification
- [Scoop App Manifest Autoupdate wiki](https://github.com/ScoopInstaller/Scoop/wiki/App-Manifest-Autoupdate) -- Autoupdate mechanism
- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook) -- Official formula authoring guide
- [winget manifest submission docs](https://learn.microsoft.com/en-us/windows/package-manager/package/repository) -- Official submission process
- Existing codebase: `release.yml`, `completions.rs`, `progress.rs`, `color.rs` -- verified current state

### Secondary (MEDIUM confidence)
- [cargo-dist quickstart](https://axodotdev.github.io/cargo-dist/book/quickstart/rust.html) -- Setup guide, workspace handling
- [cargo-dist workspace guide](https://axodotdev.github.io/cargo-dist/book/workspaces/workspace-guide.html) -- Multi-binary workspace behavior
- [Orhun's blog: Fully Automated Releases](https://blog.orhun.dev/automated-rust-releases/) -- Comprehensive Rust release automation comparison
- [ripgrep release checklist](https://github.com/BurntSushi/ripgrep/blob/master/RELEASE-CHECKLIST.md) -- Production Rust CLI release process
- [Homebrew Rust CLI lessons learned](https://ivaniscoding.github.io/posts/rustpackaging2/) -- Practical formula creation experience
- [houseabsolute/actions-rust-cross](https://github.com/houseabsolute/actions-rust-cross) -- Cross-compilation GitHub Action

### Tertiary (LOW confidence)
- Chocolatey submission timeline estimates -- based on community reports, not official docs
- MUSL compilation compatibility with ring crate -- needs testing, not verified for this specific dependency tree

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already in Cargo.toml, APIs verified via official docs
- Architecture: HIGH -- Patterns derived from existing codebase analysis + verified package manager docs
- Distribution infrastructure: HIGH -- Homebrew/Scoop formats verified via official wikis, release.yml already exists
- UX polish: HIGH -- indicatif formatting API verified, existing progress bar already works
- Pitfalls: MEDIUM -- Based on common patterns in similar projects, cross-compilation edge cases need testing

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable domain, slow-moving package manager formats)
