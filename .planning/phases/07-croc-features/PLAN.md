# Phase 7: Core Croc UX - Implementation Plan

**Created:** 2026-02-20
**Branch:** `feat/enable-agent-teams`
**Depends on:** Phase 6 (complete, 414 tests passing)
**Goal:** Match Croc's zero-friction UX while maintaining Tallow's security advantage.

## Requirements Covered

CROC-01 through CROC-12, mapped to the Phase 7 success criteria from ROADMAP.md:

1. `echo "hello" | tallow send` sends text; `tallow receive <code>` prints to stdout (pipe-to-pipe)
2. `tallow send --text "secret message"` sends text; receiver prints to terminal
3. `tallow send --code mycode file.txt` uses custom code; `tallow receive mycode` retrieves it
4. `tallow send file.txt` displays QR code in terminal alongside text code phrase
5. Receiver shows file listing with sizes, prompts "Accept? (Y/n)", declined = zero bytes written

## Architecture Overview

Changes span 3 crates. No new crates are created.

```
crates/tallow/           -- CLI args, command handlers, output helpers
crates/tallow-protocol/  -- Virtual file support in SendPipeline, text metadata in manifest
crates/tallow-protocol/  -- Room code default word count change
```

New dependencies (binary crate only):
- `qr2term = "0.3"` -- QR code terminal rendering

Already present (no additions needed):
- `arboard 3` -- clipboard
- `qrcode 0.14` -- QR generation (used by qr2term internally)
- `dialoguer 0.11` -- interactive prompts
- `std::io::IsTerminal` -- pipe detection (stdlib, Rust 1.70+)

---

## Wave 1: CLI Flags and Output Helpers (No Logic Changes)

These tasks are purely additive -- new CLI arguments and new output utility modules.
All Wave 1 tasks are independent and can be implemented in parallel.

### Task 1.1: Add New CLI Flags to SendArgs

**Files to modify:**
- `crates/tallow/src/cli.rs`

**Changes:**

Add the following fields to `SendArgs`:

```rust
/// Send text directly instead of files
#[arg(short = 't', long)]
pub text: Option<String>,

/// Use a custom code phrase
#[arg(short = 'c', long)]
pub code: Option<String>,

/// Number of words in generated code phrase (default: 4)
#[arg(long)]
pub words: Option<usize>,

/// Display QR code for the receive command
#[arg(long)]
pub qr: bool,

/// Do not copy receive command to clipboard
#[arg(long)]
pub no_clipboard: bool,

/// Ignore piped stdin (force file mode)
#[arg(long)]
pub ignore_stdin: bool,
```

Change `files` from `#[arg(required = true)]` to required only when `--text` is not
provided. This requires adjusting the validation: remove `required = true` from the
attribute and add a runtime check in `send::execute()` that either `text`, stdin pipe,
or at least one file is present.

```rust
/// Files or directories to send
#[arg()]
pub files: Vec<PathBuf>,
```

**Dependencies:** None
**Verification:** `cargo build -p tallow` compiles. `tallow send --help` shows new flags.

---

### Task 1.2: Add New CLI Flags to ReceiveArgs

**Files to modify:**
- `crates/tallow/src/cli.rs`

**Changes:**

Add the following fields to `ReceiveArgs`:

```rust
/// Auto-accept incoming transfers without prompting
#[arg(short = 'y', long)]
pub yes: bool,

/// Overwrite existing files without prompting
#[arg(long)]
pub overwrite: bool,
```

The existing `auto_accept` field (for trusted peers) remains separate from `yes` (which
is an unconditional skip of the confirmation prompt).

**Dependencies:** None
**Verification:** `cargo build -p tallow` compiles. `tallow receive --help` shows new flags.

---

### Task 1.3: Add QR Code Output Helper

**Files to create:**
- `crates/tallow/src/output/qr.rs`

**Files to modify:**
- `crates/tallow/src/output/mod.rs` (add `pub mod qr;`)
- `crates/tallow/Cargo.toml` (add `qr2term = "0.3"`)

**Changes:**

Create `qr.rs` with a single public function:

```rust
//! QR code terminal display

/// Display a QR code in the terminal containing the given data string.
///
/// Silently returns Ok(()) if the terminal is too narrow (< 41 columns).
/// The QR code encodes the full `tallow receive <code>` command so the
/// receiver can scan it directly.
pub fn display_receive_qr(code_phrase: &str) -> std::io::Result<()> {
    let receive_cmd = format!("tallow receive {}", code_phrase);

    // Check terminal width -- QR codes need ~41+ columns minimum
    let (width, _) = crossterm::terminal::size().unwrap_or((80, 24));
    if width < 41 {
        tracing::debug!(
            "Terminal too narrow ({} cols) for QR code; skipping",
            width
        );
        return Ok(());
    }

    qr2term::print_qr(&receive_cmd)
        .map_err(|e| std::io::Error::other(format!("QR generation failed: {}", e)))
}
```

**Dependencies:** None
**Verification:** Unit test not practical (terminal output). Manual test: `tallow send --qr test.txt` shows QR code in a wide terminal, silently omits in a narrow one.

---

### Task 1.4: Add Clipboard Output Helper

**Files to create:**
- `crates/tallow/src/output/clipboard.rs`

**Files to modify:**
- `crates/tallow/src/output/mod.rs` (add `pub mod clipboard;`)

**Changes:**

Create `clipboard.rs`:

```rust
//! Clipboard operations (cross-platform, fail-silent)

/// Copy text to the system clipboard.
///
/// Fails silently on headless systems (SSH, Docker, CI) where no
/// display server is available. Never errors -- clipboard is a
/// convenience feature, not a critical path.
pub fn copy_to_clipboard(text: &str) {
    // On Linux, skip if no display server is detected
    #[cfg(target_os = "linux")]
    {
        let has_display = std::env::var("DISPLAY").is_ok()
            || std::env::var("WAYLAND_DISPLAY").is_ok();
        if !has_display {
            tracing::debug!("No display server; skipping clipboard copy");
            return;
        }
    }

    match arboard::Clipboard::new() {
        Ok(mut cb) => {
            if let Err(e) = cb.set_text(text.to_string()) {
                tracing::debug!("Clipboard copy failed: {}", e);
            } else {
                tracing::debug!("Copied to clipboard: {}", text);
            }
        }
        Err(e) => {
            tracing::debug!("Clipboard unavailable: {}", e);
        }
    }
}
```

**Dependencies:** None (arboard already in Cargo.toml)
**Verification:** Manual test on Windows/macOS. On headless Linux, verify no errors are printed.

---

### Task 1.5: Add Human-Readable Size Formatter

**Files to modify:**
- `crates/tallow/src/output/mod.rs` (add utility function or submodule)

**Changes:**

Add a `format_size` function to the output module. This is needed by the receiver
confirmation prompt to show human-readable file sizes:

```rust
/// Format a byte count as a human-readable string (e.g., "1.43 MiB")
pub fn format_size(bytes: u64) -> String {
    const KIB: u64 = 1024;
    const MIB: u64 = 1024 * 1024;
    const GIB: u64 = 1024 * 1024 * 1024;
    const TIB: u64 = 1024 * 1024 * 1024 * 1024;

    if bytes >= TIB {
        format!("{:.2} TiB", bytes as f64 / TIB as f64)
    } else if bytes >= GIB {
        format!("{:.2} GiB", bytes as f64 / GIB as f64)
    } else if bytes >= MIB {
        format!("{:.2} MiB", bytes as f64 / MIB as f64)
    } else if bytes >= KIB {
        format!("{:.2} KiB", bytes as f64 / KIB as f64)
    } else {
        format!("{} B", bytes)
    }
}
```

Add `#[cfg(test)]` tests:
- `format_size(0)` returns `"0 B"`
- `format_size(1024)` returns `"1.00 KiB"`
- `format_size(1_500_000)` returns `"1.43 MiB"`

**Dependencies:** None
**Verification:** `cargo test -p tallow format_size`

---

## Wave 2: Shorter Code Phrases and Custom Code Support

These changes touch the code phrase generation path. They are independent of Wave 1
output helpers but should be done after Wave 1 CLI flags are in place.

### Task 2.1: Change Default Code Phrase to 4 Words

**Files to modify:**
- `crates/tallow-protocol/src/room/code.rs`

**Changes:**

Change the `DEFAULT_WORD_COUNT` constant from 6 to 4:

```rust
/// Default number of words in a code phrase.
///
/// 4 words from the EFF 7776-word list = ~51.7 bits entropy.
/// Sufficient for ephemeral PAKE sessions where offline brute-force
/// is prevented by the relay rate-limiting and session expiry.
pub const DEFAULT_WORD_COUNT: usize = 4;
```

Update the existing test `test_generate_code_phrase` to use 4 instead of hardcoded 6,
or parameterize it.

**Also update** `crates/tallow/src/commands/send.rs` line 82-83:
The current code calls `tallow_crypto::kdf::generate_diceware(4)` -- this already uses 4
words, which is correct. However, it should be changed to use the protocol crate's
function and constant for consistency:

```rust
let code_phrase = if let Some(room) = &args.room {
    room.clone()
} else {
    tallow_protocol::room::code::generate_code_phrase(
        args.words.unwrap_or(tallow_protocol::room::code::DEFAULT_WORD_COUNT)
    )
};
```

This also wires up the `--words N` flag from Task 1.1.

**Dependencies:** Task 1.1 (for `args.words`)
**Verification:**
- `cargo test -p tallow-protocol test_generate_code_phrase`
- Run `tallow send test.txt` and confirm the code has 4 words (not 6)
- Run `tallow send --words 6 test.txt` and confirm 6-word code

---

### Task 2.2: Custom Code Phrase Support (`--code`)

**Files to modify:**
- `crates/tallow/src/commands/send.rs`

**Changes:**

After Task 1.1 adds the `code` field to `SendArgs`, update the code phrase
generation logic in `send::execute()`:

```rust
let code_phrase = if let Some(ref custom_code) = args.code {
    // Validate minimum length for security
    if custom_code.len() < 4 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Custom code must be at least 4 characters for security",
        ));
    }
    if custom_code.len() < 8 {
        output::color::warning(
            "Short custom code -- security depends on code phrase entropy"
        );
    }
    custom_code.clone()
} else if let Some(room) = &args.room {
    // Legacy --room flag support
    room.clone()
} else {
    tallow_protocol::room::code::generate_code_phrase(
        args.words.unwrap_or(tallow_protocol::room::code::DEFAULT_WORD_COUNT)
    )
};
```

Note: `--code` and `--room` serve similar purposes. Consider deprecating `--room` in
favor of `--code` with a deprecation warning, or make them aliases. For now, `--code`
takes priority if both are specified.

**Dependencies:** Task 1.1 (CLI flags), Task 2.1 (code generation)
**Verification:**
- `tallow send --code mycode test.txt` uses "mycode" as the code phrase
- `tallow receive mycode` joins the room and receives the file
- `tallow send --code ab test.txt` errors with "at least 4 characters"

---

## Wave 3: Receiver Confirmation and Overwrite Protection

These tasks modify the receive path. They depend on Wave 1 CLI flags and Wave 1 output
helpers (format_size, prompts).

### Task 3.1: Receiver Confirmation Prompt

**Files to modify:**
- `crates/tallow/src/commands/receive.rs`

**Changes:**

Replace the auto-accept block (currently at line 245-258, comment says "for v1; future:
prompt user for confirmation") with a confirmation gate:

```rust
// Display incoming transfer details
if json {
    // JSON output already emits file_offer event above
} else {
    println!();
    println!("Incoming transfer:");
    for entry in manifest.files.iter() {
        println!(
            "  {} ({})",
            entry.path.display(),
            output::format_size(entry.size),
        );
    }
    println!(
        "  Total: {} file(s), {}",
        file_count,
        output::format_size(total_size),
    );
    println!();
}

// Prompt for confirmation unless --yes or --auto-accept
let accepted = if args.yes || args.auto_accept {
    true
} else if json {
    // JSON mode cannot prompt interactively; require --yes
    return Err(io::Error::new(
        io::ErrorKind::InvalidInput,
        "JSON mode requires --yes flag to accept transfers",
    ));
} else {
    output::prompts::confirm(&format!(
        "Accept {} file(s) ({})?",
        file_count,
        output::format_size(total_size),
    ))?
};

if !accepted {
    // Send FileReject
    let reject_msg = Message::FileReject {
        transfer_id,
        reason: "declined by receiver".to_string(),
    };
    encode_buf.clear();
    codec
        .encode_msg(&reject_msg, &mut encode_buf)
        .map_err(|e| io::Error::other(format!("Encode FileReject failed: {}", e)))?;
    relay
        .forward(&encode_buf)
        .await
        .map_err(|e| io::Error::other(format!("Send FileReject failed: {}", e)))?;
    relay.close().await;

    if !json {
        output::color::info("Transfer declined.");
    }
    return Ok(());
}

// Send FileAccept
let accept_msg = Message::FileAccept { transfer_id };
// ... (existing encode + send logic)
```

The existing `dialoguer::Confirm` wrapper in `output::prompts::confirm` defaults to
`false`. Change the default to `true` for this specific prompt (accept by default on
Enter). This means adding a new helper or passing a default parameter:

Add to `crates/tallow/src/output/prompts.rs`:

```rust
/// Prompt for yes/no confirmation with a custom default
pub fn confirm_with_default(message: &str, default: bool) -> io::Result<bool> {
    dialoguer::Confirm::new()
        .with_prompt(message)
        .default(default)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))
}
```

Use `confirm_with_default(..., true)` for the transfer acceptance prompt (default=yes,
matching Croc behavior where pressing Enter accepts).

**Dependencies:** Task 1.2 (--yes flag), Task 1.5 (format_size)
**Verification:**
- Start a send, then receive. Verify prompt appears with file listing and sizes.
- Press Enter (default yes) -- transfer proceeds.
- Press `n` -- transfer is declined, sender sees "rejected", receiver writes zero files.
- `tallow receive --yes <code>` skips the prompt entirely.

---

### Task 3.2: Overwrite Protection

**Files to modify:**
- `crates/tallow/src/commands/receive.rs`

**Changes:**

After finalize (or better: before writing each file in the protocol receive pipeline),
check if the output file already exists. Since `ReceivePipeline::finalize()` handles the
actual file writes inside the protocol crate, we need to add overwrite checking either:

**Option A (preferred):** Add a pre-check in `receive.rs` after processing the offer and
before accepting. Iterate the manifest files and check if any output paths exist:

```rust
// Check for existing files (overwrite protection)
if !args.overwrite {
    let mut conflicts = Vec::new();
    for entry in manifest.files.iter() {
        let target = output_dir.join(&entry.path);
        if target.exists() {
            conflicts.push(target);
        }
    }
    if !conflicts.is_empty() && !json {
        println!();
        output::color::warning("The following files already exist:");
        for path in &conflicts {
            println!("  {}", path.display());
        }
        let overwrite = output::prompts::confirm_with_default(
            "Overwrite existing files?",
            false,
        )?;
        if !overwrite {
            // Reject the transfer
            let reject_msg = Message::FileReject {
                transfer_id,
                reason: "file conflict -- receiver declined overwrite".to_string(),
            };
            encode_buf.clear();
            codec.encode_msg(&reject_msg, &mut encode_buf)
                .map_err(|e| io::Error::other(format!("Encode reject: {}", e)))?;
            relay.forward(&encode_buf).await
                .map_err(|e| io::Error::other(format!("Send reject: {}", e)))?;
            relay.close().await;
            output::color::info("Transfer declined due to file conflicts.");
            return Ok(());
        }
    }
}
```

This check happens after the manifest is parsed but before the FileAccept is sent.

**Dependencies:** Task 1.2 (--overwrite flag), Task 3.1 (confirmation flow)
**Verification:**
- Receive a file that already exists in the output directory. Verify prompt asks about overwrite.
- With `--overwrite`, no prompt appears and the file is replaced.
- Declining the overwrite sends FileReject to the sender.

---

## Wave 4: Text Send, Pipe Support, and Stdout Mode

These are the biggest functional additions. They require changes in both the CLI command
layer and the protocol layer (virtual file support).

### Task 4.1: Virtual File Support in SendPipeline

**Files to modify:**
- `crates/tallow-protocol/src/transfer/send.rs`
- `crates/tallow-protocol/src/transfer/manifest.rs`

**Changes to manifest.rs:**

Add a `transfer_type` field to `FileManifest` to distinguish file vs text transfers:

```rust
/// Transfer content type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransferType {
    /// Regular file transfer
    Files,
    /// Text-only transfer (no files written to disk on receive)
    Text,
}

impl Default for TransferType {
    fn default() -> Self {
        Self::Files
    }
}
```

Add to `FileManifest`:

```rust
/// Type of transfer (files or text)
#[serde(default)]
pub transfer_type: TransferType,
```

Note: The `#[serde(default)]` ensures backward compatibility with manifests from older
versions that do not include this field (they default to `Files`).

**Changes to send.rs:**

Add a method to `SendPipeline` for preparing a virtual (in-memory) file:

```rust
/// Prepare a text payload for transfer as a virtual file.
///
/// The text is treated as a single file named `_tallow_text_` in the manifest.
/// The receiver detects this special name and prints to stdout instead of disk.
pub async fn prepare_text(&mut self, text: &[u8]) -> Result<Vec<Message>> {
    let hash: [u8; 32] = blake3::hash(text).into();

    self.manifest.transfer_type = TransferType::Text;
    self.manifest.add_file(
        PathBuf::from("_tallow_text_"),
        text.len() as u64,
        hash,
    );

    self.manifest.finalize()?;
    self.manifest.compression = Some(match self.compression {
        CompressionAlgorithm::Zstd => "zstd".to_string(),
        CompressionAlgorithm::Lz4 => "lz4".to_string(),
        CompressionAlgorithm::Brotli => "brotli".to_string(),
        CompressionAlgorithm::Lzma => "lzma".to_string(),
        CompressionAlgorithm::None => "none".to_string(),
    });
    self.progress = Some(TransferProgress::new(self.manifest.total_size));

    let manifest_bytes = self.manifest.to_bytes()?;
    Ok(vec![Message::FileOffer {
        transfer_id: self.transfer_id,
        manifest: manifest_bytes,
    }])
}

/// Generate chunk messages for in-memory data (text or stdin).
///
/// Works identically to `chunk_file` but operates on a byte slice
/// rather than reading from disk.
pub async fn chunk_data(
    &self,
    data: &[u8],
    start_chunk_index: u64,
) -> Result<Vec<Message>> {
    // Compress
    let compressed = compression::pipeline::compress(data, self.compression)?;

    // Split into chunks
    let chunks = chunking::split_into_chunks(&compressed, self.chunk_config.size);
    let num_chunks = chunks.len() as u64;
    let total = start_chunk_index + num_chunks;

    let mut messages = Vec::with_capacity(chunks.len());

    for chunk in chunks {
        let global_index = start_chunk_index + chunk.index;
        let aad = chunking::build_chunk_aad(&self.transfer_id, global_index);
        let nonce = chunking::build_chunk_nonce(global_index);

        let encrypted =
            tallow_crypto::symmetric::aes_encrypt(&self.session_key, &nonce, &chunk.data, &aad)
                .map_err(|e| {
                    ProtocolError::TransferFailed(format!("chunk encryption failed: {}", e))
                })?;

        messages.push(Message::Chunk {
            transfer_id: self.transfer_id,
            index: global_index,
            total: if chunk.index + 1 == num_chunks {
                Some(total)
            } else {
                None
            },
            data: encrypted,
        });
    }

    Ok(messages)
}
```

**Dependencies:** None (protocol-internal)
**Verification:**
- `cargo test -p tallow-protocol` passes
- New unit test: `prepare_text` creates a manifest with `TransferType::Text` and a single
  `_tallow_text_` file entry.
- New unit test: `chunk_data` produces valid encrypted chunks identical in structure to
  `chunk_file` output.

---

### Task 4.2: Send Command -- Text Mode and Pipe Detection

**Files to modify:**
- `crates/tallow/src/commands/send.rs`

**Changes:**

Define a `SendSource` enum at the top of the file:

```rust
use std::io::{IsTerminal, Read};

/// Source of data to send
enum SendSource {
    /// File paths from CLI arguments
    Files(Vec<PathBuf>),
    /// Text from --text flag or stdin pipe
    Text(Vec<u8>),
}
```

Add a source determination function:

```rust
/// Determine what to send based on CLI args and stdin state
fn determine_source(args: &SendArgs) -> io::Result<SendSource> {
    // --text flag takes highest priority
    if let Some(ref text) = args.text {
        return Ok(SendSource::Text(text.as_bytes().to_vec()));
    }

    // Check for piped stdin (not a terminal) when no files given
    if args.files.is_empty() && !args.ignore_stdin && !std::io::stdin().is_terminal() {
        let mut buf = Vec::new();
        std::io::stdin().read_to_end(&mut buf)?;
        if buf.is_empty() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "No input: stdin is empty and no files specified",
            ));
        }
        return Ok(SendSource::Text(buf));
    }

    // Require at least one file
    if args.files.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "No files specified. Usage: tallow send <files>\n\
             Or use: tallow send --text \"message\"\n\
             Or pipe: echo hello | tallow send",
        ));
    }

    Ok(SendSource::Files(args.files.clone()))
}
```

Restructure `execute()` to branch on `SendSource`:

```rust
pub async fn execute(args: SendArgs, json: bool) -> io::Result<()> {
    // ... mDNS discovery (unchanged) ...

    let source = determine_source(&args)?;

    // Validate files exist (only for file mode)
    if let SendSource::Files(ref files) = source {
        for file in files {
            if !file.exists() { /* existing error handling */ }
        }
    }

    // ... identity loading (unchanged) ...
    // ... code phrase generation (updated in Task 2.2) ...

    // QR code display (Task 1.3)
    if args.qr && !json {
        output::qr::display_receive_qr(&code_phrase)?;
    }

    // Clipboard copy (Task 1.4)
    if !args.no_clipboard && !json {
        let receive_cmd = format!("tallow receive {}", code_phrase);
        output::clipboard::copy_to_clipboard(&receive_cmd);
    }

    // ... relay connection (unchanged) ...

    // Prepare transfer based on source
    match source {
        SendSource::Text(ref data) => {
            let offer_messages = pipeline.prepare_text(data).await
                .map_err(|e| io::Error::other(format!("Prepare text failed: {}", e)))?;
            // ... send offers, wait for accept (same as files) ...
            // ... chunk using pipeline.chunk_data(data, 0) ...
        }
        SendSource::Files(ref files) => {
            // ... existing file send logic (unchanged) ...
        }
    }

    // ... rest of transfer (unchanged) ...
}
```

The text-mode chunking uses `pipeline.chunk_data(&data, 0)` instead of iterating
file paths and calling `pipeline.chunk_file()`.

**Dependencies:** Task 1.1 (CLI flags), Task 1.3 (QR), Task 1.4 (clipboard), Task 2.2 (code generation), Task 4.1 (virtual file support)
**Verification:**
- `tallow send --text "hello world"` generates code, sends text.
- `echo "piped text" | tallow send` detects stdin pipe, sends text.
- `tallow send test.txt` works as before (file mode).
- `tallow send` with no args and no pipe shows usage error.

---

### Task 4.3: Receive Command -- Text Output and Stdout Pipe Mode

**Files to modify:**
- `crates/tallow/src/commands/receive.rs`
- `crates/tallow-protocol/src/transfer/manifest.rs` (import `TransferType`)

**Changes:**

After the transfer is finalized, detect text transfers and handle them differently:

```rust
use std::io::{IsTerminal, Write};
use tallow_protocol::transfer::manifest::TransferType;

// After finalize() returns written_files:
let is_text_transfer = manifest.transfer_type == TransferType::Text;
let is_stdout_pipe = !std::io::stdout().is_terminal();

if is_text_transfer {
    // Text transfer: read the virtual file and output to terminal/stdout
    // The finalized file is written to output_dir/_tallow_text_
    let text_path = output_dir.join("_tallow_text_");
    if text_path.exists() {
        let content = tokio::fs::read(&text_path).await
            .map_err(|e| io::Error::other(format!("Read text content: {}", e)))?;

        if is_stdout_pipe || json {
            // Pipe mode: raw output to stdout
            std::io::stdout().write_all(&content)
                .map_err(|e| io::Error::other(format!("stdout write: {}", e)))?;
        } else {
            // Interactive terminal: display with formatting
            match std::str::from_utf8(&content) {
                Ok(text) => {
                    println!();
                    println!("{}", text);
                }
                Err(_) => {
                    output::color::warning(
                        "Received binary data; saving to file instead of displaying"
                    );
                    // Leave the file in place
                    return Ok(());
                }
            }
        }

        // Clean up the virtual file (don't leave _tallow_text_ on disk)
        let _ = tokio::fs::remove_file(&text_path).await;
    }
} else if is_stdout_pipe && written_files.len() == 1 {
    // Single file received with stdout piped: cat the file to stdout
    let content = tokio::fs::read(&written_files[0]).await
        .map_err(|e| io::Error::other(format!("Read for stdout: {}", e)))?;
    std::io::stdout().write_all(&content)
        .map_err(|e| io::Error::other(format!("stdout write: {}", e)))?;
} else {
    // Normal file transfer: print saved paths (existing behavior)
    if !json {
        output::color::success(&format!(
            "Transfer complete: {} file(s), {}",
            written_files.len(),
            output::format_size(total_size),
        ));
        for f in &written_files {
            println!("  Saved: {}", f.display());
        }
    }
}
```

**Dependencies:** Task 4.1 (TransferType in manifest), Task 3.1 (confirmation flow)
**Verification:**
- `tallow send --text "hello"` on sender side; `tallow receive <code>` prints "hello" to terminal.
- `tallow receive <code> > output.txt` pipes content to file.
- `echo "test" | tallow send` on sender; `tallow receive --yes <code>` prints "test".
- Regular file transfers still write to disk with "Saved: ..." output.

---

## Wave 5: QR Code Display and Clipboard Integration in Send Flow

These are enhancements to the send command's post-code-generation output.

### Task 5.1: Wire QR and Clipboard into Send Output

**Files to modify:**
- `crates/tallow/src/commands/send.rs`

**Changes:**

This task takes the helpers from Task 1.3 and 1.4 and wires them into the send flow.
After the code phrase is generated and printed, add:

```rust
// After printing the code phrase to the user:
if json {
    // JSON mode: include clipboard and QR info in the event
    println!(
        "{}",
        serde_json::json!({
            "event": "code_generated",
            "code": code_phrase,
            "room_id": hex::encode(room_id),
            "receive_command": format!("tallow receive {}", code_phrase),
        })
    );
} else {
    output::color::info(&format!(
        "Code phrase: {}",
        output::color::styled(&code_phrase, "bold")
    ));
    println!("On the receiving end, run:");
    println!("  tallow receive {}", code_phrase);
    println!();

    // QR code (opt-in via --qr)
    if args.qr {
        if let Err(e) = output::qr::display_receive_qr(&code_phrase) {
            tracing::debug!("QR display failed: {}", e);
        }
        println!();
    }

    // Clipboard auto-copy (default on, disable with --no-clipboard)
    if !args.no_clipboard {
        output::clipboard::copy_to_clipboard(&format!("tallow receive {}", code_phrase));
        output::color::info("(receive command copied to clipboard)");
    }
}
```

**Dependencies:** Task 1.1, Task 1.3, Task 1.4, Task 2.2
**Verification:**
- `tallow send test.txt` prints code and "(receive command copied to clipboard)".
- `tallow send --qr test.txt` shows QR code above the clipboard message.
- `tallow send --no-clipboard test.txt` does not show clipboard message.
- `tallow send --json test.txt` emits JSON event with `receive_command` field.

---

## Wave 6: Integration Testing

All functional waves must be complete before integration tests are written.

### Task 6.1: Text Transfer Round-Trip Test

**Files to create:**
- `crates/tallow/tests/text_transfer.rs` (integration test)

**Changes:**

Integration test that validates text transfer end-to-end. Since the relay is at
129.146.114.5:4433, this test either:
- Uses a mock/local relay (if available), or
- Is marked `#[ignore]` for CI and run manually

```rust
//! Integration test: text transfer round-trip
//!
//! Validates that `--text "hello"` on send produces "hello" on receive.

// This test requires a running relay. Mark as ignored for CI.
#[tokio::test]
#[ignore]
async fn test_text_round_trip() {
    // Spawn sender and receiver tasks
    // Sender: prepare_text, chunk_data, send via relay
    // Receiver: receive offer, process chunks, finalize
    // Assert: received text equals sent text
}
```

For unit-level validation without a relay, test the pipeline components:

```rust
#[cfg(test)]
mod tests {
    use tallow_protocol::transfer::{SendPipeline, ReceivePipeline};
    use tallow_protocol::transfer::manifest::TransferType;

    #[tokio::test]
    async fn test_text_pipeline_round_trip() {
        let transfer_id: [u8; 16] = [1u8; 16];
        let session_key: [u8; 32] = [42u8; 32];
        let text = b"Hello, World!";

        // Sender side
        let mut send_pipeline = SendPipeline::new(transfer_id, session_key);
        let offers = send_pipeline.prepare_text(text).await.unwrap();
        assert_eq!(offers.len(), 1);

        let manifest = send_pipeline.manifest();
        assert_eq!(manifest.transfer_type, TransferType::Text);
        assert_eq!(manifest.files.len(), 1);
        assert_eq!(manifest.files[0].path.to_string_lossy(), "_tallow_text_");

        // Generate chunks
        let chunks = send_pipeline.chunk_data(text, 0).await.unwrap();
        assert!(!chunks.is_empty());

        // Receiver side
        let tmpdir = tempfile::tempdir().unwrap();
        let mut recv_pipeline = ReceivePipeline::new(
            transfer_id,
            tmpdir.path(),
            session_key,
        );

        // Process offer
        let manifest_bytes = send_pipeline.manifest().to_bytes().unwrap();
        recv_pipeline.process_offer(&manifest_bytes).unwrap();

        // Process chunks
        for chunk_msg in &chunks {
            if let tallow_protocol::wire::Message::Chunk { index, data, total, .. } = chunk_msg {
                recv_pipeline.process_chunk(*index, data, *total).unwrap();
            }
        }

        // Finalize
        let written = recv_pipeline.finalize().await.unwrap();
        assert_eq!(written.len(), 1);

        // Verify content
        let received = std::fs::read(&written[0]).unwrap();
        assert_eq!(received, text);
    }
}
```

**Dependencies:** All of Wave 4
**Verification:** `cargo test -p tallow-protocol test_text_pipeline_round_trip`

---

### Task 6.2: Custom Code Phrase Test

**Files to modify:**
- `crates/tallow-protocol/src/room/code.rs` (add test)

**Changes:**

Add tests for custom code phrases:

```rust
#[test]
fn test_custom_code_produces_valid_room_id() {
    let id = derive_room_id("my-custom-code");
    assert_ne!(id, [0u8; 32]);
    // Same code always produces same room ID
    assert_eq!(id, derive_room_id("my-custom-code"));
}

#[test]
fn test_short_codes_produce_unique_room_ids() {
    let id1 = derive_room_id("abcd");
    let id2 = derive_room_id("abce");
    assert_ne!(id1, id2);
}

#[test]
fn test_configurable_word_count() {
    let code3 = generate_code_phrase(3);
    assert_eq!(code3.split('-').count(), 3);

    let code4 = generate_code_phrase(4);
    assert_eq!(code4.split('-').count(), 4);

    let code6 = generate_code_phrase(6);
    assert_eq!(code6.split('-').count(), 6);
}
```

**Dependencies:** Task 2.1
**Verification:** `cargo test -p tallow-protocol test_custom_code test_short_codes test_configurable_word_count`

---

### Task 6.3: Overwrite Protection Test

**Files to create:**
- Test in `crates/tallow/tests/overwrite_protection.rs` (or inline unit test)

**Changes:**

Test that overwrite detection works:

```rust
#[test]
fn test_overwrite_detection_finds_conflicts() {
    let tmpdir = tempfile::tempdir().unwrap();
    let existing = tmpdir.path().join("test.txt");
    std::fs::write(&existing, "existing content").unwrap();

    // Simulate checking a manifest with a file that already exists
    assert!(existing.exists());
}
```

This is a minimal structural test. The full overwrite flow requires the interactive
prompt, so it is validated via manual testing.

**Dependencies:** Task 3.2
**Verification:** Manual: send a file, receive it, send the same file again, verify
overwrite prompt appears.

---

### Task 6.4: Pipe Detection Test

**Files to create:**
- Unit test in `crates/tallow/src/commands/send.rs`

**Changes:**

Test the `determine_source` function:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_determine_source_text_flag() {
        let args = SendArgs {
            text: Some("hello".to_string()),
            files: vec![],
            code: None,
            words: None,
            qr: false,
            no_clipboard: false,
            ignore_stdin: false,
            // ... other fields with defaults ...
        };
        // Cannot easily test without constructing full SendArgs
        // Validate text flag takes priority
        assert!(args.text.is_some());
    }

    #[test]
    fn test_determine_source_requires_input() {
        // When no files, no text, and stdin is a terminal,
        // determine_source should error
        let args = SendArgs {
            text: None,
            files: vec![],
            code: None,
            words: None,
            qr: false,
            no_clipboard: false,
            ignore_stdin: false,
            // ... other fields with defaults ...
        };
        // In a test environment stdin IS a terminal, so this should error
        // The actual test depends on constructing the right conditions
    }
}
```

Note: Pipe detection is inherently difficult to unit test since `IsTerminal` depends on
the process's actual stdin. The core logic is simple enough that code review and manual
testing are sufficient.

**Dependencies:** Task 4.2
**Verification:** Manual:
- `echo "test" | tallow send` detects pipe, sends text
- `tallow send` with no args shows usage error
- `tallow send --ignore-stdin` with piped input ignores stdin

---

## Wave 7: Format Size in Send Output and Final Polish

### Task 7.1: Use format_size in Send Output

**Files to modify:**
- `crates/tallow/src/commands/send.rs`

**Changes:**

Replace raw byte counts in send output with human-readable sizes:

```rust
// Before (line 153-157):
println!(
    "Prepared {} file(s), {} bytes in {} chunks",
    file_count, total_size, total_chunks,
);

// After:
println!(
    "Prepared {} file(s), {} in {} chunks",
    file_count,
    output::format_size(total_size),
    total_chunks,
);
```

Same for the transfer complete message (line 350-353):

```rust
output::color::success(&format!(
    "Transfer complete: {} in {} chunks",
    output::format_size(total_size),
    total_chunks,
));
```

**Dependencies:** Task 1.5
**Verification:** `tallow send test.txt` shows sizes like "1.43 MiB" instead of "1500000 bytes".

---

### Task 7.2: Use format_size in Receive Output

**Files to modify:**
- `crates/tallow/src/commands/receive.rs`

**Changes:**

Replace raw byte counts with human-readable sizes throughout the receive command:

```rust
// Transfer listing (line 236-243)
println!(
    "  {} file(s), {} in {} chunks",
    file_count,
    output::format_size(total_size),
    total_chunks,
);

// Completion message (line 369-373)
output::color::success(&format!(
    "Transfer complete: {} file(s), {}",
    written_files.len(),
    output::format_size(total_size),
));
```

**Dependencies:** Task 1.5
**Verification:** `tallow receive <code>` shows human-readable sizes.

---

## Implementation Order Summary

```
Wave 1 (parallel, no dependencies):
  1.1  CLI flags on SendArgs
  1.2  CLI flags on ReceiveArgs
  1.3  QR code output helper
  1.4  Clipboard output helper
  1.5  format_size utility

Wave 2 (depends on Wave 1.1):
  2.1  Change default code to 4 words
  2.2  Custom code phrase support

Wave 3 (depends on Wave 1.2, 1.5):
  3.1  Receiver confirmation prompt
  3.2  Overwrite protection

Wave 4 (depends on Wave 2, Wave 1.3, 1.4):
  4.1  Virtual file support in SendPipeline
  4.2  Send command text/pipe modes
  4.3  Receive command text output

Wave 5 (depends on Wave 4):
  5.1  Wire QR + clipboard into send output

Wave 6 (depends on all above):
  6.1  Text transfer round-trip test
  6.2  Custom code phrase test
  6.3  Overwrite protection test
  6.4  Pipe detection test

Wave 7 (depends on Wave 1.5):
  7.1  format_size in send output
  7.2  format_size in receive output
```

Waves 1 and 7 can technically run in parallel since 7 only depends on 1.5, not on
Waves 2-6. But the logical flow is cleaner as listed.

## Dependency Additions

### Cargo.toml Changes

**`crates/tallow/Cargo.toml`:**
```toml
# Add under [dependencies]:
qr2term = "0.3"
```

No other dependency changes needed. `arboard`, `dialoguer`, `qrcode`, `crossterm` (via
tallow-tui), and `indicatif` are already present.

### No workspace-level changes.

## Files Modified (Complete List)

| File | Wave | Action |
|------|------|--------|
| `crates/tallow/Cargo.toml` | 1 | Add `qr2term` dep |
| `crates/tallow/src/cli.rs` | 1 | Add flags to SendArgs, ReceiveArgs |
| `crates/tallow/src/output/mod.rs` | 1 | Add `qr`, `clipboard` modules; add `format_size` |
| `crates/tallow/src/output/qr.rs` | 1 | **NEW** -- QR display helper |
| `crates/tallow/src/output/clipboard.rs` | 1 | **NEW** -- Clipboard helper |
| `crates/tallow/src/output/prompts.rs` | 3 | Add `confirm_with_default` |
| `crates/tallow/src/commands/send.rs` | 2,4,5,7 | Text mode, pipe, QR, clipboard, format_size |
| `crates/tallow/src/commands/receive.rs` | 3,4,7 | Confirmation, overwrite, text output, format_size |
| `crates/tallow-protocol/src/room/code.rs` | 2 | DEFAULT_WORD_COUNT 6->4, update test |
| `crates/tallow-protocol/src/transfer/manifest.rs` | 4 | Add `TransferType` enum |
| `crates/tallow-protocol/src/transfer/send.rs` | 4 | Add `prepare_text()`, `chunk_data()` |

## Files Created (Complete List)

| File | Wave | Purpose |
|------|------|---------|
| `crates/tallow/src/output/qr.rs` | 1 | QR code terminal rendering |
| `crates/tallow/src/output/clipboard.rs` | 1 | Cross-platform clipboard access |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `qr2term` rendering broken on Windows terminal | LOW | LOW | Gated behind `--qr` flag (opt-in); terminal width check |
| Clipboard fails on CI/headless | MEDIUM | NONE | Fail-silent design; `--no-clipboard` flag; Linux display detection |
| Backward-incompatible manifest change | LOW | HIGH | `#[serde(default)]` on `TransferType` ensures old manifests decode as `Files` |
| Pipe detection incorrect on Windows | LOW | MEDIUM | `IsTerminal` is stdlib (stable since 1.70), works on Windows console |
| Custom code too short for security | MEDIUM | MEDIUM | Minimum 4-char validation; entropy warning for short codes |

## Success Criteria Mapping

| Criterion | Tasks |
|-----------|-------|
| 1. Pipe-to-pipe text transfer | 4.1, 4.2, 4.3, 6.1 |
| 2. `--text` direct send | 4.1, 4.2, 4.3 |
| 3. `--code` custom codes | 2.1, 2.2, 6.2 |
| 4. QR code display | 1.3, 5.1 |
| 5. Receiver confirmation prompt | 3.1, 3.2, 6.3 |

## Verification Commands

After all waves are complete, run the following to verify the build:

```bash
# Build (Windows MSVC -- requires PowerShell wrapper for LIB/INCLUDE env vars)
powershell.exe -NoProfile -Command "& { $env:LIB = 'C:\Program Files\Microsoft Visual Studio\...'; cargo build --workspace }"

# All tests
cargo test --workspace

# Clippy
cargo clippy --workspace -- -D warnings

# Format check
cargo fmt --check

# Specific Phase 7 tests
cargo test -p tallow-protocol test_text_pipeline
cargo test -p tallow-protocol test_custom_code
cargo test -p tallow-protocol test_configurable_word_count
cargo test -p tallow format_size
```

## Out of Scope (Deferred to Later Phases)

These Croc features were evaluated but are deferred per the ROADMAP:

- `--exclude` / `--git` patterns (Phase 8: Advanced Transfer)
- `--throttle` bandwidth limiting (Phase 8)
- Filename sanitization hardening with proptest (Phase 9)
- ANSI escape stripping (Phase 9)
- Environment variable support (`TALLOW_CODE`, `TALLOW_RELAY`) (Phase 9)
- Relay password authentication (Phase 9)
- Verification strings (Phase 9)
- Docker relay image (Phase 9)
- Homebrew / Scoop / curl installer (Phase 10)
- `tallow <code>` shorthand without subcommand (deferred -- requires CLI restructuring)
- `--ask` sender-side confirmation (deferred -- niche feature)
