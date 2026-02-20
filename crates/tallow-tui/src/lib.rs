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

use app::App;
use crossterm::event::KeyCode;
use event::{Event, EventHandler};
use std::io;

/// TUI application
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

    /// Run the TUI application
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

    /// Handle key events
    fn handle_key(&mut self, key: event::KeyEvent) {
        // Help overlay captures all input except ? and Esc
        if self.app.show_help {
            match key.code {
                KeyCode::Char('?') | KeyCode::Esc => self.app.toggle_help(),
                _ => {}
            }
            return;
        }

        match key.code {
            // Quit
            KeyCode::Char('q') => self.app.quit(),
            KeyCode::Char('c')
                if key
                    .modifiers
                    .contains(crossterm::event::KeyModifiers::CONTROL) =>
            {
                self.app.quit()
            }

            // Help
            KeyCode::Char('?') => self.app.toggle_help(),

            // Panel navigation
            KeyCode::Tab => self.app.next_panel(),

            // Mode switching
            KeyCode::Char('1') => self.app.mode = modes::TuiMode::Dashboard,
            KeyCode::Char('2') => self.app.mode = modes::TuiMode::Minimal,
            KeyCode::Char('3') => self.app.mode = modes::TuiMode::Zen,
            KeyCode::Char('4') => self.app.mode = modes::TuiMode::Monitor,

            // Refresh (placeholder — would re-fetch state)
            KeyCode::Char('r') => {
                self.app.status_message = "Refreshed".to_string();
            }

            _ => {}
        }
    }
}

// Note: TuiApp does not implement Default because terminal initialization
// is fallible. Use TuiApp::new() which returns Result.
