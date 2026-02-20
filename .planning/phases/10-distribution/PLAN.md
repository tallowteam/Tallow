# Phase 10: Distribution & Polish — Implementation Plan

**Goal**: Tallow is installable via Homebrew, Scoop, and curl script. CLI output uses human-readable sizes, smart error messages, and consistent colored formatting.

**Depends on**: Phase 9 (Security Hardening & Relay Auth)

**Success Criteria** (from ROADMAP.md):
1. `brew install tallowteam/tap/tallow` installs working binary on macOS (Intel + Apple Silicon)
2. `scoop install tallow` installs working binary on Windows
3. `curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh` installs on Linux
4. All user-facing byte counts display as human-readable (e.g., "1.43 MiB" not "1500000")
5. Common errors (connection refused, permission denied, timeout) show actionable guidance

**Key Constraints**:
- Keep the existing `.github/workflows/release.yml` workflow (enhance, do not replace)
- No new crate dependencies for formatting (use existing `indicatif`, `owo-colors`)
- Do NOT migrate to cargo-dist
- Repository is `github.com/AamirAlam/tallow` (workspace version `0.1.0`)

---

## Wave 1: Human-Readable Output Formatting (No External Dependencies)

These tasks are independent of distribution infrastructure and can all run in parallel.

### Task 1.1: Create `output/format.rs` — Human-Readable Formatting Helpers

**Files to create**:
- `crates/tallow/src/output/format.rs`

**Files to modify**:
- `crates/tallow/src/output/mod.rs`

**Changes**:

Create `format.rs` with formatting wrappers around `indicatif::HumanBytes` and `indicatif::HumanDuration`:

```rust
// crates/tallow/src/output/format.rs

use indicatif::{HumanBytes, HumanDuration};
use std::time::Duration;

/// Format bytes for human-readable display (IEC binary units).
/// Examples: "0 B", "1.00 KiB", "1.43 MiB", "2.15 GiB"
pub fn format_bytes(bytes: u64) -> String {
    format!("{}", HumanBytes(bytes))
}

/// Format duration for human-readable display.
/// Examples: "3s", "2m 5s", "1h 30m"
pub fn format_duration(duration: Duration) -> String {
    format!("{}", HumanDuration(duration))
}

/// Format transfer speed as bytes per second.
/// Returns "-- B/s" if duration is zero.
pub fn format_speed(bytes: u64, duration: Duration) -> String {
    let secs = duration.as_secs_f64();
    if secs <= 0.0 {
        return "-- B/s".to_string();
    }
    let bps = bytes as f64 / secs;
    format!("{}/s", HumanBytes(bps as u64))
}

/// Format a file listing with names and sizes.
/// Single file: "  filename.txt (1.43 MiB)"
/// Multiple files: "  3 file(s), 12.5 MiB total:" with per-file lines.
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
```

Add `pub mod format;` to `crates/tallow/src/output/mod.rs`.

**Dependencies**: None

**Verification**:
- Add `#[cfg(test)]` module in `format.rs` with tests:
  - `format_bytes(0)` returns `"0 B"`
  - `format_bytes(1024)` returns `"1.00 KiB"`
  - `format_bytes(1_048_576)` returns `"1.00 MiB"`
  - `format_speed(10_485_760, Duration::from_secs(2))` contains `"MiB/s"`
  - `format_speed(0, Duration::ZERO)` returns `"-- B/s"`
  - `format_file_listing` with 1 file returns single line
  - `format_file_listing` with 3 files returns header + 3 indented lines
- `cargo test -p tallow format` passes

---

### Task 1.2: Apply Human-Readable Sizes to Send Command

**Files to modify**:
- `crates/tallow/src/commands/send.rs`

**Changes**:

1. Add `use indicatif::HumanBytes;` at the top.

2. Replace the "Prepared" message (line ~155):
   ```rust
   // BEFORE:
   println!(
       "Prepared {} file(s), {} bytes in {} chunks",
       file_count, total_size, total_chunks,
   );
   // AFTER:
   output::color::info(&format!(
       "Prepared {} file(s), {} in {} chunks",
       file_count,
       HumanBytes(total_size),
       total_chunks,
   ));
   ```

3. Replace the "Transfer complete" message (line ~351):
   ```rust
   // BEFORE:
   output::color::success(&format!(
       "Transfer complete: {} bytes in {} chunks",
       total_size, total_chunks
   ));
   // AFTER:
   output::color::success(&format!(
       "Transfer complete: {} in {} chunks",
       HumanBytes(total_size),
       total_chunks,
   ));
   ```

**Dependencies**: None (Task 1.1 provides the module but this task uses `indicatif::HumanBytes` directly)

**Verification**:
- Build: `cargo build -p tallow`
- Manual: `tallow send <file>` shows "1.43 MiB" instead of raw byte count
- Existing JSON output path (`--json`) still emits raw `total_bytes` as integer (no formatting applied to JSON)

---

### Task 1.3: Apply Human-Readable Sizes to Receive Command

**Files to modify**:
- `crates/tallow/src/commands/receive.rs`

**Changes**:

1. Add `use indicatif::HumanBytes;` at the top.

2. Replace the incoming transfer display (line ~237):
   ```rust
   // BEFORE:
   println!(
       "  {} file(s), {} bytes in {} chunks",
       file_count, total_size, total_chunks
   );
   // AFTER:
   println!(
       "  {} file(s), {} in {} chunks",
       file_count,
       HumanBytes(total_size),
       total_chunks,
   );
   ```

3. Add per-file sizes to the file listing. After the summary line, replace:
   ```rust
   // BEFORE:
   for name in &filenames {
       println!("  - {}", name);
   }
   // AFTER:
   for file_info in &manifest.files {
       println!(
           "  - {} ({})",
           file_info.path.display(),
           HumanBytes(file_info.size),
       );
   }
   ```
   Note: This requires that `manifest.files[].size` is a `u64` field. If `TransferManifest::FileEntry` does not expose `size`, this change should fall back to:
   ```rust
   for name in &filenames {
       println!("  - {}", name);
   }
   ```
   and a TODO should be filed to expose per-file sizes in the manifest.

4. Replace the "Transfer complete" message (line ~370):
   ```rust
   // BEFORE:
   output::color::success(&format!(
       "Transfer complete: {} file(s), {} bytes",
       written_files.len(),
       total_size
   ));
   // AFTER:
   output::color::success(&format!(
       "Transfer complete: {} file(s), {}",
       written_files.len(),
       HumanBytes(total_size),
   ));
   ```

**Dependencies**: None

**Verification**:
- Build: `cargo build -p tallow`
- Manual: `tallow receive <code>` shows "1.43 MiB" instead of raw byte count
- JSON output still emits raw integers

---

### Task 1.4: Add Semantic Output Helpers to `color.rs`

**Files to modify**:
- `crates/tallow/src/output/color.rs`

**Changes**:

Add transfer-specific styled output functions after the existing `info()` function:

```rust
use indicatif::HumanBytes;

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

/// Print a file listing entry with name and size
pub fn file_entry(name: &str, size: u64) {
    if color_enabled() {
        println!(
            "   {} {}",
            name,
            format!("({})", HumanBytes(size)).dimmed(),
        );
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

/// Print a section header (dimmed separator)
pub fn section(text: &str) {
    if color_enabled() {
        println!("{}", text.dimmed());
    } else {
        println!("{}", text);
    }
}

/// Print a highlighted code phrase for the user to share
pub fn code_phrase(code: &str) {
    if color_enabled() {
        println!("  {}", code.bold().cyan());
    } else {
        println!("  {}", code);
    }
}
```

**Dependencies**: None

**Verification**:
- Build: `cargo build -p tallow`
- Visual: Confirm colored output with `tallow send <file>` in a terminal
- `NO_COLOR=1 tallow send <file>` produces uncolored output

---

### Task 1.5: Smart Error Messages with Actionable Guidance

**Files to create**:
- `crates/tallow/src/output/errors.rs`

**Files to modify**:
- `crates/tallow/src/output/mod.rs`
- `crates/tallow/src/main.rs`

**Changes**:

Create `errors.rs` with context-aware error diagnosis:

```rust
// crates/tallow/src/output/errors.rs

/// Provide context-aware guidance for common error patterns.
/// Returns Some(hint) if the error message matches a known pattern.
pub fn diagnose(err: &dyn std::fmt::Display) -> Option<String> {
    let msg = err.to_string();
    let lower = msg.to_lowercase();

    if lower.contains("connection refused") {
        return Some(
            "The relay server may be down or unreachable. Try:\n  \
             1. Check your internet connection\n  \
             2. Try a different relay: tallow send --relay <address> <file>\n  \
             3. Run 'tallow doctor' to diagnose"
                .to_string(),
        );
    }

    if lower.contains("address already in use") {
        return Some(
            "Another instance of tallow or tallow-relay may be running.\n  \
             Check with: lsof -i :4433 (Unix) or netstat -an | findstr 4433 (Windows)"
                .to_string(),
        );
    }

    if lower.contains("permission denied") {
        return Some(
            "Permission denied. Try:\n  \
             1. Check file/directory permissions\n  \
             2. Specify a different output directory: tallow receive -o ~/Downloads <code>"
                .to_string(),
        );
    }

    if lower.contains("no such file or directory") || lower.contains("not found") {
        return Some(
            "File or directory not found. Verify the path exists and is spelled correctly."
                .to_string(),
        );
    }

    if lower.contains("timed out") || lower.contains("timeout") {
        return Some(
            "Connection timed out. The peer may not be connected yet, or the relay may be slow.\n  \
             Try again, or check 'tallow doctor' for connectivity issues."
                .to_string(),
        );
    }

    if lower.contains("no space left on device") || lower.contains("disk full") {
        return Some(
            "Disk full. Free up space or specify a different output directory: \
             tallow receive -o /path/with/space <code>"
                .to_string(),
        );
    }

    if lower.contains("broken pipe") {
        return Some("The connection was interrupted. The peer may have disconnected.".to_string());
    }

    None
}
```

Add `pub mod errors;` to `crates/tallow/src/output/mod.rs`.

Modify `main.rs` error handler (line ~78) to call `diagnose()`:

```rust
Err(e) => {
    if json_output {
        let err_json = serde_json::json!({
            "error": format!("{}", e),
        });
        eprintln!("{}", err_json);
    } else {
        output::color::error(&format!("{}", e));
        // Show actionable guidance for known error patterns
        if let Some(hint) = output::errors::diagnose(&e) {
            eprintln!();
            eprintln!("{}", hint);
        }
    }
    std::process::exit(exit_codes::ERROR);
}
```

**Dependencies**: None

**Verification**:
- Unit tests in `errors.rs`:
  - `diagnose(&io::Error::new(io::ErrorKind::ConnectionRefused, "Connection refused"))` returns `Some` containing "relay"
  - `diagnose(&io::Error::new(io::ErrorKind::PermissionDenied, "Permission denied"))` returns `Some` containing "permissions"
  - `diagnose(&io::Error::new(io::ErrorKind::Other, "unknown error xyz"))` returns `None`
  - `diagnose(&io::Error::new(io::ErrorKind::TimedOut, "operation timed out"))` returns `Some` containing "tallow doctor"
- `cargo test -p tallow errors` passes
- Manual: Force a "connection refused" error and verify the hint appears below the error

---

### Task 1.6: Enhanced Version Command with Build Metadata

**Files to modify**:
- `crates/tallow/src/commands/version.rs`

**Changes**:

Add git commit hash and build date to the version output. Use `env!()` with optional fallback for CI-provided values:

```rust
pub fn execute(json: bool) {
    let version = env!("CARGO_PKG_VERSION");
    let rust_version = match env!("CARGO_PKG_RUST_VERSION") {
        "" => "stable",
        v => v,
    };
    let commit = option_env!("TALLOW_BUILD_COMMIT").unwrap_or("unknown");
    let build_date = option_env!("TALLOW_BUILD_DATE").unwrap_or("unknown");

    if json {
        println!(
            "{}",
            serde_json::json!({
                "version": version,
                "rust_version": rust_version,
                "platform": format!("{} {}", std::env::consts::OS, std::env::consts::ARCH),
                "features": built_features(),
                "commit": commit,
                "build_date": build_date,
            })
        );
    } else {
        println!("tallow {}", version);
        println!("rust:     {}", rust_version);
        println!(
            "platform: {} {}",
            std::env::consts::OS,
            std::env::consts::ARCH
        );
        println!("commit:   {}", commit);
        println!("built:    {}", build_date);
        println!("features: {}", built_features().join(", "));
    }
}
```

These environment variables will be set by the release workflow (Task 3.1).

**Dependencies**: None (gracefully falls back to "unknown")

**Verification**:
- `cargo build -p tallow && ./target/debug/tallow version` shows "commit: unknown" and "built: unknown"
- After CI sets the env vars, they show real values
- `tallow --json version` includes `commit` and `build_date` fields

---

## Wave 2: Distribution Infrastructure (Can Start After Wave 1 Begins)

These tasks build the package manager manifests and installer script. They are independent of each other but depend on understanding the release workflow archive format.

### Task 2.1: Create Homebrew Formula

**Files to create**:
- `homebrew/Formula/tallow.rb`

**Changes**:

Create the Homebrew tap formula that downloads pre-built binaries from GitHub Releases. The formula uses platform detection to select the correct archive:

```ruby
# homebrew/Formula/tallow.rb
class Tallow < Formula
  desc "The most secure peer-to-peer file transfer CLI tool"
  homepage "https://github.com/AamirAlam/tallow"
  version "0.1.0"
  license "AGPL-3.0-or-later"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/AamirAlam/tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_AARCH64_DARWIN_SHA256"
    else
      url "https://github.com/AamirAlam/tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_X86_64_DARWIN_SHA256"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/AamirAlam/tallow/releases/download/v#{version}/tallow-v#{version}-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_AARCH64_LINUX_SHA256"
    else
      url "https://github.com/AamirAlam/tallow/releases/download/v#{version}/tallow-v#{version}-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_X86_64_LINUX_SHA256"
    end
  end

  def install
    bin.install "tallow"
    bin.install "tallow-relay" if File.exist?("tallow-relay")

    # Generate and install shell completions
    generate_completions_from_executable(bin/"tallow", "completions")

    # Install man pages if present in the archive
    man1.install Dir["man/*.1"] if Dir["man/*.1"].any?
  end

  test do
    assert_match "tallow #{version}", shell_output("#{bin}/tallow version")
  end
end
```

Note: The `PLACEHOLDER_*_SHA256` values must be replaced by the release automation (Task 3.2) or manually after each release. The `generate_completions_from_executable` method is a Homebrew built-in that runs the binary to produce completions.

**Dependencies**: None (this is a static file; SHA256 values updated per-release)

**Verification**:
- `brew audit --strict homebrew/Formula/tallow.rb` passes (requires Homebrew installed)
- After a release: `brew install --build-from-source homebrew/Formula/tallow.rb` installs and `tallow version` outputs correct version
- Test on both Intel and Apple Silicon macOS

---

### Task 2.2: Create Scoop Manifest

**Files to create**:
- `scoop/tallow.json`

**Changes**:

Create the Scoop package manifest for Windows:

```json
{
    "version": "0.1.0",
    "description": "The most secure peer-to-peer file transfer CLI tool",
    "homepage": "https://github.com/AamirAlam/tallow",
    "license": "AGPL-3.0-or-later",
    "architecture": {
        "64bit": {
            "url": "https://github.com/AamirAlam/tallow/releases/download/v0.1.0/tallow-v0.1.0-x86_64-pc-windows-msvc.zip",
            "hash": "PLACEHOLDER_SHA256"
        }
    },
    "bin": [
        "tallow.exe",
        "tallow-relay.exe"
    ],
    "checkver": {
        "github": "https://github.com/AamirAlam/tallow"
    },
    "autoupdate": {
        "architecture": {
            "64bit": {
                "url": "https://github.com/AamirAlam/tallow/releases/download/v$version/tallow-v$version-x86_64-pc-windows-msvc.zip"
            }
        }
    }
}
```

The `checkver` block tells Scoop how to find the latest version (scrapes GitHub releases). The `autoupdate` block tells Scoop how to construct the download URL for new versions.

**Dependencies**: None

**Verification**:
- Validate JSON syntax: `python -m json.tool scoop/tallow.json`
- After a release with correct SHA256: `scoop install scoop/tallow.json` on Windows
- `scoop checkup` reports no warnings for the manifest

---

### Task 2.3: Create Curl Installer Script

**Files to create**:
- `scripts/install.sh`

**Changes**:

Create a POSIX-compliant install script that detects OS/arch and downloads from GitHub Releases:

```bash
#!/bin/sh
# install.sh -- Install tallow
# Usage: curl -sSf https://raw.githubusercontent.com/AamirAlam/tallow/master/scripts/install.sh | sh
set -eu

REPO="AamirAlam/tallow"
INSTALL_DIR="${TALLOW_INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="tallow"

# --- Detect platform ---
detect_platform() {
    OS=$(uname -s)
    ARCH=$(uname -m)

    case "$OS" in
        Linux)   PLATFORM="unknown-linux-gnu" ;;
        Darwin)  PLATFORM="apple-darwin" ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "Error: Use Scoop on Windows: scoop install tallow"
            echo "  scoop bucket add tallow https://github.com/AamirAlam/scoop-tallow"
            echo "  scoop install tallow"
            exit 1
            ;;
        *)
            echo "Error: Unsupported OS: $OS"
            echo "See https://github.com/$REPO/releases for manual download"
            exit 1
            ;;
    esac

    case "$ARCH" in
        x86_64|amd64)   ARCH="x86_64" ;;
        aarch64|arm64)   ARCH="aarch64" ;;
        *)
            echo "Error: Unsupported architecture: $ARCH"
            echo "See https://github.com/$REPO/releases for manual download"
            exit 1
            ;;
    esac
}

# --- Check required tools ---
check_deps() {
    for cmd in curl tar; do
        if ! command -v "$cmd" > /dev/null 2>&1; then
            echo "Error: '$cmd' is required but not found."
            exit 1
        fi
    done
}

# --- Get latest version ---
get_latest_version() {
    VERSION=$(curl -sSf "https://api.github.com/repos/$REPO/releases/latest" \
        | grep '"tag_name"' \
        | sed -E 's/.*"v?([^"]+)".*/\1/')

    if [ -z "$VERSION" ]; then
        echo "Error: Could not determine latest version from GitHub"
        exit 1
    fi
}

# --- Download and install ---
install() {
    FILENAME="tallow-v${VERSION}-${ARCH}-${PLATFORM}.tar.gz"
    URL="https://github.com/$REPO/releases/download/v${VERSION}/${FILENAME}"
    CHECKSUM_URL="${URL}.sha256"

    echo "Installing tallow v${VERSION} for ${ARCH}-${PLATFORM}..."
    echo "  from: $URL"

    TMPDIR=$(mktemp -d)
    trap 'rm -rf "$TMPDIR"' EXIT

    # Download archive and checksum
    curl -sSfL "$URL" -o "$TMPDIR/$FILENAME"

    # Verify checksum if sha256sum is available
    if command -v sha256sum > /dev/null 2>&1; then
        curl -sSfL "$CHECKSUM_URL" -o "$TMPDIR/${FILENAME}.sha256"
        (cd "$TMPDIR" && sha256sum -c "${FILENAME}.sha256")
    elif command -v shasum > /dev/null 2>&1; then
        curl -sSfL "$CHECKSUM_URL" -o "$TMPDIR/${FILENAME}.sha256"
        EXPECTED=$(awk '{print $1}' "$TMPDIR/${FILENAME}.sha256")
        ACTUAL=$(shasum -a 256 "$TMPDIR/$FILENAME" | awk '{print $1}')
        if [ "$EXPECTED" != "$ACTUAL" ]; then
            echo "Error: Checksum verification failed"
            echo "  Expected: $EXPECTED"
            echo "  Actual:   $ACTUAL"
            exit 1
        fi
        echo "Checksum verified."
    else
        echo "Warning: sha256sum/shasum not found, skipping checksum verification"
    fi

    # Extract
    tar xzf "$TMPDIR/$FILENAME" -C "$TMPDIR"

    # Install binaries
    if [ -w "$INSTALL_DIR" ]; then
        cp "$TMPDIR/tallow" "$INSTALL_DIR/"
        chmod +x "$INSTALL_DIR/tallow"
        cp "$TMPDIR/tallow-relay" "$INSTALL_DIR/" 2>/dev/null && \
            chmod +x "$INSTALL_DIR/tallow-relay" || true
    else
        echo "Installing to $INSTALL_DIR (requires sudo)..."
        sudo cp "$TMPDIR/tallow" "$INSTALL_DIR/"
        sudo chmod +x "$INSTALL_DIR/tallow"
        sudo cp "$TMPDIR/tallow-relay" "$INSTALL_DIR/" 2>/dev/null && \
            sudo chmod +x "$INSTALL_DIR/tallow-relay" || true
    fi

    echo ""
    echo "tallow v${VERSION} installed to $INSTALL_DIR"
    echo ""
    echo "Get started:"
    echo "  tallow send <file>       # Send a file"
    echo "  tallow receive <code>    # Receive a file"
    echo "  tallow --help            # Full usage"
}

# --- Main ---
detect_platform
check_deps
get_latest_version
install
```

The script must be marked executable: `chmod +x scripts/install.sh`.

**Dependencies**: None

**Verification**:
- Shellcheck: `shellcheck scripts/install.sh` passes with no errors
- Test on Ubuntu 22.04: `bash scripts/install.sh` (with `TALLOW_INSTALL_DIR=/tmp/tallow-test`)
- Test on macOS: same
- Test on Alpine (BusyBox): `sh scripts/install.sh` (POSIX compliance)
- Verify checksum validation catches a corrupted download

---

## Wave 3: Release Workflow Enhancements (Depends on Wave 2)

### Task 3.1: Enhance Release Workflow with Completions, Man Pages, and Build Metadata

**Files to modify**:
- `.github/workflows/release.yml`

**Changes**:

Add shell completion generation, man page generation, build metadata env vars, and include completions in release archives. All changes are additive to the existing workflow structure.

**3.1a: Add build metadata environment variables**

In the `build` job, before the "Build release binary" step, add:

```yaml
      - name: Set build metadata
        shell: bash
        run: |
          echo "TALLOW_BUILD_COMMIT=$(git rev-parse --short HEAD)" >> "$GITHUB_ENV"
          echo "TALLOW_BUILD_DATE=$(date -u +%Y-%m-%d)" >> "$GITHUB_ENV"
```

**3.1b: Generate shell completions from the native x86_64-linux build**

After the "Build relay binary" step, add (only for the native Linux build that can execute the binary):

```yaml
      - name: Generate shell completions
        if: matrix.target == 'x86_64-unknown-linux-gnu'
        run: |
          mkdir -p dist/completions
          ./target/${{ matrix.target }}/release/tallow completions bash > dist/completions/tallow.bash
          ./target/${{ matrix.target }}/release/tallow completions zsh > dist/completions/_tallow
          ./target/${{ matrix.target }}/release/tallow completions fish > dist/completions/tallow.fish
          ./target/${{ matrix.target }}/release/tallow completions powershell > dist/completions/_tallow.ps1
```

**3.1c: Upload completions as a separate artifact**

After the existing `upload-artifact` step, add (only for x86_64-linux):

```yaml
      - name: Upload completions artifact
        if: matrix.target == 'x86_64-unknown-linux-gnu'
        uses: actions/upload-artifact@v4
        with:
          name: tallow-completions
          path: dist/completions/
```

**3.1d: Include completions in the release**

In the `release` job, after downloading artifacts and before creating the release, add:

```yaml
      - name: Attach completions to release
        run: |
          if [ -d "tallow-completions" ]; then
            tar czf tallow-completions.tar.gz -C tallow-completions .
          fi
```

Update the `files` pattern in the release step:

```yaml
          files: |
            tallow-*
            tallow-completions.tar.gz
```

**3.1e: Include completions in each Unix archive**

Modify the "Package (Unix)" step to copy completions into the dist folder if they exist (they only exist for the x86_64-linux build; other platforms won't have them, which is fine -- completions are platform-independent and attached separately):

```yaml
      - name: Package (Unix)
        if: matrix.archive == 'tar.gz'
        run: |
          mkdir -p dist
          cp target/${{ matrix.target }}/release/tallow dist/
          cp target/${{ matrix.target }}/release/tallow-relay dist/
          if [ -d dist/completions ]; then
            cp -r dist/completions dist/
          fi
          cd dist && tar czf ../tallow-${{ github.ref_name }}-${{ matrix.target }}.tar.gz *
```

**Dependencies**: Task 1.6 (version command expects env vars, but works without them)

**Verification**:
- Push a `v0.1.0-rc1` tag and verify the workflow:
  - All 5 targets build successfully
  - The x86_64-linux build generates 4 completion files
  - `tallow-completions.tar.gz` appears in the release assets
  - The version command in the release binary shows the correct commit hash and date
- Download the completions archive and source each file without errors:
  - `source tallow.bash` in bash
  - `source _tallow` in zsh (after moving to `$fpath`)
  - `source tallow.fish` in fish

---

### Task 3.2: Create Release Automation Script for Manifest Updates

**Files to create**:
- `scripts/update-manifests.sh`

**Changes**:

Create a script that reads SHA256 checksums from a GitHub Release and updates the Homebrew formula and Scoop manifest. This is run manually after each release (or can be triggered by a post-release workflow later).

```bash
#!/bin/sh
# update-manifests.sh -- Update Homebrew formula and Scoop manifest SHA256 hashes
# Usage: ./scripts/update-manifests.sh v0.1.0
set -eu

VERSION="${1:?Usage: $0 <version-tag>}"
REPO="AamirAlam/tallow"
VERSION_NUM="${VERSION#v}"  # Strip leading 'v' if present

echo "Updating manifests for $VERSION..."

# Download checksums from the release
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

for TARGET in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu x86_64-apple-darwin aarch64-apple-darwin x86_64-pc-windows-msvc; do
    case "$TARGET" in
        *windows*) EXT="zip" ;;
        *)         EXT="tar.gz" ;;
    esac
    FILENAME="tallow-${VERSION}-${TARGET}.${EXT}"
    CHECKSUM_URL="https://github.com/$REPO/releases/download/${VERSION}/${FILENAME}.sha256"
    echo "  Fetching checksum for $TARGET..."
    curl -sSfL "$CHECKSUM_URL" -o "$TMPDIR/${TARGET}.sha256" || {
        echo "  Warning: Could not fetch checksum for $TARGET"
        echo "MISSING" > "$TMPDIR/${TARGET}.sha256"
    }
done

# Extract just the hash from each file (format: "hash  filename")
get_hash() {
    awk '{print $1}' "$TMPDIR/$1.sha256"
}

HASH_X86_LINUX=$(get_hash x86_64-unknown-linux-gnu)
HASH_ARM_LINUX=$(get_hash aarch64-unknown-linux-gnu)
HASH_X86_DARWIN=$(get_hash x86_64-apple-darwin)
HASH_ARM_DARWIN=$(get_hash aarch64-apple-darwin)
HASH_X86_WINDOWS=$(get_hash x86_64-pc-windows-msvc)

echo ""
echo "SHA256 checksums:"
echo "  x86_64-linux:   $HASH_X86_LINUX"
echo "  aarch64-linux:  $HASH_ARM_LINUX"
echo "  x86_64-darwin:  $HASH_X86_DARWIN"
echo "  aarch64-darwin: $HASH_ARM_DARWIN"
echo "  x86_64-windows: $HASH_X86_WINDOWS"

# Update Homebrew formula
echo ""
echo "Updating homebrew/Formula/tallow.rb..."
FORMULA="homebrew/Formula/tallow.rb"
if [ -f "$FORMULA" ]; then
    sed -i.bak "s/version \".*\"/version \"${VERSION_NUM}\"/" "$FORMULA"
    # The formula has multiple sha256 lines; we rely on the ordering:
    # 1st sha256 = aarch64-darwin, 2nd = x86_64-darwin, 3rd = aarch64-linux, 4th = x86_64-linux
    # This is fragile; for robustness, use PLACEHOLDER_* tokens instead.
    sed -i.bak "s/PLACEHOLDER_AARCH64_DARWIN_SHA256/${HASH_ARM_DARWIN}/" "$FORMULA"
    sed -i.bak "s/PLACEHOLDER_X86_64_DARWIN_SHA256/${HASH_X86_DARWIN}/" "$FORMULA"
    sed -i.bak "s/PLACEHOLDER_AARCH64_LINUX_SHA256/${HASH_ARM_LINUX}/" "$FORMULA"
    sed -i.bak "s/PLACEHOLDER_X86_64_LINUX_SHA256/${HASH_X86_LINUX}/" "$FORMULA"
    rm -f "${FORMULA}.bak"
    echo "  Done."
else
    echo "  Warning: $FORMULA not found"
fi

# Update Scoop manifest
echo "Updating scoop/tallow.json..."
MANIFEST="scoop/tallow.json"
if [ -f "$MANIFEST" ]; then
    # Use sed for simple replacements (jq would be better but may not be available)
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"${VERSION_NUM}\"/" "$MANIFEST"
    sed -i.bak "s/PLACEHOLDER_SHA256/${HASH_X86_WINDOWS}/" "$MANIFEST"
    # Update the URL version
    sed -i.bak "s|/download/v[0-9.]*-*[a-z0-9]*/tallow-v[0-9.]*-*[a-z0-9]*-|/download/${VERSION}/tallow-${VERSION}-|g" "$MANIFEST"
    rm -f "${MANIFEST}.bak"
    echo "  Done."
else
    echo "  Warning: $MANIFEST not found"
fi

echo ""
echo "Manifests updated. Review changes with:"
echo "  git diff homebrew/ scoop/"
echo ""
echo "Then commit and push:"
echo "  git add homebrew/ scoop/"
echo "  git commit -m 'chore: update package manifests for ${VERSION}'"
```

**Dependencies**: Tasks 2.1, 2.2 (manifests must exist)

**Verification**:
- After a test release, run `./scripts/update-manifests.sh v0.1.0` and verify:
  - `homebrew/Formula/tallow.rb` has real SHA256 hashes (not PLACEHOLDER)
  - `scoop/tallow.json` has real SHA256 hash and correct version
  - `git diff` shows only hash and version changes

---

## Wave 4: Integration and Testing (Depends on Waves 1-3)

### Task 4.1: Wire Enhanced Output into Send/Receive Commands

**Files to modify**:
- `crates/tallow/src/commands/send.rs`
- `crates/tallow/src/commands/receive.rs`

**Changes**:

After Tasks 1.2, 1.3, and 1.4 are complete, do a final pass through both commands to ensure:

1. **Send command uses `color::transfer_summary()`** for the prepared message and `color::transfer_complete()` for the completion message (with timing):

   In `send.rs`, add a timer around the transfer:
   ```rust
   let transfer_start = std::time::Instant::now();
   // ... existing chunk sending loop ...
   progress.finish();
   let transfer_duration = transfer_start.elapsed();
   ```

   Replace the final success message with:
   ```rust
   if !json {
       output::color::transfer_complete(total_size, transfer_duration);
   }
   ```

2. **Receive command uses `color::transfer_summary()`** for the incoming transfer display and `color::file_entry()` for per-file listing:

   ```rust
   if !json {
       println!("Incoming transfer:");
       output::color::transfer_summary(file_count, total_size);
       for file_info in &manifest.files {
           output::color::file_entry(
               &file_info.path.display().to_string(),
               file_info.size,
           );
       }
   }
   ```

3. **Code phrase display uses `color::code_phrase()`**:

   In `send.rs`:
   ```rust
   output::color::info("Code phrase:");
   output::color::code_phrase(&code_phrase);
   println!("On the receiving end, run:");
   println!("  tallow receive {}", code_phrase);
   ```

**Dependencies**: Tasks 1.2, 1.3, 1.4

**Verification**:
- Full send/receive cycle with a test file shows:
  - Human-readable sizes in all output
  - Colored/styled code phrase
  - Transfer speed in completion message
  - Per-file sizes in receive listing
- `NO_COLOR=1` produces clean uncolored output
- `--json` produces raw integers (no formatting applied)
- `cargo clippy -p tallow -- -D warnings` passes

---

### Task 4.2: Add Integration Tests for Output Formatting

**Files to create**:
- `crates/tallow/tests/output_format.rs`

**Changes**:

Create integration tests that verify the CLI output contains human-readable formatting:

```rust
// crates/tallow/tests/output_format.rs

use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn version_shows_build_info() {
    let mut cmd = Command::cargo_bin("tallow").unwrap();
    cmd.arg("version");
    cmd.assert()
        .success()
        .stdout(predicate::str::contains("tallow 0."))
        .stdout(predicate::str::contains("platform:"))
        .stdout(predicate::str::contains("features:"));
}

#[test]
fn version_json_is_valid() {
    let mut cmd = Command::cargo_bin("tallow").unwrap();
    cmd.args(["--json", "version"]);
    let output = cmd.output().unwrap();
    assert!(output.status.success());
    let json: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("version --json should produce valid JSON");
    assert!(json.get("version").is_some());
    assert!(json.get("platform").is_some());
    assert!(json.get("features").is_some());
}

#[test]
fn no_color_disables_ansi() {
    let mut cmd = Command::cargo_bin("tallow").unwrap();
    cmd.env("NO_COLOR", "1");
    cmd.arg("version");
    let output = cmd.output().unwrap();
    let stdout = String::from_utf8_lossy(&output.stdout);
    // ANSI escape sequences start with \x1b[
    assert!(
        !stdout.contains('\x1b'),
        "NO_COLOR should suppress ANSI escape codes"
    );
}

#[test]
fn send_nonexistent_file_shows_error() {
    let mut cmd = Command::cargo_bin("tallow").unwrap();
    cmd.args(["send", "/nonexistent/file/path.txt"]);
    cmd.assert()
        .failure()
        .stderr(predicate::str::contains("not found").or(predicate::str::contains("Error")));
}

#[test]
fn doctor_runs_without_crash() {
    let mut cmd = Command::cargo_bin("tallow").unwrap();
    cmd.arg("doctor");
    // Doctor may fail some checks (e.g., relay unreachable) but should not crash
    let output = cmd.output().unwrap();
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("Diagnostics") || stdout.contains("checks"),
        "Doctor should produce diagnostic output"
    );
}
```

**Dependencies**: Tasks 1.2, 1.3, 1.5, 1.6

**Verification**:
- `cargo test -p tallow --test output_format` passes all tests
- Tests run in CI (existing CI workflow already runs `cargo test --workspace`)

---

### Task 4.3: Validate Package Manager Manifests in CI

**Files to modify**:
- `.github/workflows/release.yml` (optional, low priority)

**Changes**:

Add a validation step to the release workflow that checks manifest syntax. This is optional but prevents broken manifests from being released.

In the `release` job, before creating the GitHub Release, add:

```yaml
      - name: Validate Scoop manifest
        run: |
          python3 -m json.tool scoop/tallow.json > /dev/null
          echo "Scoop manifest is valid JSON"

      - name: Validate install script
        run: |
          bash -n scripts/install.sh
          echo "Install script has valid bash syntax"
```

Note: Homebrew formula validation requires `brew` which is not available on ubuntu-latest. That validation should be done locally or in a separate macOS job.

**Dependencies**: Tasks 2.2, 2.3

**Verification**:
- Release workflow passes the validation steps
- A deliberately broken `tallow.json` (missing comma) causes the workflow to fail

---

## Wave 5: Documentation and Polish (Depends on Waves 1-4)

### Task 5.1: Add Installation Documentation to README

**Files to modify**:
- Top-level project documentation (if a README.md exists; if not, add install section to existing docs)

**Changes**:

Add an "Installation" section with all three methods:

```markdown
## Installation

### Homebrew (macOS / Linux)

```bash
brew tap AamirAlam/tap
brew install tallow
```

### Scoop (Windows)

```powershell
scoop bucket add tallow https://github.com/AamirAlam/scoop-tallow
scoop install tallow
```

### Quick Install (Linux / macOS)

```bash
curl -sSf https://raw.githubusercontent.com/AamirAlam/tallow/master/scripts/install.sh | sh
```

### From Source

```bash
cargo install --git https://github.com/AamirAlam/tallow tallow
```

### Download Binary

Pre-built binaries for all platforms are available on the
[GitHub Releases](https://github.com/AamirAlam/tallow/releases) page.
```

**Dependencies**: Tasks 2.1, 2.2, 2.3

**Verification**:
- All installation commands are correct (URLs match actual repo)
- Each method is tested on its target platform

---

### Task 5.2: Final Consistency Pass — Output Audit

**Files to audit (read-only scan, modify as needed)**:
- `crates/tallow/src/commands/send.rs`
- `crates/tallow/src/commands/receive.rs`
- `crates/tallow/src/commands/doctor.rs`
- `crates/tallow/src/commands/identity.rs`
- `crates/tallow/src/commands/config_cmd.rs`
- `crates/tallow/src/commands/chat.rs`
- `crates/tallow/src/commands/benchmark.rs`

**Changes**:

Grep the entire `commands/` directory for:
1. **Raw byte counts**: Any `{} bytes` format string that should use `HumanBytes`
2. **Inconsistent prefixes**: Ensure all info messages use `output::color::info()`, errors use `output::color::error()`, successes use `output::color::success()`
3. **Missing JSON mode**: Any `println!` that should have a JSON-mode branch
4. **Raw `println!` that should use `tracing`**: Any debug/diagnostic output that bypasses the output system

Fix any inconsistencies found. This is a manual review task.

**Dependencies**: Tasks 1.2, 1.3, 1.4, 1.5

**Verification**:
- `grep -rn "bytes\b" crates/tallow/src/commands/` finds no raw byte formatting in user-facing output
- `cargo clippy -p tallow -- -D warnings` passes
- `cargo fmt --check -p tallow` passes
- All output uses consistent prefix styling (`>>` for info, `OK:` for success, `Error:` for errors, `Warning:` for warnings)

---

## Requirement Coverage Matrix

| Requirement | Task(s) | Success Criterion |
|---|---|---|
| DIST-01: Homebrew install | 2.1, 3.1, 3.2 | `brew install tallowteam/tap/tallow` works |
| DIST-02: Scoop install | 2.2, 3.2 | `scoop install tallow` works |
| DIST-03: Curl installer | 2.3 | `curl ... \| sh` installs on Linux |
| DIST-04: Human-readable bytes | 1.1, 1.2, 1.3, 5.2 | All output uses "MiB" not raw numbers |
| DIST-05: Smart errors | 1.5 | Connection refused shows relay hint |
| DIST-06: Colored output | 1.4, 4.1 | Consistent styled output |
| DIST-07: Shell completions in release | 3.1 | Release archives include completions |
| DIST-08: Build metadata | 1.6, 3.1 | `tallow version` shows commit + date |
| DIST-09: Transfer speed display | 1.4, 4.1 | Completion shows "at X MiB/s" |
| DIST-10: Package manifest automation | 3.2 | Script updates SHA256 hashes |

---

## Execution Order Summary

```
Wave 1 (parallel, no dependencies):
  Task 1.1: format.rs module
  Task 1.2: send.rs human-readable sizes
  Task 1.3: receive.rs human-readable sizes
  Task 1.4: color.rs semantic helpers
  Task 1.5: errors.rs smart diagnostics
  Task 1.6: version.rs build metadata

Wave 2 (parallel, no dependencies):
  Task 2.1: Homebrew formula
  Task 2.2: Scoop manifest
  Task 2.3: Curl installer script

Wave 3 (depends on Wave 2 for manifest files):
  Task 3.1: Release workflow enhancements
  Task 3.2: Manifest update script

Wave 4 (depends on Waves 1-3):
  Task 4.1: Wire enhanced output into commands
  Task 4.2: Integration tests
  Task 4.3: CI manifest validation

Wave 5 (depends on Waves 1-4):
  Task 5.1: Installation docs
  Task 5.2: Output consistency audit
```

**Estimated total**: 12 tasks across 5 waves. Waves 1 and 2 can execute simultaneously. The critical path is: Wave 1 + Wave 3 + Wave 4 (output changes -> workflow -> integration tests).

---

## Files Created/Modified Summary

### New Files (7)
| File | Task | Purpose |
|---|---|---|
| `crates/tallow/src/output/format.rs` | 1.1 | Human-readable formatting helpers |
| `crates/tallow/src/output/errors.rs` | 1.5 | Smart error diagnosis |
| `homebrew/Formula/tallow.rb` | 2.1 | Homebrew formula |
| `scoop/tallow.json` | 2.2 | Scoop manifest |
| `scripts/install.sh` | 2.3 | Curl installer |
| `scripts/update-manifests.sh` | 3.2 | Release manifest updater |
| `crates/tallow/tests/output_format.rs` | 4.2 | Integration tests |

### Modified Files (7)
| File | Task(s) | Changes |
|---|---|---|
| `crates/tallow/src/output/mod.rs` | 1.1, 1.5 | Add `format` and `errors` modules |
| `crates/tallow/src/output/color.rs` | 1.4 | Add semantic output helpers |
| `crates/tallow/src/commands/send.rs` | 1.2, 4.1 | Human-readable sizes, transfer timing |
| `crates/tallow/src/commands/receive.rs` | 1.3, 4.1 | Human-readable sizes, file entry display |
| `crates/tallow/src/commands/version.rs` | 1.6 | Build metadata (commit, date) |
| `crates/tallow/src/main.rs` | 1.5 | Wire error diagnosis into error handler |
| `.github/workflows/release.yml` | 3.1 | Completions, build metadata, packaging |
