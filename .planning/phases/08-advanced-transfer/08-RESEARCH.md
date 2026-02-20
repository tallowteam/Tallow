# Phase 8: Advanced Transfer Features - Research

**Researched:** 2026-02-20
**Domain:** CLI file transfer power-user features, filesystem watching, bandwidth control, transfer queuing
**Confidence:** HIGH (core libraries verified against official docs; patterns verified against existing codebase)

## Summary

Phase 8 layers power-user transfer capabilities onto Tallow's already-working send/receive pipeline. The features split into three complexity tiers: (1) CLI flag additions that are mostly argument parsing plus small wiring (`--exclude`, `--git`, `--throttle`, `--ask`, `--words N`), (2) medium-complexity features that need new modules but follow well-established patterns (transfer queue, path aliases, tab completion), and (3) higher-complexity features that introduce persistent stateful connections (`tallow sync`, `tallow watch`).

The existing codebase is well-positioned for this phase. A `BandwidthLimiter` with token-bucket algorithm already exists in `tallow-net/src/transport/bandwidth.rs` but is not wired into the send pipeline. `notify = "7"` is already a dependency of `tallow-protocol` (though unused in the transfer path). The `ignore` crate (Phase 7 research already identified it) is the standard for gitignore-style exclusions. The `TransferStateMachine` already supports `Paused` state transitions, which is the foundation for a transfer queue.

**Primary recommendation:** Start with the CLI flag features (`--exclude`, `--git`, `--throttle`, `--ask`, `--words N`) since they are self-contained and immediately useful. Then implement the transfer queue as the backbone for sync/watch modes. Defer `tallow watch` and `tallow sync` to last since they depend on the queue infrastructure and introduce the most complexity.

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ignore` | 0.4.25 | Gitignore-style pattern matching, directory walking with exclusions | By BurntSushi (ripgrep author). 80M+ downloads. Handles `.gitignore` patterns, glob exclusions, negation, nested ignore files, symlinks. 20+ edge cases handled correctly. |
| `notify` | 8.2.0 | Cross-platform filesystem watching for watch mode | **Already dep at v7 in tallow-protocol.** Upgrade to v8. Used by rust-analyzer, deno, mdBook. Supports inotify (Linux), FSEvents (macOS), ReadDirectoryChanges (Windows). |
| `notify-debouncer-full` | 0.7.0 | Debounced filesystem events (avoids duplicate events on save) | Companion to notify. Stitches rename events, deduplicates rapid writes. Watch mode needs debouncing to avoid sending the same file 5 times during a save. |
| `bytesize` | 2.3.1 | Parse human-readable sizes like "10MB", "1GB" for `--throttle` flag | Implements `FromStr`, works directly with clap. Supports KB/MB/GB/TB, KiB/MiB/GiB/TiB. |

### Already Available (No New Dependencies)

| Library | Exists In | Purpose | Phase 8 Use |
|---------|-----------|---------|-------------|
| `clap` v4 | tallow/Cargo.toml | CLI argument parsing | New flags: `--exclude`, `--git`, `--throttle`, `--ask`, `--words` |
| `clap_complete` v4 | tallow/Cargo.toml | Shell completion generation | Custom completers for code phrase tab completion |
| `dialoguer` 0.11 | tallow/Cargo.toml | Interactive prompts | `--ask` sender confirmation, path alias selection |
| `tokio` (full) | workspace | Async runtime | Transfer queue via `tokio::sync::mpsc`, `JoinSet`, `Notify` |
| `BandwidthLimiter` | tallow-net/transport/bandwidth.rs | Token-bucket rate limiter | Wire into send pipeline for `--throttle` |
| `TransferStateMachine` | tallow-protocol/transfer/state_machine.rs | Transfer state tracking with Paused state | Foundation for transfer queue pause/resume |
| `tallow-store` config | tallow-store/config/schema.rs | TOML configuration persistence | Store path aliases, default throttle, default word count |
| `serde`/`toml` | workspace | Serialization | Path alias config file |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| `ignore` 0.4 | `globset` + hand-rolled gitignore | `ignore` wraps `globset` AND adds gitignore semantics. 20+ edge cases (negation, directory-only patterns, nested files). |
| `notify` 8 | `watchexec` library | watchexec is a full process-management framework (run commands on change). We only need raw file events. notify is lighter and already a dep. |
| `notify-debouncer-full` | `notify-debouncer-mini` | Mini lacks rename tracking and file ID stitching. Full prevents duplicate events properly for watch mode. |
| `bytesize` | Hand-rolled parser | `FromStr` impl + serde support + display formatting all for free. Parsing "10MB" vs "10MiB" vs "10mb" is surprisingly fiddly. |
| `governor` crate | Existing `BandwidthLimiter` | Governor is a general-purpose rate limiter for API requests. We already have a purpose-built bandwidth limiter using token-bucket. Use what exists. |
| `fast_rsync` (Dropbox) | Full file re-read and re-send | fast_rsync enables delta sync (only send changed bytes). BUT: it uses MD4 hashes (not BLAKE3), adds significant complexity, and Tallow's chunked transfer with BLAKE3 is already efficient for file-level changes. DEFER delta sync to a future phase. |

### Installation

```toml
# In crates/tallow/Cargo.toml [dependencies] -- ADD:
ignore = "0.4"
bytesize = { version = "2", features = ["serde"] }

# In crates/tallow-protocol/Cargo.toml [dependencies] -- UPDATE:
notify = "8"
# ADD:
notify-debouncer-full = "0.7"
```

## Architecture Patterns

### Recommended Changes by Crate

```
crates/tallow/src/
  cli.rs                    # Add new flags to SendArgs, ReceiveArgs
  commands/
    send.rs                 # Wire --exclude, --git, --throttle, --ask, --words
    receive.rs              # Wire --words for code phrase display
    sync.rs                 # NEW: sync command implementation
    watch.rs                # NEW: watch command implementation
    mod.rs                  # Register new command modules

crates/tallow-protocol/src/
  transfer/
    send.rs                 # Accept file filter closure, bandwidth limiter
    queue.rs                # NEW: TransferQueue with pause/resume/cancel
    sync.rs                 # NEW: Directory diff, one-way mirror logic
    watch.rs                # NEW: Filesystem watcher -> transfer trigger

crates/tallow-store/src/
  config/
    schema.rs               # Add path_aliases, default_words, default_throttle
    aliases.rs              # NEW: Path alias CRUD operations
```

### Pattern 1: Directory Walking with Exclusions (ignore crate)

**What:** Replace `SendPipeline::scan_directory()` (which uses raw `tokio::fs::read_dir`) with `ignore::WalkBuilder` for proper gitignore and glob exclusion support.

**When to use:** Any directory send with `--exclude` or `--git` flags.

**Example:**
```rust
// Source: https://docs.rs/ignore/latest/ignore/struct.WalkBuilder.html
use ignore::WalkBuilder;
use ignore::overrides::OverrideBuilder;

/// Walk a directory respecting exclusion patterns and gitignore
fn walk_with_exclusions(
    root: &Path,
    exclude_patterns: &[String],
    respect_gitignore: bool,
) -> Result<Vec<PathBuf>> {
    let mut builder = WalkBuilder::new(root);

    // Toggle gitignore support
    builder.git_ignore(respect_gitignore);
    builder.git_global(respect_gitignore);
    builder.git_exclude(respect_gitignore);

    // Hidden files: show them by default (unlike ripgrep)
    builder.hidden(false);

    // Apply exclusion patterns as overrides (highest precedence)
    if !exclude_patterns.is_empty() {
        let mut overrides = OverrideBuilder::new(root);
        for pattern in exclude_patterns {
            // Negate the pattern: "!pattern" means exclude matching files
            overrides.add(&format!("!{}", pattern))
                .map_err(|e| ProtocolError::TransferFailed(
                    format!("invalid exclude pattern '{}': {}", pattern, e)
                ))?;
        }
        let built = overrides.build()
            .map_err(|e| ProtocolError::TransferFailed(
                format!("failed to build overrides: {}", e)
            ))?;
        builder.overrides(built);
    }

    let files: Vec<PathBuf> = builder
        .build()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().map_or(false, |ft| ft.is_file()))
        .map(|entry| entry.into_path())
        .collect();

    Ok(files)
}
```

### Pattern 2: Bandwidth Throttling (Wire Existing Limiter)

**What:** The `BandwidthLimiter` in `tallow-net/src/transport/bandwidth.rs` already implements a correct token-bucket algorithm. Wire it into the send loop.

**When to use:** `--throttle <rate>` flag on send command.

**Example:**
```rust
// In crates/tallow/src/commands/send.rs
// Parse --throttle flag using bytesize
use bytesize::ByteSize;

let throttle_bps: u64 = if let Some(ref throttle_str) = args.throttle {
    let bs: ByteSize = throttle_str.parse()
        .map_err(|e| io::Error::other(
            format!("Invalid throttle value '{}': {}. Use e.g. '10MB', '500KB'", throttle_str, e)
        ))?;
    bs.as_u64()
} else {
    0 // unlimited
};

let mut bandwidth = tallow_net::transport::BandwidthLimiter::new(throttle_bps);

// In the chunk send loop:
for chunk_msg in &chunk_messages {
    // Throttle before sending
    if throttle_bps > 0 {
        if let Message::Chunk { ref data, .. } = chunk_msg {
            bandwidth.wait_if_needed(data.len()).await;
        }
    }
    // ... encode and send chunk ...
}
```

### Pattern 3: Transfer Queue with Pause/Resume

**What:** A queue manager that holds multiple transfer operations. Each can be individually paused, resumed, or cancelled. Uses `tokio::sync::mpsc` for commands and `tokio::task::JoinSet` for concurrent transfers.

**When to use:** Batch transfers, TUI integration, sync/watch modes that queue multiple file sends.

**Example:**
```rust
// In crates/tallow-protocol/src/transfer/queue.rs
use tokio::sync::{mpsc, Notify};
use std::collections::HashMap;

/// Command sent to the transfer queue manager
pub enum QueueCommand {
    /// Add a new transfer to the queue
    Enqueue(TransferRequest),
    /// Pause a specific transfer
    Pause(TransferId),
    /// Resume a specific transfer
    Resume(TransferId),
    /// Cancel a specific transfer
    Cancel(TransferId),
    /// List all transfers and their states
    List,
}

/// A transfer in the queue
pub struct QueuedTransfer {
    pub id: TransferId,
    pub request: TransferRequest,
    pub state: TransferState,
    pub progress: TransferProgress,
    /// Signal to pause the transfer task
    pause_signal: Arc<Notify>,
}

/// Transfer queue manager
pub struct TransferQueue {
    /// Active and pending transfers
    transfers: HashMap<TransferId, QueuedTransfer>,
    /// Command channel
    cmd_rx: mpsc::Receiver<QueueCommand>,
    /// Max concurrent transfers
    max_concurrent: usize,
}

impl TransferQueue {
    pub fn new(max_concurrent: usize) -> (Self, mpsc::Sender<QueueCommand>) {
        let (tx, rx) = mpsc::channel(64);
        (
            Self {
                transfers: HashMap::new(),
                cmd_rx: rx,
                max_concurrent,
            },
            tx,
        )
    }

    /// Run the queue manager loop
    pub async fn run(&mut self) {
        while let Some(cmd) = self.cmd_rx.recv().await {
            match cmd {
                QueueCommand::Enqueue(req) => self.enqueue(req),
                QueueCommand::Pause(id) => self.pause(&id),
                QueueCommand::Resume(id) => self.resume(&id),
                QueueCommand::Cancel(id) => self.cancel(&id),
                QueueCommand::List => { /* return status */ },
            }
        }
    }

    fn pause(&mut self, id: &TransferId) {
        if let Some(transfer) = self.transfers.get_mut(id) {
            transfer.state = TransferState::Paused;
            // The transfer task checks this and yields
        }
    }

    fn resume(&mut self, id: &TransferId) {
        if let Some(transfer) = self.transfers.get_mut(id) {
            transfer.state = TransferState::Transferring;
            transfer.pause_signal.notify_one();
        }
    }
}
```

### Pattern 4: Filesystem Watch Mode (notify + debouncer)

**What:** `tallow watch <dir>` monitors a directory for changes and triggers sends automatically. Uses `notify-debouncer-full` to coalesce rapid filesystem events (e.g., IDE saving creates 3 events for one file).

**When to use:** `tallow watch` command.

**Example:**
```rust
// In crates/tallow-protocol/src/transfer/watch.rs
use notify_debouncer_full::{new_debouncer, DebounceEventResult};
use notify::RecursiveMode;
use std::time::Duration;
use tokio::sync::mpsc;

/// Watch a directory and send changed file paths through a channel
pub fn start_watcher(
    watch_path: &Path,
    debounce_duration: Duration,
) -> Result<mpsc::Receiver<Vec<PathBuf>>> {
    let (tx, rx) = mpsc::channel(128);
    let watch_path = watch_path.to_path_buf();

    // Spawn blocking because notify's debouncer uses std threads internally
    std::thread::spawn(move || {
        let rt_tx = tx;
        let mut debouncer = new_debouncer(
            debounce_duration,
            None, // No file ID cache needed for our use case
            move |result: DebounceEventResult| {
                match result {
                    Ok(events) => {
                        let changed_files: Vec<PathBuf> = events
                            .into_iter()
                            .filter_map(|e| {
                                // Only care about create/modify events
                                use notify::EventKind;
                                match e.kind {
                                    EventKind::Create(_) | EventKind::Modify(_) => {
                                        Some(e.paths)
                                    }
                                    _ => None,
                                }
                            })
                            .flatten()
                            .filter(|p| p.is_file())
                            .collect();

                        if !changed_files.is_empty() {
                            let _ = rt_tx.blocking_send(changed_files);
                        }
                    }
                    Err(errors) => {
                        for e in errors {
                            tracing::warn!("Watch error: {}", e);
                        }
                    }
                }
            },
        ).expect("Failed to create debouncer");

        debouncer.watch(&watch_path, RecursiveMode::Recursive)
            .expect("Failed to watch path");

        // Keep thread alive
        std::thread::park();
    });

    Ok(rx)
}
```

### Pattern 5: One-Way Directory Sync

**What:** `tallow sync <dir>` compares the local directory manifest against the remote's last-known state and sends only new/changed files. NOT rsync delta-compression -- it works at the file level using BLAKE3 hashes.

**When to use:** `tallow sync` command.

**Example:**
```rust
// In crates/tallow-protocol/src/transfer/sync.rs

/// Compute the diff between local directory and remote manifest
pub fn compute_sync_diff(
    local_files: &[FileEntry],
    remote_manifest: &FileManifest,
) -> SyncDiff {
    let remote_map: HashMap<PathBuf, &FileEntry> = remote_manifest
        .files
        .iter()
        .map(|f| (f.path.clone(), f))
        .collect();

    let mut new_files = Vec::new();
    let mut changed_files = Vec::new();
    let mut deleted_files = Vec::new();

    for local in local_files {
        match remote_map.get(&local.path) {
            None => new_files.push(local.clone()),
            Some(remote) => {
                if local.hash != remote.hash {
                    changed_files.push(local.clone());
                }
                // Same hash = unchanged, skip
            }
        }
    }

    // Files in remote but not in local = deleted
    let local_paths: HashSet<&PathBuf> = local_files.iter().map(|f| &f.path).collect();
    for remote in &remote_manifest.files {
        if !local_paths.contains(&remote.path) {
            deleted_files.push(remote.clone());
        }
    }

    SyncDiff { new_files, changed_files, deleted_files }
}

pub struct SyncDiff {
    pub new_files: Vec<FileEntry>,
    pub changed_files: Vec<FileEntry>,
    pub deleted_files: Vec<FileEntry>,
}
```

### Pattern 6: Path Aliases (Config Storage)

**What:** Save frequently used paths as shortcuts. Stored in `~/.config/tallow/aliases.toml`. Format: `alias = "full/path"`.

**When to use:** `tallow send nas:backups/` or `tallow config alias add nas /mnt/nas`.

**Example:**
```rust
// In crates/tallow-store/src/config/aliases.rs
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Path alias configuration
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct PathAliases {
    pub aliases: HashMap<String, PathBuf>,
}

impl PathAliases {
    /// Resolve a path that may contain an alias prefix (e.g., "nas:backups/")
    pub fn resolve(&self, input: &str) -> PathBuf {
        if let Some((alias, remainder)) = input.split_once(':') {
            if let Some(base_path) = self.aliases.get(alias) {
                return base_path.join(remainder);
            }
        }
        // No alias match, return as-is
        PathBuf::from(input)
    }

    /// Load aliases from config directory
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_dir = crate::persistence::config_dir();
        let aliases_path = config_dir.join("aliases.toml");
        if aliases_path.exists() {
            let contents = std::fs::read_to_string(&aliases_path)?;
            Ok(toml::from_str(&contents)?)
        } else {
            Ok(Self::default())
        }
    }

    /// Save aliases to config directory
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = crate::persistence::config_dir();
        std::fs::create_dir_all(&config_dir)?;
        let aliases_path = config_dir.join("aliases.toml");
        let contents = toml::to_string_pretty(self)?;
        std::fs::write(aliases_path, contents)?;
        Ok(())
    }
}
```

### Pattern 7: --ask Sender Confirmation (Wire Protocol Extension)

**What:** With `--ask`, the sender shows what they are about to send and waits for the receiver to accept BEFORE the sender commits. This requires a new wire protocol message: the receiver sends a `TransferReady` signal that the sender waits for before proceeding.

**When to use:** `tallow send --ask <files>` flag.

**Example:**
```rust
// Sender-side flow with --ask:
// 1. Connect to relay, wait for peer
// 2. Send FileOffer (same as now)
// 3. ALSO prompt locally: "Send N files (X MB) to peer? (Y/n)"
// 4. If sender says no: send FileReject, disconnect
// 5. If sender says yes: wait for receiver's FileAccept (same as now)
// 6. Proceed with transfer

if args.ask {
    // Show transfer summary to sender
    println!("About to send:");
    for file in &args.files {
        let meta = std::fs::metadata(file)?;
        println!("  {} ({})", file.display(), format_size(meta.len()));
    }
    let confirm = dialoguer::Confirm::new()
        .with_prompt("Proceed with transfer?")
        .default(true)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))?;
    if !confirm {
        // Send cancellation to receiver
        let cancel_msg = Message::TransferError {
            transfer_id,
            error: "Sender cancelled transfer".to_string(),
        };
        // encode and send cancel_msg...
        relay.close().await;
        return Ok(());
    }
}
```

### Pattern 8: Tab Completion for Code Phrases

**What:** On the receive side, tab completion that completes partial code phrase words from the EFF wordlist. Uses `clap_complete` v4's `CompleteEnv` with a custom `ArgValueCompleter`.

**When to use:** `tallow receive <TAB>` in a shell with completions installed.

**Note on complexity:** Dynamic completion requires the `unstable-dynamic` feature in `clap_complete` 4.5+ and the binary itself to be invoked for completions. This is a nice-to-have UX touch but is more complex than static completions. The simpler approach is a standalone completer script that greps the EFF wordlist.

**Example (simpler approach -- completion script):**
```bash
# Generated completion script includes EFF wordlist for the code argument
_tallow_complete_code() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    # Split on dashes, complete the last word
    local last_word="${cur##*-}"
    local prefix="${cur%-*}"
    if [ "$prefix" = "$cur" ]; then prefix=""; else prefix="${prefix}-"; fi

    # EFF wordlist embedded in completion script (or loaded from file)
    local words=$(tallow _complete-code "$last_word" 2>/dev/null)
    COMPREPLY=($(compgen -W "$words" -- "$last_word"))
    # Prepend the prefix to each completion
    COMPREPLY=("${COMPREPLY[@]/#/${prefix}}")
}
```

**Example (clap_complete dynamic approach):**
```rust
// Requires clap_complete's unstable-dynamic feature
use clap_complete::engine::ArgValueCompleter;

// In ReceiveArgs:
#[arg(add = ArgValueCompleter::new(complete_code_phrase))]
pub code: Option<String>,

fn complete_code_phrase(current: &std::ffi::OsStr) -> Vec<clap_complete::CompletionCandidate> {
    let current = current.to_string_lossy();
    // Get the last word being typed (after the last dash)
    let last_word = current.rsplit('-').next().unwrap_or("");
    let prefix = if current.contains('-') {
        let idx = current.rfind('-').unwrap();
        &current[..=idx]
    } else {
        ""
    };

    tallow_crypto::kdf::eff_wordlist::EFF_WORDLIST
        .iter()
        .filter(|w| w.starts_with(last_word))
        .take(20)
        .map(|w| {
            clap_complete::CompletionCandidate::new(format!("{}{}", prefix, w))
        })
        .collect()
}
```

### Anti-Patterns to Avoid

- **NEVER use `tokio::fs::read_dir` for directory walking when exclusion patterns are needed.** The `ignore` crate handles gitignore, symlinks, hidden files, and overrides. Hand-rolled walking will miss edge cases.

- **NEVER run filesystem watchers on the tokio runtime directly.** `notify` uses OS-level APIs that spawn their own threads. Use `std::thread::spawn` for the watcher, communicate via `tokio::sync::mpsc` channel.

- **NEVER block the main send loop for throttling.** Use `tokio::time::sleep` (already done in `BandwidthLimiter::wait_if_needed`), not `std::thread::sleep`.

- **NEVER store path aliases with absolute paths from one OS on another.** Path aliases are machine-local config. Document this: aliases are not synced or transferred.

- **NEVER allow watch mode to queue unbounded transfers.** If the user saves 100 files in 1 second, debounce into a single batch transfer, not 100 individual transfers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gitignore pattern matching | Regex-based glob filter | `ignore::WalkBuilder` | 20+ gitignore edge cases (negation, nested, directory-only, parent ignore files). BurntSushi got it right. |
| Human-readable size parsing | Custom "10MB" parser | `bytesize::ByteSize::from_str()` | Handles KB/MB/GB, KiB/MiB/GiB, case-insensitive, decimal fractions. Works with clap via `FromStr`. |
| Filesystem event debouncing | Timer-based dedup | `notify-debouncer-full` | Rename tracking, file ID stitching, cross-platform event coalescing. Saves weeks of edge case debugging. |
| Token-bucket rate limiter | New rate limiter | `tallow_net::transport::BandwidthLimiter` (existing) | Already implemented, tested, uses tokio::time::sleep. Just wire it in. |
| Transfer state management | Boolean flags | `TransferStateMachine` (existing) | Already has Idle/Connecting/Negotiating/Transferring/Paused/Completed/Failed with validated transitions. |

**Key insight:** This phase has an unusually high ratio of "wire existing things together" to "build new things." The bandwidth limiter exists. The state machine exists. notify exists as a dep. The main work is plumbing, not invention.

## Common Pitfalls

### Pitfall 1: Exclude Pattern Syntax Confusion

**What goes wrong:** Users expect shell glob syntax (`*.log`) but `ignore` crate uses gitignore syntax (which is similar but not identical). Leading `/` means "relative to root", `!` means negation. Comma-separated patterns (`--exclude "node_modules,.git"`) need to be split before passing to the override builder.

**Why it happens:** Gitignore syntax is subtly different from shell globs.

**How to avoid:** Split `--exclude` value on commas. Document that patterns follow gitignore syntax. Each pattern gets its own `overrides.add()` call with `!` prefix (since overrides default to "include everything", exclusion patterns need negation).

**Warning signs:** Users reporting "exclude doesn't work" when using complex patterns.

### Pitfall 2: Bandwidth Limiter Drift on Small Chunks

**What goes wrong:** The existing `BandwidthLimiter` resets its window every 1 second. For very small chunk sizes or very low throttle rates, the limiter can allow bursts at the start of each window, causing uneven throughput.

**Why it happens:** Fixed 1-second window with hard reset.

**How to avoid:** The current implementation is adequate for Tallow's use case (64KB chunks, typical throttle rates of 1-100 MB/s). For rates below 100KB/s, the 1-second granularity may cause visible bursts, but this is an edge case. Document the minimum practical throttle rate as ~100KB/s.

**Warning signs:** Users setting `--throttle 10KB` and seeing burst-pause-burst patterns.

### Pitfall 3: Watch Mode Event Storms

**What goes wrong:** An IDE auto-save, git checkout, or build tool can generate hundreds of filesystem events in under a second. Without proper debouncing, the watch loop queues 100 individual transfer attempts.

**Why it happens:** OS filesystem APIs report every individual operation (create temp file, write, rename, delete temp, etc.).

**How to avoid:** Use `notify-debouncer-full` with a 2-second debounce window. After debouncing, collect all changed file paths into a single batch. Only enqueue one transfer per debounce window.

**Warning signs:** Watch mode showing "Sending 1 file" 50 times instead of "Sending 50 files" once.

### Pitfall 4: Sync Mode Accidental Deletion

**What goes wrong:** One-way sync means files deleted locally should be deleted remotely. But if the local manifest scan fails (permission error, symlink loop), it looks like "all files deleted" and the sync tries to delete everything on the remote.

**Why it happens:** Treating scan errors as "file doesn't exist."

**How to avoid:** Implement a safety check: if the sync diff shows > 50% of remote files would be deleted, prompt for confirmation (even without `--ask`). Log the full diff before executing. Never auto-delete in the first implementation -- require `--delete` flag explicitly.

**Warning signs:** Users losing files after running sync with a misconfigured path.

### Pitfall 5: Path Alias Injection

**What goes wrong:** A malicious alias value containing `..` or absolute paths could escape the intended directory. E.g., alias `safe:/etc/shadow` or alias `trick:../../sensitive`.

**Why it happens:** Trust user-configured aliases without validation.

**How to avoid:** Validate alias targets on creation: must be absolute paths that exist, no `..` components. On resolution, canonicalize the result and verify it is under the alias target. Aliases are user-configured (not received from network), so this is a UX protection, not a security boundary.

**Warning signs:** Path traversal in resolved alias paths.

### Pitfall 6: Notify v7 to v8 Breaking Changes

**What goes wrong:** tallow-protocol currently depends on `notify = "7"`. Version 8 changed the `Event` type, `EventKind` variants, and the `Watcher` trait signature. Code written against v7 won't compile with v8.

**Why it happens:** Major version bump with API changes.

**How to avoid:** Upgrade to `notify = "8"` in the same PR that adds watch mode. Since notify is currently unused in the transfer path (it's a declared dep but no code references it in the hot path), this upgrade is safe. The watch mode code should be written against v8 from the start.

**Warning signs:** Compilation errors when changing the version in Cargo.toml.

### Pitfall 7: Code Phrase Word Count Security Implications

**What goes wrong:** `--words 2` gives only ~25.7 bits of entropy from the EFF wordlist. With a fast relay and no PAKE rate limiting, an attacker could brute-force the code in minutes.

**Why it happens:** Users optimize for convenience without understanding the entropy tradeoff.

**How to avoid:** Set minimum to 3 words (~38.7 bits). Default to 4 words (~51.7 bits). With CPace PAKE protecting against offline brute-force, 3 words is the absolute floor for ephemeral sessions. Print a warning if `--words 3` is used: "Reduced code phrase length. Session codes are ephemeral and protected by PAKE."

**Warning signs:** Users requesting `--words 1` or `--words 2`.

## Code Examples

### CLI Flag Additions (SendArgs)

```rust
// In crates/tallow/src/cli.rs -- extend SendArgs
#[derive(Args)]
pub struct SendArgs {
    /// Files or directories to send
    #[arg(required_unless_present = "text")]
    pub files: Vec<PathBuf>,

    // ... existing fields ...

    /// Exclude patterns (comma-separated, gitignore syntax)
    /// Example: --exclude "node_modules,.git,*.log"
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore when sending directories
    #[arg(long)]
    pub git: bool,

    /// Bandwidth throttle (e.g., "10MB", "500KB", "1GB")
    #[arg(long)]
    pub throttle: Option<String>,

    /// Prompt sender for confirmation before transfer starts
    #[arg(long)]
    pub ask: bool,

    /// Number of words in code phrase (default: 4, min: 3, max: 8)
    #[arg(long, default_value = "4")]
    pub words: u8,

    /// Custom code phrase (security depends on phrase entropy)
    #[arg(long)]
    pub code: Option<String>,

    /// Send text directly instead of files
    #[arg(long, short = 't')]
    pub text: Option<String>,
}
```

### Parsing Exclude Patterns

```rust
/// Parse comma-separated exclude patterns into a vec
fn parse_exclude_patterns(exclude: &str) -> Vec<String> {
    exclude
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}
```

### Wiring Bandwidth Limiter into Send Loop

```rust
// In crates/tallow/src/commands/send.rs
use tallow_net::transport::BandwidthLimiter;

// Parse throttle before the send loop
let throttle_bps = parse_throttle(&args.throttle)?;
let mut bandwidth = BandwidthLimiter::new(throttle_bps);

// Inside the chunk send loop (after encoding, before relay.forward):
if throttle_bps > 0 {
    bandwidth.wait_if_needed(encode_buf.len()).await;
}

fn parse_throttle(throttle: &Option<String>) -> io::Result<u64> {
    match throttle {
        None => Ok(0),
        Some(s) => {
            let bs: bytesize::ByteSize = s.parse().map_err(|e| {
                io::Error::other(format!(
                    "Invalid throttle '{}': {}. Use e.g. '10MB', '500KB'", s, e
                ))
            })?;
            Ok(bs.as_u64())
        }
    }
}
```

### SyncArgs and WatchArgs (Separate from SendArgs)

```rust
// In crates/tallow/src/cli.rs -- give sync and watch their own args

#[derive(Args)]
pub struct SyncArgs {
    /// Directory to sync
    pub dir: PathBuf,

    /// Code phrase for the sync session
    #[arg(short, long)]
    pub code: Option<String>,

    /// Delete remote files not present locally
    #[arg(long)]
    pub delete: bool,

    /// Exclude patterns (comma-separated, gitignore syntax)
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore
    #[arg(long)]
    pub git: bool,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433")]
    pub relay: String,
}

#[derive(Args)]
pub struct WatchArgs {
    /// Directory to watch
    pub dir: PathBuf,

    /// Code phrase for the watch session
    #[arg(short, long)]
    pub code: Option<String>,

    /// Debounce duration in seconds (default: 2)
    #[arg(long, default_value = "2")]
    pub debounce: u64,

    /// Exclude patterns (comma-separated, gitignore syntax)
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore
    #[arg(long)]
    pub git: bool,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433")]
    pub relay: String,
}
```

### Config Schema Extension for Path Aliases

```rust
// In crates/tallow-store/src/config/schema.rs -- extend TallowConfig
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TallowConfig {
    pub network: NetworkConfig,
    pub transfer: TransferConfig,
    pub privacy: PrivacyConfig,
    pub ui: UiConfig,
    /// Path aliases for quick access to common directories
    #[serde(default)]
    pub aliases: HashMap<String, PathBuf>,
}
```

### Transfer Queue Integration Point

```rust
// In crates/tallow-protocol/src/transfer/queue.rs
use std::sync::Arc;
use tokio::sync::{mpsc, Notify, RwLock};

pub type TransferId = [u8; 16];

/// Transfer request containing everything needed to execute a transfer
pub struct TransferRequest {
    pub files: Vec<PathBuf>,
    pub relay: String,
    pub code_phrase: String,
    pub compression: CompressionAlgorithm,
    pub throttle_bps: u64,
}

/// Status of a queued transfer
#[derive(Debug, Clone)]
pub struct TransferStatus {
    pub id: TransferId,
    pub state: TransferState,
    pub progress: TransferProgress,
    pub files: Vec<PathBuf>,
}

/// Handle returned when enqueuing a transfer
pub struct TransferHandle {
    pub id: TransferId,
    cmd_tx: mpsc::Sender<QueueCommand>,
}

impl TransferHandle {
    pub async fn pause(&self) -> Result<()> {
        self.cmd_tx.send(QueueCommand::Pause(self.id)).await
            .map_err(|_| ProtocolError::TransferFailed("Queue closed".into()))
    }

    pub async fn resume(&self) -> Result<()> {
        self.cmd_tx.send(QueueCommand::Resume(self.id)).await
            .map_err(|_| ProtocolError::TransferFailed("Queue closed".into()))
    }

    pub async fn cancel(&self) -> Result<()> {
        self.cmd_tx.send(QueueCommand::Cancel(self.id)).await
            .map_err(|_| ProtocolError::TransferFailed("Queue closed".into()))
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `notify` v6/v7 | `notify` v8 (+ debouncer-full v0.7) | 2024-2025 | Cleaner event types, better rename tracking. Upgrade needed. |
| Hand-rolled glob exclusion | `ignore` crate 0.4 by BurntSushi | Stable since 2017 | Gitignore-compatible, battle-tested in ripgrep |
| Custom size parsers | `bytesize` 2.x with `FromStr` | 2023-present | Direct clap integration via `FromStr` |
| Static shell completions only | `clap_complete` 4.5 with `CompleteEnv` | 2024-present | Dynamic completions possible (unstable feature) |
| `fast_rsync` by Dropbox | Still the standard for Rust rsync | 2019-present | Useful for delta sync (future phase), uses MD4 not BLAKE3 |
| Per-request rate limiters (governor) | Built-in `BandwidthLimiter` in tallow-net | Already exists | No new dep needed. Token-bucket with 1s windows. |

**Deprecated/outdated:**
- `notify` v7 is outdated -- v8.2.0 is current. tallow-protocol's dep needs updating.
- `atty` crate is deprecated in favor of `std::io::IsTerminal` (Rust 1.70+)

## Open Questions

1. **Should sync mode persist the remote manifest locally for incremental syncs?**
   - What we know: A one-shot sync needs the receiver to send its manifest back. For repeated syncs, caching the last-known remote state avoids a round-trip.
   - What's unclear: Where to store it (tallow-store persistence? alongside the synced directory?). How to invalidate the cache.
   - Recommendation: For v1, always request the remote manifest. Cache optimization can come later. Store in `~/.local/share/tallow/sync-cache/` keyed by BLAKE3 of the directory path.

2. **Should watch mode maintain a persistent relay connection or reconnect per batch?**
   - What we know: QUIC supports long-lived connections. Reconnecting per batch adds latency but avoids stale connection issues.
   - What's unclear: How the relay handles long-idle connections. Whether QUIC keepalives are sufficient.
   - Recommendation: Maintain a persistent connection with QUIC keepalives. Reconnect on error. The relay already has room timeout logic -- watch mode rooms should disable that timeout or use a longer one.

3. **How should `--words` interact with `--code`?**
   - What we know: `--code` is a custom code phrase. `--words` controls auto-generated phrase length.
   - Recommendation: `--words` is ignored when `--code` is set. They are mutually exclusive in intent. Use `clap`'s `conflicts_with` to enforce this.

4. **Should the transfer queue be exposed in CLI or only TUI?**
   - What we know: CLI is single-transfer-at-a-time. TUI could show a queue dashboard.
   - Recommendation: Build the queue infrastructure in `tallow-protocol` so both can use it. CLI uses it for sync/watch (which queue individual file batches). TUI exposes the full queue UI. Don't add a `tallow queue` CLI command yet.

5. **Delta sync (rsync algorithm) -- when?**
   - What we know: `fast_rsync` by Dropbox exists but uses MD4 (not BLAKE3). Full rsync protocol is complex.
   - Recommendation: DEFER to a future phase. Phase 8 sync works at file granularity (send whole changed files). Delta sync (send only changed blocks within a file) is a significant undertaking with crypto implications (need to integrate with the chunked encryption pipeline).

## Sources

### Primary (HIGH confidence)
- [ignore crate docs (WalkBuilder)](https://docs.rs/ignore/latest/ignore/struct.WalkBuilder.html) -- v0.4.25, API for gitignore patterns and overrides
- [notify crate docs](https://docs.rs/notify/latest/notify/) -- v8.2.0, filesystem watching API
- [notify-debouncer-full docs](https://docs.rs/notify-debouncer-full/latest/notify_debouncer_full/) -- v0.7.0, debounced event handling
- [bytesize crate docs](https://docs.rs/bytesize/latest/bytesize/) -- v2.3.1, human-readable size parsing
- [clap_complete docs](https://docs.rs/clap_complete/latest/clap_complete/) -- v4.5.66, shell completion generation
- Existing codebase: `tallow-net/src/transport/bandwidth.rs` -- BandwidthLimiter (already implemented)
- Existing codebase: `tallow-protocol/src/transfer/state_machine.rs` -- TransferStateMachine with Paused state
- Existing codebase: `tallow-protocol/src/room/code.rs` -- Code phrase generation

### Secondary (MEDIUM confidence)
- [fast_rsync by Dropbox](https://github.com/dropbox/fast_rsync) -- Rsync algorithm in Rust (deferred, not for Phase 8)
- [notify-rs GitHub](https://github.com/notify-rs/notify) -- v8 changelog and migration notes
- [clap_complete dynamic completions discussion](https://github.com/clap-rs/clap/discussions/5806) -- Custom completer patterns

### Tertiary (LOW confidence)
- Transfer queue patterns with tokio -- based on general tokio patterns, not a specific library. Needs validation during implementation.
- Watch mode debounce duration (2 seconds) -- reasonable default but may need tuning based on real-world usage.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All crates verified via official docs. `ignore`, `notify`, `bytesize` are well-established. Key infrastructure (BandwidthLimiter, TransferStateMachine) already exists in codebase.
- Architecture: HIGH -- Patterns follow established Rust async patterns. File exclusion via `ignore` is the same approach used by ripgrep.
- Pitfalls: HIGH -- Most pitfalls derived from actual codebase analysis (notify version mismatch, existing limiter behavior) and documented security issues (sync deletion safety).
- Watch/Sync mode: MEDIUM -- The approach is sound but the protocol-level integration (persistent rooms, manifest exchange) needs validation during implementation.

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable domain, slow-moving dependencies)
