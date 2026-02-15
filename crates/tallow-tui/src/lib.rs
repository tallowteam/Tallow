//! Terminal UI for Tallow

pub mod app;
pub mod event;
pub mod render;
pub mod theme;
pub mod panels;
pub mod overlays;
pub mod security;
pub mod modes;

use app::App;
use event::EventHandler;
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
        todo!("Implement TUI main loop")
    }
}

impl Default for TuiApp {
    fn default() -> Self {
        Self::new().unwrap()
    }
}
