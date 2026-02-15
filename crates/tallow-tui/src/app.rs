//! Application state

use crate::modes::TuiMode;

/// Panel focus
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FocusedPanel {
    /// Status panel
    Status,
    /// Transfers panel
    Transfers,
    /// Devices panel
    Devices,
}

/// Application state
#[derive(Debug)]
pub struct App {
    /// Current mode
    pub mode: TuiMode,
    /// Focused panel
    pub focused_panel: FocusedPanel,
    /// Running flag
    pub running: bool,
}

impl App {
    /// Create a new application state
    pub fn new() -> Self {
        Self {
            mode: TuiMode::Dashboard,
            focused_panel: FocusedPanel::Transfers,
            running: true,
        }
    }

    /// Quit the application
    pub fn quit(&mut self) {
        self.running = false;
    }
}

impl Default for App {
    fn default() -> Self {
        Self::new()
    }
}
