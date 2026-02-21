# Phase 12: TUI Integration -- Execution Plan

## Overview

Wire the existing Ratatui widget library in `tallow-tui` into a working async dashboard with live transfer progress, identity display, overlay system, and terminal restoration. The crate already has 182 passing tests and 28+ widget modules -- this phase connects them to a real event loop and live data, not build new widgets.

## Pre-Conditions

- Phase 11 (Real KEM Key Exchange) complete or skippable -- TUI integration does not depend on the handshake mechanism, only on the transfer progress channel interface.
- `cargo test -p tallow-tui` passes (182 tests, 0 failures).
- `cargo clippy -p tallow-tui -- -D warnings` is clean.

## Success Criteria (from ROADMAP.md)

1. `tallow tui` launches a multi-panel dashboard showing identity fingerprint, relay connection status, and transfer history.
2. Starting a send/receive while in TUI mode shows real-time progress bars with speed, ETA, and percentage.
3. The overlay system works -- pressing `?` shows help, `i` shows identity details, overlays stack and dismiss correctly.
4. Terminal is fully restored on exit (q/Ctrl+C) or crash -- no residual artifacts, screen cleared.
5. TUI renders without panic on terminals from 80x24 to 300x80, gracefully degrading on small sizes.

---

## Wave 1: Core Architecture

**Goal**: Replace the blocking synchronous event loop with an async `tokio::select!`-based loop, introduce the `TuiAction` channel for background task communication, and refactor `App` state to support the new architecture. After this wave, the TUI launches with an async loop, receives tick events, handles keyboard input, and can accept actions from spawned tasks -- but no widgets are wired yet beyond what exists today.

### Task 1.1: Add `futures` dependency to tallow-tui

**File**: `E:\Tallow\crates\tallow-tui\Cargo.toml`

**What to change**: Add `futures.workspace = true` to `[dependencies]`. This is needed for `futures::StreamExt` which is required to call `.next()` on `crossterm::event::EventStream`. The `futures` crate is already a workspace dependency in the root `Cargo.toml` but is not currently listed in `tallow-tui/Cargo.toml`.

**Verification**: `cargo check -p tallow-tui` compiles without error.

### Task 1.2: Define TuiAction enum

**File**: `E:\Tallow\crates\tallow-tui\src\app.rs`

**What to change**: Add a `TuiAction` enum that represents all messages that background tasks can send to the TUI. This is the core message type for the action channel.

```rust
use std::path::PathBuf;
use std::time::Duration;

/// Actions sent from background tasks to the TUI main loop
#[derive(Debug, Clone)]
pub enum TuiAction {
    // Transfer lifecycle
    TransferStarted {
        id: [u8; 16],
        filename: String,
        total_bytes: u64,
        direction: TransferDirection,
    },
    TransferProgress {
        id: [u8; 16],
        bytes_done: u64,
        speed_bps: u64,
    },
    TransferComplete {
        id: [u8; 16],
        elapsed: Duration,
    },
    TransferError {
        id: [u8; 16],
        error: String,
    },

    // Connection lifecycle
    RelayConnected { addr: String },
    RelayDisconnected,
    PeerJoined { room_code: String },
    PeerLeft,

    // User-initiated (forwarded to background tasks)
    InitiateSend { files: Vec<PathBuf>, relay: String },
    InitiateReceive { code: String, relay: String },

    // System
    Quit,
}
```

**Verification**: `cargo check -p tallow-tui` compiles. Existing tests pass.

### Task 1.3: Define Overlay enum and ActiveTransfer / TransferStatus types

**File**: `E:\Tallow\crates\tallow-tui\src\app.rs`

**What to change**: Add the `Overlay` enum, `ActiveTransfer` struct, and `TransferStatus` enum. These support the overlay stack (Wave 3) and the expanded transfer state (Wave 2), but defining them now avoids a breaking refactor later.

```rust
/// Stackable overlay types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Overlay {
    Help,
    IdentityDetail,
    TransferConfirm { filename: String, size: u64 },
}

/// Status of an active transfer
#[derive(Debug, Clone)]
pub enum TransferStatus {
    Preparing,
    WaitingForPeer,
    InProgress,
    Complete { elapsed: Duration },
    Failed { error: String },
}

/// Expanded transfer state, keyed by transfer ID
#[derive(Debug, Clone)]
pub struct ActiveTransfer {
    pub id: [u8; 16],
    pub filename: String,
    pub total_bytes: u64,
    pub bytes_done: u64,
    pub speed_bps: u64,
    pub direction: TransferDirection,
    pub status: TransferStatus,
    pub started_at: std::time::Instant,
}
```

**Verification**: `cargo check -p tallow-tui` compiles. Existing tests pass.

### Task 1.4: Refactor App state

**File**: `E:\Tallow\crates\tallow-tui\src\app.rs`

**What to change**: Expand the `App` struct with new fields while keeping all existing fields to avoid breaking the 182 existing tests. Add:

1. `pub overlays: Vec<Overlay>` -- replaces `show_help: bool` as the overlay mechanism. Keep `show_help` as a computed accessor for backward compatibility with existing render code.
2. `pub identity_fingerprint: Option<String>` -- loaded from `tallow_store::identity::IdentityStore` at startup.
3. `pub active_transfers: std::collections::HashMap<[u8; 16], ActiveTransfer>` -- keyed by transfer ID. The existing `transfers: Vec<TransferInfo>` remains for backward compatibility with existing panel renderers; a method `sync_transfer_info()` copies from `active_transfers` into `transfers`.
4. `pub tick_count: u64` -- incremented on each tick, used by spinner.
5. `pub spinner: crate::widgets::spinner::Spinner` -- for animated status indicator.

Add methods:

- `pub fn push_overlay(&mut self, overlay: Overlay)` -- pushes if not duplicate.
- `pub fn pop_overlay(&mut self)` -- pops topmost.
- `pub fn top_overlay(&self) -> Option<&Overlay>` -- peeks.
- `pub fn tick(&mut self)` -- advances `tick_count`, ticks spinner, syncs transfer info.
- `pub fn apply_action(&mut self, action: TuiAction)` -- processes incoming action.
- `pub fn sync_transfer_info(&mut self)` -- copies `active_transfers` into the legacy `transfers: Vec<TransferInfo>` for backward-compatible panel rendering.

**Critical constraint**: Do NOT remove `show_help: bool`. Instead, make `toggle_help()` push/pop `Overlay::Help` from the overlay stack AND set `show_help` accordingly. This keeps existing test assertions working.

**Verification**: `cargo test -p tallow-tui` -- all 182 tests pass. The `App::new()` constructor still works with sensible defaults.

### Task 1.5: Create async run function in lib.rs

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs`

**What to change**: Add a new `pub async fn run_async(...)` function alongside the existing `TuiApp::run()`. The existing synchronous `run()` method stays for backward compatibility but will be deprecated. The new async entry point:

1. Accepts optional `identity_fingerprint: Option<String>` and `initial_mode: TuiMode` parameters.
2. Checks `std::io::stdin().is_terminal()` -- if not, returns an error (raw mode conflicts with piped stdin).
3. Checks terminal size >= 60x16 -- if smaller, returns an error with a helpful message.
4. Calls `security::install_panic_handler()`.
5. Sets up terminal (enable_raw_mode, EnterAlternateScreen, Hide cursor).
6. Creates `App::new()` with the provided identity fingerprint.
7. Creates `crossterm::event::EventStream::new()`.
8. Creates `tokio::sync::mpsc::channel::<TuiAction>(256)`.
9. Creates `tokio::time::interval(Duration::from_millis(100))` for tick timer.
10. Enters the main loop:

```rust
loop {
    terminal.draw(|frame| render::render(frame, &app))?;

    tokio::select! {
        Some(Ok(event)) = event_stream.next() => {
            handle_event(&mut app, event);
        }
        _ = tick_interval.tick() => {
            app.tick();
        }
        Some(action) = action_rx.recv() => {
            app.apply_action(action);
        }
    }

    if !app.running {
        break;
    }
}
```

11. After the loop: calls `security::restore_terminal()` then `security::wipe_screen()`.
12. Returns the `action_tx: mpsc::Sender<TuiAction>` from the function signature so callers can spawn background tasks that push actions.

Actually, the `action_tx` needs to be available before entering the loop (so the caller can pass it to background tasks). The function signature should be:

```rust
pub async fn run_async(
    identity_fingerprint: Option<String>,
    initial_mode: TuiMode,
) -> io::Result<()>
```

The `mpsc` channel is created inside `run_async`. The `action_tx` sender is stored in `App` so that future commands (spawned from key handlers) can clone it.

**Import needed**: `use futures::StreamExt;` for `.next()` on `EventStream`.

**Verification**: `cargo check -p tallow-tui` compiles. `cargo test -p tallow-tui` passes (existing tests don't call `run_async` -- it requires a real terminal).

### Task 1.6: Extract key handler from TuiApp to standalone function

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs`

**What to change**: Extract the key handling logic from `TuiApp::handle_key()` into a standalone `fn handle_event(app: &mut App, event: crossterm::event::Event)` that can be called from both the old `TuiApp::run()` and the new `run_async()`. This function:

1. Matches on `crossterm::event::Event::Key(key)`.
2. Checks overlay stack first (topmost overlay consumes input or Esc pops it).
3. Falls through to main key handler (q, Ctrl+C, Tab, 1-4, r, `?`, `i`).
4. `i` key pushes `Overlay::IdentityDetail`.

**Verification**: `cargo test -p tallow-tui` passes. The existing `TuiApp::run()` still works.

### Task 1.7: Update tui_cmd.rs to call run_async

**File**: `E:\Tallow\crates\tallow\src\commands\tui_cmd.rs`

**What to change**: The `execute` function currently calls `TuiApp::new()?.run()?` synchronously. Update it to:

1. Load identity fingerprint from `tallow_store::identity::IdentityStore` (try `load("")` for empty passphrase; if it fails, `None`).
2. Determine initial mode from `TuiArgs` (minimal, zen, monitor, or dashboard).
3. Call `tallow_tui::run_async(identity_fingerprint, initial_mode).await?`.

This makes the TUI command fully async and integrated with the tokio runtime already running in `main.rs`.

**Verification**: `cargo check -p tallow` compiles. Manual test: `cargo run -- tui` launches the TUI, responds to key events, and exits cleanly on `q`.

### Task 1.8: Verify terminal restoration on Ctrl+C

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs` and `E:\Tallow\crates\tallow-tui\src\security.rs`

**What to change**: Ensure that the async run function wraps the main loop in a `scopeguard` or uses a `Drop` guard that calls `restore_terminal()` + `wipe_screen()` even if the function exits via `?` error propagation. The simplest approach:

```rust
// Before the loop:
struct TerminalGuard;
impl Drop for TerminalGuard {
    fn drop(&mut self) {
        security::restore_terminal();
        security::wipe_screen();
    }
}
let _guard = TerminalGuard;
```

This guarantees cleanup even on early `?` returns. The panic handler (already installed) handles panics separately.

Verify that Ctrl+C (`KeyCode::Char('c')` with `KeyModifiers::CONTROL`) sets `app.running = false` and the loop exits, triggering the guard's drop.

**Verification**: Manual test -- launch `cargo run -- tui`, press Ctrl+C. Terminal should be fully restored with cursor visible and screen cleared.

### Wave 1 Verification Checkpoint

Run all of these:
```
cargo check -p tallow-tui
cargo test -p tallow-tui
cargo clippy -p tallow-tui -- -D warnings
cargo check -p tallow
```

All must pass with zero errors and zero warnings.

---

## Wave 2: Panel Integration

**Goal**: Wire existing widgets into the panel renderers so the dashboard displays real data -- identity fingerprint in the status panel, spinner animation, speed indicators in transfer rows, and a richer device panel. After this wave, the dashboard shows identity, animated spinners, and accepts `TuiAction` messages to update transfer progress in real time.

### Task 2.1: Add identity fingerprint to status panel

**File**: `E:\Tallow\crates\tallow-tui\src\panels\status.rs`

**What to change**: Add a fingerprint display line to the status panel. The `App` struct now has `identity_fingerprint: Option<String>`. Render it:

```rust
let identity_line = match &app.identity_fingerprint {
    Some(fp) => Line::from(vec![
        Span::styled("  ID:    ", Style::default().fg(Color::Yellow)),
        Span::styled(
            &fp[..16.min(fp.len())],  // Show first 16 hex chars
            Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD),
        ),
        Span::styled("...", Style::default().fg(Color::DarkGray)),
    ]),
    None => Line::from(Span::styled(
        "  ID:    (no identity)",
        Style::default().fg(Color::DarkGray),
    )),
};
```

Insert this line between the connection indicator and the relay line in the `lines` vec.

**Verification**: `cargo test -p tallow-tui` passes. Manual: launch TUI, verify identity line appears in status panel.

### Task 2.2: Add spinner to status panel

**File**: `E:\Tallow\crates\tallow-tui\src\panels\status.rs`

**What to change**: When `app.connected` is false, render the `Spinner` widget from `app.spinner` next to the "Disconnected" text to indicate the TUI is alive and the event loop is running. Use `crate::widgets::spinner::styled_spinner()` to get a styled `Line`:

```rust
let connection_indicator = if app.connected {
    Line::from(Span::styled(" Connected ", Style::default().fg(Color::Green)))
} else {
    let spinner_line = crate::widgets::spinner::styled_spinner(
        &app.spinner,
        Style::default().fg(Color::Yellow),
    );
    // Combine spinner with "Connecting..." text
    Line::from(vec![
        Span::raw(" "),
        Span::styled(
            &app.spinner.display_text(),
            Style::default().fg(Color::Yellow),
        ),
        Span::styled("Disconnected", Style::default().fg(Color::Red)),
    ])
};
```

Since `app.tick()` calls `spinner.tick()`, the spinner character changes on each tick (every 100ms), creating visible animation.

**Verification**: `cargo test -p tallow-tui` passes. Manual: launch TUI, observe spinner animating next to "Disconnected".

### Task 2.3: Wire SpeedIndicatorCompact into transfer rows

**File**: `E:\Tallow\crates\tallow-tui\src\panels\transfers.rs`

**What to change**: Replace the manual speed display in `render_transfer_row` (row 3) with the `SpeedIndicatorCompact` widget from `crate::widgets::speed_indicator`. This gives dynamic coloring based on speed magnitude.

In the speed row (rows[2]):

```rust
use crate::widgets::speed_indicator::SpeedIndicatorCompact;

let is_receiving = transfer.direction == TransferDirection::Receive;
let speed_widget = SpeedIndicatorCompact::new(transfer.speed_bps, is_receiving);
frame.render_widget(speed_widget, rows[2]);
```

Remove the manual `speed_line` construction.

**Verification**: `cargo test -p tallow-tui` passes. Existing transfer panel tests still work since `TransferInfo` struct is unchanged.

### Task 2.4: Implement App::apply_action for transfer updates

**File**: `E:\Tallow\crates\tallow-tui\src\app.rs`

**What to change**: Implement the `apply_action` method body. This is the core state machine that processes `TuiAction` messages:

```rust
impl App {
    pub fn apply_action(&mut self, action: TuiAction) {
        match action {
            TuiAction::TransferStarted { id, filename, total_bytes, direction } => {
                let transfer = ActiveTransfer {
                    id,
                    filename,
                    total_bytes,
                    bytes_done: 0,
                    speed_bps: 0,
                    direction,
                    status: TransferStatus::InProgress,
                    started_at: std::time::Instant::now(),
                };
                self.active_transfers.insert(id, transfer);
                self.sync_transfer_info();
            }
            TuiAction::TransferProgress { id, bytes_done, speed_bps } => {
                if let Some(t) = self.active_transfers.get_mut(&id) {
                    t.bytes_done = bytes_done;
                    t.speed_bps = speed_bps;
                    // Update session totals
                    match t.direction {
                        TransferDirection::Send => self.bytes_sent = bytes_done,
                        TransferDirection::Receive => self.bytes_received = bytes_done,
                    }
                }
                self.sync_transfer_info();
            }
            TuiAction::TransferComplete { id, elapsed } => {
                if let Some(t) = self.active_transfers.get_mut(&id) {
                    t.status = TransferStatus::Complete { elapsed };
                    t.bytes_done = t.total_bytes;
                }
                self.sync_transfer_info();
            }
            TuiAction::TransferError { id, error } => {
                if let Some(t) = self.active_transfers.get_mut(&id) {
                    t.status = TransferStatus::Failed { error };
                }
                self.sync_transfer_info();
            }
            TuiAction::RelayConnected { addr } => {
                self.connected = true;
                self.relay_addr = Some(addr);
                self.status_message = "Connected".to_string();
            }
            TuiAction::RelayDisconnected => {
                self.connected = false;
                self.status_message = "Disconnected".to_string();
            }
            TuiAction::PeerJoined { room_code } => {
                self.room_code = Some(room_code);
            }
            TuiAction::PeerLeft => {
                self.room_code = None;
            }
            TuiAction::Quit => {
                self.running = false;
            }
            // InitiateSend / InitiateReceive are handled by spawning tasks, not here
            _ => {}
        }
    }

    pub fn sync_transfer_info(&mut self) {
        self.transfers = self.active_transfers.values().map(|at| {
            let progress = if at.total_bytes > 0 {
                at.bytes_done as f64 / at.total_bytes as f64
            } else {
                0.0
            };
            let status = match &at.status {
                TransferStatus::Preparing => "Preparing".to_string(),
                TransferStatus::WaitingForPeer => "Waiting".to_string(),
                TransferStatus::InProgress => "Transferring".to_string(),
                TransferStatus::Complete { .. } => "Complete".to_string(),
                TransferStatus::Failed { error } => format!("Failed: {}", error),
            };
            TransferInfo {
                filename: at.filename.clone(),
                progress,
                speed_bps: at.speed_bps,
                direction: at.direction,
                status,
            }
        }).collect();
    }
}
```

**Verification**: Write unit test in `app.rs`:
```rust
#[test]
fn test_apply_action_transfer_lifecycle() {
    let mut app = App::new();
    let id = [1u8; 16];

    app.apply_action(TuiAction::TransferStarted {
        id, filename: "test.txt".into(), total_bytes: 1000, direction: TransferDirection::Send,
    });
    assert_eq!(app.transfers.len(), 1);
    assert_eq!(app.transfers[0].filename, "test.txt");

    app.apply_action(TuiAction::TransferProgress { id, bytes_done: 500, speed_bps: 100 });
    assert!((app.transfers[0].progress - 0.5).abs() < 0.01);

    app.apply_action(TuiAction::TransferComplete { id, elapsed: Duration::from_secs(10) });
    assert!(app.transfers[0].status.contains("Complete"));
}
```

### Task 2.5: Add `i` key handler for identity overlay and update hotkey bar

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs` (key handler) and `E:\Tallow\crates\tallow-tui\src\panels\hotkey_bar.rs`

**What to change**:

1. In the key handler function, add `KeyCode::Char('i')` to push `Overlay::IdentityDetail`.
2. In `hotkey_bar.rs`, add `i Identity` to the hotkey bar display.

**Verification**: `cargo test -p tallow-tui` passes. Manual: press `i` in TUI, overlay appears (rendered in Wave 3). Press `Esc`, it dismisses.

### Wave 2 Verification Checkpoint

```
cargo test -p tallow-tui
cargo clippy -p tallow-tui -- -D warnings
```

All must pass. Manual verification: launch TUI, observe identity fingerprint in status panel, spinner animating, speed indicators with color.

---

## Wave 3: Overlay System + Terminal Restoration + Graceful Degradation

**Goal**: Implement the full overlay rendering stack, identity detail overlay, terminal size checks, and graceful degradation for small terminals. After this wave, all 5 success criteria are met.

### Task 3.1: Refactor render.rs to use overlay stack

**File**: `E:\Tallow\crates\tallow-tui\src\render.rs`

**What to change**: Replace the `if app.show_help` check with an overlay stack renderer. The render function should:

1. Render the base dashboard (unchanged).
2. Iterate over `app.overlays` in order (bottom to top).
3. For each overlay, call `frame.render_widget(ratatui::widgets::Clear, area)` on a centered rect, then render the overlay content.

```rust
pub fn render(frame: &mut Frame, app: &App) {
    // 1. Check minimum size
    let area = frame.area();
    if area.width < 60 || area.height < 16 {
        render_size_warning(frame);
        return;
    }

    // 2. Render base layout
    match app.mode {
        TuiMode::Dashboard => render_dashboard(frame, app),
        TuiMode::Minimal => render_minimal(frame, app),
        TuiMode::Zen => render_zen(frame, app),
        TuiMode::Monitor => render_monitor(frame, app),
    }

    // 3. Render overlay stack (bottom to top)
    for overlay in &app.overlays {
        let overlay_area = centered_rect(60, 70, frame.area());
        frame.render_widget(ratatui::widgets::Clear, overlay_area);
        match overlay {
            Overlay::Help => render_help_overlay_in(frame, overlay_area),
            Overlay::IdentityDetail => render_identity_overlay(frame, overlay_area, app),
            Overlay::TransferConfirm { filename, size } => {
                render_confirm_overlay(frame, overlay_area, filename, *size);
            }
        }
    }
}
```

Keep the existing `render_help_overlay` as `render_help_overlay_in` (takes an explicit area parameter instead of computing its own). The backward-compatible `show_help` field is still set by `toggle_help()` so any test checking `app.show_help` still works.

**Verification**: `cargo test -p tallow-tui` passes. Manual: `?` opens help overlay, `Esc` dismisses. `i` opens identity overlay on top of help if help is open.

### Task 3.2: Implement identity detail overlay

**File**: `E:\Tallow\crates\tallow-tui\src\render.rs` (or a new function in `overlays/`)

**What to change**: Add `render_identity_overlay(frame, area, app)` function. This displays:

- Title: "Identity Details"
- Full fingerprint from `app.identity_fingerprint` (or "No identity loaded")
- The identity file path (from `tallow_store::persistence::paths::identity_file()` -- but since tallow-tui already depends on tallow-store, this is fine)
- Trust note: "This is your cryptographic identity. Share the fingerprint for verification."
- A hint at the bottom: "Press Esc to close"

Use a `Block` with `Borders::ALL`, `BorderType::Rounded`, border color `Color::Magenta`.

Keep it simple -- read-only display, no interaction beyond Esc to dismiss.

**Verification**: `cargo test -p tallow-tui` passes. Manual: press `i`, see identity details, press `Esc` to dismiss.

### Task 3.3: Implement transfer confirm overlay

**File**: `E:\Tallow\crates\tallow-tui\src\render.rs`

**What to change**: Add `render_confirm_overlay(frame, area, filename, size)` that displays:

- Title: "Incoming Transfer"
- File name and size
- "Accept? [y/n]"

This overlay is pushed when a `TuiAction::TransferConfirm` would be received (future integration). For now, implement the renderer so it is ready.

**Verification**: Unit test that renders the overlay on a `TestBackend` without panic.

### Task 3.4: Graceful degradation for small terminals

**File**: `E:\Tallow\crates\tallow-tui\src\render.rs`

**What to change**: Add `render_size_warning(frame)` that displays a centered message:

```
Terminal too small (need 60x16 minimum)
Current: {width}x{height}
```

This is called from `render()` when `frame.area()` is below 60 columns or 16 rows. The TUI still runs (the user can resize), but panels are not drawn.

Additionally, add zero-size guards at the top of each panel renderer:
```rust
if area.width < 10 || area.height < 3 {
    return;
}
```

Most panels already have implicit guards but make them explicit.

**Verification**: `cargo test -p tallow-tui` -- add a test that renders on a 40x10 `TestBackend` and verifies no panic. Check that the warning text is in the buffer.

### Task 3.5: Overlay input routing in key handler

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs`

**What to change**: Refine the key handler to properly route input through the overlay stack:

```rust
fn handle_key_event(app: &mut App, key: crossterm::event::KeyEvent) {
    // If overlays are active, route to topmost overlay
    if let Some(overlay) = app.top_overlay() {
        match key.code {
            KeyCode::Esc => {
                app.pop_overlay();
            }
            KeyCode::Char('?') if *overlay == Overlay::Help => {
                app.pop_overlay();
            }
            KeyCode::Char('y') if matches!(overlay, Overlay::TransferConfirm { .. }) => {
                // Accept transfer (future: send action)
                app.pop_overlay();
            }
            KeyCode::Char('n') if matches!(overlay, Overlay::TransferConfirm { .. }) => {
                // Decline transfer
                app.pop_overlay();
            }
            _ => {
                // Overlay consumes the key (no passthrough)
            }
        }
        return;
    }

    // Main key handler (no overlay active)
    match key.code {
        KeyCode::Char('q') => app.quit(),
        KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => app.quit(),
        KeyCode::Char('?') => app.push_overlay(Overlay::Help),
        KeyCode::Char('i') => app.push_overlay(Overlay::IdentityDetail),
        KeyCode::Tab => app.next_panel(),
        KeyCode::Char('1') => app.mode = TuiMode::Dashboard,
        KeyCode::Char('2') => app.mode = TuiMode::Minimal,
        KeyCode::Char('3') => app.mode = TuiMode::Zen,
        KeyCode::Char('4') => app.mode = TuiMode::Monitor,
        KeyCode::Char('r') => app.status_message = "Refreshed".to_string(),
        _ => {}
    }
}
```

**Verification**: Unit tests:
1. Push Help overlay, press `a` -- overlay not dismissed (consumed).
2. Push Help overlay, press `Esc` -- overlay dismissed.
3. Push Help then IdentityDetail, press `Esc` -- only IdentityDetail dismissed, Help remains.
4. No overlay, press `q` -- `app.running` is false.

### Task 3.6: Verify terminal restoration is bulletproof

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs` and `E:\Tallow\crates\tallow-tui\src\security.rs`

**What to change**: Ensure the `TerminalGuard` from Task 1.8 is in place. Additionally, verify that the panic handler in `security.rs` covers the case where `ratatui::Terminal` is holding stdout. The current implementation calls `disable_raw_mode()` + `LeaveAlternateScreen` + `Show cursor` -- this is correct. No code change needed if Task 1.8 was done correctly.

Add a comment block documenting the three cleanup paths:
1. Normal exit (loop breaks, guard drops)
2. Error return (? propagation, guard drops)
3. Panic (panic hook fires, restores terminal, then guard drops -- double-restore is safe because `disable_raw_mode` is idempotent)

**Verification**: Manual testing:
- `cargo run -- tui`, press `q` -- terminal restored, screen cleared.
- `cargo run -- tui`, press Ctrl+C -- terminal restored.
- If possible, trigger a panic (e.g., temporary `panic!()` in a key handler) -- terminal should be restored.

### Wave 3 Verification Checkpoint

```
cargo test -p tallow-tui
cargo clippy -p tallow-tui -- -D warnings
cargo check -p tallow
```

Manual verification against all 5 success criteria:
1. Dashboard shows identity, relay status, transfer history -- YES (identity from store, status from App state).
2. Real-time progress -- YES (apply_action handles TransferProgress, sync_transfer_info updates panel data).
3. Overlay system -- YES (`?` help, `i` identity, stackable, Esc dismisses).
4. Terminal restored on exit/crash -- YES (TerminalGuard + panic handler).
5. No panic 80x24 to 300x80, graceful degradation on small sizes -- YES (size check in render()).

---

## Wave 4: Tests

**Goal**: Add tests that verify the new async architecture, action handling, overlay system, and rendering without breaking the existing 182 tests. All tests use `TestBackend` (no real terminal needed).

### Task 4.1: App state unit tests

**File**: `E:\Tallow\crates\tallow-tui\src\app.rs`

**What to add** (inside `#[cfg(test)] mod tests`):

1. **test_apply_action_transfer_lifecycle** -- TransferStarted -> TransferProgress -> TransferComplete. Assert `transfers` vec is updated correctly at each step.
2. **test_apply_action_transfer_error** -- TransferStarted -> TransferError. Assert status contains error message.
3. **test_apply_action_relay_connection** -- RelayConnected -> assert `connected == true` and `relay_addr` is set. RelayDisconnected -> assert `connected == false`.
4. **test_apply_action_peer_joined** -- PeerJoined -> assert `room_code` is set. PeerLeft -> assert `room_code` is None.
5. **test_apply_action_quit** -- Quit -> assert `running == false`.
6. **test_overlay_push_pop** -- Push Help, push IdentityDetail. Assert stack is `[Help, IdentityDetail]`. Pop. Assert stack is `[Help]`. Pop. Assert empty.
7. **test_overlay_no_duplicates** -- Push Help twice. Assert stack has only one Help.
8. **test_tick_advances_spinner** -- Call `tick()` several times. Assert `tick_count` incremented and spinner frame changed.
9. **test_sync_transfer_info** -- Insert an ActiveTransfer into `active_transfers`, call `sync_transfer_info()`. Assert `transfers` vec matches.

**Verification**: `cargo test -p tallow-tui` -- all new tests pass alongside existing 182.

### Task 4.2: Render tests with TestBackend

**File**: `E:\Tallow\crates\tallow-tui\src\render.rs` (add `#[cfg(test)]` module)

**What to add**:

1. **test_dashboard_renders_without_panic** -- Create `TestBackend::new(80, 24)`, render dashboard with default App. Assert no panic.
2. **test_dashboard_with_identity** -- Set `app.identity_fingerprint = Some("ABCD1234...")`, render. Assert buffer contains "ABCD".
3. **test_dashboard_with_active_transfer** -- Add a TransferInfo to app.transfers, render. Assert buffer contains the filename.
4. **test_minimal_renders_without_panic** -- Same as above but with `TuiMode::Minimal`.
5. **test_zen_renders_without_panic** -- `TuiMode::Zen`.
6. **test_monitor_renders_without_panic** -- `TuiMode::Monitor`.
7. **test_small_terminal_shows_warning** -- `TestBackend::new(40, 10)`, render. Assert buffer contains "too small".
8. **test_help_overlay_renders** -- Push Help overlay, render on 80x24. Assert buffer contains "Help" and keybinding text.
9. **test_identity_overlay_renders** -- Set fingerprint, push IdentityDetail overlay, render. Assert buffer contains fingerprint text.
10. **test_large_terminal_no_panic** -- `TestBackend::new(300, 80)`, render with all modes. No panic.

Helper function:
```rust
fn buffer_to_string(buf: &ratatui::buffer::Buffer) -> String {
    let mut s = String::new();
    for y in 0..buf.area.height {
        for x in 0..buf.area.width {
            s.push_str(buf[(x, y)].symbol());
        }
        s.push('\n');
    }
    s
}
```

**Verification**: `cargo test -p tallow-tui` -- all tests pass.

### Task 4.3: Key handler unit tests

**File**: `E:\Tallow\crates\tallow-tui\src\lib.rs` (add `#[cfg(test)]` module or in a separate test file)

**What to add**:

1. **test_quit_on_q** -- Simulate `KeyCode::Char('q')`, assert `app.running == false`.
2. **test_quit_on_ctrl_c** -- Simulate Ctrl+C, assert `app.running == false`.
3. **test_help_toggle** -- Press `?`, assert overlay stack has Help. Press `?` or Esc, assert empty.
4. **test_identity_overlay_on_i** -- Press `i`, assert overlay stack has IdentityDetail.
5. **test_overlay_captures_input** -- Push Help. Press `q`. Assert `app.running` is still true (overlay consumed the key). Press Esc. Then press `q`. Assert `app.running == false`.
6. **test_mode_switching** -- Press `1` through `4`, assert mode changes.
7. **test_tab_cycles_panels** -- Press Tab three times, assert panel cycles through all three.

**Verification**: `cargo test -p tallow-tui` -- all tests pass.

### Task 4.4: Integration test -- action channel round-trip

**File**: `E:\Tallow\crates\tallow-tui\src\app.rs` (or `tests/` directory)

**What to add**: A test that creates an `App`, sends a sequence of `TuiAction` messages through `apply_action`, and verifies the full state transitions:

```rust
#[test]
fn test_full_transfer_round_trip() {
    let mut app = App::new();
    let id = [42u8; 16];

    // Start
    app.apply_action(TuiAction::TransferStarted {
        id, filename: "photo.jpg".into(), total_bytes: 10_000_000,
        direction: TransferDirection::Receive,
    });
    assert_eq!(app.active_transfers.len(), 1);
    assert_eq!(app.transfers.len(), 1);
    assert!((app.transfers[0].progress - 0.0).abs() < 0.01);

    // Progress updates
    for i in 1..=10 {
        app.apply_action(TuiAction::TransferProgress {
            id, bytes_done: i * 1_000_000, speed_bps: 5_000_000,
        });
    }
    assert!((app.transfers[0].progress - 1.0).abs() < 0.01);

    // Complete
    app.apply_action(TuiAction::TransferComplete {
        id, elapsed: Duration::from_secs(2),
    });
    assert!(app.transfers[0].status.contains("Complete"));
}
```

**Verification**: Test passes.

### Task 4.5: Final full-suite verification

Run the complete test suite and linting:

```
cargo test -p tallow-tui
cargo clippy -p tallow-tui -- -D warnings
cargo fmt --check -p tallow-tui
cargo test --workspace
cargo clippy --workspace -- -D warnings
```

All must pass.

---

## Files Modified (Summary)

| File | Wave | Nature of Change |
|------|------|-----------------|
| `crates/tallow-tui/Cargo.toml` | 1 | Add `futures.workspace = true` |
| `crates/tallow-tui/src/app.rs` | 1, 2, 4 | TuiAction enum, Overlay enum, ActiveTransfer, expanded App, apply_action, tests |
| `crates/tallow-tui/src/lib.rs` | 1, 3, 4 | run_async function, handle_event, TerminalGuard, key handler tests |
| `crates/tallow-tui/src/render.rs` | 3, 4 | Overlay stack rendering, identity overlay, size warning, render tests |
| `crates/tallow-tui/src/panels/status.rs` | 2 | Identity fingerprint line, spinner |
| `crates/tallow-tui/src/panels/transfers.rs` | 2 | SpeedIndicatorCompact widget |
| `crates/tallow-tui/src/panels/hotkey_bar.rs` | 2 | Add `i Identity` to bar |
| `crates/tallow-tui/src/security.rs` | 1 | Comment documentation (no logic change) |
| `crates/tallow/src/commands/tui_cmd.rs` | 1 | Call run_async with identity and mode |

## Files NOT Modified

- All 28 widget modules in `crates/tallow-tui/src/widgets/` -- used as-is, no changes.
- `crates/tallow-tui/src/modes.rs` -- unchanged.
- `crates/tallow-tui/src/theme.rs` -- unchanged.
- `crates/tallow-tui/src/event.rs` -- kept for backward compatibility but the async loop uses `EventStream` directly. Not deleted.
- `crates/tallow-tui/src/overlays/help.rs` -- help text data unchanged; rendering moves to render.rs overlay loop.
- `crates/tallow-tui/src/panels/devices.rs` -- unchanged (LAN discovery is Phase 13).

## Risk Mitigations

1. **Breaking existing tests**: Every task preserves backward compatibility. `show_help: bool` remains, `transfers: Vec<TransferInfo>` remains, `App::new()` signature unchanged. New fields have defaults.

2. **EventStream not compiling on Windows**: crossterm's `event-stream` feature is already enabled in Cargo.toml and is supported on Windows. The `futures::StreamExt` import compiles with `futures = "0.3"` which is already a workspace dependency.

3. **Deadlock in tokio::select**: The `mpsc::channel(256)` is bounded but generous. Transfer progress is throttled to 30 updates/sec by the sender (not enforced in TUI -- that is the sender's responsibility). The TUI drains the channel on every loop iteration.

4. **Double terminal restore**: `disable_raw_mode()` and `LeaveAlternateScreen` are idempotent -- calling them twice is harmless. Both the `TerminalGuard::drop()` and the panic handler may fire; this is safe.

5. **Spinner not animating**: The 100ms tick interval ensures `app.tick()` is called ~10 times per second. The spinner cycles through frames on each tick. If the terminal does not support the braille characters, the `Line` fallback (`-\|/`) works on all terminals.
