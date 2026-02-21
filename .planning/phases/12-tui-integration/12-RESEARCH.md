# Phase 12: TUI Integration -- Research

## Standard Stack

### Core Dependencies (already in Cargo.toml)
- **ratatui 0.29** with `all-widgets` feature -- immediate-mode TUI rendering framework
- **crossterm 0.28** with `event-stream` feature -- terminal backend, async event stream via `EventStream`
- **tokio** (workspace) -- async runtime for background transfer tasks and channel-based messaging
- **color-eyre 0.6** -- enhanced error reporting with terminal-aware panic hooks
- **chrono** (workspace) -- timestamp formatting in chat messages and transfer history
- **unicode-width 0.2** -- accurate column width for CJK and emoji rendering
- **clearscreen 3** -- thorough screen wiping on exit (security requirement)
- **insta 1** (dev) -- snapshot testing for rendered TUI output

### Dependencies That Should Be Added
- None strictly required. The existing dependency set covers all needs. The `event-stream` feature on crossterm is already enabled, which provides `crossterm::event::EventStream` for async event reading via `tokio::select!`.

### What NOT to Add
- **tui-textarea** / **tui-input** -- the crate already has a working `ChatInput` widget with cursor management. No need for external input crates.
- **tui-popup** -- the existing `render_help_overlay` + `Clear` widget pattern is correct and sufficient. A third-party popup crate adds unnecessary indirection.
- **color-eyre for panic hooks** -- already in Cargo.toml but currently unused in the panic handler. The existing manual panic hook in `security.rs` is fine because it does Tallow-specific screen wiping. color-eyre's hook would not do that.

## Architecture Patterns

### Pattern Choice: Async Action Loop with mpsc Channels

The recommended architecture for Tallow's TUI is the **Async Action Loop** pattern from the official ratatui async-template. This is the right fit because:

1. **Tallow transfers are async** -- send/receive operations run on tokio, producing progress updates over time. The TUI must receive these updates without blocking the render loop.
2. **Multiple event sources** -- the TUI must simultaneously handle crossterm key events, tick timers for spinner animation, and transfer progress updates from background tasks.
3. **Decoupled state updates** -- transfer operations in `tallow-protocol` should not need to know about TUI rendering. They push `Action` messages through a channel; the TUI consumes them.

### Core Architecture

```
                  +-------------------+
                  |   EventStream     |  crossterm async events
                  +--------+----------+
                           |
                           v
+------------+    +--------+----------+    +-----------------+
| Background |    |   Main Loop       |    |   Renderer      |
| Tasks      +--->|   tokio::select!  +--->|   render(frame) |
| (transfer) |    |                   |    |                 |
+------------+    +--------+----------+    +-----------------+
      ^                    |
      |                    v
      |           +--------+----------+
      +-----------+   App State       |
                  |   (single owner)  |
                  +-------------------+
```

### Main Loop Structure

```rust
loop {
    // Render current state
    terminal.draw(|frame| render(frame, &app))?;

    // Wait for next event (key, tick, or transfer update)
    tokio::select! {
        // Crossterm events (keys, mouse, resize)
        Some(Ok(event)) = event_stream.next() => {
            handle_crossterm_event(&mut app, event);
        }
        // Tick timer for animations (spinners, clock)
        _ = tick_interval.tick() => {
            app.tick();
        }
        // Transfer progress updates from background tasks
        Some(action) = action_rx.recv() => {
            app.apply_action(action);
        }
    }

    if !app.running {
        break;
    }
}
```

### Action Enum (Message Passing)

```rust
/// Actions that can be sent to the TUI from any context
pub enum TuiAction {
    // Transfer lifecycle
    TransferStarted { id: [u8; 16], filename: String, total_bytes: u64, direction: TransferDirection },
    TransferProgress { id: [u8; 16], bytes_done: u64, speed_bps: u64 },
    TransferComplete { id: [u8; 16], elapsed: Duration },
    TransferError { id: [u8; 16], error: String },

    // Connection lifecycle
    RelayConnected { addr: String },
    RelayDisconnected,
    PeerJoined { room_code: String },
    PeerLeft,

    // LAN discovery
    PeerDiscovered { name: String, addr: String, verified: bool },
    PeerLost { addr: String },

    // User-initiated (from key handler, forwarded to background task)
    InitiateSend { files: Vec<PathBuf>, relay: String },
    InitiateReceive { code: String, relay: String },
    Quit,
}
```

### App State Design

The `App` struct currently exists but needs expansion. Key design decisions:

1. **Single-owner state** -- `App` owns all TUI state. No `Arc<Mutex<>>` for render data. The main loop has exclusive `&mut App` access.
2. **Action sender cloneable** -- `tokio::sync::mpsc::Sender<TuiAction>` is `Clone` and `Send`, so background tasks can hold a copy and push updates.
3. **Transfer state as HashMap** -- `HashMap<[u8; 16], ActiveTransfer>` keyed by transfer ID, allowing concurrent transfers.

## Don't Hand-Roll

### Use from ratatui (already available)
- **`ratatui::widgets::Gauge`** -- for progress bars. The existing `transfers.rs` panel already uses this correctly.
- **`ratatui::widgets::Clear`** -- for overlay rendering. Already used in `render_help_overlay`.
- **`ratatui::layout::Layout`** -- for panel splitting. Already used correctly.
- **`ratatui::widgets::Sparkline`** (built-in) -- for bandwidth history. Note: there is a naming collision -- Tallow has a custom `widgets::sparkline::Sparkline` using braille characters. The custom one is better; keep it.

### Use from crossterm (already available)
- **`crossterm::event::EventStream`** -- async wrapper around crossterm events. This is the correct way to integrate with tokio. The `event-stream` feature is already enabled in Cargo.toml.

### Use from tokio (already available)
- **`tokio::sync::mpsc`** -- for action channel between background tasks and the TUI loop.
- **`tokio::time::interval`** -- for tick timer.
- **`tokio::select!`** -- for multiplexing event sources.
- **`tokio::spawn`** -- for launching transfer tasks in the background.

### Do NOT hand-roll
- **Event polling loop** -- the current `EventHandler::next()` uses blocking `crossterm::event::poll()`. Replace with `crossterm::event::EventStream` and `tokio::select!`. Do NOT write a custom poll-based event loop.
- **Progress bar rendering** -- use `Gauge` from ratatui for the panel rendering. The custom `TransferProgressWidget` in widgets/ is fine for standalone use but the panel already has a working `Gauge`-based renderer.
- **Terminal init/restore** -- use `ratatui::init()` and `ratatui::restore()` (added in ratatui 0.28.1) instead of manual `enable_raw_mode` / `EnterAlternateScreen` calls. BUT: Tallow needs custom screen wiping via `clearscreen`, so keep the security module's `wipe_screen()` call after `ratatui::restore()`.

## Common Pitfalls

### 1. Blocking the Render Loop
**Problem**: If the transfer task runs on the same thread as the TUI loop, the UI freezes during file I/O or network waits.
**Solution**: Always `tokio::spawn` transfer operations. They communicate via `mpsc::Sender<TuiAction>`. The main loop only calls `action_rx.recv()` which is non-blocking in a `tokio::select!`.

### 2. Crossterm Event Stream Dropping
**Problem**: `EventStream` must be stored in the main loop scope. If dropped, key events stop arriving.
**Solution**: Create `EventStream` at the top of the run function and use `futures::StreamExt::next()` in the select loop. Import `use futures::StreamExt;` (or `use tokio_stream::StreamExt;`).

**Note**: crossterm's `event-stream` feature requires the `futures-core` crate. Check that it compiles. If `futures::StreamExt` is not available, use `crossterm::event::EventStream` with `tokio_stream::StreamExt` or add `futures = "0.3"` to dependencies.

### 3. Terminal Not Restored on Panic
**Problem**: If a panic occurs in TUI mode, the terminal stays in raw mode with the alternate screen visible.
**Solution**: The existing `security::install_panic_handler()` correctly handles this. However, it should call `ratatui::restore()` (if using the init/restore pattern) or the manual restore sequence, then `wipe_screen()`. The current implementation is correct.

### 4. Resize Flicker
**Problem**: On terminal resize, the UI can flicker if the entire frame is re-rendered in the wrong order.
**Solution**: ratatui handles resize automatically through the `Frame` API. The resize event should simply trigger a redraw (which happens naturally on the next loop iteration). No special handling needed beyond what exists.

### 5. Spinner Not Animating
**Problem**: The `Spinner` widget requires `tick()` calls to advance frames, but the current event loop only calls `tick()` implicitly through the 250ms poll timeout.
**Solution**: Use `tokio::time::interval(Duration::from_millis(100))` in the select loop to drive spinner animation at ~10fps. Slower rates (250ms) cause visible stuttering.

### 6. Channel Backpressure
**Problem**: If transfer progress updates arrive faster than the TUI renders (e.g., small chunks, fast disk), the mpsc channel fills up and the transfer task blocks on `send().await`.
**Solution**: Use a bounded channel with reasonable size (e.g., `mpsc::channel(256)`) and batch progress updates. The transfer task should throttle updates to at most 30 per second.

### 7. Unicode Width Calculation
**Problem**: Emoji icons (used in device cards, trust badges) have variable display widths. `str::len()` returns byte count, not display width.
**Solution**: The crate already depends on `unicode-width`. Use `UnicodeWidthStr::width()` for layout calculations involving emoji-containing strings.

### 8. Windows Terminal Compatibility
**Problem**: Some Unicode characters (braille sparklines, block characters) render incorrectly on older Windows terminals.
**Solution**: Detect terminal capabilities and fall back to ASCII-only rendering. The `SparklineMode::Blocks` fallback already exists in the sparkline widget.

### 9. Raw Mode Conflicts with stdin
**Problem**: If the user starts `tallow tui` and then tries to pipe input, crossterm raw mode captures everything.
**Solution**: The TUI command should detect if stdin is not a terminal (`!stdin.is_terminal()`) and refuse to start, printing a helpful error message.

### 10. Concurrent Overlay State
**Problem**: Multiple overlays (help, identity details, transfer confirmation) can stack, and key handling must respect the stack order.
**Solution**: Use a `Vec<Overlay>` stack in `App`. Key events go to the topmost overlay first. If consumed, lower overlays and the main panel don't see them. Render overlays in stack order (bottom-up).

## Code Examples

### Async Event Loop (Replacing Current Blocking Loop)

```rust
use crossterm::event::{Event as CtEvent, EventStream, KeyCode};
use futures::StreamExt;
use tokio::sync::mpsc;

pub async fn run(
    terminal: &mut ratatui::DefaultTerminal,
    mut action_rx: mpsc::Receiver<TuiAction>,
) -> io::Result<()> {
    let mut app = App::new();
    let mut event_stream = EventStream::new();
    let mut tick = tokio::time::interval(Duration::from_millis(100));

    loop {
        // Render
        terminal.draw(|frame| render(frame, &app))?;

        // Wait for next event
        tokio::select! {
            Some(Ok(event)) = event_stream.next() => {
                match event {
                    CtEvent::Key(key) => app.handle_key(key),
                    CtEvent::Resize(w, h) => { /* auto-handled */ }
                    _ => {}
                }
            }
            _ = tick.tick() => {
                app.tick(); // advance spinners, refresh timestamps
            }
            Some(action) = action_rx.recv() => {
                app.apply_action(action);
            }
        }

        if !app.running {
            break;
        }
    }

    Ok(())
}
```

### Overlay Stack Implementation

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Overlay {
    Help,
    IdentityDetail,
    TransferConfirm { filename: String, size: u64 },
    Settings,
}

impl App {
    pub fn push_overlay(&mut self, overlay: Overlay) {
        // Prevent duplicate overlays
        if !self.overlays.contains(&overlay) {
            self.overlays.push(overlay);
        }
    }

    pub fn pop_overlay(&mut self) {
        self.overlays.pop();
    }

    pub fn top_overlay(&self) -> Option<&Overlay> {
        self.overlays.last()
    }
}

// In render.rs:
pub fn render(frame: &mut Frame, app: &App) {
    // 1. Render base dashboard
    match app.mode {
        TuiMode::Dashboard => render_dashboard(frame, app),
        // ...
    }

    // 2. Render overlay stack (bottom to top)
    for overlay in &app.overlays {
        let area = centered_rect(60, 80, frame.area());
        frame.render_widget(ratatui::widgets::Clear, area);
        match overlay {
            Overlay::Help => render_help_overlay(frame, area),
            Overlay::IdentityDetail => render_identity_overlay(frame, area, app),
            Overlay::TransferConfirm { .. } => render_confirm_overlay(frame, area, app),
            Overlay::Settings => render_settings_overlay(frame, area, app),
        }
    }
}
```

### Spawning a Transfer as a Background Task

```rust
pub fn spawn_send_transfer(
    files: Vec<PathBuf>,
    relay: String,
    code_phrase: String,
    action_tx: mpsc::Sender<TuiAction>,
) {
    tokio::spawn(async move {
        let transfer_id: [u8; 16] = rand::random();

        // Notify TUI of transfer start
        let _ = action_tx.send(TuiAction::TransferStarted {
            id: transfer_id,
            filename: files[0].display().to_string(),
            total_bytes: 0, // filled in after prepare
            direction: TransferDirection::Send,
        }).await;

        // ... actual transfer logic from send.rs ...
        // On each chunk ack:
        let _ = action_tx.send(TuiAction::TransferProgress {
            id: transfer_id,
            bytes_done: total_sent,
            speed_bps: calculated_speed,
        }).await;

        // On completion:
        let _ = action_tx.send(TuiAction::TransferComplete {
            id: transfer_id,
            elapsed: start.elapsed(),
        }).await;
    });
}
```

### TestBackend Snapshot Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::backend::TestBackend;

    #[test]
    fn test_dashboard_renders_without_panic() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = ratatui::Terminal::new(backend).unwrap();
        let app = App::new();

        terminal.draw(|frame| {
            render(frame, &app);
        }).unwrap();

        // Snapshot test with insta
        let buffer = terminal.backend().buffer().clone();
        insta::assert_snapshot!(buffer_to_string(&buffer));
    }

    #[test]
    fn test_dashboard_with_active_transfer() {
        let backend = TestBackend::new(80, 24);
        let mut terminal = ratatui::Terminal::new(backend).unwrap();
        let mut app = App::new();

        // Add a mock transfer
        app.transfers.push(TransferInfo {
            filename: "report.pdf".to_string(),
            progress: 0.62,
            speed_bps: 14_800_000,
            direction: TransferDirection::Send,
            status: "Sending".to_string(),
        });

        terminal.draw(|frame| {
            render(frame, &app);
        }).unwrap();

        // Verify no panic, check key content
        let buffer = terminal.backend().buffer().clone();
        let content = buffer_to_string(&buffer);
        assert!(content.contains("report.pdf"));
        assert!(content.contains("62%"));
    }

    fn buffer_to_string(buffer: &ratatui::buffer::Buffer) -> String {
        let mut result = String::new();
        for y in 0..buffer.area().height {
            for x in 0..buffer.area().width {
                let cell = &buffer[(x, y)];
                result.push_str(cell.symbol());
            }
            result.push('\n');
        }
        result
    }
}
```

## Gap Analysis

### What Exists (Functional)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| `App` state struct | `app.rs` | Working | Has `TransferInfo`, `PeerInfo`, basic state fields |
| `EventHandler` | `event.rs` | Working but blocking | Uses `crossterm::event::poll()` -- needs async conversion |
| `TuiApp` main loop | `lib.rs` | Working but blocking | Synchronous loop, no tokio integration |
| `render()` dispatch | `render.rs` | Working | Routes to 4 modes, renders help overlay |
| Status panel | `panels/status.rs` | Working | Shows connection, relay, room, throughput |
| Transfers panel | `panels/transfers.rs` | Working | Renders progress bars with `Gauge`, handles empty state |
| Devices panel | `panels/devices.rs` | Working | Renders peer list with trust indicators |
| Hotkey bar | `panels/hotkey_bar.rs` | Working | Single-line keybinding display |
| Help overlay | `overlays/help.rs` + `render.rs` | Working | Centered modal with Clear widget |
| Panic handler | `security.rs` | Working | Restores terminal + wipes screen |
| Theme struct | `theme.rs` | Minimal | Just an enum, no color values |
| Mode switching | `modes.rs` | Working | 4 modes: Dashboard, Minimal, Zen, Monitor |
| CLI entry point | `tui_cmd.rs` | Working | Feature-gated, calls `TuiApp::new().run()` |

### What Exists (Widget Library -- Built But Unused in Dashboard)

These widgets are fully implemented with tests but NOT wired into the render pipeline:

| Widget | File | Status | Notes |
|--------|------|--------|-------|
| `TransferProgressWidget` | `transfer_progress.rs` | Complete | Unicode progress bar, format_bytes, format_duration |
| `TransferGauge` | `transfer_gauge.rs` | Complete | Aggregate multi-file progress |
| `TransferSummary` | `transfer_summary.rs` | Complete | Post-transfer stats box, compact variant, error variant |
| `DeviceCard` | `device_card.rs` | Complete | Platform icons, trust levels, online status, fingerprint |
| `DeviceList` | `device_list.rs` | Complete | Scrollable list with selection, keyboard navigation |
| `Spinner` | `spinner.rs` | Complete | 5 styles, reduced motion, tick-based animation |
| `SpeedIndicator` | `speed_indicator.rs` | Complete | Current/avg/peak speed, dynamic coloring |
| `BandwidthChart` | `bandwidth_chart.rs` | Complete | Time-series chart with auto-scaled axes |
| `NetworkQuality` | `network_quality.rs` | Complete | Latency/loss/jitter with quality rating |
| `ChatView` | `chat_view.rs` | Complete | Scrollable chat with stateful rendering |
| `ChatInput` | `chat_input.rs` | Complete | Cursor-based text input with focus state |
| `MessageBubble` | `message_bubble.rs` | Complete | Styled message bubble |
| `Sparkline` (custom) | `sparkline.rs` | Complete | Braille + block mode sparklines |
| `TrustBadge` | `trust_badge.rs` | Complete | Trust level display, progress bar, list |
| `FileBrowser` | `file_browser.rs` | Complete | Tree navigation, multi-select, hidden file toggle |
| `FileSelector` | `file_selector.rs` | Complete | Split-pane browser + preview |
| `FilePreview` | `file_preview.rs` | Complete | File content preview |
| `Keybindings` | `keybindings.rs` | Complete | Action enum, Keymap system, key formatting |
| `SettingsView` | `settings_view.rs` | Complete | Category-based settings browser |
| `SettingWidget` | `setting_widget.rs` | Complete | Toggle, number, text, choice settings |

### What's Missing (Must Build for Phase 12)

| Gap | Priority | Description |
|-----|----------|-------------|
| **Async event loop** | P0 | Replace blocking `EventHandler` with `crossterm::event::EventStream` + `tokio::select!` |
| **Action channel** | P0 | `mpsc::channel<TuiAction>` for background task -> TUI communication |
| **Transfer integration** | P0 | Spawn actual send/receive operations from TUI and pipe progress updates back |
| **Identity display** | P1 | Show loaded identity fingerprint in status panel (reads from `tallow_store::identity`) |
| **Overlay stack** | P1 | Replace single `show_help: bool` with `Vec<Overlay>` for stackable modals |
| **Identity overlay** | P1 | Press `i` to see full identity details in a modal |
| **Transfer history panel** | P2 | Show recent transfers from `tallow_store::history::TransferLog` |
| **Graceful degradation** | P2 | Detect small terminal sizes and adjust layout or show warning |
| **Widget integration** | P2 | Wire existing widgets (SpeedIndicator, Spinner, DeviceCard) into panels |
| **Keyboard navigation within panels** | P2 | j/k navigation in transfer list, device list |

### What Should NOT Be Built in Phase 12

- **Chat functionality** -- ChatView/ChatInput widgets exist but chat over relay is not wired in the protocol layer. This is a future feature. Do not wire it now.
- **Settings persistence** -- SettingsView widget exists but there is no settings save/load mechanism connected to `tallow_store::config`. This is UI-only for now.
- **File browser integration** -- FileBrowser/FileSelector exist but the TUI send flow should accept files via CLI args, not a TUI file picker. The file picker is a future enhancement.
- **LAN discovery in TUI** -- The devices panel exists but Phase 13 covers LAN discovery. Show the panel but with empty/stub data.
- **Real-time bandwidth chart** -- BandwidthChart exists but collecting bandwidth history data structures is not worth the complexity in this phase. The SpeedIndicator is sufficient.

## TUI State Management Design

### Expanded App State

```rust
pub struct App {
    // -- Existing fields (keep) --
    pub mode: TuiMode,
    pub focused_panel: FocusedPanel,
    pub running: bool,
    pub status_message: String,
    pub connected: bool,
    pub relay_addr: Option<String>,
    pub room_code: Option<String>,
    pub bytes_sent: u64,
    pub bytes_received: u64,

    // -- Replace show_help with overlay stack --
    pub overlays: Vec<Overlay>,

    // -- Replace Vec<TransferInfo> with indexed map --
    pub transfers: HashMap<[u8; 16], ActiveTransfer>,
    pub transfer_order: Vec<[u8; 16]>,  // insertion order for display

    // -- Replace Vec<PeerInfo> with indexed map --
    pub peers: HashMap<String, PeerInfo>,  // key = address

    // -- New fields --
    pub identity_fingerprint: Option<String>,
    pub transfer_history: Vec<HistoryEntry>,  // loaded from tallow-store
    pub action_tx: mpsc::Sender<TuiAction>,   // for spawning background tasks

    // -- Animation state --
    pub spinner: Spinner,
    pub tick_count: u64,
}

pub struct ActiveTransfer {
    pub id: [u8; 16],
    pub filename: String,
    pub total_bytes: u64,
    pub bytes_done: u64,
    pub speed_bps: u64,
    pub direction: TransferDirection,
    pub status: TransferStatus,
    pub started_at: Instant,
}

pub enum TransferStatus {
    Preparing,
    WaitingForPeer,
    InProgress,
    Complete { elapsed: Duration },
    Failed { error: String },
}
```

### State Update Flow

1. **Key event** -> `app.handle_key(key)` -> mutates `App` directly (mode switch, overlay push/pop, panel focus)
2. **Tick event** -> `app.tick()` -> advance spinner, update elapsed times, refresh timestamps
3. **Action from channel** -> `app.apply_action(action)` -> update transfers map, connection status, peer list
4. **Render** -> `render(frame, &app)` -> read-only borrow of `App`, pure rendering

### Overlay Input Routing

```
Key event arrives
  -> Is overlay stack non-empty?
     YES -> topmost overlay handles key
            -> Consumed? Done.
            -> Not consumed? (Esc on help) Pop overlay.
     NO  -> Main key handler (mode switch, panel navigation, etc.)
```

## Performance Considerations

### Render Budget
- Target: 30fps (33ms per frame) for smooth UI
- ratatui uses diffing: only changed cells are written to the terminal
- Avoid allocating `Vec<Line>` or `String` in hot render paths; prefer `Span::raw()` with `&str`
- The current panels are lightweight (status, transfers, devices) -- well within budget

### Channel Sizing
- Use `mpsc::channel(256)` for the action channel
- Transfer progress updates should be rate-limited to 30/sec to avoid overwhelming the channel
- Pattern: in the transfer loop, only send a progress update if `last_update.elapsed() > Duration::from_millis(33)`

### Memory
- `ActiveTransfer` is ~200 bytes. Even 100 concurrent transfers = 20KB. Not a concern.
- `TransferHistory` entries loaded from disk should be capped (e.g., last 100 entries) to avoid unbounded memory use.
- Bandwidth history for sparklines should use a fixed-size ring buffer (e.g., 120 samples = last 2 minutes at 1 sample/sec).

### Terminal I/O
- crossterm writes only diffed cells to stdout. No performance concern for typical TUI sizes.
- On very wide terminals (300+ columns), layout calculations with percentage-based constraints remain O(1) per panel.

### Startup Time
- `tallow tui` should launch and show the dashboard within 100ms
- Identity loading from `tallow_store` is file I/O; do it synchronously before entering the event loop since it's fast (<5ms)
- Transfer history loading should also be synchronous at startup (small file)

### Tick Rate
- 100ms tick interval (10 ticks/sec) for spinner animation
- This generates ~10 redraws/sec in the worst case, which is well within terminal throughput
- Spinners at 250ms (current rate) look noticeably choppy; 100ms is the standard for braille spinners

### Large Terminal Handling
- The `Constraint::Percentage` layout system handles arbitrary terminal sizes
- Add a minimum size check (e.g., 60x16) on startup; if smaller, print a warning to stderr and exit
- The `Layout::split()` call should never panic on zero-width areas; add guards in panel render functions (most already have `if area.height == 0 || area.width == 0 { return; }`)

### Sources

- [Async Event Stream (Ratatui)](https://ratatui.rs/tutorials/counter-async-app/async-event-stream/)
- [Full Async Actions (Ratatui)](https://ratatui.rs/tutorials/counter-async-app/full-async-actions/)
- [Ratatui Async Template](https://github.com/ratatui/async-template)
- [Component Architecture (Ratatui)](https://ratatui.rs/concepts/application-patterns/component-architecture/)
- [Popup Example (Ratatui)](https://ratatui.rs/examples/apps/popup/)
- [Clear Widget (Ratatui)](https://docs.rs/ratatui/latest/ratatui/widgets/struct.Clear.html)
- [tui-popup crate](https://github.com/joshka/tui-popup)
- [Setup Panic Hooks (Ratatui)](https://ratatui.rs/recipes/apps/panic-hooks/)
- [Testing with insta Snapshots (Ratatui)](https://ratatui.rs/recipes/testing/snapshots/)
- [TestBackend (Ratatui)](https://docs.rs/ratatui/latest/ratatui/backend/struct.TestBackend.html)
- [Ratatui Templates](https://github.com/ratatui/templates)
- [Ratatui FAQ](https://ratatui.rs/faq/)
