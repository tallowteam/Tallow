//! Terminal UI for Tallow

#![forbid(unsafe_code)]

pub mod app;
pub mod event;
pub mod modes;
pub mod overlays;
pub mod panels;
pub mod render;
pub mod security;
pub mod theme;
pub mod widgets;

use app::{App, Overlay, TuiAction};
use crossterm::event::{KeyCode, KeyModifiers};
use event::{Event, EventHandler};
use futures::StreamExt;
use modes::TuiMode;
use std::io;
use std::time::Duration;

/// TUI application (synchronous, legacy)
pub struct TuiApp {
    app: App,
    events: EventHandler,
}

impl TuiApp {
    /// Create a new TUI app
    pub fn new() -> io::Result<Self> {
        Ok(Self {
            app: App::new(),
            events: EventHandler::new(),
        })
    }

    /// Run the TUI application (synchronous)
    pub fn run(&mut self) -> io::Result<()> {
        // Install panic handler for secure cleanup
        security::install_panic_handler();

        // Set up terminal
        crossterm::terminal::enable_raw_mode()?;
        let mut stdout = io::stdout();
        crossterm::execute!(
            stdout,
            crossterm::terminal::EnterAlternateScreen,
            crossterm::cursor::Hide
        )?;

        let backend = ratatui::backend::CrosstermBackend::new(stdout);
        let mut terminal = ratatui::Terminal::new(backend)?;

        // Main loop
        while self.app.running {
            // Draw
            terminal.draw(|frame| {
                render::render(frame, &self.app);
            })?;

            // Handle events
            match self.events.next()? {
                Event::Key(key) => self.handle_key(key),
                Event::Resize(_, _) => {} // Terminal redraws automatically
                Event::Mouse => {}
                Event::Tick => {} // Periodic refresh — could poll transfer state here
            }
        }

        // Restore terminal
        security::restore_terminal();

        // Wipe screen for security
        security::wipe_screen();

        Ok(())
    }

    /// Handle key events (legacy synchronous path)
    fn handle_key(&mut self, key: event::KeyEvent) {
        let crossterm_key = crossterm::event::KeyEvent::new(key.code, key.modifiers);
        handle_key_event(&mut self.app, crossterm_key);
    }
}

// Note: TuiApp does not implement Default because terminal initialization
// is fallible. Use TuiApp::new() which returns Result.

/// Guard that restores the terminal on drop.
///
/// Three cleanup paths are covered:
/// 1. Normal exit: loop breaks, guard drops, terminal restored.
/// 2. Error return: `?` propagation causes guard to drop, terminal restored.
/// 3. Panic: panic hook fires and restores terminal, then guard drops.
///    Double-restore is safe because `disable_raw_mode()` is idempotent.
struct TerminalGuard;

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        security::restore_terminal();
        security::wipe_screen();
    }
}

/// Run the TUI with an async event loop.
///
/// This is the primary entry point for the TUI, using `tokio::select!` to
/// handle terminal events, tick timers, and background task actions concurrently.
///
/// # Arguments
/// * `identity_fingerprint` - Optional identity fingerprint from the store
/// * `initial_mode` - Which TUI mode to start in
pub async fn run_async(
    identity_fingerprint: Option<String>,
    initial_mode: TuiMode,
) -> io::Result<()> {
    // Check terminal availability
    if !io::IsTerminal::is_terminal(&io::stdin()) {
        return Err(io::Error::other(
            "TUI requires an interactive terminal (stdin is not a TTY)",
        ));
    }

    // Check terminal size
    let (cols, rows) = crossterm::terminal::size()?;
    if cols < 60 || rows < 16 {
        return Err(io::Error::other(
            format!(
                "Terminal too small ({}x{}, need 60x16 minimum). Resize and try again.",
                cols, rows
            ),
        ));
    }

    // Install panic handler for secure cleanup
    security::install_panic_handler();

    // Set up terminal
    crossterm::terminal::enable_raw_mode()?;
    let mut stdout = io::stdout();
    crossterm::execute!(
        stdout,
        crossterm::terminal::EnterAlternateScreen,
        crossterm::cursor::Hide
    )?;

    let backend = ratatui::backend::CrosstermBackend::new(stdout);
    let mut terminal = ratatui::Terminal::new(backend)?;

    // Install terminal guard for cleanup on all exit paths
    let _guard = TerminalGuard;

    // Create app state
    let mut app = App::new();
    app.identity_fingerprint = identity_fingerprint;
    app.mode = initial_mode;

    // Create async event stream
    let mut event_stream = crossterm::event::EventStream::new();

    // Create action channel for background tasks
    let (_action_tx, mut action_rx) = tokio::sync::mpsc::channel::<TuiAction>(256);

    // Create tick timer (100ms = ~10 fps for spinner animation)
    let mut tick_interval = tokio::time::interval(Duration::from_millis(100));

    // Main async loop
    loop {
        terminal.draw(|frame| {
            render::render(frame, &app);
        })?;

        tokio::select! {
            maybe_event = event_stream.next() => {
                match maybe_event {
                    Some(Ok(event)) => {
                        handle_event(&mut app, event);
                    }
                    Some(Err(_)) => {
                        // Event read error, exit gracefully
                        break;
                    }
                    None => {
                        // Stream ended
                        break;
                    }
                }
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

    // Guard's Drop handles terminal restoration and screen wipe
    Ok(())
}

/// Handle a crossterm event (dispatches to key handler)
fn handle_event(app: &mut App, event: crossterm::event::Event) {
    match event {
        crossterm::event::Event::Key(key) => {
            // On Windows, crossterm fires Release events as well as Press events.
            // Only respond to Press (and Repeat) to avoid double-handling.
            if key.kind == crossterm::event::KeyEventKind::Release {
                return;
            }
            handle_key_event(app, key);
        }
        crossterm::event::Event::Resize(_, _) => {
            // Terminal will redraw on next loop iteration
        }
        _ => {}
    }
}

/// Handle a key event, routing through overlay stack first
fn handle_key_event(app: &mut App, key: crossterm::event::KeyEvent) {
    // If overlays are active, route to topmost overlay
    if let Some(overlay) = app.top_overlay().cloned() {
        match key.code {
            KeyCode::Esc => {
                app.pop_overlay();
            }
            KeyCode::Char('?') if overlay == Overlay::Help => {
                app.pop_overlay();
            }
            KeyCode::Char('y') if matches!(overlay, Overlay::TransferConfirm { .. }) => {
                // Accept transfer (future: send action via channel)
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
        KeyCode::Char('r') => {
            app.status_message = "Refreshed".to_string();
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_key(code: KeyCode) -> crossterm::event::KeyEvent {
        crossterm::event::KeyEvent::new(code, KeyModifiers::NONE)
    }

    fn make_key_ctrl(code: KeyCode) -> crossterm::event::KeyEvent {
        crossterm::event::KeyEvent::new(code, KeyModifiers::CONTROL)
    }

    #[test]
    fn test_quit_on_q() {
        let mut app = App::new();
        handle_key_event(&mut app, make_key(KeyCode::Char('q')));
        assert!(!app.running);
    }

    #[test]
    fn test_quit_on_ctrl_c() {
        let mut app = App::new();
        handle_key_event(&mut app, make_key_ctrl(KeyCode::Char('c')));
        assert!(!app.running);
    }

    #[test]
    fn test_help_toggle() {
        let mut app = App::new();

        handle_key_event(&mut app, make_key(KeyCode::Char('?')));
        assert_eq!(app.overlays.len(), 1);
        assert_eq!(app.overlays[0], Overlay::Help);

        // While overlay is active, pressing Esc pops it
        handle_key_event(&mut app, make_key(KeyCode::Esc));
        assert!(app.overlays.is_empty());
    }

    #[test]
    fn test_help_dismiss_with_question_mark() {
        let mut app = App::new();
        handle_key_event(&mut app, make_key(KeyCode::Char('?')));
        assert_eq!(app.overlays.len(), 1);

        // Pressing ? again dismisses Help overlay
        handle_key_event(&mut app, make_key(KeyCode::Char('?')));
        assert!(app.overlays.is_empty());
    }

    #[test]
    fn test_identity_overlay_on_i() {
        let mut app = App::new();
        handle_key_event(&mut app, make_key(KeyCode::Char('i')));
        assert_eq!(app.overlays.len(), 1);
        assert_eq!(app.overlays[0], Overlay::IdentityDetail);
    }

    #[test]
    fn test_overlay_captures_input() {
        let mut app = App::new();

        // Push Help overlay
        app.push_overlay(Overlay::Help);

        // Press q while overlay is active -- should NOT quit
        handle_key_event(&mut app, make_key(KeyCode::Char('q')));
        assert!(app.running);

        // Dismiss overlay
        handle_key_event(&mut app, make_key(KeyCode::Esc));
        assert!(app.overlays.is_empty());

        // Now q should quit
        handle_key_event(&mut app, make_key(KeyCode::Char('q')));
        assert!(!app.running);
    }

    #[test]
    fn test_overlay_stack_esc_pops_topmost() {
        let mut app = App::new();
        app.push_overlay(Overlay::Help);
        app.push_overlay(Overlay::IdentityDetail);
        assert_eq!(app.overlays.len(), 2);

        // Esc pops IdentityDetail only
        handle_key_event(&mut app, make_key(KeyCode::Esc));
        assert_eq!(app.overlays.len(), 1);
        assert_eq!(app.overlays[0], Overlay::Help);

        // Esc pops Help
        handle_key_event(&mut app, make_key(KeyCode::Esc));
        assert!(app.overlays.is_empty());
    }

    #[test]
    fn test_mode_switching() {
        let mut app = App::new();

        handle_key_event(&mut app, make_key(KeyCode::Char('2')));
        assert_eq!(app.mode, TuiMode::Minimal);

        handle_key_event(&mut app, make_key(KeyCode::Char('3')));
        assert_eq!(app.mode, TuiMode::Zen);

        handle_key_event(&mut app, make_key(KeyCode::Char('4')));
        assert_eq!(app.mode, TuiMode::Monitor);

        handle_key_event(&mut app, make_key(KeyCode::Char('1')));
        assert_eq!(app.mode, TuiMode::Dashboard);
    }

    #[test]
    fn test_tab_cycles_panels() {
        let mut app = App::new();
        assert_eq!(app.focused_panel, app::FocusedPanel::Transfers);

        handle_key_event(&mut app, make_key(KeyCode::Tab));
        assert_eq!(app.focused_panel, app::FocusedPanel::Devices);

        handle_key_event(&mut app, make_key(KeyCode::Tab));
        assert_eq!(app.focused_panel, app::FocusedPanel::Status);

        handle_key_event(&mut app, make_key(KeyCode::Tab));
        assert_eq!(app.focused_panel, app::FocusedPanel::Transfers);
    }
}
