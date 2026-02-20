# Phase 8: Advanced Transfer — Implementation Plan

**Goal**: Power-user transfer features — exclude patterns, gitignore support, bandwidth throttling, transfer queue, one-way sync, watch mode, path aliases, and code phrase tab completion.

**Depends on**: Phase 7 (Core Croc UX) — assumes `--code`, `--words`, `--text`, `--yes`, `--ask` flags already exist on `SendArgs`/`ReceiveArgs` from Phase 7.

**Success Criteria** (from ROADMAP.md):
1. `tallow send --exclude "node_modules,.git" ./project` sends the directory without excluded patterns
2. `tallow send --git ./repo` respects `.gitignore` files in the repository
3. `tallow send --throttle 10MB file.iso` limits transfer speed to ~10 MB/s
4. `tallow watch ./dir` monitors for changes and auto-sends modified files to the connected peer
5. `tallow sync ./dir` sends only new/changed files compared to the receiver's last-known state

**Estimated scope**: ~30 files created/modified across 4 crates

---

## Dependency & Cargo.toml Changes (Pre-Wave)

Before any implementation wave begins, these dependency changes must be applied.

### Task 0.1: Add `ignore` and `bytesize` to `tallow` crate

**File**: `crates/tallow/Cargo.toml`

**Changes**:
```toml
# Under [dependencies], add:
ignore = "0.4"
bytesize = { version = "2", features = ["serde"] }
```

**Rationale**: `ignore` provides gitignore-aware directory walking (by BurntSushi, used in ripgrep). `bytesize` provides `FromStr` for human-readable size parsing (`"10MB"`, `"500KB"`).

**Verification**: `cargo check -p tallow` compiles.

### Task 0.2: Add `ignore` to `tallow-protocol` crate

**File**: `crates/tallow-protocol/Cargo.toml`

**Changes**:
```toml
# Under [dependencies], add:
ignore = "0.4"
```

The `tallow-protocol` `SendPipeline` needs `ignore::WalkBuilder` for the directory scanning with exclusion logic. The alternative is accepting a pre-filtered file list from the CLI layer, but the pipeline owns scanning logic today (`scan_directory`), so the filter belongs at the same level.

**Verification**: `cargo check -p tallow-protocol` compiles.

### Task 0.3: Upgrade `notify` v7 to v8 and add `notify-debouncer-full`

**File**: `crates/tallow-protocol/Cargo.toml`

**Changes**:
```toml
# Change existing:
notify = "7"
# To:
notify = "8"
# Add new:
notify-debouncer-full = "0.7"
```

`notify` v8 has breaking API changes vs v7. Since `notify` is currently a declared dep with no active usage in the transfer hot path, the upgrade is safe. Watch mode code will be written against v8 from the start.

**Verification**: `cargo check -p tallow-protocol` compiles. Existing tests pass (no code currently uses notify in tests).

### Task 0.4: Add `bytesize` to `tallow-store` crate

**File**: `crates/tallow-store/Cargo.toml`

**Changes**:
```toml
# Under [dependencies], add:
bytesize = { version = "2", features = ["serde"] }
```

Needed for serializing `default_throttle` in config schema as a human-readable string.

**Verification**: `cargo check -p tallow-store` compiles.

---

## Wave 1: CLI Flags & File Exclusion (No New Commands)

These tasks are self-contained CLI flag additions that modify existing send behavior. No new subcommands. All tasks in Wave 1 are independent of each other and can be implemented in parallel.

---

### Task 1.1: `--exclude` and `--git` Flags on SendArgs

**Depends on**: Task 0.1, Task 0.2

**Files to modify**:
- `crates/tallow/src/cli.rs` — Add flags to `SendArgs`
- `crates/tallow/src/commands/send.rs` — Parse and pass exclusion config to pipeline
- `crates/tallow-protocol/src/transfer/send.rs` — Accept exclusion config in `scan_directory`

**Files to create**:
- `crates/tallow-protocol/src/transfer/exclusion.rs` — Exclusion pattern parsing and `ignore::WalkBuilder` integration

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Add two fields to `SendArgs`:
```rust
/// Exclude patterns (comma-separated, gitignore syntax)
/// Example: --exclude "node_modules,.git,*.log"
#[arg(long)]
pub exclude: Option<String>,

/// Respect .gitignore files when sending directories
#[arg(long)]
pub git: bool,
```

#### `crates/tallow-protocol/src/transfer/exclusion.rs` (NEW)

Create a new module that wraps `ignore::WalkBuilder`:

```rust
//! File exclusion and gitignore-aware directory walking

use ignore::overrides::OverrideBuilder;
use ignore::WalkBuilder;
use std::path::{Path, PathBuf};
use crate::{ProtocolError, Result};

/// Configuration for file exclusion during directory scanning
#[derive(Debug, Clone, Default)]
pub struct ExclusionConfig {
    /// Patterns to exclude (gitignore syntax)
    pub patterns: Vec<String>,
    /// Whether to respect .gitignore files
    pub respect_gitignore: bool,
}

impl ExclusionConfig {
    /// Create config from a comma-separated exclude string
    pub fn from_exclude_str(exclude: Option<&str>, gitignore: bool) -> Self {
        let patterns = exclude
            .map(|s| {
                s.split(',')
                    .map(|p| p.trim().to_string())
                    .filter(|p| !p.is_empty())
                    .collect()
            })
            .unwrap_or_default();
        Self {
            patterns,
            respect_gitignore: gitignore,
        }
    }

    /// Returns true if this config has any active exclusion rules
    pub fn is_active(&self) -> bool {
        !self.patterns.is_empty() || self.respect_gitignore
    }

    /// Walk a directory with exclusion rules applied, returning matching file paths
    pub fn walk_directory(&self, root: &Path) -> Result<Vec<PathBuf>> {
        let mut builder = WalkBuilder::new(root);

        builder.git_ignore(self.respect_gitignore);
        builder.git_global(self.respect_gitignore);
        builder.git_exclude(self.respect_gitignore);
        builder.hidden(false); // Show hidden files by default (unlike ripgrep)

        if !self.patterns.is_empty() {
            let mut overrides = OverrideBuilder::new(root);
            for pattern in &self.patterns {
                // Negate: overrides default to "include all", so "!pattern" = exclude
                overrides.add(&format!("!{}", pattern)).map_err(|e| {
                    ProtocolError::TransferFailed(format!(
                        "invalid exclude pattern '{}': {}", pattern, e
                    ))
                })?;
            }
            let built = overrides.build().map_err(|e| {
                ProtocolError::TransferFailed(format!("failed to build overrides: {}", e))
            })?;
            builder.overrides(built);
        }

        let files: Vec<PathBuf> = builder
            .build()
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.file_type().is_some_and(|ft| ft.is_file()))
            .map(|entry| entry.into_path())
            .collect();

        Ok(files)
    }
}
```

#### `crates/tallow-protocol/src/transfer/mod.rs`

Add the new module:
```rust
pub mod exclusion;
pub use exclusion::ExclusionConfig;
```

#### `crates/tallow-protocol/src/transfer/send.rs`

Add a `with_exclusion` builder method to `SendPipeline`:
```rust
/// Exclusion configuration for directory scanning
exclusion: ExclusionConfig,
```

Initialize in `new()` as `ExclusionConfig::default()`.

Add builder method:
```rust
/// Set file exclusion configuration
pub fn with_exclusion(mut self, config: ExclusionConfig) -> Self {
    self.exclusion = config;
    self
}
```

Modify `scan_directory` to use `ExclusionConfig::walk_directory()` when exclusion is active:
```rust
async fn scan_directory(&mut self, base: &Path, dir: &Path) -> Result<()> {
    if self.exclusion.is_active() && dir == base {
        // Use ignore-crate walker for the entire tree
        let files = self.exclusion.walk_directory(base)?;
        for file_path in files {
            let data = tokio::fs::read(&file_path).await.map_err(|e| {
                ProtocolError::TransferFailed(format!("read {}: {}", file_path.display(), e))
            })?;
            let hash: [u8; 32] = blake3::hash(&data).into();
            let relative = file_path.strip_prefix(base).unwrap_or(&file_path).to_path_buf();
            self.manifest.add_file(relative, data.len() as u64, hash);
        }
        return Ok(());
    }
    // ... existing tokio::fs::read_dir fallback for non-excluded scans ...
}
```

#### `crates/tallow/src/commands/send.rs`

Wire the flags into the pipeline:
```rust
use tallow_protocol::transfer::ExclusionConfig;

let exclusion = ExclusionConfig::from_exclude_str(
    args.exclude.as_deref(),
    args.git,
);
let mut pipeline = tallow_protocol::transfer::SendPipeline::new(transfer_id, *session_key.as_bytes())
    .with_compression(compression)
    .with_exclusion(exclusion);
```

**Verification**:
- Unit test in `exclusion.rs`: Create temp directory with `node_modules/`, `.git/`, `src/main.rs`, `.gitignore`. Verify `--exclude "node_modules,.git"` omits those dirs. Verify `--git` reads `.gitignore`.
- Integration test: `tallow send --exclude "*.log" ./testdir` produces manifest without `.log` files.
- `cargo test -p tallow-protocol -- exclusion`

---

### Task 1.2: `--throttle` Flag — Wire Existing BandwidthLimiter

**Depends on**: Task 0.1

**Files to modify**:
- `crates/tallow/src/cli.rs` — Add `--throttle` to `SendArgs`
- `crates/tallow/src/commands/send.rs` — Parse throttle value, apply to send loop

**No new files required** — uses existing `tallow_net::transport::BandwidthLimiter`.

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Add to `SendArgs`:
```rust
/// Bandwidth throttle limit (e.g., "10MB", "500KB", "1GB")
/// Limits transfer speed to approximately this rate per second.
#[arg(long)]
pub throttle: Option<String>,
```

#### `crates/tallow/src/commands/send.rs`

Add a throttle parsing helper:
```rust
/// Parse a human-readable throttle string into bytes per second
fn parse_throttle(throttle: &Option<String>) -> io::Result<u64> {
    match throttle {
        None => Ok(0),
        Some(s) => {
            let bs: bytesize::ByteSize = s.parse().map_err(|e| {
                io::Error::other(format!(
                    "Invalid throttle '{}': {}. Examples: '10MB', '500KB', '1GB'", s, e
                ))
            })?;
            Ok(bs.as_u64())
        }
    }
}
```

In the send loop, before each `relay.forward()` call:
```rust
let throttle_bps = parse_throttle(&args.throttle)?;
let mut bandwidth = tallow_net::transport::BandwidthLimiter::new(throttle_bps);

// Inside the chunk send loop, after encoding:
if throttle_bps > 0 {
    bandwidth.wait_if_needed(encode_buf.len()).await;
}
```

If a default throttle is configured (Task 3.1), fall back to it when `--throttle` is not specified on the CLI.

**Verification**:
- Unit test: `parse_throttle(Some("10MB"))` returns `10_000_000`. `parse_throttle(Some("garbage"))` returns `Err`.
- Manual test: `tallow send --throttle 100KB bigfile.bin` — observe progress bar advancing at ~100KB/s.
- `cargo test -p tallow -- parse_throttle`

---

### Task 1.3: `--ask` Flag — Sender Confirmation Prompt

**Depends on**: Task 0.1

**Note**: Phase 7 may already add `--ask` to `SendArgs`. If so, this task only wires the prompt logic into the send flow. If Phase 7 does not add it, add the flag here.

**Files to modify**:
- `crates/tallow/src/cli.rs` — Add `--ask` to `SendArgs` (if not already present from Phase 7)
- `crates/tallow/src/commands/send.rs` — Add confirmation prompt before transfer

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Add to `SendArgs` (if not already present):
```rust
/// Prompt sender for confirmation before starting transfer
#[arg(long)]
pub ask: bool,
```

#### `crates/tallow/src/commands/send.rs`

After the manifest is built and file summary is displayed, before connecting to relay:
```rust
if args.ask {
    use dialoguer::Confirm;
    let size_display = bytesize::ByteSize(total_size).to_string();
    let confirm = Confirm::new()
        .with_prompt(format!(
            "Send {} file(s) ({})? ",
            file_count, size_display
        ))
        .default(true)
        .interact()
        .map_err(|e| io::Error::other(format!("Prompt failed: {}", e)))?;
    if !confirm {
        if json {
            println!("{}", serde_json::json!({"event": "cancelled", "reason": "sender_declined"}));
        } else {
            output::color::info("Transfer cancelled by sender.");
        }
        return Ok(());
    }
}
```

**Verification**:
- Manual test: `tallow send --ask file.txt` — shows prompt, type `n` to cancel, verify no relay connection made.
- JSON mode: `tallow send --ask --json file.txt` — `n` produces `{"event":"cancelled","reason":"sender_declined"}`.

---

### Task 1.4: `--words` Flag — Configurable Code Phrase Length

**Depends on**: Task 0.1

**Note**: Phase 7 may already add `--words`. If so, skip CLI addition and only verify the security floor.

**Files to modify**:
- `crates/tallow/src/cli.rs` — Add `--words` to `SendArgs` (if not already present)
- `crates/tallow/src/commands/send.rs` — Use word count in code phrase generation
- `crates/tallow-protocol/src/room/code.rs` — Ensure `generate_code_phrase` accepts arbitrary count

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Add to `SendArgs` (if not already present):
```rust
/// Number of words in generated code phrase (min: 3, max: 8, default: 4)
#[arg(long, default_value = "4", value_parser = clap::value_parser!(u8).range(3..=8))]
pub words: u8,
```

Use `clap`'s `conflicts_with` if `--code` also exists:
```rust
#[arg(long, default_value = "4", value_parser = clap::value_parser!(u8).range(3..=8), conflicts_with = "code")]
pub words: u8,
```

#### `crates/tallow/src/commands/send.rs`

Replace the hardcoded word count:
```rust
let code_phrase = if let Some(room) = &args.room {
    room.clone()
} else if let Some(code) = &args.code {
    code.clone()
} else {
    // Print warning for minimum word count
    if args.words == 3 {
        tracing::warn!("Reduced code phrase (3 words, ~38.7 bits). Protected by PAKE for ephemeral sessions.");
        if !json {
            output::color::warn("Warning: Shorter code phrase. Secure for ephemeral transfers only.");
        }
    }
    tallow_protocol::room::code::generate_code_phrase(args.words as usize)
};
```

**Verification**:
- `tallow send --words 3 file.txt` — produces 3-word code phrase with warning.
- `tallow send --words 2 file.txt` — rejected by clap with "value 2 not in range 3..=8".
- `tallow send --words 5 --code mycode file.txt` — rejected by clap with "cannot use `--words` and `--code` together".
- `cargo test -p tallow-protocol -- generate_code_phrase`

---

## Wave 2: Config Schema Extensions & Path Aliases

These tasks extend the configuration layer. They depend on Wave 1 only to the extent that the config fields they add are consumed by Wave 1 flags as defaults.

---

### Task 2.1: Extend Config Schema with Transfer Defaults

**Depends on**: Task 0.4

**Files to modify**:
- `crates/tallow-store/src/config/schema.rs` — Add new fields to `TransferConfig`
- `crates/tallow-store/src/config/defaults.rs` — Add default values

**Detailed changes**:

#### `crates/tallow-store/src/config/schema.rs`

Extend `TransferConfig`:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferConfig {
    /// Default download directory
    pub download_dir: PathBuf,
    /// Auto-accept from trusted contacts
    pub auto_accept_trusted: bool,
    /// Enable compression
    pub enable_compression: bool,
    /// Chunk size in bytes
    pub chunk_size: usize,
    /// Default bandwidth throttle (e.g., "10MB", empty = unlimited)
    #[serde(default)]
    pub default_throttle: String,
    /// Default number of words in code phrase (3-8)
    #[serde(default = "default_word_count")]
    pub default_words: u8,
    /// Default exclude patterns (comma-separated, gitignore syntax)
    #[serde(default)]
    pub default_exclude: String,
    /// Respect .gitignore by default when sending directories
    #[serde(default)]
    pub default_gitignore: bool,
}

fn default_word_count() -> u8 {
    4
}
```

Add a new top-level section to `TallowConfig`:
```rust
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TallowConfig {
    pub network: NetworkConfig,
    pub transfer: TransferConfig,
    pub privacy: PrivacyConfig,
    pub ui: UiConfig,
    /// Path aliases for quick directory access
    #[serde(default)]
    pub aliases: std::collections::HashMap<String, PathBuf>,
}
```

Update the `Default` impl for `TransferConfig` to set the new fields:
```rust
default_throttle: String::new(),  // unlimited
default_words: 4,
default_exclude: String::new(),
default_gitignore: false,
```

**Verification**:
- `cargo test -p tallow-store -- test_roundtrip_toml` — existing roundtrip test still passes with new fields.
- New test: serialize a config with `default_throttle = "10MB"` to TOML, deserialize back, verify field preserved.
- New test: deserialize a TOML missing the new fields — verify `#[serde(default)]` fills in defaults without error.

---

### Task 2.2: Path Alias CRUD Module

**Depends on**: Task 2.1

**Files to create**:
- `crates/tallow-store/src/config/aliases.rs` — Path alias resolution, validation, CRUD

**Files to modify**:
- `crates/tallow-store/src/config/mod.rs` — Register `aliases` module
- `crates/tallow-store/src/config/loader.rs` — Add alias get/set helpers (optional convenience)

**Detailed changes**:

#### `crates/tallow-store/src/config/aliases.rs` (NEW)

```rust
//! Path alias management
//!
//! Aliases map short names to absolute directory paths for quick access.
//! Example: "nas" -> "/mnt/nas/share", used as `tallow send nas:backups/`.

use crate::{Result, StoreError};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Resolve a path string that may contain an alias prefix.
///
/// Format: `alias:subpath` resolves to `<alias_target>/subpath`.
/// If no alias prefix is found, returns the input as a `PathBuf`.
pub fn resolve_alias(input: &str, aliases: &HashMap<String, PathBuf>) -> PathBuf {
    if let Some((alias, remainder)) = input.split_once(':') {
        // Avoid matching Windows drive letters (e.g., "C:")
        if alias.len() == 1 && alias.chars().next().is_some_and(|c| c.is_ascii_alphabetic()) {
            return PathBuf::from(input);
        }
        if let Some(base) = aliases.get(alias) {
            return base.join(remainder);
        }
    }
    PathBuf::from(input)
}

/// Validate an alias name.
///
/// Alias names must be alphanumeric (plus hyphens/underscores), non-empty,
/// and not a single letter (to avoid conflict with Windows drive letters).
pub fn validate_alias_name(name: &str) -> Result<()> {
    if name.is_empty() {
        return Err(StoreError::ConfigError("Alias name cannot be empty".into()));
    }
    if name.len() == 1 && name.chars().next().is_some_and(|c| c.is_ascii_alphabetic()) {
        return Err(StoreError::ConfigError(
            "Single-letter alias names conflict with Windows drive letters".into(),
        ));
    }
    if !name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err(StoreError::ConfigError(
            "Alias names may only contain alphanumeric characters, hyphens, and underscores".into(),
        ));
    }
    Ok(())
}

/// Validate an alias target path.
///
/// Target must be an absolute path. We do NOT require it to exist at alias
/// creation time (removable drives, network mounts, etc.), but we do reject
/// paths containing `..` components.
pub fn validate_alias_target(target: &Path) -> Result<()> {
    if !target.is_absolute() {
        return Err(StoreError::ConfigError(format!(
            "Alias target must be an absolute path, got: {}",
            target.display()
        )));
    }
    for component in target.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err(StoreError::ConfigError(format!(
                "Alias target must not contain '..' components: {}",
                target.display()
            )));
        }
    }
    Ok(())
}

/// Add an alias to the config.
pub fn add_alias(
    aliases: &mut HashMap<String, PathBuf>,
    name: &str,
    target: &Path,
) -> Result<()> {
    validate_alias_name(name)?;
    validate_alias_target(target)?;
    aliases.insert(name.to_string(), target.to_path_buf());
    Ok(())
}

/// Remove an alias from the config. Returns true if it existed.
pub fn remove_alias(aliases: &mut HashMap<String, PathBuf>, name: &str) -> bool {
    aliases.remove(name).is_some()
}

/// List all aliases.
pub fn list_aliases(aliases: &HashMap<String, PathBuf>) -> Vec<(&str, &Path)> {
    let mut items: Vec<(&str, &Path)> = aliases
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_path()))
        .collect();
    items.sort_by_key(|(name, _)| *name);
    items
}
```

#### `crates/tallow-store/src/config/mod.rs`

Add:
```rust
pub mod aliases;
```

**Verification**:
- Unit test: `resolve_alias("nas:backups/today", &map)` returns `/mnt/nas/backups/today` when `map["nas"] = "/mnt/nas"`.
- Unit test: `resolve_alias("C:\\Users\\file", &map)` returns `C:\Users\file` (not treated as alias).
- Unit test: `validate_alias_name("a")` returns `Err` (single letter).
- Unit test: `validate_alias_target(Path::new("relative/path"))` returns `Err`.
- Unit test: `add_alias` + `remove_alias` roundtrip.
- `cargo test -p tallow-store -- aliases`

---

### Task 2.3: `tallow config alias` CLI Subcommand

**Depends on**: Task 2.2

**Files to modify**:
- `crates/tallow/src/cli.rs` — Add `Alias` subcommand under `ConfigCommands`
- `crates/tallow/src/commands/config_cmd.rs` — Handle alias CRUD

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Add to `ConfigCommands`:
```rust
/// Manage path aliases
Alias {
    #[command(subcommand)]
    command: AliasCommands,
},
```

New enum:
```rust
#[derive(Subcommand)]
pub enum AliasCommands {
    /// Add a path alias
    Add {
        /// Alias name (e.g., "nas")
        name: String,
        /// Target directory path (absolute)
        path: PathBuf,
    },
    /// Remove a path alias
    Remove {
        /// Alias name
        name: String,
    },
    /// List all path aliases
    List,
}
```

#### `crates/tallow/src/commands/config_cmd.rs`

Handle `ConfigCommands::Alias { command }`:
```rust
AliasCommands::Add { name, path } => {
    let mut config = tallow_store::config::load_config()
        .map_err(|e| io::Error::other(format!("{}", e)))?;
    tallow_store::config::aliases::add_alias(&mut config.aliases, &name, &path)
        .map_err(|e| io::Error::other(format!("{}", e)))?;
    tallow_store::config::save_config(&config)
        .map_err(|e| io::Error::other(format!("{}", e)))?;
    if !json { output::color::success(&format!("Alias '{}' -> {}", name, path.display())); }
}
AliasCommands::Remove { name } => { ... }
AliasCommands::List => { ... }
```

#### `crates/tallow/src/commands/send.rs`

At the top of `execute()`, resolve aliases in file paths:
```rust
let config = tallow_store::config::load_config().unwrap_or_default();
let files: Vec<PathBuf> = args.files.iter()
    .map(|f| tallow_store::config::aliases::resolve_alias(
        &f.to_string_lossy(), &config.aliases
    ))
    .collect();
```

**Verification**:
- `tallow config alias add nas /mnt/nas` — succeeds, persists to config file.
- `tallow config alias list` — shows `nas -> /mnt/nas`.
- `tallow send nas:docs/file.txt` — resolves to `/mnt/nas/docs/file.txt`.
- `tallow config alias remove nas` — removes the alias.

---

### Task 2.4: Load Config Defaults into Send/Receive Flags

**Depends on**: Task 2.1, Task 1.1, Task 1.2, Task 1.4

**Files to modify**:
- `crates/tallow/src/commands/send.rs` — Fall back to config defaults for `--throttle`, `--words`, `--exclude`, `--git`

**Detailed changes**:

In `send::execute()`, after loading config:
```rust
let config = tallow_store::config::load_config().unwrap_or_default();

// Apply config defaults where CLI flags are not set
let throttle = args.throttle.clone()
    .or_else(|| {
        let t = &config.transfer.default_throttle;
        if t.is_empty() { None } else { Some(t.clone()) }
    });

let word_count = if args.words != 4 {
    args.words  // User explicitly set it
} else {
    config.transfer.default_words
};

let git_flag = args.git || config.transfer.default_gitignore;

let exclude = args.exclude.clone()
    .or_else(|| {
        let e = &config.transfer.default_exclude;
        if e.is_empty() { None } else { Some(e.clone()) }
    });
```

**Verification**:
- Set `default_throttle = "1MB"` in config, run `tallow send file.txt` without `--throttle` — observe ~1MB/s rate.
- Set `default_words = 5`, run `tallow send file.txt` — code phrase has 5 words.
- Explicit `--throttle 10MB` overrides config default.

---

## Wave 3: Transfer Queue Infrastructure

The transfer queue is the backbone for sync and watch modes. It must be built before those features.

---

### Task 3.1: Transfer Queue Module

**Depends on**: None (uses only existing `TransferStateMachine` and `tokio` primitives)

**Files to create**:
- `crates/tallow-protocol/src/transfer/queue.rs` — Transfer queue manager

**Files to modify**:
- `crates/tallow-protocol/src/transfer/mod.rs` — Register `queue` module

**Detailed changes**:

#### `crates/tallow-protocol/src/transfer/queue.rs` (NEW)

Core types:
```rust
//! Transfer queue with pause, resume, and cancel support
//!
//! Manages multiple concurrent transfers. Used by sync and watch modes
//! to batch file sends without overwhelming the relay connection.

use crate::transfer::state_machine::{TransferState, TransferStateMachine};
use crate::{ProtocolError, Result};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{mpsc, Notify, RwLock};

/// Opaque transfer identifier
pub type TransferId = [u8; 16];

/// Command sent to the transfer queue
#[derive(Debug)]
pub enum QueueCommand {
    /// Enqueue a new transfer
    Enqueue(TransferRequest),
    /// Pause a running transfer
    Pause(TransferId),
    /// Resume a paused transfer
    Resume(TransferId),
    /// Cancel a transfer (running or queued)
    Cancel(TransferId),
    /// Query all transfer statuses
    ListStatus(tokio::sync::oneshot::Sender<Vec<TransferStatus>>),
    /// Shut down the queue
    Shutdown,
}

/// A request to transfer files
#[derive(Debug, Clone)]
pub struct TransferRequest {
    /// Files to transfer
    pub files: Vec<PathBuf>,
    /// Relay server address
    pub relay: String,
    /// Code phrase for this transfer
    pub code_phrase: String,
    /// Bandwidth throttle (bytes/sec, 0 = unlimited)
    pub throttle_bps: u64,
}

/// Status snapshot of a queued transfer
#[derive(Debug, Clone)]
pub struct TransferStatus {
    /// Transfer ID
    pub id: TransferId,
    /// Current state
    pub state: TransferState,
    /// Bytes transferred so far
    pub bytes_transferred: u64,
    /// Total bytes
    pub total_bytes: u64,
    /// File paths
    pub files: Vec<PathBuf>,
}

/// A queued transfer entry
struct QueueEntry {
    id: TransferId,
    request: TransferRequest,
    state_machine: TransferStateMachine,
    bytes_transferred: u64,
    total_bytes: u64,
    /// Notify signal for pause/resume
    pause_signal: Arc<Notify>,
    /// Cancel token
    cancel: tokio_util::sync::CancellationToken,
}

/// Transfer queue manager
pub struct TransferQueue {
    entries: HashMap<TransferId, QueueEntry>,
    cmd_rx: mpsc::Receiver<QueueCommand>,
    max_concurrent: usize,
    active_count: usize,
}

/// Handle for sending commands to the queue
#[derive(Clone)]
pub struct QueueHandle {
    cmd_tx: mpsc::Sender<QueueCommand>,
}
```

The `TransferQueue` runs as a long-lived task (`pub async fn run(&mut self)`). The `QueueHandle` is cheap to clone and is passed to sync/watch modes.

Key behaviors:
- `Enqueue`: If `active_count < max_concurrent`, start immediately. Otherwise, mark as `Idle` (pending).
- `Pause`: Set state to `Paused`. The transfer task checks a shared `AtomicBool` or `Notify` before each chunk send.
- `Resume`: Set state to `Transferring`, notify the pause signal.
- `Cancel`: Drop the `CancellationToken`, which causes the transfer task's `select!` to exit.
- `Shutdown`: Cancel all transfers, drain the queue.
- When a transfer completes or fails, decrement `active_count` and start the next pending entry.

**Verification**:
- Unit test: Enqueue 3 transfers with `max_concurrent=1`. First starts immediately, second and third are pending. When first completes, second starts.
- Unit test: Enqueue a transfer, pause it, verify state is `Paused`. Resume, verify state is `Transferring`.
- Unit test: Cancel a pending transfer, verify it is removed from the queue.
- `cargo test -p tallow-protocol -- queue`

---

### Task 3.2: Wire Queue into State Machine Transitions

**Depends on**: Task 3.1

**Files to modify**:
- `crates/tallow-protocol/src/transfer/state_machine.rs` — Add `Queued` state and transitions

**Detailed changes**:

Add a new state:
```rust
/// Queued, waiting for a slot
Queued,
```

Add valid transitions:
```rust
(TransferState::Idle, TransferState::Queued) => true,
(TransferState::Queued, TransferState::Connecting) => true,
(TransferState::Queued, TransferState::Failed) => true,  // already covered by wildcard
```

**Verification**:
- Existing state machine tests still pass.
- New test: `Idle -> Queued -> Connecting` is valid. `Queued -> Transferring` is invalid (must go through Connecting first).

---

## Wave 4: Sync and Watch Commands

These are the most complex features. They depend on the transfer queue (Wave 3) and exclusion support (Wave 1).

---

### Task 4.1: Sync — Directory Diff Module

**Depends on**: Wave 1 (exclusion), Task 3.1 (queue)

**Files to create**:
- `crates/tallow-protocol/src/transfer/sync.rs` — Directory diff computation

**Files to modify**:
- `crates/tallow-protocol/src/transfer/mod.rs` — Register `sync` module

**Detailed changes**:

#### `crates/tallow-protocol/src/transfer/sync.rs` (NEW)

```rust
//! One-way directory synchronization
//!
//! Compares a local directory manifest against a remote manifest and produces
//! a diff of new, changed, and deleted files. Works at file granularity
//! using BLAKE3 hashes (NOT delta/rsync block-level sync).

use crate::transfer::manifest::{FileEntry, FileManifest};
use crate::Result;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

/// Result of comparing local vs remote directory state
#[derive(Debug, Clone)]
pub struct SyncDiff {
    /// Files that exist locally but not remotely
    pub new_files: Vec<FileEntry>,
    /// Files that exist on both sides but have different hashes
    pub changed_files: Vec<FileEntry>,
    /// Files that exist remotely but not locally (candidates for deletion)
    pub deleted_files: Vec<FileEntry>,
}

impl SyncDiff {
    /// Returns true if there are no differences
    pub fn is_empty(&self) -> bool {
        self.new_files.is_empty() && self.changed_files.is_empty() && self.deleted_files.is_empty()
    }

    /// Total number of files that need to be transferred (new + changed)
    pub fn transfer_count(&self) -> usize {
        self.new_files.len() + self.changed_files.len()
    }

    /// Total bytes that need to be transferred
    pub fn transfer_bytes(&self) -> u64 {
        let new_bytes: u64 = self.new_files.iter().map(|f| f.size).sum();
        let changed_bytes: u64 = self.changed_files.iter().map(|f| f.size).sum();
        new_bytes + changed_bytes
    }

    /// Fraction of remote files that would be deleted (safety check)
    pub fn deletion_fraction(&self, remote_file_count: usize) -> f64 {
        if remote_file_count == 0 {
            return 0.0;
        }
        self.deleted_files.len() as f64 / remote_file_count as f64
    }
}

/// Compute the diff between a local file list and a remote manifest
pub fn compute_sync_diff(
    local_files: &[FileEntry],
    remote_manifest: &FileManifest,
) -> SyncDiff {
    let remote_map: HashMap<&PathBuf, &FileEntry> = remote_manifest
        .files
        .iter()
        .map(|f| (&f.path, f))
        .collect();

    let mut new_files = Vec::new();
    let mut changed_files = Vec::new();

    for local in local_files {
        match remote_map.get(&local.path) {
            None => new_files.push(local.clone()),
            Some(remote) => {
                if local.hash != remote.hash {
                    changed_files.push(local.clone());
                }
            }
        }
    }

    let local_paths: HashSet<&PathBuf> = local_files.iter().map(|f| &f.path).collect();
    let deleted_files: Vec<FileEntry> = remote_manifest
        .files
        .iter()
        .filter(|f| !local_paths.contains(&f.path))
        .cloned()
        .collect();

    SyncDiff {
        new_files,
        changed_files,
        deleted_files,
    }
}
```

**Verification**:
- Unit test: Local has `{a.txt(hash1), b.txt(hash2), c.txt(hash3)}`, remote has `{a.txt(hash1), b.txt(hashX), d.txt(hash4)}`. Diff = new: `c.txt`, changed: `b.txt`, deleted: `d.txt`.
- Unit test: Identical manifests produce empty diff.
- Unit test: `deletion_fraction` returns 0.5 when 1 of 2 remote files is deleted.
- `cargo test -p tallow-protocol -- sync`

---

### Task 4.2: Sync CLI Command and Protocol Flow

**Depends on**: Task 4.1, Task 2.3 (aliases), Task 1.1 (exclusion)

**Files to create**:
- `crates/tallow/src/commands/sync.rs` — Sync command implementation

**Files to modify**:
- `crates/tallow/src/cli.rs` — Replace `Sync(SendArgs)` with `Sync(SyncArgs)` using dedicated args struct
- `crates/tallow/src/commands/mod.rs` — Register `sync` module
- `crates/tallow/src/main.rs` — Wire `Commands::Sync` to `commands::sync::execute`

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Replace the existing `Sync(SendArgs)` variant:
```rust
/// Sync a directory with a remote peer (one-way: local -> remote)
Sync(SyncArgs),
```

Add new args struct:
```rust
#[derive(Args)]
pub struct SyncArgs {
    /// Directory to sync
    pub dir: PathBuf,

    /// Code phrase for the sync session
    #[arg(short, long)]
    pub code: Option<String>,

    /// Delete remote files not present locally (DANGEROUS — requires explicit opt-in)
    #[arg(long)]
    pub delete: bool,

    /// Exclude patterns (comma-separated, gitignore syntax)
    #[arg(long)]
    pub exclude: Option<String>,

    /// Respect .gitignore files
    #[arg(long)]
    pub git: bool,

    /// Bandwidth throttle (e.g., "10MB")
    #[arg(long)]
    pub throttle: Option<String>,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433")]
    pub relay: String,

    /// SOCKS5 proxy address
    #[arg(long)]
    pub proxy: Option<String>,
}
```

#### `crates/tallow/src/commands/sync.rs` (NEW)

The sync flow:
1. Connect to relay, join room.
2. Scan local directory (with exclusion support) to build local manifest.
3. Receive remote peer's manifest (new wire message: `ManifestExchange`).
4. Compute `SyncDiff`.
5. Safety check: if `deletion_fraction > 0.5`, prompt for confirmation even without `--ask`.
6. Send only new + changed files via the existing `SendPipeline::chunk_file`.
7. If `--delete`, send a `SyncDeleteList` message with paths to remove on remote.
8. Complete.

The sync command does NOT use the transfer queue for v1 (single sync operation). The queue integration is for watch mode (Task 4.4).

**Wire protocol considerations**: Sync needs two new message types. These should be added to the `Message` enum in `crates/tallow-protocol/src/wire/messages.rs`:
```rust
/// Exchange manifests for sync comparison
ManifestExchange {
    transfer_id: [u8; 16],
    manifest: Vec<u8>,
},
/// Request deletion of files on the remote side
SyncDeleteList {
    transfer_id: [u8; 16],
    paths: Vec<PathBuf>,
},
```

**Verification**:
- Integration test: Create two temp directories. Dir A has `{a.txt, b.txt}`. Dir B has `{a.txt(different content), c.txt}`. Sync A -> B. B now has `{a.txt(A's version), b.txt, c.txt}`. With `--delete`, B has `{a.txt, b.txt}`.
- Unit test: Sync diff safety check triggers when >50% would be deleted.
- `cargo test -p tallow -- sync`

---

### Task 4.3: Watch — Filesystem Watcher Module

**Depends on**: Task 0.3 (notify v8 + debouncer)

**Files to create**:
- `crates/tallow-protocol/src/transfer/watch.rs` — Filesystem watcher with debouncing

**Files to modify**:
- `crates/tallow-protocol/src/transfer/mod.rs` — Register `watch` module

**Detailed changes**:

#### `crates/tallow-protocol/src/transfer/watch.rs` (NEW)

```rust
//! Filesystem watch mode with debounced event handling
//!
//! Monitors a directory for changes and sends batched file change notifications
//! through a tokio channel. Uses notify-debouncer-full to coalesce rapid events.

use notify::RecursiveMode;
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::sync::mpsc;

/// A batch of changed files detected by the watcher
#[derive(Debug, Clone)]
pub struct WatchEvent {
    /// Changed file paths (deduplicated)
    pub changed_files: Vec<PathBuf>,
    /// Timestamp of the batch
    pub timestamp: std::time::Instant,
}

/// Configuration for the filesystem watcher
#[derive(Debug, Clone)]
pub struct WatchConfig {
    /// Directory to watch
    pub path: PathBuf,
    /// Debounce duration (coalesce events within this window)
    pub debounce_duration: Duration,
    /// Whether to watch recursively
    pub recursive: bool,
}

impl Default for WatchConfig {
    fn default() -> Self {
        Self {
            path: PathBuf::from("."),
            debounce_duration: Duration::from_secs(2),
            recursive: true,
        }
    }
}

/// Start a filesystem watcher that sends batched change events.
///
/// Returns a receiver channel for watch events and a handle to stop the watcher.
/// The watcher runs on a dedicated OS thread (notify uses platform-specific APIs
/// that must NOT run on the tokio runtime).
pub fn start_watcher(
    config: WatchConfig,
) -> crate::Result<(mpsc::Receiver<WatchEvent>, WatchHandle)> {
    let (tx, rx) = mpsc::channel(128);
    let (stop_tx, stop_rx) = std::sync::mpsc::channel::<()>();

    let watch_path = config.path.clone();
    let debounce_duration = config.debounce_duration;
    let recursive = config.recursive;

    std::thread::Builder::new()
        .name("tallow-watcher".into())
        .spawn(move || {
            let rt_tx = tx;
            let mut debouncer = match new_debouncer(
                debounce_duration,
                None,
                move |result: DebounceEventResult| {
                    match result {
                        Ok(events) => {
                            let changed_files: Vec<PathBuf> = events
                                .into_iter()
                                .filter_map(|e| {
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
                                .collect::<std::collections::HashSet<_>>()
                                .into_iter()
                                .collect();

                            if !changed_files.is_empty() {
                                let event = WatchEvent {
                                    changed_files,
                                    timestamp: std::time::Instant::now(),
                                };
                                let _ = rt_tx.blocking_send(event);
                            }
                        }
                        Err(errors) => {
                            for e in errors {
                                tracing::warn!("Filesystem watch error: {}", e);
                            }
                        }
                    }
                },
            ) {
                Ok(d) => d,
                Err(e) => {
                    tracing::error!("Failed to create debouncer: {}", e);
                    return;
                }
            };

            let mode = if recursive {
                RecursiveMode::Recursive
            } else {
                RecursiveMode::NonRecursive
            };

            if let Err(e) = debouncer.watch(&watch_path, mode) {
                tracing::error!("Failed to watch {}: {}", watch_path.display(), e);
                return;
            }

            tracing::info!("Watching {} for changes", watch_path.display());

            // Block until stop signal received
            let _ = stop_rx.recv();
            tracing::info!("Watcher stopped");
        })
        .map_err(|e| {
            crate::ProtocolError::TransferFailed(format!("Failed to spawn watcher thread: {}", e))
        })?;

    Ok((rx, WatchHandle { stop_tx }))
}

/// Handle to stop the filesystem watcher
pub struct WatchHandle {
    stop_tx: std::sync::mpsc::Sender<()>,
}

impl WatchHandle {
    /// Stop the watcher
    pub fn stop(self) {
        let _ = self.stop_tx.send(());
    }
}
```

**Verification**:
- Integration test: Create a temp dir, start watcher, write a file, verify `WatchEvent` received within debounce window.
- Integration test: Write 10 files rapidly, verify single batched event (not 10 separate events).
- Test `WatchHandle::stop()` terminates the watcher thread.
- `cargo test -p tallow-protocol -- watch`

---

### Task 4.4: Watch CLI Command

**Depends on**: Task 4.3 (watcher), Task 1.1 (exclusion), Task 3.1 (queue)

**Files to create**:
- `crates/tallow/src/commands/watch.rs` — Watch command implementation

**Files to modify**:
- `crates/tallow/src/cli.rs` — Replace `Watch(ReceiveArgs)` with `Watch(WatchArgs)` using dedicated args struct
- `crates/tallow/src/commands/mod.rs` — Register `watch` module
- `crates/tallow/src/main.rs` — Wire `Commands::Watch` to `commands::watch::execute`

**Detailed changes**:

#### `crates/tallow/src/cli.rs`

Replace the existing `Watch(ReceiveArgs)` variant:
```rust
/// Watch a directory for changes and auto-send to connected peer
Watch(WatchArgs),
```

Add new args struct:
```rust
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

    /// Respect .gitignore files
    #[arg(long)]
    pub git: bool,

    /// Bandwidth throttle (e.g., "10MB")
    #[arg(long)]
    pub throttle: Option<String>,

    /// Relay server address
    #[arg(long, default_value = "129.146.114.5:4433")]
    pub relay: String,

    /// SOCKS5 proxy address
    #[arg(long)]
    pub proxy: Option<String>,
}
```

#### `crates/tallow/src/commands/watch.rs` (NEW)

The watch flow:
1. Validate watch directory exists.
2. Connect to relay, join room with code phrase (persistent connection).
3. Start filesystem watcher with debounce.
4. Loop: receive `WatchEvent` from channel.
   a. Filter changed files through exclusion config.
   b. For each batch: build a mini-manifest, send files through existing `SendPipeline`.
   c. Display "Sent N files (X bytes)" after each batch.
5. On Ctrl+C: stop watcher, close relay, exit.

```rust
//! Watch command — monitor directory and auto-send changes

use crate::cli::WatchArgs;
use crate::output;
use std::io;

/// Execute watch command
pub async fn execute(args: WatchArgs, json: bool) -> io::Result<()> {
    // Validate directory
    if !args.dir.exists() || !args.dir.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Watch directory not found: {}", args.dir.display()),
        ));
    }

    let debounce = std::time::Duration::from_secs(args.debounce);

    // Start watcher
    let watch_config = tallow_protocol::transfer::watch::WatchConfig {
        path: args.dir.clone(),
        debounce_duration: debounce,
        recursive: true,
    };

    let (mut event_rx, watch_handle) = tallow_protocol::transfer::watch::start_watcher(watch_config)
        .map_err(|e| io::Error::other(format!("Failed to start watcher: {}", e)))?;

    // Generate/use code phrase
    let code_phrase = args.code.clone().unwrap_or_else(|| {
        tallow_protocol::room::code::generate_code_phrase(4)
    });

    if !json {
        output::color::info(&format!("Watching: {}", args.dir.display()));
        output::color::info(&format!("Code phrase: {}", code_phrase));
        println!("On the receiving end, run:");
        println!("  tallow receive {}", code_phrase);
        println!();
        output::color::info("Waiting for changes... (Ctrl+C to stop)");
    }

    // Connect to relay (persistent connection)
    // ... relay connect logic ...

    // Build exclusion config
    let exclusion = tallow_protocol::transfer::ExclusionConfig::from_exclude_str(
        args.exclude.as_deref(), args.git,
    );

    // Event loop
    while let Some(event) = event_rx.recv().await {
        // Filter through exclusion patterns
        let files_to_send: Vec<_> = event.changed_files.into_iter()
            .filter(|f| {
                // Check if file matches any exclude pattern
                // (simplified: full implementation uses the ignore walker)
                true // placeholder — full filtering logic here
            })
            .collect();

        if files_to_send.is_empty() {
            continue;
        }

        if !json {
            output::color::info(&format!(
                "Detected {} changed file(s), sending...",
                files_to_send.len()
            ));
        }

        // Send files through existing pipeline
        // ... chunk and send each file ...
    }

    watch_handle.stop();
    Ok(())
}
```

**Verification**:
- Manual test: `tallow watch ./testdir` in one terminal. In another terminal, run `tallow receive <code>`. Modify a file in `testdir`. Verify receiver gets the update.
- Manual test: Save 10 files rapidly in IDE. Verify single batch send (not 10 separate sends).
- `tallow watch --exclude "*.tmp" ./dir` — verify `.tmp` files are not sent.
- `tallow watch --debounce 5 ./dir` — verify 5-second batch window.

---

## Wave 5: Tab Completion & Polish

Final wave for UX polish features. Can start in parallel with Wave 4 since it touches different files.

---

### Task 5.1: Tab Completion for Code Phrases

**Depends on**: None (uses existing `clap_complete` and EFF wordlist)

**Files to modify**:
- `crates/tallow/src/commands/completions.rs` — Enhance completion script generation
- `crates/tallow/src/cli.rs` — (Optional) Add hidden `_complete-code` subcommand

**Detailed changes**:

Two approaches, implement the simpler one first:

**Approach A (simpler, recommended for v1)**: Add a hidden subcommand `_complete-code` that outputs matching EFF words for a prefix. The shell completion script calls this.

#### `crates/tallow/src/cli.rs`

Add hidden subcommand:
```rust
/// Internal: complete code phrase words (used by shell completion scripts)
#[command(hide = true)]
CompleteCode {
    /// Partial word to complete
    prefix: String,
},
```

#### Handle in `main.rs`:
```rust
cli::Commands::CompleteCode { prefix } => {
    let wordlist = &tallow_crypto::kdf::eff_wordlist::EFF_WORDLIST;
    for word in wordlist.iter().filter(|w| w.starts_with(prefix.as_str())) {
        println!("{}", word);
    }
    Ok(())
}
```

#### `crates/tallow/src/commands/completions.rs`

When generating bash completions, append a custom completer function that calls `tallow _complete-code` for the `receive` subcommand's `code` argument. This is a post-processing step on the clap-generated completion script.

**Verification**:
- `tallow _complete-code "app"` outputs words starting with "app" from EFF wordlist.
- Generated bash completion script sources without error.
- Pressing TAB after `tallow receive ` shows EFF word suggestions (in a bash shell with completions installed).

---

### Task 5.2: Integrate Config Defaults in Receive Command

**Depends on**: Task 2.1

**Files to modify**:
- `crates/tallow/src/commands/receive.rs` — Load config defaults for download directory, auto-accept

**Detailed changes**:

At the start of `receive::execute()`:
```rust
let config = tallow_store::config::load_config().unwrap_or_default();

// Use config download dir if --output not specified
let output_dir = args.output
    .unwrap_or_else(|| config.transfer.download_dir.clone());
```

This is a small change but ensures consistency between config and CLI.

**Verification**:
- Set `download_dir = "/tmp/tallow-downloads"` in config. Run `tallow receive <code>` without `--output`. Verify files land in configured directory.

---

### Task 5.3: JSON Output for New Commands

**Depends on**: Task 4.2 (sync), Task 4.4 (watch)

**Files to modify**:
- `crates/tallow/src/commands/sync.rs` — Add JSON event output
- `crates/tallow/src/commands/watch.rs` — Add JSON event output

**Detailed changes**:

Both sync and watch commands must support `--json` mode with structured events:

For sync:
```json
{"event": "sync_diff", "new_files": 3, "changed_files": 1, "deleted_files": 2, "transfer_bytes": 15000}
{"event": "sync_sending", "file": "new-file.txt", "bytes": 5000}
{"event": "sync_complete", "transferred": 4, "deleted": 2, "bytes": 15000}
```

For watch:
```json
{"event": "watch_started", "directory": "./dir", "code": "alpha-bravo-charlie-delta"}
{"event": "watch_detected", "changed_files": ["file1.txt", "file2.txt"]}
{"event": "watch_sent", "files": 2, "bytes": 8000}
```

**Verification**:
- `tallow sync --json ./dir` output is valid JSON (pipe through `jq .`).
- `tallow watch --json ./dir` output is valid JSON.

---

## Summary: Task Dependency Graph

```
Task 0.1 (deps: tallow)
Task 0.2 (deps: tallow-protocol)     ─┐
Task 0.3 (deps: notify upgrade)       │  Pre-Wave (all independent)
Task 0.4 (deps: tallow-store)        ─┘

Task 1.1 (exclude/git)     ← 0.1, 0.2
Task 1.2 (throttle)        ← 0.1         Wave 1 (all independent)
Task 1.3 (ask)              ← 0.1
Task 1.4 (words)            ← 0.1

Task 2.1 (config schema)   ← 0.4
Task 2.2 (alias CRUD)      ← 2.1         Wave 2 (sequential within wave)
Task 2.3 (alias CLI)        ← 2.2
Task 2.4 (config defaults)  ← 2.1, 1.1, 1.2, 1.4

Task 3.1 (queue module)     ← (none)     Wave 3
Task 3.2 (queue states)     ← 3.1

Task 4.1 (sync diff)        ← 1.1, 3.1
Task 4.2 (sync CLI)         ← 4.1, 2.3   Wave 4 (sync & watch can parallel)
Task 4.3 (watch module)     ← 0.3
Task 4.4 (watch CLI)        ← 4.3, 1.1, 3.1

Task 5.1 (tab completion)   ← (none)
Task 5.2 (receive defaults) ← 2.1        Wave 5 (independent, can parallel with Wave 4)
Task 5.3 (JSON output)      ← 4.2, 4.4
```

## Files Created (NEW)

| File | Crate | Purpose |
|------|-------|---------|
| `crates/tallow-protocol/src/transfer/exclusion.rs` | tallow-protocol | Gitignore-aware file exclusion via `ignore` crate |
| `crates/tallow-protocol/src/transfer/queue.rs` | tallow-protocol | Transfer queue with pause/resume/cancel |
| `crates/tallow-protocol/src/transfer/sync.rs` | tallow-protocol | Directory diff computation for one-way sync |
| `crates/tallow-protocol/src/transfer/watch.rs` | tallow-protocol | Filesystem watcher with debounced events |
| `crates/tallow-store/src/config/aliases.rs` | tallow-store | Path alias CRUD, validation, resolution |
| `crates/tallow/src/commands/sync.rs` | tallow | `tallow sync` command implementation |
| `crates/tallow/src/commands/watch.rs` | tallow | `tallow watch` command implementation |

## Files Modified

| File | Changes |
|------|---------|
| `crates/tallow/Cargo.toml` | Add `ignore`, `bytesize` deps |
| `crates/tallow-protocol/Cargo.toml` | Add `ignore`, upgrade `notify` 7->8, add `notify-debouncer-full` |
| `crates/tallow-store/Cargo.toml` | Add `bytesize` dep |
| `crates/tallow/src/cli.rs` | Add `--exclude`, `--git`, `--throttle`, `--ask`, `--words` to `SendArgs`; replace `Sync(SendArgs)` with `Sync(SyncArgs)`; replace `Watch(ReceiveArgs)` with `Watch(WatchArgs)`; add `AliasCommands`; add hidden `CompleteCode` |
| `crates/tallow/src/commands/mod.rs` | Register `sync`, `watch` modules |
| `crates/tallow/src/commands/send.rs` | Wire exclusion, throttle, ask, words, alias resolution |
| `crates/tallow/src/commands/receive.rs` | Load config defaults for output dir |
| `crates/tallow/src/commands/config_cmd.rs` | Handle `Alias` subcommand |
| `crates/tallow/src/commands/completions.rs` | Enhance completion script with code phrase completer |
| `crates/tallow/src/main.rs` | Wire `Sync`, `Watch`, `CompleteCode` to new handlers |
| `crates/tallow-protocol/src/transfer/mod.rs` | Register `exclusion`, `queue`, `sync`, `watch` modules |
| `crates/tallow-protocol/src/transfer/send.rs` | Add `with_exclusion` builder, modify `scan_directory` |
| `crates/tallow-protocol/src/transfer/state_machine.rs` | Add `Queued` state and transitions |
| `crates/tallow-protocol/src/wire/messages.rs` | Add `ManifestExchange`, `SyncDeleteList` message variants |
| `crates/tallow-store/src/config/schema.rs` | Add `default_throttle`, `default_words`, `default_exclude`, `default_gitignore`, `aliases` fields |
| `crates/tallow-store/src/config/mod.rs` | Register `aliases` module |
| `crates/tallow-store/src/config/defaults.rs` | Add defaults for new fields |

## Test Plan

### Unit Tests (per module)

| Module | Tests | Count |
|--------|-------|-------|
| `exclusion.rs` | Pattern parsing, directory walk with excludes, gitignore respect, empty patterns, invalid patterns | ~8 |
| `queue.rs` | Enqueue/dequeue, pause/resume, cancel, max concurrency, shutdown, empty queue | ~10 |
| `sync.rs` | Diff computation, empty diff, all-new files, all-deleted, mixed changes, deletion fraction safety | ~8 |
| `watch.rs` | Event batching, debounce coalescing, stop handle, recursive mode | ~5 |
| `aliases.rs` | Resolve with/without alias, Windows drive letter handling, validation (name, target), add/remove/list | ~10 |
| `schema.rs` | Roundtrip with new fields, backward compat (missing fields use defaults) | ~3 |
| `state_machine.rs` | New `Queued` state transitions | ~3 |

**Estimated new tests: ~47**

### Integration Tests

| Test | Description |
|------|-------------|
| `send_with_exclude` | Send directory excluding `*.log` files, verify manifest |
| `send_with_gitignore` | Send git repo respecting `.gitignore`, verify `node_modules/` excluded |
| `send_with_throttle` | Send large file with throttle, verify transfer time is bounded |
| `sync_new_and_changed` | Sync two directories, verify only delta transferred |
| `sync_delete_safety` | Sync with >50% deletion triggers safety prompt |
| `watch_detect_changes` | Watch directory, write file, verify event received |
| `alias_resolution` | Set alias, send with alias path, verify correct file sent |
| `config_defaults_applied` | Set config defaults, verify send uses them |

### Verification Commands

```bash
# Full test suite
cargo test --workspace

# Phase 8 specific
cargo test -p tallow-protocol -- exclusion
cargo test -p tallow-protocol -- queue
cargo test -p tallow-protocol -- sync
cargo test -p tallow-protocol -- watch
cargo test -p tallow-store -- aliases
cargo test -p tallow -- parse_throttle
cargo test -p tallow -- sync
cargo test -p tallow -- watch

# Lint
cargo clippy --workspace -- -D warnings

# Format
cargo fmt --check
```

## Open Questions (Resolved)

| Question | Resolution |
|----------|-----------|
| Should sync persist remote manifest locally? | No for v1. Always request from remote. Cache in future phase. |
| Persistent relay connection for watch? | Yes. Maintain QUIC connection with keepalives. Reconnect on error. |
| `--words` vs `--code` interaction? | `conflicts_with` in clap. Mutually exclusive. |
| Transfer queue in CLI or TUI only? | Queue infrastructure in `tallow-protocol`. CLI uses it for sync/watch internally. No `tallow queue` command. |
| Delta sync (rsync algorithm)? | DEFERRED. Phase 8 sync is file-granularity only. |

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| `notify` v7->v8 breaks existing code | No existing code uses notify in hot paths. Upgrade is safe. Verify with `cargo check`. |
| Watch mode event storms | `notify-debouncer-full` with 2-second window. Deduplicate paths in batch. |
| Sync accidental deletion | Safety check: prompt if >50% files would be deleted. Require `--delete` flag. |
| Path alias injection | Validate: absolute paths only, no `..` components. Canonicalize on resolution. |
| `--words 3` insufficient entropy | Enforce minimum 3 words (~38.7 bits). Print warning. CPace PAKE protects against offline brute-force. |
| Bandwidth limiter burst on low rates | Documented: minimum practical throttle ~100KB/s. Adequate for real-world usage. |

## Coding Standards Checklist

- [ ] No `.unwrap()` outside `#[cfg(test)]`
- [ ] No `println!` — use `tracing` macros for internal logging, `output::color::*` or explicit `println!` only for user-facing CLI output
- [ ] `thiserror` for library errors in `tallow-protocol` and `tallow-store`; `anyhow`/`io::Error` only in `tallow` binary
- [ ] All public items have `///` doc comments
- [ ] All new modules have `//!` module-level doc comments
- [ ] `#![forbid(unsafe_code)]` preserved in all crates
- [ ] `cargo clippy --workspace -- -D warnings` passes
- [ ] `cargo fmt --check` passes
- [ ] New structs with secret data derive `Zeroize` where applicable (not relevant for Phase 8 — no new key material)
